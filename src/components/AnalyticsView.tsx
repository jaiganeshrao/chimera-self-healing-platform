import React, { useEffect, useState } from 'react';
import { AnalyticsOverview, Incident } from '../types';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Zap, ShieldCheck, Activity } from 'lucide-react';

interface AnalyticsViewProps {
  overview: AnalyticsOverview | null;
  incidents: Incident[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ overview, incidents }) => {
  const [reliabilityData, setReliabilityData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/analytics/reliability')
      .then((res) => res.json())
      .then((data) => setReliabilityData(data))
      .catch((err) => console.error('Error fetching reliability analytics:', err));
  }, [incidents.length]);

  const categoryMap: Record<string, number> = {};
  for (const inc of incidents) {
    categoryMap[inc.category] = (categoryMap[inc.category] || 0) + 1;
  }

  const categoryData = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    count,
  }));

  const dailyTrends = reliabilityData?.dailyTrends || [
    { day: 'Mon', failures: 1, recoveries: 1, uptimePct: 99.8 },
    { day: 'Tue', failures: 3, recoveries: 3, uptimePct: 99.4 },
    { day: 'Wed', failures: 2, recoveries: 2, uptimePct: 99.7 },
    { day: 'Thu', failures: 4, recoveries: 4, uptimePct: 99.2 },
    { day: 'Fri', failures: 2, recoveries: 2, uptimePct: 99.6 },
    { day: 'Sat', failures: 1, recoveries: 1, uptimePct: 99.9 },
    { day: 'Sun', failures: incidents.length || 2, recoveries: incidents.length || 2, uptimePct: 99.5 },
  ];

  const maxFailures = Math.max(...dailyTrends.map((d: any) => d.failures), 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recovery Success Rate */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Recovery Success
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-emerald-400">
              {overview?.recoverySuccessRate ?? 100}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Autonomous verifications passed
          </p>
        </div>

        {/* MTTR */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Mean Time to Recovery
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono tracking-tight text-sky-400">
              {overview?.meanTimeToRecoverySec ?? 18}
            </span>
            <span className="text-sm font-mono text-slate-400">sec</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Detection to multi-probe health
          </p>
        </div>

        {/* Total Remediations */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Remediation Events
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-100">
              {overview?.successfulRecoveries ?? incidents.length}
            </span>
            <span className="text-xs font-mono text-emerald-400">Closed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Autonomous self-healing actions
          </p>
        </div>

        {/* SLA Availability */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Fleet SLA Availability
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-emerald-400">
              99.64%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Target uptime: &gt; 99.50%
          </p>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <h3 className="font-heading text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Failure Ingestion vs Autonomous Remediation
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily trend of detected service incidents and verified self-healing closures
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-rose-500/80 border border-rose-400/50 inline-block" />
              <span className="text-slate-300">Failures Detected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400/50 inline-block" />
              <span className="text-slate-300">Recovered & Verified</span>
            </div>
          </div>
        </div>

        <div className="mt-8 h-60 flex items-end gap-4 sm:gap-8 px-4 pb-3 border-b border-white/[0.06]">
          {dailyTrends.map((d: any, idx: number) => {
            const failHeight = (d.failures / maxFailures) * 170;
            const recHeight = (d.recoveries / maxFailures) * 170;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2.5">
                <div className="w-full flex items-end justify-center gap-2 h-48">
                  <div
                    className="w-4 sm:w-6 bg-gradient-to-t from-rose-600/70 to-rose-400/90 rounded-t-sm hover:brightness-125 transition-all cursor-pointer relative group shadow-sm shadow-rose-950"
                    style={{ height: `${Math.max(10, failHeight)}px` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white bg-slate-900 border border-white/[0.1] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-10 transition-opacity">
                      {d.failures} failed
                    </span>
                  </div>

                  <div
                    className="w-4 sm:w-6 bg-gradient-to-t from-emerald-600/70 to-emerald-400/90 rounded-t-sm hover:brightness-125 transition-all cursor-pointer relative group shadow-sm shadow-emerald-950"
                    style={{ height: `${Math.max(10, recHeight)}px` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white bg-slate-900 border border-white/[0.1] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-10 transition-opacity">
                      {d.recoveries} healed
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-xs font-mono font-medium text-slate-300 block">{d.day}</span>
                  <span className="text-[10px] font-mono text-slate-500">{d.uptimePct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution & Ledger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="glass-panel p-6">
          <div className="pb-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-heading text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Failure Category Distribution
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Root-Cause Archetypes</span>
          </div>

          <div className="mt-5 space-y-4">
            {categoryData.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center font-mono">
                No incidents recorded in telemetry store yet.
              </div>
            ) : (
              categoryData.map((cat, i) => {
                const total = incidents.length || 1;
                const pct = Math.round((cat.count / total) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200 font-medium">{cat.name}</span>
                      <span className="text-slate-400 tabular-nums">
                        {cat.count} event{cat.count !== 1 ? 's' : ''} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Resolution & Duration Ledger */}
        <div className="glass-panel p-6">
          <div className="pb-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-heading text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Resolution & Duration Ledger
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Recent Incidents</span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 font-mono text-[11px]">
                  <th className="pb-2.5 font-medium">Incident ID</th>
                  <th className="pb-2.5 font-medium">Category</th>
                  <th className="pb-2.5 font-medium text-right">Recovery Time</th>
                  <th className="pb-2.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {incidents.slice(0, 6).map((inc) => {
                  let duration = 'Ongoing';
                  if (inc.resolutionTimestamp) {
                    const sec = Math.round(
                      (new Date(inc.resolutionTimestamp).getTime() -
                        new Date(inc.detectionTimestamp).getTime()) /
                        1000
                    );
                    duration = `${sec}s`;
                  }
                  return (
                    <tr key={inc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 font-mono text-sky-300 font-medium">{inc.id}</td>
                      <td className="py-2.5 font-mono text-slate-300">{inc.category}</td>
                      <td className="py-2.5 text-right font-mono text-slate-300 tabular-nums">
                        {duration}
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            inc.status === 'RECOVERED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
