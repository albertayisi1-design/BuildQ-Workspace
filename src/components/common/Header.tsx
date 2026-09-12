import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBuild } from '../../context/BuildContext';
import { LogicaLogo } from './LogicaLogo';
import { UserRole } from '../../types';
import { Sparkles, Shield, HardHat, ClipboardList, Calculator, AlertTriangle, HelpCircle, RefreshCw, LogOut, Smartphone, Wrench, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenDemoGuide: () => void;
  onNavigate: (tab: string) => void;
  currentTab?: string;
  onOpenNewProject?: () => void;
  onOpenAndroidApp?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDemoGuide,
  onNavigate,
  currentTab = 'dashboard',
  onOpenNewProject,
  onOpenAndroidApp,
  onToggleSidebar,
}) => {
  const { currentUser, logout } = useAuth();
  const { settings } = useBuild();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', icon: <Shield className="w-3.5 h-3.5 shrink-0" /> };
      case 'project_manager':
      case 'pm':
        return { label: 'PM', icon: <HardHat className="w-3.5 h-3.5 shrink-0" /> };
      case 'engineer':
      case 'engineers':
        return { label: 'Engineers', icon: <Wrench className="w-3.5 h-3.5 shrink-0" /> };
      case 'finance':
        return { label: 'Finance', icon: <Calculator className="w-3.5 h-3.5 shrink-0" /> };
      default:
        return {
          label: role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Admin',
          icon: <Shield className="w-3.5 h-3.5 shrink-0" />,
        };
    }
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Portfolio Overview';
      case 'projects':
        return 'Project Directory';
      case 'wbs':
        return 'WBS & Activities';
      case 'costs':
        return 'Cost Ledger';
      case 'site_reports':
        return 'Site Logs & Diaries';
      case 'historical':
        return 'Archived Projects';
      case 'intelligence':
        return 'Parametric Intelligence';
      case 'reports':
        return 'Reports';
      case 'settings':
        return 'Settings';
      default:
        return 'Civil Ops';
    }
  };

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-30 h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-xs transition-colors"
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            id="btn-header-toggle-sidebar"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
            title="Open navigation menu"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="lg:hidden shrink-0 flex items-center">
          <LogicaLogo variant="icon" size="xs" />
        </div>
        <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
          <span className="truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
            {getPageTitle(currentTab)}
          </span>
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Interactive Demo Scenario Helper Button */}
        <button
          id="btn-open-demo-guide"
          onClick={onOpenDemoGuide}
          className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-8.5 px-2 sm:px-3 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-xs shrink-0"
          title="Open interactive demonstration scenario"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="hidden md:inline">Scenario Guide</span>
          <span className="text-slate-600 font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded font-bold border border-slate-200 shrink-0">Tour</span>
        </button>

        {/* Android App Hub Trigger Button */}
        <button
          id="btn-header-android-app"
          onClick={onOpenAndroidApp || (() => onNavigate('settings'))}
          className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-8.5 px-2 sm:px-3 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-xs shrink-0"
          title="Download Android APK or Install WebApp"
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="hidden lg:inline">Mobile Field App</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1 py-0.2 rounded font-mono font-bold shrink-0">APK</span>
        </button>

        {/* Currency Tag */}
        <div className="hidden xl:flex items-center justify-center gap-1 h-8.5 px-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono whitespace-nowrap shrink-0">
          <span className="text-slate-900 font-bold">{settings.currency_symbol}</span>
          <span>{settings.currency}</span>
        </div>

        {/* Firebase Firestore Connection Badge */}
        <div
          id="badge-firestore-status"
          className="hidden 2xl:flex items-center justify-center gap-1.5 h-8.5 px-3 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono shadow-xs whitespace-nowrap shrink-0"
          title="Firebase Firestore real-time cloud persistence connected"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-semibold text-slate-800">Cloud Connected</span>
        </div>

        {/* Current User Role Panel */}
        {(() => {
          const currentBadge = getRoleBadge(currentUser?.role);
          return (
            <div
              id="current-user-role-panel"
              className="flex items-center h-8 sm:h-8.5 bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs shrink-0 box-border"
              title={`Logged in as ${currentUser?.name || 'User'} (${currentBadge.label})`}
            >
              <div
                id="current-user-role-pill"
                className="h-full px-2 sm:px-2.5 rounded-[4px] font-bold transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap bg-slate-900 text-white shadow-xs"
              >
                {currentBadge.icon}
                <span className="text-[11px] sm:text-xs">{currentBadge.label}</span>
              </div>
            </div>
          );
        })()}

        {/* Action Button: New Project */}
        <button
          id="btn-header-new-project"
          onClick={() => {
            if (onOpenNewProject) {
              onOpenNewProject();
            } else {
              onNavigate('projects');
            }
          }}
          className="h-8 sm:h-8.5 inline-flex items-center justify-center gap-1 px-2.5 sm:px-3.5 rounded-md bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0 border border-slate-900"
        >
          <span className="sm:hidden">+ Project</span>
          <span className="hidden sm:inline">+ New Project</span>
        </button>

        {/* Header Sign Out button */}
        <button
          id="btn-header-logout"
          onClick={logout}
          title="Sign out to Login Screen"
          className="h-8 w-8 sm:h-8.5 sm:w-8.5 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </header>
  );
};

