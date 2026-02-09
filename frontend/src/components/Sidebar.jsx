import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ArrowLeftRight, ClipboardList, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/purchases', label: 'Purchases', icon: ShoppingCart },
    { path: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { path: '/assignments', label: 'Assignments', icon: ClipboardList }
  ];

  if (user?.role === 'admin') {
    menuItems.push({ path: '/admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <div className="w-72 bg-card/95 backdrop-blur-xl text-foreground min-h-screen flex flex-col shadow-2xl z-10 border-r border-border/50">
      <div className="p-8 border-b border-border/50 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 border border-primary/20 bg-primary/10 rounded-xl shadow-inner shadow-primary/5">
            <Shield size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Vanguard<span className="text-primary">Logistics</span>
          </h1>
        </div>

        <div className="mt-4 px-3 py-2 bg-muted/30 rounded-lg border border-border/50 backdrop-blur-sm">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active Session</p>
          <p className="text-sm font-semibold mt-0.5 text-foreground">{user?.username}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>
              {user?.role?.toUpperCase()} | {user?.base_id ? `Base ${user.base_id}` : 'HQ'}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group text-sm font-medium',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                size={18}
                className={cn('transition-transform group-hover:scale-105', isActive && 'text-primary-foreground')}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 p-3 text-destructive hover:bg-destructive/10 hover:scale-[1.02] rounded-xl transition-all text-sm font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
