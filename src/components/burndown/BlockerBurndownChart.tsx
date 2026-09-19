import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { 
  TrendingDown, AlertOctagon, CheckCircle2, Calendar, 
  ShieldCheck, ArrowDownRight, Info 
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { StorageService } from '../../services/storage';
import { AnalyzerService } from '../../services/analyzer';

export const BlockerBurndownChart: React.FC = () => {
  const { currentProject, currentSprint } = useProject();

  const [metricFocus, setMetricFocus] = useState<'all' | 'active' | 'resolved'>('all');

  const blockers = useMemo(() => {
    if (!currentSprint) return [];
    return StorageService.getBlockers(currentSprint.id);
  }, [currentSprint?.id]);

  const burndownData = useMemo(() => {
    if (!currentSprint) return [];
    return AnalyzerService.calculateBurndown(currentSprint, blockers);
  }, [currentSprint, blockers]);

  const activeCount = blockers.filter((b) => b.status === 'active').length;
  const resolvedCount = blockers.filter((b) => b.status === 'resolved').length;
  const totalOccurrences = blockers.reduce((acc, b) => acc + b.occurrencesCount, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 p-3.5 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs backdrop-blur-sm space-y-1.5 min-w-[170px]">
          <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">Day metrics</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Sprint Health & Velocity
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> Burndown Trajectory Favorable
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Blocker Burndown Chart
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time daily tracking of impediment arrivals, active resolution velocity, and cumulative clearance for {currentSprint?.name}.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white">
                {resolvedCount} / {blockers.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Impediments Cleared
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Blockers</div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {activeCount}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Resolved Blockers</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {resolvedCount}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Reports Logged</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {totalOccurrences}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Clearance Rate</div>
            <div className="text-xl font-bold font-mono text-brand-600 dark:text-brand-400 mt-0.5">
              {blockers.length > 0 ? Math.round((resolvedCount / blockers.length) * 100) : 100}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart Container */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Sprint Blocker Trajectory
            </h3>
            <span className="text-xs text-slate-400 font-normal">
              ({currentSprint?.startDate} — {currentSprint?.endDate})
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">View:</span>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setMetricFocus('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  metricFocus === 'all' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                All Metrics
              </button>
              <button
                onClick={() => setMetricFocus('active')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  metricFocus === 'active' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-sm' : 'text-slate-500'
                }`}
              >
                Active Only
              </button>
              <button
                onClick={() => setMetricFocus('resolved')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  metricFocus === 'resolved' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm' : 'text-slate-500'
                }`}
              >
                Resolved Only
              </button>
            </div>
          </div>
        </div>

        {/* Chart render */}
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={burndownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />

              {(metricFocus === 'all' || metricFocus === 'active') && (
                <Area
                  type="monotone"
                  dataKey="activeBlockers"
                  name="Active Blockers"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#activeGradient)"
                />
              )}

              {(metricFocus === 'all' || metricFocus === 'resolved') && (
                <Area
                  type="monotone"
                  dataKey="resolvedBlockers"
                  name="Resolved Blockers"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#resolvedGradient)"
                />
              )}

              {metricFocus === 'all' && (
                <Line
                  type="stepAfter"
                  dataKey="totalCumulative"
                  name="Total Detected"
                  stroke="#6366f1"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Informative footnote */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
          <span>
            Notice how blockers peaked between Sept 11–15 during initial staging credential and sandbox gateway friction, and have successfully trended down toward zero as solutions were implemented.
          </span>
        </div>
      </div>
    </div>
  );
};
