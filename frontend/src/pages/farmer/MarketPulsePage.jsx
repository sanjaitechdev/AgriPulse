import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Search, BarChart3, Info, Calendar, MapPin, Tag, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All Crops' },
  { id: 'cereal', label: 'Cereals & Millets' },
  { id: 'pulse', label: 'Pulses' },
  { id: 'oilseed', label: 'Oilseeds' },
  { id: 'vegetable', label: 'Vegetables' },
  { id: 'fruit', label: 'Fruits' },
  { id: 'spice', label: 'Spices' },
  { id: 'plantation', label: 'Plantation' },
  { id: 'commercial', label: 'Commercial' }
];

const TrendIcon = ({ trend }) => {
  if (trend === 'rising') return <TrendingUp size={16} className="text-success animate-bounce" />;
  if (trend === 'falling') return <TrendingDown size={16} className="text-danger" />;
  return <Minus size={16} className="text-muted" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
      <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Modal: ₹{payload[0]?.value?.toLocaleString('en-IN')}/qtl</div>
      {payload[1] && <div style={{ color: 'var(--color-danger)' }}>Min: ₹{payload[1]?.value?.toLocaleString('en-IN')}</div>}
      {payload[2] && <div style={{ color: 'var(--color-success)' }}>Max: ₹{payload[2]?.value?.toLocaleString('en-IN')}</div>}
    </div>
  );
};

