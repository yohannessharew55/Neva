import React, { useState } from 'react';
import { 
  X, Calendar, CalendarDays, CalendarRange, 
  Sparkles, Plus, Check, CheckCircle2, RotateCcw, 
  Sliders
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { DomainType } from '../types';

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
    applySystematicPreset 
  } = useLivotion();

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'systematic'>(defaultTab);

  // Daily task form
  const [taskCategory, setTaskCategory] = useState<string>('chess');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('02:00 PM');
  const [taskDuration, setTaskDuration] = useState(45);

  // Category select for weekly/monthly
  const [selectedPlanCategory, setSelectedPlanCategory] = useState<string>('chess');

  if (!isOpen) return null;

  const currentPlan = categoryPlans[selectedPlanCategory] || categoryPlans['chess'];

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

    addTask({
      domain: getDomainType(taskCategory),
      title: taskTitle,
      startTime: taskTime,
      durationMin: Number(taskDuration),
      completed: false,
      color: categoryPlans[taskCategory]?.color || '#0082ff',
      badge: categoryPlans[taskCategory]?.title.split(' ')[0] || 'Focus',
      checklist: [
        { id: `c-${Date.now()}-1`, text: 'Initial set up', done: false },
        { id: `c-${Date.now()}-2`, text: 'Execute deliberate focus', done: false }
      ]
    });

    setTaskTitle('');
    alert('Daily block added to your schedule!');
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
    </div>
  );
};
