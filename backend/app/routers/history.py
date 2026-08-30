from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.services.history_service import HistoryService

router = APIRouter(prefix="/history", tags=["Prediction History"])

@router.get("")
def get_prediction_history(
    prediction_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    logs = HistoryService.get_history(db, prediction_type=prediction_type, limit=limit)
    return [
        {
            "id": l.id,
            "prediction_type": l.prediction_type,
            "created_at": l.created_at.isoformat() if l.created_at else None,
            "batting_team": l.batting_team,
            "bowling_team": l.bowling_team,
            "venue": l.venue,
            "input_state": l.input_state,
            "prediction_output": l.prediction_output
        }
        for l in logs
    ]

@router.delete("/clear")
def clear_history(db: Session = Depends(get_db)):
    HistoryService.clear_history(db)
    return {"status": "success", "message": "Prediction history cleared."}
