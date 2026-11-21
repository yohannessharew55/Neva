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
import { timerNotificationService } from './timerNotificationService';

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
  themeColor?: string; // Flexible dynamic clock & task theme color
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
  private audioCtx: AudioContext | null = null;
  private audioOsc: OscillatorNode | null = null;
  private audioGain: GainNode | null = null;
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

  hexToRgb(hex: string): { r: number; g: number; b: number } {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  getThemeColor(): string {
    if (this.state.themeColor) {
      return this.state.themeColor;
    }
    if (this.state.phase === 'short_break' || this.state.phase === 'long_break') {
      return '#34d399'; // Refreshing Mint for breaks
    }
    // Specific task category colors
    if (this.state.category) {
      switch (this.state.category) {
        case 'devotion':
        case 'bible-reading':
        case 'silence':
          return '#af52de'; // Sacred Violet / Purple
        case 'exercise':
        case 'fitness':
          return '#ff453a'; // Crimson Red
        case 'chess':
          return '#5e5ce6'; // Indigo Sapphire
        case 'art':
          return '#ec4899'; // Vibrant Rose Pink
        case 'music':
          return '#ff9f0a'; // Warm Amber/Orange
        case 'architecture':
          return '#32ade6'; // Laser Sky Cyan
        case 'trading':
          return '#30d158'; // Market Emerald Green
      }
    }
    // Clock system default signature colors
    switch (this.state.system) {
      case 'pomodoro':
        return '#ff453a'; // Flame Tomato Red
      case 'ultradian':
        return '#af52de'; // Cognitive Violet (90/20)
      case 'desktime':
        return '#ff9f0a'; // High Energy Amber/Orange (52/17)
      case 'sprint':
        return '#32ade6'; // Laser Sky Cyan (25/5)
      case 'custom':
        return '#30d158'; // Apple Vivid Emerald Green
      case 'stopwatch':
        return '#5e5ce6'; // Precision Sapphire Indigo
      default:
        return '#30d158';
    }
  }

  setThemeColor(color: string) {
    this.state.themeColor = color;
    this.renderCanvasFrame();
    this.updateLockScreenMediaSession();
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
        // When app is closed, minimized, or screen locked:
        if (this.state.isActive && this.state.isRunning) {
          // Keep background audio and Lock Screen media session active (without firing any notification)
          this.ensureBackgroundAudio();
          this.updateLockScreenMediaSession();
        }
      }
    });

    window.addEventListener('focus', handleSync);
    window.addEventListener('pageshow', handleSync);
    window.addEventListener('resume' as any, handleSync);
    window.addEventListener('pagehide', () => {
      if (this.state.isActive && this.state.isRunning) {
        this.ensureBackgroundAudio();
        this.updateLockScreenMediaSession();
      }
    });

    // Capacitor Native Mobile App state resume listener
    try {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', (state) => {
          if (state.isActive) {
            handleSync();
          }
        }).catch(() => {});
        App.addListener('resume', () => {
          handleSync();
        }).catch(() => {});
      }).catch(() => {});
    } catch (e) {}
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

  // Ensure audio is playing so iOS WebKit doesn't sleep & keeps Lock Screen & Notification Centre active
  private ensureBackgroundAudio() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.silentAudio) {
        let existingAudio = document.getElementById('neva-background-audio-runner') as HTMLAudioElement;
        if (!existingAudio) {
          existingAudio = document.createElement('audio');
          existingAudio.id = 'neva-background-audio-runner';
          existingAudio.src = '/silence.wav';
          existingAudio.loop = true;
          existingAudio.preload = 'auto';
          existingAudio.volume = 0.1;
          existingAudio.muted = false;
          (existingAudio as any).playsInline = true;
          existingAudio.setAttribute('playsinline', '');
          existingAudio.setAttribute('webkit-playsinline', '');
          existingAudio.style.position = 'fixed';
          existingAudio.style.top = '-9999px';
          existingAudio.style.left = '-9999px';
          existingAudio.style.width = '1px';
          existingAudio.style.height = '1px';
          existingAudio.style.opacity = '0';
          existingAudio.style.pointerEvents = 'none';
          document.body.appendChild(existingAudio);
        }
        this.silentAudio = existingAudio;
      }

      this.silentAudio.play().catch(() => {});

      // Maintain Web Audio sub-audible oscillator to keep JS event loop running in background
      try {
        if (!this.audioCtx) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            this.audioCtx = new AudioCtx();
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.frequency.setValueAtTime(10, this.audioCtx.currentTime); // 10Hz sub-audible
            gain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            this.audioOsc = osc;
            this.audioGain = gain;
          }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      } catch (e) {}
    } catch (e) {}
  }

  private stopBackgroundAudio() {
    try {
      if (this.silentAudio) {
        this.silentAudio.pause();
        this.silentAudio.currentTime = 0;
      }
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.audioCtx.suspend().catch(() => {});
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
    themeColor?: string;
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
      themeColor: options.themeColor || this.state.themeColor || undefined,
      totalDurationSeconds: total,
      secondsRemaining: remaining,
      stopwatchSeconds: 0,
      targetEndTime: targetEnd,
      stopwatchStartTime: null,
    };

    this.requestWakeLock();
    this.ensureBackgroundAudio();
    this.ensurePipVideo();
    this.startTicking();
    this.updateLockScreenMediaSession();
    this.renderCanvasFrame();
    try {
      soundEngine.playBlockTimerStartMusic();
    } catch (e) {}
    this.notify();

    // Schedule native time-sensitive alarm and timerNotificationService
    if (remaining > 0) {
      timerNotificationService.scheduleTimerAlarm({
        targetEndTime: targetEnd,
        title: options.taskTitle || `${(options.system || 'Focus').toUpperCase()} Session`,
        category: options.category || 'Focus',
        categoryColor: options.themeColor || this.state.themeColor,
        durationMinutes: Math.round(total / 60) || Math.ceil(remaining / 60),
        system: options.system,
        phase: options.phase,
      });
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
    themeColor?: string;
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
      themeColor: options.themeColor || this.state.themeColor || undefined,
      totalDurationSeconds: 0,
      secondsRemaining: 0,
      stopwatchSeconds: elapsed,
      targetEndTime: null,
      stopwatchStartTime: startTime,
    };

    this.requestWakeLock();
    this.ensureBackgroundAudio();
    this.ensurePipVideo();
    this.startTicking();
    this.updateLockScreenMediaSession();
    this.renderCanvasFrame();
    try {
      soundEngine.playBlockTimerStartMusic();
    } catch (e) {}
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
    timerNotificationService.cancelTimerAlarm().catch(() => {});
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
        timerNotificationService.scheduleTimerAlarm({
          targetEndTime: this.state.targetEndTime,
          title: this.state.taskTitle || `${(this.state.system || 'Focus').toUpperCase()} Session`,
          category: this.state.category || 'Focus',
          categoryColor: this.state.themeColor,
          durationMinutes: Math.round(this.state.totalDurationSeconds / 60) || Math.ceil(this.state.secondsRemaining / 60),
          system: this.state.system,
          phase: this.state.phase,
        });
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
    this.ensurePipVideo();
    this.startTicking();
    this.updateLockScreenMediaSession();
    this.renderCanvasFrame();
    try {
      soundEngine.playBlockTimerStartMusic();
    } catch (e) {}
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
    timerNotificationService.cancelTimerAlarm().catch(() => {});
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
    iosNativeBridge.clearActiveTimerNotification();
    this.renderCanvasFrame();

    try {
      soundEngine.playAlarmSound();
      iosNativeBridge.haptic('heavy');
      timerNotificationService.handleTimerEnd({
        title: this.state.taskTitle || `${this.state.system.toUpperCase()} Focus Session`,
        category: this.state.category,
        categoryColor: this.state.themeColor,
        durationMinutes: Math.round(this.state.totalDurationSeconds / 60) || 25,
        system: this.state.system,
        phase: this.state.phase,
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      iosNativeBridge.scheduleFocusAlarm(
        'focus-completed-alert',
        '⏰ Focus Session Finished!',
        this.state.taskTitle ? `${this.state.taskTitle} session complete.` : 'Your focus block is finished. Mindful breath.',
        1
      );
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
        ? `Stopwatch  ${timeStr}`
        : `Timer  ${timeStr}`;

      const artist = this.state.taskTitle
        ? `${this.state.taskTitle} • NEVA`
        : `${this.state.system.toUpperCase()} • NEVA Flow`;

      const album = isStopwatch
        ? 'Live Open Stopwatch'
        : `Focus Countdown (${this.formatTime(this.state.totalDurationSeconds)})`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = this.state.isRunning ? 'playing' : 'paused';

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

      // Support hardware & lock screen / Dynamic Island track controls for stop & toggle
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.stop();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.state.isRunning) {
          this.pause();
        } else {
          this.resume();
        }
      });
    } catch (e) {}
  }

  private clearLockScreenMediaSession() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
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

      // Video PiP status listeners (Note: Do not bind video pause to timer pause, as mobile OSs pause hidden videos in the background)
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

    // Pitch black background matching iOS Live Activity
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const isStopwatch = this.state.mode === 'stopwatch';
    const displaySecs = isStopwatch ? this.state.stopwatchSeconds : this.state.secondsRemaining;
    const timeStr = this.formatTime(displaySecs);

    const activeColor = this.getThemeColor();
    const rgb = this.hexToRgb(activeColor);

    // Draw iOS Live Activity capsule pill
    const pillX = 16;
    const pillY = 32;
    const pillW = width - 32;
    const pillH = height - 64;
    const pillR = 36;

    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
    ctx.fillStyle = '#141416';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`;
    ctx.stroke();

    // Circle 1: Left Pause / Play Button
    const c1x = pillX + 54;
    const c1y = pillY + pillH / 2;
    const cr = 30;

    ctx.beginPath();
    ctx.arc(c1x, c1y, cr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.round(rgb.r * 0.18)}, ${Math.round(rgb.g * 0.18)}, ${Math.round(rgb.b * 0.18)}, 0.95)`;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = activeColor;
    ctx.stroke();

    if (this.state.isRunning) {
      // Pause bars in dynamic activeColor
      ctx.fillStyle = activeColor;
      ctx.fillRect(c1x - 9, c1y - 12, 6, 24);
      ctx.fillRect(c1x + 3, c1y - 12, 6, 24);
    } else {
      // Play triangle in dynamic activeColor
      ctx.fillStyle = activeColor;
      ctx.beginPath();
      ctx.moveTo(c1x - 8, c1y - 13);
      ctx.lineTo(c1x + 12, c1y);
      ctx.lineTo(c1x - 8, c1y + 13);
      ctx.closePath();
      ctx.fill();
    }

    // Circle 2: Cancel / Stop Button
    const c2x = c1x + 72;
    const c2y = c1y;
    ctx.beginPath();
    ctx.arc(c2x, c2y, cr, 0, Math.PI * 2);
    ctx.fillStyle = '#2c2c2e';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.stroke();

    // White X
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c2x - 9, c2y - 9);
    ctx.lineTo(c2x + 9, c2y + 9);
    ctx.moveTo(c2x + 9, c2y - 9);
    ctx.lineTo(c2x - 9, c2y + 9);
    ctx.stroke();

    // Right Side: Label "Timer" & Dynamic Colored Digits
    const labelText = isStopwatch ? 'Stopwatch' : 'Timer';

    ctx.textAlign = 'right';
    ctx.fillStyle = activeColor;
    ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "SF Pro Display", monospace';
    ctx.fillText(timeStr, pillX + pillW - 28, c1y + 20);

    const textWidth = ctx.measureText(timeStr).width;
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9)`;
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.fillText(labelText, pillX + pillW - 38 - textWidth, c1y + 10);

    // Progress bar for countdown
    if (!isStopwatch && this.state.totalDurationSeconds > 0) {
      const progress = Math.min(1, Math.max(0, 1 - this.state.secondsRemaining / this.state.totalDurationSeconds));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(pillX + 32, pillY + pillH - 8, pillW - 64, 4);

      ctx.fillStyle = activeColor;
      ctx.fillRect(pillX + 32, pillY + pillH - 8, (pillW - 64) * progress, 4);
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
