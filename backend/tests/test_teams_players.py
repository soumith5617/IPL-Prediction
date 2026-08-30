import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_teams():
    response = client.get("/api/teams")
    assert response.status_code == 200
    teams = response.json()
    assert len(teams) >= 8
    csk = next((t for t in teams if t["name"] == "Chennai Super Kings"), None)
    assert csk is not None
    assert csk["short_name"] == "CSK"
    assert csk["titles"] >= 5

def test_get_team_by_id():
    response = client.get("/api/teams/1")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "win_percentage" in data

def test_team_comparison():
    response = client.get("/api/teams/compare/h2h?team1=Chennai Super Kings&team2=Mumbai Indians")
    assert response.status_code == 200
    data = response.json()
    assert "total_head_to_head_matches" in data
    assert data["total_head_to_head_matches"] > 0
    assert "team1_wins" in data
    assert "team2_wins" in data

def test_list_players_paginated():
    response = client.get("/api/players?limit=10&page=1&sort_by=runs")
    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    assert len(data["players"]) == 10
    assert data["total"] > 500

def test_search_players():
    response = client.get("/api/players?search=Kohli")
    assert response.status_code == 200
    data = response.json()
    assert len(data["players"]) >= 1
    assert "Kohli" in data["players"][0]["name"]

def test_get_player_profile():
    response = client.get("/api/players/1")
    assert response.status_code == 200
    data = response.json()
    assert "player" in data
    assert "radar_chart" in data
    assert len(data["radar_chart"]) == 6
    assert "career_summary" in data
