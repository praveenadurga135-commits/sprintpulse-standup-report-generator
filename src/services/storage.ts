import { 
  User, Project, ProjectMembership, Sprint, DailyUpdate, 
  SemanticBlocker, SprintSummaryData, StakeholderReportData 
} from '../types';

const STORAGE_KEYS = {
  USERS: 'sp_users',
  CURRENT_USER: 'sp_current_user',
  PROJECTS: 'sp_projects',
  MEMBERSHIPS: 'sp_memberships',
  SPRINTS: 'sp_sprints',
  UPDATES: 'sp_updates',
  BLOCKERS: 'sp_blockers',
  SUMMARIES: 'sp_summaries',
  REPORTS: 'sp_reports',
  THEME: 'sp_theme',
};

type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

export const StorageService = {
  subscribe(fn: StorageListener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  // Safe backward compatibility normalization
  normalizeStoredData() {
    try {
      // 1. Projects normalization
      const rawProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (rawProjects) {
        let projects: Project[] = JSON.parse(rawProjects);
        if (Array.isArray(projects)) {
          // Filter out demo projects
          projects = projects.filter((p) => {
            if (!p || typeof p !== 'object') return false;
            if (p.id === 'prj-1' && p.name === 'E-Commerce Platform') return false;
            if (p.id === 'prj-2' && p.name === 'Mobile Customer App') return false;
            if (p.inviteCode === 'ECP-7K42' || p.inviteCode === 'MCA-3391') return false;
            return true;
          });

          // Normalization of managerId for older records
          const rawMemberships = localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS);
          const memberships: ProjectMembership[] = rawMemberships ? JSON.parse(rawMemberships) : [];

          projects.forEach((p) => {
            if (!p.managerId) {
              const mgrMembership = memberships.find((m) => m.projectId === p.id && m.role === 'manager');
              if (mgrMembership?.userId) {
                p.managerId = mgrMembership.userId;
              }
            }
          });

          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
        }
      }

      // 2. Memberships normalization
      const rawMemberships = localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS);
      if (rawMemberships) {
        let memberships: ProjectMembership[] = JSON.parse(rawMemberships);
        if (Array.isArray(memberships)) {
          // Filter out demo memberships tied to demo projects or demo users
          memberships = memberships.filter((m) => {
            if (!m || typeof m !== 'object') return false;
            if (m.projectId === 'prj-1' || m.projectId === 'prj-2') return false;
            if (['usr-mgr-1', 'usr-mgr-2', 'usr-dev-1', 'usr-dev-2', 'usr-dev-3', 'usr-dev-4', 'usr-dev-5'].includes(m.userId)) {
              return false;
            }
            return true;
          });
          localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(memberships));
        }
      }

      // 3. Sprints normalization
      const rawSprints = localStorage.getItem(STORAGE_KEYS.SPRINTS);
      if (rawSprints) {
        let sprints: Sprint[] = JSON.parse(rawSprints);
        if (Array.isArray(sprints)) {
          sprints = sprints.filter((s) => s.projectId !== 'prj-1' && s.projectId !== 'prj-2');
          localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
        }
      }

      // 4. Updates normalization
      const rawUpdates = localStorage.getItem(STORAGE_KEYS.UPDATES);
      if (rawUpdates) {
        let updates: DailyUpdate[] = JSON.parse(rawUpdates);
        if (Array.isArray(updates)) {
          updates = updates.filter((u) => u.projectId !== 'prj-1' && u.projectId !== 'prj-2');
          localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(updates));
        }
      }

      // 5. Blockers normalization
      const rawBlockers = localStorage.getItem(STORAGE_KEYS.BLOCKERS);
      if (rawBlockers) {
        let blockers: SemanticBlocker[] = JSON.parse(rawBlockers);
        if (Array.isArray(blockers)) {
          blockers = blockers.filter((b) => b.projectId !== 'prj-1' && b.projectId !== 'prj-2');
          localStorage.setItem(STORAGE_KEYS.BLOCKERS, JSON.stringify(blockers));
        }
      }
    } catch (e) {
      console.warn('Error during data normalization:', e);
    }
  },

  // Initialize storage with empty state (No demo data, preserving legitimate user data)
  init() {
    this.normalizeStoredData();

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS)) {
      localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPRINTS)) {
      localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.UPDATES)) {
      localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOCKERS)) {
      localStorage.setItem(STORAGE_KEYS.BLOCKERS, JSON.stringify([]));
    }
  },

  updatePassword(email: string, newPassword: string): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex === -1) return false;
    users[userIndex].password = newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyListeners();
    return true;
  },

  updateUser(id: string, partial: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const updated = { ...users[idx], ...partial };
    users[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const cur = this.getCurrentUser();
    if (cur && cur.id === id) {
      this.setCurrentUser(updated, !!localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    } else {
      notifyListeners();
    }
    return updated;
  },

  // User Management
  getUsers(): User[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  getUser(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getCurrentUser(): User | null {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null, rememberMe: boolean = true) {
    if (user) {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    notifyListeners();
  },

  registerUser(userData: Omit<User, 'id'>, rememberMe: boolean = true): User {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser, rememberMe);
    notifyListeners();
    return newUser;
  },

  // Project Management
  getProjects(): Project[] {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  },

  getProject(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  },

  getProjectByCode(code: string): Project | undefined {
    const formatted = code.trim().toUpperCase();
    return this.getProjects().find(
      (p) => p.inviteCode.toUpperCase() === formatted
    );
  },

  createProject(data: { name: string; description: string; startDate: string; endDate: string; managerId: string }): Project {
    const projects = this.getProjects();
    // Generate clean invite code like "ECP-7K42"
    const prefix = data.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'PRJ';
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const inviteCode = `${prefix}-${rand}`;

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      inviteCode,
      managerId: data.managerId,
      createdAt: new Date().toISOString(),
    };

    projects.push(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));

    // Automatically add manager as approved member
    this.createMembership({
      projectId: newProject.id,
      userId: data.managerId,
      role: 'manager',
      status: 'approved',
    });

    // Automatically create Sprint 1 for this project
    this.createSprint({
      projectId: newProject.id,
      name: 'Sprint 1',
      goal: 'Project setup, architectural baseline, and initial milestone deliverables.',
      startDate: data.startDate,
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      totalWorkingDays: 10,
    });

    notifyListeners();
    return newProject;
  },

  // Project Memberships & Join Flow
  getMemberships(projectId?: string): ProjectMembership[] {
    this.init();
    const all: ProjectMembership[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS) || '[]');
    if (projectId) {
      return all.filter((m) => m.projectId === projectId);
    }
    return all;
  },

  getMembershipsForUser(userId: string): ProjectMembership[] {
    return this.getMemberships().filter((m) => m.userId === userId);
  },

  createMembership(data: { projectId: string; userId: string; role: 'manager' | 'member'; status?: 'pending' | 'approved' }): ProjectMembership {
    const memberships = this.getMemberships();
    // Check if already exists
    const existing = memberships.find((m) => m.projectId === data.projectId && m.userId === data.userId);
    if (existing) {
      if (existing.status === 'rejected') {
        existing.status = data.status || 'pending';
        existing.requestedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(memberships));
        notifyListeners();
      }
      return existing;
    }

    const newMembership: ProjectMembership = {
      id: `mem-${Date.now()}`,
      projectId: data.projectId,
      userId: data.userId,
      role: data.role,
      status: data.status || 'pending',
      requestedAt: new Date().toISOString(),
      approvedAt: data.status === 'approved' ? new Date().toISOString() : undefined,
    };

    memberships.push(newMembership);
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(memberships));
    notifyListeners();
    return newMembership;
  },

  updateMembershipStatus(membershipId: string, status: 'approved' | 'rejected'): ProjectMembership | undefined {
    const memberships = this.getMemberships();
    const item = memberships.find((m) => m.id === membershipId);
    if (!item) return undefined;

    item.status = status;
    if (status === 'approved') {
      item.approvedAt = new Date().toISOString();
    }
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(memberships));
    notifyListeners();
    return item;
  },

  // Sprint Management
  getSprints(projectId?: string): Sprint[] {
    this.init();
    const all: Sprint[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPRINTS) || '[]');
    if (projectId) {
      return all.filter((s) => s.projectId === projectId);
    }
    return all;
  },

  getSprint(id: string): Sprint | undefined {
    return this.getSprints().find((s) => s.id === id);
  },

  createSprint(data: Omit<Sprint, 'id'>): Sprint {
    const sprints = this.getSprints();
    const newSprint: Sprint = {
      ...data,
      id: `sp-${Date.now()}`,
    };
    sprints.push(newSprint);
    localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
    notifyListeners();
    return newSprint;
  },

  // Daily Standup Updates
  getUpdates(filter?: { projectId?: string; sprintId?: string; userId?: string; date?: string }): DailyUpdate[] {
    this.init();
    let list: DailyUpdate[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.UPDATES) || '[]');
    if (filter?.projectId) list = list.filter((u) => u.projectId === filter.projectId);
    if (filter?.sprintId) list = list.filter((u) => u.sprintId === filter.sprintId);
    if (filter?.userId) list = list.filter((u) => u.userId === filter.userId);
    if (filter?.date) list = list.filter((u) => u.date === filter.date);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  saveUpdate(data: {
    id?: string;
    projectId: string;
    sprintId: string;
    userId: string;
    date: string;
    yesterday: string;
    today: string;
    blockers: string;
    isDraft?: boolean;
    voiceUsed?: boolean;
  }): DailyUpdate {
    const updates = this.getUpdates();
    const now = new Date().toISOString();
    const cleanBlockers = data.blockers.trim();
    const hasBlocker = cleanBlockers.length > 0 && 
      !['none', 'no', 'nil', 'n/a', 'nothing', 'no blocker', 'no blockers'].includes(cleanBlockers.toLowerCase());

    const existingIndex = updates.findIndex(
      (u) => (data.id && u.id === data.id) || (u.projectId === data.projectId && u.sprintId === data.sprintId && u.userId === data.userId && u.date === data.date)
    );

    let result: DailyUpdate;
    if (existingIndex >= 0) {
      result = {
        ...updates[existingIndex],
        ...data,
        hasBlocker,
        updatedAt: now,
      };
      updates[existingIndex] = result;
    } else {
      result = {
        id: `upd-${Date.now()}`,
        ...data,
        hasBlocker,
        createdAt: now,
        updatedAt: now,
      };
      updates.push(result);
    }

    localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(updates));
    notifyListeners();
    return result;
  },

  // Semantic Blockers Management
  getBlockers(sprintId?: string): SemanticBlocker[] {
    this.init();
    const all: SemanticBlocker[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BLOCKERS) || '[]');
    if (sprintId) {
      return all.filter((b) => b.sprintId === sprintId);
    }
    return all;
  },

  saveBlockers(blockers: SemanticBlocker[]) {
    localStorage.setItem(STORAGE_KEYS.BLOCKERS, JSON.stringify(blockers));
    notifyListeners();
  },

  toggleBlockerStatus(blockerId: string, resolutionNotes?: string): SemanticBlocker | undefined {
    const blockers = this.getBlockers();
    const item = blockers.find((b) => b.id === blockerId);
    if (!item) return undefined;

    if (item.status === 'active') {
      item.status = 'resolved';
      item.resolvedAt = new Date().toISOString();
      if (resolutionNotes) item.resolutionNotes = resolutionNotes;
    } else {
      item.status = 'active';
      item.resolvedAt = undefined;
    }

    localStorage.setItem(STORAGE_KEYS.BLOCKERS, JSON.stringify(blockers));
    notifyListeners();
    return item;
  },

  // Sprint Summary
  getSprintSummary(sprintId: string): SprintSummaryData | null {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SUMMARIES}_${sprintId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  },

  saveSprintSummary(summary: SprintSummaryData) {
    localStorage.setItem(`${STORAGE_KEYS.SUMMARIES}_${summary.sprintId}`, JSON.stringify(summary));
    notifyListeners();
  },

  // Stakeholder Report
  getStakeholderReport(sprintId: string): StakeholderReportData | null {
    const raw = localStorage.getItem(`${STORAGE_KEYS.REPORTS}_${sprintId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  },

  saveStakeholderReport(report: StakeholderReportData) {
    localStorage.setItem(`${STORAGE_KEYS.REPORTS}_${report.sprintId}`, JSON.stringify(report));
    notifyListeners();
  }
};
