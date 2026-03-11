# 🧠 Building an AI-Powered Inventory Prediction System from Scratch

### A hands-on lesson from the PharmaStock project — predicting medication reorder points and expiration risk with scikit-learn, FastAPI, .NET, and Angular

---

## The Problem: One-Size-Fits-All Reorder Levels Don't Work

Picture a pharmacy with hundreds of medications. Ibuprofen flies off the shelves daily — you need to reorder when you hit 60 units. But that niche topical gel? It moves 1 unit per week — reordering at 60 would be absurd. And what about that batch of Lisinopril expiring in 2 weeks with 90 tablets still on the shelf? That's money about to hit the dumpster.

Static reorder levels and manual expiration checks don't scale. What if the system could **learn** each medication's usage pattern and alert you dynamically?

That's exactly what we built.

---

## What We Built

Two machine learning models integrated into a full-stack pharmacy inventory application:

1. **Reorder Level Predictor** — A regression model that recommends a dynamic reorder threshold per medication. Popular, high-movement drugs get higher thresholds (alert at ~60); slow-moving, niche drugs get lower ones (~10).

2. **Expiration Risk Scorer** — A classification model that assigns a 0–100% risk score to each inventory lot, indicating the probability it will expire before being consumed.

### Architecture at a Glance

```
┌─────────────┐      ┌──────────────┐      ┌───────────────────┐
│   Angular    │ ←──→ │  .NET 8 API  │ ←──→ │  Python FastAPI    │
│  Frontend    │      │  (C#)        │      │  ML Microservice   │
│              │      │              │      │                    │
│ • Dashboard  │      │ • REST APIs  │      │ • scikit-learn     │
│   AI cards   │      │ • EF Core    │      │ • Reorder model    │
│ • Inventory  │      │ • MySQL      │      │ • Expiration model │
│   risk col.  │      │ • UsageHist. │      │ • Feature eng.     │
└─────────────┘      └──────────────┘      └───────────────────┘
```

---

## Lesson 1: You Can't Predict What You Don't Track

**The first thing we built wasn't an ML model — it was a database table.**

The existing `InventoryStock` table held only *current state*: "There are 50 tablets on Shelf A1." But ML needs *history*: "Over the past 30 days, 12 tablets were dispensed per day on average."

We added a `UsageHistory` table to the .NET/EF Core backend:

```csharp
public class UsageHistory
{
    public int UsageHistoryId { get; set; }
    public int InventoryStockId { get; set; }    // Which lot?
    public int MedicationId { get; set; }         // Which drug?
    public int QuantityChanged { get; set; }      // How many?
    public string ChangeType { get; set; }        // "Dispensed", "Restocked", "Expired_Disposal"
    public DateTime OccurredAtUtc { get; set; }   // When?
}
```

**Key insight**: Every inventory adjustment now automatically logs a `UsageHistory` record. This creates the production data pipeline — real usage events accumulate over time, giving the model increasingly accurate training data.

```csharp
// Inside InventoryStockService.AdjustInventoryStockAsync():
var changeType = request.Adjustment < 0 ? "Dispensed" : "Restocked";
_context.UsageHistories.Add(new UsageHistory
{
    InventoryStockId = stock.InventoryStockId,
    MedicationId = stock.MedicationId,
    QuantityChanged = Math.Abs(request.Adjustment),
    ChangeType = changeType,
    OccurredAtUtc = DateTime.UtcNow
});
```

**Takeaway**: Before thinking about algorithms, think about *data infrastructure*. The model is only as good as the signals it can see.

---

## Lesson 2: Feature Engineering Is 80% of the Work

Raw data (timestamps and quantities) isn't what the model sees. We engineer *features* — meaningful numeric representations:

| Raw Data | Engineered Feature | Why It Matters |
|----------|-------------------|----------------|
| 90 dispense records over 30 days | `avg_daily_usage_30d = 3.0` | Captures consumption rate |
| Usage fluctuates wildly | `usage_variance_30d = 15.2` | High variance → unreliable demand → higher safety buffer |
| Usage increasing over time | `usage_trend = +0.15` | Growing demand → proactively raise reorder point |
| Last dispense was 45 days ago | `days_since_last_dispense = 45` | Stagnant drug → don't waste shelf space |
| Lot expires in 10 days, 90 units on hand, avg usage = 2/day | `will_expire_before_depleted = 1` | 10 < 90/2 = 45 → waste is inevitable |

The feature engineering code computes rolling averages, variance, trend slopes (linear regression), restock frequency, and derived flags — all from the same `UsageHistory` table.

