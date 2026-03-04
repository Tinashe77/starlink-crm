import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronDown,
  Menu,
  X,
  KeyRound,
  ClipboardList,
  Package,
  FileSignature,
  CalendarClock,
  ShieldAlert,
  BellRing,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const ALL_ROLES = ['Admin', 'Agent', 'Technician', 'Collections Officer', 'Customer'];

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
  { to: '/customer-applications', label: 'Applications', icon: ClipboardList, roles: ALL_ROLES },
  { to: '/contracts', label: 'Contracts', icon: FileSignature, roles: ALL_ROLES },
  { to: '/payment-plans', label: 'Payment Plans', icon: CalendarClock, roles: ALL_ROLES },
  { to: '/collections', label: 'Collections', icon: ShieldAlert, roles: ['Admin', 'Agent', 'Collections Officer'] },
  { to: '/packages', label: 'Packages', icon: Package, roles: ['Admin'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['Admin'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter((item) => item.roles.includes(user?.role));
  const activeItem = navItems.find((item) => location.pathname.startsWith(item.to));

  return (
    <div className="app-shell flex min-h-screen bg-transparent p-3 md:p-4">
      <aside
        className={`glass-panel relative flex flex-col rounded-[2rem] text-slate-900 transition-all duration-300 ${
          sidebarOpen ? 'w-72 px-3 py-3' : 'w-[5.4rem] px-2 py-3'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <div className="overflow-hidden">
            <BrandLogo compact={!sidebarOpen} />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 text-slate-500 shadow-sm transition hover:border-[var(--brand-cyan)]/40 hover:text-[var(--brand-navy)]"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="mx-2 mb-4 rounded-3xl border border-white/60 bg-gradient-to-br from-[var(--brand-navy)] via-[var(--brand-navy)] to-[var(--brand-cyan)] p-4 text-white shadow-[0_18px_36px_rgba(21,169,231,0.18)]">
          {sidebarOpen ? (
            <>
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">Control Center</p>
              <p className="mt-2 text-sm font-medium leading-6 text-white/90">
                Manage customers, contracts, collections, and fulfillment from one portal.
              </p>
            </>
          ) : (
            <div className="flex justify-center">
              <BellRing size={18} />
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-2 pb-3">
          {visibleNav.map((item) => {
            const NavIcon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-[var(--brand-navy)] shadow-[0_16px_28px_rgba(23,63,143,0.09)] ring-1 ring-[var(--brand-cyan)]/18'
                      : 'text-slate-600 hover:bg-white/75 hover:text-[var(--brand-navy)] hover:shadow-sm'
                  }`
                }
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-slate-100 text-[var(--brand-navy)] shadow-sm ring-1 ring-slate-200/80 group-hover:ring-[var(--brand-cyan)]/25">
                  <NavIcon size={18} className="shrink-0" />
                </span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 p-3">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-navy)] to-[var(--brand-cyan)] font-bold text-sm text-white shadow-[0_12px_24px_rgba(23,63,143,0.22)]">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="truncate text-xs uppercase tracking-[0.24em] text-slate-400">{user?.role}</p>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </>
              )}
            </button>

            {profileOpen && sidebarOpen && (
              <div className="absolute bottom-full left-0 z-10 mb-2 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_44px_rgba(15,23,42,0.12)]">
                <button
                  onClick={() => { navigate('/change-password'); setProfileOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <KeyRound size={14} /> Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 transition hover:bg-red-50"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col pl-3 md:pl-4">
        <header className="glass-panel-strong mb-3 flex flex-col gap-4 rounded-[2rem] px-5 py-4 md:mb-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.38em] text-slate-400">StarConnect Africa Portal</p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em] text-slate-900">
              {activeItem?.label || 'Workspace'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-2 shadow-sm">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Role</p>
              <p className="text-sm font-semibold text-[var(--brand-navy)]">{user?.role}</p>
            </div>
            <div className="rounded-2xl border border-[var(--brand-cyan)]/18 bg-gradient-to-r from-white to-cyan-50/70 px-4 py-2 shadow-sm">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Session</p>
              <p className="text-sm font-semibold text-slate-900">Live CRM Access</p>
            </div>
          </div>
        </header>

        <section className="glass-panel-strong min-h-0 flex-1 overflow-auto rounded-[2rem]">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
