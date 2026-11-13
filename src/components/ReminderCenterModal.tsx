import React, { useState, useEffect } from 'react';
import { 
  Bell, BellRing, Clock, Calendar, Target, Check, 
  Trash2, Plus, Volume2, VolumeX, X, AlertCircle, 
  ChevronRight, Sparkles, Flame, ShieldAlert, Smartphone,
  Play, Timer, AlarmClock, RotateCcw, CheckCircle2, Shield
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { soundEngine, AlarmSoundType } from '../utils/audio';
import { iosNativeBridge } from '../utils/iosNativeBridge';

export interface ScheduleReminder {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  categoryTitle: string;
  categoryColor: string;
  timeOrCadence: string;
  details?: string;
  dismissed?: boolean;
}

export interface ActiveAlarmItem {
  id: string;
  title: string;
  fireTime: number; // timestamp in ms
  sound: AlarmSoundType;
  durationLabel: string;
}

interface ReminderCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOUND_LABELS: Record<AlarmSoundType, { name: string; desc: string }> = {
  tibetan_bowl: { name: 'Tibetan Singing Bowl', desc: '528Hz healing resonance' },
  temple_bell: { name: 'Sacred Temple Bell', desc: '432Hz harmonic acoustic' },
  zen_gong: { name: 'Zen Bronze Gong', desc: '108Hz grounding sub-bass' },
  sacred_chimes: { name: 'Sacred Triad Chimes', desc: 'Pythagorean triad' },
  gentle_harp: { name: 'Gentle Harp Chords', desc: 'Acoustic plucked strings' },
  digital_alert: { name: 'Digital Crisp Alert', desc: 'High-contrast ping' },
  none: { name: 'Silent / Vibrate Only', desc: 'Haptic feedback only' }
};

export const ReminderCenterModal: React.FC<ReminderCenterModalProps> = ({ isOpen, onClose }) => {
  const { 
    tasks, 
    categoryPlans, 
    getCategoryLiveMetrics, 
    setSelectedCategoryId,
    language
  } = useLivotion();

  const [activeTab, setActiveTabMode] = useState<'alarms' | 'reminders' | 'cadence'>('alarms');
  const [selectedSound, setSelectedSound] = useState<AlarmSoundType>('tibetan_bowl');
  const [notificationStatus, setNotificationStatus] = useState<string>('checking');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active scheduled alarms in localStorage
  const [activeAlarms, setActiveAlarms] = useState<ActiveAlarmItem[]>(() => {
    try {
      const saved = localStorage.getItem('neva_active_alarms_v1');
      if (saved) {
        const parsed: ActiveAlarmItem[] = JSON.parse(saved);
        // filter out expired alarms (> 10s past fireTime)
        const now = Date.now();
        return parsed.filter(a => a.fireTime > now - 10000);
      }
    } catch (e) {}
    return [];
  });

  // Custom Alarm state
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [customAlarmTitle, setCustomAlarmTitle] = useState<string>('Deep Focus Session');
  const [alarmTimeInput, setAlarmTimeInput] = useState<string>('');
  const [alarmMode, setAlarmMode] = useState<'countdown' | 'time'>('countdown');

  // Apple Reminders state
  const [newReminderTitle, setNewReminderTitle] = useState<string>('');
  const [newReminderMinutes, setNewReminderMinutes] = useState<number>(30);
  const [newReminderNotes, setNewReminderNotes] = useState<string>('Scheduled via NEVA OS');
  const [isSyncingTasks, setIsSyncingTasks] = useState<boolean>(false);

  // Cadence filter & dismissals
  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('neva_dismissed_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  // Check notification permission on mount
  useEffect(() => {
    if (iosNativeBridge.isNativeApp()) {
      setNotificationStatus('granted');
    } else if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, [isOpen]);

  // Save active alarms & dismissed
  useEffect(() => {
    localStorage.setItem('neva_active_alarms_v1', JSON.stringify(activeAlarms));
  }, [activeAlarms]);

  useEffect(() => {
    localStorage.setItem('neva_dismissed_reminders', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  // Live countdown ticker
  const [, setTicker] = useState<number>(0);
  useEffect(() => {
    if (!isOpen || activeAlarms.length === 0) return;
    const interval = setInterval(() => {
      setTicker(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeAlarms.length]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Test iPhone Alarm & Taptic
  const handleTestAlarm = async () => {
    await iosNativeBridge.haptic('heavy');
    soundEngine.playAlarm(selectedSound);
    showToast(`🔔 Test Alarm Sounding: ${SOUND_LABELS[selectedSound].name}`);
  };

  // Request Permissions
  const handleRequestPermissions = async () => {
    await iosNativeBridge.haptic('medium');
    const res = await iosNativeBridge.requestAllPermissions();
    if (res.notifications) {
      setNotificationStatus('granted');
      showToast('✓ iPhone Notifications & Alarm permissions granted!');
    } else {
      showToast('Notice: Please allow notifications in iPhone Settings.');
    }
  };

  // Arm an Alarm
  const handleArmAlarm = async (minutes: number, title: string) => {
    if (minutes <= 0) return;
    const seconds = Math.round(minutes * 60);
    const fireTime = Date.now() + seconds * 1000;
    const alarmId = `alarm-${Date.now()}`;

    await iosNativeBridge.haptic('success');
    await iosNativeBridge.scheduleFocusAlarm(
      alarmId,
      `⏰ ${title} Complete!`,
      `Your ${minutes}m focus block in NEVA has concluded. Return to cockpit.`,
      seconds,
      selectedSound
    );

    const newAlarm: ActiveAlarmItem = {
      id: alarmId,
      title,
      fireTime,
      sound: selectedSound,
      durationLabel: `${minutes}m`
    };

    setActiveAlarms(prev => [...prev, newAlarm]);
    const fireTimeString = new Date(fireTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    showToast(`✓ Phone Alarm Armed for ${fireTimeString}! Rings through lockscreen.`);
  };

  // Arm Specific Time Alarm
  const handleArmTimeAlarm = async () => {
    if (!alarmTimeInput) return;
    const [hrs, mins] = alarmTimeInput.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hrs, mins, 0, 0);

    // If time is earlier today, set for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const seconds = Math.round((target.getTime() - now.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    await handleArmAlarm(minutes, customAlarmTitle || 'Scheduled Alarm');
  };

  // Cancel Alarm
  const handleCancelAlarm = async (id: string) => {
    await iosNativeBridge.haptic('light');
    await iosNativeBridge.cancelAlarm(id);
    setActiveAlarms(prev => prev.filter(a => a.id !== id));
    showToast('Alarm cancelled.');
  };

  // Sync All Today's Tasks to Apple Reminders
  const handleSyncTodayTasksToReminders = async () => {
    if (tasks.length === 0) {
      showToast('No tasks scheduled today to sync.');
      return;
    }

    setIsSyncingTasks(true);
    await iosNativeBridge.haptic('success');

    const items = tasks.map((t, idx) => ({
      title: `${t.title} (${t.durationMin}m)`,
      notes: `NEVA Mastery OS • ${t.domain} block at ${t.startTime}`,
      dueMinutes: (idx + 1) * 35
    }));

    try {
      const savedCount = await iosNativeBridge.syncTasksToReminders(items);
      showToast(`✓ Synced ${savedCount} tasks to iPhone Reminders app!`);
    } catch (e) {
      showToast('Generated reminder calendar file for iPhone.');
    } finally {
      setIsSyncingTasks(false);
    }
  };

  // Add Single Custom Reminder
  const handleAddCustomReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;

    await iosNativeBridge.haptic('medium');
    const success = await iosNativeBridge.addReminder(
      newReminderTitle.trim(),
      newReminderNotes,
      newReminderMinutes
    );

    if (success) {
      showToast(`✓ Added to iPhone Reminders (Due in ${newReminderMinutes}m)`);
      setNewReminderTitle('');
    }
  };

  // Cadence Alerts Generation
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];
  const todayShort = todayName.slice(0, 3);

  const generatedReminders: ScheduleReminder[] = [];

  tasks.forEach((t) => {
    const matchedCat = Object.values(categoryPlans).find((c) => 
      t.domain.toLowerCase().includes(c.id.toLowerCase())
    ) || categoryPlans['buffer'];

    generatedReminders.push({
      id: `daily-${t.id}`,
      type: 'daily',
      title: t.title,
      categoryTitle: matchedCat.title,
      categoryColor: t.color || matchedCat.color,
      timeOrCadence: `${t.startTime} (${t.durationMin}m)`,
      details: t.completed ? 'Completed for today' : 'Scheduled focus block today',
      dismissed: dismissedIds.includes(`daily-${t.id}`) || t.completed,
    });
  });

  Object.values(categoryPlans).forEach((cat) => {
    const metrics = getCategoryLiveMetrics(cat.id);
    const matchingSlot = cat.weeklyScheduleSummary.find((s) => 
      s.toLowerCase().includes(todayShort.toLowerCase()) || s.toLowerCase().includes('daily')
    );

    if (matchingSlot) {
      generatedReminders.push({
        id: `weekly-cadence-${cat.id}`,
        type: 'weekly',
        title: `${cat.title}: ${matchingSlot}`,
        categoryTitle: cat.title,
        categoryColor: cat.color,
        timeOrCadence: `${todayName} Cadence`,
        details: `Weekly Target: ${metrics.currentWeeklyHours.toFixed(1)} / ${metrics.weeklyTargetHours}h logged (${metrics.weeklyPercentile.toFixed(1)}%)`,
        dismissed: dismissedIds.includes(`weekly-cadence-${cat.id}`),
      });
    }
  });

  const activeReminders = generatedReminders.filter((r) => !r.dismissed && (filterType === 'all' || r.type === filterType));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in text-slate-800 dark:text-slate-100">
      <div 
        className="w-full max-w-lg max-h-[90vh] rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0f172a]/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0082ff] to-[#0055d4] flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
              <AlarmClock size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                {language === 'am' ? 'የማንቂያ ደወል እና አስታዋሾች' : 'Reminders & Phone Alarms'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {language === 'am' ? 'የስልክ ማንቂያ እና አፕል አስታዋሽ' : 'Phone alarms & Apple Reminders sync'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 rounded-2xl bg-[#0082ff] text-white text-xs font-bold shadow-lg flex items-center justify-between gap-2 animate-slide-down">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="p-0.5 opacity-80 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Permission Banner if not granted on Web */}
        {notificationStatus === 'default' && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert size={16} className="text-amber-500 shrink-0" />
              <span className="truncate">Enable notifications for alarms when screen is locked.</span>
            </div>
            <button
              onClick={handleRequestPermissions}
              className="px-3 py-1 bg-amber-500 text-white rounded-xl font-bold text-xs shrink-0 active:scale-95 transition"
            >
              Enable
            </button>
          </div>
        )}

        {/* Tab Switcher - Responsive 3-Column Grid without horizontal overflow */}
        <div className="px-3 sm:px-5 pt-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/30 dark:bg-[#0a0f18]/30">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              onClick={() => { setActiveTabMode('alarms'); iosNativeBridge.haptic('light'); }}
              className={`py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === 'alarms'
                  ? 'bg-[#0082ff] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <AlarmClock size={14} className="shrink-0" />
              <span className="truncate">{language === 'am' ? 'ማንቂያ' : 'Alarms'}</span>
              {activeAlarms.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#0082ff] text-[9px] flex items-center justify-center font-black shrink-0">
                  {activeAlarms.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTabMode('reminders'); iosNativeBridge.haptic('light'); }}
              className={`py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === 'reminders'
                  ? 'bg-[#0082ff] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <BellRing size={14} className="shrink-0" />
              <span className="truncate">{language === 'am' ? 'አስታዋሽ' : 'Reminders'}</span>
            </button>

            <button
              onClick={() => { setActiveTabMode('cadence'); iosNativeBridge.haptic('light'); }}
              className={`py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer min-w-0 ${
                activeTab === 'cadence'
                  ? 'bg-[#0082ff] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Calendar size={14} className="shrink-0" />
              <span className="truncate">{language === 'am' ? 'መርሐግብር' : 'Cadence'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-[9px] text-slate-700 dark:text-slate-300 shrink-0">
                {activeReminders.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* TAB 1: PHONE ALARMS */}
          {activeTab === 'alarms' && (
            <div className="space-y-4">
              
              {/* Sound Chooser & Test Strip */}
              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Volume2 size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Alarm Acoustic Sound</span>
                    <select
                      value={selectedSound}
                      onChange={(e) => setSelectedSound(e.target.value as AlarmSoundType)}
                      className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 cursor-pointer truncate"
                    >
                      {Object.entries(SOUND_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {v.name} ({v.desc})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleTestAlarm}
                  className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  title="Test sound through iPhone speakers and Taptic motor"
                >
                  <Play size={12} className="text-emerald-500 fill-emerald-500" />
                  <span>Test Sound & Taptic</span>
                </button>
              </div>

              {/* Quick Preset Alarms */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                  {language === 'am' ? 'ፈጣን የማንቂያ ደወል ቅንብሮች' : 'Quick Focus Alarm Presets (1-Tap Arm)'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { min: 15, label: '15m Sprint', desc: 'Power focus burst' },
                    { min: 25, label: '25m Pomodoro', desc: 'Standard flow cycle' },
                    { min: 45, label: '45m Deep Work', desc: 'Core deliberate mastery' },
                    { min: 60, label: '60m Mastery', desc: 'Complete workout/study' },
                    { min: 90, label: '90m Ultradian', desc: 'Deep biological wave' },
                    { min: 10, label: '10m Reset', desc: 'Quick break & recharge' },
                  ].map(preset => (
                    <button
                      key={preset.min}
                      onClick={() => handleArmAlarm(preset.min, preset.label)}
                      className="p-3 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 hover:border-[#0082ff] dark:hover:border-[#0082ff] text-left transition cursor-pointer active:scale-95 group shadow-2xs min-w-0"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-[#0082ff] transition-colors truncate">
                          {preset.label}
                        </span>
                        <Timer size={13} className="text-slate-400 group-hover:text-[#0082ff] transition-colors shrink-0" />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                        {preset.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Alarm Config */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                    <Clock size={14} className="text-[#0082ff] shrink-0" />
                    <span className="truncate">Custom Alarm & Reminder</span>
                  </span>
                  <div className="flex items-center bg-slate-200/70 dark:bg-slate-700/60 p-0.5 rounded-lg text-[10px] font-bold shrink-0">
                    <button
                      onClick={() => setAlarmMode('countdown')}
                      className={`px-2 py-0.5 rounded-md transition ${alarmMode === 'countdown' ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs' : 'text-slate-500'}`}
                    >
                      In Minutes
                    </button>
                    <button
                      onClick={() => setAlarmMode('time')}
                      className={`px-2 py-0.5 rounded-md transition ${alarmMode === 'time' ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs' : 'text-slate-500'}`}
                    >
                      Exact Time
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={customAlarmTitle}
                    onChange={(e) => setCustomAlarmTitle(e.target.value)}
                    placeholder="Alarm title (e.g. Chess Tactics, Prayer)"
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0082ff]"
                  />

                  {alarmMode === 'countdown' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="360"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">minutes</span>
                      <button
                        onClick={() => handleArmAlarm(customMinutes, customAlarmTitle)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold transition active:scale-95 cursor-pointer text-center"
                      >
                        Arm Alarm
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={alarmTimeInput}
                        onChange={(e) => setAlarmTimeInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={handleArmTimeAlarm}
                        disabled={!alarmTimeInput}
                        className="py-2 px-4 rounded-xl bg-[#0082ff] hover:bg-[#0070df] disabled:opacity-50 text-white text-xs font-bold transition active:scale-95 cursor-pointer shrink-0"
                      >
                        Set Alarm
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Alarms List */}
              {activeAlarms.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Armed Phone Alarms ({activeAlarms.length})</span>
                    <button
                      onClick={() => {
                        activeAlarms.forEach(a => iosNativeBridge.cancelAlarm(a.id));
                        setActiveAlarms([]);
                        showToast('All alarms cancelled.');
                      }}
                      className="text-rose-500 hover:underline cursor-pointer lowercase font-medium"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-2">
                    {activeAlarms.map((alarm) => {
                      const now = Date.now();
                      const secondsLeft = Math.max(0, Math.round((alarm.fireTime - now) / 1000));
                      const minsLeft = Math.floor(secondsLeft / 60);
                      const secsLeft = secondsLeft % 60;
                      const timeString = new Date(alarm.fireTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div 
                          key={alarm.id}
                          className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-white to-white dark:via-[#121927] dark:to-[#121927] border border-blue-200 dark:border-blue-900/60 shadow-2xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#0082ff]/10 text-[#0082ff] flex items-center justify-center shrink-0">
                              <AlarmClock size={16} className="animate-bounce" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {alarm.title}
                                </h5>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950/80 text-[#0082ff] font-bold">
                                  {timeString}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {minsLeft > 0 ? `${minsLeft}m ${secsLeft}s remaining` : `${secsLeft}s remaining`}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCancelAlarm(alarm.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Cancel this alarm"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: APPLE REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-5">
              
              {/* Sync Today's Schedule Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/80 dark:border-blue-800/80 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0082ff] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {language === 'am' ? 'የዛሬን ተግባራት ወደ አፕል አስታዋሽ ላክ' : 'Sync Today’s Flow to Apple Reminders'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tasks.length} {language === 'am' ? 'ተግባራት ተዘጋጅተዋል' : 'blocks ready to export to iOS Reminders list'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSyncTodayTasksToReminders}
                  disabled={isSyncingTasks || tasks.length === 0}
                  className="w-full py-3 px-4 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer"
                >
                  <BellRing size={15} />
                  <span>
                    {isSyncingTasks ? 'Exporting to iPhone EventKit...' : `Export All ${tasks.length} Tasks to Apple Reminders`}
                  </span>
                </button>
              </div>

              {/* Add Custom Apple Reminder Form */}
              <form onSubmit={handleAddCustomReminder} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Add Quick Item to Apple Reminders
                </span>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={newReminderTitle}
                    onChange={(e) => setNewReminderTitle(e.target.value)}
                    placeholder="Reminder title (e.g. Call Client, Read Scripture, Gym)"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0082ff]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Due in minutes</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={newReminderMinutes}
                        onChange={(e) => setNewReminderMinutes(parseInt(e.target.value) || 15)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">List Target</label>
                      <input
                        type="text"
                        readOnly
                        value="NEVA Flow (iOS)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition active:scale-95 cursor-pointer mt-1"
                  >
                    + Save to iPhone Reminders
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 3: DAILY CADENCE ALERTS */}
          {activeTab === 'cadence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Active Schedule Alerts ({activeReminders.length})</span>
                {dismissedIds.length > 0 && (
                  <button
                    onClick={() => {
                      setDismissedIds([]);
                      showToast('Restored all dismissed alerts.');
                    }}
                    className="text-[#0082ff] hover:underline cursor-pointer lowercase font-medium"
                  >
                    Restore all ({dismissedIds.length} dismissed)
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {activeReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 transition flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div 
                        className="w-2 h-10 rounded-full shrink-0 mt-0.5" 
                        style={{ backgroundColor: rem.categoryColor }} 
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider"
                            style={{ backgroundColor: `${rem.categoryColor}15`, color: rem.categoryColor }}
                          >
                            {rem.categoryTitle}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Clock size={11} className="text-[#0082ff]" /> {rem.timeOrCadence}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {rem.title}
                        </h4>

                        {rem.details && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {rem.details}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-center">
                      <button
                        onClick={() => {
                          handleArmAlarm(30, rem.title);
                        }}
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0082ff] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Arm phone alarm for this block"
                      >
                        <AlarmClock size={14} />
                      </button>

                      <button
                        onClick={() => {
                          setDismissedIds(prev => [...prev, rem.id]);
                          iosNativeBridge.haptic('light');
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Dismiss alert"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {activeReminders.length === 0 && (
                  <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                    <Bell size={24} className="mx-auto text-slate-400" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      All schedule reminders cleared for now!
                    </p>
                    <p className="text-xs text-slate-400">
                      New alerts will trigger as daily focus blocks and weekly cadence times arrive.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
