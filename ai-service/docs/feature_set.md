# AI Feature Set — PharmaStock Inventory Prediction

## Overview

Two ML models power the PharmaStock AI prediction system:
1. **Reorder Level Predictor** — Recommends a dynamic reorder threshold per medication based on its usage patterns (popular drugs trigger alerts earlier; slow movers wait longer).
2. **Expiration Risk Scorer** — Assigns a 0–1 risk score indicating the likelihood a specific inventory lot will expire before being fully consumed.

Both models consume features engineered from three data sources: `UsageHistory` (transaction log), `InventoryStock` (current state), and `Medication` (catalog metadata).

---

## Data Sources

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `UsageHistory` | Every dispensing, restock, and adjustment event | `MedicationId`, `InventoryStockId`, `QuantityChanged`, `ChangeType`, `OccurredAtUtc` |
| `InventoryStock` | Current inventory state per lot | `QuantityOnHand`, `ReorderLevel`, `ExpirationDate`, `BeyondUseDate`, `BinLocation`, `LotNumber` |
| `Medication` | Drug catalog metadata | `Name`, `Form`, `Strength`, `Manufacturer`, `NationalDrugCode` |

### ChangeType Values
| Value | Meaning |
|-------|---------|
| `Dispensed` | Units removed — given to patient/customer |
| `Restocked` | Units added — new supply received |
| `Adjustment` | Manual correction (positive or negative) |
| `Expired_Disposal` | Units removed because they expired |

---

## Model 1: Reorder Level Predictor

**Task**: Regression — predict the ideal `recommended_reorder_level` for a medication.

### Input Features

| # | Feature Name | Type | Source | Engineering Logic |
|---|-------------|------|--------|-------------------|
| 1 | `avg_daily_usage_7d` | float | UsageHistory | Mean of daily dispensed quantities over the last 7 days |
| 2 | `avg_daily_usage_30d` | float | UsageHistory | Mean of daily dispensed quantities over the last 30 days |
| 3 | `avg_daily_usage_90d` | float | UsageHistory | Mean of daily dispensed quantities over the last 90 days |
| 4 | `usage_variance_30d` | float | UsageHistory | Variance of daily dispensed quantities over 30 days (captures demand volatility) |
| 5 | `usage_trend` | float | UsageHistory | Slope of linear regression on daily usage over last 30 days (positive = increasing demand) |
| 6 | `usage_coefficient_of_variation` | float | Derived | `std_30d / max(avg_30d, 0.01)` — normalized volatility (scale-independent) |
| 7 | `usage_7d_vs_30d_ratio` | float | Derived | `avg_7d / max(avg_30d, 0.01)` — short-term vs long-term trend signal |
| 8 | `days_since_last_dispense` | int | UsageHistory | Days since the most recent `Dispensed` event for this medication |
| 9 | `total_quantity_on_hand` | int | InventoryStock | SUM(`QuantityOnHand`) across all non-expired lots for this medication |
| 10 | `num_active_lots` | int | InventoryStock | COUNT of lots where `ExpirationDate` > today |
| 11 | `days_to_nearest_expiry` | int | InventoryStock | MIN(`ExpirationDate` - today) across active lots |
| 12 | `days_of_stock_remaining` | float | Derived | `total_quantity_on_hand / max(avg_daily_usage_30d, 0.01)` — stock coverage in days |
| 13 | `medication_form` | categorical | Medication | One-hot encoded: Tablet, Capsule, Oral Solution, Inhaler, Topical Gel, Other |
| 14 | `restock_frequency_30d` | int | UsageHistory | COUNT of `Restocked` events in the last 30 days |
| 15 | `day_of_week` | int (0-6) | Derived | Current day of week (0=Monday) — captures weekly patterns |
| 16 | `month` | int (1-12) | Derived | Current month — captures seasonal patterns |

### Target Variable

