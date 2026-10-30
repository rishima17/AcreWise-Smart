from fastapi import APIRouter
from app.schemas.crops import AdvisoryChatRequest, AdvisoryChatResponse
from app.services.advisory import generate_advisory_reply

router = APIRouter(tags=["kisan mitra advisory"])

@router.post("/advisory/chat", response_model=AdvisoryChatResponse)
def advisory_chat(payload: AdvisoryChatRequest):
    return generate_advisory_reply(payload)
