from pydantic import BaseModel, Field
from app.schemas.common import ORMModel
from app.models.entities import Farmer, Farm

class FarmerCreate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    role: str = Field(default="farmer", pattern="^(farmer|fpo_officer|agriculture_officer|admin)$")
    preferred_language: str = Field(default="en", pattern="^(en|hi|pa)$")

class FarmerUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    role: str | None = Field(default=None, pattern="^(farmer|fpo_officer|agriculture_officer|admin)$")
    preferred_language: str | None = Field(default=None, pattern="^(en|hi|pa)$")

class FarmerOut(ORMModel):
    id: int
    name: str | None
    phone: str | None
    role: str
    preferred_language: str

class FarmCreate(BaseModel):
    farmer_id: int
    name: str = Field(default="My farm", max_length=120)
    state: str = Field(min_length=2, max_length=80)
    district: str = Field(min_length=2, max_length=80)
    village: str | None = Field(default=None, max_length=100)
    acreage: float = Field(gt=0, le=100000)
    soil_type: str | None = None
    water_availability: str | None = Field(default=None, pattern="^(low|medium|high)$")
    previous_crop: str | None = None
    preferred_season: str | None = None
    irrigation_method: str | None = None
    preferences: str | None = None

class FarmUpdate(BaseModel):
    name: str | None = None
    state: str | None = None
    district: str | None = None
    village: str | None = None
    acreage: float | None = Field(default=None, gt=0, le=100000)
    soil_type: str | None = None
    water_availability: str | None = Field(default=None, pattern="^(low|medium|high)$")
    previous_crop: str | None = None
    preferred_season: str | None = None
    irrigation_method: str | None = None
    preferences: str | None = None

class FarmOut(ORMModel):
    id: int
    farmer_id: int
    name: str
    state: str
    district: str
    village: str | None
    acreage: float
    soil_type: str | None
    water_availability: str | None
    previous_crop: str | None
    preferred_season: str | None
    irrigation_method: str | None
    preferences: str | None
