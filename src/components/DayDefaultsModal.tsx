import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Edit2, Check, Clock, Sparkles, 
  Dumbbell, Swords, Palette, Music, Building2, TrendingUp, BookOpen, Shield, Copy
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { DomainType, ScheduleTask } from '../types';
import { soundEngine } from '../utils/audio';

interface DayDefaultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDayOfWeek?: number;
}

const WEEKDAYS = [
  { day: 1, nameEn: 'Monday', shortEn: 'Mon', am: 'ሰኞ', icon: '⚡' },
  { day: 2, nameEn: 'Tuesday', shortEn: 'Tue', am: 'ማክሰኞ', icon: '🎯' },
  { day: 3, nameEn: 'Wednesday', shortEn: 'Wed', am: 'ረቡዕ', icon: '🔥' },
  { day: 4, nameEn: 'Thursday', shortEn: 'Thu', am: 'ሐሙስ', icon: '🚀' },
  { day: 5, nameEn: 'Friday', shortEn: 'Fri', am: 'አርብ', icon: '✨' },
  { day: 6, nameEn: 'Saturday', shortEn: 'Sat', am: 'ቅዳሜ', icon: '🏆' },
  { day: 7, nameEn: 'Sunday', shortEn: 'Sun', am: 'እሁድ 🌿', icon: '🕊️', isRest: true },
];

