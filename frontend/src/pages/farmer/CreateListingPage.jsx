import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Package, Info } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const GRADES = ['A', 'B', 'C', 'mixed', 'ungraded'];
const CROPS = ['Tomato','Onion','Potato','Chilli','Brinjal','Cabbage','Cauliflower','Maize','Rice','Wheat','Groundnut','Cotton','Sugarcane','Other'];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    cropName: '', farmId: '', quantity: '', askingPrice: '',
    minAcceptablePrice: '', grade: 'A', availableFrom: '', availableTill: '',
    pickupLocation: '', pickupDistrict: '', pickupState: '',
    lat: '', lng: '', description: '',
  });

  const { data: farms } = useQuery({ queryKey: ['farms'], queryFn: () => api.get('/farms').then((r) => r.data.data) });

  // Sync with default farm details to avoid hardcoded location fallbacks
  useEffect(() => {
    if (farms && farms.length > 0) {
      const defaultFarm = farms.find(f => f.isDefault) || farms[0];
      setForm(prev => ({
        ...prev,
        farmId: defaultFarm._id,
        pickupLocation: defaultFarm.village || defaultFarm.name,
        pickupDistrict: defaultFarm.district || '',
        pickupState: defaultFarm.state || '',
        lat: defaultFarm.location?.coordinates?.[1] ? defaultFarm.location.coordinates[1].toString() : '',
        lng: defaultFarm.location?.coordinates?.[0] ? defaultFarm.location.coordinates[0].toString() : '',
      }));
    }
  }, [farms]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post('/listings', data).then((r) => r.data),
    onSuccess: () => { toast.success('Listing created! Buyers can now find your crop.'); navigate('/farmer/listings'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create listing'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ ...form, quantity: parseFloat(form.quantity), askingPrice: parseFloat(form.askingPrice), minAcceptablePrice: parseFloat(form.minAcceptablePrice) || undefined });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Create Crop Listing</h1>
        <p className="page-subtitle">Post your available crop so buyers across India can discover and contact you</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Crop Details</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Crop name</label>
                <select className="form-select" value={form.cropName} onChange={set('cropName')} required>
                  <option value="">Select crop</option>
                  {CROPS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Grade</label>
                <select className="form-select" value={form.grade} onChange={set('grade')}>
                  {GRADES.map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Quantity (kg)</label>
                <input type="number" min="1" className="form-input" placeholder="e.g. 2000" value={form.quantity} onChange={set('quantity')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Farm</label>
                <select className="form-select" value={form.farmId} onChange={set('farmId')}>
                  <option value="">Not linked</option>
                  {farms?.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description / quality notes</label>
              <textarea className="form-textarea" placeholder="e.g. Fresh red variety. No chemical spray in last 7 days. Hand-picked." value={form.description} onChange={set('description')} rows={2} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Pricing</h3></div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
              <Info size={15} style={{ flexShrink: 0 }} />
              <span className="text-sm">Set a fair asking price and a minimum. Buyers can make proposals between these values.</span>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Asking price (₹/kg)</label>
                <input type="number" step="0.5" min="0.5" className="form-input" placeholder="e.g. 25" value={form.askingPrice} onChange={set('askingPrice')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Min acceptable (₹/kg)</label>
                <input type="number" step="0.5" min="0.1" className="form-input" placeholder="e.g. 18" value={form.minAcceptablePrice} onChange={set('minAcceptablePrice')} />
                <p className="form-hint">Not shown to buyers. Used for matching.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Availability & Location</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Available from</label>
                <input type="date" className="form-input" value={form.availableFrom} onChange={set('availableFrom')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Available till</label>
                <input type="date" className="form-input" value={form.availableTill} onChange={set('availableTill')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label required">Pickup location</label>
              <input className="form-input" placeholder="Village / Mandal / Town name" value={form.pickupLocation} onChange={set('pickupLocation')} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">District</label>
                <input className="form-input" placeholder="e.g. Krishna" value={form.pickupDistrict} onChange={set('pickupDistrict')} required />
              </div>
              <div className="form-group">
                <label className="form-label required">State</label>
                <input className="form-input" placeholder="e.g. Andhra Pradesh" value={form.pickupState} onChange={set('pickupState')} required />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">GPS Latitude</label>
                <input type="number" step="0.000001" className="form-input" placeholder="e.g. 16.5167" value={form.lat} onChange={set('lat')} />
              </div>
              <div className="form-group">
                <label className="form-label">GPS Longitude</label>
                <input type="number" step="0.000001" className="form-input" placeholder="e.g. 80.6167" value={form.lng} onChange={set('lng')} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className={`btn btn-primary btn-xl btn-block${isPending ? ' btn-loading' : ''}`} disabled={isPending}>
          {isPending ? 'Publishing…' : '📦 Publish Listing'}
        </button>
      </form>
    </div>
  );
}
