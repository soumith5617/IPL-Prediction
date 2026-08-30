from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    dob: Optional[str]
    batting_hand: Optional[str]
    bowling_skill: Optional[str]
    country: Optional[str]
    matches: int
    innings_batted: int
    total_runs: int
    highest_score: int
    batting_average: float
    strike_rate: float
    fifties: int
    hundreds: int
    fours: int
    sixes: int
    innings_bowled: int
    balls_bowled: int
    wickets: int
    bowling_average: float
    economy: float
    four_wickets: int

class PlayerRadarMetric(BaseModel):
    metric: str
    value: float
    fullMark: float

class PlayerDetailOut(BaseModel):
    player: PlayerOut
    radar_chart: List[PlayerRadarMetric]
    career_summary: str
