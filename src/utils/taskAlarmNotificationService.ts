import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ScheduleTask } from '../types';
import { CategoryPlan } from '../context/LivotionContext';
import { soundEngine } from './audio';
import { iosNativeBridge } from './iosNativeBridge';
import { parseTimeToMinutes, formatMinutesToTime } from './scheduleConflictDetector';

const TASK_ALARM_CHANNEL_ID = 'neva_task_alarms_channel_v1';
const FIRED_ALARMS_STORAGE_KEY = 'neva_fired_task_alarms_today';

export interface TaskAlarmEventDetail {
  task: ScheduleTask;
  categoryTitle: string;
  categoryColor: string;
  categoryIconName: string;
  formattedStartTime: string;
}

class TaskAlarmNotificationService {
  private channelCreated = false;
  private checkIntervalId: any = null;
  private currentTasks: ScheduleTask[] = [];
  private currentCategories: Record<string, CategoryPlan> = {};
  private firedAlarmsThisSession = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initChannel().catch(() => {});
      this.startAlarmWatcher();

      if (Capacitor.isNativePlatform()) {
        import('@capacitor/app').then(({ App }) => {
          App.addListener('appStateChange', (state) => {
            if (state.isActive) {
              const now = new Date();
              const isSunday = ((now.getDay() + 6) % 7 + 1) === 7;
              if (isSunday) {
                LocalNotifications.removeAllDeliveredNotifications().catch(() => {});
              }
              if (this.currentTasks.length > 0) {
                this.syncTaskAlarms(this.currentTasks, this.currentCategories).catch(() => {});
              }
            }
          });
        }).catch(() => {});
      }
    }
  }

  // 1. Initialize Android High-Importance Notification Channel
  async initChannel(): Promise<void> {
    if (this.channelCreated) return;
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel({
          id: TASK_ALARM_CHANNEL_ID,
          name: 'NEVA Scheduled Task Alarms',
          description: 'High-priority notifications and alerts when your scheduled focus block start time arrives',
          importance: 5, // MAX / HIGH: Heads-up banner + sound on lock screen & over other apps
          visibility: 1, // PUBLIC on lock screen
          sound: 'alarm_bell.wav',
          vibration: true,
          lights: true,
          lightColor: '#8b5cf6',
        });
        this.channelCreated = true;
      } catch (e) {
        console.warn('[TaskAlarmNotificationService] Channel creation fallback', e);
      }
    }
  }

  // 2. Strict Filter: Extract ONLY valid tasks that legitimately belong to TODAY
  // On Sunday (Rest Day): All routine weekday tasks (Fitness, Trading, Art, Chess, Music, Architecture) are strictly blocked!
  public filterTasksForToday(tasks: ScheduleTask[], referenceDate: Date = new Date()): ScheduleTask[] {
    const todayDateStr = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}-${String(referenceDate.getDate()).padStart(2, '0')}`;
    const legacyDateStr = todayDateStr.startsWith('2026-11-') ? todayDateStr.replace('2026-11-', '2025-11-') : '';
    // 1 = Monday, ..., 7 = Sunday
    const currentDayOfWeek = (referenceDate.getDay() + 6) % 7 + 1;
    const isSunday = currentDayOfWeek === 7;

    const weekdayDomains = [
      'PHYSICAL_FITNESS',
      'EXERCISE',
      'CHESS',
      'GUITAR',
      'MUSIC',
      'ARCHITECTURE_DESIGN',
      'ARCHITECTURE',
      'SITE_SUPERVISION',
      'FOREX_TRADING',
      'TRADING',
      'OIL_PAINTING',
      'ART'
    ];

    const validTasks = tasks.filter((task) => {
      // 1. Must have valid start time, not flexible, and not completed
      if (!task.startTime || task.startTime.toLowerCase().includes('flex') || task.completed) {
        return false;
      }

      // 2. If task has an explicit date: it MUST match today's date
      if (task.date) {
        const matchesDate = task.date === todayDateStr || (legacyDateStr && task.date === legacyDateStr);
        if (!matchesDate) {
          return false;
        }
      } else {
        // 3. Recurring template task without explicit date
        // If it specifies dayOfWeek, it must match today's day of week
        if (task.dayOfWeek && task.dayOfWeek !== currentDayOfWeek) {
          return false;
        }
      }

      // 4. SUNDAY REST DAY STRICT PROTECTION:
      // In NEVA, Sunday is designated as the Day of Rest & Devotion.
      // Weekday execution domains, exercise, workouts, trading, chess, etc. must NEVER trigger alarms on Sunday!
      if (isSunday) {
        const domainUpper = (task.domain || '').toUpperCase();
        const badgeLower = (task.badge || '').toLowerCase();
        const titleLower = (task.title || '').toLowerCase();

        // 4a. Devotion & Prayer tasks are unconditionally allowed on Sunday
        const isDevotion = 
          domainUpper === 'DEVOTION_PRAYER' || 
          badgeLower.includes('devotion') || 
          titleLower.includes('devotion') ||
          titleLower.includes('prayer') || 
          titleLower.includes('ጸሎት') ||
          titleLower.includes('church') ||
          titleLower.includes('ቅዳሴ') ||
          titleLower.includes('worship');

        if (isDevotion) {
          return true;
        }

        // 4b. STRICT EXERCISE / FITNESS BLOCK:
        // Any exercise, workout, fitness, or gym activity is 100% BLOCKED on Sunday.
        // NEVER allow task.dayOfWeek === 7 to bypass this because dayOfWeek: 7 is automatically stamped when editing tasks on Sunday!
        const isExerciseOrFitness = 
          domainUpper.includes('FITNESS') ||
          domainUpper.includes('EXERCISE') ||
          badgeLower.includes('fitness') ||
          badgeLower.includes('exercise') ||
          badgeLower.includes('workout') ||
          titleLower.includes('pushup') ||
          titleLower.includes('pullup') ||
          titleLower.includes('exercise') ||
          titleLower.includes('fitness') ||
          titleLower.includes('workout') ||
          titleLower.includes('gym') ||
          titleLower.includes('warmup') ||
          titleLower.includes('cardio') ||
          titleLower.includes('squat') ||
          titleLower.includes('training') ||
          titleLower.includes('hiit');

        if (isExerciseOrFitness) {
          return false;
        }

        // 4c. WEEKDAY WORK DOMAINS BLOCK:
        const isWeekdayDomainOrTitle = 
          weekdayDomains.some(wd => domainUpper.includes(wd) || badgeLower.includes(wd.toLowerCase())) ||
          titleLower.includes('trading') ||
          titleLower.includes('forex') ||
          titleLower.includes('market') ||
          titleLower.includes('chess') ||
          titleLower.includes('puzzle training') ||
          titleLower.includes('aagard') ||
          titleLower.includes('guitar') ||
          titleLower.includes('sketch') ||
          titleLower.includes('painting');

        if (isWeekdayDomainOrTitle) {
          // Only allow if explicitly named for Sunday in text
          const explicitlySundayText = 
            titleLower.includes('sunday') || 
            titleLower.includes('እሁድ') || 
            badgeLower.includes('sunday');

          if (!explicitlySundayText) {
            return false;
          }
        } else {
          // For untagged/custom tasks on Sunday, require explicit Sunday marker in text
          const hasExplicitSundayTag = 
            titleLower.includes('sunday') || 
            titleLower.includes('እሁድ') || 
            badgeLower.includes('sunday');

          if (!hasExplicitSundayTag) {
            return false;
          }
        }
      }

      return true;
    });

    // 5. Deduplicate tasks by title and startTime so each scheduled block only EVER triggers once
    const seen = new Set<string>();
    const deduplicated: ScheduleTask[] = [];

    validTasks.forEach((task) => {
      const key = `${task.title.toLowerCase().trim()}_${task.startTime.trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(task);
      }
    });

    return deduplicated;
  }

  // 3. Schedule upcoming native local notifications for today's valid tasks only
  async syncTaskAlarms(tasks: ScheduleTask[], categoryPlans: Record<string, CategoryPlan> = {}): Promise<void> {
    this.currentTasks = tasks;
    this.currentCategories = categoryPlans;

    if (!Capacitor.isNativePlatform()) return;

    await this.initChannel();

    try {
      // Request permission
      await LocalNotifications.requestPermissions().catch(() => {});

      const now = new Date();
      const currentDayOfWeek = (now.getDay() + 6) % 7 + 1;
      const isSunday = currentDayOfWeek === 7;

      // Cancel all existing task alarms first to prevent stacking / duplicate notifications!
      try {
        const pending = await LocalNotifications.getPending();
        if (pending && pending.notifications.length > 0) {
          const taskAlarmsToCancel = pending.notifications.filter(
            (n) => n.actionTypeId === 'TASK_ALARM' || (n.id >= 10000 && n.id < 120000)
          );
          if (taskAlarmsToCancel.length > 0) {
            await LocalNotifications.cancel({ notifications: taskAlarmsToCancel });
          }
        }
      } catch (cancelErr) {
        console.warn('[TaskAlarmNotificationService] Error cancelling pending alarms:', cancelErr);
      }

      // On Sunday: automatically clear any delivered notifications sitting on the lock screen / shade!
      if (isSunday) {
        try {
          await LocalNotifications.removeAllDeliveredNotifications();
        } catch (delivErr) {
          console.warn('[TaskAlarmNotificationService] Error removing delivered notifications:', delivErr);
        }
      }

      // Filter to legitimate, deduplicated tasks for TODAY only
      const todayTasks = this.filterTasksForToday(tasks, now);

      // On Sunday, only allow devotion tasks to be scheduled
      const tasksToSchedule = isSunday
        ? todayTasks.filter((t) => {
            const dom = (t.domain || '').toUpperCase();
            const badge = (t.badge || '').toLowerCase();
            const title = (t.title || '').toLowerCase();
            return (
              dom === 'DEVOTION_PRAYER' ||
              badge.includes('devotion') ||
              title.includes('devotion') ||
              title.includes('prayer') ||
              title.includes('ጸሎት') ||
              title.includes('church') ||
              title.includes('ቅዳሴ') ||
              title.includes('worship')
            );
          })
        : todayTasks;

      if (isSunday && tasksToSchedule.length === 0) {
        return;
      }

      const notificationsToSchedule: any[] = [];

      tasksToSchedule.forEach((task) => {
        const taskMinutes = parseTimeToMinutes(task.startTime);
        if (taskMinutes <= 0 && !task.startTime.includes('12:00 AM')) return;

        // Calculate target Date for today
        const targetDate = new Date();
        targetDate.setHours(Math.floor(taskMinutes / 60), taskMinutes % 60, 0, 0);

        // Only schedule if time is in the future today
        if (targetDate.getTime() > now.getTime()) {
          const catId = (task.badge || 'focus').toLowerCase();
          const catPlan = categoryPlans[catId] || Object.values(categoryPlans).find(p => p.title.toLowerCase().includes(catId));
          const catTitle = catPlan ? catPlan.title : (task.badge || 'Focus');

          // Deterministic unique numeric ID based on unique task title and start time
          const uniqueKey = `${task.title.trim()}_${task.startTime.trim()}`;
          const numericId = Math.abs(uniqueKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 100000 + 10000;

          notificationsToSchedule.push({
            id: numericId,
            title: `⏰ Time for ${catTitle}: ${task.title}`,
            body: `Scheduled block starting now (${task.durationMin || 30} min). Tap to start focus block!`,
            schedule: {
              at: targetDate,
              allowWhileIdle: true,
            },
            channelId: TASK_ALARM_CHANNEL_ID,
            sound: 'alarm_bell.wav',
            actionTypeId: 'TASK_ALARM',
            extra: {
              taskId: task.id,
              taskTitle: task.title,
              categoryTitle: catTitle,
              startTime: task.startTime,
            },
          });
        }
      });

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      }
    } catch (err) {
      console.warn('[TaskAlarmNotificationService] Failed to schedule task alarms:', err);
    }
  }

  // 4. Foreground Watcher: checks every 10 seconds if any task's alarm time is now!
  private startAlarmWatcher() {
    if (this.checkIntervalId) clearInterval(this.checkIntervalId);

    this.checkIntervalId = setInterval(() => {
      this.checkCurrentTimeAlarms();
    }, 10000);
  }

  // 5. Check if current time matches any valid task for today
  public checkCurrentTimeAlarms(): void {
    if (!this.currentTasks || this.currentTasks.length === 0) return;

    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentMinTotal = currentH * 60 + currentM;

    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Filter to valid, deduplicated tasks for today (respecting Sunday Rest Day)
    const validTodayTasks = this.filterTasksForToday(this.currentTasks, now);

    validTodayTasks.forEach((task) => {
      if (!task.startTime || task.completed) return;

      const taskMinTotal = parseTimeToMinutes(task.startTime);

      // Match exact current minute
      if (taskMinTotal === currentMinTotal) {
        const fireKey = `${task.id}_${todayDateStr}_${currentMinTotal}`;
        if (!this.firedAlarmsThisSession.has(fireKey)) {
          this.firedAlarmsThisSession.add(fireKey);
          this.triggerTaskAlarm(task);
        }
      }
    });
  }

  // 6. Trigger active alarm event & notification
  public triggerTaskAlarm(task: ScheduleTask): void {
    // 0. Hard Sunday Fail-Safe: Under NO circumstances can any exercise, workout, or non-devotion alarm fire on Sunday!
    const now = new Date();
    const isSunday = ((now.getDay() + 6) % 7 + 1) === 7;
    if (isSunday) {
      const domainUpper = (task.domain || '').toUpperCase();
      const badgeLower = (task.badge || '').toLowerCase();
      const titleLower = (task.title || '').toLowerCase();

      const isDevotion =
        domainUpper === 'DEVOTION_PRAYER' ||
        badgeLower.includes('devotion') ||
        titleLower.includes('devotion') ||
        titleLower.includes('prayer') ||
        titleLower.includes('ጸሎት') ||
        titleLower.includes('church') ||
        titleLower.includes('ቅዳሴ') ||
        titleLower.includes('worship');

      if (!isDevotion) {
        console.warn(`[TaskAlarmNotificationService] STRICT SUNDAY FAIL-SAFE: Blocked non-devotion alarm for "${task.title}" (domain: ${task.domain}, badge: ${task.badge})`);
        return;
      }
    }

    const catId = (task.badge || 'focus').toLowerCase();
    const catPlan = this.currentCategories[catId] || Object.values(this.currentCategories).find(p => p.title.toLowerCase().includes(catId));
    const categoryTitle = catPlan ? catPlan.title : (task.badge || 'Focus');
    const categoryColor = catPlan ? catPlan.color : (task.color || '#8b5cf6');

    // 1. Audio chime & vibration
    soundEngine.playGentleBell();
    iosNativeBridge.haptic('heavy');

    // 2. Dispatch custom event for in-app alert banner
    const detail: TaskAlarmEventDetail = {
      task,
      categoryTitle,
      categoryColor,
      categoryIconName: catId,
      formattedStartTime: task.startTime,
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('neva-task-alarm-triggered', { detail }));
    }

    // 3. Web Notification fallback if browser allows
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ Time for ${categoryTitle}: ${task.title}`, {
          body: `Scheduled session starting now (${task.durationMin || 30} min). Tap to start focus.`,
          icon: '/apple-touch-icon.png',
          tag: `task-alarm-${task.id}`,
          requireInteraction: true,
        });
      } catch {}
    }
  }
}

export const taskAlarmService = new TaskAlarmNotificationService();
