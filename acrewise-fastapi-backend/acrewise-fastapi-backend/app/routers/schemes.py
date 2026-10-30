from fastapi import APIRouter
from app.services.schemes_data import SCHEMES, MSP_RATES_2025_26

router = APIRouter(tags=["government schemes and msp"])

@router.get("/schemes")
def get_schemes():
    return {
        "schemes": SCHEMES,
        "msp_rates": MSP_RATES_2025_26,
        "disclaimer": "Official rates determined by Cabinet Committee on Economic Affairs (CCEA) & CACP."
    }
