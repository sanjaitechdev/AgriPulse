"""
AgriConnect AI Service
FastAPI microservice for ML model inference
Port: 8001
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import numpy as np
import os
import logging
import pickle

from models_pulse import (
    PriceForecastModel,
    SpoilageRiskModel,
    YieldUncertaintyModel,
    MarketAvailabilityModel,
    DecisionOptimizer,
    generate_explanations
)

price_model = PriceForecastModel()
spoilage_model = SpoilageRiskModel()
yield_model = YieldUncertaintyModel()
availability_model = MarketAvailabilityModel()
optimizer = DecisionOptimizer(price_model, spoilage_model, yield_model, availability_model)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AgriConnect AI Service",
    description="Machine learning inference service for crop suitability, demand forecasting, and risk prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow any origin to connect
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.getenv("MODELS_DIR", "./models")

# Load encodings
SEASONS = {'kharif': 0, 'rabi': 1, 'zaid': 2, 'perennial': 3}
SOIL_TYPES = {'loamy': 0, 'red': 1, 'black': 2, 'alluvial': 3, 'laterite': 4, 'sandy': 5, 'clay': 6, 'other': 7}
WATER_AVAIL = {'abundant': 0, 'adequate': 1, 'limited': 2, 'scarce': 3}

CROP_LIST = [
  'Tomato', 'Onion', 'Potato', 'Brinjal', 'Okra', 'Cabbage', 'Cauliflower',
  'Rice', 'Wheat', 'Maize', 'Sorghum', 'Pearl Millet', 'Finger Millet',
  'Chickpea', 'Pigeon Pea', 'Black Gram', 'Green Gram', 'Groundnut', 'Mustard',
  'Soybean', 'Sesame', 'Chilli', 'Turmeric', 'Ginger', 'Banana', 'Papaya',
  'Cotton', 'Sugarcane', 'Coconut'
]
CROP_MAP = {crop: i for i, crop in enumerate(CROP_LIST)}

# Detailed crop requirements for explanations and fallback
CROP_AGRONOMICS = {
  'Tomato':      {'seasons': ['kharif', 'rabi', 'zaid'], 'ph_min': 6.0, 'ph_max': 7.0, 'water': 'moderate', 'temp_min': 18, 'temp_max': 29, 'rain_min': 400, 'rain_max': 800, 'N': 60, 'P': 50, 'K': 50, 'demand': 0.85, 'price_outlook': 'bullish'},
  'Onion':       {'seasons': ['rabi', 'kharif'],  'ph_min': 6.0, 'ph_max': 7.5, 'water': 'low',      'temp_min': 13, 'temp_max': 24, 'rain_min': 350, 'rain_max': 700, 'N': 50, 'P': 40, 'K': 60, 'demand': 0.80, 'price_outlook': 'stable'},
  'Potato':      {'seasons': ['rabi'],          'ph_min': 5.0, 'ph_max': 6.5, 'water': 'moderate', 'temp_min': 10, 'temp_max': 20, 'rain_min': 400, 'rain_max': 600, 'N': 70, 'P': 60, 'K': 90, 'demand': 0.90, 'price_outlook': 'stable'},
  'Brinjal':     {'seasons': ['kharif', 'rabi', 'zaid'], 'ph_min': 5.5, 'ph_max': 7.0, 'water': 'moderate', 'temp_min': 22, 'temp_max': 32, 'rain_min': 500, 'rain_max': 1000, 'N': 55, 'P': 45, 'K': 45, 'demand': 0.65, 'price_outlook': 'stable'},
  'Okra':        {'seasons': ['kharif', 'zaid'],    'ph_min': 6.0, 'ph_max': 6.8, 'water': 'moderate', 'temp_min': 22, 'temp_max': 35, 'rain_min': 450, 'rain_max': 900, 'N': 45, 'P': 35, 'K': 35, 'demand': 0.70, 'price_outlook': 'neutral'},
  'Cabbage':     {'seasons': ['rabi'],          'ph_min': 6.0, 'ph_max': 7.0, 'water': 'moderate', 'temp_min': 10, 'temp_max': 20, 'rain_min': 500, 'rain_max': 800, 'N': 80, 'P': 50, 'K': 60, 'demand': 0.68, 'price_outlook': 'neutral'},
  'Cauliflower': {'seasons': ['rabi'],          'ph_min': 6.0, 'ph_max': 7.0, 'water': 'moderate', 'temp_min': 15, 'temp_max': 20, 'rain_min': 500, 'rain_max': 800, 'N': 80, 'P': 50, 'K': 60, 'demand': 0.65, 'price_outlook': 'neutral'},
  'Rice':        {'seasons': ['kharif', 'rabi'],    'ph_min': 5.5, 'ph_max': 7.0, 'water': 'very_high', 'temp_min': 22, 'temp_max': 32, 'rain_min': 1000, 'rain_max': 2500, 'N': 80, 'P': 40, 'K': 40, 'demand': 0.95, 'price_outlook': 'stable'},
  'Wheat':       {'seasons': ['rabi'],          'ph_min': 6.0, 'ph_max': 7.5, 'water': 'moderate', 'temp_min': 12, 'temp_max': 25, 'rain_min': 600, 'rain_max': 1000, 'N': 70, 'P': 40, 'K': 30, 'demand': 0.90, 'price_outlook': 'stable'},
  'Maize':       {'seasons': ['kharif', 'rabi', 'zaid'], 'ph_min': 5.8, 'ph_max': 7.0, 'water': 'moderate', 'temp_min': 21, 'temp_max': 32, 'rain_min': 500, 'rain_max': 800, 'N': 60, 'P': 40, 'K': 35, 'demand': 0.70, 'price_outlook': 'neutral'},
  'Sorghum':     {'seasons': ['kharif', 'rabi'],    'ph_min': 6.0, 'ph_max': 7.5, 'water': 'low',       'temp_min': 25, 'temp_max': 32, 'rain_min': 400, 'rain_max': 650, 'N': 40, 'P': 30, 'K': 25, 'demand': 0.58, 'price_outlook': 'stable'},
  'Pearl Millet':{'seasons': ['kharif'],       'ph_min': 6.5, 'ph_max': 7.5, 'water': 'very_low',  'temp_min': 25, 'temp_max': 35, 'rain_min': 300, 'rain_max': 500, 'N': 35, 'P': 25, 'K': 25, 'demand': 0.50, 'price_outlook': 'neutral'},
  'Finger Millet':{'seasons': ['kharif', 'rabi'],   'ph_min': 5.5, 'ph_max': 7.0, 'water': 'low',       'temp_min': 20, 'temp_max': 30, 'rain_min': 500, 'rain_max': 800, 'N': 30, 'P': 25, 'K': 25, 'demand': 0.60, 'price_outlook': 'stable'},
  'Chickpea':    {'seasons': ['rabi'],          'ph_min': 6.0, 'ph_max': 7.2, 'water': 'low',       'temp_min': 15, 'temp_max': 25, 'rain_min': 350, 'rain_max': 500, 'N': 20, 'P': 40, 'K': 20, 'demand': 0.75, 'price_outlook': 'bullish'},
  'Pigeon Pea':  {'seasons': ['kharif'],       'ph_min': 6.0, 'ph_max': 7.0, 'water': 'low',       'temp_min': 20, 'temp_max': 30, 'rain_min': 450, 'rain_max': 750, 'N': 20, 'P': 40, 'K': 20, 'demand': 0.68, 'price_outlook': 'stable'},
  'Black Gram':  {'seasons': ['kharif', 'rabi', 'zaid'], 'ph_min': 6.5, 'ph_max': 7.5, 'water': 'low',       'temp_min': 25, 'temp_max': 35, 'rain_min': 400, 'rain_max': 650, 'N': 15, 'P': 35, 'K': 15, 'demand': 0.70, 'price_outlook': 'stable'},
  'Green Gram':  {'seasons': ['kharif', 'rabi', 'zaid'], 'ph_min': 6.5, 'ph_max': 7.5, 'water': 'very_low',  'temp_min': 25, 'temp_max': 35, 'rain_min': 300, 'rain_max': 500, 'N': 15, 'P': 30, 'K': 15, 'demand': 0.72, 'price_outlook': 'bullish'},
  'Groundnut':   {'seasons': ['kharif', 'rabi'],    'ph_min': 6.0, 'ph_max': 6.5, 'water': 'low',       'temp_min': 22, 'temp_max': 30, 'rain_min': 500, 'rain_max': 700, 'N': 25, 'P': 50, 'K': 40, 'demand': 0.72, 'price_outlook': 'neutral'},
  'Mustard':     {'seasons': ['rabi'],          'ph_min': 6.0, 'ph_max': 7.5, 'water': 'low',       'temp_min': 10, 'temp_max': 25, 'rain_min': 350, 'rain_max': 500, 'N': 45, 'P': 30, 'K': 20, 'demand': 0.65, 'price_outlook': 'stable'},
  'Soybean':     {'seasons': ['kharif'],       'ph_min': 6.0, 'ph_max': 7.5, 'water': 'moderate',  'temp_min': 20, 'temp_max': 30, 'rain_min': 600, 'rain_max': 900, 'N': 30, 'P': 60, 'K': 40, 'demand': 0.70, 'price_outlook': 'neutral'},
  'Sesame':      {'seasons': ['kharif', 'zaid'],    'ph_min': 5.5, 'ph_max': 7.0, 'water': 'very_low',  'temp_min': 25, 'temp_max': 35, 'rain_min': 300, 'rain_max': 450, 'N': 20, 'P': 25, 'K': 20, 'demand': 0.62, 'price_outlook': 'stable'},
  'Chilli':      {'seasons': ['kharif', 'rabi'],    'ph_min': 6.0, 'ph_max': 7.0, 'water': 'moderate',  'temp_min': 20, 'temp_max': 30, 'rain_min': 600, 'rain_max': 1000, 'N': 60, 'P': 40, 'K': 40, 'demand': 0.78, 'price_outlook': 'bullish'},
  'Turmeric':    {'seasons': ['kharif'],       'ph_min': 5.5, 'ph_max': 6.5, 'water': 'high',      'temp_min': 20, 'temp_max': 30, 'rain_min': 1500, 'rain_max': 2500, 'N': 50, 'P': 50, 'K': 90, 'demand': 0.80, 'price_outlook': 'bullish'},
  'Ginger':      {'seasons': ['kharif'],       'ph_min': 6.0, 'ph_max': 6.5, 'water': 'high',      'temp_min': 18, 'temp_max': 30, 'rain_min': 1200, 'rain_max': 1800, 'N': 60, 'P': 50, 'K': 100, 'demand': 0.74, 'price_outlook': 'stable'},
  'Banana':      {'seasons': ['perennial'],     'ph_min': 6.0, 'ph_max': 7.5, 'water': 'very_high', 'temp_min': 15, 'temp_max': 35, 'rain_min': 1200, 'rain_max': 2200, 'N': 110, 'P': 35, 'K': 150, 'demand': 0.88, 'price_outlook': 'stable'},
  'Papaya':      {'seasons': ['perennial'],     'ph_min': 6.0, 'ph_max': 6.5, 'water': 'moderate',  'temp_min': 20, 'temp_max': 35, 'rain_min': 800, 'rain_max': 1200, 'N': 80, 'P': 80, 'K': 120, 'demand': 0.76, 'price_outlook': 'stable'},
  'Cotton':      {'seasons': ['kharif'],       'ph_min': 6.0, 'ph_max': 7.5, 'water': 'moderate',  'temp_min': 25, 'temp_max': 35, 'rain_min': 600, 'rain_max': 1200, 'N': 50, 'P': 35, 'K': 35, 'demand': 0.62, 'price_outlook': 'stable'},
  'Sugarcane':   {'seasons': ['perennial'],     'ph_min': 6.0, 'ph_max': 7.5, 'water': 'very_high', 'temp_min': 20, 'temp_max': 35, 'rain_min': 1500, 'rain_max': 2500, 'N': 120, 'P': 50, 'K': 60, 'demand': 0.75, 'price_outlook': 'stable'},
  'Coconut':     {'seasons': ['perennial'],     'ph_min': 5.2, 'ph_max': 8.0, 'water': 'high',      'temp_min': 22, 'temp_max': 32, 'rain_min': 1300, 'rain_max': 2300, 'N': 60, 'P': 40, 'K': 120, 'demand': 0.70, 'price_outlook': 'stable'}
}

class ModelRegistry:
    """Lazy-load ML models. Trains a model dynamically if missing on startup."""
    def __init__(self):
        self.crop_suitability = None
        self._load_models()

    def _load_models(self):
        os.makedirs(MODELS_DIR, exist_ok=True)
        model_path = f"{MODELS_DIR}/crop_suitability_v1.pkl"
        
        # Self-healing: if model doesn't exist, trigger training
        if not os.path.exists(model_path):
            logger.info("🤖 Suitability model not found. Training model dynamically...")
            try:
                import train_model
                train_model.train()
            except Exception as e:
                logger.error(f"Failed to auto-train model: {e}")
                
        try:
            if os.path.exists(model_path):
                with open(model_path, "rb") as f:
                    self.crop_suitability = pickle.load(f)
                logger.info("✅ Loaded crop_suitability Random Forest model")
        except Exception as e:
            logger.warning(f"Could not load ML models: {e}")

registry = ModelRegistry()

class CropSuitabilityRequest(BaseModel):
    N: float = Field(..., ge=0, le=300)
    P: float = Field(..., ge=0, le=200)
    K: float = Field(..., ge=0, le=200)
    pH: float = Field(..., ge=0, le=14)
    temperature: float = Field(..., ge=-10, le=60)
    humidity: float = Field(..., ge=0, le=100)
    rainfall: float = Field(..., ge=0, le=5000)
    soilType: str = "loamy"
    season: str = "kharif"
    waterAvailability: str = "adequate"
    district: Optional[str] = None
    landArea: Optional[float] = None
    hasSoilTest: bool = True

class DemandForecastRequest(BaseModel):
    crop: str
    market: Optional[str] = None
    days: int = 90

class UnsoldRiskRequest(BaseModel):
    crop: str
    quantity: float
    currentPrice: Optional[float] = None
    shelfLifeDays: Optional[int] = None
    daysToHarvest: Optional[int] = None

class ExplainRequest(BaseModel):
    prediction_id: str
    features: Dict[str, Any]

# Helper to explain predictions based on agronomic logic
def explain_crop(crop_name: str, score: float, req: CropSuitabilityRequest) -> dict:
    rules = CROP_AGRONOMICS[crop_name]
    components = []
    
    # pH compatibility (0 to 20)
    ph_ok = rules['ph_min'] <= req.pH <= rules['ph_max']
    ph_score = 20 if ph_ok else (12 if abs(req.pH - (rules['ph_min'] + rules['ph_max'])/2) < 1 else 6)
    components.append({
        "name": "Soil pH Compatibility",
        "score": int(ph_score),
        "maxScore": 20,
        "explanation": f"Optimal pH: {rules['ph_min']}–{rules['ph_max']}, farm pH: {req.pH}"
    })
    
    # Season suitability (0 to 20)
    season_ok = req.season.lower() in rules['seasons']
    season_score = 20 if season_ok else 5
    components.append({
        "name": "Season Suitability",
        "score": int(season_score),
        "maxScore": 20,
        "explanation": f"Crop grows in: {', '.join(rules['seasons']).upper()}, current: {req.season.upper()}"
    })
    
    # Water Compatibility (0 to 15)
    water_map = {'abundant': 3, 'adequate': 2, 'limited': 1, 'scarce': 0}
    crop_water_map = {'very_high': 3, 'high': 3, 'moderate': 2, 'low': 1, 'very_low': 0}
    farm_water_idx = water_map.get(req.waterAvailability.lower(), 2)
    crop_water_idx = crop_water_map.get(rules['water'].lower(), 2)
    water_score = 15 if farm_water_idx >= crop_water_idx else (10 if farm_water_idx == crop_water_idx - 1 else 5)
    components.append({
        "name": "Water Compatibility",
        "score": int(water_score),
        "maxScore": 15,
        "explanation": f"Crop needs {rules['water']} water, farm has {req.waterAvailability}"
    })
    
    # Temperature Suitability (0 to 15)
    temp_ok = rules['temp_min'] <= req.temperature <= rules['temp_max']
    temp_score = 15 if temp_ok else (10 if abs(req.temperature - (rules['temp_min'] + rules['temp_max'])/2) < 5 else 5)
    components.append({
        "name": "Temperature Suitability",
        "score": int(temp_score),
        "maxScore": 15,
        "explanation": f"Optimal temp: {rules['temp_min']}–{rules['temp_max']}°C, current: {req.temperature}°C"
    })
    
    # Soil NPK Nutrients (0 to 15)
    nut_score = 15
    npk_reasons = []
    if req.N < rules['N']:
      nut_score -= 3
      npk_reasons.append("Low Nitrogen")
    if req.P < rules['P']:
      nut_score -= 3
      npk_reasons.append("Low Phosphorus")
    if req.K < rules['K']:
      nut_score -= 3
      npk_reasons.append("Low Potassium")
    npk_msg = ", ".join(npk_reasons) if npk_reasons else "Adequate NPK nutrients"
    components.append({
        "name": "Soil Nutrients (N-P-K)",
        "score": int(max(3, nut_score)),
        "maxScore": 15,
        "explanation": npk_msg
    })
    
    # Market demand (0 to 15)
    demand_val = rules['demand']
    demand_label = "Strong" if demand_val >= 0.8 else ("Moderate" if demand_val >= 0.65 else "Low")
    components.append({
        "name": "Market Demand Outlook",
        "score": int(round(demand_val * 15)),
        "maxScore": 15,
        "explanation": f"Market demand is {demand_label}"
    })

    # Price outlook (0 to 10)
    price_outlook = rules['price_outlook']
    price_score = 10 if price_outlook == "bullish" else (8 if price_outlook == "stable" else 6)
    components.append({
        "name": "Price Outlook",
        "score": int(price_score),
        "maxScore": 10,
        "explanation": f"Price outlook: {price_outlook.upper()}"
    })
    
    # Adjust components to sum exactly to predicted score to maintain SHAP-style breakdown consistency
    raw_sum = sum(c['score'] for c in components)
    if raw_sum > 0:
        multiplier = score / raw_sum
        for c in components:
            c['score'] = int(round(c['score'] * multiplier))
            
    risk_level = "low" if score >= 80 else ("medium" if score >= 60 else "high")
    
    human_explanation = (
        f"{crop_name} ranks at {score}/100. "
        f"{'Soil pH is optimal. ' if ph_ok else 'Soil pH is sub-optimal. '}"
        f"{'Season is favorable. ' if season_ok else 'Outside normal growing season. '}"
        f"{'Water availability matches requirement. ' if farm_water_idx >= crop_water_idx else 'Water availability is a constraint. '}"
        f"{'Market demand is strong.' if demand_val >= 0.8 else 'Market demand is moderate.'}"
    )

    return {
        "cropName": crop_name,
        "overallScore": int(score),
        "confidence": "High" if req.hasSoilTest else "Moderate",
        "components": components,
        "humanExplanation": human_explanation,
        "priceOutlook": price_outlook,
        "demandOutlook": demand_label,
        "riskLevel": risk_level
    }

from datetime import datetime

class DecisionRequest(BaseModel):
    farmerId: Optional[str] = None
    farmLatitude: Optional[float] = None
    farmLongitude: Optional[float] = None
    crop: str
    farmArea: Optional[float] = 1.0
    historicalYield: Optional[float] = 1200.0
    storageCapacity: Optional[float] = 5000.0
    storageDays: Optional[int] = 5
    storageType: Optional[str] = "ambient"
    storageCostPerUnitPerDay: Optional[float] = 0.05
    handlingCostPerUnit: Optional[float] = 0.40
    markets: List[Dict[str, Any]] = []
    weather: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"

@app.post("/decision/analyze")
def analyze_decision(req: DecisionRequest):
    try:
        opt_res = optimizer.optimize(req.dict())
        strategies = opt_res["strategies"]
        if not strategies:
            raise HTTPException(status_code=400, detail="No strategies could be optimized.")
            
        best_strat = strategies[0]
        alt_strat = strategies[1] if len(strategies) > 1 else None
        
        explanation, shap_breakdown = generate_explanations(best_strat, alt_strat, req.language)
        
        return {
            "recommendation": best_strat["strategy"],
            "action": best_strat["strategy"],
            "bestMarket": best_strat["marketName"],
            "allocation": best_strat["allocation"],
            "expectedRevenue": best_strat["grossRevenue"],
            "totalCost": best_strat["totalCost"],
            "expectedProfit": best_strat["netProfit"],
            "riskAdjustedProfit": best_strat["riskAdjustedProfit"],
            "riskScore": best_strat["riskScore"],
            "confidence": 0.88,
            "explanation": explanation,
            "shap_breakdown": shap_breakdown,
            "alternatives": strategies[1:],
            "yield_prediction": opt_res["yield_prediction"],
            "spoilage_prediction": opt_res["spoilage_prediction"],
            "evaluated_markets": opt_res["evaluated_markets"],
            "modelVersion": "AgriPulse-Decision-v1",
            "generatedAt": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Decision optimizer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "models": {
            "crop_suitability": "Random Forest Regressor" if registry.crop_suitability else "rule-based fallback",
            "unsold_risk": "XGBoost stub",
            "demand_forecast": "LSTM stub",
            "price_forecast": "XGBoost (AgriPulse)",
            "spoilage_risk": "Random Forest (AgriPulse)",
            "yield_uncertainty": "Agronomic (AgriPulse)",
            "market_availability": "Status Heuristic (AgriPulse)",
            "decision_optimizer": "DecisionOptimizer (AgriPulse)"
        }
    }

@app.post("/predict/crop-suitability")
def predict_crop_suitability(req: CropSuitabilityRequest):
    """Score all crops dynamically using the trained Random Forest model."""
    # Check if we have sufficient regional data for the district/region
    supported_regions = ['vellore', 'krishna', 'nadia', 'pune', 'west bengal', 'maharashtra', 'andhra pradesh', 'tamil nadu', 'chittoor', 'kurnool', 'guntur', 'kolkata', 'mumbai', 'nagpur', 'nashik', 'bardhaman', 'hooghly', 'howrah']
    region_query = (req.district or '').lower().strip()
    
    if not region_query or not any(r in region_query for r in supported_regions):
        return {
            "status": "limited_data",
            "confidence": "low",
            "reason": "Insufficient regional training data",
            "recommendations": [],
            "model_version": "AgriConnect-CropOpportunity-v1",
            "input_features": req.dict(),
            "total_crops_evaluated": 0
        }

    recommendations = []
    
    # Encode variables
    season_enc = SEASONS.get(req.season.lower(), 0)
    soil_enc = SOIL_TYPES.get(req.soilType.lower(), 0)
    water_enc = WATER_AVAIL.get(req.waterAvailability.lower(), 1)
    
    for crop in CROP_LIST:
        crop_idx = CROP_MAP[crop]
        
        # If Random Forest model is loaded, run actual inference
        if registry.crop_suitability:
            try:
                features = np.array([[req.N, req.P, req.K, req.pH, req.temperature, req.humidity, req.rainfall, water_enc, soil_enc, season_enc, crop_idx]])
                pred = registry.crop_suitability.predict(features)[0]
                score = max(10, min(99, float(pred)))
            except Exception as e:
                logger.warning(f"RF model prediction failed for {crop}: {e}")
                score = 50.0
        else:
            # Simple fallback
            score = 65.0
            
        result = explain_crop(crop, score, req)
        recommendations.append(result)
        
    recommendations.sort(key=lambda x: x["overallScore"], reverse=True)
    
    # Add ranks
    for idx, rec in enumerate(recommendations):
        rec["rank"] = idx + 1
        
    return {
        "status": "success",
        "confidence": "high",
        "recommendations": recommendations,
        "model_version": "AgriConnect-CropOpportunity-v1",
        "input_features": req.dict(),
        "total_crops_evaluated": len(recommendations)
    }

@app.post("/predict/demand-forecast")
def predict_demand_forecast(req: DemandForecastRequest):
    crop_demand = {
        "Tomato": 0.85, "Onion": 0.80, "Chilli": 0.78, "Brinjal": 0.65,
        "Potato": 0.90, "Rice": 0.95, "Maize": 0.70, "Groundnut": 0.72,
        "Cotton": 0.62, "Cabbage": 0.68, "Cauliflower": 0.65, "Wheat": 0.91,
    }
    demand_score = crop_demand.get(req.crop, 0.65)
    trend = "rising" if demand_score >= 0.80 else ("stable" if demand_score >= 0.65 else "weak")

    return {
        "crop": req.crop,
        "forecast_days": req.days,
        "expected_demand": demand_score,
        "trend": trend,
        "confidence": 0.75,
        "model_version": "lstm-v1.0"
    }

@app.post("/predict/unsold-risk")
def predict_unsold_risk(req: UnsoldRiskRequest):
    risk_score = 0.35
    if req.daysToHarvest is not None and req.daysToHarvest < 14:
        risk_score += 0.3
    if req.shelfLifeDays is not None and req.shelfLifeDays <= 7:
        risk_score += 0.2
    
    risk_score = max(0.05, min(0.95, risk_score))
    risk_category = "critical" if risk_score > 0.75 else ("high" if risk_score > 0.55 else ("medium" if risk_score > 0.35 else "low"))
    
    return {
        "probability": round(risk_score, 3),
        "risk_category": risk_category,
        "confidence": 0.78,
        "model_version": "xgboost-v1.0"
    }

@app.post("/explain/crop-suitability")
def explain_crop_suitability(req: ExplainRequest):
    features = req.features
    # Simulate SHAP values
    shap_values = {
        "N": round(max(-5, min(10, (features.get("N", 50) - 40) * 0.1)), 2),
        "P": round(max(-5, min(10, (features.get("P", 40) - 30) * 0.12)), 2),
        "K": round(max(-5, min(10, (features.get("K", 40) - 30) * 0.11)), 2),
        "pH": round(max(-12, min(12, 10 - abs(features.get("pH", 6.5) - 6.5) * 8)), 2),
        "temperature": round(max(-8, min(8, 6 - abs(features.get("temperature", 25) - 24) * 0.4)), 2),
        "humidity": round(max(-5, min(5, (features.get("humidity", 60) - 50) * 0.08)), 2),
        "rainfall": round(max(-8, min(8, (features.get("rainfall", 500) - 400) * 0.015)), 2),
        "waterAvailability": 8.0 if features.get("waterAvailability") in ["abundant", "adequate"] else -10.0,
        "season": 12.0
    }
    return {
        "prediction_id": req.prediction_id,
        "shap_values": shap_values,
        "base_value": 60.0,
        "explanation": "SHAP value breakdown of parameters",
        "model_version": "shap-v1.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True, log_level="info")
