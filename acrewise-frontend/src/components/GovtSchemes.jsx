import React, { useState, useEffect } from 'react';
import { 
  Landmark, ShieldCheck, ArrowUpRight, CheckCircle2, 
  HelpCircle, Calculator, ExternalLink, Award, FileText 
} from 'lucide-react';
import { fetchSchemes } from '../services/api';

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function GovtSchemes({ farm, t }) {
  const [schemesData, setSchemesData] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('Mustard');
  const [acres, setAcres] = useState(farm?.acres || 5);

  useEffect(() => {
    fetchSchemes().then(data => setSchemesData(data)).catch(() => {
      // Fallback data
      setSchemesData({
        msp_rates: [
          { crop: "Mustard / Rapeseed", season: "Rabi", msp_2024_25: 5650, msp_2025_26: 5950, increase: 300, unit: "₹ / quintal" },
          { crop: "Gram (Chickpea)", season: "Rabi", msp_2024_25: 5440, msp_2025_26: 5650, increase: 210, unit: "₹ / quintal" },
          { crop: "Wheat", season: "Rabi", msp_2024_25: 2275, msp_2025_26: 2425, increase: 150, unit: "₹ / quintal" },
          { crop: "Moong (Green Gram)", season: "Kharif/Zaid", msp_2024_25: 8558, msp_2025_26: 8768, increase: 210, unit: "₹ / quintal" },
          { crop: "Paddy (Common Rice)", season: "Kharif", msp_2024_25: 2183, msp_2025_26: 2320, increase: 137, unit: "₹ / quintal" },
          { crop: "Maize", season: "Kharif", msp_2024_25: 2090, msp_2025_26: 2225, increase: 135, unit: "₹ / quintal" }
        ],
        schemes: [
          {
            id: "crop_diversification",
            name: "Crop Diversification Scheme (Mera Pani Meri Virasat)",
            tag: "Groundwater Conservation Incentive",
            beneficiary: "Farmers shifting away from Paddy to Pulses, Oilseeds or Maize",
            benefit: "Direct Benefit Transfer (DBT) of ₹7,000 per acre paid directly into bank accounts.",
            link: "https://agricoop.gov.in",
            subsidy_pct: "₹7,000 / acre direct DBT"
          },
          {
            id: "pmfby",
            name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            tag: "Crop Loss Insurance",
            beneficiary: "All farmers growing notified food crops & oilseeds",
            benefit: "Comprehensive risk coverage. Farmer pays only 1.5% premium for Rabi and 2% for Kharif.",
            link: "https://pmfby.gov.in",
            subsidy_pct: "Govt pays up to 90% premium"
          },
          {
            id: "pm_kusum",
            name: "PM-KUSUM Solar Water Pump Scheme",
            tag: "Clean Energy & Zero Pumping Cost",
            beneficiary: "Farmers needing standalone solar irrigation systems",
            benefit: "60% government subsidy (30% Central + 30% State) on solar agricultural pumps.",
            link: "https://pmkusum.mnre.gov.in",
            subsidy_pct: "60% capital subsidy"
          },
          {
            id: "pm_kisan",
            name: "PM-KISAN Samman Nidhi",
            tag: "Direct Income Support",
            beneficiary: "All eligible landholding farmer families",
            benefit: "₹6,000 per year transferred in three equal 4-monthly installments of ₹2,000 directly to bank accounts.",
            link: "https://pmkisan.gov.in",
            subsidy_pct: "₹6,000 / year"
          }
        ]
      });
    });
  }, []);

  const rates = schemesData?.msp_rates || [];
  const schemes = schemesData?.schemes || [];

  // PMFBY calculation
  const mspRate = rates.find(r => r.crop.includes(selectedCrop))?.msp_2025_26 || 5950;
  const estimatedSumInsuredPerAcre = mspRate * (selectedCrop === 'Wheat' ? 18 : (selectedCrop === 'Mustard' ? 7 : 5.5));
  const totalSumInsured = estimatedSumInsuredPerAcre * Number(acres);
  const farmerPremiumShare = totalSumInsured * 0.015; // 1.5% for Rabi
  const govtSubsidyShare = totalSumInsured * 0.085; // ~8.5%

  return (
    <div className="schemes-page">
      <div className="page-title">
        <div>+
          <div className="eyebrow">{t.schemes_eyebrow || 'GOVERNMENT SAFETY NET & PROCUREMENT'}</div>
          <h1>{t.schemes_title || 'Minimum Support Prices & Subsidies'}</h1>
          <p>{t.schemes_desc || 'Official procurement rates, PMFBY crop insurance calculator, and key central & state farm incentives.'}</p>
        </div>
        <div className="title-action">
          <span className="demo-tag" style={{ background: '#ecfdf5', color: '#065f46' }}>
            <Landmark size={14} style={{ marginRight: 4 }} /> CCEA NOTIFIED 2025-26
          </span>
        </div>
      </div>

      {/* MSP Table */}
      <div className="panel table-panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div>
            <div className="eyebrow">{t.msp_table_eyebrow || 'MINIMUM SUPPORT PRICE (MSP) 2025-26'}</div>
            <h2>{t.msp_table_title || 'Statutory Floor Prices for Major Crops'}</h2>
            <p className="muted">{t.msp_table_sub || 'Announced by the Commission for Agricultural Costs and Prices (CACP)'}</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t.th_crop || 'Crop'}</th>
                <th>{t.th_season || 'Season'}</th>
                <th>{t.th_msp_prev || '2024-25 MSP'}</th>
                <th>{t.th_msp_curr || '2025-26 MSP'}</th>
                <th>{t.th_increase || 'Absolute Increase'}</th>
                <th>{t.th_protection || 'MSP Safety Protection'}</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={r.crop}>
                  <td><strong>{r.crop}</strong></td>
                  <td>{r.season}</td>
                  <td>₹{r.msp_2024_25.toLocaleString('en-IN')}/q</td>
                  <td className="profit-cell">₹{r.msp_2025_26.toLocaleString('en-IN')}/q</td>
                  <td><span className="text-success">+₹{r.increase}/q</span></td>
                  <td>
                    <span className="msp-badge">
                      <ShieldCheck size={12} /> {t.guaranteed_floor || 'Guaranteed Floor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insurance Calculator & Schemes Grid */}
      <div className="dashboard-grid">
        {/* PMFBY Calculator */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.pmfby_calc_eyebrow || 'PMFBY CALCULATOR'}</div>
              <h2>{t.pmfby_calc_title || 'Crop Insurance Premium Estimator'}</h2>
            </div>
            <Calculator size={20} className="text-success" />
          </div>
          <p className="muted">{t.pmfby_calc_sub || 'See how much crop loss coverage you get for a minimal 1.5% farmer contribution.'}</p>

          <div className="form-grid" style={{ marginBottom: 15 }}>
            <label className="field">
              <span>{t.select_notified_crop || 'Select Notified Crop'}</span>
              <select value={selectedCrop} onChange={e => setSelectedCrop(e.target.value)}>
                <option value="Mustard">{t.crop_mustard || 'Mustard'} (Rabi)</option>
                <option value="Gram (Chickpea)">{t.crop_chickpea || 'Chickpea'} (Rabi)</option>
                <option value="Wheat">{t.crop_wheat || 'Wheat'} (Rabi)</option>
              </select>
            </label>
            <label className="field">
              <span>{t.farm_size_acres || 'Farm Size (Acres)'}</span>
              <input type="number" min="0.5" step="0.5" value={acres} onChange={e => setAcres(e.target.value)} />
            </label>
          </div>

          <div className="review-grid">
            <div>
              <small>{t.total_sum_insured || 'Total Sum Insured (Coverage)'}</small>
              <strong style={{ color: '#185b43', fontSize: 16 }}>{money(totalSumInsured)}</strong>
            </div>
            <div>
              <small>{t.farmer_share_label || 'Farmer Premium Share (1.5%)'}</small>
              <strong style={{ color: '#b45309', fontSize: 16 }}>{money(farmerPremiumShare)}</strong>
            </div>
            <div>
              <small>{t.govt_subsidy_label || 'Govt Paid Premium Subsidy'}</small>
              <strong>{money(govtSubsidyShare)}</strong>
            </div>
            <div>
              <small>{t.coverage_scope || 'Coverage Scope'}</small>
              <strong>Pre-sowing to Harvest</strong>
            </div>
          </div>

          <div className="soft-callout">
            <ShieldCheck size={16} />
            <span>Under PMFBY, you pay only <strong>{money(farmerPremiumShare)}</strong> to insure your crop against drought, unseasonal rains, or pest attacks up to <strong>{money(totalSumInsured)}</strong>.</span>
          </div>
        </section>

        {/* Major Central & State Schemes */}
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.schemes_active_eyebrow || 'DIRECT BENEFIT TRANSFER'}</div>
              <h2>{t.active_schemes_title || 'Active Government Schemes'}</h2>
            </div>
            <Award size={20} className="text-success" />
          </div>

          <div className="schemes-list">
            {schemes.map(s => (
              <div className="scheme-item" key={s.id}>
                <div className="scheme-top">
                  <strong>{s.name}</strong>
                  <span className="count-pill">{s.subsidy_pct}</span>
                </div>
                <p>{s.benefit}</p>
                <a href={s.link} target="_blank" rel="noreferrer" className="text-link">
                  {t.official_portal || 'Official Portal'} <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
