"""
Reorder Level Prediction Model — Training Script
==================================================
Trains a RandomForestRegressor to predict the ideal reorder threshold
for each medication based on usage patterns.

Usage:
    python train_reorder_model.py

Input:
    ../data/synthetic_features_reorder.csv
    ../data/synthetic_labels_reorder.csv

Output:
    reorder_model.joblib  — serialized sklearn pipeline
    Prints evaluation metrics and feature importances
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

SCRIPT_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
MODEL_PATH = os.path.join(SCRIPT_DIR, "reorder_model.joblib")
RESULTS_PATH = os.path.join(SCRIPT_DIR, "..", "docs", "reorder_training_results.json")

FEATURE_COLS = [
    "avg_daily_usage_7d", "avg_daily_usage_30d", "avg_daily_usage_90d",
    "usage_variance_30d", "usage_trend", "days_since_last_dispense",
    "total_quantity_on_hand", "num_active_lots", "days_to_nearest_expiry",
    "restock_frequency_30d", "day_of_week", "month",
    "form_tablet", "form_capsule", "form_oral_solution",
    "form_inhaler", "form_topical_gel", "form_other",
]

TARGET_COL = "recommended_reorder_level"


def main():
    print("=" * 60)
    print("Reorder Level Prediction Model — Training")
    print("=" * 60)

    # Load data
    features = pd.read_csv(os.path.join(DATA_DIR, "synthetic_features_reorder.csv"))
    labels = pd.read_csv(os.path.join(DATA_DIR, "synthetic_labels_reorder.csv"))

    # Ensure feature columns exist (handle missing one-hot columns)
    for col in FEATURE_COLS:
        if col not in features.columns:
            features[col] = 0

    X = features[FEATURE_COLS].values
    y = labels[TARGET_COL].values

    print(f"\nDataset: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"Target range: [{y.min()}, {y.max()}], mean: {y.mean():.1f}")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

    # Build pipeline
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )),
    ])

    # Train
    print("\nTraining RandomForestRegressor...")
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"\n--- Evaluation Metrics ---")
    print(f"  MAE:  {mae:.2f}")
    print(f"  RMSE: {rmse:.2f}")
    print(f"  R²:   {r2:.4f}")

    # Feature importances
    rf_model = pipeline.named_steps["model"]
    importances = rf_model.feature_importances_
    importance_pairs = sorted(zip(FEATURE_COLS, importances), key=lambda x: -x[1])

    print(f"\n--- Feature Importances (Top 10) ---")
    for name, imp in importance_pairs[:10]:
        bar = "█" * int(imp * 50)
        print(f"  {name:30s} {imp:.4f} {bar}")

    # Sample predictions
    print(f"\n--- Sample Predictions vs Actual ---")
    sample_idx = np.random.RandomState(42).choice(len(y_test), size=min(10, len(y_test)), replace=False)
    med_ids = labels.iloc[len(y_train):].iloc[sample_idx]["medication_id"].values if "medication_id" in labels.columns else ["?"] * len(sample_idx)
    for i, idx in enumerate(sample_idx):
        print(f"  Med {med_ids[i]:>3}: Actual={y_test[idx]:>3}, Predicted={y_pred[idx]:>6.1f}")

    # Save model
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")

    # Save results JSON for documentation
    results = {
        "model": "RandomForestRegressor",
        "n_estimators": 200,
        "train_samples": int(X_train.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "metrics": {"MAE": round(mae, 2), "RMSE": round(rmse, 2), "R2": round(r2, 4)},
        "feature_importances": {name: round(float(imp), 4) for name, imp in importance_pairs},
    }
    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to: {RESULTS_PATH}")

    # Quality gate
    if r2 < 0.5:
        print("\n⚠ WARNING: R² is below 0.5. Model quality may be insufficient.")
    else:
        print(f"\n✓ Model quality acceptable (R² = {r2:.4f})")

    print("Done!")


if __name__ == "__main__":
    main()
