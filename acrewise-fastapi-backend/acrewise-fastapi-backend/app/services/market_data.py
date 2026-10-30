from datetime import datetime, timezone
from app.core.config import settings

DEMO_PRICES = [
    {"crop": "Wheat", "market": "Demo regional market", "date": "2026-09-01", "price_per_quintal": 2400, "source": "illustrative demo data"},
    {"crop": "Wheat", "market": "Demo regional market", "date": "2026-10-01", "price_per_quintal": 2380, "source": "illustrative demo data"},
    {"crop": "Mustard", "market": "Demo regional market", "date": "2026-09-01", "price_per_quintal": 5400, "source": "illustrative demo data"},
    {"crop": "Mustard", "market": "Demo regional market", "date": "2026-10-01", "price_per_quintal": 5480, "source": "illustrative demo data"},
]
DEMO_CONCENTRATION = [
    {"crop": "Wheat", "planned_share_percent": 68, "region": "Illustrative Punjab sample", "sample_status": "synthetic demo data"},
    {"crop": "Rice", "planned_share_percent": 74, "region": "Illustrative Punjab sample", "sample_status": "synthetic demo data"},
    {"crop": "Mustard", "planned_share_percent": 18, "region": "Illustrative Punjab sample", "sample_status": "synthetic demo data"},
]
def provenance():
    return {"source": "AcreWise demo dataset", "retrieved_at": datetime.now(timezone.utc).isoformat(), "units": "INR/quintal where applicable", "quality": "illustrative; not verified", "origin": "demo"}
