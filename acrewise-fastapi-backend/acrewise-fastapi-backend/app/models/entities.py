from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class Farmer(Base):
    __tablename__ = "farmers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    role: Mapped[str] = mapped_column(String(30), default="farmer")
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    farms: Mapped[list["Farm"]] = relationship(back_populates="farmer", cascade="all, delete-orphan")

class Farm(Base):
    __tablename__ = "farms"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"), index=True)
    name: Mapped[str] = mapped_column(String(120), default="My farm")
    state: Mapped[str] = mapped_column(String(80))
    district: Mapped[str] = mapped_column(String(80))
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)
    acreage: Mapped[float] = mapped_column(Float)
    soil_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    water_availability: Mapped[str | None] = mapped_column(String(20), nullable=True)
    previous_crop: Mapped[str | None] = mapped_column(String(80), nullable=True)
    preferred_season: Mapped[str | None] = mapped_column(String(40), nullable=True)
    irrigation_method: Mapped[str | None] = mapped_column(String(80), nullable=True)
    preferences: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    farmer: Mapped["Farmer"] = relationship(back_populates="farms")

class CropPlan(Base):
    __tablename__ = "crop_plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"), index=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), index=True)
    crop_name: Mapped[str] = mapped_column(String(80))
    season: Mapped[str] = mapped_column(String(40))
    estimated_yield_per_acre: Mapped[float] = mapped_column(Float)
    expected_price_per_unit: Mapped[float] = mapped_column(Float)
    cultivation_cost_per_acre: Mapped[float] = mapped_column(Float)
    estimated_revenue_per_acre: Mapped[float] = mapped_column(Float)
    estimated_profit_per_acre: Mapped[float] = mapped_column(Float)
    assumptions_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    feedback: Mapped[list["PlanFeedback"]] = relationship(back_populates="plan", cascade="all, delete-orphan")

class SowingIntent(Base):
    __tablename__ = "sowing_intents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"), index=True)
    crop_name: Mapped[str] = mapped_column(String(80), index=True)
    acreage: Mapped[float] = mapped_column(Float)
    state: Mapped[str] = mapped_column(String(80), index=True)
    district: Mapped[str] = mapped_column(String(80), index=True)
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sowing_period: Mapped[str] = mapped_column(String(40), index=True)
    consent_to_aggregate: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PlanFeedback(Base):
    __tablename__ = "plan_feedback"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("crop_plans.id"), index=True)
    actual_crop: Mapped[str] = mapped_column(String(80))
    sowing_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    harvested_quantity: Mapped[float] = mapped_column(Float)
    actual_selling_price: Mapped[float] = mapped_column(Float)
    actual_cost: Mapped[float] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    plan: Mapped["CropPlan"] = relationship(back_populates="feedback")
