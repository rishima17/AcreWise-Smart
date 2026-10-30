from fastapi import APIRouter
from app.schemas.crops import ScenarioRequest, ScenarioResponse
from app.services.scenario_engine import simulate_scenarios

router = APIRouter(tags=["what-if scenarios"])

@router.post("/scenarios/simulate", response_model=ScenarioResponse)
def run_scenario(payload: ScenarioRequest):
    return simulate_scenarios(payload)