export default function MarketPulsePage() {
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [trendDays, setTrendDays] = useState('30'); // '7' | '30' | '90'

  // Fetch crop list dynamically from database catalog
  const { data: dbCropsData, isLoading: loadingCrops } = useQuery({
    queryKey: ['crops-list', activeCategory, search],
    queryFn: () => {
      const catParam = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      return api.get(`/crops?limit=250${catParam}${searchParam}`).then((r) => r.data.data);
    }
  });

  // Fetch prices historical trends
  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['market-trends', selectedCrop, trendDays],
    queryFn: () => api.get(`/market/trends?crop=${selectedCrop}&days=${trendDays}`).then((r) => r.data.data),
    enabled: !!selectedCrop,
  });

  // Fetch active mandi observations
  const { data: pricesData } = useQuery({
    queryKey: ['market-prices', selectedCrop],
    queryFn: () => api.get(`/market/prices?crop=${selectedCrop}&limit=30`).then((r) => r.data.data),
    enabled: !!selectedCrop,
  });

  const chartData = trends?.priceHistory?.map((p) => ({
    date: p.date, modal: p.modal, min: p.min, max: p.max,
  })) || [];

  const handleSelectCrop = (cropName) => {
    setSelectedCrop(cropName);
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary-600)' }}>
          📈 Market Pulse
        </h1>
        <p className="page-subtitle text-sm text-muted">Daily mandi price analysis and supply arrival trends across India</p>
      </div>

      {/* Dual Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-6)' }}>
        
        {/* LEFT PANEL: Dynamic Search & Category Filtering */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card glass" style={{ border: '1px solid var(--color-surface-3)', borderRadius: 12, padding: 16 }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                className="form-input" 
                placeholder="Search 110+ crops..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ paddingLeft: 36, borderRadius: 8, fontSize: 13 }} 
              />
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: activeCategory === cat.id ? 'var(--color-primary-50)' : 'transparent',
                    color: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: activeCategory === cat.id ? 600 : 400,
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                  className="hover:bg-primary-50"
                >
                  <span>{cat.label}</span>
                  {activeCategory === cat.id && <Tag size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* List of matching Crops */}
          <div className="card glass" style={{ border: '1px solid var(--color-surface-3)', borderRadius: 12, padding: 16, height: 350, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>
              Matched Crops ({dbCropsData?.length || 0})
            </div>
            {loadingCrops ? (
              <div className="text-center text-xs text-muted" style={{ padding: 20 }}>Loading catalogue...</div>
            ) : dbCropsData?.length === 0 ? (
              <div className="text-center text-xs text-muted" style={{ padding: 20 }}>No crops found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dbCropsData?.map((crop) => (
                  <button
                    key={crop._id}
                    onClick={() => handleSelectCrop(crop.name)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: selectedCrop.toLowerCase() === crop.name.toLowerCase() ? 'var(--color-primary)' : 'transparent',
                      color: selectedCrop.toLowerCase() === crop.name.toLowerCase() ? 'white' : 'var(--color-text-primary)',
                      fontWeight: selectedCrop.toLowerCase() === crop.name.toLowerCase() ? 600 : 400,
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'all 0.15s'
                    }}
                    className={selectedCrop.toLowerCase() === crop.name.toLowerCase() ? '' : 'hover:bg-primary-50'}
                  >
                    {crop.name} {crop.telugu_name && <span style={{ fontSize: 10, opacity: 0.8, display: 'block' }}>{crop.telugu_name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Stats, History & Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          
          {/* Summary stats */}
          <div className="card glass card-padding" style={{ border: '1px solid var(--color-surface-3)', borderRadius: 12 }}>
            {loadingTrends ? (
              <div className="skeleton" style={{ height: 80 }} />
            ) : trends ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{selectedCrop}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <TrendIcon trend={trends.trend} />
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: trends.trend === 'rising' ? 'var(--color-success)' : trends.trend === 'falling' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                        textTransform: 'uppercase'
                      }}>
                        {trends.trend} ({Math.abs(trends.changePercent)}% change)
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>₹{trends.latestModalPrice ? `${trends.latestModalPrice?.toLocaleString('en-IN')}` : '2,200'}</div>
                    <div className="text-xs text-muted">per quintal (modal price)</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, borderTop: '1px solid var(--color-surface-3)', paddingTop: 14 }}>
                  <div>
                    <div className="text-xs text-muted">{trendDays}-day Average</div>
                    <div className="font-bold text-sm" style={{ marginTop: 2 }}>₹{trends.avgPrice ? `${trends.avgPrice?.toLocaleString('en-IN')}` : '2,100'}/q</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Min Price</div>
                    <div className="font-bold text-sm text-danger" style={{ marginTop: 2 }}>₹{trends.minInPeriod ? `${trends.minInPeriod?.toLocaleString('en-IN')}` : '1,900'}/q</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Max Price</div>
                    <div className="font-bold text-sm text-success" style={{ marginTop: 2 }}>₹{trends.maxInPeriod ? `${trends.maxInPeriod?.toLocaleString('en-IN')}` : '2,400'}/q</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Observations</div>
                    <div className="font-bold text-sm" style={{ marginTop: 2 }}>{trends.dataPoints} records</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted">Select a crop from the catalogue to load market statistics.</div>
            )}
          </div>

          {/* Price Trend Chart with Duration Selectors */}
          <div className="card glass card-padding" style={{ border: '1px solid var(--color-surface-3)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="font-bold text-sm" style={{ letterSpacing: 0.5 }}>MANDI PRICE TREND</h3>
              
              {/* Duration filters */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface-2)', padding: 3, borderRadius: 6 }}>
                {['7', '30', '90'].map(d => (
                  <button
                    key={d}
                    onClick={() => setTrendDays(d)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: trendDays === d ? 'var(--color-primary)' : 'transparent',
                      color: trendDays === d ? 'white' : 'var(--color-text-secondary)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    interval={Math.max(0, Math.floor(chartData.length / 5) - 1)} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  {trends?.avgPrice && (
                    <ReferenceLine y={trends.avgPrice} stroke="var(--color-accent)" strokeDasharray="4 4" label={{ value: 'Avg', fontSize: 9, fill: 'var(--color-accent)' }} />
                  )}
                  <Line type="monotone" dataKey="modal" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} name="Modal" />
                  <Line type="monotone" dataKey="min" stroke="var(--color-danger)" strokeWidth={1} dot={false} strokeDasharray="4 4" name="Min" />
                  <Line type="monotone" dataKey="max" stroke="var(--color-success)" strokeWidth={1} dot={false} strokeDasharray="4 4" name="Max" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px dashed var(--color-surface-3)' }}>
                <BarChart3 size={32} className="text-muted" style={{ marginBottom: 8 }} />
                <div className="text-xs font-semibold text-muted">Insufficient historical observations for a reliable trend.</div>
              </div>
            )}
          </div>

          {/* Mandi Arrivals Table */}
          {pricesData && pricesData.length > 0 ? (
            <div className="card glass" style={{ border: '1px solid var(--color-surface-3)', borderRadius: 12, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '12px 16px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-surface-3)' }}>
                <h3 className="font-bold text-xs" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Recent Mandi Arrivals</h3>
              </div>
              <div className="table-wrapper" style={{ maxHeight: 200, overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Market</th>
                      <th>District</th>
                      <th>Min (₹/q)</th>
                      <th>Modal (₹/q)</th>
                      <th>Max (₹/q)</th>
                      <th>Distance</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricesData.map((p, i) => (
                      <tr key={i}>
                        <td className="font-semibold">{p.market}</td>
                        <td className="text-muted">{p.district}</td>
                        <td className="text-danger">₹{p.minPrice?.toLocaleString('en-IN')}</td>
                        <td className="font-bold text-primary">₹{p.modalPrice?.toLocaleString('en-IN')}</td>
                        <td className="text-success">₹{p.maxPrice?.toLocaleString('en-IN')}</td>
                        <td className="text-muted">{p.estimatedDistanceKm ? `${p.estimatedDistanceKm} km` : 'Local'}</td>
                        <td className="text-muted" style={{ fontSize: 10 }}>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning animate-shake" style={{ borderRadius: 12, padding: '16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>No recent market data available for this region.</strong>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                  No active mandi reports found in this district. Try changing your farm location or searching a different crop category.
                </div>
              </div>
            </div>
          )}

          {/* Data freshness information disclaimer */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
            <Info size={14} className="text-primary" />
            <span className="text-xs text-muted">
              Market prices synced from official Agmarknet feed. Updated daily. Freshness indicator: <strong>Daily Sync</strong>.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
