import React from 'react';
import {
  AnalyticsOverview,
  Incident,
  Service,
  AuditLog,
} from '../types';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Server,
  ArrowUpRight,
  Activity,
  Cpu,
  Zap,
} from 'lucide-react';

interface OverviewViewProps {
  analytics: AnalyticsOverview | null;
  services: Service[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  onSelectService: (service: Service) => void;
  onSelectIncident: (incident: Incident) => void;
  onGoToIncidents: () => void;
  onGoToServices: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  analytics,
  services,
  incidents,
  auditLogs,
  onSelectIncident,
  onGoToIncidents,
  onGoToServices,
}) => {
  const activeIncidents = incidents.filter((i) =>
    ['DETECTED', 'ANALYZING', 'RECOVERING', 'VERIFYING', 'REQUIRES_HUMAN_INTERVENTION'].includes(i.status)
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Services */}
        <div className="glass-panel-interactive p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Registered Fleet
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-100 tracking-tight">
              {analytics?.totalServices ?? services.length}
            </span>
            <span className="text-xs text-slate-400">targets</span>
          </div>
          <div className="mt-3.5 pt-3 border-t border-white/[0.05] flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {analytics?.healthyServices ?? services.filter((s) => s.status === 'healthy').length} UP
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-amber-400">
              {analytics?.degradedServices ?? services.filter((s) => s.status === 'degraded').length} Degraded
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-rose-400">
              {analytics?.unavailableServices ?? services.filter((s) => s.status === 'unavailable').length} Down
            </span>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="glass-panel-interactive p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Active Incidents
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold font-mono tabular-nums tracking-tight ${
                (analytics?.activeIncidents ?? 0) > 0 ? 'text-rose-400' : 'text-slate-100'
              }`}
            >
              {analytics?.activeIncidents ?? activeIncidents.length}
            </span>
            <span className="text-xs text-slate-400">in remediation</span>
          </div>
          <div className="mt-3.5 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Historical Total:</span>
            <span className="text-slate-200 font-semibold">{analytics?.totalIncidentsAllTime ?? incidents.length}</span>
          </div>
        </div>

        {/* Recovery Success Rate */}
        <div className="glass-panel-interactive p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Recovery Success
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-400 tracking-tight">
              {analytics?.recoverySuccessRate ?? 100}%
            </span>
            <span className="text-xs text-slate-400">verified</span>
          </div>
          <div className="mt-3.5 pt-3 border-t border-white/[0.05] flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-emerald-400">{analytics?.successfulRecoveries ?? 0} Solved</span>
            <span className="text-slate-400">·</span>
            <span className="text-rose-400">{analytics?.failedRecoveries ?? 0} Failed</span>
          </div>
        </div>

        {/* Mean Time to Recovery (MTTR) */}
        <div className="glass-panel-interactive p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              MTTR SLA
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-indigo-400 tracking-tight">
              {analytics?.meanTimeToRecoverySec ?? 24}s
            </span>
            <span className="text-xs text-slate-400">closed loop</span>
          </div>
          <div className="mt-3.5 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Avg Response:</span>
            <span className="text-slate-200">{analytics?.averageResponseTimeMs ?? 28}ms</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Remediation Queue + Monitored Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Remediation Queue Panel */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-slate-100">
                    Active Remediation Queue
                  </h3>
                  <p className="text-[11px] text-slate-400">Incidents undergoing closed-loop diagnosis & recovery</p>
                </div>
              </div>
              <button
                onClick={onGoToIncidents}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors group cursor-pointer"
              >
                <span>Incident desk</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.05] mt-2">
              {activeIncidents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400/80 mx-auto mb-2" />
                  <div className="font-medium text-slate-200 text-sm">All Services Operating Nominally</div>
                  <div className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Zero active incidents in queue. To observe automated healing, trigger a fault simulation using the top bar.
                  </div>
                </div>
              ) : (
                activeIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="py-3 px-3 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-all border border-transparent hover:border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sky-400">{inc.id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-200 font-medium">{inc.serviceName}</span>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold tracking-wider">
                        {inc.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-1 font-sans">
                      {inc.suspectedRootCause || inc.description}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>Cause: {inc.category}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-indigo-400">Policy: {inc.recommendedAction}</span>
                      {inc.mlConfidence && (
                        <>
                          <span className="text-slate-400">·</span>
                          <span className="text-emerald-400">
                            Confidence: {Math.round(inc.mlConfidence * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Monitored Service Fleet Panel */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-slate-100">
                    Monitored Service Fleet
                  </h3>
                  <p className="text-[11px] text-slate-400">Continuous telemetry and runtime resource state</p>
                </div>
              </div>
              <button
                onClick={onGoToServices}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors group cursor-pointer"
              >
                <span>All services</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.05] mt-2">
              {services.map((srv) => {
                const statusColor =
                  srv.status === 'healthy'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : srv.status === 'recovering'
                    ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                    : srv.status === 'degraded'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                return (
                  <div key={srv.id} className="py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-colors flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-3">
                      <div className="font-medium text-slate-200 truncate flex items-center gap-2">
                        {srv.name}
                        {srv.id === 'srv-chimera-controlled' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            TESTBED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {srv.healthCheckUrl}
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {srv.status}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        <span className="tabular-nums text-slate-300">{srv.responseTimeMs}ms</span> · CPU {srv.cpuUsagePct}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: System Audit & Recovery Trail */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-slate-100">
                System Audit & Recovery Trail
              </h3>
              <p className="text-[11px] text-slate-400">Immutable operations log with verification outcomes</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
            Audit Stream
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 font-mono text-[11px]">
                <th className="pb-2.5 font-medium">Timestamp</th>
                <th className="pb-2.5 font-medium">Event Type</th>
                <th className="pb-2.5 font-medium">Action Details</th>
                <th className="pb-2.5 font-medium text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {auditLogs.slice(0, 6).map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 font-mono font-medium text-slate-300">
                    {log.eventType}
                  </td>
                  <td className="py-2.5 text-slate-300 max-w-md truncate">
                    {log.actionDetails}
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${
                        log.result === 'SUCCESS'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : log.result === 'FAILURE'
                          ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                          : log.result === 'WARNING'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
