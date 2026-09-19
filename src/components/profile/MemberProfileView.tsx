import React, { useState } from 'react';
import { 
  User as UserIcon, Mail, Shield, Briefcase, Building, 
  Edit3, Check, X, FolderKanban, Calendar, Sparkles, Image
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { UserAvatar } from '../common/UserAvatar';

export const MemberProfileView: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { currentProject, currentSprint, projects } = useProject();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [title, setTitle] = useState(currentUser?.title || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  const isManager = currentUser?.role === 'manager';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.', 'Validation Error');
      return;
    }

    const defaultTitle = isManager ? 'Engineering Manager' : 'Software Engineer';
    const defaultDept = isManager ? 'Engineering Leadership' : 'Core Engineering';

    const updated = updateProfile({
      name: name.trim(),
      title: title.trim() || defaultTitle,
      department: department.trim() || defaultDept,
      avatar: avatar.trim(),
    });

    if (updated) {
      toast.success('Your profile details have been saved!', 'Profile Updated');
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser?.name || '');
    setTitle(currentUser?.title || '');
    setDepartment(currentUser?.department || '');
    setAvatar(currentUser?.avatar || '');
    setIsEditing(false);
  };

  // Preview user with edited name/avatar to show immediate live preview of Gmail-style initial letter
  const previewUser = {
    name: name.trim() || currentUser?.name || 'User',
    avatar: avatar.trim(),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          {isManager ? 'Engineering Management' : 'Developer Workspace'}
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {isManager ? 'Manager Profile' : 'Team Member Profile'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your personal details, workspace role, and project affiliations.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <UserAvatar user={isEditing ? previewUser : currentUser} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentUser?.name}
                </h2>
                <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                  isManager 
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                }`}>
                  {isManager ? 'Engineering Manager' : 'Team Member'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentUser?.title || (isManager ? 'Engineering Manager' : 'Software Engineer')} • {currentUser?.department || (isManager ? 'Engineering Leadership' : 'Core Engineering')}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{currentUser?.email}</span>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Profile Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tejasri Nair"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  First letter avatar updates automatically (e.g. {name.trim().charAt(0).toUpperCase() || '?'})
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Work email is permanent to your workspace
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Squad
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Core Engineering / Checkout"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Profile Photo URL (Optional)
                </label>
                <div className="relative">
                  <Image className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://... (leave empty to use Gmail-style circular letter avatar)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  No photo upload required! Leaving this field empty displays your circular initial letter avatar.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Profile Details Readout */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Job Title
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600" />
                <span>{currentUser?.title || (isManager ? 'Engineering Manager' : 'Software Engineer')}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Department
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-brand-600" />
                <span>{currentUser?.department || (isManager ? 'Engineering Leadership' : 'Core Engineering')}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Project
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-brand-600" />
                <span>{currentProject?.name || 'No project joined'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Sprint
              </span>
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>{currentSprint?.name || 'No active sprint'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
