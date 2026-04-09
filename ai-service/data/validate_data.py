"""
Data Validation Script for PharmaStock AI Training Data
=========================================================
Verifies that the synthetic data CSVs are well-formed, complete, and ready
for model training.

Usage:
    python validate_data.py
"""

import os
import sys
import pandas as pd

DATA_DIR = os.path.dirname(__file__)

EXPECTED_FILES = [
    "synthetic_usage_history.csv",
    "synthetic_features_reorder.csv",
    "synthetic_labels_reorder.csv",
    "synthetic_features_expiration.csv",
    "synthetic_labels_expiration.csv",
]

REQUIRED_COLS_USAGE = [
    "inventory_stock_id", "medication_id", "quantity_changed", "change_type", "occurred_at_utc"
]

REQUIRED_COLS_REORDER_FEAT = [
    "medication_id", "avg_daily_usage_7d", "avg_daily_usage_30d", "avg_daily_usage_90d",
    "usage_variance_30d", "usage_trend",
    "usage_coefficient_of_variation", "usage_7d_vs_30d_ratio",
    "days_since_last_dispense",
    "total_quantity_on_hand", "num_active_lots", "days_to_nearest_expiry",
    "days_of_stock_remaining",
    "restock_frequency_30d", "day_of_week", "month",
]

REQUIRED_COLS_REORDER_LABEL = ["medication_id", "recommended_reorder_level"]

REQUIRED_COLS_EXP_FEAT = [
    "inventory_stock_id", "medication_id", "days_to_expiry", "quantity_on_hand",
    "avg_daily_usage_30d", "days_to_deplete", "expiry_buffer_days",
    "usage_to_quantity_ratio", "waste_risk_score",
    "medication_unit_value", "num_lots_same_med",
]

REQUIRED_COLS_EXP_LABEL = ["inventory_stock_id", "high_risk"]


def check(condition: bool, msg: str):
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {msg}")
    if not condition:
        return 1
    return 0


def main():
    errors = 0
    print("=" * 60)
    print("PharmaStock AI — Data Validation")
    print("=" * 60)

    # 1. Check files exist
    print("\n1. File existence:")
    for fname in EXPECTED_FILES:
        path = os.path.join(DATA_DIR, fname)
        errors += check(os.path.exists(path), f"{fname} exists")

    # 2. Load and validate usage history
    print("\n2. Usage history validation:")
    usage_path = os.path.join(DATA_DIR, "synthetic_usage_history.csv")
    if os.path.exists(usage_path):
        usage = pd.read_csv(usage_path)
        errors += check(len(usage) >= 5000, f"Row count: {len(usage):,} (need ≥ 5,000)")
        for col in REQUIRED_COLS_USAGE:
            errors += check(col in usage.columns, f"Column '{col}' present")
        errors += check(usage[REQUIRED_COLS_USAGE].notna().all().all(), "No NaN in required columns")
        errors += check((usage["quantity_changed"] >= 0).all(), "All quantity_changed ≥ 0")
        valid_types = {"Dispensed", "Restocked", "Adjustment", "Expired_Disposal"}
        actual_types = set(usage["change_type"].unique())
        errors += check(actual_types.issubset(valid_types), f"ChangeTypes valid: {actual_types}")
        errors += check(len(usage["medication_id"].unique()) >= 8, f"Medications covered: {usage['medication_id'].nunique()}")
        print(f"\n  Summary stats:\n{usage.describe().to_string()}")
    else:
        errors += 1
        print("  [SKIP] File not found")

    # 3. Validate reorder features
    print("\n3. Reorder features validation:")
    rf_path = os.path.join(DATA_DIR, "synthetic_features_reorder.csv")
    if os.path.exists(rf_path):
        rf = pd.read_csv(rf_path)
        errors += check(len(rf) >= 100, f"Row count: {len(rf):,} (need ≥ 100)")
        for col in REQUIRED_COLS_REORDER_FEAT:
            errors += check(col in rf.columns, f"Column '{col}' present")
        errors += check(rf[REQUIRED_COLS_REORDER_FEAT].notna().all().all(), "No NaN in required columns")
        errors += check((rf["avg_daily_usage_7d"] >= 0).all(), "avg_daily_usage_7d ≥ 0")
        errors += check((rf["avg_daily_usage_30d"] >= 0).all(), "avg_daily_usage_30d ≥ 0")
    else:
        errors += 1
        print("  [SKIP] File not found")

    # 4. Validate reorder labels
    print("\n4. Reorder labels validation:")
    rl_path = os.path.join(DATA_DIR, "synthetic_labels_reorder.csv")
    if os.path.exists(rl_path):
        rl = pd.read_csv(rl_path)
        errors += check(len(rl) >= 100, f"Row count: {len(rl):,}")
        for col in REQUIRED_COLS_REORDER_LABEL:
            errors += check(col in rl.columns, f"Column '{col}' present")
        errors += check((rl["recommended_reorder_level"] >= 5).all(), "Reorder level ≥ 5")
        errors += check((rl["recommended_reorder_level"] <= 100).all(), "Reorder level ≤ 100")
        high_med = rl[rl["medication_id"].isin([1, 2])]["recommended_reorder_level"].mean()
        low_med = rl[rl["medication_id"].isin([7, 9])]["recommended_reorder_level"].mean()
        errors += check(high_med > low_med, f"Popular drugs reorder higher ({high_med:.0f}) than slow movers ({low_med:.0f})")
    else:
        errors += 1
        print("  [SKIP] File not found")

    # 5. Validate expiration features
    print("\n5. Expiration features validation:")
    ef_path = os.path.join(DATA_DIR, "synthetic_features_expiration.csv")
    if os.path.exists(ef_path):
        ef = pd.read_csv(ef_path)
        errors += check(len(ef) >= 50, f"Row count: {len(ef):,}")
        for col in REQUIRED_COLS_EXP_FEAT:
            errors += check(col in ef.columns, f"Column '{col}' present")
        errors += check(ef[REQUIRED_COLS_EXP_FEAT].notna().all().all(), "No NaN in required columns")
    else:
        errors += 1
        print("  [SKIP] File not found")

    # 6. Validate expiration labels
    print("\n6. Expiration labels validation:")
    el_path = os.path.join(DATA_DIR, "synthetic_labels_expiration.csv")
    if os.path.exists(el_path):
        el = pd.read_csv(el_path)
        errors += check(len(el) >= 50, f"Row count: {len(el):,}")
        for col in REQUIRED_COLS_EXP_LABEL:
            errors += check(col in el.columns, f"Column '{col}' present")
        errors += check(el["high_risk"].isin([0, 1]).all(), "high_risk is binary (0 or 1)")
        errors += check(el["high_risk"].sum() > 0, f"Has positive cases: {el['high_risk'].sum()}")
        errors += check((el["high_risk"] == 0).sum() > 0, f"Has negative cases: {(el['high_risk'] == 0).sum()}")
    else:
        errors += 1
        print("  [SKIP] File not found")

    # Summary
    print("\n" + "=" * 60)
    if errors == 0:
        print("ALL CHECKS PASSED ✓")
    else:
        print(f"FAILED: {errors} check(s) did not pass")
    print("=" * 60)

    sys.exit(1 if errors > 0 else 0)


if __name__ == "__main__":
    main()
