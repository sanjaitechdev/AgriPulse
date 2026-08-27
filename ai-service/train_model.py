# train_model.py
# Script to train a real Random Forest model for AgriConnect Crop Suitability

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

# Encodings maps
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

# Hardcoded rules to generate synthetic dataset with logical structure
CROP_AGRONOMICS = {
  'Tomato':      {'seasons': [0, 1, 2], 'ph_min': 6.0, 'ph_max': 7.0, 'water': 1, 'temp_min': 18, 'temp_max': 29, 'rain_min': 400, 'rain_max': 800, 'N': 60, 'P': 50, 'K': 50},
  'Onion':       {'seasons': [1, 0],    'ph_min': 6.0, 'ph_max': 7.5, 'water': 2, 'temp_min': 13, 'temp_max': 24, 'rain_min': 350, 'rain_max': 700, 'N': 50, 'P': 40, 'K': 60},
  'Potato':      {'seasons': [1],       'ph_min': 5.0, 'ph_max': 6.5, 'water': 1, 'temp_min': 10, 'temp_max': 20, 'rain_min': 400, 'rain_max': 600, 'N': 70, 'P': 60, 'K': 90},
  'Brinjal':     {'seasons': [0, 1, 2], 'ph_min': 5.5, 'ph_max': 7.0, 'water': 1, 'temp_min': 22, 'temp_max': 32, 'rain_min': 500, 'rain_max': 1000, 'N': 55, 'P': 45, 'K': 45},
  'Okra':        {'seasons': [0, 2],    'ph_min': 6.0, 'ph_max': 6.8, 'water': 1, 'temp_min': 22, 'temp_max': 35, 'rain_min': 450, 'rain_max': 900, 'N': 45, 'P': 35, 'K': 35},
  'Cabbage':     {'seasons': [1],       'ph_min': 6.0, 'ph_max': 7.0, 'water': 1, 'temp_min': 10, 'temp_max': 20, 'rain_min': 500, 'rain_max': 800, 'N': 80, 'P': 50, 'K': 60},
  'Cauliflower': {'seasons': [1],       'ph_min': 6.0, 'ph_max': 7.0, 'water': 1, 'temp_min': 15, 'temp_max': 20, 'rain_min': 500, 'rain_max': 800, 'N': 80, 'P': 50, 'K': 60},
  'Rice':        {'seasons': [0, 1],    'ph_min': 5.5, 'ph_max': 7.0, 'water': 0, 'temp_min': 22, 'temp_max': 32, 'rain_min': 1000, 'rain_max': 2500, 'N': 80, 'P': 40, 'K': 40},
  'Wheat':       {'seasons': [1],       'ph_min': 6.0, 'ph_max': 7.5, 'water': 1, 'temp_min': 12, 'temp_max': 25, 'rain_min': 600, 'rain_max': 1000, 'N': 70, 'P': 40, 'K': 30},
  'Maize':       {'seasons': [0, 1, 2], 'ph_min': 5.8, 'ph_max': 7.0, 'water': 1, 'temp_min': 21, 'temp_max': 32, 'rain_min': 500, 'rain_max': 800, 'N': 60, 'P': 40, 'K': 35},
  'Sorghum':     {'seasons': [0, 1],    'ph_min': 6.0, 'ph_max': 7.5, 'water': 2, 'temp_min': 25, 'temp_max': 32, 'rain_min': 400, 'rain_max': 650, 'N': 40, 'P': 30, 'K': 25},
  'Pearl Millet':{'seasons': [0],       'ph_min': 6.5, 'ph_max': 7.5, 'water': 3, 'temp_min': 25, 'temp_max': 35, 'rain_min': 300, 'rain_max': 500, 'N': 35, 'P': 25, 'K': 25},
  'Finger Millet':{'seasons': [0, 1],   'ph_min': 5.5, 'ph_max': 7.0, 'water': 2, 'temp_min': 20, 'temp_max': 30, 'rain_min': 500, 'rain_max': 800, 'N': 30, 'P': 25, 'K': 25},
  'Chickpea':    {'seasons': [1],       'ph_min': 6.0, 'ph_max': 7.2, 'water': 2, 'temp_min': 15, 'temp_max': 25, 'rain_min': 350, 'rain_max': 500, 'N': 20, 'P': 40, 'K': 20},
  'Pigeon Pea':  {'seasons': [0],       'ph_min': 6.0, 'ph_max': 7.0, 'water': 2, 'temp_min': 20, 'temp_max': 30, 'rain_min': 450, 'rain_max': 750, 'N': 20, 'P': 40, 'K': 20},
  'Black Gram':  {'seasons': [0, 1, 2], 'ph_min': 6.5, 'ph_max': 7.5, 'water': 2, 'temp_min': 25, 'temp_max': 35, 'rain_min': 400, 'rain_max': 650, 'N': 15, 'P': 35, 'K': 15},
  'Green Gram':  {'seasons': [0, 1, 2], 'ph_min': 6.5, 'ph_max': 7.5, 'water': 3, 'temp_min': 25, 'temp_max': 35, 'rain_min': 300, 'rain_max': 500, 'N': 15, 'P': 30, 'K': 15},
  'Groundnut':   {'seasons': [0, 1],    'ph_min': 6.0, 'ph_max': 6.5, 'water': 2, 'temp_min': 22, 'temp_max': 30, 'rain_min': 500, 'rain_max': 700, 'N': 25, 'P': 50, 'K': 40},
  'Mustard':     {'seasons': [1],       'ph_min': 6.0, 'ph_max': 7.5, 'water': 2, 'temp_min': 10, 'temp_max': 25, 'rain_min': 350, 'rain_max': 500, 'N': 45, 'P': 30, 'K': 20},
  'Soybean':     {'seasons': [0],       'ph_min': 6.0, 'ph_max': 7.5, 'water': 1, 'temp_min': 20, 'temp_max': 30, 'rain_min': 600, 'rain_max': 900, 'N': 30, 'P': 60, 'K': 40},
  'Sesame':      {'seasons': [0, 2],    'ph_min': 5.5, 'ph_max': 7.0, 'water': 3, 'temp_min': 25, 'temp_max': 35, 'rain_min': 300, 'rain_max': 450, 'N': 20, 'P': 25, 'K': 20},
  'Chilli':      {'seasons': [0, 1],    'ph_min': 6.0, 'ph_max': 7.0, 'water': 1, 'temp_min': 20, 'temp_max': 30, 'rain_min': 600, 'rain_max': 1000, 'N': 60, 'P': 40, 'K': 40},
  'Turmeric':    {'seasons': [0],       'ph_min': 5.5, 'ph_max': 6.5, 'water': 0, 'temp_min': 20, 'temp_max': 30, 'rain_min': 1500, 'rain_max': 2500, 'N': 50, 'P': 50, 'K': 90},
  'Ginger':      {'seasons': [0],       'ph_min': 6.0, 'ph_max': 6.5, 'water': 0, 'temp_min': 18, 'temp_max': 30, 'rain_min': 1200, 'rain_max': 1800, 'N': 60, 'P': 50, 'K': 100},
  'Banana':      {'seasons': [3],       'ph_min': 6.0, 'ph_max': 7.5, 'water': 0, 'temp_min': 15, 'temp_max': 35, 'rain_min': 1200, 'rain_max': 2200, 'N': 110, 'P': 35, 'K': 150},
  'Papaya':      {'seasons': [3],       'ph_min': 6.0, 'ph_max': 6.5, 'water': 1, 'temp_min': 20, 'temp_max': 35, 'rain_min': 800, 'rain_max': 1200, 'N': 80, 'P': 80, 'K': 120},
  'Cotton':      {'seasons': [0],       'ph_min': 6.0, 'ph_max': 7.5, 'water': 1, 'temp_min': 25, 'temp_max': 35, 'rain_min': 600, 'rain_max': 1200, 'N': 50, 'P': 35, 'K': 35},
  'Sugarcane':   {'seasons': [3],       'ph_min': 6.0, 'ph_max': 7.5, 'water': 0, 'temp_min': 20, 'temp_max': 35, 'rain_min': 1500, 'rain_max': 2500, 'N': 120, 'P': 50, 'K': 60},
  'Coconut':     {'seasons': [3],       'ph_min': 5.2, 'ph_max': 8.0, 'water': 0, 'temp_min': 22, 'temp_max': 32, 'rain_min': 1300, 'rain_max': 2300, 'N': 60, 'P': 40, 'K': 120}
}

