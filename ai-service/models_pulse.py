# models_pulse.py
import numpy as np
import os
import pickle
import logging
from typing import Dict, Any, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)

# 1. PRICE FORECAST MODEL
class PriceForecastModel:
    def __init__(self):
        self.version = "AgriPulse-Price-v1"
        
    def predict(self, crop: str, market: str, current_price: float, history: List[float] = None) -> Dict[str, Any]:
        base = current_price if current_price else 25.0
        
        # Calculate rolling metrics if history exists
        if history and len(history) > 0:
            r7 = float(np.mean(history[-7:]))
            r30 = float(np.mean(history[-30:])) if len(history) >= 30 else r7
            vol = float(np.std(history[-7:])) / r7 if len(history) > 1 else 0.05
        else:
            r7 = base
            r30 = base
            vol = 0.06
            
        # Simulate forecasts for days 1, 3, 5, and 7
        trend_factor = 0.015 if r7 > r30 else (-0.012 if r7 < r30 else 0.002)
        
        f1 = base * (1.0 + trend_factor * 1.0 + np.random.normal(0, vol * 0.2))
        f3 = base * (1.0 + trend_factor * 3.0 + np.random.normal(0, vol * 0.4))
        f5 = base * (1.0 + trend_factor * 5.0 + np.random.normal(0, vol * 0.6))
        f7 = base * (1.0 + trend_factor * 7.0 + np.random.normal(0, vol * 0.8))
        
        # Upper/lower bounds
        interval = base * vol * 1.96
        confidence = max(0.60, min(0.95, 0.90 - vol))
        
        return {
            "future_price_1_day": round(f1, 2),
            "future_price_3_day": round(f3, 2),
            "future_price_5_day": round(f5, 2),
            "future_price_7_day": round(f7, 2),
            "confidence": round(confidence, 2),
            "prediction_interval": [round(base - interval, 2), round(base + interval, 2)],
            "model_version": self.version,
            "metrics": {
                "rolling_7_day_average": round(r7, 2),
                "rolling_30_day_average": round(r30, 2),
                "price_volatility": round(vol, 3)
            }
        }

# 2. SPOILAGE RISK MODEL
class SpoilageRiskModel:
    def __init__(self):
        self.version = "AgriPulse-Spoilage-v1"
        
    def predict(self, crop: str, expected_storage_days: int, temp: float, humidity: float, storage_type: str = "ambient", crop_condition: str = "good") -> Dict[str, Any]:
        base_rate = 0.015 if crop_condition == "excellent" else (0.03 if crop_condition == "good" else 0.08)
        
        storage_multiplier = {
            "cold": 0.2,
            "dry": 0.5,
            "ambient": 1.0,
            "open": 1.8
        }.get(storage_type.lower(), 1.0)
        
        temp_factor = max(1.0, 1.0 + (temp - 25.0) * 0.08) if temp > 25.0 else max(0.5, 1.0 + (temp - 25.0) * 0.03)
        hum_factor = max(1.0, 1.0 + (humidity - 60.0) * 0.04) if humidity > 60.0 else max(0.8, 1.0 + (humidity - 60.0) * 0.01)
        
        prob = base_rate * storage_multiplier * temp_factor * hum_factor * expected_storage_days
        prob = max(0.01, min(0.99, prob))
        
        return {
            "spoilage_probability": round(prob, 3),
            "confidence": round(0.85 - (0.01 * expected_storage_days), 2),
            "model_version": self.version
        }

# 3. YIELD UNCERTAINTY MODEL
class YieldUncertaintyModel:
    def __init__(self):
        self.version = "AgriPulse-Yield-v1"
        
    def predict(self, crop: str, farm_area: float, historical_yield_per_acre: float = 1200, weather_alerts: List[str] = None) -> Dict[str, Any]:
        base_yield = farm_area * historical_yield_per_acre
        
        weather_penalty = 1.0
        if weather_alerts:
            for alert in weather_alerts:
                alert_l = alert.lower()
                if "heavy rain" in alert_l or "flood" in alert_l:
                    weather_penalty -= 0.15
                elif "drought" in alert_l or "heatwave" in alert_l:
                    weather_penalty -= 0.20
                elif "cyclone" in alert_l or "storm" in alert_l:
                    weather_penalty -= 0.30
                    
        expected = base_yield * weather_penalty
        conservative = expected * 0.88
        worst_case = expected * 0.70
        
        return {
            "expected_yield": round(expected, 1),
            "conservative_yield": round(conservative, 1),
            "worst_case_yield": round(worst_case, 1),
            "model_version": self.version
        }

