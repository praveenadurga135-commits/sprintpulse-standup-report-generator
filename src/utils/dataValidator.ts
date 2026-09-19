import { 
  SprintSummaryData, 
  StakeholderReportData, 
  BlockerSeverity, 
  SemanticBlocker 
} from '../types';

export const DataValidator = {
  /**
   * Validates and normalizes AI-generated Sprint Summary data.
   * Returns a fully type-safe, bounds-checked SprintSummaryData object.
   */
  validateSprintSummary(
    raw: unknown,
    projectId: string,
    sprintId: string
  ): { valid: boolean; data: SprintSummaryData; issues: string[] } {
    const issues: string[] = [];
    const validSeverities: BlockerSeverity[] = ['Critical', 'High', 'Medium', 'Low'];

    if (!raw || typeof raw !== 'object') {
      return {
        valid: false,
        data: this.getDefaultSprintSummary(projectId, sprintId),
        issues: ['Response payload is not a valid JSON object'],
      };
    }

    const obj = raw as Record<string, any>;

    // 1. overallProgress
    let overallProgress = 'Team velocity actively tracking scheduled deliverables.';
    if (typeof obj.overallProgress === 'string' && obj.overallProgress.trim().length > 0) {
      overallProgress = obj.overallProgress.trim();
    } else {
      issues.push('Missing or invalid overallProgress');
    }

    // 2. progressPercentage
    let progressPercentage = 0;
    if (typeof obj.progressPercentage === 'number' && !isNaN(obj.progressPercentage)) {
      progressPercentage = Math.max(0, Math.min(100, Math.round(obj.progressPercentage)));
    } else if (typeof obj.progressPercentage === 'string') {
      const parsed = parseInt(obj.progressPercentage, 10);
      if (!isNaN(parsed)) {
        progressPercentage = Math.max(0, Math.min(100, parsed));
      }
    }

    // 3. completedWork
    let completedWork: string[] = [];
    if (Array.isArray(obj.completedWork)) {
      completedWork = obj.completedWork
        .map((x) => String(x || '').trim())
        .filter((x) => x.length > 0);
    }
    if (completedWork.length === 0) {
      completedWork = ['No completed deliverables were reported in the submitted standup updates.'];
    }

    // 4. workInProgress
    let workInProgress: string[] = [];
    if (Array.isArray(obj.workInProgress)) {
      workInProgress = obj.workInProgress
        .map((x) => String(x || '').trim())
        .filter((x) => x.length > 0);
    }
    if (workInProgress.length === 0) {
      workInProgress = ['No in-progress tasks were reported in the submitted standup updates.'];
    }

    // 5. keyBlockers
    let keyBlockers: { title: string; severity: BlockerSeverity; impact: string }[] = [];
    if (Array.isArray(obj.keyBlockers)) {
      keyBlockers = obj.keyBlockers
        .map((b: any) => {
          if (!b || typeof b !== 'object') return null;
          const severity: BlockerSeverity = validSeverities.includes(b.severity)
            ? b.severity
            : 'Medium';
          return {
            title: String(b.title || 'Reported Impediment').trim(),
            severity,
            impact: String(b.impact || 'Under assessment').trim(),
          };
        })
        .filter(Boolean) as any;
    }

    // 6. risks
    let risks: { risk: string; level: 'Low' | 'Medium' | 'High' | 'Critical'; mitigation: string }[] = [];
    if (Array.isArray(obj.risks)) {
      risks = obj.risks
        .map((r: any) => {
          if (!r || typeof r !== 'object') return null;
          const level = ['Critical', 'High', 'Medium', 'Low'].includes(r.level)
            ? r.level
            : 'Low';
          return {
            risk: String(r.risk || 'Schedule risk').trim(),
            level,
            mitigation: String(r.mitigation || 'Monitor daily updates').trim(),
          };
        })
        .filter(Boolean) as any;
    }

    // 7. nextSteps
    let nextSteps: string[] = [];
    if (Array.isArray(obj.nextSteps)) {
      nextSteps = obj.nextSteps
        .map((s) => String(s || '').trim())
        .filter((s) => s.length > 0);
    }
    if (nextSteps.length === 0) {
      nextSteps = ['Review incoming standup updates and verify milestone completion.'];
    }

    const validatedData: SprintSummaryData = {
      id: `sum-${Date.now()}`,
      projectId,
      sprintId,
      generatedAt: new Date().toISOString(),
      overallProgress,
      progressPercentage,
      completedWork,
      workInProgress,
      keyBlockers,
      risks,
      nextSteps,
    };

    return {
      valid: issues.length === 0,
      data: validatedData,
      issues,
    };
  },

  /**
   * Validates and normalizes AI-generated Stakeholder Report data.
   */
  validateStakeholderReport(
    raw: unknown,
    projectId: string,
    sprintId: string
  ): { valid: boolean; data: StakeholderReportData; issues: string[] } {
    const issues: string[] = [];
    const validStatuses: ('On Track' | 'At Risk' | 'Needs Attention')[] = [
      'On Track',
      'At Risk',
      'Needs Attention',
    ];

    if (!raw || typeof raw !== 'object') {
      return {
        valid: false,
        data: this.getDefaultStakeholderReport(projectId, sprintId),
        issues: ['Response payload is not a valid JSON object'],
      };
    }

    const obj = raw as Record<string, any>;

    const sprintStatus: 'On Track' | 'At Risk' | 'Needs Attention' =
      validStatuses.includes(obj.sprintStatus) ? obj.sprintStatus : 'On Track';

    const executiveSummary =
      typeof obj.executiveSummary === 'string' && obj.executiveSummary.trim().length > 0
        ? obj.executiveSummary.trim()
        : 'Executive briefing: Sprint deliverables are progressing according to schedule.';

    let keyAchievements: string[] = [];
    if (Array.isArray(obj.keyAchievements)) {
      keyAchievements = obj.keyAchievements
        .map((x) => String(x || '').trim())
        .filter((x) => x.length > 0);
    }
    if (keyAchievements.length === 0) {
      keyAchievements = ['Milestones tracked across daily engineering logs.'];
    }

    let currentProgress: { metric: string; value: string; status: 'positive' | 'warning' | 'neutral' }[] = [];
    if (Array.isArray(obj.currentProgress)) {
      currentProgress = obj.currentProgress
        .map((m: any) => {
          if (!m || typeof m !== 'object') return null;
          const status = ['positive', 'warning', 'neutral'].includes(m.status)
            ? m.status
            : 'neutral';
          return {
            metric: String(m.metric || 'Milestone Metric').trim(),
            value: String(m.value || 'Active').trim(),
            status,
          };
        })
        .filter(Boolean) as any;
    }
    if (currentProgress.length === 0) {
      currentProgress = [
        { metric: 'Sprint Status', value: sprintStatus, status: sprintStatus === 'On Track' ? 'positive' : 'warning' },
        { metric: 'Milestones', value: 'Active', status: 'neutral' },
      ];
    }

    let keyRisks: string[] = [];
    if (Array.isArray(obj.keyRisks)) {
      keyRisks = obj.keyRisks.map((x) => String(x || '').trim()).filter((x) => x.length > 0);
    }
    if (keyRisks.length === 0) {
      keyRisks = ['No critical delivery risks reported.'];
    }

    let blockers: string[] = [];
    if (Array.isArray(obj.blockers)) {
      blockers = obj.blockers.map((x) => String(x || '').trim()).filter((x) => x.length > 0);
    }
    if (blockers.length === 0) {
      blockers = ['No active blockers reported by team members.'];
    }

    let nextSteps: string[] = [];
    if (Array.isArray(obj.nextSteps)) {
      nextSteps = obj.nextSteps.map((x) => String(x || '').trim()).filter((x) => x.length > 0);
    }
    if (nextSteps.length === 0) {
      nextSteps = ['Continue scheduled backlog execution.'];
    }

    const report: StakeholderReportData = {
      id: `rep-${Date.now()}`,
      projectId,
      sprintId,
      generatedAt: new Date().toISOString(),
      sprintStatus,
      executiveSummary,
      keyAchievements,
      currentProgress,
      keyRisks,
      blockers,
      nextSteps,
    };

    return {
      valid: issues.length === 0,
      data: report,
      issues,
    };
  },

  getDefaultSprintSummary(projectId: string, sprintId: string): SprintSummaryData {
    return {
      id: `sum-${Date.now()}`,
      projectId,
      sprintId,
      generatedAt: new Date().toISOString(),
      overallProgress: 'Awaiting initial standup submissions to synthesize sprint delivery milestones.',
      progressPercentage: 0,
      completedWork: ['No completed deliverables reported yet'],
      workInProgress: ['No in-progress tasks reported yet'],
      keyBlockers: [],
      risks: [],
      nextSteps: ['Encourage team members to log daily standup updates.'],
    };
  },

  getDefaultStakeholderReport(projectId: string, sprintId: string): StakeholderReportData {
    return {
      id: `rep-${Date.now()}`,
      projectId,
      sprintId,
      generatedAt: new Date().toISOString(),
      sprintStatus: 'On Track',
      executiveSummary: 'Executive Briefing: Sprint configured and awaiting daily engineering updates.',
      keyAchievements: ['Sprint workspace and objectives initialized.'],
      currentProgress: [
        { metric: 'Sprint Status', value: 'On Track', status: 'positive' },
        { metric: 'Standup Updates', value: '0 Logged', status: 'neutral' },
      ],
      keyRisks: ['No delivery impediments reported.'],
      blockers: ['No active blockers reported.'],
      nextSteps: ['Maintain continuous alignment across project team.'],
    };
  }
};