export const DayDefaultsModal: React.FC<DayDefaultsModalProps> = ({
  isOpen,
  onClose,
  initialDayOfWeek = 1
}) => {
  const {
    language,
    categoryPlans,
    getCategoryTitleTranslated,
    getWeekdayDefaultTasks,
    updateWeekdayDefaultSchedule,
  } = useLivotion();

  const [activeDay, setActiveDay] = useState<number>(initialDayOfWeek);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<string>('chess');
  const [newStartTime, setNewStartTime] = useState('08:00 AM');
  const [newDurationMin, setNewDurationMin] = useState<number>(45);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editDurationMin, setEditDurationMin] = useState(45);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDefaults = getWeekdayDefaultTasks(activeDay);
  const activeDayMeta = WEEKDAYS.find((w) => w.day === activeDay) || WEEKDAYS[0];

  const getDomainForCat = (catId: string): DomainType => {
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

  const getCatIcon = (catId: string) => {
    switch (catId) {
      case 'exercise': return Dumbbell;
      case 'chess': return Swords;
      case 'art': return Palette;
      case 'music': return Music;
      case 'architecture': return Building2;
      case 'trading': return TrendingUp;
      case 'devotion': return BookOpen;
      default: return Shield;
    }
  };

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleAddDefaultBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const catPlan = categoryPlans[newCategory] || categoryPlans['chess'];
    const newBlock: Omit<ScheduleTask, 'id' | 'date'> = {
      domain: getDomainForCat(newCategory),
      title: newTitle.trim(),
      startTime: newStartTime.trim() || 'Flexible',
      durationMin: Number(newDurationMin),
      completed: false,
      color: catPlan?.color || '#0082ff',
      badge: catPlan?.title?.split(' ')[0] || 'Focus',
      dayOfWeek: activeDay,
      checklist: [
        { id: `c-${Date.now()}-1`, text: 'Warm-up & context setup', done: false },
        { id: `c-${Date.now()}-2`, text: 'Core deliberate execution', done: false }
      ]
    };

    updateWeekdayDefaultSchedule(activeDay, [...currentDefaults, newBlock]);
    setNewTitle('');
    setIsAdding(false);
    showToast(language === 'am' ? 'ነባሪ ብሎክ ተጨምሯል!' : 'Default block added!');
    try { soundEngine.playPencil(); } catch {}
  };

  const handleDeleteDefaultBlock = (taskId: string) => {
    const updated = currentDefaults.filter((t) => t.id !== taskId);
    updateWeekdayDefaultSchedule(activeDay, updated);
    showToast(language === 'am' ? 'ነባሪ ብሎክ ተሰርዟል!' : 'Default block removed!');
    try { soundEngine.playPencil(); } catch {}
  };

  const handleStartEdit = (t: ScheduleTask) => {
    setEditingTaskId(t.id);
    setEditTitle(t.title);
    setEditStartTime(t.startTime || '08:00 AM');
    setEditDurationMin(t.durationMin || 45);
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editTitle.trim()) return;
    const updated = currentDefaults.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          title: editTitle.trim(),
          startTime: editStartTime.trim() || 'Flexible',
          durationMin: Number(editDurationMin)
        };
      }
      return t;
    });
    updateWeekdayDefaultSchedule(activeDay, updated);
    setEditingTaskId(null);
    showToast(language === 'am' ? 'ለውጡ ተቀምጧል!' : 'Changes saved!');
    try { soundEngine.playPencil(); } catch {}
  };

  const handleCopyMonToActive = () => {
    const monDefaults = getWeekdayDefaultTasks(1);
    if (monDefaults.length === 0) return;
    const cloned = monDefaults.map((t) => ({
      ...t,
      dayOfWeek: activeDay,
      completed: false
    }));
    updateWeekdayDefaultSchedule(activeDay, cloned);
    showToast(language === 'am' ? 'የሰኞ ነባሪ ዕቅድ ወደዚህ ቀን ተቀድቷል!' : `Copied Monday routine to ${activeDayMeta.nameEn}!`);
    try { soundEngine.playPencil(); } catch {}
  };

  const handleCopyActiveToAllWeekdays = () => {
    if (currentDefaults.length === 0) return;
    for (let day = 1; day <= 5; day++) {
      if (day !== activeDay) {
        const cloned = currentDefaults.map((t) => ({
          ...t,
          dayOfWeek: day,
          completed: false
        }));
        updateWeekdayDefaultSchedule(day, cloned);
      }
    }
    showToast(language === 'am' ? 'ይህ ነባሪ ዕቅድ ለሁሉም የስራ ቀናት (ሰኞ-አርብ) ተቀድቷል!' : `Applied ${activeDayMeta.nameEn} routine to all weekdays (Mon-Fri)!`);
    try { soundEngine.playPencil(); } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {language === 'am' ? 'የቀን ነባሪ የጊዜ ሰሌዳዎች አስተዳዳሪ' : 'Day Default Routine Templates'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'am'
                ? 'ለእያንዳንዱ የሳምንቱ ቀን ነባሪ ብሎኮችን ያዘጋጁ። ለተወሰነ ቀን ብቻ ለውጥ ሲያደርጉ ይህ ነባሪ አይቀየርም።'
                : 'Configure default routines for each day of the week. Specific date edits will override these templates independently.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast Feedback */}
        {feedbackMsg && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0 animate-fadeIn">
            <Check size={14} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Weekday Selector Tabs (Mon..Sun) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          {WEEKDAYS.map((w) => {
            const isSelected = activeDay === w.day;
            const dayTasksCount = getWeekdayDefaultTasks(w.day).length;
            return (
              <button
                key={w.day}
                type="button"
                onClick={() => {
                  setActiveDay(w.day);
                  setIsAdding(false);
                  setEditingTaskId(null);
                }}
                className={`px-3 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                  isSelected
                    ? 'bg-[#0082ff] text-white border-[#0082ff] shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{w.icon}</span>
                <span>{language === 'am' ? w.am : w.shortEn}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {dayTasksCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Meta & Bulk Quick Actions */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{activeDayMeta.icon}</span>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                {language === 'am' ? `የ${activeDayMeta.am} ነባሪ ዕቅድ` : `${activeDayMeta.nameEn} Default Template`}
              </h4>
              <span className="text-[10px] text-slate-400">
                {currentDefaults.length} {language === 'am' ? 'ነባሪ ብሎኮች' : 'default blocks scheduled'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {activeDay !== 1 && (
              <button
                type="button"
                onClick={handleCopyMonToActive}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition flex items-center gap-1"
                title="Copy Monday's default template here"
              >
                <Copy size={11} />
                <span>{language === 'am' ? 'የሰኞን ቅዳ' : 'Copy Mon'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyActiveToAllWeekdays}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition flex items-center gap-1"
              title="Apply this template to Mon-Fri"
            >
              <Copy size={11} />
              <span>{language === 'am' ? 'ለሁሉም የስራ ቀናት አድርግ' : 'Apply to Mon-Fri'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs"
            >
              <Plus size={12} />
              <span>{isAdding ? (language === 'am' ? 'ዝጋ' : 'Close') : (language === 'am' ? '+ ብሎክ አክል' : '+ Add Block')}</span>
            </button>
          </div>
        </div>

        {/* Add Block Form */}
        {isAdding && (
          <form onSubmit={handleAddDefaultBlock} className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0082ff]">
              <Sparkles size={14} />
              <span>{language === 'am' ? `ለ${activeDayMeta.am} አዲስ ነባሪ ብሎክ ጨምር` : `Add New Default Block for ${activeDayMeta.nameEn}`}</span>
            </div>

            <input
              type="text"
              required
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={language === 'am' ? 'የትኩረት ተግባር ርዕስ (ምሳሌ፡ ቼስ፣ ጊታር፣ ጂም)...' : 'Block title (e.g. Chess calculation, Music practice, Gym)...'}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-[#0082ff]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  {language === 'am' ? 'ዘርፍ' : 'Pillar Stream'}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                >
                  {Object.values(categoryPlans).map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCategoryTitleTranslated(c.id, c.title)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  {language === 'am' ? 'መጀመሪያ ሰዓት' : 'Start Time'}
                </label>
                <input
                  type="text"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  placeholder="08:00 AM"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  {language === 'am' ? 'ቆይታ (ደቂቃ)' : 'Duration (min)'}
                </label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  step={5}
                  value={newDurationMin}
                  onChange={(e) => setNewDurationMin(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                {language === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                {language === 'am' ? 'አስቀምጥ' : 'Save Default Block'}
              </button>
            </div>
          </form>
        )}

        {/* Default Blocks List for this Weekday */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {currentDefaults.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-2xl">🌱</div>
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'am' ? `ለ${activeDayMeta.am} ምንም ነባሪ ብሎክ አልተመደበም` : `No default routine set for ${activeDayMeta.nameEn}`}
              </h5>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                {language === 'am'
                  ? 'የተወሰኑ ብሎኮችን በመጨመር ለእያንዳንዱ ሳምንት ይህ ቀን ሲመጣ ዝግጁ እንዲሆን ያድርጉ።'
                  : 'Add default blocks so whenever you open this day in the calendar, your preferred routine is pre-loaded.'}
              </p>
            </div>
          ) : (
            currentDefaults.map((task) => {
              const Icon = getCatIcon(task.domain.toLowerCase());
              const isEditing = editingTaskId === task.id;

              if (isEditing) {
                return (
                  <div key={task.id} className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/60 space-y-2 animate-fadeIn">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        placeholder="Time"
                        className="w-28 px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                      />
                      <input
                        type="number"
                        min={10}
                        max={240}
                        step={5}
                        value={editDurationMin}
                        onChange={(e) => setEditDurationMin(Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                      />
                      <span className="text-[11px] text-slate-400 font-mono">min</span>
                      <div className="flex-1 flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(task.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition flex items-center justify-between gap-3 group"
                  style={{ borderLeftWidth: '4px', borderLeftColor: task.color || '#0082ff' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${task.color || '#0082ff'}18`, color: task.color || '#0082ff' }}
                    >
                      <Icon size={14} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {task.title}
                        </span>
                        {task.badge && (
                          <span
                            className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md shrink-0"
                            style={{ backgroundColor: `${task.color || '#0082ff'}18`, color: task.color || '#0082ff' }}
                          >
                            {task.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} /> {task.startTime || 'Flexible'}
                        </span>
                        <span>•</span>
                        <span>{task.durationMin} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0082ff] hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition"
                      title="Edit default block"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDefaultBlock(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                      title="Delete default block"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            💡 {language === 'am' ? 'እዚህ የሚደረጉ ለውጦች ነባሪ ዕቅድን ለሚጠቀሙ ቀናት ሁሉ ይተገበራሉ።' : 'Edits update the reusable template for uncustomized days.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
          >
            {language === 'am' ? 'ተጠናቋል' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