# 4. MARKET AVAILABILITY MODEL
class MarketAvailabilityModel:
    def __init__(self):
        self.version = "AgriPulse-Availability-v1"
        
    def predict(self, market: str, weather_alerts: List[str] = None, current_status: str = "active") -> Dict[str, Any]:
        prob = 0.95
        status = "AVAILABLE"
        
        if current_status == "closed":
            prob = 0.0
            status = "UNAVAILABLE"
        elif weather_alerts:
            for alert in weather_alerts:
                alert_l = alert.lower()
                if "cyclone" in alert_l or "flood" in alert_l:
                    prob -= 0.60
                elif "heavy rain" in alert_l:
                    prob -= 0.25
                    
        if prob <= 0.30:
            status = "UNAVAILABLE"
        elif prob <= 0.75:
            status = "LIMITED"
            
        return {
            "availability_probability": round(prob, 2),
            "status": status,
            "model_version": self.version
        }

# PROFIT ENGINE
def calculate_net_profit(
    yield_qty: float,
    price_per_kg: float,
    distance_km: float,
    transport_rate_per_km_per_kg: float = 0.005,
    handling_cost_per_kg: float = 0.40,
    storage_cost_per_kg_per_day: float = 0.05,
    storage_days: int = 0,
    spoilage_prob: float = 0.0
) -> Dict[str, float]:
    saleable = yield_qty * (1.0 - spoilage_prob)
    spoilage_loss = yield_qty * spoilage_prob * price_per_kg
    
    gross_rev = saleable * price_per_kg
    
    transport_cost = distance_km * transport_rate_per_km_per_kg * yield_qty
    handling_cost = yield_qty * handling_cost_per_kg
    storage_cost = yield_qty * storage_days * storage_cost_per_kg_per_day
    
    total_cost = transport_cost + handling_cost + storage_cost + spoilage_loss
    net_profit_exact = gross_rev - transport_cost - handling_cost - storage_cost - spoilage_loss
    
    return {
        "saleableQuantity": round(saleable, 1),
        "grossRevenue": round(gross_rev, 2),
        "transportationCost": round(transport_cost, 2),
        "handlingCost": round(handling_cost, 2),
        "storageCost": round(storage_cost, 2),
        "spoilageLoss": round(spoilage_loss, 2),
        "totalCost": round(total_cost, 2),
        "netProfit": round(net_profit_exact, 2)
    }

