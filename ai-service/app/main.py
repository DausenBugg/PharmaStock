from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    ReorderPredictionRequest, ReorderPredictionResponse,
    BatchReorderRequest, BatchReorderResponse,
    ExpirationRiskRequest, ExpirationRiskResponse,
    BatchExpirationRequest, BatchExpirationResponse,
    HealthResponse,
)
from . import prediction_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    prediction_service.load_models()
    reorder_ok, expiration_ok = prediction_service.models_loaded()
    print(f"Models loaded — Reorder: {reorder_ok}, Expiration: {expiration_ok}")
    yield


app = FastAPI(
    title="PharmaStock AI Prediction Service",
    version="1.0.0",
    description="ML-powered reorder level and expiration risk predictions for pharmacy inventory.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5177", "http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/health", response_model=HealthResponse)
def health_check():
    reorder_ok, expiration_ok = prediction_service.models_loaded()
    return HealthResponse(
        status="ok",
        models_loaded=reorder_ok and expiration_ok,
        reorder_model_loaded=reorder_ok,
        expiration_model_loaded=expiration_ok,
    )



@app.post("/predict/reorder", response_model=ReorderPredictionResponse)
def predict_reorder(request: ReorderPredictionRequest):
    try:
        return prediction_service.predict_reorder(request)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

# Added some error handling and logging to the batch reorder endpoint to help diagnose any issues that may arise when processing multiple medications in a single request.
#  This will allow us to better understand if there are specific medications or data points that are causing problems with the prediction service, 
# and to ensure that we return appropriate error responses to the client if something goes wrong during batch processing.
@app.post("/predict/batch-reorder", response_model=BatchReorderResponse)
def predict_batch_reorder(request: BatchReorderRequest):
    print("batch reorder hit")
    print(f"medications count: {len(request.medications)}")
    try:
        predictions = [prediction_service.predict_reorder(med) for med in request.medications]
        print("batch reorder finished")
        return BatchReorderResponse(predictions=predictions)
    except RuntimeError as e:
        print(f"runtime error: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"unexpected error: {e}")
        raise




# ─── Expiration Risk Predictions ─────────────────────────────────────────────

@app.post("/predict/expiration-risk", response_model=ExpirationRiskResponse)
def predict_expiration_risk(request: ExpirationRiskRequest):
    try:
        return prediction_service.predict_expiration_risk(request)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/predict/batch-expiration", response_model=BatchExpirationResponse)
def predict_batch_expiration(request: BatchExpirationRequest):
    print("batch expiration hit")
    print(f"inventory items count: {len(request.inventory_items)}")
    try:
        scores = [prediction_service.predict_expiration_risk(item) for item in request.inventory_items]
        print("batch expiration finished")
        return BatchExpirationResponse(risk_scores=scores)
    except RuntimeError as e:
        print(f"runtime error: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"unexpected error: {e}")
        raise
