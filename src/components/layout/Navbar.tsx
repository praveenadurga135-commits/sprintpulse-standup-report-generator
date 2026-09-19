import React, { useState } from 'react';
import { 
  Layers, ChevronDown, Plus, Moon, Sun, Copy, Check, 
  UserCheck, Shield, Users, LogOut, RotateCcw, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';
import { UserAvatar } from '../common/UserAvatar';

interface NavbarProps {
  onOpenCreateProject: () => void;
  onOpenCreateSprint: () => void;
  onOpenJoinProject: () => void;
  onNavigateToProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateProject,
  onOpenCreateSprint,
  onOpenJoinProject,
  onNavigateToProfile,
}) => {
  const { currentUser, isManager, logout } = useAuth();
  const { projects, sprints, currentProject, currentSprint, setCurrentProject, setCurrentSprint } = useProject();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleCopyInviteCode = () => {
    if (!currentProject) return;
    navigator.clipboard.writeText(currentProject.inviteCode);
    setCopiedCode(true);
    toast.success(`Invite code "${currentProject.inviteCode}" copied to clipboard!`, 'Code Copied');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Branding & Selectors */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              SprintPulse
            </span>
            <span className="block text-[10px] font-medium tracking-wider uppercase text-brand-600 dark:text-brand-400">
              Enterprise Engineering
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value);
                if (p) setCurrentProject(p);
              }}
              disabled={projects.length === 0}
              className="appearance-none bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-3 pr-8 text-xs md:text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all max-w-[150px] md:max-w-[210px] truncate disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {projects.length === 0 ? (
                <option value="">No projects</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>

          {/* Sprint Selector */}
          {currentProject && sprints.length > 0 && (
            <div className="relative hidden lg:block">
              <select
                value={currentSprint?.id || ''}
                onChange={(e) => {
                  const s = sprints.find((x) => x.id === e.target.value);
                  if (s) setCurrentSprint(s);
                }}
                className="appearance-none bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-3 pr-8 text-xs md:text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all truncate"
              >
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.status === 'active' ? '(Active)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          )}

          {/* Quick Invite Code copy badge for Manager */}
          {isManager && currentProject && (
            <button
              onClick={handleCopyInviteCode}
              title="Click to copy project invite code"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-md text-xs font-mono font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
            >
              <span>Code: {currentProject.inviteCode}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions, Theme, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Manager Actions: Add Project / Add Sprint */}
        {isManager && (
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={onOpenCreateSprint}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sprint</span>
            </button>
            <button
              onClick={onOpenCreateProject}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Project</span>
            </button>
          </div>
        )}

        {/* Team Member Action: Join Project */}
        {!isManager && (
          <button
            onClick={onOpenJoinProject}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Join Project</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <UserAvatar user={currentUser} size="md" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-slide-up">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{currentUser?.name}</div>
                <div className="text-xs text-slate-400 truncate">{currentUser?.email}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold ${
                    currentUser?.role === 'manager'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {currentUser?.role === 'manager' ? 'Manager Account' : 'Team Member Account'}
                  </span>
                </div>
              </div>

              <div className="py-1 text-xs">
                {onNavigateToProfile && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigateToProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