| Name | Type | Description |
|------|------|-------------|
| `recommended_reorder_level` | int | The stock quantity at which a reorder alert should fire. Popular, high-usage drugs get higher thresholds (e.g., ~60); slow-moving or niche drugs get lower thresholds (e.g., ~10). |

### Label Generation Logic (for synthetic training data)

```
base_reorder = avg_daily_usage_30d × lead_time_days × safety_factor

where:
  lead_time_days = 7  (assumed 1 week restock lead time)
  safety_factor  = 1.5 (50% buffer for demand variance)

Adjustments:
  if usage_variance_30d > threshold → increase safety_factor to 2.0
  if usage_trend > 0               → increase by 10% (growing demand)
  Clamp result to range [5, 100]
```

---

## Model 2: Expiration Risk Scorer

**Task**: Binary classification → use `predict_proba` for a 0–1 risk score.

### Input Features

| # | Feature Name | Type | Source | Engineering Logic |
|---|-------------|------|--------|-------------------|
| 1 | `days_to_expiry` | int | InventoryStock | `ExpirationDate` - today (negative if already expired) |
| 2 | `quantity_on_hand` | int | InventoryStock | Current stock of this specific lot |
| 3 | `avg_daily_usage_30d` | float | UsageHistory | Mean daily usage for this medication over 30 days |
| 4 | `days_to_deplete` | float | Derived | `quantity_on_hand / max(avg_daily_usage_30d, 0.01)` — estimated days until lot is consumed |
| 5 | `expiry_buffer_days` | float | Derived | `days_to_expiry - days_to_deplete` — margin before expiry (negative = will expire before consumed) |
| 6 | `usage_to_quantity_ratio` | float | Derived | `avg_daily_usage_30d / max(quantity_on_hand, 1)` — depletion intensity |
| 7 | `waste_risk_score` | float | Derived | `quantity_on_hand × medication_unit_value / max(days_to_expiry, 1)` — financial risk proxy |
| 8 | `medication_unit_value` | float | Config | Relative cost/value of the drug (1.0 = standard, >1 = high-value, configurable) |
| 9 | `num_lots_same_med` | int | InventoryStock | COUNT of other active lots for the same medication |

### Target Variable

| Name | Type | Description |
|------|------|-------------|
| `expiration_risk_score` | float (0.0–1.0) | Probability that this lot will result in waste due to expiration. Higher scores indicate higher risk. |

### Label Generation Logic (for synthetic training data)

```
Binary label (for classification training):
  high_risk = 1 if:
    - days_to_expiry < days_to_deplete  (won't be consumed in time)
    - OR days_to_expiry < 30 AND quantity_on_hand > avg_daily_usage_30d × 30
    - OR days_to_expiry < 0  (already expired)
  else:
    high_risk = 0

At inference time, use predict_proba[:, 1] as the continuous risk score.
```

---

## Feature Alignment with Available Data

| Feature | Available in DB? | Notes |
|---------|------------------|-------|
| Usage history (dispensed/restocked) | ✅ Yes — `UsageHistory` table | New table added for AI |
| Quantity on hand | ✅ Yes — `InventoryStock.QuantityOnHand` | |
| Expiration date | ✅ Yes — `InventoryStock.ExpirationDate` | |
| Beyond use date | ✅ Yes — `InventoryStock.BeyondUseDate` | Available but not used by models (expiration is more relevant) |
| Medication form | ✅ Yes — `Medication.Form` | Needs one-hot encoding |
| Reorder level (current static) | ✅ Yes — `InventoryStock.ReorderLevel` | Used as baseline; AI predicts a dynamic replacement |
| Medication unit value | ⚠️ Not in DB | Provided as configurable lookup in Python service |
| Lot/bin information | ✅ Yes — `InventoryStock.LotNumber`, `BinLocation` | Not used as ML features (too granular) |

---

## Reviewed and Approved

- [x] Features align with available inventory data
- [x] Input/output fields defined for both models
- [x] Feature engineering logic documented
- [x] Label generation strategies specified
