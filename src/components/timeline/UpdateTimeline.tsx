import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Calendar, User, AlertOctagon, 
  CheckCircle2, ChevronDown, ChevronUp, Clock, Mic, 
  Layers, ChevronRight, MessageSquare 
} from 'lucide-react';
import { DailyUpdate, User as UserType } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { StorageService } from '../../services/storage';
import { UserAvatar } from '../common/UserAvatar';

export const UpdateTimeline: React.FC = () => {
  const { currentProject, currentSprint, sprints, approvedMembers } = useProject();
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    return StorageService.subscribe(() => {
      setDataVersion((v) => v + 1);
    });
  }, []);

  const allUsers = useMemo(() => StorageService.getUsers(), [dataVersion]);

  const [selectedSprintId, setSelectedSprintId] = useState<string>(currentSprint?.id || '');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [blockerFilter, setBlockerFilter] = useState<'all' | 'blockers-only' | 'clear-only'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUpdateIds, setExpandedUpdateIds] = useState<Set<string>>(new Set());

  // Keep selectedSprintId in sync when currentSprint changes
  useEffect(() => {
    if (currentSprint?.id) {
      setSelectedSprintId(currentSprint.id);
    } else if (sprints.length > 0) {
      setSelectedSprintId(sprints[0].id);
    } else {
      setSelectedSprintId('');
    }
  }, [currentSprint?.id, sprints]);

  // Approved users for this project
  const approvedUsers = useMemo(() => {
    const list = approvedMembers.map((m) => m.user);
    // If list is empty but project has a manager, ensure manager is found
    if (list.length === 0 && currentProject?.managerId) {
      const mgr = allUsers.find((u) => u.id === currentProject.managerId || u.email === currentProject.managerId);
      if (mgr) list.push(mgr);
    }
    return list;
  }, [approvedMembers, currentProject?.managerId, allUsers]);

  const approvedUserMap = useMemo(() => {
    const map = new Map<string, UserType>();
    approvedUsers.forEach((u) => map.set(u.id, u));
    allUsers.forEach((u) => {
      if (!map.has(u.id)) map.set(u.id, u);
    });
    return map;
  }, [approvedUsers, allUsers]);

  // Updates for current project and selected sprint
  const updates = useMemo(() => {
    if (!currentProject) return [];
    const rawUpdates = StorageService.getUpdates({
      projectId: currentProject.id,
      sprintId: selectedSprintId || undefined,
    });
    // Filter updates so only approved members of this project (and manager) are shown
    if (approvedUsers.length > 0) {
      const approvedIds = new Set(approvedUsers.map((u) => u.id));
      return rawUpdates.filter((u) => approvedIds.has(u.userId));
    }
    return rawUpdates;
  }, [currentProject?.id, selectedSprintId, approvedUsers, dataVersion]);

  // Apply filters
  const filteredUpdates = useMemo(() => {
    return updates.filter((u) => {
      // Member filter
      if (selectedMemberId !== 'all' && u.userId !== selectedMemberId) {
        return false;
      }
      // Blocker filter
      if (blockerFilter === 'blockers-only' && !u.hasBlocker) return false;
      if (blockerFilter === 'clear-only' && u.hasBlocker) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const user = approvedUserMap.get(u.userId);
        const nameMatch = user?.name.toLowerCase().includes(q);
        const yesterdayMatch = u.yesterday.toLowerCase().includes(q);
        const todayMatch = u.today.toLowerCase().includes(q);
        const blockerMatch = u.blockers.toLowerCase().includes(q);
        if (!nameMatch && !yesterdayMatch && !todayMatch && !blockerMatch) {
          return false;
        }
      }

      return true;
    });
  }, [updates, selectedMemberId, blockerFilter, searchQuery, approvedUserMap]);

  // Group by Date
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: DailyUpdate[] } = {};
    filteredUpdates.forEach((upd) => {
      if (!groups[upd.date]) groups[upd.date] = [];
      groups[upd.date].push(upd);
    });
    return Object.entries(groups).sort(
      ([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  }, [filteredUpdates]);

  const toggleExpand = (id: string) => {
    setExpandedUpdateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedUpdateIds(new Set(filteredUpdates.map((u) => u.id)));
  };

  const collapseAll = () => {
    setExpandedUpdateIds(new Set());
  };

  if (!currentProject) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-fade-in shadow-sm">
        <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          No Active Project Selected
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          No project selected or approved yet. Select an existing project or join a project using an invite code to view the activity timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Activity Stream
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Team Updates & Timeline
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historical record of daily standups organized by date, engineer, and sprint milestones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search standups..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Sprint Filter */}
          <div className="relative">
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Sprints</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status === 'active' ? '(Current)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Member Filter */}
          <div className="relative">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Engineers</option>
              {(approvedUsers.length > 0 ? approvedUsers : allUsers).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.title || u.role})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Blocker Filter */}
          <div className="relative">
            <select
              value={blockerFilter}
              onChange={(e) => setBlockerFilter(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="blockers-only">Has Active Blockers</option>
              <option value="clear-only">No Blockers (Clear)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      {groupedByDate.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            No Standup Updates Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search query or filter settings.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByDate.map(([dateStr, dateUpdates]) => {
            const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });

            const hasAnyBlocker = dateUpdates.some((u) => u.hasBlocker);

            return (
              <div key={dateStr} className="space-y-3">
                {/* Date Heading Divider */}
                <div className="sticky top-16 z-10 py-2 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {formattedDate}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      ({dateUpdates.length} {dateUpdates.length === 1 ? 'update' : 'updates'})
                    </span>
                  </div>

                  {hasAnyBlocker ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                      <AlertOctagon className="w-3 h-3" />
                      Blockers Reported
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle2 className="w-3 h-3" />
                      All Clear
                    </span>
                  )}
                </div>

                {/* Member Update Cards */}
                <div className="grid grid-cols-1 gap-3">
                  {dateUpdates.map((upd) => {
                    const author = approvedUserMap.get(upd.userId) || allUsers.find((x) => x.id === upd.userId);
                    const isExpanded = expandedUpdateIds.has(upd.id);

                    return (
                      <div
                        key={upd.id}
                        className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-sm ${
                          upd.hasBlocker
                            ? 'border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Card Header */}
                        <div
                          onClick={() => toggleExpand(upd.id)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-2xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar
                              name={author?.name}
                              avatarUrl={author?.avatar}
                              size="md"
                              className="border border-slate-200 dark:border-slate-700 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {author?.name || 'Engineer'}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                                  {author?.title}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(upd.updatedAt || upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {upd.voiceUsed && (
                                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                                    <Mic className="w-3 h-3" /> Voice Recorded
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {upd.hasBlocker ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3" />
                                Blocker
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Clear
                              </span>
                            )}
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Card Details (Collapsible / Default expanded preview) */}
                        <div className={`px-5 pb-5 pt-1 space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 text-xs ${isExpanded ? 'block' : 'hidden sm:block'}`}>
                          {/* Yesterday */}
                          <div>
                            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                              Yesterday
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                              {upd.yesterday}
                            </p>
                          </div>

                          {/* Today */}
                          <div>
                            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                              Today
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                              {upd.today}
                            </p>
                          </div>

                          {/* Blocker */}
                          {upd.hasBlocker && (
                            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50">
                              <div className="font-bold text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1">
                                <AlertOctagon className="w-3.5 h-3.5" />
                                Reported Blocker
                              </div>
                              <p className="text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                                {upd.blockers}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
