import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { AlertTriangle, Link } from 'lucide-react';

export default function AdminRiskAlerts() {
  const { data, isLoading } = useQuery({ queryKey: ['risk-alerts'], queryFn: () => api.get('/admin/risk-alerts').then((r) => r.data.data), refetchInterval: 60000 });
  const riskColors = { low: 'badge-risk-low', medium: 'badge-risk-medium', high: 'badge-risk-high', critical: 'badge-risk-critical' };
  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Risk Alerts</h1><p className="page-subtitle">Active high-risk and critical unsold crop predictions requiring attention</p></div>
      {isLoading ? <div className="skeleton" style={{ height: 400, borderRadius: 12 }} /> : !data?.length ? (
        <div className="empty-state"><AlertTriangle size={40} className="empty-state-icon" /><p className="empty-state-title">No active risk alerts</p><p className="empty-state-desc">All crop cycles are within acceptable risk thresholds.</p></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Crop</th><th>Farmer</th><th>Unsold Risk</th><th>Risk Level</th><th>Days to Harvest</th><th>Est. Production</th><th>Computed</th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r._id} className={r.riskCategory === 'critical' ? 'highlight' : ''}>
                    <td className="font-medium">{r.cropName}</td>
                    <td className="text-sm">{r.farmer?.name || '—'}</td>
                    <td><div className="score-bar-container" style={{ width: 100 }}><div className="score-bar-track"><div className="score-bar-fill danger" style={{ width: `${(r.unsoldProbability||0)*100}%` }} /></div><div className="text-xs">{Math.round((r.unsoldProbability||0)*100)}%</div></div></td>
                    <td><span className={`badge ${riskColors[r.riskCategory] || 'badge-neutral'}`}>{r.riskCategory?.toUpperCase()}</span></td>
                    <td className="text-sm">{r.daysToHarvest != null ? `${r.daysToHarvest}d` : '—'}</td>
                    <td className="text-sm">{r.estimatedProduction?.toLocaleString('en-IN')} kg</td>
                    <td className="text-xs text-muted">{new Date(r.computedAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
