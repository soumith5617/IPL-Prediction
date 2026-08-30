from sqlalchemy import Column, Integer, String, Float, Date
from backend.app.database import Base

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    dob = Column(String(50), nullable=True)
    batting_hand = Column(String(50), nullable=True)
    bowling_skill = Column(String(100), nullable=True)
    country = Column(String(80), nullable=True)
    
    # Aggregated authentic IPL performance stats
    matches = Column(Integer, default=0)
    innings_batted = Column(Integer, default=0)
    total_runs = Column(Integer, default=0)
    highest_score = Column(Integer, default=0)
    batting_average = Column(Float, default=0.0)
    strike_rate = Column(Float, default=0.0)
    fifties = Column(Integer, default=0)
    hundreds = Column(Integer, default=0)
    fours = Column(Integer, default=0)
    sixes = Column(Integer, default=0)
    
    innings_bowled = Column(Integer, default=0)
    balls_bowled = Column(Integer, default=0)
    runs_conceded = Column(Integer, default=0)
    wickets = Column(Integer, default=0)
    bowling_average = Column(Float, default=0.0)
    economy = Column(Float, default=0.0)
    four_wickets = Column(Integer, default=0)
