import React from 'react';
import { 
  Settings, Moon, Sun, User, Mail, Shield, 
  CheckCircle2, Info 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { UserAvatar } from '../common/UserAvatar';

export const SettingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          Preferences & Configuration
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your theme, workspace preferences, and profile credentials.
        </p>
      </div>

      {/* Theme Selection */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Interface Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose between daytime clarity and dark developer mode.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              theme === 'light'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex-shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Clean professional workspace
              </div>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              theme === 'dark'
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <div className="p-2 rounded-xl bg-slate-800 text-brand-400 flex-shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Premium engineering dashboard
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* User Profile Info */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Current Account Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active persona details and authorization level.
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <UserAvatar
            name={currentUser?.name}
            avatarUrl={currentUser?.avatar}
            size="lg"
            className="ring-2 ring-brand-500/30"
          />
          <div className="space-y-1">
            <div className="font-bold text-base text-slate-900 dark:text-white">
              {currentUser?.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser?.email}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                {currentUser?.role === 'manager' ? 'Engineering Manager' : 'Team Member'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">{currentUser?.title}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
