import numpy as np
from datetime import datetime, timedelta
from typing import List

from .models import UsageRecord

FORM_CATEGORIES = ["Tablet", "Capsule", "Oral Solution", "Inhaler", "Topical Gel", "Other"]


def _daily_usage(records: List[UsageRecord], ref_date: datetime, window_days: int) -> np.ndarray:
    """Compute daily dispensed totals within a time window."""
    start = ref_date - timedelta(days=window_days)
    daily = np.zeros(window_days)

    for r in records:
        if r.change_type == "Dispensed" and start <= r.occurred_at_utc < ref_date:
            day_idx = (r.occurred_at_utc - start).days
            if 0 <= day_idx < window_days:
                daily[day_idx] += r.quantity_changed

    return daily


def build_reorder_features(
    medication_form: str,
    usage_history: List[UsageRecord],
    current_stock: int,
    num_active_lots: int,
    days_to_nearest_expiry: int,
    ref_date: datetime | None = None,
) -> np.ndarray:
    """Build a 1x21 feature vector for the reorder model."""
    if ref_date is None:
        ref_date = datetime.utcnow()

    daily_7 = _daily_usage(usage_history, ref_date, 7)
    daily_30 = _daily_usage(usage_history, ref_date, 30)
    daily_90 = _daily_usage(usage_history, ref_date, 90)

    avg_7 = float(daily_7.mean())
    avg_30 = float(daily_30.mean())
    avg_90 = float(daily_90.mean())
    var_30 = float(daily_30.var()) if len(daily_30) > 1 else 0.0

    if len(daily_30) > 1:
        x = np.arange(len(daily_30))
        coeffs = np.polyfit(x, daily_30, 1)
        trend = float(coeffs[0])
    else:
        trend = 0.0

    # Derived features
    std_30 = float(np.sqrt(var_30)) if var_30 > 0 else 0.0
    usage_cv = std_30 / max(avg_30, 0.01)
    usage_7d_vs_30d_ratio = avg_7 / max(avg_30, 0.01)
    days_of_stock_remaining = current_stock / max(avg_30, 0.01)

    dispensed_dates = [r.occurred_at_utc for r in usage_history if r.change_type == "Dispensed" and r.occurred_at_utc < ref_date]
    days_since = (ref_date - max(dispensed_dates)).days if dispensed_dates else 999

    start_30 = ref_date - timedelta(days=30)
    restock_freq = sum(1 for r in usage_history if r.change_type == "Restocked" and start_30 <= r.occurred_at_utc < ref_date)

    form_val = medication_form if medication_form in FORM_CATEGORIES else "Other"
    form_encoded = [1.0 if f == form_val else 0.0 for f in FORM_CATEGORIES]

    features = [
        avg_7, avg_30, avg_90, var_30, trend,
        usage_cv, usage_7d_vs_30d_ratio,
        float(days_since), float(current_stock),
        float(num_active_lots), float(days_to_nearest_expiry),
        days_of_stock_remaining,
        float(restock_freq),
        float(ref_date.weekday()), float(ref_date.month),
    ] + form_encoded

    return np.array(features).reshape(1, -1)


def build_expiration_features(
    days_to_expiry: int,
    quantity_on_hand: int,
    avg_daily_usage_30d: float,
    medication_unit_value: float,
    num_lots_same_med: int,
) -> np.ndarray:
    """Build a 1x9 feature vector for the expiration risk model."""
    days_to_deplete = quantity_on_hand / max(avg_daily_usage_30d, 0.01)
    expiry_buffer_days = days_to_expiry - days_to_deplete
    usage_to_quantity_ratio = avg_daily_usage_30d / max(quantity_on_hand, 1)
    waste_risk_score = (quantity_on_hand * medication_unit_value) / max(days_to_expiry, 1)

    features = [
        float(days_to_expiry),
        float(quantity_on_hand),
        float(avg_daily_usage_30d),
        days_to_deplete,
        expiry_buffer_days,
        usage_to_quantity_ratio,
        waste_risk_score,
        float(medication_unit_value),
        float(num_lots_same_med),
    ]

    return np.array(features).reshape(1, -1)
