import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import useNotificationStore from './store/notificationStore';
import { connectSocket, onSocketEvent } from './lib/socket';
import { toast } from 'react-hot-toast';



// Layouts
import AppShell from './components/layout/AppShell';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OnboardingPage from './pages/auth/OnboardingPage';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerDecisionCenter from './pages/farmer/FarmerDecisionCenter';
import MyCropsPage from './pages/farmer/MyCropsPage';
import MyFarmPage from './pages/farmer/MyFarmPage';
import CropOpportunityPage from './pages/farmer/CropOpportunityPage';
import CropOpportunityResult from './pages/farmer/CropOpportunityResult';
import FarmPlanPage from './pages/farmer/FarmPlanPage';
import WeatherPage from './pages/farmer/WeatherPage';
import MarketPulsePage from './pages/farmer/MarketPulsePage';
import MyListingsPage from './pages/farmer/MyListingsPage';
import CreateListingPage from './pages/farmer/CreateListingPage';
import BuyerMatchesPage from './pages/farmer/BuyerMatchesPage';
import DemandGapPage from './pages/farmer/DemandGapPage';
import RescuePage from './pages/farmer/RescuePage';
import FarmerProfilePage from './pages/farmer/FarmerProfilePage';
import FarmerOrdersPage from './pages/farmer/FarmerOrdersPage';
import FarmerProposalsPage from './pages/farmer/FarmerProposalsPage';
import SellDecisionPage from './pages/farmer/SellDecisionPage';
import DecisionResultPage from './pages/farmer/DecisionResultPage';

// Buyer pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import PostDemandPage from './pages/buyer/PostDemandPage';
import CropSearchPage from './pages/buyer/CropSearchPage';
import BuyerDemandsPage from './pages/buyer/BuyerDemandsPage';
import BuyerProposalsPage from './pages/buyer/BuyerProposalsPage';
import BuyerOrdersPage from './pages/buyer/BuyerOrdersPage';
import BuyerProfilePage from './pages/buyer/BuyerProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDataHealth from './pages/admin/AdminDataHealth';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminRiskAlerts from './pages/admin/AdminRiskAlerts';

// Shared
import NotificationsPage from './pages/shared/NotificationsPage';
import NotFoundPage from './pages/shared/NotFoundPage';

// Route guards
const RequireAuth = ({ children, role }) => {
  const { user } = useAuthStore();
  if (!user || !localStorage.getItem('accessToken')) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
};

const RequireNoAuth = ({ children }) => {
  const { user } = useAuthStore();
  if (user && localStorage.getItem('accessToken')) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
};



export default function App() {
  const { user, fetchMe } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // Restore session on app load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user) fetchMe();
  }, []);

  // Connect socket and listen for global events when user is authenticated
  useEffect(() => {
    if (!user) return;
    const socket = connectSocket(user.id, user.role);

    onSocketEvent('notification:new', (data) => {
      addNotification(data.notification);
      toast(data.notification.title, { icon: '🔔', duration: 4000 });
    });

    onSocketEvent('order:status', (data) => {
      toast(`Order update: ${data.status?.replace(/_/g, ' ')}`, { icon: '📦' });
    });

    onSocketEvent('proposal:new', () => {
      toast('New proposal received!', { icon: '📋' });
    });

    onSocketEvent('risk:alert', (data) => {
      toast.error(`Risk Alert: ${data.message || 'High unsold risk detected'}`, { duration: 6000 });
    });

    return () => {
      // Clean up specific listeners on user change
    };
  }, [user?.id]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={
          user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Navigate to="/login" replace />
        } />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<RequireNoAuth><LoginPage /></RequireNoAuth>} />
          <Route path="/register" element={<RequireNoAuth><RegisterPage /></RequireNoAuth>} />
        </Route>
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

        {/* Farmer routes */}
        <Route path="/farmer" element={<RequireAuth role="farmer"><AppShell role="farmer" /></RequireAuth>}>
          <Route path="dashboard" element={<FarmerDashboard />} />
          <Route path="decision-center" element={<FarmerDecisionCenter />} />
          <Route path="my-crops" element={<MyCropsPage />} />
          <Route path="my-farm" element={<MyFarmPage />} />
          <Route path="sell-decision" element={<SellDecisionPage />} />
          <Route path="sell-decision/result/:id" element={<DecisionResultPage />} />
          <Route path="crop-opportunity" element={<CropOpportunityPage />} />
          <Route path="crop-opportunity/:id" element={<CropOpportunityResult />} />
          <Route path="farm-plan/:cycleId" element={<FarmPlanPage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="market" element={<MarketPulsePage />} />
          <Route path="listings" element={<MyListingsPage />} />
          <Route path="listings/new" element={<CreateListingPage />} />
          <Route path="buyer-matches" element={<BuyerMatchesPage />} />
          <Route path="demand-gap/:cycleId" element={<DemandGapPage />} />
          <Route path="rescue" element={<RescuePage />} />
          <Route path="rescue/:cycleId" element={<RescuePage />} />
          <Route path="proposals" element={<FarmerProposalsPage />} />
          <Route path="orders" element={<FarmerOrdersPage />} />
          <Route path="profile" element={<FarmerProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Buyer routes */}
        <Route path="/buyer" element={<RequireAuth role="buyer"><AppShell role="buyer" /></RequireAuth>}>
          <Route path="dashboard" element={<BuyerDashboard />} />
          <Route path="post-demand" element={<PostDemandPage />} />
          <Route path="search" element={<CropSearchPage />} />
          <Route path="demands" element={<BuyerDemandsPage />} />
          <Route path="proposals" element={<BuyerProposalsPage />} />
          <Route path="orders" element={<BuyerOrdersPage />} />
          <Route path="profile" element={<BuyerProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<RequireAuth role="admin"><AppShell role="admin" /></RequireAuth>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="data-health" element={<AdminDataHealth />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="risk-alerts" element={<AdminRiskAlerts />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
