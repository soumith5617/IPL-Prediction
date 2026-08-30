import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_full_integration_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["score_model_loaded"] is True
    assert data["win_model_loaded"] is True

def test_full_integration_teams():
    response = client.get("/api/teams")
    assert response.status_code == 200
    teams = response.json()
    assert len(teams) >= 10
    team_names = [t["name"] for t in teams]
    assert "Chennai Super Kings" in team_names
    assert "Mumbai Indians" in team_names

def test_full_integration_players():
    response = client.get("/api/players?limit=15&sort_by=runs")
    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    assert len(data["players"]) == 15
    first_player = data["players"][0]
    assert "name" in first_player
    assert "batting_hand" in first_player
    assert "bowling_skill" in first_player

def test_full_integration_predict_score():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "city": "Chennai",
        "venue": "MA Chidambaram Stadium",
        "current_score": 90,
        "wickets_lost": 2,
        "overs_completed": 10.0,
        "runs_last_5": 45,
        "wickets_last_5": 1
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert data["prediction"]["predicted_score"] >= 90
    assert data["prediction"]["lower_bound"] <= data["prediction"]["predicted_score"]
    assert data["prediction"]["upper_bound"] >= data["prediction"]["predicted_score"]
    assert "current_run_rate" in data

def test_full_integration_predict_win():
    payload = {
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Kolkata Knight Riders",
        "city": "Bengaluru",
        "venue": "M Chinnaswamy Stadium",
        "target_score": 180,
        "current_score": 110,
        "wickets_lost": 2,
        "overs_completed": 12.0
    }
    response = client.post("/api/predict/win", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert 0.0 <= data["prediction"]["team_a_probability"] <= 1.0
    assert 0.0 <= data["prediction"]["team_b_probability"] <= 1.0
    assert data["runs_needed"] == 70
    assert data["balls_remaining"] == 48

def test_full_integration_predict_match():
    payload = {
        "team1": "Chennai Super Kings",
        "team2": "Mumbai Indians",
        "city": "Mumbai",
        "venue": "Wankhede Stadium"
    }
    response = client.post("/api/predict/match", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "projected_first_innings_score" in data
    assert "projected_win_probabilities" in data
    assert "Chennai Super Kings" in data["projected_win_probabilities"]
    assert "Mumbai Indians" in data["projected_win_probabilities"]

def test_full_integration_predictions_log():
    response = client.get("/api/predictions?limit=10")
    assert response.status_code == 200
    logs = response.json()
    assert isinstance(logs, list)
    assert len(logs) > 0

def test_full_integration_validation_errors():
    # Identical teams should return 422 Unprocessable Entity
    payload = {
        "batting_team": "Mumbai Indians",
        "bowling_team": "Mumbai Indians",
        "city": "Mumbai",
        "current_score": 80,
        "wickets_lost": 2,
        "overs_completed": 10.0,
        "runs_last_5": 40,
        "wickets_last_5": 1
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code in [400, 422]

    # Invalid oversized overs should return 422 Unprocessable Entity
    invalid_payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "current_score": 80,
        "wickets_lost": 2,
        "overs_completed": 25.0,  # exceeds 20.0
        "runs_last_5": 40,
        "wickets_last_5": 1
    }
    invalid_res = client.post("/api/predict/score", json=invalid_payload)
    assert invalid_res.status_code in [400, 422]
