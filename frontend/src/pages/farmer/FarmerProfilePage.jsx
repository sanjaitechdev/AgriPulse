import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { User, MapPin, Building2, Sprout, Globe } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useState, useEffect } from 'react';

const STATES = ['Andhra Pradesh','Telangana','Tamil Nadu','Karnataka','Maharashtra','Gujarat','Rajasthan','Uttar Pradesh','Madhya Pradesh','Punjab','Haryana','Bihar','Odisha','West Bengal','Kerala'];
const SOIL_TYPES = ['red','black','alluvial','laterite','loamy','sandy','clay','other'];
const WATER = ['abundant','adequate','limited','scarce'];

export default function FarmerProfilePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: () => api.get('/farmer/profile').then((r) => r.data.data),
  });

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get('/farms').then((r) => r.data.data),
  });

  const [form, setForm] = useState({ district: '', state: '', village: '', primarySoilType: 'red', waterAvailability: 'adequate', totalLandSize: '', irrigatedLand: '', experienceYears: '', bio: '' });
  const [farmForm, setFarmForm] = useState({ name: '', totalArea: '', district: '', state: 'Andhra Pradesh', soilType: 'red', waterAvailability: 'adequate' });
  const [addingFarm, setAddingFarm] = useState(false);

  useEffect(() => {
    if (profile) setForm({ district: profile.district || '', state: profile.state || '', village: profile.village || '', primarySoilType: profile.primarySoilType || 'red', waterAvailability: profile.waterAvailability || 'adequate', totalLandSize: profile.totalLandSize || '', irrigatedLand: profile.irrigatedLand || '', experienceYears: profile.experienceYears || '', bio: profile.bio || '' });
  }, [profile]);

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: () => api.put('/farmer/profile', { ...form, lat: form.latitude, lng: form.longitude, totalLandSize: parseFloat(form.totalLandSize) || undefined, irrigatedLand: parseFloat(form.irrigatedLand) || undefined, experienceYears: parseInt(form.experienceYears) || undefined }),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries({ queryKey: ['farmer-profile'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const { mutate: addFarm, isPending: addingFarmPending } = useMutation({
    mutationFn: () => api.post('/farms', { ...farmForm, totalArea: parseFloat(farmForm.totalArea) }),
    onSuccess: () => { toast.success('Farm added'); qc.invalidateQueries({ queryKey: ['farms'] }); setAddingFarm(false); setFarmForm({ name: '', totalArea: '', district: '', state: 'Andhra Pradesh', soilType: 'red', waterAvailability: 'adequate' }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add farm'),
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setFF = (k) => (e) => setFarmForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fade-in" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Farmer Profile</h1>
        <p className="page-subtitle">Manage your farm data and personal information</p>
      </div>

      {/* User info card */}
      <div className="card card-padding" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="flex items-center gap-4">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-xl">{user?.name}</h2>
            <div className="text-sm text-muted">{user?.email}</div>
            <div className="text-sm text-muted">{user?.phone || 'Phone not set'}</div>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-header"><h3 className="font-semibold flex items-center gap-2"><MapPin size={16} /> Location & Land</h3></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          
          {/* Geolocator section */}
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: '8px', border: '1px dashed var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="font-medium text-sm flex items-center gap-2">
                <Globe size={16} className="text-primary" /> GPS Geolocation Location Resolver
              </span>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (!navigator.geolocation) {
                    toast.error('Geolocation is not supported by your browser');
                    return;
                  }
                  toast.loading('Acquiring GPS Signal...', { id: 'gps' });
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude, accuracy } = position.coords;
                      toast.loading('Reverse Geocoding coordinates...', { id: 'gps' });
                      try {
                        const res = await api.get(`/location/reverse?lat=${latitude}&lng=${longitude}`);
                        if (res.data?.success) {
                          const data = res.data.data;
                          setForm(f => ({
                            ...f,
                            state: data.state || f.state,
                            district: data.district || f.district,
                            village: data.village || data.mandal || f.village,
                            latitude: latitude,
                            longitude: longitude,
                            gpsAccuracy: accuracy,
                            gpsLastUpdated: new Date().toLocaleTimeString()
                          }));
                          toast.success('Location resolved from GPS coordinates!', { id: 'gps' });
                        } else {
                          toast.error('Failed to resolve reverse geocode address', { id: 'gps' });
                        }
                      } catch (err) {
                        toast.error('Error reverse geocoding coordinates', { id: 'gps' });
                      }
                    },
                    (error) => {
                      toast.error(`GPS Error: ${error.message}. Please search manually below.`, { id: 'gps' });
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
              >
                USE MY CURRENT LOCATION
              </button>
            </div>

            {form.latitude && (
              <div className="text-xs text-muted grid-2" style={{ marginTop: '4px', gap: '8px' }}>
                <div>Coordinates: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</div>
                <div>Accuracy: ±{Math.round(form.gpsAccuracy || 0)} meters</div>
                <div>Last Updated: {form.gpsLastUpdated || 'N/A'}</div>
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">State</label>
              <select className="form-select" value={form.state} onChange={set('state')}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">District</label>
              <input className="form-input" value={form.district} onChange={set('district')} placeholder="e.g. Krishna" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Village / Mandal</label>
            <input className="form-input" value={form.village} onChange={set('village')} placeholder="Optional" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Total land (acres)</label>
              <input type="number" step="0.1" className="form-input" value={form.totalLandSize} onChange={set('totalLandSize')} />
            </div>
            <div className="form-group">
              <label className="form-label">Irrigated (acres)</label>
              <input type="number" step="0.1" className="form-input" value={form.irrigatedLand} onChange={set('irrigatedLand')} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Soil type</label>
              <select className="form-select" value={form.primarySoilType} onChange={set('primarySoilType')}>
                {SOIL_TYPES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Water availability</label>
              <select className="form-select" value={form.waterAvailability} onChange={set('waterAvailability')}>
                {WATER.map((w) => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Years of farming experience</label>
            <input type="number" min="0" className="form-input" value={form.experienceYears} onChange={set('experienceYears')} />
          </div>
          <div className="form-group">
            <label className="form-label">Bio / About</label>
            <textarea className="form-textarea" value={form.bio} onChange={set('bio')} placeholder="Tell buyers about your farm practices…" rows={3} />
          </div>
          <button className={`btn btn-primary${isPending ? ' btn-loading' : ''}`} onClick={saveProfile} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>

      {/* Farms */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2"><Sprout size={16} /> My Farms</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setAddingFarm(!addingFarm)}>+ Add farm</button>
        </div>

        {addingFarm && (
          <div className="card-body" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h4 className="font-semibold">New Farm</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label required">Farm name</label>
                  <input className="form-input" placeholder="e.g. Main Field" value={farmForm.name} onChange={setFF('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label required">Area (acres)</label>
                  <input type="number" step="0.1" className="form-input" placeholder="e.g. 3.5" value={farmForm.totalArea} onChange={setFF('totalArea')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label required">District</label>
                  <input className="form-input" placeholder="e.g. Krishna" value={farmForm.district} onChange={setFF('district')} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" value={farmForm.state} onChange={setFF('state')}>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button className={`btn btn-primary btn-sm${addingFarmPending ? ' btn-loading' : ''}`} onClick={addFarm} disabled={addingFarmPending || !farmForm.name || !farmForm.totalArea || !farmForm.district}>
                  {addingFarmPending ? 'Adding…' : 'Add farm'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingFarm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {!farms?.length && !addingFarm && (
          <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
            <Sprout size={32} className="empty-state-icon" />
            <p className="empty-state-desc">Add your farms to get personalised crop recommendations</p>
          </div>
        )}

        {farms?.map((farm) => (
          <div key={farm._id} style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-surface-3)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{farm.name}</div>
                <div className="text-xs text-muted">{farm.totalArea} acres · {farm.soilType} soil · {farm.district}, {farm.state}</div>
              </div>
              <span className="badge badge-success">{farm.waterAvailability || 'adequate'} water</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
