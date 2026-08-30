from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field, model_validator

class ScorePredictionRequest(BaseModel):
    batting_team: str = Field(..., json_schema_extra={"example": "Chennai Super Kings"})
    bowling_team: str = Field(..., json_schema_extra={"example": "Mumbai Indians"})
    runs: int = Field(..., ge=0, le=350, json_schema_extra={"example": 85})
    wickets: int = Field(..., ge=0, le=10, json_schema_extra={"example": 2})
    overs: float = Field(..., ge=0.0, le=20.0, json_schema_extra={"example": 10.0})
    runs_last_5: Optional[int] = Field(None, ge=0, le=150, json_schema_extra={"example": 42})
    wickets_last_5: Optional[int] = Field(None, ge=0, le=10, json_schema_extra={"example": 1})
    city: Optional[str] = Field("Mumbai", json_schema_extra={"example": "Mumbai"})
    venue: Optional[str] = Field("Wankhede Stadium", json_schema_extra={"example": "Wankhede Stadium"})

    @model_validator(mode='before')
    @classmethod
    def check_aliases_and_rules(cls, values: Any) -> Any:
        if isinstance(values, dict):
            # Support 'current_score' as alias for 'runs'
            if 'runs' not in values and 'current_score' in values:
                values['runs'] = values['current_score']
            # Support 'wickets_lost' as alias for 'wickets'
            if 'wickets' not in values and 'wickets_lost' in values:
                values['wickets'] = values['wickets_lost']
            # Support 'overs_completed' as alias for 'overs'
            if 'overs' not in values and 'overs_completed' in values:
                values['overs'] = values['overs_completed']

            # Validate teams are not identical
            b_team = values.get('batting_team')
            bow_team = values.get('bowling_team')
            if b_team and bow_team and b_team.strip().lower() == bow_team.strip().lower():
                raise ValueError("Batting team and bowling team cannot be identical.")

            # Validate overs notation ball part (e.g. 10.5 is 5 balls, 10.6 is 6th ball = 11.0 overs)
            overs_val = values.get('overs')
            if overs_val is not None:
                if overs_val < 0 or overs_val > 20.0:
                    raise ValueError("Overs must be between 0.0 and 20.0.")
                ball_part = round((overs_val - int(overs_val)) * 10)
                if ball_part == 6:
                    values['overs'] = min(20.0, float(int(overs_val) + 1.0))
                elif ball_part > 6:
                    raise ValueError(f"Invalid cricket overs notation: {overs_val}. Ball count cannot exceed 6.")

            # Validate wickets_last_5 <= wickets
            wkts = values.get('wickets', 0)
            wkts_l5 = values.get('wickets_last_5')
            if wkts_l5 is not None and wkts is not None and wkts_l5 > wkts:
                raise ValueError("Wickets lost in last 5 overs cannot exceed total wickets lost.")

            # Default runs_last_5 if missing
            if values.get('runs_last_5') is None and values.get('runs') is not None:
                values['runs_last_5'] = min(int(values['runs']), 40)
            if values.get('wickets_last_5') is None and values.get('wickets') is not None:
                values['wickets_last_5'] = min(int(values['wickets']), 1)

        return values

class ScorePredictionResponse(BaseModel):
    prediction: Dict[str, Any]
    model_used: str
    timestamp: str
    input_summary: Dict[str, Any]
    confidence: str
    current_run_rate: float
    projected_run_rate: float

class WinPredictionRequest(BaseModel):
    batting_team: str = Field(..., json_schema_extra={"example": "Royal Challengers Bengaluru"})
    bowling_team: str = Field(..., json_schema_extra={"example": "Kolkata Knight Riders"})
    target_score: int = Field(..., ge=50, le=350, json_schema_extra={"example": 185})
    runs: int = Field(..., ge=0, le=350, json_schema_extra={"example": 110})
    wickets: int = Field(..., ge=0, le=10, json_schema_extra={"example": 3})
    overs: float = Field(..., ge=0.0, le=20.0, json_schema_extra={"example": 12.0})
    city: Optional[str] = Field("Kolkata", json_schema_extra={"example": "Kolkata"})
    venue: Optional[str] = Field("Eden Gardens", json_schema_extra={"example": "Eden Gardens"})

    @model_validator(mode='before')
    @classmethod
    def check_aliases_and_rules(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if 'runs' not in values and 'current_score' in values:
                values['runs'] = values['current_score']
            if 'wickets' not in values and 'wickets_lost' in values:
                values['wickets'] = values['wickets_lost']
            if 'overs' not in values and 'overs_completed' in values:
                values['overs'] = values['overs_completed']

            b_team = values.get('batting_team')
            bow_team = values.get('bowling_team')
            if b_team and bow_team and b_team.strip().lower() == bow_team.strip().lower():
                raise ValueError("Batting team and bowling team cannot be identical.")

            overs_val = values.get('overs')
            if overs_val is not None:
                if overs_val < 0 or overs_val > 20.0:
                    raise ValueError("Overs must be between 0.0 and 20.0.")
                ball_part = round((overs_val - int(overs_val)) * 10)
                if ball_part == 6:
                    values['overs'] = min(20.0, float(int(overs_val) + 1.0))
                elif ball_part > 6:
                    raise ValueError(f"Invalid cricket overs notation: {overs_val}. Ball count cannot exceed 6.")

        return values

class WinPredictionResponse(BaseModel):
    prediction: Dict[str, Any]
    model_used: str
    timestamp: str
    input_summary: Dict[str, Any]
    runs_needed: int
    balls_remaining: int
    current_run_rate: float
    required_run_rate: float

class MatchPredictionRequest(BaseModel):
    team1: str = Field(..., json_schema_extra={"example": "Chennai Super Kings"})
    team2: str = Field(..., json_schema_extra={"example": "Mumbai Indians"})
    venue: Optional[str] = Field("Wankhede Stadium", json_schema_extra={"example": "Wankhede Stadium"})
    city: Optional[str] = Field("Mumbai", json_schema_extra={"example": "Mumbai"})

    @model_validator(mode='before')
    @classmethod
    def check_teams(cls, values: Any) -> Any:
        if isinstance(values, dict):
            t1 = values.get('team1')
            t2 = values.get('team2')
            if t1 and t2 and t1.strip().lower() == t2.strip().lower():
                raise ValueError("Team 1 and Team 2 cannot be identical.")
        return values

class MatchPredictionResponse(BaseModel):
    matchup: str
    venue: str
    model_used: str
    timestamp: str
    projected_first_innings_score: Dict[str, Any]
    projected_win_probabilities: Dict[str, Any]
    head_to_head_summary: Dict[str, Any]

class PredictionLogOut(BaseModel):
    id: int
    prediction_type: str
    created_at: Optional[str]
    batting_team: str
    bowling_team: str
    venue: Optional[str]
    input_state: Dict[str, Any]
    prediction_output: Dict[str, Any]
