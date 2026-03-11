"""
Synthetic Data Generator for PharmaStock AI Model Training
===========================================================
Generates 12 months of realistic pharmacy dispensing history for 10 medications,
along with pre-computed feature matrices and labels for two ML models:
  1. Reorder Level Predictor (regression)
  2. Expiration Risk Scorer  (classification)

Usage:
    python generate_synthetic_data.py

Outputs:
    ../data/synthetic_usage_history.csv   – raw transaction log (~50K+ rows)
    ../data/synthetic_features_reorder.csv – feature matrix for reorder model
    ../data/synthetic_labels_reorder.csv   – target labels for reorder model
    ../data/synthetic_features_expiration.csv – feature matrix for expiration model
    ../data/synthetic_labels_expiration.csv   – target labels for expiration model
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__))

# ─── Medication Catalog (mirrors SeedData.cs) ───────────────────────────────

MEDICATIONS = [
    {"medication_id": 1, "name": "Ibuprofen 200mg",          "form": "Tablet",        "popularity": "high"},
    {"medication_id": 2, "name": "Acetaminophen 500mg",      "form": "Tablet",        "popularity": "high"},
    {"medication_id": 3, "name": "Amoxicillin 500mg",        "form": "Capsule",       "popularity": "medium"},
    {"medication_id": 4, "name": "Omeprazole 20mg DR",       "form": "Capsule",       "popularity": "medium"},
    {"medication_id": 5, "name": "Lisinopril 10mg",          "form": "Tablet",        "popularity": "medium"},
    {"medication_id": 6, "name": "Cetirizine HCl Oral Sol",  "form": "Oral Solution", "popularity": "low"},
    {"medication_id": 7, "name": "Test Max Name Drug",       "form": "Topical Gel",   "popularity": "low"},
    {"medication_id": 8, "name": "Metformin ER 500mg",       "form": "Tablet",        "popularity": "medium"},
    {"medication_id": 9, "name": "Albuterol Sulfate",        "form": "Inhaler",       "popularity": "low"},
    {"medication_id": 10, "name": "Atorvastatin 40mg",       "form": "Tablet",        "popularity": "medium"},
]

# Daily dispensing profiles by popularity tier
USAGE_PROFILES = {
    "high":   {"mean": 12, "std": 5,  "weekend_factor": 0.4},
    "medium": {"mean": 5,  "std": 2,  "weekend_factor": 0.5},
    "low":    {"mean": 1,  "std": 1,  "weekend_factor": 0.7},
}

# Seasonal multipliers (index 0=Jan, 11=Dec) – flu season bump for certain meds
SEASONAL_FACTORS = {
    "high":   [1.2, 1.1, 1.0, 0.9, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3],
    "medium": [1.1, 1.0, 1.0, 0.95, 0.9, 0.9, 0.9, 0.95, 1.0, 1.0, 1.1, 1.15],
    "low":    [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
}

# Unit value lookup (relative: 1.0 = standard)
MEDICATION_VALUES = {1: 0.5, 2: 0.5, 3: 1.0, 4: 1.5, 5: 1.2, 6: 2.0, 7: 3.0, 8: 1.0, 9: 4.0, 10: 2.5}

# ─── Inventory Lots (mirrors SeedData.cs seed rows) ─────────────────────────

START_DATE = datetime(2025, 3, 10)  # 12 months back from ~March 2026
END_DATE   = datetime(2026, 3, 10)
NUM_DAYS   = (END_DATE - START_DATE).days  # 365

INVENTORY_LOTS = [
    {"inventory_stock_id": 1, "medication_id": 1, "initial_qty": 150, "reorder_level": 20, "expiration_date": datetime(2026, 6, 10)},
    {"inventory_stock_id": 2, "medication_id": 1, "initial_qty": 200, "reorder_level": 20, "expiration_date": datetime(2026, 9, 10)},
    {"inventory_stock_id": 3, "medication_id": 2, "initial_qty": 100, "reorder_level": 25, "expiration_date": datetime(2026, 11, 10)},
    {"inventory_stock_id": 4, "medication_id": 3, "initial_qty": 80,  "reorder_level": 15, "expiration_date": datetime(2027, 1, 10)},
    {"inventory_stock_id": 5, "medication_id": 4, "initial_qty": 60,  "reorder_level": 30, "expiration_date": datetime(2026, 7, 10)},
    {"inventory_stock_id": 6, "medication_id": 5, "initial_qty": 90,  "reorder_level": 10, "expiration_date": datetime(2026, 3, 1)},  # near expiry
    {"inventory_stock_id": 7, "medication_id": 6, "initial_qty": 40,  "reorder_level": 15, "expiration_date": datetime(2026, 3, 10)}, # expiring today
    {"inventory_stock_id": 8, "medication_id": 7, "initial_qty": 20,  "reorder_level": 5,  "expiration_date": datetime(2027, 3, 10)},
    {"inventory_stock_id": 9, "medication_id": 8, "initial_qty": 70,  "reorder_level": 20, "expiration_date": datetime(2026, 8, 10)},
    {"inventory_stock_id": 10, "medication_id": 9, "initial_qty": 30, "reorder_level": 10, "expiration_date": datetime(2026, 12, 10)},
    {"inventory_stock_id": 11, "medication_id": 10, "initial_qty": 55, "reorder_level": 15, "expiration_date": datetime(2026, 10, 10)},
]

# ─── Generate Usage History ──────────────────────────────────────────────────

def generate_usage_history() -> pd.DataFrame:
    """Generate daily dispensing and restocking events for 12 months."""
    records = []
    # Track quantity per lot for restock logic
    lot_qty = {lot["inventory_stock_id"]: lot["initial_qty"] for lot in INVENTORY_LOTS}
    # Map medication_id → list of lot ids
    med_lots = {}
    for lot in INVENTORY_LOTS:
        med_lots.setdefault(lot["medication_id"], []).append(lot["inventory_stock_id"])

    for day_offset in range(NUM_DAYS):
        date = START_DATE + timedelta(days=day_offset)
        is_weekend = date.weekday() >= 5
        month_idx = date.month - 1

        for med in MEDICATIONS:
            mid = med["medication_id"]
            profile = USAGE_PROFILES[med["popularity"]]
            seasonal = SEASONAL_FACTORS[med["popularity"]][month_idx]

            # Daily dispense amount
            base = profile["mean"] * seasonal
            if is_weekend:
                base *= profile["weekend_factor"]
            daily_dispense = max(0, int(np.random.normal(base, profile["std"])))

            if daily_dispense == 0:
                continue

            # Distribute dispenses across lots for this medication
            lots_for_med = med_lots.get(mid, [])
            if not lots_for_med:
                continue

            remaining = daily_dispense
            for lot_id in lots_for_med:
                if remaining <= 0:
                    break
                can_dispense = min(remaining, lot_qty[lot_id])
                if can_dispense > 0:
                    # Split into individual dispense events (1-4 per batch)
                    num_events = min(can_dispense, np.random.randint(1, 5))
                    per_event = can_dispense // max(num_events, 1)
                    leftover = can_dispense - per_event * num_events
                    for ev in range(num_events):
                        qty = per_event + (leftover if ev == 0 else 0)
                        if qty > 0:
                            records.append({
                                "inventory_stock_id": lot_id,
                                "medication_id": mid,
                                "quantity_changed": qty,
                                "change_type": "Dispensed",
                                "occurred_at_utc": date + timedelta(
                                    hours=np.random.randint(8, 18),
                                    minutes=np.random.randint(0, 60)),
                            })
                    lot_qty[lot_id] -= can_dispense
                    remaining -= can_dispense

            # Restock logic: if any lot drops below 20% of initial, restock
            for lot_id in lots_for_med:
                lot_info = next(l for l in INVENTORY_LOTS if l["inventory_stock_id"] == lot_id)
                threshold = lot_info["initial_qty"] * 0.2
                if lot_qty[lot_id] < threshold:
                    restock_amount = lot_info["initial_qty"]
                    records.append({
                        "inventory_stock_id": lot_id,
                        "medication_id": mid,
                        "quantity_changed": restock_amount,
                        "change_type": "Restocked",
                        "occurred_at_utc": date + timedelta(hours=7),
                    })
                    lot_qty[lot_id] += restock_amount

        # Inject occasional expired disposal events (once per month for lot 6 — near expiry)
        if day_offset > 0 and day_offset % 30 == 0:
            disposal_qty = np.random.randint(1, 5)
            records.append({
                "inventory_stock_id": 6,
                "medication_id": 5,
                "quantity_changed": disposal_qty,
                "change_type": "Expired_Disposal",
                "occurred_at_utc": date + timedelta(hours=9),
            })

        # Inject random manual adjustments (~5% of days for random meds)
        if np.random.random() < 0.05:
            adj_med = MEDICATIONS[np.random.randint(0, len(MEDICATIONS))]
            adj_lots = med_lots.get(adj_med["medication_id"], [])
            if adj_lots:
                adj_lot = adj_lots[np.random.randint(0, len(adj_lots))]
                adj_qty = np.random.randint(1, 10)
                records.append({
                    "inventory_stock_id": adj_lot,
                    "medication_id": adj_med["medication_id"],
                    "quantity_changed": adj_qty,
                    "change_type": "Adjustment",
                    "occurred_at_utc": date + timedelta(hours=10),
                })

    df = pd.DataFrame(records)
    df["occurred_at_utc"] = pd.to_datetime(df["occurred_at_utc"])
    return df


# ─── Feature Engineering ─────────────────────────────────────────────────────

def compute_daily_usage(usage_df: pd.DataFrame, medication_id: int, ref_date: datetime, window_days: int) -> pd.Series:
    """Get daily dispensed totals for a medication within a time window."""
    start = ref_date - timedelta(days=window_days)
    mask = (
        (usage_df["medication_id"] == medication_id) &
        (usage_df["change_type"] == "Dispensed") &
        (usage_df["occurred_at_utc"] >= start) &
        (usage_df["occurred_at_utc"] < ref_date)
    )
    subset = usage_df.loc[mask].copy()
    subset["date"] = subset["occurred_at_utc"].dt.date
    daily = subset.groupby("date")["quantity_changed"].sum()
    # Re-index to fill missing days with 0
    all_days = pd.date_range(start=start, end=ref_date - timedelta(days=1), freq="D")
    daily = daily.reindex([d.date() for d in all_days], fill_value=0)
    return daily


def compute_reorder_features(usage_df: pd.DataFrame, ref_date: datetime) -> pd.DataFrame:
    """Build the reorder model feature matrix — one row per medication per snapshot date."""
    rows = []
    form_categories = ["Tablet", "Capsule", "Oral Solution", "Inhaler", "Topical Gel", "Other"]

    for med in MEDICATIONS:
        mid = med["medication_id"]

        daily_7 = compute_daily_usage(usage_df, mid, ref_date, 7)
        daily_30 = compute_daily_usage(usage_df, mid, ref_date, 30)
        daily_90 = compute_daily_usage(usage_df, mid, ref_date, 90)

        avg_7 = daily_7.mean() if len(daily_7) > 0 else 0.0
        avg_30 = daily_30.mean() if len(daily_30) > 0 else 0.0
        avg_90 = daily_90.mean() if len(daily_90) > 0 else 0.0
        var_30 = daily_30.var() if len(daily_30) > 1 else 0.0

        # Usage trend: slope of linear fit on last 30 days
        if len(daily_30) > 1:
            x = np.arange(len(daily_30))
            coeffs = np.polyfit(x, daily_30.values.astype(float), 1)
            trend = coeffs[0]
        else:
            trend = 0.0

        # Days since last dispense
        dispensed_mask = (
            (usage_df["medication_id"] == mid) &
            (usage_df["change_type"] == "Dispensed") &
            (usage_df["occurred_at_utc"] < ref_date)
        )
        dispensed_dates = usage_df.loc[dispensed_mask, "occurred_at_utc"]
        if len(dispensed_dates) > 0:
            days_since = (ref_date - dispensed_dates.max()).days
        else:
            days_since = 999

        # Inventory state
        med_lots = [l for l in INVENTORY_LOTS if l["medication_id"] == mid]
        active_lots = [l for l in med_lots if l["expiration_date"] > ref_date]
        total_qty = sum(l["initial_qty"] for l in active_lots)  # approximation for synthetic data
        num_active = len(active_lots)
        if active_lots:
            days_to_nearest_expiry = min((l["expiration_date"] - ref_date).days for l in active_lots)
        else:
            days_to_nearest_expiry = 0

        # Restock frequency
        restock_mask = (
            (usage_df["medication_id"] == mid) &
            (usage_df["change_type"] == "Restocked") &
            (usage_df["occurred_at_utc"] >= ref_date - timedelta(days=30)) &
            (usage_df["occurred_at_utc"] < ref_date)
        )
        restock_freq = usage_df.loc[restock_mask].shape[0]

        # One-hot encode form
        form_val = med["form"] if med["form"] in form_categories else "Other"
        form_encoded = {f"form_{f.lower().replace(' ', '_')}": int(form_val == f) for f in form_categories}

        row = {
            "medication_id": mid,
            "avg_daily_usage_7d": round(avg_7, 3),
            "avg_daily_usage_30d": round(avg_30, 3),
            "avg_daily_usage_90d": round(avg_90, 3),
            "usage_variance_30d": round(var_30, 3),
            "usage_trend": round(trend, 5),
            "days_since_last_dispense": days_since,
            "total_quantity_on_hand": total_qty,
            "num_active_lots": num_active,
            "days_to_nearest_expiry": days_to_nearest_expiry,
            "restock_frequency_30d": restock_freq,
            "day_of_week": ref_date.weekday(),
            "month": ref_date.month,
        }
        row.update(form_encoded)
        rows.append(row)

    return pd.DataFrame(rows)


def compute_reorder_labels(features_df: pd.DataFrame) -> pd.DataFrame:
    """Generate target labels for the reorder model."""
    labels = []
    lead_time_days = 7
    base_safety = 1.5

    for _, row in features_df.iterrows():
        avg_usage = row["avg_daily_usage_30d"]
        variance = row["usage_variance_30d"]
        trend = row["usage_trend"]

        safety = base_safety
        if variance > 10:
            safety = 2.0

        reorder_level = avg_usage * lead_time_days * safety

        if trend > 0:
            reorder_level *= 1.1

        reorder_level = int(np.clip(reorder_level, 5, 100))

        labels.append({
            "medication_id": row["medication_id"],
            "recommended_reorder_level": reorder_level,
        })

    return pd.DataFrame(labels)


def compute_expiration_features(usage_df: pd.DataFrame, ref_date: datetime) -> pd.DataFrame:
    """Build the expiration risk model feature matrix — one row per inventory lot."""
    rows = []

    for lot in INVENTORY_LOTS:
        mid = lot["medication_id"]
        days_to_expiry = (lot["expiration_date"] - ref_date).days

        daily_30 = compute_daily_usage(usage_df, mid, ref_date, 30)
        avg_usage = daily_30.mean() if len(daily_30) > 0 else 0.0

        qty = lot["initial_qty"]  # synthetic approximation
        days_to_deplete = qty / max(avg_usage, 0.01)
        will_expire_before = 1 if days_to_expiry < days_to_deplete else 0

        med_lots_count = sum(1 for l in INVENTORY_LOTS if l["medication_id"] == mid and l["expiration_date"] > ref_date)

        rows.append({
            "inventory_stock_id": lot["inventory_stock_id"],
            "medication_id": mid,
            "days_to_expiry": days_to_expiry,
            "quantity_on_hand": qty,
            "avg_daily_usage_30d": round(avg_usage, 3),
            "days_to_deplete": round(days_to_deplete, 2),
            "will_expire_before_depleted": will_expire_before,
            "medication_unit_value": MEDICATION_VALUES.get(mid, 1.0),
            "num_lots_same_med": med_lots_count,
        })

    return pd.DataFrame(rows)


def compute_expiration_labels(features_df: pd.DataFrame) -> pd.DataFrame:
    """Generate binary labels for the expiration risk classifier."""
    labels = []

    for _, row in features_df.iterrows():
        dte = row["days_to_expiry"]
        dtd = row["days_to_deplete"]
        qty = row["quantity_on_hand"]
        avg_usage = row["avg_daily_usage_30d"]

        high_risk = 0
        if dte < 0:
            high_risk = 1
        elif dte < dtd:
            high_risk = 1
        elif dte < 30 and qty > avg_usage * 30:
            high_risk = 1

        labels.append({
            "inventory_stock_id": row["inventory_stock_id"],
            "high_risk": high_risk,
        })

    return pd.DataFrame(labels)


# ─── Multi-snapshot amplification ────────────────────────────────────────────

def generate_multi_snapshot_data(usage_df: pd.DataFrame) -> tuple:
    """Generate feature/label data at multiple time snapshots to amplify the dataset."""
    all_reorder_features = []
    all_reorder_labels = []
    all_exp_features = []
    all_exp_labels = []

    # Take snapshots every 3 days across the last 9 months for more training data
    for day_offset in range(90, 365, 3):
        ref_date = START_DATE + timedelta(days=day_offset)

        rf = compute_reorder_features(usage_df, ref_date)
        rl = compute_reorder_labels(rf)
        rf["snapshot_date"] = ref_date
        rl["snapshot_date"] = ref_date

        ef = compute_expiration_features(usage_df, ref_date)
        el = compute_expiration_labels(ef)
        ef["snapshot_date"] = ref_date
        el["snapshot_date"] = ref_date

        all_reorder_features.append(rf)
        all_reorder_labels.append(rl)
        all_exp_features.append(ef)
        all_exp_labels.append(el)

    return (
        pd.concat(all_reorder_features, ignore_index=True),
        pd.concat(all_reorder_labels, ignore_index=True),
        pd.concat(all_exp_features, ignore_index=True),
        pd.concat(all_exp_labels, ignore_index=True),
    )


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("Generating synthetic usage history...")
    usage_df = generate_usage_history()
    usage_path = os.path.join(OUTPUT_DIR, "synthetic_usage_history.csv")
    usage_df.to_csv(usage_path, index=False)
    print(f"  → {len(usage_df):,} transaction records saved to {usage_path}")

    print("Computing multi-snapshot feature matrices and labels...")
    reorder_feat, reorder_labels, exp_feat, exp_labels = generate_multi_snapshot_data(usage_df)

    reorder_feat.to_csv(os.path.join(OUTPUT_DIR, "synthetic_features_reorder.csv"), index=False)
    reorder_labels.to_csv(os.path.join(OUTPUT_DIR, "synthetic_labels_reorder.csv"), index=False)
    exp_feat.to_csv(os.path.join(OUTPUT_DIR, "synthetic_features_expiration.csv"), index=False)
    exp_labels.to_csv(os.path.join(OUTPUT_DIR, "synthetic_labels_expiration.csv"), index=False)

    print(f"  → Reorder features:    {len(reorder_feat):,} rows")
    print(f"  → Expiration features:  {len(exp_feat):,} rows")
    print("Done!")


if __name__ == "__main__":
    main()
