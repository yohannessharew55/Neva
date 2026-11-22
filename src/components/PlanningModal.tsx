import React, { useState } from 'react';
import { 
  X, Calendar, CalendarDays, CalendarRange, 
  Sparkles, Plus, Check, CheckCircle2, RotateCcw, 
  Sliders, Clock
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { DomainType } from '../types';
import { 
  checkScheduleConflict, 
  ScheduleConflictResult, 
  getAvailableFreeSlots 
} from '../utils/scheduleConflictDetector';
import { ScheduleConflictNotificationModal } from './ScheduleConflictNotificationModal';
import { soundEngine } from '../utils/audio';

interface PlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'daily' | 'weekly' | 'monthly' | 'systematic';
}

export const PlanningModal: React.FC<PlanningModalProps> = ({ isOpen, onClose, defaultTab = 'daily' }) => {
  const { 
    addTask, 
    categoryPlans, 
    updateCategoryPlan, 
    applySystematicPreset,
    getDaySchedule,
    timeFormat
  } = useLivotion();

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'systematic'>(defaultTab);

  // Daily task form
  const [taskCategory, setTaskCategory] = useState<string>('chess');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('02:00 PM');
  const [taskDuration, setTaskDuration] = useState(45);

  // Category select for weekly/monthly
  const [selectedPlanCategory, setSelectedPlanCategory] = useState<string>('chess');

  // Schedule Overlap Conflict State
  const [scheduleConflict, setScheduleConflict] = useState<ScheduleConflictResult | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  if (!isOpen) return null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const daySchedule = getDaySchedule(today);
  const dayTasks = daySchedule.tasks;

  const availableFreeSlots = getAvailableFreeSlots({
    existingTasks: dayTasks,
    dateStr: todayStr,
    proposedDurationMin: Number(taskDuration) || 30,
    timeFormat,
    isAlreadyScopedToDay: true,
  });

  const currentPlan = categoryPlans[selectedPlanCategory] || Object.values(categoryPlans).filter(Boolean)[0] || { id: 'buffer', title: 'Focus', color: '#0082ff', inProgressItems: [], completedItems: [] };

  const getDomainType = (catId: string): DomainType => {
    switch (catId) {
      case 'exercise': return 'PHYSICAL_FITNESS';
      case 'chess': return 'CHESS';
      case 'art': return 'OIL_PAINTING';
      case 'music': return 'GUITAR';
      case 'architecture': return 'ARCHITECTURE_DESIGN';
      case 'trading': return 'FOREX_TRADING';
      case 'devotion': return 'DEVOTION_PRAYER';
      default: return 'OPEN_MULTIPURPOSE';
    }
  };

  const handleCreateDaily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const conflict = checkScheduleConflict({
      proposedTask: {
        title: taskTitle.trim(),
        startTime: taskTime.trim() || 'Flexible',
        durationMin: Number(taskDuration),
        categoryId: taskCategory,
        domain: getDomainType(taskCategory),
        badge: categoryPlans[taskCategory]?.title?.split(' ')[0] || 'Focus',
      },
      dateStr: todayStr,
      existingTasks: dayTasks,
      isAlreadyScopedToDay: true,
      categoryPlans,
      timeFormat,
    });

    if (conflict.hasConflict) {
      setScheduleConflict(conflict);
      setIsConflictModalOpen(true);
      try { soundEngine.playTouchSound(); } catch {}
      return; // Stoppage: Do not allow saving overlapping schedule block!
    }

    addTask({
      domain: getDomainType(taskCategory),
      title: taskTitle.trim(),
      startTime: taskTime.trim() || 'Flexible',
      durationMin: Number(taskDuration),
      completed: false,
      date: todayStr,
      color: categoryPlans[taskCategory]?.color || '#0082ff',
      badge: categoryPlans[taskCategory]?.title?.split(' ')[0] || 'Focus',
      checklist: [
        { id: `c-${Date.now()}-1`, text: 'Initial set up', done: false },
        { id: `c-${Date.now()}-2`, text: 'Execute deliberate focus', done: false }
      ]
    });

    setTaskTitle('');
    try { soundEngine.playPencil(); } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Plan Routine & Milestones
            </h3>
            <p className="text-xs text-slate-500">Plan manually or apply systematic proven templates.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'daily'
                ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Calendar size={13} />
            <span>Daily</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'weekly'
                ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CalendarDays size={13} />
            <span>Weekly</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'monthly'
                ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CalendarRange size={13} />
            <span>Monthly</span>
          </button>

          <button
            onClick={() => setActiveTab('systematic')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'systematic'
                ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-900 dark:text-purple-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles size={13} />
            <span>Templates</span>
          </button>
        </div>

        {/* 1. Daily Manual Planning */}
        {activeTab === 'daily' && (
          <form onSubmit={handleCreateDaily} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-500 block mb-1">Select Main Category</label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none"
              >
                {Object.values(categoryPlans).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-500 block mb-1">Task / Block Title</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Tactical endgame calculation session"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-[#0082ff]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Scheduled Start</label>
                <input
                  type="text"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  placeholder="02:00 PM"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-500 block mb-1">Allocated Minutes</label>
                <input
                  type="number"
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(Number(e.target.value))}
                  min={5}
                  max={240}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Quick Available Free Time Slots Bar */}
            {availableFreeSlots.length > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> Open Free Slots Today
                  </span>
                  <span className="text-[9px] text-slate-400 lowercase">tap to select</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableFreeSlots.slice(0, 4).map((slot, sIdx) => (
                    <button
                      key={`slot-${sIdx}`}
                      type="button"
                      onClick={() => {
                        setTaskTime(slot.start);
                        try { soundEngine.playTouchSound(); } catch {}
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer flex items-center gap-1 ${
                        taskTime === slot.start
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
                      }`}
                    >
                      <span>{slot.start}</span>
                      <span className="text-[9px] opacity-80">({Math.round(slot.durationMinutes / 60 * 10) / 10}h)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl font-bold"
              >
                Schedule Daily Block
              </button>
            </div>
          </form>
        )}

        {/* 2. Weekly Manual Planning */}
        {activeTab === 'weekly' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-500 block mb-1">Category to Configure</label>
              <select
                value={selectedPlanCategory}
                onChange={(e) => setSelectedPlanCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold"
              >
                {Object.values(categoryPlans).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-500 block mb-1">
                Weekly Target Hours ({currentPlan.title})
              </label>
              <input
                type="number"
                step="0.5"
                value={currentPlan.weeklyTargetHours}
                onChange={(e) => updateCategoryPlan(selectedPlanCategory, { weeklyTargetHours: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 border border-slate-200/80 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-200 block">Weekly Routine Days</span>
              <p className="text-slate-500 text-[11px]">
                {currentPlan.weeklyScheduleSummary.join(' • ')}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#0082ff] text-white rounded-xl font-bold"
              >
                Save Weekly Target
              </button>
            </div>
          </div>
        )}

        {/* 3. Monthly Manual Planning */}
        {activeTab === 'monthly' && (
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-500 block mb-1">Category to Configure</label>
              <select
                value={selectedPlanCategory}
                onChange={(e) => setSelectedPlanCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold"
              >
                {Object.values(categoryPlans).map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-500 block mb-1">Monthly Deliverable Goal</label>
              <input
                type="text"
                value={currentPlan.monthlyGoalTitle}
                onChange={(e) => updateCategoryPlan(selectedPlanCategory, { monthlyGoalTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-500 block mb-1">Target Verification Metric</label>
              <input
                type="text"
                value={currentPlan.monthlyTargetMetric}
                onChange={(e) => updateCategoryPlan(selectedPlanCategory, { monthlyTargetMetric: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-500 block mb-1">Monthly Volume Target (Hours)</label>
              <input
                type="number"
                value={currentPlan.monthlyTargetHours}
                onChange={(e) => updateCategoryPlan(selectedPlanCategory, { monthlyTargetHours: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#0082ff] text-white rounded-xl font-bold"
              >
                Save Monthly Plan
              </button>
            </div>
          </div>
        )}

        {/* 4. Systematic Templates */}
        {activeTab === 'systematic' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-500">
              Apply a proven system template across all categories in 1-click:
            </p>

            <div 
              onClick={() => {
                applySystematicPreset('balanced');
                alert('Applied Balanced Mastery preset!');
                onClose();
              }}
              className="p-4 rounded-2xl border border-slate-200 hover:border-[#0082ff] dark:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-slate-800 cursor-pointer transition space-y-1"
            >
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>⚡ Balanced Mastery Protocol</span>
                <span className="text-[#0082ff] text-[11px]">Apply</span>
              </h4>
              <p className="text-slate-500 text-[11px]">
                Evenly distributes 5–6h weekly across Chess, Music, Exercise, Art, and Deep Work.
              </p>
            </div>

            <div 
              onClick={() => {
                applySystematicPreset('focus');
                alert('Applied Intensive Focus preset (+25% volume)!');
                onClose();
              }}
              className="p-4 rounded-2xl border border-slate-200 hover:border-purple-500 dark:border-slate-700 hover:bg-purple-50/50 dark:hover:bg-slate-800 cursor-pointer transition space-y-1"
            >
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>🔥 High-Velocity Sprint (+25% Hours)</span>
                <span className="text-purple-600 text-[11px]">Apply</span>
              </h4>
              <p className="text-slate-500 text-[11px]">
                Elevates weekly hours budget and monthly deliverable goals for peak execution cycles.
              </p>
            </div>

            <div 
              onClick={() => {
                applySystematicPreset('reset');
                alert('Reset plans to standard baseline!');
                onClose();
              }}
              className="p-4 rounded-2xl border border-slate-200 hover:border-slate-400 dark:border-slate-700 cursor-pointer transition space-y-1 text-slate-600"
            >
              <h4 className="font-bold flex items-center justify-between">
                <span>Standard Baseline Template</span>
                <span className="text-[11px]">Restore</span>
              </h4>
              <p className="text-slate-400 text-[11px]">
                Restores standard Apex Horizon 11-domain distribution.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Conflict Modal */}
      <ScheduleConflictNotificationModal
        conflict={scheduleConflict}
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onApplySuggestedTime={(suggestedTime) => {
          setTaskTime(suggestedTime);
        }}
      />
    </div>
  );
};
