from pydantic import BaseModel, Field

class SowingIntentCreate(BaseModel):
    farmer_id: int
    crop_name: str = Field(min_length=2, max_length=80)
    acreage: float = Field(gt=0, le=100000)
    state: str = Field(min_length=2, max_length=80)
    district: str = Field(min_length=2, max_length=80)
    village: str | None = None
    sowing_period: str = Field(min_length=2, max_length=40)
    consent_to_aggregate: bool

class SowingIntentOut(BaseModel):
    id: int
    farmer_id: int
    crop_name: str
    acreage: float
    state: str
    district: str
    village: str | None
    sowing_period: str
    consent_to_aggregate: bool

class FeedbackCreate(BaseModel):
    actual_crop: str = Field(min_length=2, max_length=80)
    sowing_date: str | None = None
    harvested_quantity: float = Field(gt=0)
    actual_selling_price: float = Field(gt=0)
    actual_cost: float = Field(ge=0)
    notes: str | None = None

class PlanCreate(BaseModel):
    farmer_id: int
    farm_id: int
    crop_name: str
    season: str
    estimated_yield_per_acre: float = Field(gt=0)
    expected_price_per_unit: float = Field(gt=0)
    cultivation_cost_per_acre: float = Field(ge=0)
    assumptions: list[str] = []
