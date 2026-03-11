"""
Pydantic schemas for FastAPI request/response validation.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ─── Reorder Prediction ─────────────────────────────────────────────────────

class UsageRecord(BaseModel):
    """A single usage history entry."""
    quantity_changed: int = Field(ge=0)
    change_type: str  # Dispensed, Restocked, Adjustment, Expired_Disposal
    occurred_at_utc: datetime


class ReorderPredictionRequest(BaseModel):
    """Input for a single medication reorder prediction."""
    medication_id: int
    medication_form: str = "Tablet"
    usage_history: List[UsageRecord]
    current_stock: int = Field(ge=0)
    num_active_lots: int = Field(ge=0, default=1)
    days_to_nearest_expiry: int = Field(default=180)


class ReorderPredictionResponse(BaseModel):
    medication_id: int
    recommended_reorder_level: int
    confidence: float
    is_popular: bool


class BatchReorderRequest(BaseModel):
    medications: List[ReorderPredictionRequest]


class BatchReorderResponse(BaseModel):
    predictions: List[ReorderPredictionResponse]


# ─── Expiration Risk ─────────────────────────────────────────────────────────

class ExpirationRiskRequest(BaseModel):
    """Input for a single lot expiration risk assessment."""
    inventory_stock_id: int
    medication_id: int
    quantity_on_hand: int = Field(ge=0)
    expiration_date: datetime
    avg_daily_usage_30d: float = Field(ge=0)
    medication_unit_value: float = Field(default=1.0, ge=0)
    num_lots_same_med: int = Field(default=1, ge=1)


class ExpirationRiskResponse(BaseModel):
    inventory_stock_id: int
    risk_score: float
    risk_label: str  # "Low", "Medium", "High", "Critical"
    days_to_expiry: int
    estimated_days_to_deplete: float


class BatchExpirationRequest(BaseModel):
    inventory_items: List[ExpirationRiskRequest]


class BatchExpirationResponse(BaseModel):
    risk_scores: List[ExpirationRiskResponse]


# ─── Health Check ────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    reorder_model_loaded: bool
    expiration_model_loaded: bool
