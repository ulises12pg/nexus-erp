import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, DollarSign, Wrench, Building2, Plane, Settings,
  Search, Bell, ChevronRight, Plus, Edit3, Trash2, Check, X, Download, FileSpreadsheet,
  FileText, TrendingUp, TrendingDown, AlertTriangle, ArrowUpDown, Eye, Star, 
  ChevronDown, Menu, Globe, LogOut, ArrowRight, ArrowLeft, Box, Truck, Factory,
  Flame, HardHat, CalendarDays, Clock, MapPin, CheckCircle2, XCircle, BarChart3,
  PieChart, Filter, RefreshCw, Send, CreditCard, Receipt, Sun, Moon, ShoppingCart, Printer
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import api from './services/api.js';
import { t } from './i18n.js';

// ==============================
// CONTEXTS
// ==============================
const AuthContext = createContext(null);
const LangContext = createContext('es');
const ThemeContext = createContext(null);
const ToastContext = createContext(null);

function useAuth() { return useContext(AuthContext); }
function useLang() { return useContext(LangContext); }
function useTheme() { return useContext(ThemeContext); }
function useToast() { return useContext(ToastContext); }

// ==============================
// UTILITY FUNCTIONS
// ==============================
const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n) => new Intl.NumberFormat('es-MX').format(n || 0);
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
const statusBadge = (status) => {
  const map = { approved: 'badge-success', active: 'badge-success', closed: 'badge-info', calculated: 'badge-info', pending: 'badge-warning', draft: 'badge-neutral', rejected: 'badge-danger', inactive: 'badge-danger' };
  return map[status] || 'badge-neutral';
};
const statusLabel = (status, lang) => {
  const m = { pending: lang === 'en' ? 'Pending' : 'Pendiente', approved: lang === 'en' ? 'Approved' : 'Aprobado', rejected: lang === 'en' ? 'Rejected' : 'Rechazado', active: lang === 'en' ? 'Active' : 'Activo', inactive: lang === 'en' ? 'Inactive' : 'Inactivo', draft: lang === 'en' ? 'Draft' : 'Borrador', calculated: lang === 'en' ? 'Calculated' : 'Calculada', closed: lang === 'en' ? 'Closed' : 'Cerrada' };
  return m[status] || status;
};

// ==============================
// TOAST SYSTEM
// ==============================
// ==============================
// SKELETON COMPONENTS — Skill §3: progressive-loading
// ==============================
function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid-stats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-icon" />
          <div className="skeleton skeleton-value" />
          <div className="skeleton skeleton-label" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="table-container glass-card">
      <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)' }}>
        <div className="skeleton" style={{ height: 14, width: '30%' }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="page-content">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <div className="skeleton" style={{ height: 32, width: '25%' }} />
        <div className="skeleton" style={{ height: 16, width: '40%' }} />
      </div>
      <SkeletonCards count={6} />
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24, height: 300 }}>
          <div className="skeleton" style={{ height: 20, width: '35%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: '100%', maxHeight: 220, borderRadius: 'var(--radius-md)' }} />
        </div>
        <div className="glass-card" style={{ padding: 24, height: 300 }}>
          <div className="skeleton" style={{ height: 20, width: '35%', marginBottom: 16 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-secondary)' }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text short" />
                <div className="skeleton skeleton-text medium" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Skill §1: aria-live for screen reader announcement */}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} color="var(--success)" /> :
             t.type === 'error' ? <XCircle size={18} color="var(--danger)" /> :
             <AlertTriangle size={18} color="var(--warning)" />}
            <span className="toast-message">{t.message}</span>
            <X size={16} className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} aria-label="Dismiss" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ==============================
// CONFIRM SYSTEM
// ==============================
const ConfirmContext = createContext(null);

function useConfirm() { return useContext(ConfirmContext); }

