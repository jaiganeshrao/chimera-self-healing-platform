import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import {
  Settings,
  Save,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Activity,
  Lock,
  Cpu,
  HardDrive,
  Clock,
  Zap,
  UserCheck,
  Bot,
  AlertCircle,
  HelpCircle,
  Info,
  Layers,
  Terminal,
  ExternalLink,
  Ban,
  Check,
} from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings | null;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
}

const DEFAULT_FACTORY_SETTINGS: SystemSettings = {
  monitoringIntervalSec: 4,
  timeoutMs: 3000,
  errorRateThresholdPct: 25,
  cpuWarningThresholdPct: 70,
  cpuThresholdPct: 80,
  memoryWarningThresholdPct: 75,
  memoryThresholdPct: 85,
  maxRecoveryAttempts: 3,
  recoveryCooldownSec: 25,
  autoRecoveryEnabled: true,
  verificationProbesCount: 5,
  allowedHosts: ['localhost', '127.0.0.1', 'ais-dev', '0.0.0.0'],
};

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState<SystemSettings>(() => ({
    ...DEFAULT_FACTORY_SETTINGS,
    ...(settings || {}),
  }));

  // Sync state if settings prop changes externally
  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        ...settings,
        cpuWarningThresholdPct: settings.cpuWarningThresholdPct ?? 70,
        memoryWarningThresholdPct: settings.memoryWarningThresholdPct ?? 75,
      }));
    }
  }, [settings]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    timestamp?: string;
  } | null>(null);

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Field Validation
  const validateSettings = (data: SystemSettings): string[] => {
    const errors: string[] = [];

    // Probe interval: 1 to 60 seconds
    if (!Number.isInteger(data.monitoringIntervalSec) || data.monitoringIntervalSec < 1 || data.monitoringIntervalSec > 60) {
      errors.push('Probe interval must be an integer between 1 and 60 seconds.');
    }

    // Response timeout: 500 to 10000 ms
    if (!Number.isInteger(data.timeoutMs) || data.timeoutMs < 500 || data.timeoutMs > 10000) {
      errors.push('Response timeout must be an integer between 500 and 10,000 milliseconds.');
    }

    const cpuWarn = data.cpuWarningThresholdPct ?? 70;
    const cpuCrit = data.cpuThresholdPct;
    if (cpuWarn < 10 || cpuWarn > 98) {
      errors.push('CPU Warning threshold must be between 10% and 98%.');
    }
    if (cpuCrit < 20 || cpuCrit > 99) {
      errors.push('CPU Critical threshold must be between 20% and 99%.');
    }
    if (cpuWarn >= cpuCrit) {
      errors.push(`CPU Warning threshold (${cpuWarn}%) must be strictly lower than CPU Critical threshold (${cpuCrit}%).`);
    }

    const memWarn = data.memoryWarningThresholdPct ?? 75;
    const memCrit = data.memoryThresholdPct;
    if (memWarn < 10 || memWarn > 98) {
      errors.push('Memory Warning threshold must be between 10% and 98%.');
    }
    if (memCrit < 20 || memCrit > 99) {
      errors.push('Memory Critical threshold must be between 20% and 99%.');
    }
    if (memWarn >= memCrit) {
      errors.push(`Memory Warning threshold (${memWarn}%) must be strictly lower than Memory Critical threshold (${memCrit}%).`);
    }

    // Recovery cooldown: 5 to 300 seconds
    if (!Number.isInteger(data.recoveryCooldownSec) || data.recoveryCooldownSec < 5 || data.recoveryCooldownSec > 300) {
      errors.push('Recovery cooldown must be an integer between 5 and 300 seconds.');
    }

    // Maximum recovery attempts: 1 to 10
    if (!Number.isInteger(data.maxRecoveryAttempts) || data.maxRecoveryAttempts < 1 || data.maxRecoveryAttempts > 10) {
      errors.push('Maximum recovery attempts must be an integer between 1 and 10.');
    }

    // Verification probes count: 1 to 10
    if (!Number.isInteger(data.verificationProbesCount) || data.verificationProbesCount < 1 || data.verificationProbesCount > 10) {
      errors.push('Verification probes count must be an integer between 1 and 10.');
    }

    return errors;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveNotification(null);

    const errors = validateSettings(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setSaveNotification({
        type: 'error',
        message: 'Please resolve the validation errors highlighted below before saving.',
      });
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);

    try {
      await onUpdateSettings(formData);
      setSaveNotification({
        type: 'success',
        message: 'Engine configuration successfully updated and synchronized with the backend monitoring daemon.',
        timestamp: new Date().toLocaleTimeString(),
      });
      // Auto-hide success banner after 6 seconds
      setTimeout(() => {
        setSaveNotification((prev) => (prev?.type === 'success' ? null : prev));
      }, 6000);
    } catch (err: any) {
      setSaveNotification({
        type: 'error',
        message: err.message || 'Failed to save settings to the backend storage daemon.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    setValidationErrors([]);
    try {
      await onUpdateSettings(DEFAULT_FACTORY_SETTINGS);
      setFormData(DEFAULT_FACTORY_SETTINGS);
      setShowResetConfirmModal(false);
      setSaveNotification({
        type: 'success',
        message: 'Factory baseline settings restored and synchronized with backend monitoring daemon.',
        timestamp: new Date().toLocaleTimeString(),
      });
      setTimeout(() => {
        setSaveNotification((prev) => (prev?.type === 'success' ? null : prev));
      }, 6000);
    } catch (err: any) {
      setSaveNotification({
        type: 'error',
        message: err.message || 'Failed to restore default settings.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const cpuWarn = formData.cpuWarningThresholdPct ?? 70;
  const cpuCrit = formData.cpuThresholdPct;
  const memWarn = formData.memoryWarningThresholdPct ?? 75;
  const memCrit = formData.memoryThresholdPct;

  return (
    <div className="max-w-5xl space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header with Real-Time Backend Status */}
      <div className="glass-panel p-6 border-l-4 border-l-sky-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-100 tracking-wide">
                  Engine Architecture & Autonomous Governance
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tune SLA probe frequencies, multi-tier saturation alerts, autonomous self-healing postures, and safety rails.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Backend Enforced
            </span>
            <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-mono text-sky-400">
              Storage: Persistent JSON
            </span>
          </div>
        </div>
      </div>

      {/* Global Notification Banner (Success / Error) */}
      {saveNotification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-in fade-in duration-200 ${
            saveNotification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {saveNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs font-mono leading-relaxed">
            <span className="font-bold block text-sm font-sans mb-0.5">
              {saveNotification.type === 'success' ? 'Configuration Synchronized' : 'Action Failed'}
            </span>
            {saveNotification.message}
            {saveNotification.timestamp && (
              <span className="text-[11px] opacity-75 block mt-1">
                Last synchronized: {saveNotification.timestamp}
              </span>
            )}
          </div>
          <button
            onClick={() => setSaveNotification(null)}
            className="text-slate-400 hover:text-slate-200 text-xs font-mono px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Validation Error Summary */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold font-mono uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Validation Errors Detected ({validationErrors.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-200 font-mono">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* SECTION 1: MONITORING CONFIGURATION                                      */}
        {/* ========================================================================= */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  1. Monitoring Configuration
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure SLA health check probing cadence, response latency budgets, and multi-tier resource saturation thresholds.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-md">
              Backend Loop Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Probe Interval */}
            <div className="p-4.5 bg-[#080D1A]/70 border border-white/[0.06] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-medium text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Probe Interval</span>
                </label>
                <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 bg-sky-500/10 rounded border border-sky-500/20">
                  {formData.monitoringIntervalSec}s
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pacing between consecutive health-check probe rounds dispatched across all registered fleet microservices. (Configurable: 1–60s, Default: 4s).
              </p>

              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={formData.monitoringIntervalSec}
                  onChange={(e) =>
                    setFormData({ ...formData, monitoringIntervalSec: parseInt(e.target.value) || 4 })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 4, 10, 30].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setFormData({ ...formData, monitoringIntervalSec: sec })}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                          formData.monitoringIntervalSec === sec
                            ? 'bg-sky-500 text-white font-bold'
                            : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.monitoringIntervalSec}
                      onChange={(e) =>
                        setFormData({ ...formData, monitoringIntervalSec: parseInt(e.target.value) || 1 })
                      }
                      className="w-16 px-2 py-1 bg-[#0C1426] border border-white/[0.1] rounded text-xs text-slate-100 font-mono text-center focus:border-sky-400 focus:outline-none"
                    />
                    <span className="text-xs font-mono text-slate-400">sec</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Timeout */}
            <div className="p-4.5 bg-[#080D1A]/70 border border-white/[0.06] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-medium text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Response Timeout Budget</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                  {formData.timeoutMs} ms
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Health probe timeout ceiling. Responses exceeding this threshold trigger a REQUEST_TIMEOUT degradation incident. (Configurable: 500–10000ms, Default: 3000ms).
              </p>

              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="250"
                  value={formData.timeoutMs}
                  onChange={(e) =>
                    setFormData({ ...formData, timeoutMs: parseInt(e.target.value) || 3000 })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {[1000, 2000, 3000, 5000].map((ms) => (
                      <button
                        key={ms}
                        type="button"
                        onClick={() => setFormData({ ...formData, timeoutMs: ms })}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                          formData.timeoutMs === ms
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                        }`}
                      >
                        {ms / 1000}s
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="500"
                      max="10000"
                      step="100"
                      value={formData.timeoutMs}
                      onChange={(e) =>
                        setFormData({ ...formData, timeoutMs: parseInt(e.target.value) || 500 })
                      }
                      className="w-20 px-2 py-1 bg-[#0C1426] border border-white/[0.1] rounded text-xs text-slate-100 font-mono text-center focus:border-amber-400 focus:outline-none"
                    />
                    <span className="text-xs font-mono text-slate-400">ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CPU Warning & Critical Thresholds */}
            <div className="p-4.5 bg-[#080D1A]/70 border border-white/[0.06] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <label className="text-xs font-mono font-medium text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>CPU Telemetry Saturation Thresholds</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">Warn vs Crit</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dual-tier thresholds: Warning classifies service as degraded and alerts telemetry logs. Critical triggers automated diagnosis and thread pool recycling remediation.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Warning */}
                <div className="p-3 bg-[#0C1426] border border-amber-500/20 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Warning
                    </span>
                    <span className="font-bold text-slate-200">{cpuWarn}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="98"
                    value={cpuWarn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cpuWarningThresholdPct: parseInt(e.target.value) || 70,
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="text-[10px] font-mono text-slate-400">Default: 70%</div>
                </div>

                {/* Critical */}
                <div className="p-3 bg-[#0C1426] border border-rose-500/20 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Critical
                    </span>
                    <span className="font-bold text-slate-200">{cpuCrit}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="99"
                    value={cpuCrit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cpuThresholdPct: parseInt(e.target.value) || 80,
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                  />
                  <div className="text-[10px] font-mono text-slate-400">Default: 80%</div>
                </div>
              </div>

              {cpuWarn >= cpuCrit && (
                <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Warning threshold must be strictly lower than Critical threshold.</span>
                </div>
              )}
            </div>

            {/* Memory Warning & Critical Thresholds */}
            <div className="p-4.5 bg-[#080D1A]/70 border border-white/[0.06] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                <label className="text-xs font-mono font-medium text-slate-200 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Memory Saturation Thresholds</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400">Warn vs Crit</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dual-tier thresholds: Warning identifies progressive leak slope. Critical triggers container cache reset, garbage collection, and safe worker recycle.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Warning */}
                <div className="p-3 bg-[#0C1426] border border-amber-500/20 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Warning
                    </span>
                    <span className="font-bold text-slate-200">{memWarn}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="98"
                    value={memWarn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        memoryWarningThresholdPct: parseInt(e.target.value) || 75,
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="text-[10px] font-mono text-slate-400">Default: 75%</div>
                </div>

                {/* Critical */}
                <div className="p-3 bg-[#0C1426] border border-rose-500/20 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-rose-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Critical
                    </span>
                    <span className="font-bold text-slate-200">{memCrit}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="99"
                    value={memCrit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        memoryThresholdPct: parseInt(e.target.value) || 85,
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                  />
                  <div className="text-[10px] font-mono text-slate-400">Default: 85%</div>
                </div>
              </div>

              {memWarn >= memCrit && (
                <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Warning threshold must be strictly lower than Critical threshold.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: RECOVERY CONFIGURATION                                        */}
        {/* ========================================================================= */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  2. Recovery Configuration & Retry Limits
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure cooldown windows, retry ceilings, and readiness probe verification passes.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              Anti-Flapping Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Recovery Cooldown */}
            <div className="p-4.5 bg-[#080D1A]/70 border border-white/[0.06] rounded-xl space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-slate-200">
                    Recovery Cooldown
                  </label>
                  <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 bg-sky-500/10 rounded border border-sky-500/20">
                    {formData.recoveryCooldownSec}s
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Enforces a mandatory stabilization window following an automated remediation attempt. Prevents thrashing, rapid restart flapping loops, and container crash-backoffs. (Configurable: 5–300s, Default: 25s).
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={formData.recoveryCooldownSec}
                  onChange={(e) =>
                    setFormData({ ...formData, recoveryCooldownSec: parseInt(e.target.value) || 25 })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Min: 5s</span>
                  <span>Default: 25s</span>
                  <span>Max: 300s</span>
                </div>
              </div>
            </div>

            {/* Maximum Recovery Attempts */}
            <div className="p-4.5 bg-[#080D1A]/70 border border-white/[0.06] rounded-xl space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-slate-200">
                    Max Recovery Attempts
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                    {formData.maxRecoveryAttempts} attempts
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Upper bound on automated recovery retries per incident. Once this ceiling is reached, automated retries terminate immediately to prevent damage and escalate to human intervention. (Configurable: 1–10, Default: 3).
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={formData.maxRecoveryAttempts}
                  onChange={(e) =>
                    setFormData({ ...formData, maxRecoveryAttempts: parseInt(e.target.value) || 3 })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>1 attempt</span>
                  <span>Default: 3</span>
                  <span>10 attempts</span>
                </div>
              </div>
            </div>

            {/* Verification Probes Count */}
            <div className="p-4.5 bg-[#080D1A]/70 border border-white/[0.06] rounded-xl space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-medium text-slate-200">
                    Verification Probes Count
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                    {formData.verificationProbesCount} probes
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Number of consecutive passing health check probes required across the 20–30s stabilization window before marking the service RECOVERED. (Configurable: 1–10, Default: 5).
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={formData.verificationProbesCount}
                  onChange={(e) =>
                    setFormData({ ...formData, verificationProbesCount: parseInt(e.target.value) || 5 })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>1 probe</span>
                  <span>Default: 5</span>
                  <span>10 probes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hard Stop Guarantee Banner */}
          <div className="p-4 bg-amber-500/[0.07] border border-amber-500/30 rounded-xl flex items-start gap-3">
            <Ban className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs font-mono leading-relaxed">
              <span className="font-bold text-amber-300 block text-sm font-sans mb-0.5">
                Automatic Retry Termination Guarantee
              </span>
              <p className="text-slate-300 font-sans">
                When an incident reaches the configured maximum recovery attempts limit (currently{' '}
                <strong className="text-amber-300 font-mono">{formData.maxRecoveryAttempts}</strong>), Project Chimera{' '}
                <strong className="text-white">automatically stops all automated retries</strong>, changes the incident status to{' '}
                <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-[11px] font-mono text-amber-300">
                  REQUIRES_HUMAN_INTERVENTION
                </span>
                , and records an escalation audit log. No infinite retry loops occur.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: OPERATING MODE                                                */}
        {/* ========================================================================= */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  3. Operating Mode & Remediation Posture
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select between full machine autonomy or Human-In-The-Loop approval for recovery dispatches.
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                formData.autoRecoveryEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {formData.autoRecoveryEnabled ? 'AUTONOMOUS ACTIVE' : 'HUMAN APPROVAL REQUIRED'}
            </span>
          </div>

          {/* Prominent Current Operating Mode Status Display */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              formData.autoRecoveryEnabled
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-amber-950/20 border-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.autoRecoveryEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                {formData.autoRecoveryEnabled ? (
                  <Bot className="w-5 h-5 animate-pulse" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Currently Active Engine Posture
                </div>
                <div className="text-base font-heading font-bold text-slate-100">
                  {formData.autoRecoveryEnabled
                    ? 'Autonomous Self-Healing Mode'
                    : 'Human Approval Required (HITL Mode)'}
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-300 sm:text-right">
              <div className="text-[11px] text-slate-400">Backend Execution:</div>
              <div
                className={
                  formData.autoRecoveryEnabled ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                }
              >
                {formData.autoRecoveryEnabled
                  ? 'Policies Execute Automatically'
                  : 'Remediation Held for Approval'}
              </div>
            </div>
          </div>

          {/* Two Selectable Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Mode 1: Autonomous Healing */}
            <div
              onClick={() => setFormData({ ...formData, autoRecoveryEnabled: true })}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                formData.autoRecoveryEnabled
                  ? 'bg-[#0C1426] border-sky-400 ring-2 ring-sky-400/20 shadow-xl shadow-sky-950/50'
                  : 'bg-[#080D1A]/60 border-white/[0.08] hover:border-white/[0.2] hover:bg-[#0C1426]/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      formData.autoRecoveryEnabled
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-slate-100">
                      Autonomous Healing
                    </h4>
                    <span className="text-[10px] font-mono text-sky-400">
                      Zero-Latency Closed Loop
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    formData.autoRecoveryEnabled
                      ? 'border-sky-400 bg-sky-500 text-white'
                      : 'border-slate-600 bg-slate-800/80'
                  }`}
                >
                  {formData.autoRecoveryEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-3.5 leading-relaxed">
                Execute approved recovery policies automatically upon ML fault diagnosis. Self-healing dispatches within milliseconds and verifies recovery across 5 probe cycles without human intervention.
              </p>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Workflow:</span>
                <span className="text-sky-300 font-medium">Detect → ML Diagnose → Auto-Heal</span>
              </div>
            </div>

            {/* Mode 2: Human Approval */}
            <div
              onClick={() => setFormData({ ...formData, autoRecoveryEnabled: false })}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                !formData.autoRecoveryEnabled
                  ? 'bg-[#0C1426] border-amber-400 ring-2 ring-amber-400/20 shadow-xl shadow-amber-950/50'
                  : 'bg-[#080D1A]/60 border-white/[0.08] hover:border-white/[0.2] hover:bg-[#0C1426]/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      !formData.autoRecoveryEnabled
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm font-bold text-slate-100">
                      Human Approval
                    </h4>
                    <span className="text-[10px] font-mono text-amber-400">
                      Human-In-The-Loop (HITL)
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    !formData.autoRecoveryEnabled
                      ? 'border-amber-400 bg-amber-500 text-slate-950'
                      : 'border-slate-600 bg-slate-800/80'
                  }`}
                >
                  {!formData.autoRecoveryEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-3.5 leading-relaxed">
                Require explicit operator approval before executing any recovery action. The monitoring engine detects incidents and generates full ML root-cause diagnostics, but remediation is held until manually authorized.
              </p>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Workflow:</span>
                <span className="text-amber-300 font-medium">Detect → Diagnose → Await Approval</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: SECURITY GUARDRAILS                                           */}
        {/* ========================================================================= */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  4. Security Guardrails & Operational Constraints
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Five immutable protections enforced by the core platform to eliminate unauthorized execution and runaway loops.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              5 Guardrails Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Guardrail 1 */}
            <div className="p-4.5 bg-[#080D1A]/80 border border-white/[0.06] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-heading text-xs font-bold text-slate-100">
                    Allowlisted Actions Only
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono">
                  Enforced
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Only the 5 validated recovery policies (Restart, Retry, Cache Reset, Thread Scale, Circuit Breaker) can be executed. Any unauthorized action string is rejected with a security alert.
              </p>
            </div>

            {/* Guardrail 2 */}
            <div className="p-4.5 bg-[#080D1A]/80 border border-white/[0.06] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-heading text-xs font-bold text-slate-100">
                    Zero Shell Execution
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono">
                  Enforced
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                No arbitrary shell or bash commands are permitted. Policies dispatch exclusively via structured internal service hooks and container lifecycle endpoints.
              </p>
            </div>

            {/* Guardrail 3 */}
            <div className="p-4.5 bg-[#080D1A]/80 border border-white/[0.06] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="font-heading text-xs font-bold text-slate-100">
                    Approved Test Targets
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono">
                  SSRF Filter
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Outbound probing and simulated fault injections are restricted to strictly validated allowlist hosts (<code className="text-sky-300 font-mono">localhost, 127.0.0.1, ais-dev</code>), preventing SSRF attacks.
              </p>
            </div>

            {/* Guardrail 4 */}
            <div className="p-4.5 bg-[#080D1A]/80 border border-white/[0.06] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-emerald-400" />
                  <span className="font-heading text-xs font-bold text-slate-100">
                    Bounded Recovery Retries
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono">
                  Bounded
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Automated remediation strictly respects the attempt limit ({formData.maxRecoveryAttempts}). Recovery terminates automatically if the threshold is met, avoiding endless retry thrashing.
              </p>
            </div>

            {/* Guardrail 5 */}
            <div className="p-4.5 bg-[#080D1A]/80 border border-white/[0.06] rounded-xl space-y-2 md:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span className="font-heading text-xs font-bold text-slate-100">
                    Human Intervention Escalation
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono">
                  Fail-Safe
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                When automated remediation policies fail to restore health or exceed attempt quotas, the incident transitions to <code className="text-amber-300 font-mono">REQUIRES_HUMAN_INTERVENTION</code> and alerts the operations on-call engineer, halting automated intervention.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: SAVE AND RESET                                                */}
        {/* ========================================================================= */}
        <div className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Reset to Defaults</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
              Restore factory baseline SLA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-600 hover:brightness-110 active:brightness-95 transition-all flex items-center gap-2 shadow-lg shadow-sky-950/50 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Synchronizing with Daemon...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Reset to Defaults */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0C1426] border border-white/[0.1] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-slate-100">
                  Reset Engine Settings?
                </h3>
                <p className="text-xs text-slate-400">
                  This will restore all configurations to default factory values.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#080D1A] rounded-xl border border-white/[0.06] text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Probe Interval:</span>
                <span className="text-sky-300">4 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Timeout:</span>
                <span className="text-sky-300">3000 ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CPU Warn / Crit:</span>
                <span className="text-sky-300">70% / 80%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Memory Warn / Crit:</span>
                <span className="text-sky-300">75% / 85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recovery Cooldown:</span>
                <span className="text-sky-300">25 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Attempts:</span>
                <span className="text-sky-300">3 retries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operating Mode:</span>
                <span className="text-emerald-400">Autonomous Healing</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              All active monitoring intervals and retry limits will be reset immediately and synchronized with the backend storage daemon.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md shadow-rose-950/50 disabled:opacity-50"
              >
                {isResetting ? 'Restoring...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
