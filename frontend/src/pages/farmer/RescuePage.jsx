import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, RefreshCw, AlertTriangle, CheckCircle2, TrendingDown,
  TrendingUp, Clock, MapPin, Phone, Users, Zap, Calendar, Package,
  ArrowRight, X, ChevronRight, Info, Droplets, Thermometer, CloudRain,
  ExternalLink, Layers, Check, Sparkles, Scale
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import CropAvatar from '../../components/common/CropAvatar';

export default function RescuePage() {
  const queryClient = useQueryClient();
  const [selectedCropPlan, setSelectedCropPlan] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // ── Fetch Live Rescue Radar ──────────────────────────────────────────────────
  const { data: radarRes, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['rescue-radar'],
    queryFn: () => api.get('/rescue/radar').then(res => res.data.data),
    refetchInterval: 30000, // Background auto-refresh every 30 seconds
  });

  // ── Timer for "Last updated X seconds ago" ────────────────────────────────────
  useEffect(() => {
    setSecondsAgo(0);
    const interval = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [radarRes?.generatedAt]);

  // ── Manual Force Refresh Mutation ───────────────────────────────────────────
  const { mutate: refreshRadar, isPending: isRefreshing } = useMutation({
    mutationFn: () => api.post('/rescue/refresh').then(res => res.data.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['rescue-radar'], data);
      toast.success('Radar refreshed with live APMC & weather data!');
      setSecondsAgo(0);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to refresh live data');
    },
  });

  // ── Choose Rescue Option Mutation ───────────────────────────────────────────
  const { mutate: chooseOption, isPending: isChoosing } = useMutation({
    mutationFn: (payload) => api.post('/rescue/choose', payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Rescue action confirmed! APMC Logistics activated.', { duration: 5000 });
      setSelectedCropPlan(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to lock rescue action');
    },
  });

  const radar = radarRes || null;
  const summary = radar?.summary || {};
  const crops = radar?.crops || [];
  const weather = radar?.weather || null;
  const location = radar?.farmerLocation || {};

  // If loading skeleton
  if (isLoading) {
    return (
      <div className="fade-in" style={{ paddingBottom: 60 }}>
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div className="skeleton" style={{ width: 280, height: 32, marginBottom: 8, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 420, height: 18, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ height: 260, borderRadius: 16 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      {/* ── Top Header & Live Radar Controls ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🚨 Rescue Radar
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC',
              padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#16A34A',
                boxShadow: '0 0 6px #16A34A', display: 'inline-block'
              }} className="animate-ping" />
              LIVE MONITORING
            </span>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Real-time loss prevention &amp; emergency liquidation radar for all your cultivated crops
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {isFetching || isRefreshing ? 'Refreshing live feeds...' : `Updated ${secondsAgo}s ago`}
          </span>
          <button
            onClick={() => refreshRadar()}
            disabled={isRefreshing || isFetching}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '8px 16px' }}
          >
            <RefreshCw size={14} className={isRefreshing || isFetching ? 'animate-spin' : ''} />
            Refresh Live Data
          </button>
        </div>
      </div>

      {/* ── Live Context Bar (Location & Weather) ── */}
      <div style={{
        background: '#FAF7F2',
        border: '1.5px solid #E8EFE9',
        borderRadius: 14,
        padding: '12px 18px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} style={{ color: '#234D35' }} />
          <span>
            <strong>Farm Radar Hub:</strong> {location.village ? `${location.village}, ` : ''}{location.district}, {location.state}
            {location.latitude && (
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 6 }}>
                ({location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)})
              </span>
            )}
          </span>
        </div>

        {weather ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#2D3436' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Thermometer size={14} color="#E17055" /> {weather.temperature}°C
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Droplets size={14} color="#0984E3" /> {weather.humidity}% RH
            </span>
            {weather.precipitationProb > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: weather.precipitationProb >= 50 ? '#D63031' : '#2D3436', fontWeight: weather.precipitationProb >= 50 ? 700 : 500 }}>
                <CloudRain size={14} color="#00CEC9" /> {weather.precipitationProb}% rain ({weather.precipitationSum}mm)
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: '#FFFFFF', padding: '2px 8px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
              {weather.source}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Live weather feed connecting…</span>
        )}
      </div>

      {/* ── 4 Summary KPI Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {/* Crops at Risk */}
        <div className="card" style={{
          padding: '18px 20px',
          borderRadius: 16,
          borderLeft: `5px solid ${summary.cropsAtRisk > 0 ? '#DC2626' : '#16A34A'}`,
          background: summary.cropsAtRisk > 0 ? '#FEF2F2' : 'var(--color-surface)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Crops at Risk
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: summary.cropsAtRisk > 0 ? '#FEE2E2' : '#DCFCE7' }}>
              <AlertTriangle size={18} color={summary.cropsAtRisk > 0 ? '#DC2626' : '#16A34A'} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: summary.cropsAtRisk > 0 ? '#DC2626' : '#16A34A', marginTop: 4 }}>
            {summary.cropsAtRisk || 0}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginLeft: 6 }}>
              of {summary.totalMonitoredCrops || crops.length} lots
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {summary.cropsAtRisk > 0 ? 'Urgent intervention recommended' : 'All crops in safe condition'}
          </div>
        </div>

        {/* Potential Loss */}
        <div className="card" style={{
          padding: '18px 20px',
          borderRadius: 16,
          borderLeft: '5px solid #EA580C',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Potential Loss Exposure
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: '#FFEDD5' }}>
              <TrendingDown size={18} color="#EA580C" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#EA580C', marginTop: 4 }}>
            ₹{(summary.totalPotentialLoss || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Value gap without rescue intervention
          </div>
        </div>

        {/* Highest Risk Crop */}
        <div className="card" style={{
          padding: '18px 20px',
          borderRadius: 16,
          borderLeft: '5px solid #7C3AED',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Highest Risk Crop
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: '#EDE9FE' }}>
              <Zap size={18} color="#7C3AED" />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1C3624', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            {summary.highestRiskCrop?.name || 'None'}
            {summary.highestRiskCrop && (
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                background: summary.highestRiskCrop.score >= 80 ? '#FEE2E2' : summary.highestRiskCrop.score >= 60 ? '#FFEDD5' : '#DCFCE7',
                color: summary.highestRiskCrop.score >= 80 ? '#DC2626' : summary.highestRiskCrop.score >= 60 ? '#EA580C' : '#16A34A',
              }}>
                {summary.highestRiskCrop.score}/100
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Top priority for liquidation
          </div>
        </div>

        {/* Rescue Opportunities */}
        <div className="card" style={{
          padding: '18px 20px',
          borderRadius: 16,
          borderLeft: '5px solid #0284C7',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Rescue Opportunities
            </div>
            <div style={{ padding: 6, borderRadius: 8, background: '#E0F2FE' }}>
              <Users size={18} color="#0284C7" />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0284C7', marginTop: 4 }}>
            {summary.totalRescueOpportunities || 0}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginLeft: 6 }}>
              live channels
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Verified direct buyers &amp; APMC mandis
          </div>
        </div>
      </div>

      {/* ── Monitored Crops Grid ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#1C3624', display: 'flex', alignItems: 'center', gap: 8 }}>
            🌾 Monitored Crop Lots ({crops.length})
          </h2>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Ranked by urgency &amp; risk severity
          </span>
        </div>

        {crops.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles size={32} color="#234D35" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px 0' }}>All crops are currently within a safe selling window</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 460, margin: '0 auto 20px' }}>
              No crop lots are currently showing spoilage or sudden price crash risks. The Rescue Radar continues background surveillance.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 20,
          }}>
            {crops.map((item) => {
              const risk = item.risk;
              const isCritical = risk.level === 'CRITICAL';
              const isHigh = risk.level === 'HIGH';
              const isMonitor = risk.level === 'MEDIUM';

              const statusColor = isCritical ? '#DC2626' : isHigh ? '#EA580C' : isMonitor ? '#D97706' : '#16A34A';
              const statusBg = isCritical ? '#FEE2E2' : isHigh ? '#FFEDD5' : isMonitor ? '#FEF3C7' : '#DCFCE7';

              return (
                <div
                  key={item.cycleId || item.cropName}
                  className="card"
                  style={{
                    borderRadius: 18,
                    overflow: 'hidden',
                    border: `1.5px solid ${isCritical || isHigh ? statusColor : 'var(--color-border)'}`,
                    boxShadow: isCritical || isHigh ? '0 8px 24px rgba(220, 38, 38, 0.08)' : '0 4px 12px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Card Top */}
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CropAvatar cropName={item.cropName} size={52} borderRadius={12} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#1C3624' }}>
                              {item.cropName}
                            </h3>
                            {item.tamilName && (
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                {item.tamilName}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {item.quantityKg.toLocaleString('en-IN')} kg · Age: <strong>{item.cropAgeDays} days</strong>
                          </div>
                        </div>
                      </div>

                      {/* Risk Score Pill */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: statusBg, color: statusColor,
                        padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}>
                        {risk.status} ({risk.score}/100)
                      </span>
                    </div>

                    {/* Time To Rescue Alert Banner */}
                    <div style={{
                      marginTop: 14,
                      background: isCritical || isHigh ? '#FEF2F2' : '#F8FAFC',
                      border: `1px solid ${isCritical || isHigh ? '#FCA5A5' : '#E2E8F0'}`,
                      borderRadius: 10,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: isCritical || isHigh ? '#B91C1C' : '#334155',
                    }}>
                      <Clock size={14} color={isCritical || isHigh ? '#DC2626' : '#64748B'} />
                      <span>{risk.timeToRescueText}</span>
                    </div>
                  </div>

                  {/* Card Financials & Market */}
                  <div style={{ padding: '16px 20px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                      <div style={{ background: '#FFFFFF', padding: '10px 8px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                          Market Price
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1C3624', marginTop: 2 }}>
                          {item.marketPrice.available ? `₹${item.marketPrice.price}/kg` : 'Unavailable'}
                        </div>
                        {item.marketPrice.trendPct !== 0 && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: item.marketPrice.trend === 'falling' ? '#DC2626' : '#16A34A', marginTop: 2 }}>
                            {item.marketPrice.trend === 'falling' ? '▼ ' : '▲ '}{Math.abs(item.marketPrice.trendPct)}%
                          </div>
                        )}
                      </div>

                      <div style={{ background: '#FFFFFF', padding: '10px 8px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                          Est. Recovery
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
                          ₹{item.recoverableValue.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                          Net in pocket
                        </div>
                      </div>

                      <div style={{ background: '#FFFFFF', padding: '10px 8px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                          Potential Loss
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: item.potentialLoss > 0 ? '#DC2626' : '#16A34A', marginTop: 2 }}>
                          ₹{item.potentialLoss.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                          At risk
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <strong>{item.opportunitiesCount}</strong> liquidation channels
                    </div>
                    <button
                      onClick={() => setSelectedCropPlan(item)}
                      className={`btn ${isCritical || isHigh ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, fontWeight: 700 }}
                    >
                      View Rescue Plan <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Deep-Dive Rescue Plan Drawer / Modal ── */}
      {selectedCropPlan && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="card fade-in" style={{
            width: '100%',
            maxWidth: 820,
            maxHeight: '92vh',
            overflowY: 'auto',
            borderRadius: 20,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            background: '#FFFFFF',
            padding: 0,
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FAF7F2',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <CropAvatar cropName={selectedCropPlan.cropName} size={48} borderRadius={12} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1C3624' }}>
                      Rescue Strategy: {selectedCropPlan.cropName}
                    </h2>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 999,
                      background: selectedCropPlan.risk.level === 'CRITICAL' ? '#FEE2E2' : '#FFEDD5',
                      color: selectedCropPlan.risk.level === 'CRITICAL' ? '#DC2626' : '#EA580C',
                    }}>
                      {selectedCropPlan.risk.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Lot: {selectedCropPlan.quantityKg.toLocaleString('en-IN')} kg · Age: {selectedCropPlan.cropAgeDays} days · {location.district}, {location.state}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCropPlan(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 6 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              
              {/* ── 5 Core Rescue Plan Breakdown ── */}
              
              {/* Question 1: WHY IS THIS CROP AT RISK? */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#B91C1C', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={15} /> 1. Why is this crop at risk?
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedCropPlan.rescuePlanDetails?.whyAtRisk?.length > 0 ? (
                    selectedCropPlan.rescuePlanDetails.whyAtRisk.map((factor, idx) => (
                      <div key={idx} style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 10,
                        padding: '9px 12px',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        color: '#7F1D1D',
                      }}>
                        <span style={{ fontWeight: 800, color: '#DC2626' }}>•</span>
                        <span style={{ lineHeight: 1.4 }}>{factor}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      Lot is approaching harvest maturity. Active surveillance in place.
                    </div>
                  )}
                </div>
              </div>

              {/* Question 2: WHAT WILL HAPPEN IF THE FARMER WAITS? */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#D97706', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} /> 2. What will happen if you wait?
                </h4>
                <div style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#92400E',
                }}>
                  {selectedCropPlan.rescuePlanDetails?.whatIfFarmerWaits || 'Delaying liquidation may cause additional ambient spoilage and price depreciation.'}
                </div>
              </div>

              {/* Question 3 & 4: BEST ACTION NOW & HOW MUCH MONEY CAN BE SAVED */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}>
                <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>
                    3. Best Action Now
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#14532D' }}>
                    {selectedCropPlan.recommendedAction || 'SELL NOW'}
                  </div>
                  <div style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
                    Highest expected net recovery channel
                  </div>
                </div>

                <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>
                    4. Potential Loss Avoided (Money Saved)
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#16A34A' }}>
                    ₹{(selectedCropPlan.rescuePlanDetails?.moneySaved || selectedCropPlan.potentialLoss || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
                    Saved vs holding lot into spoilage
                  </div>
                </div>
              </div>

              {/* Question 5: WHICH BUYER / MARKET SHOULD BE USED? */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#166534', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} /> 5. Which Buyer / Market should be used?
                </h4>

                {selectedCropPlan.bestOption && (
                  <div style={{
                    border: '2px solid #16A34A',
                    borderRadius: 14,
                    padding: '16px 18px',
                    background: '#F0FDF4',
                    marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                      <div>
                        <span style={{
                          fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                          background: '#16A34A', color: '#FFFFFF', padding: '3px 8px', borderRadius: 4,
                        }}>
                          ★ Recommended Target (#1 Net Recovery)
                        </span>
                        <h3 style={{ fontSize: 17, fontWeight: 800, margin: '6px 0 2px 0', color: '#14532D' }}>
                          {selectedCropPlan.bestOption.title}
                        </h3>
                        <div style={{ fontSize: 12, color: '#166534' }}>
                          Distance: <strong>{selectedCropPlan.bestOption.distanceKm} km</strong> · Price: <strong>₹{selectedCropPlan.bestOption.pricePerKg}/kg</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#16A34A' }}>
                          ₹{selectedCropPlan.bestOption.expectedNetRecovery.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, color: '#166534' }}>
                          Net Realized (₹{selectedCropPlan.bestOption.netPerKg}/kg)
                        </div>
                      </div>
                    </div>

                    {/* Financial Breakdown Table */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 8,
                      background: '#FFFFFF',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #BBF7D0',
                      marginBottom: 12,
                      fontSize: 12,
                    }}>
                      <div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>Gross Sale</div>
                        <div style={{ fontWeight: 800 }}>₹{selectedCropPlan.bestOption.grossRevenue.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>Transport Cost</div>
                        <div style={{ fontWeight: 800, color: '#DC2626' }}>-₹{selectedCropPlan.bestOption.transportCost.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>Handling Cost</div>
                        <div style={{ fontWeight: 800, color: '#DC2626' }}>-₹{selectedCropPlan.bestOption.handlingCost.toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-text-secondary)' }}>Spoilage Loss</div>
                        <div style={{ fontWeight: 800, color: '#DC2626' }}>-₹{selectedCropPlan.bestOption.spoilageLoss.toLocaleString('en-IN')} ({selectedCropPlan.bestOption.spoilagePct}%)</div>
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: '#166534', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                      {selectedCropPlan.bestOption.rationale}
                    </p>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {selectedCropPlan.bestOption.contactPhone && (
                        <a
                          href={`tel:${selectedCropPlan.bestOption.contactPhone}`}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                        >
                          <Phone size={13} /> Call {selectedCropPlan.bestOption.channelName} ({selectedCropPlan.bestOption.contactPhone})
                        </a>
                      )}
                      <button
                        onClick={() => chooseOption({
                          cycleId: selectedCropPlan.cycleId,
                          optionTitle: selectedCropPlan.bestOption.title,
                          channelName: selectedCropPlan.bestOption.channelName,
                          netRecovery: selectedCropPlan.bestOption.expectedNetRecovery,
                          pricePerKg: selectedCropPlan.bestOption.pricePerKg,
                        })}
                        disabled={isChoosing}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, background: '#16A34A', border: 'none' }}
                      >
                        <Check size={14} /> Lock &amp; Dispatch to this Channel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Section: Split-Sell Rescue Option (if optimal) ── */}
              {selectedCropPlan.splitOption && (
                <div style={{
                  border: '1.5px dashed #7C3AED',
                  borderRadius: 14,
                  padding: '16px 18px',
                  background: '#FAF5FF',
                  marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Scale size={18} color="#7C3AED" />
                      <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#581C87' }}>
                        {selectedCropPlan.splitOption.title}
                      </h4>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#7C3AED' }}>
                      ₹{selectedCropPlan.splitOption.totalNetRecovery.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: '#6B21A8', margin: '0 0 10px 0' }}>
                    {selectedCropPlan.splitOption.rationale}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 12 }}>
                    <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: 8, border: '1px solid #E9D5FF' }}>
                      <strong>{selectedCropPlan.splitOption.buyerPct}% ({selectedCropPlan.splitOption.channel1.quantityKg} kg)</strong> → {selectedCropPlan.splitOption.channel1.name} (₹{selectedCropPlan.splitOption.channel1.pricePerKg}/kg)
                    </div>
                    <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: 8, border: '1px solid #E9D5FF' }}>
                      <strong>{selectedCropPlan.splitOption.mandiPct}% ({selectedCropPlan.splitOption.channel2.quantityKg} kg)</strong> → {selectedCropPlan.splitOption.channel2.name} (₹{selectedCropPlan.splitOption.channel2.pricePerKg}/kg)
                    </div>
                  </div>

                  <button
                    onClick={() => chooseOption({
                      cycleId: selectedCropPlan.cycleId,
                      optionTitle: selectedCropPlan.splitOption.title,
                      channelName: `${selectedCropPlan.splitOption.channel1.name} + ${selectedCropPlan.splitOption.channel2.name}`,
                      netRecovery: selectedCropPlan.splitOption.totalNetRecovery,
                      pricePerKg: selectedCropPlan.splitOption.netPerKg,
                    })}
                    disabled={isChoosing}
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 700, color: '#7C3AED', borderColor: '#C084FC' }}
                  >
                    Execute Split Strategy
                  </button>
                </div>
              )}

              {/* ── Section: Strategy Alternatives ── */}
              {selectedCropPlan.alternatives?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                    Alternative Liquidation Channels
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedCropPlan.alternatives.map((alt) => (
                      <div
                        key={alt.rank}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '12px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                              #{alt.rank}
                            </span>
                            <strong style={{ fontSize: 14 }}>{alt.title}</strong>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                            {alt.distanceKm} km · Price: ₹{alt.pricePerKg}/kg · Transport: -₹{alt.transportCost}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#16A34A' }}>
                              ₹{alt.expectedNetRecovery.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>net return</div>
                          </div>

                          <button
                            onClick={() => chooseOption({
                              cycleId: selectedCropPlan.cycleId,
                              optionTitle: alt.title,
                              channelName: alt.channelName,
                              netRecovery: alt.expectedNetRecovery,
                              pricePerKg: alt.pricePerKg,
                            })}
                            disabled={isChoosing}
                            className="btn btn-secondary btn-sm"
                            style={{ borderRadius: 8, fontSize: 11 }}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              background: '#FAF7F2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              color: '#64748B',
            }}>
              <span>
                Data sources: APMC AGMARKNET Feed · Open-Meteo API · AgriConnect Buyer Demand Network
              </span>
              <button
                onClick={() => setSelectedCropPlan(null)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
