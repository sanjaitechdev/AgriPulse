import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Sprout, TrendingUp, ShoppingCart,
  Users, FileText, AlertTriangle, Zap, Bell, User, LogOut,
  Menu, X, Search, Plus, Shield,
  Database, ClipboardList, Globe, MapPin, CheckCircle2, ChevronRight, HelpCircle, ArrowRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';

export default function AppShell({ role }) {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Close drawer & mobile search on navigation
  useEffect(() => {
    setDrawerOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // ── Navigation Mapping ─────────────────────────────────────────────────────
  const farmerNav = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/farmer/dashboard' },
    { label: 'Decision Center', icon: Zap, to: '/farmer/decision-center' },
    { label: 'My Crops', icon: Sprout, to: '/farmer/my-crops' },
    { label: 'My Farm', icon: MapPin, to: '/farmer/my-farm' },
    { label: 'Market Intelligence', icon: TrendingUp, to: '/farmer/market' },
    { label: 'Buyer Connect', icon: Users, to: '/farmer/buyer-matches' },
    { label: 'Rescue Distress', icon: AlertTriangle, to: '/farmer/rescue', badge: 'rescue' },
    { section: 'Account & Settings' },
    { label: 'Proposals & Contracts', icon: FileText, to: '/farmer/proposals' },
    { label: 'Orders & Settlements', icon: ShoppingCart, to: '/farmer/orders' },
    { label: 'Settings & Profile', icon: Globe, to: '/farmer/profile' },
  ];

  // Mobile Bottom Bar primary 5-6 icons
  const farmerMobileBottomNav = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/farmer/dashboard' },
    { label: 'Decision', icon: Zap, to: '/farmer/decision-center' },
    { label: 'Crops', icon: Sprout, to: '/farmer/my-crops' },
    { label: 'Market', icon: TrendingUp, to: '/farmer/market' },
    { label: 'Buyers', icon: Users, to: '/farmer/buyer-matches' },
    { label: 'Rescue', icon: AlertTriangle, to: '/farmer/rescue', isRescue: true },
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

  const buyerMobileBottomNav = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/buyer/dashboard' },
    { label: 'Post Demand', icon: Plus, to: '/buyer/post-demand' },
    { label: 'Search', icon: Search, to: '/buyer/search' },
    { label: 'Demands', icon: ClipboardList, to: '/buyer/demands' },
    { label: 'Orders', icon: ShoppingCart, to: '/buyer/orders' },
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
  const bottomNavMap = { farmer: farmerMobileBottomNav, buyer: buyerMobileBottomNav, admin: [] };

  const navItems = navMap[role] || [];
  const bottomNavItems = bottomNavMap[role] || [];

  // Determine current page title
  const currentNav = navItems.find((n) => n.to && location.pathname.startsWith(n.to));
  const pageTitle = currentNav?.label || (role === 'farmer' ? 'Farmer Hub' : 'AgriPulse');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setMobileSearchOpen(false);
    if (role === 'farmer') {
      navigate(`/farmer/market?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/buyer/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div style={{
      background: '#EFF3F8',
      minHeight: '100vh',
      display: 'flex',
      boxSizing: 'border-box',
      maxWidth: '100vw',
      overflowX: 'hidden',
    }}>
      
      {/* ── Desktop Floating Sidebar ── */}
      <aside
        className="sidebar desktop-sidebar"
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

          {/* Quick Action Button */}
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 12px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? (item.badge === 'rescue' ? '#B91C1C' : '#234D35') : '#475443',
                    background: isActive ? (item.badge === 'rescue' ? '#FEF2F2' : '#EAF3EC') : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={17} color={isActive ? (item.badge === 'rescue' ? '#DC2626' : '#234D35') : '#6A7663'} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge === 'rescue' && (
                    <span style={{ background: '#DC2626', color: '#FFFFFF', fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 9999 }}>
                      LIVE
                    </span>
                  )}
                  {badgeCount > 0 && (
                    <span style={{ background: '#DC2626', color: '#FFFFFF', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 9999 }}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

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
      </aside>

      {/* ── Slide-Out Mobile Drawer Menu ── */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(2px)',
              zIndex: 1100,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '82%',
              maxWidth: 320,
              background: '#FFFFFF',
              zIndex: 1101,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
              padding: '16px 16px env(safe-area-inset-bottom, 16px) 16px',
              boxSizing: 'border-box',
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#234D35', color: '#FAF7F2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 15,
                }}>
                  AC
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1C3624' }}>AgriPulse AI</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{user?.name || 'Farmer Portal'}</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Navigation List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navItems.map((item, i) => {
                if (item.section) {
                  return (
                    <div key={i} style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', padding: '12px 10px 4px' }}>
                      {item.section}
                    </div>
                  );
                }
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 14px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#234D35' : '#334155',
                      background: isActive ? '#F0FDF4' : 'transparent',
                    }}
                  >
                    <Icon size={18} color={isActive ? '#16A34A' : '#64748B'} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge === 'rescue' && (
                      <span style={{ background: '#DC2626', color: '#FFFFFF', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 9999 }}>
                        RADAR
                      </span>
                    )}
                    <ChevronRight size={14} color="#CBD5E1" />
                  </NavLink>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div style={{ paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px',
                  borderRadius: 10,
                  border: '1.5px solid #FEE2E2',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={15} /> Sign out from AgriPulse
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Main Canvas Content Container ── */}
      <div className="main-content-canvas" style={{
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
        
        {/* ── Responsive Navbar Header ── */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 60,
          background: '#FFFFFF',
          borderBottom: '1px solid #F1F5F9',
          gap: 12,
        }}>
          
          {/* Left: Mobile Drawer Trigger & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button
              onClick={() => setDrawerOpen(true)}
              className="mobile-header-menu-btn"
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                width: 38,
                height: 38,
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#1E293B',
                flexShrink: 0,
              }}
            >
              <Menu size={20} />
            </button>

            {/* Mobile Header Logo & Page Title */}
            <div className="mobile-header-title" style={{ display: 'none', minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#14532D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pageTitle}
              </div>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="desktop-search-form"
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
              placeholder="Search crops, mandis, prices, buyers..."
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            
            {/* Mobile Search Toggle Icon */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="mobile-search-toggle-btn"
              style={{
                display: 'none',
                width: 36, height: 36, borderRadius: '50%',
                border: '1px solid #E2E8F0', background: '#F8FAFC',
                alignItems: 'center', justifyContent: 'center',
                color: '#475569', cursor: 'pointer',
              }}
            >
              <Search size={16} />
            </button>

            {/* Live Data Badge (Desktop only) */}
            <div className="desktop-live-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F0FDF4', color: '#166534', padding: '5px 12px',
              borderRadius: 9999, fontSize: 12, fontWeight: 700,
              border: '1px solid #DCFCE7',
            }}>
              <CheckCircle2 size={14} color="#16A34A" />
              <span>APMC Live Pulse</span>
            </div>

            {/* Notification Bell */}
            <NavLink
              to={`/${role}/notifications`}
              style={{
                position: 'relative', width: 36, height: 36, borderRadius: '50%',
                border: '1px solid #E2E8F0', background: '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', textDecoration: 'none',
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5, width: 8, height: 8,
                  borderRadius: '50%', background: '#EF4444',
                }} />
              )}
            </NavLink>

            {/* Profile Avatar Pill */}
            <NavLink
              to={`/${role}/profile`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 10px 3px 4px', borderRadius: 9999,
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
              <span className="desktop-username" style={{ fontSize: 13, fontWeight: 700 }}>
                {user?.name?.split(' ')[0]}
              </span>
            </NavLink>
          </div>
        </header>

        {/* Expandable Mobile Search Bar */}
        {mobileSearchOpen && (
          <div style={{ padding: '8px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} color="#64748B" style={{ position: 'absolute', left: 14 }} />
              <input
                type="text"
                autoFocus
                placeholder="Search crops, mandis, prices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 9999,
                  border: '1.5px solid #234D35',
                  fontSize: 14,
                  outline: 'none',
                  background: '#FFFFFF',
                }}
              />
            </form>
          </div>
        )}

        {/* ── Main Scrollable Page Area ── */}
        <main className="app-main-viewport" style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', background: '#FFFFFF' }}>
          <Outlet />
        </main>
      </div>

      {/* ── Native Mobile Bottom Navigation Bar (Fixed 64px) ── */}
      {bottomNavItems.length > 0 && (
        <nav className="mobile-bottom-nav">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 0',
                  textDecoration: 'none',
                  color: isActive ? (item.isRescue ? '#DC2626' : '#166534') : '#64748B',
                  fontWeight: isActive ? 800 : 500,
                  fontSize: 10,
                  gap: 3,
                  position: 'relative',
                }}
              >
                <div style={{
                  padding: '3px 12px',
                  borderRadius: 9999,
                  background: isActive ? (item.isRescue ? '#FEE2E2' : '#DCFCE7') : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span>{item.label}</span>
                {item.isRescue && (
                  <span style={{
                    position: 'absolute',
                    top: 4,
                    right: '25%',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#DC2626',
                  }} />
                )}
              </NavLink>
            );
          })}
        </nav>
      )}

      {/* ── Responsive CSS Rules ── */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .main-content-canvas {
            margin: 0 !important;
            border-radius: 0 !important;
            border: none !important;
            min-height: 100vh !important;
            box-shadow: none !important;
          }
          .mobile-header-menu-btn {
            display: flex !important;
          }
          .mobile-header-title {
            display: block !important;
          }
          .desktop-search-form {
            display: none !important;
          }
          .mobile-search-toggle-btn {
            display: flex !important;
          }
          .desktop-live-badge {
            display: none !important;
          }
          .desktop-username {
            display: none !important;
          }
          .app-main-viewport {
            padding: 12px 12px 80px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
