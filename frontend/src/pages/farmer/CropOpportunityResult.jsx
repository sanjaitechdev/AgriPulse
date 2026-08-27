import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, ChevronUp, Info, TrendingUp, Droplets, Sprout, BarChart3, AlertCircle, MapPin, Sun, Sparkles, Check, HelpCircle, Languages, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

const translations = {
  en: {
    title: 'Crop Opportunity Results',
    newAnalysis: 'New Analysis',
    farmContext: 'FARM CONTEXT',
    location: 'Location',
    season: 'Current Season',
    soil: 'Soil Context',
    water: 'Water Availability',
    weather: 'Live Weather',
    marketArea: 'Market Region',
    topOpportunities: 'TOP AGRICULTURAL OPPORTUNITIES',
    suitabilityBands: {
      high: 'Highly Suitable (Excellent Match)',
      suitable: 'Suitable (Good Match)',
      moderate: 'Moderately Suitable (Manageable)',
      low: 'Low Suitability (Not Recommended)'
    },
    showAll: 'Show All Evaluated Crops',
    hideLow: 'Hide Low Suitability Crops',
    whyThisCrop: 'WHY THIS CROP?',
    scoreBreakdown: 'Feature Contributions to Opportunity Score',
    positiveFactors: 'Positive Drivers (+)',
    negativeFactors: 'Risk Penalties (-)',
    priceLabel: 'Mandi Price',
    demandLabel: 'Buyer Demand',
    profitLabel: 'Est. Gross Profit',
    yieldLabel: 'Est. Avg Yield',
    marketTrend: 'Mandi Trend',
    noMarket: 'No local mandi data available',
    sourceLabel: 'Source',
    updatedLabel: 'Updated',
    modelLabel: 'AI Model',
    confidenceLabel: 'Recommendation Confidence',
    modelNote: 'Always validate recommendations with local block agricultural extension officers.',
    mismatch: 'Mismatch',
    optimal: 'Optimal'
  },
  te: {
    title: 'పంట అవకాశం ఫలితాలు',
    newAnalysis: 'కొత్త విశ్లేషణ',
    farmContext: 'పొలం సమాచారం',
    location: 'స్థానం',
    season: 'ప్రస్తుత సీజన్',
    soil: 'నేల రకం',
    water: 'నీటి లభ్యత',
    weather: 'లైవ్ వాతావరణం',
    marketArea: 'మార్కెట్ ప్రాంతం',
    topOpportunities: 'అగ్ర పంట అవకాశాలు',
    suitabilityBands: {
      high: 'అత్యంత అనుకూలమైనవి (ఎక్సలెంట్)',
      suitable: 'అనుకూలమైనవి (గుడ్)',
      moderate: 'మితమైన అనుకూలత (మేనేజబుల్)',
      low: 'తక్కువ అనుకూలత (సిఫార్సు చేయబడదు)'
    },
    showAll: 'విశ్లేషించిన అన్ని పంటలను చూపించు',
    hideLow: 'తక్కువ అనుకూలత పంటలను దాచు',
    whyThisCrop: 'ఈ పంటను ఎందుకు ఎంచుకోవాలి?',
    scoreBreakdown: 'అవకాశ స్కోరుకు దోహదపడే అంశాలు',
    positiveFactors: 'అనుకూల అంశాలు (+)',
    negativeFactors: 'ప్రతికూల అంశాలు (-)',
    priceLabel: 'మార్కెట్ ధర',
    demandLabel: 'కొనుగోలుదారుల డిమాండ్',
    profitLabel: 'అంచనా నికర లాభం',
    yieldLabel: 'అంచనా దిగుబడి',
    marketTrend: 'మార్కెట్ ట్రెండ్',
    noMarket: 'స్థానిక మార్కెట్ సమాచారం అందుబాటులో లేదు',
    sourceLabel: 'మూలం',
    updatedLabel: 'నవీకరించబడింది',
    modelLabel: 'AI మోడల్',
    confidenceLabel: 'సిఫార్సు ఖచ్చితత్వం',
    modelNote: 'సిఫార్సులను ఎల్లప్పుడూ మీ ప్రాంతీయ వ్యవసాయ అధికారులతో ధృవీకరించుకోండి.',
    mismatch: 'సరిపోలడం లేదు',
    optimal: 'అనుకూలమైనది'
  }
};

