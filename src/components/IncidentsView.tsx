import React, { useState } from 'react';
import { Incident, RecoveryActionType } from '../types';
import { Search, CheckCircle2, RotateCw, ShieldCheck, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';

interface IncidentsViewProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onTriggerRecovery?: (incident: Incident, action?: RecoveryActionType) => Promise<void>;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onSelectIncident,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.suspectedRootCause.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && inc.status !== 'RECOVERED') ||
      inc.status === statusFilter;

    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Search & Multi-Criteria Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, target, root cause, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-[#0C1426]/80 border border-white/[0.08] rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30 w-72 transition-all"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 p-1 bg-[#0C1426]/80 border border-white/[0.07] rounded-xl">
            {['ALL', 'ACTIVE', 'DETECTED', 'RECOVERING', 'RECOVERED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm shadow-sky-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-1 p-1 bg-[#0C1426]/80 border border-white/[0.07] rounded-xl">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1.5 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          Showing <span className="text-slate-200 font-semibold">{filtered.length}</span> of {incidents.length} recorded
        </div>
      </div>

      {/* Glass Incidents Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-slate-400 font-mono text-[11px]">
                <th className="px-6 py-3.5 font-medium">Incident ID</th>
                <th className="px-4 py-3.5 font-medium">Target Service</th>
                <th className="px-4 py-3.5 font-medium">Failure Category</th>
                <th className="px-4 py-3.5 font-medium">Severity</th>
                <th className="px-4 py-3.5 font-medium">Status</th>
                <th className="px-4 py-3.5 font-medium">Diagnosed Root Cause</th>
                <th className="px-4 py-3.5 font-medium">Detection Time</th>
                <th className="px-6 py-3.5 font-medium text-right">Autonomous Healing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-xs">
                    <ShieldCheck className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
                    <span className="font-medium text-slate-300">No matching incidents found</span>
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => {
                  const isRecovered = inc.status === 'RECOVERED';
                  const isFailed = inc.status === 'RECOVERY_FAILED';
                  const isEscalated = inc.status === 'REQUIRES_HUMAN_INTERVENTION';

                  const sevBadge =
                    inc.severity === 'CRITICAL'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                      : inc.severity === 'HIGH'
                      ? 'text-orange-400 bg-orange-500/10 border-orange-500/25'
                      : inc.severity === 'MEDIUM'
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                      : 'text-sky-400 bg-sky-500/10 border-sky-500/25';

                  const statusBadge = isRecovered
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                    : isEscalated
                    ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                    : isFailed
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                    : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25';

                  return (
                    <tr
                      key={inc.id}
                      onClick={() => onSelectIncident(inc)}
                      className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono font-semibold text-sky-400 whitespace-nowrap">
                        {inc.id}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-100">
                        {inc.serviceName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {inc.category}
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider border ${sevBadge}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider border ${statusBadge}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate font-sans">
                        {inc.suspectedRootCause}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                        {new Date(inc.detectionTimestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        {isRecovered ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auto-Healed{' '}
                            {inc.resolutionTimestamp
                              ? `(${Math.max(1, Math.round((new Date(inc.resolutionTimestamp).getTime() - new Date(inc.detectionTimestamp).getTime()) / 1000))}s)`
                              : ''}
                          </span>
                        ) : inc.status === 'RECOVERING' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-sky-300 bg-sky-500/15 border border-sky-500/30 animate-pulse font-medium">
                            <RotateCw className="w-3.5 h-3.5 animate-spin text-sky-400" /> Self-Healing...
                          </span>
                        ) : inc.status === 'VERIFYING' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 animate-pulse font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Verifying...
                          </span>
                        ) : inc.status === 'DETECTED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 animate-pulse font-medium">
                            <Zap className="w-3.5 h-3.5 text-amber-400" /> Diagnosing...
                          </span>
                        ) : isEscalated ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-rose-300 bg-rose-500/15 border border-rose-500/30 font-medium">
                            Escalated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] font-medium">
                            {inc.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
