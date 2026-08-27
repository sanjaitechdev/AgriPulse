import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { FileText, CheckCircle, XCircle, ArrowLeftRight, Clock } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const statusColors = {
  pending: 'badge-warning', accepted: 'badge-success', rejected: 'badge-danger',
  counter_offered: 'badge-info', expired: 'badge-neutral',
};

export default function FarmerProposalsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['farmer-proposals'],
    queryFn: () => api.get('/proposals').then((r) => r.data.data),
  });

  const { mutate: respond } = useMutation({
    mutationFn: ({ id, action, counterPrice }) => api.put(`/proposals/${id}`, { action, counterPrice }),
    onSuccess: (_, { action }) => {
      toast.success(`Proposal ${action}ed`);
      qc.invalidateQueries({ queryKey: ['farmer-proposals'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Action failed'),
  });

  if (isLoading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Proposals</h1></div>
        {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 12 }} />)}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Proposals</h1>
        <p className="page-subtitle">Buyer proposals for your crop listings</p>
      </div>

      {!data?.length ? (
        <div className="empty-state">
          <FileText size={48} className="empty-state-icon" />
          <p className="empty-state-title">No proposals yet</p>
          <p className="empty-state-desc">When buyers send you proposals, they'll appear here. Make sure your listings are active.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {data.map((p) => (
            <div key={p._id} className="card card-padding">
              <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
                <div>
                  <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-1)' }}>
                    <h3 className="font-semibold text-lg">{p.cropName}</h3>
                    <span className={`badge ${statusColors[p.status] || 'badge-neutral'}`}>{p.status?.replace(/_/g,' ')}</span>
                  </div>
                  <div className="text-sm text-muted">
                    From: <strong>{p.buyer?.name || 'Buyer'}</strong> ·{' '}
                    {p.quantity?.toLocaleString('en-IN')} kg ·{' '}
                    {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stat-value stat-value-sm">₹{p.offeredPrice}/kg</div>
                  <div className="text-xs text-muted">Total: ₹{((p.offeredPrice||0)*(p.quantity||0)).toLocaleString('en-IN')}</div>
                </div>
              </div>

              {p.message && (
                <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
                  <span className="text-sm">"{p.message}"</span>
                </div>
              )}

              {p.counterOffer && (
                <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
                  <ArrowLeftRight size={14} style={{ flexShrink: 0 }} />
                  <span className="text-sm">Counter offer: <strong>₹{p.counterOffer.price}/kg</strong> — {p.counterOffer.message}</span>
                </div>
              )}

              {p.expiresAt && p.status === 'pending' && (
                <div className="flex items-center gap-2 text-xs text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                  <Clock size={12} />
                  Expires {formatDistanceToNow(new Date(p.expiresAt), { addSuffix: true })}
                </div>
              )}

              {p.status === 'pending' && (
                <div className="flex gap-3">
                  <button className="btn btn-primary btn-sm" onClick={() => respond({ id: p._id, action: 'accept' })}>
                    <CheckCircle size={14} /> Accept
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const cp = prompt('Enter counter price (₹/kg):');
                    if (cp && !isNaN(parseFloat(cp))) respond({ id: p._id, action: 'counter', counterPrice: parseFloat(cp) });
                  }}>
                    <ArrowLeftRight size={14} /> Counter
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => respond({ id: p._id, action: 'reject', rejectionReason: 'Not interested' })}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
