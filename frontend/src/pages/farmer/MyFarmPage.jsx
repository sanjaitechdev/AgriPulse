import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import {
  User, MapPin, Sprout, Droplets, Sun, BarChart3,
  Plus, CheckCircle2, Globe, ChevronDown, ChevronUp,
  Calendar, Package, Loader2, ArrowRight, Trash2, RefreshCw, Zap
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useState, useEffect } from 'react';

const STATES = [
  'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Karnataka', 'Maharashtra',
  'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Punjab',
  'Haryana', 'Bihar', 'Odisha', 'West Bengal', 'Kerala',
];
const SOIL_TYPES = ['red', 'black', 'alluvial', 'laterite', 'loamy', 'sandy', 'clay', 'other'];
const WATER_OPTIONS = ['abundant', 'adequate', 'limited', 'scarce'];
const STORAGE_TYPES = ['none', 'ambient', 'cold', 'dry'];

const statusColors = {
  planted: 'badge-primary', growing: 'badge-success',
  harvest_ready: 'badge-warning', planning: 'badge-neutral', sold: 'badge-neutral',
};

export default function MyFarmPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // ─── Remote data ───────────────────────────────────────────────────────────
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: () => api.get('/farmer/profile').then(r => r.data.data),
  });

  const { data: farms, isLoading: loadingFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get('/farms').then(r => r.data.data),
  });

  const { data: dashboard } = useQuery({
    queryKey: ['farmer-dashboard'],
    queryFn: () => api.get('/farmer/dashboard').then(r => r.data.data),
    refetchInterval: 60000,
  });

  // ─── Profile form state ────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    district: '', state: 'Andhra Pradesh', village: '',
    primarySoilType: 'red', waterAvailability: 'adequate',
    totalLandSize: '', irrigatedLand: '', experienceYears: '', bio: '',
    storageType: 'none', storageCapacityKg: '',
    latitude: null, longitude: null, gpsAccuracy: null, gpsLastUpdated: '',
  });
  const [profileDirty, setProfileDirty] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(true);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        district: profile.district || '',
        state: profile.state || 'Andhra Pradesh',
        village: profile.village || '',
        primarySoilType: profile.primarySoilType || 'red',
        waterAvailability: profile.waterAvailability || 'adequate',
        totalLandSize: profile.totalLandSize || '',
        irrigatedLand: profile.irrigatedLand || '',
        experienceYears: profile.experienceYears || '',
        bio: profile.bio || '',
        storageType: profile.storageType || 'none',
        storageCapacityKg: profile.storageCapacityKg || '',
        latitude: profile.farmerLocation?.coordinates?.[1] ?? null,
        longitude: profile.farmerLocation?.coordinates?.[0] ?? null,
        gpsAccuracy: null,
        gpsLastUpdated: '',
      });
    }
  }, [profile]);

  const setP = k => e => { setProfileForm(f => ({ ...f, [k]: e.target.value })); setProfileDirty(true); };

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: () => api.put('/farmer/profile', {
      ...profileForm,
      lat: profileForm.latitude,
      lng: profileForm.longitude,
      totalLandSize: parseFloat(profileForm.totalLandSize) || undefined,
      irrigatedLand: parseFloat(profileForm.irrigatedLand) || undefined,
      experienceYears: parseInt(profileForm.experienceYears) || undefined,
      storageCapacityKg: parseFloat(profileForm.storageCapacityKg) || undefined,
    }),
    onSuccess: () => {
      toast.success('Farm profile saved');
      qc.invalidateQueries({ queryKey: ['farmer-profile'] });
      qc.invalidateQueries({ queryKey: ['farmer-dashboard'] });
      setProfileDirty(false);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to save profile'),
  });

  const handleGPS = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGpsLoading(true);
    toast.loading('Acquiring real-time GPS coordinates...', { id: 'gps' });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude, accuracy } = coords;
        toast.loading('Resolving exact address from GPS...', { id: 'gps' });
        try {
          const res = await api.get(`/location/reverse?lat=${latitude}&lng=${longitude}`);
          if (res.data?.success) {
            const d = res.data.data;
            const updatedState = d.state || 'Tamil Nadu';
            const updatedDistrict = d.district || d.mandal || 'Tiruppur';
            const updatedVillage = d.village || d.mandal || '';

            const updatedProfile = {
              ...profileForm,
              state: updatedState,
              district: updatedDistrict,
              village: updatedVillage,
              latitude,
              longitude,
              gpsAccuracy: accuracy,
              gpsLastUpdated: new Date().toLocaleTimeString(),
            };

            setProfileForm(updatedProfile);

            // Automatically persist location to profile
            try {
              await api.put('/farmer/profile', {
                ...updatedProfile,
                lat: latitude,
                lng: longitude,
                totalLandSize: parseFloat(updatedProfile.totalLandSize) || undefined,
                irrigatedLand: parseFloat(updatedProfile.irrigatedLand) || undefined,
                experienceYears: parseInt(updatedProfile.experienceYears) || undefined,
                storageCapacityKg: parseFloat(updatedProfile.storageCapacityKg) || undefined,
              });
              qc.invalidateQueries({ queryKey: ['farmer-profile'] });
              qc.invalidateQueries({ queryKey: ['farmer-dashboard'] });
              qc.invalidateQueries({ queryKey: ['farms'] });
              setProfileDirty(false);
            } catch (saveErr) {
              console.warn('Auto-save profile warning:', saveErr);
            }

            toast.success(`📍 Location resolved: ${updatedVillage ? updatedVillage + ', ' : ''}${updatedDistrict}, ${updatedState}`, { id: 'gps', duration: 4000 });
          } else {
            toast.error('Reverse geocode failed', { id: 'gps' });
          }
        } catch (err) {
          console.error(err);
          toast.error('Error reverse geocoding', { id: 'gps' });
        } finally {
          setGpsLoading(false);
        }
      },
      err => { toast.error(`GPS error: ${err.message}`, { id: 'gps' }); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // ─── Farm form state ───────────────────────────────────────────────────────
  const [addingFarm, setAddingFarm] = useState(false);
  const [farmForm, setFarmForm] = useState({
    name: '', totalArea: '', district: '', state: 'Andhra Pradesh',
    soilType: 'red', waterAvailability: 'adequate',
  });
  const setF = k => e => setFarmForm(f => ({ ...f, [k]: e.target.value }));

  const { mutate: addFarm, isPending: addingFarmPending } = useMutation({
    mutationFn: () => api.post('/farms', { ...farmForm, totalArea: parseFloat(farmForm.totalArea) }),
    onSuccess: () => {
      toast.success('Farm added');
      qc.invalidateQueries({ queryKey: ['farms'] });
      setAddingFarm(false);
      setFarmForm({ name: '', totalArea: '', district: profileForm.district || 'Tiruppur', state: profileForm.state || 'Tamil Nadu', soilType: 'alluvial', waterAvailability: 'adequate' });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to add farm'),
  });

  const { mutate: deleteFarm } = useMutation({
    mutationFn: (farmId) => api.delete(`/farms/${farmId}`),
    onSuccess: () => {
      toast.success('Farm removed');
      qc.invalidateQueries({ queryKey: ['farms'] });
      qc.invalidateQueries({ queryKey: ['farmer-dashboard'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to delete farm'),
  });

  const { mutate: syncAllFarms, isPending: syncingFarms } = useMutation({
    mutationFn: () => api.post('/farms/sync-all'),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'All farms updated to current location!');
      qc.invalidateQueries({ queryKey: ['farms'] });
      qc.invalidateQueries({ queryKey: ['farmer-dashboard'] });
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to sync farms'),
  });

  // ─── Derived summary ───────────────────────────────────────────────────────
  const activeCycles = dashboard?.activeCropCycles || [];
  const totalLand = farms?.reduce((s, f) => s + (f.totalArea || 0), 0) || 0;
  const locationLabel = profile?.farmerLocation
    ? `${profile.farmerLocation.city || profile.farmerLocation.district || ''}${profile.farmerLocation.state ? ', ' + profile.farmerLocation.state : ''}`
    : profile?.district
      ? `${profile.district}${profile.state ? ', ' + profile.state : ''}`
      : 'Not set';

  if (loadingProfile || loadingFarms) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 280, height: 16 }} />
        </div>
        {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 120, marginBottom: 16 }} />)}
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {/* Page Header */}
      <div className="page-header flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="page-title font-bold flex items-center gap-2">
            <MapPin size={24} color="var(--color-primary)" /> My Farm &amp; Fields Profile
          </h1>
          <p className="page-subtitle">
            Single source of truth for all farm data — consumed by Decision Center, Market Intelligence, Buyer Connect and Rescue
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <MapPin size={14} /> {locationLabel}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link 
          to="/farmer/my-crops" 
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, padding: '8px 16px' }}
        >
          <Sprout size={16} color="var(--color-primary)" />
          Go to My Crops &amp; Lifecycle Tracking (100+ Indian Crops)
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Summary Tiles */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Farms', value: farms?.length || 0, icon: Sprout, color: 'var(--color-primary)' },
          { label: 'Total Land', value: `${totalLand.toFixed(1)} ac`, icon: BarChart3, color: 'var(--color-accent)' },
          { label: 'Active Crops', value: activeCycles.length, icon: Sun, color: 'var(--color-success)' },
          { label: 'Water Status', value: profile?.waterAvailability ? profile.waterAvailability.charAt(0).toUpperCase() + profile.waterAvailability.slice(1) : '—', icon: Droplets, color: 'var(--color-info)' },
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

      {/* Farm Profile Card */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div
          className="card-header"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setProfileExpanded(e => !e)}
        >
          <h3 className="font-semibold flex items-center gap-2">
            <User size={16} /> Farmer and Farm Profile
            {profileDirty && <span className="badge badge-warning" style={{ fontSize: 10 }}>Unsaved changes</span>}
          </h3>
          {profileExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </div>

        {profileExpanded && (
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* User info row */}
            <div className="flex items-center gap-4" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{user?.name}</div>
                <div className="text-sm text-muted">{user?.email}</div>
                <div className="text-sm text-muted">{user?.phone || 'Phone not set'}</div>
              </div>
            </div>

            {/* GPS */}
            <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', background: 'var(--color-surface-2)' }}>
              <div className="flex justify-between items-center flex-wrap gap-2" style={{ marginBottom: 8 }}>
                <span className="font-medium text-sm flex items-center gap-2">
                  <Globe size={14} className="text-primary" /> GPS Location Resolver
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleGPS}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <><Loader2 size={13} className="animate-spin" style={{ marginRight: 4 }} />Locating...</>
                  ) : 'Use My Current Location'}
                </button>
              </div>
              {profileForm.latitude && (
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                  Coordinates: {profileForm.latitude.toFixed(6)}, {profileForm.longitude.toFixed(6)}
                  {' '}· Accuracy: +/-{Math.round(profileForm.gpsAccuracy || 0)}m
                  {profileForm.gpsLastUpdated && <> · Updated: {profileForm.gpsLastUpdated}</>}
                </div>
              )}
            </div>

            {/* Location fields */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-select" value={profileForm.state} onChange={setP('state')}>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <input className="form-input" value={profileForm.district} onChange={setP('district')} placeholder="e.g. Krishna" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Village / Mandal</label>
              <input className="form-input" value={profileForm.village} onChange={setP('village')} placeholder="Optional" />
            </div>

            {/* Land */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Total Land (acres)</label>
                <input type="number" step="0.1" min="0" className="form-input" value={profileForm.totalLandSize} onChange={setP('totalLandSize')} />
              </div>
              <div className="form-group">
                <label className="form-label">Irrigated Land (acres)</label>
                <input type="number" step="0.1" min="0" className="form-input" value={profileForm.irrigatedLand} onChange={setP('irrigatedLand')} />
              </div>
            </div>

            {/* Soil and Water */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Primary Soil Type</label>
                <select className="form-select" value={profileForm.primarySoilType} onChange={setP('primarySoilType')}>
                  {SOIL_TYPES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Water Availability</label>
                <select className="form-select" value={profileForm.waterAvailability} onChange={setP('waterAvailability')}>
                  {WATER_OPTIONS.map(w => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Storage */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Storage Facility Type</label>
                <select className="form-select" value={profileForm.storageType} onChange={setP('storageType')}>
                  {STORAGE_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t === 'none' ? 'None / Open yard' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Storage Capacity (kg)</label>
                <input type="number" min="0" className="form-input" value={profileForm.storageCapacityKg} onChange={setP('storageCapacityKg')} placeholder="e.g. 5000" />
              </div>
            </div>

            {/* Experience and Bio */}
            <div className="form-group">
              <label className="form-label">Years of Farming Experience</label>
              <input type="number" min="0" className="form-input" value={profileForm.experienceYears} onChange={setP('experienceYears')} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio / About Your Farm</label>
              <textarea className="form-textarea" value={profileForm.bio} onChange={setP('bio')} placeholder="Tell buyers about your farm practices..." rows={3} />
            </div>

            <button
              className={`btn btn-primary${savingProfile ? ' btn-loading' : ''}`}
              onClick={saveProfile}
              disabled={savingProfile || !profileDirty}
            >
              {savingProfile ? 'Saving...' : profileDirty ? 'Save Profile' : 'Profile Saved'}
            </button>
          </div>
        )}
      </div>

      {/* My Farms */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-header flex justify-between items-center flex-wrap gap-2">
          <h3 className="font-semibold flex items-center gap-2"><Sprout size={16} /> My Farms ({farms?.length || 0})</h3>
          <div className="flex gap-2">
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => syncAllFarms()} 
              disabled={syncingFarms}
              title="Sync all farms to your current detected GPS location"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Zap size={13} className="text-warning" />
              {syncingFarms ? 'Syncing...' : 'Sync All to My Location'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setAddingFarm(v => !v)}>
              <Plus size={14} /> Add Farm
            </button>
          </div>
        </div>

        {addingFarm && (
          <div className="card-body" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h4 className="font-semibold" style={{ marginBottom: 'var(--space-3)' }}>New Farm</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label required">Farm name</label>
                  <input className="form-input" placeholder="e.g. Main Field" value={farmForm.name} onChange={setF('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label required">Area (acres)</label>
                  <input type="number" step="0.1" className="form-input" placeholder="e.g. 3.5" value={farmForm.totalArea} onChange={setF('totalArea')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label required">District</label>
                  <input className="form-input" placeholder="e.g. Krishna" value={farmForm.district} onChange={setF('district')} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" value={farmForm.state} onChange={setF('state')}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Soil Type</label>
                  <select className="form-select" value={farmForm.soilType} onChange={setF('soilType')}>
                    {SOIL_TYPES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Water Availability</label>
                  <select className="form-select" value={farmForm.waterAvailability} onChange={setF('waterAvailability')}>
                    {WATER_OPTIONS.map(w => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className={`btn btn-primary btn-sm${addingFarmPending ? ' btn-loading' : ''}`}
                  onClick={addFarm}
                  disabled={addingFarmPending || !farmForm.name || !farmForm.totalArea || !farmForm.district}
                >
                  {addingFarmPending ? 'Adding...' : 'Add Farm'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingFarm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {!farms?.length && !addingFarm && (
          <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
            <Sprout size={32} className="empty-state-icon" />
            <p className="empty-state-desc">Add your farms to enable personalised crop recommendations across all modules.</p>
          </div>
        )}

        {farms?.map(farm => (
          <div key={farm._id} style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-surface-3)' }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{farm.name}</div>
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                  {farm.totalArea} acres · {farm.soilType} soil · <strong style={{ color: 'var(--color-primary-dark)' }}>{farm.district}, {farm.state}</strong>
                  {farm.village && <span> ({farm.village})</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge badge-success">{farm.waterAvailability || 'adequate'} water</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteFarm(farm._id)}
                  title="Remove farm"
                  style={{ color: '#dc2626', padding: '4px 6px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Crop Cycles */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="card-header flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2"><Sun size={16} /> Active Crop Cycles</h3>
          <Link to="/farmer/my-crops" className="btn btn-secondary btn-sm" style={{ fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            Open My Crops Tracking <ArrowRight size={12} />
          </Link>
        </div>

        {activeCycles.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <Package size={32} className="empty-state-icon" />
            <p className="empty-state-title">No active crop cycles</p>
            <p className="empty-state-desc">Use Decision Center to plan your next crop cycle.</p>
          </div>
        ) : (
          activeCycles.map(cycle => (
            <div key={cycle._id} className="flex items-center gap-4" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-surface-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sprout size={18} color="var(--color-primary)" />
              </div>
              <div className="flex-1 min-width-0">
                <div className="font-semibold text-sm">{cycle.crop?.name || 'Unknown Crop'}</div>
                <div className="text-xs text-muted">
                  {cycle.landArea} acres
                  {cycle.expectedHarvestAt
                    ? ` · Harvest ~${new Date(cycle.expectedHarvestAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
                    : ' · No harvest date'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${statusColors[cycle.status] || 'badge-neutral'}`}>
                  {cycle.status?.replace(/_/g, ' ')}
                </span>
                {cycle.riskCategory && cycle.riskCategory !== 'low' && (
                  <span className={`badge badge-risk-${cycle.riskCategory}`}>{cycle.riskCategory} risk</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Data Note */}
      <div className="text-xs text-muted flex items-center gap-2" style={{ marginTop: 'var(--space-4)', justifyContent: 'center' }}>
        <CheckCircle2 size={13} color="var(--color-success)" />
        All modules consume this farm profile automatically — no duplicate data entry needed.
      </div>
    </div>
  );
}
