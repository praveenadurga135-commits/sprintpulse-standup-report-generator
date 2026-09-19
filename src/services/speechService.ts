// Web Speech API interfaces
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface SpeechParseResult {
  fullTranscript: string;
  yesterday?: string;
  today?: string;
  blockers?: string;
}

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private currentTranscript: string = '';

  constructor() {
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          this.currentTranscript = finalTranscript;
          const fullText = (finalTranscript + interimTranscript).trim();
          if (this.onTranscriptCallback) {
            this.onTranscriptCallback(fullText);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(onTranscript: (text: string) => void, onError?: (error: string) => void) {
    this.currentTranscript = '';
    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError || null;

    if (this.recognition) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.warn('Could not start recognition:', e);
      }
    }
  }

  stop(): string {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition:', e);
      }
    }
    this.isListening = false;
    return this.currentTranscript.trim();
  }

  // Parses voice transcript into Yesterday, Today, and Blocker sections if keywords are mentioned
  static parseStandupTranscript(raw: string): SpeechParseResult {
    const text = raw.trim();
    if (!text) {
      return { fullTranscript: '' };
    }

    const lower = text.toLowerCase();
    let yesterday: string | undefined;
    let today: string | undefined;
    let blockers: string | undefined;

    // Search indices for section markers
    const yIdx = lower.search(/\b(yesterday|what i did|accomplished)\b/i);
    const tIdx = lower.search(/\b(today|planning to|working on)\b/i);
    const bIdx = lower.search(/\b(blocker|blockers|blocking|impediment)\b/i);

    if (yIdx !== -1 || tIdx !== -1 || bIdx !== -1) {
      if (yIdx !== -1) {
        const nextMarkers = [tIdx, bIdx].filter((idx) => idx > yIdx);
        const yEnd = nextMarkers.length > 0 ? Math.min(...nextMarkers) : text.length;
        yesterday = text.substring(yIdx, yEnd).replace(/^(yesterday|what i did|accomplished)\s*(i|was|:)?/i, '').trim();
      }

      if (tIdx !== -1) {
        const nextMarkers = [bIdx].filter((idx) => idx > tIdx);
        const tEnd = nextMarkers.length > 0 ? Math.min(...nextMarkers) : text.length;
        today = text.substring(tIdx, tEnd).replace(/^(today|planning to|working on)\s*(i am|i'm|i will|:)?/i, '').trim();
      }

      if (bIdx !== -1) {
        blockers = text.substring(bIdx).replace(/^(blocker|blockers|blocking|impediment)\s*(is|are|:)?/i, '').trim();
      }

      return {
        fullTranscript: text,
        yesterday: yesterday ? capitalize(yesterday) : undefined,
        today: today ? capitalize(today) : undefined,
        blockers: blockers ? capitalize(blockers) : undefined,
      };
    }

    // Return full transcript so user can direct it into any specific field
    return { fullTranscript: text };
  }

  // Realistic sample dictations for quick hackathon demonstrations
  static getSampleDictations(): { label: string; text: string }[] {
    return [
      {
        label: 'Full Daily Standup (Yesterday + Today + Blocker)',
        text: 'Yesterday I finished implementing the payment gateway webhook signature validator and added unit tests. Today I am connecting the 3D Secure verification modal into checkout. Blocker is that the staging sandbox environment access is still unavailable.',
      },
      {
        label: 'Feature Progress (Yesterday + Today, No Blockers)',
        text: 'Yesterday I refactored the order summary component and cleaned up CSS spacing. Today I will run end-to-end checkout automation tests. Blocker: none, all clear.',
      },
      {
        label: 'Infrastructure Blocker Report',
        text: 'Yesterday I tested Redis failover in the staging cluster. Today I am configuring Vault token rotation policies. Blocker is waiting on SecOps approval for production ingress secrets.',
      }
    ];
  }
}

function capitalize(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
