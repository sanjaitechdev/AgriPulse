import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import { getCropImage, getCropEmoji } from '../../utils/cropImages';
import CropAvatar from '../../components/common/CropAvatar';
import {
  Sprout, Plus, Search, Filter, ArrowUpDown, Calendar,
  Droplets, Thermometer, AlertTriangle, CheckCircle2,
  Clock, Sparkles, ChevronRight, X, Info, MapPin,
  RefreshCw, ShieldAlert, Package, Layers, Compass,
  Sliders, TrendingUp, HelpCircle, Activity, Wind,
  Edit2, Trash2, Check, ArrowRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

// ── Lifecycle stages definition ──────────────────────────────────────────────
const LIFECYCLE_STAGES = [
  { key: 'sowing', label: 'Sowing', icon: '🌱', pct: 5 },
  { key: 'germination', label: 'Germination', icon: '🌿', pct: 15 },
  { key: 'vegetative', label: 'Vegetative Growth', icon: '🌾', pct: 35 },
  { key: 'flowering', label: 'Flowering', icon: '🌸', pct: 55 },
  { key: 'fruiting', label: 'Fruiting / Grain', icon: '🍅', pct: 75 },
  { key: 'maturity', label: 'Maturity', icon: '🍂', pct: 90 },
  { key: 'harvest_ready', label: 'Harvest Ready', icon: '✨', pct: 100 },
  { key: 'harvested', label: 'Harvested', icon: '📦', pct: 100 }
];

// ── Status metadata ──────────────────────────────────────────────────────────
const STATUS_META = {
  healthy: { label: 'Healthy', color: '#16a34a', bg: '#dcfce7', border: '#86efac', icon: '🟢' },
  growing: { label: 'Growing', color: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc', icon: '🌱' },
  needs_attention: { label: 'Needs Attention', color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: '⚠️' },
  harvest_approaching: { label: 'Harvest Approaching', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', icon: '🌾' },
  harvest_ready: { label: 'Harvest Ready', color: '#059669', bg: '#d1fae5', border: '#6ee7b7', icon: '✨' },
  at_risk: { label: 'At Risk', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: '🚨' },
  harvested: { label: 'Harvested', color: '#4b5563', bg: '#f3f4f6', border: '#d1d5db', icon: '📦' },
  data_insufficient: { label: 'Data Insufficient', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: '⚪' }
};

// ── Categories definition ───────────────────────────────────────────────────
const CROP_CATEGORIES = [
  { key: 'all', label: 'All Crops' },
  { key: 'cereal', label: 'Cereals' },
  { key: 'pulse', label: 'Pulses' },
  { key: 'oilseed', label: 'Oilseeds' },
  { key: 'vegetable', label: 'Vegetables' },
  { key: 'fruit', label: 'Fruits' },
  { key: 'spice', label: 'Spices' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'plantation', label: 'Plantation' },
  { key: 'millet', label: 'Millets' },
  { key: 'fodder', label: 'Fodder' }
];

export default function MyCropsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // State filters & modals
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('harvest_date'); // 'harvest_date' | 'name' | 'stage' | 'risk'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCropDetail, setActiveCropDetail] = useState(null);
  const [cropToEdit, setCropToEdit] = useState(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  // 1. Farmer's active tracked crops
  const { data: cropsData, isLoading: loadingCrops, refetch: refetchCrops } = useQuery({
    queryKey: ['farmer-crops'],
    queryFn: () => api.get('/farmer/crops').then(r => r.data),
    refetchInterval: 15000
  });

  // 2. Master 110+ crops catalog
  const { data: catalogData } = useQuery({
    queryKey: ['master-crops-catalog'],
    queryFn: () => api.get('/crops').then(r => r.data?.data || []),
    staleTime: 5 * 60 * 1000
  });

  // 3. Farmer's farms/fields
  const { data: farmsData } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get('/farms').then(r => r.data?.data || [])
  });

  const allCrops = cropsData?.data || [];
  const masterCatalog = catalogData || [];
  const farms = farmsData || [];

  // ── Add Crop Form State ───────────────────────────────────────────────────
  const [formFarmId, setFormFarmId] = useState('');
  const [formCropId, setFormCropId] = useState('');
  const [formCropSearch, setFormCropSearch] = useState('');
  const [formFieldName, setFormFieldName] = useState('Field 1');
  const [formArea, setFormArea] = useState('');
  const [formSowingDate, setFormSowingDate] = useState(new Date().toISOString().split('T')[0]);
  const [formVariety, setFormVariety] = useState('');
  const [formIrrigation, setFormIrrigation] = useState('drip');
  const [formSoilInfo, setFormSoilInfo] = useState('');
  const [formExpectedYield, setFormExpectedYield] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Selected crop in modal
  const selectedCropObj = useMemo(() => {
    return masterCatalog.find(c => c._id === formCropId);
  }, [formCropId, masterCatalog]);

  // Filtered master crops in add modal dropdown
  const filteredCatalogForModal = useMemo(() => {
    if (!formCropSearch.trim()) return masterCatalog.slice(0, 35);
    const q = formCropSearch.toLowerCase().trim();
    return masterCatalog.filter(c => {
      return c.name?.toLowerCase().includes(q) ||
        c.tamil_name?.toLowerCase().includes(q) ||
        c.telugu_name?.toLowerCase().includes(q) ||
        c.hindi_name?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q);
    });
  }, [formCropSearch, masterCatalog]);

  // Invalidate all related caches to keep Dashboard, My Farm, and Decision Center in real-time sync
  const invalidateAllCaches = () => {
    qc.invalidateQueries({ queryKey: ['farmer-crops'] });
    qc.invalidateQueries({ queryKey: ['farmer-dashboard'] });
    qc.invalidateQueries({ queryKey: ['farms'] });
    qc.invalidateQueries({ queryKey: ['farmer-profile'] });
    qc.invalidateQueries({ queryKey: ['farmer-stats'] });
  };

  // ── Add Crop Mutation ─────────────────────────────────────────────────────
  const { mutate: addCrop, isPending: isAddingCrop } = useMutation({
    mutationFn: (payload) => api.post('/farmer/crops', payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Crop registered successfully!');
      invalidateAllCaches();
      setIsAddModalOpen(false);
      resetAddForm();
    },
    onError: (err) => {
      toast.error('❌ ' + (err.response?.data?.message || err.message || 'Failed to add crop.'));
    }
  });

  // ── Quick Stage Update Mutation ───────────────────────────────────────────
  const { mutate: updateQuickStage } = useMutation({
    mutationFn: ({ id, currentStage }) => api.put(`/farmer/crops/${id}`, { currentStage }),
    onSuccess: () => {
      toast.success('⚡ Crop stage updated in real-time!');
      invalidateAllCaches();
    },
    onError: (err) => toast.error('Failed to update stage: ' + err.message)
  });

  // ── Delete Crop Mutation ──────────────────────────────────────────────────
  const { mutate: deleteCrop } = useMutation({
    mutationFn: (id) => api.delete(`/farmer/crops/${id}`),
    onSuccess: () => {
      toast.success('Crop tracking record removed.');
      invalidateAllCaches();
      setActiveCropDetail(null);
    },
    onError: (err) => toast.error('Failed to delete crop: ' + err.message)
  });

  const resetAddForm = () => {
    setFormCropId('');
    setFormCropSearch('');
    setFormFieldName('Field 1');
    setFormArea('');
    setFormSowingDate(new Date().toISOString().split('T')[0]);
    setFormVariety('');
    setFormIrrigation('drip');
    setFormSoilInfo('');
    setFormExpectedYield('');
    setFormNotes('');
  };

  const handleOpenAddModal = () => {
    if (farms.length > 0 && !formFarmId) {
      setFormFarmId(farms[0]._id);
    }
    setIsAddModalOpen(true);
  };

  const handleSaveCrop = (e) => {
    e.preventDefault();
    if (!formFarmId) { toast.error('Please select a farm.'); return; }
    if (!formCropId) { toast.error('Please select a crop from the 100+ catalog.'); return; }
    if (!formArea || parseFloat(formArea) <= 0) { toast.error('Please enter a valid cultivable area (in acres).'); return; }
    if (!formSowingDate) { toast.error('Please select a sowing / planting date.'); return; }

    addCrop({
      farmId: formFarmId,
      cropId: formCropId,
      fieldName: formFieldName || 'Field 1',
      landArea: parseFloat(formArea),
      sowingDate: formSowingDate,
      variety: formVariety,
      irrigationType: formIrrigation,
      soilInfo: formSoilInfo,
      expectedYield: formExpectedYield ? parseFloat(formExpectedYield) : undefined,
      notes: formNotes
    });
  };

  // ── Filtered & Sorted Crops List ──────────────────────────────────────────
  const filteredCrops = useMemo(() => {
    return allCrops.filter(item => {
      const cropName = item.crop?.name?.toLowerCase() || '';
      const taName = item.crop?.tamil_name?.toLowerCase() || '';
      const teName = item.crop?.telugu_name?.toLowerCase() || '';
      const hiName = item.crop?.hindi_name?.toLowerCase() || '';
      const field = item.fieldName?.toLowerCase() || '';
      const farm = item.farm?.name?.toLowerCase() || '';
      const category = item.crop?.category?.toLowerCase() || '';
      const status = item.status?.toLowerCase() || 'growing';

      // 1. Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches = cropName.includes(q) || taName.includes(q) || teName.includes(q) || hiName.includes(q) || field.includes(q) || farm.includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        if (category !== selectedCategory.toLowerCase()) return false;
      }

      // 3. Status Filter
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'growing') {
          if (!['growing', 'healthy', 'needs_attention'].includes(status)) return false;
        } else if (selectedStatusFilter === 'harvest_approaching') {
          if (status !== 'harvest_approaching') return false;
        } else if (selectedStatusFilter === 'harvest_ready') {
          if (status !== 'harvest_ready') return false;
        } else if (selectedStatusFilter === 'at_risk') {
          if (status !== 'at_risk' && item.riskLevel !== 'high') return false;
        } else if (selectedStatusFilter === 'harvested') {
          if (status !== 'harvested') return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'harvest_date') {
        const dateA = new Date(a.harvestForecast?.expectedHarvestStart || a.expectedHarvestAt || 0).getTime();
        const dateB = new Date(b.harvestForecast?.expectedHarvestStart || b.expectedHarvestAt || 0).getTime();
        return dateA - dateB;
      } else if (sortBy === 'name') {
        return (a.crop?.name || '').localeCompare(b.crop?.name || '');
      } else if (sortBy === 'stage') {
        return (b.growthProgressPercent || 0) - (a.growthProgressPercent || 0);
      } else if (sortBy === 'risk') {
        const riskWeights = { high: 3, medium: 2, low: 1 };
        return (riskWeights[b.riskLevel] || 1) - (riskWeights[a.riskLevel] || 1);
      }
      return 0;
    });
  }, [allCrops, searchTerm, selectedCategory, selectedStatusFilter, sortBy]);

  // Summary Metrics
  const totalTrackedArea = useMemo(() => {
    return allCrops.reduce((acc, c) => acc + (c.landArea || 0), 0);
  }, [allCrops]);

  const harvestApproachingCount = useMemo(() => {
    return allCrops.filter(c => c.status === 'harvest_approaching' || c.status === 'harvest_ready').length;
  }, [allCrops]);

  const healthyCount = useMemo(() => {
    return allCrops.filter(c => c.status === 'healthy' || c.status === 'growing').length;
  }, [allCrops]);

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sprout size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>My Crops / Crop Tracking</h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                Real-time crop lifecycle tracking, physiological stage management &amp; dynamic AI harvest forecasting.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            onClick={() => {
              refetchCrops();
              invalidateAllCaches();
              toast.success('Live farm telemetry synchronized');
            }} 
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Refresh Live Farm Telemetry"
          >
            <RefreshCw size={14} className={loadingCrops ? 'animate-spin' : ''} />
            Sync Telemetry
          </button>
          
          <button 
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Plus size={16} />
            Add Crop to Field
          </button>
        </div>
      </div>

      {/* ── Top Summary KPIs ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
        marginBottom: 24
      }}>
        <div className="card card-padding" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Active Tracked Crops</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-text-primary)', marginTop: 4 }}>
                {allCrops.length}
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: 'var(--color-primary-light)' }}>
              <Sprout size={22} color="var(--color-primary-dark)" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Registered across {farms.length} farm{farms.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="card card-padding" style={{ borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Total Cultivated Area</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0284c7', marginTop: 4 }}>
                {totalTrackedArea.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 600 }}>acres</span>
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: '#e0f2fe' }}>
              <Layers size={22} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Live field allocation
          </div>
        </div>

        <div className="card card-padding" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Harvest Approaching</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>
                {harvestApproachingCount}
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: '#ede9fe' }}>
              <Calendar size={22} color="#7c3aed" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Due for harvesting within 14 days
          </div>
        </div>

        <div className="card card-padding" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Vigor &amp; Health Index</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
                {allCrops.length > 0 ? Math.round((healthyCount / allCrops.length) * 100) : 100}%
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 10, background: '#dcfce7' }}>
              <CheckCircle2 size={22} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            {healthyCount} of {allCrops.length} crops in optimal state
          </div>
        </div>
      </div>

      {/* ── Search, Filters & Sorting Bar ── */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search crop by English, தமிழ், తెలుగు, हिंदी or field..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36, fontSize: 13 }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: 'var(--color-text-secondary)' }} />
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ fontSize: 12, minWidth: 140 }}
            >
              {CROP_CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ fontSize: 12, minWidth: 160 }}
            >
              <option value="harvest_date">Sort by Harvest Date</option>
              <option value="name">Sort by Crop Name</option>
              <option value="stage">Sort by Growth Stage</option>
              <option value="risk">Sort by Risk Severity</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)'
        }}>
          {[
            { key: 'all', label: 'All Statuses' },
            { key: 'growing', label: '🌱 Growing / Healthy' },
            { key: 'harvest_approaching', label: '🌾 Harvest Approaching' },
            { key: 'harvest_ready', label: '✨ Harvest Ready' },
            { key: 'at_risk', label: '🚨 At Risk / Attention' },
            { key: 'harvested', label: '📦 Harvested' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatusFilter(tab.key)}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: selectedStatusFilter === tab.key ? 700 : 500,
                borderRadius: 20,
                border: selectedStatusFilter === tab.key ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: selectedStatusFilter === tab.key ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: selectedStatusFilter === tab.key ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── My Crops List Grid ── */}
      {loadingCrops ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="card skeleton" style={{ height: 260 }} />
          ))}
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Sprout size={32} style={{ opacity: 0.4 }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px 0' }}>
            {searchTerm || selectedCategory !== 'all' || selectedStatusFilter !== 'all' 
              ? 'No crops match your filter criteria' 
              : 'No crops registered yet'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 420, margin: '0 auto 20px' }}>
            {searchTerm || selectedCategory !== 'all' || selectedStatusFilter !== 'all'
              ? 'Try adjusting your search query or reset the filters to see all registered crops.'
              : 'Add your currently cultivated crops and fields to start real-time growth tracking, physiological stage monitoring & AI harvest forecasting.'}
          </p>
          {searchTerm || selectedCategory !== 'all' || selectedStatusFilter !== 'all' ? (
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedStatusFilter('all'); }} 
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
          ) : (
            <button 
              onClick={handleOpenAddModal} 
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> Register First Crop
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
          {filteredCrops.map(item => (
            <CropTrackingCard 
              key={item._id} 
              item={item} 
              onViewDetails={() => setActiveCropDetail(item)}
              onEditCrop={() => setCropToEdit(item)}
              onQuickStageChange={(stage) => updateQuickStage({ id: item._id, currentStage: stage })}
            />
          ))}
        </div>
      )}

      {/* ── ADD CROP MODAL ── */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div className="card fade-in" style={{
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 18,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sprout size={20} color="var(--color-primary)" />
                  Add Crop to Field
                </h2>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                  Register a cultivated crop to initiate real-time AI lifecycle tracking.
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCrop} style={{ padding: '20px 24px' }}>
              
              {/* Field & Farm Selector */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label required">Select Farm / Location</label>
                <select
                  className="form-select"
                  value={formFarmId}
                  onChange={(e) => setFormFarmId(e.target.value)}
                  required
                >
                  {farms.map(f => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.district}, {f.state} · {f.totalArea} acres)
                    </option>
                  ))}
                </select>
              </div>

              {/* Field Name */}
              <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label required">Field / Plot Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Field 1, North Plot"
                    value={formFieldName}
                    onChange={(e) => setFormFieldName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label required">Cultivable Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-input"
                    placeholder="e.g. 2.5"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Crop Selector from 100+ Catalog */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label required">Select Crop (100+ Indian Crops)</label>
                <div style={{ position: 'relative', marginBottom: 6 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type to search crop (e.g. Tomato, தக்காளி, టమాటా, गेहूं)..."
                    value={formCropSearch}
                    onChange={(e) => setFormCropSearch(e.target.value)}
                    style={{ paddingLeft: 32, fontSize: 12 }}
                  />
                </div>

                <select
                  className="form-select"
                  value={formCropId}
                  onChange={(e) => setFormCropId(e.target.value)}
                  size={4}
                  style={{ height: 110, fontSize: 12 }}
                  required
                >
                  {filteredCatalogForModal.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.tamil_name ? `· ${c.tamil_name}` : ''} {c.telugu_name ? `· ${c.telugu_name}` : ''} [{c.category}]
                    </option>
                  ))}
                </select>
                {selectedCropObj && (
                  <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-primary-dark)', background: 'var(--color-primary-light)33', padding: '6px 10px', borderRadius: 6 }}>
                    Selected: <strong>{selectedCropObj.name}</strong> {selectedCropObj.tamil_name && `(${selectedCropObj.tamil_name})`} ({selectedCropObj.category}) · Duration: {selectedCropObj.durationDays?.min || 90}–{selectedCropObj.durationDays?.max || 120} days
                  </div>
                )}
              </div>

              {/* Sowing Date & Variety */}
              <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label required">Sowing / Planting Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formSowingDate}
                    onChange={(e) => setFormSowingDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Crop Variety (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Arka Rakshak, BT-2"
                    value={formVariety}
                    onChange={(e) => setFormVariety(e.target.value)}
                  />
                </div>
              </div>

              {/* Irrigation, Soil & Expected Yield */}
              <div className="grid-3" style={{ gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Irrigation Type</label>
                  <select
                    className="form-select"
                    value={formIrrigation}
                    onChange={(e) => setFormIrrigation(e.target.value)}
                  >
                    <option value="drip">Drip Irrigation</option>
                    <option value="canal">Canal Water</option>
                    <option value="sprinkler">Sprinkler</option>
                    <option value="borewell">Borewell</option>
                    <option value="rain_fed">Rain-fed</option>
                    <option value="flood">Flood Irrigation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Soil Type</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Red Loamy"
                    value={formSoilInfo}
                    onChange={(e) => setFormSoilInfo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Yield (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Auto-calculated if blank"
                    value={formExpectedYield}
                    onChange={(e) => setFormExpectedYield(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">Agronomic Notes (Optional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. Organic fertilizer applied at basal dressing..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary${isAddingCrop ? ' btn-loading' : ''}`}
                  disabled={isAddingCrop}
                >
                  {isAddingCrop ? 'Registering...' : 'Save & Start Tracking'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── EDIT CROP MODAL ── */}
      {cropToEdit && (
        <EditCropModal
          crop={cropToEdit}
          onClose={() => setCropToEdit(null)}
          onSuccess={() => {
            invalidateAllCaches();
            setCropToEdit(null);
          }}
        />
      )}

      {/* ── CROP DETAILS MODAL ── */}
      {activeCropDetail && (
        <CropDetailsModal
          crop={activeCropDetail}
          onClose={() => setActiveCropDetail(null)}
          onEdit={() => {
            setCropToEdit(activeCropDetail);
            setActiveCropDetail(null);
          }}
          onDelete={() => deleteCrop(activeCropDetail._id)}
          onRefresh={() => {
            refetchCrops();
            invalidateAllCaches();
          }}
        />
      )}

    </div>
  );
}

// ── Crop Tracking Card Component ────────────────────────────────────────────
function CropTrackingCard({ item, onViewDetails, onEditCrop, onQuickStageChange }) {
  const crop = item.crop || {};
  const farm = item.farm || {};
  const statusInfo = STATUS_META[item.status] || STATUS_META.growing;
  const currentStageObj = LIFECYCLE_STAGES.find(s => s.key === item.currentStage) || LIFECYCLE_STAGES[2];
  const progressPct = item.growthProgressPercent || 0;

  // Format Harvest Range
  const harvestStart = item.harvestForecast?.expectedHarvestStart 
    ? new Date(item.harvestForecast.expectedHarvestStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) 
    : '—';
  const harvestEnd = item.harvestForecast?.expectedHarvestEnd 
    ? new Date(item.harvestForecast.expectedHarvestEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) 
    : '';

  const harvestRangeText = harvestEnd && harvestEnd !== harvestStart ? `${harvestStart} – ${harvestEnd}` : harvestStart;

  return (
    <div className="card" style={{
      borderRadius: 16,
      overflow: 'hidden',
      border: '1.5px solid var(--color-border)',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
    }}>
      
      {/* Top Card Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CropAvatar cropName={crop.name} size={48} borderRadius={12} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#1C3624' }}>
                  {crop.name || 'Crop'}
                </h3>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 4,
                  color: 'var(--color-text-secondary)'
                }}>
                  {crop.category || 'crop'}
                </span>
              </div>
              
              {/* Multilingual / Local Name */}
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>
                {crop.tamil_name && <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{crop.tamil_name} · </span>}
                {crop.telugu_name && <span>{crop.telugu_name} · </span>}
                {item.fieldName || 'Field 1'} • <strong>{item.landArea} acres</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Status Badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`,
              borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
            }}>
              {statusInfo.icon} {statusInfo.label}
            </span>

            {/* Quick Edit Button */}
            <button
              onClick={onEditCrop}
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '4px 6px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)'
              }}
              title="Edit Crop Details"
            >
              <Edit2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div style={{ padding: '14px 18px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Stage: {currentStageObj.icon} <strong>{currentStageObj.label}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={item.currentStage}
              onChange={(e) => onQuickStageChange(e.target.value)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: 'pointer'
              }}
              title="Quickly change growth stage"
            >
              {LIFECYCLE_STAGES.map(s => (
                <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: progressPct >= 95 ? '#10b981' : progressPct >= 50 ? 'var(--color-primary)' : '#0ea5e9',
            borderRadius: 4,
            transition: 'width 0.4s ease'
          }} />
        </div>

        {/* Small Stage Dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'var(--color-text-secondary)' }}>
          <span>Sowing</span>
          <span>Vegetative</span>
          <span>Flowering</span>
          <span>Harvest</span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
            Expected Harvest
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 2 }}>
            {harvestRangeText}
          </div>
          {item.harvestForecast?.confidence && (
            <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginTop: 1 }}>
              AI Confidence: {item.harvestForecast.confidence}%
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
            Expected Yield
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 2 }}>
            {(item.expectedYield || item.estimatedProduction || 2000).toLocaleString('en-IN')} kg
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 1 }}>
            {item.irrigationType || 'Drip'} · {item.variety || 'Standard'}
          </div>
        </div>
      </div>

      {/* AI Harvest Reason Snippet */}
      {item.harvestForecast?.reason && (
        <div style={{
          padding: '8px 18px',
          background: 'var(--color-surface)',
          borderTop: '1px dashed var(--color-border)',
          fontSize: 11,
          lineHeight: 1.4,
          color: 'var(--color-text-secondary)'
        }}>
          <Sparkles size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--color-primary)' }} />
          {item.harvestForecast.reason.slice(0, 110)}...
        </div>
      )}

      {/* Card Footer */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-surface)'
      }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
          {item.liveContext?.lastSyncedAt 
            ? `Live Data · Updated ${new Date(item.liveContext.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
            : 'Live Farm Telemetry'}
        </div>

        <button
          onClick={onViewDetails}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
        >
          Detailed Tracking <ChevronRight size={12} />
        </button>
      </div>

    </div>
  );
}

// ── Edit Crop Modal Component ───────────────────────────────────────────────
function EditCropModal({ crop, onClose, onSuccess }) {
  const [fieldName, setFieldName] = useState(crop.fieldName || 'Field 1');
  const [landArea, setLandArea] = useState(crop.landArea || '');
  const [sowingDate, setSowingDate] = useState(
    crop.sowingDate ? new Date(crop.sowingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [variety, setVariety] = useState(crop.variety || '');
  const [irrigationType, setIrrigationType] = useState(crop.irrigationType || 'drip');
  const [soilInfo, setSoilInfo] = useState(crop.soilInfo || '');
  const [expectedYield, setExpectedYield] = useState(crop.expectedYield || crop.estimatedProduction || '');
  const [currentStage, setCurrentStage] = useState(crop.currentStage || 'vegetative');
  const [notes, setNotes] = useState(crop.notes || '');

  const { mutate: saveEdit, isPending } = useMutation({
    mutationFn: (payload) => api.put(`/farmer/crops/${crop._id}`, payload),
    onSuccess: () => {
      toast.success('Crop tracking record updated in real-time!');
      onSuccess();
    },
    onError: (err) => toast.error('Failed to update: ' + err.message)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!landArea || parseFloat(landArea) <= 0) {
      toast.error('Please enter a valid area.');
      return;
    }
    saveEdit({
      fieldName,
      landArea: parseFloat(landArea),
      sowingDate,
      variety,
      irrigationType,
      soilInfo,
      expectedYield: expectedYield ? parseFloat(expectedYield) : undefined,
      currentStage,
      notes
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: 580,
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 18,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Edit Crop: {crop.crop?.name} {crop.crop?.tamil_name && `(${crop.crop.tamil_name})`}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
              Updates will instantly recalculate AI harvest forecast &amp; stage progress.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label required">Field / Plot Name</label>
              <input
                type="text"
                className="form-input"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Area (Acres)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label required">Sowing Date</label>
              <input
                type="date"
                className="form-input"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current Stage</label>
              <select
                className="form-select"
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
              >
                {LIFECYCLE_STAGES.map(s => (
                  <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3" style={{ gap: 12, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Variety</label>
              <input
                type="text"
                className="form-input"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Irrigation</label>
              <select
                className="form-select"
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
              >
                <option value="drip">Drip</option>
                <option value="canal">Canal</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="borewell">Borewell</option>
                <option value="rain_fed">Rain-fed</option>
                <option value="flood">Flood</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Expected Yield (kg)</label>
              <input
                type="number"
                className="form-input"
                value={expectedYield}
                onChange={(e) => setExpectedYield(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 18 }}>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`btn btn-primary${isPending ? ' btn-loading' : ''}`} disabled={isPending}>
              {isPending ? 'Saving...' : 'Update Crop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Detailed Crop Tracking Modal Component ──────────────────────────────────
function CropDetailsModal({ crop, onClose, onEdit, onDelete, onRefresh }) {
  const qc = useQueryClient();
  const cropDoc = crop.crop || {};
  const farmDoc = crop.farm || {};
  const currentStageObj = LIFECYCLE_STAGES.find(s => s.key === crop.currentStage) || LIFECYCLE_STAGES[2];
  const progressPct = crop.growthProgressPercent || 0;
  const statusInfo = STATUS_META[crop.status] || STATUS_META.growing;

  // Sowing & Harvest calculations
  const sowDateStr = crop.sowingDate 
    ? new Date(crop.sowingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : 'Not recorded';
  
  const harvestStart = crop.harvestForecast?.expectedHarvestStart 
    ? new Date(crop.harvestForecast.expectedHarvestStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) 
    : '—';
  const harvestEnd = crop.harvestForecast?.expectedHarvestEnd 
    ? new Date(crop.harvestForecast.expectedHarvestEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : '';

  // Mutation to update crop stage (e.g. mark harvested or advance stage)
  const { mutate: updateCropStage, isPending: isUpdating } = useMutation({
    mutationFn: (stageKey) => api.put(`/farmer/crops/${crop._id}`, { currentStage: stageKey }),
    onSuccess: () => {
      toast.success('Crop stage updated successfully!');
      qc.invalidateQueries({ queryKey: ['farmer-crops'] });
      qc.invalidateQueries({ queryKey: ['farmer-dashboard'] });
      onRefresh();
      onClose();
    },
    onError: (e) => toast.error('Failed to update stage: ' + e.message)
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: 780,
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 20,
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-surface)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22
              }}>
                🌱
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>{cropDoc.name}</h2>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 4,
                    color: 'var(--color-text-secondary)'
                  }}>
                    {cropDoc.category}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {cropDoc.tamil_name && <strong style={{ color: 'var(--color-primary-dark)' }}>{cropDoc.tamil_name} · </strong>}
                  {farmDoc.name} · {crop.fieldName || 'Field 1'} • {crop.landArea} acres • Sown: {sowDateStr}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onEdit}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to remove ${cropDoc.name}?`)) {
                  onDelete();
                }
              }}
              className="btn btn-danger btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Status & Lifecycle Journey Bar */}
          <div className="card card-padding" style={{ background: 'var(--color-surface-2)', border: '1.5px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                  Current Physiological Lifecycle Stage
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {currentStageObj.icon} {currentStageObj.label}
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    ({progressPct}% of cycle)
                  </span>
                </div>
              </div>

              <span style={{
                background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}`,
                borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700
              }}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>

            {/* Stepper Icons for All Lifecycle Stages */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(65px, 1fr))',
              gap: 4,
              textAlign: 'center',
              paddingTop: 10,
              borderTop: '1px solid var(--color-border)'
            }}>
              {LIFECYCLE_STAGES.map((stg, idx) => {
                const isPassed = progressPct >= stg.pct;
                const isCurrent = crop.currentStage === stg.key;
                return (
                  <div 
                    key={stg.key} 
                    onClick={() => updateCropStage(stg.key)}
                    style={{ opacity: isCurrent ? 1 : isPassed ? 0.85 : 0.45, cursor: 'pointer' }}
                    title={`Click to set stage to ${stg.label}`}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      margin: '0 auto 4px',
                      background: isCurrent ? 'var(--color-primary)' : isPassed ? '#dcfce7' : 'var(--color-surface)',
                      color: isCurrent ? 'white' : '#15803d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                      border: isCurrent ? '2px solid var(--color-primary-dark)' : '1px solid var(--color-border)',
                      boxShadow: isCurrent ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'
                    }}>
                      {stg.icon}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: isCurrent ? 800 : 500, lineHeight: 1.1 }}>
                      {stg.label.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* "Why is my crop at this stage?" Card */}
          <div className="card card-padding" style={{ borderLeft: '4px solid var(--color-primary)', background: '#f8fafc' }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px 0', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={16} />
              Why is my crop at this stage? (AI Agronomic Explanation)
            </h4>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-primary)', margin: 0 }}>
              {crop.stageExplanation || `${cropDoc.name} is progressing through its physiological development based on days elapsed from sowing date and regional agro-climatic conditions.`}
            </p>
          </div>

          {/* AI Harvest Forecast Card */}
          <div className="card card-padding" style={{ borderLeft: '4px solid #7c3aed', background: '#faf5ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} />
                Dynamic AI Harvest Forecast
              </h4>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 999 }}>
                Confidence: {crop.harvestForecast?.confidence || 84}%
              </span>
            </div>

            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: 6 }}>
              Expected Window: {harvestStart} – {harvestEnd || 'Maturity Target'}
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--color-text-secondary)', margin: 0 }}>
              {crop.harvestForecast?.reason || 'Calculated from sowing date, crop duration window, local thermal units, and field soil parameters.'}
            </p>
          </div>

          {/* Farm, Weather & Telemetry Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="card card-padding">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Field &amp; Location</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{farmDoc.district}, {farmDoc.state}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Soil: {crop.soilInfo || farmDoc.soilType || 'Loamy'} · Area: {crop.landArea} ac
              </div>
            </div>

            <div className="card card-padding">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Live Weather &amp; Water</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Thermometer size={14} color="#f97316" /> {crop.liveContext?.temperature || 28}°C · {crop.liveContext?.humidity || 65}% RH
              </div>
              <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>
                Water: {crop.liveContext?.waterStatus || farmDoc.waterAvailability || 'Adequate'} · {crop.irrigationType || 'Drip'}
              </div>
            </div>

            <div className="card card-padding">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Market Context (APMC)</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: '#16a34a' }}>
                ₹{(crop.liveContext?.currentMandiPrice || 35).toFixed(1)}/kg
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Mandi: {crop.liveContext?.mandiName || `${farmDoc.district || 'Local'} APMC`}
              </div>
            </div>
          </div>

          {/* Quick Stage Update Actions */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Change stage if your physical field observations differ:
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              {crop.currentStage !== 'harvest_ready' && (
                <button
                  onClick={() => updateCropStage('harvest_ready')}
                  disabled={isUpdating}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  Mark Harvest Ready
                </button>
              )}
              {crop.currentStage !== 'harvested' && (
                <button
                  onClick={() => updateCropStage('harvested')}
                  disabled={isUpdating}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  Mark Harvested
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
