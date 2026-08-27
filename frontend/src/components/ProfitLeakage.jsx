import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingDown } from 'lucide-react';

export function ProfitLeakage({ costs = {}, grossRevenue = 0 }) {
  const { t } = useTranslation();

  const transport = costs.transport || 0;
  const handling = costs.handling || 0;
  const storage = costs.storage || 0;
  const spoilage = costs.spoilage || 0;
  const totalCost = transport + handling + storage + spoilage;

  const getPercent = (amount) => {
    if (!grossRevenue) return 0;
    return Math.round((amount / grossRevenue) * 100);
  };

  const leakageItems = [
    { name: t('transport'), amount: transport, color: 'bg-red-500' },
    { name: t('handling'), amount: handling, color: 'bg-orange-500' },
    { name: t('storage'), amount: storage, color: 'bg-blue-500' },
    { name: t('spoilage'), amount: spoilage, color: 'bg-amber-600' }
  ].filter(item => item.amount > 0);

  return (
    <div className="card card-padding" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: 'var(--color-text)' }}>
        <TrendingDown size={20} className="text-danger" />
        {t('profit_leakage')}
      </h3>
      <p className="text-xs text-muted mb-4 leading-relaxed">
        This chart details what share of your gross market returns is lost to transport, storage, and waste.
      </p>

      {totalCost > 0 ? (
        <div>
          {/* Progress Bar Stack */}
          <div className="h-4 w-full flex rounded-full overflow-hidden bg-slate-100 mb-6">
            {leakageItems.map((item) => (
              <div 
                key={item.name}
                className={item.color}
                style={{ width: `${getPercent(item.amount)}%` }}
                title={`${item.name}: ₹${item.amount.toLocaleString('en-IN')}`}
              />
            ))}
          </div>

          {/* Legend Table */}
          <div className="grid-2 gap-4">
            {leakageItems.map((item) => (
              <div key={item.name} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-50 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-neutral-700 font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-neutral-800">₹{item.amount.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-muted mt-0.5">{getPercent(item.amount)}% of returns</div>
                </div>
              </div>
            ))}
          </div>

          {spoilage > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md text-xs text-amber-800 leading-normal flex gap-2">
          <div>
            <strong>Spoilage Alert:</strong> Storing crops introduces quality degradation and decay risk. Ensure cold storage or ventilation is used.
          </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-center py-6 text-muted font-medium">
          No costs predicted for this strategy. Net returns equal gross revenue.
        </div>
      )}
    </div>
  );
}
export default ProfitLeakage;
