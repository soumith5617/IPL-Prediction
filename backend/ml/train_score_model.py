"""
IPL First Innings Score Prediction Model Training Pipeline.
Trains regression models using Scikit-Learn Pipeline & ColumnTransformer.
Evaluates Decision Tree, Linear Regression, Ridge, Random Forest, and Gradient Boosting.
Exports the best performing model pipeline and evaluation metrics.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

from backend.app.utils.aliases import normalize_team_name, CANONICAL_TEAMS

def load_and_preprocess_score_data(matches_path="data/matches.csv", deliveries_path="data/deliveries.csv"):
    print("Loading raw match and delivery datasets...")
    matches = pd.read_csv(matches_path)
    deliveries = pd.read_csv(deliveries_path)

    # Filter normal matches with a winner or result
    valid_matches = matches[matches['result'] != 'no result'].copy()
    valid_match_ids = set(valid_matches['id'])
    
    # Merge venue/city into deliveries
    match_meta = valid_matches[['id', 'city', 'venue']].rename(columns={'id': 'match_id'})
    deliveries = deliveries[deliveries['match_id'].isin(valid_match_ids)].copy()
    deliveries = deliveries.merge(match_meta, on='match_id', how='left')

    # Normalize team names
    deliveries['batting_team'] = deliveries['batting_team'].apply(normalize_team_name)
    deliveries['bowling_team'] = deliveries['bowling_team'].apply(normalize_team_name)

    # Filter to canonical IPL franchises
    deliveries = deliveries[
        deliveries['batting_team'].isin(CANONICAL_TEAMS) &
        deliveries['bowling_team'].isin(CANONICAL_TEAMS)
    ].copy()

    # First innings only
    first_inn = deliveries[deliveries['inning'] == 1].copy()
    
    # Sort chronologically by match_id, over, ball
    first_inn = first_inn.sort_values(['match_id', 'over', 'ball']).reset_index(drop=True)

    # Calculate cumulative runs, wickets, and exact overs
    first_inn['is_wicket'] = first_inn['player_dismissed'].notnull().astype(int)
    first_inn['current_score'] = first_inn.groupby('match_id')['total_runs'].cumsum()
    first_inn['wickets_lost'] = first_inn.groupby('match_id')['is_wicket'].cumsum()
    
    # Accurate fractional overs: (over - 1) + ball / 6.0
    first_inn['overs_completed'] = (first_inn['over'] - 1) + (first_inn['ball'] / 6.0)

    # Total innings score per match
    total_scores = first_inn.groupby('match_id')['total_runs'].sum().reset_index().rename(columns={'total_runs': 'final_score'})
    first_inn = first_inn.merge(total_scores, on='match_id', how='left')

    # Vectorized rolling last 30 balls (5 overs) per match
    print("Computing rolling last 5 overs runs and wickets...")
    first_inn['runs_last_5'] = (
        first_inn.groupby('match_id')['total_runs']
        .rolling(window=30, min_periods=6)
        .sum()
        .reset_index(level=0, drop=True)
    )
    first_inn['runs_last_5'] = first_inn['runs_last_5'].fillna(first_inn['current_score'])

    first_inn['wickets_last_5'] = (
        first_inn.groupby('match_id')['is_wicket']
        .rolling(window=30, min_periods=6)
        .sum()
        .reset_index(level=0, drop=True)
    )
    first_inn['wickets_last_5'] = first_inn['wickets_last_5'].fillna(first_inn['wickets_lost'])

    # Filter out overs < 3.0 for stable projection
    df_train = first_inn[first_inn['overs_completed'] >= 3.0].copy()
    df_train['crr'] = df_train['current_score'] / df_train['overs_completed']
    
    # Fill missing cities with venue or 'Neutral'
    df_train['city'] = df_train['city'].fillna(df_train['venue']).fillna('Neutral')

    # Selected feature columns
    feature_cols = [
        'batting_team',
        'bowling_team',
        'city',
        'current_score',
        'wickets_lost',
        'overs_completed',
        'runs_last_5',
        'wickets_last_5',
        'crr'
    ]
    
    X = df_train[feature_cols]
    y = df_train['final_score']

    print(f"Processed Score Training Set: {len(X)} delivery states from {df_train['match_id'].nunique()} matches.")
    return X, y

def train_and_evaluate_score_models():
    X, y = load_and_preprocess_score_data()

    # Preprocessing pipeline
    cat_features = ['batting_team', 'bowling_team', 'city']
    num_features = ['current_score', 'wickets_lost', 'overs_completed', 'runs_last_5', 'wickets_last_5', 'crr']

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features),
            ('num', StandardScaler(), num_features)
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    candidate_models = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=1.0),
        "Decision Tree": DecisionTreeRegressor(max_depth=12, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=120, max_depth=6, random_state=42)
    }

    results = {}
    best_name = None
    best_pipeline = None
    best_rmse = float('inf')

    print("\n--- Training and Evaluating Score Prediction Models ---")
    for name, model in candidate_models.items():
        pipe = Pipeline(steps=[('preprocessor', preprocessor), ('regressor', model)])
        pipe.fit(X_train, y_train)

        preds = pipe.predict(X_test)
        mae = float(mean_absolute_error(y_test, preds))
        mse = float(mean_squared_error(y_test, preds))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test, preds))

        results[name] = {
            "MAE": round(mae, 2),
            "MSE": round(mse, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4)
        }
        print(f"{name:20s} | MAE: {mae:5.2f} | RMSE: {rmse:5.2f} | R2: {r2:6.4f}")

        if rmse < best_rmse:
            best_rmse = rmse
            best_name = name
            best_pipeline = pipe

    print(f"\nBest Selected Model: {best_name} (RMSE: {best_rmse:.2f})")

    # Export model & metadata
    os.makedirs("backend/ml/saved_models", exist_ok=True)
    model_export_path = "backend/ml/saved_models/score_predictor.joblib"
    metrics_export_path = "backend/ml/saved_models/score_metrics.json"

    joblib.dump(best_pipeline, model_export_path)
    
    metadata = {
        "model_name": best_name,
        "metrics": results,
        "best_metrics": results[best_name],
        "feature_columns": list(X.columns),
        "categorical_columns": cat_features,
        "numerical_columns": num_features,
        "total_samples": len(X)
    }

    with open(metrics_export_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved score model to: {model_export_path}")
    print(f"Saved score metrics to: {metrics_export_path}")
    return metadata

if __name__ == "__main__":
    train_and_evaluate_score_models()
