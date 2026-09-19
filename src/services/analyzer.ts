import { 
  DailyUpdate, SemanticBlocker, Sprint, SprintSummaryData, 
  StakeholderReportData, BurndownDayData, BlockerSeverity 
} from '../types';
import { StorageService } from './storage';
import { DataValidator } from '../utils/dataValidator';
import { Sanitizer } from '../utils/sanitizer';

// Engineering semantic concept mappings
const CONCEPT_MAPPINGS: { tag: string; terms: string[] }[] = [
  {
    tag: 'api_backend',
    terms: ['backend', 'api', 'apis', 'endpoint', 'endpoints', 'microservice', 'microservices', 'server', 'rest', 'graphql', 'grpc', 'route', 'routes', 'controller']
  },
  {
    tag: 'access_auth',
    terms: ['access', 'permission', 'permissions', 'credential', 'credentials', 'token', 'tokens', 'iam', 'vault', 'key', 'keys', 'secret', 'secrets', 'privilege', 'privileges', 'auth', 'authentication', 'authorization', 'login', 'oauth', 'jwt', 'forbidden', 'unauthorized', '403', '401']
  },
  {
    tag: 'delay_pending',
    terms: ['waiting', 'pending', 'blocked', 'blocking', 'delay', 'delayed', 'latency', 'slow', 'unresponsive', 'unavailable', 'down', 'outage', 'hang', 'hanging', 'failing', 'failure', 'error', '500', '502', '503']
  },
  {
    tag: 'infra_env',
    terms: ['staging', 'sandbox', 'cluster', 'environment', 'env', 'deployment', 'deploy', 'pipeline', 'ci/cd', 'docker', 'k8s', 'kubernetes', 'cloud', 'aws', 'gcp', 'azure']
  },
  {
    tag: 'payment_gw',
    terms: ['payment', 'payments', 'gateway', 'stripe', 'paypal', 'webhook', 'webhooks', '3ds', '3d secure', 'transaction', 'checkout', 'billing', 'invoice']
  },
  {
    tag: 'database_cache',
    terms: ['database', 'db', 'redis', 'postgres', 'postgresql', 'mysql', 'sql', 'query', 'migration', 'migrations', 'cache', 'caching', 'invalidation', 'schema']
  },
  {
    tag: 'code_review',
    terms: ['review', 'reviews', 'pr', 'prs', 'pull request', 'merge', 'code review', 'approval', 'approvals']
  },
  {
    tag: 'frontend_ui',
    terms: ['frontend', 'ui', 'ux', 'css', 'style', 'styling', 'component', 'components', 'layout', 'responsive', 'modal', 'screen', 'render', 'rendering']
  }
];

// Stop words that carry little conceptual meaning
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'cant', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few',
  'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'i', 'im', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'still', 'required', 'needing', 'needs', 'needed'
]);

function extractSemanticSignature(text: string): { concepts: Set<string>; substantiveTokens: Set<string> } {
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const substantiveTokens = new Set(clean);
  const concepts = new Set<string>();

  const lowerText = text.toLowerCase();
  for (const mapping of CONCEPT_MAPPINGS) {
    for (const term of mapping.terms) {
      if (lowerText.includes(term)) {
        concepts.add(mapping.tag);
        break;
      }
    }
  }

  return { concepts, substantiveTokens };
}

function calculateSemanticBlockerSimilarity(textA: string, textB: string): number {
  const sigA = extractSemanticSignature(textA);
  const sigB = extractSemanticSignature(textB);

  let conceptIntersection = 0;
  sigA.concepts.forEach((c) => {
    if (sigB.concepts.has(c)) conceptIntersection++;
  });
  const totalConcepts = sigA.concepts.size + sigB.concepts.size;
  const conceptScore = totalConcepts > 0 ? (2 * conceptIntersection) / totalConcepts : 0;

  let tokenIntersection = 0;
  sigA.substantiveTokens.forEach((t) => {
    if (sigB.substantiveTokens.has(t)) tokenIntersection++;
  });
  const tokenUnion = new Set([...sigA.substantiveTokens, ...sigB.substantiveTokens]).size;
  const tokenScore = tokenUnion > 0 ? tokenIntersection / tokenUnion : 0;

  // High confidence match if sharing 2+ domain concepts (e.g. api_backend + access_auth)
  if (conceptIntersection >= 2) {
    return 0.85;
  }

  return 0.65 * conceptScore + 0.35 * tokenScore;
}

