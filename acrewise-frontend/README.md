# AcreWise Frontend

A responsive React + Vite frontend for AcreWise, a crop-planning decision-support prototype. This is a standalone frontend and does not overwrite or depend on the existing MERN project.

## Requirements

- Node.js 20+ recommended
- npm
- Optional: the separate AcreWise FastAPI backend

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, copy the environment file with:

```powershell
Copy-Item .env.example .env
```

Vite will print the local URL, normally `http://localhost:5173`.

## Build for deployment

```bash
npm run build
npm run preview
```

The production build is written to `dist/`. Deploy the `dist` folder to a static hosting provider. For SPA routing on static hosts, configure a fallback/rewrite to `index.html`.

## FastAPI connection

Set `VITE_API_BASE_URL` in `.env` to the backend origin, for example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The UI checks `/health` and attempts to request `/api/recommendations`. If the backend is unavailable or returns an unexpected response shape, the app falls back to explicitly labeled sample/demo data. The API client is isolated in `src/services/api.js` so endpoint mapping can be adjusted without scattering fetch logic through the UI.

Start the backend separately from its own project folder, following that project's README. Configure backend CORS to allow the Vite origin (`http://localhost:5173`). Do not put API keys or private credentials in `VITE_*` variables; Vite exposes them to the browser.

## Implemented screens

- Landing page and feature overview
- Multi-step farm profile form, local persistence, browser speech recognition where supported
- Farmer dashboard with data provenance labels
- Crop recommendations with search, filters, sorting, selection, explanation modal, and local plan saving
- Crop comparison with price adjustment, calculated revenue/cost/profit and chart
- Market intelligence tabs for synthetic price trends, concentration, diversification and voluntary sowing intentions
- Saved crop plans and actual-outcome feedback forms
- FPO/agriculture officer overview with synthetic aggregated sample data
- Responsive sidebar, mobile navigation, loading/error notices and accessible form labels

## Demo-data and integration notes

- Demo prices, yields, weather, crop concentration and FPO figures are illustrative/synthetic; they are not live feeds or verified forecasts.
- Recommendation fallback is a transparent sample/rule-oriented experience, not a trained ML model and no accuracy percentage is claimed.
- Farm profile, saved plans and sowing intentions use browser `localStorage` in demo mode. Clearing browser storage removes these local records.
- Voice entry uses the browser Speech Recognition API if available; unsupported browsers show a typed-input fallback.
- The frontend has a dedicated API service and a basic health check. Endpoint request/response mapping may need adjustment to match the exact backend schema in your local FastAPI version.
- GI-AI4AFS integration, verified weather/market providers, authentication, server-side farmer ownership checks, privacy-safe aggregation thresholds and production deployment controls remain pending. Do not use synthetic regional insights to make real farming decisions.
