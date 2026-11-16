// Mobile Timer Engine & Background Lock-Screen Controller
// Provides:
// 1. Screen Wake Lock (keeps phone awake while timer/stopwatch is active, prevents dimming/sleep)
// 2. High-precision timestamp timing (Date.now() targetEndTime & startTime, immune to iOS background throttling)
// 3. iOS Lock Screen Now Playing widget & MediaSession API (shows live ticking countdown / stopwatch on lock screen with controls)
// 4. Picture-in-Picture (PiP) Little Window stream via Canvas -> Video (pops out a floating mini-window on iOS and desktop)
// 5. Silent HTML5 audio loop (maintains background execution & iOS Now Playing media session on lock screen)
// 6. Visibility change & focus listeners (instantly resyncs exact time on phone wake/unlock)
// 7. Draggable floating mini window & Dynamic Island top banner

import { soundEngine } from './audio';
import { iosNativeBridge } from './iosNativeBridge';

export type TimerMode = 'countdown' | 'stopwatch';
export type WindowPresentationMode = 'island' | 'floating' | 'hidden';

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
  windowMode: WindowPresentationMode;
  isPipActive: boolean;
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
    windowMode: 'island',
    isPipActive: false,
  };

  private listeners: Set<TimerListener> = new Set();
  private timerInterval: any = null;
  private wakeLock: any = null;
  private silentAudio: HTMLAudioElement | null = null;
  private onCompleteCallback: (() => void) | null = null;

  // Picture-in-Picture Canvas & Video elements
  private pipCanvas: HTMLCanvasElement | null = null;
  private pipVideo: HTMLVideoElement | null = null;

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

  setWindowMode(mode: WindowPresentationMode) {
    this.state.windowMode = mode;
    this.notify();
  }

  // Setup visibility change & window focus listeners to catch up on unlock
  private setupVisibilityListener() {
    if (typeof window === 'undefined') return;

    const handleSync = () => {
      if (this.state.isActive && this.state.isRunning) {
        this.syncWithTimestamp();
        this.requestWakeLock();
        this.updateLockScreenMediaSession();
        this.renderCanvasFrame();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleSync();
      } else if (document.visibilityState === 'hidden') {
        // When app is closed, minimized, or switched away from, auto-popout PiP floating window
        if (this.state.isActive && this.state.isRunning && !this.state.isPipActive) {
          this.requestPictureInPictureDirect().catch(() => {});
        }
      }
    });

    window.addEventListener('focus', handleSync);
    window.addEventListener('pagehide', () => {
      if (this.state.isActive && this.state.isRunning && !this.state.isPipActive) {
        this.requestPictureInPictureDirect().catch(() => {});
      }
    });
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
      // Wake lock can fail if low battery or background tab
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
        const silentWav =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        const audio = new Audio(silentWav);
        audio.loop = true;
        audio.preload = 'auto';
        (audio as any).playsInline = true;
        audio.volume = 0.001;
        this.silentAudio = audio;
      }

      this.silentAudio.play().catch(() => {});
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
      ...this.state,
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
    this.renderCanvasFrame();
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
      ...this.state,
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
    this.renderCanvasFrame();
    this.notify();
  }

  // Pause active timer or stopwatch
  pause() {
    if (!this.state.isRunning) return;

    this.syncWithTimestamp();

    this.state.isRunning = false;
    this.state.targetEndTime = null;
    this.state.stopwatchStartTime = null;

    this.stopTicking();
    this.releaseWakeLock();
    this.stopBackgroundAudio();
    iosNativeBridge.cancelAlarm('focus-timer');
    this.updateLockScreenMediaSession();
    this.renderCanvasFrame();
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
    this.renderCanvasFrame();
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

    if (this.state.isPipActive && document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }

    this.notify();
  }

  // Set remaining seconds manually
  updateRemainingSeconds(seconds: number, totalSeconds?: number) {
    this.state.secondsRemaining = seconds;
    if (totalSeconds !== undefined) {
      this.state.totalDurationSeconds = totalSeconds;
    }
    if (this.state.isRunning && this.state.mode === 'countdown') {
      this.state.targetEndTime = Date.now() + seconds * 1000;
    }
    this.updateLockScreenMediaSession();
    this.renderCanvasFrame();
    this.notify();
  }

  // Set stopwatch elapsed seconds manually
  updateStopwatchSeconds(seconds: number) {
    this.state.stopwatchSeconds = seconds;
    if (this.state.isRunning && this.state.mode === 'stopwatch') {
      this.state.stopwatchStartTime = Date.now() - seconds * 1000;
    }
    this.updateLockScreenMediaSession();
    this.renderCanvasFrame();
    this.notify();
  }

  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  // Internal ticker loop
  private startTicking() {
    this.stopTicking();

    this.timerInterval = setInterval(() => {
      this.syncWithTimestamp();
      this.updateLockScreenMediaSession();
      this.renderCanvasFrame();
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
    this.renderCanvasFrame();

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
      const isStopwatch = this.state.mode === 'stopwatch';
      const timeStr = isStopwatch
        ? this.formatTime(this.state.stopwatchSeconds)
        : this.formatTime(this.state.secondsRemaining);

      const title = isStopwatch
        ? `⏱️ Stopwatch: ${timeStr}`
        : `⏱️ ${timeStr} • ${this.state.phase.toUpperCase()}`;

      const artist = this.state.taskTitle
        ? `${this.state.taskTitle} • NEVA OS`
        : `${this.state.category.toUpperCase()} • NEVA Flow`;

      const album = isStopwatch
        ? 'Live Open Stopwatch'
        : `Focus Countdown (${this.formatTime(this.state.totalDurationSeconds)})`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

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

      navigator.mediaSession.setActionHandler('play', () => {
        this.resume();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.pause();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.stop();
      });
    } catch (e) {}
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

  // --- Picture-in-Picture (PiP) Little Window Video Stream ---

  private ensurePipVideo(): HTMLVideoElement | null {
    if (typeof document === 'undefined') return null;
    if (this.pipVideo) return this.pipVideo;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 270;
      canvas.style.display = 'none';
      document.body.appendChild(canvas);
      this.pipCanvas = canvas;

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('autopictureinpicture', '');
      (video as any).autoPictureInPicture = true;
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      document.body.appendChild(video);
      this.pipVideo = video;

      this.renderCanvasFrame();

      if ((canvas as any).captureStream) {
        const stream = (canvas as any).captureStream(10);
        video.srcObject = stream;
        video.play().catch(() => {});
      }

      video.addEventListener('enterpictureinpicture', () => {
        this.state.isPipActive = true;
        this.notify();
      });

      video.addEventListener('leavepictureinpicture', () => {
        this.state.isPipActive = false;
        this.notify();
      });

      return video;
    } catch (e) {
      console.warn('PiP setup error', e);
      return null;
    }
  }

  renderCanvasFrame() {
    if (!this.pipCanvas) return;
    const ctx = this.pipCanvas.getContext('2d');
    if (!ctx) return;

    const width = this.pipCanvas.width;
    const height = this.pipCanvas.height;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Border stroke
    ctx.strokeStyle = this.state.isRunning ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    const isStopwatch = this.state.mode === 'stopwatch';
    const displaySecs = isStopwatch ? this.state.stopwatchSeconds : this.state.secondsRemaining;
    const timeStr = this.formatTime(displaySecs);

    // Top status pill
    ctx.fillStyle = this.state.isRunning ? '#10b981' : '#f59e0b';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    const badgeText = isStopwatch
      ? `⏱️ STOPWATCH • ${this.state.isRunning ? 'RUNNING' : 'PAUSED'}`
      : `⏱️ ${this.state.system.toUpperCase()} • ${this.state.phase.toUpperCase()}`;
    ctx.fillText(badgeText, 28, 44);

    // Task title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const taskText = this.state.taskTitle || `${this.state.category.toUpperCase()} • NEVA OS`;
    ctx.fillText(taskText.length > 30 ? taskText.slice(0, 28) + '...' : taskText, 28, 72);

    // Digital digits
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 76px -apple-system, BlinkMacSystemFont, "SF Pro Display", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, width / 2, 168);

    // Progress bar
    if (!isStopwatch && this.state.totalDurationSeconds > 0) {
      const progress = Math.min(1, Math.max(0, 1 - (this.state.secondsRemaining / this.state.totalDurationSeconds)));
      const barY = height - 18;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(24, barY, width - 48, 8);

      ctx.fillStyle = '#10b981';
      ctx.fillRect(24, barY, (width - 48) * progress, 8);
    }
  }

  isPictureInPictureSupported(): boolean {
    if (typeof document === 'undefined') return false;
    return !!(document.pictureInPictureEnabled || (document.createElement('video') as any).webkitSupportsPresentationMode);
  }

  async requestPictureInPictureDirect(): Promise<boolean> {
    try {
      const video = this.ensurePipVideo();
      if (!video) return false;

      this.renderCanvasFrame();

      if (document.pictureInPictureElement) {
        return true;
      }

      if (video.requestPictureInPicture) {
        await video.play().catch(() => {});
        await video.requestPictureInPicture();
        this.state.isPipActive = true;
        this.notify();
        return true;
      } else if ((video as any).webkitSetPresentationMode) {
        await video.play().catch(() => {});
        (video as any).webkitSetPresentationMode('picture-in-picture');
        this.state.isPipActive = true;
        this.notify();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('PiP direct request failed:', e);
      return false;
    }
  }

  async togglePictureInPicture(): Promise<boolean> {
    try {
      const video = this.ensurePipVideo();
      if (!video) return false;

      this.renderCanvasFrame();

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        this.state.isPipActive = false;
        this.notify();
        return false;
      } else if (video.requestPictureInPicture) {
        await video.play().catch(() => {});
        await video.requestPictureInPicture();
        this.state.isPipActive = true;
        this.notify();
        return true;
      } else if ((video as any).webkitSetPresentationMode) {
        await video.play().catch(() => {});
        (video as any).webkitSetPresentationMode('picture-in-picture');
        this.state.isPipActive = true;
        this.notify();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('PiP request failed:', e);
      return false;
    }
  }
}

export const mobileTimerEngine = new MobileTimerEngine();
