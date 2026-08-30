import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_predict_score_endpoint():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "runs": 88,
        "wickets": 2,
        "overs": 10.0,
        "runs_last_5": 45,
        "wickets_last_5": 1,
        "city": "Mumbai"
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "predicted_score" in data["prediction"]
    assert data["prediction"]["predicted_score"] >= 88
    assert "lower_bound" in data["prediction"]
    assert "upper_bound" in data["prediction"]
    assert "model_used" in data
    assert "timestamp" in data
    assert "input_summary" in data

def test_predict_score_validation_error():
    # Same team error
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Chennai Super Kings",
        "runs": 80,
        "wickets": 2,
        "overs": 10.0
    }
    response = client.post("/api/predict/score", json=payload)
    assert response.status_code == 422

def test_predict_win_endpoint():
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
    assert "prediction" in data
    assert "team_a_probability" in data["prediction"]
    assert "team_b_probability" in data["prediction"]
    assert 0.0 <= data["prediction"]["team_a_probability"] <= 1.0
    assert 0.0 <= data["prediction"]["team_b_probability"] <= 1.0
    assert round(data["prediction"]["team_a_probability"] + data["prediction"]["team_b_probability"], 2) == 1.00
    assert data["runs_needed"] == 75
    assert data["balls_remaining"] == 48

def test_predict_match_endpoint():
    payload = {
        "team1": "Chennai Super Kings",
        "team2": "Mumbai Indians",
        "venue": "Wankhede Stadium",
        "city": "Mumbai"
    }
    response = client.post("/api/predict/match", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "matchup" in data
    assert "projected_first_innings_score" in data
    assert "projected_win_probabilities" in data
    assert "head_to_head_summary" in data

def test_get_predictions_log():
    response = client.get("/api/predictions?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first_id = data[0]["id"]
    single_res = client.get(f"/api/predictions/{first_id}")
    assert single_res.status_code == 200
    assert single_res.json()["id"] == first_id

def test_get_nonexistent_prediction():
    response = client.get("/api/predictions/999999")
    assert response.status_code == 404
