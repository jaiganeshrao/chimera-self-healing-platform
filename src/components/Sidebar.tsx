import React from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  BrainCircuit,
  Wrench,
  BarChart3,
  Settings,
  Flame,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'services'
  | 'incidents'
  | 'diagnosis'
  | 'recovery'
  | 'analytics'
  | 'settings'
  | 'simulator';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeIncidentsCount,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'System Overview', icon: LayoutDashboard },
    { id: 'services', label: 'Service Health', icon: Activity },
    { id: 'incidents', label: 'Incident Desk', icon: AlertTriangle, badge: activeIncidentsCount },
    { id: 'diagnosis', label: 'Root-Cause Analysis', icon: BrainCircuit },
    { id: 'recovery', label: 'Recovery Policies', icon: Wrench },
    { id: 'analytics', label: 'Reliability Analytics', icon: BarChart3 },
    { id: 'simulator', label: 'Fault Simulator', icon: Flame },
    { id: 'settings', label: 'Engine Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0C1426] border-r border-white/[0.06] flex flex-col shrink-0 select-none relative z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950/40">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-heading text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
            Project Chimera
          </span>
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous v1.0
          </span>
        </div>
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Reliability Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-transparent text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-950/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="tracking-wide">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Telemetry Status */}
      <div className="p-4 border-t border-white/[0.06] bg-black/20 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400" />
            Watchdog Status
          </span>
          <span className="font-mono text-emerald-400 font-medium">Active · 4s</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono truncate">
          Target: Order Processing Svc
        </div>
      </div>
    </aside>
  );
};
