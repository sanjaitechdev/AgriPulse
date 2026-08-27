import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Sprout, TrendingUp, ShoppingCart,
  Users, FileText, AlertTriangle, Zap, Bell, User, LogOut,
  Menu, X, Search, Plus, Shield,
  Database, ClipboardList, Globe, MapPin, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';

export default function AppShell({ role }) {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const farmerNav = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/farmer/dashboard' },
    { label: 'Decision Center', icon: Zap, to: '/farmer/decision-center' },
    { label: 'My Crops', icon: Sprout, to: '/farmer/my-crops' },
    { label: 'My Farm', icon: MapPin, to: '/farmer/my-farm' },
    { label: 'Market Intelligence', icon: TrendingUp, to: '/farmer/market' },
    { label: 'Buyer Connect', icon: Users, to: '/farmer/buyer-matches' },
    { label: 'Rescue Distress', icon: AlertTriangle, to: '/farmer/rescue' },
    { label: 'Settings', icon: Globe, to: '/farmer/profile' },
  ];

  const buyerNav = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/buyer/dashboard' },
    { label: 'Post Demand', icon: Plus, to: '/buyer/post-demand' },
    { label: 'Search Crops', icon: Search, to: '/buyer/search' },
    { label: 'My Demands', icon: ClipboardList, to: '/buyer/demands' },
    { label: 'Proposals', icon: FileText, to: '/buyer/proposals' },
    { label: 'Orders', icon: ShoppingCart, to: '/buyer/orders' },
    { section: 'Account' },
    { label: 'Notifications', icon: Bell, to: '/buyer/notifications', badge: 'notif' },
    { label: 'Profile', icon: User, to: '/buyer/profile' },
  ];

  const adminNav = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Users', icon: Users, to: '/admin/users' },
    { label: 'Orders', icon: ShoppingCart, to: '/admin/orders' },
    { section: 'Monitoring' },
    { label: 'Risk Alerts', icon: AlertTriangle, to: '/admin/risk-alerts', badge: 'risk' },
    { label: 'Data Health', icon: Database, to: '/admin/data-health' },
    { label: 'Audit Logs', icon: Shield, to: '/admin/audit-logs' },
    { section: 'Account' },
    { label: 'Notifications', icon: Bell, to: '/admin/notifications', badge: 'notif' },
  ];

  const navMap = { farmer: farmerNav, buyer: buyerNav, admin: adminNav };
  const navItems = navMap[role] || [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (role === 'farmer') {
      navigate(`/farmer/market?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/buyer/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 14px', boxSizing: 'border-box' }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 16px', borderBottom: '1px solid #EAEFEA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: '#234D35', color: '#FAF7F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16,
            boxShadow: '0 2px 8px rgba(35, 77, 53, 0.25)',
          }}>
            AC
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1C3624', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              AgriConnect
            </div>
            <div style={{ fontSize: 11, color: '#5C6656', fontWeight: 600 }}>
              {role === 'farmer' ? '🌱 Farmer Hub' : role === 'buyer' ? '🏢 Buyer Portal' : '⚡ Admin Panel'}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Action Button (Unstop Style) */}
      <div style={{ margin: '14px 0 10px' }}>
        {role === 'farmer' ? (
          <NavLink
            to="/farmer/listings/new"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '10px 14px', borderRadius: 9999,
              border: '1.5px solid #234D35', background: '#F2F8F4',
              color: '#234D35', fontWeight: 800, fontSize: 13, textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(35, 77, 53, 0.08)', transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} /> + Post Harvest Lot
          </NavLink>
        ) : (
          <NavLink
            to="/buyer/post-demand"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '10px 14px', borderRadius: 9999,
              border: '1.5px solid #234D35', background: '#F2F8F4',
              color: '#234D35', fontWeight: 800, fontSize: 13, textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(35, 77, 53, 0.08)', transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} /> + Post Bulk Demand
          </NavLink>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
        {navItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} style={{ fontSize: 10, fontWeight: 800, color: '#9AA593', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 10px 4px' }}>
                {item.section}
              </div>
            );
          }
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.to);
          const badgeCount = item.badge === 'notif' ? unreadCount : 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 12px',
                borderRadius: 12,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#234D35' : '#475443',
                background: isActive ? '#EAF3EC' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={17} color={isActive ? '#234D35' : '#6A7663'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badgeCount > 0 && (
                <span style={{ background: '#DC2626', color: '#FFFFFF', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 9999 }}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Helper Card (Unstop Style) */}
      <div style={{
        marginTop: 10, padding: 12, borderRadius: 14,
        background: '#FAF8F5', border: '1px solid #EAE5D9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#1C3624', marginBottom: 2 }}>
          <HelpCircle size={14} color="#234D35" /> Need Sourcing Support?
        </div>
        <div style={{ fontSize: 11, color: '#6A7663', marginBottom: 8 }}>
          Talk to our APMC mandi logistics specialist.
        </div>
        <a
          href="tel:18001024444"
          style={{
            display: 'block', textAlign: 'center', padding: '5px 8px', borderRadius: 8,
            background: '#FFFFFF', border: '1px solid #D6CEBE', color: '#234D35',
            fontSize: 11, fontWeight: 700, textDecoration: 'none',
          }}
        >
          Call Toll-Free Helpline
        </a>
      </div>

      {/* User profile footer */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #EAEFEA' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#234D35', color: '#FAF7F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
            border: '2px solid #E2E8F0',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1C3624', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: '#6A7663', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF',
            color: '#6A7663', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      background: '#EFF3F8',
      minHeight: '100vh',
      display: 'flex',
      boxSizing: 'border-box',
    }}>
      
      {/* ── Desktop Floating Island Sidebar (Unstop Rounded Borders) ── */}
      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: 250,
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
          margin: '12px 0 12px 12px',
          height: 'calc(100vh - 24px)',
          position: 'sticky',
          top: 12,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
        />
      )}

      {/* ── Main Canvas Floating Card Container (Unstop Rounded Canvas) ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        margin: '12px 12px 12px 12px',
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 24px)',
      }}>
        
        {/* ── Top Navbar (Unstop Style Search & Action Bar) ── */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          height: 64,
          background: '#FFFFFF',
          borderBottom: '1px solid #F1F5F9',
          gap: 16,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
            id="mobile-menu-btn"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Center Pill Search Bar (Unstop Search Pill) */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: 1,
              maxWidth: 480,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: 16, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search crops, mandis, commodity prices, buyers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 16px 9px 40px',
                borderRadius: 9999,
                border: '1.5px solid #234D35',
                background: '#FFFFFF',
                fontSize: 13,
                color: '#1E293B',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 1px 4px rgba(35, 77, 53, 0.06)',
              }}
            />
          </form>

          {/* Right Action Icons & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            
            {/* Live Data Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F0FDF4', color: '#166534', padding: '5px 12px',
              borderRadius: 9999, fontSize: 12, fontWeight: 700,
              border: '1px solid #DCFCE7',
            }}>
              <CheckCircle2 size={14} color="#16A34A" />
              <span>APMC Live Pulse</span>
            </div>

            {/* Notification Bell Pill */}
            <NavLink
              to={`/${role}/notifications`}
              style={{
                position: 'relative', width: 38, height: 38, borderRadius: '50%',
                border: '1px solid #E2E8F0', background: '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', textDecoration: 'none',
              }}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                  borderRadius: '50%', background: '#EF4444',
                }} />
              )}
            </NavLink>

            {/* Profile Pill */}
            <NavLink
              to={`/${role}/profile`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 12px 4px 6px', borderRadius: 9999,
                border: '1px solid #E2E8F0', background: '#F8FAFC',
                textDecoration: 'none', color: '#1E293B',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#234D35', color: '#FAF7F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{user?.name?.split(' ')[0]}</span>
            </NavLink>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: 38, height: 38, borderRadius: '50%', border: '1px solid #E2E8F0',
                background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748B', cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* ── Main Scrollable Page Area ── */}
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', background: '#FFFFFF' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .sidebar {
            position: fixed !important;
            left: -280px;
            top: 0 !important;
            margin: 0 !important;
            height: 100vh !important;
            border-radius: 0 !important;
            transition: left 0.25s ease;
          }
          .sidebar.open {
            left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
