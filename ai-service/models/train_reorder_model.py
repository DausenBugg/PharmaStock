"""
Reorder Level Prediction Model — Training Script
==================================================
Trains the best regressor (via algorithm comparison and hyperparameter tuning)
to predict the ideal reorder threshold for each medication based on usage patterns.

Improvements over baseline:
  - Added new derived features: usage_cv, usage_7d_vs_30d_ratio, days_of_stock_remaining
  - 5-fold cross-validation
  - Algorithm comparison: HistGradientBoosting, RandomForest, GradientBoosting, Ridge
  - Hyperparameter tuning via RandomizedSearchCV on best algorithm
  - Permutation importance for reliable feature ranking
  - Added MAPE metric

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
from sklearn.model_selection import (
    train_test_split, KFold, cross_val_score, RandomizedSearchCV,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import (
    RandomForestRegressor, GradientBoostingRegressor,
    HistGradientBoostingRegressor,
)
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.inspection import permutation_importance

SCRIPT_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
MODEL_PATH = os.path.join(SCRIPT_DIR, "reorder_model.joblib")
RESULTS_PATH = os.path.join(SCRIPT_DIR, "..", "docs", "reorder_training_results.json")

FEATURE_COLS = [
    "avg_daily_usage_7d", "avg_daily_usage_30d", "avg_daily_usage_90d",
    "usage_variance_30d", "usage_trend",
    "usage_coefficient_of_variation", "usage_7d_vs_30d_ratio",
    "days_since_last_dispense",
    "total_quantity_on_hand", "num_active_lots", "days_to_nearest_expiry",
    "days_of_stock_remaining",
    "restock_frequency_30d", "day_of_week", "month",
    "form_tablet", "form_capsule", "form_oral_solution",
    "form_inhaler", "form_topical_gel", "form_other",
]

TARGET_COL = "recommended_reorder_level"

CV_FOLDS = 5
RANDOM_STATE = 42


def _build_candidates():
    """Return candidate algorithms for comparison."""
    return {
        "HistGradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("model", HistGradientBoostingRegressor(
                max_iter=200, max_depth=10, learning_rate=0.1,
                random_state=RANDOM_STATE,
            )),
        ]),
        "RandomForest": Pipeline([
            ("scaler", StandardScaler()),
            ("model", RandomForestRegressor(
                n_estimators=200, max_depth=15,
                min_samples_split=5, min_samples_leaf=2,
                random_state=RANDOM_STATE, n_jobs=-1,
            )),
        ]),
        "GradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("model", GradientBoostingRegressor(
                n_estimators=200, max_depth=5, learning_rate=0.1,
                min_samples_split=5, min_samples_leaf=2,
                random_state=RANDOM_STATE,
            )),
        ]),
        "Ridge": Pipeline([
            ("scaler", StandardScaler()),
            ("model", Ridge(alpha=1.0)),
        ]),
    }


def _get_param_grid(best_name: str):
    """Return hyperparameter search space for the best algorithm."""
    grids = {
        "HistGradientBoosting": {
            "model__max_iter": [100, 200, 500],
            "model__max_depth": [5, 10, 15, 20],
            "model__learning_rate": [0.01, 0.05, 0.1],
            "model__min_samples_leaf": [1, 5, 10, 20],
        },
        "RandomForest": {
            "model__n_estimators": [100, 200, 500],
            "model__max_depth": [10, 15, 20, None],
            "model__min_samples_split": [2, 5, 10],
            "model__min_samples_leaf": [1, 2, 4],
        },
        "GradientBoosting": {
            "model__n_estimators": [100, 200, 500],
            "model__max_depth": [3, 5, 7, 10],
            "model__learning_rate": [0.01, 0.05, 0.1],
            "model__min_samples_split": [2, 5, 10],
        },
        "Ridge": {
            "model__alpha": [0.01, 0.1, 1.0, 10.0, 100.0],
        },
    }
    return grids.get(best_name, {})


def _mape(y_true, y_pred):
    """Mean Absolute Percentage Error, avoiding division by zero."""
    mask = y_true != 0
    if mask.sum() == 0:
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


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
        X, y, test_size=0.2, random_state=RANDOM_STATE,
    )
    print(f"Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

    # ── Phase 1: Algorithm Comparison via Cross-Validation ──
    print(f"\n{'─'*60}")
    print(f"Phase 1: Algorithm Comparison ({CV_FOLDS}-Fold CV)")
    print(f"{'─'*60}")

    cv = KFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    candidates = _build_candidates()
    cv_results = {}

    for name, pipeline in candidates.items():
        scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="r2", n_jobs=-1)
        cv_results[name] = {"mean": scores.mean(), "std": scores.std(), "scores": scores.tolist()}
        print(f"  {name:25s}  R² = {scores.mean():.4f} ± {scores.std():.4f}")

    best_name = max(cv_results, key=lambda k: cv_results[k]["mean"])
    print(f"\n  → Best algorithm: {best_name} (R² = {cv_results[best_name]['mean']:.4f})")

    # ── Phase 2: Hyperparameter Tuning ──
    print(f"\n{'─'*60}")
    print(f"Phase 2: Hyperparameter Tuning ({best_name})")
    print(f"{'─'*60}")

    best_pipeline = candidates[best_name]
    param_grid = _get_param_grid(best_name)

    if param_grid:
        n_iter = min(30, np.prod([len(v) for v in param_grid.values()]))
        search = RandomizedSearchCV(
            best_pipeline, param_grid, n_iter=int(n_iter),
            cv=cv, scoring="r2", random_state=RANDOM_STATE, n_jobs=-1,
        )
        search.fit(X_train, y_train)
        best_pipeline = search.best_estimator_
        print(f"  Best params: {search.best_params_}")
        print(f"  Best CV R²: {search.best_score_:.4f}")
    else:
        best_pipeline.fit(X_train, y_train)
        print("  No tuning grid — using defaults.")

    # ── Phase 3: Final Evaluation on Held-Out Test Set ──
    print(f"\n{'─'*60}")
    print(f"Phase 3: Test Set Evaluation")
    print(f"{'─'*60}")

    y_pred = best_pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = r2_score(y_test, y_pred)
    mape = _mape(y_test, y_pred)

    print(f"  MAE:   {mae:.2f}")
    print(f"  RMSE:  {rmse:.2f}")
    print(f"  R²:    {r2:.4f}")
    print(f"  MAPE:  {mape:.2f}%")

    # ── Phase 4: Feature Importance (Permutation-Based) ──
    print(f"\n{'─'*60}")
    print(f"Phase 4: Permutation Feature Importances")
    print(f"{'─'*60}")

    perm_imp = permutation_importance(
        best_pipeline, X_test, y_test, n_repeats=10,
        random_state=RANDOM_STATE, scoring="r2", n_jobs=-1,
    )
    importance_pairs = sorted(
        zip(FEATURE_COLS, perm_imp.importances_mean, perm_imp.importances_std),
        key=lambda x: -x[1],
    )

    for name, imp_mean, imp_std in importance_pairs[:15]:
        bar = "█" * int(imp_mean * 50)
        print(f"  {name:35s} {imp_mean:.4f} ± {imp_std:.4f} {bar}")

    # Sample predictions
    print(f"\n--- Sample Predictions vs Actual ---")
    sample_idx = np.random.RandomState(RANDOM_STATE).choice(len(y_test), size=min(10, len(y_test)), replace=False)
    for idx in sample_idx:
        print(f"  Actual={y_test[idx]:>3}, Predicted={y_pred[idx]:>6.1f}")

    # Save model
    joblib.dump(best_pipeline, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")

    # Save results JSON
    best_model_obj = best_pipeline.named_steps["model"]
    best_params = best_model_obj.get_params()

    results = {
        "model": best_name,
        "best_params": {k: v for k, v in best_params.items() if not callable(v)},
        "train_samples": int(X_train.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "cv_comparison": {k: {"mean_r2": round(v["mean"], 4), "std_r2": round(v["std"], 4)} for k, v in cv_results.items()},
        "metrics": {
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4),
            "MAPE": round(mape, 2),
        },
        "permutation_importances": {
            name: {"mean": round(float(imp_mean), 4), "std": round(float(imp_std), 4)}
            for name, imp_mean, imp_std in importance_pairs
        },
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
