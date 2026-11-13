import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

interface RemindersPluginInterface {
  requestPermissions(): Promise<{ granted: boolean }>;
  createReminder(options: { title: string; notes?: string; dueMinutes?: number; listName?: string }): Promise<{ success: boolean; reminderId?: string }>;
  syncAllReminders(options: { items: Array<{ title: string; notes?: string; dueMinutes?: number }> }): Promise<{ savedCount: number; success: boolean }>;
}

interface AlarmPluginInterface {
  requestAlarmPermissions(): Promise<{ granted: boolean }>;
  scheduleFocusAlarm(options: { id: string; title: string; body: string; seconds: number; sound?: string }): Promise<{ success: boolean; id: string }>;
  cancelAlarm(options: { id: string }): Promise<{ success: boolean }>;
  triggerImmediateAlarm(): Promise<{ success: boolean }>;
}

const RemindersNative = registerPlugin<RemindersPluginInterface>('Reminders');
const AlarmNative = registerPlugin<AlarmPluginInterface>('Alarm');

class IOSNativeBridge {
  isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios' || /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Haptic feedback (iPhone Taptic Engine)
  async haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'medium') {
    try {
      if (this.isNativeApp()) {
        if (type === 'light') await Haptics.impact({ style: ImpactStyle.Light });
        else if (type === 'heavy') await Haptics.impact({ style: ImpactStyle.Heavy });
        else if (type === 'success') await Haptics.notification({ type: NotificationType.Success });
        else if (type === 'warning') await Haptics.notification({ type: NotificationType.Warning });
        else await Haptics.impact({ style: ImpactStyle.Medium });
      } else if ('vibrate' in navigator) {
        navigator.vibrate(type === 'heavy' ? [40, 40, 80] : [30]);
      }
    } catch (e) {
      // Fallback silent
    }
  }

  // Request Permissions for Reminders & Alarms
  async requestAllPermissions(): Promise<{ reminders: boolean; notifications: boolean }> {
    let remindersGranted = false;
    let notifsGranted = false;

    try {
      if (this.isNativeApp()) {
        const rRes = await RemindersNative.requestPermissions().catch(() => ({ granted: false }));
        remindersGranted = !!rRes.granted;

        const aRes = await LocalNotifications.requestPermissions().catch(() => ({ display: 'denied' }));
        notifsGranted = aRes.display === 'granted';
      } else {
        if ('Notification' in window) {
          const perm = await Notification.requestPermission();
          notifsGranted = perm === 'granted';
        }
      }
    } catch (e) {
      console.warn('Permission request error:', e);
    }

    return { reminders: remindersGranted, notifications: notifsGranted };
  }

  // Export / Add a reminder to iPhone Reminders
  async addReminder(title: string, notes: string = '', dueMinutesFromNow: number = 0): Promise<boolean> {
    this.haptic('medium');

    if (this.isNativeApp()) {
      try {
        const res = await RemindersNative.createReminder({
          title,
          notes,
          dueMinutes: dueMinutesFromNow,
          listName: 'NEVA Flow'
        });
        return res.success;
      } catch (err) {
        console.warn('Native reminder failed, falling back to local notification', err);
      }
    }

    // Fallback: Schedule local notification / calendar event file
    if (dueMinutesFromNow > 0) {
      await this.scheduleFocusAlarm(
        `remind-${Date.now()}`,
        `Reminder: ${title}`,
        notes || 'Scheduled in NEVA Flow',
        dueMinutesFromNow * 60
      );
    }

    return true;
  }

  // Sync batch tasks to iPhone Reminders
  async syncTasksToReminders(tasks: Array<{ title: string; notes?: string; dueMinutes?: number }>): Promise<number> {
    this.haptic('success');

    if (this.isNativeApp()) {
      try {
        const res = await RemindersNative.syncAllReminders({ items: tasks });
        return res.savedCount;
      } catch (err) {
        console.warn('Native batch sync failed:', err);
      }
    }

    // Web fallback: Generate downloadable .ics reminder file for iOS Calendar/Reminders
    this.downloadICalReminderFile(tasks);
    return tasks.length;
  }

  // Schedule Phone Alarm / Time-Sensitive Notification for Timer completion
  async scheduleFocusAlarm(id: string, title: string, body: string, seconds: number, soundType: string = 'tibetan'): Promise<boolean> {
    if (seconds <= 0) return false;

    if (this.isNativeApp()) {
      try {
        // Schedule native time-sensitive alarm
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.abs(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 100000,
              title,
              body,
              schedule: { at: new Date(Date.now() + seconds * 1000) },
              sound: 'alarm_bell.wav',
              actionTypeId: 'FOCUS_COMPLETE',
              extra: { originalId: id, soundType }
            }
          ]
        });
        return true;
      } catch (e) {
        console.warn('LocalNotifications schedule error:', e);
      }
    }

    // Web fallback: Schedule Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        try {
          new Notification(title, {
            body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            tag: id,
            requireInteraction: true
          });
        } catch (e) {}
      }, seconds * 1000);
      return true;
    }

    return false;
  }

  // Cancel alarm
  async cancelAlarm(id: string): Promise<void> {
    if (this.isNativeApp()) {
      try {
        const numId = Math.abs(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 100000;
        await LocalNotifications.cancel({ notifications: [{ id: numId }] });
        await AlarmNative.cancelAlarm({ id }).catch(() => {});
      } catch (e) {}
    }
  }

  // Fallback: generate .ics for iOS Reminders / Calendar
  private downloadICalReminderFile(tasks: Array<{ title: string; notes?: string; dueMinutes?: number }>) {
    const now = new Date();
    const formatIcalDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NEVA Execution Cockpit//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    tasks.forEach((task, idx) => {
      const startTime = new Date(now.getTime() + (task.dueMinutes || (idx + 1) * 30) * 60000);
      const endTime = new Date(startTime.getTime() + 25 * 60000);

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:neva-${Date.now()}-${idx}@neva.app`,
        `DTSTAMP:${formatIcalDate(now)}`,
        `DTSTART:${formatIcalDate(startTime)}`,
        `DTEND:${formatIcalDate(endTime)}`,
        `SUMMARY:${task.title.replace(/[,;]/g, ' ')}`,
        `DESCRIPTION:${(task.notes || 'Scheduled in NEVA OS').replace(/[,;\n]/g, ' ')}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT5M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder',
        'END:VALARM',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'neva-reminders.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const iosNativeBridge = new IOSNativeBridge();
