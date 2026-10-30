import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import CropPlan, Farm, Farmer, PlanFeedback
from app.schemas.market import PlanCreate, FeedbackCreate

router = APIRouter(tags=["crop plans and feedback"])

@router.post("/plans", status_code=201)
def save_plan(payload: PlanCreate, db: Session = Depends(get_db)):
    if not db.get(Farmer, payload.farmer_id): raise HTTPException(404, detail={"error":"farmer_not_found","message":"Farmer not found."})
    if not db.get(Farm, payload.farm_id): raise HTTPException(404, detail={"error":"farm_not_found","message":"Farm not found."})
    revenue = payload.estimated_yield_per_acre * payload.expected_price_per_unit
    obj = CropPlan(farmer_id=payload.farmer_id, farm_id=payload.farm_id, crop_name=payload.crop_name, season=payload.season, estimated_yield_per_acre=payload.estimated_yield_per_acre, expected_price_per_unit=payload.expected_price_per_unit, cultivation_cost_per_acre=payload.cultivation_cost_per_acre, estimated_revenue_per_acre=revenue, estimated_profit_per_acre=revenue-payload.cultivation_cost_per_acre, assumptions_json=json.dumps(payload.assumptions))
    db.add(obj); db.commit(); db.refresh(obj)
    return {"id":obj.id,"farmer_id":obj.farmer_id,"farm_id":obj.farm_id,"crop_name":obj.crop_name,"season":obj.season,"estimated_revenue_per_acre":obj.estimated_revenue_per_acre,"estimated_profit_per_acre":obj.estimated_profit_per_acre,"assumptions":payload.assumptions,"status":"saved"}

@router.get("/plans/{plan_id}")
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    obj = db.get(CropPlan, plan_id)
    if not obj: raise HTTPException(404, detail={"error":"not_found","message":"Crop plan not found."})
    return {"id":obj.id,"farmer_id":obj.farmer_id,"farm_id":obj.farm_id,"crop_name":obj.crop_name,"season":obj.season,"estimated_yield_per_acre":obj.estimated_yield_per_acre,"expected_price_per_unit":obj.expected_price_per_unit,"cultivation_cost_per_acre":obj.cultivation_cost_per_acre,"estimated_revenue_per_acre":obj.estimated_revenue_per_acre,"estimated_profit_per_acre":obj.estimated_profit_per_acre,"assumptions":json.loads(obj.assumptions_json)}

@router.post("/plans/{plan_id}/feedback", status_code=201)
def submit_feedback(plan_id: int, payload: FeedbackCreate, db: Session = Depends(get_db)):
    plan = db.get(CropPlan, plan_id)
    if not plan: raise HTTPException(404, detail={"error":"not_found","message":"Crop plan not found."})
    fb = PlanFeedback(plan_id=plan_id, **payload.model_dump())
    db.add(fb); db.commit(); db.refresh(fb)
    actual_revenue = payload.harvested_quantity * payload.actual_selling_price
    actual_profit = actual_revenue - payload.actual_cost
    estimated_total_profit = plan.estimated_profit_per_acre
    return {"feedback_id":fb.id,"plan_id":plan_id,"actual_crop":payload.actual_crop,"actual_revenue":round(actual_revenue,2),"actual_profit":round(actual_profit,2),"estimated_profit_per_acre":estimated_total_profit,"actual_profit_basis":"total reported harvest; compare only after normalizing acreage and units","difference_note":"Stored for evaluation; this does not automatically retrain a model."}
