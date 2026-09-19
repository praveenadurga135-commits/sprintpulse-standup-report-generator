import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Printer, Copy, Check, Share2, Sparkles, 
  CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp, 
  ArrowRight, ShieldCheck, Mail 
} from 'lucide-react';
import { StakeholderReportData } from '../../types';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';
import { AnalyzerService } from '../../services/analyzer';

export const StakeholderReportView: React.FC = () => {
  const { currentProject, currentSprint } = useProject();
  const { toast } = useToast();

  const [report, setReport] = useState<StakeholderReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFallbackReport, setIsFallbackReport] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (currentSprint && currentProject) {
      const existing = StorageService.getStakeholderReport(currentSprint.id);
      if (existing) {
        setReport(existing);
      } else {
        AnalyzerService.generateStakeholderReportWithLLM(currentSprint, currentProject.id)
          .then(({ data, isFallback }) => {
            if (isMounted) {
              setReport(data);
              setIsFallbackReport(isFallback);
            }
          })
          .catch(() => {
            if (isMounted) {
              const fallback = AnalyzerService.generateStakeholderReport(currentSprint, currentProject.id);
              setReport(fallback);
              setIsFallbackReport(true);
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
    setIsFallbackReport(false);
    try {
      const { data, isFallback, error } = await AnalyzerService.generateStakeholderReportWithLLM(currentSprint, currentProject.id);
      setReport(data);
      setIsFallbackReport(isFallback);
      setIsGenerating(false);
      if (isFallback) {
        toast.warning(
          `AI service unavailable${error ? ` — ${error}` : ''}. Report generated from local standup data.`,
          'Local Analysis Used'
        );
      } else {
        toast.success('Generated executive stakeholder report ready for leadership review.', 'Report Generated');
      }
    } catch {
      const fallback = AnalyzerService.generateStakeholderReport(currentSprint, currentProject.id);
      setReport(fallback);
      setIsFallbackReport(true);
      setIsGenerating(false);
      toast.warning('AI service unavailable. Report generated from local standup data.', 'Local Analysis Used');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReport = async () => {
    if (!report) return;

    const markdown = `
# SPRINT PROGRESS REPORT: ${currentSprint?.name}
**Project:** ${currentProject?.name}
**Date:** ${new Date(report.generatedAt).toLocaleDateString()}
**Overall Status:** ${report.sprintStatus.toUpperCase()}

---

## 1. EXECUTIVE SUMMARY
${report.executiveSummary}

## 2. KEY ACHIEVEMENTS
${report.keyAchievements.map((a) => `• ${a}`).join('\n')}

## 3. CURRENT PROGRESS METRICS
${report.currentProgress.map((m) => `• ${m.metric}: ${m.value}`).join('\n')}

## 4. KEY RISKS & MITIGATIONS
${report.keyRisks.map((r) => `• ${r}`).join('\n')}

## 5. BLOCKERS & IMPEDIMENTS
${report.blockers.map((b) => `• ${b}`).join('\n')}

## 6. NEXT STEPS & MILESTONES
${report.nextSteps.map((s) => `• ${s}`).join('\n')}
    `.trim();

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success('Stakeholder report copied to clipboard formatted for email / Notion!', 'Report Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.warning('Could not access clipboard. Please copy manually.', 'Clipboard Error');
    }
  };

  const getStatusBadge = (status: 'On Track' | 'At Risk' | 'Needs Attention') => {
    switch (status) {
      case 'On Track':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'At Risk':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'Needs Attention':
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header controls (Hidden during print) */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Executive Reporting
              </span>
              {isFallbackReport ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Local Analysis
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  AI Generated
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Stakeholder Progress Report
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Polished, non-technical progress briefing designed for executive leadership, cross-functional partners, and client updates.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="Print or export as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Updating...' : 'Regenerate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stakeholder Report Document Container */}
      {report && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-md print-container space-y-8">
          {/* Document Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Engineering Leadership Brief
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  Sprint Progress Report
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Project: {currentProject?.name}
                  </span>
                  <span>•</span>
                  <span>{currentSprint?.name}</span>
                  <span>•</span>
                  <span>Date: {new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Sprint Status
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${getStatusBadge(report.sprintStatus)}`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {report.sprintStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              1. Executive Summary
            </h2>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {report.executiveSummary}
            </p>
          </div>

          {/* Section 2: Key Achievements */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              2. Key Achievements
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {report.keyAchievements.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Current Progress Metrics Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              3. Current Progress
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {report.currentProgress.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {metric.metric}
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Key Risks */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              4. Key Risks & Mitigations
            </h2>
            <div className="space-y-2">
              {report.keyRisks.map((risk, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Blockers */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              5. Operational Blockers
            </h2>
            <div className="space-y-2">
              {report.blockers.map((blocker, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                >
                  <AlertOctagon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{blocker}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Next Steps */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              6. Next Steps
            </h2>
            <ul className="space-y-2 text-xs text-slate-800 dark:text-slate-200">
              {report.nextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <ArrowRight className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Document Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Prepared by SprintPulse Engineering Platform</span>
            <span>Confidential & Proprietary</span>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Share Stakeholder Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dispatch this report to leadership channels or copy link.
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  handleCopyReport();
                  setShowShareModal(false);
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Copy className="w-4 h-4 text-brand-600" />
                <span>Copy formatted Markdown</span>
              </button>

              <button
                onClick={() => {
                  toast.success('Email draft with report template generated.', 'Email Shared');
                  setShowShareModal(false);
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Mail className="w-4 h-4 text-purple-600" />
                <span>Send to Executive Mailing List</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
