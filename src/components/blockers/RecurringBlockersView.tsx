import React, { useState, useMemo } from 'react';
import { 
  AlertOctagon, CheckCircle2, RefreshCw, Users, Calendar, 
  ChevronDown, ChevronUp, Check, AlertTriangle, ShieldAlert, 
  ExternalLink, Sparkles, MessageSquare, CheckCheck 
} from 'lucide-react';
import { SemanticBlocker, BlockerSeverity } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';
import { AnalyzerService } from '../../services/analyzer';

export const RecurringBlockersView: React.FC = () => {
  const { currentProject, currentSprint } = useProject();
  const { toast } = useToast();
  const allUsers = StorageService.getUsers();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | BlockerSeverity>('all');
  const [expandedBlockerId, setExpandedBlockerId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resolvingBlocker, setResolvingBlocker] = useState<SemanticBlocker | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Load and cluster blockers
  const blockers: SemanticBlocker[] = useMemo(() => {
    if (!currentSprint || !currentProject) return [];
    return StorageService.getBlockers(currentSprint.id);
  }, [currentSprint?.id, currentProject?.id]);

  const allUpdates = useMemo(() => {
    if (!currentSprint || !currentProject) return [];
    return StorageService.getUpdates({ sprintId: currentSprint.id, projectId: currentProject.id });
  }, [currentSprint?.id, currentProject?.id]);

  const handleRunAnalysis = () => {
    if (!currentSprint || !currentProject) return;
    setIsRefreshing(true);
    setTimeout(() => {
      AnalyzerService.analyzeBlockers(currentSprint.id, currentProject.id);
      setIsRefreshing(false);
      toast.success('Semantic pattern clustering synchronized across all standups.', 'Recurring Blockers Analyzed');
    }, 600);
  };

  const handleToggleResolve = (blocker: SemanticBlocker) => {
    if (blocker.status === 'active') {
      setResolvingBlocker(blocker);
      setResolutionNote(
        blocker.title.includes('Staging')
          ? 'IAM role and Vault secret permissions configured by DevOps team.'
          : blocker.title.includes('Payment')
          ? 'Provider resolved sandbox service outage; implemented circuit breaker retry strategy.'
          : 'Resolved after team coordination.'
      );
    }
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingBlocker) return;

    StorageService.toggleBlockerStatus(resolvingBlocker.id, resolutionNote.trim());
    toast.success(`Marked "${resolvingBlocker.title}" as resolved!`, 'Blocker Resolved');
    setResolvingBlocker(null);
    setResolutionNote('');
  };

  const filteredBlockers = useMemo(() => {
    return blockers.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (severityFilter !== 'all' && b.severity !== severityFilter) return false;
      return true;
    });
  }, [blockers, statusFilter, severityFilter]);

  const getSeverityBadge = (severity: BlockerSeverity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'High':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'Low':
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Pattern Recognition Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                Semantic Clustering Active
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Recurring Blockers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Groups semantically related impediments across team standups into unified persistent risk clusters.
            </p>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span>Re-cluster Patterns</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Status:</span>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' : ''
                }`}
              >
                All ({blockers.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === 'active' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-sm' : ''
                }`}
              >
                Active ({blockers.filter((b) => b.status === 'active').length})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === 'resolved' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm' : ''
                }`}
              >
                Resolved ({blockers.filter((b) => b.status === 'resolved').length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blockers list */}
      {filteredBlockers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            No Recurring Blockers in Filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            All impediments for this selection have been resolved or filtered out.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBlockers.map((blk) => {
            const isExpanded = expandedBlockerId === blk.id;
            const affectedMembers = blk.affectedMemberIds
              .map((id) => allUsers.find((u) => u.id === id))
              .filter(Boolean);

            const relatedUpdates = allUpdates.filter((u) => blk.relatedUpdateIds.includes(u.id));

            return (
              <div
                key={blk.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-sm ${
                  blk.status === 'active'
                    ? 'border-rose-200/90 dark:border-rose-900/60 hover:shadow-md'
                    : 'border-slate-200 dark:border-slate-800 opacity-90'
                }`}
              >
                {/* Main Card View */}
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Title & Status */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getSeverityBadge(blk.severity)}`}>
                          {blk.severity} Severity
                        </span>

                        {blk.status === 'resolved' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <Check className="w-3 h-3" /> Resolved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse-subtle">
                            <AlertOctagon className="w-3 h-3" /> Active Blocker
                          </span>
                        )}

                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                          {blk.occurrencesCount} {blk.occurrencesCount === 1 ? 'occurrence' : 'occurrences'}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {blk.title}
                      </h2>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {blk.description}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-start lg:self-center">
                      {blk.status === 'active' && (
                        <button
                          onClick={() => handleToggleResolve(blk)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>Mark Resolved</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedBlockerId(isExpanded ? null : blk.id)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isExpanded ? 'Hide standup quotes' : 'Show standup quotes'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Metadata bar */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Affected Engineers:</span>
                        <div className="flex -space-x-1.5">
                          {affectedMembers.map((m) => (
                            <img
                              key={m?.id}
                              src={m?.avatar}
                              alt={m?.name}
                              title={`${m?.name} (${m?.title})`}
                              className="w-5 h-5 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                            />
                          ))}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {affectedMembers.map((m) => m?.name.split(' ')[0]).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        First: <span className="font-semibold text-slate-700 dark:text-slate-300">{blk.firstDetectedDate}</span>
                      </span>
                      <span>•</span>
                      <span>
                        Last: <span className="font-semibold text-slate-700 dark:text-slate-300">{blk.lastDetectedDate}</span>
                      </span>
                    </div>
                  </div>

                  {/* Resolution Notes banner if resolved */}
                  {blk.status === 'resolved' && blk.resolutionNotes && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
                      <span className="font-bold">Resolution Note: </span>
                      {blk.resolutionNotes}
                    </div>
                  )}
                </div>

                {/* Expanded Details: Raw Standup Quotes Demonstrating Semantic Clustering */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-b-2xl space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Grouped Standup Updates Across Multiple Days ({relatedUpdates.length})</span>
                      <span className="text-brand-600 dark:text-brand-400 font-mono normal-case">
                        Semantic Similarity Matched
                      </span>
                    </div>

                    <div className="space-y-2">
                      {relatedUpdates.map((upd) => {
                        const author = allUsers.find((x) => x.id === upd.userId);
                        return (
                          <div
                            key={upd.id}
                            className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {author?.name} ({author?.title})
                              </span>
                              <span className="font-mono text-[11px]">{upd.date}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 font-medium">
                              "{upd.blockers}"
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Notes Modal */}
      {resolvingBlocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-slide-up">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Mark Blocker as Resolved
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              "{resolvingBlocker.title}"
            </p>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes & Remediation Taken
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe how this impediment was unblocked..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingBlocker(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow transition-colors"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
