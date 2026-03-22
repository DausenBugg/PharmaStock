"""
Prediction service — loads models and exposes predict methods.
"""

import os
import joblib
import numpy as np
from datetime import datetime

from .feature_engineering import build_reorder_features, build_expiration_features
from .models import (
    ReorderPredictionRequest, ReorderPredictionResponse,
    ExpirationRiskRequest, ExpirationRiskResponse,
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# Global model references
_reorder_model = None
_expiration_model = None


def load_models():
    """Load serialized models into memory."""
    global _reorder_model, _expiration_model

    reorder_path = os.path.join(MODEL_DIR, "reorder_model.joblib")
    expiration_path = os.path.join(MODEL_DIR, "expiration_model.joblib")

    if os.path.exists(reorder_path):
        _reorder_model = joblib.load(reorder_path)
    else:
        print(f"WARNING: Reorder model not found at {reorder_path}")

    if os.path.exists(expiration_path):
        _expiration_model = joblib.load(expiration_path)
    else:
        print(f"WARNING: Expiration model not found at {expiration_path}")


def models_loaded() -> tuple[bool, bool]:
    return _reorder_model is not None, _expiration_model is not None


def predict_reorder(request: ReorderPredictionRequest) -> ReorderPredictionResponse:
    # Added logging statements to the predict_reorder function to help trace the flow of data and identify any potential issues during the prediction process. 
    # This will allow us to see when the function is called, when features are built, when the model makes a prediction, and when the final response is constructed, 
    # which can be invaluable for debugging and ensuring that the prediction logic is working as intended.
    print(f"predict_reorder start med {request.medication_id}")

    if _reorder_model is None:
        raise RuntimeError("Reorder model not loaded")

    features = build_reorder_features(
        medication_form=request.medication_form,
        usage_history=request.usage_history,
        current_stock=request.current_stock,
        num_active_lots=request.num_active_lots,
        days_to_nearest_expiry=request.days_to_nearest_expiry,
    )
    print("reorder features built")

    prediction = _reorder_model.predict(features)[0]
    print("reorder model predicted")

    recommended = int(np.clip(round(prediction), 5, 100))

    rf_model = _reorder_model.named_steps["model"]
    tree_preds = np.array([
        tree.predict(_reorder_model.named_steps["scaler"].transform(features))[0]
        for tree in rf_model.estimators_
    ])
    print("reorder tree predictions done")

    std = float(tree_preds.std())
    confidence = max(0.0, min(1.0, 1.0 - (std / max(prediction, 1.0))))
    is_popular = recommended >= 40

    print(f"predict_reorder done med {request.medication_id}")

    return ReorderPredictionResponse(
        medication_id=request.medication_id,
        recommended_reorder_level=recommended,
        confidence=round(confidence, 3),
        is_popular=is_popular,
    )


def predict_expiration_risk(request: ExpirationRiskRequest) -> ExpirationRiskResponse:
    # Added logging statements to the predict_expiration_risk function to help trace the flow of data and identify any potential issues during the prediction process.
    # This will allow us to see when the function is called, when features are built,
    # when the model makes a prediction, and when the final response is constructed, which can be invaluable for debugging and ensuring that the prediction logic is working as intended.
    print(f"predict_expiration start stock {request.inventory_stock_id}")

    if _expiration_model is None:
        raise RuntimeError("Expiration model not loaded")

    now = datetime.utcnow()
    days_to_expiry = (request.expiration_date.replace(tzinfo=None) - now).days
    print("expiration days computed")

    features = build_expiration_features(
        days_to_expiry=days_to_expiry,
        quantity_on_hand=request.quantity_on_hand,
        avg_daily_usage_30d=request.avg_daily_usage_30d,
        medication_unit_value=request.medication_unit_value,
        num_lots_same_med=request.num_lots_same_med,
    )
    print("expiration features built")

    risk_prob = _expiration_model.predict_proba(features)[0][1]
    print("expiration model predicted")

    risk_score = round(float(risk_prob), 4)

    if risk_score >= 0.75:
        risk_label = "Critical"
    elif risk_score >= 0.5:
        risk_label = "High"
    elif risk_score >= 0.25:
        risk_label = "Medium"
    else:
        risk_label = "Low"

    days_to_deplete = request.quantity_on_hand / max(request.avg_daily_usage_30d, 0.01)

    print(f"predict_expiration done stock {request.inventory_stock_id}")

    return ExpirationRiskResponse(
        inventory_stock_id=request.inventory_stock_id,
        risk_score=risk_score,
        risk_label=risk_label,
        days_to_expiry=days_to_expiry,
        estimated_days_to_deplete=round(days_to_deplete, 1),
    )
