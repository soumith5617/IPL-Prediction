"""
Comprehensive Audit & Validation Test Suite.
Verifies all percentage formatting, model consistency, score prediction range bounds,
cricket overs decimal math, and dataset integrity checks.
"""

import pytest
import math
from fastapi.testclient import TestClient
from backend.main import app
from backend.ml.model_registry import model_registry
from backend.utils.cricket import (
    cricket_overs_to_balls,
    balls_to_decimal_overs,
    calculate_crr,
    calculate_rrr
)

client = TestClient(app)

# =============================================================================
# 1. PERCENTAGE FORMATTING MATHEMATICAL INTEGRITY
# =============================================================================

def format_percentage_py(val, decimals=1, fallback="N/A"):
    """Python counterpart of frontend formatPercentage utility."""
    if val is None or val == "":
        return fallback
    try:
        num = float(val)
        if math.isnan(num) or math.isinf(num):
            return fallback
        if 0 < num <= 1.0:
            num = num * 100.0
        return f"{round(num, decimals):.{decimals}f}%"
    except (ValueError, TypeError):
        return fallback

def test_percentage_formatting_values():
    assert format_percentage_py(0) == "0.0%"
    assert format_percentage_py(0.25) == "25.0%"
    assert format_percentage_py(0.5) == "50.0%"
    assert format_percentage_py(0.9691) == "96.9%"
    assert format_percentage_py(96.91) == "96.9%"
    assert format_percentage_py(1.0) == "100.0%"
    assert format_percentage_py(100.0) == "100.0%"

def test_percentage_formatting_nan_and_null_safety():
    assert format_percentage_py(float('nan')) == "N/A"
    assert format_percentage_py(float('inf')) == "N/A"
    assert format_percentage_py(float('-inf')) == "N/A"
    assert format_percentage_py(None) == "N/A"
    assert format_percentage_py("undefined") == "N/A"

# =============================================================================
# 2. CRICKET OVERS CONVERSION & CRR ACCURACY
# =============================================================================

def test_cricket_overs_decimal_conversions():
    # 0.0 ov -> 0 balls -> 0.0 decimal overs
    assert cricket_overs_to_balls(0.0) == 0
    assert balls_to_decimal_overs(0) == 0.0

    # 1.1 ov -> 7 balls -> 1 + 1/6 = 1.1667 decimal overs
    assert cricket_overs_to_balls(1.1) == 7
    assert round(balls_to_decimal_overs(7), 4) == round(1 + 1/6, 4)

    # 1.5 ov -> 11 balls -> 1 + 5/6 = 1.8333 decimal overs
    assert cricket_overs_to_balls(1.5) == 11
    assert round(balls_to_decimal_overs(11), 4) == round(1 + 5/6, 4)

    # 10.5 ov -> 65 balls -> 10 + 5/6 = 10.8333 decimal overs
    assert cricket_overs_to_balls(10.5) == 65
    assert round(balls_to_decimal_overs(65), 4) == round(10 + 5/6, 4)

    # 19.5 ov -> 119 balls -> 19 + 5/6 = 19.8333 decimal overs
    assert cricket_overs_to_balls(19.5) == 119
    assert round(balls_to_decimal_overs(119), 4) == round(19 + 5/6, 4)

    # 20.0 ov -> 120 balls -> 20.0 decimal overs
    assert cricket_overs_to_balls(20.0) == 120
    assert balls_to_decimal_overs(120) == 20.0

def test_cricket_run_rate_calculation():
    # 85 runs in 10.5 cricket overs (10.8333 decimal overs) => 85 / 10.8333 = 7.85 RPO
    crr = calculate_crr(85, 10.5)
    assert crr == 7.85
    # Confirm it is NOT 85 / 10.5 = 8.10
    assert crr != 8.10

# =============================================================================
# 3. MODEL METADATA & REGISTRY ENDPOINTS
# =============================================================================

def test_api_model_info_endpoint():
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    
    assert "score_model" in data
    assert "win_model" in data
    assert "dataset" in data
    
    score_m = data["score_model"]
    assert score_m["model_name"] == "MLP Neural Net"
    assert "MAE" in score_m["metrics"]
    assert score_m["metrics"]["MAE"] == 5.09
    assert score_m["metrics"]["R2"] == 0.9207

    win_m = data["win_model"]
    assert win_m["model_name"] == "Gradient Boosting Classifier"
    assert win_m["metrics"]["Accuracy"] == 96.91
    assert win_m["metrics"]["ROC_AUC"] == 0.9954

def test_api_dataset_info_endpoint():
    response = client.get("/api/model/dataset-info")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_matches"] == 577
    assert data["total_deliveries"] == 51255
    assert data["verified_players"] == 566
    assert data["canonical_teams"] == 10

# =============================================================================
# 4. SCORE PREDICTION VALIDATION & EXPECTED RANGE
# =============================================================================

def test_score_prediction_bounds_and_validity():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "runs": 85,
        "wickets": 2,
        "overs": 10.0,
        "runs_last_5": 42,
        "wickets_last_5": 1,
        "city": "Mumbai"
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    pred = data["prediction"]
    predicted_score = pred["predicted_score"]
    lower_bound = pred["lower_bound"]
    upper_bound = pred["upper_bound"]
    
    # 1. Predicted score must be >= current runs
    assert predicted_score >= payload["runs"]
    # 2. Lower bound must be <= predicted_score <= upper_bound
    assert lower_bound <= predicted_score <= upper_bound
    # 3. Model used must match authoritative metadata
    assert data["model_used"] == "MLP Neural Net"

# =============================================================================
# 5. WIN PROBABILITY SUM RULE & DETERMINISTIC CASES
# =============================================================================

def test_win_probability_sum_rule():
    payload = {
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Kolkata Knight Riders",
        "target_score": 185,
        "runs": 110,
        "wickets": 3,
        "overs": 12.0,
        "city": "Kolkata"
    }
    response = client.post("/api/predict/win", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    prob_chase = data["prediction"]["team_a_probability"]
    prob_defend = data["prediction"]["team_b_probability"]
    
    # Probabilities must sum to 1.0 within floating tolerance
    assert abs((prob_chase + prob_defend) - 1.0) < 0.001
    assert 0.0 <= prob_chase <= 1.0
    assert 0.0 <= prob_defend <= 1.0

def test_win_probability_target_achieved_deterministic():
    payload = {
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Kolkata Knight Riders",
        "target_score": 180,
        "runs": 182,
        "wickets": 4,
        "overs": 19.1,
        "city": "Kolkata"
    }
    response = client.post("/api/predict/win", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["prediction"]["team_a_probability"] == 1.0
    assert data["prediction"]["team_b_probability"] == 0.0
