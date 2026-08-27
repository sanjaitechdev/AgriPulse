import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../../lib/api';
import useNotificationStore from '../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

const typeIcons = { proposal_received: '📋', proposal_accepted: '✅', proposal_rejected: '❌', proposal_counter: '↔️', order_status: '📦', risk_alert: '⚠️', notification: '🔔' };

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { markAllRead: markAllReadStore, markRead: markReadStore } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=100').then((r) => r.data),
  });

  const { mutate: markAll } = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => { markAllReadStore(); qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All notifications marked as read'); },
  });

  const { mutate: markOne } = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: (_, id) => { markReadStore(id); qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const notifications = data?.data || [];
  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAll}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />)}
        </div>
      ) : !notifications.length ? (
        <div className="empty-state">
          <Bell size={48} className="empty-state-icon" />
          <p className="empty-state-title">No notifications yet</p>
          <p className="empty-state-desc">Proposals, orders, and platform updates will appear here.</p>
        </div>
      ) : (
        <div className="card">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.read && markOne(n._id)}
              style={{
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--color-surface-3)',
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'flex-start',
                background: !n.read ? 'var(--color-primary-50)' : 'transparent',
                cursor: !n.read ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                {typeIcons[n.type] || '🔔'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm">{n.title}</div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 4 }} />}
                </div>
                <div className="text-sm text-muted" style={{ marginTop: 2, lineHeight: 'var(--line-height-relaxed)' }}>{n.body}</div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
