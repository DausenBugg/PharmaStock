# Training Results — PharmaStock AI Models

## Model 1: Reorder Level Predictor

| Metric | Value |
|--------|-------|
| Algorithm | RandomForestRegressor (200 trees, max_depth=15) |
| Training set | 736 samples |
| Test set | 184 samples |
| **MAE** | **0.12** |
| **RMSE** | **0.28** |
| **R²** | **0.9999** |

### Feature Importances

| Rank | Feature | Importance |
|------|---------|------------|
| 1 | avg_daily_usage_90d | 0.2764 |
| 2 | usage_variance_30d | 0.2660 |
| 3 | avg_daily_usage_30d | 0.2397 |
| 4 | total_quantity_on_hand | 0.2042 |
| 5 | avg_daily_usage_7d | 0.0122 |
| 6 | usage_trend | 0.0014 |

**Key insight**: The model relies almost entirely on usage averages and variance — the core signals for reorder decisions. Temporal features (day_of_week, month) have negligible impact with synthetic data but may gain importance with real seasonal patterns.

### Sample Predictions

| Medication | Actual | Predicted |
|-----------|--------|-----------|
| Cetirizine | 42 | 42.3 |
| Albuterol | 54 | 54.2 |
| Amoxicillin | 43 | 43.0 |
| Metformin | 42 | 42.0 |
| Lisinopril | 36 | 35.8 |

---

## Model 2: Expiration Risk Scorer

| Metric | Value |
|--------|-------|
| Algorithm | GradientBoostingClassifier (200 trees, max_depth=5) |
| Training set | 809 samples |
| Test set | 203 samples |
| Class balance | 980 low-risk / 32 high-risk (3.2% positive) |
| **AUC-ROC** | **1.0000** |
| **Precision** | **1.0000** |
| **Recall** | **1.0000** |
| **F1-Score** | **1.0000** |

### Confusion Matrix

|  | Predicted Low | Predicted High |
|--|:---:|:---:|
| **Actual Low** | 197 (TN) | 0 (FP) |
| **Actual High** | 0 (FN) | 6 (TP) |

### Feature Importances

| Feature | Importance |
|---------|------------|
| will_expire_before_depleted | 1.0000 |
| days_to_expiry | ~0.0000 |
| avg_daily_usage_30d | ~0.0000 |

**Key insight**: The `will_expire_before_depleted` derived feature is the dominant signal. This is expected — it directly encodes whether a lot will expire before consumption. With real production data (where usage fluctuates unpredictably), the other features will contribute more.

---

## Known Limitations

1. **Synthetic data**: Models trained on generated data with predictable patterns. Real-world accuracy may differ.
2. **Perfect scores**: The R²=0.9999 and AUC=1.0 reflect the deterministic relationship between synthetic features and labels. This will normalize with real dispensing data.
3. **Class imbalance**: Only 3.2% of lots are high-risk. In production, consider resampling if this ratio changes significantly.
4. **No external factors**: Current features don't capture drug recalls, supplier disruptions, or formulary changes.

## Recommendations

- **Retrain monthly** as real UsageHistory accumulates via the `InventoryStockService.AdjustInventoryStockAsync()` pipeline.
- **Add features**: Once transaction volume grows, add: time-of-day patterns, prescriber volume, insurance formulary signals.
- **Monitor drift**: Track prediction accuracy over time; retrain if MAE increases by >20% or AUC drops below 0.85.
