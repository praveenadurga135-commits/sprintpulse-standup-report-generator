import { 
  LayoutDashboard, FolderKanban, Users, Clock, AlertOctagon, 
  TrendingDown, FileText, Briefcase, Settings, CheckSquare, 
  History, Calendar, Layers, ChevronRight, Menu, X, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { UserAvatar } from '../common/UserAvatar';

export type NavTab = 
  // Manager tabs
  | 'mgr-dashboard'
  | 'mgr-projects'
  | 'mgr-team-updates'
  | 'mgr-blockers'
  | 'mgr-burndown'
  | 'mgr-sprint-summary'
  | 'mgr-stakeholder-report'
  | 'mgr-team-members'
  | 'mgr-profile'
  | 'mgr-settings'
  // Member tabs
  | 'mem-dashboard'
  | 'mem-standup'
  | 'mem-updates'
  | 'mem-projects'
  | 'mem-sprint'
  | 'mem-profile';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  activeBlockerCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onToggleMobile,
  activeBlockerCount,
}) => {
  const { isManager, currentUser } = useAuth();
  const { pendingMemberships, currentSprint } = useProject();

  const managerItems = [
    { id: 'mgr-dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mgr-projects' as NavTab, label: 'Projects & Setup', icon: FolderKanban },
    { 
      id: 'mgr-team-members' as NavTab, 
      label: 'Team Members', 
      icon: Users, 
      badge: pendingMemberships.length > 0 ? `${pendingMemberships.length} new` : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    { id: 'mgr-team-updates' as NavTab, label: 'Team Updates', icon: History },
    { 
      id: 'mgr-blockers' as NavTab, 
      label: 'Recurring Blockers', 
      icon: AlertOctagon,
      badge: activeBlockerCount > 0 ? activeBlockerCount.toString() : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'mgr-burndown' as NavTab, label: 'Blocker Burndown', icon: TrendingDown },
    { id: 'mgr-sprint-summary' as NavTab, label: 'Sprint Summary', icon: FileText },
    { id: 'mgr-stakeholder-report' as NavTab, label: 'Stakeholder Reports', icon: Briefcase },
    { id: 'mgr-profile' as NavTab, label: 'My Profile', icon: User },
    { id: 'mgr-settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const memberItems = [
    { id: 'mem-dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mem-standup' as NavTab, label: 'My Standup', icon: CheckSquare, highlight: true },
    { id: 'mem-updates' as NavTab, label: 'My Updates', icon: Clock },
    { id: 'mem-projects' as NavTab, label: 'My Projects', icon: FolderKanban },
    { id: 'mem-sprint' as NavTab, label: 'My Sprint', icon: Layers },
    { id: 'mem-profile' as NavTab, label: 'My Profile', icon: User },
  ];

  const items = isManager ? managerItems : memberItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onToggleMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* User Role Card header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onSelectTab(isManager ? 'mgr-profile' : 'mem-profile');
              if (isOpenMobile) onToggleMobile();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
            title="Go to Profile"
          >
            <UserAvatar user={currentUser} size="md" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {currentUser?.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {currentUser?.title || (isManager ? 'Engineering Manager' : 'Software Engineer')}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isManager ? 'Engineering Management' : 'Developer Workspace'}
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (isOpenMobile) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {'badge' in item && item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Sprint Status:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {currentSprint?.name || 'Active'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
