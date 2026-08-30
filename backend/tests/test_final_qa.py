"""
Comprehensive Final QA Test Suite for IPL Prediction System.
Verifies all required valid/invalid overs, boundary conditions, edge cases, and end-to-end ML flows.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from ml.predict import prediction_service
from backend.utils.cricket import cricket_overs_to_balls, balls_to_decimal_overs

client = TestClient(app)

# ============================================================================
# 1. CRICKET NOTATION & OVERS CONVERSION UNIT TESTS
# ============================================================================

def test_cricket_overs_conversion_exact():
    # Test valid overs: 0, 1, 5, 10, 15, 19, 19.5, 20
    test_cases = [
        (0.0, 0, 0.0),
        (1.0, 6, 1.0),
        (5.0, 30, 5.0),
        (10.0, 60, 10.0),
        (10.5, 65, 10.8333),
        (15.0, 90, 15.0),
        (19.0, 114, 19.0),
        (19.5, 119, 19.8333),
        (20.0, 120, 20.0),
    ]
    for overs_not, expected_balls, expected_dec in test_cases:
        balls = cricket_overs_to_balls(overs_not)
        dec = balls_to_decimal_overs(balls)
        assert balls == expected_balls, f"Failed balls for {overs_not}"
        assert abs(dec - expected_dec) < 0.001, f"Failed decimal for {overs_not}"

# ============================================================================
# 2. VALID OVERS SCORE PREDICTION ENDPOINTS
# ============================================================================

@pytest.mark.parametrize("overs", [0.0, 1.0, 5.0, 10.0, 15.0, 19.0, 19.5, 20.0])
def test_valid_overs_score_prediction(overs):
    runs = int(overs * 8)
    wickets = min(9, int(overs / 2))
    runs_last_5 = min(runs, 40)
    wickets_last_5 = min(wickets, 1)

    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "city": "Chennai",
        "venue": "MA Chidambaram Stadium",
        "current_score": runs,
        "wickets_lost": wickets,
        "overs_completed": overs,
        "runs_last_5": runs_last_5,
        "wickets_last_5": wickets_last_5
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert data["prediction"]["predicted_score"] >= runs
    assert data["prediction"]["lower_bound"] <= data["prediction"]["predicted_score"]
    assert data["prediction"]["upper_bound"] >= data["prediction"]["predicted_score"]
    assert data["current_run_rate"] >= 0.0

# ============================================================================
# 3. INVALID INPUT & BOUNDARY VALIDATION
# ============================================================================

def test_invalid_overs_over_20():
    # 20.1 is invalid
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": 150,
        "wickets_lost": 3,
        "overs_completed": 20.1,
        "runs_last_5": 40,
        "wickets_last_5": 1
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code in [400, 422]

def test_invalid_negative_runs():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": -1,
        "wickets_lost": 2,
        "overs_completed": 10.0,
        "runs_last_5": 40,
        "wickets_last_5": 1
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code in [400, 422]

def test_invalid_negative_wickets():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": 80,
        "wickets_lost": -1,
        "overs_completed": 10.0,
        "runs_last_5": 40,
        "wickets_last_5": 1
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code in [400, 422]

def test_invalid_11_wickets():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": 80,
        "wickets_lost": 11,
        "overs_completed": 10.0,
        "runs_last_5": 40,
        "wickets_last_5": 1
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code in [400, 422]

def test_invalid_negative_overs():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": 80,
        "wickets_lost": 2,
        "overs_completed": -1.0,
        "runs_last_5": 40,
        "wickets_last_5": 1
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code in [400, 422]

def test_invalid_same_teams():
    payload = {
        "batting_team": "Mumbai Indians",
        "bowling_team": "Mumbai Indians",
        "current_score": 80,
        "wickets_lost": 2,
        "overs_completed": 10.0,
        "runs_last_5": 40,
        "wickets_last_5": 1
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code in [400, 422]

def test_invalid_wickets_last_5_exceeding_total():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": 80,
        "wickets_lost": 2,
        "overs_completed": 10.0,
        "runs_last_5": 40,
        "wickets_last_5": 4  # cannot exceed total wickets 2
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code in [400, 422]

# ============================================================================
# 4. MISSING PLAYER & NON-EXISTENT RESOURCE RESILIENCE
# ============================================================================

def test_missing_player_404():
    response = client.get("/api/players/999999")
    assert response.status_code == 404

def test_missing_prediction_record_404():
    response = client.get("/api/predictions/999999")
    assert response.status_code == 404

# ============================================================================
# 5. END-TO-END FLOW VERIFICATION
# ============================================================================

def test_end_to_end_prediction_flow():
    # 1. Check API Health
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

    # 2. Score Prediction
    score_payload = {
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Kolkata Knight Riders",
        "city": "Bengaluru",
        "venue": "M Chinnaswamy Stadium",
        "current_score": 142,
        "wickets_lost": 3,
        "overs_completed": 14.2,
        "runs_last_5": 52,
        "wickets_last_5": 1
    }
    score_res = client.post("/api/predict/score", json=score_payload)
    assert score_res.status_code == 200
    score_data = score_res.json()
    assert score_data["prediction"]["predicted_score"] >= 142

    # 3. Live Win Probability Prediction
    win_payload = {
        "batting_team": "Kolkata Knight Riders",
        "bowling_team": "Royal Challengers Bengaluru",
        "city": "Bengaluru",
        "venue": "M Chinnaswamy Stadium",
        "target_score": 195,
        "current_score": 120,
        "wickets_lost": 2,
        "overs_completed": 12.0
    }
    win_res = client.post("/api/predict/win", json=win_payload)
    assert win_res.status_code == 200
    win_data = win_res.json()
    assert win_data["runs_needed"] == 75
    assert win_data["balls_remaining"] == 48

    # 4. Full Match Forecast
    match_payload = {
        "team1": "Royal Challengers Bengaluru",
        "team2": "Kolkata Knight Riders",
        "city": "Bengaluru",
        "venue": "M Chinnaswamy Stadium"
    }
    match_res = client.post("/api/predict/match", json=match_payload)
    assert match_res.status_code == 200
    match_data = match_res.json()
    assert "projected_first_innings_score" in match_data

    # 5. Verify Persistence in Prediction Audit Logs
    hist_res = client.get("/api/predictions?limit=5")
    assert hist_res.status_code == 200
    logs = hist_res.json()
    assert len(logs) > 0
    latest = logs[0]
    assert "batting_team" in latest
    assert "input_state" in latest
    assert "prediction_output" in latest
