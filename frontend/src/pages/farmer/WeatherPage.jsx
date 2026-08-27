import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CloudSun, Droplets, Wind, Thermometer, AlertTriangle, CheckCircle2, Info, Sun, CloudRain } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

const WMO_CODES = {
  0: { label: 'Clear sky', icon: '☀️' }, 1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' }, 3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' }, 48: { label: 'Icy fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' }, 61: { label: 'Light rain', icon: '🌧️' },
  63: { label: 'Moderate rain', icon: '🌧️' }, 65: { label: 'Heavy rain', icon: '⛈️' },
  80: { label: 'Rain showers', icon: '🌦️' }, 95: { label: 'Thunderstorm', icon: '⛈️' },
};

const alertColors = { warning: 'alert-warning', info: 'alert-info', critical: 'alert-danger' };
const alertIcons = { warning: AlertTriangle, info: Info, critical: AlertTriangle };

export default function WeatherPage() {
  const { user } = useAuthStore();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['farmer-profile'],
    queryFn: () => api.get('/farmer/profile').then((r) => r.data.data),
  });

  const coords = profile && profile.location?.coordinates && profile.location.coordinates[0] !== 0 ? {
    lat: profile.location.coordinates[1],
    lon: profile.location.coordinates[0],
    district: profile.district,
    state: profile.state
  } : null;

  const { data: current, isLoading: loadingCurrent, error: errorCurrent } = useQuery({
    queryKey: ['weather-current', coords],
    queryFn: () => api.get(`/weather/current?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.data.data),
    refetchInterval: 30 * 60 * 1000,
    enabled: !!coords,
  });

  const { data: forecast, isLoading: loadingForecast } = useQuery({
    queryKey: ['weather-forecast', coords],
    queryFn: () => api.get(`/weather/forecast?lat=${coords.lat}&lon=${coords.lon}&days=7`).then((r) => r.data.data),
    refetchInterval: 60 * 60 * 1000,
    enabled: !!coords,
  });

  const { data: advisories } = useQuery({
    queryKey: ['weather-advisories', coords],
    queryFn: () => api.get(`/weather/advisories?lat=${coords.lat}&lon=${coords.lon}`).then((r) => r.data.data),
    enabled: !!coords,
  });

  if (loadingProfile) {
    return <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />;
  }

  if (!coords) {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">Weather Intelligence</h1></div>
        <div className="alert alert-warning">
          <AlertTriangle size={16} />
          <div>
            <strong>Farm location not set</strong>
            <div style={{ marginTop: 4, fontSize: 'var(--text-xs)' }}>Please configure your farm location in Profile or Crop Opportunity page first.</div>
          </div>
        </div>
      </div>
    );
  }

  if (errorCurrent) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Weather Intelligence</h1></div>
        <div className="alert alert-warning">
          <AlertTriangle size={16} />
          Weather data temporarily unavailable. Please try again later.
        </div>
      </div>
    );
  }

  const currentWeather = current?.current || {};
  const wmoCode = currentWeather.weathercode || 0;
  const weatherInfo = WMO_CODES[wmoCode] || { label: 'Unknown', icon: '🌡️' };

  const dailyData = forecast?.daily || {};
  const forecastDays = (dailyData.time || []).map((date, i) => ({
    date: new Date(date),
    code: dailyData.weathercode?.[i],
    tempMax: dailyData.temperature_2m_max?.[i],
    tempMin: dailyData.temperature_2m_min?.[i],
    rain: dailyData.precipitation_sum?.[i],
    rainProb: dailyData.precipitation_probability_max?.[i],
  }));

  return (
    <div className="fade-in">
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Weather Intelligence</h1>
          <p className="page-subtitle">
            Farm-specific weather with agricultural advisories ·{' '}
            {current && (
              <span className="data-freshness" style={{ display: 'inline-flex' }}>
                <span className="freshness-dot" />
                Updated {new Date(current.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Current conditions */}
      {loadingCurrent ? (
        <div className="skeleton" style={{ height: 180, borderRadius: 12, marginBottom: 'var(--space-5)' }} />
      ) : (
        <div className="card card-padding" style={{ marginBottom: 'var(--space-5)', background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)', border: 'none', color: 'white' }}>
          <div className="flex justify-between items-start">
            <div>
              <div style={{ fontSize: 64, lineHeight: 1 }}>{weatherInfo.icon}</div>
              <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, marginTop: 'var(--space-2)', color: 'white' }}>
                {Math.round(currentWeather.temperature_2m ?? currentWeather.temperature ?? 0)}°C
              </div>
              <div style={{ fontSize: 'var(--text-lg)', color: 'rgba(255,255,255,0.85)', marginTop: 'var(--space-1)' }}>
                {weatherInfo.label}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
              {[
                { icon: Droplets, label: 'Humidity', val: `${Math.round(currentWeather.relative_humidity_2m ?? 0)}%` },
                { icon: Wind, label: 'Wind', val: `${Math.round(currentWeather.windspeed_10m ?? 0)} km/h` },
                { icon: CloudRain, label: 'Precipitation', val: `${currentWeather.precipitation ?? 0} mm` },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={14} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.7)' }}>{label}:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'white' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span>Source: Open-Meteo</span>
            <span>·</span>
            <span>Real-time data</span>
            <span>·</span>
            <span>Lat {coords.lat.toFixed(2)}, Lon {coords.lon.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Agricultural advisories */}
      {advisories?.advisories?.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-header">
            <h3 className="font-semibold">🌾 Farm Advisories</h3>
            <span className="data-freshness">
              <span className="freshness-dot" />
              Generated {new Date(advisories.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {advisories.advisories.map((adv, i) => {
              const AlertIcon = alertIcons[adv.type] || Info;
              return (
                <div key={i} className={`alert ${alertColors[adv.type] || 'alert-info'}`}>
                  <AlertIcon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>{adv.message}</strong>
                    {adv.action && <div style={{ marginTop: 4, fontSize: 'var(--text-xs)', opacity: 0.85 }}>Action: {adv.action}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      {loadingForecast ? (
        <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
      ) : (
        <div className="card">
          <div className="card-header"><h3 className="font-semibold">7-Day Forecast</h3></div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 0 }}>
            {forecastDays.map((day, i) => {
              const info = WMO_CODES[day.code] || { icon: '🌡️', label: '' };
              const isToday = i === 0;
              return (
                <div key={i} style={{
                  flex: '0 0 auto', minWidth: 100,
                  padding: 'var(--space-4) var(--space-3)',
                  textAlign: 'center',
                  borderRight: i < forecastDays.length - 1 ? '1px solid var(--color-surface-3)' : 'none',
                  background: isToday ? 'var(--color-primary-50)' : 'transparent',
                }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {isToday ? 'Today' : day.date.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: 28, margin: 'var(--space-2) 0' }}>{info.icon}</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{Math.round(day.tempMax)}°</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{Math.round(day.tempMin)}°</div>
                  {day.rainProb > 0 && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-info)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <Droplets size={10} /> {day.rainProb}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
