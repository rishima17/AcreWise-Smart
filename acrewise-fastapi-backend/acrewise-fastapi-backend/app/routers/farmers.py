from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Farmer, Farm
from app.schemas.farmers import FarmerCreate, FarmerUpdate, FarmerOut, FarmCreate, FarmUpdate, FarmOut
from app.core.security import require_api_key

router = APIRouter(tags=["farmers and farms"], dependencies=[Depends(require_api_key)])

@router.post("/farmers", response_model=FarmerOut, status_code=status.HTTP_201_CREATED)
def create_farmer(payload: FarmerCreate, db: Session = Depends(get_db)):
    obj = Farmer(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/farmers/{farmer_id}", response_model=FarmerOut)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    obj = db.get(Farmer, farmer_id)
    if not obj: raise HTTPException(404, detail={"error":"not_found","message":"Farmer not found."})
    return obj

@router.patch("/farmers/{farmer_id}", response_model=FarmerOut)
def update_farmer(farmer_id: int, payload: FarmerUpdate, db: Session = Depends(get_db)):
    obj = db.get(Farmer, farmer_id)
    if not obj: raise HTTPException(404, detail={"error":"not_found","message":"Farmer not found."})
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(obj,k,v)
    db.commit(); db.refresh(obj)
    return obj

@router.post("/farms", response_model=FarmOut, status_code=201)
def create_farm(payload: FarmCreate, db: Session = Depends(get_db)):
    if not db.get(Farmer, payload.farmer_id): raise HTTPException(404, detail={"error":"farmer_not_found","message":"Create the farmer profile first."})
    obj = Farm(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.get("/farms/{farm_id}", response_model=FarmOut)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    obj = db.get(Farm, farm_id)
    if not obj: raise HTTPException(404, detail={"error":"not_found","message":"Farm not found."})
    return obj

@router.patch("/farms/{farm_id}", response_model=FarmOut)
def update_farm(farm_id: int, payload: FarmUpdate, db: Session = Depends(get_db)):
    obj = db.get(Farm, farm_id)
    if not obj: raise HTTPException(404, detail={"error":"not_found","message":"Farm not found."})
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(obj,k,v)
    db.commit(); db.refresh(obj)
    return obj
