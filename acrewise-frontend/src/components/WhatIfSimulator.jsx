import React, { useState, useEffect } from 'react';
import { 
  CloudRain, TrendingDown, Fuel, Bug, ShieldCheck, 
  RotateCcw, AlertTriangle, Zap, CheckCircle2, ChevronRight,
  TrendingUp, Award, Droplets, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { fetchWhatIfScenario } from '../services/api';

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const getCropName = (cropName, t) => {
  if (!cropName || !t) return cropName;
  const key = `crop_${cropName.toLowerCase()}`;
  return t[key] || cropName;
};

const getResilienceTier = (tier, t) => {
  if (!tier || !t) return tier;
  const key = `resilience_${tier.toLowerCase().replace(' ', '_')}`;
  return t[key] || tier;
};

const getLocalizedScenarioLabel = (activePreset, scenarioData, t) => {
  if (activePreset === 'baseline' || scenarioData?.scenario_label === 'Baseline Conditions') {
    return t.preset_reset || 'ਆਮ ਹਾਲਾਤ';
  }
  if (activePreset && activePreset !== 'custom') {
    return t[`preset_${activePreset}`] || t.custom_scenario || 'ਸਿਨੇਰੀਓ';
  }
  return t.custom_scenario || 'ਸਿਨੇਰੀਓ';
};

const getLocalizedTakeaway = (scenarioData, rainfall, priceChange, insurance, bestCrop, worstCrop, t) => {
  if (!scenarioData) return t.running_simulation || 'Running simulation…';
  const best = getCropName(bestCrop || scenarioData.best_resilience_crop || 'Mustard', t);
  const worst = getCropName(worstCrop || scenarioData.worst_hit_crop || 'Rice', t);

  if (rainfall < -20 && t.takeaway_drought) {
    return t.takeaway_drought.replace('{best}', best).replace('{worst}', worst);
  } else if (priceChange < -15 && t.takeaway_crash) {
    return t.takeaway_crash;
  } else if (insurance && t.takeaway_insurance) {
    return t.takeaway_insurance;
  }
  if (t.takeaway_default) {
    return t.takeaway_default.replace('{best}', best);
  }
  return scenarioData.key_takeaway || '';
};

const getLocalizedRiskSummary = (out, t) => {
  if (out.msp_triggered && out.insurance_payout_per_acre > 0) {
    return t.risk_summary_msp_pmfby || out.risk_summary;
  } else if (out.msp_triggered) {
    return t.risk_summary_msp || out.risk_summary;
  } else if (out.insurance_payout_per_acre > 0) {
    return t.risk_summary_pmfby || out.risk_summary;
  } else if (out.profit_change_pct < -40) {
    return t.risk_summary_high_loss || out.risk_summary;
  } else if (t.risk_summary_stable) {
    return t.risk_summary_stable;
  }
  return out.risk_summary;
};

const getLocalizedMitigation = (out, t) => {
  const key = `mitigation_${out.crop_name.toLowerCase()}`;
  return t[key] || out.mitigation_advice;
};

export default function WhatIfSimulator({ farm, t, toast }) {
  const [crops, setCrops] = useState(['Wheat', 'Mustard', 'Chickpea']);
  const [rainfall, setRainfall] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [costChange, setCostChange] = useState(0);
  const [pest, setPest] = useState('none');
  const [insurance, setInsurance] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [scenarioData, setScenarioData] = useState(null);
  const [activePreset, setActivePreset] = useState('baseline');

  const availableCrops = ['Wheat', 'Mustard', 'Chickpea', 'Rice', 'Maize', 'Moong'];

  const toggleCrop = (c) => {
    if (crops.includes(c)) {
      if (crops.length > 2) setCrops(crops.filter(x => x !== c));
    } else {
      if (crops.length < 5) setCrops([...crops, c]);
    }
  };

  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'drought') {
      setRainfall(-30); setPriceChange(0); setCostChange(15); setPest('none'); setInsurance(false);
    } else if (preset === 'flood') {
      setRainfall(35); setPriceChange(-5); setCostChange(10); setPest('moderate'); setInsurance(false);
    } else if (preset === 'crash') {
      setRainfall(0); setPriceChange(-25); setCostChange(0); setPest('none'); setInsurance(false);
    } else if (preset === 'diesel') {
      setRainfall(0); setPriceChange(0); setCostChange(30); setPest('none'); setInsurance(false);
    } else if (preset === 'pest') {
      setRainfall(0); setPriceChange(0); setCostChange(10); setPest('severe'); setInsurance(false);
    } else if (preset === 'insurance') {
      setRainfall(-30); setPriceChange(-20); setCostChange(15); setPest('moderate'); setInsurance(true);
    } else {
      setRainfall(0); setPriceChange(0); setCostChange(0); setPest('none'); setInsurance(false);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload = {
        crops,
        acreage: Number(farm.acres) || 5.0,
        rainfall_pct_change: Number(rainfall),
        market_price_pct_change: Number(priceChange),
        input_cost_pct_change: Number(costChange),
        pest_pressure: pest,
        has_pmfby_insurance: insurance
      };
      const res = await fetchWhatIfScenario(payload);
      setScenarioData(res);
      if (toast) toast('What-If scenario simulated successfully');
    } catch (err) {
      console.warn('Backend scenario API failed, using client fallback', err);
      // Client fallback simulation logic
      setScenarioData(generateFallbackScenario());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [crops, rainfall, priceChange, costChange, pest, insurance]);

  const generateFallbackScenario = () => {
    const outcomes = crops.map(c => {
      const isMustard = c === 'Mustard';
      const isChickpea = c === 'Chickpea';
      const isWheat = c === 'Wheat';
      const baseYield = isWheat ? 18 : (isMustard ? 7 : (isChickpea ? 5.5 : 20));
      const basePrice = isWheat ? 2425 : (isMustard ? 5950 : (isChickpea ? 5650 : 2300));
      const baseCost = isWheat ? 18000 : (isMustard ? 12500 : (isChickpea ? 11000 : 25000));
      
      const rainMult = rainfall < 0 ? (1 + (rainfall/100) * (isMustard ? 0.25 : (isChickpea ? 0.20 : 0.60))) : (1 + (rainfall/100) * (isChickpea ? -0.4 : -0.15));
      const pestDrop = pest === 'severe' ? 0.35 : (pest === 'moderate' ? 0.15 : 0);
      const stressedYield = Math.max(1, baseYield * Math.max(0.2, (rainMult - pestDrop)));
      
      let rawPrice = basePrice * (1 + priceChange/100);
      let mspTriggered = false;
      if (rawPrice < basePrice) {
        rawPrice = basePrice; // protected by MSP
        mspTriggered = true;
      }
      
      const stressedCost = baseCost * (1 + costChange/100) * (rainfall < 0 ? 1.15 : 1);
      const baseProfit = (baseYield * basePrice) - baseCost;
      const stressedProfit = (stressedYield * rawPrice) - stressedCost;
      
      const insurancePayout = insurance && stressedYield < (baseYield * 0.7) ? (baseYield * basePrice * 0.25) : 0;
      const finalProfit = stressedProfit + insurancePayout;
      const resilience = isChickpea ? 94 : (isMustard ? 92 : (isWheat ? 75 : 45));
      
      return {
        crop_name: c,
        baseline_yield: baseYield,
        stressed_yield: Math.round(stressedYield * 10) / 10,
        yield_change_pct: Math.round(((stressedYield - baseYield)/baseYield)*100),
        baseline_price: basePrice,
        stressed_price: rawPrice,
        msp_price: basePrice,
        msp_triggered: mspTriggered,
        baseline_cost_per_acre: baseCost,
        stressed_cost_per_acre: Math.round(stressedCost),
        baseline_net_profit_per_acre: Math.round(baseProfit),
        stressed_net_profit_per_acre: Math.round(stressedProfit),
        profit_change_pct: Math.round(((stressedProfit - baseProfit)/Math.abs(baseProfit))*100),
        insurance_payout_per_acre: Math.round(insurancePayout),
        final_profit_with_insurance_per_acre: Math.round(finalProfit),
        resilience_score: resilience,
        resilience_tier: resilience >= 80 ? 'High' : (resilience >= 60 ? 'Moderate' : 'Low'),
        risk_summary: mspTriggered ? 'Protected by MSP floor price' : (finalProfit > 0 ? 'Positive returns retained' : 'Loss risk detected'),
        mitigation_advice: isMustard ? 'Install yellow sticky traps; maintain ridge planting.' : (isChickpea ? 'Apply Trichoderma seed treatment.' : 'Use heat-tolerant HD-3226 seeds.')
      };
    });
    
    return {
      scenario_label: 'Custom What-If Stress Scenario',
      acreage: farm.acres || 5,
      outcomes,
      best_resilience_crop: outcomes[0].crop_name,
      worst_hit_crop: outcomes[outcomes.length - 1].crop_name,
      key_takeaway: 'Low water crops like Mustard and Chickpea demonstrate significantly lower profit degradation under climate and price stress.'
    };
  };

  const chartData = (scenarioData?.outcomes || []).map(o => ({
    name: getCropName(o.crop_name, t),
    [t.baseline_profit || 'Baseline Profit']: o.baseline_net_profit_per_acre,
    [t.stressed_profit || 'Stressed Profit']: o.final_profit_with_insurance_per_acre
  }));

  return (
    <div className="whatif-container">
      {/* Header */}
      <div className="page-title">
        <div>
          <div className="eyebrow">{t.whatif_eyebrow || 'RESILIENCE STRESS-TESTING'}</div>
          <h1>{t.whatif_title || 'What-If Scenario Simulator'}</h1>
          <p>{t.whatif_desc || 'Stress-test your crop decisions against climate shocks, price crashes, and fuel inflation.'}</p>
        </div>
        <div className="title-action">
          <span className="demo-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <Zap size={14} style={{ marginRight: 4 }} />
            {t.simulation_engine || 'SIMULATION ENGINE'}
          </span>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="panel preset-panel">
        <div className="preset-head">
          <span className="preset-label">{t.whatif_preset_label || 'Crisis & Scenario Presets:'}</span>
        </div>
        <div className="preset-chips">
          <button 
            className={`preset-btn ${activePreset === 'drought' ? 'active' : ''}`}
            onClick={() => applyPreset('drought')}
          >
            <CloudRain size={14} /> {t.preset_drought || 'Drought (-30% Rain)'}
          </button>
          <button 
            className={`preset-btn ${activePreset === 'flood' ? 'active' : ''}`}
            onClick={() => applyPreset('flood')}
          >
            <Droplets size={14} /> {t.preset_flood || 'Heavy Monsoon (+35%)'}
          </button>
          <button 
            className={`preset-btn ${activePreset === 'crash' ? 'active' : ''}`}
            onClick={() => applyPreset('crash')}
          >
            <TrendingDown size={14} /> {t.preset_crash || 'Market Crash (-25% Price)'}
          </button>
          <button 
            className={`preset-btn ${activePreset === 'diesel' ? 'active' : ''}`}
            onClick={() => applyPreset('diesel')}
          >
            <Fuel size={14} /> {t.preset_diesel || 'Diesel/Cost Spike (+30%)'}
          </button>
          <button 
            className={`preset-btn ${activePreset === 'pest' ? 'active' : ''}`}
            onClick={() => applyPreset('pest')}
          >
            <Bug size={14} /> {t.preset_pest || 'Severe Pest Attack'}
          </button>
          <button 
            className={`preset-btn ${activePreset === 'insurance' ? 'active' : ''}`}
            onClick={() => applyPreset('insurance')}
          >
            <ShieldCheck size={14} /> {t.preset_insurance || 'With PMFBY Insurance'}
          </button>
          <button 
            className="preset-btn reset"
            onClick={() => applyPreset('baseline')}
          >
            <RotateCcw size={14} /> {t.preset_reset || 'Reset Baseline'}
          </button>
        </div>
      </div>

      {/* Interactive Controls & Sliders */}
      <div className="whatif-grid">
        <div className="panel controls-card">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.whatif_variables || 'VARIABLES'}</div>
              <h2>{t.whatif_controls_title || 'Stress-Testing Controls'}</h2>
            </div>
            <span className="count-pill">{crops.length} {t.crops_selected || 'crops selected'}</span>
          </div>

          {/* Crop Selector */}
          <div className="control-group">
            <label className="field-label">{t.whatif_select_crops || 'Select candidate crops to compare:'}</label>
            <div className="crop-chips">
              {availableCrops.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCrop(c)}
                  className={`crop-chip ${crops.includes(c) ? 'selected' : ''}`}
                >
                  {getCropName(c, t)} {crops.includes(c) && '✓'}
                </button>
              ))}
            </div>
          </div>

          {/* Rainfall Slider */}
          <div className="slider-control">
            <div className="slider-label">
              <span><CloudRain size={15}/> {t.slider_rain || 'Rainfall anomaly:'}</span>
              <strong className={rainfall < 0 ? 'text-danger' : (rainfall > 0 ? 'text-info' : '')}>
                {rainfall > 0 ? `+${rainfall}%` : `${rainfall}%`}
              </strong>
            </div>
            <input 
              type="range" min="-60" max="60" step="5" 
              value={rainfall} 
              onChange={e => { setRainfall(Number(e.target.value)); setActivePreset('custom'); }}
            />
            <div className="slider-marks">
              <span>{t.severe_drought || 'Severe Drought (-60%)'}</span>
              <span>{t.normal_rain || 'Normal (0%)'}</span>
              <span>{t.heavy_rain || 'Heavy Rain (+60%)'}</span>
            </div>
          </div>

          {/* Market Price Variation Slider */}
          <div className="slider-control">
            <div className="slider-label">
              <span><TrendingDown size={15}/> {t.slider_price || 'Market price variation:'}</span>
              <strong className={priceChange < 0 ? 'text-danger' : (priceChange > 0 ? 'text-success' : '')}>
                {priceChange > 0 ? `+${priceChange}%` : `${priceChange}%`}
              </strong>
            </div>
            <input 
              type="range" min="-40" max="40" step="5" 
              value={priceChange} 
              onChange={e => { setPriceChange(Number(e.target.value)); setActivePreset('custom'); }}
            />
            <div className="slider-marks">
              <span>{t.glut_crash || 'Glut/Crash (-40%)'}</span>
              <span>{t.standard_price || 'Standard (0%)'}</span>
              <span>{t.boom_price || 'Boom (+40%)'}</span>
            </div>
          </div>

          {/* Cost Inflation Slider */}
          <div className="slider-control">
            <div className="slider-label">
              <span><Fuel size={15}/> {t.slider_cost || 'Diesel & fertilizer inflation:'}</span>
              <strong className={costChange > 0 ? 'text-danger' : ''}>
                +{costChange}%
              </strong>
            </div>
            <input 
              type="range" min="0" max="50" step="5" 
              value={costChange} 
              onChange={e => { setCostChange(Number(e.target.value)); setActivePreset('custom'); }}
            />
            <div className="slider-marks">
              <span>{t.cost_stable || 'Stable (0%)'}</span>
              <span>{t.cost_moderate || 'Moderate (+25%)'}</span>
              <span>{t.cost_severe || 'Severe (+50%)'}</span>
            </div>
          </div>

          {/* Pest Severity & Insurance */}
          <div className="dual-controls">
            <div className="field">
              <span><Bug size={14}/> {t.select_pest || 'Pest outbreak:'}</span>
              <select value={pest} onChange={e => { setPest(e.target.value); setActivePreset('custom'); }}>
                <option value="none">{t.pest_none || 'None (Healthy)'}</option>
                <option value="moderate">{t.pest_moderate || 'Moderate (Aphids/Rust)'}</option>
                <option value="severe">{t.pest_severe || 'Severe (Pod borer)'}</option>
              </select>
            </div>

            <div className="field checkbox-field">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={insurance} 
                  onChange={e => { setInsurance(e.target.checked); setActivePreset('custom'); }}
                />
                <span className="checkbox-custom" />
                <div>
                  <strong>{t.toggle_insurance || 'PMFBY Crop Insurance'}</strong>
                  <small>{t.insurance_sub || 'Cushions yield shortfall below 70%'}</small>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="panel chart-card">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.whatif_side_by_side || 'SIDE-BY-SIDE SIMULATION'}</div>
              <h2>{t.whatif_chart_title || 'Baseline vs. Stressed Net Profit (₹ / acre)'}</h2>
            </div>
            <span className="demo-tag" style={{ background: '#fef3c7', color: '#92400e' }}>
              {getLocalizedScenarioLabel(activePreset, scenarioData, t)}
            </span>
          </div>

          <div className="chart-wrap" style={{ height: 280, marginTop: 15 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9e2" />
                <XAxis dataKey="name" tick={{ fill: '#4a5568', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${Math.round(v/1000)}k`} tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => money(v)} />
                <Legend />
                <Bar dataKey={t.baseline_profit || 'Baseline Profit'} fill="#a5c3a7" radius={[4, 4, 0, 0]} />
                <Bar dataKey={t.stressed_profit || 'Stressed Profit'} fill="#185b43" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Key Takeaway Callout */}
          <div className="takeaway-banner">
            <div className="takeaway-icon"><Award size={22} /></div>
            <div>
              <strong>{t.whatif_takeaway_title || 'Agronomic & Financial Stress Takeaway'}</strong>
              <p>{getLocalizedTakeaway(scenarioData, rainfall, priceChange, insurance, scenarioData?.best_resilience_crop, scenarioData?.worst_hit_crop, t)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Cards Grid */}
      <div className="results-heading" style={{ marginTop: 25 }}>
        <div>
          <h2>{t.whatif_results_title || 'Stress-Tested Crop Resilience Report'}</h2>
          <p>{t.whatif_results_sub || 'Impact on yield, pricing, MSP safety, and recommended emergency farm practices'}</p>
        </div>
      </div>

      <div className="outcome-grid">
        {(scenarioData?.outcomes || []).map((out, i) => (
          <article className="panel outcome-card" key={out.crop_name}>
            <div className="outcome-header">
              <div className="crop-badge-wrap">
                <span className="crop-mini-art">
                  {out.crop_name === 'Wheat' ? '🌾' : (out.crop_name === 'Mustard' ? '🌼' : (out.crop_name === 'Chickpea' ? '🫘' : (out.crop_name === 'Rice' ? '🌱' : '🌽')))}
                </span>
                <div>
                  <h3>{getCropName(out.crop_name, t)}</h3>
                  <span className={`resilience-pill ${out.resilience_tier.toLowerCase().replace(' ', '-')}`}>
                    {getResilienceTier(out.resilience_tier, t)} {t.resilience_word || 'Resilience'} · {out.resilience_score}/100
                  </span>
                </div>
              </div>
              <div className="profit-change">
                <small>{t.stressed_profit || 'Stressed Return'}</small>
                <strong>{money(out.final_profit_with_insurance_per_acre)}</strong>
                <span className={out.profit_change_pct < 0 ? 'text-danger' : 'text-success'}>
                  {out.profit_change_pct > 0 ? `+${out.profit_change_pct}%` : `${out.profit_change_pct}%`}
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="outcome-metrics">
              <div>
                <small>{t.yield_shift || 'Yield Shift'}</small>
                <strong>{out.stressed_yield} {t.unit_q || 'q'}</strong>
                <span className={out.yield_change_pct < 0 ? 'text-danger' : ''}>
                  {out.yield_change_pct > 0 ? `+${out.yield_change_pct}%` : `${out.yield_change_pct}%`}
                </span>
              </div>
              <div>
                <small>{t.realized_price || 'Realized Price'}</small>
                <strong>{money(out.stressed_price)}/{t.unit_q || 'q'}</strong>
                {out.msp_triggered ? (
                  <span className="msp-badge"><ShieldCheck size={12}/> {t.msp_floor_badge || 'MSP Floor'}</span>
                ) : (
                  <span>{t.market_rate || 'Market rate'}</span>
                )}
              </div>
              <div>
                <small>{t.stressed_cost || 'Stressed Cost'}</small>
                <strong>{money(out.stressed_cost_per_acre)}</strong>
                <span>{t.per_acre || 'per acre'}</span>
              </div>
              {out.insurance_payout_per_acre > 0 && (
                <div className="insurance-highlight">
                  <small>{t.pmfby_claim || 'PMFBY Claim'}</small>
                  <strong className="text-success">+{money(out.insurance_payout_per_acre)}</strong>
                  <span>{t.shortfall_covered || 'Shortfall covered'}</span>
                </div>
              )}
            </div>

            {/* Risk & Action Box */}
            <div className="outcome-advice">
              <div className="advice-row">
                <Info size={15} />
                <span>{getLocalizedRiskSummary(out, t)}</span>
              </div>
              <div className="mitigation-box">
                <strong><Zap size={13} /> {t.mitigation_action || 'Mitigation Action'}:</strong>
                <p>{getLocalizedMitigation(out, t)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