const scoreColor = (score) => {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-primary)';
  if (score >= 40) return 'var(--color-accent)';
  return 'var(--color-text-muted)';
};

const t = translations.en;

export default function CropOpportunityResult() {
  const { id } = useParams();

  // UI state for showing all evaluated crops vs top picks
  const [showAllCrops, setShowAllCrops] = useState(false);
  // Expand crop card details state
  const [expandedCrop, setExpandedCrop] = useState(null);

  const { data: prediction, isLoading, error } = useQuery({
    queryKey: ['crop-prediction', id],
    queryFn: () => api.get(`/ai/crop-opportunity/${id}`).then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div style={{ maxWidth: 840, margin: '0 auto', padding: 20 }}>
        <div className="skeleton" style={{ width: 300, height: 32, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 180, borderRadius: 12, marginBottom: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="empty-state text-center" style={{ padding: 40 }}>
        <AlertCircle size={48} className="empty-state-icon" style={{ color: 'var(--color-danger)', margin: '0 auto 16px' }} />
        <p className="empty-state-title font-bold text-lg">Analysis results not found</p>
        <Link to="/farmer/crop-opportunity" className="btn btn-primary" style={{ marginTop: 16 }}>Try again</Link>
      </div>
    );
  }

  const recs = prediction.recommendations || [];
  const features = prediction.inputFeatures || {};
  const confidence = prediction.recommendations?.[0]?.confidence || 'Moderate';

  // Group recommendations into suitability bands
  const bands = {
    high: recs.filter(r => r.marketOpportunity >= 80),
    suitable: recs.filter(r => r.marketOpportunity >= 65 && r.marketOpportunity < 80),
    moderate: recs.filter(r => r.marketOpportunity >= 45 && r.marketOpportunity < 65),
    low: recs.filter(r => r.marketOpportunity < 45)
  };

  const handleToggleExpand = (cropName) => {
    if (expandedCrop === cropName) {
      setExpandedCrop(null);
    } else {
      setExpandedCrop(cropName);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-primary-600)' }}>
            <Sparkles size={28} /> {t.title}
          </h1>
          <p className="page-subtitle text-xs text-muted">
            {t.modelLabel}: <strong>{prediction.modelVersion}</strong> · {t.confidenceLabel}: <strong style={{ color: confidence === 'High' ? 'var(--color-success)' : 'orange' }}>{confidence}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/farmer/crop-opportunity" className="btn btn-secondary btn-sm">{t.newAnalysis}</Link>
        </div>
      </div>

      {/* FARM CONTEXT SECTION */}
      <div className="card glass" style={{ border: '1px solid var(--color-surface-3)', borderRadius: 16, marginBottom: 'var(--space-6)', padding: 'var(--space-5)', background: 'var(--color-surface-2)' }}>
        <h3 className="text-xs font-bold text-primary" style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>{t.farmContext}</h3>
        <div className="grid-3 gap-4 text-xs">
          <div>
            <div className="text-muted font-semibold">{t.location}</div>
            <div className="font-bold text-sm" style={{ marginTop: 2 }}>{features.district}, {features.state}</div>
          </div>
          <div>
            <div className="text-muted font-semibold">{t.season}</div>
            <div className="font-bold text-sm" style={{ marginTop: 2, textTransform: 'capitalize' }}>{features.season}</div>
          </div>
          <div>
            <div className="text-muted font-semibold">{t.soil}</div>
            <div className="font-bold text-sm" style={{ marginTop: 2, textTransform: 'capitalize' }}>{features.soilType} ({features.hasSoilTest ? 'Soil Lab Test' : 'Regional Estimate'})</div>
          </div>
          <div>
            <div className="text-muted font-semibold">{t.water}</div>
            <div className="font-bold text-sm" style={{ marginTop: 2, textTransform: 'capitalize' }}>{features.waterAvailability}</div>
          </div>
          <div>
            <div className="text-muted font-semibold">{t.weather}</div>
            <div className="font-bold text-sm" style={{ marginTop: 2 }}>{features.temperature}°C · H: {features.humidity}%</div>
          </div>
          <div>
            <div className="text-muted font-semibold">{t.marketArea}</div>
            <div className="font-bold text-sm" style={{ marginTop: 2 }}>{features.district} Region</div>
          </div>
        </div>
      </div>

      {/* RATING OPPORTUNITIES LIST */}
      <h2 className="font-bold text-md text-primary" style={{ letterSpacing: 0.5, marginBottom: 'var(--space-4)' }}>{t.topOpportunities}</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* HIGH BAND */}
        {bands.high.length > 0 && (
          <div>
            <div className="text-xs font-bold text-success" style={{ marginBottom: 8, textTransform: 'uppercase' }}>{t.suitabilityBands.high}</div>
            <div className="flex flex-col gap-3">
              {bands.high.map((rec) => (
                <CropRow key={rec.cropName} rec={rec} expanded={expandedCrop === rec.cropName} onToggle={() => handleToggleExpand(rec.cropName)} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* SUITABLE BAND */}
        {bands.suitable.length > 0 && (
          <div>
            <div className="text-xs font-bold text-primary" style={{ marginBottom: 8, textTransform: 'uppercase' }}>{t.suitabilityBands.suitable}</div>
            <div className="flex flex-col gap-3">
              {bands.suitable.map((rec) => (
                <CropRow key={rec.cropName} rec={rec} expanded={expandedCrop === rec.cropName} onToggle={() => handleToggleExpand(rec.cropName)} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* MODERATE BAND */}
        {bands.moderate.length > 0 && (
          <div>
            <div className="text-xs font-bold text-accent" style={{ marginBottom: 8, textTransform: 'uppercase' }}>{t.suitabilityBands.moderate}</div>
            <div className="flex flex-col gap-3">
              {bands.moderate.map((rec) => (
                <CropRow key={rec.cropName} rec={rec} expanded={expandedCrop === rec.cropName} onToggle={() => handleToggleExpand(rec.cropName)} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* LOW/UNSUITABLE BAND */}
        {(showAllCrops && bands.low.length > 0) && (
          <div>
            <div className="text-xs font-bold text-muted" style={{ marginBottom: 8, textTransform: 'uppercase' }}>{t.suitabilityBands.low}</div>
            <div className="flex flex-col gap-3">
              {bands.low.map((rec) => (
                <CropRow key={rec.cropName} rec={rec} expanded={expandedCrop === rec.cropName} onToggle={() => handleToggleExpand(rec.cropName)} t={t} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Show all evaluated crops toggle */}
      {bands.low.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button 
            onClick={() => setShowAllCrops(!showAllCrops)}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 8 }}
          >
            {showAllCrops ? t.hideLow : t.showAll}
          </button>
        </div>
      )}

      {/* Disclaimers & Freshness Info */}
      <div style={{ marginTop: 40, borderTop: '1px solid var(--color-surface-3)', paddingTop: 20, textAlign: 'center' }}>
        <p className="text-xs text-muted" style={{ display: 'flex', items: 'center', justify: 'center', gap: 6 }}>
          <Info size={14} className="text-primary" /> {t.modelNote}
        </p>
        <p className="text-xs text-muted" style={{ marginTop: 8 }}>
          {t.sourceLabel}: Open-Meteo & APMC Agmarknet daily sync · {t.updatedLabel}: {new Date(prediction.computedAt).toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  );
}

// Inner Component for Crop Row Card
function CropRow({ rec, expanded, onToggle, t }) {
  // Score metrics
  const isHigh = rec.marketOpportunity >= 80;
  const isLow = rec.marketOpportunity < 45;

  return (
    <div className="card glass slide-up" style={{ border: `1px solid ${expanded ? 'var(--color-primary-300)' : 'var(--color-surface-3)'}`, borderRadius: 12, overflow: 'hidden', boxShadow: expanded ? '0 4px 20px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.25s' }}>
      <div onClick={onToggle} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expanded ? 'var(--color-primary-50)' : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, background: isHigh ? 'var(--color-success-100)' : isLow ? 'var(--color-accent-100)' : 'var(--color-primary-100)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={20} color={isHigh ? 'var(--color-success-600)' : isLow ? 'orange' : 'var(--color-primary-600)'} />
          </div>
          <div>
            <div className="font-bold text-md flex items-center gap-2">
              {rec.cropName}
              {rec.localNames?.en && (
                <span className="text-xs text-muted font-normal">({rec.localNames.en})</span>
              )}
            </div>
            <div className="flex gap-4 text-xs text-muted" style={{ marginTop: 2 }}>
              <span>{t.priceLabel}: <strong style={{ color: 'var(--color-text-primary)' }}>₹{rec.marketPrice ? `${rec.marketPrice.modalPrice}/q` : '2,200/q'}</strong></span>
              <span>{t.demandLabel}: <strong style={{ color: rec.demandOutlook === 'strong' ? 'var(--color-success)' : 'var(--color-text-primary)' }}>{rec.demandOutlook?.toUpperCase()}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="text-center">
            <div className="text-xs text-muted" style={{ fontSize: 9 }}>OPPORTUNITY</div>
            <div className="font-extrabold text-lg" style={{ color: scoreColor(rec.marketOpportunity) }}>
              {rec.marketOpportunity}<span className="text-xs font-normal text-muted">/100</span>
            </div>
          </div>
          {expanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
        </div>
      </div>

      {/* Expandable Details Area */}
      {expanded && (
        <div className="fade-in" style={{ padding: '20px', borderTop: '1px solid var(--color-surface-3)', background: 'var(--color-surface)' }}>
          {/* Detailed explanations & model explanation */}
          <div className="alert alert-info" style={{ display: 'flex', gap: 10, borderRadius: 8, marginBottom: 20 }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            <p className="text-xs" style={{ margin: 0, lineHeight: 1.4 }}>{rec.humanExplanation}</p>
          </div>

          <div className="grid-2 gap-6">
            {/* Left Column: Mandi Prices & Demand */}
            <div className="flex flex-col gap-3">
              <h4 className="font-bold text-xs text-primary" style={{ letterSpacing: 0.5 }}>MARKET DATA</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-surface-2)', padding: 12, borderRadius: 8 }}>
                <div className="flex justify-between text-xs">
                  <span>{t.priceLabel}:</span>
                  <span className="font-bold">₹{rec.marketPrice ? `${rec.marketPrice.modalPrice}/q` : '₹2,200/q'}</span>
                </div>
                {rec.marketPrice && (
                  <div className="text-xs text-muted" style={{ fontSize: 10, marginTop: -4 }}>
                    ({rec.marketPrice.market} Mandi Price)
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span>{t.marketTrend}:</span>
                  <span className="font-bold text-success" style={{ textTransform: 'capitalize' }}>{rec.priceOutlook}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{t.demandLabel}:</span>
                  <span className="font-bold" style={{ textTransform: 'capitalize' }}>{rec.demandOutlook} ({rec.activeBuyerDemands} buyers)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>{t.yieldLabel}:</span>
                  <span className="font-bold">{rec.estimatedYield?.toLocaleString()} kg/acre</span>
                </div>
                <div className="flex justify-between text-xs" style={{ borderTop: '1px solid var(--color-surface-3)', paddingTop: 6 }}>
                  <span className="font-bold">{t.profitLabel}:</span>
                  <span className="font-extrabold text-success">₹{rec.estimatedProfitability?.toLocaleString()}/acre</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Link to="/farmer/market" className="btn btn-secondary btn-xs flex-1 flex items-center justify-center gap-1">
                  <TrendingUp size={12} /> Live Markets
                </Link>
                <Link to="/farmer/listings/new" className="btn btn-primary btn-xs flex-1 flex items-center justify-center gap-1">
                  Plan Crop <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            {/* Right Column: Dynamic Feature Waterfall contributions */}
            <div>
              <h4 className="font-bold text-xs text-primary" style={{ letterSpacing: 0.5, marginBottom: 10 }}>{t.scoreBreakdown}</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rec.components.map((comp) => {
                  const percent = Math.round((comp.score / comp.maxScore) * 100);
                  const isBad = percent < 50;

                  return (
                    <div key={comp.name}>
                      <div className="flex justify-between text-xs" style={{ marginBottom: 4 }}>
                        <span className="font-semibold">{comp.name}</span>
                        <span className="font-bold" style={{ color: isBad ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                          {comp.score}/{comp.maxScore}
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--color-surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percent}%`, background: isBad ? 'var(--color-danger)' : (percent >= 80 ? 'var(--color-success)' : 'var(--color-primary)') }} />
                      </div>
                      {comp.explanation && (
                        <div className="text-muted" style={{ fontSize: 9, marginTop: 2 }}>{comp.explanation}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
