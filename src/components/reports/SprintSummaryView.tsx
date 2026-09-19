import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, Clock, AlertOctagon, 
  AlertTriangle, ArrowRight, Copy, Check, RefreshCw 
} from 'lucide-react';
import { SprintSummaryData } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';
import { AnalyzerService } from '../../services/analyzer';

export const SprintSummaryView: React.FC = () => {
  const { currentProject, currentSprint } = useProject();
  const { toast } = useToast();

  const [summary, setSummary] = useState<SprintSummaryData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [copied, setCopied] = useState(false);

  // Load existing summary if available or generate initial
  useEffect(() => {
    let isMounted = true;
    if (currentSprint && currentProject) {
      const existing = StorageService.getSprintSummary(currentSprint.id);
      if (existing) {
        setSummary(existing);
      } else {
        AnalyzerService.generateSprintSummaryWithLLM(currentSprint, currentProject.id)
          .then((generated) => {
            if (isMounted) setSummary(generated);
          })
          .catch(() => {
            if (isMounted) {
              const fallback = AnalyzerService.generateSprintSummary(currentSprint, currentProject.id);
              setSummary(fallback);
            }
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [currentSprint?.id, currentProject?.id]);

  const handleGenerate = async () => {
    if (!currentSprint || !currentProject) return;

    setIsGenerating(true);
    setGenerationStep(0);

    const steps = [
      'Aggregating submitted daily standups...',
      'Synthesizing completed deliverables & work in progress...',
      'Correlating recurring blockers and calculating velocity risk...',
      'Finalizing executive summary and recommendations...',
    ];

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setGenerationStep(current);
      }
    }, 450);

    try {
      const res = await AnalyzerService.generateSprintSummaryWithLLM(currentSprint, currentProject.id);
      clearInterval(interval);
      setSummary(res);
      setIsGenerating(false);
      toast.success(`Generated comprehensive sprint summary for ${currentSprint.name}!`, 'Sprint Summary Generated');
    } catch {
      clearInterval(interval);
      const fallback = AnalyzerService.generateSprintSummary(currentSprint, currentProject.id);
      setSummary(fallback);
      setIsGenerating(false);
      toast.success(`Generated comprehensive sprint summary for ${currentSprint.name}!`, 'Sprint Summary Generated');
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;

    const formatted = `
SPRINT SUMMARY: ${currentSprint?.name} (${currentProject?.name})
Generated: ${new Date(summary.generatedAt).toLocaleDateString()}

OVERALL PROGRESS (${summary.progressPercentage}%):
${summary.overallProgress}

COMPLETED WORK:
${summary.completedWork.map((w) => `• ${w}`).join('\n')}

WORK IN PROGRESS:
${summary.workInProgress.map((w) => `• ${w}`).join('\n')}

KEY BLOCKERS:
${summary.keyBlockers.map((b) => `• [${b.severity}] ${b.title} - ${b.impact}`).join('\n')}

RISKS:
${summary.risks.map((r) => `• [${r.level}] ${r.risk} (Mitigation: ${r.mitigation})`).join('\n')}

NEXT STEPS:
${summary.nextSteps.map((s) => `• ${s}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    toast.success('Sprint summary copied to clipboard in clean markdown format!', 'Summary Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Synthesis & Milestone Tracking
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Standup Data Synthesized
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Sprint Summary
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Structured analysis of all daily standup updates, completed deliverables, ongoing tasks, and operational risk mitigation for {currentSprint?.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {summary && (
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                title="Copy formatted summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Analyzing Updates...' : 'Generate Sprint Summary'}</span>
            </button>
          </div>
        </div>

        {summary && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Last analyzed:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {new Date(summary.generatedAt).toLocaleString()}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span>Sprint Progress:</span>
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                {summary.progressPercentage}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading Progress State */}
      {isGenerating && (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-brand-200 dark:border-brand-900 shadow-md text-center space-y-4 animate-slide-up">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Synthesizing Sprint Standups
            </h3>
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 font-medium">
              {[
                'Aggregating submitted daily standups...',
                'Synthesizing completed deliverables & work in progress...',
                'Correlating recurring blockers and calculating velocity risk...',
                'Finalizing executive summary and recommendations...',
              ][generationStep]}
            </p>
          </div>
          <div className="w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{ width: `${((generationStep + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary Content */}
      {summary && !isGenerating && (
        <div className="space-y-6">
          {/* SECTION 1: Overall Progress */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                Overall Progress
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
                {summary.progressPercentage}% Completed
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {summary.overallProgress}
            </p>
          </div>

          {/* SECTION 2 & 3: Completed Work & Work In Progress (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completed Work */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Completed Work
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                {summary.completedWork.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Work In Progress */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
                Work In Progress
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                {summary.workInProgress.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SECTION 4: Key Blockers */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-4 h-4" />
              Key Blockers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.keyBlockers.map((b, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{b.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : b.severity === 'High'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {b.severity}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight">
                    {b.impact}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: Risks */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Sprint Risks & Contingencies
            </h3>
            <div className="space-y-2.5">
              {summary.risks.map((r, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 dark:text-amber-200">{r.risk}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {r.level} Risk
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Mitigation: </span>
                    {r.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: Next Steps */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 text-brand-600 dark:text-brand-400">
              <ArrowRight className="w-4 h-4" />
              Actionable Next Steps
            </h3>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              {summary.nextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
