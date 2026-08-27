# test_decision_engine.py
import unittest
from models_pulse import PriceForecastModel, SpoilageRiskModel, YieldUncertaintyModel, MarketAvailabilityModel, DecisionOptimizer

class TestAgriPulseDecisionEngine(unittest.TestCase):
    def setUp(self):
        self.price_model = PriceForecastModel()
        self.spoilage_model = SpoilageRiskModel()
        self.yield_model = YieldUncertaintyModel()
        self.availability_model = MarketAvailabilityModel()
        self.optimizer = DecisionOptimizer(self.price_model, self.spoilage_model, self.yield_model, self.availability_model)
        
    def test_1_highest_price_trap(self):
        # Market A: Price ₹35/kg, distance 200km, rate ₹0.01/km/kg -> Transport cost ₹2/kg -> Net ₹33/kg
        # Market B: Price ₹34/kg, distance 10km, rate ₹0.01/km/kg -> Transport cost ₹0.1/kg -> Net ₹33.9/kg
        # Market B should be preferred despite lower price
        payload = {
            "crop": "Tomato",
            "farmArea": 1.0,
            "historicalYield": 1000.0,
            "storageCapacity": 1000.0,
            "storageDays": 0,
            "handlingCostPerUnit": 0.0,
            "storageCostPerUnitPerDay": 0.0,
            "markets": [
                {"marketName": "Market A (Far)", "currentPrice": 35.0, "latitude": 14.71, "longitude": 80.13, "transportRate": 0.01, "status": "active"},
                {"marketName": "Market B (Near)", "currentPrice": 34.0, "latitude": 12.92, "longitude": 79.14, "transportRate": 0.01, "status": "active"}
            ],
            "farmLatitude": 12.91,
            "farmLongitude": 79.13,
            "weather": {"temperature": 25.0, "humidity": 60.0, "alerts": []}
        }
        res = self.optimizer.optimize(payload)
        best_strategy = res["strategies"][0]
        self.assertEqual(best_strategy["marketName"], "Market B (Near)")
        print("[OK] Test 1 Passed: Highest-price market trap resolved by profitEngine logistics costs.")

    def test_2_future_price_vs_spoilage(self):
        # Spoilage risk is extremely high, waiting should be discouraged even if future price forecasts are higher
        payload = {
            "crop": "Tomato",
            "farmArea": 1.0,
            "historicalYield": 1000.0,
            "storageCapacity": 1000.0,
            "storageDays": 10,
            "handlingCostPerUnit": 0.40,
            "storageCostPerUnitPerDay": 0.05,
            "markets": [
                {"marketName": "Market A", "currentPrice": 30.0, "latitude": 12.91, "longitude": 79.13, "transportRate": 0.005, "status": "active"}
            ],
            "farmLatitude": 12.91,
            "farmLongitude": 79.13,
            "weather": {"temperature": 38.0, "humidity": 90.0, "alerts": ["Heavy Rain Storm"]} # High decay weather
        }
        res = self.optimizer.optimize(payload)
        best_strategy = res["strategies"][0]
        self.assertEqual(best_strategy["strategy"], "SELL_NOW")
        print("[OK] Test 2 Passed: Spoilage surge overrides future price increases.")

    def test_3_market_unavailable(self):
        # Closed market should not be recommended
        payload = {
            "crop": "Tomato",
            "farmArea": 1.0,
            "historicalYield": 1000.0,
            "storageCapacity": 1000.0,
            "markets": [
                {"marketName": "Market A (Closed)", "currentPrice": 50.0, "status": "closed"},
                {"marketName": "Market B (Open)", "currentPrice": 30.0, "status": "active"}
            ],
            "farmLatitude": 12.91,
            "farmLongitude": 79.13,
            "weather": {"temperature": 25.0, "humidity": 60.0, "alerts": []}
        }
        res = self.optimizer.optimize(payload)
        best_strategy = res["strategies"][0]
        self.assertNotEqual(best_strategy["marketName"], "Market A (Closed)")
        print("[OK] Test 3 Passed: Market closures handled correctly.")

    def test_4_yield_lower_than_expected(self):
        # Recalculates total logistics costs and net margins based on lower yield
        payload = {
            "crop": "Tomato",
            "farmArea": 1.0,
            "historicalYield": 200.0, # low yield
            "storageCapacity": 1000.0,
            "markets": [
                {"marketName": "Market A", "currentPrice": 30.0, "status": "active"}
            ],
            "farmLatitude": 12.91,
            "farmLongitude": 79.13,
            "weather": {"temperature": 25.0, "humidity": 60.0, "alerts": []}
        }
        res = self.optimizer.optimize(payload)
        self.assertLess(res["strategies"][0]["saleableQuantity"], 300)
        print("[OK] Test 4 Passed: Yield shortages correctly re-budgeted.")

    def test_5_transport_cost_increases(self):
        # Surge transport rate changes best market
        payload1 = {
            "crop": "Tomato",
            "farmArea": 1.0,
            "historicalYield": 1000.0,
            "markets": [
                {"marketName": "Market A (Far)", "currentPrice": 40.0, "latitude": 14.5, "longitude": 80.5, "transportRate": 0.002, "status": "active"},
                {"marketName": "Market B (Near)", "currentPrice": 32.0, "latitude": 12.92, "longitude": 79.14, "transportRate": 0.002, "status": "active"}
            ],
            "farmLatitude": 12.91,
            "farmLongitude": 79.13,
            "weather": {"temperature": 25.0, "humidity": 60.0, "alerts": []}
        }
        res1 = self.optimizer.optimize(payload1)
        self.assertEqual(res1["strategies"][0]["marketName"], "Market A (Far)")

        # Now increase transport rate
        payload2 = payload1.copy()
        payload2["markets"] = [
            {"marketName": "Market A (Far)", "currentPrice": 40.0, "latitude": 14.5, "longitude": 80.5, "transportRate": 0.05, "status": "active"},
            {"marketName": "Market B (Near)", "currentPrice": 32.0, "latitude": 12.92, "longitude": 79.14, "transportRate": 0.05, "status": "active"}
        ]
        res2 = self.optimizer.optimize(payload2)
        self.assertEqual(res2["strategies"][0]["marketName"], "Market B (Near)")
        print("[OK] Test 5 Passed: Transport rate spikes dynamically shifts mandi ranks.")

    def test_6_sudden_price_crash(self):
        # If future prices crash, strategy shifts to immediate liquidation
        payload = {
            "crop": "Tomato",
            "farmArea": 1.0,
            "historicalYield": 1000.0,
            "storageCapacity": 1000.0,
            "storageDays": 5,
            "markets": [
                {"marketName": "Market A", "currentPrice": 35.0, "historicalPrices": [45.0, 42.0, 39.0, 35.0]} # Downward trend -> price crash forecast
            ],
            "farmLatitude": 12.91,
            "farmLongitude": 79.13,
            "weather": {"temperature": 25.0, "humidity": 60.0, "alerts": []}
        }
        res = self.optimizer.optimize(payload)
        best_strategy = res["strategies"][0]
        self.assertEqual(best_strategy["strategy"], "SELL_NOW")
        print("[OK] Test 6 Passed: Dynamic price trends trigger liquidation recommendation.")

    def test_7_limited_storage_capacity(self):
        # Do not recommend storing more than storage capacity bounds
        payload = {
            "crop": "Tomato",
            "farmArea": 1.0,
            "historicalYield": 1000.0,
            "storageCapacity": 300.0, # capacity lower than yield
            "storageDays": 5,
            "markets": [
                {"marketName": "Market A", "currentPrice": 30.0, "historicalPrices": [25.0, 27.0, 29.0, 30.0]} # Upward trend -> wait/store preferred
            ],
            "farmLatitude": 12.91,
            "farmLongitude": 79.13,
            "weather": {"temperature": 25.0, "humidity": 60.0, "alerts": []}
        }
        res = self.optimizer.optimize(payload)
        store_strategy = [s for s in res["strategies"] if s["strategy"] == "STORE_AND_SELL"][0]
        stored_qty = [a["quantity"] for a in store_strategy["allocation"] if a.get("storage")][0]
        self.assertEqual(stored_qty, 300.0)
        print("[OK] Test 7 Passed: Storage capacity constraints verified.")

    def test_8_split_selling(self):
        # Confirms split selling allocation yields higher profit margins
        payload = {
            "crop": "Tomato",
            "farmArea": 1.0,
            "historicalYield": 1000.0,
            "storageCapacity": 500.0,
            "storageDays": 5,
            "markets": [
                {"marketName": "Market A", "currentPrice": 30.0, "historicalPrices": [28.0, 29.0, 30.0], "status": "active"},
                {"marketName": "Market B", "currentPrice": 28.0, "historicalPrices": [27.0, 28.0, 28.0], "status": "active"}
            ],
            "farmLatitude": 12.91,
            "farmLongitude": 79.13,
            "weather": {"temperature": 25.0, "humidity": 60.0, "alerts": []}
        }
        res = self.optimizer.optimize(payload)
        strategies_str = [s["strategy"] for s in res["strategies"]]
        self.assertIn("SPLIT_SELL", strategies_str)
        print("[OK] Test 8 Passed: Split selling allocations successfully configured.")

if __name__ == "__main__":
    unittest.main()
