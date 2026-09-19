import React, { useState } from 'react';
import { 
  FolderKanban, Plus, Copy, Check, Calendar, Users, 
  Layers, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';

interface ProjectsViewProps {
  onOpenCreateProject: () => void;
  onOpenCreateSprint: () => void;
  onOpenJoinProject: () => void;
  onSelectProject: (projectId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenCreateProject,
  onOpenCreateSprint,
  onOpenJoinProject,
  onSelectProject,
}) => {
  const { projects, currentProject, setCurrentProject } = useProject();
  const { isManager, currentUser } = useAuth();
  const { toast } = useToast();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Invite code "${code}" copied to clipboard!`, 'Code Copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Workspace Directory
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Engineering Projects
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active engineering initiatives, secure member invite codes, and sprint milestones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isManager ? (
              <button
                onClick={onOpenCreateProject}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            ) : (
              <button
                onClick={onOpenJoinProject}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Join with Code</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              No projects yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {isManager
                ? 'Create your first project to get started.'
                : 'Join a project using a team invite code.'}
            </p>
          </div>
          <div className="pt-2">
            {isManager ? (
              <button
                onClick={onOpenCreateProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </button>
            ) : (
              <button
                onClick={onOpenJoinProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Join Project</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => {
            const isCurrent = p.id === currentProject?.id;
            const sprints = StorageService.getSprints(p.id);
            const members = StorageService.getMemberships(p.id).filter((m) => m.status === 'approved');

            return (
              <div
                key={p.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border transition-all shadow-sm space-y-4 ${
                isCurrent
                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      {p.name}
                    </h2>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
                        Active Selection
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
              </div>

              {/* Invite Code Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Project Invite Code
                  </div>
                  <div className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400 tracking-wider">
                    {p.inviteCode}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyCode(p.inviteCode, p.id)}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-xs flex items-center gap-1 transition-colors"
                  title="Copy code"
                >
                  {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === p.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{members.length} Approved Engineers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sprints.length} Sprints Tracked</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.startDate} to {p.endDate}</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {!isCurrent ? (
                  <button
                    onClick={() => {
                      setCurrentProject(p);
                      onSelectProject(p.id);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
                  >
                    Switch to this Project
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Selected Project
                  </span>
                )}

                {isManager && (
                  <button
                    onClick={onOpenCreateSprint}
                    className="py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800 transition-colors"
                  >
                    + New Sprint
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
