"""
Main FastAPI Application Entry Point.
Configures CORS, startup lifespan model loading, structured exception handlers, and routing.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.database.session import Base, engine
from backend.utils.logger import logger
from ml.predict import prediction_service
from backend.api.health import router as health_router
from backend.api.teams import router as teams_router
from backend.api.players import router as players_router
from backend.api.predict import router as predict_router
from backend.api.predictions import router as predictions_router
from backend.api.model_info import router as model_info_router

# Legacy routes support for frontend compatibility
from backend.app.routers.analytics import router as analytics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing IPL Prediction API...")
    # Initialize DB Tables
    Base.metadata.create_all(bind=engine)
    logger.info("SQLite database tables verified.")
    
    # Load ML pipelines
    prediction_service.load_models()
    logger.info(f"Loaded Score Model: {prediction_service.score_metadata.get('model_name', 'Active')}")
    logger.info(f"Loaded Win Model: {prediction_service.win_metadata.get('model_name', 'Active')}")
    yield
    logger.info("Shutting down IPL Prediction API...")

app = FastAPI(
    title="IPL Prediction & Sports Intelligence API",
    description="Production-quality REST API for IPL match score forecasts, live win probability calculation, player scouting, and franchise rivalry analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured Error Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err["loc"]])
        errors.append({
            "field": field,
            "message": err["msg"],
            "type": err["type"]
        })
    logger.warning(f"Validation error on {request.url.path}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "status_code": 422,
            "details": errors
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "status_code": 500,
            "message": str(exc)
        }
    )

# Include API Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(players_router, prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(model_info_router, prefix="/api")

# Also include /api/v1 alias prefix for full backward compatibility
app.include_router(health_router, prefix="/api/v1")
app.include_router(teams_router, prefix="/api/v1")
app.include_router(players_router, prefix="/api/v1")
app.include_router(predict_router, prefix="/api/v1")
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(model_info_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "name": "IPL Prediction & Sports Intelligence API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
