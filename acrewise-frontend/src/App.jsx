import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sprout, LayoutDashboard, Tractor, Wheat, ChartNoAxesCombined, 
  ClipboardList, Settings2, Menu, X, ChevronRight, ArrowUpRight, 
  Droplets, Sun, CloudSun, CircleCheck, CircleAlert, Search, 
  SlidersHorizontal, Plus, Mic, Save, ExternalLink, Leaf, MapPin, 
  CalendarDays, RefreshCw, ArrowRight, Activity, ShieldCheck, Info, 
  Trash2, Zap, Landmark, Printer, Award, Sparkles 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

import { apiRequest, apiBase, fetchRecommendations } from './services/api';
import { translations } from './i18n/translations';
import WhatIfSimulator from './components/WhatIfSimulator';
import GovtSchemes from './components/GovtSchemes';
import PrintableKisanPlan from './components/PrintableKisanPlan';

const initialFarm = { 
  name: 'My Farm', 
  farmerName: 'Harpreet Kaur', 
  state: 'Punjab', 
  district: 'Amritsar', 
  village: 'Attari', 
  acres: 5, 
  soil: 'Loamy', 
  water: 'Medium', 
  previousCrop: 'Rice', 
  season: 'Rabi 2026', 
  irrigation: 'Tube well', 
  preferences: 'Low water use, high MSP security' 
};

const sampleCrops = [
  { name: 'Mustard', emoji: '🌼', yield: 7.0, price: 5950, cost: 12500, water: 'Low', suitability: 'High', outlook: 'MSP Backed', risk: 'Aphids at flowering', reason: 'Conserves 2.75M Liters of groundwater vs paddy; protected by official ₹5,950/q MSP.', assumptions: 'Calibrated regional baseline; high market demand for domestic edible oil.', score: 92, water_saved_liters_per_acre: 2750000, nitrogen_fixation_kg_per_acre: 0, msp_price: 5950 },
  { name: 'Chickpea', emoji: '🫘', yield: 5.5, price: 5650, cost: 11000, water: 'Low', suitability: 'High', outlook: 'Supportive', risk: 'Waterlogging & pod borer', reason: 'Exceptional pulse option: naturally fixes 34 kg N/acre and drastically cuts next season urea costs.', assumptions: 'Rhizobium inoculation recommended; drought hardy deep root architecture.', score: 88, water_saved_liters_per_acre: 2950000, nitrogen_fixation_kg_per_acre: 34, msp_price: 5650 },
  { name: 'Wheat', emoji: '🌾', yield: 18.0, price: 2425, cost: 18000, water: 'Medium', suitability: 'High', outlook: 'Guaranteed Procurement', risk: 'Terminal heat stress in March', reason: 'Traditional staple crop with guaranteed FCI/mandi procurement at ₹2,425/q MSP.', assumptions: 'Zero-tillage recommended to preserve residual paddy moisture.', score: 85, water_saved_liters_per_acre: 2100000, nitrogen_fixation_kg_per_acre: 0, msp_price: 2425 },
  { name: 'Moong', emoji: '🌱', yield: 4.5, price: 8768, cost: 9500, water: 'Low', suitability: 'Good', outlook: 'High Value', risk: 'Pre-monsoon showers at harvest', reason: 'High-value 60-day catch crop that enriches soil with 38 kg N/acre.', assumptions: 'Short maturity window between wheat and paddy.', score: 76, water_saved_liters_per_acre: 3020000, nitrogen_fixation_kg_per_acre: 38, msp_price: 8768 },
  { name: 'Maize', emoji: '🌽', yield: 22.0, price: 2225, cost: 17000, water: 'Medium', suitability: 'Moderate', outlook: 'Industrial Demand', risk: 'Fall armyworm pest', reason: 'Alternative cereal option with silage and poultry feed demand.', assumptions: 'Needs local procurement tie-up.', score: 72, water_saved_liters_per_acre: 2300000, nitrogen_fixation_kg_per_acre: 0, msp_price: 2225 },
  { name: 'Rice', emoji: '🌾', yield: 25.0, price: 2320, cost: 29000, water: 'High', suitability: 'Moderate', outlook: 'Water Intensive', risk: 'Critical groundwater depletion', reason: 'High water-table strain in Punjab; consider transitioning to lower-water alternatives.', assumptions: 'Standard flood irrigation consumes 3.5 million liters per acre.', score: 62, water_saved_liters_per_acre: 0, nitrogen_fixation_kg_per_acre: 0, msp_price: 2320 }
];

