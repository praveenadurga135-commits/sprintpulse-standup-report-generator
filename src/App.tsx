import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { MemberDashboard } from './components/dashboard/MemberDashboard';
import { StandupSubmission } from './components/standup/StandupSubmission';
import { UpdateTimeline } from './components/timeline/UpdateTimeline';
import { RecurringBlockersView } from './components/blockers/RecurringBlockersView';
import { BlockerBurndownChart } from './components/burndown/BlockerBurndownChart';
import { SprintSummaryView } from './components/reports/SprintSummaryView';
import { StakeholderReportView } from './components/reports/StakeholderReportView';
import { TeamManagement } from './components/team/TeamManagement';
import { ProjectsView } from './components/projects/ProjectsView';
import { SettingsView } from './components/settings/SettingsView';
import { MemberProfileView } from './components/profile/MemberProfileView';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { CreateSprintModal } from './components/modals/CreateSprintModal';
import { JoinProjectModal } from './components/modals/JoinProjectModal';
import { StorageService } from './services/storage';
import { Menu } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isManager, currentUser } = useAuth();
  const { currentSprint, currentProject } = useProject();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<NavTab>(
    isManager ? 'mgr-dashboard' : 'mem-dashboard'
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [isJoinProjectOpen, setIsJoinProjectOpen] = useState(false);

  // Synchronize and guard active tab on role/auth changes
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isManager) {
      if (!activeTab.startsWith('mgr-')) {
        setActiveTab('mgr-dashboard');
      }
    } else {
      if (!activeTab.startsWith('mem-')) {
        setActiveTab('mem-dashboard');
      }
    }
  }, [isAuthenticated, isManager, activeTab]);

  // Active blockers count for badge
  const activeBlockersCount = useMemo(() => {
    if (!currentSprint) return 0;
    return StorageService.getBlockers(currentSprint.id).filter((b) => b.status === 'active').length;
  }, [currentSprint?.id]);

  if (!isAuthenticated) {
    if (authMode === 'register') {
      return <RegisterPage onGoToLogin={() => setAuthMode('login')} />;
    }
    return <LoginPage onGoToRegister={() => setAuthMode('register')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenCreateSprint={() => setIsCreateSprintOpen(true)}
        onOpenJoinProject={() => setIsJoinProjectOpen(true)}
        onNavigateToProfile={() => setActiveTab(isManager ? 'mgr-profile' : 'mem-profile')}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          activeBlockerCount={activeBlockersCount}
        />

        {/* Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 transition-all flex flex-col">
          {/* Mobile Header Toggle */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <Menu className="w-4 h-4" />
              <span>Navigation Menu</span>
            </button>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              {currentProject?.name}
            </span>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            {/* MANAGER VIEWS */}
            {isManager && (
              <>
                {activeTab === 'mgr-dashboard' && (
                  <ManagerDashboard
                    onNavigate={setActiveTab}
                    onOpenCreateSprint={() => setIsCreateSprintOpen(true)}
                    onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                  />
                )}
                {activeTab === 'mgr-projects' && (
                  <ProjectsView
                    onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                    onOpenCreateSprint={() => setIsCreateSprintOpen(true)}
                    onOpenJoinProject={() => setIsJoinProjectOpen(true)}
                    onSelectProject={() => setActiveTab('mgr-dashboard')}
                  />
                )}
                {activeTab === 'mgr-team-members' && <TeamManagement />}
                {activeTab === 'mgr-team-updates' && <UpdateTimeline />}
                {activeTab === 'mgr-blockers' && <RecurringBlockersView />}
                {activeTab === 'mgr-burndown' && <BlockerBurndownChart />}
                {activeTab === 'mgr-sprint-summary' && <SprintSummaryView />}
                {activeTab === 'mgr-stakeholder-report' && <StakeholderReportView />}
                {activeTab === 'mgr-profile' && <MemberProfileView />}
                {activeTab === 'mgr-settings' && <SettingsView />}
              </>
            )}

            {/* TEAM MEMBER VIEWS */}
            {!isManager && (
              <>
                {activeTab === 'mem-dashboard' && (
                  <MemberDashboard
                    onNavigate={setActiveTab}
                    onOpenJoinProject={() => setIsJoinProjectOpen(true)}
                  />
                )}
                {activeTab === 'mem-standup' && <StandupSubmission />}
                {activeTab === 'mem-updates' && <UpdateTimeline />}
                {activeTab === 'mem-profile' && <MemberProfileView />}
                {activeTab === 'mem-projects' && (
                  <ProjectsView
                    onOpenCreateProject={() => setIsCreateProjectOpen(true)}
                    onOpenCreateSprint={() => setIsCreateSprintOpen(true)}
                    onOpenJoinProject={() => setIsJoinProjectOpen(true)}
                    onSelectProject={() => setActiveTab('mem-dashboard')}
                  />
                )}
                {activeTab === 'mem-sprint' && <SprintSummaryView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />
      <CreateSprintModal
        isOpen={isCreateSprintOpen}
        onClose={() => setIsCreateSprintOpen(false)}
      />
      <JoinProjectModal
        isOpen={isJoinProjectOpen}
        onClose={() => setIsJoinProjectOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <AppContent />
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

