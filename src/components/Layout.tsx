import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, TrendingUp, DollarSign, Briefcase, 
  Scale, Users, ShieldAlert, Settings, LogOut, Clock, User, Menu, Layers, Sun, Moon, Contact, MapPin, Calendar, CalendarCheck, CreditCard, ShieldCheck
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = hasPermission('FIELD_VISIT_CREATE');

  const navItems = [
    { label: 'Executive Management Dashboard', path: '/', icon: LayoutDashboard, permission: null },
    { label: 'Business Performance Analytics', path: '/analytics', icon: TrendingUp, permission: null },
    { label: 'Loan Lifecycle & Compliance Monitoring', path: '/loans', icon: Briefcase, permission: 'LOAN_VIEW' },
    { label: 'Legal Recovery Management', path: '/recovery', icon: Scale, permission: 'RECOVERY_VIEW' },
    { label: 'Financial Operations Monitoring', path: '/cash-ops', icon: DollarSign, permission: 'TELLER_OPS' },
    { label: 'Customer & Member Directory', path: '/customers', icon: Contact, permission: null },
    { label: 'Teller & Cashier Operations', path: '/teller', icon: CreditCard, permission: null },
    { label: 'Fraud Detection, Audit & Risk Management', path: '/fraud', icon: ShieldAlert, permission: 'AUDIT_VIEW' },
    { label: 'Human Resource Management System (HRMS)', path: '/hrms', icon: Users, permission: 'HR_MANAGE' },
    { label: 'My Leaves', path: '/my-leaves', icon: Calendar, permission: null },
    { label: 'Leave Management', path: '/leave-management', icon: CalendarCheck, permission: 'HR_MANAGE' },
    { label: 'Field Visits (Admin)', path: '/field-visits/admin', icon: ShieldCheck, permission: 'FIELD_VISIT_CREATE' },
    { label: 'Field Visits Config', path: '/field-visits/config', icon: Settings, permission: 'FIELD_VISIT_CREATE' },
    { label: 'Operations Hub', path: '/operations', icon: Layers, permission: null },
    { label: 'Configuration', path: '/config', icon: Settings, permission: 'CONFIG_EDIT' },
    { label: 'My Field Visits', path: '/field-visits/my-tasks', icon: MapPin, permission: null, employeeOnly: true },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div style={{
            width: '32px', height: '32px', borderRadius: '6px', 
            backgroundColor: '#10b981', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', fontWeight: 'bold', color: '#080b11'
          }}>SG</div>
          {!collapsed && <h1>Gurudeva Co-op</h1>}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            // If the item requires a specific permission, check it
            if (item.permission && !hasPermission(item.permission)) return null;
            if (item.employeeOnly && isAdmin) return null;

            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                title={item.label}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="top-bar">
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--text-secondary)' 
            }}
          >
            <Menu size={24} />
          </button>

          <div className="top-bar-right">
            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', 
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center'
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Clock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Clock size={16} />
              <span>{time.toLocaleTimeString()}</span>
            </div>

            {/* Profile Info */}
            {user && (
              <div style={{ position: 'relative' }}>
                <Link 
                  to="/profile"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textDecoration: 'none' }}
                >
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)' }}>{user.fullName}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                      {user.role?.name} • {user.branch?.name || 'Main Office'}
                    </div>
                  </div>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981'
                  }}>
                    <User size={20} />
                  </div>
                </Link>


              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
