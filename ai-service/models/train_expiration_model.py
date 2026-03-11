"""
Expiration Risk Score Model — Training Script
===============================================
Trains a GradientBoostingClassifier to predict a binary high-risk label
for inventory lots.  At inference time, predict_proba[:, 1] provides
the continuous 0–1 risk score.

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
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
)

SCRIPT_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
MODEL_PATH = os.path.join(SCRIPT_DIR, "expiration_model.joblib")
RESULTS_PATH = os.path.join(SCRIPT_DIR, "..", "docs", "expiration_training_results.json")

FEATURE_COLS = [
    "days_to_expiry", "quantity_on_hand", "avg_daily_usage_30d",
    "days_to_deplete", "will_expire_before_depleted",
    "medication_unit_value", "num_lots_same_med",
]

TARGET_COL = "high_risk"


def main():
    print("=" * 60)
    print("Expiration Risk Score Model — Training")
    print("=" * 60)

    # Load data
    features = pd.read_csv(os.path.join(DATA_DIR, "synthetic_features_expiration.csv"))
    labels = pd.read_csv(os.path.join(DATA_DIR, "synthetic_labels_expiration.csv"))

    X = features[FEATURE_COLS].values
    y = labels[TARGET_COL].values

    pos_count = y.sum()
    neg_count = len(y) - pos_count
    print(f"\nDataset: {len(y)} samples, {X.shape[1]} features")
    print(f"Class distribution: {int(neg_count)} low-risk, {int(pos_count)} high-risk ({pos_count/len(y)*100:.1f}% positive)")

    # Train/test split with stratification to handle class imbalance
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")

    # Build pipeline
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", GradientBoostingClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
        )),
    ])

    # Train
    print("\nTraining GradientBoostingClassifier...")
    pipeline.fit(X_train, y_train)

    # Predict
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    # Evaluate
    auc = roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.0
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n--- Evaluation Metrics ---")
    print(f"  AUC-ROC:   {auc:.4f}")
    print(f"  Precision:  {precision:.4f}")
    print(f"  Recall:     {recall:.4f}")
    print(f"  F1-Score:   {f1:.4f}")
    print(f"\n  Confusion Matrix:")
    print(f"    TN={cm[0][0]:>4}  FP={cm[0][1]:>4}")
    print(f"    FN={cm[1][0]:>4}  TP={cm[1][1]:>4}")
    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low Risk", "High Risk"], zero_division=0))

    # Feature importances
    gb_model = pipeline.named_steps["model"]
    importances = gb_model.feature_importances_
    importance_pairs = sorted(zip(FEATURE_COLS, importances), key=lambda x: -x[1])

    print(f"--- Feature Importances ---")
    for name, imp in importance_pairs:
        bar = "█" * int(imp * 50)
        print(f"  {name:35s} {imp:.4f} {bar}")

    # Sample predictions with risk scores
    print(f"\n--- Sample Risk Scores ---")
    sample_idx = np.random.RandomState(42).choice(len(y_test), size=min(10, len(y_test)), replace=False)
    for idx in sample_idx:
        label = "HIGH" if y_test[idx] == 1 else "low "
        pred_score = y_prob[idx]
        print(f"  Actual={label}  Risk Score={pred_score:.3f}  Predicted={'HIGH' if y_pred[idx] == 1 else 'low '}")

    # Save model
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")

    # Save results JSON for documentation
    results = {
        "model": "GradientBoostingClassifier",
        "n_estimators": 200,
        "train_samples": int(X_train.shape[0]),
        "test_samples": int(X_test.shape[0]),
        "class_distribution": {"low_risk": int(neg_count), "high_risk": int(pos_count)},
        "metrics": {
            "AUC_ROC": round(auc, 4),
            "Precision": round(precision, 4),
            "Recall": round(recall, 4),
            "F1": round(f1, 4),
        },
        "confusion_matrix": {"TN": int(cm[0][0]), "FP": int(cm[0][1]), "FN": int(cm[1][0]), "TP": int(cm[1][1])},
        "feature_importances": {name: round(float(imp), 4) for name, imp in importance_pairs},
    }
    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)
    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to: {RESULTS_PATH}")

    # Quality gate
    if auc < 0.7:
        print(f"\n⚠ WARNING: AUC-ROC is {auc:.4f} (below 0.7). Model quality may be insufficient for a production system.")
        print("  This is expected with limited synthetic data. Real production data will improve performance.")
    else:
        print(f"\n✓ Model quality acceptable (AUC-ROC = {auc:.4f})")

    print("Done!")


if __name__ == "__main__":
    main()
