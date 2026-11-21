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

  // 2. Schedule upcoming native local notifications for all tasks
  async syncTaskAlarms(tasks: ScheduleTask[], categoryPlans: Record<string, CategoryPlan> = {}): Promise<void> {
    this.currentTasks = tasks;
    this.currentCategories = categoryPlans;

    if (!Capacitor.isNativePlatform()) return;

    await this.initChannel();

    try {
      // Request permission
      await LocalNotifications.requestPermissions().catch(() => {});

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const notificationsToSchedule: any[] = [];

      tasks.forEach((task) => {
        if (!task.startTime || task.startTime.toLowerCase().includes('flex') || task.completed) {
          return;
        }

        const taskMinutes = parseTimeToMinutes(task.startTime);
        if (taskMinutes <= 0 && !task.startTime.includes('12:00 AM')) return;

        // Calculate target Date for today
        const targetDate = new Date();
        targetDate.setHours(Math.floor(taskMinutes / 60), taskMinutes % 60, 0, 0);

        // If time is within the next 24 hours
        if (targetDate.getTime() > now.getTime()) {
          const catId = (task.badge || 'focus').toLowerCase();
          const catPlan = categoryPlans[catId] || Object.values(categoryPlans).find(p => p.title.toLowerCase().includes(catId));
          const catTitle = catPlan ? catPlan.title : (task.badge || 'Focus');

          const numericId = Math.abs((task.id + task.startTime).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 100000 + 10000;

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

  // 3. Foreground Watcher: checks every 10 seconds if any task's alarm time is now!
  private startAlarmWatcher() {
    if (this.checkIntervalId) clearInterval(this.checkIntervalId);

    this.checkIntervalId = setInterval(() => {
      this.checkCurrentTimeAlarms();
    }, 10000);
  }

  // 4. Check if current time matches any task's start time
  public checkCurrentTimeAlarms(): void {
    if (!this.currentTasks || this.currentTasks.length === 0) return;

    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentMinTotal = currentH * 60 + currentM;

    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.currentTasks.forEach((task) => {
      if (!task.startTime || task.completed) return;
      if (task.date && task.date !== todayDateStr) return;

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

  // 5. Trigger active alarm event & notification
  public triggerTaskAlarm(task: ScheduleTask): void {
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
