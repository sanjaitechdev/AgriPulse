import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { ShoppingCart } from 'lucide-react';

export default function AdminOrders() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: () => api.get('/orders').then((r) => r.data.data) });
  const STATUS_COLORS = { pending: 'badge-warning', accepted: 'badge-info', confirmed: 'badge-primary', pickup_scheduled: 'badge-primary', in_transit: 'badge-info', delivered: 'badge-success', completed: 'badge-success', disputed: 'badge-danger', cancelled: 'badge-danger' };
  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">All Orders</h1></div>
      {isLoading ? <div className="skeleton" style={{ height: 400, borderRadius: 12 }} /> : !data?.length ? <div className="empty-state"><ShoppingCart size={48} className="empty-state-icon" /><p className="empty-state-title">No orders yet</p></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Crop</th><th>Farmer</th><th>Buyer</th><th>Qty</th><th>Agreed Price</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o._id}>
                    <td className="font-medium">{o.cropName}</td>
                    <td className="text-sm">{o.farmer?.name}</td>
                    <td className="text-sm">{o.buyer?.name}</td>
                    <td>{o.quantity?.toLocaleString('en-IN')} kg</td>
                    <td>₹{o.agreedPrice}/kg</td>
                    <td className="font-semibold">₹{((o.agreedPrice||0)*(o.quantity||0)).toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-neutral'}`}>{o.status?.replace(/_/g,' ')}</span></td>
                    <td className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
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
