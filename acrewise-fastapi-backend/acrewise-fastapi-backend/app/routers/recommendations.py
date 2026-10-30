from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Farm
from app.schemas.crops import RecommendationRequest, RecommendationResponse, ProfitRequest, ProfitResponse
from app.schemas.common import Provenance
from app.services.crop_engine import recommend
from datetime import datetime, timezone

router = APIRouter(tags=["recommendations"])

@router.post("/recommendations", response_model=RecommendationResponse)
def crop_recommendations(payload: RecommendationRequest, db: Session = Depends(get_db)):
    if payload.farm_id is not None:
        farm = db.get(Farm, payload.farm_id)
        if not farm: raise HTTPException(404, detail={"error":"farm_not_found","message":"Farm not found."})
        payload = payload.model_copy(update={"state": farm.state, "district": farm.district, "acreage": farm.acreage, "soil_type": farm.soil_type, "water_availability": farm.water_availability, "previous_crop": farm.previous_crop})
    return recommend(payload)

@router.post("/profitability/calculate", response_model=ProfitResponse)
def calculate_profit(payload: ProfitRequest):
    revenue = payload.expected_yield * payload.expected_selling_price
    return ProfitResponse(
        estimated_revenue=round(revenue, 2),
        estimated_net_profit=round(revenue - payload.cultivation_cost_per_acre, 2),
        assumptions=["Yield and price must use the same unit basis.", "Cultivation cost is per acre.", "Excludes any cost or revenue not entered by the user."],
        provenance=Provenance(source="User-provided assumptions", retrieved_at=datetime.now(timezone.utc), units=f"{payload.yield_unit}; price in INR/{payload.price_unit}; cost in INR/acre", quality="depends on user inputs", origin="farmer-entered")
    )
