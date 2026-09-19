import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, Users, AlertOctagon, CheckCircle2, Calendar, 
  Clock, ArrowRight, ShieldAlert, Sparkles, Copy, Check, 
  FileText, Briefcase, Plus, FolderKanban 
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';

interface ManagerDashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenCreateSprint: () => void;
  onOpenCreateProject: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onNavigate,
  onOpenCreateSprint,
  onOpenCreateProject,
}) => {
  const { currentProject, currentSprint, pendingMemberships, approvedMembers } = useProject();
  const { toast } = useToast();
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    return StorageService.subscribe(() => {
      setDataVersion((v) => v + 1);
    });
  }, []);

  const blockers = useMemo(() => {
    if (!currentSprint) return [];
    return StorageService.getBlockers(currentSprint.id);
  }, [currentSprint?.id, dataVersion]);

  const updates = useMemo(() => {
    if (!currentSprint || !currentProject) return [];
    return StorageService.getUpdates({ sprintId: currentSprint.id, projectId: currentProject.id });
  }, [currentSprint?.id, currentProject?.id, dataVersion]);

  const allUsers = useMemo(() => StorageService.getUsers(), [dataVersion]);

  const activeBlockers = blockers.filter((b) => b.status === 'active');
  const resolvedBlockers = blockers.filter((b) => b.status === 'resolved');

  // Days remaining calculation
  const daysRemaining = useMemo(() => {
    if (!currentSprint) return 0;
    const end = new Date(currentSprint.endDate).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [currentSprint]);

  // Expected updates calculation strictly from active approved members
  const activeEngineersCount = approvedMembers.filter((m) => m.membership.role === 'member').length;
  const workingDays = currentSprint?.totalWorkingDays || 10;
  const totalExpected = activeEngineersCount > 0 ? activeEngineersCount * workingDays : updates.length;

  const progressPercent = updates.length === 0 || totalExpected === 0
    ? 0
    : Math.min(100, Math.max(0, Math.round((updates.length / totalExpected) * 100)));


  if (!currentProject) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-fade-in">
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              No projects yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first project to get started.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenCreateProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Main Sprint Overview Stats Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Sprint Overview
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              • {currentSprint?.name} ({currentSprint?.startDate} to {currentSprint?.endDate})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('mgr-sprint-summary')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>View Summary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Progress */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-brand-300 dark:hover:border-brand-800 transition-all">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              {progressPercent}%
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Sprint Progress
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: Updates Submitted */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-brand-300 dark:hover:border-brand-800 transition-all">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              {updates.length} / {totalExpected}
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Updates Submitted
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{activeEngineersCount} active {activeEngineersCount === 1 ? 'engineer' : 'engineers'}</span>
            </div>
          </div>

          {/* Card 3: Active Blockers */}
          <div
            onClick={() => onNavigate('mgr-blockers')}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer group hover:border-rose-300 dark:hover:border-rose-800 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
                {activeBlockers.length}
              </div>
              <div className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                {resolvedBlockers.length} resolved
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
              <span>Active Blockers</span>
              <span className="text-[10px] text-brand-600 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 truncate">
              {activeBlockers.length > 0 ? activeBlockers[0].title : 'All impediments clear'}
            </div>
          </div>

          {/* Card 4: Days Remaining */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-brand-300 dark:hover:border-brand-800 transition-all">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
              {daysRemaining}
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Days Remaining
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Ends {currentSprint?.endDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('mgr-blockers')}
          className="p-5 bg-gradient-to-br from-rose-500/10 to-amber-500/10 hover:from-rose-500/15 hover:to-amber-500/15 dark:from-rose-950/20 dark:to-amber-950/20 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 text-left transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            Recurring Blockers
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detect patterns across standups with automatic severity escalation.
          </p>
        </button>

        <button
          onClick={() => onNavigate('mgr-burndown')}
          className="p-5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 hover:from-blue-500/15 hover:to-indigo-500/15 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 text-left transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            Blocker Burndown
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze daily resolution velocity and clearance trajectories.
          </p>
        </button>

        <button
          onClick={() => onNavigate('mgr-stakeholder-report')}
          className="p-5 bg-gradient-to-br from-purple-500/10 to-brand-500/10 hover:from-purple-500/15 hover:to-brand-500/15 dark:from-purple-950/20 dark:to-brand-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 text-left transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            Stakeholder Reports
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate executive briefings ready for leadership and client updates.
          </p>
        </button>
      </div>

      {/* Two Column Layout: Recurring Blockers Snapshot & Recent Standups Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Recurring Blockers */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span>Impediment Patterns</span>
            </h3>
            <button
              onClick={() => onNavigate('mgr-blockers')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
              View All ({blockers.length})
            </button>
          </div>

          <div className="space-y-3">
            {blockers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No active or recurring blockers reported in this sprint.
              </div>
            ) : (
              blockers.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  onClick={() => onNavigate('mgr-blockers')}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {b.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {b.status === 'resolved' ? 'Resolved' : `${b.occurrencesCount} reports`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {b.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Team Activity */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Recent Standup Submissions</span>
            </h3>
            <button
              onClick={() => onNavigate('mgr-team-updates')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
              Full Timeline ({updates.length})
            </button>
          </div>

          <div className="space-y-3">
            {updates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No standup updates recorded yet for this sprint.
              </div>
            ) : (
              updates.slice(0, 3).map((u) => {
                const author = allUsers.find((x) => x.id === u.userId);
                return (
                  <div
                    key={u.id}
                    onClick={() => onNavigate('mgr-team-updates')}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {author?.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{u.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Today: </span>
                      {u.today}
                    </p>
                    {u.hasBlocker && (
                      <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 line-clamp-1 font-medium">
                        ⚠️ Blocker: {u.blockers}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
