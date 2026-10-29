import React from 'react';
import { NavTab } from './Sidebar';
import { RefreshCw, Flame, Volume2, VolumeX, BellRing, Activity, Radio } from 'lucide-react';

interface TopBarProps {
  currentTab: NavTab;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSimulator: () => void;
  autoRecoveryEnabled: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onTestSound?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onRefresh,
  isRefreshing,
  onOpenSimulator,
  autoRecoveryEnabled,
  isMuted = false,
  onToggleMute,
  onTestSound,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'System Overview',
      subtitle: 'Real-time telemetry, service health fleet, and self-healing KPIs',
    },
    services: {
      title: 'Service Health Fleet',
      subtitle: 'Continuous HTTP health probing, SLA latency metrics, and hardware utilization',
    },
    incidents: {
      title: 'Incident Desk',
      subtitle: 'Active and resolved incidents, root-cause states, and recovery lifecycles',
    },
    diagnosis: {
      title: 'Root-Cause Analysis',
      subtitle: 'Hybrid diagnostic baseline, ML classifications, and evidence correlation audit',
    },
    recovery: {
      title: 'Recovery Policies',
      subtitle: 'Allowlisted remediation policies, cooldown enforcement, and execution trails',
    },
    analytics: {
      title: 'Reliability Analytics',
      subtitle: 'MTTR, recovery success rates, failure distribution, and SLA uptime trends',
    },
    simulator: {
      title: 'Fault Simulator',
      subtitle: 'Interactive testbed to inject failure modes and demonstrate autonomous self-healing',
    },
    settings: {
      title: 'Engine Settings',
      subtitle: 'Probe intervals, SLA timeouts, resource thresholds, and security policies',
    },
  };

  const current = titles[currentTab] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="h-16 px-6 bg-[#0C1426]/75 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between gap-6 shrink-0 z-10 sticky top-0">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Chimera</span>
          <span className="text-slate-400">/</span>
          <h1 className="font-heading text-sm font-semibold text-slate-100 tracking-tight">
            {current.title}
          </h1>
        </div>
      </div>

      {/* Monitoring & Telemetry Status Badges */}
      <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-400">Engine:</span>
          <span className={autoRecoveryEnabled ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
            {autoRecoveryEnabled ? 'Closed-Loop Active' : 'Manual Approval'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Probe:</span>
          <span className="text-slate-200 font-medium">4.0s</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400">
          <Radio className="w-3.5 h-3.5 text-indigo-400" />
          <span>Audio:</span>
          <span className={!isMuted ? 'text-sky-300 font-medium' : 'text-slate-400'}>
            {!isMuted ? '1s Warning' : 'Muted'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Test Alert Sound */}
        {onTestSound && (
          <button
            onClick={onTestSound}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-950/30"
            title="Test the 1-second fault alarm audio and notification toast"
          >
            <BellRing className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Test Sound</span>
          </button>
        )}

        {/* Audio Mute/Unmute Toggle */}
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isMuted
                ? 'text-slate-400 bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.07]'
                : 'text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/25'
            }`}
            title={isMuted ? 'Sound alerts are muted. Click to enable 1-second warning sound.' : 'Sound alerts active. Click to mute.'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline font-mono text-[11px]">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden md:inline font-mono text-[11px]">Sound ON</span>
              </>
            )}
          </button>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.08] transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
          title="Refresh telemetry and incidents"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Fault Injection Button */}
        <button
          onClick={onOpenSimulator}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 hover:text-rose-100 border border-rose-500/35 transition-all flex items-center gap-1.5 shadow-sm shadow-rose-950/40 cursor-pointer group"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          <span className="whitespace-nowrap font-medium">Inject Fault</span>
        </button>
      </div>
    </header>
  );
};
