from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas.prediction import (
    ScorePredictionRequest,
    ScorePredictionResponse,
    WinProbabilityRequest,
    WinProbabilityResponse
)
from backend.app.services.ml_engine import ml_engine
from backend.app.services.history_service import HistoryService

router = APIRouter(prefix="/predict", tags=["Predictions"])

@router.post("/score", response_model=ScorePredictionResponse)
def predict_first_innings_score(payload: ScorePredictionRequest, db: Session = Depends(get_db)):
    try:
        result = ml_engine.predict_score(
            batting_team=payload.batting_team,
            bowling_team=payload.bowling_team,
            city=payload.city,
            current_score=payload.current_score,
            wickets_lost=payload.wickets_lost,
            overs_completed=payload.overs_completed,
            runs_last_5=payload.runs_last_5,
            wickets_last_5=payload.wickets_last_5
        )

        # Log prediction asynchronously to SQLite
        try:
            HistoryService.log_prediction(
                db=db,
                prediction_type="first_innings_score",
                batting_team=payload.batting_team,
                bowling_team=payload.bowling_team,
                venue=payload.city,
                input_state=payload.model_dump(),
                prediction_output=result
            )
        except Exception as log_err:
            print("Warning: failed to write prediction log:", log_err)

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/win-probability", response_model=WinProbabilityResponse)
def predict_match_win_probability(payload: WinProbabilityRequest, db: Session = Depends(get_db)):
    try:
        result = ml_engine.predict_win_probability(
            batting_team=payload.batting_team,
            bowling_team=payload.bowling_team,
            city=payload.city,
            target_score=payload.target_score,
            current_score=payload.current_score,
            wickets_lost=payload.wickets_lost,
            overs_completed=payload.overs_completed
        )

        try:
            HistoryService.log_prediction(
                db=db,
                prediction_type="win_probability",
                batting_team=payload.batting_team,
                bowling_team=payload.bowling_team,
                venue=payload.city,
                input_state=payload.model_dump(),
                prediction_output=result
            )
        except Exception as log_err:
            print("Warning: failed to write prediction log:", log_err)

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