const marketSeries = [
  { month: 'Jan', wheat: 2275, mustard: 5500, chickpea: 5400 },
  { month: 'Feb', wheat: 2310, mustard: 5650, chickpea: 5500 },
  { month: 'Mar', wheat: 2390, mustard: 5750, chickpea: 5580 },
  { month: 'Apr', wheat: 2360, mustard: 5800, chickpea: 5520 },
  { month: 'May', wheat: 2410, mustard: 5900, chickpea: 5650 },
  { month: 'Jun', wheat: 2380, mustard: 5850, chickpea: 5600 },
  { month: 'Jul', wheat: 2430, mustard: 5920, chickpea: 5680 },
  { month: 'Aug', wheat: 2400, mustard: 5890, chickpea: 5650 },
  { month: 'Sep', wheat: 2420, mustard: 5920, chickpea: 5600 },
  { month: 'Oct', wheat: 2450, mustard: 5950, chickpea: 5650 },
  { month: 'Nov', wheat: 2425, mustard: 5950, chickpea: 5650 },
  { month: 'Dec', wheat: 2460, mustard: 6020, chickpea: 5720 }
];

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const getCropName = (cropName, t) => {
  if (!cropName) return '';
  const key = `crop_${cropName.toLowerCase()}`;
  return t[key] || cropName;
};

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('acrewise-lang') || 'en');
  const t = translations[lang] || translations.en;

  const [farm, setFarm] = useState(() => JSON.parse(localStorage.getItem('acrewise-farm') || 'null') || initialFarm);
  const [plans, setPlans] = useState(() => JSON.parse(localStorage.getItem('acrewise-plans') || '[]'));
  const [intents, setIntents] = useState(() => JSON.parse(localStorage.getItem('acrewise-intents') || '[]'));
  const [notice, setNotice] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  // Printable Modal State
  const [printModalPlan, setPrintModalPlan] = useState(null);

  useEffect(() => { localStorage.setItem('acrewise-lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('acrewise-farm', JSON.stringify(farm)); }, [farm]);
  useEffect(() => { localStorage.setItem('acrewise-plans', JSON.stringify(plans)); }, [plans]);
  useEffect(() => { localStorage.setItem('acrewise-intents', JSON.stringify(intents)); }, [intents]);

  useEffect(() => {
    apiRequest('/health')
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('demo'));
  }, []);

  const toast = msg => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const savePlan = (crop) => {
    const newPlan = {
      id: Date.now(),
      crop: crop.name || crop.crop_name,
      season: farm.season,
      acres: Number(farm.acres) || 1,
      date: new Date().toLocaleDateString('en-IN'),
      status: 'Planned',
      actual: null
    };
    setPlans(p => [newPlan, ...p]);
    toast(`${getCropName(newPlan.crop, t)} ${t.save_plan_toast || 'plan saved'}`);
  };

  const nav = [
    ['/dashboard', t.nav_overview || 'Overview', LayoutDashboard],
    ['/farm', t.nav_farm || 'My Farm', Tractor],
    ['/recommendations', t.nav_recommendations || 'Crop recommendations', Sprout],
    ['/whatif', t.nav_whatif || 'What-If Simulator', Zap, true],
    ['/compare', t.nav_compare || 'Profit calculator', ChartNoAxesCombined],
    ['/schemes', t.nav_schemes || 'Govt Schemes & MSP', Landmark],
    ['/market', t.nav_market || 'Market intelligence', Wheat],
    ['/plans', t.nav_plans || 'Plans & feedback', ClipboardList],
    ['/fpo', t.nav_fpo || 'FPO / Officer view', Activity]
  ];

  const loc = useLocation();
  useEffect(() => setMobileOpen(false), [loc.pathname]);

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><Sprout size={23} /></span>
          <span>AcreWise<small>{t.brand_sub || 'SMART CROP PLANNING'}</small></span>
          <button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X />
          </button>
        </div>

        <div className="workspace-label">{t.workspace || 'WORKSPACE'}</div>
        <nav>
          {nav.map(([to, label, Icon, isNew]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              {isNew && <span className="count-pill" style={{ marginLeft: 'auto', background: '#fef08a', color: '#854d0e', padding: '2px 5px', fontSize: 9 }}>{t.badge_new || 'NEW'}</span>}
              {to === '/recommendations' && !isNew && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="region-box">
            <MapPin size={16} />
            <div>
              <strong>{t.punjab_india || 'Punjab, India'}</strong>
              <small>{t.pilot_region || 'Initial pilot region'}</small>
            </div>
          </div>
          <div className="data-note">
            <span className="status-dot" style={{ background: apiStatus === 'connected' ? '#22c55e' : '#eab308' }} /> 
            {apiStatus === 'connected' ? (t.api_connected || 'API connected') : (t.demo_mode || 'Demo mode')}
            <small>{apiStatus === 'connected' ? 'FastAPI 0.1.0 Ready' : `API: ${apiBase}`}</small>
          </div>
          <div className="profile-mini">
            <div className="avatar">HK</div>
            <div>
              <strong>{farm.farmerName || 'Harpreet Kaur'}</strong>
              <small>{farm.district || 'Amritsar'}, {farm.state || 'Punjab'}</small>
            </div>
            <Settings2 size={17} />
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="main-column">
        {/* Top Header */}
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          
          <div className="breadcrumb">
            {t.workspace || 'Workspace'} <ChevronRight size={14} />
            <strong>{nav.find(n => n[0] === loc.pathname)?.[1] || 'AcreWise'}</strong>
          </div>

          <div className="top-actions">
            {/* Language Switcher */}
            <div className="lang-switcher" title="Switch Language">
              <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English</button>
              <button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')}>हिन्दी</button>
              <button className={`lang-btn ${lang === 'pa' ? 'active' : ''}`} onClick={() => setLang('pa')}>ਪੰਜਾਬੀ</button>
            </div>

            <span className={`mode-pill ${apiStatus === 'connected' ? 'connected' : ''}`}>
              <span /> {apiStatus === 'connected' ? (t.api_connected || 'API connected') : (t.demo_mode || 'Demo data')}
            </span>

            <button className="season-chip" onClick={() => toast('Planning season can be updated in My Farm')}>
              <CalendarDays size={15} />{farm.season}
            </button>

            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 11px', fontSize: 11 }}
              onClick={() => setPrintModalPlan(sampleCrops[0])}
            >
              <Printer size={14} /> {t.print_kisan_plan || 'Export Plan'}
            </button>
          </div>
        </header>

        {/* Page Content View Router */}
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Landing t={t} />} />
            <Route path="/dashboard" element={<Dashboard farm={farm} plans={plans} apiStatus={apiStatus} onPlan={() => savePlan(sampleCrops[0])} t={t} />} />
            <Route path="/farm" element={<FarmPage farm={farm} setFarm={setFarm} toast={toast} t={t} />} />
            <Route path="/recommendations" element={<Recommendations farm={farm} onSave={savePlan} toast={toast} onPrint={(c) => setPrintModalPlan(c)} t={t} />} />
            <Route path="/whatif" element={<WhatIfSimulator farm={farm} t={t} toast={toast} />} />
            <Route path="/compare" element={<Compare t={t} />} />
            <Route path="/schemes" element={<GovtSchemes farm={farm} t={t} />} />
            <Route path="/market" element={<Market intents={intents} setIntents={setIntents} farm={farm} toast={toast} t={t} />} />
            <Route path="/plans" element={<Plans plans={plans} setPlans={setPlans} toast={toast} t={t} onPrint={(p) => setPrintModalPlan(p)} />} />
            <Route path="/fpo" element={<Fpo t={t} />} />
            <Route path="*" element={<Dashboard farm={farm} plans={plans} apiStatus={apiStatus} onPlan={() => savePlan(sampleCrops[0])} t={t} />} />
          </Routes>
        </main>

        <footer className="footer">
          <span>{t.footer_tagline || '© AcreWise · The Right Crop for Every Acre · Empowering Indian Farmers.'}</span>
          <span><Info size={13} /> {t.footer_sub || 'Built with transparent agronomic rules & verified CCEA MSP floors.'}</span>
        </footer>
      </div>

      {/* Printable Kisan Plan Certificate Modal */}
      {printModalPlan && (
        <PrintableKisanPlan 
          farm={farm} 
          plan={printModalPlan} 
          t={t}
          onClose={() => setPrintModalPlan(null)} 
        />
      )}

      {/* Mobile Scrim */}
      {mobileOpen && (
        <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
      )}

      {/* Toast Notification */}
      {notice && (
        <div className="toast">
          <CircleCheck size={18} />{notice}
        </div>
      )}
    </div>
  );
}

function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="title-action">{action}</div>}
    </div>
  );
}

function Button({ children, kind = 'primary', ...props }) {
  return <button className={`btn btn-${kind}`} {...props}>{children}</button>;
}

