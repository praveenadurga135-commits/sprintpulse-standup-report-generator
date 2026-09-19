import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, Mic, MicOff, Save, Send, Sparkles, 
  Calendar, Check, AlertCircle, Clock, Volume2, RotateCcw 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../services/storage';
import { SpeechService } from '../../services/speechService';
import { AnalyzerService } from '../../services/analyzer';

export const StandupSubmission: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentProject, currentSprint } = useProject();
  const { toast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeVoiceTarget, setActiveVoiceTarget] = useState<'all' | 'yesterday' | 'today' | 'blockers'>('all');
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);

  const baseTextRef = useRef<string>('');
  const initialYesterdayRef = useRef<string>('');
  const initialTodayRef = useRef<string>('');
  const initialBlockersRef = useRef<string>('');
  const speechServiceRef = useRef<SpeechService | null>(null);
  const timerRef = useRef<any>(null);

  // Initialize speech service with unmount cleanup
  useEffect(() => {
    speechServiceRef.current = new SpeechService();

    return () => {
      if (speechServiceRef.current) {
        try {
          speechServiceRef.current.stop();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // Load today's update if already exists
  useEffect(() => {
    if (currentUser && currentProject && currentSprint) {
      const existing = StorageService.getUpdates({
        projectId: currentProject.id,
        sprintId: currentSprint.id,
        userId: currentUser.id,
        date: todayStr,
      });

      if (existing.length > 0) {
        const u = existing[0];
        setYesterday(u.yesterday || '');
        setToday(u.today || '');
        setBlockers(u.blockers || '');
        setIsDraft(!!u.isDraft);
        setIsSubmitted(!u.isDraft);
        setLastSubmittedAt(u.updatedAt);
      } else {
        setYesterday('');
        setToday('');
        setBlockers('');
        setIsDraft(false);
        setIsSubmitted(false);
      }
    }
  }, [currentUser?.id, currentProject?.id, currentSprint?.id, todayStr]);

  // Voice Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startVoiceRecording = (target: 'all' | 'yesterday' | 'today' | 'blockers' = 'all') => {
    if (isRecording && activeVoiceTarget === target) {
      stopVoiceRecording();
      return;
    }

    if (isRecording) {
      const service = speechServiceRef.current;
      if (service) service.stop();
      setIsRecording(false);
    }

    setActiveVoiceTarget(target);
    if (target === 'yesterday') baseTextRef.current = yesterday;
    else if (target === 'today') baseTextRef.current = today;
    else if (target === 'blockers') baseTextRef.current = blockers;
    else {
      initialYesterdayRef.current = yesterday;
      initialTodayRef.current = today;
      initialBlockersRef.current = blockers;
      baseTextRef.current = today;
    }

    const service = speechServiceRef.current;
    if (!service) return;

    if (!service.isSupported()) {
      toast.info('Browser speech recognition not directly supported; you can type or pick a sample dictation.', 'Voice Recording');
      setShowVoiceGuide(true);
      return;
    }

    setIsRecording(true);
    service.start(
      (transcript) => {
        handleVoiceTranscript(transcript, target);
      },
      (err) => {
        console.warn('Voice recognition error:', err);
        setIsRecording(false);
        if (err === 'not-allowed' || err === 'permission-denied') {
          toast.error('Microphone permission was denied. Please allow microphone access in browser settings.', 'Microphone Access');
        } else if (err === 'no-speech') {
          toast.info('No speech detected. Please speak closer to your microphone.', 'Voice Input');
        } else {
          toast.warning('Microphone input ended. You can continue typing directly.', 'Voice Input');
        }
      }
    );
  };

  const stopVoiceRecording = () => {
    const service = speechServiceRef.current;
    if (service) {
      service.stop();
    }
    setIsRecording(false);
    toast.success('Voice dictation processed. You can review and edit before submitting.', 'Voice Transcribed');
  };

  const handleVoiceTranscript = (text: string, target: 'all' | 'yesterday' | 'today' | 'blockers') => {
    const base = baseTextRef.current.trim();
    const combined = base ? `${base} ${text}` : text;

    if (target === 'yesterday') {
      setYesterday(combined);
    } else if (target === 'today') {
      setToday(combined);
    } else if (target === 'blockers') {
      setBlockers(combined);
    } else {
      // Smart multi-section parser for global voice recording
      const parsed = SpeechService.parseStandupTranscript(text);
      if (parsed.yesterday || parsed.today || parsed.blockers) {
        if (parsed.yesterday) {
          const yBase = initialYesterdayRef.current.trim();
          setYesterday(yBase ? `${yBase} ${parsed.yesterday}` : parsed.yesterday);
        }
        if (parsed.today) {
          const tBase = initialTodayRef.current.trim();
          setToday(tBase ? `${tBase} ${parsed.today}` : parsed.today);
        }
        if (parsed.blockers) {
          const bBase = initialBlockersRef.current.trim();
          setBlockers(bBase ? `${bBase} ${parsed.blockers}` : parsed.blockers);
        }
      } else {
        setToday(base ? `${base} ${text}` : text);
      }
    }
  };

  const handleApplySampleDictation = (dictationText: string) => {
    const parsed = SpeechService.parseStandupTranscript(dictationText);
    if (parsed.yesterday) setYesterday(parsed.yesterday);
    if (parsed.today) setToday(parsed.today);
    if (parsed.blockers) setBlockers(parsed.blockers);
    setShowVoiceGuide(false);
    toast.success('Sample voice dictation applied to fields. Feel free to edit!', 'Voice Simulated');
  };

  const handleSaveDraft = () => {
    if (!currentUser || !currentProject || !currentSprint) return;

    StorageService.saveUpdate({
      projectId: currentProject.id,
      sprintId: currentSprint.id,
      userId: currentUser.id,
      date: todayStr,
      yesterday,
      today,
      blockers,
      isDraft: true,
    });

    setIsDraft(true);
    toast.info('Draft saved. You can return and complete it anytime today.', 'Draft Saved');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentProject || !currentSprint) return;

    if (!yesterday.trim() && !today.trim()) {
      toast.error('Please provide at least what you accomplished yesterday or plan today.', 'Missing Information');
      return;
    }

    const saved = StorageService.saveUpdate({
      projectId: currentProject.id,
      sprintId: currentSprint.id,
      userId: currentUser.id,
      date: todayStr,
      yesterday: yesterday.trim(),
      today: today.trim(),
      blockers: blockers.trim() || 'None',
      isDraft: false,
      voiceUsed: isRecording || recordingSeconds > 0,
    });

    // Run semantic analyzer to update recurring blockers
    AnalyzerService.analyzeBlockers(currentSprint.id, currentProject.id);

    setIsSubmitted(true);
    setIsDraft(false);
    setLastSubmittedAt(saved.updatedAt);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0e8ce9', '#10b981', '#6366f1', '#f59e0b'],
      });
    } catch (e) {
      // safe fallback
    }

    toast.success('Standup submitted successfully! Your updates are now live on the team dashboard.', 'Standup Recorded');
  };

  if (!currentProject || !currentSprint) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          No Active Project or Sprint
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select or join a project to submit your daily standup.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Team Member Daily Log
            </span>
            {isSubmitted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Check className="w-3 h-3" /> Submitted for Today
              </span>
            )}
            {isDraft && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Draft Saved
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Daily Standup
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              Project: <span className="text-brand-600 dark:text-brand-400 font-bold">{currentProject.name}</span>
            </span>
            <span>•</span>
            <span className="font-medium">{currentSprint.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Global Voice Input Button */}
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={() => startVoiceRecording('all')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
              title="Speak your standup update"
            >
              <Mic className="w-4 h-4" />
              <span>Record Voice Update</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopVoiceRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all animate-pulse"
            >
              <MicOff className="w-4 h-4" />
              <span>Stop Recording ({formatTimer(recordingSeconds)})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowVoiceGuide(!showVoiceGuide)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Sample voice dictations & tips"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Recording Live Visualizer Banner */}
      {isRecording && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-indigo-50 dark:from-rose-950/40 dark:to-indigo-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
            <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
              <span className="font-bold text-rose-600 dark:text-rose-400">Listening live: </span>
              Speak naturally. Mention "Yesterday", "Today", or "Blocker" for automated section placement.
            </div>
          </div>
          <div className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
            {formatTimer(recordingSeconds)}
          </div>
        </div>
      )}

      {/* Voice Helper & Demo Samples Drawer */}
      {showVoiceGuide && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-brand-200 dark:border-brand-900 shadow-md animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-xs text-brand-700 dark:text-brand-300">
              <Sparkles className="w-4 h-4" />
              <span>Voice Dictation Assistant & Demo Presets</span>
            </div>
            <button
              onClick={() => setShowVoiceGuide(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              Close
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            Click any realistic scenario below to immediately populate the three standup fields for quick hackathon demonstrations:
          </p>
          <div className="space-y-2">
            {SpeechService.getSampleDictations().map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySampleDictation(sample.text)}
                className="w-full p-3 text-left rounded-xl bg-slate-50 hover:bg-brand-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs transition-colors group"
              >
                <div className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 flex items-center justify-between">
                  <span>{sample.label}</span>
                  <span className="text-[10px] font-mono text-brand-600 uppercase">Apply Sample</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-2">
                  "{sample.text}"
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Standup Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: YESTERDAY */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-500/20">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Section 1
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Yesterday
              </h2>
            </div>
            {isRecording && activeVoiceTarget === 'yesterday' ? (
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="text-xs px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5 font-bold animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop ({formatTimer(recordingSeconds)})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startVoiceRecording('yesterday')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 font-semibold"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Dictate</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            What did you accomplish yesterday?
          </p>
          <textarea
            rows={4}
            required
            value={yesterday}
            onChange={(e) => setYesterday(e.target.value)}
            placeholder="e.g. Completed JWT token refresh middleware and wired unit test suite with 92% code coverage..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* SECTION 2: TODAY */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-500/20">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Section 2
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Today
              </h2>
            </div>
            {isRecording && activeVoiceTarget === 'today' ? (
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="text-xs px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5 font-bold animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop ({formatTimer(recordingSeconds)})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startVoiceRecording('today')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 font-semibold"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Dictate</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            What are you planning to work on today?
          </p>
          <textarea
            rows={4}
            required
            value={today}
            onChange={(e) => setToday(e.target.value)}
            placeholder="e.g. Integrating payment gateway iframe into the customer checkout flow and validating 3D Secure modal triggers..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* SECTION 3: BLOCKERS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-rose-500/20">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-rose-500">
                Section 3
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Blockers & Impediments
              </h2>
            </div>
            {isRecording && activeVoiceTarget === 'blockers' ? (
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="text-xs px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5 font-bold animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop ({formatTimer(recordingSeconds)})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startVoiceRecording('blockers')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 font-semibold"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Dictate</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Is anything blocking your progress? (If none, type "None")
          </p>
          <textarea
            rows={3}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="e.g. Waiting on staging cluster IAM credentials to deploy and test webhook callbacks..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400">
            {lastSubmittedAt && (
              <span>Last updated {new Date(lastSubmittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitted ? 'Update Standup' : 'Submit Standup'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
