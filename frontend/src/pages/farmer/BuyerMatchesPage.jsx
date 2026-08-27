import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Users, Star, MapPin, Package, ChevronRight, Search, CheckCircle2, Phone, Eye, Trash2, ArrowUpRight, TrendingUp, AlertCircle, Info, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';
import { getSocket } from '../../lib/socket';
import { toast } from 'react-hot-toast';

export default function BuyerMatchesPage() {
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState(null);
  const [newRequestsCount, setNewRequestsCount] = useState(0);

  const { data: listings } = useQuery({
    queryKey: ['my-listings-active'],
    queryFn: () => api.get('/listings?status=active&limit=20').then((r) => r.data.data),
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ['buyer-matches', selectedListing],
    queryFn: () => api.get(`/listings/${selectedListing}/matches`).then((r) => r.data.data),
    enabled: !!selectedListing,
  });

  // Setup Socket.IO listener for real-time demand notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewDemand = (data) => {
      setNewRequestsCount((prev) => prev + 1);
      toast.success(`New buyer demand posted for ${data.cropName}!`, { icon: '🔔' });
      // Invalidate query to refresh matches if appropriate
      if (selectedListing) {
        queryClient.invalidateQueries(['buyer-matches', selectedListing]);
      }
    };

    socket.on('demand:new', handleNewDemand);
    return () => {
      socket.off('demand:new', handleNewDemand);
    };
  }, [selectedListing, queryClient]);

  // Pre-select first listing on load
  useEffect(() => {
    if (listings?.length > 0 && !selectedListing) {
      setSelectedListing(listings[0]._id);
    }
  }, [listings, selectedListing]);

  // Compute stats for top section
  const totalMatches = matches?.length || 0;
  const highestScore = totalMatches > 0 ? Math.max(...matches.map(m => m.score)) : 0;
  const totalRequestedQty = matches?.reduce((sum, m) => sum + (m.demandData?.quantity || 0), 0) || 0;
  const nearbyBuyerCount = matches?.filter(m => (m.distanceKm || 50) <= 50).length || 0;

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* Premium Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary-600)' }}>
          <Users size={28} /> BUYER MATCHES
        </h1>
        <p className="page-subtitle text-sm text-muted">Buyers currently matching your listed crops in real-time</p>
      </div>

      {/* Top Intelligence Stats Grid */}
      <div className="grid-4 gap-4" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Active Matches', val: totalMatches, desc: 'Compatible buyer demands', icon: Users, color: 'var(--color-primary)' },
          { label: 'Highest Match Score', val: highestScore ? `${highestScore}%` : 'N/A', desc: 'Maximum compatibility', icon: Sparkles, color: 'var(--color-accent)' },
          { label: 'Total Requested Vol.', val: totalRequestedQty ? `${totalRequestedQty.toLocaleString('en-IN')} kg` : '0 kg', desc: 'Accumulated buyer demand', icon: Package, color: 'var(--color-info)' },
          { label: 'Nearby Buyers (50km)', val: nearbyBuyerCount, desc: 'Local traders & processors', icon: MapPin, color: 'var(--color-success)' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card card-padding flex items-center gap-4" style={{ border: '1px solid var(--color-surface-3)' }}>
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--color-surface-2)', color: stat.color }}>
                <Icon size={24} />
              </div>
              <div>
                <div className="text-xs text-muted font-medium">{stat.label}</div>
                <div className="text-xl font-bold" style={{ margin: '2px 0' }}>{stat.val}</div>
                <div className="text-xs text-muted" style={{ fontSize: 10 }}>{stat.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification banner for new requests */}
      {newRequestsCount > 0 && (
        <div className="alert alert-info flex justify-between items-center" style={{ marginBottom: 'var(--space-5)', borderRadius: 10 }}>
          <div className="flex items-center gap-2">
            <Info size={16} />
            <span>{newRequestsCount} new buyer demands created near you since you opened this page.</span>
          </div>
          <button onClick={() => { setNewRequestsCount(0); queryClient.invalidateQueries(['buyer-matches']); }} className="btn btn-secondary btn-xs">
            Refresh List
          </button>
        </div>
      )}

      {/* Listing selector */}
      {listings?.length > 0 ? (
        <div className="card card-padding" style={{ marginBottom: 'var(--space-5)', border: '1px solid var(--color-surface-3)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label font-bold text-xs" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Your Crop Listing</label>
            <select className="form-select" value={selectedListing || ''} onChange={(e) => setSelectedListing(e.target.value || null)} style={{ borderRadius: 8 }}>
              {listings.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.cropName} — {l.availableQuantity?.toLocaleString('en-IN')} kg @ ₹{l.askingPrice}/kg (Grade: {l.grade || 'Any'})
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="empty-state card card-padding flex flex-col items-center" style={{ padding: '40px 20px', border: '1px dashed var(--color-surface-3)' }}>
          <Package size={48} className="text-muted" style={{ marginBottom: 12 }} />
          <p className="font-bold text-sm">No active listings found</p>
          <p className="text-xs text-muted" style={{ marginBottom: 16 }}>Create a crop listing to begin matching with buyers.</p>
          <Link to="/farmer/listings/new" className="btn btn-primary btn-sm">Create Crop Listing</Link>
        </div>
      )}

      {selectedListing && isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />)}
        </div>
      )}

      {selectedListing && !isLoading && totalMatches === 0 && (
        <div className="empty-state card card-padding flex flex-col items-center" style={{ padding: '40px 20px', border: '1px dashed var(--color-surface-3)' }}>
          <Users size={48} className="text-muted" style={{ marginBottom: 12 }} />
          <p className="font-bold text-sm">No compatible buyers found</p>
          <p className="text-xs text-muted">No current buyer demands match your listing criteria (crop, asking price, delivery dates, or region).</p>
        </div>
      )}

      {/* Buyer Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {selectedListing && !isLoading && matches?.map((match) => {
          const bp = match.buyerProfile || {};
          const demand = match.demandData || {};
          const isVerified = bp.isVerified;

          return (
            <div key={match.demand} className="card card-padding hover-scale" style={{ border: '1px solid var(--color-surface-3)', borderRadius: 12, transition: 'all 0.2s' }}>
              <div className="flex justify-between items-start" style={{ borderBottom: '1px solid var(--color-surface-2)', paddingBottom: 12, marginBottom: 12 }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--color-primary-50)', color: 'var(--color-primary-700)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 16, border: '1px solid var(--color-primary-100)'
                  }}>
                    {bp.orgName?.charAt(0) || 'B'}
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1">
                      {bp.orgName || demand.buyer?.name || 'Buyer'} 
                      {isVerified && <CheckCircle2 size={14} className="text-success fill-success" style={{ color: 'white' }} />}
                    </div>
                    <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>
                      {bp.orgType || 'Wholesaler'} · {bp.district || 'West Bengal'}, {bp.state || 'India'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs font-semibold text-muted">Match Score</span>
                    <span style={{
                      fontSize: 18, fontWeight: 800,
                      color: match.score >= 80 ? 'var(--color-primary)' : match.score >= 60 ? 'var(--color-accent)' : 'var(--color-text-muted)'
                    }}>
                      {match.score}%
                    </span>
                  </div>
                  <div className="text-xs text-muted">Reliability: <strong>{bp.completionRate || 92}% Completion</strong></div>
                </div>
              </div>

              {/* Match requirements parameters details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: 16 }}>
                <div>
                  <div className="text-xs text-muted">Required Crop</div>
                  <div className="font-semibold text-xs text-primary">{demand.cropName || 'Tomato'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Quantity Needed</div>
                  <div className="font-semibold text-xs">{demand.quantity?.toLocaleString('en-IN')} kg</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Offer Price</div>
                  <div className="font-bold text-xs" style={{ color: 'var(--color-success-700)' }}>₹{demand.targetPriceMax || 25}/kg</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Required Quality / Grade</div>
                  <div className="font-semibold text-xs" style={{ textTransform: 'capitalize' }}>{demand.gradeRequired || 'Grade A'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Delivery Window</div>
                  <div className="font-semibold text-xs">{demand.requiredByDate ? new Date(demand.requiredByDate).toLocaleDateString('en-IN') : 'Immediate'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">Distance to Farm</div>
                  <div className="font-semibold text-xs flex items-center gap-1">
                    <MapPin size={12} className="text-muted" /> {match.distanceKm} km
                  </div>
                </div>
              </div>

              {/* Why this match box */}
              {match.reasons?.length > 0 && (
                <div style={{ background: 'var(--color-surface-2)', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
                  <div className="text-xs font-bold text-muted" style={{ marginBottom: 6 }}>Why this match?</div>
                  <div className="flex gap-2 flex-wrap">
                    {match.reasons.map((reason, i) => (
                      <span key={i} className="badge" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', border: '1px solid var(--color-primary-100)', fontSize: 10, padding: '3px 8px', borderRadius: 10 }}>
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted flex items-center gap-2">
                  <span>Response Rate: <strong>{bp.responseRate || 85}%</strong></span>
                  <span>·</span>
                  <span>Transactions: <strong>{bp.totalTransactions || 12}</strong></span>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => toast.success(`Contacting buyer at: support@buyer.com`)}>
                    <Phone size={14} /> Contact
                  </button>
                  <Link to="/farmer/proposals" className="btn btn-primary btn-sm flex items-center gap-1">
                    Send Proposal <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
