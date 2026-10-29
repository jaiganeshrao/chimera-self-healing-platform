import React, { useState } from 'react';
import { Service } from '../types';
import {
  Server,
  Plus,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  Layers,
} from 'lucide-react';

interface ServicesViewProps {
  services: Service[];
  onOpenRegisterModal: () => void;
  onRefresh: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onOpenRegisterModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.healthCheckUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search services or endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-[#0C1426]/80 border border-white/[0.08] rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30 w-72 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0C1426]/80 border border-white/[0.07] rounded-xl">
            {['ALL', 'HEALTHY', 'DEGRADED', 'UNAVAILABLE'].map((st) => (
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
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 transition-all flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-sky-950/40 cursor-pointer active:scale-95 font-heading"
        >
          <Plus className="w-4 h-4" />
          <span>Register Target Service</span>
        </button>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filtered.map((srv) => {
          const isHealthy = srv.status === 'healthy';
          const isDegraded = srv.status === 'degraded';
          const isRecovering = srv.status === 'recovering';

          const StatusIcon = isHealthy
            ? CheckCircle2
            : isDegraded
            ? AlertTriangle
            : isRecovering
            ? Activity
            : XCircle;

          const statusColor = isHealthy
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
            : isDegraded
            ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
            : isRecovering
            ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25'
            : 'text-rose-400 bg-rose-500/10 border-rose-500/25';

          return (
            <div
              key={srv.id}
              className="glass-panel-interactive p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading text-sm font-semibold text-slate-100 truncate">
                        {srv.name}
                      </h4>
                      {srv.id === 'srv-chimera-controlled' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 uppercase shrink-0 font-semibold">
                          TESTBED
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block mt-1 truncate">
                      {srv.healthCheckUrl}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border shrink-0 ${statusColor}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="uppercase text-[10px] tracking-wider">{srv.status}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {srv.description}
                </p>

                {/* Telemetry Metric Triad */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/[0.06] font-mono text-xs">
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Latency</span>
                    <span className="font-semibold text-slate-200 tabular-nums text-sm mt-0.5 block">
                      {srv.responseTimeMs}ms
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">CPU Load</span>
                    <span className="font-semibold text-slate-200 tabular-nums text-sm mt-0.5 block">
                      {srv.cpuUsagePct}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Memory</span>
                    <span className="font-semibold text-slate-200 tabular-nums text-sm mt-0.5 block">
                      {srv.memoryUsagePct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div>
                  Consecutive Failures: <span className="text-slate-200 font-semibold">{srv.consecutiveFailures}</span>
                </div>
                <div>
                  Checked:{' '}
                  <span className="text-slate-300">
                    {new Date(srv.lastHealthCheck).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Endpoints Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="font-heading text-sm font-semibold text-slate-100">
              Registered Target Endpoints
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
            {filtered.length} targets active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-slate-400 font-mono text-[11px]">
                <th className="px-6 py-3 font-medium">Service Identifier</th>
                <th className="px-4 py-3 font-medium">Endpoint URL</th>
                <th className="px-4 py-3 font-medium">Health Status</th>
                <th className="px-4 py-3 font-medium text-right">Response Time</th>
                <th className="px-4 py-3 font-medium text-right">CPU / RAM</th>
                <th className="px-6 py-3 font-medium text-right">Last Health Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((srv) => (
                <tr key={srv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">{srv.name}</span>
                      {srv.id === 'srv-chimera-controlled' && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          TESTBED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{srv.id}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300 max-w-xs truncate">
                    {srv.healthCheckUrl}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                        srv.status === 'healthy'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                          : srv.status === 'degraded'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                          : srv.status === 'recovering'
                          ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                      }`}
                    >
                      {srv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-200">
                    {srv.responseTimeMs}ms
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-400">
                    {srv.cpuUsagePct}% · {srv.memoryUsagePct}%
                  </td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-400">
                    {new Date(srv.lastHealthCheck).toLocaleTimeString()}
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
