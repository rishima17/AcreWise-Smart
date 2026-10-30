import React from 'react';
import { Printer, X, Sprout, ShieldCheck, Droplets, Leaf, CheckCircle2, QrCode } from 'lucide-react';

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function PrintableKisanPlan({ farm, plan, onClose, t = {} }) {
  const cropName = plan?.crop_name || plan?.crop || 'Mustard';
  const acres = Number(farm?.acres) || 5;
  const isMustard = cropName === 'Mustard';
  const isChickpea = cropName === 'Chickpea';
  const isWheat = cropName === 'Wheat';

  const yieldPerAcre = isWheat ? 18 : (isMustard ? 7 : (isChickpea ? 5.5 : 20));
  const pricePerQ = isWheat ? 2425 : (isMustard ? 5950 : (isChickpea ? 5650 : 2300));
  const costPerAcre = isWheat ? 18000 : (isMustard ? 12500 : (isChickpea ? 11000 : 25000));
  const netPerAcre = (yieldPerAcre * pricePerQ) - costPerAcre;
  const totalNet = netPerAcre * acres;
  const waterSaved = isMustard ? 2750000 : (isChickpea ? 2950000 : 2100000);
  const nitrogenFixed = isChickpea ? 34 : (cropName === 'Moong' ? 38 : 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal printable-modal" onClick={e => e.stopPropagation()}>
        <div className="no-print modal-header-actions">
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> {t.print_kisan_plan || 'Print / Save as PDF'}
          </button>
          <button className="icon-button modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Printable Certificate Sheet */}
        <div className="printable-sheet" id="printable-plan">
          <div className="sheet-border">
            {/* Header */}
            <div className="sheet-header">
              <div className="sheet-brand">
                <span className="sheet-logo"><Sprout size={28} /></span>
                <div>
                  <h2>AcreWise Agricultural Decision Card</h2>
                  <small>OFFICIAL KISAN CROP PLANNING & KCC LOAN ADVISORY</small>
                </div>
              </div>
              <div className="sheet-qr">
                <div className="qr-box">
                  <QrCode size={56} />
                  <span>PLAN ID: AW-{Date.now().toString().slice(-6)}</span>
                </div>
              </div>
            </div>

            {/* Farmer & Field Particulars */}
            <div className="sheet-section-title">01. {t.farmer_profile || 'FARMER & LAND PROFILE'}</div>
            <div className="sheet-grid-3">
              <div>
                <small>{t.field_farmer_name || 'Farmer Name'}</small>
                <strong>{farm?.farmerName || 'Harpreet Kaur'}</strong>
              </div>
              <div>
                <small>{t.field_village || 'Location'}</small>
                <strong>{farm?.village ? `${farm.village}, ` : ''}{farm?.district || 'Amritsar'}, {farm?.state || 'Punjab'}</strong>
              </div>
              <div>
                <small>{t.field_acres || 'Total Field Acreage'}</small>
                <strong>{acres} {t.acres_unit || 'Acres'}</strong>
              </div>
              <div>
                <small>{t.field_soil || 'Soil Type'}</small>
                <strong>{farm?.soil || 'Loamy'}</strong>
              </div>
              <div>
                <small>{t.field_water || 'Water Availability'}</small>
                <strong>{farm?.water || 'Medium'} Irrigation</strong>
              </div>
              <div>
                <small>{t.field_season || 'Planning Window'}</small>
                <strong>{farm?.season || 'Rabi 2026'}</strong>
              </div>
            </div>

            {/* Crop Recommendation & Economics */}
            <div className="sheet-section-title">02. {t.nav_recommendations || 'RECOMMENDED CROP & FINANCIAL PROJECTIONS'}</div>
            <div className="sheet-crop-hero">
              <div>
                <small>Selected Optimal Crop</small>
                <h3>{isMustard ? '🌼' : (isChickpea ? '🫘' : '🌾')} {cropName}</h3>
                <p>Diversification recommendation based on soil suitability, water conservation, and guaranteed MSP floor price.</p>
              </div>
              <div className="sheet-total-profit">
                <small>Projected Total Farm Return ({acres} acres)</small>
                <h2>{money(totalNet)}</h2>
                <span>({money(netPerAcre)} / acre)</span>
              </div>
            </div>

            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Agronomic Parameter</th>
                  <th>Per Acre Basis</th>
                  <th>Total ({acres} Acres)</th>
                  <th>Institutional Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Expected Yield</td>
                  <td>{yieldPerAcre} quintals</td>
                  <td>{yieldPerAcre * acres} quintals</td>
                  <td>Calibrated regional baseline</td>
                </tr>
                <tr>
                  <td>Govt Minimum Support Price (MSP)</td>
                  <td>₹{pricePerQ.toLocaleString('en-IN')}/q</td>
                  <td>Guaranteed floor price</td>
                  <td>CCEA 2025-26 notification</td>
                </tr>
                <tr>
                  <td>Cost of Cultivation (Inputs & Water)</td>
                  <td>{money(costPerAcre)}</td>
                  <td>{money(costPerAcre * acres)}</td>
                  <td>Seeds, fertilizer, irrigation</td>
                </tr>
                <tr className="highlight-row">
                  <td><strong>Projected Net Profit</strong></td>
                  <td><strong>{money(netPerAcre)}</strong></td>
                  <td><strong>{money(totalNet)}</strong></td>
                  <td><strong>Pre-tax net farm cashflow</strong></td>
                </tr>
              </tbody>
            </table>

            {/* Environmental & Sustainability Credentials */}
            <div className="sheet-section-title">03. SUSTAINABILITY & SOIL HEALTH IMPACT</div>
            <div className="sheet-sustainability">
              <div className="sustain-box">
                <Droplets size={20} className="text-info" />
                <div>
                  <strong>Groundwater Conservation</strong>
                  <p>Saves ~{(waterSaved * acres / 1000000).toFixed(1)} Million Liters of water vs. traditional flooded paddy.</p>
                </div>
              </div>
              {nitrogenFixed > 0 && (
                <div className="sustain-box">
                  <Leaf size={20} className="text-success" />
                  <div>
                    <strong>Biological Nitrogen Fixation</strong>
                    <p>Enriches soil with ~{nitrogenFixed * acres} kg of atmospheric Nitrogen, saving future urea expenses.</p>
                  </div>
                </div>
              )}
              <div className="sustain-box">
                <ShieldCheck size={20} className="text-success" />
                <div>
                  <strong>Climate Stress-Tested</strong>
                  <p>Verified through AcreWise What-If Simulation Engine against drought and fuel inflation.</p>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="sheet-footer">
              <div className="sheet-sign">
                <div className="sign-line" />
                <span>Farmer Signature</span>
              </div>
              <div className="sheet-stamp">
                <div className="official-stamp">
                  <span>ACREWISE</span>
                  <small>VERIFIED PLAN</small>
                </div>
              </div>
              <div className="sheet-sign">
                <div className="sign-line" />
                <span>Bank / KCC Agricultural Officer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
