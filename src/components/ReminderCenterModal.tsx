import React, { useState, useEffect } from 'react';
import { 
  Bell, BellRing, Clock, Calendar, Target, Check, 
  Trash2, Plus, Volume2, VolumeX, X, AlertCircle, 
  ChevronRight, Sparkles, Flame, ShieldAlert
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { soundEngine } from '../utils/audio';

export interface ScheduleReminder {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  categoryTitle: string;
  categoryColor: string;
  timeOrCadence: string;
  details?: string;
  dismissed?: boolean;
  snoozedUntil?: number; // timestamp
}

interface ReminderCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderCenterModal: React.FC<ReminderCenterModalProps> = ({ isOpen, onClose }) => {
  const { 
    tasks, 
    categoryPlans, 
    getCategoryLiveMetrics, 
    triggerAlarmSound,
    setSelectedCategoryId,
    setActiveTab 
  } = useLivotion();

  const [filterType, setFilterType] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('neva_dismissed_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  // Custom reminders state
  const [customReminders, setCustomReminders] = useState<ScheduleReminder[]>(() => {
    const saved = localStorage.getItem('neva_custom_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  // New reminder form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newTime, setNewTime] = useState('06:00 PM');
  const [newCategory, setNewCategory] = useState('chess');

  useEffect(() => {
    localStorage.setItem('neva_dismissed_reminders', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  useEffect(() => {
    localStorage.setItem('neva_custom_reminders', JSON.stringify(customReminders));
  }, [customReminders]);

  if (!isOpen) return null;

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];
  const todayShort = todayName.slice(0, 3);

  // Generate dynamic reminders from Daily, Weekly, and Monthly schedules
  const generatedReminders: ScheduleReminder[] = [];

  // 1. Daily Schedule Reminders (from tasks)
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

  // 2. Weekly Schedule Reminders (cadence matching today or pacing)
  Object.values(categoryPlans).forEach((cat) => {
    const metrics = getCategoryLiveMetrics(cat.id);
    
    // Find slot matching today
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

    // Weekly pacing alert if behind schedule
    if (metrics.weeklyPercentile < 50 && metrics.weeklyTargetHours > 5) {
      generatedReminders.push({
        id: `weekly-pacing-${cat.id}`,
        type: 'weekly',
        title: `${cat.title} Weekly Pacing Check`,
        categoryTitle: cat.title,
        categoryColor: cat.color,
        timeOrCadence: 'Mid-Week Pacing',
        details: `${Math.max(0, metrics.weeklyTargetHours - metrics.currentWeeklyHours).toFixed(1)}h remaining to hit ${metrics.weeklyTargetHours}h goal`,
        dismissed: dismissedIds.includes(`weekly-pacing-${cat.id}`),
      });
    }
  });

  // 3. Monthly Deliverable Reminders
  Object.values(categoryPlans).forEach((cat) => {
    const metrics = getCategoryLiveMetrics(cat.id);
    generatedReminders.push({
      id: `monthly-goal-${cat.id}`,
      type: 'monthly',
      title: cat.monthlyGoalTitle,
      categoryTitle: cat.title,
      categoryColor: cat.color,
      timeOrCadence: `Target: ${metrics.monthlyTargetHours}h / month`,
      details: `${metrics.monthlyPercentile.toFixed(1)}% achieved (${metrics.currentMonthlyHours.toFixed(1)} / ${metrics.monthlyTargetHours}h logged) • ${cat.monthlyTargetMetric}`,
      dismissed: dismissedIds.includes(`monthly-goal-${cat.id}`),
    });
  });

  // Combined reminders
  const allReminders = [...customReminders, ...generatedReminders];

  const filteredReminders = allReminders.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    return true;
  });

  const activeReminders = filteredReminders.filter((r) => !r.dismissed);
  const dismissedReminders = filteredReminders.filter((r) => r.dismissed);

  const handleDismiss = (id: string) => {
    if (!dismissedIds.includes(id)) {
      setDismissedIds([...dismissedIds, id]);
    }
  };

  const handleRestore = (id: string) => {
    setDismissedIds(dismissedIds.filter((item) => item !== id));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const cat = categoryPlans[newCategory] || categoryPlans['chess'];
    const newRem: ScheduleReminder = {
      id: `custom-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      categoryTitle: cat.title,
      categoryColor: cat.color,
      timeOrCadence: newTime,
      details: `Custom reminder for ${cat.title}`,
      dismissed: false,
    };

    setCustomReminders([newRem, ...customReminders]);
    if (soundEnabled) {
      triggerAlarmSound('CHIME_MEDITATION');
    }
    setNewTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0082ff] text-white flex items-center justify-center shadow-xs">
              <BellRing size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Schedule Reminders & Alerts
              </h3>
              <p className="text-xs text-slate-500">
                Synchronized with Daily blocks, Weekly cadence, and Monthly deliverables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
              title={soundEnabled ? 'Chime sound enabled' : 'Muted'}
            >
              {soundEnabled ? <Volume2 size={16} className="text-[#0082ff]" /> : <VolumeX size={16} className="text-slate-400" />}
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top Filter Buttons & Quick Add */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({allReminders.length})
            </button>
            <button
              onClick={() => setFilterType('daily')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                filterType === 'daily'
                  ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Clock size={12} /> Daily
            </button>
            <button
              onClick={() => setFilterType('weekly')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                filterType === 'weekly'
                  ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Calendar size={12} /> Weekly
            </button>
            <button
              onClick={() => setFilterType('monthly')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                filterType === 'monthly'
                  ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Target size={12} /> Monthly
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus size={13} /> {showAddForm ? 'Close Form' : 'Custom Alert'}
          </button>
        </div>

        {/* Custom Reminder Creation Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddCustom} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white">Create Custom Schedule Reminder</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 font-semibold block mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 15m Tactics Rush, Form check..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Horizon Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="daily">Daily Schedule</option>
                  <option value="weekly">Weekly Routine</option>
                  <option value="monthly">Monthly Milestone</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Pillar Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  {Object.values(categoryPlans).map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Scheduled Time / Cadence</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="06:00 PM / Mon-Fri"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0082ff] text-white rounded-xl font-bold flex items-center gap-1"
              >
                <Plus size={13} /> Add Reminder
              </button>
            </div>
          </form>
        )}

        {/* Reminders List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            <span>Active Schedule Alerts ({activeReminders.length})</span>
            {dismissedReminders.length > 0 && (
              <button
                onClick={() => setDismissedIds([])}
                className="text-[#0082ff] hover:underline cursor-pointer lowercase font-medium"
              >
                Restore all ({dismissedReminders.length} dismissed)
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {activeReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 transition flex items-start justify-between gap-3 group"
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
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {rem.type} alert
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

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-center">
                  <button
                    onClick={() => {
                      const matchedKey = Object.keys(categoryPlans).find((k) => 
                        categoryPlans[k].title.toLowerCase() === rem.categoryTitle.toLowerCase()
                      );
                      if (matchedKey) {
                        setSelectedCategoryId(matchedKey);
                        onClose();
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Open Plan"
                  >
                    <span>View</span>
                    <ChevronRight size={13} />
                  </button>

                  <button
                    onClick={() => handleDismiss(rem.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Dismiss alert"
                  >
                    <Check size={15} />
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
      </div>
    </div>
  );
};
