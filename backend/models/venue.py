from sqlalchemy import Column, Integer, String, Float
from backend.database.session import Base

class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    city = Column(String(100), nullable=True)
    matches_hosted = Column(Integer, default=0)
    avg_first_innings_score = Column(Float, default=0.0)
    avg_second_innings_score = Column(Float, default=0.0)
    highest_score = Column(Integer, default=0)
    lowest_score = Column(Integer, default=0)
    bat_first_win_pct = Column(Float, default=0.0)
    chase_win_pct = Column(Float, default=0.0)
