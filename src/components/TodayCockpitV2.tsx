import React, { useState } from 'react';
import { 
  Play, Pause, CheckCircle2, Clock, 
  RotateCcw, Plus,
  Palette, Music, Swords, Building2, TrendingUp,
  Shield, Calendar, ChevronRight, SlidersHorizontal, ChevronDown, ChevronUp,
  ExternalLink, Dumbbell, BookOpen, Sparkles, Flame, SquarePen,
  AlarmClock, BellRing, PieChart, Check, X
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { PlanningModal } from './PlanningModal';
import { BigDailyActivitiesStickyNote } from './BigDailyActivitiesStickyNote';
import { DayCloseoutModal } from './DayCloseoutModal';
import { QuickScratchpadCard } from './QuickScratchpadCard';
import { ReminderCenterModal } from './ReminderCenterModal';
import { gregorianToEthiopian, AMHARIC_DAYS } from '../utils/ethiopianCalendar';
import { soundEngine } from '../utils/audio';

interface SundayRestHabit {
  id: string;
  text: string;
  completed: boolean;
  icon: string;
}

const DEFAULT_SUNDAY_HABITS: SundayRestHabit[] = [
  { id: 'sh-1', text: 'Spiritual Devotion, Prayer & Scripture Reflection', completed: false, icon: '📖' },
  { id: 'sh-2', text: 'Gentle Nature Walk & Deep Breathing', completed: false, icon: '🍃' },
  { id: 'sh-3', text: 'Family Connection & Wholesome Fellowship', completed: false, icon: '☕' },
  { id: 'sh-4', text: 'Read Inspiring Literature / Creative Journaling', completed: false, icon: '📚' },
  { id: 'sh-5', text: 'Restful Sleep, Recovery Nap & Physical Reset', completed: false, icon: '🛌' },
  { id: 'sh-6', text: 'Gratitude Reflection & Peaceful Week Ahead Prep', completed: false, icon: '🧘' }
];

export const TodayCockpitV2: React.FC = () => {
  const { 
    tasks, 
    activeTask, 
    secondsRemaining, 
    isRunning, 
    startTask, 
    toggleTimer, 
    stopTimer, 
    toggleTaskCompletion, 
    categoryPlans,
    setSelectedCategoryId,
    setActiveTab,
    language,
    t,
    getCategoryTitleTranslated
  } = useLivotion();

  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showCloseoutModal, setShowCloseoutModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('neva_today_header_expanded');
      return saved === 'true'; // Default is false (hidden / collapsed)
    } catch {
      return false;
    }
  });

  const toggleHeaderExpanded = () => {
    setIsHeaderExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('neva_today_header_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const getDomainTypesForCat = (catId: string): DomainType[] => {
    switch (catId) {
      case 'exercise': return ['PHYSICAL_FITNESS'];
      case 'chess': return ['CHESS'];
      case 'art': return ['OIL_PAINTING'];
      case 'music': return ['GUITAR'];
      case 'architecture': return ['ARCHITECTURE_DESIGN', 'SITE_SUPERVISION'];
      case 'trading': return ['FOREX_TRADING'];
      case 'devotion': return ['DEVOTION_PRAYER'];
      case 'buffer': return ['OPEN_MULTIPURPOSE', 'RECREATION', 'CONTENT_CREATION'];
      default: return [catId.toUpperCase() as DomainType];
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
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

  const allCategories = Object.values(categoryPlans);

  const formatClock = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Date formatting for Today
  const now = new Date();
  const ethDate = gregorianToEthiopian(now);
  const dayNameEn = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDayEn = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dayNameAm = AMHARIC_DAYS[now.getDay()]?.am || '';
  const ethMonthName = ethDate.monthNameAm;
  
  const todayDateDisplay = language === 'am' 
    ? `${dayNameAm}፣ ${ethMonthName} ${ethDate.day} (${monthDayEn})`
    : `${dayNameEn}, ${monthDayEn} • ${ethDate.monthNameEn} ${ethDate.day}`;

  // Today's metrics
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalHoursPlanned = (tasks.reduce((sum, t) => sum + (t.durationMin || 0), 0) / 60).toFixed(1);
  const remainingHours = (tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.durationMin || 0), 0) / 60).toFixed(1);

  // Up Next / Active task
  const nextTask = activeTask || tasks.find((t) => !t.completed);

  // 7-Day Consistency Dot Matrix calculation (Option 3)
  const getWeeklyMomentum = () => {
    const days = [
      { key: 'mon', labelEn: 'M', labelAm: 'ሰ', dayIndex: 1 },
      { key: 'tue', labelEn: 'T', labelAm: 'ማ', dayIndex: 2 },
      { key: 'wed', labelEn: 'W', labelAm: 'ረ', dayIndex: 3 },
      { key: 'thu', labelEn: 'T', labelAm: 'ሐ', dayIndex: 4 },
      { key: 'fri', labelEn: 'F', labelAm: 'አ', dayIndex: 5 },
      { key: 'sat', labelEn: 'S', labelAm: 'ቅ', dayIndex: 6 },
      { key: 'sun', labelEn: 'S', labelAm: 'እ', dayIndex: 0 },
    ];
    const currentJsDay = now.getDay();
    const currentMonDay = currentJsDay === 0 ? 7 : currentJsDay;

    return days.map((d) => {
      const targetMonDay = d.dayIndex === 0 ? 7 : d.dayIndex;
      const isToday = targetMonDay === currentMonDay;
      const isPast = targetMonDay < currentMonDay;
      const isCompleted = isToday ? (completedCount > 0 || progressPercent >= 50) : isPast;

      return {
        ...d,
        isToday,
        isPast,
        isCompleted
      };
    });
  };

  const weeklyMomentum = getWeeklyMomentum();
  const activeDaysCount = weeklyMomentum.filter((d) => d.isCompleted).length;

  const isSundayToday = now.getDay() === 0;
  const [showSundaySanctuary, setShowSundaySanctuary] = useState(isSundayToday);
  const [sundayHabits, setSundayHabits] = useState<SundayRestHabit[]>(() => {
    try {
      const saved = localStorage.getItem('neva_sunday_habits_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SUNDAY_HABITS;
  });
  const [newSundayHabitText, setNewSundayHabitText] = useState('');

  const toggleSundayHabit = (id: string) => {
    setSundayHabits(prev => {
      const next = prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h);
      try { localStorage.setItem('neva_sunday_habits_v1', JSON.stringify(next)); } catch {}
      return next;
    });
    try { soundEngine.playPencil(); } catch {}
  };

  const addSundayHabit = () => {
    if (!newSundayHabitText.trim()) return;
    const newHabit: SundayRestHabit = {
      id: `sh-${Date.now()}`,
      text: newSundayHabitText.trim(),
      completed: false,
      icon: '🌿'
    };
    setSundayHabits(prev => {
      const next = [...prev, newHabit];
      try { localStorage.setItem('neva_sunday_habits_v1', JSON.stringify(next)); } catch {}
      return next;
    });
    setNewSundayHabitText('');
    try { soundEngine.playPencil(); } catch {}
  };

  const deleteSundayHabit = (id: string) => {
    setSundayHabits(prev => {
      const next = prev.filter(h => h.id !== id);
      try { localStorage.setItem('neva_sunday_habits_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 space-y-4 sm:space-y-6 max-w-full overflow-x-clip">
      
      {/* 1. Header: Minimal Collapsed Date Strip OR Full Expanded Summary (Hidden by default, seen on expand) */}
      {!isHeaderExpanded ? (
        <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 px-3.5 sm:px-4 shadow-2xs flex items-center justify-between gap-2 transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#0082ff]/10 text-[#0082ff] uppercase tracking-wider shrink-0">
              {language === 'am' ? 'የዛሬ እቅድ' : 'TODAY'}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {todayDateDisplay}
            </span>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              • {completedCount}/{totalCount} {language === 'am' ? 'ተጠናቋል' : 'Done'} ({progressPercent}%)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSundaySanctuary(prev => !prev)}
              className={`p-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer border ${
                isSundayToday || showSundaySanctuary
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              title="Sunday Rest & Relaxation Sanctuary"
            >
              <span>🌿</span>
              <span className="text-[10px] sm:text-xs font-semibold">{language === 'am' ? 'እሁድ' : 'Sunday Rest'}</span>
            </button>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 flex items-center gap-1">
              <Flame size={11} className="text-amber-500 fill-amber-500" />
              <span>{activeDaysCount}/7</span>
            </span>

            <button
              onClick={toggleHeaderExpanded}
              className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
              title={language === 'am' ? 'ማጠቃለያውን ዘርጋ' : "Expand Today's Summary & Momentum"}
            >
              <span className="text-[10px] sm:text-xs font-semibold">{language === 'am' ? 'ዘርጋ' : 'Expand'}</span>
              <ChevronDown size={14} className="text-[#0082ff]" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start justify-between sm:block">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0082ff]/10 text-[#0082ff] uppercase tracking-wider">
                    {language === 'am' ? 'የዛሬ እቅድ' : 'TODAY'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {todayDateDisplay}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                  {language === 'am' ? 'የዛሬ ትኩረትና ተግባራት' : "Today's Focus & Execution"}
                </h1>
              </div>

              {/* Mobile Collapse Button */}
              <button
                onClick={toggleHeaderExpanded}
                className="sm:hidden p-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0"
                title="Collapse"
              >
                <span className="text-[10px]">{language === 'am' ? 'አሳንስ' : 'Collapse'}</span>
                <ChevronUp size={13} className="text-[#0082ff]" />
              </button>
            </div>

            {/* Today's Live Metric Pills & Action */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="text-left sm:text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {completedCount}/{totalCount} {language === 'am' ? 'ተጠናቋል' : 'Done'} ({progressPercent}%)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    • {remainingHours}h {language === 'am' ? 'ቀሪ' : 'left'}
                  </span>
                </div>
                <div className="w-36 sm:w-44 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-[#0082ff] h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>

              {/* Option 2: 60-Second Day Closeout Button */}
              <button
                onClick={() => setShowCloseoutModal(true)}
                className="p-2 sm:px-3 sm:py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-[#0082ff] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                title={language === 'am' ? 'የቀኑን ስራ ዝጋና ማጠቃለያ አስቀምጥ' : 'Close out today with evening receipt'}
              >
                <Sparkles size={14} className="text-[#0082ff]" />
                <span className="hidden sm:inline">{language === 'am' ? 'ማጠቃለያ' : 'Close Out'}</span>
              </button>

              <button
                onClick={() => setShowPlanningModal(true)}
                className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title={language === 'am' ? 'መርሐግብር አዘጋጅ' : 'Open Planner'}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">{language === 'am' ? 'መርሐግብር' : 'Planner'}</span>
              </button>

              {/* Desktop Collapse Button */}
              <button
                onClick={toggleHeaderExpanded}
                className="hidden sm:flex p-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold items-center gap-1 transition cursor-pointer active:scale-95"
                title="Collapse summary"
              >
                <span>{language === 'am' ? 'አሳንስ' : 'Collapse'}</span>
                <ChevronUp size={14} className="text-[#0082ff]" />
              </button>
            </div>
          </div>

          {/* Option 3: 7-Day Consistency Dot Matrix (Minimalist Momentum Tracker) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {language === 'am' ? 'ሳምንታዊ ፍሰት' : 'Week Momentum'}:
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {weeklyMomentum.map((d) => (
                  <div 
                    key={d.key} 
                    className="flex flex-col items-center gap-0.5"
                    title={`${d.labelEn} - ${d.isCompleted ? 'Active Flow' : d.isToday ? 'Today' : 'Upcoming'}`}
                  >
                    <span className={`text-[9px] font-mono font-bold ${
                      d.isToday ? 'text-[#0082ff]' : 'text-slate-400'
                    }`}>
                      {language === 'am' ? d.labelAm : d.labelEn}
                    </span>
                    <div className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      d.isCompleted
                        ? 'bg-[#0082ff] text-white shadow-xs'
                        : d.isToday
                        ? 'border-2 border-[#0082ff] text-[#0082ff] bg-blue-50/50 dark:bg-blue-950/30'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-300 dark:text-slate-600'
                    }`}>
                      {d.isCompleted ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center gap-1">
                <Flame size={12} className="text-amber-500 fill-amber-500" />
                <span>{activeDaysCount}/7 {language === 'am' ? 'ቀናት' : 'Active'}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sunday Official Rest & Relaxation Sanctuary */}
      {(isSundayToday || showSundaySanctuary) && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 dark:from-emerald-950/30 dark:via-teal-950/15 dark:to-slate-900 border-2 border-emerald-400/80 dark:border-emerald-700/80 shadow-md space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
                🌿
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500 text-white uppercase tracking-wider">
                    {language === 'am' ? 'ይፋዊ የእረፍት ቀን' : 'Official Rest Day'}
                  </span>
                  <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                    {language === 'am' ? 'እሁድ' : 'Sunday'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {language === 'am' ? 'የእሁድ እረፍትና የመዝናናት ማዕከል' : 'Sunday Rest & Relaxation Sanctuary'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                {sundayHabits.filter(h => h.completed).length}/{sundayHabits.length} {language === 'am' ? 'ተጠናቋል' : 'recharged'}
              </div>
              {!isSundayToday && (
                <button
                  onClick={() => setShowSundaySanctuary(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Hide"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Serene Rest Quote */}
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-900/40 text-xs italic text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="text-emerald-500 font-bold text-sm">❝</span>
            <span>
              {language === 'am'
                ? 'እረፍት ስንፍና አይደለም—ለሚቀጥለው ሳምንት ከፍተኛ ውጤታማነትና ትኩረት የሚሰጥ የተቀደሰ መሰረት ነው።'
                : 'Rest is not a lack of momentum—it is the holy foundation that powers deep focus and mastery for the upcoming week.'}
            </span>
            <span className="text-emerald-500 font-bold text-sm">❞</span>
          </div>

          {/* Relaxing Activities & Habits */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sundayHabits.map((habit) => (
                <div
                  key={habit.id}
                  className={`p-2.5 rounded-2xl border transition flex items-center justify-between group ${
                    habit.completed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-800/60'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <button
                    onClick={() => toggleSundayHabit(habit.id)}
                    className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      habit.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {habit.completed && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="text-sm shrink-0">{habit.icon}</span>
                    <span className={`text-xs truncate ${habit.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
                      {habit.text}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteSundayHabit(habit.id)}
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-1 cursor-pointer transition shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Inline add custom Sunday relaxing habit */}
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="text"
                value={newSundayHabitText}
                onChange={(e) => setNewSundayHabitText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSundayHabit();
                  }
                }}
                placeholder={language === 'am' ? '+ የእሁድ መዝናኛ ተግባር ጻፍና Enter ንካ...' : '+ Add relaxing habit or family reflection (press Enter)...'}
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs outline-none focus:border-emerald-500"
              />
              <button
                onClick={addSundayHabit}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus size={13} /> {language === 'am' ? 'አክል' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. The Stationary Sticky Note: Central Hub & First Impression for Today's Execution */}
      <BigDailyActivitiesStickyNote />

      {/* Active Focus Session Timer (if currently running) */}
      {activeTask && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0082ff] animate-ping" />
                {language === 'am' ? 'ትኩረት በሂደት ላይ' : 'Active Focus Session'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {activeTask.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={12} /> {activeTask.startTime} • {activeTask.durationMin} {language === 'am' ? 'ደቂቃዎች' : 'minutes'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl font-mono font-extrabold text-[#0082ff] tracking-tight">
                {formatClock(secondsRemaining)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTimer}
                  className="p-3 sm:p-3.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
                  title={isRunning ? 'Pause' : 'Start'}
                >
                  {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <button
                  onClick={stopTimer}
                  className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 24-Hour Balance (8/8/8) Preview Card - Minimal Words & Ultra Clean */}
      <div 
        onClick={() => setActiveTab('triple-eight')}
        className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#121927] border border-indigo-200/70 dark:border-indigo-900/40 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-700 transition group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <PieChart size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {language === 'am' ? '24 ሰዓት ሚዛን' : '24h Balance'}
              </span>
              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                8/8/8
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {language === 'am' ? 'እንቅልፍ (8h) • ሥራ (8h) • ሕይወት (8h)' : 'Sleep (8h) • Career (8h) • Living (8h)'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveTab('triple-eight');
          }}
          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
        >
          <span>{language === 'am' ? 'ክፈት' : 'Open'}</span>
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Up Next Task for Today (when no active timer is running and tasks exist) */}
      {!activeTask && nextTask && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                {language === 'am' ? 'ቀጣይ የትኩረት ክፍለ-ጊዜ' : 'Up Next Today'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {nextTask.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Clock size={11} /> {nextTask.startTime} • {nextTask.durationMin} {language === 'am' ? 'ደቂቃዎች' : 'minutes'}
              </p>
            </div>

            <button
              onClick={() => startTask(nextTask)}
              className="px-4 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <Play size={13} fill="currentColor" /> {language === 'am' ? 'ትኩረት ጀምር' : 'Start Focus Block'}
            </button>
          </div>
        </div>
      )}

      {/* Option 4: Quick Scratchpad / "Parking Lot" Micro-Sticky */}
      <QuickScratchpadCard onOpenAppleNotes={() => setActiveTab('notes')} />

      {/* 4. Core Pillars Quick Access: Clean, lightweight cards to jump to any category plan without cluttering today's landing page */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">
            {language === 'am' ? 'የዋና ዋና ክፍሎች እቅዶች' : 'Core Pillars & Milestones'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {language === 'am' ? 'ሙሉ እቅዶችን ለማየት ይንኩ' : 'Tap any pillar for full plan'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {allCategories.map((cat) => {
            const Icon = getIcon(cat.id);
            const domainTypes = getDomainTypesForCat(cat.id);
            const todayTasks = tasks.filter((t) => domainTypes.includes(t.domain));
            const completedToday = todayTasks.filter((t) => t.completed).length;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className="p-3 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 hover:border-[#0082ff]/50 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-2xs hover:shadow-xs group"
                title={`Open full ${cat.title} roadmap`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0082ff]">
                      {getCategoryTitleTranslated(cat.id, cat.title)}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {todayTasks.length > 0 
                        ? `${completedToday}/${todayTasks.length} ${language === 'am' ? 'ተጠናቋል' : 'done'}` 
                        : (language === 'am' ? 'ዛሬ ክፍት' : '0 scheduled')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={13} className="text-slate-400 group-hover:text-[#0082ff] shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Planning Modal */}
      <PlanningModal
        isOpen={showPlanningModal}
        onClose={() => setShowPlanningModal(false)}
      />

      {/* Option 2: 60-Second Day Closeout Evening Receipt Modal */}
      <DayCloseoutModal
        isOpen={showCloseoutModal}
        onClose={() => setShowCloseoutModal(false)}
        onNavigateToGallery={() => setActiveTab('notes-gallery')}
      />

      {/* Mobile Alarms & Reminders Hub Modal */}
      <ReminderCenterModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
    </div>
  );
};
