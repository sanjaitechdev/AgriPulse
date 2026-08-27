import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const CROPS = ['Tomato','Onion','Potato','Chilli','Brinjal','Cabbage','Cauliflower','Maize','Rice','Wheat','Groundnut','Cotton','Sugarcane','Other'];
const GRADES = ['A','B','C','any'];
const STATES = ['Andhra Pradesh','Telangana','Tamil Nadu','Karnataka','Maharashtra','Gujarat','Rajasthan','Uttar Pradesh','Madhya Pradesh','Punjab','Haryana','Bihar','Odisha','West Bengal','Kerala'];

export default function PostDemandPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    cropName: '', quantity: '', gradeRequired: 'any',
    targetPriceMin: '', targetPriceMax: '', requiredByDate: '',
    deliveryLocation: '', deliveryState: 'Andhra Pradesh', deliveryDistrict: '',
    maxDistanceKm: '200', requirements: '', isAggregatable: true,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post('/demands', data).then((r) => r.data),
    onSuccess: () => { toast.success('Demand posted! Matching farmers will be notified.'); navigate('/buyer/demands'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to post demand'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({
      ...form,
      quantity: parseFloat(form.quantity),
      targetPriceMin: parseFloat(form.targetPriceMin) || undefined,
      targetPriceMax: parseFloat(form.targetPriceMax) || undefined,
      maxDistanceKm: parseInt(form.maxDistanceKm) || 200,
    });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Post Crop Demand</h1>
        <p className="page-subtitle">Tell farmers what you need — matching farmers will be notified in real time</p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
        <Info size={15} style={{ flexShrink: 0 }} />
        <div className="text-sm">
          Posting a demand signals to farmers that there is a buyer waiting. This is the core of demand-guided farming — your requirement helps farmers decide <strong>what to grow</strong>.
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">What do you need?</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">Crop</label>
                <select className="form-select" value={form.cropName} onChange={set('cropName')} required>
                  <option value="">Select crop</option>
                  {CROPS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Quantity needed (kg)</label>
                <input type="number" min="1" className="form-input" placeholder="e.g. 5000" value={form.quantity} onChange={set('quantity')} required />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Grade required</label>
                <select className="form-select" value={form.gradeRequired} onChange={set('gradeRequired')}>
                  {GRADES.map((g) => <option key={g} value={g}>{g === 'any' ? 'Any grade' : `Grade ${g}`}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Need by date</label>
                <input type="date" className="form-input" value={form.requiredByDate} onChange={set('requiredByDate')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Additional requirements</label>
              <textarea className="form-textarea" placeholder="e.g. No pesticide residue within 10 days. Needs to be machine-sorted." value={form.requirements} onChange={set('requirements')} rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="agg" checked={form.isAggregatable} onChange={(e) => setForm((f) => ({ ...f, isAggregatable: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
              <label htmlFor="agg" className="text-sm" style={{ cursor: 'pointer' }}>
                Allow supply aggregation from multiple farmers (if a single farmer cannot fulfill the full quantity)
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Target Price Range</h3></div>
          <div className="card-body">
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
              Setting a price range helps farmers decide if your demand matches their cost of production. Leave blank if you are open to market price.
            </p>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Min price (₹/kg)</label>
                <input type="number" step="0.5" className="form-input" placeholder="e.g. 15" value={form.targetPriceMin} onChange={set('targetPriceMin')} />
              </div>
              <div className="form-group">
                <label className="form-label">Max price (₹/kg)</label>
                <input type="number" step="0.5" className="form-input" placeholder="e.g. 30" value={form.targetPriceMax} onChange={set('targetPriceMax')} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold">Delivery Location</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label required">Delivery address / area</label>
              <input className="form-input" placeholder="e.g. Warehouse No. 5, APMC Yard, Kurnool" value={form.deliveryLocation} onChange={set('deliveryLocation')} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label required">District</label>
                <input className="form-input" placeholder="e.g. Kurnool" value={form.deliveryDistrict} onChange={set('deliveryDistrict')} required />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-select" value={form.deliveryState} onChange={set('deliveryState')}>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Max pickup distance (km)</label>
              <input type="number" min="10" step="10" className="form-input" placeholder="200" value={form.maxDistanceKm} onChange={set('maxDistanceKm')} />
              <p className="form-hint">Farmers within this radius from your delivery location will be prioritised.</p>
            </div>
          </div>
        </div>

        <button type="submit" className={`btn btn-primary btn-xl btn-block${isPending ? ' btn-loading' : ''}`} disabled={isPending}>
          {isPending ? 'Posting…' : '📋 Post Demand & Notify Farmers'}
        </button>
      </form>
    </div>
  );
}
