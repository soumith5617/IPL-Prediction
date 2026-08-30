from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.prediction import (
    ScorePredictionRequest,
    ScorePredictionResponse,
    WinPredictionRequest,
    WinPredictionResponse,
    MatchPredictionRequest,
    MatchPredictionResponse
)
from backend.services.prediction_service import BackendPredictionService
from backend.utils.logger import logger

router = APIRouter(prefix="/predict", tags=["Predictions"])

@router.post("/score", response_model=ScorePredictionResponse)
def predict_score_endpoint(
    payload: ScorePredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Predicts 1st innings total score using the trained regression ML pipeline.
    Accepts current runs, wickets, overs, and rolling last 5 overs stats.
    """
    if payload.batting_team.strip().lower() == payload.bowling_team.strip().lower():
        raise HTTPException(
            status_code=422,
            detail="Batting team and bowling team must be different franchises."
        )

    try:
        data = payload.model_dump()
        return BackendPredictionService.predict_first_innings_score(data, db)
    except Exception as e:
        logger.error(f"Error in /predict/score: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/win", response_model=WinPredictionResponse)
@router.post("/win-probability", response_model=WinPredictionResponse)
def predict_win_endpoint(
    payload: WinPredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Predicts 2nd innings chase win probability using the trained classification ML pipeline.
    Calculates target pressure, remaining balls, and required run rates.
    """
    if payload.batting_team.strip().lower() == payload.bowling_team.strip().lower():
        raise HTTPException(
            status_code=422,
            detail="Chasing team and defending team must be different franchises."
        )

    try:
        data = payload.model_dump()
        return BackendPredictionService.predict_win_probability(data, db)
    except Exception as e:
        logger.error(f"Error in /predict/win: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/match", response_model=MatchPredictionResponse)
def predict_match_endpoint(
    payload: MatchPredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Pre-game full match projection combining 1st innings score forecast, 
    win probabilities, and franchise head-to-head records.
    """
    if payload.team1.strip().lower() == payload.team2.strip().lower():
        raise HTTPException(
            status_code=422,
            detail="Team 1 and Team 2 must be different franchises."
        )

    try:
        data = payload.model_dump()
        return BackendPredictionService.predict_full_match(data, db)
    except Exception as e:
        logger.error(f"Error in /predict/match: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
