import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function BuyerDemandsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['buyer-demands'],
    queryFn: () => api.get('/demands?limit=50').then((r) => r.data),
  });

  const { mutate: cancel } = useMutation({
    mutationFn: (id) => api.put(`/demands/${id}`, { status: 'cancelled' }),
    onSuccess: () => { toast.success('Demand cancelled'); qc.invalidateQueries({ queryKey: ['buyer-demands'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-start">
        <div><h1 className="page-title">My Demands</h1><p className="page-subtitle">Track your posted crop requirements</p></div>
        <Link to="/buyer/post-demand" className="btn btn-primary"><Plus size={16} /> Post Demand</Link>
      </div>
      {isLoading ? <div className="skeleton" style={{ height: 300, borderRadius: 12 }} /> :
       !data?.data?.length ? (
        <div className="empty-state">
          <ClipboardList size={48} className="empty-state-icon" />
          <p className="empty-state-title">No demands posted yet</p>
          <Link to="/buyer/post-demand" className="btn btn-primary">Post your first demand</Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Crop</th><th>Quantity</th><th>Price Range</th><th>Required By</th><th>Location</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {data.data.map((d) => (
                  <tr key={d._id}>
                    <td><div className="font-semibold">{d.cropName}</div><div className="text-xs text-muted">Grade: {d.gradeRequired || 'any'}</div></td>
                    <td>{d.quantity?.toLocaleString('en-IN')} kg</td>
                    <td>{d.targetPriceMin ? `₹${d.targetPriceMin}–` : ''}{d.targetPriceMax ? `₹${d.targetPriceMax}/kg` : 'Open'}</td>
                    <td className="text-sm">{new Date(d.requiredByDate).toLocaleDateString('en-IN')}</td>
                    <td className="text-sm text-muted">{d.deliveryDistrict}, {d.deliveryState}</td>
                    <td><span className={`badge ${d.status === 'active' ? 'badge-success' : d.status === 'fulfilled' ? 'badge-primary' : 'badge-neutral'}`}>{d.status}</span></td>
                    <td>{d.status === 'active' && <button className="btn btn-sm btn-danger" onClick={() => cancel(d._id)}>Cancel</button>}</td>
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
