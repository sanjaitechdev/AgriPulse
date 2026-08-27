import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Plus, Eye, Users, Edit } from 'lucide-react';
import api from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  active: 'badge-success', sold: 'badge-neutral',
  partially_sold: 'badge-primary', expired: 'badge-danger', cancelled: 'badge-danger',
};

export default function MyListingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/listings?limit=50').then((r) => r.data),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }) => api.put(`/listings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">My Crop Listings</h1>
          <p className="page-subtitle">Manage your supply listings and track buyer interest</p>
        </div>
        <Link to="/farmer/listings/new" className="btn btn-primary"><Plus size={16} /> New Listing</Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : !data?.data?.length ? (
        <div className="empty-state">
          <Package size={48} className="empty-state-icon" />
          <p className="empty-state-title">No listings yet</p>
          <p className="empty-state-desc">Create your first crop listing so buyers can find and contact you.</p>
          <Link to="/farmer/listings/new" className="btn btn-primary">Create first listing</Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Crop</th><th>Quantity</th><th>Asking Price</th>
                  <th>Available From</th><th>Views</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((listing) => (
                  <tr key={listing._id}>
                    <td>
                      <div className="font-semibold">{listing.cropName}</div>
                      <div className="text-xs text-muted">{listing.grade || 'Ungraded'} · {listing.pickupDistrict}</div>
                    </td>
                    <td>{listing.availableQuantity?.toLocaleString('en-IN')} kg</td>
                    <td className="font-semibold">₹{listing.askingPrice}/kg</td>
                    <td className="text-sm">{new Date(listing.availableFrom).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flex items-center gap-1 text-muted text-xs">
                        <Eye size={12} /> {listing.viewCount || 0}
                      </div>
                    </td>
                    <td><span className={`badge ${statusColors[listing.status] || 'badge-neutral'}`}>{listing.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <Link to={`/farmer/buyer-matches`} className="btn btn-sm btn-secondary">
                          <Users size={12} /> Matches
                        </Link>
                        {listing.status === 'active' && (
                          <button className="btn btn-sm btn-danger" onClick={() => updateStatus({ id: listing._id, status: 'cancelled' })}>Cancel</button>
                        )}
                      </div>
                    </td>
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
