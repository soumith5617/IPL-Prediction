from sqlalchemy import Column, Integer, String, Float, Date
from backend.app.database import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    season = Column(Integer, nullable=False, index=True)
    city = Column(String(100), nullable=True)
    date = Column(String(50), nullable=True)
    team1 = Column(String(100), nullable=False, index=True)
    team2 = Column(String(100), nullable=False, index=True)
    toss_winner = Column(String(100), nullable=True)
    toss_decision = Column(String(20), nullable=True)
    result = Column(String(20), nullable=True)
    dl_applied = Column(Integer, default=0)
    winner = Column(String(100), nullable=True, index=True)
    win_by_runs = Column(Integer, default=0)
    win_by_wickets = Column(Integer, default=0)
    player_of_match = Column(String(120), nullable=True)
    venue = Column(String(150), nullable=True)
