# AcreWise FastAPI Backend

A new, standalone Python backend for AcreWise. This project is created from scratch and does **not** depend on the existing MERN project.

## Features

- FastAPI routers, Pydantic schemas, SQLAlchemy models and SQLite persistence
- Farmer and farm CRUD
- Transparent rule-based crop recommendations (not a trained ML model)
- Profitability calculator and crop comparison
- Demo market prices, regional concentration and diversification insights
- Consent-based Sowing Intent Registry with aggregated-only public results
- Saved crop plans and actual outcome feedback
- Data provenance metadata and an explicit, unconfigured GI-AI4AFS adapter interface
- Basic API-key/role dependency hooks, CORS configuration and tests

## Quick start

Python 3.10+ is recommended.

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for interactive API docs and `http://127.0.0.1:8000/health` for health status.

Run tests:

```bash
pytest -q
```

## Configuration

- `DATABASE_URL`: defaults to local SQLite (`sqlite:///./acrewise.db`)
- `CORS_ORIGINS`: comma-separated frontend origins; defaults in `.env.example` support Vite
- `DEMO_DATA_ENABLED`: enables clearly labeled illustrative datasets
- `API_KEY`: optional shared API key for protected endpoints. When configured, send `X-API-Key: <value>`. This is a development guard, not a replacement for user authentication.

## API overview

- `POST /api/farmers`, `GET/PATCH /api/farmers/{farmer_id}`
- `POST /api/farms`, `GET/PATCH /api/farms/{farm_id}`
- `POST /api/recommendations`
- `POST /api/profitability/calculate`
- `GET /api/market/prices`, `GET /api/market/concentration`, `GET /api/market/diversification`
- `POST /api/market/compare`
- `POST /api/sowing-intents`, `GET /api/sowing-intents/mine/{farmer_id}`, `GET /api/sowing-intents/aggregate`
- `POST /api/plans`, `GET /api/plans/{plan_id}`, `POST /api/plans/{plan_id}/feedback`
- `GET /api/integrations/status`

## Demo data and limitations

Market prices, yields, costs, regional concentration, and weather context used by the starter recommendation engine are **illustrative demo values**, not live market quotes, official statistics, or validated agronomic predictions. Responses include provenance metadata. No external weather/market provider is configured by default.

The GI-AI4AFS adapter is intentionally marked **unconfigured**. No endpoints are guessed and no connection is claimed. Implement a provider only after obtaining the official API specification, credentials and permission.

The rule-based score is an explainable prioritization heuristic, not a probability or model accuracy score. Farmers should verify recommendations with local agricultural extension services and current mandi/official data before making financial decisions.

## Security notes

This starter includes optional API-key protection hooks and role dependencies. It does not implement a complete identity provider, password login, OAuth/JWT issuance, or a production-grade farmer identity system. Before production, add verified authentication, per-user ownership checks, key rotation, rate limiting, TLS, audit logging, backups, and privacy/legal review. Never expose raw sowing-intent records to regional dashboards; only aggregate them when minimum group thresholds are met.

## Project structure

```text
acrewise-fastapi-backend/
├── app/
│   ├── main.py
│   ├── core/config.py
│   ├── db/session.py
│   ├── models/entities.py
│   ├── schemas/
│   ├── routers/
│   ├── services/
│   └── adapters/
├── tests/
├── .env.example
├── .gitignore
└── requirements.txt
```
