"""
Comprehensive QA Edge Case Test Suite for IPL Prediction System.
Tests ML pipeline, API validation, cricket overs math, edge case boundaries,
and error handling.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.ml_engine import MLEngine
from backend.app.utils.aliases import normalize_team_name

client = TestClient(app)

# ============================================================================
# 1. CRICKET OVERS & RUN RATE CALCULATION TESTS
# ============================================================================

def test_cricket_overs_conversion_math():
    """Verify that 10.5 overs converts to 10 + 5/6 decimal overs (10.8333)."""
    def cricket_to_decimal(overs):
        full = int(overs)
        balls = round((overs - full) * 10)
        return full + (balls / 6.0)

    assert cricket_to_decimal(10.0) == 10.0
    assert abs(cricket_to_decimal(10.5) - (10 + 5/6)) < 1e-6
    assert abs(cricket_to_decimal(0.3) - 0.5) < 1e-6
    assert abs(cricket_to_decimal(19.5) - (19 + 5/6)) < 1e-6

def test_crr_calculation():
    """Verify that CRR is correctly calculated as runs / decimal overs."""
    runs = 85
    overs = 10.5
    full = int(overs)
    balls = round((overs - full) * 10)
    decimal_overs = full + (balls / 6.0)
    crr = round(runs / decimal_overs, 2)
    # 85 / 10.8333... = 7.846 -> 7.85
    assert crr == 7.85

# ============================================================================
# 2. MATCH PREDICTION OVERS & WICKETS EDGE CASES
# ============================================================================

@pytest.mark.parametrize("overs", [3.0, 5.0, 10.0, 15.0, 19.5])
def test_predict_score_valid_overs(overs):
    """Test score prediction across various valid overs."""
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "city": "Mumbai",
        "current_score": max(20, int(overs * 8)),
        "wickets_lost": 2,
        "overs_completed": overs,
        "runs_last_5": 35,
        "wickets_last_5": 1
    }
    res = client.post("/api/v1/predict/score", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_score"] >= payload["current_score"]
    assert data["score_range_low"] <= data["predicted_score"]
    assert data["score_range_high"] >= data["predicted_score"]

@pytest.mark.parametrize("wickets", [0, 1, 5, 9])
def test_predict_score_valid_wickets(wickets):
    """Test score prediction across various valid wickets."""
    payload = {
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Kolkata Knight Riders",
        "city": "Bengaluru",
        "current_score": 95,
        "wickets_lost": wickets,
        "overs_completed": 11.0,
        "runs_last_5": 40,
        "wickets_last_5": min(wickets, 1)
    }
    res = client.post("/api/v1/predict/score", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_score"] >= 95
    assert data["wickets_remaining"] == 10 - wickets

@pytest.mark.parametrize("wickets", [0, 1, 5, 9])
def test_win_probability_valid_wickets(wickets):
    """Test live win probability across various wickets."""
    payload = {
        "batting_team": "Gujarat Titans",
        "bowling_team": "Rajasthan Royals",
        "city": "Ahmedabad",
        "target_score": 175,
        "current_score": 100,
        "wickets_lost": wickets,
        "overs_completed": 12.0
    }
    res = client.post("/api/v1/predict/win-probability", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert 0.0 <= data["chasing_team_win_prob"] <= 100.0
    assert 0.0 <= data["defending_team_win_prob"] <= 100.0
    assert round(data["chasing_team_win_prob"] + data["defending_team_win_prob"]) == 100

def test_win_probability_target_achieved():
    """Deterministic edge case: current score already meets target score."""
    engine = MLEngine()
    result = engine.predict_win_probability(
        batting_team="Chennai Super Kings",
        bowling_team="Mumbai Indians",
        city="Mumbai",
        target_score=150,
        current_score=152,
        wickets_lost=3,
        overs_completed=18.2
    )
    assert result["chasing_team_win_prob"] == 100.0
    assert result["defending_team_win_prob"] == 0.0
    assert result["runs_needed"] == 0

def test_win_probability_all_out():
    """Deterministic edge case: all 10 wickets lost."""
    engine = MLEngine()
    result = engine.predict_win_probability(
        batting_team="Delhi Capitals",
        bowling_team="Punjab Kings",
        city="Delhi",
        target_score=180,
        current_score=120,
        wickets_lost=10,
        overs_completed=15.0
    )
    assert result["chasing_team_win_prob"] == 0.0
    assert result["defending_team_win_prob"] == 100.0

# ============================================================================
# 3. INVALID INPUT & BOUNDARY VALIDATION TESTS
# ============================================================================

def test_negative_score_rejected():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": -10,
        "wickets_lost": 2,
        "overs_completed": 10.0
    }
    res = client.post("/api/v1/predict/score", json=payload)
    assert res.status_code == 422  # Pydantic schema validation error

def test_overs_exceeding_20_rejected():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": 100,
        "wickets_lost": 2,
        "overs_completed": 21.0
    }
    res = client.post("/api/v1/predict/score", json=payload)
    assert res.status_code == 422

def test_wickets_exceeding_9_rejected_by_schema():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": 100,
        "wickets_lost": 12,
        "overs_completed": 10.0
    }
    res = client.post("/api/v1/predict/score", json=payload)
    assert res.status_code == 422

def test_invalid_franchise_name_normalization():
    """Test historical alias normalization like Delhi Daredevils -> Delhi Capitals."""
    assert normalize_team_name("Delhi Daredevils") == "Delhi Capitals"
    assert normalize_team_name("Kings XI Punjab") == "Punjab Kings"
    assert normalize_team_name("Deccan Chargers") == "Sunrisers Hyderabad"
    assert normalize_team_name("Royal Challengers Bangalore") == "Royal Challengers Bengaluru"

# ============================================================================
# 4. DATABASE & SEARCH EDGE CASES
# ============================================================================

def test_player_search_empty_returns_results():
    """Empty player search query should return the paginated default list."""
    res = client.get("/api/v1/players?search=&page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data["players"]) == 10
    assert data["total"] > 500

def test_player_search_nonexistent_name():
    """Search for non-existent player returns clean empty list with 0 total."""
    res = client.get("/api/v1/players?search=NonExistentPlayerXYZ999")
    assert res.status_code == 200
    data = res.json()
    assert len(data["players"]) == 0
    assert data["total"] == 0

def test_player_invalid_id():
    """Querying non-existent player ID returns 404."""
    res = client.get("/api/v1/players/999999")
    assert res.status_code == 404

def test_team_comparison_nonexistent_team():
    """Comparing non-existent teams handles gracefully."""
    res = client.get("/api/v1/teams/compare/h2h?team1=InvalidTeamA&team2=InvalidTeamB")
    assert res.status_code == 404

def test_history_clear_and_empty_fetch():
    """Clearing prediction history returns 200 and subsequent fetch is empty."""
    clear_res = client.delete("/api/v1/history/clear")
    assert clear_res.status_code == 200

    fetch_res = client.get("/api/v1/history")
    assert fetch_res.status_code == 200
    assert fetch_res.json() == []
