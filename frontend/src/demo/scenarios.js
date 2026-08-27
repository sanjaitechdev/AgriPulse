export const scenarios = {
  price_trap: {
    id: 'price_trap',
    title: 'Highest Price Trap',
    description: 'A distant market offers ₹42/kg while the local mandi offers ₹35/kg. The solver chooses the local market because transport costs eat all the margin of the distant market.',
    decision: {
      recommendation: 'HARVEST_NOW',
      bestMarket: 'Local APMC Mandi',
      allocation: [{ market: 'Local APMC Mandi', quantity: 3000, action: 'SELL_NOW' }],
      expectedRevenue: 105000,
      totalCost: 6500, // ₹4500 handling + ₹2000 transport
      expectedProfit: 98500,
      riskAdjustedProfit: 96000,
      riskScore: 12,
      confidence: 0.94,
      explanation: 'Although Distant Mega-Mandi offers a higher price of ₹42/kg (vs ₹35/kg local), transport costs of ₹15,000 to move 3,000kg over 240km make it less profitable than selling locally now.',
      profitLeakage: [
        { name: 'Transport Cost', amount: 2000 },
        { name: 'Handling Cost', amount: 4500 },
        { name: 'Storage Cost', amount: 0 },
        { name: 'Spoilage Cost', amount: 0 }
      ]
    },
    markets: [
      { marketName: 'Local APMC Mandi', currentPricePerKg: 35, distanceKm: 15 },
      { marketName: 'Distant Mega-Mandi', currentPricePerKg: 42, distanceKm: 240 }
    ],
    forecast: {
      volatility: 0.04,
      confidence: 0.95,
      forecasts: {
        1: { price: 35 }, 2: { price: 35 }, 3: { price: 34.5 }, 5: { price: 34 }, 7: { price: 33 }
      }
    }
  },
  future_price_trap: {
    id: 'future_price_trap',
    title: 'Future Price Trap',
    description: 'Price predictions show a 15% increase in 5 days, but the spoilage rate under warm ambient storage is so high that waiting actually loses money. The solver recommends selling now.',
    decision: {
      recommendation: 'HARVEST_NOW',
      bestMarket: 'District APMC Mandi',
      allocation: [{ market: 'District APMC Mandi', quantity: 2000, action: 'SELL_NOW' }],
      expectedRevenue: 60000,
      totalCost: 4000,
      expectedProfit: 56000,
      riskAdjustedProfit: 54000,
      riskScore: 18,
      confidence: 0.88,
      explanation: 'While prices are projected to rise to ₹34.5/kg in 5 days (currently ₹30/kg), warm ambient storage will cause 12% crop spoilage (loss of ₹8,280), resulting in lower net profit than selling immediately.',
      profitLeakage: [
        { name: 'Transport Cost', amount: 1000 },
        { name: 'Handling Cost', amount: 3000 },
        { name: 'Storage Cost', amount: 0 },
        { name: 'Spoilage Cost', amount: 0 }
      ]
    },
    markets: [
      { marketName: 'District APMC Mandi', currentPricePerKg: 30, distanceKm: 45 }
    ],
    forecast: {
      volatility: 0.08,
      confidence: 0.82,
      forecasts: {
        1: { price: 31 }, 2: { price: 32 }, 3: { price: 33 }, 5: { price: 34.5 }, 7: { price: 35 }
      }
    }
  },
  split_win: {
    id: 'split_win',
    title: 'Split Harvest Win',
    description: 'Large crop volume exceeds local daily market demand. The solver optimizes the allocation: sell 60% immediately to avoid storage fees, and store 40% for 3 days to capture higher future returns.',
    decision: {
      recommendation: 'SPLIT_HARVEST',
      bestMarket: 'District Mandi (60%) + Store (40%)',
      allocation: [
        { market: 'District Mandi', quantity: 3000, action: 'SELL_NOW' },
        { market: 'On-Farm Cold Storage', quantity: 2000, action: 'STORE_3_DAYS' }
      ],
      expectedRevenue: 156000,
      totalCost: 14200,
      expectedProfit: 141800,
      riskAdjustedProfit: 138000,
      riskScore: 22,
      confidence: 0.90,
      explanation: 'Splitting returns the highest risk-adjusted profit of ₹141,800. Selling 60% now guarantees cash flow and avoids storage overhead, while storing 40% in cold storage for 3 days lets you sell at a ₹34/kg peak.',
      profitLeakage: [
        { name: 'Transport Cost', amount: 4500 },
        { name: 'Handling Cost', amount: 7500 },
        { name: 'Storage Cost', amount: 600 }, // ₹0.10/kg/day * 3 days * 2000kg
        { name: 'Spoilage Cost', amount: 1600 } // 2.3% cold storage spoilage
      ]
    },
    markets: [
      { marketName: 'District Mandi', currentPricePerKg: 30, distanceKm: 35 }
    ],
    forecast: {
      volatility: 0.05,
      confidence: 0.92,
      forecasts: {
        1: { price: 31 }, 2: { price: 32.5 }, 3: { price: 34.2 }, 5: { price: 32 }, 7: { price: 30 }
      }
    }
  },
  market_shock: {
    id: 'market_shock',
    title: 'Market Shock (Crash Alert)',
    description: 'An incoming heavy monsoon is predicted to disrupt transport and crash regional market prices. The rescue watcher triggers an urgent harvest recommendation to secure profits before the crash.',
    decision: {
      recommendation: 'HARVEST_NOW',
      bestMarket: 'Regional Terminal APMC',
      allocation: [{ market: 'Regional Terminal APMC', quantity: 4000, action: 'SELL_NOW' }],
      expectedRevenue: 112000,
      totalCost: 9800,
      expectedProfit: 102200,
      riskAdjustedProfit: 99000,
      riskScore: 35,
      confidence: 0.85,
      explanation: '🔴 MONSOON SHOCK WARNING: Weather models indicate heavy rain starting in 48 hours, which will block transport roads and crash mandi arrivals. Harvest and sell immediately today to secure ₹28/kg.',
      profitLeakage: [
        { name: 'Transport Cost', amount: 3200 },
        { name: 'Handling Cost', amount: 6000 },
        { name: 'Storage Cost', amount: 0 },
        { name: 'Spoilage Cost', amount: 600 }
      ]
    },
    markets: [
      { marketName: 'Regional Terminal APMC', currentPricePerKg: 28, distanceKm: 80 }
    ],
    forecast: {
      volatility: 0.12,
      confidence: 0.80,
      forecasts: {
        1: { price: 27 }, 2: { price: 22 }, 3: { price: 18 }, 5: { price: 15 }, 7: { price: 14 }
      }
    }
  }
};
export default scenarios;
