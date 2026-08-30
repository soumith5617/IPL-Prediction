from backend.api.health import router as health_router
from backend.api.teams import router as teams_router
from backend.api.players import router as players_router
from backend.api.predict import router as predict_router
from backend.api.predictions import router as predictions_router

__all__ = [
    "health_router",
    "teams_router",
    "players_router",
    "predict_router",
    "predictions_router"
]
