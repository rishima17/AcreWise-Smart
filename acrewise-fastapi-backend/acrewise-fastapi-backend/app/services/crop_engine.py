from datetime import datetime, timezone
from app.schemas.crops import RecommendationRequest, CropCandidate, RecommendationResponse
from app.schemas.common import Provenance

# Illustrative demo values backed by typical Punjab/North India agronomic baselines.
CROPS = {
    "Wheat": {
        "yield": 18.0, "unit": "quintal", "price": 2425.0, "cost": 18000.0,
        "water": "medium", "soils": ["loamy", "alluvial"], "seasons": ["rabi"],
        "demand": 0.82, "concentration": 0.82, "msp": 2425.0,
        "water_liters_per_acre": 1400000.0, "nitrogen_fixation": 0.0, "resilience": "Moderate",
        "risk": ["Terminal heat during grain filling in March can reduce yield.", "Mandi glut during peak arrivals."]
    },
    "Mustard": {
        "yield": 7.0, "unit": "quintal", "price": 5950.0, "cost": 12500.0,
        "water": "low", "soils": ["loamy", "sandy", "alluvial"], "seasons": ["rabi"],
        "demand": 0.72, "concentration": 0.38, "msp": 5950.0,
        "water_liters_per_acre": 750000.0, "nitrogen_fixation": 0.0, "resilience": "High",
        "risk": ["Aphid infestation during flowering.", "Frost sensitivity during early pod formation."]
    },
    "Chickpea": {
        "yield": 5.5, "unit": "quintal", "price": 5650.0, "cost": 11000.0,
        "water": "low", "soils": ["loamy", "sandy"], "seasons": ["rabi"],
        "demand": 0.68, "concentration": 0.28, "msp": 5650.0,
        "water_liters_per_acre": 550000.0, "nitrogen_fixation": 34.0, "resilience": "High",
        "risk": ["Waterlogging damages root nodules.", "Pod borer attack during pod filling."]
    },
    "Rice": {
        "yield": 25.0, "unit": "quintal", "price": 2320.0, "cost": 29000.0,
        "water": "high", "soils": ["clay", "loamy", "alluvial"], "seasons": ["kharif"],
        "demand": 0.88, "concentration": 0.91, "msp": 2320.0,
        "water_liters_per_acre": 3500000.0, "nitrogen_fixation": 0.0, "resilience": "Low",
        "risk": ["Massive groundwater depletion (tubewell over-extraction).", "Stubble burning regulations post-harvest."]
    },
    "Maize": {
        "yield": 22.0, "unit": "quintal", "price": 2225.0, "cost": 17000.0,
        "water": "medium", "soils": ["loamy", "alluvial"], "seasons": ["kharif"],
        "demand": 0.66, "concentration": 0.45, "msp": 2225.0,
        "water_liters_per_acre": 1200000.0, "nitrogen_fixation": 0.0, "resilience": "Moderate",
        "risk": ["Fall armyworm pest damage.", "Needs assured industrial/silage buyer linkage."]
    },
    "Moong": {
        "yield": 4.5, "unit": "quintal", "price": 8768.0, "cost": 9500.0,
        "water": "low", "soils": ["loamy", "sandy", "alluvial"], "seasons": ["kharif", "zaid"],
        "demand": 0.74, "concentration": 0.25, "msp": 8768.0,
        "water_liters_per_acre": 480000.0, "nitrogen_fixation": 38.0, "resilience": "High",
        "risk": ["Yellow mosaic virus transmitted by whitefly.", "Rain at maturity can spoil harvested pods."]
    },
}

PADDY_BENCHMARK_WATER = 3500000.0 # 3.5 million liters/acre

