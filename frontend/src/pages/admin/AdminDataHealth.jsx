import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Database, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function AdminDataHealth() {
  const { data, isLoading } = useQuery({ queryKey: ['data-health'], queryFn: () => api.get('/admin/data-health').then((r) => r.data.data), refetchInterval: 60000 });

  const statusIcon = (s) => s === 'healthy' ? <CheckCircle size={15} color="var(--color-success)" /> : s === 'seeded' ? <Clock size={15} color="var(--color-accent)" /> : <AlertTriangle size={15} color="var(--color-warning)" />;
  const statusBadge = (s) => s === 'healthy' ? 'badge-success' : s === 'seeded' ? 'badge-warning' : 'badge-danger';

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Data Health</h1><p className="page-subtitle">External data source connectivity and freshness</p></div>
      {isLoading ? <div className="skeleton" style={{ height: 300, borderRadius: 12 }} /> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Data Source</th><th>Type</th><th>Status</th><th>Refresh Rate</th><th>Last Sync</th><th>Note</th></tr></thead>
              <tbody>
                {data?.sources?.map((s, i) => (
                  <tr key={i}>
                    <td><div className="flex items-center gap-2">{statusIcon(s.status)}<strong>{s.name}</strong></div></td>
                    <td><span className="badge badge-neutral">{s.type}</span></td>
                    <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="text-sm">{s.refreshRate || '—'}</td>
                    <td className="text-xs text-muted">{s.lastSync ? new Date(s.lastSync).toLocaleString('en-IN') : '—'}</td>
                    <td className="text-xs text-muted">{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <span className="text-xs text-muted">Last checked: {data?.checkedAt ? new Date(data.checkedAt).toLocaleString('en-IN') : '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
