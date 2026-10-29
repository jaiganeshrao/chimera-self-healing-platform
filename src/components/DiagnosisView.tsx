import React from 'react';
import { Incident } from '../types';
import {
  BrainCircuit,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface DiagnosisViewProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onGoToRecovery: () => void;
}

export const DiagnosisView: React.FC<DiagnosisViewProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onGoToRecovery,
}) => {
  const current = selectedIncident || incidents[0] || null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Selector */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-950/40">
            <BrainCircuit className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-slate-100">
              Root-Cause Analysis & AI Diagnostic Inference
            </h3>
            <p className="text-xs text-slate-400">
              Rule-based baseline verification coupled with Scikit-learn Random Forest feature weighting.
            </p>
          </div>
        </div>

        {incidents.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Incident:</span>
            <select
              value={current?.id || ''}
              onChange={(e) => {
                const found = incidents.find((i) => i.id === e.target.value);
                if (found) onSelectIncident(found);
              }}
              className="px-3 py-1.5 bg-[#0C1426]/90 border border-white/[0.08] rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-400/50 cursor-pointer shadow-sm"
            >
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id} className="bg-[#0C1426] text-slate-200">
                  {inc.id} - {inc.serviceName} ({inc.category})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!current ? (
        <div className="glass-panel p-16 text-center rounded-2xl text-slate-400 text-xs">
          <BrainCircuit className="w-9 h-9 text-slate-400 mx-auto mb-2 opacity-50" />
          <span className="font-medium text-slate-300">No diagnostic history recorded yet</span>
          <p className="text-[11px] text-slate-400 mt-1">Inject a failure via the simulator to evaluate the AI diagnostic engine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Diagnosis Panel */}
            <div className="glass-panel p-6 rounded-2xl space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-rose-400 uppercase tracking-wider">
                    Suspected Root Cause
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs font-mono text-sky-400 font-medium">{current.id}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Method:</span>
                  <span className="text-sky-300 font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/25">
                    {current.diagnosticMethod}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-heading text-lg font-bold text-slate-100">{current.category}</h4>
                <p className="text-sm text-slate-200 mt-2 leading-relaxed font-sans">
                  {current.suspectedRootCause}
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {current.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Confirmed Empirical Evidence
                </span>
                <div className="space-y-2">
                  {current.confirmedFacts.map((fact, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-mono p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Impact Breakdown */}
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-heading text-xs font-semibold text-slate-100 uppercase tracking-wider">
                    Feature Impact Weights
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Random Forest Importance
                </span>
              </div>

              <div className="mt-4 space-y-3.5">
                {current.featureContributions && current.featureContributions.length > 0 ? (
                  current.featureContributions.map((fc, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">{fc.feature}</span>
                        <span className="text-indigo-400 font-semibold tabular-nums">
                          {fc.impactPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/[0.04]">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                          style={{ width: `${fc.impactPct}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 font-mono">
                    Feature weights extracted via deterministic invariant rules.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Classifier Confidence Dial */}
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <h4 className="font-heading text-xs font-semibold text-slate-100 uppercase tracking-wider">
                  ML Confidence
                </h4>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="mt-5 text-center">
                {current.mlConfidence !== null ? (
                  <>
                    <div className="text-5xl font-extrabold font-mono text-emerald-400 tabular-nums tracking-tight">
                      {Math.round(current.mlConfidence * 100)}%
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-1.5">
                      Ensemble Certainty Score
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 text-left leading-relaxed">
                      High statistical certainty. Telemetry vector strongly correlates with the
                      trained multi-class failure profile.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-mono text-amber-400 font-medium">
                      Confidence Withheld
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 text-left leading-relaxed">
                      Confidence threshold policy enforced: Raw probability falls below the 0.60 certainty cutoff. Relying on deterministic system invariants.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Recommended Recovery Policy Card */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <h4 className="font-heading text-xs font-semibold text-slate-100 uppercase tracking-wider">
                  Recommended Recovery
                </h4>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Approved Policy Action:</span>
                <span className="text-sm font-mono font-bold text-sky-400 mt-0.5 block">
                  {current.recommendedAction}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Policy engine validated: Action resides on the security allowlist. Safe for autonomous execution under active cooldown constraints.
              </p>

              <button
                onClick={onGoToRecovery}
                className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-950/40 cursor-pointer active:scale-95 font-heading"
              >
                <span>Inspect Recovery Policy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
