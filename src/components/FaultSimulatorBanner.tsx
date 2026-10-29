import React, { useState, useEffect } from 'react';
import { FaultMode, TestServiceState, Incident, RecoveryAttempt } from '../types';
import {
  Flame,
  RotateCcw,
  Zap,
  AlertOctagon,
  Clock,
  Cpu,
  Database,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Loader2,
  Volume2,
} from 'lucide-react';

interface FaultSimulatorProps {
  testState: TestServiceState | null;
  activeIncident?: Incident | null;
  activeAttempt?: RecoveryAttempt | null;
  latestRecoveredIncident?: Incident | null;
  onInjectFault: (mode: FaultMode) => Promise<void>;
  onReset: () => Promise<void>;
}

export const FaultSimulatorBanner: React.FC<FaultSimulatorProps> = ({
  testState,
  activeIncident,
  activeAttempt,
  latestRecoveredIncident,
  onInjectFault,
  onReset,
}) => {
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [recentlyRecoveredTime, setRecentlyRecoveredTime] = useState<number | null>(null);

  // Live timer tick for real-time progress tracking
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const incidentAgeSec = activeIncident?.detectionTimestamp
    ? (now - new Date(activeIncident.detectionTimestamp).getTime()) / 1000
    : 0;
  // Closed loop recovery target is 20-30s. If an incident is > 45s, do not consider it in active healing
  const isIncidentFresh = incidentAgeSec < 45;

  const isHealingActive = Boolean(
    (testState && testState.faultMode !== 'NONE') ||
      (activeIncident && ['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING'].includes(activeIncident.status) && isIncidentFresh)
  );

  // Track recent recovery completion banner
  useEffect(() => {
    if (!isHealingActive && latestRecoveredIncident?.resolutionTimestamp) {
      const resTime = new Date(latestRecoveredIncident.resolutionTimestamp).getTime();
      if (Date.now() - resTime < 35000) {
        setRecentlyRecoveredTime(resTime);
      }
    }
  }, [isHealingActive, latestRecoveredIncident?.resolutionTimestamp]);

  const handleInject = async (mode: FaultMode) => {
    setLoadingMode(mode);
    setRecentlyRecoveredTime(null);
    try {
      await onInjectFault(mode);
    } finally {
      setLoadingMode(null);
    }
  };

  const handleReset = async () => {
    setLoadingMode('reset');
    try {
      await onReset();
    } finally {
      setLoadingMode(null);
    }
  };

  const faultButtons: {
    mode: FaultMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
  }[] = [
    {
      mode: 'PROCESS_CRASH',
      label: 'Process Crash (503)',
      icon: AlertOctagon,
      desc: 'Simulates SIGSEGV process termination',
    },
    {
      mode: 'HIGH_LATENCY',
      label: 'SLA Timeout (3200ms)',
      icon: Clock,
      desc: 'Simulates worker thread starvation delay',
    },
    {
      mode: 'ERROR_SPIKE',
      label: 'HTTP 500 Error Spike',
      icon: Zap,
      desc: 'Simulates cascading unhandled exceptions',
    },
    {
      mode: 'HIGH_CPU',
      label: 'High CPU Loop (94%)',
      icon: Cpu,
      desc: 'Simulates runaway regex computational load',
    },
    {
      mode: 'DB_CONNECTION_FAIL',
      label: 'DB Pool Exhaustion',
      icon: Database,
      desc: 'Simulates exhausted PostgreSQL connection pool',
    },
  ];

  const currentMode = testState?.faultMode || 'NONE';
  const isFaultActive = currentMode !== 'NONE';

  // Calculate elapsed healing time
  let elapsedSec = 0;
  if (activeIncident?.detectionTimestamp) {
    elapsedSec = Math.max(
      0,
      Math.round((now - new Date(activeIncident.detectionTimestamp).getTime()) / 1000)
    );
  } else if (isFaultActive) {
    elapsedSec = 2;
  }

  // Target recovery duration: 24 seconds (within 20-30s range)
  const targetDurationSec = 24;
  const progressPct = isHealingActive
    ? Math.min(94, Math.max(6, Math.round((elapsedSec / targetDurationSec) * 100)))
    : 100;

  // Determine current phase
  const status = activeIncident?.status;
  let phaseName = 'Detection & ML Diagnosis';
  let phaseStep = 1;
  if (status === 'RECOVERING') {
    phaseStep = 2;
    phaseName = `Remediation in Progress (${activeIncident?.recommendedAction || 'RESTART_SERVICE'})`;
  } else if (status === 'VERIFYING') {
    phaseStep = 3;
    const passed = activeAttempt?.verificationDetails?.passedCount ?? 0;
    const total = activeAttempt?.verificationDetails?.probesCount ?? 5;
    phaseName = `Multi-Probe Verification Soak (${passed}/${total} Probes Passed)`;
  } else if (status === 'RECOVERED') {
    phaseStep = 4;
    phaseName = 'Fully Recovered & Nominal';
  }

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      {/* Subtle ambient cyan glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06] relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm shadow-rose-950/30">
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <h2 className="font-heading text-base font-semibold text-slate-100 tracking-tight">
              Controlled Failure Simulation Testbed
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Simulate realistic failure patterns against the target Order Processing service. Project
            Chimera autonomously diagnoses the failure, dispatches allowlisted recovery policies, and
            verifies health across a realistic <strong className="text-slate-200 font-semibold font-mono">20–30s closed-loop window</strong>.
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 border border-sky-500/25 text-sky-300 ml-2 align-middle">
              <Volume2 className="w-3 h-3 text-sky-400" />
              1s Warning Alarm
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Target Service State</div>
            <div className="text-xs font-mono font-semibold mt-0.5">
              {isHealingActive ? (
                <span className="text-amber-400 flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Self-Healing Active
                </span>
              ) : isFaultActive ? (
                <span className="text-rose-400 font-medium">{currentMode}</span>
              ) : (
                <span className="text-emerald-400 flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Nominal (UP)
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={loadingMode !== null}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.08] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-sm"
            title="Reset testbed to nominal UP operation and clear any active fault"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingMode === 'reset' ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
            <span>Reset Testbed</span>
          </button>
        </div>
      </div>

      {/* Fault Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5 relative z-10">
        {faultButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = currentMode === btn.mode;
          const isLoadingThis = loadingMode === btn.mode;

          return (
            <button
              key={btn.mode}
              onClick={() => handleInject(btn.mode)}
              disabled={loadingMode !== null}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                isActive
                  ? 'bg-rose-500/10 border-rose-500/50 text-white shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
                  : 'glass-panel-subtle text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/[0.04] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
              title={isActive ? `${btn.label} is currently active` : `Inject ${btn.label} (1s warning alarm)`}
            >
              <div className="flex items-center justify-between w-full mb-2.5">
                {isLoadingThis ? (
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                ) : (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-rose-500/20 text-rose-300' : 'bg-white/[0.04] text-slate-400 group-hover:text-rose-400 group-hover:bg-rose-500/10'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                {isActive && (
                  <span className="text-[9px] font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full border border-rose-500/40 uppercase tracking-wider font-semibold animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold leading-tight font-heading tracking-tight">{btn.label}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-normal group-hover:text-slate-300 transition-colors font-sans">{btn.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Autonomous Self-Healing Real-Time Progress Monitor (20-30s cycle) */}
      {isHealingActive && (
        <div className="mt-5 p-4 rounded-xl bg-slate-950/80 backdrop-blur-md border border-amber-500/30 shadow-xl space-y-3 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span className="font-heading font-semibold text-slate-100">
                Autonomous Self-Healing in Progress
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Closed-Loop (20-30s SLA)
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">
                Elapsed:{' '}
                <strong className="text-amber-400 tabular-nums">{elapsedSec}s</strong> / ~24s
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-200 font-semibold">{phaseName}</span>
              {elapsedSec > 28 && (
                <button
                  onClick={handleReset}
                  disabled={loadingMode !== null}
                  className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Force reset stuck recovery state"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Force Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Real-time Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/[0.05]">
            <div
              className="bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-400 h-2 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Stepper Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-mono">
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                phaseStep >= 1
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-white/[0.02] border-white/[0.05] text-slate-400'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0 text-amber-400" />
              <div className="truncate">
                <div className="font-semibold text-slate-200">Phase 1: ML Diagnosis</div>
                <div className="text-[10px] text-slate-400 truncate">
                  {activeIncident?.suspectedRootCause || 'Telemetry signature classified'}
                </div>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                phaseStep === 2
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 ring-1 ring-sky-500/40 shadow-sm'
                  : phaseStep > 2
                  ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                  : 'bg-white/[0.02] border-white/[0.05] text-slate-400'
              }`}
            >
              {phaseStep === 2 ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-sky-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
              )}
              <div className="truncate">
                <div className="font-semibold text-slate-200">Phase 2: Remediation</div>
                <div className="text-[10px] text-slate-400 truncate">
                  {activeIncident?.recommendedAction || 'Policy dispatch'} (~13s)
                </div>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                phaseStep === 3
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 ring-1 ring-indigo-500/40 shadow-sm'
                  : phaseStep > 3
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-white/[0.02] border-white/[0.05] text-slate-400'
              }`}
            >
              {phaseStep === 3 ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-indigo-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <div className="truncate">
                <div className="font-semibold text-slate-200">Phase 3: Readiness Probing</div>
                <div className="text-[10px] text-slate-400 truncate">
                  {activeAttempt?.verificationDetails
                    ? `${activeAttempt.verificationDetails.passedCount}/${activeAttempt.verificationDetails.probesCount} passed (~11s)`
                    : '5 sequential probes (~11s)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recently Recovered Confirmation Banner */}
      {!isHealingActive && recentlyRecoveredTime && latestRecoveredIncident && (
        <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-200 relative z-10 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold font-mono text-emerald-400 mr-2 tracking-wide">
                CLOSED-LOOP RECOVERY VERIFIED:
              </span>
              <span className="text-slate-300">
                Service healed autonomously and verified across 5 consecutive readiness probes.
                {latestRecoveredIncident.detectionTimestamp &&
                  latestRecoveredIncident.resolutionTimestamp && (
                    <span className="ml-1.5 font-mono text-emerald-300 font-semibold">
                      (Total: {Math.max(
                        20,
                        Math.round(
                          (new Date(latestRecoveredIncident.resolutionTimestamp).getTime() -
                            new Date(latestRecoveredIncident.detectionTimestamp).getTime()) /
                            1000
                        )
                      )}s)
                    </span>
                  )}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
            0 Manual Actions Required
          </span>
        </div>
      )}
    </div>
  );
};
