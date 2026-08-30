import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["score_model_loaded"] is True
    assert data["win_model_loaded"] is True

def test_predict_score_api():
    payload = {
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians",
        "city": "Chennai",
        "current_score": 88,
        "wickets_lost": 2,
        "overs_completed": 10.0,
        "runs_last_5": 42,
        "wickets_last_5": 1
    }
    response = client.post("/api/v1/predict/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_score" in data
    assert data["predicted_score"] >= 88
    assert "trajectory" in data
    assert "commentary" in data

def test_predict_win_probability_api():
    payload = {
        "batting_team": "Royal Challengers Bengaluru",
        "bowling_team": "Kolkata Knight Riders",
        "city": "Bengaluru",
        "target_score": 190,
        "current_score": 130,
        "wickets_lost": 3,
        "overs_completed": 13.0
    }
    response = client.post("/api/v1/predict/win-probability", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "chasing_team_win_prob" in data
    assert "defending_team_win_prob" in data
    assert data["runs_needed"] == 60

def test_get_teams():
    response = client.get("/api/v1/teams")
    assert response.status_code == 200
    teams = response.json()
    assert len(teams) >= 8
    csk = next((t for t in teams if t["name"] == "Chennai Super Kings"), None)
    assert csk is not None
    assert csk["short_name"] == "CSK"

def test_team_comparison_h2h():
    response = client.get("/api/v1/teams/compare/h2h?team1=Chennai Super Kings&team2=Mumbai Indians")
    assert response.status_code == 200
    data = response.json()
    assert "total_head_to_head_matches" in data
    assert data["total_head_to_head_matches"] > 0
    assert "team1_wins" in data
    assert "team2_wins" in data

def test_list_players():
    response = client.get("/api/v1/players?limit=10&sort_by=runs")
    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    assert len(data["players"]) == 10
    assert data["players"][0]["total_runs"] > 0

def test_get_player_detail():
    response = client.get("/api/v1/players/1")
    assert response.status_code == 200
    data = response.json()
    assert "player" in data
    assert "radar_chart" in data
    assert len(data["radar_chart"]) == 6

def test_analytics_endpoints():
    v_res = client.get("/api/v1/analytics/venues")
    assert v_res.status_code == 200
    assert len(v_res.json()) > 0

    m_res = client.get("/api/v1/analytics/model-metrics")
    assert m_res.status_code == 200
    assert "score_model" in m_res.json()
    assert "win_probability_model" in m_res.json()

    dash_res = client.get("/api/v1/analytics/dashboard-summary")
    assert dash_res.status_code == 200
    assert dash_res.json()["total_matches"] > 0

def test_history_flow():
    # Fetch history
    h_res = client.get("/api/v1/history?limit=10")
    assert h_res.status_code == 200
    assert isinstance(h_res.json(), list)
