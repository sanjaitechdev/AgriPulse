import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Shield } from 'lucide-react';

export default function AdminAuditLogs() {
  const { data, isLoading } = useQuery({ queryKey: ['audit-logs'], queryFn: () => api.get('/admin/audit-logs?limit=100').then((r) => r.data.data) });
  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Audit Logs</h1><p className="page-subtitle">All critical platform actions with actor, timestamp and changes</p></div>
      {isLoading ? <div className="skeleton" style={{ height: 400, borderRadius: 12 }} /> : !data?.length ? <div className="empty-state"><Shield size={40} className="empty-state-icon" /><p className="empty-state-title">No audit logs yet</p></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Action</th><th>Actor</th><th>Role</th><th>Entity</th><th>Timestamp</th></tr></thead>
              <tbody>
                {data.map((log) => (
                  <tr key={log._id}>
                    <td><code style={{ fontSize: 'var(--text-xs)', background: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: 4 }}>{log.action}</code></td>
                    <td className="text-sm">{log.actor?.name || '—'}</td>
                    <td><span className="badge badge-neutral">{log.actorRole}</span></td>
                    <td className="text-sm text-muted">{log.entity}</td>
                    <td className="text-xs text-muted">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
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