**Takeaway**: The features you choose determine your model's ceiling. Spend time here. A simple model with great features will outperform a complex model with poor features every time.

---

## Lesson 3: Synthetic Data Bootstraps a Cold-Start Problem

A brand-new pharmacy has no historical data. Our solution: **generate realistic synthetic data** based on domain knowledge.

We simulated 12 months of pharmacy operations for 10 medications:

- **High-movers** (Ibuprofen, Acetaminophen): ~12 dispenses/day with seasonal flu spikes in winter
- **Medium-movers** (Amoxicillin, Omeprazole): ~5/day
- **Slow-movers** (Albuterol Inhaler, Topical Gel): ~1/day
- **Weekend dips**: Dispensing drops 40–70% on weekends
- **Restocking**: Automatic when any lot drops below 20% capacity
- **Edge cases**: Expired disposals, manual adjustments, stockout events

This produced **6,162 transaction records** — enough to compute feature matrices at multiple time snapshots throughout the year, yielding **920 reorder training samples** and **1,012 expiration risk samples**.

```python
# Multi-snapshot: compute features at many points in time
for day_offset in range(90, 365, 3):  # Every 3 days
    ref_date = START_DATE + timedelta(days=day_offset)
    features = compute_reorder_features(usage_df, ref_date)
    labels = compute_reorder_labels(features)
```

**Takeaway**: Synthetic data isn't cheating — it's bootstrapping. Use domain experts to set realistic parameters, then let the model retrain on real data as it accumulates.

---

## Lesson 4: Choose Algorithms That Fit Your Data

### For Reorder Levels: RandomForestRegressor