function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const confirmDialog = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
      setTimeLeft(5);
    });
  }, []);

  const handleClose = () => {
    if (confirmState?.resolve) confirmState.resolve(false);
    setConfirmState(null);
  };

  const handleConfirm = () => {
    if (confirmState?.resolve) confirmState.resolve(true);
    setConfirmState(null);
  };

  useEffect(() => {
    if (confirmState && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [confirmState, timeLeft]);

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      {confirmState && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content animate-in" style={{ maxWidth: 400, textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                <AlertTriangle size={32} />
              </div>
            </div>
            <h3 style={{ marginBottom: 8, fontSize: '1.25rem', fontWeight: 600 }}>{confirmState.title || 'Confirmar Acción'}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>{confirmState.message}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={handleClose} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirm} 
                disabled={timeLeft > 0} 
                style={{ flex: 1, backgroundColor: timeLeft > 0 ? 'var(--text-tertiary)' : 'var(--danger)', borderColor: 'transparent', opacity: timeLeft > 0 ? 0.7 : 1, transition: 'all 0.2s' }}
              >
                {timeLeft > 0 ? `Eliminar en ${timeLeft}s` : 'Eliminar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// ==============================
// MODAL COMPONENT
// ==============================
function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${wide ? 'modal-wide' : ''}`} onClick={e => e.stopPropagation()} style={wide ? { maxWidth: '720px' } : {}}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ==============================
// LOGIN PAGE
// ==============================
function LoginPage({ onLogin }) {
  const [lang, setLang] = useState('es');
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.login(username, password);
      api.setToken(data.token);
      onLogin(data.user, data.token);
    } catch (err) {
      setError(t('login_error', lang));
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-toggles" style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', gap: 8 }}>
        <div className="lang-switch">
          <button type="button" className={`lang-switch-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>ES</button>
          <button type="button" className={`lang-switch-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
        </div>
        <div className="lang-switch">
          <button type="button" className={`lang-switch-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}><Sun size={14}/></button>
          <button type="button" className={`lang-switch-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}><Moon size={14}/></button>
        </div>
      </div>
      <div className="login-card animate-in">
        <div className="login-logo">
          <div className="logo-mark">N</div>
          <h2>{t('login_welcome', lang)}</h2>
          <p>{t('login_subtitle', lang)}</p>
        </div>
        {error && <div className="login-error">{error}</div>}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('username', lang)}</label>
            <input className="form-input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">{t('password', lang)}</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="loading-spinner" /> : null}
            {t('login_button', lang)}
          </button>
        </form>
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: 16 }}>
          Demo: admin / admin123
        </div>
      </div>
    </div>
  );
}

// ==============================
// SIDEBAR
// ==============================
function Sidebar({ user, lang, setLang, onLogout, activeModules }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [hoverLogout, setHoverLogout] = useState(false);
  const { theme, setTheme } = useTheme();
  const sectorIcons = { truck: Truck, wrench: Wrench, factory: Factory, cog: Settings, flame: Flame };

  const modules = [
    { path: '/', icon: LayoutDashboard, label: t('nav_dashboard', lang), key: 'dashboard' },
    { path: '/inventory', icon: Package, label: t('nav_inventory', lang), key: 'inventory' },
    { path: '/payroll', icon: Users, label: t('nav_payroll', lang), key: 'payroll' },
    { path: '/expenses', icon: DollarSign, label: t('nav_expenses', lang), key: 'expenses' },
    { path: '/supplies', icon: Wrench, label: t('nav_supplies', lang), key: 'supplies' },
    { path: '/suppliers', icon: Building2, label: t('nav_suppliers', lang), key: 'suppliers' },
    { path: '/travel', icon: Plane, label: t('nav_travel', lang), key: 'travel' },
    { path: '/sales', icon: ShoppingCart, label: t('nav_sales', lang), key: 'sales' },
  ].filter(m => m.key === 'dashboard' || activeModules.includes(m.key));

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">N</div>
        {!collapsed && <span className="logo-text">NEXUS ERP</span>}
      </div>
      {/* Skill §1: role=navigation, aria-label */}
      <nav className="sidebar-nav" role="navigation" aria-label={lang === 'en' ? 'Main navigation' : 'Navegación principal'}>
        {!collapsed && <div className="nav-section-title">{t('nav_modules', lang)}</div>}
        {modules.map(m => (
          <Link key={m.path} to={m.path} className={`nav-item ${location.pathname === m.path ? 'active' : ''}`} aria-current={location.pathname === m.path ? 'page' : undefined}>
            <m.icon size={20} className="nav-icon" />
            {!collapsed && <span>{m.label}</span>}
          </Link>
        ))}
        {!collapsed && <div className="nav-section-title">{t('nav_system', lang)}</div>}
        <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`} aria-current={location.pathname === '/settings' ? 'page' : undefined}>
          <Settings size={20} className="nav-icon" />
          {!collapsed && <span>{t('nav_settings', lang)}</span>}
        </Link>
      </nav>
      <div className="sidebar-footer">
        <div style={{ 
          display: 'flex', 
          flexDirection: collapsed ? 'column' : 'row', 
          gap: 8, 
          marginBottom: 8, 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'space-between', 
          paddingLeft: collapsed ? 0 : 12,
          paddingRight: collapsed ? 0 : 12
        }}>
          <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', gap: 4 }}>
            <div className="lang-switch">
              <button type="button" className={`lang-switch-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>ES</button>
              <button type="button" className={`lang-switch-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
            </div>
            <div className="lang-switch">
              <button type="button" className={`lang-switch-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}><Sun size={14}/></button>
              <button type="button" className={`lang-switch-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}><Moon size={14}/></button>
            </div>
          </div>
          <button 
            type="button"
            className="btn btn-ghost btn-sm btn-icon" 
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? (lang === 'es' ? 'Expandir menú' : 'Expand menu') : (lang === 'es' ? 'Colapsar menú' : 'Collapse menu')}
          >
            {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
          </button>
        </div>
        <div 
          className="sidebar-user" 
          onClick={onLogout}
          onMouseEnter={() => setHoverLogout(true)}
          onMouseLeave={() => setHoverLogout(false)}
        >
          {hoverLogout ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: 'var(--danger)', height: 40 }}>
              <LogOut size={20} />
              {!collapsed && <span style={{ marginLeft: 8, fontWeight: 600 }}>{lang === 'es' ? 'Cerrar sesión' : 'Logout'}</span>}
            </div>
          ) : (
            <>
              <div className="user-avatar">{initials}</div>
              {!collapsed && (
                <div className="user-info">
                  <div className="user-name">{user?.full_name}</div>
                  <div className="user-role">{user?.role}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==============================
// HEADER
// ==============================
function Header({ title, breadcrumb, lang }) {
  return (
    <header className="main-header">
      <div className="header-left">
        <div className="breadcrumbs">
          <span>NEXUS</span>
          <ChevronRight size={14} />
          <span className="current">{title}</span>
        </div>
      </div>
      <div className="header-right">
        <button className="notification-btn" title={lang === 'en' ? 'Notifications' : 'Notificaciones'} aria-label={lang === 'en' ? 'Notifications' : 'Notificaciones'}>
          <Bell size={20} />
          <span className="notif-dot" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

// ==============================
// DASHBOARD PAGE
// ==============================
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function DashboardPage() {
  const { user } = useAuth();
  const lang = useLang();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getDashboardStats().then(setStats).catch(console.error).finally(() => setLoading(false)); }, []);

  /* Skill §3: progressive-loading — skeleton instead of spinner */
  if (loading) return <><Header title={t('dash_title', lang)} lang={lang} /><SkeletonDashboard /></>;

  const s = stats || {};
  const cards = [
    { label: t('dash_total_products', lang), value: fmtNum(s.inventory?.total_products), icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    { label: t('dash_inventory_value', lang), value: fmt(s.inventory?.total_value), icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: t('dash_employees', lang), value: fmtNum(s.employees?.total_employees), icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    { label: t('dash_monthly_expenses', lang), value: fmt(s.expenses?.total_expenses), icon: DollarSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { label: t('dash_active_suppliers', lang), value: fmtNum(s.suppliers?.active_count), icon: Building2, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { label: t('dash_low_stock', lang), value: fmtNum(s.inventory?.low_stock_count), icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ];

  return (
    <>
      <Header title={t('dash_title', lang)} lang={lang} />
      <div className="page-content">
        <div className="page-title-bar">
          <div>
            <h1>{t('dash_title', lang)}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('dash_welcome', lang)}, {user?.full_name}</p>
          </div>
        </div>

        <div className="grid-stats">
          {cards.map((c, i) => (
            <div key={i} className={`stat-card card-glow animate-in-delay-${i + 1}`}>
              <div className="stat-icon" style={{ background: c.bg }}>
                <c.icon size={22} color={c.color} />
              </div>
              {/* Skill §6: number-tabular for KPI values */}
              <div className="stat-value number-tabular">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>{t('dash_expense_trend', lang)}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={s.expenseTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#f1f5f9' }} formatter={v => [fmt(v), lang === 'en' ? 'Amount' : 'Monto']} />
                <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>{t('dash_top_products', lang)}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(s.topProducts || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border-secondary)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: CHART_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{p.sku} · Stock: {fmtNum(p.stock)}</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{fmt(p.value)}</span>
                </div>
              ))}
              {(!s.topProducts || s.topProducts.length === 0) && <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>{t('no_results', lang)}</p>}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{t('dash_recent_activity', lang)}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(s.recentActivity || []).slice(0, 8).map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: '0.85rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.action === 'create' ? 'var(--success)' : a.action === 'delete' ? 'var(--danger)' : 'var(--accent-primary)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)' }}>{a.user_name || 'System'}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span>{a.action}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span className="badge badge-neutral">{a.module}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>{a.timestamp ? new Date(a.timestamp).toLocaleString('es-MX') : ''}</span>
              </div>
            ))}
            {(!s.recentActivity || s.recentActivity.length === 0) && <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>{t('no_results', lang)}</p>}
          </div>
        </div>
      </div>
    </>
  );
}

// ==============================
// GENERIC CRUD MODULE PAGE
// ==============================
function CrudModule({ title, fetchFn, columns, formFields, createFn, updateFn, deleteFn, exportModule, customActions, addLabel }) {
  const lang = useLang();
  const toast = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    fetchFn(search ? `search=${encodeURIComponent(search)}` : '')
      .then(r => setData(r.data || r))
      .catch(e => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setFormData({}); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setFormData({ ...item }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      if (editItem) {
        await updateFn(editItem.id, formData);
        toast(t('success_update', lang));
      } else {
        await createFn(formData);
        toast(t('success_create', lang));
      }
      setModalOpen(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const confirmDialog = useConfirm();

  const handleDelete = async (id) => {
    const isConfirmed = await confirmDialog({
      title: lang === 'en' ? 'Delete Record' : 'Eliminar Registro',
      message: t('confirm_delete', lang)
    });
    if (!isConfirmed) return;
    try {
      await deleteFn(id);
      toast(t('success_delete', lang));
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <Header title={title} lang={lang} />
      <div className="page-content">
        <div className="page-title-bar">
          <h1>{title}</h1>
          <div className="title-actions">
            {exportModule && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => api.exportData(exportModule, 'excel')}><FileSpreadsheet size={16} /> Excel</button>
                <button className="btn btn-secondary btn-sm" onClick={() => api.exportData(exportModule, 'pdf')}><FileText size={16} /> PDF</button>
              </>
            )}
            {createFn && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> {addLabel || t('add', lang)}</button>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
            <Search size={16} className="search-icon" />
            <input type="text" placeholder={t('search', lang)} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-ghost btn-icon" onClick={load}><RefreshCw size={16} /></button>
        </div>

        {loading ? (
          <SkeletonTable rows={6} cols={columns.length} />
        ) : data.length === 0 ? (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h3>{t('no_results', lang)}</h3>
          </div>
        ) : (
          <div className="table-container glass-card">
            <table>
              <thead><tr>{columns.map((c, i) => <th key={i}>{c.label}</th>)}<th>{t('actions', lang)}</th></tr></thead>
              <tbody>
                {data.map((item, ri) => (
                  <tr key={item.id || ri}>
                    {columns.map((c, ci) => (
                      <td key={ci}>
                        {c.render ? c.render(item[c.key], item, lang) :
                         c.format === 'currency' ? <span className="number-tabular">{fmt(item[c.key])}</span> :
                         c.format === 'number' ? <span className="number-tabular">{fmtNum(item[c.key])}</span> :
                         c.format === 'date' ? fmtDate(item[c.key]) :
                         c.format === 'status' ? <span className={`badge ${statusBadge(item[c.key])}`}>{statusLabel(item[c.key], lang)}</span> :
                         item[c.key] ?? '-'}
                      </td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {customActions && customActions(item, load, toast, lang)}
                        {/* Skill §1: aria-labels on icon-only buttons */}
                        {updateFn && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(item)} title={t('edit', lang)} aria-label={`${t('edit', lang)} ${item.name || item.company_name || item.full_name || ''}`}><Edit3 size={14} /></button>}
                        {deleteFn && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(item.id)} title={t('delete', lang)} aria-label={`${t('delete', lang)} ${item.name || item.company_name || item.full_name || ''}`}><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? `${t('edit', lang)} ${title}` : `${t('add', lang)} ${title}`} wide>
        <div className="modal-body form-grid">
          {formFields.map((f, i) => (
            <div className={`form-group ${f.fullWidth || f.type === 'textarea' ? 'col-span-2' : ''}`} key={i}>
              <label className="form-label">{f.label}{f.required ? ' *' : ''}</label>
              {f.type === 'select' ? (
                <div className={f.icon ? 'form-input-group' : ''}>
                  {f.icon && <f.icon size={16} className="input-icon" />}
                  <select className="form-select" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}>
                    <option value="">--</option>
                    {(f.options || []).map((o, oi) => <option key={oi} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ) : f.type === 'textarea' ? (
                <textarea className="form-textarea" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
              ) : (
                <div className={f.icon ? 'form-input-group' : ''}>
                  {f.icon && <f.icon size={16} className="input-icon" />}
                  <input className="form-input" type={f.type || 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} placeholder={f.placeholder} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('cancel', lang)}</button>
          <button className="btn btn-primary" onClick={handleSave}>{t('save', lang)}</button>
        </div>
      </Modal>
    </>
  );
}

// ==============================
// MODULE PAGES
// ==============================
function InventoryPage() {
  const lang = useLang();
  return <CrudModule
    title={t('inv_title', lang)}
    fetchFn={(p) => api.getProducts(p)}
    columns={[
      { key: 'sku', label: t('inv_sku', lang) },
      { key: 'name', label: t('inv_product_name', lang) },
      { key: 'category_name', label: t('category', lang) },
      { key: 'stock', label: t('inv_stock', lang), render: (v, item) => (
        <span style={{ fontWeight: 700, color: item.stock <= item.min_stock && item.min_stock > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
          {fmtNum(v)} {item.unit}
          {item.stock <= item.min_stock && item.min_stock > 0 && <AlertTriangle size={14} style={{ marginLeft: 6, verticalAlign: 'middle' }} color="var(--danger)" />}
        </span>
      )},
      { key: 'cost_price', label: t('inv_cost_price', lang), format: 'currency' },
      { key: 'sale_price', label: t('inv_sale_price', lang), format: 'currency' },
    ]}
    formFields={[
      { key: 'sku', label: t('inv_sku', lang), required: true },
      { key: 'name', label: t('inv_product_name', lang), required: true, fullWidth: true },
      { key: 'unit', label: t('inv_unit', lang), placeholder: 'pza, lt, kg...' },
      { key: 'stock', label: t('inv_stock', lang), type: 'number' },
      { key: 'min_stock', label: t('inv_min_stock', lang), type: 'number' },
      { key: 'max_stock', label: t('inv_max_stock', lang), type: 'number' },
      { key: 'cost_price', label: t('inv_cost_price', lang), type: 'number', icon: DollarSign },
      { key: 'sale_price', label: t('inv_sale_price', lang), type: 'number', icon: DollarSign },
      { key: 'location', label: t('inv_location', lang), icon: MapPin },
    ]}
    createFn={(d) => api.createProduct(d)}
    updateFn={(id, d) => api.updateProduct(id, d)}
    deleteFn={(id) => api.deleteProduct(id)}
    exportModule="inventory"
    addLabel={t('inv_add_product', lang)}
  />;
}

function PayrollPage() {
  const lang = useLang();
  const toast = useToast();
  const [tab, setTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editItem, setEditItem] = useState(null);
  const [formType, setFormType] = useState('employee');
  const [details, setDetails] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([api.getEmployees(), api.getPayrollPeriods()]);
      setEmployees(e.data || []); setPeriods(p.data || []);
    } catch(e) { toast(e.message, 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreateEmployee = () => { setFormType('employee'); setEditItem(null); setFormData({}); setModalOpen(true); };
  const openCreatePeriod = () => { setFormType('period'); setEditItem(null); setFormData({}); setModalOpen(true); };
  const openEditEmployee = (emp) => { setFormType('employee'); setEditItem(emp); setFormData({ ...emp }); setModalOpen(true); };

  const handleSave = async () => {
    try {
      if (formType === 'employee') {
        if (editItem) await api.updateEmployee(editItem.id, formData);
        else await api.createEmployee(formData);
      } else {
        await api.createPayrollPeriod(formData);
      }
      toast(t(editItem ? 'success_update' : 'success_create', lang));
      setModalOpen(false); load();
    } catch(e) { toast(e.message, 'error'); }
  };

  const calcPayroll = async (periodId) => {
    try { const res = await api.calculatePayroll(periodId); toast(lang === 'en' ? 'Payroll calculated!' : '¡Nómina calculada!'); load(); } catch(e) { toast(e.message, 'error'); }
  };
  const closePayroll = async (periodId) => {
    try { await api.closePayroll(periodId); toast(lang === 'en' ? 'Payroll closed!' : '¡Nómina cerrada!'); load(); } catch(e) { toast(e.message, 'error'); }
  };
  const viewDetails = async (periodId) => {
    try { const d = await api.getPayrollDetails(periodId); setDetails(d); setDetailsModal(true); } catch(e) { toast(e.message, 'error'); }
  };
  /* Skill §8: confirmation-dialogs — unified confirm dialog instead of window.confirm */
  const confirmDialog = useConfirm();
  const deleteEmployee = async (id) => {
    const confirmed = await confirmDialog({
      title: lang === 'en' ? 'Delete Employee' : 'Eliminar Empleado',
      message: lang === 'en' ? 'Are you sure you want to delete this employee?' : '¿Estás seguro de que deseas eliminar a este empleado?'
    });
    if (!confirmed) return;
    try { await api.deleteEmployee(id); toast(lang === 'en' ? 'Employee deleted!' : '¡Empleado eliminado!'); load(); } catch(e) { toast(e.message, 'error'); }
  };
  const deletePeriod = async (id) => {
    const confirmed = await confirmDialog({
      title: lang === 'en' ? 'Delete Payroll Period' : 'Eliminar Período de Nómina',
      message: lang === 'en' ? 'Are you sure you want to delete this payroll period? This will also delete all calculated details.' : '¿Estás seguro de que deseas eliminar este período de nómina? Esto también eliminará todos los detalles calculados.'
    });
    if (!confirmed) return;
    try { await api.deletePayrollPeriod(id); toast(lang === 'en' ? 'Payroll period deleted!' : '¡Período de nómina eliminado!'); load(); } catch(e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <Header title={t('pay_title', lang)} lang={lang} />
      <div className="page-content">
        <div className="page-title-bar">
          <h1>{t('pay_title', lang)}</h1>
          <div className="title-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => api.exportData('employees', 'excel')}><FileSpreadsheet size={16} /> Excel</button>
            {tab === 'employees' ? <button className="btn btn-primary" onClick={openCreateEmployee}><Plus size={16} /> {t('pay_add_employee', lang)}</button>
             : <button className="btn btn-primary" onClick={openCreatePeriod}><Plus size={16} /> {t('pay_add_period', lang)}</button>}
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}>{t('pay_employees', lang)}</button>
          <button className={`tab ${tab === 'periods' ? 'active' : ''}`} onClick={() => setTab('periods')}>{t('pay_periods', lang)}</button>
        </div>

        {loading ? <SkeletonTable rows={5} cols={6} /> :
         tab === 'employees' ? (
          <div className="table-container glass-card">
            <table>
              <thead><tr><th>{t('pay_employee_code', lang)}</th><th>{t('pay_full_name', lang)}</th><th>{t('pay_position', lang)}</th><th>{t('department', lang)}</th><th>{t('pay_base_salary', lang)}</th><th>{t('pay_hire_date', lang)}</th><th>{t('actions', lang)}</th></tr></thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}><td><span className="badge badge-neutral">{e.employee_code}</span></td><td style={{fontWeight:600}}>{e.full_name}</td><td>{e.position}</td><td>{e.department}</td><td><span className="number-tabular">{fmt(e.base_salary)}</span></td><td>{fmtDate(e.hire_date)}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditEmployee(e)}><Edit3 size={14}/></button>
                      <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)', padding: '0 8px'}} onClick={() => deleteEmployee(e.id)} aria-label={`${lang === 'en' ? 'Delete' : 'Eliminar'} ${e.full_name}`}><Trash2 size={14}/> {lang === 'en' ? 'Delete' : 'Eliminar'}</button>
                    </div>
                  </td></tr>
                ))}
              </tbody>
            </table>
          </div>
         ) : (
          <div className="table-container glass-card">
            <table>
              <thead><tr><th>{t('pay_period_name', lang)}</th><th>{t('date', lang)}</th><th>{t('pay_gross_pay', lang)}</th><th>{t('pay_deductions', lang)}</th><th>{t('pay_net_pay', lang)}</th><th>{t('status', lang)}</th><th>{t('actions', lang)}</th></tr></thead>
              <tbody>
                {periods.map(p => (
                  <tr key={p.id}><td style={{fontWeight:600}}>{p.name}</td><td>{fmtDate(p.period_start)} — {fmtDate(p.period_end)}</td><td><span className="number-tabular">{fmt(p.total_gross)}</span></td><td style={{color:'var(--danger)'}}><span className="number-tabular">{fmt(p.total_deductions)}</span></td><td style={{fontWeight:700,color:'var(--success)'}}><span className="number-tabular">{fmt(p.total_net)}</span></td>
                  <td><span className={`badge ${statusBadge(p.status)}`}>{statusLabel(p.status, lang)}</span></td>
                  <td><div style={{display:'flex',gap:4}}>
                    {p.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => calcPayroll(p.id)}><BarChart3 size={14}/> {t('pay_calculate', lang)}</button>}
                    {p.status === 'calculated' && <>
                      <button className="btn btn-success btn-sm" onClick={() => closePayroll(p.id)}><CheckCircle2 size={14}/> {t('pay_close', lang)}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => viewDetails(p.id)}><Eye size={14}/></button>
                    </>}
                    {p.status === 'closed' && <button className="btn btn-ghost btn-sm" onClick={() => viewDetails(p.id)}><Eye size={14}/></button>}
                    <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={() => deletePeriod(p.id)} aria-label={`${lang === 'en' ? 'Delete' : 'Eliminar'} ${p.name}`}><Trash2 size={14}/> {lang === 'en' ? 'Delete' : 'Eliminar'}</button>
                  </div></td></tr>
                ))}
              </tbody>
            </table>
          </div>
         )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={formType === 'employee' ? (editItem ? t('edit',lang) : t('pay_add_employee',lang)) : t('pay_add_period',lang)} wide>
        <div className="modal-body form-grid">
          {formType === 'employee' ? <>
            <div className="form-group"><label className="form-label">{t('pay_employee_code', lang)}</label><input className="form-input" value={formData.employee_code||''} onChange={e => setFormData({...formData, employee_code: e.target.value})} /></div>
            <div className="form-group col-span-2"><label className="form-label">{t('pay_full_name', lang)} *</label><input className="form-input" value={formData.full_name||''} onChange={e => setFormData({...formData, full_name: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t('pay_position', lang)}</label><input className="form-input" value={formData.position||''} onChange={e => setFormData({...formData, position: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t('department', lang)}</label><input className="form-input" value={formData.department||''} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">{t('pay_base_salary', lang)}</label><div className="form-input-group"><DollarSign size={16} className="input-icon"/><input className="form-input" type="number" value={formData.base_salary||''} onChange={e => setFormData({...formData, base_salary: Number(e.target.value)})} /></div></div>
            <div className="form-group"><label className="form-label">{t('pay_hire_date', lang)}</label><div className="form-input-group"><CalendarDays size={16} className="input-icon"/><input className="form-input" type="date" value={formData.hire_date||''} onChange={e => setFormData({...formData, hire_date: e.target.value})} /></div></div>
          </> : <>
            <div className="form-group col-span-2"><label className="form-label">{t('pay_period_name', lang)} *</label><input className="form-input" value={formData.name||''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Quincena 1 - Julio 2026" /></div>
            <div className="form-group"><label className="form-label">{t('trv_start_date', lang)} *</label><div className="form-input-group"><CalendarDays size={16} className="input-icon"/><input className="form-input" type="date" value={formData.period_start||''} onChange={e => setFormData({...formData, period_start: e.target.value})} /></div></div>
            <div className="form-group"><label className="form-label">{t('trv_end_date', lang)} *</label><div className="form-input-group"><CalendarDays size={16} className="input-icon"/><input className="form-input" type="date" value={formData.period_end||''} onChange={e => setFormData({...formData, period_end: e.target.value})} /></div></div>
          </>}
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>{t('cancel', lang)}</button><button className="btn btn-primary" onClick={handleSave}>{t('save', lang)}</button></div>
      </Modal>

      <Modal isOpen={detailsModal} onClose={() => setDetailsModal(false)} title={lang === 'en' ? 'Payroll Details' : 'Detalle de Nómina'} wide>
        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {details && details.length > 0 ? (
            <table style={{ width: '100%', fontSize: '0.8rem' }}>
              <thead><tr><th>{t('pay_employee_code',lang)}</th><th>{t('name',lang)}</th><th>{t('pay_position',lang)}</th><th>{t('pay_gross_pay',lang)}</th><th>IMSS</th><th>ISR</th><th>{t('pay_net_pay',lang)}</th></tr></thead>
              <tbody>{details.map(d => (
                <tr key={d.id}><td>{d.employee_code}</td><td>{d.full_name}</td><td>{d.position}</td><td>{fmt(d.gross_pay)}</td><td style={{color:'var(--danger)'}}>{fmt(d.deductions_imss)}</td><td style={{color:'var(--danger)'}}>{fmt(d.deductions_isr)}</td><td style={{fontWeight:700,color:'var(--success)'}}>{fmt(d.net_pay)}</td></tr>
              ))}</tbody>
            </table>
          ) : <p>{t('no_results', lang)}</p>}
        </div>
      </Modal>
    </>
  );
}

function ExpensesPage() {
  const lang = useLang();
  const toast = useToast();
  return <CrudModule
    title={t('exp_title', lang)}
    fetchFn={(p) => api.getExpenses(p)}
    columns={[
      { key: 'date', label: t('date', lang), format: 'date' },
      { key: 'description', label: t('description', lang) },
      { key: 'category_name', label: t('category', lang) },
      { key: 'amount', label: t('amount', lang), format: 'currency' },
      { key: 'department', label: t('department', lang) },
      { key: 'payment_method', label: t('exp_payment_method', lang) },
      { key: 'status', label: t('status', lang), format: 'status' },
    ]}
    formFields={[
      { key: 'description', label: t('description', lang), required: true, fullWidth: true },
      { key: 'amount', label: t('amount', lang), type: 'number', required: true, icon: DollarSign },
      { key: 'date', label: t('date', lang), type: 'date', required: true, icon: CalendarDays },
      { key: 'department', label: t('department', lang) },
      { key: 'payment_method', label: t('exp_payment_method', lang), type: 'select', options: [
        { value: 'transfer', label: 'Transferencia' }, { value: 'card', label: 'Tarjeta' },
        { value: 'cash', label: 'Efectivo' }, { value: 'check', label: 'Cheque' }, { value: 'tag', label: 'TAG/Electrónico' }
      ]},
      { key: 'notes', label: t('notes', lang), type: 'textarea' },
    ]}
    createFn={(d) => api.createExpense(d)}
    updateFn={(id, d) => api.updateExpense(id, d)}
    deleteFn={(id) => api.deleteExpense(id)}
    exportModule="expenses"
    addLabel={t('exp_add', lang)}
    customActions={(item, load) => (
      item.status === 'pending' ? <>
        <button className="btn btn-success btn-sm" onClick={async () => { await api.approveExpense(item.id, true); toast(lang==='en'?'Approved!':'¡Aprobado!'); load(); }} title={t('exp_approve',lang)}><Check size={14}/></button>
        <button className="btn btn-danger btn-sm" onClick={async () => { await api.approveExpense(item.id, false, 'Rejected'); toast(lang==='en'?'Rejected':'Rechazado', 'warning'); load(); }} title={t('exp_reject',lang)}><X size={14}/></button>
      </> : null
    )}
  />;
}

function SuppliesPage() {
  const lang = useLang();
  return <CrudModule
    title={t('sup_title', lang)}
    fetchFn={(p) => api.getSupplies(p)}
    columns={[
      { key: 'code', label: t('sup_code', lang) },
      { key: 'name', label: t('name', lang) },
      { key: 'category', label: t('category', lang) },
      { key: 'stock', label: t('inv_stock', lang), render: (v, item) => (
        <span style={{ fontWeight: 700, color: item.stock <= item.reorder_point && item.reorder_point > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
          {fmtNum(v)} {item.unit}
          {item.stock <= item.reorder_point && item.reorder_point > 0 && <AlertTriangle size={14} style={{marginLeft:4}} color="var(--danger)"/>}
        </span>
      )},
      { key: 'reorder_point', label: t('sup_reorder_point', lang), format: 'number' },
      { key: 'unit_cost', label: t('sup_unit_cost', lang), format: 'currency' },
      { key: 'supplier_name', label: t('sup_preferred_supplier', lang) },
    ]}
    formFields={[
      { key: 'code', label: t('sup_code', lang) },
      { key: 'name', label: t('name', lang), required: true, fullWidth: true },
      { key: 'category', label: t('category', lang) },
      { key: 'unit', label: t('inv_unit', lang), placeholder: 'pza, lt, kg...' },
      { key: 'stock', label: t('inv_stock', lang), type: 'number' },
      { key: 'reorder_point', label: t('sup_reorder_point', lang), type: 'number' },
      { key: 'unit_cost', label: t('sup_unit_cost', lang), type: 'number', icon: DollarSign },
    ]}
    createFn={(d) => api.createSupply(d)}
    updateFn={(id, d) => api.updateSupply(id, d)}
    deleteFn={(id) => api.deleteSupply(id)}
    exportModule="supplies"
    addLabel={t('sup_add', lang)}
  />;
}

function SuppliersPage() {
  const lang = useLang();
  return <CrudModule
    title={t('spl_title', lang)}
    fetchFn={(p) => api.getSuppliers(p)}
    columns={[
      { key: 'company_name', label: t('spl_company', lang), render: (v) => <span style={{fontWeight:600}}>{v}</span> },
      { key: 'contact_name', label: t('spl_contact', lang) },
      { key: 'email', label: t('email', lang) },
      { key: 'phone', label: t('phone', lang) },
      { key: 'city', label: t('spl_city', lang) },
      { key: 'category', label: t('category', lang) },
      { key: 'rating', label: t('spl_rating', lang), render: (v) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star size={14} color="#f59e0b" fill="#f59e0b" />
          <span style={{ fontWeight: 700 }}>{(v || 0).toFixed(1)}</span>
        </div>
      )},
      { key: 'status', label: t('status', lang), format: 'status' },
    ]}
    formFields={[
      { key: 'company_name', label: t('spl_company', lang), required: true, fullWidth: true },
      { key: 'contact_name', label: t('spl_contact', lang) },
      { key: 'email', label: t('email', lang) },
      { key: 'phone', label: t('phone', lang) },
      { key: 'address', label: t('address', lang), fullWidth: true },
      { key: 'city', label: t('spl_city', lang), icon: MapPin },
      { key: 'state', label: t('spl_state', lang) },
      { key: 'tax_id', label: t('spl_tax_id', lang) },
      { key: 'category', label: t('category', lang) },
      { key: 'payment_terms', label: t('spl_payment_terms', lang) },
      { key: 'notes', label: t('notes', lang), type: 'textarea' },
    ]}
    createFn={(d) => api.createSupplier(d)}
    updateFn={(id, d) => api.updateSupplier(id, d)}
    deleteFn={(id) => api.deleteSupplier(id)}
    exportModule="suppliers"
    addLabel={t('spl_add', lang)}
  />;
}

function TravelPage() {
  const lang = useLang();
  const toast = useToast();
  return <CrudModule
    title={t('trv_title', lang)}
    fetchFn={(p) => api.getTravelRequests(p)}
    columns={[
      { key: 'employee_name', label: lang === 'en' ? 'Employee' : 'Empleado', render: (v) => <span style={{fontWeight:600}}>{v}</span> },
      { key: 'destination', label: t('trv_destination', lang) },
      { key: 'purpose', label: t('trv_purpose', lang) },
      { key: 'start_date', label: t('trv_start_date', lang), format: 'date' },
      { key: 'end_date', label: t('trv_end_date', lang), format: 'date' },
      { key: 'estimated_budget', label: t('trv_budget', lang), format: 'currency' },
      { key: 'actual_cost', label: t('trv_actual_cost', lang), format: 'currency' },
      { key: 'status', label: t('status', lang), format: 'status' },
    ]}
    formFields={[
      { key: 'employee_id', label: lang === 'en' ? 'Employee ID' : 'ID Empleado', type: 'number', required: true },
      { key: 'purpose', label: t('trv_purpose', lang), required: true, fullWidth: true },
      { key: 'origin', label: t('trv_origin', lang) },
      { key: 'destination', label: t('trv_destination', lang), required: true, icon: MapPin },
      { key: 'start_date', label: t('trv_start_date', lang), type: 'date', required: true, icon: CalendarDays },
      { key: 'end_date', label: t('trv_end_date', lang), type: 'date', required: true, icon: CalendarDays },
      { key: 'estimated_budget', label: t('trv_budget', lang), type: 'number', icon: DollarSign },
      { key: 'transport_type', label: t('trv_transport', lang), type: 'select', options: [
        { value: 'flight', label: lang === 'en' ? 'Flight' : 'Avión' },
        { value: 'bus', label: lang === 'en' ? 'Bus' : 'Autobús' },
        { value: 'car', label: lang === 'en' ? 'Car' : 'Auto' },
        { value: 'train', label: lang === 'en' ? 'Train' : 'Tren' },
      ]},
      { key: 'notes', label: t('notes', lang), type: 'textarea' },
    ]}
    createFn={(d) => api.createTravelRequest(d)}
    updateFn={(id, d) => api.updateTravelRequest(id, d)}
    exportModule="travel"
    addLabel={t('trv_add', lang)}
    customActions={(item, load) => (
      item.status === 'pending' ? <>
        <button className="btn btn-success btn-sm" onClick={async () => { await api.approveTravelRequest(item.id, true); toast(lang==='en'?'Approved!':'¡Aprobado!'); load(); }} title={t('exp_approve',lang)}><Check size={14}/></button>
        <button className="btn btn-danger btn-sm" onClick={async () => { await api.approveTravelRequest(item.id, false); toast(lang==='en'?'Rejected':'Rechazado', 'warning'); load(); }} title={t('exp_reject',lang)}><X size={14}/></button>
      </> : null
    )}
  />;
}

function SettingsPage() {
  const lang = useLang();
  const { user } = useAuth();
  const toast = useToast();
  const [sectors, setSectors] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('sector');
  const [loading, setLoading] = useState(true);
  const [currentSector, setCurrentSector] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getSectors(),
      api.getCustomFields(),
      user.role === 'superadmin' || user.role === 'admin' ? api.getUsers() : Promise.resolve([]),
      user.sector_id ? api.getSector(user.sector_id) : Promise.resolve(null),
    ]).then(([s, cf, u, cs]) => {
      setSectors(s); setCustomFields(cf); setUsers(u); setCurrentSector(cs);
    }).catch(e => toast(e.message, 'error')).finally(() => setLoading(false));
  }, []);

  /* Skill §4: no-emoji-icons — use SVG Lucide icons instead of emojis */
  const ALL_MODULES = [
    { key: 'inventory', label: t('nav_inventory', lang), Icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
    { key: 'payroll', label: t('nav_payroll', lang), Icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    { key: 'expenses', label: t('nav_expenses', lang), Icon: DollarSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    { key: 'supplies', label: t('nav_supplies', lang), Icon: Wrench, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { key: 'suppliers', label: t('nav_suppliers', lang), Icon: Building2, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    { key: 'travel', label: t('nav_travel', lang), Icon: Plane, color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
    { key: 'sales', label: t('nav_sales', lang), Icon: ShoppingCart, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  ];

  const toggleModule = async (moduleKey) => {
    if (!currentSector) return;
    const active = JSON.parse(currentSector.active_modules || '[]');
    const updated = active.includes(moduleKey) ? active.filter(m => m !== moduleKey) : [...active, moduleKey];
    try {
      await api.updateSector(currentSector.id, { active_modules: updated });
      setCurrentSector({ ...currentSector, active_modules: JSON.stringify(updated) });
      toast(t('success_update', lang));
    } catch(e) { toast(e.message, 'error'); }
  };

  if (loading) return (<><Header title={t('set_title', lang)} lang={lang}/><div className="page-content" style={{display:'flex',justifyContent:'center',paddingTop:80}}><div className="loading-spinner lg"/></div></>);

  return (
    <>
      <Header title={t('set_title', lang)} lang={lang} />
      <div className="page-content">
        <h1 style={{ marginBottom: 20 }}>{t('set_title', lang)}</h1>

        <div className="tabs">
          <button className={`tab ${tab === 'sector' ? 'active' : ''}`} onClick={() => setTab('sector')}>{t('set_sector', lang)}</button>
          <button className={`tab ${tab === 'modules' ? 'active' : ''}`} onClick={() => setTab('modules')}>{t('set_modules', lang)}</button>
          <button className={`tab ${tab === 'fields' ? 'active' : ''}`} onClick={() => setTab('fields')}>{t('set_custom_fields', lang)}</button>
          {(user.role === 'superadmin' || user.role === 'admin') && <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>{t('set_users', lang)}</button>}
        </div>

        {/* Skill §4: no-emoji-icons — replaced emoji with Lucide SVG icons */}
        {tab === 'sector' && (
          <div className="grid-3">
            {sectors.map(s => {
              const sectorIconMap = { truck: Truck, wrench: Wrench, factory: Factory, cog: Settings, flame: Flame };
              const sectorColorMap = { truck: { color: '#6366f1', bg: 'rgba(99,102,241,0.15)' }, wrench: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }, factory: { color: '#10b981', bg: 'rgba(16,185,129,0.15)' }, cog: { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' }, flame: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' } };
              const SectorIcon = sectorIconMap[s.icon] || Building2;
              const sectorColors = sectorColorMap[s.icon] || { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
              const isActive = s.id === user.sector_id;
              return (
                <div key={s.id} className="glass-card card-glow" style={{ padding: 24, border: isActive ? '2px solid var(--accent-primary)' : undefined }}>
                  <div className="sector-icon-container" style={{ background: sectorColors.bg }}>
                    <SectorIcon size={24} color={sectorColors.color} />
                  </div>
                  <h3>{s.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>{s.description}</p>
                  {isActive && <span className="badge badge-success" style={{ marginTop: 12 }}>{lang === 'en' ? 'Current' : 'Actual'}</span>}
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {JSON.parse(s.active_modules || '[]').map(m => <span key={m} className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{m}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'modules' && currentSector && (
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>{currentSector.name} — {t('set_modules', lang)}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {ALL_MODULES.map(m => {
                const isActive = JSON.parse(currentSector.active_modules || '[]').includes(m.key);
                return (
                  <div key={m.key} className={`module-toggle-card ${isActive ? 'module-active' : ''}`} style={{ opacity: isActive ? 1 : 0.6 }} onClick={() => toggleModule(m.key)} role="switch" aria-checked={isActive} aria-label={m.label}>
                    <div className="module-icon" style={{ background: m.bg }}>
                      <m.Icon size={20} color={m.color} />
                    </div>
                    <span style={{ fontWeight: 600, flex: 1 }}>{m.label}</span>
                    {isActive ? <CheckCircle2 size={18} color="var(--success)"/> : <XCircle size={18} color="var(--text-tertiary)"/>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'fields' && (
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>{t('set_custom_fields', lang)}</h3>
            {customFields.length === 0 ? <p style={{color:'var(--text-tertiary)'}}>{t('no_results', lang)}</p> : (
              <div className="table-container">
                <table><thead><tr><th>{lang === 'en' ? 'Module' : 'Módulo'}</th><th>{lang === 'en' ? 'Field' : 'Campo'}</th><th>ES</th><th>EN</th><th>{lang === 'en' ? 'Type' : 'Tipo'}</th></tr></thead>
                  <tbody>{customFields.map(f => <tr key={f.id}><td className="badge badge-neutral">{f.module}</td><td style={{fontWeight:600}}>{f.field_name}</td><td>{f.field_label_es}</td><td>{f.field_label_en}</td><td>{f.field_type}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="table-container glass-card">
            <table>
              <thead><tr><th>{t('username', lang)}</th><th>{t('name', lang)}</th><th>{t('email', lang)}</th><th>Rol</th><th>{t('status', lang)}</th><th>{lang === 'en' ? 'Last Login' : 'Último Acceso'}</th></tr></thead>
              <tbody>{users.map(u => (
                <tr key={u.id}><td style={{fontWeight:600}}>{u.username}</td><td>{u.full_name}</td><td>{u.email}</td><td><span className="badge badge-info">{u.role}</span></td><td>{u.active ? <span className="badge badge-success">{t('active',lang)}</span> : <span className="badge badge-danger">{t('inactive',lang)}</span>}</td><td style={{fontSize:'0.8rem',color:'var(--text-tertiary)'}}>{u.last_login || '-'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ==============================
// DIRECT SALES
// ==============================
function DirectSalesPage() {
  const lang = useLang();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customer, setCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New States
  const [payAmount, setPayAmount] = useState('');
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'history'
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.getProducts();
      setProducts(res.data || []);
    } catch(e) { toast(e.message, 'error'); }
  }, [toast]);

  const loadSalesHistory = useCallback(async () => {
    setSalesHistoryLoading(true);
    try {
      const res = await api.getSales();
      setSalesHistory(res.data || []);
    } catch(e) { toast(e.message, 'error'); }
    setSalesHistoryLoading(false);
  }, [toast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadSalesHistory();
    }
  }, [activeTab, loadSalesHistory]);

  const addToCart = (prod) => {
    if (prod.stock <= 0) return toast(lang === 'en' ? 'Out of stock!' : '¡Sin stock!', 'warning');
    const existing = cart.find(i => i.id === prod.id);
    if (existing) {
      if (existing.quantity >= prod.stock) return toast(lang === 'en' ? 'Not enough stock!' : '¡Stock insuficiente!', 'warning');
      setCart(cart.map(i => i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...prod, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));
  
  const updateQuantity = (id, qty) => {
    if (qty <= 0) return removeFromCart(id);
    const prod = products.find(p => p.id === id);
    if (prod && qty > prod.stock) return toast(lang === 'en' ? 'Not enough stock!' : '¡Stock insuficiente!', 'warning');
    setCart(cart.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const total = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
  const changeAmount = payAmount && Number(payAmount) >= total ? Number(payAmount) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && payAmount && Number(payAmount) < total) {
      return toast(lang === 'en' ? 'Insufficient payment amount!' : '¡Cantidad de pago insuficiente!', 'warning');
    }
    
    setLoading(true);
    try {
      const payload = {
        items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.sale_price })),
        payment_method: paymentMethod,
        customer_name: customer,
        total,
        paid_amount: paymentMethod === 'cash' && payAmount ? Number(payAmount) : total,
        change_amount: paymentMethod === 'cash' && payAmount ? Math.max(0, Number(payAmount) - total) : 0
      };
      
      const res = await api.createSale(payload);
      toast(lang === 'en' ? 'Sale completed successfully!' : '¡Venta completada con éxito!');
      
      if (res && res.saleId) {
        try {
          const saleDetails = await api.getSale(res.saleId);
          setSelectedSale(saleDetails);
          setTicketModalOpen(true);
        } catch(e) {
          console.error("Failed to load sale details", e);
        }
      }
      
      setCart([]);
      setCustomer('');
      setPayAmount('');
      loadProducts();
    } catch(e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  const printTicket = (sale) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast(lang === 'en' ? 'Please allow pop-ups to print the ticket.' : 'Por favor permita las ventanas emergentes para imprimir el ticket.', 'warning');
      return;
    }
    
    const itemsHtml = (sale.items || []).map(item => `
      <tr>
        <td style="padding: 4px 0; vertical-align: top;">${item.quantity}</td>
        <td style="padding: 4px 0; vertical-align: top; padding-left: 4px;">${item.product_name || item.name}</td>
        <td style="padding: 4px 0; vertical-align: top; text-align: right;">$${Number(item.quantity * (item.unit_price || item.price)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Ticket SALE-${sale.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 14px; color: #000; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .ticket-header { margin-bottom: 20px; }
          .ticket-title { font-size: 18px; font-weight: bold; margin: 0; }
          .ticket-subtitle { margin: 5px 0; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4px 0; text-align: left; }
          .total-section { font-weight: bold; margin-top: 10px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body onload="window.print(); setTimeout(function() { window.close(); }, 500);">
        <div class="text-center ticket-header">
          <h1 class="ticket-title">NEXUS ERP</h1>
          <p class="ticket-subtitle">COMPROBANTE DE VENTA</p>
        </div>
        <div>
          <strong>Folio:</strong> SALE-${sale.id}<br>
          <strong>Fecha:</strong> ${new Date(sale.created_at).toLocaleString('es-MX')}<br>
          <strong>Cliente:</strong> ${sale.customer_name || 'Público General'}<br>
          ${sale.creator ? `<strong>Vendedor:</strong> ${sale.creator}<br>` : ''}
        </div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="padding: 4px 0;">Cant</th>
              <th style="padding: 4px 0; padding-left: 4px;">Prod</th>
              <th style="padding: 4px 0; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="total-section">
          <div style="display:flex; justify-content:space-between;">
            <span>TOTAL:</span>
            <span>$${Number(sale.total).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          ${sale.payment_method === 'cash' ? `
            <div style="display:flex; justify-content:space-between; font-weight:normal; margin-top:4px;">
              <span>Recibido:</span>
              <span>$${Number(sale.paid_amount || sale.total).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:normal;">
              <span>Cambio:</span>
              <span>$${Number(sale.change_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; font-weight:normal; margin-top:4px;">
            <span>Método Pago:</span>
            <span>${sale.payment_method === 'cash' ? 'Efectivo' : sale.payment_method === 'card' ? 'Tarjeta' : 'Transferencia'}</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="text-center" style="margin-top: 20px;">
          <p>¡Gracias por su compra!</p>
          <p>NEXUS ERP</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Header title={t('sales_title', lang)} lang={lang} />
      <div className="page-content">
        
        {/* Navigation Tabs and Export Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div className="tab-container" style={{ display: 'flex', gap: 8 }}>
            <button 
              type="button" 
              className={`btn ${activeTab === 'register' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('register')}
            >
              <ShoppingCart size={16} /> {t('sales_register_title', lang)}
            </button>
            <button 
              type="button" 
              className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('history')}
            >
              <Receipt size={16} /> {t('sales_history_title', lang)}
            </button>
          </div>
          
          {activeTab === 'history' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                onClick={() => api.exportData('sales', 'excel')}
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button 
                type="button"
                className="btn btn-secondary btn-sm" 
                onClick={() => api.exportData('sales', 'pdf')}
              >
                <FileText size={16} /> PDF
              </button>
            </div>
          )}
        </div>

        {activeTab === 'register' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
            
            {/* Products Section */}
            <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('inv_products', lang)}</h2>
                <div className="form-input-group" style={{ width: 300 }}>
                  <Search size={16} className="input-icon" />
                  <input className="form-input" placeholder={t('search', lang)} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, maxHeight: '65vh', overflow: 'auto', paddingRight: 8 }}>
                {filteredProducts.map(p => (
                  <div key={p.id} className="glass-card" style={{ padding: 16, cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock > 0 ? 1 : 0.6, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border-color)', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => p.stock > 0 && addToCart(p)} onMouseEnter={e => e.currentTarget.style.transform = p.stock > 0 ? 'translateY(-2px)' : 'none'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{p.sku}</div>
                    <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{p.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <div className="number-tabular" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{fmt(p.sale_price)}</div>
                      <div className="number-tabular" style={{ fontSize: '0.8rem', color: p.stock > 0 ? 'var(--text-secondary)' : 'var(--danger)' }}>Stock: {p.stock}</div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>{t('no_results', lang)}</div>}
              </div>
            </div>

            {/* Cart Section */}
            <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingCart size={20} /> {t('sales_cart', lang)}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '35vh', overflow: 'auto' }}>
                {cart.length === 0 ? <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)' }}>{t('sales_empty', lang)}</div> : 
                 cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                      <div className="number-tabular" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{fmt(item.sale_price)} x {item.quantity} = {fmt(item.sale_price * item.quantity)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span style={{ width: 20, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                      <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: 4 }} onClick={() => removeFromCart(item.id)}><X size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: 16, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">{t('sales_customer', lang)}</label>
                  <input className="form-input" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Ej. Juan Pérez" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{t('sales_payment_method', lang)}</label>
                  <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="cash">{lang === 'en' ? 'Cash' : 'Efectivo'}</option>
                    <option value="card">{lang === 'en' ? 'Credit/Debit Card' : 'Tarjeta'}</option>
                    <option value="transfer">{lang === 'en' ? 'Transfer' : 'Transferencia'}</option>
                  </select>
                </div>

                {/* Pay with field and bills for Cash */}
                {paymentMethod === 'cash' && (
                  <>
                    <div className="form-group animate-slide-in">
                      <label className="form-label">{t('sales_pay_with', lang)}</label>
                      <div className="form-input-group">
                        <DollarSign size={16} className="input-icon" />
                        <input 
                          type="number" 
                          className="form-input" 
                          value={payAmount} 
                          onChange={e => setPayAmount(e.target.value)} 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, margin: '4px 0' }}>
                      {[20, 50, 100, 200, 500, 1000].map(bill => (
                        <button 
                          key={bill} 
                          type="button" 
                          className="btn btn-secondary btn-sm" 
                          style={{ fontSize: '0.8rem', padding: '6px 4px' }}
                          onClick={() => setPayAmount(bill.toString())}
                        >
                          ${bill}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: 600, color: payAmount && Number(payAmount) < total ? 'var(--danger)' : 'var(--success)', marginTop: 4 }}>
                      <span>{t('sales_change', lang)}:</span>
                      <span className="number-tabular">{fmt(changeAmount)}</span>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                  <span>{t('sales_total', lang)}:</span>
                  <span className="number-tabular" style={{ color: 'var(--accent-primary)' }}>{fmt(total)}</span>
                </div>
                
                <button type="button" className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: '1.1rem' }} onClick={handleCheckout} disabled={cart.length === 0 || loading || (paymentMethod === 'cash' && payAmount && Number(payAmount) < total)}>
                  {loading ? <span className="loading-spinner"/> : <ShoppingCart size={20} />} {t('sales_checkout', lang)}
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* Sales History Section */
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('sales_history_title', lang)}</h2>
              <div className="form-input-group" style={{ width: 300 }}>
                <Search size={16} className="input-icon" />
                <input 
                  className="form-input" 
                  placeholder={t('search', lang)} 
                  value={historySearch} 
                  onChange={e => setHistorySearch(e.target.value)} 
                />
              </div>
            </div>

            {salesHistoryLoading ? (
              <SkeletonTable rows={5} cols={7} />
            ) : salesHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                {t('no_results', lang)}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{t('sales_date', lang)}</th>
                      <th>{t('sales_folio', lang)}</th>
                      <th>{t('sales_customer', lang)}</th>
                      <th>{t('sales_payment_method', lang)}</th>
                      <th>{t('sales_seller', lang)}</th>
                      <th style={{ textAlign: 'right' }}>{t('sales_total', lang)}</th>
                      <th style={{ textAlign: 'center' }}>{t('actions', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory
                      .filter(s => 
                        (s.customer_name || '').toLowerCase().includes(historySearch.toLowerCase()) || 
                        `SALE-${s.id}`.toLowerCase().includes(historySearch.toLowerCase())
                      )
                      .map(sale => (
                        <tr key={sale.id}>
                          <td>{new Date(sale.created_at).toLocaleDateString('es-MX')}</td>
                          <td>SALE-{sale.id}</td>
                          <td>{sale.customer_name || (lang === 'en' ? 'General Public' : 'Público General')}</td>
                          <td>{sale.payment_method === 'cash' ? (lang === 'en' ? 'Cash' : 'Efectivo') : sale.payment_method === 'card' ? (lang === 'en' ? 'Card' : 'Tarjeta') : (lang === 'en' ? 'Transfer' : 'Transferencia')}</td>
                          <td>{sale.creator || '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }} className="number-tabular">{fmt(sale.total)}</td>
                          <td style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button 
                              type="button"
                              className="btn btn-ghost btn-sm" 
                              title={t('sales_ticket', lang)} 
                              onClick={async () => {
                                try {
                                  const saleDetails = await api.getSale(sale.id);
                                  setSelectedSale(saleDetails);
                                  setTicketModalOpen(true);
                                } catch(e) { toast(e.message, 'error'); }
                              }}
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              type="button"
                              className="btn btn-ghost btn-sm" 
                              title={t('sales_print', lang)} 
                              onClick={async () => {
                                try {
                                  const saleDetails = await api.getSale(sale.id);
                                  printTicket(saleDetails);
                                } catch(e) { toast(e.message, 'error'); }
                              }}
                            >
                              <Printer size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      <Modal isOpen={ticketModalOpen} onClose={() => setTicketModalOpen(false)} title={t('sales_ticket', lang)}>
        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {selectedSale && (
            <>
              <div style={{
                width: '100%',
                maxWidth: '320px',
                padding: '24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-sm)',
                fontFamily: 'Courier New, Courier, monospace',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.4
              }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>NEXUS ERP</h3>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>COMPROBANTE DE VENTA</div>
                </div>
                
                <div style={{ fontSize: '0.75rem', marginBottom: 12 }}>
                  <div><strong>{t('sales_folio', lang)}:</strong> SALE-{selectedSale.id}</div>
                  <div><strong>{t('date', lang)}:</strong> {new Date(selectedSale.created_at).toLocaleString(lang === 'en' ? 'en-US' : 'es-MX')}</div>
                  <div><strong>{t('sales_customer', lang)}:</strong> {selectedSale.customer_name || (lang === 'en' ? 'General Public' : 'Público General')}</div>
                  {selectedSale.creator && <div><strong>{t('sales_seller', lang)}:</strong> {selectedSale.creator}</div>}
                </div>
                
                <div style={{ borderTop: '1px dashed var(--border-color)', margin: '8px 0' }}></div>
                
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px dashed var(--border-color)' }}>
                      <th style={{ textAlign: 'left', padding: '4px 0' }}>Cant</th>
                      <th style={{ textAlign: 'left', padding: '4px 0', paddingLeft: 4 }}>Prod</th>
                      <th style={{ textAlign: 'right', padding: '4px 0' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items && selectedSale.items.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '4px 0', verticalAlign: 'top' }}>{item.quantity}</td>
                        <td style={{ padding: '4px 0', verticalAlign: 'top', paddingLeft: 4 }}>{item.product_name || item.name}</td>
                        <td style={{ padding: '4px 0', verticalAlign: 'top', textAlign: 'right' }} className="number-tabular">
                          {fmt(item.quantity * (item.unit_price || item.price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{ borderTop: '1px dashed var(--border-color)', margin: '8px 0' }}></div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TOTAL:</span>
                    <span className="number-tabular" style={{ color: 'var(--accent-primary)' }}>{fmt(selectedSale.total)}</span>
                  </div>
                  {selectedSale.payment_method === 'cash' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: '0.75rem', opacity: 0.9 }}>
                        <span>{t('sales_amount_paid', lang)}:</span>
                        <span className="number-tabular">{fmt(selectedSale.paid_amount || selectedSale.total)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: '0.75rem', opacity: 0.9 }}>
                        <span>{t('sales_change_returned', lang)}:</span>
                        <span className="number-tabular">{fmt(selectedSale.change_amount || 0)}</span>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', fontSize: '0.75rem', opacity: 0.9, marginTop: 4 }}>
                    <span>{t('sales_payment_method', lang)}:</span>
                    <span>{selectedSale.payment_method === 'cash' ? (lang === 'en' ? 'Cash' : 'Efectivo') : selectedSale.payment_method === 'card' ? (lang === 'en' ? 'Card' : 'Tarjeta') : (lang === 'en' ? 'Transfer' : 'Transferencia')}</span>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px dashed var(--border-color)', margin: '12px 0 8px 0' }}></div>
                
                <div style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.8, marginTop: 12 }}>
                  ¡Gracias por su compra!<br />NEXUS ERP
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTicketModalOpen(false)}>
                  {t('close', lang)}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => printTicket(selectedSale)}>
                  <Printer size={16} /> {t('sales_print', lang)}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

// ==============================
// MAIN APP
// ==============================
function AppLayout({ user, lang, setLang, onLogout }) {
  const [activeModules, setActiveModules] = useState(['inventory','payroll','expenses','supplies','suppliers','travel']);

  useEffect(() => {
    if (user?.sector_id) {
      api.getSector(user.sector_id).then(s => {
        if (s && s.active_modules) setActiveModules(JSON.parse(s.active_modules));
      }).catch(() => {});
    }
  }, [user]);

  return (
    <div className="app-layout">
      <Sidebar user={user} lang={lang} setLang={setLang} onLogout={onLogout} activeModules={activeModules} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          {activeModules.includes('inventory') && <Route path="/inventory" element={<InventoryPage />} />}
          {activeModules.includes('payroll') && <Route path="/payroll" element={<PayrollPage />} />}
          {activeModules.includes('expenses') && <Route path="/expenses" element={<ExpensesPage />} />}
          {activeModules.includes('supplies') && <Route path="/supplies" element={<SuppliesPage />} />}
          {activeModules.includes('suppliers') && <Route path="/suppliers" element={<SuppliersPage />} />}
          {activeModules.includes('travel') && <Route path="/travel" element={<TravelPage />} />}
          {activeModules.includes('sales') && <Route path="/sales" element={<DirectSalesPage />} />}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('es');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getProfile()
        .then(u => { setUser(u); setLang(u.language || 'es'); })
        .catch(() => { api.setToken(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    setLang(userData.language || 'es');
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><div className="loading-spinner lg"/></div>;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <LangContext.Provider value={lang}>
        <ThemeContext.Provider value={{ theme, setTheme }}>
          <ToastProvider>
            <ConfirmProvider>
              <BrowserRouter>
                {user ? <AppLayout user={user} lang={lang} setLang={setLang} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />}
              </BrowserRouter>
            </ConfirmProvider>
          </ToastProvider>
        </ThemeContext.Provider>
      </LangContext.Provider>
    </AuthContext.Provider>
  );
}
