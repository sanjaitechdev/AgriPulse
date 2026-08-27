import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sliders, HelpCircle, Check, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function WhatIfSimulator({ 
  initialPrice = 30, 
  initialQty = 2000, 
  initialDistance = 50,
  initialStorageType = 'ambient'
}) {
  const { t } = useTranslation();

  // Simulator Inputs
  const [price, setPrice] = useState(initialPrice);
  const [quantity, setQuantity] = useState(initialQty);
  const [waitDays, setWaitDays] = useState(3);
  const [spoilageRate, setSpoilageRate] = useState(0.015); // 1.5% per day
  const [transportRate, setTransportRate] = useState(8); // ₹8/km/tonne
  const [storageCostDay, setStorageCostDay] = useState(0.05); // ₹0.05/kg/day

  // Outputs
  const [results, setResults] = useState({
    grossRevenue: 0,
    transportCost: 0,
    handlingCost: 0,
    storageCost: 0,
    spoilageCost: 0,
    netProfit: 0,
    sellNowProfit: 0,
    advantage: 0
  });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // 1. Calculate for specific waitDays selection
    const distance = initialDistance || 45;
    const handlingRate = 1.5; // fixed

    const calcForDays = (days, targetPrice) => {
      const activePrice = targetPrice;
      const activeSpoilageRate = initialStorageType === 'cold' ? spoilageRate * 0.2 : spoilageRate;
      
      const totalSpoilagePct = Math.min(0.95, activeSpoilageRate * days);
      const saleableQty = quantity * (1 - totalSpoilagePct);
      const grossRev = saleableQty * activePrice;
      
      const transportCost = ((distance * transportRate) / 1000) * quantity;
      const handlingCost = handlingRate * quantity;
      const storageCost = storageCostDay * days * quantity;
      const spoilageCost = quantity * totalSpoilagePct * activePrice;
      
      const netProfit = grossRev - transportCost - handlingCost - storageCost;

      return {
        netProfit,
        grossRev,
        transportCost,
        handlingCost,
        storageCost,
        spoilageCost
      };
    };

    const currentResult = calcForDays(waitDays, price);
    const sellNowResult = calcForDays(0, initialPrice);

    setResults({
      grossRevenue: currentResult.grossRev,
      transportCost: currentResult.transportCost,
      handlingCost: currentResult.handlingCost,
      storageCost: currentResult.storageCost,
      spoilageCost: currentResult.spoilageCost,
      netProfit: currentResult.netProfit,
      sellNowProfit: sellNowResult.netProfit,
      advantage: currentResult.netProfit - sellNowResult.netProfit
    });

    // 2. Generate chart data for 0 to 7 days
    const data = [];
    for (let d = 0; d <= 7; d++) {
      // Assume a slight price trend: either flat, rising (3% per day), or dropping (-2% per day)
      // For simple simulator, we show flat price projection vs actual customized price
      const projectedPrice = d === waitDays ? price : initialPrice + ((price - initialPrice) / Math.max(1, waitDays)) * d;
      const res = calcForDays(d, projectedPrice);
      data.push({
        day: `${d}d`,
        Profit: Math.round(res.netProfit),
        Spoilage: Math.round(res.spoilageCost),
        Storage: Math.round(res.storageCost)
      });
    }
    setChartData(data);

  }, [price, quantity, waitDays, spoilageRate, transportRate, storageCostDay, initialPrice, initialDistance, initialStorageType]);

  return (
    <div className="card card-padding" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
        <Sliders size={20} className="text-primary" />
        {t('what_if')}
      </h3>
      <p className="text-xs text-muted mb-6 leading-relaxed">
        Drag the sliders to simulate changes in market conditions, transport rates, or storage durations. 
        See how profit shifts dynamically in real-time.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Sliders Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <label>Future Price (₹/kg)</label>
              <span className="text-primary font-bold">₹{price.toFixed(1)}/kg</span>
            </div>
            <input 
              type="range" 
              min={Math.round(initialPrice * 0.5)} 
              max={Math.round(initialPrice * 1.8)} 
              step="0.5"
              value={price} 
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>₹{Math.round(initialPrice * 0.5)}</span>
              <span>Current: ₹{initialPrice}</span>
              <span>₹{Math.round(initialPrice * 1.8)}</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <label>Storage Wait Duration</label>
              <span className="text-primary font-bold">{waitDays} Days</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="7" 
              step="1"
              value={waitDays} 
              onChange={(e) => setWaitDays(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>Sell Now</span>
              <span>3 Days</span>
              <span>7 Days</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <label>Harvest Qty (kg)</label>
              <span className="text-primary font-bold">{quantity.toLocaleString()} kg</span>
            </div>
            <input 
              type="range" 
              min="500" 
              max="15000" 
              step="500"
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <label>Spoilage Rate (%/day)</label>
              <span className="text-primary font-bold">{(spoilageRate * 100).toFixed(1)}%</span>
            </div>
            <input 
              type="range" 
              min="0.005" 
              max="0.05" 
              step="0.005"
              value={spoilageRate} 
              onChange={(e) => setSpoilageRate(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Chart / Advantage Side */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 mb-4 flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground font-semibold">Simulated Strategy Return</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                ₹{Math.round(results.netProfit).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                results.advantage >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {results.advantage >= 0 ? `+ ₹${Math.round(results.advantage).toLocaleString('en-IN')} advantage` : `- ₹${Math.round(Math.abs(results.advantage)).toLocaleString('en-IN')} disadvantage`}
              </span>
              <div className="text-[10px] text-muted-foreground mt-1">vs immediate Sell Now</div>
            </div>
          </div>

          {/* Chart visualization */}
          <div style={{ height: 160, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" style={{ fontSize: 10 }} />
                <YAxis style={{ fontSize: 10 }} width={45} />
                <Tooltip />
                <Line type="monotone" dataKey="Profit" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
export default WhatIfSimulator;
