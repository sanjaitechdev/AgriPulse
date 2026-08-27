import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Leaf } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const STATES = ['Andhra Pradesh','Telangana','Tamil Nadu','Karnataka','Maharashtra','Gujarat','Rajasthan','Uttar Pradesh','Madhya Pradesh','Punjab','Haryana','Bihar','Odisha','West Bengal','Assam','Kerala'];
const SOIL_TYPES = ['red','black','alluvial','laterite','loamy','sandy','clay','other'];
const WATER = ['abundant','adequate','limited','scarce'];
const ORG_TYPES = ['trader','processor','exporter','retailer','wholesaler','cold_storage','aggregator','fpo','other'];

export default function OnboardingPage() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Farmer state
  const [farmerData, setFarmerData] = useState({
    district: '', state: 'Andhra Pradesh', village: '',
    totalLandSize: '', irrigatedLand: '',
    primarySoilType: 'red', waterAvailability: 'adequate',
    primaryWaterSource: 'borewell', experienceYears: '',
  });

  // Buyer state
  const [buyerData, setBuyerData] = useState({
    orgName: '', orgType: 'trader', gstNumber: '',
    district: '', state: 'Andhra Pradesh', address: '',
    preferredCrops: '', maxDistanceKm: '200',
  });

  const totalSteps = user?.role === 'farmer' ? 3 : 2;

  const handleFarmerSubmit = async () => {
    setLoading(true);
    try {
      await api.put('/farmer/profile', {
        ...farmerData,
        totalLandSize: parseFloat(farmerData.totalLandSize),
        irrigatedLand: parseFloat(farmerData.irrigatedLand) || 0,
        experienceYears: parseInt(farmerData.experienceYears) || 0,
      });
      updateUser({ profileCompleted: true, onboardingStep: 3 });
      toast.success('Profile set up! Welcome to AgriConnect.');
      navigate('/farmer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyerSubmit = async () => {
    setLoading(true);
    try {
      await api.put('/buyer/profile', {
        ...buyerData,
        preferredCrops: buyerData.preferredCrops.split(',').map((c) => c.trim()).filter(Boolean),
        maxDistanceKm: parseInt(buyerData.maxDistanceKm) || 200,
      });
      updateUser({ profileCompleted: true, onboardingStep: 2 });
      toast.success('Profile set up! Welcome to AgriConnect.');
      navigate('/buyer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-8)' }}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i + 1 < step ? 'var(--color-primary)' : i + 1 === step ? 'var(--color-primary)' : 'var(--color-surface-3)',
            border: `2px solid ${i + 1 <= step ? 'var(--color-primary)' : 'var(--color-border)'}`,
            color: i + 1 <= step ? 'white' : 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-xs)', fontWeight: 700, transition: 'all 0.2s',
          }}>
            {i + 1 < step ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div style={{ width: 32, height: 2, background: i + 1 < step ? 'var(--color-primary)' : 'var(--color-border)', transition: 'all 0.2s' }} />
          )}
        </div>
      ))}
    </div>
  );

  if (user?.role === 'farmer') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div className="card" style={{ width: '100%', maxWidth: 600 }}>
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>Set up your farm profile</h2>
              <p className="text-sm text-muted">This helps us give you accurate crop recommendations</p>
            </div>
            <div className="flex items-center gap-2">
              <Leaf size={20} color="var(--color-primary)" />
            </div>
          </div>
          <div className="card-body">
            <StepIndicator />

            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)' }}>Location & Land</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label required">State</label>
                    <select className="form-select" value={farmerData.state} onChange={(e) => setFarmerData({ ...farmerData, state: e.target.value })}>
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">District</label>
                    <input className="form-input" placeholder="e.g. Krishna" value={farmerData.district} onChange={(e) => setFarmerData({ ...farmerData, district: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Village / Mandal</label>
                  <input className="form-input" placeholder="Optional" value={farmerData.village} onChange={(e) => setFarmerData({ ...farmerData, village: e.target.value })} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label required">Total land (acres)</label>
                    <input type="number" min="0.1" step="0.1" className="form-input" placeholder="e.g. 5" value={farmerData.totalLandSize} onChange={(e) => setFarmerData({ ...farmerData, totalLandSize: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Irrigated land (acres)</label>
                    <input type="number" min="0" step="0.1" className="form-input" placeholder="e.g. 3" value={farmerData.irrigatedLand} onChange={(e) => setFarmerData({ ...farmerData, irrigatedLand: e.target.value })} />
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => { if (!farmerData.district || !farmerData.totalLandSize) { toast.error('District and land size are required'); return; } setStep(2); }}>
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)' }}>Soil & Water</h3>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label required">Primary soil type</label>
                    <select className="form-select" value={farmerData.primarySoilType} onChange={(e) => setFarmerData({ ...farmerData, primarySoilType: e.target.value })}>
                      {SOIL_TYPES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Water availability</label>
                    <select className="form-select" value={farmerData.waterAvailability} onChange={(e) => setFarmerData({ ...farmerData, waterAvailability: e.target.value })}>
                      {WATER.map((w) => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Farming experience (years)</label>
                  <input type="number" min="0" className="form-input" placeholder="e.g. 10" value={farmerData.experienceYears} onChange={(e) => setFarmerData({ ...farmerData, experienceYears: e.target.value })} />
                </div>
                <div className="flex gap-3">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button className="btn btn-primary btn-lg flex-1" onClick={() => setStep(3)}>Continue <ChevronRight size={16} /></button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-lg)' }}>Almost done!</h3>
                <div className="card card-padding" style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
                  <div className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                    <div className="flex justify-between"><span>Location</span><strong>{farmerData.district}, {farmerData.state}</strong></div>
                    <div className="flex justify-between"><span>Total land</span><strong>{farmerData.totalLandSize} acres</strong></div>
                    <div className="flex justify-between"><span>Soil type</span><strong>{farmerData.primarySoilType}</strong></div>
                    <div className="flex justify-between"><span>Water</span><strong>{farmerData.waterAvailability}</strong></div>
                  </div>
                </div>
                <p className="text-sm text-muted">You can update these anytime from your profile. We use this data to personalise crop recommendations for you.</p>
                <div className="flex gap-3">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                  <button className={`btn btn-primary btn-lg flex-1${loading ? ' btn-loading' : ''}`} onClick={handleFarmerSubmit} disabled={loading}>
                    {loading ? 'Saving…' : '🌱 Start using AgriConnect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Buyer onboarding
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 560 }}>
        <div className="card-header">
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>Set up your buyer profile</h2>
            <p className="text-sm text-muted">Help farmers understand your sourcing needs</p>
          </div>
        </div>
        <div className="card-body">
          <StepIndicator />
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label required">Organisation name</label>
                <input className="form-input" placeholder="e.g. Sree Traders Pvt Ltd" value={buyerData.orgName} onChange={(e) => setBuyerData({ ...buyerData, orgName: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label required">Organisation type</label>
                  <select className="form-select" value={buyerData.orgType} onChange={(e) => setBuyerData({ ...buyerData, orgType: e.target.value })}>
                    {ORG_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">GST number</label>
                  <input className="form-input" placeholder="Optional" value={buyerData.gstNumber} onChange={(e) => setBuyerData({ ...buyerData, gstNumber: e.target.value })} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label required">State</label>
                  <select className="form-select" value={buyerData.state} onChange={(e) => setBuyerData({ ...buyerData, state: e.target.value })}>
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">District</label>
                  <input className="form-input" placeholder="e.g. Chennai" value={buyerData.district} onChange={(e) => setBuyerData({ ...buyerData, district: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Preferred crops (comma separated)</label>
                <input className="form-input" placeholder="e.g. Tomato, Onion, Chilli" value={buyerData.preferredCrops} onChange={(e) => setBuyerData({ ...buyerData, preferredCrops: e.target.value })} />
              </div>
              <button className={`btn btn-primary btn-lg btn-block${loading ? ' btn-loading' : ''}`} onClick={() => { if (!buyerData.orgName || !buyerData.district) { toast.error('Organisation name and district are required'); return; } handleBuyerSubmit(); }} disabled={loading}>
                {loading ? 'Saving…' : '🏢 Start using AgriConnect'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
