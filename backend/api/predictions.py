from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.prediction import PredictionLogOut
from backend.services.prediction_service import BackendPredictionService

router = APIRouter(prefix="/predictions", tags=["Prediction History"])

@router.get("", response_model=List[PredictionLogOut])
def get_prediction_history(
    prediction_type: Optional[str] = Query(None, description="Filter by 'score', 'win', or 'match'"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Returns stored prediction logs with input payloads and ML results."""
    records = BackendPredictionService.get_predictions(
        db=db,
        prediction_type=prediction_type,
        limit=limit,
        skip=skip
    )
    return [
        PredictionLogOut(
            id=r.id,
            prediction_type=r.prediction_type,
            created_at=r.created_at.isoformat() if r.created_at else None,
            batting_team=r.batting_team,
            bowling_team=r.bowling_team,
            venue=r.venue,
            input_state=r.input_state,
            prediction_output=r.prediction_output
        )
        for r in records
    ]

@router.get("/{prediction_id}", response_model=PredictionLogOut)
def get_prediction_record(
    prediction_id: int,
    db: Session = Depends(get_db)
):
    """Returns single prediction log by ID."""
    record = BackendPredictionService.get_prediction_by_id(db, prediction_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Prediction record with ID {prediction_id} not found"
        )
    return PredictionLogOut(
        id=record.id,
        prediction_type=record.prediction_type,
        created_at=record.created_at.isoformat() if record.created_at else None,
        batting_team=record.batting_team,
        bowling_team=record.bowling_team,
        venue=record.venue,
        input_state=record.input_state,
        prediction_output=record.prediction_output
    )

@router.delete("/clear")
@router.delete("")
def clear_prediction_history(db: Session = Depends(get_db)):
    """Safely clears prediction history logs."""
    deleted_count = BackendPredictionService.clear_predictions(db)
    return {
        "status": "success",
        "message": f"Successfully cleared {deleted_count} prediction records."
    }
