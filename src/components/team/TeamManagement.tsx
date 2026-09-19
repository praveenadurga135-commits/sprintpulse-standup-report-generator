import React, { useState } from 'react';
import { 
  Users, UserCheck, UserX, Clock, Copy, Check, 
  Shield, Mail, AlertCircle, Sparkles, FolderKanban 
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';
import { UserAvatar } from '../common/UserAvatar';

export const TeamManagement: React.FC = () => {
  const { 
    currentProject, pendingMemberships, approvedMembers, 
    approveMember, rejectMember 
  } = useProject();
  const { toast } = useToast();

  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<{
    membershipId: string;
    userName: string;
    action: 'approve' | 'reject';
  } | null>(null);

  const handleCopyInviteCode = () => {
    if (!currentProject) return;
    navigator.clipboard.writeText(currentProject.inviteCode);
    setCopiedCode(true);
    toast.success(`Invite code "${currentProject.inviteCode}" copied to clipboard!`, 'Code Copied');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExecuteAction = () => {
    if (!confirmingAction) return;

    if (confirmingAction.action === 'approve') {
      approveMember(confirmingAction.membershipId);
      toast.success(`${confirmingAction.userName} has been approved as an active member of ${currentProject?.name}!`, 'Member Approved');
    } else {
      rejectMember(confirmingAction.membershipId);
      toast.info(`Join request for ${confirmingAction.userName} was declined.`, 'Request Declined');
    }

    setConfirmingAction(null);
  };

  const updates = StorageService.getUpdates({ projectId: currentProject?.id });

  const getLastUpdateForUser = (userId: string) => {
    const userUpdates = updates.filter((u) => u.userId === userId);
    if (userUpdates.length === 0) return 'No updates yet';
    const latest = userUpdates[0];
    return `${latest.date} (${new Date(latest.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Card & Invite Code banner */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Access Control & Roster
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Team Member Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review incoming membership requests, assign project roles, and manage team access for {currentProject?.name}.
            </p>
          </div>

          {/* Project Invite Code Card */}
          {currentProject && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Project Invite Code
                </div>
                <div className="font-mono text-base font-bold text-brand-600 dark:text-brand-400 tracking-wider">
                  {currentProject.inviteCode}
                </div>
              </div>
              <button
                onClick={handleCopyInviteCode}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                title="Copy invite code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PENDING REQUESTS SECTION (Critical workflow requirement) */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pending Join Requests
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {pendingMemberships.length} Pending Review
          </span>
        </div>

        {pendingMemberships.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No pending member requests for {currentProject?.name}. Share invite code <code className="font-mono font-bold text-brand-600">{currentProject?.inviteCode}</code> with new teammates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingMemberships.map(({ membership, user }) => {
              const reqTime = new Date(membership.requestedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={membership.id}
                  className="p-4 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={user.name}
                      avatarUrl={user.avatar}
                      size="md"
                      className="border border-amber-200 dark:border-amber-800 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Requested at {reqTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                    <button
                      onClick={() =>
                        setConfirmingAction({
                          membershipId: membership.id,
                          userName: user.name,
                          action: 'reject',
                        })
                      }
                      className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        setConfirmingAction({
                          membershipId: membership.id,
                          userName: user.name,
                          action: 'approve',
                        })
                      }
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve Member</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACTIVE TEAM MEMBERS DIRECTORY */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            Approved Team Members ({approvedMembers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Engineer</th>
                <th className="pb-3">Role & Title</th>
                <th className="pb-3">Project</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Last Standup Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {approvedMembers.map(({ membership, user }) => {
                const isManager = membership.role === 'manager';
                const lastUpdate = getLastUpdateForUser(user.id);

                return (
                  <tr key={membership.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={user.name}
                          avatarUrl={user.avatar}
                          size="sm"
                          className="border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {user.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{user.department}</div>
                    </td>

                    <td className="py-3.5 font-medium text-slate-700 dark:text-slate-300">
                      {currentProject?.name}
                    </td>

                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isManager
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {isManager ? 'Manager' : 'Active Member'}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {lastUpdate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {confirmingAction.action === 'approve' ? 'Approve Member Request' : 'Decline Member Request'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to {confirmingAction.action} <strong>{confirmingAction.userName}</strong> for project <strong>{currentProject?.name}</strong>?
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingAction(null)}
                className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className={`flex-1 py-2 px-3 text-white text-xs font-semibold rounded-xl shadow transition-colors ${
                  confirmingAction.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {confirmingAction.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
