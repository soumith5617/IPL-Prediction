"""
Score Model Training Pipeline.
Trains and compares Linear Regression, Ridge, Decision Tree, Random Forest, Gradient Boosting, and MLP.
Selects the best performing model based on validation RMSE and exports it via Joblib.
"""

import os
import json
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
import joblib

from ml.data_loader import load_raw_ipl_datasets
from ml.preprocessing import build_score_preprocessor
from ml.feature_engineering import create_score_features
from ml.evaluate import evaluate_regression

RANDOM_STATE = 42

def train_score_models(save_dir: str = "ml/models"):
    print("[*] Loading raw match & delivery datasets...")
    matches, deliveries = load_raw_ipl_datasets()

    print("[*] Engineering causal match-state features for 1st innings score...")
    X, y = create_score_features(matches, deliveries)
    print(f"[*] Total dataset size: {len(X)} delivery observations.")

    # 80/20 train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE
    )

    candidate_models = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=1.0, random_state=RANDOM_STATE),
        "Decision Tree": DecisionTreeRegressor(max_depth=12, random_state=RANDOM_STATE),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=16, random_state=RANDOM_STATE, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=120, max_depth=6, random_state=RANDOM_STATE),
        "MLP Neural Net": MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=300, random_state=RANDOM_STATE, early_stopping=True)
    }

    results = {}
    best_name = None
    best_pipeline = None
    best_rmse = float('inf')

    print("\n" + "="*70)
    print("   MODEL EVALUATION COMPARISON - 1ST INNINGS SCORE REGRESSION")
    print("="*70)
    print(f"{'Model Architecture':24s} | {'MAE':>6s} | {'RMSE':>6s} | {'R2':>7s}")
    print("-"*70)

    for name, model in candidate_models.items():
        preprocessor = build_score_preprocessor()
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])

        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        metrics = evaluate_regression(y_test, preds)
        results[name] = metrics

        print(f"{name:24s} | {metrics['MAE']:6.2f} | {metrics['RMSE']:6.2f} | {metrics['R2']:7.4f}")

        if metrics['RMSE'] < best_rmse:
            best_rmse = metrics['RMSE']
            best_name = name
            best_pipeline = pipeline

    print("="*70)
    print(f"[+] Selected Best Model: {best_name} (Validation RMSE: {best_rmse:.2f})\n")

    # Export
    os.makedirs(save_dir, exist_ok=True)
    os.makedirs("backend/ml/saved_models", exist_ok=True)

    model_path = os.path.join(save_dir, "score_predictor.joblib")
    metrics_path = os.path.join(save_dir, "score_metrics.json")

    joblib.dump(best_pipeline, model_path)
    joblib.dump(best_pipeline, "backend/ml/saved_models/score_predictor.joblib")

    metadata = {
        "model_name": best_name,
        "metrics": results,
        "best_metrics": results[best_name],
        "feature_columns": list(X.columns),
        "total_samples": len(X),
        "random_state": RANDOM_STATE
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    with open("backend/ml/saved_models/score_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[+] Saved model pipeline to: {model_path}")
    print(f"[+] Saved evaluation metrics to: {metrics_path}")
    return metadata

if __name__ == "__main__":
    train_score_models()
