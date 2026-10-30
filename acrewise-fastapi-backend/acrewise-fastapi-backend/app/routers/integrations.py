from fastapi import APIRouter
from app.adapters.gi_ai4afs import GIAI4AFSAdapter

router = APIRouter(tags=["integrations"])
@router.get("/integrations/status")
async def integrations_status():
    adapter = GIAI4AFSAdapter()
    return {"adapters":[{"name":adapter.name,"configured":adapter.configured,"status":"unconfigured","message":"No verified endpoint, credentials or connection configured."}], "normalization_contract":{"required_fields":["source","retrieved_at","units","quality","origin"],"origin_values":["farmer-entered","external","demo"]}}
