import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, 
  Clock, Plus, CheckCircle2, Play, Filter, Globe, Sparkles, Check, Trash2, Edit3,
  Dumbbell, Swords, Palette, Music, Building2, TrendingUp, BookOpen, Shield,
  ArrowRight, X, ListChecks, CheckSquare, Square, Target, Award, Flame, Zap
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { 
  gregorianToEthiopian, 
  ethiopianToGregorian, 
  getEthiopianMonthCalendar, 
  ETHIOPIAN_MONTHS, 
  AMHARIC_DAYS, 
  formatDualDate 
} from '../utils/ethiopianCalendar';
import { BigDailyActivitiesStickyNote } from './BigDailyActivitiesStickyNote';
import { DomainType, PriorityLevel, ScheduleTask } from '../types';
import { soundEngine } from '../utils/audio';

type CalendarMode = 'ethiopian' | 'gregorian' | 'dual';
type PlannerHorizon = 'daily' | 'weekly' | 'monthly';

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

const WEEK_DAYS = [
  { id: 'Mon', en: 'Mon', am: 'ሰኞ', isRest: false },
  { id: 'Tue', en: 'Tue', am: 'ማክ', isRest: false },
  { id: 'Wed', en: 'Wed', am: 'ረቡ', isRest: false },
  { id: 'Thu', en: 'Thu', am: 'ሐሙ', isRest: false },
  { id: 'Fri', en: 'Fri', am: 'አር', isRest: false },
  { id: 'Sat', en: 'Sat', am: 'ቅዳ', isRest: false },
  { id: 'Sun', en: 'Sun 🌿', am: 'እሁ 🌿', isRest: true },
];

