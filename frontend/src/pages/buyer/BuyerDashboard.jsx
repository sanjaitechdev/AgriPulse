import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, ShoppingCart, Plus, Search, ChevronRight, TrendingUp } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function BuyerDashboard() {
  const { user } = useAuthStore();

  const { data: dashboard } = useQuery({
    queryKey: ['buyer-dashboard'],
    queryFn: () => api.get('/buyer/dashboard').then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const { data: recentListings } = useQuery({
    queryKey: ['recent-listings'],
    queryFn: () => api.get('/listings?limit=5').then((r) => r.data.data),
  });

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Buyer Dashboard · Source, negotiate, and track crop orders</p>
        </div>
        <div className="flex gap-3">
          <Link to="/buyer/post-demand" className="btn btn-primary"><Plus size={16} /> Post Demand</Link>
          <Link to="/buyer/search" className="btn btn-secondary"><Search size={16} /> Search Crops</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Active Demands', value: dashboard?.activeDemands?.length ?? 0, icon: ClipboardList, color: 'var(--color-primary)' },
          { label: 'Pending Orders', value: dashboard?.pendingOrders?.length ?? 0, icon: ShoppingCart, color: 'var(--color-accent)' },
          { label: 'Completed Orders', value: dashboard?.completedOrders ?? 0, icon: TrendingUp, color: 'var(--color-success)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card card-padding">
            <div className="flex items-center gap-3">
              <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: `${color}15` }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div className="stat-value stat-value-sm">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-6)' }}>
        {/* Active demands */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">My Active Demands</h3>
            <Link to="/buyer/demands" className="btn btn-ghost btn-sm">View all <ChevronRight size={14} /></Link>
          </div>
          {!dashboard?.activeDemands?.length ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <ClipboardList size={32} className="empty-state-icon" />
              <p className="empty-state-desc">No active demands. Post what you need to find matching farmers.</p>
              <Link to="/buyer/post-demand" className="btn btn-primary btn-sm">Post demand</Link>
            </div>
          ) : (
            dashboard.activeDemands.map((d) => (
              <div key={d._id} style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-surface-3)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{d.cropName}</div>
                    <div className="text-xs text-muted">{d.quantity?.toLocaleString('en-IN')} kg · by {new Date(d.requiredByDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <span className="badge badge-success">active</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent available listings */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Recent Listings</h3>
            <Link to="/buyer/search" className="btn btn-ghost btn-sm">Browse all <ChevronRight size={14} /></Link>
          </div>
          {!recentListings?.length ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <Search size={32} className="empty-state-icon" />
              <p className="empty-state-desc">No listings available yet</p>
            </div>
          ) : (
            recentListings.map((listing) => (
              <div key={listing._id} style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-surface-3)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{listing.cropName}</div>
                    <div className="text-xs text-muted">
                      {listing.availableQuantity?.toLocaleString('en-IN')} kg · {listing.pickupDistrict} ·{' '}
                      {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-semibold text-sm">₹{listing.askingPrice}/kg</div>
                    <span className={`badge badge-neutral`}>{listing.grade}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
