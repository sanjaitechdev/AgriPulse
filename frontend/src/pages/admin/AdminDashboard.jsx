import { useQuery } from '@tanstack/react-query';
import { Users, ShoppingCart, Package, AlertTriangle, BarChart3, Database, TrendingUp } from 'lucide-react';
import api from '../../lib/api';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const stats = data?.platform || {};

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'var(--color-primary)' },
    { label: 'Farmers', value: stats.totalFarmers, icon: Users, color: 'var(--color-info)' },
    { label: 'Buyers', value: stats.totalBuyers, icon: Users, color: 'var(--color-accent)' },
    { label: 'Crop Listings', value: stats.totalListings, icon: Package, color: 'var(--color-primary)' },
    { label: 'Buyer Demands', value: stats.totalDemands, icon: BarChart3, color: 'var(--color-accent)' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'var(--color-info)' },
    { label: 'Completed', value: stats.completedOrders, icon: TrendingUp, color: 'var(--color-success)' },
    { label: 'High Risk Cycles', value: stats.highRiskCycles, icon: AlertTriangle, color: 'var(--color-danger)' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview · Total revenue: ₹{(data?.totalRevenue || 0).toLocaleString('en-IN')}</p>
      </div>

      {isLoading ? (
        <div className="grid-4">{[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}</div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 'var(--space-6)' }}>
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card card-padding">
              <div className="flex items-center gap-3">
                <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', background: `${color}15` }}>
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <div className="stat-value stat-value-sm">{(value ?? 0).toLocaleString('en-IN')}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active AI models */}
      {data?.activeModels?.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-header"><h3 className="font-semibold">Active AI Models</h3></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Model</th><th>Version</th><th>Accuracy</th><th>Trained</th><th>Status</th></tr></thead>
              <tbody>
                {data.activeModels.map((m) => (
                  <tr key={m._id}>
                    <td className="font-medium">{m.modelName?.replace(/_/g, ' ')}</td>
                    <td>{m.version}</td>
                    <td>{m.metrics?.accuracy ? `${(m.metrics.accuracy * 100).toFixed(1)}%` : '—'}</td>
                    <td className="text-sm text-muted">{m.trainedAt ? new Date(m.trainedAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className="badge badge-success">active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent orders */}
      {data?.recentOrders?.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Recent Orders</h3></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Crop</th><th>Farmer</th><th>Buyer</th><th>Qty</th><th>Value</th><th>Status</th></tr></thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td className="font-medium">{o.cropName}</td>
                    <td className="text-sm">{o.farmer?.name}</td>
                    <td className="text-sm">{o.buyer?.name}</td>
                    <td>{o.quantity?.toLocaleString('en-IN')} kg</td>
                    <td>₹{((o.agreedPrice||0)*(o.quantity||0)).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-neutral">{o.status?.replace(/_/g,' ')}</span></td>
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
