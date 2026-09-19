import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Project, Sprint, ProjectMembership, User } from '../types';
import { StorageService } from '../services/storage';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  sprints: Sprint[];
  currentProject: Project | null;
  currentSprint: Sprint | null;
  setCurrentProject: (p: Project) => void;
  setCurrentSprint: (s: Sprint) => void;
  createProject: (data: { name: string; description: string; startDate: string; endDate: string }) => Project;
  createSprint: (data: { name: string; goal: string; startDate: string; endDate: string; totalWorkingDays?: number }) => Sprint;
  joinProjectByCode: (code: string) => { success: boolean; message: string };
  approveMember: (membershipId: string) => void;
  rejectMember: (membershipId: string) => void;
  pendingMemberships: { membership: ProjectMembership; user: User }[];
  approvedMembers: { membership: ProjectMembership; user: User }[];
  userApprovedProjects: Project[];
  refreshData: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Helper to filter projects legitimately associated with the current user
  const filterUserProjects = (allProjects: Project[], allMemberships: ProjectMembership[], user: typeof currentUser) => {
    if (!user) return [];

    // Filter out demo projects
    const nonDemoProjects = allProjects.filter((p) => {
      if (!p || typeof p !== 'object') return false;
      if (p.id === 'prj-1' && p.name === 'E-Commerce Platform') return false;
      if (p.id === 'prj-2' && p.name === 'Mobile Customer App') return false;
      if (p.inviteCode === 'ECP-7K42' || p.inviteCode === 'MCA-3391') return false;
      return true;
    });

    if (user.role === 'manager') {
      return nonDemoProjects.filter((p) => {
        if (p.managerId === user.id || (user.email && p.managerId === user.email)) return true;
        return allMemberships.some(
          (m) =>
            m.projectId === p.id &&
            (m.userId === user.id || (user.email && m.userId === user.email)) &&
            m.role === 'manager' &&
            m.status === 'approved'
        );
      });
    }

    const approvedProjectIds = new Set(
      allMemberships
        .filter(
          (m) =>
            (m.userId === user.id || (user.email && m.userId === user.email)) &&
            m.status === 'approved'
        )
        .map((m) => m.projectId)
    );
    return nonDemoProjects.filter((p) => approvedProjectIds.has(p.id));
  };

  const [memberships, setMemberships] = useState<ProjectMembership[]>(() => StorageService.getMemberships());

  const [projects, setProjects] = useState<Project[]>(() => {
    const all = StorageService.getProjects();
    const mems = StorageService.getMemberships();
    return filterUserProjects(all, mems, currentUser);
  });

  const [currentProject, setCurrentProjectState] = useState<Project | null>(() => {
    const all = StorageService.getProjects();
    const mems = StorageService.getMemberships();
    const visible = filterUserProjects(all, mems, currentUser);
    return visible[0] || null;
  });

  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const all = StorageService.getProjects();
    const mems = StorageService.getMemberships();
    const visible = filterUserProjects(all, mems, currentUser);
    const p = visible[0];
    return p ? StorageService.getSprints(p.id) : [];
  });

  const [currentSprint, setCurrentSprintState] = useState<Sprint | null>(() => {
    const all = StorageService.getProjects();
    const mems = StorageService.getMemberships();
    const visible = filterUserProjects(all, mems, currentUser);
    const p = visible[0];
    const sps = p ? StorageService.getSprints(p.id) : [];
    return sps.find((s) => s.status === 'active') || sps[0] || null;
  });

  const refreshData = () => {
    const allProjects = StorageService.getProjects();
    const allMemberships = StorageService.getMemberships();
    setMemberships(allMemberships);

    const visibleProjects = filterUserProjects(allProjects, allMemberships, currentUser);
    setProjects(visibleProjects);

    // Update current project if deleted or invalid or no longer belonging to user
    let activePrj = currentProject;
    if (!activePrj || !visibleProjects.some((p) => p.id === activePrj?.id)) {
      activePrj = visibleProjects[0] || null;
      setCurrentProjectState(activePrj);
    }

    if (activePrj) {
      const allSprints = StorageService.getSprints(activePrj.id);
      setSprints(allSprints);
      if (!currentSprint || !allSprints.some((s) => s.id === currentSprint?.id)) {
        const defaultSp = allSprints.find((s) => s.status === 'active') || allSprints[0] || null;
        setCurrentSprintState(defaultSp);
      }
    } else {
      setSprints([]);
      setCurrentSprintState(null);
    }
  };

  // Re-sync projects and currentProject when currentUser changes
  useEffect(() => {
    refreshData();
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      refreshData();
    });
    return unsub;
  }, [currentProject?.id, currentSprint?.id, currentUser?.id]);

  const setCurrentProject = (p: Project) => {
    setCurrentProjectState(p);
    const sps = StorageService.getSprints(p.id);
    setSprints(sps);
    const active = sps.find((s) => s.status === 'active') || sps[0] || null;
    setCurrentSprintState(active);
  };

  const setCurrentSprint = (s: Sprint) => {
    setCurrentSprintState(s);
  };

  const createProject = (data: { name: string; description: string; startDate: string; endDate: string }) => {
    if (!currentUser) throw new Error('User not logged in');
    const newProject = StorageService.createProject({
      ...data,
      managerId: currentUser.id,
    });
    refreshData();
    setCurrentProject(newProject);
    return newProject;
  };

  const createSprint = (data: { name: string; goal: string; startDate: string; endDate: string; totalWorkingDays?: number }) => {
    if (!currentProject) throw new Error('No active project selected');
    const newSprint = StorageService.createSprint({
      ...data,
      projectId: currentProject.id,
      status: 'active',
      totalWorkingDays: data.totalWorkingDays || 10,
    });
    refreshData();
    setCurrentSprint(newSprint);
    return newSprint;
  };

  const joinProjectByCode = (code: string) => {
    if (!currentUser) return { success: false, message: 'Please log in first' };
    const project = StorageService.getProjectByCode(code);
    if (!project) {
      return { success: false, message: `No project found with invite code "${code.trim().toUpperCase()}". Please verify the code.` };
    }

    // Check existing membership
    const existing = memberships.find((m) => m.projectId === project.id && m.userId === currentUser.id);
    if (existing) {
      if (existing.status === 'approved') {
        setCurrentProject(project);
        return { success: true, message: `You are already an approved member of "${project.name}".` };
      }
      if (existing.status === 'pending') {
        return { success: true, message: `Your join request for "${project.name}" is already pending manager review.` };
      }
    }

    StorageService.createMembership({
      projectId: project.id,
      userId: currentUser.id,
      role: 'member',
      status: 'pending',
    });

    refreshData();
    return { success: true, message: `Join request sent to project manager for "${project.name}". You will be notified once approved!` };
  };

  const approveMember = (membershipId: string) => {
    StorageService.updateMembershipStatus(membershipId, 'approved');
    refreshData();
  };

  const rejectMember = (membershipId: string) => {
    StorageService.updateMembershipStatus(membershipId, 'rejected');
    refreshData();
  };

  // List of pending join requests for the current project
  const pendingMemberships = useMemo(() => {
    if (!currentProject) return [];
    const prjMemberships = memberships.filter((m) => m.projectId === currentProject.id && m.status === 'pending');
    return prjMemberships
      .map((m) => {
        const user = StorageService.getUser(m.userId);
        return user ? { membership: m, user } : null;
      })
      .filter(Boolean) as { membership: ProjectMembership; user: User }[];
  }, [memberships, currentProject?.id]);

  // List of approved members for current project
  const approvedMembers = useMemo(() => {
    if (!currentProject) return [];
    const prjMemberships = memberships.filter((m) => m.projectId === currentProject.id && m.status === 'approved');
    const list = prjMemberships
      .map((m) => {
        const user = StorageService.getUser(m.userId);
        return user ? { membership: m, user } : null;
      })
      .filter(Boolean) as { membership: ProjectMembership; user: User }[];

    // Ensure manager is in list if not already present
    if (currentProject.managerId && !list.some((item) => item.user.id === currentProject.managerId)) {
      const mgrUser = StorageService.getUser(currentProject.managerId);
      if (mgrUser) {
        list.unshift({
          membership: {
            id: `mem-${currentProject.id}-${mgrUser.id}`,
            projectId: currentProject.id,
            userId: mgrUser.id,
            role: 'manager',
            status: 'approved',
            requestedAt: currentProject.createdAt,
            approvedAt: currentProject.createdAt,
          },
          user: mgrUser,
        });
      }
    }
    return list;
  }, [memberships, currentProject?.id, currentProject?.managerId, currentProject?.createdAt]);

  // Approved projects for the current user
  const userApprovedProjects = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'manager') return projects;
    const userMemberships = memberships.filter((m) => m.userId === currentUser.id && m.status === 'approved');
    const projectIds = new Set(userMemberships.map((m) => m.projectId));
    return projects.filter((p) => projectIds.has(p.id));
  }, [projects, memberships, currentUser?.id, currentUser?.role]);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        sprints,
        currentProject,
        currentSprint,
        setCurrentProject,
        setCurrentSprint,
        createProject,
        createSprint,
        joinProjectByCode,
        approveMember,
        rejectMember,
        pendingMemberships,
        approvedMembers,
        userApprovedProjects,
        refreshData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return ctx;
};
