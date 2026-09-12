import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogicaLogo } from './LogicaLogo';
import {
  LayoutDashboard,
  Building2,
  GitFork,
  Receipt,
  ClipboardList,
  Archive,
  BrainCircuit,
  FileBarChart2,
  Settings,
  LogOut,
  ChevronRight,
  Smartphone,
  Zap,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenAndroidApp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onToggle,
  onOpenAndroidApp,
}) => {
  const { currentUser, canAccess, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Portfolio Overview', icon: LayoutDashboard, access: 'dashboard' },
    { id: 'projects', label: 'Projects', icon: Building2, access: 'projects' },
    { id: 'wbs', label: 'WBS & Activities', icon: GitFork, access: 'wbs' },
    { id: 'costs', label: 'Costs', icon: Receipt, access: 'costs' },
    { id: 'site_reports', label: 'Site Reports', icon: ClipboardList, access: 'site_reports' },
    { id: 'historical', label: 'Archived Projects', icon: Archive, access: 'historical' },
    { id: 'intelligence', label: 'Project Intelligence', icon: BrainCircuit, access: 'intelligence', highlight: true },
    { id: 'reports', label: 'Reports', icon: FileBarChart2, access: 'reports' },
    { id: 'settings', label: 'Settings', icon: Settings, access: 'settings' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-xs"
          onClick={onToggle}
        />
      )}

      <aside
        id="app-main-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Banner - Original Logica Softworks */}
        <div className="p-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <LogicaLogo variant="full" theme="light" size="sm" />
              <p className="text-[10px] text-slate-500 font-mono tracking-tight truncate mt-1">
                Civil Ops &amp; Infrastructure
              </p>
            </div>
            {/* Mobile close button */}
            <button
              id="btn-close-sidebar"
              onClick={onToggle}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Close sidebar menu"
              aria-label="Close sidebar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="text-slate-600 font-semibold">BuildIQ Enterprise</span>
            <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const hasPermission = canAccess(item.access);
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            if (!hasPermission) {
              return null;
            }

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : item.highlight
                    ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-amber-400'
                        : item.highlight
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    AI
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            );
          })}
        </nav>

        {/* Android App Button in Sidebar */}
        <div className="px-3 pb-2">
          <button
            id="sidebar-btn-android-app"
            onClick={() => {
              if (onOpenAndroidApp) {
                onOpenAndroidApp();
              } else {
                onSelectTab('settings');
              }
              if (window.innerWidth < 1024) {
                onToggle();
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Download Android APK or Install WebAPK"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-600" />
              <span>Mobile Field App</span>
            </div>
            <span className="text-[10px] font-mono bg-white text-slate-700 px-1.5 py-0.5 rounded font-bold border border-slate-300 shadow-xs">
              APK
            </span>
          </button>
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between p-2.5 rounded-md bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 shadow-xs border border-slate-800">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-slate-500 capitalize truncate font-mono">
                  {currentUser?.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              id="btn-logout"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