Why? This is a **regression** problem (predict a number: the ideal reorder threshold). Random Forests excel with:
- Tabular data (rows and columns, not images or text)
- Non-linear relationships (usage patterns aren't simple linear formulas)
- Interpretable feature importances (tell us *why* it predicted what it did)
- Small-to-medium datasets (hundreds to thousands of rows)

```python
pipeline = Pipeline([
    ("scaler", StandardScaler()),        # Normalize feature scales
    ("model", RandomForestRegressor(
        n_estimators=200,                # 200 decision trees
        max_depth=15,                    # Prevent overfitting
        random_state=42,                 # Reproducibility
    )),
])
```

**Results**: R² = 0.9999, MAE = 0.12 — the model learned the reorder formula almost perfectly.

### For Expiration Risk: GradientBoostingClassifier

Why? This is a **classification** problem (high-risk vs. low-risk), and we use `predict_proba` to get a continuous 0–1 score.

- Gradient Boosting handles class imbalance well (only 3.2% of lots were high-risk)
- We used stratified train/test splits to preserve class ratios
- The model achieves AUC-ROC = 1.0 on synthetic data

**Results**: Perfect classification — expected with synthetic data where the "will it expire before depletion?" signal is deterministic. Real data will introduce noise that makes the other features more important.

### Top Feature Importances (Reorder Model)

```
avg_daily_usage_90d      ██████████████  0.28
usage_variance_30d       █████████████   0.27
avg_daily_usage_30d      ████████████    0.24
total_quantity_on_hand   ██████████      0.20
```

**Takeaway**: The model learned what pharmacists intuitively know — reorder thresholds should be driven by *how fast things move* and *how predictably they move*.

---

## Lesson 5: Microservice Architecture — Python Does What Python Does Best

Instead of embedding ML logic in C#, we built a **FastAPI microservice** in Python. This keeps each technology in its sweet spot:

| Layer | Technology | Responsibility |
|-------|-----------|---------------|
| Frontend | Angular + Material | Display AI widgets, risk badges |
| Backend | .NET 8 + EF Core | Business logic, auth, data access |
| ML Service | Python + FastAPI | Model loading, feature engineering, prediction |
| Database | MySQL 8.0 | Persistent storage |

The .NET backend acts as a **gateway** — it pulls inventory and usage data from MySQL, packages it into the format the Python service expects, and forwards the request:

```csharp
// .NET calls Python FastAPI
var response = await _httpClient.PostAsJsonAsync("/predict/batch-reorder", batchRequest);
var result = await response.Content.ReadFromJsonAsync<BatchReorderResult>();
```

The Python service loads the serialized `.joblib` models on startup and serves predictions in milliseconds:

```python
@app.post("/predict/reorder")
def predict_reorder(request: ReorderPredictionRequest):
    features = build_reorder_features(...)
    prediction = _reorder_model.predict(features)[0]
    return ReorderPredictionResponse(
        recommended_reorder_level=int(np.clip(round(prediction), 5, 100)),
        ...
    )
```

**Takeaway**: Don't fight the ecosystem. Python/scikit-learn for ML + C#/.NET for APIs + Angular for UI is a clean separation of concerns.

---

## Lesson 6: What the User Actually Sees

### Dashboard — AI Cards

Two new cards appear on the pharmacy dashboard:

**🤖 AI Reorder Alerts** — Shows medications where current stock is at or below the AI-recommended reorder level:
- **POPULAR** badge (red) for high-movement drugs
- **SLOW** badge (gray) for low-movement drugs
- Confidence percentage from the model's tree variance

**🤖 Expiration Risk** — Shows the top 5 highest-risk inventory lots:
- **Critical** (red) for ≥75% risk
- **High** (orange) for ≥50% risk
- Days to expiry and estimated days to deplete

### Inventory Table — AI Risk Column

A new "AI Risk" column appears in the inventory table with color-coded percentage badges, matching the existing health-critical (red) and health-warning (orange) styling.

---

## Lesson 7: The Model Will Get Better Over Time

The synthetic data gave us a working model, but the *real* power comes from the `UsageHistory` pipeline we wired in. Every time a pharmacist:

- Dispenses medication → `UsageHistory` record created
- Restocks a lot → `UsageHistory` record created
- Makes a manual adjustment → `UsageHistory` record created

This data accumulates. In a month, there will be thousands of *real* records. The model can be retrained on actual usage patterns — capturing things synthetic data can't:

- **Flu season spikes** that are hospital-specific
- **Supply chain disruptions** affecting specific drugs
- **Prescriber preference changes** shifting demand
- **Insurance formulary updates** altering which drugs get dispensed

---

## Summary: What We Learned

| # | Lesson | Key Point |
|---|--------|-----------|
| 1 | Data infrastructure first | You can't predict what you don't track. Add the `UsageHistory` table *before* building the model. |
| 2 | Feature engineering dominates | Transform raw timestamps into rolling averages, variance, trends. This is where domain knowledge meets ML. |
| 3 | Synthetic data solves cold-start | Generate realistic data based on domain expertise. The real data pipeline runs in parallel. |
| 4 | Match algorithm to problem | RandomForest for regression, GradientBoosting for classification. Both excel on tabular data. |
| 5 | Microservices keep things clean | Python for ML, C# for APIs, Angular for UI. Each technology in its sweet spot. |
| 6 | Surface predictions in the UI | ML value only matters if users see it — dashboard cards and table columns make insights actionable. |
| 7 | Plan for improvement | The model improves automatically as real data flows through the `UsageHistory` pipeline. |

---

## Files Created in This Project

```
ai-service/
├── app/
│   ├── main.py                  ← FastAPI application (5 endpoints)
│   ├── models.py                ← Pydantic request/response schemas
│   ├── prediction_service.py    ← Model loading and prediction logic
│   └── feature_engineering.py   ← Raw data → feature vector transforms
├── models/
│   ├── train_reorder_model.py   ← RandomForest training script
│   ├── train_expiration_model.py← GradientBoosting training script
│   ├── reorder_model.joblib     ← Serialized reorder model
│   └── expiration_model.joblib  ← Serialized expiration model
├── data/
│   ├── generate_synthetic_data.py ← 12-month pharmacy simulation
│   ├── validate_data.py           ← Data quality checks
│   └── *.csv                      ← Generated datasets
├── docs/
│   ├── feature_set.md           ← AI feature documentation
│   └── training_results.md      ← Model performance metrics
├── Dockerfile
└── requirements.txt

PharmaStock/ (modified)
├── Data/Entities/UsageHistory.cs      ← New entity
├── Data/PharmaStockDBContext.cs        ← +DbSet, +config, +timestamps
├── Services/
│   ├── InventoryService.cs            ← +UsageHistory logging
│   └── AIPredictionService/           ← New: calls Python ML service
├── Controllers/PredictionsController.cs ← New: /api/predictions/*
└── Dtos/Responses/
    ├── ReorderPredictionResponse.cs    ← New DTO
    └── ExpirationRiskResponse.cs       ← New DTO

frontend/src/app/ (modified)
├── services/prediction.service.ts     ← New: Angular API client
├── dashboard/dashboard.ts + .html     ← +AI cards
└── inventory/inventory.ts + .html     ← +AI Risk column
```

---

*Built with scikit-learn 1.8, FastAPI 0.115, .NET 8, Angular, and a whole lot of feature engineering.*
