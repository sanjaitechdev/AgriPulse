import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Compass, ShieldAlert, Award, Calendar, 
  MapPin, CheckCircle2, Phone, Sparkles, HelpCircle 
} from 'lucide-react';
import api from '../../lib/api';
import MarketNetback from '../../components/MarketNetback';
import ProfitLeakage from '../../components/ProfitLeakage';
import WhatIfSimulator from '../../components/WhatIfSimulator';
import DataFreshnessBadge from '../../components/DataFreshnessBadge';
import { scenarios } from '../../demo/scenarios';

export default function DecisionResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isDemo = id?.startsWith('demo-');
  const demoKey = isDemo ? id.replace('demo-', '') : null;
  const demoData = isDemo ? scenarios[demoKey] : null;

  // Query actual backend decision if not demo
  const { data: dbResult, isLoading, error } = useQuery({
    queryKey: ['decision', id],
    queryFn: () => api.get(`/ai/decision/${id}`).then(r => r.data.data),
    enabled: !isDemo && !!id
  });

  if (isDemo && !demoData) {
    return (
      <div className="empty-state">
        <Compass size={48} className="empty-state-icon" />
        <p className="empty-state-title">Demo scenario not found</p>
        <Link to="/farmer/sell-decision" className="btn btn-primary">Back</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6">
        <div className="skeleton h-8 w-1/4" />
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-64 w-full rounded-xl" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !isDemo) {
    return (
      <div className="empty-state">
        <ShieldAlert size={48} className="text-danger mb-4" />
        <p className="empty-state-title">Failed to load decision analysis</p>
        <p className="empty-state-desc">{error.response?.data?.message || error.message}</p>
        <Link to="/farmer/sell-decision" className="btn btn-primary">Try Again</Link>
      </div>
    );
  }

  const result = isDemo ? demoData : {
    decision: dbResult,
    markets: dbResult?.markets || [],
    forecast: dbResult?.forecast || {},
    marketSource: dbResult?.marketSource || { isLive: false, source: 'db' },
    weather: dbResult?.weather || {}
  };

  const decision = result.decision;
  if (!decision) return null;

  // Format profit leakage costs
  const costs = decision.profitLeakage 
    ? {
        transport: decision.profitLeakage.find(i => i.name === 'Transport')?.amount || 0,
        handling: decision.profitLeakage.find(i => i.name === 'Handling')?.amount || 0,
        storage: decision.profitLeakage.find(i => i.name === 'Storage')?.amount || 0,
        spoilage: decision.profitLeakage.find(i => i.name === 'Spoilage')?.amount || 0,
      }
    : {
        transport: decision.totalCost * 0.3,
        handling: decision.totalCost * 0.1,
        storage: decision.totalCost * 0.2,
        spoilage: decision.totalCost * 0.4
      };

  return (
    <div className="fade-in max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/farmer/sell-decision')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to inputs
        </button>

        {isDemo ? (
          <span className="badge badge-danger text-xs font-bold">🔴 {t('demo_banner')}</span>
        ) : (
          <DataFreshnessBadge 
            isLive={result.marketSource?.isLive}
            updatedAt={result.marketSource?.dataTimestamp || decision.createdAt}
            source={result.marketSource?.sourceLabel || 'APMC Cache'}
          />
        )}
      </div>

      {/* Hero Recommendation Card */}
      <div 
        className="card card-padding shadow-lg relative overflow-hidden"
        style={{
          border: '1px solid var(--color-primary-200)',
          background: 'linear-gradient(135deg, var(--color-primary-50) 0%, #ffffff 100%)',
          borderRadius: 20
        }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white mb-2">
              <Sparkles size={11} />
              {t('best_decision')}
            </span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {decision.recommendation?.replace(/_/g, ' ')}
            </h2>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-semibold">
              <MapPin size={12} className="text-primary" />
              Best Market: {decision.bestMarket}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="text-xs text-neutral-500 font-semibold">{t('expected_profit')}</div>
            <div className="text-3xl font-black text-primary mt-1">
              ₹{decision.expectedProfit?.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Gross: ₹{decision.expectedRevenue?.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* 3-Column Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
          <div className="text-center p-3 rounded-xl bg-white border border-slate-50">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{t('risk_score')}</div>
            <div className="text-lg font-extrabold text-slate-800 mt-1 capitalize">
              {decision.riskLevel || (decision.riskScore > 50 ? 'High' : 'Low')}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Score: {decision.riskScore}/100</div>
          </div>

          <div className="text-center p-3 rounded-xl bg-white border border-slate-50">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{t('confidence')}</div>
            <div className="text-lg font-extrabold text-slate-800 mt-1">
              {Math.round(decision.confidence * 100)}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Model Reliability</div>
          </div>

          <div className="text-center p-3 rounded-xl bg-white border border-slate-50">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Mandi Price</div>
            <div className="text-lg font-extrabold text-slate-800 mt-1">
              ₹{Math.round(decision.expectedRevenue / (decision.allocation?.[0]?.quantity || 1))}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">per kg modal</div>
          </div>
        </div>

        {/* Why/Rationale Section */}
        <div className="mt-6 p-4 rounded-xl bg-white border border-slate-100 leading-relaxed text-sm text-neutral-700">
          <h4 className="font-bold text-xs text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <HelpCircle size={14} className="text-primary" />
            {t('why_rationale')}
          </h4>
          {decision.explanation}
        </div>
      </div>

      {/* Comparisons Row (Mandi rankings + Profit leakage) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MarketNetback 
          markets={result.markets}
          quantity={decision.allocation?.[0]?.quantity || 1000}
        />

        <ProfitLeakage 
          costs={costs}
          grossRevenue={decision.expectedRevenue}
        />
      </div>

      {/* Buyer Connect Center */}
      <div className="card card-padding" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Award size={20} className="text-primary" />
          {t('buyer_connect')}
        </h3>
        <p className="text-xs text-muted mb-4 leading-relaxed">
          Matching buyer demands sorted by price margin compatibility, delivery window matching, and reliability rating.
        </p>

        <div className="space-y-3">
          {isDemo ? (
            <div className="p-3 border border-slate-100 bg-slate-50 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-bold text-sm">Reliance Fresh Agro</div>
                <div className="text-xs text-muted mt-1">Grade A Tomato · Needs 5,000kg by Saturday</div>
              </div>
              <button className="btn btn-secondary btn-sm flex items-center gap-1">
                <Phone size={12} /> {t('contact_buyer')}
              </button>
            </div>
          ) : (
            <div className="text-xs text-center py-6 text-muted-foreground font-semibold">
              Search listing matches for real-time negotiations on active deals.
            </div>
          )}
        </div>
      </div>

      {/* What-If Simulator */}
      <WhatIfSimulator 
        initialPrice={decision.expectedRevenue / (decision.allocation?.[0]?.quantity || 1000)}
        initialQty={decision.allocation?.[0]?.quantity || 2000}
        initialDistance={50}
        initialStorageType="ambient"
      />
    </div>
  );
}
