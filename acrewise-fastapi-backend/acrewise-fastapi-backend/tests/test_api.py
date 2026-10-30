from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_profitability_calculation():
    response = client.post("/api/profitability/calculate", json={
        "expected_yield": 10, "yield_unit": "quintal",
        "expected_selling_price": 2500, "price_unit": "quintal",
        "cultivation_cost_per_acre": 12000
    })
    assert response.status_code == 200
    assert response.json()["estimated_revenue"] == 25000
    assert response.json()["estimated_net_profit"] == 13000

def test_profitability_rejects_mismatched_units():
    response = client.post("/api/profitability/calculate", json={
        "expected_yield": 10, "yield_unit": "quintal",
        "expected_selling_price": 2500, "price_unit": "kg",
        "cultivation_cost_per_acre": 12000
    })
    assert response.status_code == 422

def test_recommendations_are_labeled_demo():
    response = client.post("/api/recommendations", json={
        "acreage": 3, "state": "Punjab", "district": "Amritsar",
        "water_availability": "low", "soil_type": "loamy", "season": "Rabi"
    })
    assert response.status_code == 200
    body = response.json()
    assert len(body["candidates"]) >= 3
    assert "not a trained ML model" in body["method"]
    assert all("provenance" in item for item in body["candidates"])

def test_what_if_scenario_simulation():
    response = client.post("/api/scenarios/simulate", json={
        "crops": ["Wheat", "Mustard", "Chickpea"],
        "acreage": 5.0,
        "rainfall_pct_change": -30.0,
        "market_price_pct_change": -20.0,
        "input_cost_pct_change": 15.0,
        "pest_pressure": "moderate",
        "has_pmfby_insurance": True
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["outcomes"]) == 3
    assert data["best_resilience_crop"] in ["Mustard", "Chickpea", "Wheat"]
    assert "Drought" in data["scenario_label"]
    for o in data["outcomes"]:
        assert o["resilience_score"] > 0
        assert o["resilience_tier"] in ["High", "Moderate", "Low", "Critical Risk"]

def test_kisan_mitra_chat_multilingual():
    # Test English
    r_en = client.post("/api/advisory/chat", json={"message": "What crop after paddy?", "language": "en"})
    assert r_en.status_code == 200
    assert "Mustard" in r_en.json()["reply"] or "Chickpea" in r_en.json()["reply"]

    # Test Punjabi
    r_pa = client.post("/api/advisory/chat", json={"message": "ਝੋਨੇ ਤੋਂ ਬਾਅਦ ਕੀ ਲਗਾਈਏ?", "language": "pa"})
    assert r_pa.status_code == 200
    assert len(r_pa.json()["reply"]) > 10

def test_schemes_and_msp():
    response = client.get("/api/schemes")
    assert response.status_code == 200
    data = response.json()
    assert len(data["schemes"]) >= 4
    assert len(data["msp_rates"]) >= 5

