import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { TrendingDown, BarChart3, AlertTriangle, Info } from 'lucide-react';
import api from '../../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function DemandGapPage() {
  const { cycleId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['demand-gap', cycleId],
    queryFn: () => api.get(`/ai/demand-gap/${cycleId}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Demand Gap Analysis</h1></div>
        {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12, marginBottom: 12 }} />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Demand Gap Analysis</h1>
          <p className="page-subtitle">Predict supply-demand mismatch before harvest</p>
        </div>
        <div className="alert alert-info">
          <Info size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Not yet computed:</strong> Demand gap analysis for this crop cycle hasn't been generated yet.
            This is auto-generated when a crop cycle has a harvest date within 60 days.
            You can also <Link to="/farmer/dashboard" style={{ fontWeight: 600 }}>trigger it from your dashboard</Link>.
          </div>
        </div>
      </div>
    );
  }

  const gapSeverity = data.gapPercent > 40 ? 'critical' : data.gapPercent > 20 ? 'high' : data.gapPercent > 5 ? 'medium' : 'low';
  const gapColor = { critical: 'var(--color-risk-critical)', high: 'var(--color-danger)', medium: 'var(--color-warning)', low: 'var(--color-success)' }[gapSeverity];

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Demand Gap Analysis</h1>
          <p className="page-subtitle">Crop: <strong>{data.cropName}</strong> · Harvest in <strong>{data.daysToHarvest} days</strong></p>
        </div>
        {gapSeverity !== 'low' && (
          <Link to={`/farmer/rescue/${cycleId}`} className="btn btn-danger btn-sm">
            🚨 Get Rescue Options
          </Link>
        )}
      </div>

      {/* Gap summary */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card card-padding">
          <div className="stat-label">Estimated Production</div>
          <div className="stat-value">{data.estimatedProduction?.toLocaleString('en-IN')} kg</div>
        </div>
        <div className="card card-padding">
          <div className="stat-label">Expected Demand</div>
          <div className="stat-value" style={{ color: 'var(--color-info)' }}>{data.expectedDemand?.toLocaleString('en-IN')} kg</div>
        </div>
        <div className="card card-padding">
          <div className="stat-label">Supply-Demand Gap</div>
          <div className="stat-value" style={{ color: gapColor }}>
            {data.gapPercent > 0 ? '+' : ''}{data.gapPercent?.toFixed(1)}%
          </div>
          <div className="text-xs text-muted">
            {data.gapPercent > 0 ? 'OVERSUPPLY — Price pressure likely' : data.gapPercent < -5 ? 'UNDERSUPPLY — Strong price potential' : 'Balanced supply-demand'}
          </div>
        </div>
      </div>

      {/* Forecast chart */}
      {data.forecastData?.length > 0 && (
        <div className="card card-padding" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>30-Day Demand Forecast (kg)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.forecastData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {data.estimatedProduction && <ReferenceLine y={data.estimatedProduction} stroke="var(--color-danger)" strokeDasharray="4 4" label={{ value: 'Your Supply', fontSize: 10 }} />}
              <Area type="monotone" dataKey="demand" stroke="var(--color-info)" fill="var(--color-info-bg)" name="Expected Demand" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Explanation */}
      <div className="card card-padding">
        <h3 className="font-semibold" style={{ marginBottom: 'var(--space-3)' }}>Analysis</h3>
        <p className="text-sm" style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          {data.explanation || `Based on current market demand signals, your crop is expected to face ${gapSeverity} ${data.gapPercent > 0 ? 'oversupply' : 'undersupply'} pressure at harvest time. This analysis uses 30-day rolling demand averages from matched buyer demands and historical market patterns for ${data.cropName}.`}
        </p>
        <div className="text-xs text-muted">
          Confidence: {Math.round((data.confidence || 0.65) * 100)}% · Model: {data.modelVersion || 'v1.0'} ·
          Computed: {data.computedAt ? new Date(data.computedAt).toLocaleString('en-IN') : 'now'}
        </div>
      </div>
    </div>
  );
}
