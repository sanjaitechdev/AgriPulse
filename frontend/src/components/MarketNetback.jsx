import { useTranslation } from 'react-i18next';
import { MapPin, Info, ArrowUpRight, TrendingUp } from 'lucide-react';

export function MarketNetback({ markets = [], quantity = 1000 }) {
  const { t } = useTranslation();

  return (
    <div className="card card-padding" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: 'var(--color-text)' }}>
        <TrendingUp size={20} className="text-primary" />
        {t('market_comparison')}
      </h3>
      <p className="text-xs text-muted mb-4 leading-relaxed">
        Markets are ranked by **netback return** per kg (Mandi Price minus estimated Transport and Handling). 
        The highest selling price is not always the most profitable due to transport costs.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {markets.map((m, i) => {
          const price = m.currentPricePerKg || m.currentPrice;
          const dist = m.distanceKm || m.distance;
          
          // Estimate transport (₹8/km/tonne)
          const transportCostKg = dist ? (dist * 8) / 1000 : 0;
          const handlingCostKg = 1.5; // Fixed handling fee
          const netbackKg = price - transportCostKg - handlingCostKg;
          
          const totalRevenue = price * quantity;
          const netReturn = netbackKg * quantity;

          return (
            <div 
              key={m.marketName} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3)',
                background: i === 0 ? 'var(--color-primary-50)' : 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: i === 0 ? '1px solid var(--color-primary-200)' : '1px solid var(--color-border)'
              }}
            >
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  {i === 0 && <span className="badge badge-success text-xs">BEST NET RETURN</span>}
                  <span>{m.marketName}</span>
                </div>
                <div className="flex gap-2 mt-1 text-xs text-muted">
                  <span className="flex items-center gap-0.5"><MapPin size={11} /> {m.district || 'Local'}</span>
                  <span>·</span>
                  <span>{dist ? `${dist} km` : 'Distance unknown'}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="font-bold text-sm text-primary">₹{price.toFixed(2)}/kg</div>
                <div className="text-xs text-muted mt-0.5">
                  Est. Net Return: <strong className="text-success font-semibold">₹{netReturn.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-md text-xs text-muted leading-normal flex items-start gap-2">
        <Info size={14} className="text-primary mt-0.5 shrink-0" />
        <div>
          <strong>Transport Estimate Formula:</strong><br />
          Road Distance (Haversine × 1.35 road winding factor) × ₹8 per km per metric tonne. 
          Handling includes standard mandi loading/unloading of ₹1.5/kg.
        </div>
      </div>
    </div>
  );
}
export default MarketNetback;
