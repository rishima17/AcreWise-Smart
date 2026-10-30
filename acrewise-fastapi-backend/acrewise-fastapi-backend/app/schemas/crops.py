from pydantic import BaseModel, Field, model_validator, field_validator
from app.schemas.common import Provenance

class RecommendationRequest(BaseModel):
    farm_id: int | None = None
    state: str = "Punjab"
    district: str = "Amritsar"
    acreage: float = Field(default=5.0, gt=0, le=100000)
    soil_type: str | None = None
    water_availability: str | None = None
    previous_crop: str | None = None
    season: str = Field(default="Rabi 2026", min_length=2, max_length=40)
    farmer_id: int | None = None

    @field_validator("water_availability", mode="before")
    @classmethod
    def normalize_water(cls, v):
        if v is None:
            return None
        v_str = str(v).strip().lower()
        if v_str in ("low", "medium", "high"):
            return v_str
        return "medium"

class CropCandidate(BaseModel):
    crop_name: str
    rank: int
    score: float
    expected_yield_per_acre: float
    yield_unit: str
    expected_price_per_unit: float
    currency: str = "INR"
    cultivation_cost_per_acre: float
    estimated_revenue_per_acre: float
    estimated_net_profit_per_acre: float
    water_need: str
    water_saved_liters_per_acre: float = 0.0
    nitrogen_fixation_kg_per_acre: float = 0.0
    msp_price: float = 0.0
    climate_resilience: str = "Moderate"
    suitability: str
    market_outlook: str
    reasons: list[str]
    assumptions: list[str]
    risks: list[str]
    missing_data: list[str]
    provenance: list[Provenance]

class RecommendationResponse(BaseModel):
    season: str
    candidates: list[CropCandidate]
    method: str
    disclaimer: str
    data_completeness: str

class ProfitRequest(BaseModel):
    expected_yield: float = Field(gt=0)
    yield_unit: str = Field(min_length=1, max_length=30)
    expected_selling_price: float = Field(gt=0)
    price_unit: str = Field(min_length=1, max_length=30)
    cultivation_cost_per_acre: float = Field(ge=0)
    @model_validator(mode="after")
    def units_must_be_compatible(self):
        if self.yield_unit.strip().lower() != self.price_unit.strip().lower():
            raise ValueError("yield_unit and price_unit must describe the same unit (e.g. quintal).")
        return self

class ProfitResponse(BaseModel):
    estimated_revenue: float
    estimated_net_profit: float
    currency: str = "INR"
    area_basis: str = "per acre"
    assumptions: list[str]
    provenance: Provenance

class CompareRequest(BaseModel):
    crops: list[str] = Field(min_length=2, max_length=10)
    state: str = "Punjab"
    district: str = "Amritsar"
    season: str = "Rabi"
    acreage: float = Field(default=1, gt=0)

# --- What-If Scenario Schemas ---
class ScenarioRequest(BaseModel):
    crops: list[str] = Field(default=["Wheat", "Mustard", "Chickpea"])
    acreage: float = Field(default=5.0, gt=0)
    rainfall_pct_change: float = Field(default=0.0, ge=-80.0, le=100.0) # -30 = drought, +30 = excess rain
    market_price_pct_change: float = Field(default=0.0, ge=-60.0, le=100.0) # -25 = price crash
    input_cost_pct_change: float = Field(default=0.0, ge=-30.0, le=100.0) # +30 = diesel & fertilizer spike
    pest_pressure: str = Field(default="none") # "none", "moderate", "severe"
    has_pmfby_insurance: bool = Field(default=False)

class CropScenarioOutcome(BaseModel):
    crop_name: str
    baseline_yield: float
    stressed_yield: float
    yield_change_pct: float
    baseline_price: float
    stressed_price: float
    msp_price: float
    msp_triggered: bool
    baseline_cost_per_acre: float
    stressed_cost_per_acre: float
    baseline_net_profit_per_acre: float
    stressed_net_profit_per_acre: float
    profit_change_pct: float
    insurance_payout_per_acre: float
    final_profit_with_insurance_per_acre: float
    resilience_score: int # 0 to 100
    resilience_tier: str # High, Moderate, Low, Critical
    risk_summary: str
    mitigation_advice: str

class ScenarioResponse(BaseModel):
    scenario_label: str
    acreage: float
    outcomes: list[CropScenarioOutcome]
    best_resilience_crop: str
    worst_hit_crop: str
    key_takeaway: str

# --- Kisan Mitra Advisory Chat Schemas ---
class AdvisoryMessage(BaseModel):
    role: str # "user" | "assistant"
    content: str

class AdvisoryChatRequest(BaseModel):
    message: str
    language: str = Field(default="en") # "en", "hi", "pa"
    history: list[AdvisoryMessage] = Field(default=[])
    farm_context: dict | None = None

class AdvisoryChatResponse(BaseModel):
    reply: str
    suggested_questions: list[str]
    language: str
    referenced_crops: list[str] = []

