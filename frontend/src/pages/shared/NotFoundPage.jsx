import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-2)' }}>
      <div className="empty-state">
        <div style={{ fontSize: 72, marginBottom: 'var(--space-4)' }}>🌾</div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>404</h1>
        <p className="empty-state-title">Page Not Found</p>
        <p className="empty-state-desc">The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn btn-primary"><Home size={16} /> Back to Home</Link>
      </div>
    </div>
  );
}
