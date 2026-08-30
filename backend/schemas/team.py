from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    short_name: str
    primary_color: str
    secondary_color: str
    badge_bg: Optional[str] = None
    text_color: Optional[str] = None
    titles: int
    home_ground: Optional[str] = None
    captain: Optional[str] = None
    matches_played: int
    matches_won: int
    win_percentage: float
    avg_score: float

class H2HMatchOut(BaseModel):
    season: int
    date: Optional[str]
    winner: Optional[str]
    win_margin: str
    venue: Optional[str]

class TeamComparisonOut(BaseModel):
    team1: TeamOut
    team2: TeamOut
    total_head_to_head_matches: int
    team1_wins: int
    team2_wins: int
    no_results: int
    team1_win_pct: float
    team2_win_pct: float
    recent_matches: List[H2HMatchOut]
    team1_highest_score: int
    team2_highest_score: int
    venue_breakdown: Dict[str, Dict[str, int]]
