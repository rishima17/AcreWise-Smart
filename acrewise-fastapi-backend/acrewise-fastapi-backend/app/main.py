from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.models import entities  # noqa: F401 ensures model metadata is registered
from app.routers import farmers, recommendations, market, plans, integrations, scenarios, advisory, schemes

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title=settings.app_name, version="0.1.0", description="AcreWise agricultural decision-support API. Demo values are labeled and not live data.", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(farmers.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(market.router, prefix="/api")
app.include_router(plans.router, prefix="/api")
app.include_router(integrations.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")
app.include_router(advisory.router, prefix="/api")
app.include_router(schemes.router, prefix="/api")

@app.get("/health", tags=["health"])
def health():
    return {"status":"ok","service":"AcreWise API","environment":settings.app_env}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content=jsonable_encoder({"error":"validation_error","message":"Request validation failed.","details":exc.errors()}))
