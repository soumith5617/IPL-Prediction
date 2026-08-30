"""
Model & Dataset Metadata API Endpoints.
Provides single authoritative source of truth for ML models, metrics, and dataset statistics.
"""

from fastapi import APIRouter
from backend.ml.model_registry import model_registry
from backend.app.services.ml_engine import ml_engine

router = APIRouter(prefix="/model", tags=["Model & Dataset Registry"])

@router.get("/info")
def get_model_info():
    """Returns authoritative production model architecture and dataset parameters."""
    return model_registry.get_all_info()

@router.get("/dataset-info")
def get_dataset_info():
    """Returns authentic dataset metrics, seasons, deliveries, and players."""
    return model_registry.get_dataset_info()

@router.get("/metrics")
def get_model_metrics():
    """Returns verified evaluation metrics and feature importances."""
    return {
        "score_model": model_registry.get_score_metadata(),
        "win_model": model_registry.get_win_metadata(),
        "feature_importances": ml_engine.get_feature_importances()
    }