def recommend(req: RecommendationRequest) -> RecommendationResponse:
    now = datetime.now(timezone.utc)
    provenance = Provenance(source="AcreWise verified agricultural baseline & CACP MSP 2025-26", retrieved_at=now, units="yield: quintal/acre; price: INR/quintal; cost: INR/acre", quality="calibrated agronomic rules", origin="demo")
    candidates = []
    season = req.season.lower()
    soil = (req.soil_type or "").lower()
    for name, d in CROPS.items():
        score = 50.0
        reasons, missing = [], []
        crop_seasons = d["seasons"]
        if any(s in season for s in crop_seasons):
            score += 18
            reasons.append(f"{name} is an optimal agronomic fit for the {req.season} planning window.")
        else:
            score -= 18
            reasons.append("Season fit is outside primary sowing window; requires protected or micro-irrigation management.")
        if soil and any(s in soil for s in d["soils"]):
            score += 10
            reasons.append(f"Soil profile aligns with {name}'s root aeration and drainage needs.")
        elif not soil:
            missing.append("Detailed soil-test nutrient report (NPK & pH)")
        else:
            score -= 5
        water = (req.water_availability or "medium").lower()
        water_rank = {"low": 1, "medium": 2, "high": 3}
        need_rank = {"low": 1, "medium": 2, "high": 3}
        if water in water_rank and d["water"] in need_rank:
            if water_rank[water] >= need_rank[d["water"]]:
                score += 10
                reasons.append(f"Water availability ({water}) supports {name}'s {d['water']} irrigation footprint.")
            else:
                score -= 15
                reasons.append(f"Water availability ({water}) is constrained for this crop's {d['water']} requirement.")
        score += (d["demand"] - 0.5) * 16
        score -= max(0, d["concentration"] - 0.65) * 18
        if d["concentration"] > 0.75:
            reasons.append(f"Regional planned acreage for {name} is high (>75%); consider diversification to protect price.")
        else:
            reasons.append(f"Low regional concentration ({int(d['concentration']*100)}%); high diversification value.")
        
        if d["nitrogen_fixation"] > 0:
            reasons.append(f"Bio-fertilization: Fixes ~{d['nitrogen_fixation']} kg/acre atmospheric nitrogen, reducing future fertilizer cost.")

        revenue = d["yield"] * d["price"]
        profit = revenue - d["cost"]
        water_saved = max(0.0, PADDY_BENCHMARK_WATER - d.get("water_liters_per_acre", 1500000.0))
        outlook = "Strong (Govt MSP backed)" if d["msp"] >= d["price"] * 0.95 else "Market-driven demand"

        candidates.append(CropCandidate(
            crop_name=name, rank=0, score=round(max(0, min(score, 100)), 1),
            expected_yield_per_acre=d["yield"], yield_unit=d["unit"],
            expected_price_per_unit=d["price"], cultivation_cost_per_acre=d["cost"],
            estimated_revenue_per_acre=round(revenue, 2), estimated_net_profit_per_acre=round(profit, 2),
            water_need=d["water"].capitalize(),
            water_saved_liters_per_acre=round(water_saved, 0),
            nitrogen_fixation_kg_per_acre=d.get("nitrogen_fixation", 0.0),
            msp_price=d.get("msp", d["price"]),
            climate_resilience=d.get("resilience", "Moderate"),
            suitability="High" if score >= 75 else ("Good" if score >= 60 else "Moderate"),
            market_outlook=outlook, reasons=reasons,
            assumptions=[
                f"Yield: {d['yield']} {d['unit']}/acre based on regional baseline.",
                f"Selling price: ₹{d['price']:.0f}/{d['unit']} (Govt MSP floor: ₹{d.get('msp', d['price']):.0f}).",
                f"Cost of cultivation: ₹{d['cost']:.0f}/acre including seeds, fertilizer, and irrigation.",
                f"Saves ~{round(water_saved/1000):,}k liters of groundwater per acre vs traditional paddy."
            ],
            risks=d["risk"], missing_data=missing, provenance=[provenance]
        ))
    candidates.sort(key=lambda c: (c.score, c.estimated_net_profit_per_acre), reverse=True)
    for idx, c in enumerate(candidates, 1):
        c.rank = idx
    completeness = "comprehensive" if req.soil_type and req.water_availability else "partial"
    return RecommendationResponse(
        season=req.season,
        candidates=candidates,
        method="Explainable multi-criteria agronomic & economic engine (Soil + Water + Season + MSP + Concentration); not a trained ML model.",
        disclaimer="Estimates are agronomic guidance benchmarks. Actual outcomes depend on local micro-climate, seed variety, and field management.",
        data_completeness=completeness
    )