function generateBlockerTitle(sampleText: string, concepts: Set<string>): string {
  if (concepts.has('api_backend') && concepts.has('access_auth')) {
    return 'Backend API Access';
  }
  if (concepts.has('payment_gw')) {
    return 'Payment Gateway Integration';
  }
  if (concepts.has('database_cache')) {
    return 'Database & Cache Reliability';
  }
  if (concepts.has('code_review')) {
    return 'Code Review Turnaround';
  }
  if (concepts.has('infra_env') && concepts.has('access_auth')) {
    return 'Staging Environment Access';
  }
  const clean = sampleText.trim().replace(/^blocker(s)?\s*[:\-]?\s*/i, '');
  return clean.length > 50 ? clean.slice(0, 47) + '...' : clean;
}

export const AnalyzerService = {
  // Analyzes all daily updates in a sprint and clusters semantically similar blockers across days
  analyzeBlockers(sprintId: string, projectId: string): SemanticBlocker[] {
    const updates = StorageService.getUpdates({ sprintId, projectId });
    const blockerUpdates = updates.filter((u) => u.hasBlocker && u.blockers && u.blockers.trim().length > 3);

    // Existing blockers to preserve resolution status
    const existingBlockers = StorageService.getBlockers(sprintId);

    const clusters: {
      title: string;
      description: string;
      severity: BlockerSeverity;
      updateIds: string[];
      memberIds: Set<string>;
      dates: string[];
      sampleTexts: string[];
      concepts: Set<string>;
    }[] = [];

    blockerUpdates.forEach((upd) => {
      const sig = extractSemanticSignature(upd.blockers);

      // Search for an existing cluster with high semantic similarity
      let matchedCluster = clusters.find((c) => {
        return c.sampleTexts.some((sample) => calculateSemanticBlockerSimilarity(sample, upd.blockers) >= 0.35);
      });

      if (matchedCluster) {
        matchedCluster.updateIds.push(upd.id);
        matchedCluster.memberIds.add(upd.userId);
        matchedCluster.dates.push(upd.date);
        matchedCluster.sampleTexts.push(upd.blockers);
        sig.concepts.forEach((cp) => matchedCluster!.concepts.add(cp));
      } else {
        const title = generateBlockerTitle(upd.blockers, sig.concepts);
        clusters.push({
          title,
          description: upd.blockers,
          severity: 'Medium',
          updateIds: [upd.id],
          memberIds: new Set([upd.userId]),
          dates: [upd.date],
          sampleTexts: [upd.blockers],
          concepts: sig.concepts,
        });
      }
    });

    // Merge with existing blockers to preserve resolution state
    const result: SemanticBlocker[] = clusters.map((c, index) => {
      c.dates.sort();
      const occurrences = c.updateIds.length;
      
      // Auto-escalate severity if multiple team members or 3+ occurrences
      let calculatedSeverity: BlockerSeverity = c.severity;
      if (occurrences >= 3 || c.memberIds.size >= 2) {
        calculatedSeverity = occurrences >= 4 ? 'Critical' : 'High';
      }

      const existing = existingBlockers.find((eb) => eb.title.toLowerCase() === c.title.toLowerCase());

      return {
        id: existing?.id || `blk-${sprintId}-${index + 1}`,
        projectId,
        sprintId,
        title: c.title,
        description: existing?.description || c.description,
        severity: existing?.severity || calculatedSeverity,
        status: existing?.status || 'active', // Real state: stays active until manager marks resolved
        occurrencesCount: occurrences,
        affectedMemberIds: Array.from(c.memberIds),
        firstDetectedDate: c.dates[0] || new Date().toISOString().split('T')[0],
        lastDetectedDate: c.dates[c.dates.length - 1] || new Date().toISOString().split('T')[0],
        relatedUpdateIds: c.updateIds,
        resolvedAt: existing?.resolvedAt,
        resolutionNotes: existing?.resolutionNotes,
      };
    });

    // If existing blockers had items resolved previously that have no new updates, keep them
    existingBlockers.forEach((eb) => {
      if (!result.some((r) => r.title.toLowerCase() === eb.title.toLowerCase())) {
        result.push(eb);
      }
    });

    StorageService.saveBlockers(result);
    return result;
  },

  // Computes daily burndown data for charts
  calculateBurndown(sprint: Sprint, blockers: SemanticBlocker[]): BurndownDayData[] {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const days: BurndownDayData[] = [];

    const formatDisplay = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let current = new Date(start);
    let totalCumulative = 0;

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];

      // Blockers detected on or before this day
      const detectedSoFar = blockers.filter((b) => b.firstDetectedDate <= dateStr);
      // Blockers detected on this exact day
      const newlyDetected = blockers.filter((b) => b.firstDetectedDate === dateStr).length;
      // Blockers resolved on or before this day
      const resolvedSoFar = blockers.filter(
        (b) => b.status === 'resolved' && b.resolvedAt && b.resolvedAt.split('T')[0] <= dateStr
      );

      totalCumulative += newlyDetected;
      const activeCount = Math.max(0, detectedSoFar.length - resolvedSoFar.length);

      days.push({
        date: dateStr,
        displayDate: formatDisplay(current),
        activeBlockers: activeCount,
        resolvedBlockers: resolvedSoFar.length,
        newBlockers: newlyDetected,
        totalCumulative: detectedSoFar.length,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  },

  // Generates executive Sprint Summary based on actual team standups
  // Generates executive Sprint Summary based on actual team standups
  generateSprintSummary(sprint: Sprint, projectId: string): SprintSummaryData {
    const updates = StorageService.getUpdates({ sprintId: sprint.id, projectId });
    const blockers = this.analyzeBlockers(sprint.id, projectId);

    const completedWork: string[] = [];
    const workInProgress: string[] = [];

    // Synthesize items from updates
    updates.forEach((u) => {
      if (u.yesterday && u.yesterday.trim().length > 5) {
        const sentence = u.yesterday.trim().replace(/\.$/, '');
        if (!completedWork.includes(sentence)) {
          completedWork.push(sentence);
        }
      }
      if (u.today && u.today.trim().length > 5) {
        const sentence = u.today.trim().replace(/\.$/, '');
        if (!workInProgress.includes(sentence)) {
          workInProgress.push(sentence);
        }
      }
    });

    const activeBlockers = blockers.filter((b) => b.status === 'active');
    const resolvedBlockers = blockers.filter((b) => b.status === 'resolved');

    const approvedMembers = StorageService.getMemberships(projectId).filter((m) => m.status === 'approved');
    const memberCount = Math.max(1, approvedMembers.length);
    const totalWorkingDays = sprint.totalWorkingDays || 10;
    const totalExpectedUpdates = memberCount * totalWorkingDays;
    const submissionRate = updates.length === 0 ? 0 : Math.min(100, Math.round((updates.length / totalExpectedUpdates) * 100));
    
    // Dynamic progress calculation based on real standup volume and working days
    const progressPercentage = updates.length === 0
      ? 0
      : Math.min(100, Math.max(5, Math.round((updates.length / totalExpectedUpdates) * 100)));

    const keyBlockersList = blockers.map((b) => ({
      title: b.title,
      severity: b.severity,
      impact: b.status === 'resolved' 
        ? `Resolved (${b.occurrencesCount} occurrences across sprint)` 
        : `Active (${b.occurrencesCount} reports from ${b.affectedMemberIds.length} members)`,
    }));

    // Dynamic variation seeds for multiple regenerations
    const variationIndex = Math.floor(Math.random() * 3);

    const narrativeTemplates = [
      updates.length === 0
        ? `No standup submissions have been recorded yet for ${sprint.name}. The workspace is ready for team members to submit their daily updates.`
        : `Team momentum for ${sprint.name} is tracking at ${submissionRate}% update consistency with ${updates.length} standup logs recorded. ${completedWork.length} completed deliverables have been logged, and ${activeBlockers.length} active blockers require manager attention.`,
      updates.length === 0
        ? `Sprint ${sprint.name} is currently in its initial state with 0 standup reports logged.`
        : `Comprehensive synthesis for ${sprint.name}: ${updates.length} updates submitted across active engineers. Deliverables in progress indicate focused execution, while blocker resolution efficiency is maintaining velocity.`,
      updates.length === 0
        ? `Awaiting initial engineering standups for ${sprint.name}.`
        : `Sprint execution health assessment: ${sprint.name} reflects ${updates.length} standup updates with ${resolvedBlockers.length} impediments resolved to date. Overall progress is calculated at ${progressPercentage}%.`
    ];

    const risks = activeBlockers.length > 0 
      ? activeBlockers.map((b) => ({
          risk: b.title,
          level: b.severity,
          mitigation: `Assign targeted resolution pairing and monitor daily standups for recurring impediment indicators.`
        }))
      : [
          {
            risk: 'No active blockers or impediments reported in current updates',
            level: 'Low' as const,
            mitigation: 'Continue scheduled sprint execution and maintain regular standup submissions.'
          }
        ];

    const nextSteps = completedWork.length > 0 || workInProgress.length > 0
      ? [
          `Continue execution on active items: ${workInProgress[0] || 'assigned sprint deliverables'}.`,
          `Validate and test recent completions including ${completedWork[0] || 'core engineering tasks'}.`,
          activeBlockers.length > 0 ? `Coordinate resolution plan for ${activeBlockers[0].title}.` : 'Maintain high velocity and monitor incoming pull requests.',
          `Conduct scheduled sprint checkpoint and review updated progress indicators.`
        ]
      : [
          'Team members to log their daily standup updates via text or voice.',
          'Identify and submit any technical blockers or environment constraints.',
          'Review sprint goals and prioritize initial sprint backlog deliverables.'
        ];

    const summary: SprintSummaryData = {
      id: `sum-${Date.now()}`,
      projectId,
      sprintId: sprint.id,
      generatedAt: new Date().toISOString(),
      overallProgress: narrativeTemplates[variationIndex],
      progressPercentage,
      completedWork: completedWork.length > 0 ? completedWork.slice(0, 6) : ['No completed deliverables reported yet'],
      workInProgress: workInProgress.length > 0 ? workInProgress.slice(0, 6) : ['No in-progress tasks reported yet'],
      keyBlockers: keyBlockersList.slice(0, 4),
      risks: risks.slice(0, 3),
      nextSteps,
    };

    StorageService.saveSprintSummary(summary);
    return summary;
  },

  // Generates executive, non-technical Stakeholder Progress Report
  generateStakeholderReport(sprint: Sprint, projectId: string): StakeholderReportData {
    const updates = StorageService.getUpdates({ sprintId: sprint.id, projectId });
    const blockers = this.analyzeBlockers(sprint.id, projectId);
    const activeBlockers = blockers.filter((b) => b.status === 'active');
    const resolvedBlockers = blockers.filter((b) => b.status === 'resolved');
    
    let sprintStatus: 'On Track' | 'At Risk' | 'Needs Attention' = 'On Track';
    if (activeBlockers.some((b) => b.severity === 'Critical')) {
      sprintStatus = 'At Risk';
    } else if (activeBlockers.length > 1) {
      sprintStatus = 'Needs Attention';
    }

    const variationIndex = Math.floor(Math.random() * 3);

    const summaries = [
      updates.length === 0
        ? `Executive Overview: ${sprint.name} has begun. Initial standup submissions from team members will populate real-time delivery milestones and velocity metrics.`
        : `${sprint.name} is currently ${sprintStatus.toLowerCase()}. Engineering has recorded ${updates.length} standup logs with ${resolvedBlockers.length} impediments successfully resolved. Active deliverables are advancing toward scheduled milestones.`,
      updates.length === 0
        ? `Status Briefing: ${sprint.name} is ready for progress reporting as soon as team members submit daily standup updates.`
        : `Executive Progress Briefing: ${sprint.name} displays active engineering momentum. The team has submitted ${updates.length} daily logs, clearing ${resolvedBlockers.length} blockers while tracking deliverable completeness.`,
      updates.length === 0
        ? `Sprint Stakeholder Briefing: Clean start for ${sprint.name}. Progress metrics will update as team members log standup updates.`
        : `Milestone Summary for ${sprint.name}: System health remains ${sprintStatus.toLowerCase()}. Ongoing engineering initiatives are actively tracked, with ${activeBlockers.length} active impediments under management review.`
    ];

    const completedItems = updates
      .map((u) => u.yesterday.trim())
      .filter((y) => y.length > 5);

    const achievements = completedItems.length > 0
      ? completedItems.slice(0, 4).map((c) => c.replace(/\.$/, ''))
      : [
          'Sprint kick-off and task distribution configured in workspace.',
          'Sprint backlog scope and milestone timelines verified.',
        ];

    const report: StakeholderReportData = {
      id: `rep-${Date.now()}`,
      projectId,
      sprintId: sprint.id,
      generatedAt: new Date().toISOString(),
      sprintStatus,
      executiveSummary: summaries[variationIndex],
      keyAchievements: achievements,
      currentProgress: [
        { metric: 'Sprint Status', value: sprintStatus, status: sprintStatus === 'On Track' ? 'positive' : 'warning' },
        { metric: 'Updates Logged', value: `${updates.length} Updates`, status: updates.length > 0 ? 'positive' : 'neutral' },
        { metric: 'Impediments Resolved', value: `${resolvedBlockers.length} of ${blockers.length}`, status: resolvedBlockers.length > 0 ? 'positive' : 'neutral' },
        { metric: 'Active Blockers', value: `${activeBlockers.length} Active`, status: activeBlockers.length === 0 ? 'positive' : 'warning' },
      ],
      keyRisks: activeBlockers.length > 0
        ? activeBlockers.map((b) => `${b.title} (${b.severity}): ${b.description}`)
        : ['No active blockers or critical delivery risks reported in submitted standup updates.'],
      blockers: activeBlockers.length > 0 
        ? activeBlockers.map(b => `${b.title} (${b.severity} priority) - ${b.description}`)
        : ['No active blockers reported by team members.'],
      nextSteps: [
        'Review ongoing standup updates and address any newly flagged impediments.',
        'Validate delivered milestones in staging environment.',
        'Maintain continuous alignment with product stakeholders.'
      ]
    };

    StorageService.saveStakeholderReport(report);
    return report;
  },

  // Generates executive Sprint Summary powered by server-side Groq LLM
  async generateSprintSummaryWithLLM(
    sprint: Sprint, 
    projectId: string
  ): Promise<{ data: SprintSummaryData; isFallback: boolean; error?: string }> {
    const updates = StorageService.getUpdates({ sprintId: sprint.id, projectId });
    const blockers = this.analyzeBlockers(sprint.id, projectId);
    const project = StorageService.getProjects().find((p) => p.id === projectId);

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: project ? {
            name: Sanitizer.sanitizeText(project.name),
            description: Sanitizer.sanitizeMultiline(project.description),
            startDate: project.startDate,
            endDate: project.endDate,
          } : undefined,
          sprint: {
            name: Sanitizer.sanitizeText(sprint.name),
            goal: Sanitizer.sanitizeMultiline(sprint.goal),
            startDate: sprint.startDate,
            endDate: sprint.endDate,
          },
          updates: updates.map((u) => ({
            userId: u.userId,
            date: u.date,
            yesterday: Sanitizer.sanitizeMultiline(u.yesterday),
            today: Sanitizer.sanitizeMultiline(u.today),
            blockers: Sanitizer.sanitizeMultiline(u.blockers),
            hasBlocker: u.hasBlocker,
          })),
          blockers: blockers.map((b) => ({
            title: Sanitizer.sanitizeText(b.title),
            description: Sanitizer.sanitizeMultiline(b.description),
            severity: b.severity,
            status: b.status,
            occurrencesCount: b.occurrencesCount,
          })),
        }),
      });

      const res = await response.json().catch(() => ({}));

      if (!response.ok || !res.success || !res.data) {
        const errorMsg = res?.error?.message || res?.error || `Server status ${response.status}`;
        throw new Error(errorMsg);
      }

      const validation = DataValidator.validateSprintSummary(res.data, projectId, sprint.id);
      StorageService.saveSprintSummary(validation.data);
      return { data: validation.data, isFallback: false };
    } catch (err: any) {
      console.warn('[AnalyzerService] Remote summary generation failed, falling back to local analysis:', err?.message);
      const fallback = this.generateSprintSummary(sprint, projectId);
      return { data: fallback, isFallback: true, error: err?.message || 'AI service unavailable' };
    }
  },

  // Generates executive Stakeholder Progress Report powered by server-side Groq LLM
  async generateStakeholderReportWithLLM(
    sprint: Sprint, 
    projectId: string
  ): Promise<{ data: StakeholderReportData; isFallback: boolean; error?: string }> {
    const updates = StorageService.getUpdates({ sprintId: sprint.id, projectId });
    const blockers = this.analyzeBlockers(sprint.id, projectId);
    const project = StorageService.getProjects().find((p) => p.id === projectId);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: project ? {
            name: Sanitizer.sanitizeText(project.name),
            description: Sanitizer.sanitizeMultiline(project.description),
            startDate: project.startDate,
            endDate: project.endDate,
          } : undefined,
          sprint: {
            name: Sanitizer.sanitizeText(sprint.name),
            goal: Sanitizer.sanitizeMultiline(sprint.goal),
            startDate: sprint.startDate,
            endDate: sprint.endDate,
          },
          updates: updates.map((u) => ({
            userId: u.userId,
            date: u.date,
            yesterday: Sanitizer.sanitizeMultiline(u.yesterday),
            today: Sanitizer.sanitizeMultiline(u.today),
            blockers: Sanitizer.sanitizeMultiline(u.blockers),
            hasBlocker: u.hasBlocker,
          })),
          blockers: blockers.map((b) => ({
            title: Sanitizer.sanitizeText(b.title),
            description: Sanitizer.sanitizeMultiline(b.description),
            severity: b.severity,
            status: b.status,
            occurrencesCount: b.occurrencesCount,
          })),
        }),
      });

      const res = await response.json().catch(() => ({}));

      if (!response.ok || !res.success || !res.data) {
        const errorMsg = res?.error?.message || res?.error || `Server status ${response.status}`;
        throw new Error(errorMsg);
      }

      const validation = DataValidator.validateStakeholderReport(res.data, projectId, sprint.id);
      StorageService.saveStakeholderReport(validation.data);
      return { data: validation.data, isFallback: false };
    } catch (err: any) {
      console.warn('[AnalyzerService] Remote report generation failed, falling back to local analysis:', err?.message);
      const fallback = this.generateStakeholderReport(sprint, projectId);
      return { data: fallback, isFallback: true, error: err?.message || 'AI service unavailable' };
    }
  }
};

