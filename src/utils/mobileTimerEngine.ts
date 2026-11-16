// Mobile Timer Engine & Background Lock-Screen Controller
// Provides:
// 1. Screen Wake Lock (keeps phone awake while timer/stopwatch is active, prevents dimming/sleep)
// 2. High-precision timestamp timing (Date.now() targetEndTime & startTime, immune to iOS background throttling)
// 3. iOS Lock Screen Now Playing widget & MediaSession API (shows live ticking countdown / stopwatch on lock screen with controls)
// 4. Silent HTML5 audio loop (maintains background execution & iOS Now Playing media session on lock screen)
// 5. Visibility change & focus listeners (instantly resyncs exact time on phone wake/unlock)
// 6. Global event broadcaster for app-wide UI & Dynamic Island banner

import { soundEngine } from './audio';
import { iosNativeBridge } from './iosNativeBridge';

export type TimerMode = 'countdown' | 'stopwatch';

export interface MobileTimerState {
  isActive: boolean;
  isRunning: boolean;
  mode: TimerMode;
  system: string; // 'pomodoro' | 'ultradian' | 'sprint' | 'custom' | 'stopwatch' | 'task'
  phase: 'focus' | 'short_break' | 'long_break';
  taskTitle: string;
  category: string;
  totalDurationSeconds: number;
  secondsRemaining: number;
  stopwatchSeconds: number;
  targetEndTime: number | null; // Date.now() timestamp when countdown ends
  stopwatchStartTime: number | null; // Date.now() timestamp when stopwatch started
}

type TimerListener = (state: MobileTimerState) => void;

class MobileTimerEngine {
  private state: MobileTimerState = {
    isActive: false,
    isRunning: false,
    mode: 'countdown',
    system: 'pomodoro',
    phase: 'focus',
    taskTitle: '',
    category: 'deep-work',
    totalDurationSeconds: 25 * 60,
    secondsRemaining: 25 * 60,
    stopwatchSeconds: 0,
    targetEndTime: null,
    stopwatchStartTime: null,
  };

  private listeners: Set<TimerListener> = new Set();
  private timerInterval: any = null;
  private wakeLock: any = null;
  private silentAudio: HTMLAudioElement | null = null;
  private onCompleteCallback: (() => void) | null = null;

  constructor() {
    this.restoreFromStorage();
    this.setupVisibilityListener();
  }

  // Restore state if app was reloaded while timer was running
  private restoreFromStorage() {
    try {
      const saved = localStorage.getItem('neva_mobile_timer_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };

        // If it was running, recalculate time based on timestamps
        if (this.state.isActive && this.state.isRunning) {
          this.syncWithTimestamp();
          // Resume background ticking
          this.startTicking();
        }
      }
    } catch (e) {
      console.warn('Failed to restore mobile timer state', e);
    }
  }

  private persistState() {
    try {
      localStorage.setItem('neva_mobile_timer_state_v1', JSON.stringify(this.state));
    } catch (e) {}
  }

