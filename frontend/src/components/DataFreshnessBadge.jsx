import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export function DataFreshnessBadge({ isLive, updatedAt, source }) {
  const { t } = useTranslation();
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!updatedAt) return;
    const calculateTime = () => {
      const diffMs = Date.now() - new Date(updatedAt).getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 1) setTimeAgo('Just now');
      else if (diffMins < 60) setTimeAgo(`${diffMins}m ago`);
      else if (diffHours < 24) setTimeAgo(`${diffHours}h ago`);
      else setTimeAgo(`${diffDays}d ago`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  if (isLive) {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        {t('live_indicator')} · {timeAgo} · {source || 'APMC'}
      </span>
    );
  }

  if (updatedAt) {
    const ageHrs = (Date.now() - new Date(updatedAt).getTime()) / 3600000;
    const isStale = ageHrs > 24;

    if (isStale) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
          <Clock size={12} />
          {t('stale_indicator')} · {timeAgo} · {source || 'Cache'}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral/15 text-neutral-600 border border-neutral/20">
        <CheckCircle2 size={12} className="text-neutral-500" />
        {t('live_indicator')} · {timeAgo} · {source || 'APMC Cache'}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
      <AlertTriangle size={12} />
      {t('unavailable_indicator')}
    </span>
  );
}
export default DataFreshnessBadge;
