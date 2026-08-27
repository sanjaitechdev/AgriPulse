// FarmPlanPage — linked from crop cycle planning
import { useParams, Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export default function FarmPlanPage() {
  const { cycleId } = useParams();
  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Farm Plan</h1>
        <p className="page-subtitle">Crop cycle plan for cycle ID: {cycleId}</p>
      </div>
      <div className="card card-padding">
        <div className="empty-state">
          <Sprout size={48} className="empty-state-icon" />
          <p className="empty-state-title">Farm Planning Module</p>
          <p className="empty-state-desc">Detailed week-by-week crop cycle planning will be available here. This page is under active development.</p>
          <Link to="/farmer/dashboard" className="btn btn-primary">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
