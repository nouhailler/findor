from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_cwd():
    response = client.get("/api/cwd")
    assert response.status_code == 200
    assert "cwd" in response.json()

def test_get_ai_config():
    response = client.get("/api/ai/config")
    assert response.status_code == 200
    data = response.json()
    assert "provider" in data
    assert "model" in data

def test_search_endpoint_basic():
    # Test simple recherche dans le dossier courant
    response = client.post("/api/search", json={"directory": "."})
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "command" in data
    assert data["command"].startswith("find")
