from app.schemas.crops import ScenarioRequest, ScenarioResponse, CropScenarioOutcome
from app.services.crop_engine import CROPS

# Agronomic stress response profiles
STRESS_PROFILES = {
    "Wheat": {
        "drought_yield_elasticity": 0.55,    # 30% drought -> 16.5% yield drop
        "excess_rain_elasticity": -0.20,     # heavy rain lodging -> 6% yield drop
        "irrigation_pumping_cost_ratio": 0.22, # 22% of cost is diesel/electricity pumping
        "pest_loss_moderate": 0.12,          # yellow rust / aphids
        "pest_loss_severe": 0.28,
        "pmfby_threshold_yield_pct": 0.70,   # PMFBY triggers when yield < 70% of baseline
        "mitigation": "Switch to zero-tillage sowing and HD-3226 heat-tolerant seeds; apply potassium nitrate spray at grain filling."
    },
    "Mustard": {
        "drought_yield_elasticity": 0.25,    # Low water need -> resilient!
        "excess_rain_elasticity": -0.30,     # susceptible to waterlogging
        "irrigation_pumping_cost_ratio": 0.10,
        "pest_loss_moderate": 0.15,          # aphids during flowering
        "pest_loss_severe": 0.35,
        "pmfby_threshold_yield_pct": 0.70,
        "mitigation": "Install yellow sticky traps early; use Giriraj variety; maintain ridge-and-furrow planting against waterlogging."
    },
    "Chickpea": {
        "drought_yield_elasticity": 0.20,    # Very deep taproot; exceptional drought tolerance
        "excess_rain_elasticity": -0.45,     # Highly sensitive to waterlogging (collar rot / wilt)
        "irrigation_pumping_cost_ratio": 0.08,
        "pest_loss_moderate": 0.18,          # pod borer (Helicoverpa)
        "pest_loss_severe": 0.40,
        "pmfby_threshold_yield_pct": 0.70,
        "mitigation": "Seed treatment with Trichoderma & Rhizobium; install pheromone traps for pod borer; ensure raised-bed sowing."
    },
    "Rice": {
        "drought_yield_elasticity": 0.95,    # High water crop: severe yield collapse under drought without heavy pumping
        "excess_rain_elasticity": 0.05,      # Tolerant to flooding
        "irrigation_pumping_cost_ratio": 0.40, # 40% of cultivation cost is water pumping!
        "pest_loss_moderate": 0.15,          # stem borer, leaf folder
        "pest_loss_severe": 0.32,
        "pmfby_threshold_yield_pct": 0.70,
        "mitigation": "Adopt Direct Seeded Rice (DSR) or Alternate Wetting & Drying (AWD) to cut water use by 30-40%."
    },
    "Maize": {
        "drought_yield_elasticity": 0.60,
        "excess_rain_elasticity": -0.25,
        "irrigation_pumping_cost_ratio": 0.20,
        "pest_loss_moderate": 0.20,          # Fall armyworm
        "pest_loss_severe": 0.45,
        "pmfby_threshold_yield_pct": 0.70,
        "mitigation": "Apply neem oil + bio-agents (Trichogramma); intercrop with pulses; practice soil mulching."
    },
    "Moong": {
        "drought_yield_elasticity": 0.30,
        "excess_rain_elasticity": -0.35,
        "irrigation_pumping_cost_ratio": 0.10,
        "pest_loss_moderate": 0.14,
        "pest_loss_severe": 0.30,
        "pmfby_threshold_yield_pct": 0.70,
        "mitigation": "Sow yellow-mosaic resistant varieties (SML-668 / Star-444); harvest promptly before pre-monsoon rains."
    }
}

