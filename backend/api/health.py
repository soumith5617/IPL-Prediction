from fastapi import APIRouter
import os
from ml.predict import prediction_service

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health_status():
    """Returns the API health status and loaded model availability."""
    score_ready = prediction_service.score_model is not None
    win_ready = prediction_service.win_model is not None
    
    return {
        "status": "healthy" if (score_ready and win_ready) else "degraded",
        "score_model_loaded": score_ready,
        "win_model_loaded": win_ready,
        "models": {
            "score_model_loaded": score_ready,
            "win_model_loaded": win_ready,
            "score_model_name": prediction_service.score_metadata.get("model_name", "MLP Neural Net"),
            "win_model_name": prediction_service.win_metadata.get("model_name", "Gradient Boosting Classifier")
        },
        "api_version": "1.0.0",
        "environment": os.environ.get("ENV", "development")
    }
