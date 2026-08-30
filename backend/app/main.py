import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base
from backend.app.routers import predict, teams, players, analytics, history
from backend.app.services.ml_engine import ml_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Ensure models are loaded
    ml_engine.load_models()
    yield

app = FastAPI(
    title="IPL Prediction & Sports Analytics API",
    description="Production-quality REST API for IPL match score forecasts, win probabilities, player scouting, and franchise analytics.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware allowing local React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api/v1 prefix
app.include_router(predict.router, prefix="/api/v1")
app.include_router(teams.router, prefix="/api/v1")
app.include_router(players.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")

@app.get("/api/v1/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "score_model_loaded": ml_engine.score_model is not None,
        "win_model_loaded": ml_engine.win_model is not None,
        "api_version": "1.0.0",
        "environment": os.environ.get("ENV", "development")
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to IPL Prediction System API. Visit /docs for Swagger interactive documentation."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