def generate_sample(crop):
  """Generate a synthetic sample for a crop with random variance."""
  rules = CROP_AGRONOMICS[crop]
  
  # 70% chance of suitable sample, 30% chance of unsuitable sample
  suitable = np.random.rand() < 0.7
  
  if suitable:
    N = int(rules['N'] + np.random.normal(15, 10))
    P = int(rules['P'] + np.random.normal(10, 5))
    K = int(rules['K'] + np.random.normal(10, 5))
    pH = round(np.random.uniform(rules['ph_min'], rules['ph_max']), 2)
    temp = round(np.random.uniform(rules['temp_min'], rules['temp_max']), 1)
    rain = int(np.random.uniform(rules['rain_min'], rules['rain_max']))
    humidity = int(np.random.uniform(50, 90))
    water = rules['water']
    season = np.random.choice(rules['seasons'])
    soil = np.random.choice([0, 1, 2, 3]) # loamy, red, black, alluvial
    score = np.random.uniform(80, 98)
  else:
    # Intentionally fail some requirements
    N = int(max(5, rules['N'] - np.random.uniform(20, 40)))
    P = int(max(5, rules['P'] - np.random.uniform(15, 30)))
    K = int(max(5, rules['K'] - np.random.uniform(15, 30)))
    pH = round(np.random.uniform(3.5, 9.0), 2)
    temp = round(np.random.uniform(5, 45), 1)
    rain = int(np.random.uniform(100, 3000))
    humidity = int(np.random.uniform(20, 100))
    water = np.random.choice([0, 1, 2, 3])
    season = np.random.choice([0, 1, 2, 3])
    soil = np.random.choice(list(SOIL_TYPES.values()))
    
    # Calculate penalty
    penalty = 0
    if not (rules['ph_min'] <= pH <= rules['ph_max']):
      penalty += 25
    if season not in rules['seasons']:
      penalty += 35
    if water > rules['water']: # scarcer than needed
      penalty += 30
    if not (rules['temp_min'] <= temp <= rules['temp_max']):
      penalty += 15
      
    score = max(10, min(75, 90 - penalty - np.random.uniform(0, 15)))

  return [N, P, K, pH, temp, humidity, rain, water, soil, season, CROP_MAP[crop], score]

def train():
  print("Generating synthetic crop dataset...")
  data = []
  for crop in CROP_LIST:
    for _ in range(300): # 300 samples per crop
      data.append(generate_sample(crop))
      
  df = pd.DataFrame(data, columns=['N', 'P', 'K', 'pH', 'temperature', 'humidity', 'rainfall', 'waterAvailability', 'soilType', 'season', 'crop', 'score'])
  
  X = df[['N', 'P', 'K', 'pH', 'temperature', 'humidity', 'rainfall', 'waterAvailability', 'soilType', 'season', 'crop']]
  y = df['score']
  
  print(f"Training Random Forest Regressor on {len(df)} samples...")
  model = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
  model.fit(X, y)
  
  # Ensure directory exists
  os.makedirs("models", exist_ok=True)
  
  model_path = "models/crop_suitability_v1.pkl"
  with open(model_path, "wb") as f:
    pickle.dump(model, f)
    
  print(f"✅ Model saved successfully to {model_path}!")

if __name__ == "__main__":
  train()
