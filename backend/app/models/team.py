from sqlalchemy import Column, Integer, String, Float, JSON
from backend.app.database import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    short_name = Column(String(10), nullable=False)
    primary_color = Column(String(15), nullable=False)
    secondary_color = Column(String(15), nullable=False)
    badge_bg = Column(String(100), nullable=True)
    text_color = Column(String(50), nullable=True)
    titles = Column(Integer, default=0)
    home_ground = Column(String(200), nullable=True)
    captain = Column(String(100), nullable=True)
    matches_played = Column(Integer, default=0)
    matches_won = Column(Integer, default=0)
    win_percentage = Column(Float, default=0.0)
    avg_score = Column(Float, default=0.0)
