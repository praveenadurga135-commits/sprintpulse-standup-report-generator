export type UserRole = 'manager' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  title: string;
  department: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  inviteCode: string; // e.g. "ECP-7K42"
  managerId: string;
  createdAt: string;
}

export type MembershipStatus = 'pending' | 'approved' | 'rejected';

export interface ProjectMembership {
  id: string;
  projectId: string;
  userId: string;
  role: UserRole;
  status: MembershipStatus;
  requestedAt: string;
  approvedAt?: string;
}

export type SprintStatus = 'active' | 'completed' | 'planned';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  totalWorkingDays: number;
}

export interface DailyUpdate {
  id: string;
  projectId: string;
  sprintId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  yesterday: string;
  today: string;
  blockers: string;
  hasBlocker: boolean;
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean;
  voiceUsed?: boolean;
}

export type BlockerSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type BlockerStatus = 'active' | 'resolved';

export interface SemanticBlocker {
  id: string;
  projectId: string;
  sprintId: string;
  title: string;
  description: string;
  severity: BlockerSeverity;
  status: BlockerStatus;
  occurrencesCount: number;
  affectedMemberIds: string[];
  firstDetectedDate: string;
  lastDetectedDate: string;
  relatedUpdateIds: string[];
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface SprintSummaryData {
  id: string;
  projectId: string;
  sprintId: string;
  generatedAt: string;
  overallProgress: string;
  progressPercentage: number;
  completedWork: string[];
  workInProgress: string[];
  keyBlockers: {
    title: string;
    severity: BlockerSeverity;
    impact: string;
  }[];
  risks: {
    risk: string;
    level: 'High' | 'Medium' | 'Low';
    mitigation: string;
  }[];
  nextSteps: string[];
}

export interface StakeholderReportData {
  id: string;
  projectId: string;
  sprintId: string;
  generatedAt: string;
  sprintStatus: 'On Track' | 'At Risk' | 'Needs Attention';
  executiveSummary: string;
  keyAchievements: string[];
  currentProgress: {
    metric: string;
    value: string;
    status: 'positive' | 'warning' | 'neutral';
  }[];
  keyRisks: string[];
  blockers: string[];
  nextSteps: string[];
}

export interface BurndownDayData {
  date: string;
  displayDate: string;
  activeBlockers: number;
  resolvedBlockers: number;
  newBlockers: number;
  totalCumulative: number;
}
