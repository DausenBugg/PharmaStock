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


@app.post("/predict/batch-reorder", response_model=BatchReorderResponse)
def predict_batch_reorder(request: BatchReorderRequest):
    try:
        predictions = [prediction_service.predict_reorder(med) for med in request.medications]
        return BatchReorderResponse(predictions=predictions)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))



@app.post("/predict/expiration-risk", response_model=ExpirationRiskResponse)
def predict_expiration_risk(request: ExpirationRiskRequest):
    try:
        return prediction_service.predict_expiration_risk(request)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/predict/batch-expiration", response_model=BatchExpirationResponse)
def predict_batch_expiration(request: BatchExpirationRequest):
    try:
        scores = [prediction_service.predict_expiration_risk(item) for item in request.inventory_items]
        return BatchExpirationResponse(risk_scores=scores)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