function Stat({ label, value, sub, icon: Icon, kind = '' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${kind}`}>{Icon && <Icon size={19} />}</div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

function Landing({ t }) {
  const go = useNavigate();
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="kicker"><Sprout size={14} /> {t.hero_kicker}</span>
          <h1>{t.hero_title_1}<br /><em>{t.hero_title_2}</em> {t.hero_title_3}</h1>
          <p>{t.hero_desc}</p>
          <div className="hero-actions">
            <Button onClick={() => go('/farm')}>{t.btn_setup} <ArrowRight size={17} /></Button>
            <Button kind="secondary" onClick={() => go('/whatif')}>{t.nav_whatif || 'Explore What-If Lab'} <Zap size={15} /></Button>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={16} /> {t.trust_explain}</span>
            <span><Droplets size={16} /> {t.trust_water}</span>
            <span><Zap size={16} /> {t.trust_whatif}</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="sun-disc" />
          <div className="field field-back" />
          <div className="field field-mid" />
          <div className="field field-front" />
          <div className="hero-note">
            <div className="note-icon"><Leaf size={18} /></div>
            <div>
              <strong>Every acre has a destiny.</strong>
              <small>Calibrated for soil, water, and climate resilience.</small>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <div className="hero-caption">CLIMATE-RESILIENT SMART FARMING</div>
        </div>
      </section>

      <section className="landing-stats">
        <div><strong>01</strong><span>{t.farm_step2_label || 'Understand Field Conditions'}</span></div>
        <div><strong>02</strong><span>{t.whatif_title || 'Stress-Test What-If Scenarios'}</span></div>
        <div><strong>03</strong><span>{t.table_msp || 'Guaranteed MSP Floor Plan'}</span></div>
      </section>

      <section className="feature-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{t.rec_eyebrow || 'A COMPLETE DECISION PLATFORM'}</div>
            <h2>{t.hero_title_1} {t.hero_title_2} {t.hero_title_3}</h2>
          </div>
          <p>{t.hero_desc}</p>
        </div>
        <div className="feature-grid">
          <Feature icon={Sprout} number="01" title={t.farm_step2_label || "Soil & Water Fit"} text={t.farm_desc_step2 || "Evaluate root aeration, water status, and regional suitability."} />
          <Feature icon={Zap} number="02" title={t.whatif_title || "What-If Stress Testing"} text={t.whatif_desc || "Simulate droughts, floods, mandi price crashes, and fuel inflation."} />
          <Feature icon={Landmark} number="03" title={t.schemes_title || "Govt MSP Safety Net"} text={t.schemes_desc || "Protect your cash-flow with official 2025-26 statutory minimum prices."} />
          <Feature icon={Leaf} number="04" title={t.table_nitrogen || "Bio-Nitrogen Credits"} text={t.rec_modal_nitrogen || "Track atmospheric nitrogen fixation from legumes to cut fertilizer costs."} />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, number, title, text }) {
  return (
    <div className="feature">
      <div className="feature-top"><Icon size={20} /><span>{number}</span></div>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowUpRight className="feature-arrow" size={18} />
    </div>
  );
}

function Dashboard({ farm, plans, apiStatus, onPlan, t }) {
  const go = useNavigate();
  return (
    <>
      <PageTitle 
        eyebrow={t.dash_eyebrow || "YOUR FARM AT A GLANCE"} 
        title={`${t.dash_greeting || 'Good day'}, ${farm.farmerName ? farm.farmerName.split(' ')[0] : (t.farmer_profile || 'Farmer')}.`} 
        description={t.dash_desc || "A clear picture of your field, water-resilient options, and the season ahead."} 
        action={<Button onClick={() => go('/recommendations')}>{t.dash_plan_next || "Plan my next crop"} <ArrowRight size={16} /></Button>} 
      />

      <div className="notice-bar">
        <div className="notice-symbol"><Info size={17} /></div>
        <div>
          <strong>{apiStatus === 'connected' ? (t.dash_connected_title || 'Connected to AcreWise Live FastAPI Engine') : (t.dash_demo_title || 'Exploring in demo mode')}</strong>
          <span>{apiStatus === 'connected' ? (t.dash_connected_desc || 'FastAPI backend is active with live SQLite persistence, What-If simulation engine, and CACP MSP baselines.') : (t.dash_demo_desc || 'Sample data active. Launch backend on port 8000 for live model persistence.')}</span>
        </div>
        <button onClick={() => go('/whatif')}>{t.nav_whatif || 'Test What-If'} <Zap size={14} /></button>
      </div>

      <div className="stat-grid">
        <Stat label={t.dash_stat_size || "Farm size"} value={`${farm.acres || 5} ${t.acres_unit || 'acres'}`} sub={t.dash_stat_size_sub || "Your current profile"} icon={Tractor} />
        <Stat label={t.dash_stat_water || "Water status"} value={farm.water === 'Low' ? (t.water_low || 'Low') : (farm.water === 'High' ? (t.water_high || 'High') : (t.water_medium || 'Medium'))} sub={t.dash_stat_water_sub || "Farmer provided"} icon={Droplets} kind="sage" />
        <Stat label={t.dash_stat_season || "Season"} value={farm.season || 'Rabi 2026'} sub={t.dash_stat_season_sub || "Planning window"} icon={CalendarDays} kind="amber" />
        <Stat label={t.dash_stat_plans || "Saved plans"} value={plans.length} sub={t.dash_stat_plans_sub || "Ready for KCC export"} icon={ClipboardList} kind="blue" />
      </div>

      <div className="dashboard-grid">
        {/* Recommended Crops */}
        <section className="panel recommendation-panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.dash_rec_eyebrow || "DIVERSIFICATION LEADERS"}</div>
              <h2>{t.dash_rec_title || "High-Resilience Crop Options"}</h2>
            </div>
            <button className="text-link" onClick={() => go('/recommendations')}>{t.dash_view_all || "View all"} <ArrowRight size={15} /></button>
          </div>
          <p className="muted">{t.dash_rec_sub || `Ranked candidates for your ${farm.soil || 'Loamy'} soil and ${farm.water || 'Medium'} water profile.`}</p>

          {sampleCrops.slice(0, 3).map((c, i) => (
            <div className="mini-crop" key={c.name}>
              <div className="crop-illustration">{c.emoji}</div>
              <div className="mini-crop-name">
                <strong>{getCropName(c.name, t)}</strong>
                <span>{c.suitability} {t.suitability || 'suitability'} · {c.water} {t.table_water_req || 'water'} · MSP ₹{c.msp_price}/q</span>
              </div>
              <div className="mini-crop-profit">
                <small>{t.est_net_acre || "Est. net / acre"}</small>
                <strong>{money((c.yield * c.price) - c.cost)}</strong>
              </div>
              <span className={`rank rank-${i + 1}`}>0{i + 1}</span>
            </div>
          ))}

          <Button kind="secondary" onClick={() => go('/recommendations')} block>
            {t.rec_explore_all || "Explore all recommendations"} <ArrowRight size={16} />
          </Button>
        </section>

        {/* Climate & Weather */}
        <section className="panel weather-panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.dash_weather_eyebrow || "CLIMATE CONTEXT"}</div>
              <h2>{t.dash_weather_title || "Weather & Seasonal Outlook"}</h2>
            </div>
            <span className="demo-tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>IMD RADAR</span>
          </div>
          <div className="weather-main">
            <div>
              <CloudSun size={37} />
              <strong>28°<small>C</small></strong>
              <span>{t.weather_condition || "Partly cloudy · Fair"}</span>
            </div>
            <div className="weather-location">
              <MapPin size={14} /> {farm.district || 'Amritsar'}, {farm.state || 'Punjab'}
              <small>{farm.season || 'Rabi 2026'} {t.sowing_window || 'sowing window'}</small>
            </div>
          </div>
          <div className="weather-facts">
            <div><Droplets size={16} /><span>{t.groundwater_index || "Groundwater index"}</span><strong>{t.critical_water || "Critical (Overexploited)"}</strong></div>
            <div><Sun size={16} /><span>{t.terminal_heat || "Terminal heat risk"}</span><strong>{t.watch_heat || "Watch (Mid-March)"}</strong></div>
          </div>
          <div className="soft-callout">
            <Zap size={16} />
            <span>{t.weather_callout || "Switching to Mustard or Chickpea saves ~2.8M liters of groundwater per acre and protects against tube-well electricity outages."}</span>
          </div>
        </section>

        {/* What-If Shortcut */}
        <section className="panel insight-panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.whatif_eyebrow || "WHAT-IF ENGINE"}</div>
              <h2>{t.dash_whatif_card_title || "Stress-Test Your Next Season"}</h2>
            </div>
            <Zap size={20} className="text-warning" />
          </div>
          <div className="insight-row">
            <div className="insight-icon"><CloudSun size={19} /></div>
            <div>
              <strong>{t.dash_whatif_drought || "Simulate Drought / Monsoon Deficit"}</strong>
              <span>{t.dash_whatif_drought_sub || "Test how a -30% rainfall shortage impacts your yield and pumping costs."}</span>
            </div>
            <button onClick={() => go('/whatif')}><ChevronRight size={18} /></button>
          </div>
          <div className="insight-row">
            <div className="insight-icon"><Landmark size={19} /></div>
            <div>
              <strong>{t.dash_whatif_crash || "Mandi Price Crash & MSP Safety"}</strong>
              <span>{t.dash_whatif_crash_sub || "See how statutory MSP procurement protects your farm from market price drops."}</span>
            </div>
            <button onClick={() => go('/whatif')}><ChevronRight size={18} /></button>
          </div>
        </section>

        {/* Recent Plans */}
        <section className="panel plans-panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">{t.dash_plans_eyebrow || "SAVED WORKSPACE"}</div>
              <h2>{t.dash_recent_plans || "Active Crop Plans"}</h2>
            </div>
            <button className="text-link" onClick={() => go('/plans')}>{t.dash_view_all_plans || "All plans"} <ArrowRight size={15} /></button>
          </div>
          {plans.length ? plans.slice(0, 3).map(p => (
            <div className="plan-row" key={p.id}>
              <span className="plan-icon"><Sprout size={18} /></span>
              <div>
                <strong>{getCropName(p.crop, t)}</strong>
                <small>{p.season} · {p.acres} {t.acres_unit || 'acres'} · {p.date}</small>
              </div>
              <span className="plan-status">{p.status}</span>
            </div>
          )) : (
            <div className="empty-state">
              <div className="empty-icon"><ClipboardList size={21} /></div>
              <strong>{t.dash_no_plans || "No saved plans yet"}</strong>
              <p>{t.dash_no_plans_sub || "Save a recommended crop to export your official Kisan Plan."}</p>
              <button className="text-link" onClick={() => go('/recommendations')}>{t.dash_find_first || "Find your first plan"} <ArrowRight size={15} /></button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function FarmPage({ farm, setFarm, toast, t }) {
  const [step, setStep] = useState(1);
  const [voiceMsg, setVoiceMsg] = useState('');
  const change = (key, val) => setFarm(f => ({ ...f, [key]: val }));

  function voice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceMsg('Voice input is not supported in this browser. Please type your answer.');
      return;
    }
    const r = new SR();
    r.lang = farm.state === 'Punjab' ? 'pa-IN' : 'en-IN';
    r.onresult = e => {
      const text = e.results[0][0].transcript;
      change('village', text);
      setVoiceMsg(`Recognized: “${text}”`);
    };
    r.onerror = () => setVoiceMsg('Voice input could not be completed. Please type instead.');
    r.start();
    setVoiceMsg('Listening… speak your village or location.');
  }

  return (
    <>
      <PageTitle 
        eyebrow={t.farmer_profile || "FARM PROFILE"} 
        title={t.farm_title || "Start with your farm."} 
        description={t.farm_desc || "Share what you know about your land, water access, and previous crops."} 
        action={<span className="step-indicator">{t.farm_step || 'STEP'} {step} {t.farm_of || 'OF'} 3</span>} 
      />

      <div className="form-layout">
        <div className="panel form-panel">
          <div className="stepper">
            <div className={`step ${step >= 1 ? 'current' : ''}`}>
              <span>1</span>
              <div><strong>{t.farm_step1_label || 'About you'}</strong><small>{t.farm_step1_sub || 'Location & farm size'}</small></div>
            </div>
            <div className="step-line" />
            <div className={`step ${step >= 2 ? 'current' : ''}`}>
              <span>2</span>
              <div><strong>{t.farm_step2_label || 'Farm conditions'}</strong><small>{t.farm_step2_sub || 'Soil & water'}</small></div>
            </div>
            <div className="step-line" />
            <div className={`step ${step >= 3 ? 'current' : ''}`}>
              <span>3</span>
              <div><strong>{t.farm_step3_label || 'Review'}</strong><small>{t.farm_step3_sub || 'Confirm details'}</small></div>
            </div>
          </div>

          {step === 1 && (
            <>
              <h2>{t.farm_h2_step1 || 'Where is your farm?'}</h2>
              <p className="muted">{t.farm_desc_step1 || 'Location helps calibrate local weather, soil zone, and mandi distances.'}</p>
              <div className="form-grid">
                <Field label={t.field_farmer_name || 'Farmer name'} hint={t.field_farmer_name_hint || 'Appears on Kisan Card'}>
                  <input value={farm.farmerName} onChange={e => change('farmerName', e.target.value)} placeholder="Harpreet Kaur" />
                </Field>
                <Field label={t.field_state || 'State'} required>
                  <select value={farm.state} onChange={e => change('state', e.target.value)}>
                    <option>Punjab</option>
                    <option>Haryana</option>
                    <option>Uttar Pradesh</option>
                    <option>Rajasthan</option>
                  </select>
                </Field>
                <Field label={t.field_district || 'District'} required>
                  <input value={farm.district} onChange={e => change('district', e.target.value)} required placeholder="e.g. Amritsar" />
                </Field>
                <Field label={t.field_village || 'Village / block'} hint={t.field_village_hint || 'Click mic to speak'}>
                  <div className="input-with-action">
                    <input value={farm.village} onChange={e => change('village', e.target.value)} placeholder="Village name (e.g. Attari)" />
                    <button type="button" onClick={voice} aria-label="Use voice input"><Mic size={17} /></button>
                  </div>
                  {voiceMsg && <small className="field-note">{voiceMsg}</small>}
                </Field>
                <Field label={t.field_acres || 'Farm size (acres)'} required>
                  <input type="number" min="0.1" step="0.5" value={farm.acres} onChange={e => change('acres', e.target.value)} />
                </Field>
                <Field label={t.field_pref_lang || 'Preferred language'}>
                  <select value={farm.language || 'English'} onChange={e => change('language', e.target.value)}>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Punjabi</option>
                  </select>
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>{t.farm_h2_step2 || 'Tell us about your fields.'}</h2>
              <p className="muted">{t.farm_desc_step2 || 'These details help compare suitability, water conservation, and soil health.'}</p>
              <div className="form-grid">
                <Field label={t.field_soil || 'Soil type'} hint={t.field_soil_hint || 'Choose unknown if unsure'}>
                  <select value={farm.soil} onChange={e => change('soil', e.target.value)}>
                    {['Unknown', 'Loamy', 'Clay', 'Sandy', 'Silty', 'Black soil'].map(x => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label={t.field_water || 'Water availability'} required>
                  <select value={farm.water} onChange={e => change('water', e.target.value)}>
                    <option value="Low">{t.water_low || 'Low'}</option>
                    <option value="Medium">{t.water_medium || 'Medium'}</option>
                    <option value="High">{t.water_high || 'High'}</option>
                  </select>
                </Field>
                <Field label={t.field_prev_crop || 'Previous crop'}>
                  <select value={farm.previousCrop} onChange={e => change('previousCrop', e.target.value)}>
                    {['Unknown', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Mustard', 'Pulses'].map(x => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label={t.field_season || 'Planning season'}>
                  <select value={farm.season} onChange={e => change('season', e.target.value)}>
                    {['Rabi 2026', 'Kharif 2026', 'Zaid 2027', 'Rabi 2027'].map(x => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label={t.field_irrigation || 'Irrigation method'}>
                  <select value={farm.irrigation} onChange={e => change('irrigation', e.target.value)}>
                    {['Unknown', 'Tube well', 'Canal', 'Rain-fed', 'Drip', 'Sprinkler'].map(x => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label={t.field_pref || 'Farming preferences'} hint={t.field_pref_hint || 'Optional'}>
                  <input value={farm.preferences} onChange={e => change('preferences', e.target.value)} placeholder="e.g. lower water use, high MSP" />
                </Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="review-icon"><CircleCheck size={25} /></div>
              <h2>{t.farm_h2_step3 || 'Your Farm Profile Summary'}</h2>
              <p className="muted">{t.farm_desc_step3 || 'Review details before exploring recommendations and What-If simulations.'}</p>
              <div className="review-grid">
                {[
                  [t.farmer_profile || 'Farmer', farm.farmerName || 'Harpreet Kaur'],
                  [t.field_village || 'Location', `${farm.village ? farm.village + ', ' : ''}${farm.district}, ${farm.state}`],
                  [t.field_acres || 'Farm size', `${farm.acres} ${t.acres_unit || 'acres'}`],
                  [t.field_soil || 'Soil profile', farm.soil],
                  [t.field_water || 'Water status', farm.water],
                  [t.field_prev_crop || 'Previous crop', farm.previousCrop],
                  [t.field_season || 'Planning season', farm.season],
                  [t.field_irrigation || 'Irrigation source', farm.irrigation]
                ].map(([k, v]) => (
                  <div key={k}><small>{k}</small><strong>{v}</strong></div>
                ))}
              </div>
              <div className="soft-callout">
                <Info size={16} /> {t.profile_synced || 'Saved on this device and synchronized with the local AcreWise FastAPI database.'}
              </div>
            </>
          )}

          <div className="form-actions">
            {step > 1 && <Button kind="secondary" onClick={() => setStep(s => s - 1)}>{t.btn_back || 'Back'}</Button>}
            <span className="form-hint">{t.req_fields_note || '* Required fields · You can update these anytime'}</span>
            {step < 3 ? (
              <Button onClick={() => {
                if (step === 1 && (!farm.district.trim() || Number(farm.acres) <= 0)) {
                  toast('Enter a district and a valid farm size');
                  return;
                }
                setStep(s => s + 1);
              }}>
                {t.btn_continue || 'Continue'} <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={() => {
                toast('Farm profile saved successfully');
                window.location.href = '/recommendations';
              }}>
                {t.btn_save_profile || 'Save & Get Recommendations'} <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>

        <aside className="panel help-panel">
          <div className="help-icon"><Sprout size={21} /></div>
          <h3>{t.why_we_ask || 'Why we ask'}</h3>
          <p>{t.why_ask_desc || 'AcreWise aligns crop water demand with your water table to prevent tubewell failure.'}</p>
          <div className="help-rule" />
          <ul>
            <li>{t.why_ask_bullet1 || 'Soil and season dictate biological suitability.'}</li>
            <li>{t.why_ask_bullet2 || 'Legumes after rice/wheat restore natural nitrogen.'}</li>
            <li>{t.why_ask_bullet3 || 'What-If engine tests price crashes and droughts for your acreage.'}</li>
          </ul>
        </aside>
      </div>
    </>
  );
}

function Field({ label, children, hint, required }) {
  return (
    <label className="field">
      <span>{label}{required && <b> *</b>}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Recommendations({ farm, onSave, toast, onPrint, t }) {
  const [season, setSeason] = useState(farm.season || 'Rabi 2026');
  const [filter, setFilter] = useState('All crops');
  const [sort, setSort] = useState('Recommended');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(sampleCrops);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);

  async function getRecs() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRecommendations(farm, season);
      if (data && Array.isArray(data.candidates) && data.candidates.length) {
        const enriched = data.candidates.map((c, i) => ({
          ...sampleCrops.find(s => s.name.toLowerCase() === c.crop_name.toLowerCase()) || sampleCrops[i % sampleCrops.length],
          name: c.crop_name,
          emoji: c.crop_name === 'Mustard' ? '🌼' : (c.crop_name === 'Chickpea' ? '🫘' : (c.crop_name === 'Wheat' ? '🌾' : (c.crop_name === 'Moong' ? '🌱' : '🌽'))),
          yield: c.expected_yield_per_acre,
          price: c.expected_price_per_unit,
          cost: c.cultivation_cost_per_acre,
          water: c.water_need,
          suitability: c.suitability,
          outlook: c.market_outlook,
          score: c.score,
          water_saved_liters_per_acre: c.water_saved_liters_per_acre || 0,
          nitrogen_fixation_kg_per_acre: c.nitrogen_fixation_kg_per_acre || 0,
          msp_price: c.msp_price || c.expected_price_per_unit,
          reason: c.reasons?.join(' ') || 'Agronomically aligned.',
          assumptions: c.assumptions?.join(' ') || 'Regional baseline.'
        }));
        setResult(enriched);
        toast('Live recommendations loaded from FastAPI engine!');
      } else {
        setResult(sampleCrops);
      }
    } catch (e) {
      console.warn('Live API request failed, showing calibrated demo fallback', e);
      setError(`Notice: Using calibrated local rules (${e.message}).`);
      setResult(sampleCrops);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getRecs();
  }, [season]);

  let rows = result.filter(c => 
    (filter === 'All crops' || (filter === 'Low water' && c.water.toLowerCase() === 'low') || (filter === 'High suitability' && ['high', 'good'].includes(c.suitability.toLowerCase()))) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (sort === 'Highest estimated profit') rows.sort((a, b) => (b.yield * b.price - b.cost) - (a.yield * a.price - a.cost));
  if (sort === 'Lowest water use') rows.sort((a, b) => ({ low: 1, medium: 2, high: 3 }[a.water.toLowerCase()] || 2) - ({ low: 1, medium: 2, high: 3 }[b.water.toLowerCase()] || 2));

  return (
    <>
      <PageTitle 
        eyebrow={t.rec_eyebrow || "DECISION SUPPORT ENGINE"} 
        title={t.rec_title || "Find your next crop."} 
        description={t.rec_desc || "Ranked crop candidates with water footprint savings, bio-nitrogen fixation, and guaranteed MSP floor protection."} 
        action={<span className="demo-tag" style={{ background: '#ecfdf5', color: '#065f46' }}>EXPLAINABLE ENGINE</span>} 
      />

      <div className="notice-bar">
        <div className="notice-symbol"><Sprout size={18} /></div>
        <div>
          <strong>{t.rec_field_label || 'Field profile'}: {farm.farmerName || 'Harpreet Kaur'}</strong>
          <span>{farm.acres} {t.acres_unit || 'acres'} · {farm.district}, {farm.state} · {farm.soil} · {farm.water}</span>
        </div>
        <NavLink to="/farm" className="notice-action">{t.edit_farm || 'Edit profile'} <ArrowRight size={15} /></NavLink>
      </div>

      <div className="panel rec-controls">
        <div className="control-field">
          <label>{t.field_season || 'Planning season'}</label>
          <select value={season} onChange={e => setSeason(e.target.value)}>
            {['Rabi 2026', 'Kharif 2026', 'Zaid 2027', 'Rabi 2027'].map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="control-field">
          <label>{t.rec_filter_label || 'Filter crops'}</label>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="All crops">{t.rec_filter_all || 'All crops'}</option>
            <option value="Low water">{t.rec_filter_low_water || 'Low water'}</option>
            <option value="High suitability">{t.rec_filter_high_suit || 'High suitability'}</option>
          </select>
        </div>
        <div className="control-field">
          <label>{t.rec_sort_label || 'Sort by'}</label>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="Recommended">{t.rec_sort_recommended || 'Recommended'}</option>
            <option value="Highest estimated profit">{t.rec_sort_profit || 'Highest estimated profit'}</option>
            <option value="Lowest water use">{t.rec_sort_water || 'Lowest water use'}</option>
          </select>
        </div>
        <div className="control-search">
          <Search size={17} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.rec_search_ph || "Search crops…"} />
        </div>
        <Button onClick={getRecs} disabled={loading}>
          {loading ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />} 
          {loading ? 'Calculating…' : (t.rec_refresh_btn || 'Refresh')}
        </Button>
      </div>

      {error && <div className="inline-warning"><CircleAlert size={17} />{error}</div>}

      <div className="results-heading">
        <div>
          <h2>{rows.length} {t.rec_options_count || 'crop options evaluated'}</h2>
          <p>{t.rec_options_sub || 'Ranked for exploration · Soil-matched & water-conscious'}</p>
        </div>
        <div className="selection-count">
          {selected.length} {t.rec_selected || 'selected for comparison'}
          <Button 
            kind="secondary" 
            disabled={selected.length === 0} 
            onClick={() => {
              localStorage.setItem('acrewise-compare', JSON.stringify(selected));
              window.location.href = '/compare';
            }}
          >
            {t.rec_compare_btn || 'Compare selected'}
          </Button>
        </div>
      </div>

      <div className="crop-list">
        {rows.map((c, i) => (
          <CropCard 
            key={c.name} 
            crop={c} 
            index={i} 
            selected={selected.includes(c.name)} 
            onSelect={() => setSelected(s => s.includes(c.name) ? s.filter(n => n !== c.name) : [...s, c.name].slice(-3))} 
            onDetails={() => setDetails(c)} 
            onSave={() => onSave(c)}
            onPrint={() => onPrint(c)}
            t={t}
          />
        ))}
      </div>

      {/* Explainer Modal */}
      {details && (
        <div className="modal-backdrop" onClick={() => setDetails(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close icon-button" onClick={() => setDetails(null)} aria-label="Close"><X /></button>
            <div className="eyebrow">{t.rec_modal_title || 'CROP EXPLAINER'}</div>
            <h2>{details.emoji} {getCropName(details.name, t)}</h2>
            <p>{details.reason}</p>

            <div className="detail-grid">
              <div><small>{t.est_net_acre || 'Estimated net / acre'}</small><strong>{money((details.yield * details.price) - details.cost)}</strong></div>
              <div><small>{t.water_footprint || 'Water footprint'}</small><strong>{details.water}</strong></div>
              <div><small>{t.table_msp || 'Statutory MSP Floor'}</small><strong>₹{details.msp_price || details.price}/q</strong></div>
              <div><small>{t.suitability_score || 'Suitability score'}</small><strong>{details.score}/100</strong></div>
            </div>

            {/* Sustainability Highlights */}
            {details.water_saved_liters_per_acre > 0 && (
              <div className="sustain-box" style={{ margin: '14px 0' }}>
                <Droplets size={20} className="text-info" />
                <div>
                  <strong>{t.rec_modal_water_saved || 'Groundwater Conservation'}</strong>
                  <p>Conserves ~{(details.water_saved_liters_per_acre / 1000000).toFixed(2)} Million Liters of water per acre compared to flooded paddy.</p>
                </div>
              </div>
            )}

            {details.nitrogen_fixation_kg_per_acre > 0 && (
              <div className="sustain-box" style={{ margin: '14px 0' }}>
                <Leaf size={20} className="text-success" />
                <div>
                  <strong>{t.rec_modal_nitrogen || 'Soil Bio-Nitrogen Fixation'}</strong>
                  <p>Rhizobium nodules naturally fix ~{details.nitrogen_fixation_kg_per_acre} kg N/acre, saving ₹1,800/acre in fertilizer costs.</p>
                </div>
              </div>
            )}

            <h3>{t.rec_modal_assumptions || 'Assumptions & Baseline'}</h3>
            <p>{details.assumptions}</p>

            <h3>{t.rec_modal_risks || 'Identified Risks'}</h3>
            <p>{details.risk}.</p>

            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <Button onClick={() => { onSave(details); setDetails(null); }}>
                <Save size={16} /> {t.rec_btn_save || 'Save this plan'}
              </Button>
              <Button kind="secondary" onClick={() => { onPrint(details); setDetails(null); }}>
                <Printer size={16} /> {t.print_kisan_plan || 'Print Kisan Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CropCard({ crop, index, selected, onSelect, onDetails, onSave, onPrint, t }) {
  const profit = (crop.yield * crop.price) - crop.cost;
  return (
    <article className="crop-card">
      <div className="crop-check">
        <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Select ${crop.name} for comparison`} />
        <span>{String(index + 1).padStart(2, '0')}</span>
      </div>

      <div className="crop-art">{crop.emoji}</div>

      <div className="crop-main">
        <div className="crop-title">
          <h3>{getCropName(crop.name, t)}</h3>
          <span className={`suitability ${crop.suitability.toLowerCase() === 'high' ? 'good' : ''}`}>
            {crop.suitability} {t.suitability || 'suitability'}
          </span>
        </div>
        <p>{crop.reason}</p>

        {/* Sustainability & MSP Badges */}
        <div className="sustain-badge-row">
          {crop.water_saved_liters_per_acre > 0 && (
            <span className="sustain-badge water">
              <Droplets size={12} /> ~{(crop.water_saved_liters_per_acre / 1000000).toFixed(1)}M L {t.water_saved_label || 'Water Saved'}
            </span>
          )}
          {crop.nitrogen_fixation_kg_per_acre > 0 && (
            <span className="sustain-badge nitrogen">
              <Leaf size={12} /> +{crop.nitrogen_fixation_kg_per_acre} kg N/ac {t.nitrogen_label || 'Bio-N'}
            </span>
          )}
          <span className="sustain-badge msp">
            <ShieldCheck size={12} /> MSP ₹{crop.msp_price || crop.price}/q
          </span>
        </div>

        <div className="crop-meta" style={{ marginTop: 8 }}>
          <span><Droplets size={14} /> {crop.water} {t.table_water_req || 'water'}</span>
          <span><Activity size={14} /> {crop.outlook}</span>
          <span><ShieldCheck size={14} /> Risk: {crop.risk}</span>
        </div>
      </div>

      <div className="crop-economics">
        <small>{t.est_net_profit_acre || 'Est. net profit / acre'}</small>
        <strong>{money(profit)}</strong>
        <span>Yield {crop.yield} q/acre · {money(crop.price)}/q</span>
      </div>

      <div className="crop-actions">
        <Button kind="secondary" onClick={onDetails}>
          {t.rec_btn_why || 'Why this crop?'} <ArrowUpRight size={15} />
        </Button>
        <button className="save-icon" onClick={onPrint} title={t.rec_btn_print || "Print official Kisan Plan card"} aria-label="Print plan">
          <Printer size={17} />
        </button>
        <button className="save-icon" onClick={onSave} title={t.rec_btn_save || "Save crop plan"} aria-label={`Save ${crop.name} plan`}>
          <Save size={18} />
        </button>
      </div>
    </article>
  );
}

