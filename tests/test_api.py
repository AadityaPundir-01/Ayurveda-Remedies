import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    print("[PASS] Root endpoint passed")


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["qdrant"]["status"] == "connected"
    print(f"[PASS] Health endpoint passed (Qdrant connected, collections found: {data['qdrant']['collections_found']})")


def test_list_admin_remedies():
    response = client.get("/api/admin/remedies")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["remedies"]) >= 4
    print(f"[PASS] List admin remedies passed (Retrieved {len(data['remedies'])} remedies)")


def test_create_admin_remedy():
    payload = {
        "name": "Salt Water Gargle",
        "applicable_symptoms": ["sore throat", "throat pain", "tonsillitis"],
        "ingredients": [
            {
                "name": "Warm Water",
                "amount": "1 glass (200ml)",
                "notes": "Comfortably warm"
            },
            {
                "name": "Table Salt or Himalayan Pink Salt",
                "amount": "1/2 teaspoon",
                "notes": "Draws out fluid and reduces swelling via osmosis"
            }
        ],
        "preparation_steps": [
            "Dissolve 1/2 teaspoon of salt in 1 glass of warm water.",
            "Stir until completely dissolved."
        ],
        "dosage_and_frequency": "Gargle for 30 seconds, spit out completely. Repeat 3 to 4 times a day.",
        "precautions_and_contraindications": [
            "Do NOT swallow the salt water; spit it out entirely.",
            "Patients with severe hypertension should ensure none is swallowed."
        ],
        "who_should_avoid": [
            "Young children who cannot reliably gargle and spit without swallowing"
        ],
        "possible_side_effects": [
            "Dry mouth if done excessively"
        ],
        "tags": ["throat", "hygiene", "gargle"]
    }
    response = client.post("/api/admin/remedies", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert "id" in data
    print(f"[PASS] Create admin remedy passed (Indexed doc ID: {data['id']})")


if __name__ == "__main__":
    print("\nRunning API tests...")
    test_root_endpoint()
    test_health_endpoint()
    test_list_admin_remedies()
    test_create_admin_remedy()
    print("\nAll automated tests passed successfully!\n")
