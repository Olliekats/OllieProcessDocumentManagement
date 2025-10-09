/**
 * Screen Reader Service using Web Speech API (Built-in, Free)
 *
 * Uses the browser's native Speech Synthesis API - no external libraries needed!
 * Supported in Chrome, Firefox, Safari, Edge
 */

class ScreenReaderService {
  private synth: SpeechSynthesis | null = null;
  private enabled: boolean = false;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private volume: number = 1.0;
  private voice: SpeechSynthesisVoice | null = null;
  private queue: string[] = [];
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      if (this.synth) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    } else {
      console.warn('Speech Synthesis not supported in this browser');
    }
  }

  private loadVoices() {
    if (!this.synth) return;

    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  }

  isSupported(): boolean {
    return this.synth !== null;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;

    if (!enabled) {
      this.stop();
    }

    if (enabled && this.synth) {
      this.speak('Screen reader enabled');
    }
  }

  setRate(rate: number) {
    this.rate = Math.max(0.1, Math.min(10, rate));
  }

  setPitch(pitch: number) {
    this.pitch = Math.max(0, Math.min(2, pitch));
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setVoice(voiceName: string) {
    if (!this.synth) return;

    const voices = this.synth.getVoices();
    this.voice = voices.find(v => v.name === voiceName) || this.voice;
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  speak(text: string, priority: 'low' | 'normal' | 'high' = 'normal') {
    if (!this.enabled || !this.synth || !text.trim()) return;

    const cleanText = this.cleanText(text);

    if (priority === 'high') {
      this.stop();
      this.speakNow(cleanText);
    } else if (priority === 'normal') {
      if (this.isSpeaking) {
        this.queue.push(cleanText);
      } else {
        this.speakNow(cleanText);
      }
    } else {
      this.queue.push(cleanText);
      if (!this.isSpeaking) {
        this.processQueue();
      }
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private speakNow(text: string) {
    if (!this.synth) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    if (this.voice) {
      utterance.voice = this.voice;
    }

    this.isSpeaking = true;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this.processQueue();
    };

    this.synth.speak(utterance);
  }

  private processQueue() {
    if (this.queue.length > 0 && !this.isSpeaking) {
      const nextText = this.queue.shift();
      if (nextText) {
        this.speakNow(nextText);
      }
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.queue = [];
      this.isSpeaking = false;
    }
  }

  pause() {
    if (this.synth) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }

  announceNavigation(moduleName: string) {
    this.speak(`Navigated to ${moduleName}`, 'normal');
  }

  announceNotification(title: string, message: string) {
    this.speak(`New notification: ${title}. ${message}`, 'high');
  }

  announceButton(label: string) {
    this.speak(`${label} button`, 'low');
  }

  announceAction(action: string) {
    this.speak(action, 'normal');
  }

  announceError(error: string) {
    this.speak(`Error: ${error}`, 'high');
  }

  announceSuccess(message: string) {
    this.speak(`Success: ${message}`, 'normal');
  }

  announceFormField(label: string, value?: string) {
    const text = value ? `${label}, ${value}` : label;
    this.speak(text, 'low');
  }

  announceModalOpen(title: string) {
    this.speak(`Dialog opened: ${title}`, 'normal');
  }

  announceModalClose() {
    this.speak('Dialog closed', 'low');
  }

  announcePageLoad(title: string) {
    this.speak(`Page loaded: ${title}`, 'normal');
  }

  describeElement(element: HTMLElement) {
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    const label = element.getAttribute('aria-label') ||
                  element.getAttribute('title') ||
                  element.textContent?.substring(0, 100) ||
                  'unlabeled element';

    this.speak(`${role}: ${label}`, 'low');
  }
}

export const screenReaderService = new ScreenReaderService();

export const readOnFocus = (element: HTMLElement) => {
  if (screenReaderService.isEnabled()) {
    element.addEventListener('focus', () => {
      screenReaderService.describeElement(element);
    }, { once: false });
  }
};

export const readOnHover = (element: HTMLElement, text: string) => {
  if (screenReaderService.isEnabled()) {
    element.addEventListener('mouseenter', () => {
      screenReaderService.speak(text, 'low');
    });
  }
};