# DECISION OPTIMIZER AND RISK ADJUSTER
class DecisionOptimizer:
    def __init__(self, price_model, spoilage_model, yield_model, availability_model):
        self.price_model = price_model
        self.spoilage_model = spoilage_model
        self.yield_model = yield_model
        self.availability_model = availability_model
        
    def optimize(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        crop = payload.get("crop", "Tomato")
        farm_area = payload.get("farmArea", 1.0)
        hist_yield = payload.get("historicalYield", 1200.0)
        weather = payload.get("weather", {})
        alerts = weather.get("alerts", [])
        
        weather_alert_multiplier = 1.0
        if alerts:
            weather_alert_multiplier = 1.8
            
        storage_capacity = payload.get("storageCapacity", 5000.0)
        storage_days_opt = payload.get("storageDays", 5)
        storage_type = payload.get("storageType", "ambient")
        storage_cost_rate = payload.get("storageCostPerUnitPerDay", 0.05)
        handling_cost_rate = payload.get("handlingCostPerUnit", 0.40)
        
        markets = payload.get("markets", [])
        
        # 1. Run Yield Model
        yield_pred = self.yield_model.predict(crop, farm_area, hist_yield, alerts)
        exp_yield = yield_pred["expected_yield"]
        
        # 2. Run Spoilage Model
        spoilage_pred = self.spoilage_model.predict(
            crop, storage_days_opt, weather.get("temperature", 27.0),
            weather.get("humidity", 65.0), storage_type
        )
        spoilage_p = spoilage_pred["spoilage_probability"] * weather_alert_multiplier
        spoilage_p = min(0.99, spoilage_p)
        
        # 3. Analyze each market
        evaluated_markets = []
        for m in markets:
            m_name = m.get("marketName", m.get("market", "Unknown Market"))
            lat = m.get("latitude")
            lng = m.get("longitude")
            farm_lat = payload.get("farmLatitude")
            farm_lng = payload.get("farmLongitude")
            
            distance = 50.0
            if lat and lng and farm_lat and farm_lng:
                distance = self._haversine(farm_lat, farm_lng, lat, lng)
                
            curr_p = m.get("currentPrice", 25.0)
            hist_prices = m.get("historicalPrices", [])
            price_pred = self.price_model.predict(crop, m_name, curr_p, hist_prices)
            avail_pred = self.availability_model.predict(m_name, alerts, m.get("status", "active"))
            
            evaluated_markets.append({
                "marketName": m_name,
                "distance": round(distance, 1),
                "currentPrice": curr_p,
                "futurePrice": price_pred["future_price_5_day"],
                "forecast": price_pred,
                "availability": avail_pred["status"],
                "availabilityProbability": avail_pred["availability_probability"],
                "transportRate": m.get("transportRate", 0.005)
            })
            
        available_markets = [em for em in evaluated_markets if em["availability"] != "UNAVAILABLE"]
        if not available_markets:
            available_markets = evaluated_markets
            
        strategies = []
        
        # A. HARVEST & SELL NOW
        for m in available_markets:
            profit_res = calculate_net_profit(
                yield_qty=exp_yield,
                price_per_kg=m["currentPrice"],
                distance_km=m["distance"],
                transport_rate_per_km_per_kg=m["transportRate"],
                handling_cost_per_kg=handling_cost_rate,
                storage_cost_per_kg_per_day=storage_cost_rate,
                storage_days=0,
                spoilage_prob=0.01
            )
            v = m["forecast"]["metrics"]["price_volatility"]
            risk_score = int(round((v * 100 * 0.3) + (0.01 * 100 * 0.4) + ((1.0 - m["availabilityProbability"]) * 100 * 0.3)))
            risk_penalty = profit_res["netProfit"] * (risk_score / 100.0) * 0.2
            
            strategies.append({
                "strategy": "SELL_NOW",
                "marketName": m["marketName"],
                "allocation": [{"market": m["marketName"], "quantity": exp_yield}],
                "riskScore": min(99, max(5, risk_score)),
                "riskAdjustedProfit": round(profit_res["netProfit"] - risk_penalty, 2),
                **profit_res
            })
            
        # B. HARVEST + STORE + SELL LATER
        for m in available_markets:
            stored_qty = min(exp_yield, storage_capacity)
            surplus_sold_now = max(0.0, exp_yield - storage_capacity)
            
            stored_profit = calculate_net_profit(
                yield_qty=stored_qty,
                price_per_kg=m["futurePrice"],
                distance_km=m["distance"],
                transport_rate_per_km_per_kg=m["transportRate"],
                handling_cost_per_kg=handling_cost_rate,
                storage_cost_per_kg_per_day=storage_cost_rate,
                storage_days=storage_days_opt,
                spoilage_prob=spoilage_p
            )
            surplus_profit = calculate_net_profit(
                yield_qty=surplus_sold_now,
                price_per_kg=m["currentPrice"],
                distance_km=m["distance"],
                transport_rate_per_km_per_kg=m["transportRate"],
                handling_cost_per_kg=handling_cost_rate,
                storage_cost_per_kg_per_day=storage_cost_rate,
                storage_days=0,
                spoilage_prob=0.01
            )
            
            combined_profit = stored_profit["netProfit"] + surplus_profit["netProfit"]
            gross_rev = stored_profit["grossRevenue"] + surplus_profit["grossRevenue"]
            transport_cost = stored_profit["transportationCost"] + surplus_profit["transportationCost"]
            handling_cost = stored_profit["handlingCost"] + surplus_profit["handlingCost"]
            storage_cost = stored_profit["storageCost"] + surplus_profit["storageCost"]
            spoilage_loss = stored_profit["spoilageLoss"] + surplus_profit["spoilageLoss"]
            total_cost = transport_cost + handling_cost + storage_cost + spoilage_loss
            
            v = m["forecast"]["metrics"]["price_volatility"]
            risk_score = int(round((v * 100 * 0.2) + (spoilage_p * 100 * 0.6) + ((1.0 - m["availabilityProbability"]) * 100 * 0.2)))
            risk_penalty = combined_profit * (risk_score / 100.0) * 0.25
            
            strategies.append({
                "strategy": "STORE_AND_SELL",
                "marketName": m["marketName"],
                "allocation": [
                    {"market": m["marketName"], "quantity": surplus_sold_now, "action": "SELL_NOW"},
                    {"storage": True, "quantity": stored_qty, "action": "STORE"}
                ],
                "riskScore": min(99, max(5, risk_score)),
                "riskAdjustedProfit": round(combined_profit - risk_penalty, 2),
                "saleableQuantity": round(stored_profit["saleableQuantity"] + surplus_profit["saleableQuantity"], 1),
                "grossRevenue": round(gross_rev, 2),
                "transportationCost": round(transport_cost, 2),
                "handlingCost": round(handling_cost, 2),
                "storageCost": round(storage_cost, 2),
                "spoilageLoss": round(spoilage_loss, 2),
                "totalCost": round(total_cost, 2),
                "netProfit": round(combined_profit, 2)
            })
            
        # C. WAIT + HARVEST LATER
        for m in available_markets:
            wait_yield = yield_pred["conservative_yield"]
            future_p = m["forecast"]["future_price_5_day"]
            
            profit_res = calculate_net_profit(
                yield_qty=wait_yield,
                price_per_kg=future_p,
                distance_km=m["distance"],
                transport_rate_per_km_per_kg=m["transportRate"],
                handling_cost_per_kg=handling_cost_rate,
                storage_cost_per_kg_per_day=storage_cost_rate,
                storage_days=0,
                spoilage_prob=0.03
            )
            v = m["forecast"]["metrics"]["price_volatility"]
            risk_score = int(round((v * 100 * 0.4) + (0.03 * 100 * 0.2) + ((1.0 - m["availabilityProbability"]) * 100 * 0.4)))
            risk_penalty = profit_res["netProfit"] * (risk_score / 100.0) * 0.3
            
            strategies.append({
                "strategy": "WAIT_TO_HARVEST",
                "marketName": m["marketName"],
                "allocation": [{"market": m["marketName"], "quantity": wait_yield, "action": "WAIT_HARVEST"}],
                "riskScore": min(99, max(5, risk_score)),
                "riskAdjustedProfit": round(profit_res["netProfit"] - risk_penalty, 2),
                **profit_res
            })
            
        # D. SPLIT SELLING
        if len(available_markets) >= 2:
            m1 = available_markets[0]
            m2 = available_markets[1]
            
            q1 = exp_yield * 0.6
            q2 = exp_yield * 0.4
            
            stored_qty = min(q2, storage_capacity)
            
            p1 = calculate_net_profit(q1, m1["currentPrice"], m1["distance"], m1["transportRate"], handling_cost_rate, storage_cost_rate, 0, 0.01)
            p2 = calculate_net_profit(stored_qty, m2["futurePrice"], m2["distance"], m2["transportRate"], handling_cost_rate, storage_cost_rate, storage_days_opt, spoilage_p)
            
            combined_profit = p1["netProfit"] + p2["netProfit"]
            gross_rev = p1["grossRevenue"] + p2["grossRevenue"]
            transport_cost = p1["transportationCost"] + p2["transportationCost"]
            handling_cost = p1["handlingCost"] + p2["handlingCost"]
            storage_cost = p1["storageCost"] + p2["storageCost"]
            spoilage_loss = p1["spoilageLoss"] + p2["spoilageLoss"]
            total_cost = transport_cost + handling_cost + storage_cost + spoilage_loss
            
            risk_score = int(round((m1["forecast"]["metrics"]["price_volatility"] * 100 * 0.25) + (spoilage_p * 100 * 0.3) + 15))
            risk_penalty = combined_profit * (risk_score / 100.0) * 0.2
            
            strategies.append({
                "strategy": "SPLIT_SELL",
                "marketName": f"{m1['marketName']} (60%) + {m2['marketName']} (40% Store)",
                "allocation": [
                    {"market": m1["marketName"], "quantity": round(q1, 1), "action": "SELL_NOW"},
                    {"storage": True, "quantity": round(stored_qty, 1), "action": "STORE"}
                ],
                "riskScore": min(99, max(5, risk_score)),
                "riskAdjustedProfit": round(combined_profit - risk_penalty, 2),
                "saleableQuantity": round(p1["saleableQuantity"] + p2["saleableQuantity"], 1),
                "grossRevenue": round(gross_rev, 2),
                "transportationCost": round(transport_cost, 2),
                "handlingCost": round(handling_cost, 2),
                "storageCost": round(storage_cost, 2),
                "spoilageLoss": round(spoilage_loss, 2),
                "totalCost": round(total_cost, 2),
                "netProfit": round(combined_profit, 2)
            })

        strategies.sort(key=lambda x: x["riskAdjustedProfit"], reverse=True)
        
        max_adjusted_profit = max([s["riskAdjustedProfit"] for s in strategies]) if strategies else 1.0
        
        for s in strategies:
            ratio = max(0.1, s["riskAdjustedProfit"] / max_adjusted_profit) if max_adjusted_profit > 0 else 0.5
            s["score"] = int(round(ratio * 100 - (s["riskScore"] * 0.15)))
            s["score"] = max(10, min(99, s["score"]))
            
        return {
            "strategies": strategies,
            "yield_prediction": yield_pred,
            "spoilage_prediction": spoilage_pred,
            "evaluated_markets": evaluated_markets
        }
        
    def _haversine(self, lat1, lon1, lat2, lon2):
        R = 6371.0
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        return R * c

# EXPLAINABLE AI AND MULTILINGUAL ENGINE
TRANSLATIONS = {
    "en": {
        "rec_prefix": "We recommend {action} at {market}.",
        "why": "Why: Current price is strong while future price improvement is offset by transport/spoilage risks.",
        "impact": "Expected Net Profit is ₹{profit}. Risk is {risk}.",
        "alternative": "Alternative: Waiting can yield ₹{alt_profit} but increases spoilage risk to {spoilage}%.",
        "factor_price": "Price Trend",
        "factor_spoilage": "Spoilage Risk",
        "factor_transport": "Transport Cost",
        "factor_avail": "Market Availability",
        "factor_storage": "Storage Capacity"
    },
    "ta": {
        "rec_prefix": "நாங்கள் உங்களுக்குப் பரிந்துரைப்பது: {market} சந்தையில் {action}.",
        "why": "காரணம்: தற்போதைய விலை அதிகமாக உள்ளது; எதிர்கால விலை உயர்வு போக்குவரத்து மற்றும் அழுகும் அபாயங்களால் குறையலாம்.",
        "impact": "எதிர்பார்க்கப்படும் நிகர லாபம்: ₹{profit}. அபாயம்: {risk}.",
        "alternative": "மாற்று வழி: காத்திருந்தால் ₹{alt_profit} வரை லாபம் வரலாம், ஆனால் அழுகும் அபாயம் {spoilage}% ஆக அதிகரிக்கும்.",
        "factor_price": "விலை போக்கு",
        "factor_spoilage": "அழுகும் அபாயம்",
        "factor_transport": "போக்குவரத்து செலவு",
        "factor_avail": "சந்தை கிடைக்கும் தன்மை",
        "factor_storage": "சேமிப்பு கிடங்கு வசதி"
    },
    "hi": {
        "rec_prefix": "हम आपको {market} पर {action} करने की सलाह देते हैं।",
        "why": "कारण: वर्तमान मूल्य मजबूत है, जबकि भविष्य में मूल्य सुधार परिवहन/खराब होने के जोखिमों से प्रभावित हो सकता है।",
        "impact": "अपेक्षित शुद्ध लाभ ₹{profit} है। जोखिम {risk} है।",
        "alternative": "विकल्प: प्रतीक्षा करने पर ₹{alt_profit} मिल सकते हैं, लेकिन खराब होने की संभावना {spoilage}% तक बढ़ जाती है।",
        "factor_price": "मूल्य प्रवृत्ति",
        "factor_spoilage": "खराब होने का जोखिम",
        "factor_transport": "परिवहन लागत",
        "factor_avail": "बाज़ार की उपलब्धता",
        "factor_storage": "भंडारण क्षमता"
    },
    "te": {
        "rec_prefix": "{market} వద్ద {action} చేయాల్సిందిగా సిఫార్సు చేస్తున్నాము.",
        "why": "కారణం: ప్రస్తుత ధర బలంగా ఉంది, అయితే రవాణా/పాడయ్యే ప్రమాదాల వల్ల భవిష్యత్తు ధర ప్రయోజనం తగ్గిపోవచ్చు.",
        "impact": "ఆశించిన నికర లాభం ₹{profit}. రిస్క్ {risk}.",
        "alternative": "ప్రత్యామ్నాయం: వేచి ఉంటే ₹{alt_profit} రావచ్చు, కానీ పాడయ్యే ప్రమాదం {spoilage}% కి పెరుగుతుంది.",
        "factor_price": "ధరల ధోరణి",
        "factor_spoilage": "పాడయ్యే రిస్క్",
        "factor_transport": "รవాణా ఖర్చు",
        "factor_avail": "మార్కెట్ లభ్యత",
        "factor_storage": "నిల్వ సామర్థ్యం"
    },
    "kn": {
        "rec_prefix": "{market} ನಲ್ಲಿ {action} ಮಾಡಲು ನಾವು ಶಿಫಾರಸು ಮಾಡುತ್ತೇವೆ.",
        "why": "ಕಾರಣ: ಪ್ರಸ್ತುತ ಬೆಲೆ ಪ್ರಬಲವಾಗಿದೆ, ಆದರೆ ಭವಿಷ್ಯದ ಬೆಲೆ ಸುಧಾರಣೆ ಸಾರಿಗೆ/ಕೊಳೆಯುವ ಅಪಾಯಗಳಿಂದ ಬಾಧಿತವಾಗಬಹುದು.",
        "impact": "ನಿರೀಕ್ಷಿತ ನಿವ್ವಳ ಲಾಭ ₹{profit}. ಅಪಾಯ {risk}.",
        "alternative": "ಪರ್ಯಾಯ: ಕಾಯುವುದರಿಂದ ₹{alt_profit} ಗಳಿಸಬಹುದು, ಆದರೆ ಕೊಳೆಯುವ ಅಪಾಯವು {spoilage}% ಗೆ ಹೆಚ್ಚಾಗುತ್ತದೆ.",
        "factor_price": "ಬೆಲೆ ಪ್ರವೃತ್ತಿ",
        "factor_spoilage": "ಕೊಳೆತುಹೋಗುವ ಅಪಾಯ",
        "factor_transport": "ಸಾರಿಗೆ ವೆಚ್ಚ",
        "factor_avail": "ಮಾರುಕಟ್ಟೆ ಲಭ್ಯತೆ",
        "factor_storage": "ಸಂಗ್ರಹಣಾ ಸಾಮರ್ಥ್ಯ"
    },
    "ml": {
        "rec_prefix": "{market}-ൽ {action} ചെയ്യാൻ ഞങ്ങൾ ശുപാർശ ചെയ്യുന്നു.",
        "why": "കാരണം: നിലവിലെ വില ശക്തമാണ്, എന്നാൽ ഭാവിയിലെ വില വർദ്ധനവ് ഗതാഗത/കേടുപാടുകൾ കാരണം ഇല്ലാതായേക്കാം.",
        "impact": "പ്രതീക്ഷിക്കുന്ന അറ്റാദായം ₹{profit}. റിസ്ക് {risk}.",
        "alternative": "ബദൽ: കാത്തിരുന്നാൽ ₹{alt_profit} വരെ നേടാം, എന്നാൽ കേടുവരാനുള്ള സാധ്യത {spoilage}% ആയി ഉയരും.",
        "factor_price": "വില ട്രെൻഡ്",
        "factor_spoilage": "കേടുവരാനുള്ള റിസ്ക്",
        "factor_transport": "ഗതാഗത ചെലവ്",
        "factor_avail": "മാർക്കറ്റ് ലഭ്യത",
        "factor_storage": "സംഭരണ ശേഷി"
    },
    "mr": {
        "rec_prefix": "आम्ही आपल्याला {market} येथे {action} करण्याची शिफारस करतो.",
        "why": "कारण: सध्याची किंमत मजबूत आहे, तर भविष्यातील किंमत सुधारणा वाहतूक/कुजण्याच्या जोखमीमुळे कमी होऊ शकते.",
        "impact": "अपेक्षित निव्वळ नफा ₹{profit} आहे. जोखीम {risk} आहे.",
        "alternative": "पर्याय: वाट पाहिल्यास ₹{alt_profit} मिळू शकतात, परंतु कुजण्याची शक्यता {spoilage}% पर्यंत वाढते.",
        "factor_price": "किंमत कल",
        "factor_spoilage": "खराब होण्याचा धोका",
        "factor_transport": "वाहतूक खर्च",
        "factor_avail": "बाजार उपलब्धता",
        "factor_storage": "साठवण क्षमता"
    },
    "gu": {
        "rec_prefix": "અમે તમને {market} પર {action} કરવાની સલાહ આપીએ છીએ.",
        "why": "કારણ: વર્તમાન ભાવ મજબૂત છે, જ્યારે ભવિષ્યમાં ભાવ વધારો પરિવહન/બગાડના જોখમોને લીધે નકામો બની શકે છે.",
        "impact": "અપેક્ષિત ચોખ્ખો નફો ₹{profit} છે. જોખમ {risk} છે.",
        "alternative": "વિકલ્પ: રાહ જોવાથી ₹{alt_profit} મળી શકે છે, પરંતુ બગાડની સંભાવના {spoilage}% સુધી વધી જાય છે.",
        "factor_price": "કિંમત વલણ",
        "factor_spoilage": "બગાડનું જોખમ",
        "factor_transport": "પરિવહન ખર્ચ",
        "factor_avail": "બજાર ઉપલબ્ધતા",
        "factor_storage": "સંગ્રહ ક્ષમતા"
    },
    "pa": {
        "rec_prefix": "ਅਸੀਂ ਤੁਹਾਨੂੰ {market} 'ਤੇ {action} ਕਰਨ ਦੀ ਸਲਾਹ ਦਿੰਦੇ ਹਾਂ।",
        "why": "ਕਾਰਨ: ਮੌਜੂਦਾ ਕੀਮਤ ਮਜ਼ਬੂਤ ਹੈ, ਜਦੋਂ ਕਿ ਭਵਿੱਖ ਵਿੱਚ ਕੀਮਤ ਸੁਧਾਰ ਆਵਾਜਾਈ/ਖਰਾਬ ਹੋਣ ਦੇ ਜੋਖਮਾਂ ਕਾਰਨ ਪ੍ਰਭਾਵਿਤ ਹੋ ਸਕਦਾ ਹੈ।",
        "impact": "ਉਮੀਦ ਕੀਤੀ ਸ਼ੁੱਧ ਮੁਨਾਫਾ ₹{profit} ਹੈ। ਜੋਖਮ {risk} ਹੈ।",
        "alternative": "ਅਲਟਰਨੇਟਿਵ: ਉਡੀਕ ਕਰਨ ਨਾਲ ₹{alt_profit} ਮਿਲ ਸਕਦੇ ਹਨ, ਪਰ ਖਰਾਬ ਹੋਣ ਦੀ ਸੰਭਾਵਨਾ {spoilage}% ਤੱਕ ਵਧ ਜਾਂਦੀ ਹੈ।",
        "factor_price": "ਕੀਮਤ ਰੁਝਾਨ",
        "factor_spoilage": "ਖਰਾਬ ਹੋਣ ਦਾ ਜੋਖਮ",
        "factor_transport": "ਆਵਾਜਾਈ ਲਾਗਤ",
        "factor_avail": "ਮਾਰਕੀਟ ਉਪਲਬਧਤਾ",
        "factor_storage": "ਸਟੋਰੇਜ ਸਮਰੱਥਾ"
    },
    "bn": {
        "rec_prefix": "আমরা আপনাকে {market}-এ {action} করার পরামর্শ দিচ্ছি।",
        "why": "কারণ: বর্তমান দাম ভালো আছে, কিন্তু ভবিষ্যতের দাম বৃদ্ধি পরিবহন ও পচনের ঝুঁকির কারণে নষ্ট হতে পারে।",
        "impact": "প্রত্যাশিত নেট লাভ ₹{profit}। ঝুঁকি {risk}।",
        "alternative": "বিকল্প: অপেক্ষা করলে ₹{alt_profit} পাওয়া যেতে পারে, কিন্তু পচনের সম্ভাবনা {spoilage}% পর্যন্ত বেড়ে যাবে।",
        "factor_price": "মূল্যের ধারা",
        "factor_spoilage": "পচনের ঝুঁকি",
        "factor_transport": "পরিবহন খরচ",
        "factor_avail": "বাজারের প্রাপ্যতা",
        "factor_storage": "সংরক্ষণের ক্ষমতা"
    },
    "or": {
        "rec_prefix": "ଆମେ ଆପଣଙ୍କୁ {market} ଠାରେ {action} କରିବାକୁ ପରାମର୍ଶ ଦେଉଛୁ ।",
        "why": "କାରଣ: ବର୍ତ୍ତମାନର ଦର ଅଧିକ ଅଛି, କିନ୍ତու ଭବିଷ୍ୟତ ଦର ବୃଦ୍ଧି ପରିବହନ ଓ ନଷ୍ଟ ହେବା ଭୟ କାରଣରୁ ପ୍ରଭାବିତ ହୋଇପାରେ ।",
        "impact": "ଆଶା କରାଯାଉଥିବା ନିଟ୍ ଲାଭ ₹{profit} । ବିପଦ {risk} ।",
        "alternative": "ବିକଳ୍ପ: ଅପେକ୍ଷା କଲେ ₹{alt_profit} ମିଳିପାରେ, କିନ୍ତୁ ନଷ୍ଟ ହେବାର ଆଶଙ୍କା {spoilage}% କୁ ବୃଦ୍ଧି ପାଇବ ।",
        "factor_price": "ମୂଲ್ಯ ପ୍ରବୃତ୍ତି",
        "factor_spoilage": "ନଷ୍ଟ ହେବାର ବିପଦ",
        "factor_transport": "ପରିବହନ ଖର୍ଚ୍ଚ",
        "factor_avail": "ବଜାର ଉପଲବ୍ଧତା",
        "factor_storage": "ସଂରକ୍ଷଣ କ୍ଷମତା"
    },
    "as": {
        "rec_prefix": "আমি আপোনাক {market} ত {action} কৰিবলৈ পৰামৰ্শ দিছোঁ।",
        "why": "কাৰণ: বৰ্তমানৰ মূল্য ভাল আছে, কিন্তু ভৱিষ্যতৰ মূল্য বৃদ্ধি পৰিবহন আৰু পচনৰ বিপদাশংকাৰ দ্বাৰা প্ৰভাৱিত হ'ব পাৰে।",
        "impact": "প্ৰত্যাশিত নিট লাভ ₹{profit}। বিপদাশংকা {risk}।",
        "alternative": "বিকল্প: অপেক্ষা কৰিলে ₹{alt_profit} পোৱা যাব পাৰে, কিন্তু পচনৰ সম্ভাৱনা {spoilage}% লৈ বৃদ্ধি পাব।",
        "factor_price": "মূল্যৰ ধাৰা",
        "factor_spoilage": "পচনৰ বিপদাশংকা",
        "factor_transport": "পৰিবহন খৰচ",
        "factor_avail": "বজাৰৰ উপলব্ধতা",
        "factor_storage": "সংৰক্ষণ ক্ষমতা"
    }
}

ACTION_TRANSLATIONS = {
    "en": {"SELL_NOW": "Sell Now", "STORE_AND_SELL": "Store & Sell Later", "WAIT_TO_HARVEST": "Wait to Harvest", "SPLIT_SELL": "Split Selling"},
    "ta": {"SELL_NOW": "உடனே விற்கவும்", "STORE_AND_SELL": "சேமித்து பிறகு விற்கவும்", "WAIT_TO_HARVEST": "அறுவடைக்கு காத்திருக்கவும்", "SPLIT_SELL": "பிரித்து விற்கவும்"},
    "hi": {"SELL_NOW": "अभी बेचें", "STORE_AND_SELL": "भंडारण करें और बाद में बेचें", "WAIT_TO_HARVEST": "कटाई के लिए प्रतीक्षा करें", "SPLIT_SELL": "विभाजित बिक्री"},
    "te": {"SELL_NOW": "ఇప్పుడే అమ్మండి", "STORE_AND_SELL": "భద్రపరిచి తర్వాత అమ్మండి", "WAIT_TO_HARVEST": "కోత కోసం వేచి ఉండండి", "SPLIT_SELL": "విభజించి అమ్మడం"},
    "kn": {"SELL_NOW": "ಈಗಲೇ ಮಾರಿ", "STORE_AND_SELL": "ಸಂಗ್ರಹಿಸಿ ನಂತರ ಮಾರಿ", "WAIT_TO_HARVEST": "ಕೊಯ್ಲಿಗೆ ಕಾಯಿರಿ", "SPLIT_SELL": "ವಿಭಜಿತ ಮಾರಾಟ"},
    "ml": {"SELL_NOW": "ഇപ്പോൾ വിൽക്കുക", "STORE_AND_SELL": "സംഭരിച്ച് പിന്നീട് വിൽക്കുക", "WAIT_TO_HARVEST": "വിളവെടുപ്പിനായി കാത്തിരിക്കുക", "SPLIT_SELL": "വിഭജിച്ചു വിൽക്കുക"},
    "mr": {"SELL_NOW": "त्वरित विक्री", "STORE_AND_SELL": "साठवणूक करा आणि नंतर विका", "WAIT_TO_HARVEST": "कापणीची वाट पहा", "SPLIT_SELL": "विभागून विक्री"},
    "gu": {"SELL_NOW": "તરત વેચો", "STORE_AND_SELL": "સંગ્રહ કરો અને પછી વેચો", "WAIT_TO_HARVEST": "લણણી માટે રાહ જુઓ", "SPLIT_SELL": "ભાગલા વેચાણ"},
    "pa": {"SELL_NOW": "ਹੁਣੇ ਵੇਚੋ", "STORE_AND_SELL": "ਸਟੋਰ ਕਰੋ ਅਤੇ ਬਾਅद ਵਿੱਚ ਵੇਚੋ", "WAIT_TO_HARVEST": "ਵਾਢੀ ਦੀ ਉਡੀਕ ਕਰੋ", "SPLIT_SELL": "ਵੰਡ ਕੇ ਵੇਚਣਾ"},
    "bn": {"SELL_NOW": "এখনই বিক্রি করুন", "STORE_AND_SELL": "মজুদ করে পরে বিক্রি করুন", "WAIT_TO_HARVEST": "কাটার জন্য অপেক্ষা করুন", "SPLIT_SELL": "আংশিক বিক্রয়"},
    "or": {"SELL_NOW": "ତୁରନ୍ତ ବିକ୍ରୟ କରନ୍ତু", "STORE_AND_SELL": "ସଂରକ୍ଷଣ କରି ପରେ ବିକନ୍ତୁ", "WAIT_TO_HARVEST": "ଅମଳ ପାଇଁ ଅପେକ୍ଷା କରନ୍ତু", "SPLIT_SELL": "ଭାଗ କରି ବିକିବା"},
    "as": {"SELL_NOW": "এতিয়াই বিক্ৰী কৰক", "STORE_AND_SELL": "সংৰক্ষণ কৰি পাছত বিক্ৰী কৰক", "WAIT_TO_HARVEST": "চপোৱালৈ বাট চাব", "SPLIT_SELL": "বিভক্ত বিক্ৰী"}
}

def generate_explanations(best_strategy: Dict[str, Any], alt_strategy: Dict[str, Any], lang: str) -> Tuple[str, List[Dict[str, Any]]]:
    lang_key = lang.lower() if lang.lower() in TRANSLATIONS else "en"
    dict_lang = TRANSLATIONS[lang_key]
    act_lang = ACTION_TRANSLATIONS[lang_key]
    
    factors = [
        {"factor": dict_lang["factor_price"], "weight": 22, "impact": "positive"},
        {"factor": dict_lang["factor_spoilage"], "weight": -12 if "STORE" in best_strategy["strategy"] else -2, "impact": "negative" if "STORE" in best_strategy["strategy"] else "neutral"},
        {"factor": dict_lang["factor_transport"], "weight": -8, "impact": "negative"},
        {"factor": dict_lang["factor_avail"], "weight": 15, "impact": "positive"},
        {"factor": dict_lang["factor_storage"], "weight": 5 if "STORE" in best_strategy["strategy"] else 0, "impact": "positive" if "STORE" in best_strategy["strategy"] else "neutral"}
    ]
    
    action_text = act_lang.get(best_strategy["strategy"], best_strategy["strategy"])
    market_text = best_strategy["marketName"]
    
    rec_line = dict_lang["rec_prefix"].format(action=action_text, market=market_text)
    why_line = dict_lang["why"]
    
    profit_text = f"{int(best_strategy['netProfit']):,}"
    risk_level_text = "LOW" if best_strategy["riskScore"] < 35 else ("MEDIUM" if best_strategy["riskScore"] < 65 else "HIGH")
    impact_line = dict_lang["impact"].format(profit=profit_text, risk=risk_level_text)
    
    alt_profit_text = f"{int(alt_strategy['netProfit']):,}" if alt_strategy else "0"
    alt_spoilage = "12" if alt_strategy and "STORE" in alt_strategy["strategy"] else "4"
    alt_line = dict_lang["alternative"].format(alt_profit=alt_profit_text, spoilage=alt_spoilage)
    
    explanation_para = f"{rec_line} {why_line} {impact_line} {alt_line}"
    return explanation_para, factors
