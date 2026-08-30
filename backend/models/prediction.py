from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, JSON
from backend.database.session import Base

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    prediction_type = Column(String(50), nullable=False, index=True) # 'score', 'win', 'match'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    batting_team = Column(String(100), nullable=False)
    bowling_team = Column(String(100), nullable=False)
    venue = Column(String(150), nullable=True)
    input_state = Column(JSON, nullable=False)
    prediction_output = Column(JSON, nullable=False)
