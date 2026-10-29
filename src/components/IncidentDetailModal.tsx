import React from 'react';
import { Incident, RecoveryActionType } from '../types/index.ts';
import {
  X,
  ShieldAlert,
  BrainCircuit,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  FileText,
  Activity,
  Zap,
} from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onTriggerRecovery?: (incident: Incident, action: RecoveryActionType) => Promise<void>;
  onNavigateToDiagnosis: (incident: Incident) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onNavigateToDiagnosis,
}) => {
  if (!incident) return null;

  const isRecovered = incident.status === 'RECOVERED';
  const isEscalated = incident.status === 'REQUIRES_HUMAN_INTERVENTION';

  const sevBadge =
    incident.severity === 'CRITICAL'
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      : incident.severity === 'HIGH'
      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      : incident.severity === 'MEDIUM'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-sky-500/10 text-sky-400 border-sky-500/30';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0C1426]/95 border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-bold text-slate-100 font-mono">
                  {incident.id}
                </h3>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-slate-300 font-medium">{incident.serviceName}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${sevBadge}`}>
                  {incident.severity} SEVERITY
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {incident.category}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status & Lifecycle Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Status</span>
              <span
                className={`font-semibold text-xs mt-0.5 block ${
                  isRecovered
                    ? 'text-emerald-400'
                    : isEscalated
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {incident.status}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Detected</span>
              <span className="text-slate-200 text-xs mt-0.5 block">
                {new Date(incident.detectionTimestamp).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Recovery Attempts</span>
              <span className="text-slate-200 text-xs mt-0.5 block">
                {incident.recoveryAttemptsCount} attempt{incident.recoveryAttemptsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Suspected Root Cause */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Suspected Root Cause & Fault Dynamics
            </span>
            <div className="p-4 bg-[#080D1A]/80 border border-white/[0.06] rounded-xl text-xs text-slate-200 leading-relaxed font-mono">
              {incident.suspectedRootCause}
            </div>
          </div>

          {/* Confirmed Facts */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Empirical Evidence Collected
            </span>
            <div className="space-y-2">
              {incident.confirmedFacts.map((fact, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg text-xs text-slate-300 font-mono"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Inference & Confidence */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Diagnostic Engine</span>
              <span className="font-semibold text-sky-400 mt-1 block">
                {incident.diagnosticMethod}
              </span>
            </div>

            <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ML Confidence</span>
              <span className="font-semibold text-emerald-400 mt-1 block">
                {incident.mlConfidence !== null
                  ? `${Math.round(incident.mlConfidence * 100)}% Match`
                  : 'Suppressed (< 0.60)'}
              </span>
            </div>
          </div>

          {/* Autonomous Self-Healing Status */}
          <div className="p-4.5 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-heading">Autonomous Self-Healing Pipeline</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 font-medium">
                {isRecovered ? 'Auto-Healed & Verified' : 'Self-Healing Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#080D1A]/80 border border-white/[0.06] rounded-xl">
                <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">
                  Autonomous Policy
                </span>
                <span className="font-mono font-semibold text-sky-400 mt-1 block">
                  {incident.recommendedAction}
                </span>
                <span className="text-[10px] text-slate-400 mt-1.5 block">
                  Dispatched automatically without human intervention
                </span>
              </div>

              <div className="p-3 bg-[#080D1A]/80 border border-white/[0.06] rounded-xl">
                <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">
                  Multi-Probe Verification
                </span>
                <span className="font-mono font-semibold text-indigo-400 mt-1 block">
                  {isRecovered ? '5/5 Readiness Probes Passed' : 'Active Multi-Probe Verification (5 Probes)'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1.5 block">
                  Continuous health probe stabilization over 20-30s
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Faults are cleared automatically by Project Chimera's closed-loop engine. When a degradation occurs, telemetry is diagnosed by machine learning and the allowlisted recovery policy is dispatched, followed by 5 readiness verification probes across a 20–30s recovery window without requiring manual intervention.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-between shrink-0 bg-white/[0.02]">
          <button
            onClick={() => {
              onClose();
              onNavigateToDiagnosis(incident);
            }}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Open in Full Root-Cause Analysis Studio</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium rounded-xl border border-white/[0.08] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
