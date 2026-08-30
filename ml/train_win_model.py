"""
Win Probability Model Training Pipeline.
Trains and compares Logistic Regression, Random Forest, and Gradient Boosting.
Selects the best performing calibrated classifier and exports it via Joblib.
"""

import os
import json
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import joblib

from ml.data_loader import load_raw_ipl_datasets
from ml.preprocessing import build_win_preprocessor
from ml.feature_engineering import create_win_features
from ml.evaluate import evaluate_classification

RANDOM_STATE = 42

def train_win_models(save_dir: str = "ml/models"):
    print("[*] Loading raw match & delivery datasets...")
    matches, deliveries = load_raw_ipl_datasets()

    print("[*] Engineering causal match-state features for chase win probability...")
    X, y = create_win_features(matches, deliveries)
    print(f"[*] Total dataset size: {len(X)} chase delivery observations.")

    # Stratified 80/20 train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )

    candidate_models = {
        "Logistic Regression": LogisticRegression(solver='liblinear', random_state=RANDOM_STATE),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=RANDOM_STATE, n_jobs=-1),
        "Gradient Boosting Classifier": GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=RANDOM_STATE)
    }

    results = {}
    best_name = None
    best_pipeline = None
    best_log_loss = float('inf')

    print("\n" + "="*85)
    print("   MODEL EVALUATION COMPARISON - MATCH WIN PROBABILITY CLASSIFIER")
    print("="*85)
    print(f"{'Model Architecture':30s} | {'Accuracy':>8s} | {'ROC-AUC':>7s} | {'Log Loss':>8s} | {'Brier':>7s}")
    print("-"*85)

    for name, model in candidate_models.items():
        preprocessor = build_win_preprocessor()
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])

        pipeline.fit(X_train, y_train)
        probs = pipeline.predict_proba(X_test)[:, 1]
        preds = pipeline.predict(X_test)

        metrics = evaluate_classification(y_test, preds, probs)
        results[name] = metrics

        print(f"{name:30s} | {metrics['Accuracy']:7.2f}% | {metrics['ROC_AUC']:7.4f} | {metrics['Log_Loss']:8.4f} | {metrics['Brier_Score']:7.4f}")

        if metrics['Log_Loss'] < best_log_loss:
            best_log_loss = metrics['Log_Loss']
            best_name = name
            best_pipeline = pipeline

    print("="*85)
    print(f"[+] Selected Best Model: {best_name} (Validation Log Loss: {best_log_loss:.4f})\n")

    # Export
    os.makedirs(save_dir, exist_ok=True)
    os.makedirs("backend/ml/saved_models", exist_ok=True)

    model_path = os.path.join(save_dir, "win_predictor.joblib")
    metrics_path = os.path.join(save_dir, "win_metrics.json")

    joblib.dump(best_pipeline, model_path)
    joblib.dump(best_pipeline, "backend/ml/saved_models/win_predictor.joblib")

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
    with open("backend/ml/saved_models/win_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[+] Saved model pipeline to: {model_path}")
    print(f"[+] Saved evaluation metrics to: {metrics_path}")
    return metadata

if __name__ == "__main__":
    train_win_models()