function Compare({ t }) {
  const [names, setNames] = useState(['Mustard', 'Chickpea', 'Wheat']);
  const [adjust, setAdjust] = useState(0);

  const crops = sampleCrops.filter(c => names.includes(c.name)).map(c => ({
    ...c,
    price: Math.round(c.price * (1 + (adjust / 100)))
  }));

  const toggle = n => setNames(a => a.includes(n) ? a.filter(x => x !== n) : (a.length < 4 ? [...a, n] : a));
  const revKey = t.chart_revenue || 'Revenue';
  const costKey = t.chart_cost || 'Cost';
  const profitKey = t.chart_profit || 'Profit';

  const bars = crops.map(c => ({
    name: getCropName(c.name, t),
    [revKey]: c.yield * c.price,
    [costKey]: c.cost,
    [profitKey]: (c.yield * c.price) - c.cost
  }));

  return (
    <>
      <PageTitle 
        eyebrow={t.compare_eyebrow || "COMPARE THE TRADE-OFFS"} 
        title={t.compare_title || "Profit is only part of the picture."} 
        description={t.compare_desc || "Change a market price assumption and see how revenue and net margins move."} 
        action={<span className="demo-tag">SCENARIO COMPARISON</span>} 
      />

      <section className="panel compare-controls">
        <div>
          <h2>{t.compare_choose || "Choose crops to compare"}</h2>
          <p className="muted">{t.compare_choose_sub || "Select two to four candidates."}</p>
          <div className="crop-chips">
            {sampleCrops.map(c => (
              <button 
                key={c.name} 
                onClick={() => toggle(c.name)} 
                className={`crop-chip ${names.includes(c.name) ? 'selected' : ''}`}
              >
                {c.emoji} {getCropName(c.name, t)} {names.includes(c.name) && <X size={13} />}
              </button>
            ))}
          </div>
        </div>

        <div className="assumption-control">
          <label>{t.compare_price_adj || "Expected selling price adjustment"} <strong>{adjust > 0 ? '+' : ''}{adjust}%</strong></label>
          <input type="range" min="-20" max="20" step="5" value={adjust} onChange={e => setAdjust(Number(e.target.value))} />
          <div><span>−20%</span><span>{t.compare_current_base || "Current baseline"}</span><span>+20%</span></div>
        </div>
      </section>

      <div className="stat-grid compare-stats">
        <Stat label={t.compare_stat_highest || "Highest net return"} value={crops.length ? money(Math.max(...crops.map(c => (c.yield * c.price) - c.cost))) : '—'} sub={t.compare_stat_highest_sub || "Among selected crops"} icon={ChartNoAxesCombined} />
        <Stat label={t.compare_stat_lowest_water || "Lowest water need"} value={crops.length ? getCropName(crops.reduce((a, b) => (({ Low: 1, Medium: 2, High: 3 })[a.water] < ({ Low: 1, Medium: 2, High: 3 })[b.water] ? a : b)).name, t) : '—'} sub={t.compare_stat_lowest_water_sub || "Protects groundwater"} icon={Droplets} kind="sage" />
        <Stat label={t.compare_stat_scenario || "Price scenario"} value={`${adjust > 0 ? '+' : ''}${adjust}%`} sub={t.compare_stat_scenario_sub || "Simulated market variance"} icon={SlidersHorizontal} kind="amber" />
        <Stat label={t.compare_stat_selected || "Crops selected"} value={crops.length} sub={t.compare_stat_selected_sub || "Comparing side-by-side"} icon={Wheat} kind="blue" />
      </div>

      <div className="panel chart-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">{t.compare_chart_eyebrow || "PER-ACRE ESTIMATES"}</div>
            <h2>{t.compare_chart_title || "Revenue, Cost, and Net Profit"}</h2>
          </div>
          <span className="demo-tag">ILLUSTRATIVE VALUES</span>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bars} margin={{ top: 10, right: 10, left: 12, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe4" />
              <XAxis dataKey="name" tick={{ fill: '#68756b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${Math.round(v / 1000)}k`} tick={{ fill: '#68756b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => money(v)} />
              <Legend />
              <Bar dataKey={revKey} fill="#a5c3a7" radius={[4, 4, 0, 0]} />
              <Bar dataKey={costKey} fill="#d6b77b" radius={[4, 4, 0, 0]} />
              <Bar dataKey={profitKey} fill="#185b43" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="panel-head">
          <div><div className="eyebrow">{t.compare_table_eyebrow || "SIDE-BY-SIDE"}</div><h2>{t.compare_table_title || "Crop decision table"}</h2></div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t.table_metric || "Metric (per acre)"}</th>
                {crops.map(c => <th key={c.name}>{getCropName(c.name, t)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                [t.table_revenue || 'Expected revenue', c => money(c.yield * c.price)],
                [t.table_cost || 'Cultivation cost', c => money(c.cost)],
                [t.table_profit || 'Estimated net profit', c => money((c.yield * c.price) - c.cost)],
                [t.table_msp || 'Govt MSP Floor', c => `₹${c.msp_price || c.price}/q`],
                [t.table_water_req || 'Water requirement', c => c.water],
                [t.table_water_saved || 'Groundwater saved vs Paddy', c => c.water_saved_liters_per_acre ? `~${(c.water_saved_liters_per_acre/1000000).toFixed(1)}M Liters` : 'None'],
                [t.table_nitrogen || 'Biological Nitrogen Fixation', c => c.nitrogen_fixation_kg_per_acre ? `+${c.nitrogen_fixation_kg_per_acre} kg N/ac` : 'None'],
                [t.table_risk || 'Key risk', c => c.risk]
              ].map(([label, fn]) => (
                <tr key={label}>
                  <td>{label}</td>
                  {crops.map(c => <td key={c.name} className={label === (t.table_profit || 'Estimated net profit') ? 'profit-cell' : ''}>{fn(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Market({ intents, setIntents, farm, toast, t }) {
  const [tab, setTab] = useState('Price trends');
  const [crop, setCrop] = useState('Mustard');
  const [acres, setAcres] = useState(farm.acres || 5);
  const [period, setPeriod] = useState('Nov–Dec 2026');
  const [village, setVillage] = useState(farm.village || '');

  const concentration = [
    { name: 'Wheat', value: 58, color: '#185b43' },
    { name: 'Mustard', value: 24, color: '#d6b77b' },
    { name: 'Chickpea', value: 12, color: '#86ad8b' },
    { name: 'Other', value: 6, color: '#9baca0' }
  ];

  function addIntent() {
    if (Number(acres) <= 0) {
      toast('Enter a valid acreage');
      return;
    }
    const newIntent = {
      id: Date.now(),
      crop,
      acres: Number(acres),
      period,
      village: village || farm.district,
      created: new Date().toLocaleDateString('en-IN')
    };
    setIntents(i => [newIntent, ...i]);
    toast(t.intent_saved_toast || 'Sowing intention saved locally');
  }

  return (
    <>
      <PageTitle 
        eyebrow={t.market_eyebrow || "MARKET INTELLIGENCE"} 
        title={t.market_title || "Read the signals around you."} 
        description={t.market_desc || "Mandi price history, regional planned acreage concentration, and voluntary sowing intention registry."} 
        action={<span className="demo-tag">SYNTHETIC REGIONAL SIGNALS</span>} 
      />

      <div className="market-tabs">
        {[
          [t.tab_price_trends || 'Price trends', 'Price trends'],
          [t.tab_concentration || 'Crop concentration', 'Crop concentration'],
          [t.tab_diversification || 'Diversification', 'Diversification'],
          [t.tab_registry || 'Sowing Intent Registry', 'Sowing Intent Registry']
        ].map(([label, key]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'Price trends' && (
        <div className="market-grid">
          <section className="panel market-chart-panel">
            <div className="panel-head">
              <div>
                <div className="eyebrow">HISTORICAL MANDI PATTERNS</div>
                <h2>{t.mandi_chart_title || "Illustrative wholesale price trends"}</h2>
                <p className="muted">{t.mandi_chart_sub || "₹ per quintal · Monthly mandi weighted average"}</p>
              </div>
              <select value={crop} onChange={e => setCrop(e.target.value)}>
                <option value="Mustard">{getCropName('Mustard', t)}</option>
                <option value="Wheat">{getCropName('Wheat', t)}</option>
                <option value="Chickpea">{getCropName('Chickpea', t)}</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={285}>
              <AreaChart data={marketSeries}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#185b43" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#185b43" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe4" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#68756b' }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 150', 'dataMax + 150']} tick={{ fontSize: 11, fill: '#68756b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}/q`} />
                <Area type="monotone" dataKey={crop.toLowerCase()} name={getCropName(crop, t)} stroke="#185b43" strokeWidth={2.5} fill="url(#priceFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="panel market-side">
            <div className="eyebrow">{t.what_this_means || "WHAT THIS MEANS"}</div>
            <h2>{t.context_not_gamble || "Context, not a gamble."}</h2>
            <p>Mandi price history helps anticipate peak arrival slumps and storage timing—but MSP provides your baseline floor.</p>
            <div className="market-callout">
              <Activity size={18} />
              <div>
                <strong>Statutory MSP Safety</strong>
                <span>Official government procurement ensures you never sell below the notified MSP.</span>
              </div>
            </div>
            <div className="market-callout">
              <ShieldCheck size={18} />
              <div>
                <strong>Diversify for High Returns</strong>
                <span>Oilseeds and pulses frequently trade above MSP due to national import deficits.</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === 'Crop concentration' && (
        <div className="market-grid">
          <section className="panel">
            <div className="eyebrow">REGIONAL CROP CONCENTRATION</div>
            <h2>{t.concentration_title || "Planned Acreage Share (Amritsar Block)"}</h2>
            <p className="muted">{t.concentration_sub || "Aggregated voluntary sowing intentions across 25+ contributing farms."}</p>
            {concentration.map(c => (
              <div className="concentration-row" key={c.name}>
                <div><span>{getCropName(c.name, t)}</span><strong>{c.value}%</strong></div>
                <div className="bar-track"><span style={{ width: `${c.value}%`, background: c.color }} /></div>
              </div>
            ))}
            <div className="soft-callout">
              <CircleAlert size={16} /> High concentration in Wheat (&gt;55%) can lead to mandi congestion during harvest arrivals.
            </div>
          </section>

          <section className="panel">
            <div className="eyebrow">RECOMMENDED ACTION</div>
            <h2>{t.rec_action_title || "Diversification Strategy"}</h2>
            <p>{t.rec_action_sub || "Moving 2-3 acres of your wheat farm to Mustard or Chickpea improves local biodiversity and reduces tube-well load."}</p>
            <div className="diversify-card">
              <span>01</span>
              <div>
                <strong>Save Groundwater</strong>
                <p>Pulses use 65% less water than cereals, preserving Punjab aquifers.</p>
              </div>
            </div>
            <div className="diversify-card">
              <span>02</span>
              <div>
                <strong>Fix Natural Nitrogen</strong>
                <p>Cuts your subsequent season DAP and Urea chemical fertilizer bills.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === 'Diversification' && (
        <div className="feature-grid market-features">
          <Feature icon={Droplets} number="01" title="Water Balance" text="Mix crops to lower summer tube-well pumping loads." />
          <Feature icon={Wheat} number="02" title="Price Resilience" text="Avoid betting your entire season revenue on a single harvest price." />
          <Feature icon={CalendarDays} number="03" title="Staggered Harvest" text="Spread labor requirements and harvest windows evenly." />
          <Feature icon={ShieldCheck} number="04" title="Soil Health" text="Break pest and weed cycles with pulse rotations." />
        </div>
      )}

      {tab === 'Sowing Intent Registry' && (
        <div className="market-grid">
          <section className="panel intent-form">
            <div className="eyebrow">VOLUNTARY REGISTRY</div>
            <h2>{t.registry_title || "Record your planned sowing intention."}</h2>
            <p className="muted">{t.registry_sub || "Your submission is anonymized and aggregated with other farmers to prevent local crop gluts."}</p>
            <div className="form-grid">
              <Field label={t.planned_crop || "Planned crop"} required>
                <select value={crop} onChange={e => setCrop(e.target.value)}>
                  {['Mustard', 'Chickpea', 'Wheat', 'Rice', 'Maize', 'Moong'].map(x => <option key={x} value={x}>{getCropName(x, t)}</option>)}
                </select>
              </Field>
              <Field label={t.planned_acreage || "Planned acreage"} required>
                <input type="number" min="0.1" step="0.5" value={acres} onChange={e => setAcres(e.target.value)} />
              </Field>
              <Field label={t.field_village || "Village / block"}>
                <input value={village} onChange={e => setVillage(e.target.value)} placeholder="e.g. Attari, Amritsar" />
              </Field>
              <Field label={t.sowing_window || "Intended sowing window"}>
                <select value={period} onChange={e => setPeriod(e.target.value)}>
                  {['Oct–Nov 2026', 'Nov–Dec 2026', 'Jan–Feb 2027', 'Jun–Jul 2027'].map(x => <option key={x}>{x}</option>)}
                </select>
              </Field>
            </div>
            <Button onClick={addIntent}><Plus size={16} /> {t.btn_save_intent || "Save intention"}</Button>
            <div className="privacy-line">
              <ShieldCheck size={17} /> Privacy protected by k-anonymity (groups under 5 farmers are suppressed).
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div><div className="eyebrow">YOUR REGISTRY</div><h2>{t.saved_intentions_title || "Saved Intentions"}</h2></div>
              <span className="count-pill">{intents.length}</span>
            </div>
            {intents.length ? intents.map(i => (
              <div className="intent-row" key={i.id}>
                <div className="plan-icon"><Sprout size={18} /></div>
                <div>
                  <strong>{getCropName(i.crop, t)}</strong>
                  <small>{i.village} · {i.period}</small>
                </div>
                <span>{i.acres} {t.acres_unit || 'acres'}</span>
              </div>
            )) : (
              <div className="empty-state">
                <div className="empty-icon"><ClipboardList size={20} /></div>
                <strong>No intentions recorded yet</strong>
                <p>Register your intended crop to help build transparent regional planning signals.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Plans({ plans, setPlans, toast, onPrint, t }) {
  const [expanded, setExpanded] = useState(null);
  const [actual, setActual] = useState({ harvest: '', price: '', cost: '', date: '', feedback: '' });

  function record(p) {
    setPlans(list => list.map(x => x.id === p.id ? { ...x, status: 'Outcome recorded', actual: { ...actual } } : x));
    setExpanded(null);
    toast(t.btn_save_outcome || 'Actual harvest outcome saved');
  }

  return (
    <>
      <PageTitle 
        eyebrow={t.plans_eyebrow || "EVALUATION & LEARNING"} 
        title={t.plans_title || "Plan, observe, evaluate."} 
        description={t.plans_desc || "Save your intended crops and compare pre-season estimates with actual mandi yields and returns."} 
        action={<NavLink className="btn btn-primary" to="/recommendations">{t.btn_add_plan || "Add a crop plan"} <Plus size={16} /></NavLink>} 
      />

      <div className="notice-bar">
        <div className="notice-symbol"><ClipboardList size={18} /></div>
        <div>
          <strong>{t.plans_banner_title || "Close the loop on your decisions"}</strong>
          <span>{t.plans_banner_sub || "Recording real harvest outcomes helps calibrate future yield expectations and verifies your What-If resilience assumptions."}</span>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="panel plans-empty">
          <div className="empty-icon"><Sprout size={24} /></div>
          <h2>{t.plans_empty_title || "Your first plan starts with a recommendation."}</h2>
          <p>{t.plans_empty_sub || "Explore crops, review the What-If stress tests, and save a plan here."}</p>
          <NavLink className="btn btn-primary" to="/recommendations">{t.btn_explore_crops || "Explore crop options"} <ArrowRight size={16} /></NavLink>
        </div>
      ) : (
        <div className="panel saved-plans">
          <div className="panel-head">
            <div>
              <div className="eyebrow">SAVED PLANS</div>
              <h2>{plans.length} {t.plans_workspace_title || "plan(s) in your workspace"}</h2>
            </div>
            <span className="demo-tag" style={{ background: '#ecfdf5', color: '#065f46' }}>READY FOR BANK/KCC EXPORT</span>
          </div>

          {plans.map(p => (
            <div className="saved-plan" key={p.id}>
              <div className="plan-icon"><Sprout size={19} /></div>
              <div className="saved-plan-main">
                <h3>{getCropName(p.crop, t)}</h3>
                <p>{p.season} · {p.acres} {t.acres_unit || 'acres'} · {p.date}</p>
                <span className={`status-label ${p.actual ? 'complete' : ''}`}>{p.status}</span>
                {p.actual && (
                  <div className="actual-summary">
                    Harvest: {p.actual.harvest || '—'} q · Selling price: {p.actual.price ? money(Number(p.actual.price)) : '—'}/q · Total cost: {p.actual.cost ? money(Number(p.actual.cost)) : '—'}
                  </div>
                )}
              </div>
              <div className="saved-plan-actions">
                <Button kind="secondary" onClick={() => onPrint(p)}>
                  <Printer size={15} /> {t.btn_export_card || "Export Card"}
                </Button>
                {!p.actual && (
                  <Button kind="secondary" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                    {expanded === p.id ? (t.btn_cancel || 'Cancel') : (t.btn_record_outcome || 'Record outcome')}
                  </Button>
                )}
                <button 
                  className="icon-button danger" 
                  title="Delete plan" 
                  aria-label="Delete plan" 
                  onClick={() => { setPlans(a => a.filter(x => x.id !== p.id)); toast(t.deleted_plan_toast || 'Plan deleted'); }}
                >
                  <Trash2 size={17} />
                </button>
              </div>

              {expanded === p.id && (
                <div className="outcome-form">
                  <div className="form-grid">
                    <Field label={t.actual_harvest || "Actual harvest (quintals)"}>
                      <input type="number" min="0" value={actual.harvest} onChange={e => setActual(a => ({ ...a, harvest: e.target.value }))} />
                    </Field>
                    <Field label={t.actual_price || "Selling price (₹ / quintal)"}>
                      <input type="number" min="0" value={actual.price} onChange={e => setActual(a => ({ ...a, price: e.target.value }))} />
                    </Field>
                    <Field label={t.actual_cost || "Total cultivation cost (₹)"}>
                      <input type="number" min="0" value={actual.cost} onChange={e => setActual(a => ({ ...a, cost: e.target.value }))} />
                    </Field>
                    <Field label={t.actual_sowing_date || "Sowing date"}>
                      <input type="date" value={actual.date} onChange={e => setActual(a => ({ ...a, date: e.target.value }))} />
                    </Field>
                    <Field label={t.actual_notes || "Feedback notes"}>
                      <input value={actual.feedback} onChange={e => setActual(a => ({ ...a, feedback: e.target.value }))} placeholder={t.actual_notes_ph || "Weather, pest incidence, or mandi procurement experience"} />
                    </Field>
                  </div>
                  <Button onClick={() => record(p)}><Save size={16} /> {t.btn_save_outcome || "Save actual outcome"}</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Fpo({ t }) {
  const data = [
    { name: getCropName('Wheat', t), planned: 54, actual: 62 },
    { name: getCropName('Mustard', t), planned: 24, actual: 16 },
    { name: getCropName('Chickpea', t), planned: 14, actual: 10 },
    { name: getCropName('Other', t), planned: 8, actual: 12 }
  ];

  return (
    <>
      <PageTitle 
        eyebrow={t.fpo_eyebrow || "MACRO AGGREGATED VIEW"} 
        title={t.fpo_title || "See the region, not individual farms."} 
        description={t.fpo_desc || "Dedicated macro dashboard for Farmer Producer Organizations (FPOs) and Agricultural Officers."} 
        action={<span className="demo-tag" style={{ background: '#ecfdf5', color: '#065f46' }}>K-ANONYMITY PROTECTED</span>} 
      />

      <div className="stat-grid">
        <Stat label={t.fpo_stat_area || "Total planned area"} value="12,450 ac" sub="Amritsar Pilot Block" icon={Tractor} />
        <Stat label={t.fpo_stat_share || "Largest crop share"} value="Wheat · 54%" sub="Down 8% from last year" icon={Wheat} kind="sage" />
        <Stat label={t.fpo_stat_div || "Diversification gain"} value="+12.4%" sub="Shifted to Mustard & Pulses" icon={Activity} kind="amber" />
        <Stat label={t.fpo_stat_water || "Estimated water saved"} value="4.8 Billion L" sub="Groundwater conserved" icon={Droplets} kind="blue" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">PLANNED VS HISTORICAL MIX</div>
              <h2>{t.fpo_mix_title || "Crop Acreage Distribution (%)"}</h2>
            </div>
            <span className="demo-tag">FPO PILOT</span>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={data} layout="vertical" margin={{ left: 5, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7ebe4" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#68756b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#33463a' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" name="Planned (2026 %)" fill="#185b43" radius={[0, 4, 4, 0]} />
              <Bar dataKey="actual" name="Previous Season (%)" fill="#a5c3a7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <div className="eyebrow">OFFICER CHECKLIST</div>
          <h2>{t.fpo_checklist_title || "Regional Signals to Monitor"}</h2>
          {[
            ['Groundwater Critical Zone', 'Promote mustard & chickpea incentives (₹7,000/acre under Mera Pani Meri Virasat).'],
            ['Terminal Heat Stress', 'Advise zero-tillage wheat sowing before Nov 15th to escape March heat.'],
            ['Seed Distribution Hubs', 'Ensure adequate certified Giriraj mustard and PBG-8 chickpea seed packets.'],
            ['Mandi Procurement Tie-up', 'Verify NAFED and HAFED procurement centers for oilseed arrival.'],
          ].map(([tHeading, d], i) => (
            <div className="checklist-row" key={tHeading}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <strong>{tHeading}</strong>
                <small>{d}</small>
              </div>
              <ChevronRight size={17} />
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

export default App;