export const IntegratedCalendarView: React.FC = () => {
  const { 
    tasks, 
    addTask,
    deleteTask,
    updateTask,
    categoryPlans, 
    getCategoryLiveMetrics,
    updateCategorySchedule,
    updateCategoryMonthlyDeliverable,
    addCategoryDailyPlan,
    toggleCategoryDailyPlan,
    deleteCategoryDailyPlan,
    startTask, 
    toggleTaskCompletion, 
    toggleChecklistItem,
    setSelectedCategoryId,
    openNewCategoryModal,
    setActiveTab,
    language,
    t,
    getCategoryTitleTranslated
  } = useLivotion();

  const today = new Date();
  const todayEth = gregorianToEthiopian(today);

  // Horizon State (Daily, Weekly, Monthly) with persistence
  const [horizon, setHorizon] = useState<PlannerHorizon>(() => {
    try {
      const saved = localStorage.getItem('neva_scheduler_horizon');
      if (saved === 'daily' || saved === 'weekly' || saved === 'monthly') return saved;
    } catch {}
    return 'daily';
  });

  const handleSelectHorizon = (h: PlannerHorizon) => {
    setHorizon(h);
    try {
      localStorage.setItem('neva_scheduler_horizon', h);
    } catch {}
  };

  // Calendar Mode
  const [mode, setMode] = useState<CalendarMode>(() => {
    try {
      const saved = localStorage.getItem('neva_calendar_mode');
      if (saved === 'ethiopian' || saved === 'gregorian' || saved === 'dual') return saved;
    } catch {}
    return 'ethiopian';
  });

  const handleSelectMode = (m: CalendarMode) => {
    setMode(m);
    try {
      localStorage.setItem('neva_calendar_mode', m);
    } catch {}
  };

  // Active Date Selection
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedEthYear, setSelectedEthYear] = useState<number>(todayEth.year);
  const [selectedEthMonth, setSelectedEthMonth] = useState<number>(todayEth.month);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showStickyModal, setShowStickyModal] = useState(false);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Quick Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalTab, setPlanModalTab] = useState<'block' | 'daily_focus' | 'weekly_target' | 'monthly_deliverable'>('block');
  
  // Quick Add Block Form State
  const [blockCategory, setBlockCategory] = useState<string>('exercise');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockTime, setBlockTime] = useState('08:00 AM');
  const [blockDuration, setBlockDuration] = useState(45);
  const [blockPriority, setBlockPriority] = useState<PriorityLevel>('DEEP_WORK');

  // Quick Focus Item Form State
  const [focusCategory, setFocusCategory] = useState<string>('exercise');
  const [focusText, setFocusText] = useState('');

  // Quick Weekly Target Form State
  const [weeklyCategory, setWeeklyCategory] = useState<string>('exercise');
  const [weeklyHoursInput, setWeeklyHoursInput] = useState(5);
  const [weeklySlotsInput, setWeeklySlotsInput] = useState('Mon, Wed, Fri 07:00 AM');

  // Quick Monthly Deliverable Form State
  const [monthlyCategory, setMonthlyCategory] = useState<string>('exercise');
  const [monthlyGoalInput, setMonthlyGoalInput] = useState('');
  const [monthlyMetricInput, setMonthlyMetricInput] = useState('');
  const [monthlyHoursTargetInput, setMonthlyHoursTargetInput] = useState(20);

  // Inline Quick Add Focus State for Daily Plan view
  const [inlineFocusInputs, setInlineFocusInputs] = useState<Record<string, string>>({});

  // Sunday Rest Habits State
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

  const isSelectedSunday = selectedDate.getDay() === 0;

  // Day Picker State for Weekly Tab in Quick Plan Modal
  const [selectedModalWeeklyDays, setSelectedModalWeeklyDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [modalWeeklyDefaultTime, setModalWeeklyDefaultTime] = useState('07:00 AM');

  const handleToggleModalDay = (dayId: string) => {
    setSelectedModalWeeklyDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleApplyModalDays = () => {
    if (selectedModalWeeklyDays.length === 0) return;
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sorted = [...selectedModalWeeklyDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    const newSlots = sorted.map(d => `${d} ${modalWeeklyDefaultTime}`);
    setWeeklySlotsInput(newSlots.join(', '));
  };

  // Active Dual Date formatting
  const activeDualDate = formatDualDate(selectedDate);
  const todayDualDate = formatDualDate(today);

  // Category List
  const categoryList = Object.values(categoryPlans);

  // Category Icon Resolver
  const getCategoryIcon = (catId: string) => {
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

  // Domain resolver
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

  // Ethiopian month data for Monthly view
  const ethMonthData = getEthiopianMonthCalendar(selectedEthYear, selectedEthMonth);

  // Time conversion helper for sorting
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Helper: Get 7 days of the active week (Monday to Sunday)
  const getWeekDays = (refDate: Date): Date[] => {
    const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const day = d.getDay(); // 0 is Sun, 1 is Mon
    const distToMon = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - distToMon);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nd = new Date(monday);
      nd.setDate(monday.getDate() + i);
      days.push(nd);
    }
    return days;
  };

  const weekDays = getWeekDays(selectedDate);

  // Filter Tasks for a given Date
  const getTasksForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayOfWeek = (date.getDay() + 6) % 7 + 1; // 1 = Mon, ..., 7 = Sun
    
    return tasks.filter((t) => {
      // Stream filter
      if (selectedCategoryFilter !== 'all') {
        const cat = categoryPlans[selectedCategoryFilter];
        if (cat) {
          const catId = cat.id.toLowerCase();
          const domStr = String(t.domain || '').toLowerCase();
          const badgeStr = String(t.badge || '').toLowerCase();
          const titleStr = String(t.title || '').toLowerCase();
          if (!domStr.includes(catId) && !badgeStr.includes(catId) && !titleStr.includes(catId)) {
            return false;
          }
        }
      }

      // If specific date attached, must match
      if (t.date) {
        return t.date === dateStr;
      }

      // If dayOfWeek attached, must match
      if (t.dayOfWeek) {
        return t.dayOfWeek === dayOfWeek;
      }

      // Default: daily recurring block
      return true;
    }).sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  };

  // Day Navigation handlers
  const handlePrevDay = () => {
    const nd = new Date(selectedDate);
    nd.setDate(nd.getDate() - 1);
    setSelectedDate(nd);
    const eth = gregorianToEthiopian(nd);
    setSelectedEthYear(eth.year);
    setSelectedEthMonth(eth.month);
  };

  const handleNextDay = () => {
    const nd = new Date(selectedDate);
    nd.setDate(nd.getDate() + 1);
    setSelectedDate(nd);
    const eth = gregorianToEthiopian(nd);
    setSelectedEthYear(eth.year);
    setSelectedEthMonth(eth.month);
  };

  const handleJumpToday = () => {
    setSelectedDate(today);
    setSelectedEthYear(todayEth.year);
    setSelectedEthMonth(todayEth.month);
  };

  // Week Navigation handlers
  const handlePrevWeek = () => {
    const nd = new Date(selectedDate);
    nd.setDate(nd.getDate() - 7);
    setSelectedDate(nd);
    const eth = gregorianToEthiopian(nd);
    setSelectedEthYear(eth.year);
    setSelectedEthMonth(eth.month);
  };

  const handleNextWeek = () => {
    const nd = new Date(selectedDate);
    nd.setDate(nd.getDate() + 7);
    setSelectedDate(nd);
    const eth = gregorianToEthiopian(nd);
    setSelectedEthYear(eth.year);
    setSelectedEthMonth(eth.month);
  };

  // Month Navigation handlers
  const handlePrevMonth = () => {
    if (selectedEthMonth === 1) {
      setSelectedEthMonth(13);
      setSelectedEthYear(selectedEthYear - 1);
    } else {
      setSelectedEthMonth(selectedEthMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedEthMonth === 13) {
      setSelectedEthMonth(1);
      setSelectedEthYear(selectedEthYear + 1);
    } else {
      setSelectedEthMonth(selectedEthMonth + 1);
    }
  };

  // Save new daily scheduled block
  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTitle.trim()) return;

    const cat = categoryPlans[blockCategory] || categoryList[0];
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const dayOfWeek = (selectedDate.getDay() + 6) % 7 + 1;

    addTask({
      domain: getDomainForCat(cat.id),
      title: blockTitle.trim(),
      startTime: blockTime,
      durationMin: Number(blockDuration),
      completed: false,
      color: cat.color,
      badge: cat.title.split(' ')[0],
      priority: blockPriority,
      date: dateStr,
      dayOfWeek,
      checklist: [
        { id: `c-${Date.now()}-1`, text: 'Initial set up & focus context', done: false },
        { id: `c-${Date.now()}-2`, text: 'High-focus deliberate practice', done: false }
      ]
    });

    setBlockTitle('');
    setShowPlanModal(false);
    try { soundEngine.playPencil(); } catch {}
  };

  // Save daily focus item
  const handleCreateFocusItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusText.trim()) return;
    addCategoryDailyPlan(focusCategory, focusText.trim());
    setFocusText('');
    setShowPlanModal(false);
    try { soundEngine.playPencil(); } catch {}
  };

  // Save weekly target & routine slots
  const handleSaveWeeklyTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const slots = weeklySlotsInput.split(',').map(s => s.trim()).filter(Boolean);
    updateCategorySchedule(weeklyCategory, slots, Number(weeklyHoursInput));
    setShowPlanModal(false);
  };

  // Save monthly deliverable
  const handleSaveMonthlyDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    updateCategoryMonthlyDeliverable(
      monthlyCategory,
      monthlyGoalInput.trim(),
      monthlyMetricInput.trim(),
      Number(monthlyHoursTargetInput)
    );
    setShowPlanModal(false);
  };

  // Inline add daily focus item for a stream
  const handleInlineAddFocus = (catId: string) => {
    const text = inlineFocusInputs[catId];
    if (!text || !text.trim()) return;
    addCategoryDailyPlan(catId, text.trim());
    setInlineFocusInputs(prev => ({ ...prev, [catId]: '' }));
    try { soundEngine.playPencil(); } catch {}
  };

  // Active day tasks
  const dailyTasks = getTasksForDate(selectedDate);
  const totalDayMinutes = dailyTasks.reduce((acc, t) => acc + (t.durationMin || 0), 0);
  const completedDayTasks = dailyTasks.filter(t => t.completed).length;
  const dayCompletionPct = dailyTasks.length > 0 ? Math.round((completedDayTasks / dailyTasks.length) * 100) : 0;

  // Filtered categories
  const activeStreamsToDisplay = selectedCategoryFilter === 'all' 
    ? categoryList 
    : categoryList.filter(c => c.id === selectedCategoryFilter);

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 animate-fadeIn">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & MULTI-HORIZON SELECTOR */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
              {language === 'am' ? 'ባለብዙ-እይታ የጊዜ ሰሌዳ' : 'Multi-Horizon Scheduler'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              🇪🇹 {todayDualDate.ethiopianStr} • 🌐 {todayDualDate.gregorianStr}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{language === 'am' ? 'የልህቀት ዋና ዘርፎች የጊዜ ሰሌዳ' : 'Main Streams Tactical Scheduler'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'am' 
              ? 'ዕለታዊ ተግባራትን፣ ሳምንታዊ ሰዓታትና ግቦችን እንዲሁም ወርሃዊ ውጤቶችን በአንድ ቦታ ይቆጣጠሩ።' 
              : 'Seamless tactical planning for your Mastery Pillars across Daily execution, Weekly cadence, and Monthly milestones.'}
          </p>
        </div>

        {/* View Switcher: [Daily Plan] [Weekly Plan] [Monthly Plan] */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              onClick={() => handleSelectHorizon('daily')}
              className={`flex items-center gap-1.5 py-1.5 px-3 sm:px-4 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                horizon === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock size={14} />
              <span>{language === 'am' ? 'ዕለታዊ ዕቅድ' : 'Daily Plan'}</span>
            </button>
            <button
              onClick={() => handleSelectHorizon('weekly')}
              className={`flex items-center gap-1.5 py-1.5 px-3 sm:px-4 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                horizon === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays size={14} />
              <span>{language === 'am' ? 'ሳምንታዊ ዕቅድ' : 'Weekly Plan'}</span>
            </button>
            <button
              onClick={() => handleSelectHorizon('monthly')}
              className={`flex items-center gap-1.5 py-1.5 px-3 sm:px-4 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                horizon === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange size={14} />
              <span>{language === 'am' ? 'ወርሃዊ ዕቅድ' : 'Monthly Plan'}</span>
            </button>
          </div>

          {/* Quick Plan / Add Block Button */}
          <button
            onClick={() => {
              setPlanModalTab(horizon === 'weekly' ? 'weekly_target' : horizon === 'monthly' ? 'monthly_deliverable' : 'block');
              setShowPlanModal(true);
            }}
            className="px-3.5 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer"
          >
            <Plus size={14} />
            <span>{language === 'am' ? '+ አዲስ ዕቅድ / ብሎክ' : '+ Add Plan / Block'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. UNIVERSAL MAIN STREAMS (PILLARS) FILTER BAR */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1 shrink-0">
          <Filter size={12} /> {language === 'am' ? 'ዋና ዘርፎች፡' : 'Main Streams:'}
        </span>
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
            selectedCategoryFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          {language === 'am' ? 'ሁሉም ዋና ዘርፎች' : 'All Main Streams'} ({categoryList.length})
        </button>

        {categoryList.map((cat) => {
          const isSelected = selectedCategoryFilter === cat.id;
          const Icon = getCategoryIcon(cat.id);
          const liveMetrics = getCategoryLiveMetrics(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs border-slate-900 dark:bg-slate-900 dark:text-white dark:border-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <Icon size={13} style={{ color: cat.color }} />
              <span>{getCategoryTitleTranslated(cat.id, cat.title)}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded-md">
                {liveMetrics.currentWeeklyHours}h
              </span>
            </button>
          );
        })}

        <button
          onClick={openNewCategoryModal}
          className="px-2.5 py-1.5 rounded-xl text-[#0082ff] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Plus size={13} /> {language === 'am' ? 'አዲስ ዘርፍ' : 'New Stream'}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. HORIZON VIEW 1: DAILY PLAN */}
      {/* ========================================================= */}
      {horizon === 'daily' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Day Navigator Bar */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition"
                title="Previous Day"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleJumpToday}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[#0082ff] font-bold text-xs cursor-pointer hover:bg-blue-100 transition"
              >
                {language === 'am' ? 'ዛሬ' : 'Today'}
              </button>
              <button
                onClick={handleNextDay}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition"
                title="Next Day"
              >
                <ChevronRight size={18} />
              </button>

              <div className="ml-2">
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{activeDualDate.ethiopianStr}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Gregorian: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeDualDate.gregorianStr}</span>
                </div>
              </div>
            </div>

            {/* Daily Metrics Chips */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs">
                <Clock size={13} className="text-[#0082ff]" />
                <span className="text-slate-500">{language === 'am' ? 'የታቀደ፡' : 'Planned:'}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {(totalDayMinutes / 60).toFixed(1)}h
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="text-slate-500">{language === 'am' ? 'የተጠናቀቀ፡' : 'Done:'}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {completedDayTasks}/{dailyTasks.length} ({dayCompletionPct}%)
                </span>
              </div>
              <button
                onClick={() => setShowStickyModal(true)}
                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-amber-100 transition"
                title="Open Daily Sticky Note"
              >
                <span>⭐</span>
                <span className="hidden sm:inline">{language === 'am' ? 'ስቲኪ ማስታወሻ' : 'Daily Sticky'}</span>
              </button>
            </div>
          </div>

          {/* Sunday Official Rest & Relaxation Sanctuary */}
          {isSelectedSunday && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-500/30 dark:border-emerald-800/50 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-sm shrink-0">
                    🕊️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {language === 'am' ? 'እሁድ፡ ይፋዊ የእረፍትና የመዝናናት ቀን' : 'Sunday: Official Rest & Relaxation Sanctuary'}
                      </h3>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        {language === 'am' ? 'እረፍት' : 'Rest Day'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'am' 
                        ? 'የአእምሮና የአካል እድሳት፣ መንፈሳዊ ጥንካሬ እና ለሚቀጥለው ሳምንት ሙሉ ጉልበት መሙያ።' 
                        : 'Deep mental & physical recharge, spiritual grounding, and serene preparation for the week ahead.'}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1 rounded-xl self-start sm:self-auto">
                  {sundayHabits.filter(h => h.completed).length}/{sundayHabits.length} {language === 'am' ? 'ተጠናቋል' : 'recharged'}
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Tactical Time-Blocked Schedule */}
            <div className="lg:col-span-7 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#0082ff]" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {language === 'am' ? 'የዕለቱ የጊዜ ሰሌዳ ብሎኮች' : "Today's Tactical Time Blocks"}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">({dailyTasks.length})</span>
                </div>
                <button
                  onClick={() => {
                    setPlanModalTab('block');
                    setShowPlanModal(true);
                  }}
                  className="text-xs font-bold text-[#0082ff] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> {language === 'am' ? 'ብሎክ ጨምር' : 'Add Block'}
                </button>
              </div>

              {dailyTasks.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0082ff] flex items-center justify-center mx-auto">
                    <Clock size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'am' ? 'ለዚህ ቀን የተመደበ ብሎክ የለም' : 'No tactical blocks scheduled for this day'}
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    {language === 'am' 
                      ? 'ለዋና ዘርፎችዎ የተወሰነ ሰዓት በመመደብ ትኩረትዎን ያጠናክሩ።' 
                      : 'Schedule a focused block for Exercise, Chess, Art, Devotion, or Architecture to drive consistent momentum.'}
                  </p>
                  <button
                    onClick={() => {
                      setPlanModalTab('block');
                      setShowPlanModal(true);
                    }}
                    className="mt-2 px-4 py-2 bg-[#0082ff] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={13} /> {language === 'am' ? 'የመጀመሪያውን ብሎክ መዝግብ' : 'Schedule First Block'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dailyTasks.map((task) => {
                    const matchedCat = categoryList.find(c => 
                      t => task.domain.toLowerCase().includes(c.id.toLowerCase()) || 
                      (task.badge && task.badge.toLowerCase().includes(c.id.toLowerCase()))
                    ) || categoryList[0];

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                          task.completed
                            ? 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-70'
                            : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:border-[#0082ff]'
                        }`}
                        style={{ borderLeftWidth: '4px', borderLeftColor: task.color || matchedCat.color }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {/* Completion Checkbox */}
                            <button
                              onClick={() => {
                                toggleTaskCompletion(task.id);
                                try { soundEngine.playPencil(); } catch {}
                              }}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                                task.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-[#0082ff]'
                              }`}
                            >
                              {task.completed && <Check size={12} strokeWidth={3} />}
                            </button>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-xs font-bold truncate ${
                                  task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {task.title}
                                </span>
                                {task.priority && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                                    {task.priority.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                                  <Clock size={10} /> {task.startTime}
                                </span>
                                <span>•</span>
                                <span>{task.durationMin} min</span>
                                <span>•</span>
                                <span style={{ color: task.color || matchedCat.color }} className="font-bold">
                                  {task.badge || matchedCat.title}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Block Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Start Timer Button */}
                            <button
                              onClick={() => {
                                startTask(task);
                                setActiveTab('practice');
                              }}
                              className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#0082ff] font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                              title="Launch Focus Session with Pomodoro Timer"
                            >
                              <Play size={12} />
                              <span className="text-[10px] hidden sm:inline">{language === 'am' ? 'ጀምር' : 'Focus'}</span>
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition"
                              title="Delete Block"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Expandable sub-checklist if present */}
                        {task.checklist && task.checklist.length > 0 && (
                          <div className="pl-7 pt-1 space-y-1">
                            {task.checklist.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => toggleChecklistItem(task.id, item.id)}
                                className="w-full text-left flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                              >
                                {item.done ? (
                                  <CheckSquare size={12} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <Square size={12} className="text-slate-400 shrink-0" />
                                )}
                                <span className={item.done ? 'line-through opacity-60' : ''}>{item.text}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 5 Cols: Main Stream Daily Focus Items & Micro-Plans */}
            <div className="lg:col-span-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ListChecks size={16} className="text-emerald-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {language === 'am' ? 'የዋና ዘርፎች ዕለታዊ ማስታወሻዎች' : 'Stream Daily Focus Checklists'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setPlanModalTab('daily_focus');
                    setShowPlanModal(true);
                  }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> {language === 'am' ? 'አክል' : 'Add Item'}
                </button>
              </div>

              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {activeStreamsToDisplay.map((cat) => {
                  const Icon = getCategoryIcon(cat.id);
                  const plans = cat.dailyPlans || [];

                  return (
                    <div 
                      key={cat.id} 
                      className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <Icon size={14} style={{ color: cat.color }} />
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {getCategoryTitleTranslated(cat.id, cat.title)}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {plans.filter(p => p.completed).length}/{plans.length}
                        </span>
                      </div>

                      {/* Checklist items */}
                      <div className="space-y-1">
                        {plans.map((p) => (
                          <div 
                            key={p.id}
                            className="flex items-center justify-between group py-1 px-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800/80 transition"
                          >
                            <button
                              onClick={() => {
                                toggleCategoryDailyPlan(cat.id, p.id);
                                try { soundEngine.playPencil(); } catch {}
                              }}
                              className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                p.completed 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {p.completed && <Check size={10} strokeWidth={3} />}
                              </div>
                              <span className={`text-xs truncate ${
                                p.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'
                              }`}>
                                {p.text}
                              </span>
                            </button>
                            <button
                              onClick={() => deleteCategoryDailyPlan(cat.id, p.id)}
                              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer transition shrink-0"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Fast inline input */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={inlineFocusInputs[cat.id] || ''}
                          onChange={(e) => setInlineFocusInputs({ ...inlineFocusInputs, [cat.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineAddFocus(cat.id);
                            }
                          }}
                          placeholder={language === 'am' ? `ለ${cat.title.split(' ')[0]} ዕለታዊ ግብ ጻፍና Enter ንካ...` : `+ Add focus item for ${cat.title.split(' ')[0]} (press Enter)...`}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] outline-none focus:border-[#0082ff]"
                        />
                        <button
                          onClick={() => handleInlineAddFocus(cat.id)}
                          className="p-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#0082ff] hover:text-white transition cursor-pointer shrink-0"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. HORIZON VIEW 2: WEEKLY PLAN */}
      {/* ========================================================= */}
      {horizon === 'weekly' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Week Navigator */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition"
                title="Previous Week"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleJumpToday}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs cursor-pointer hover:bg-indigo-100 transition"
              >
                {language === 'am' ? 'ይህ ሳምንት' : 'Current Week'}
              </button>
              <button
                onClick={handleNextWeek}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition"
                title="Next Week"
              >
                <ChevronRight size={18} />
              </button>

              <div className="ml-2">
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>
                    {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  🇪🇹 {formatDualDate(weekDays[0]).ethiopianStr.split(',')[0]} – {formatDualDate(weekDays[6]).ethiopianStr}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPlanModalTab('weekly_target');
                  setShowPlanModal(true);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Edit3 size={13} /> {language === 'am' ? 'የሳምንት ሰዓታት አድስ' : 'Edit Weekly Targets'}
              </button>
            </div>
          </div>

          {/* 7-Day Visual Matrix Columns */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'am' ? 'የ7ቱ ቀናት የጊዜ ሰሌዳ ማትሪክስ' : '7-Day Main Streams Weekly Matrix'}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {language === 'am' ? 'ዕለታዊ እቅድ ለማየት ማንኛውንም ቀን ይጫኑ' : 'Click any day to open its daily tactical plan'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {weekDays.map((dayDate, idx) => {
                const dayTasks = getTasksForDate(dayDate);
                const dayMinutes = dayTasks.reduce((acc, t) => acc + (t.durationMin || 0), 0);
                const isDayToday = dayDate.toDateString() === today.toDateString();
                const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                const isSunday = dayDate.getDay() === 0;
                const amharicDayMeta = AMHARIC_DAYS[dayDate.getDay()];
                const ethDate = gregorianToEthiopian(dayDate);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDate(dayDate);
                      handleSelectHorizon('daily');
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[160px] ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/60 border-[#0082ff] ring-2 ring-[#0082ff] shadow-md'
                        : isDayToday
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700 shadow-xs'
                        : isSunday
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60 hover:border-emerald-400 shadow-2xs'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2 mb-2">
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                            <span>{amharicDayMeta.am}</span>
                            <span className="text-slate-400 font-normal">({amharicDayMeta.en.slice(0, 3)})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {ethDate.day}
                          </div>
                        </div>
                        {isDayToday ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">
                            Today
                          </span>
                        ) : isSunday ? (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            🌿 {language === 'am' ? 'እረፍት' : 'Rest'}
                          </span>
                        ) : null}
                      </div>

                      {/* Scheduled Blocks */}
                      <div className="space-y-1.5">
                        {dayTasks.slice(0, 3).map((t, tidx) => {
                          const matchedCat = categoryList.find(c => t.domain.toLowerCase().includes(c.id.toLowerCase())) || categoryList[0];
                          return (
                            <div
                              key={tidx}
                              className="px-2 py-1 rounded-xl text-[10px] font-bold truncate flex items-center gap-1.5 shadow-2xs"
                              style={{ backgroundColor: `${matchedCat.color}15`, color: matchedCat.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: matchedCat.color }} />
                              <span className="truncate">{t.title}</span>
                            </div>
                          );
                        })}

                        {dayTasks.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-bold block pl-1">
                            +{dayTasks.length - 3} more blocks
                          </span>
                        )}

                        {dayTasks.length === 0 && (
                          <span className={`text-[10px] italic block pt-3 text-center ${
                            isSunday ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'
                          }`}>
                            {isSunday 
                              ? (language === 'am' ? '🌿 ይፋዊ የእረፍትና የመዝናናት ቀን' : '🌿 Rest & Relaxation Day')
                              : (language === 'am' ? 'ነፃ ቀን' : 'Open day')
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Day Footer with total hours */}
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{dayTasks.length} {language === 'am' ? 'ብሎኮች' : 'blocks'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {(dayMinutes / 60).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Streams Weekly Target Hours & Routine Summary */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'am' ? 'የዋና ዘርፎች ሳምንታዊ ግቦችና ሰዓታት' : 'Main Streams Weekly Hours & Cadence'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setPlanModalTab('weekly_target');
                  setShowPlanModal(true);
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> {language === 'am' ? 'አድስ' : 'Edit Cadence'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeStreamsToDisplay.map((cat) => {
                const Icon = getCategoryIcon(cat.id);
                const liveMetrics = getCategoryLiveMetrics(cat.id);
                const pct = Math.min(100, Math.round(liveMetrics.weeklyPercentile || 0));

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div 
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <Icon size={15} />
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {getCategoryTitleTranslated(cat.id, cat.title)}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono" style={{ color: cat.color }}>
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-slate-500">
                        <span>{language === 'am' ? 'የተከናወነ፡' : 'Logged:'} <strong>{liveMetrics.currentWeeklyHours}h</strong></span>
                        <span>{language === 'am' ? 'ግብ፡' : 'Target:'} <strong>{cat.weeklyTargetHours}h</strong></span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>

                    {/* Weekly Schedule Slots */}
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {cat.weeklyScheduleSummary && cat.weeklyScheduleSummary.length > 0 ? (
                        <span>📅 {cat.weeklyScheduleSummary.join(', ')}</span>
                      ) : (
                        <span className="italic">{language === 'am' ? 'የጊዜ ሰሌዳ አልተቀመጠም' : 'No set cadence defined'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. HORIZON VIEW 3: MONTHLY PLAN */}
      {/* ========================================================= */}
      {horizon === 'monthly' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Calendar Month Navigation Header */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleJumpToday}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {language === 'am' ? 'ዛሬ' : 'Today'}
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{ethMonthData.monthMeta.am} ({ethMonthData.monthMeta.en})</span>
                  <span className="text-[#0082ff] font-mono">{ethMonthData.year} ዓ.ም.</span>
                </h2>
                <span className="text-[11px] text-slate-400">
                  {language === 'am' ? 'የ30 ቀናት ወርሃዊ ዑደት' : '30-Day Monthly Tactical Cycle'}
                </span>
              </div>
            </div>

            {/* Calendar Mode Switcher & Deliverable Action */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => handleSelectMode('ethiopian')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    mode === 'ethiopian'
                      ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>🇪🇹 Ethiopian</span>
                </button>
                <button
                  onClick={() => handleSelectMode('dual')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    mode === 'dual'
                      ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-900 dark:text-purple-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>🌗 Dual View</span>
                </button>
                <button
                  onClick={() => handleSelectMode('gregorian')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    mode === 'gregorian'
                      ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Globe size={13} />
                  <span>Gregorian</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setPlanModalTab('monthly_deliverable');
                  setShowPlanModal(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Edit3 size={13} /> {language === 'am' ? 'ወርሃዊ ዒላማ አድስ' : 'Edit Deliverables'}
              </button>
            </div>
          </div>

          {/* Main Streams Monthly Deliverables & Goals Grid */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'am' ? 'የዋና ዘርፎች ወርሃዊ ውጤቶችና ዒላማዎች' : 'Main Streams Monthly Strategic Deliverables'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {activeStreamsToDisplay.map((cat) => {
                const Icon = getCategoryIcon(cat.id);
                const liveMetrics = getCategoryLiveMetrics(cat.id);
                const pct = Math.min(100, Math.round(liveMetrics.monthlyPercentile || 0));

                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: cat.color }} />
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {getCategoryTitleTranslated(cat.id, cat.title)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold" style={{ color: cat.color }}>
                        {pct}%
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={cat.monthlyGoalTitle}>
                      {cat.monthlyGoalTitle || (language === 'am' ? 'ወርሃዊ ዒላማ አልተገለጸም' : 'No monthly deliverable set')}
                    </div>

                    {cat.monthlyTargetMetric && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        {language === 'am' ? 'ዒላማ መለኪያ፡' : 'Metric:'} {cat.monthlyTargetMetric}
                      </div>
                    )}

                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main 7-Column Calendar Card */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            {/* 7 Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {AMHARIC_DAYS.map((d, idx) => (
                <div key={idx} className="py-1">
                  <span className="block sm:hidden">{d.short}</span>
                  <span className="hidden sm:block">{d.am} ({d.en.slice(0, 3)})</span>
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
              {/* Empty cells before start day */}
              {Array.from({ length: ethMonthData.startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[70px] sm:min-h-[90px] rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-transparent" />
              ))}

              {/* Month Days */}
              {ethMonthData.days.map((dayItem) => {
                const isToday =
                  dayItem.ethDay === todayEth.day &&
                  dayItem.ethMonth === todayEth.month &&
                  dayItem.ethYear === todayEth.year;

                const isSelected = selectedDate &&
                  dayItem.gregDate.getFullYear() === selectedDate.getFullYear() &&
                  dayItem.gregDate.getMonth() === selectedDate.getMonth() &&
                  dayItem.gregDate.getDate() === selectedDate.getDate();

                const dayTasks = getTasksForDate(dayItem.gregDate);
                const gregShortStr = dayItem.gregDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={dayItem.ethDay}
                    onClick={() => {
                      setSelectedDate(dayItem.gregDate);
                    }}
                    className={`min-h-[75px] sm:min-h-[95px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 border-[#0082ff] ring-2 ring-[#0082ff] shadow-md scale-[1.02]'
                        : isToday
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#0082ff] shadow-xs'
                        : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm sm:text-base font-extrabold font-mono ${
                        isSelected ? 'text-[#0082ff]' : isToday ? 'text-[#0082ff]' : 'text-slate-900 dark:text-white'
                      }`}>
                        {dayItem.ethDay}
                      </span>

                      {(mode === 'dual' || mode === 'gregorian') && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {gregShortStr}
                        </span>
                      )}
                    </div>

                    {/* Scheduled Category Dots / Pills */}
                    <div className="space-y-1 mt-1">
                      {dayTasks.slice(0, 2).map((t, tidx) => {
                        const matchedCat = categoryList.find((c) => t.domain.toLowerCase().includes(c.id.toLowerCase())) || categoryList[0];
                        return (
                          <div
                            key={tidx}
                            className="px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold truncate flex items-center gap-1"
                            style={{ backgroundColor: `${matchedCat.color}15`, color: matchedCat.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: matchedCat.color }} />
                            <span className="truncate">{t.title}</span>
                          </div>
                        );
                      })}

                      {dayTasks.length > 2 && (
                        <span className="text-[9px] text-slate-400 font-bold block pl-1">
                          +{dayTasks.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Quick Card */}
          {selectedDate && (
            <div className="bg-white dark:bg-[#121927] border border-blue-200 dark:border-blue-900/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0082ff]">
                    {language === 'am' ? 'የተመረጠ ቀን' : 'Selected Day'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDualDate(selectedDate).gregorianStr}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {formatDualDate(selectedDate).ethiopianStr}
                </h3>
                <p className="text-xs text-slate-500">
                  {getTasksForDate(selectedDate).length} {language === 'am' ? 'የተመደቡ ብሎኮች' : 'scheduled blocks on this date'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectHorizon('daily')}
                  className="px-4 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <Clock size={14} />
                  <span>{language === 'am' ? 'ዕለታዊ እቅዱን ክፈት' : 'Open Daily Plan'}</span>
                </button>
                <button
                  onClick={() => setShowStickyModal(true)}
                  className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition hover:bg-amber-100"
                >
                  <span>⭐</span>
                  <span>{language === 'am' ? 'ስቲኪ ማስታወሻ' : 'Sticky Note'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. QUICK PLAN / ADD BLOCK MODAL */}
      {/* ========================================================= */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-[#0082ff]" />
                  <span>{language === 'am' ? 'ፈጣን የዕቅድ ማስተካከያ' : 'Tactical Planning & Scheduling'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'am' ? 'ዕለታዊ፣ ሳምንታዊ ወይም ወርሃዊ ግቦችን ይጨምሩ' : 'Add daily blocks, micro-focus items, or update weekly/monthly targets.'}
                </p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setPlanModalTab('block')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  planModalTab === 'block'
                    ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Clock size={12} />
                <span>{language === 'am' ? 'ብሎክ' : 'Daily Block'}</span>
              </button>
              <button
                onClick={() => setPlanModalTab('daily_focus')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  planModalTab === 'daily_focus'
                    ? 'bg-white text-emerald-600 dark:text-emerald-400 shadow-xs dark:bg-slate-900'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ListChecks size={12} />
                <span>{language === 'am' ? 'ዕለታዊ ግብ' : 'Daily Focus'}</span>
              </button>
              <button
                onClick={() => setPlanModalTab('weekly_target')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  planModalTab === 'weekly_target'
                    ? 'bg-white text-indigo-600 dark:text-indigo-400 shadow-xs dark:bg-slate-900'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <CalendarDays size={12} />
                <span>{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</span>
              </button>
              <button
                onClick={() => setPlanModalTab('monthly_deliverable')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
                  planModalTab === 'monthly_deliverable'
                    ? 'bg-white text-purple-600 dark:text-purple-400 shadow-xs dark:bg-slate-900'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Award size={12} />
                <span>{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</span>
              </button>
            </div>

            {/* TAB 1: ADD DAILY BLOCK */}
            {planModalTab === 'block' && (
              <form onSubmit={handleCreateBlock} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ዋና የልህቀት ዘርፍ ምረጥ' : 'Select Main Stream Pillar'}
                  </label>
                  <select
                    value={blockCategory}
                    onChange={(e) => setBlockCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none"
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'የብሎክ ስም / ተግባር' : 'Task / Block Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={blockTitle}
                    onChange={(e) => setBlockTitle(e.target.value)}
                    placeholder="e.g., Tactical Endgame Practice / Oil Painting Glaze"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none focus:border-[#0082ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">
                      {language === 'am' ? 'የመጀመሪያ ሰዓት' : 'Start Time'}
                    </label>
                    <input
                      type="text"
                      value={blockTime}
                      onChange={(e) => setBlockTime(e.target.value)}
                      placeholder="08:00 AM"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">
                      {language === 'am' ? 'ቆይታ (ደቂቃ)' : 'Duration (Minutes)'}
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={360}
                      value={blockDuration}
                      onChange={(e) => setBlockDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-semibold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'የትኩረት ደረጃ' : 'Priority Level'}
                  </label>
                  <select
                    value={blockPriority}
                    onChange={(e) => setBlockPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none"
                  >
                    <option value="DEEP_WORK">Deep Work</option>
                    <option value="HABIT_AUTOMATIC">Habit / Routine</option>
                    <option value="BUFFER_RECOVERY">Buffer / Recovery</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl font-bold text-xs shadow-md transition cursor-pointer mt-2"
                >
                  {language === 'am' ? 'ብሎክ ወደ ሰሌዳው አክል' : 'Add Block to Schedule'}
                </button>
              </form>
            )}

            {/* TAB 2: ADD DAILY FOCUS ITEM */}
            {planModalTab === 'daily_focus' && (
              <form onSubmit={handleCreateFocusItem} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ዋና የልህቀት ዘርፍ ምረጥ' : 'Select Main Stream Pillar'}
                  </label>
                  <select
                    value={focusCategory}
                    onChange={(e) => setFocusCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none"
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ዕለታዊ የትኩረት ግብ' : 'Daily Focus Item Text'}
                  </label>
                  <input
                    type="text"
                    required
                    value={focusText}
                    onChange={(e) => setFocusText(e.target.value)}
                    placeholder="e.g., Complete 30 pushups / Review 5 tactics puzzles"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition cursor-pointer mt-2"
                >
                  {language === 'am' ? 'ግብ ወደ ዘርፉ አክል' : 'Add Focus Item to Stream'}
                </button>
              </form>
            )}

            {/* TAB 3: EDIT WEEKLY TARGET */}
            {planModalTab === 'weekly_target' && (
              <form onSubmit={handleSaveWeeklyTarget} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ዋና የልህቀት ዘርፍ ምረጥ' : 'Select Main Stream Pillar'}
                  </label>
                  <select
                    value={weeklyCategory}
                    onChange={(e) => {
                      setWeeklyCategory(e.target.value);
                      const cat = categoryPlans[e.target.value];
                      if (cat) {
                        setWeeklyHoursInput(cat.weeklyTargetHours);
                        setWeeklySlotsInput(cat.weeklyScheduleSummary.join(', '));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none"
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ሳምንታዊ የታለመ ሰዓት' : 'Weekly Target Hours'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="80"
                    value={weeklyHoursInput}
                    onChange={(e) => setWeeklyHoursInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                {/* Day Selection Options: Mon, Tue, Wed, Thu, Fri, Sat, Sun 🌿 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">
                      {language === 'am' ? 'የሳምንቱን ቀናት ይምረጡ (Mon, Tue, Wed...)' : 'Choose Weekly Days (Mon, Tue, Wed...)'}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedModalWeeklyDays.length} {language === 'am' ? 'ቀናት' : 'days'}
                    </span>
                  </div>

                  {/* Day Buttons */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEK_DAYS.map((d) => {
                      const isSelected = selectedModalWeeklyDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleToggleModalDay(d.id)}
                          className={`py-1.5 px-1 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center gap-0.5 border ${
                            isSelected
                              ? d.isRest
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                                : 'bg-[#0082ff] text-white border-[#0082ff] shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <span>{language === 'am' ? d.am : d.en}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sunday Rest Day Info */}
                  {selectedModalWeeklyDays.includes('Sun') && (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                      <span>🌿</span>
                      <span>{language === 'am' ? 'እሁድ ይፋዊ የእረፍትና የመዝናናት ቀን ነው።' : 'Sunday is officially designated as a Rest & Recovery Day.'}</span>
                    </div>
                  )}

                  {/* Default Time & Apply Button */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={modalWeeklyDefaultTime}
                        onChange={(e) => setModalWeeklyDefaultTime(e.target.value)}
                        placeholder="07:00 AM"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyModalDays}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      {language === 'am' ? '+ ቀናት አክል' : '+ Apply Days'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ሳምንታዊ መርሃግብር ቀናት (በኮማ ለይተው)' : 'Weekly Routine Cadence (Comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={weeklySlotsInput}
                    onChange={(e) => setWeeklySlotsInput(e.target.value)}
                    placeholder="Mon 07:00 AM, Wed 07:00 AM, Fri 07:00 AM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition cursor-pointer mt-2"
                >
                  {language === 'am' ? 'ሳምንታዊ መረጃውን አድስ' : 'Save Weekly Cadence'}
                </button>
              </form>
            )}

            {/* TAB 4: EDIT MONTHLY DELIVERABLE */}
            {planModalTab === 'monthly_deliverable' && (
              <form onSubmit={handleSaveMonthlyDeliverable} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ዋና የልህቀት ዘርፍ ምረጥ' : 'Select Main Stream Pillar'}
                  </label>
                  <select
                    value={monthlyCategory}
                    onChange={(e) => {
                      setMonthlyCategory(e.target.value);
                      const cat = categoryPlans[e.target.value];
                      if (cat) {
                        setMonthlyGoalInput(cat.monthlyGoalTitle || '');
                        setMonthlyMetricInput(cat.monthlyTargetMetric || '');
                        setMonthlyHoursTargetInput(cat.monthlyTargetHours || 20);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none"
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ወርሃዊ ስትራቴጂካዊ ዒላማ' : 'Monthly Strategic Deliverable / Goal'}
                  </label>
                  <input
                    type="text"
                    required
                    value={monthlyGoalInput}
                    onChange={(e) => setMonthlyGoalInput(e.target.value)}
                    placeholder="e.g., Master 1.e4 openings & complete 20 tournament games"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">
                      {language === 'am' ? 'የመለኪያ ዒላማ' : 'Target Metric'}
                    </label>
                    <input
                      type="text"
                      value={monthlyMetricInput}
                      onChange={(e) => setMonthlyMetricInput(e.target.value)}
                      placeholder="e.g., 20 Games / 3 Canvases"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-500 block mb-1">
                      {language === 'am' ? 'ወርሃዊ ሰዓት' : 'Monthly Hours'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="300"
                      value={monthlyHoursTargetInput}
                      onChange={(e) => setMonthlyHoursTargetInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md transition cursor-pointer mt-2"
                >
                  {language === 'am' ? 'ወርሃዊ ዒላማውን አስቀምጥ' : 'Save Monthly Deliverable'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. DAILY STICKY NOTE MODAL / OVERLAY */}
      {/* ========================================================= */}
      {showStickyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'am' ? 'የዕለቱ ስቲኪ ማስታወሻ' : 'Daily Sticky Note & Reflection'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">({formatDualDate(selectedDate).gregorianStr})</span>
              </div>
              <button
                onClick={() => setShowStickyModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <BigDailyActivitiesStickyNote
              targetDate={selectedDate}
              onClose={() => setShowStickyModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
