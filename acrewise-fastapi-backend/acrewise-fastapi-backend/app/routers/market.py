from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.entities import SowingIntent
from app.schemas.crops import CompareRequest
from app.schemas.market import SowingIntentCreate, SowingIntentOut
from app.services.market_data import DEMO_PRICES, DEMO_CONCENTRATION, provenance
from app.services.crop_engine import CROPS

router = APIRouter(tags=["market intelligence"])

@router.get("/market/prices")
def market_prices(crop: str | None = None):
    rows = [r for r in DEMO_PRICES if not crop or r["crop"].lower() == crop.lower()]
    return {"items": rows, "provenance": provenance(), "notice": "Illustrative demo prices only; not live mandi data."}

@router.get("/market/concentration")
def market_concentration(region: str = "Punjab"):
    return {"region": region, "items": DEMO_CONCENTRATION, "provenance": provenance(), "notice": "Synthetic sample values; planned share is not actual production."}

@router.get("/market/diversification")
def diversification(region: str = "Punjab"):
    items = [{"crop": crop, "reason": "Lower illustrative concentration signal; verify local suitability and buyers."} for crop, d in CROPS.items() if d["concentration"] < 0.5]
    return {"region": region, "opportunities": items, "provenance": provenance(), "notice": "Exploratory demo suggestions, not an agronomic prescription."}

@router.post("/market/compare")
def compare_crops(payload: CompareRequest):
    results = []
    for crop in payload.crops:
        d = next((v for k,v in CROPS.items() if k.lower() == crop.lower()), None)
        if not d: raise HTTPException(422, detail={"error":"unknown_crop","message":f"No demo assumptions configured for crop '{crop}'."})
        revenue = d["yield"] * d["price"]
        results.append({"crop": crop, "expected_revenue_per_acre": revenue, "cultivation_cost_per_acre": d["cost"], "estimated_net_profit_per_acre": revenue-d["cost"], "water_need": d["water"], "suitability": "indicative; needs farm inputs", "market_outlook": "illustrative demo signal", "key_risks": d["risk"], "yield_unit": d["unit"], "price_per_unit": d["price"]})
    return {"season": payload.season, "acreage": payload.acreage, "items": results, "provenance": provenance(), "notice": "All estimates are illustrative demo assumptions."}

@router.post("/sowing-intents", response_model=SowingIntentOut, status_code=201)
def submit_intent(payload: SowingIntentCreate, db: Session = Depends(get_db)):
    if not payload.consent_to_aggregate:
        raise HTTPException(400, detail={"error":"consent_required","message":"Consent to include this plan in aggregated regional analysis is required."})
    obj = SowingIntent(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/sowing-intents/mine/{farmer_id}", response_model=list[SowingIntentOut])
def my_intents(farmer_id: int, db: Session = Depends(get_db)):
    # Replace farmer_id path trust with authenticated identity/ownership checks in production.
    return db.query(SowingIntent).filter(SowingIntent.farmer_id == farmer_id).order_by(SowingIntent.created_at.desc()).all()

@router.get("/sowing-intents/aggregate")
def aggregate_intents(state: str = Query(min_length=2), district: str | None = None, sowing_period: str | None = None, db: Session = Depends(get_db)):
    query = db.query(SowingIntent.crop_name, func.sum(SowingIntent.acreage).label("planned_acres"), func.count(SowingIntent.id).label("contributor_count")).filter(SowingIntent.state == state, SowingIntent.consent_to_aggregate == True)
    if district: query = query.filter(SowingIntent.district == district)
    if sowing_period: query = query.filter(SowingIntent.sowing_period == sowing_period)
    rows = query.group_by(SowingIntent.crop_name).all()
    # Suppress groups with fewer than 5 contributing records to reduce re-identification risk.
    items = [{"crop": r.crop_name, "planned_acres": round(float(r.planned_acres),2), "contributor_count": r.contributor_count, "potential_concentration": "investigate" if r.contributor_count >= 5 and float(r.planned_acres) >= 100 else "insufficient signal"} for r in rows if r.contributor_count >= 5]
    return {"region": {"state":state,"district":district,"sowing_period":sowing_period}, "items":items, "minimum_contributors":5, "notice":"Aggregated planned acreage only, not confirmed production forecasts. Groups under the threshold are suppressed."}
