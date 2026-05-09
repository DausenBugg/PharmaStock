from contextlib import asynccontextmanager
import logging
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

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    prediction_service.load_models()
    reorder_ok, expiration_ok = prediction_service.models_loaded()
    logger.info("Models loaded - Reorder: %s, Expiration: %s", reorder_ok, expiration_ok)
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
    logger.debug("batch reorder hit")
    logger.debug("medications count: %s", len(request.medications))
    try:
        predictions = [prediction_service.predict_reorder(med) for med in request.medications]
        logger.debug("batch reorder finished")
        return BatchReorderResponse(predictions=predictions)
    except RuntimeError as e:
        logger.warning("runtime error: %s", e)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("unexpected error: %s", e)
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
    logger.debug("batch expiration hit")
    logger.debug("inventory items count: %s", len(request.inventory_items))
    try:
        scores = [prediction_service.predict_expiration_risk(item) for item in request.inventory_items]
        logger.debug("batch expiration finished")
        return BatchExpirationResponse(risk_scores=scores)
    except RuntimeError as e:
        logger.warning("runtime error: %s", e)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("unexpected error: %s", e)
        raise
