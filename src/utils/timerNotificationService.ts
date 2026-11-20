import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { soundEngine } from './audio';
import { iosNativeBridge } from './iosNativeBridge';

export interface TimerCompletionData {
  title: string;
  category?: string;
  categoryColor?: string;
  durationMinutes: number;
  system: string;
  phase: 'focus' | 'short_break' | 'long_break';
  completedAt: string;
  notes?: string;
}

const NOTIFICATION_CHANNEL_ID = 'neva_timer_alarm_channel_v2';
const PENDING_COMPLETION_STORAGE_KEY = 'neva_pending_timer_completion';
const NOTIFICATION_ID_FOCUS = 88801;

class TimerNotificationService {
  private channelCreated = false;
  private backgroundWorker: Worker | null = null;
  private activeTargetEndTime: number | null = null;
  private currentSessionData: TimerCompletionData | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initChannel().catch(() => {});
      this.initBackgroundWorker();
    }
  }

  // 1. Android High-Importance Notification Channel
  async initChannel(): Promise<void> {
    if (this.channelCreated) return;
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel({
          id: NOTIFICATION_CHANNEL_ID,
          name: 'NEVA Timer & Focus Alarms',
          description: 'High-priority notifications and sound alerts when your focus timer finishes',
          importance: 5, // MAX / HIGH: Heads-up banner + sound on lock screen & other apps
          visibility: 1, // PUBLIC on lock screen
          sound: 'alarm_bell.wav',
          vibration: true,
          lights: true,
          lightColor: '#0082FF',
        });
        this.channelCreated = true;
      } catch (e) {
        console.warn('[TimerNotificationService] Could not create channel', e);
      }
    }
  }

  // 2. Request Notification Permissions (Native & Web)
  async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await LocalNotifications.requestPermissions();
        return res.display === 'granted';
      } catch {
        return false;
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  }

  hasPermission(): boolean {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  // 3. Web Worker for continuous background countdown (immune to main thread throttling)
  private initBackgroundWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const workerScript = `
        let intervalId = null;
        let targetEnd = null;

        self.onmessage = function(e) {
          const { command, targetEndTime } = e.data || {};
          if (command === 'start') {
            targetEnd = targetEndTime;
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(() => {
              const now = Date.now();
              const remaining = targetEnd ? Math.max(0, Math.ceil((targetEnd - now) / 1000)) : 0;
              self.postMessage({ type: 'tick', remaining, now });
              if (targetEnd && now >= targetEnd) {
                self.postMessage({ type: 'complete' });
                clearInterval(intervalId);
                intervalId = null;
              }
            }, 1000);
          } else if (command === 'stop') {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
            targetEnd = null;
          }
        };
      `;
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.backgroundWorker = new Worker(workerUrl);

      this.backgroundWorker.onmessage = (e) => {
        const { type } = e.data || {};
        if (type === 'complete') {
          this.handleTimerEnd();
        }
      };
    } catch (e) {
      console.warn('[TimerNotificationService] Web Worker fallback to main loop', e);
    }
  }

  // 4. Schedule Alarm when Timer starts
  async scheduleTimerAlarm(options: {
    targetEndTime: number;
    title: string;
    category?: string;
    categoryColor?: string;
    durationMinutes: number;
    system?: string;
    phase?: 'focus' | 'short_break' | 'long_break';
  }): Promise<void> {
    this.activeTargetEndTime = options.targetEndTime;
    const completedAtStr = new Date(options.targetEndTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    this.currentSessionData = {
      title: options.title || 'Focus Session',
      category: options.category || 'Focus',
      categoryColor: options.categoryColor || '#0082ff',
      durationMinutes: options.durationMinutes || 25,
      system: options.system || 'pomodoro',
      phase: options.phase || 'focus',
      completedAt: completedAtStr,
    };

    const remainingSecs = Math.max(1, Math.ceil((options.targetEndTime - Date.now()) / 1000));

    // Native Local Notification schedule (Android AlarmManager / iOS UNUserNotificationCenter)
    if (Capacitor.isNativePlatform()) {
      await this.initChannel();
      try {
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID_FOCUS }] });
        await LocalNotifications.schedule({
          notifications: [
            {
              id: NOTIFICATION_ID_FOCUS,
              title: '🏆 Focus Block Complete!',
              body: `${options.title} (${options.durationMinutes}m) finished! Tap to view summary and take a break.`,
              schedule: {
                at: new Date(options.targetEndTime),
                allowWhileIdle: true,
              },
              channelId: NOTIFICATION_CHANNEL_ID,
              sound: 'alarm_bell.wav',
              actionTypeId: 'FOCUS_COMPLETE',
              extra: this.currentSessionData,
            },
          ],
        });
      } catch (err) {
        console.warn('[TimerNotificationService] Failed to schedule native alarm', err);
      }
    }

    // Start background worker
    if (this.backgroundWorker) {
      this.backgroundWorker.postMessage({
        command: 'start',
        targetEndTime: options.targetEndTime,
      });
    }
  }

  // 5. Cancel Scheduled Alarm (when user explicitly resets / stops timer)
  async cancelTimerAlarm(): Promise<void> {
    this.activeTargetEndTime = null;
    this.currentSessionData = null;

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID_FOCUS }] });
      } catch {}
    }

    if (this.backgroundWorker) {
      this.backgroundWorker.postMessage({ command: 'stop' });
    }
  }

  // 6. Handle timer completion (triggers sound, notification, and beautiful in-app modal)
  handleTimerEnd(dataOverride?: Partial<TimerCompletionData>): void {
    const data: TimerCompletionData = {
      title: dataOverride?.title || this.currentSessionData?.title || 'Focus Block',
      category: dataOverride?.category || this.currentSessionData?.category || 'Focus',
      categoryColor: dataOverride?.categoryColor || this.currentSessionData?.categoryColor || '#0082ff',
      durationMinutes: dataOverride?.durationMinutes || this.currentSessionData?.durationMinutes || 25,
      system: dataOverride?.system || this.currentSessionData?.system || 'pomodoro',
      phase: dataOverride?.phase || this.currentSessionData?.phase || 'focus',
      completedAt: dataOverride?.completedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Play celebratory alarm chime & haptics
    soundEngine.playAlarmSound();
    iosNativeBridge.haptic('heavy');

    // 2. Post Web Notification if tab is backgrounded
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🏆 Focus Block Complete!', {
          body: `${data.title} (${data.durationMinutes}m) is finished! Excellent execution.`,
          icon: '/apple-touch-icon.png',
          badge: '/apple-touch-icon.png',
          tag: 'neva-timer-done',
          requireInteraction: true,
        });
      } catch {}
    }

    // 3. Save pending completion to localStorage so reopening app immediately shows celebration
    try {
      localStorage.setItem(PENDING_COMPLETION_STORAGE_KEY, JSON.stringify(data));
    } catch {}

    // 4. Dispatch custom event for TimerCompletionModal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('neva-timer-completed', { detail: data }));
    }

    this.activeTargetEndTime = null;
  }

  // Check and consume pending completion (e.g. on app launch or resume)
  getPendingCompletion(): TimerCompletionData | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PENDING_COMPLETION_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  }

  clearPendingCompletion(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(PENDING_COMPLETION_STORAGE_KEY);
    } catch {}
  }
}

export const timerNotificationService = new TimerNotificationService();
