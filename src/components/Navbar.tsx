import React from 'react';
import { Sun, Shield, User as UserIcon, LogOut, Wallet } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeView: 'client' | 'admin';
  setActiveView: (view: 'client' | 'admin') => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  setActiveView,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-1 sm:gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-xs shrink-0">
              <Sun className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-2xl font-black text-emerald-950 tracking-tight">
                  GreenWorld
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold uppercase px-1 sm:px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 hidden sm:inline-block">
                  Solar
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Sustainable Yields &amp; Clean Energy Investment</p>
            </div>
          </div>

          {/* Site Switcher Tabs */}
          <div className="flex items-center bg-slate-100/80 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => setActiveView('client')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                activeView === 'client'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-200/60'
              }`}
            >
              <UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Client</span>
            </button>

            <button
              onClick={() => setActiveView('admin')}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                activeView === 'admin'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-800 hover:bg-slate-200/60'
              }`}
            >
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* User Controls & Logout Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* User ID / Username & Balance */}
                <div className="flex flex-col text-right">
                  <span className="text-[10px] sm:text-xs font-extrabold text-slate-900 truncate max-w-[75px] sm:max-w-[150px]">
                    {user.username || user.full_name}
                  </span>
                  <span className="text-[9px] sm:text-[11px] text-emerald-700 font-bold flex items-center justify-end gap-0.5">
                    <Wallet className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" /> RS {user.wallet_balance.toLocaleString()}
                  </span>
                </div>

                {/* Logout Toggle Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all font-bold text-[10px] sm:text-xs flex items-center gap-1 shrink-0 shadow-2xs"
                  title="Logout Account"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-2 py-1 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-2.5 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl shadow-xs transition-all whitespace-nowrap"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

