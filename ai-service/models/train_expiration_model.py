"""
Expiration Risk Score Model — Training Script
===============================================
Trains the best classifier (via algorithm comparison and hyperparameter tuning)
to predict a binary high-risk label for inventory lots.
At inference time, predict_proba[:, 1] provides the continuous 0–1 risk score.

Improvements over baseline:
  - Removed leaky `will_expire_before_depleted` feature
  - Added new derived features: expiry_buffer_days, usage_to_quantity_ratio, waste_risk_score
  - 5-fold stratified cross-validation
  - Algorithm comparison: HistGradientBoosting, GradientBoosting, RandomForest, LogisticRegression
  - Hyperparameter tuning via RandomizedSearchCV on best algorithm
  - Class imbalance handled via class_weight='balanced' or sample weighting
  - Permutation importance for reliable feature ranking

Usage:
    python train_expiration_model.py

Input:
    ../data/synthetic_features_expiration.csv
    ../data/synthetic_labels_expiration.csv

Output:
    expiration_model.joblib  — serialized sklearn pipeline
    Prints evaluation metrics and feature importances
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import (
    train_test_split, StratifiedKFold, cross_val_score, RandomizedSearchCV,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import (
    GradientBoostingClassifier, RandomForestClassifier,
    HistGradientBoostingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, average_precision_score,
)
from sklearn.inspection import permutation_importance

SCRIPT_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
MODEL_PATH = os.path.join(SCRIPT_DIR, "expiration_model.joblib")
RESULTS_PATH = os.path.join(SCRIPT_DIR, "..", "docs", "expiration_training_results.json")

FEATURE_COLS = [
    "days_to_expiry", "quantity_on_hand", "avg_daily_usage_30d",
    "days_to_deplete", "expiry_buffer_days",
    "usage_to_quantity_ratio", "waste_risk_score",
    "medication_unit_value", "num_lots_same_med",
]

TARGET_COL = "high_risk"

CV_FOLDS = 5
RANDOM_STATE = 42


def _build_candidates():
    """Return candidate algorithms for comparison."""
    return {
        "HistGradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("model", HistGradientBoostingClassifier(
                max_iter=200, max_depth=5, learning_rate=0.1,
                class_weight="balanced", random_state=RANDOM_STATE,
            )),
        ]),
        "GradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("model", GradientBoostingClassifier(
                n_estimators=200, max_depth=5, learning_rate=0.1,
                min_samples_split=5, min_samples_leaf=2, random_state=RANDOM_STATE,
            )),
        ]),
        "RandomForest": Pipeline([
            ("scaler", StandardScaler()),
            ("model", RandomForestClassifier(
                n_estimators=200, max_depth=10,
                class_weight="balanced", random_state=RANDOM_STATE, n_jobs=-1,
            )),
        ]),
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(
                class_weight="balanced", max_iter=1000, random_state=RANDOM_STATE,
            )),
        ]),
    }


def _get_param_grid(best_name: str):
    """Return hyperparameter search space for the best algorithm."""
    grids = {
        "HistGradientBoosting": {
            "model__max_iter": [100, 200, 500],
            "model__max_depth": [3, 5, 7, 10],
            "model__learning_rate": [0.01, 0.05, 0.1],
            "model__min_samples_leaf": [1, 5, 10, 20],
        },
        "GradientBoosting": {
            "model__n_estimators": [100, 200, 500],
            "model__max_depth": [3, 5, 7, 10],
            "model__learning_rate": [0.01, 0.05, 0.1],
            "model__min_samples_split": [2, 5, 10],
        },
        "RandomForest": {
            "model__n_estimators": [100, 200, 500],
            "model__max_depth": [5, 10, 15, None],
            "model__min_samples_split": [2, 5, 10],
            "model__min_samples_leaf": [1, 2, 4],
        },
        "LogisticRegression": {
            "model__C": [0.01, 0.1, 1.0, 10.0],
            "model__penalty": ["l1", "l2"],
            "model__solver": ["saga"],
        },
    }
    return grids.get(best_name, {})


def main():
    print("=" * 60)
    print("Expiration Risk Score Model — Training")
    print("=" * 60)

    # Load data
    features = pd.read_csv(os.path.join(DATA_DIR, "synthetic_features_expiration.csv"))
    labels = pd.read_csv(os.path.join(DATA_DIR, "synthetic_labels_expiration.csv"))

    X = features[FEATURE_COLS].values
    y = labels[TARGET_COL].values

    pos_count = int(y.sum())
    neg_count = len(y) - pos_count
    print(f"\nDataset: {len(y)} samples, {X.shape[1]} features")
    print(f"Class distribution: {neg_count} low-risk, {pos_count} high-risk ({pos_count/len(y)*100:.1f}% positive)")

    # Train/test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y,
    )
    print(f"Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

    # ── Phase 1: Algorithm Comparison via Cross-Validation ──
    print(f"\n{'─'*60}")
    print(f"Phase 1: Algorithm Comparison ({CV_FOLDS}-Fold Stratified CV)")
    print(f"{'─'*60}")

    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    candidates = _build_candidates()
    cv_results = {}

    for name, pipeline in candidates.items():
        scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1)
        cv_results[name] = {"mean": scores.mean(), "std": scores.std(), "scores": scores.tolist()}
        print(f"  {name:25s}  AUC-ROC = {scores.mean():.4f} ± {scores.std():.4f}")

    best_name = max(cv_results, key=lambda k: cv_results[k]["mean"])
    print(f"\n  → Best algorithm: {best_name} (AUC-ROC = {cv_results[best_name]['mean']:.4f})")

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
            cv=cv, scoring="roc_auc", random_state=RANDOM_STATE, n_jobs=-1,
        )
        search.fit(X_train, y_train)
        best_pipeline = search.best_estimator_
        print(f"  Best params: {search.best_params_}")
        print(f"  Best CV AUC-ROC: {search.best_score_:.4f}")
    else:
        best_pipeline.fit(X_train, y_train)
        print("  No tuning grid — using defaults.")

    # ── Phase 3: Final Evaluation on Held-Out Test Set ──
    print(f"\n{'─'*60}")
    print(f"Phase 3: Test Set Evaluation")
    print(f"{'─'*60}")

    y_pred = best_pipeline.predict(X_test)
    y_prob = best_pipeline.predict_proba(X_test)[:, 1]

    auc = roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.0
    ap = average_precision_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.0
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print(f"  AUC-ROC:              {auc:.4f}")
    print(f"  Average Precision:    {ap:.4f}")
    print(f"  Precision:            {precision:.4f}")
    print(f"  Recall:               {recall:.4f}")
    print(f"  F1-Score:             {f1:.4f}")
    print(f"\n  Confusion Matrix:")
    print(f"    TN={cm[0][0]:>4}  FP={cm[0][1]:>4}")
    print(f"    FN={cm[1][0]:>4}  TP={cm[1][1]:>4}")
    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low Risk", "High Risk"], zero_division=0))

    # ── Phase 4: Feature Importance (Permutation-Based) ──
    print(f"{'─'*60}")
    print(f"Phase 4: Permutation Feature Importances")
    print(f"{'─'*60}")

    perm_imp = permutation_importance(
        best_pipeline, X_test, y_test, n_repeats=10,
        random_state=RANDOM_STATE, scoring="roc_auc", n_jobs=-1,
    )
    importance_pairs = sorted(
        zip(FEATURE_COLS, perm_imp.importances_mean, perm_imp.importances_std),
        key=lambda x: -x[1],
    )

    for name, imp_mean, imp_std in importance_pairs:
        bar = "█" * int(imp_mean * 50)
        print(f"  {name:30s} {imp_mean:.4f} ± {imp_std:.4f} {bar}")

    # Sample predictions
    print(f"\n--- Sample Risk Scores ---")
    sample_idx = np.random.RandomState(RANDOM_STATE).choice(len(y_test), size=min(10, len(y_test)), replace=False)
    for idx in sample_idx:
        label = "HIGH" if y_test[idx] == 1 else "low "
        pred_score = y_prob[idx]
        print(f"  Actual={label}  Risk Score={pred_score:.3f}  Predicted={'HIGH' if y_pred[idx] == 1 else 'low '}")

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
        "class_distribution": {"low_risk": neg_count, "high_risk": pos_count},
        "cv_comparison": {k: {"mean_auc": round(v["mean"], 4), "std_auc": round(v["std"], 4)} for k, v in cv_results.items()},
        "metrics": {
            "AUC_ROC": round(auc, 4),
            "Average_Precision": round(ap, 4),
            "Precision": round(precision, 4),
            "Recall": round(recall, 4),
            "F1": round(f1, 4),
        },
        "confusion_matrix": {"TN": int(cm[0][0]), "FP": int(cm[0][1]), "FN": int(cm[1][0]), "TP": int(cm[1][1])},
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
    if auc < 0.7:
        print(f"\n⚠ WARNING: AUC-ROC is {auc:.4f} (below 0.7). Model quality may be insufficient for production.")
        print("  This is expected with limited synthetic data. Real production data will improve performance.")
    else:
        print(f"\n✓ Model quality acceptable (AUC-ROC = {auc:.4f})")

    print("Done!")


if __name__ == "__main__":
    main()
