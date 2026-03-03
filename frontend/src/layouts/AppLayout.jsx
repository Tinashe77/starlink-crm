import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  LogOut,
  ChevronDown,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Agent', 'Technician', 'Collections Officer'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['Admin'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-200`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          {sidebarOpen && (
            <span className="font-bold text-lg text-blue-400 tracking-tight">StarConnect</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User profile area */}
        <div className="border-t border-gray-700 p-3">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white text-sm"
            >
              <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-xs font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                  </div>
                  <ChevronDown size={14} />
                </>
              )}
            </button>

            {profileOpen && sidebarOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { navigate('/change-password'); setProfileOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
                >
                  <KeyRound size={14} /> Change Password
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
