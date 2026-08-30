from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models import PredictionLog

class HistoryService:
    @staticmethod
    def log_prediction(
        db: Session,
        prediction_type: str,
        batting_team: str,
        bowling_team: str,
        venue: str,
        input_state: Dict[str, Any],
        prediction_output: Dict[str, Any]
    ) -> PredictionLog:
        log_entry = PredictionLog(
            prediction_type=prediction_type,
            batting_team=batting_team,
            bowling_team=bowling_team,
            venue=venue,
            input_state=input_state,
            prediction_output=prediction_output
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @staticmethod
    def get_history(
        db: Session,
        prediction_type: Optional[str] = None,
        limit: int = 50
    ) -> List[PredictionLog]:
        query = db.query(PredictionLog)
        if prediction_type and prediction_type != "all":
            query = query.filter(PredictionLog.prediction_type == prediction_type)
        return query.order_by(desc(PredictionLog.created_at)).limit(limit).all()

    @staticmethod
    def clear_history(db: Session):
        db.query(PredictionLog).delete()
        db.commit()
