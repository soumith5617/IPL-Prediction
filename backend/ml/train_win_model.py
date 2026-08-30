"""
IPL Match Win Probability Model Training Pipeline.
Trains classification models using Scikit-Learn Pipeline & ColumnTransformer.
Evaluates Logistic Regression, Random Forest, and Gradient Boosting.
Exports the calibrated classifier pipeline and evaluation metrics.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, log_loss, roc_auc_score, brier_score_loss
import joblib

from backend.app.utils.aliases import normalize_team_name, CANONICAL_TEAMS

def load_and_preprocess_win_data(matches_path="data/matches.csv", deliveries_path="data/deliveries.csv"):
    print("Loading datasets for Win Probability Model...")
    matches = pd.read_csv(matches_path)
    deliveries = pd.read_csv(deliveries_path)

    # Filter matches with a decisive winner
    valid_matches = matches[matches['winner'].notnull() & (matches['result'] != 'no result')].copy()
    valid_matches['team1'] = valid_matches['team1'].apply(normalize_team_name)
    valid_matches['team2'] = valid_matches['team2'].apply(normalize_team_name)
    valid_matches['winner'] = valid_matches['winner'].apply(normalize_team_name)

    # Canonical teams filter
    valid_matches = valid_matches[
        valid_matches['team1'].isin(CANONICAL_TEAMS) &
        valid_matches['team2'].isin(CANONICAL_TEAMS) &
        valid_matches['winner'].isin(CANONICAL_TEAMS)
    ]
    
    # Calculate 1st innings total per match to get target
    first_inn = deliveries[deliveries['inning'] == 1].groupby('match_id')['total_runs'].sum().reset_index()
    first_inn['target_score'] = first_inn['total_runs'] + 1
    first_inn = first_inn.drop(columns=['total_runs'])

    # Merge target into valid matches
    match_df = valid_matches.merge(first_inn, left_on='id', right_on='match_id', how='inner')

    # Merge match info into deliveries (2nd innings only)
    second_inn = deliveries[deliveries['inning'] == 2].copy()
    second_inn = second_inn.merge(match_df[['id', 'city', 'venue', 'winner', 'target_score']], left_on='match_id', right_on='id', how='inner')

    # Normalize teams
    second_inn['batting_team'] = second_inn['batting_team'].apply(normalize_team_name)
    second_inn['bowling_team'] = second_inn['bowling_team'].apply(normalize_team_name)

    second_inn = second_inn[
        second_inn['batting_team'].isin(CANONICAL_TEAMS) &
        second_inn['bowling_team'].isin(CANONICAL_TEAMS)
    ].sort_values(['match_id', 'over', 'ball']).reset_index(drop=True)

    # Cumulative stats
    second_inn['is_wicket'] = second_inn['player_dismissed'].notnull().astype(int)
    second_inn['current_score'] = second_inn.groupby('match_id')['total_runs'].cumsum()
    second_inn['wickets_lost'] = second_inn.groupby('match_id')['is_wicket'].cumsum()
    second_inn['balls_bowled'] = (second_inn['over'] - 1) * 6 + second_inn['ball']
    
    second_inn['runs_needed'] = second_inn['target_score'] - second_inn['current_score']
    second_inn['balls_remaining'] = 120 - second_inn['balls_bowled']
    second_inn['wickets_left'] = 10 - second_inn['wickets_lost']

    # Filter boundary conditions (valid chase states)
    chase_df = second_inn[
        (second_inn['balls_remaining'] >= 0) &
        (second_inn['balls_bowled'] >= 6) & # after 1st over
        (second_inn['wickets_left'] >= 0)
    ].copy()

    # Calculate run rates
    chase_df['overs_completed'] = chase_df['balls_bowled'] / 6.0
    chase_df['crr'] = chase_df['current_score'] / chase_df['overs_completed']
    
    # Safe RRR
    chase_df['rrr'] = np.where(
        chase_df['balls_remaining'] > 0,
        (chase_df['runs_needed'] * 6.0) / chase_df['balls_remaining'],
        chase_df['runs_needed']
    )
    # Clip extreme values
    chase_df['rrr'] = chase_df['rrr'].clip(lower=-10, upper=36)

    # Binary outcome: Did chasing batting team win?
    chase_df['is_winner'] = (chase_df['batting_team'] == chase_df['winner']).astype(int)
    
    chase_df['city'] = chase_df['city'].fillna(chase_df['venue']).fillna('Neutral')

    feature_cols = [
        'batting_team',
        'bowling_team',
        'city',
        'runs_needed',
        'balls_remaining',
        'wickets_left',
        'target_score',
        'crr',
        'rrr'
    ]

    X = chase_df[feature_cols]
    y = chase_df['is_winner']

    print(f"Processed Win Training Set: {len(X)} ball-by-ball chase states from {chase_df['match_id'].nunique()} matches.")
    return X, y

def train_and_evaluate_win_models():
    X, y = load_and_preprocess_win_data()

    cat_features = ['batting_team', 'bowling_team', 'city']
    num_features = ['runs_needed', 'balls_remaining', 'wickets_left', 'target_score', 'crr', 'rrr']

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features),
            ('num', StandardScaler(), num_features)
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    candidate_models = {
        "Logistic Regression": LogisticRegression(solver='liblinear', random_state=42),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        "Gradient Boosting Classifier": GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    }

    results = {}
    best_name = None
    best_pipeline = None
    best_loss = float('inf')

    print("\n--- Training and Evaluating Win Probability Classifiers ---")
    for name, model in candidate_models.items():
        pipe = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', model)])
        pipe.fit(X_train, y_train)

        probs = pipe.predict_proba(X_test)[:, 1]
        preds = pipe.predict(X_test)

        acc = float(accuracy_score(y_test, preds))
        loss = float(log_loss(y_test, probs))
        auc = float(roc_auc_score(y_test, probs))
        brier = float(brier_score_loss(y_test, probs))

        results[name] = {
            "Accuracy": round(acc * 100, 2),
            "Log_Loss": round(loss, 4),
            "ROC_AUC": round(auc, 4),
            "Brier_Score": round(brier, 4)
        }
        print(f"{name:30s} | Accuracy: {acc*100:5.2f}% | LogLoss: {loss:6.4f} | ROC-AUC: {auc:6.4f} | Brier: {brier:6.4f}")

        if loss < best_loss:
            best_loss = loss
            best_name = name
            best_pipeline = pipe

    print(f"\nBest Selected Classifier: {best_name} (LogLoss: {best_loss:.4f})")

    # Export model & metadata
    os.makedirs("backend/ml/saved_models", exist_ok=True)
    model_export_path = "backend/ml/saved_models/win_predictor.joblib"
    metrics_export_path = "backend/ml/saved_models/win_metrics.json"

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

    print(f"Saved win probability model to: {model_export_path}")
    print(f"Saved win probability metrics to: {metrics_export_path}")
    return metadata

if __name__ == "__main__":
    train_and_evaluate_win_models()
