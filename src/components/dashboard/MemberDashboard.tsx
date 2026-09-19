import React, { useMemo } from 'react';
import { 
  CheckCircle2, Clock, Flame, AlertOctagon, CheckSquare, 
  ArrowRight, Calendar, Layers, ShieldCheck, Sparkles, 
  Plus, FolderKanban 
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { StorageService } from '../../services/storage';

interface MemberDashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenJoinProject: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  onNavigate,
  onOpenJoinProject,
}) => {
  const { currentUser } = useAuth();
  const { currentProject, currentSprint } = useProject();

  const todayStr = new Date().toISOString().split('T')[0];

  // User's own updates
  const myUpdates = useMemo(() => {
    if (!currentUser || !currentProject) return [];
    return StorageService.getUpdates({
      projectId: currentProject.id,
      userId: currentUser.id,
    });
  }, [currentUser?.id, currentProject?.id]);

  // Today's submission status
  const todayUpdate = useMemo(() => {
    return myUpdates.find((u) => u.date === todayStr);
  }, [myUpdates, todayStr]);

  // Active blockers in current project
  const projectBlockers = useMemo(() => {
    if (!currentSprint) return [];
    return StorageService.getBlockers(currentSprint.id).filter((b) => b.status === 'active');
  }, [currentSprint?.id]);

  // Update streak calculation (days submitted)
  const streakDays = useMemo(() => {
    return myUpdates.length;
  }, [myUpdates]);

  const sprintProgress = useMemo(() => {
    const workingDays = currentSprint?.totalWorkingDays || 10;
    if (!currentSprint || workingDays === 0 || myUpdates.length === 0) return 0;
    return Math.min(100, Math.round((myUpdates.length / workingDays) * 100));
  }, [currentSprint, myUpdates.length]);

  if (!currentProject) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-fade-in space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-3xl text-white shadow-lg shadow-brand-500/15 relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Developer Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name}!
            </h1>
            <p className="text-sm text-white/80 max-w-xl">
              Track your daily engineering milestones, communicate blockers seamlessly with your manager, and sync with your sprint goals.
            </p>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              No projects yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Join a project using an invite code from your engineering manager to start logging daily standups.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenJoinProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Join Project</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-3xl text-white shadow-lg shadow-brand-500/15 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Developer Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-sm text-white/80 max-w-xl">
            Track your daily engineering milestones, communicate blockers seamlessly with your manager, and sync with your sprint goals.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-white/90">
            <div className="flex items-center gap-1.5">
              <span className="opacity-70">Current Project:</span>
              <span className="font-bold">{currentProject?.name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span className="opacity-70">Active Sprint:</span>
              <span className="font-bold">{currentSprint?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Standup Status Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              todayUpdate && !todayUpdate.isDraft
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                : 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
            }`}>
              {todayUpdate && !todayUpdate.isDraft ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <CheckSquare className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Today's Daily Standup
                </h2>
                {todayUpdate && !todayUpdate.isDraft ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Completed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                    Pending Today
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {todayUpdate && !todayUpdate.isDraft
                  ? `Submitted at ${new Date(todayUpdate.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. You can update it anytime.`
                  : 'Log what you accomplished yesterday and what you are planning for today.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('mem-standup')}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <span>{todayUpdate && !todayUpdate.isDraft ? 'Review / Edit Standup' : 'Submit Today\'s Standup'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* If submitted today, show snippet */}
        {todayUpdate && !todayUpdate.isDraft && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Working on today: </span>
              <span className="text-slate-600 dark:text-slate-400">{todayUpdate.today}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-extrabold font-mono text-amber-500">
              {streakDays} Days
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            Update Streak
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Consistent standup submissions this sprint
          </p>
        </div>

        {/* Sprint Progress */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-extrabold font-mono text-brand-600 dark:text-brand-400">
              {sprintProgress}%
            </div>
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            Sprint Progress
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {currentSprint?.name} timeline target
          </p>
        </div>

        {/* Project Blockers */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {projectBlockers.length}
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">
            Project Blockers
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active team impediments under resolution
          </p>
        </div>
      </div>

      {/* Two Column: Personal Recent Updates & Project Blockers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Recent Updates */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>My Standup History</span>
            </h3>
            <button
              onClick={() => onNavigate('mem-updates')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
            >
              View All ({myUpdates.length})
            </button>
          </div>

          <div className="space-y-3">
            {myUpdates.slice(0, 3).map((u) => (
              <div
                key={u.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span>{u.date}</span>
                  {u.hasBlocker ? (
                    <span className="text-rose-600 dark:text-rose-400 font-sans font-bold">Impediment</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-sans">Clear</span>
                  )}
                </div>
                <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                  {u.yesterday}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Project Blockers Awareness */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span>Active Team Impediments</span>
            </h3>
          </div>

          {projectBlockers.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                All Team Blockers Cleared
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No active recurring impediments reported for {currentSprint?.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectBlockers.map((blk) => (
                <div
                  key={blk.id}
                  className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/70 dark:border-rose-900/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{blk.title}</span>
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950">
                      {blk.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {blk.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
