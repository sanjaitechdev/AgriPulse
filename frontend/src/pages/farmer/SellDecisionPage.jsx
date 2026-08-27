import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Sprout, Sparkles, Navigation, Layers, Compass, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useLocation } from '../../hooks/useLocation';
import { useDemoMode } from '../../context/DemoModeContext';
import { toast } from 'react-hot-toast';

export default function SellDecisionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { demoMode, scenarioId } = useDemoMode();
  const { coords, address, status: locStatus, errorMessage: locError, detectLocation } = useLocation();

  // Form States
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [cropSearch, setCropSearch] = useState('');
  const [cropDropdownOpen, setCropDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState(2000);
  const [farmArea, setFarmArea] = useState(1);
  const [storageCapacity, setStorageCapacity] = useState(5000);
  const [storageDays, setStorageDays] = useState(5);
  const [storageType, setStorageType] = useState('ambient');
  const [storageCost, setStorageCost] = useState(0.05);
  const [handlingCost, setHandlingCost] = useState(0.40);

  // Queries
  const { data: farms, isLoading: loadingFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get('/farms').then(r => r.data.data),
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setSelectedFarmId(data[0]._id);
        setFarmArea(data[0].totalArea || 1);
      }
    }
  });

  const { data: crops, isLoading: loadingCrops } = useQuery({
    queryKey: ['crops-search', cropSearch],
    queryFn: () => api.get(`/crops?search=${encodeURIComponent(cropSearch)}&limit=10`).then(r => r.data.data),
    enabled: cropDropdownOpen
  });

  // Fetch all crops for default lists
  const { data: defaultCrops } = useQuery({
    queryKey: ['crops-defaults'],
    queryFn: () => api.get('/crops?limit=50').then(r => r.data.data)
  });

  // Set default crop when loaded
  useEffect(() => {
    if (defaultCrops && defaultCrops.length > 0 && !selectedCrop) {
      setSelectedCrop(defaultCrops[0].name);
    }
  }, [defaultCrops]);

  // Handle farm selection coordinates auto-fill
  useEffect(() => {
    if (farms && selectedFarmId) {
      const selected = farms.find(f => f._id === selectedFarmId);
      if (selected) {
        setFarmArea(selected.totalArea || 1);
      }
    }
  }, [selectedFarmId, farms]);

  // Run AI Decision Optimization
  const { mutate: runAnalysis, isPending: isAnalyzing } = useMutation({
    mutationFn: (payload) => api.post('/ai/decision/analyze', payload).then(r => r.data),
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to optimize decision strategy.');
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        toast.success('Strategy optimized successfully!');
        navigate(`/farmer/sell-decision/result/${res.data._id}`);
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFarmId) {
      toast.error('Please select or create a farm first.');
      return;
    }
    if (!selectedCrop) {
      toast.error('Please select a crop.');
      return;
    }

    if (demoMode) {
      // Direct redirect to demo result route
      navigate(`/farmer/sell-decision/result/demo-${scenarioId}`);
      return;
    }

    const payload = {
      farmId: selectedFarmId,
      crop: selectedCrop,
      farmArea: Number(farmArea),
      storageCapacity: Number(storageCapacity),
      storageDays: Number(storageDays),
      storageType,
      storageCostPerUnitPerDay: Number(storageCost),
      handlingCostPerUnit: Number(handlingCost),
    };

    runAnalysis(payload);
  };

  const cropOptions = crops || defaultCrops || [];

  return (
    <div className="fade-in max-w-4xl mx-auto py-6">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-3">
          <Sparkles size={13} />
          {t('decision_center')}
        </span>
        <h1 className="text-3xl font-black tracking-tight text-slate-800">
          AgriPulse selling decision tool
        </h1>
        <p className="text-sm text-neutral-500 mt-2 max-w-xl mx-auto">
          Optimizes harvest timings and logistics across APMC markets by evaluating real-time weather and transparent transportation costs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="card card-padding shadow-md space-y-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            
            {/* Step 1: Select Farm */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                Select Farm Location
              </label>
              {loadingFarms ? (
                <div className="skeleton h-10 w-full" />
              ) : farms && farms.length > 0 ? (
                <select 
                  className="input w-full"
                  value={selectedFarmId} 
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                >
                  {farms.map(f => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.district}, {f.state}) — {f.totalArea} Acres
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 border border-rose-200 bg-rose-50 rounded-xl text-center">
                  <p className="text-xs text-rose-800 font-bold mb-3">No active farm found with coordinates.</p>
                  <button 
                    type="button" 
                    onClick={() => navigate('/farmer/profile')}
                    className="btn btn-secondary btn-sm"
                  >
                    Setup Farm GPS Coordinates
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Select Crop (Auto-complete search) */}
            <div className="relative">
              <label className="block text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                <Sprout size={16} className="text-primary" />
                What crop are you selling?
              </label>
              <div 
                className="input w-full flex justify-between items-center cursor-pointer"
                onClick={() => setCropDropdownOpen(!cropDropdownOpen)}
              >
                <span>{selectedCrop || 'Select a crop...'}</span>
                <span className="text-xs text-muted-foreground font-semibold">Change</span>
              </div>

              {cropDropdownOpen && (
                <div 
                  className="absolute z-50 left-0 right-0 mt-1.5 p-3 bg-white border border-slate-200 rounded-xl shadow-xl space-y-3"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <input 
                    type="text" 
                    placeholder="Search 110 crops (e.g. Tomato, Rice)..."
                    className="input w-full"
                    value={cropSearch}
                    onChange={(e) => setCropSearch(e.target.value)}
                  />
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {cropOptions.map(c => (
                      <div 
                        key={c._id || c.name}
                        onClick={() => {
                          setSelectedCrop(c.name);
                          setCropDropdownOpen(false);
                        }}
                        className="p-2 hover:bg-slate-50 rounded-md cursor-pointer text-sm font-medium transition-colors"
                      >
                        {c.name} <span className="text-xs text-muted">({c.category})</span>
                      </div>
                    ))}
                    {cropOptions.length === 0 && (
                      <div className="text-xs text-center py-4 text-muted">No matching crops found.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Yield Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">Cultivated Land (Acres)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="input w-full"
                  value={farmArea}
                  onChange={(e) => setFarmArea(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">Readiness (Est. Days to harvest)</label>
                <input 
                  type="number" 
                  className="input w-full"
                  value={storageDays}
                  onChange={(e) => setStorageDays(parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Step 4: Storage Settings */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Advanced Storage Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Storage Type</label>
                  <select 
                    className="input w-full"
                    value={storageType}
                    onChange={(e) => setStorageType(e.target.value)}
                  >
                    <option value="ambient">Ambient (Standard Warehouse)</option>
                    <option value="cold">Cold Storage (Low Spoilage)</option>
                    <option value="open">Open Field (High Spoilage)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">Storage Capacity (kg)</label>
                  <input 
                    type="number" 
                    className="input w-full"
                    value={storageCapacity}
                    onChange={(e) => setStorageCapacity(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isAnalyzing || loadingFarms}
              className="btn btn-primary w-full py-3 flex justify-center items-center gap-2 text-base font-bold shadow-md"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  {t('analyzing')}
                </>
              ) : (
                <>
                  <Compass size={18} />
                  {t('submit_analyze')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          <div className="card card-padding bg-slate-50 border border-slate-100 rounded-xl">
            <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2 mb-3">
              <Navigation size={16} className="text-primary" />
              How it works
            </h3>
            <ul className="text-xs text-neutral-600 space-y-3 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Queries latest APMC Mandi arrivals and pricing feeds dynamically.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Calculates road transport routes using straight-line distance adjustments.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Models weather and storage spoilage to recommend wait-times or splits.</span>
              </li>
            </ul>
          </div>

          <div className="card card-padding bg-primary-50 border border-primary-100 rounded-xl">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2 mb-3">
              <Layers size={16} />
              Centralized solver
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              AgriPulse optimizes sell parameters across all regional buyers. The tool calculates transport costs transparently to maximize your net return.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
