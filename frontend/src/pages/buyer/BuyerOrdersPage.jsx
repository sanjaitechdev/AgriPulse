import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import api from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = { pending: 'badge-warning', accepted: 'badge-info', confirmed: 'badge-primary', pickup_scheduled: 'badge-primary', in_transit: 'badge-info', delivered: 'badge-success', completed: 'badge-success', disputed: 'badge-danger', cancelled: 'badge-danger' };

export default function BuyerOrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['buyer-orders'], queryFn: () => api.get('/orders').then((r) => r.data.data) });

  if (isLoading) return <div><div className="page-header"><h1 className="page-title">My Orders</h1></div>{[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 12 }} />)}</div>;

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">My Orders</h1><p className="page-subtitle">Track all your crop purchase orders</p></div>
      {!data?.length ? (
        <div className="empty-state"><ShoppingCart size={48} className="empty-state-icon" /><p className="empty-state-title">No orders yet</p><p className="empty-state-desc">Orders are created when you accept a farmer's proposal or a farmer accepts yours.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {data.map((order) => (
            <div key={order._id} className="card card-padding">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
                    <h3 className="font-semibold text-lg">{order.cropName}</h3>
                    <span className={`badge ${STATUS_COLORS[order.status] || 'badge-neutral'}`}>{order.status?.replace(/_/g,' ')}</span>
                  </div>
                  <div className="text-sm text-muted">Farmer: <strong>{order.farmer?.name}</strong> · {order.quantity?.toLocaleString('en-IN')} kg · {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stat-value stat-value-sm">₹{((order.agreedPrice||0)*(order.quantity||0)).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-muted">₹{order.agreedPrice}/kg × {order.quantity?.toLocaleString('en-IN')} kg</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