def simulate_scenarios(req: ScenarioRequest) -> ScenarioResponse:
    outcomes: list[CropScenarioOutcome] = []
    
    crops_to_eval = [c for c in req.crops if c in CROPS] or list(CROPS.keys())[:3]
    
    label_parts = []
    if req.rainfall_pct_change < -10:
        label_parts.append(f"Drought/Rain Deficit ({int(req.rainfall_pct_change)}%)")
    elif req.rainfall_pct_change > 10:
        label_parts.append(f"Excess Rainfall/Flooding (+{int(req.rainfall_pct_change)}%)")
        
    if req.market_price_pct_change < -5:
        label_parts.append(f"Market Price Crash ({int(req.market_price_pct_change)}%)")
    elif req.market_price_pct_change > 5:
        label_parts.append(f"Bullish Market (+{int(req.market_price_pct_change)}%)")
        
    if req.input_cost_pct_change > 5:
        label_parts.append(f"Fuel/Fertilizer Surge (+{int(req.input_cost_pct_change)}%)")
        
    if req.pest_pressure != "none":
        label_parts.append(f"{req.pest_pressure.capitalize()} Pest Attack")
        
    if req.has_pmfby_insurance:
        label_parts.append("With PMFBY Insurance Safety Net")
        
    scenario_label = " + ".join(label_parts) if label_parts else "Baseline Conditions"
    
    for crop in crops_to_eval:
        base = CROPS[crop]
        profile = STRESS_PROFILES.get(crop, STRESS_PROFILES["Wheat"])
        
        base_yield = base["yield"]
        base_price = base["price"]
        base_cost = base["cost"]
        msp = base.get("msp", base_price)
        
        # 1. Rainfall impact on yield
        yield_multiplier = 1.0
        if req.rainfall_pct_change < 0:
            # drought: negative impact scaled by elasticity
            yield_multiplier += (req.rainfall_pct_change / 100.0) * profile["drought_yield_elasticity"]
        else:
            yield_multiplier += (req.rainfall_pct_change / 100.0) * profile["excess_rain_elasticity"]
            
        # 2. Pest impact
        if req.pest_pressure == "moderate":
            yield_multiplier -= profile["pest_loss_moderate"]
        elif req.pest_pressure == "severe":
            yield_multiplier -= profile["pest_loss_severe"]
            
        yield_multiplier = max(0.20, yield_multiplier) # cap worst drop at 80% loss
        stressed_yield = round(base_yield * yield_multiplier, 2)
        yield_change_pct = round(((stressed_yield - base_yield) / base_yield) * 100, 1)
        
        # 3. Market price stress vs MSP floor
        raw_stressed_price = base_price * (1.0 + (req.market_price_pct_change / 100.0))
        
        # Check if MSP floor cushions the price!
        msp_triggered = False
        if raw_stressed_price < msp:
            stressed_price = msp
            msp_triggered = True
        else:
            stressed_price = round(raw_stressed_price, 2)
            
        # 4. Input cost changes
        # In drought, pumping cost spikes up:
        extra_pumping_pct = 0.0
        if req.rainfall_pct_change < 0:
            extra_pumping_pct = abs(req.rainfall_pct_change / 100.0) * profile["irrigation_pumping_cost_ratio"] * 0.7
            
        # Extra pesticide cost in pest pressure
        extra_pest_cost = 0.0
        if req.pest_pressure == "moderate":
            extra_pest_cost = 800.0
        elif req.pest_pressure == "severe":
            extra_pest_cost = 2200.0
            
        general_cost_multiplier = 1.0 + (req.input_cost_pct_change / 100.0)
        stressed_cost = round((base_cost * general_cost_multiplier * (1.0 + extra_pumping_pct)) + extra_pest_cost, 2)
        
        # 5. Financial returns
        base_revenue = base_yield * base_price
        base_profit = base_revenue - base_cost
        
        stressed_revenue = stressed_yield * stressed_price
        stressed_profit = stressed_revenue - stressed_cost
        profit_change_pct = round(((stressed_profit - base_profit) / abs(base_profit)) * 100, 1) if base_profit else 0.0
        
        # 6. PMFBY Crop Insurance Payout
        insurance_payout = 0.0
        if req.has_pmfby_insurance:
            threshold_yield = base_yield * profile["pmfby_threshold_yield_pct"]
            if stressed_yield < threshold_yield:
                # Indemnity payout per acre
                shortfall_ratio = (threshold_yield - stressed_yield) / threshold_yield
                sum_insured = base_yield * msp
                insurance_payout = round(sum_insured * shortfall_ratio, 2)
                
        final_profit = round(stressed_profit + insurance_payout, 2)
        
        # 7. Resilience Score (0 to 100)
        # Combines yield retention (40%), profit retention (40%), and low water dependency (20%)
        yield_score = max(0, min(100, (stressed_yield / base_yield) * 100))
        profit_score = max(0, min(100, ((final_profit + base_cost) / (base_profit + base_cost)) * 100)) if (base_profit + base_cost) > 0 else 20
        water_bonus = 20 if base["water"] == "low" else (10 if base["water"] == "medium" else 0)
        resilience_score = int(round(yield_score * 0.40 + profit_score * 0.40 + water_bonus))
        resilience_score = max(5, min(98, resilience_score))
        
        if resilience_score >= 75:
            tier = "High"
        elif resilience_score >= 55:
            tier = "Moderate"
        elif resilience_score >= 35:
            tier = "Low"
        else:
            tier = "Critical Risk"
            
        # Summary text
        if msp_triggered and req.has_pmfby_insurance:
            risk_summary = f"Protected by Govt MSP (₹{msp}/q) and PMFBY insurance payout (+₹{insurance_payout:,.0f}/acre)."
        elif msp_triggered:
            risk_summary = f"Protected by MSP floor price of ₹{msp}/q preventing further market losses."
        elif req.has_pmfby_insurance and insurance_payout > 0:
            risk_summary = f"PMFBY insurance payout of ₹{insurance_payout:,.0f}/acre recovered 40-70% of crop loss."
        elif profit_change_pct < -40:
            risk_summary = f"Significant exposure: net profit drops by {abs(profit_change_pct):.0f}% under this shock."
        else:
            risk_summary = f"Stable response: net profit variance is within {abs(profit_change_pct):.0f}%."
            
        outcomes.append(CropScenarioOutcome(
            crop_name=crop,
            baseline_yield=base_yield,
            stressed_yield=stressed_yield,
            yield_change_pct=yield_change_pct,
            baseline_price=base_price,
            stressed_price=stressed_price,
            msp_price=msp,
            msp_triggered=msp_triggered,
            baseline_cost_per_acre=base_cost,
            stressed_cost_per_acre=stressed_cost,
            baseline_net_profit_per_acre=round(base_profit, 2),
            stressed_net_profit_per_acre=round(stressed_profit, 2),
            profit_change_pct=profit_change_pct,
            insurance_payout_per_acre=insurance_payout,
            final_profit_with_insurance_per_acre=final_profit,
            resilience_score=resilience_score,
            resilience_tier=tier,
            risk_summary=risk_summary,
            mitigation_advice=profile["mitigation"]
        ))
        
    outcomes.sort(key=lambda o: o.final_profit_with_insurance_per_acre, reverse=True)
    best_crop = outcomes[0].crop_name if outcomes else "Mustard"
    worst_crop = min(outcomes, key=lambda o: o.resilience_score).crop_name if outcomes else "Rice"
    
    # Key Takeaway
    if req.rainfall_pct_change < -20:
        takeaway = f"Under drought conditions, {best_crop} outperforms high-water crops like {worst_crop} by cutting tubewell pumping expenses and suffering smaller yield degradation."
    elif req.market_price_pct_change < -15:
        takeaway = f"In a market price crash, crops with statutory MSP procurement (like Wheat and Mustard) provide guaranteed cash-flow protection compared to open-market commodities."
    elif req.has_pmfby_insurance:
        takeaway = f"Enrolling in PMFBY Crop Insurance acts as a financial shock-absorber, restoring farmer liquidity even during acute pest outbreaks or climatic shocks."
    else:
        takeaway = f"Diversified planning with {best_crop} provides superior risk-adjusted net income across variable climate and market scenarios."
        
    return ScenarioResponse(
        scenario_label=scenario_label,
        acreage=req.acreage,
        outcomes=outcomes,
        best_resilience_crop=best_crop,
        worst_hit_crop=worst_crop,
        key_takeaway=takeaway
    )
