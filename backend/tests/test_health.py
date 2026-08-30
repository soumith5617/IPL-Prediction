import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models" in data
    assert data["models"]["score_model_loaded"] is True
    assert data["models"]["win_model_loaded"] is True

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "documentation" in data
    assert data["documentation"] == "/docs"
