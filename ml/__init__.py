"""
Production Machine Learning Package for IPL Prediction System.
"""

from ml.data_loader import load_raw_ipl_datasets, load_matches_data, load_deliveries_data, load_players_data
from ml.preprocessing import normalize_team_name, CANONICAL_TEAMS, build_score_preprocessor, build_win_preprocessor
from ml.feature_engineering import create_score_features, create_win_features
from ml.evaluate import evaluate_regression, evaluate_classification
from ml.predict import predict_score, predict_win_probability, prediction_service

__all__ = [
    "load_raw_ipl_datasets",
    "load_matches_data",
    "load_deliveries_data",
    "load_players_data",
    "normalize_team_name",
    "CANONICAL_TEAMS",
    "build_score_preprocessor",
    "build_win_preprocessor",
    "create_score_features",
    "create_win_features",
    "evaluate_regression",
    "evaluate_classification",
    "predict_score",
    "predict_win_probability",
    "prediction_service"
]
