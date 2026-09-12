import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  ClipboardList,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onToggleSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onToggleSidebar,
}) => {
  const primaryTabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Building2 },
    { id: 'costs', label: 'Costs', icon: Receipt },
    { id: 'site_reports', label: 'Site Logs', icon: ClipboardList },
  ];

  const isMoreActive = !['dashboard', 'projects', 'costs', 'site_reports'].includes(currentTab);

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden shadow-lg transition-transform duration-200 ease-in-out"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="grid grid-cols-5 h-13 px-1">
        {primaryTabs.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer select-none ${
                isActive
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-8 h-7 rounded-lg transition-colors ${
                  isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </div>
              <span className="text-[10px] tracking-tight leading-none mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 5th slot: Menu Drawer button (WBS, Archive, Benchmark, Reports, Settings) */}
        <button
          id="mobile-tab-menu"
          onClick={onToggleSidebar}
          className={`flex flex-col items-center justify-center py-1 transition-all active:scale-95 cursor-pointer select-none ${
            isMoreActive
              ? 'text-slate-950 font-bold'
              : 'text-slate-600 hover:text-slate-900 font-medium'
          }`}
        >
          <div
            className={`relative flex items-center justify-center w-8 h-7 rounded-lg transition-colors ${
              isMoreActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600'
            }`}
          >
            <Menu className={`w-4 h-4 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {isMoreActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none mt-0.5">
            {isMoreActive ? currentTab.replace('_', ' ') : 'More'}
          </span>
        </button>
      </div>
    </nav>
  );
};
