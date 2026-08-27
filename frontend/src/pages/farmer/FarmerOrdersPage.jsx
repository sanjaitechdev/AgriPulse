import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingCart, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'badge-warning', accepted: 'badge-info', confirmed: 'badge-primary',
  pickup_scheduled: 'badge-primary', in_transit: 'badge-info',
  delivered: 'badge-success', completed: 'badge-success',
  disputed: 'badge-danger', cancelled: 'badge-danger',
};

const NEXT_ACTIONS = {
  pending: null,
  accepted: { label: 'Confirm', next: 'confirmed' },
  confirmed: { label: 'Schedule Pickup', next: 'pickup_scheduled' },
  pickup_scheduled: { label: 'Mark In Transit', next: 'in_transit' },
  in_transit: { label: 'Mark Delivered', next: 'delivered' },
};

export default function FarmerOrdersPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: () => api.get('/orders').then((r) => r.data.data),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: (_, v) => {
      toast.success(`Order marked as ${v.status.replace(/_/g, ' ')}`);
      qc.invalidateQueries({ queryKey: ['farmer-orders'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update status'),
  });

  if (isLoading) return (
    <div>
      <div className="page-header"><h1 className="page-title">My Orders</h1></div>
      {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 12 }} />)}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">Track and manage all your crop orders</p>
      </div>

      {!data?.length ? (
        <div className="empty-state">
          <ShoppingCart size={48} className="empty-state-icon" />
          <p className="empty-state-title">No orders yet</p>
          <p className="empty-state-desc">Orders are created automatically when a buyer accepts your proposal.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {data.map((order) => {
            const action = NEXT_ACTIONS[order.status];
            const totalValue = (order.agreedPrice || 0) * (order.quantity || 0);
            return (
              <div key={order._id} className="card card-padding">
                <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-3)' }}>
                  <div>
                    <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
                      <h3 className="font-semibold text-lg">{order.cropName}</h3>
                      <span className={`badge ${STATUS_COLORS[order.status] || 'badge-neutral'}`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-muted">
                      Buyer: <strong>{order.buyer?.name}</strong> · {order.quantity?.toLocaleString('en-IN')} kg ·{' '}
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="stat-value stat-value-sm">₹{totalValue.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-muted">₹{order.agreedPrice}/kg × {order.quantity?.toLocaleString('en-IN')} kg</div>
                  </div>
                </div>

                {/* Status timeline */}
                <div style={{
                  padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-2)', marginBottom: 'var(--space-3)',
                  fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                }}>
                  Last update: {order.statusHistory?.slice(-1)[0]?.notes || `Status changed to ${order.status}`}
                </div>

                {action && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => updateStatus({ id: order._id, status: action.next })}
                  >
                    {action.label} <ChevronRight size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
