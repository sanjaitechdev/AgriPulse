import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const STATES = ['Andhra Pradesh','Telangana','Tamil Nadu','Karnataka','Maharashtra','Gujarat','Rajasthan','Uttar Pradesh','Punjab','Haryana','Bihar','Odisha','West Bengal','Kerala'];
const ORG_TYPES = ['trader','processor','exporter','retailer','wholesaler','cold_storage','aggregator','fpo','other'];

export default function BuyerProfilePage() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['buyer-profile'], queryFn: () => api.get('/buyer/profile').then((r) => r.data.data) });
  const [form, setForm] = useState({ orgName: '', orgType: 'trader', gstNumber: '', district: '', state: 'Andhra Pradesh', address: '', preferredCrops: '', maxDistanceKm: '200', bio: '' });

  useEffect(() => { if (profile) setForm({ orgName: profile.orgName || '', orgType: profile.orgType || 'trader', gstNumber: profile.gstNumber || '', district: profile.district || '', state: profile.state || 'Andhra Pradesh', address: profile.address || '', preferredCrops: profile.preferredCrops?.join(', ') || '', maxDistanceKm: profile.maxDistanceKm || '200', bio: profile.bio || '' }); }, [profile]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.put('/buyer/profile', { ...form, preferredCrops: form.preferredCrops.split(',').map((c) => c.trim()).filter(Boolean), maxDistanceKm: parseInt(form.maxDistanceKm) }),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries({ queryKey: ['buyer-profile'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="page-header"><h1 className="page-title">Buyer Profile</h1><p className="page-subtitle">Your organisation details visible to farmers</p></div>
      <div className="card">
        <div className="card-header"><h3 className="font-semibold">Organisation Details</h3></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label required">Organisation name</label><input className="form-input" value={form.orgName} onChange={set('orgName')} /></div>
            <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.orgType} onChange={set('orgType')}>{ORG_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">GST number</label><input className="form-input" placeholder="Optional" value={form.gstNumber} onChange={set('gstNumber')} /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">State</label><select className="form-select" value={form.state} onChange={set('state')}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">District</label><input className="form-input" value={form.district} onChange={set('district')} /></div>
          </div>
          <div className="form-group"><label className="form-label">Preferred crops (comma separated)</label><input className="form-input" placeholder="e.g. Tomato, Onion" value={form.preferredCrops} onChange={set('preferredCrops')} /></div>
          <div className="form-group"><label className="form-label">Max sourcing distance (km)</label><input type="number" className="form-input" value={form.maxDistanceKm} onChange={set('maxDistanceKm')} /></div>
          <div className="form-group"><label className="form-label">About your organisation</label><textarea className="form-textarea" rows={3} value={form.bio} onChange={set('bio')} /></div>
          <button className={`btn btn-primary${isPending ? ' btn-loading' : ''}`} onClick={save} disabled={isPending}>{isPending ? 'Saving…' : 'Save profile'}</button>
        </div>
      </div>
    </div>
  );
}