  // Subscribe to timer state updates
  subscribe(listener: TimerListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(currentState);
      } catch (e) {}
    });
    this.persistState();
  }

  getState(): MobileTimerState {
    return { ...this.state };
  }

  // Setup visibility change & window focus listeners to catch up on unlock
  private setupVisibilityListener() {
    if (typeof window === 'undefined') return;

    const handleSync = () => {
      if (this.state.isActive && this.state.isRunning) {
        this.syncWithTimestamp();
        this.requestWakeLock();
        this.updateLockScreenMediaSession();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleSync();
      }
    });

    window.addEventListener('focus', handleSync);
  }

  // High-precision recalculation based on actual timestamps
  private syncWithTimestamp() {
    const now = Date.now();

    if (this.state.mode === 'countdown') {
      if (this.state.targetEndTime) {
        const diffMs = this.state.targetEndTime - now;
        const remaining = Math.max(0, Math.ceil(diffMs / 1000));
        this.state.secondsRemaining = remaining;

        if (remaining <= 0) {
          // Timer reached 0 while screen was dimmed or locked
          this.handleTimerComplete();
        }
      }
    } else if (this.state.mode === 'stopwatch') {
      if (this.state.stopwatchStartTime) {
        const diffMs = now - this.state.stopwatchStartTime;
        const elapsed = Math.max(0, Math.floor(diffMs / 1000));
        this.state.stopwatchSeconds = elapsed;
      }
    }

    this.notify();
  }

  // Request Screen Wake Lock (keeps screen awake without dimming)
  private async requestWakeLock() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!this.wakeLock) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
    } catch (e) {
      // Wake lock can fail if low battery or background tab, which is safe to ignore
    }
  }

  // Release Screen Wake Lock
  private async releaseWakeLock() {
    try {
      if (this.wakeLock) {
        await this.wakeLock.release().catch(() => {});
        this.wakeLock = null;
      }
    } catch (e) {}
  }

  // Ensure silent audio is playing so iOS WebKit doesn't sleep & allows Lock Screen widget
  private ensureBackgroundAudio() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.silentAudio) {
        // Ultra-short 1-second silent WAV base64
        const silentWav =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        const audio = new Audio(silentWav);
        audio.loop = true;
        audio.preload = 'auto';
        (audio as any).playsInline = true;
        audio.volume = 0.001;
        this.silentAudio = audio;
      }

      this.silentAudio.play().catch(() => {
        // Audio play might need user touch gesture initially
      });
    } catch (e) {}
  }

  private stopBackgroundAudio() {
    try {
      if (this.silentAudio) {
        this.silentAudio.pause();
        this.silentAudio.currentTime = 0;
      }
    } catch (e) {}
  }

  // Start or resume countdown session
  startCountdown(options: {
    durationSeconds: number;
    initialRemainingSeconds?: number;
    taskTitle?: string;
    category?: string;
    system?: string;
    phase?: 'focus' | 'short_break' | 'long_break';
    onComplete?: () => void;
  }) {
    const total = options.durationSeconds;
    const remaining = options.initialRemainingSeconds !== undefined ? options.initialRemainingSeconds : total;
    const now = Date.now();
    const targetEnd = now + remaining * 1000;

    this.onCompleteCallback = options.onComplete || null;

    this.state = {
      isActive: true,
      isRunning: true,
      mode: 'countdown',
      system: options.system || 'pomodoro',
      phase: options.phase || 'focus',
      taskTitle: options.taskTitle || '',
      category: options.category || 'deep-work',
      totalDurationSeconds: total,
      secondsRemaining: remaining,
      stopwatchSeconds: 0,
      targetEndTime: targetEnd,
      stopwatchStartTime: null,
    };

    this.requestWakeLock();
    this.ensureBackgroundAudio();
    this.startTicking();
    this.updateLockScreenMediaSession();
    this.notify();

    // Schedule native time-sensitive alarm for screen-lock
    if (remaining > 0) {
      iosNativeBridge.scheduleFocusAlarm(
        'focus-timer',
        '⏰ Focus Block Complete!',
        options.taskTitle ? `${options.taskTitle} session complete.` : 'Your focus block is complete. Take a mindful break.',
        remaining
      );
    }
  }

  // Start or resume open stopwatch session
  startStopwatch(options: {
    initialElapsedSeconds?: number;
    taskTitle?: string;
    category?: string;
    system?: string;
  }) {
    const elapsed = options.initialElapsedSeconds || 0;
    const now = Date.now();
    const startTime = now - elapsed * 1000;

    this.onCompleteCallback = null;

    this.state = {
      isActive: true,
      isRunning: true,
      mode: 'stopwatch',
      system: options.system || 'stopwatch',
      phase: 'focus',
      taskTitle: options.taskTitle || '',
      category: options.category || 'deep-work',
      totalDurationSeconds: 0,
      secondsRemaining: 0,
      stopwatchSeconds: elapsed,
      targetEndTime: null,
      stopwatchStartTime: startTime,
    };

    this.requestWakeLock();
    this.ensureBackgroundAudio();
    this.startTicking();
    this.updateLockScreenMediaSession();
    this.notify();
  }

  // Pause active timer or stopwatch
  pause() {
    if (!this.state.isRunning) return;

    // Snapshot exact remaining/elapsed before pausing
    this.syncWithTimestamp();

    this.state.isRunning = false;
    this.state.targetEndTime = null;
    this.state.stopwatchStartTime = null;

    this.stopTicking();
    this.releaseWakeLock();
    this.stopBackgroundAudio();
    iosNativeBridge.cancelAlarm('focus-timer');
    this.updateLockScreenMediaSession();
    this.notify();
  }

  // Resume paused timer or stopwatch
  resume() {
    if (this.state.isRunning || !this.state.isActive) return;

    const now = Date.now();
    if (this.state.mode === 'countdown') {
      this.state.targetEndTime = now + this.state.secondsRemaining * 1000;
      if (this.state.secondsRemaining > 0) {
        iosNativeBridge.scheduleFocusAlarm(
          'focus-timer',
          '⏰ Focus Block Complete!',
          this.state.taskTitle ? `${this.state.taskTitle} session complete.` : 'Focus session complete. Mindful pause.',
          this.state.secondsRemaining
        );
      }
    } else {
      this.state.stopwatchStartTime = now - this.state.stopwatchSeconds * 1000;
    }

    this.state.isRunning = true;
    this.requestWakeLock();
    this.ensureBackgroundAudio();
    this.startTicking();
    this.updateLockScreenMediaSession();
    this.notify();
  }

  // Reset or Stop timer completely
  stop() {
    this.state.isActive = false;
    this.state.isRunning = false;
    this.state.targetEndTime = null;
    this.state.stopwatchStartTime = null;
    this.state.secondsRemaining = 0;
    this.state.stopwatchSeconds = 0;

    this.stopTicking();
    this.releaseWakeLock();
    this.stopBackgroundAudio();
    iosNativeBridge.cancelAlarm('focus-timer');
    this.clearLockScreenMediaSession();
    this.notify();
  }

  // Set remaining seconds manually (e.g. when user changes minutes or skips)
  updateRemainingSeconds(seconds: number, totalSeconds?: number) {
    this.state.secondsRemaining = seconds;
    if (totalSeconds !== undefined) {
      this.state.totalDurationSeconds = totalSeconds;
    }
    if (this.state.isRunning && this.state.mode === 'countdown') {
      this.state.targetEndTime = Date.now() + seconds * 1000;
    }
    this.updateLockScreenMediaSession();
    this.notify();
  }

  // Set stopwatch elapsed seconds manually
  updateStopwatchSeconds(seconds: number) {
    this.state.stopwatchSeconds = seconds;
    if (this.state.isRunning && this.state.mode === 'stopwatch') {
      this.state.stopwatchStartTime = Date.now() - seconds * 1000;
    }
    this.updateLockScreenMediaSession();
    this.notify();
  }

  // Internal ticker loop
  private startTicking() {
    this.stopTicking();

    this.timerInterval = setInterval(() => {
      this.syncWithTimestamp();
      this.updateLockScreenMediaSession();
    }, 1000);
  }

  private stopTicking() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Handle countdown complete
  private handleTimerComplete() {
    this.state.isRunning = false;
    this.state.secondsRemaining = 0;
    this.state.targetEndTime = null;

    this.stopTicking();
    this.releaseWakeLock();
    this.stopBackgroundAudio();
    this.clearLockScreenMediaSession();

    try {
      soundEngine.playAlarmSound();
      iosNativeBridge.haptic('heavy');
    } catch (e) {}

    if (this.onCompleteCallback) {
      try {
        this.onCompleteCallback();
      } catch (e) {
        console.warn('Timer onComplete error', e);
      }
    }

    this.notify();
  }

  // Update iOS Lock Screen & Dynamic MediaSession Display
  private updateLockScreenMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };

      const isStopwatch = this.state.mode === 'stopwatch';
      const timeStr = isStopwatch
        ? formatTime(this.state.stopwatchSeconds)
        : formatTime(this.state.secondsRemaining);

      const title = isStopwatch
        ? `⏱️ Stopwatch: ${timeStr}`
        : `⏱️ ${timeStr} • ${this.state.phase.toUpperCase()}`;

      const artist = this.state.taskTitle
        ? `${this.state.taskTitle} • NEVA OS`
        : `${this.state.category.toUpperCase()} • NEVA Flow`;

      const album = isStopwatch
        ? 'Live Open Stopwatch'
        : `Focus Countdown (${formatTime(this.state.totalDurationSeconds)})`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      // Update position state for live scrub / progress on iOS Lock Screen
      if ('setPositionState' in navigator.mediaSession) {
        const total = isStopwatch
          ? Math.max(this.state.stopwatchSeconds + 60, 3600)
          : Math.max(1, this.state.totalDurationSeconds);
        const position = isStopwatch
          ? this.state.stopwatchSeconds
          : Math.max(0, this.state.totalDurationSeconds - this.state.secondsRemaining);

        navigator.mediaSession.setPositionState({
          duration: total,
          playbackRate: this.state.isRunning ? 1.0 : 0.0,
          position: Math.min(position, total),
        });
      }

      // Configure media action handlers for lock screen buttons
      navigator.mediaSession.setActionHandler('play', () => {
        this.resume();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.pause();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.stop();
      });
    } catch (e) {
      // MediaSession error safe fallback
    }
  }

  private clearLockScreenMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
      if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState(null as any);
      }
    } catch (e) {}
  }
}

export const mobileTimerEngine = new MobileTimerEngine();
