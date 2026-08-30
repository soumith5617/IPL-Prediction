from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ScorePredictionRequest(BaseModel):
    batting_team: str = Field(..., json_schema_extra={"example": "Chennai Super Kings"})
    bowling_team: str = Field(..., json_schema_extra={"example": "Mumbai Indians"})
    city: Optional[str] = Field("Mumbai", json_schema_extra={"example": "Mumbai"})
    current_score: int = Field(..., ge=0, le=350, json_schema_extra={"example": 85})
    wickets_lost: int = Field(..., ge=0, le=9, json_schema_extra={"example": 2})
    overs_completed: float = Field(..., ge=3.0, le=19.5, json_schema_extra={"example": 10.0})
    runs_last_5: Optional[int] = Field(None, ge=0, le=150, json_schema_extra={"example": 45})
    wickets_last_5: Optional[int] = Field(None, ge=0, le=5, json_schema_extra={"example": 1})

class TrajectoryPoint(BaseModel):
    over: float
    projected_score: int
    historical_avg_score: int

class ScorePredictionResponse(BaseModel):
    predicted_score: int
    score_range_low: int
    score_range_high: int
    current_run_rate: float
    projected_run_rate: float
    wickets_remaining: int
    confidence_interval: str
    trajectory: List[TrajectoryPoint]
    commentary: str
    model_version: str = "RandomForest-v1.0"

class WinProbabilityRequest(BaseModel):
    batting_team: str = Field(..., json_schema_extra={"example": "Royal Challengers Bengaluru"})
    bowling_team: str = Field(..., json_schema_extra={"example": "Kolkata Knight Riders"})
    city: Optional[str] = Field("Kolkata", json_schema_extra={"example": "Kolkata"})
    target_score: int = Field(..., ge=50, le=350, json_schema_extra={"example": 185})
    current_score: int = Field(..., ge=0, le=350, json_schema_extra={"example": 110})
    wickets_lost: int = Field(..., ge=0, le=9, json_schema_extra={"example": 3})
    overs_completed: float = Field(..., ge=1.0, le=19.5, json_schema_extra={"example": 12.0})

class WinProbabilityResponse(BaseModel):
    chasing_team: str
    defending_team: str
    chasing_team_win_prob: float
    defending_team_win_prob: float
    runs_needed: int
    balls_remaining: int
    wickets_remaining: int
    current_run_rate: float
    required_run_rate: float
    match_situation: str
    key_factors: List[str]
    model_version: str = "GradientBoosting-v1.0"
