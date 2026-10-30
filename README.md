# AcreWise 🌾 — Smart Crop Planning & Risk Intelligence Platform

> **"The Right Crop for Every Acre"**  
> *Transforming agriculture from a high-stakes gamble into a proactive, data-hedged, and climate-resilient enterprise.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Pilot Region](https://img.shields.io/badge/Pilot%20Region-Punjab%20(Amritsar%20Block)-orange)](#pilot-impact)

---

## 📌 Executive Summary & Problem Statement

In India, over **140 million farmers** make critical financial commitments every season. While 90% of existing agri-tech solutions focus on **post-sowing problems** (e.g., drone imagery, disease diagnosis from leaf photographs), the single largest financial and environmental hazard occurs **before seeds are even sown**:

1. **The Groundwater Catastrophe:** The intensive Wheat-Paddy monoculture consumes ~**3.5 million liters of groundwater per acre** for paddy. Water tables across North India are dropping by 1–2 meters annually.
2. **The Pre-Sowing Decision Vacuum:** Sowing decisions are largely based on tradition and guesswork. Farmers lack accessible tools to calculate net post-cost margins under realistic downside risks.
3. **Mandi Gluts & Market Crashes:** Uncoordinated sowing leads to regional over-supply, triggering severe market price crashes at harvest.
4. **Unclaimed Policy Incentives:** While government programs (like *Mera Pani Meri Virasat* offering ₹7,000/acre DBT) exist to encourage crop diversification, farmers cannot visualize these benefits directly on their balance sheets.

**AcreWise bridges this gap** through an explainable pre-sowing decision engine and interactive stress-test simulator that optimizes farm economics, groundwater conservation, and market risk hedging.

---

## ✨ Core Features & Platform Modules

### 1. 🌱 Explainable Agronomic Recommendation Engine
* **Context-Aware Scoring:** Evaluates crops based on local soil aeration, irrigation profile, sowing season, and previous crop history.
* **Ecological Credits:** Directly measures groundwater savings (liters/acre) compared to paddy baselines, and quantifies natural bio-fertilization (e.g., chickpea fixing 34 kg Nitrogen/acre to cut next season's urea expense).
* **Anti-Glut Market Concentration Penalties:** Flags crops with excessive regional concentration (>75%) to deter single-crop market saturation.

### 2. ⚡ The "What-If" Stress-Test Simulator *(Flagship Innovation)*
Empowers farmers and FPOs to stress-test their seasonal plan against unexpected real-world shocks **before buying seeds**:
* **Drought & Deficit Rainfall:** Simulates yield decline based on crop-specific water elasticities, factoring in spiked tubewell pumping and diesel expenditures.
* **Market Price Crashes & CCEA MSP Floors:** Shows market downturns clamped against official Cabinet Committee on Economic Affairs (CCEA) 2025–26 MSP safety nets.
* **Input Inflation:** Models sudden spikes in fuel, electricity, and fertilizer costs.
* **PMFBY Insurance Cushion:** Dynamically calculates Pradhan Mantri Fasal Bima Yojana indemnity payouts if yields breach threshold levels.

### 3. 🏛️ Government Schemes & MSP Intelligence Hub
* Live tracking of verified MSP rates for Rabi & Kharif crops with year-on-year increases.
* Direct Benefit Transfer (DBT) calculator for crop diversification initiatives (e.g., ₹7,000/acre), solar pump subsidies (PM-KUSUM 60%), and PM-KISAN.

### 4. 📄 Printable Kisan Plan Certificate
* Generates an official, print-ready, offline crop planning advisory.
* Contains agronomic schedules, soil nutrient management, water conservation scores, and projected financial balance sheets.
* Designed for farmers to present to local rural banks for **Kisan Credit Card (KCC) loan approvals** and agri-extension officers.

### 5. 🚜 Macro FPO & Agricultural Officer Dashboard
* Shifts perspective from individual plots to regional macro-planning (tested on a 12,450-acre Amritsar pilot block).
* Tracks aggregated crop share distributions, early indicators of impending market gluts, and collective groundwater conservation metrics (**4.8+ Billion Liters conserved**).

### 6. 🌐 Inclusive Grassroots Accessibility
* Full localization into **English**, **हिन्दी (Hindi)**, and **ਪੰਜਾਬੀ (Punjabi - Gurmukhi)**.
* Integrated **Kisan Mitra AI Copilot** offering multi-lingual voice and chat advisories.

---

## 🏗️ System Architecture

```
                                ┌────────────────────────────────────────┐
                                │      AcreWise Web Application         │
                                │   (React 18 + Vite + Recharts + i18n)  │
                                └───────────────────┬────────────────────┘
                                                    │
                                         HTTP / JSON API Calls
                                                    │
                                                    ▼
                                ┌────────────────────────────────────────┐
                                │     FastAPI High-Performance Core      │
                                │    (Python 3.10+ / Pydantic / CORS)    │
                                └───────┬────────────────────────┬───────┘
                                        │                        │
                 ┌──────────────────────┴──────┐          ┌──────┴──────────────────────┐
                 ▼                             ▼          ▼                             ▼
       ┌──────────────────┐          ┌──────────────────┐┌──────────────────┐  ┌──────────────────┐
       │   Crop Scoring   │          │ What-If Scenario ││ Schemes & MSP    │  │ Kisan Mitra      │
       │     Engine       │          │  Stress Engine   ││ Registry         │  │ Knowledge Base   │
       │ (MCDM Algorithm) │          │  (Elasticities)  ││ (CACP Baselines) │  │ (Agronomic NLP)  │
       └──────────────────┘          └──────────────────┘└──────────────────┘  └──────────────────┘
```

---

## 🔬 Mathematical Modeling & Data Analysis

AcreWise avoids opaque black-box machine learning in favor of an **Explainable Multi-Criteria Decision Model (MCDM)** calibrated against ICAR agronomic guidelines:

### Crop Suitability Score
$$\text{Score} = \text{Base}(50) + S_{\text{season}}(\pm 18) + S_{\text{soil}}(\pm 10) + S_{\text{water}}(\pm 15) + (D_{\text{mkt}} - 0.5) \times 16 - \max(0, C_{\text{reg}} - 0.65) \times 18$$

### What-If Drought & Stress Elasticity
$$\Delta Y = Y_{\text{base}} \times \left( \frac{\Delta \text{Rainfall}\%}{100} \right) \times \epsilon_{\text{crop}}$$
$$\text{Stressed Cost} = \text{Cost}_{\text{base}} \times (1 + \Delta \text{Input}\%) \times (1 + \text{Extra Pumping}\%) + \text{Pest Mitigation Cost}$$
$$\text{Effective Selling Price} = \max(\text{Price}_{\text{market}} \times (1 + \Delta \text{Market}\%), \text{MSP}_{\text{floor}})$$

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0 or higher
* **Python**: v3.10 or higher
* **Git**

### 1. Backend Setup (FastAPI)
```bash
cd acrewise-fastapi-backend/acrewise-fastapi-backend

# Create virtual environment
python -m venv .venv

# Activate environment
# On Windows:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup (React + Vite)
```bash
cd acrewise-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open browser at `http://localhost:5173`.

---

---

## 📜 License

This project is licensed under the MIT License.
