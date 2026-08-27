import { useState, useEffect } from 'react';
import { Sliders, RefreshCw, AlertTriangle, ArrowRight, Play, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CROP_NAME = "Tomato";
const BASE_MARKETS = [
  { marketName: "Salem Mandi", currentPrice: 32.0, futurePrice: 38.0, distance: 45, transportRate: 0.005, status: "active" },
  { marketName: "Chennai APMC", currentPrice: 36.0, futurePrice: 42.0, distance: 180, transportRate: 0.005, status: "active" },
  { marketName: "Coimbatore Local Hub", currentPrice: 29.0, futurePrice: 31.0, distance: 20, transportRate: 0.005, status: "active" }
];

export default function LiveDecisionLab() {
  // Preset select state
  const [activeScenario, setActiveScenario] = useState('none');

  // Interactive controls
  const [currentPrice, setCurrentPrice] = useState(36.0); // Chennai APMC price
  const [futurePrice, setFuturePrice] = useState(42.0); // Chennai APMC 5-day forecast
  const [yieldQty, setYieldQty] = useState(5000); // kg
  const [transportRate, setTransportRate] = useState(0.005); // per km per kg
  const [handlingCost, setHandlingCost] = useState(0.40); // per kg
  const [storageCost, setStorageCost] = useState(0.05); // per kg per day
  const [storageDays, setStorageDays] = useState(5);
  const [spoilagePercentage, setSpoilagePercentage] = useState(2.0); // % decay rate
  const [storageCapacity, setStorageCapacity] = useState(1500); // kg limit

  // Output states
  const [beforeState, setBeforeState] = useState(null);
  const [afterState, setAfterState] = useState(null);
  const [whyChanged, setWhyChanged] = useState('');

  // Deterministic Profit Calculation
  const runProfitEngine = (price, futPrice, yieldVal, transRate, handCost, storeCost, days, spoilPct, capacity) => {
    const saleable = yieldVal * (1.0 - spoilPct / 100);
    const grossRev = saleable * price;
    const distance = 180; // Chennai APMC distance
    
    // Transport
    const transportCost = distance * transRate * yieldVal;
    
    // Handling
    const handling = yieldVal * handCost;
    
    // Storage (constrained)
    const storedQty = Math.min(yieldVal, capacity);
    const surplusSold = Math.max(0, yieldVal - capacity);
    const storageCharge = storedQty * days * storeCost;
    
    // Spoilage Loss
    const spoilageLoss = yieldVal * (spoilPct / 100) * price;
    const totalCost = transportCost + handling + storageCharge + spoilageLoss;
    const netProfit = grossRev - transportCost - handling - storageCharge - spoilageLoss;

    // Wait Strategy (using expected future price)
    const waitSaleable = yieldVal * (1.0 - (spoilPct * 1.5) / 100); // waiting increases spoilage
    const waitGross = waitSaleable * futPrice;
    const waitTransport = distance * transRate * yieldVal;
    const waitSpoilageLoss = yieldVal * ((spoilPct * 1.5) / 100) * futPrice;
    const waitTotalCost = waitTransport + (yieldVal * handCost) + waitSpoilageLoss;
    const waitNetProfit = waitGross - waitTransport - (yieldVal * handCost) - waitSpoilageLoss;

    // Storage Strategy
    const storedSaleable = storedQty * (1.0 - spoilPct * 2 / 100);
    const storedGross = (storedSaleable * futPrice) + (surplusSold * price);
    const storedSpoilageLoss = (storedQty * spoilPct * 2 / 100 * futPrice) + (surplusSold * 0.01 * price);
    const storedTotalCost = (distance * transRate * yieldVal) + (yieldVal * handCost) + (storedQty * days * storeCost) + storedSpoilageLoss;
    const storedNetProfit = storedGross - storedTotalCost;

    // Split Sell Strategy
    const q1 = yieldVal * 0.6;
    const q2 = yieldVal * 0.4;
    const splitQtyStored = Math.min(q2, capacity);
    const splitSaleable1 = q1 * 0.99;
    const splitSaleable2 = splitQtyStored * (1.0 - spoilPct * 2 / 100);
    const splitSpoilage1 = q1 * 0.01 * price;
    const splitSpoilage2 = splitQtyStored * spoilPct * 2 / 100 * futPrice;
    const splitProfit = (splitSaleable1 * price - (distance * transRate * q1) - (q1 * handCost) - splitSpoilage1) + 
                        (splitSaleable2 * futPrice - (45 * transRate * splitQtyStored) - (splitQtyStored * handCost) - (splitQtyStored * days * storeCost) - splitSpoilage2);

    // Compile strategy ranks
    const strategies = [
      { name: "SELL_NOW", profit: netProfit, market: "Chennai APMC", desc: "Sell entire crop at current APMC modal price" },
      { name: "WAIT_TO_HARVEST", profit: waitNetProfit, market: "Chennai APMC", desc: "Harvest in 5 days for forecast prices" },
      { name: "STORE_AND_SELL", profit: storedNetProfit, market: "Chennai APMC", desc: `Store ${storedQty} kg in warehouse, sell surplus now` },
      { name: "SPLIT_SELL", profit: splitProfit, market: "Chennai APMC (60%) + Salem Mandi (40% Store)", desc: "Sell 60% now, store 40% at Salem Mandi" }
    ];

    strategies.sort((a, b) => b.profit - a.profit);
    const best = strategies[0];
    
    return {
      recommendation: best.name,
      expectedProfit: Math.round(best.profit),
      grossRevenue: Math.round(grossRev),
      totalCost: Math.round(totalCost),
      details: strategies
    };
  };

  // Run solver when variables update
  useEffect(() => {
    // Before simulation represents base inputs
    const before = runProfitEngine(36.0, 42.0, 5000, 0.005, 0.40, 0.05, 5, 2.0, 1500);
    const after = runProfitEngine(currentPrice, futurePrice, yieldQty, transportRate, handlingCost, storageCost, storageDays, spoilagePercentage, storageCapacity);
    
    setBeforeState(before);
    setAfterState(after);

    // Formulate dynamic Explanation
    if (before.recommendation !== after.recommendation) {
      if (before.recommendation === 'WAIT_TO_HARVEST' && after.recommendation === 'SELL_NOW') {
        setWhyChanged(`Future price advantage disappeared after the current market price change or transportation spikes.`);
      } else if (before.recommendation === 'WAIT_TO_HARVEST' && after.recommendation === 'STORE_AND_SELL') {
        setWhyChanged(`Waiting standing in field became unviable due to high weather/spoilage risks; local storage provides higher risk-adjusted return.`);
      } else {
        setWhyChanged(`Logistics parameters shift favored ${after.recommendation.replace(/_/g, ' ')} over the previous strategy.`);
      }
    } else {
      setWhyChanged('Decision recommendation remains stable under current conditions. Profit yields updated.');
    }
  }, [currentPrice, futurePrice, yieldQty, transportRate, handlingCost, storageCost, storageDays, spoilagePercentage, storageCapacity]);

  // Preset Trigger Scenarios
  const triggerScenario = (preset) => {
    setActiveScenario(preset);
    switch (preset) {
      case 'highest_price_trap':
        setCurrentPrice(34.0);
        setFuturePrice(36.0);
        setTransportRate(0.012);
        toast.success("Preset: Highest Price Trap!");
        break;
      case 'transport_shock':
        setTransportRate(0.025);
        toast.success("Preset: Transport Cost Increase!");
        break;
      case 'price_crash':
        setCurrentPrice(22.0);
        setFuturePrice(24.0);
        toast.success("Preset: Price Crash!");
        break;
      case 'spoilage_surge':
        setSpoilagePercentage(18.0);
        toast.success("Preset: Spoilage Increase!");
        break;
      case 'market_unavailable':
        setCurrentPrice(12.0);
        setFuturePrice(13.0);
        toast.success("Preset: Market APMC Unavailable!");
        break;
      case 'yield_reduction':
        setYieldQty(1200);
        toast.success("Preset: Yield Reduction!");
        break;
      case 'limited_storage':
        setStorageCapacity(200);
        toast.success("Preset: Limited Storage!");
        break;
      case 'split_selling':
        setStorageCapacity(2500);
        setYieldQty(5000);
        toast.success("Preset: Split Selling!");
        break;
      default:
        // Reset to base
        setCurrentPrice(36.0);
        setFuturePrice(42.0);
        setYieldQty(5000);
        setTransportRate(0.005);
        setHandlingCost(0.40);
        setStorageCost(0.05);
        setStorageDays(5);
        setSpoilagePercentage(2.0);
        setStorageCapacity(1500);
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'SELL_NOW': return 'badge-success';
      case 'STORE_AND_SELL': return 'badge-warning';
      case 'WAIT_TO_HARVEST': return 'badge-info';
      case 'SPLIT_SELL': return 'badge-accent';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 'var(--space-12)' }}>
      <div className="page-header">
        <h1 className="page-title">🧪 AgriPulse Live Decision Lab</h1>
        <p className="page-subtitle">Judges Sandbox Mode — Trace Real-time Strategic Changes</p>
      </div>

      {/* Preset Buttons Grid */}
      <div className="card card-padding" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 className="font-semibold" style={{ marginBottom: 'var(--space-3)' }}>Select Hackathon Demo Presets</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          <button className={`btn w-full ${activeScenario === 'highest_price_trap' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => triggerScenario('highest_price_trap')}>
            1. Highest Price Trap
          </button>
          <button className={`btn w-full ${activeScenario === 'transport_shock' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => triggerScenario('transport_shock')}>
            2. Transport Cost Shock
          </button>
          <button className={`btn w-full ${activeScenario === 'price_crash' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => triggerScenario('price_crash')}>
            3. Price Crash
          </button>
          <button className={`btn w-full ${activeScenario === 'spoilage_surge' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => triggerScenario('spoilage_surge')}>
            4. Spoilage Surge
          </button>
          <button className={`btn w-full ${activeScenario === 'market_unavailable' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => triggerScenario('market_unavailable')}>
            5. Market APMC Unavailable
          </button>
          <button className={`btn w-full ${activeScenario === 'yield_reduction' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => triggerScenario('yield_reduction')}>
            6. Yield Reduction
          </button>
          <button className={`btn w-full ${activeScenario === 'limited_storage' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => triggerScenario('limited_storage')}>
            7. Limited Storage
          </button>
          <button className={`btn w-full ${activeScenario === 'split_selling' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => triggerScenario('split_selling')}>
            8. Split Selling
          </button>
          <button className="btn btn-secondary w-full" onClick={() => triggerScenario('reset')}>
            🔄 Reset Simulator
          </button>
        </div>
      </div>

      {/* What-If Simulator Sliders & Outputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Sliders Panel */}
        <div className="card card-padding" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 className="font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={18} /> Tweak Parameters
          </h3>

          <div>
            <label className="form-label">Current APMC Price: ₹{currentPrice}/kg</label>
            <input type="range" min="10" max="60" step="1" className="w-full" value={currentPrice} onChange={(e) => setCurrentPrice(Number(e.target.value))} />
          </div>

          <div>
            <label className="form-label">Future Forecast Price: ₹{futurePrice}/kg</label>
            <input type="range" min="10" max="60" step="1" className="w-full" value={futurePrice} onChange={(e) => setFuturePrice(Number(e.target.value))} />
          </div>

          <div>
            <label className="form-label">Expected Yield: {yieldQty.toLocaleString()} kg</label>
            <input type="range" min="500" max="10000" step="100" className="w-full" value={yieldQty} onChange={(e) => setYieldQty(Number(e.target.value))} />
          </div>

          <div>
            <label className="form-label">Transport Rate: ₹{transportRate}/km/kg</label>
            <input type="range" min="0.001" max="0.05" step="0.001" className="w-full" value={transportRate} onChange={(e) => setTransportRate(Number(e.target.value))} />
          </div>

          <div>
            <label className="form-label">Spoilage Rate: {spoilagePercentage}%</label>
            <input type="range" min="0.5" max="25" step="0.5" className="w-full" value={spoilagePercentage} onChange={(e) => setSpoilagePercentage(Number(e.target.value))} />
          </div>

          <div>
            <label className="form-label">Storage Capacity: {storageCapacity} kg</label>
            <input type="range" min="0" max="5000" step="100" className="w-full" value={storageCapacity} onChange={(e) => setStorageCapacity(Number(e.target.value))} />
          </div>
        </div>

        {/* Side-by-Side Before/After Renders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Change Explanation Banner */}
          <div style={{
            background: beforeState?.recommendation !== afterState?.recommendation ? 'var(--color-warning-bg)' : 'var(--color-info-bg)',
            color: beforeState?.recommendation !== afterState?.recommendation ? 'var(--color-warning)' : 'var(--color-info)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid',
            borderColor: beforeState?.recommendation !== afterState?.recommendation ? 'var(--color-warning)' : 'var(--color-info)',
            display: 'flex',
            gap: 'var(--space-3)',
            alignItems: 'center'
          }}>
            <AlertTriangle size={24} style={{ flexShrink: 0 }} />
            <div>
              <h4 className="font-semibold" style={{ color: beforeState?.recommendation !== afterState?.recommendation ? 'var(--color-warning)' : 'var(--color-info)', marginBottom: 2 }}>
                {beforeState?.recommendation !== afterState?.recommendation ? '⚠️ Strategic Recommendation Shifted!' : 'ℹ️ Decision Stable'}
              </h4>
              <p className="text-sm font-medium">{whyChanged}</p>
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            
            {/* Before (Original State) */}
            <div className="card card-padding" style={{ opacity: 0.8, border: '1px solid var(--color-border)' }}>
              <div className="text-muted text-xs font-semibold" style={{ marginBottom: 4 }}>BEFORE SHOCK</div>
              {beforeState && (
                <>
                  <span className={`badge ${getActionBadgeColor(beforeState.recommendation)}`} style={{ marginBottom: 'var(--space-2)' }}>
                    {beforeState.recommendation?.replace(/_/g, ' ')}
                  </span>
                  <div className="stat-value text-muted" style={{ fontSize: 'var(--text-xl)' }}>
                    ₹{beforeState.expectedProfit.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-muted" style={{ marginBottom: 'var(--space-3)' }}>Expected Net Profit</div>
                  
                  <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border)', margin: 'var(--space-3) 0' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span>Gross Revenue:</span>
                      <span className="font-semibold">₹{beforeState.grossRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span>Total Costs:</span>
                      <span className="font-semibold">₹{beforeState.totalCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* After (Current Simulator State) */}
            <div className="card card-padding" style={{ border: '2px solid var(--color-primary)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="text-primary text-xs font-bold" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <TrendingUp size={12} /> AFTER SIMULATION SHOCK
              </div>
              {afterState && (
                <>
                  <span className={`badge ${getActionBadgeColor(afterState.recommendation)}`} style={{ marginBottom: 'var(--space-2)' }}>
                    {afterState.recommendation?.replace(/_/g, ' ')}
                  </span>
                  <div className="stat-value text-success" style={{ fontSize: 'var(--text-2xl)' }}>
                    ₹{afterState.expectedProfit.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-muted" style={{ marginBottom: 'var(--space-3)' }}>Expected Net Profit</div>
                  
                  <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span>Gross Revenue:</span>
                      <span className="font-semibold">₹{afterState.grossRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <span>Total Costs:</span>
                      <span className="font-semibold">₹{afterState.totalCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Strategy Ranks List */}
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Mandi Strategy Rankings (After Shock)</h3></div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Strategy Option</th><th>Mandi Target</th><th>Expected Return</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {afterState?.details?.map((s, idx) => (
                    <tr key={idx} className={idx === 0 ? 'font-semibold' : ''}>
                      <td>{s.name?.replace(/_/g, ' ')}</td>
                      <td>{s.market}</td>
                      <td className={idx === 0 ? 'text-success' : ''}>₹{Math.round(s.profit).toLocaleString('en-IN')}</td>
                      <td>{idx === 0 ? <span className="badge badge-success">optimal</span> : <span className="badge badge-neutral">sub-optimal</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
