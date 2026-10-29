import React, { useEffect } from 'react';
import {
  AlertTriangle,
  X,
  Volume2,
  ExternalLink,
  Flame,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { soundAlert } from '../utils/soundAlert';

export interface FaultNotification {
  id: string;
  title: string;
  serviceName: string;
  category?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  timestamp: string;
  incidentId?: string;
}

interface FaultAlertToastProps {
  notifications: FaultNotification[];
  onDismiss: (id: string) => void;
  onNavigateToIncident?: (incidentId?: string) => void;
  onNavigateToSimulator?: () => void;
}

export const FaultAlertToast: React.FC<FaultAlertToastProps> = ({
  notifications,
  onDismiss,
  onNavigateToIncident,
  onNavigateToSimulator,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      aria-live="assertive"
    >
      {notifications.map((item) => (
        <ToastItem
          key={item.id}
          item={item}
          onDismiss={() => onDismiss(item.id)}
          onNavigateToIncident={onNavigateToIncident}
          onNavigateToSimulator={onNavigateToSimulator}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  item: FaultNotification;
  onDismiss: () => void;
  onNavigateToIncident?: (incidentId?: string) => void;
  onNavigateToSimulator?: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  item,
  onDismiss,
  onNavigateToIncident,
  onNavigateToSimulator,
}) => {
  useEffect(() => {
    // Auto-dismiss after 9 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 9000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundAlert.playFaultSound({ force: true, durationMs: 1000 });
  };

  return (
    <div className="pointer-events-auto bg-[#0C1426]/95 backdrop-blur-xl border border-rose-500/40 rounded-2xl p-4.5 shadow-2xl shadow-rose-950/70 transition-all duration-300 animate-in fade-in slide-in-from-top-4 overflow-hidden relative group">
      {/* Radiant glow accent on top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse" />

      <div className="flex items-start gap-3.5">
        {/* Pulsing Alert Icon */}
        <div className="relative shrink-0 mt-0.5">
          <span className="absolute -inset-1 rounded-xl bg-rose-500/30 animate-ping opacity-75 duration-1000" />
          <div className="relative w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold font-mono tracking-wider text-rose-400 uppercase">
                Fault Injected / Detected
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                1s AUDIO ALERT
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="font-heading text-sm font-semibold text-slate-100 mt-1 leading-snug">
            {item.title}
          </h4>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono">
            <span className="text-rose-300 font-medium">Target: {item.serviceName}</span>
            {item.category && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{item.category}</span>
              </>
            )}
          </div>

          <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed bg-[#080D1A]/90 p-2.5 rounded-xl border border-white/[0.06] font-mono">
            {item.details}
          </p>

          {/* Action Row */}
          <div className="mt-3.5 flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
            {/* 1-second sound replay indicator */}
            <button
              onClick={handleReplay}
              className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 px-2.5 py-1 rounded-lg border border-sky-800/50 transition-colors cursor-pointer"
              title="Replay the 1-second fault warning sound"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Replay 1s Sound</span>
            </button>

            <div className="flex items-center gap-2">
              {item.incidentId && onNavigateToIncident && (
                <button
                  onClick={() => onNavigateToIncident(item.incidentId)}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 px-3 py-1 rounded-lg border border-white/[0.08] transition-colors cursor-pointer"
                >
                  <Activity className="w-3 h-3 text-rose-400" />
                  <span>View Incident</span>
                </button>
              )}
              {onNavigateToSimulator && (
                <button
                  onClick={onNavigateToSimulator}
                  className="flex items-center gap-1 text-[11px] font-medium text-amber-200 hover:text-amber-100 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-800/50 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Simulator</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800/60">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-[9000ms] ease-linear w-full"
          style={{
            animation: 'toastProgress 9000ms linear forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
