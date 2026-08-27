import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Filter, MapPin, Package, Star } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const CROPS = ['','Tomato','Onion','Potato','Chilli','Brinjal','Cabbage','Cauliflower','Maize','Rice','Wheat','Groundnut','Cotton'];

export default function CropSearchPage() {
  const [filters, setFilters] = useState({ crop: '', district: '', minPrice: '', maxPrice: '', grade: '', page: 1 });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['listings-search', filters],
    queryFn: () => {
      const p = new URLSearchParams();
      if (filters.crop) p.set('crop', filters.crop);
      if (filters.district) p.set('district', filters.district);
      if (filters.minPrice) p.set('minPrice', filters.minPrice);
      if (filters.maxPrice) p.set('maxPrice', filters.maxPrice);
      if (filters.grade) p.set('grade', filters.grade);
      p.set('page', filters.page);
      p.set('limit', '20');
      return api.get(`/listings?${p}`).then((r) => r.data);
    },
  });

  const { mutate: sendProposal } = useMutation({
    mutationFn: ({ listingId, cropName, quantity, offeredPrice }) =>
      api.post('/proposals', { listingId, cropName, quantity, offeredPrice }),
    onSuccess: () => toast.success('Proposal sent to farmer!'),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to send proposal'),
  });

  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value, page: 1 }));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Search Crop Listings</h1>
        <p className="page-subtitle">Find available crops from farmers across India</p>
      </div>

      {/* Filters */}
      <div className="card card-padding" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div className="form-group">
            <label className="form-label">Crop</label>
            <select className="form-select" value={filters.crop} onChange={setF('crop')}>
              <option value="">All crops</option>
              {CROPS.filter(Boolean).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">District</label>
            <input className="form-input" placeholder="Any district" value={filters.district} onChange={setF('district')} />
          </div>
          <div className="form-group">
            <label className="form-label">Min ₹/kg</label>
            <input type="number" className="form-input" placeholder="0" value={filters.minPrice} onChange={setF('minPrice')} />
          </div>
          <div className="form-group">
            <label className="form-label">Max ₹/kg</label>
            <input type="number" className="form-input" placeholder="Any" value={filters.maxPrice} onChange={setF('maxPrice')} />
          </div>
          <div className="form-group">
            <label className="form-label">Grade</label>
            <select className="form-select" value={filters.grade} onChange={setF('grade')}>
              <option value="">Any</option>
              {['A','B','C','mixed'].map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => refetch()}>
            <Search size={15} /> Search
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid-auto">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />)}
        </div>
      ) : !data?.data?.length ? (
        <div className="empty-state">
          <Package size={48} className="empty-state-icon" />
          <p className="empty-state-title">No listings found</p>
          <p className="empty-state-desc">Try adjusting your filters, or post a demand and farmers will reach out to you.</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
            {data.pagination?.total?.toLocaleString('en-IN')} listings found
          </div>
          <div className="grid-auto">
            {data.data.map((listing) => (
              <div key={listing._id} className="card" style={{ transition: 'box-shadow 0.2s' }}>
                <div className="card-body">
                  <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-3)' }}>
                    <div>
                      <h3 className="font-semibold text-lg">{listing.cropName}</h3>
                      <div className="flex gap-2" style={{ marginTop: 4 }}>
                        <span className="badge badge-neutral">Grade {listing.grade}</span>
                        <span className="badge badge-success">Active</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="stat-value stat-value-sm">₹{listing.askingPrice}</div>
                      <div className="text-xs text-muted">per kg</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Package size={13} />
                      {listing.availableQuantity?.toLocaleString('en-IN')} kg available
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <MapPin size={13} />
                      {listing.pickupLocation || listing.pickupDistrict}, {listing.pickupState}
                    </div>
                    <div className="text-xs text-muted">
                      Farmer: {listing.farmer?.name || 'Verified farmer'} · Available from {new Date(listing.availableFrom).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  {listing.description && (
                    <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-4)', lineHeight: 'var(--line-height-relaxed)' }}>
                      {listing.description}
                    </p>
                  )}

                  <button
                    className="btn btn-primary btn-sm btn-block"
                    onClick={() => {
                      const qty = parseFloat(prompt('How many kg do you want?') || '0');
                      const price = parseFloat(prompt(`Offer price per kg (farmer asking ₹${listing.askingPrice}/kg):`) || '0');
                      if (qty > 0 && price > 0) {
                        sendProposal({ listingId: listing._id, cropName: listing.cropName, quantity: qty, offeredPrice: price });
                      }
                    }}
                  >
                    Send Proposal
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination?.pages > 1 && (
            <div className="flex justify-center gap-3" style={{ marginTop: 'var(--space-8)' }}>
              <button className="btn btn-secondary btn-sm" disabled={filters.page === 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</button>
              <span className="text-sm text-muted flex items-center">Page {filters.page} of {data.pagination.pages}</span>
              <button className="btn btn-secondary btn-sm" disabled={filters.page >= data.pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
