import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Check, Clock, Trash2, ChevronLeft, ChevronRight, Palette,
  Dumbbell, Swords, ChessKnight, Palette as PaletteIcon, Music, Building2, TrendingUp, 
  BookOpen, Shield, Sparkles, X, Edit2, Edit3, MoreVertical, Plus, Calendar, Compass, Star,
  Target, Award, Flag, ArrowRight, RotateCcw, Minus, List, LayoutGrid,
  Sun, CalendarDays, Moon, ChevronUp, ChevronDown, GripVertical, Play
} from 'lucide-react';
import { useLivotion, CategoryPlan } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { gregorianToEthiopian, ETHIOPIAN_MONTHS, AMHARIC_DAYS, formatDualDate } from '../utils/ethiopianCalendar';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { formatTaskDuration } from '../utils/formatDuration';
import { StrategicHorizonsView } from './StrategicHorizonsView';
import { DurationPicker } from './DurationPicker';
import { 
  checkScheduleConflict, 
  ScheduleConflictResult,
  autoResolveOverlappingTasks,
  parseTimeToMinutes,
  formatMinutesToTime
} from '../utils/scheduleConflictDetector';
import { ScheduleConflictNotificationModal } from './ScheduleConflictNotificationModal';

type StickyColorTheme = 'canary' | 'peach' | 'mint' | 'sky' | 'rose' | 'lavender' | 'darkgrey' | 'charcoal' | 'graphite';
type PlannerHorizon = 'daily' | 'weekly' | 'monthly' | 'goals';

const THEMES: Record<StickyColorTheme, {
  name: string;
  dotColor: string;
  paperBg: string;
  paperBorder: string;
  textPrimary: string;
  textSecondary: string;
  tapeBg: string;
  tapeBorder: string;
  hourBadgeBg: string;
  hourBadgeText: string;
  checkBorder: string;
  checkBgDone: string;
  ruledLineColor: string;
  marginLineColor: string;
  shadowColor: string;
  cardBg: string;
  buttonBg: string;
  inputBg: string;
}> = {
  canary: {
    name: 'Classic Canary Yellow',
    dotColor: '#fde047',
    paperBg: 'bg-[#fef9c3]',
    paperBorder: 'border-[#fef08a]',
    textPrimary: 'text-amber-950',
    textSecondary: 'text-amber-800/80',
    tapeBg: 'bg-amber-100/70',
    tapeBorder: 'border-amber-200/80',
    hourBadgeBg: 'bg-amber-200/80',
    hourBadgeText: 'text-amber-950',
    checkBorder: 'border-amber-400',
    checkBgDone: 'bg-amber-600 text-white',
    ruledLineColor: 'rgba(217, 119, 6, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(180, 83, 9, 0.22)',
    cardBg: 'bg-white/80',
    buttonBg: 'bg-white/90 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/95 text-slate-900',
  },
  peach: {
    name: 'Warm Peach',
    dotColor: '#fdba74',
    paperBg: 'bg-[#ffedd5]',
    paperBorder: 'border-[#fed7aa]',
    textPrimary: 'text-orange-950',
    textSecondary: 'text-orange-800/80',
    tapeBg: 'bg-orange-100/70',
    tapeBorder: 'border-orange-200/80',
    hourBadgeBg: 'bg-orange-200/80',
    hourBadgeText: 'text-orange-950',
    checkBorder: 'border-orange-400',
    checkBgDone: 'bg-orange-600 text-white',
    ruledLineColor: 'rgba(234, 88, 12, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(194, 65, 12, 0.22)',
    cardBg: 'bg-white/80',
    buttonBg: 'bg-white/90 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/95 text-slate-900',
  },
  mint: {
    name: 'Fresh Mint',
    dotColor: '#86efac',
    paperBg: 'bg-[#dcfce7]',
    paperBorder: 'border-[#bbf7d0]',
    textPrimary: 'text-emerald-950',
    textSecondary: 'text-emerald-800/80',
    tapeBg: 'bg-emerald-100/70',
    tapeBorder: 'border-emerald-200/80',
    hourBadgeBg: 'bg-emerald-200/80',
    hourBadgeText: 'text-emerald-950',
    checkBorder: 'border-emerald-400',
    checkBgDone: 'bg-emerald-600 text-white',
    ruledLineColor: 'rgba(5, 150, 105, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(4, 120, 87, 0.22)',
    cardBg: 'bg-white/80',
    buttonBg: 'bg-white/90 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/95 text-slate-900',
  },
  sky: {
    name: 'Soft Sky',
    dotColor: '#7dd3fc',
    paperBg: 'bg-[#e0f2fe]',
    paperBorder: 'border-[#bae6fd]',
    textPrimary: 'text-sky-950',
    textSecondary: 'text-sky-800/80',
    tapeBg: 'bg-sky-100/70',
    tapeBorder: 'border-sky-200/80',
    hourBadgeBg: 'bg-sky-200/80',
    hourBadgeText: 'text-sky-950',
    checkBorder: 'border-sky-400',
    checkBgDone: 'bg-sky-600 text-white',
    ruledLineColor: 'rgba(2, 132, 199, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(3, 105, 161, 0.22)',
    cardBg: 'bg-white/80',
    buttonBg: 'bg-white/90 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/95 text-slate-900',
  },
  rose: {
    name: 'Blush Rose',
    dotColor: '#fda4af',
    paperBg: 'bg-[#ffe4e6]',
    paperBorder: 'border-[#fecdd3]',
    textPrimary: 'text-rose-950',
    textSecondary: 'text-rose-800/80',
    tapeBg: 'bg-rose-100/70',
    tapeBorder: 'border-rose-200/80',
    hourBadgeBg: 'bg-rose-200/80',
    hourBadgeText: 'text-rose-950',
    checkBorder: 'border-rose-400',
    checkBgDone: 'bg-rose-600 text-white',
    ruledLineColor: 'rgba(225, 29, 72, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(190, 18, 60, 0.22)',
    cardBg: 'bg-white/80',
    buttonBg: 'bg-white/90 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/95 text-slate-900',
  },
  lavender: {
    name: 'Quiet Lavender',
    dotColor: '#d8b4fe',
    paperBg: 'bg-[#f3e8ff]',
    paperBorder: 'border-[#e9d5ff]',
    textPrimary: 'text-purple-950',
    textSecondary: 'text-purple-800/80',
    tapeBg: 'bg-purple-100/70',
    tapeBorder: 'border-purple-200/80',
    hourBadgeBg: 'bg-purple-200/80',
    hourBadgeText: 'text-purple-950',
    checkBorder: 'border-purple-400',
    checkBgDone: 'bg-purple-600 text-white',
    ruledLineColor: 'rgba(147, 51, 234, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(126, 34, 206, 0.22)',
    cardBg: 'bg-white/80',
    buttonBg: 'bg-white/90 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/95 text-slate-900',
  },
  darkgrey: {
    name: 'Dark Grey Paper',
    dotColor: '#475569',
    paperBg: 'bg-[#1e2430]',
    paperBorder: 'border-slate-700/60',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    tapeBg: 'bg-slate-700/50',
    tapeBorder: 'border-slate-600/50',
    hourBadgeBg: 'bg-slate-800/90',
    hourBadgeText: 'text-slate-200',
    checkBorder: 'border-slate-500',
    checkBgDone: 'bg-blue-600 text-white',
    ruledLineColor: 'rgba(255, 255, 255, 0.04)',
    marginLineColor: 'rgba(244, 63, 94, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    cardBg: 'bg-[#141822]/90 border border-slate-700/50',
    buttonBg: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200',
    inputBg: 'bg-slate-800/90 text-slate-100 border-slate-700/60',
  },
  charcoal: {
    name: 'Midnight Charcoal',
    dotColor: '#334155',
    paperBg: 'bg-[#151a23]',
    paperBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    tapeBg: 'bg-slate-800/50',
    tapeBorder: 'border-slate-700/50',
    hourBadgeBg: 'bg-slate-800/90',
    hourBadgeText: 'text-slate-200',
    checkBorder: 'border-slate-600',
    checkBgDone: 'bg-blue-600 text-white',
    ruledLineColor: 'rgba(255, 255, 255, 0.03)',
    marginLineColor: 'rgba(244, 63, 94, 0.20)',
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    cardBg: 'bg-[#0f131a]/90 border border-slate-800/80',
    buttonBg: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200',
    inputBg: 'bg-slate-800/90 text-slate-100 border-slate-700/60',
  },
  graphite: {
    name: 'Deep Graphite',
    dotColor: '#1e293b',
    paperBg: 'bg-[#111620]',
    paperBorder: 'border-slate-800',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    tapeBg: 'bg-slate-800/60',
    tapeBorder: 'border-slate-700/60',
    hourBadgeBg: 'bg-slate-800/90',
    hourBadgeText: 'text-slate-200',
    checkBorder: 'border-slate-600',
    checkBgDone: 'bg-blue-600 text-white',
    ruledLineColor: 'rgba(255, 255, 255, 0.03)',
    marginLineColor: 'rgba(244, 63, 94, 0.20)',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    cardBg: 'bg-[#0b0e14]/90 border border-slate-800/80',
    buttonBg: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200',
    inputBg: 'bg-slate-800/90 text-slate-100 border-slate-700/60',
  },
};

const WEEKDAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_NAMES_AM = ['ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'አር', 'ቅዳ', 'እሁ'];

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


export interface IntegratedCalendarViewProps {
  initialHorizon?: PlannerHorizon;
}

export const IntegratedCalendarView: React.FC<IntegratedCalendarViewProps> = ({ initialHorizon }) => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    categoryPlans,
    updateCategorySchedule,
    updateCategoryPlan,
    updateCategoryMonthlyDeliverable,
    getDaySchedule,
    calendarSystem,
    language,
    getCategoryTitleTranslated,
    setSelectedCategoryId,
    categoryOrder,
    theme: appTheme,
    reorderTasks,
    toggleTaskCompletion,
    startTimerForTask,
    activeTask,
    isRunning
  } = useLivotion();

  // Active Horizon: Daily, Weekly, Monthly, Goals
  const [plannerHorizon, setPlannerHorizon] = useState<PlannerHorizon>(() => {
    if (initialHorizon) return initialHorizon;
    try {
      const saved = localStorage.getItem('neva_planner_horizon') as PlannerHorizon;
      if (saved === 'daily' || saved === 'weekly' || saved === 'monthly' || saved === 'goals') return saved;
    } catch {}
    return 'daily';
  });

  useEffect(() => {
    if (initialHorizon) {
      setPlannerHorizon(initialHorizon);
    }
  }, [initialHorizon]);

  const handleSelectHorizon = (h: PlannerHorizon) => {
    setPlannerHorizon(h);
    try {
      localStorage.setItem('neva_planner_horizon', h);
    } catch {}
    try { soundEngine.playPencil(); } catch {}
  };

  // Active Date Selection (For Daily)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [dailySubView, setDailySubView] = useState<'day' | 'week'>('day');
  const [filterMode, setFilterMode] = useState<'all' | 'remaining' | 'done'>('all');

  const isViewingToday = useMemo(() => {
    return selectedDate.toDateString() === new Date().toDateString();
  }, [selectedDate]);

  const isPastDay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    return sel.getTime() < today.getTime();
  }, [selectedDate]);

  const isFutureDay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    return sel.getTime() > today.getTime();
  }, [selectedDate]);

  const formatTimeRange = (timeStr?: string, durationMin: number = 45): string => {
    if (!timeStr || timeStr.toLowerCase().includes('flex')) return 'Flexible';
    const startMin = parseTimeToMinutes(timeStr);
    if (startMin < 0) return timeStr;
    const endMin = (startMin + durationMin) % (24 * 60);
    const startFormatted = formatTaskTime(timeStr);
    const endFormatted = formatMinutesToTime(endMin);
    return `${startFormatted} – ${endFormatted}`;
  };

  // Active Stream Filter ('all' or specific category id: 'chess', 'exercise', etc.)
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>('all');
  // Collapsible Stream Filter Strip (toggled via 3-vertical-dots button)
  const [isStreamFiltersExpanded, setIsStreamFiltersExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (selectedStreamFilter !== 'all' && !categoryPlans[selectedStreamFilter]) {
      setSelectedStreamFilter('all');
    }
  }, [categoryPlans, selectedStreamFilter]);

  // Week offset for Weekly view
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Collapsible category groups in Day Agenda
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: prev[catId] === false ? true : false
    }));
    try { soundEngine.playPencil(); } catch {}
  };

  // Drag & drop state for scheduled routine blocks in the Plan system
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const touchActivePlanTaskId = useRef<string | null>(null);

  const handlePlanTaskTouchStart = (e: React.TouchEvent, taskId: string) => {
    e.stopPropagation();
    touchActivePlanTaskId.current = taskId;
    setDraggedTaskId(taskId);
  };

  const handlePlanTaskTouchMove = (e: React.TouchEvent) => {
    if (!touchActivePlanTaskId.current) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = targetElement?.closest('[data-plan-task-id]');
    if (card) {
      const targetId = card.getAttribute('data-plan-task-id');
      if (targetId && targetId !== touchActivePlanTaskId.current) {
        setDragOverTaskId(targetId);
      }
    }
  };

  const handlePlanTaskTouchEnd = () => {
    if (touchActivePlanTaskId.current && dragOverTaskId && touchActivePlanTaskId.current !== dragOverTaskId) {
      reorderTasks(touchActivePlanTaskId.current, dragOverTaskId);
      try {
        soundEngine.playPencil();
      } catch {}
    }
    touchActivePlanTaskId.current = null;
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  // Month offset for Monthly view
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Clean Modern Theme for Plan Page (No sticky note styling)
  const currentTheme = useMemo(() => ({
    name: 'Clean Modern',
    dotColor: '#0082ff',
    paperBg: 'bg-white dark:bg-[#121620]',
    paperBorder: 'border-slate-200/80 dark:border-slate-800/80',
    textPrimary: 'text-slate-900 dark:text-white',
    textSecondary: 'text-slate-500 dark:text-slate-400',
    tapeBg: 'bg-slate-100 dark:bg-slate-800',
    tapeBorder: 'border-slate-200 dark:border-slate-700',
    hourBadgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    hourBadgeText: 'text-[#0082ff]',
    checkBorder: 'border-slate-300 dark:border-slate-600',
    checkBgDone: 'bg-[#0082ff] text-white',
    ruledLineColor: 'transparent',
    marginLineColor: 'transparent',
    shadowColor: 'transparent',
    cardBg: 'bg-slate-50/80 dark:bg-slate-800/40',
    buttonBg: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200',
    inputBg: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
  }), []);

  // Sunday Rest Habits
  const [sundayHabits, setSundayHabits] = useState<SundayRestHabit[]>(() => {
    try {
      const saved = localStorage.getItem('neva_sunday_habits_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SUNDAY_HABITS;
  });

  const toggleSundayHabit = (id: string) => {
    setSundayHabits(prev => {
      const next = prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h);
      try { localStorage.setItem('neva_sunday_habits_v1', JSON.stringify(next)); } catch {}
      return next;
    });
    try { soundEngine.playPencil(); } catch {}
  };

  // Day navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    try { soundEngine.playPencil(); } catch {}
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    try { soundEngine.playPencil(); } catch {}
  };

  const handleJumpToToday = () => {
    setSelectedDate(new Date());
    setWeekOffset(0);
    setMonthOffset(0);
    try { soundEngine.playPencil(); } catch {}
  };

  // Calculate Monday of the selected week (Monday = 0 ... Sunday = 6)
  const mondayOfWeek = useMemo(() => {
    const d = new Date(selectedDate);
    if (plannerHorizon === 'weekly') {
      d.setDate(d.getDate() + weekOffset * 7);
    }
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate, weekOffset, plannerHorizon]);

  // Generate 7 days for the current week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mondayOfWeek);
      d.setDate(mondayOfWeek.getDate() + i);
      const dayOfWeekNum = i + 1; // 1 = Monday, 7 = Sunday
      const schedule = getDaySchedule(d);
      const isSelected = d.toDateString() === selectedDate.toDateString();
      const isToday = d.toDateString() === new Date().toDateString();

      let dayTasks = schedule.tasks || [];
      if (selectedStreamFilter !== 'all') {
        const plan = categoryPlans[selectedStreamFilter];
        const streamTitle = plan ? plan.title.toLowerCase() : selectedStreamFilter.toLowerCase();
        dayTasks = dayTasks.filter(t => {
          const dom = (t.domain || '').toLowerCase();
          const bdg = (t.badge || '').toLowerCase();
          const tit = (t.title || '').toLowerCase();
          return dom.includes(selectedStreamFilter.toLowerCase()) || 
                 bdg.includes(selectedStreamFilter.toLowerCase()) || 
                 tit.includes(streamTitle);
        });
      }

      const dayMinutes = dayTasks.reduce((acc, t) => acc + (t.durationMin || 0), 0);
      const dayHoursNum = (dayMinutes / 60).toFixed(1);
      const dayHoursStr = Number(dayHoursNum) === 0 ? '0' : dayHoursNum;

      const dots = Array.from(new Set(dayTasks.map(t => t.color).filter(Boolean)));

      return {
        date: d,
        dayOfWeekNum,
        dayNameEn: WEEKDAY_NAMES_EN[i],
        dayNameAm: WEEKDAY_NAMES_AM[i],
        dayNumber: d.getDate(),
        isSunday: i === 6,
        isSelected,
        isToday,
        taskCount: dayTasks.length,
        totalPlannedHours: dayHoursStr,
        streamDots: dots as string[]
      };
    });
  }, [mondayOfWeek, selectedDate, tasks, categoryPlans, selectedStreamFilter, getDaySchedule]);

  const formatTaskTime = (timeStr?: string) => {
    if (!timeStr || timeStr.toLowerCase().includes('flex')) return 'Flexible';
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return timeStr;
    let [_, hStr, mStr, meridiem] = match;
    let h = parseInt(hStr, 10);
    if (meridiem) {
      return `${String(h).padStart(2, '0')}:${mStr} ${meridiem.toUpperCase()}`;
    }
    const isPM = h >= 12;
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(h12).padStart(2, '0')}:${mStr} ${isPM ? 'PM' : 'AM'}`;
  };

  // Category Icon resolver
  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'exercise': return Dumbbell;
      case 'chess': return ChessKnight;
      case 'art': return PaletteIcon;
      case 'music': return Music;
      case 'architecture': return Building2;
      case 'trading': return TrendingUp;
      case 'devotion': return BookOpen;
      default: return ChessKnight;
    }
  };

  const resolveTaskCategory = (task: ScheduleTask): { id: string; title: string; color: string; Icon: any } => {
    // 1. Match by task.badge if present and valid
    if (task.badge && task.badge.toUpperCase() !== 'STREAM' && task.badge.toUpperCase() !== 'FOCUS') {
      const bLower = task.badge.toLowerCase();
      for (const [id, plan] of Object.entries(categoryPlans)) {
        if (bLower.includes(id) || plan.title.toLowerCase().includes(bLower)) {
          return { id, title: plan.title, color: plan.color, Icon: getCategoryIcon(id) };
        }
      }
    }

    // 2. Match by task.domain
    if (task.domain) {
      switch (task.domain) {
        case 'CHESS':
          return { id: 'chess', title: categoryPlans['chess']?.title || 'Chess', color: categoryPlans['chess']?.color || '#8b5cf6', Icon: ChessKnight };
        case 'GUITAR':
          return { id: 'music', title: categoryPlans['music']?.title || 'Music & Guitar', color: categoryPlans['music']?.color || '#ec4899', Icon: Music };
        case 'PHYSICAL_FITNESS':
          return { id: 'exercise', title: categoryPlans['exercise']?.title || 'Exercise & Fitness', color: categoryPlans['exercise']?.color || '#ef4444', Icon: Dumbbell };
        case 'OIL_PAINTING':
          return { id: 'art', title: categoryPlans['art']?.title || 'Art & Painting', color: categoryPlans['art']?.color || '#e11d48', Icon: PaletteIcon };
        case 'ARCHITECTURE_DESIGN':
        case 'SITE_SUPERVISION':
        case 'ARCHITECTURE' as any:
          return { id: 'architecture', title: categoryPlans['architecture']?.title || 'Architecture & Design', color: categoryPlans['architecture']?.color || '#0082ff', Icon: Building2 };
        case 'FOREX_TRADING':
        case 'TRADING' as any:
          return { id: 'trading', title: categoryPlans['trading']?.title || 'Trading', color: categoryPlans['trading']?.color || '#10b981', Icon: TrendingUp };
        case 'DEVOTION_PRAYER':
          return { id: 'devotion', title: categoryPlans['devotion']?.title || 'Devotion & Prayer', color: categoryPlans['devotion']?.color || '#a855f7', Icon: BookOpen };
        default:
          break;
      }
    }

    // 3. Match by task.title keywords
    const titleLower = (task.title || '').toLowerCase();
    for (const [id, plan] of Object.entries(categoryPlans)) {
      if (titleLower.includes(id) || titleLower.includes(plan.title.toLowerCase())) {
        return { id, title: plan.title, color: plan.color, Icon: getCategoryIcon(id) };
      }
    }
    if (titleLower.includes('chess') || titleLower.includes('tactic') || titleLower.includes('puzzle') || titleLower.includes('grandmaster')) {
      return { id: 'chess', title: categoryPlans['chess']?.title || 'Chess', color: categoryPlans['chess']?.color || '#8b5cf6', Icon: ChessKnight };
    }
    if (titleLower.includes('guitar') || titleLower.includes('music') || titleLower.includes('song') || titleLower.includes('finger') || titleLower.includes('acoustic') || titleLower.includes('repertoire')) {
      return { id: 'music', title: categoryPlans['music']?.title || 'Music & Guitar', color: categoryPlans['music']?.color || '#ec4899', Icon: Music };
    }
    if (titleLower.includes('workout') || titleLower.includes('exercise') || titleLower.includes('gym') || titleLower.includes('fitness') || titleLower.includes('run')) {
      return { id: 'exercise', title: categoryPlans['exercise']?.title || 'Exercise & Fitness', color: categoryPlans['exercise']?.color || '#ef4444', Icon: Dumbbell };
    }
    if (titleLower.includes('paint') || titleLower.includes('art') || titleLower.includes('draw')) {
      return { id: 'art', title: categoryPlans['art']?.title || 'Art & Painting', color: categoryPlans['art']?.color || '#e11d48', Icon: PaletteIcon };
    }
    if (titleLower.includes('trade') || titleLower.includes('trading') || titleLower.includes('forex') || titleLower.includes('chart') || titleLower.includes('market') || titleLower.includes('xau') || titleLower.includes('gold') || titleLower.includes('crypto') || titleLower.includes('nasdaq')) {
      return { id: 'trading', title: categoryPlans['trading']?.title || 'Trading', color: categoryPlans['trading']?.color || '#10b981', Icon: TrendingUp };
    }
    if (titleLower.includes('architect') || titleLower.includes('blueprint') || titleLower.includes('site') || titleLower.includes('design')) {
      return { id: 'architecture', title: categoryPlans['architecture']?.title || 'Architecture & Design', color: categoryPlans['architecture']?.color || '#0082ff', Icon: Building2 };
    }
    if (titleLower.includes('pray') || titleLower.includes('devotion') || titleLower.includes('scripture') || titleLower.includes('bible')) {
      return { id: 'devotion', title: categoryPlans['devotion']?.title || 'Devotion & Prayer', color: categoryPlans['devotion']?.color || '#a855f7', Icon: BookOpen };
    }

    const firstCat = Object.values(categoryPlans)[0];
    return {
      id: firstCat?.id || 'chess',
      title: firstCat?.title || 'Chess',
      color: firstCat?.color || '#8b5cf6',
      Icon: getCategoryIcon(firstCat?.id || 'chess')
    };
  };

  // Active Day Schedule
  const activeSchedule = useMemo(() => {
    return getDaySchedule(selectedDate);
  }, [selectedDate, tasks, categoryPlans]);

  const activeStats = useMemo(() => {
    const list = activeSchedule.tasks || [];
    const totalMinutes = list.reduce((acc, t) => acc + (t.durationMin || 0), 0);
    const totalHoursNum = (totalMinutes / 60).toFixed(1);
    const totalHoursStr = Number(totalHoursNum) === 0 ? '0' : totalHoursNum;
    const doneCount = list.filter(t => t.completed).length;
    const remainingCount = list.filter(t => !t.completed).length;
    return {
      totalHours: totalHoursStr,
      totalMinutes,
      doneCount,
      remainingCount,
      allCount: list.length
    };
  }, [activeSchedule.tasks]);

  const activeTasks = useMemo(() => {
    let list = activeSchedule.tasks || [];
    if (selectedStreamFilter !== 'all') {
      list = list.filter(t => resolveTaskCategory(t).id === selectedStreamFilter);
    }
    if (filterMode === 'remaining') return list.filter(t => !t.completed);
    if (filterMode === 'done') return list.filter(t => t.completed);
    return list;
  }, [activeSchedule, filterMode, selectedStreamFilter, categoryPlans]);

  // Group active tasks by their category: strictly preserves drag order within categories
  const tasksGroupedByCategory = useMemo(() => {
    const groups: {
      category: { id: string; title: string; color: string; Icon: any };
      tasks: ScheduleTask[];
      totalDuration: number;
      completedCount: number;
    }[] = [];

    const orderedCatKeys = Object.keys(categoryPlans).sort((a, b) => {
      const idxA = (categoryOrder || []).indexOf(a);
      const idxB = (categoryOrder || []).indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    orderedCatKeys.forEach((catKey) => {
      const plan = categoryPlans[catKey];
      if (!plan) return;
      const rawCatTasks = activeTasks.filter((t) => {
        const resolved = resolveTaskCategory(t);
        return resolved.id === catKey;
      });
      const catTasks = autoResolveOverlappingTasks(rawCatTasks);
      if (catTasks.length > 0) {
        const totalDuration = catTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0);
        const completedCount = catTasks.filter((t) => t.completed).length;
        groups.push({
          category: {
            id: catKey,
            title: plan.title,
            color: plan.color,
            Icon: getCategoryIcon(catKey),
          },
          tasks: catTasks,
          totalDuration,
          completedCount,
        });
      }
    });

    // Handle any tasks with categories not in orderedCatKeys
    const representedTaskIds = new Set(groups.flatMap((g) => g.tasks.map((t) => t.id)));
    const remainingRaw = activeTasks.filter((t) => !representedTaskIds.has(t.id));
    const remainingTasks = autoResolveOverlappingTasks(remainingRaw);
    if (remainingTasks.length > 0) {
      const resolved = resolveTaskCategory(remainingTasks[0]);
      groups.push({
        category: resolved,
        tasks: remainingTasks,
        totalDuration: remainingTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0),
        completedCount: remainingTasks.filter((t) => t.completed).length,
      });
    }

    return groups;
  }, [activeTasks, categoryPlans, categoryOrder]);

  const isSelectedSunday = selectedDate.getDay() === 0;

  // Dual Date string
  const dualDateInfo = useMemo(() => {
    const raw = formatDualDate(selectedDate);
    const eth = gregorianToEthiopian(selectedDate);
    const gregShort = selectedDate.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric' });
    const gregFull = selectedDate.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const ethShort = `${eth.monthNameAm} ${eth.day}`;
    const ethFull = `${eth.dayOfWeekAm}፣ ${eth.monthNameAm} ${eth.day}፣ ${eth.year} ዓ.ም.`;

    let shortDual = '';
    if (calendarSystem === 'et') {
      shortDual = ethFull;
    } else if (calendarSystem === 'gc') {
      shortDual = gregFull;
    } else {
      shortDual = `${gregShort} • ${ethShort}`;
    }

    return {
      ...raw,
      shortDual,
      eth,
      gregShort,
      ethShort
    };
  }, [selectedDate, calendarSystem, language]);

  // Weekly Horizon Summary Info
  const weeklyInfo = useMemo(() => {
    const sundayDate = new Date(mondayOfWeek);
    sundayDate.setDate(mondayOfWeek.getDate() + 6);
    
    let dateRangeStr = '';
    if (calendarSystem === 'et') {
      const ethStart = gregorianToEthiopian(mondayOfWeek);
      const ethEnd = gregorianToEthiopian(sundayDate);
      dateRangeStr = `${ethStart.monthNameAm} ${ethStart.day} – ${ethEnd.monthNameAm} ${ethEnd.day}፣ ${ethEnd.year} ዓ.ም.`;
    } else if (calendarSystem === 'dual') {
      const startStr = mondayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = sundayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const ethStart = gregorianToEthiopian(mondayOfWeek);
      const ethEnd = gregorianToEthiopian(sundayDate);
      dateRangeStr = `${startStr} – ${endStr} (${ethStart.monthNameAm} ${ethStart.day} – ${ethEnd.monthNameAm} ${ethEnd.day})`;
    } else {
      const startStr = mondayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = sundayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      dateRangeStr = `${startStr} – ${endStr}`;
    }

    let totalTargetHours = 0;
    Object.values(categoryPlans || {}).forEach(cat => {
      if (cat) totalTargetHours += cat.weeklyTargetHours || 0;
    });

    let totalPlannedRoutines = 0;
    Object.values(categoryPlans || {}).forEach(cat => {
      if (cat) totalPlannedRoutines += (cat.weeklyScheduleSummary || []).length;
    });

    return {
      dateRangeStr,
      totalTargetHours: totalTargetHours.toFixed(1),
      totalPlannedRoutines,
      activeStreamsCount: Object.keys(categoryPlans).length
    };
  }, [mondayOfWeek, categoryPlans, calendarSystem]);

  // Monthly Horizon Summary Info

  // Monthly Calendar Grid calculation
  const monthlyCalendarData = useMemo(() => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + monthOffset);
    const year = d.getFullYear();
    const month = d.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    const paddingBefore: { dayNumber: number; date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const padDate = new Date(year, month - 1, prevMonthDaysCount - i);
      paddingBefore.push({ dayNumber: prevMonthDaysCount - i, date: padDate, isCurrentMonth: false });
    }

    const todayStr = new Date().toDateString();
    const selectedDateStr = selectedDate.toDateString();

    const currentMonthDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const curDate = new Date(year, month, day);
      const isToday = curDate.toDateString() === todayStr;
      const isSelected = curDate.toDateString() === selectedDateStr;

      const daySchedule = getDaySchedule(curDate);
      let dayTasks = daySchedule.tasks || [];

      if (selectedStreamFilter !== 'all') {
        const plan = categoryPlans[selectedStreamFilter];
        const streamTitle = plan ? plan.title.toLowerCase() : selectedStreamFilter.toLowerCase();
        dayTasks = dayTasks.filter(t => {
          const dom = (t.domain || '').toLowerCase();
          const bdg = (t.badge || '').toLowerCase();
          const tit = (t.title || '').toLowerCase();
          return dom.includes(selectedStreamFilter.toLowerCase()) || 
                 bdg.includes(selectedStreamFilter.toLowerCase()) || 
                 tit.includes(streamTitle);
        });
      }

      // Collect unique stream dot colors
      const dotsMap = new Set<string>();
      dayTasks.forEach(t => {
        if (t.color) dotsMap.add(t.color);
      });

      currentMonthDays.push({
        dayNumber: day,
        date: curDate,
        isCurrentMonth: true,
        isToday,
        isSelected,
        tasksCount: dayTasks.length,
        streamDots: Array.from(dotsMap),
        tasks: dayTasks
      });
    }

    const totalFilled = paddingBefore.length + currentMonthDays.length;
    const paddingAfterCount = (7 - (totalFilled % 7)) % 7;
    const paddingAfter: { dayNumber: number; date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 1; i <= paddingAfterCount; i++) {
      const padDate = new Date(year, month + 1, i);
      paddingAfter.push({ dayNumber: i, date: padDate, isCurrentMonth: false });
    }

    return {
      paddingBefore,
      currentMonthDays,
      paddingAfter,
      year,
      month
    };
  }, [selectedDate, monthOffset, getDaySchedule, selectedStreamFilter, categoryPlans]);

  const monthlyInfo = useMemo(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + monthOffset);

    const monthNameEn = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const ethDate = gregorianToEthiopian(targetDate);
    const monthNameAm = `${ETHIOPIAN_MONTHS[ethDate.month - 1]?.am || ''} ${ethDate.year} ዓ.ም.`;

    let displayMonth = '';
    if (calendarSystem === 'et') {
      displayMonth = monthNameAm;
    } else if (calendarSystem === 'dual') {
      displayMonth = `${monthNameEn} • ${monthNameAm}`;
    } else {
      displayMonth = monthNameEn;
    }

    let totalMonthlyTargetHours = 0;
    let deliverablesCount = 0;
    Object.values(categoryPlans || {}).forEach(cat => {
      if (cat) {
        totalMonthlyTargetHours += cat.monthlyTargetHours || 0;
        if (cat.monthlyGoalTitle && cat.monthlyGoalTitle.trim().length > 0) {
          deliverablesCount++;
        }
      }
    });

    return {
      monthNameEn,
      monthNameAm,
      displayMonth,
      totalMonthlyTargetHours: totalMonthlyTargetHours.toFixed(1),
      deliverablesCount,
      activeStreamsCount: Object.keys(categoryPlans).length
    };
  }, [monthOffset, categoryPlans, calendarSystem]);

  // --------------------------------------------------------------------------
  // Simple Plan / Edit Block Modal State
  // --------------------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);

  const [modalCategory, setModalCategory] = useState<string>('exercise');
  const [modalTitle, setModalTitle] = useState('');
  const [modalStartTime, setModalStartTime] = useState('08:00 AM');
  const [modalDuration, setModalDuration] = useState(45);
  const [modalCadenceType, setModalCadenceType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [modalMonthlyWeeks, setModalMonthlyWeeks] = useState<number>(4);
  const [modalSelectedDays, setModalSelectedDays] = useState<number[]>([3]); // default Wednesday = 3
  const [modalChecklist, setModalChecklist] = useState<string[]>(['']);

  // Schedule Overlap Conflict Modal State
  const [scheduleConflict, setScheduleConflict] = useState<ScheduleConflictResult | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Open modal for a new block
  const handleOpenNewBlockModal = (defaultCatId?: string, forceWeekly = false) => {
    const catId = defaultCatId || (selectedStreamFilter !== 'all' ? selectedStreamFilter : Object.keys(categoryPlans)[0] || 'exercise');
    const dayOfWeek = (selectedDate.getDay() + 6) % 7 + 1;
    
    setEditingTask(null);
    setModalCategory(catId);
    setModalTitle('');
    setModalStartTime('08:00 AM');
    setModalDuration(45);
    setModalCadenceType(forceWeekly || plannerHorizon === 'weekly' ? 'weekly' : (plannerHorizon === 'monthly' ? 'monthly' : 'daily'));
    setModalSelectedDays([dayOfWeek]);
    setModalMonthlyWeeks(4);
    setModalChecklist(['']);
    setIsModalOpen(true);
    try { soundEngine.playPop(); } catch {}
  };

  // Open modal to edit existing block
  const handleOpenEditBlockModal = (task: ScheduleTask) => {
    setEditingTask(task);
    
    let foundCatId = 'exercise';
    for (const [id, plan] of Object.entries(categoryPlans)) {
      if (task.badge && task.badge.toLowerCase() === plan.title.toLowerCase()) {
        foundCatId = id;
        break;
      }
      if (task.domain) {
        if (task.domain === 'CHESS' && id === 'chess') foundCatId = id;
        if (task.domain === 'PHYSICAL_FITNESS' && id === 'exercise') foundCatId = id;
        if (task.domain === 'OIL_PAINTING' && id === 'art') foundCatId = id;
        if (task.domain === 'GUITAR' && id === 'music') foundCatId = id;
        if (task.domain === 'ARCHITECTURE' && id === 'architecture') foundCatId = id;
        if (task.domain === 'TRADING' && id === 'trading') foundCatId = id;
        if (task.domain === 'DEVOTION_PRAYER' && id === 'devotion') foundCatId = id;
      }
    }

    setModalCategory(foundCatId);
    setModalTitle(task.title);
    setModalStartTime(task.startTime || '08:00 AM');
    setModalDuration(task.durationMin || 45);
    setModalCadenceType(task.date ? 'daily' : 'weekly');
    setModalSelectedDays(task.dayOfWeek ? [task.dayOfWeek] : [(selectedDate.getDay() + 6) % 7 + 1]);
    setModalMonthlyWeeks(4);
    setModalChecklist(task.checklist && task.checklist.length > 0 ? task.checklist.map(c => c.text) : ['']);
    setIsModalOpen(true);
    try { soundEngine.playPop(); } catch {}
  };

  // Toggle day selection in modal
  const handleToggleModalDay = (dayNum: number) => {
    setModalSelectedDays(prev => 
      prev.includes(dayNum) 
        ? (prev.length > 1 ? prev.filter(d => d !== dayNum) : prev) 
        : [...prev, dayNum].sort((a, b) => a - b)
    );
  };

  // Save Block
  const handleSaveBlock = () => {
    if (!modalTitle.trim()) return;

    const chosenCategory = (modalCategory && categoryPlans[modalCategory]) || Object.values(categoryPlans || {}).filter(Boolean)[0] || { id: 'chess', title: 'Chess', color: '#8b5cf6' };
    const categoryTitle = chosenCategory?.title || 'Chess';
    const categoryColor = chosenCategory?.color || '#8b5cf6';
    
    let domain: DomainType = 'CHESS';
    if (modalCategory === 'exercise') domain = 'PHYSICAL_FITNESS';
    else if (modalCategory === 'chess') domain = 'CHESS';
    else if (modalCategory === 'art') domain = 'OIL_PAINTING';
    else if (modalCategory === 'music') domain = 'GUITAR';
    else if (modalCategory === 'architecture') domain = 'ARCHITECTURE_DESIGN';
    else if (modalCategory === 'trading') domain = 'FOREX_TRADING';
    else if (modalCategory === 'devotion') domain = 'DEVOTION_PRAYER';

    const checklistItems = modalChecklist
      .filter(t => t.trim().length > 0)
      .map((text, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        text: text.trim(),
        done: false
      }));

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    const conflict = checkScheduleConflict({
      proposedTask: {
        id: editingTask?.id,
        title: modalTitle.trim(),
        startTime: modalStartTime,
        durationMin: modalDuration,
        categoryId: modalCategory,
        domain,
        badge: categoryTitle,
      },
      dateStr,
      dayOfWeek: modalCadenceType !== 'daily' ? modalSelectedDays[0] : undefined,
      existingTasks: tasks,
      categoryPlans,
    });

    if (conflict.hasConflict) {
      setScheduleConflict(conflict);
      setIsConflictModalOpen(true);
      try { soundEngine.playTouchSound(); } catch {}
      return; // Do not save overlapping schedule block
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: modalTitle.trim(),
        startTime: modalStartTime,
        durationMin: modalDuration,
        color: categoryColor,
        badge: categoryTitle,
        domain,
        checklist: checklistItems.length > 0 ? checklistItems : editingTask.checklist,
        date: modalCadenceType === 'daily' ? dateStr : undefined,
        dayOfWeek: modalCadenceType !== 'daily' ? modalSelectedDays[0] : undefined
      });
    } else {
      if (modalCadenceType === 'daily') {
        addTask({
          title: modalTitle.trim(),
          startTime: modalStartTime,
          durationMin: modalDuration,
          completed: false,
          color: categoryColor,
          badge: categoryTitle,
          domain,
          checklist: checklistItems,
          date: dateStr,
          dayOfWeek: (selectedDate.getDay() + 6) % 7 + 1
        });
      } else if (modalCadenceType === 'weekly') {
        const monday = new Date(mondayOfWeek);
        modalSelectedDays.forEach(dayNum => {
          const targetD = new Date(monday);
          targetD.setDate(monday.getDate() + (dayNum - 1));
          const tDateStr = `${targetD.getFullYear()}-${String(targetD.getMonth() + 1).padStart(2, '0')}-${String(targetD.getDate()).padStart(2, '0')}`;
          addTask({
            title: modalTitle.trim(),
            startTime: modalStartTime,
            durationMin: modalDuration,
            completed: false,
            color: categoryColor,
            badge: categoryTitle,
            domain,
            checklist: checklistItems,
            date: tDateStr,
            dayOfWeek: dayNum
          });
        });

        try {
          const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const existingSummary = chosenCategory?.weeklyScheduleSummary || [];
          const newSlots = modalSelectedDays.map(d => `${dayNames[d - 1]} ${modalStartTime}: ${modalTitle.trim()} (${modalDuration}m)`);
          const mergedSummary = Array.from(new Set([...existingSummary, ...newSlots]));
          updateCategorySchedule(modalCategory, mergedSummary, chosenCategory?.weeklyTargetHours || 5);
        } catch (e) {
          console.warn('Could not sync category weekly summary:', e);
        }
      } else if (modalCadenceType === 'monthly') {
        const monday = new Date(mondayOfWeek);
        const weeks = Math.max(1, Math.min(modalMonthlyWeeks, 12));
        for (let w = 0; w < weeks; w++) {
          modalSelectedDays.forEach(dayNum => {
            const targetD = new Date(monday);
            targetD.setDate(monday.getDate() + (w * 7) + (dayNum - 1));
            const tDateStr = `${targetD.getFullYear()}-${String(targetD.getMonth() + 1).padStart(2, '0')}-${String(targetD.getDate()).padStart(2, '0')}`;
            addTask({
              title: modalTitle.trim(),
              startTime: modalStartTime,
              durationMin: modalDuration,
              completed: false,
              color: categoryColor,
              badge: categoryTitle,
              domain,
              checklist: checklistItems,
              date: tDateStr,
              dayOfWeek: dayNum,
              notes: `Monthly Block (Week ${w + 1})`
            });
          });
        }
      }
    }

    try { soundEngine.playChime(); } catch {}
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    setIsModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // Monthly Goal / Deliverable Modal State
  // --------------------------------------------------------------------------
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [monthlyModalCatId, setMonthlyModalCatId] = useState<string>('exercise');
  const [monthlyModalGoalTitle, setMonthlyModalGoalTitle] = useState('');
  const [monthlyModalMetric, setMonthlyModalMetric] = useState('');
  const [monthlyModalHours, setMonthlyModalHours] = useState(20);

  const handleOpenMonthlyGoalModal = (catId?: string) => {
    const targetCat = (catId && categoryPlans[catId]) ? categoryPlans[catId] : (Object.values(categoryPlans || {}).filter(Boolean)[0] || { id: 'stream', title: 'Focus', color: '#0082ff' });
    const cId = targetCat?.id || 'exercise';
    setMonthlyModalCatId(cId);
    setMonthlyModalGoalTitle(targetCat?.monthlyGoalTitle || '');
    setMonthlyModalMetric(targetCat?.monthlyTargetMetric || '');
    setMonthlyModalHours(targetCat?.monthlyTargetHours || 20);
    setIsMonthlyModalOpen(true);
    try { soundEngine.playPop(); } catch {}
  };

  const handleSaveMonthlyGoal = () => {
    if (!monthlyModalGoalTitle.trim()) return;
    updateCategoryMonthlyDeliverable(
      monthlyModalCatId,
      monthlyModalGoalTitle.trim(),
      monthlyModalMetric.trim(),
      monthlyModalHours
    );
    try { soundEngine.playChime(); } catch {}
    confetti({ particleCount: 30, spread: 55, origin: { y: 0.5 } });
    setIsMonthlyModalOpen(false);
  };

  // Helper to adjust Weekly Target Hours for a stream
  const handleAdjustWeeklyHours = (catId: string, delta: number) => {
    const cat = categoryPlans[catId];
    if (!cat) return;
    const newHours = Math.max(0.5, (cat.weeklyTargetHours || 5) + delta);
    updateCategorySchedule(catId, cat.weeklyScheduleSummary || [], Number(newHours.toFixed(1)));
    try { soundEngine.playPencil(); } catch {}
  };

  // Helper to adjust Monthly Target Hours for a stream
  const handleAdjustMonthlyHours = (catId: string, delta: number) => {
    const cat = categoryPlans[catId];
    if (!cat) return;
    const newHours = Math.max(1, (cat.monthlyTargetHours || 20) + delta);
    updateCategoryPlan(catId, { monthlyTargetHours: Number(newHours.toFixed(1)) });
    try { soundEngine.playPencil(); } catch {}
  };

  // Helper to remove a recurring weekly slot
  const handleRemoveWeeklySlot = (catId: string, slotToRemove: string) => {
    const cat = categoryPlans[catId];
    if (!cat) return;
    const updated = (cat.weeklyScheduleSummary || []).filter(s => s !== slotToRemove);
    updateCategorySchedule(catId, updated, cat.weeklyTargetHours || 5);
    try { soundEngine.playPencil(); } catch {}
  };

  // Inline Checklist addition directly on card
  const [inlineStepInputs, setInlineStepInputs] = useState<Record<string, string>>({});
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);

  const handleAddInlineStep = (taskId: string) => {
    const text = inlineStepInputs[taskId];
    if (!text || !text.trim()) return;

    const task = activeTasks.find(t => t.id === taskId);
    if (!task) return;

    const currentChecklist = task.checklist || [];
    const updated = [
      ...currentChecklist,
      { id: `step-${Date.now()}`, text: text.trim(), done: false }
    ];

    updateTask(taskId, { checklist: updated });
    setInlineStepInputs(prev => ({ ...prev, [taskId]: '' }));
    try { soundEngine.playPencil(); } catch {}
  };

  const handleToggleChecklistStep = (taskId: string, stepId: string) => {
    const task = activeTasks.find(t => t.id === taskId);
    if (!task || !task.checklist) return;

    const updated = task.checklist.map(c => c.id === stepId ? { ...c, done: !c.done } : c);
    updateTask(taskId, { checklist: updated });
    try { soundEngine.playPencil(); } catch {}
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    try { soundEngine.playPencil(); } catch {}
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-2 pb-24 md:pb-12 animate-fadeIn select-none">
      
      {/* =========================================================================
          THE MASTER PLANNER CONTAINER (Clean Native Card - No Sticky Note Background)
          ========================================================================= */}
      <div className="relative w-full rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#121620] p-4 sm:p-7 shadow-xs transition-all duration-300">
        
        {/* -----------------------------------------------------------------------
            TOP BAR: Horizon Switcher (Daily / Weekly / Monthly / Goals) + Subview + 3-Dots Filter Toggle
            ----------------------------------------------------------------------- */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-3 relative z-30">
          
          {/* Main 4 Horizons Segmented Control: Daily / Weekly / Monthly / Goals */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs backdrop-blur-md shrink-0">
            <button
              onClick={() => handleSelectHorizon('daily')}
              title={language === 'am' ? 'ዕለታዊ እቅድ' : 'Daily Execution'}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                plannerHorizon === 'daily'
                  ? 'bg-[#0082ff] text-white shadow-xs scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sun size={15} strokeWidth={2.4} className={plannerHorizon === 'daily' ? 'text-amber-200' : 'text-amber-500'} />
              <span className="hidden sm:inline">{language === 'am' ? 'ዕለታዊ' : 'Daily'}</span>
            </button>

            <button
              onClick={() => handleSelectHorizon('weekly')}
              title={language === 'am' ? 'ሳምንታዊ ዒላማዎች' : 'Weekly Targets'}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                plannerHorizon === 'weekly'
                  ? 'bg-[#0082ff] text-white shadow-xs scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <CalendarDays size={15} strokeWidth={2.4} className={plannerHorizon === 'weekly' ? 'text-blue-100' : 'text-blue-500'} />
              <span className="hidden sm:inline">{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</span>
            </button>

            <button
              onClick={() => handleSelectHorizon('monthly')}
              title={language === 'am' ? 'ወርሃዊ ግቦች' : 'Monthly Goals'}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                plannerHorizon === 'monthly'
                  ? 'bg-[#0082ff] text-white shadow-xs scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Moon size={15} strokeWidth={2.4} className={plannerHorizon === 'monthly' ? 'text-indigo-200' : 'text-indigo-400'} />
              <span className="hidden sm:inline">{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</span>
            </button>

            <button
              onClick={() => handleSelectHorizon('goals')}
              title={language === 'am' ? 'ስልታዊ ግቦች' : 'Strategic Goals'}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                plannerHorizon === 'goals'
                  ? 'bg-[#0082ff] text-white shadow-xs scale-[1.02]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Target size={15} strokeWidth={2.4} className={plannerHorizon === 'goals' ? 'text-rose-200' : 'text-rose-500'} />
              <span className="hidden sm:inline">{language === 'am' ? 'ግቦች' : 'Goals'}</span>
            </button>
          </div>

          {/* Right Controls: SubView Switcher + Active Stream Chip + 3-Vertical-Dots Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {plannerHorizon === 'daily' && (
              <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <button
                  onClick={() => {
                    setDailySubView('day');
                    try { soundEngine.playClick(); } catch {}
                  }}
                  title={language === 'am' ? 'የቀን አጀንዳ' : 'Day Agenda'}
                  className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    dailySubView === 'day'
                      ? 'bg-[#0082ff] text-white shadow-xs scale-[1.02]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <List size={15} strokeWidth={2.4} />
                  <span className="hidden md:inline">{language === 'am' ? 'አጀንዳ' : 'Day'}</span>
                </button>
                <button
                  onClick={() => {
                    setDailySubView('week');
                    try { soundEngine.playClick(); } catch {}
                  }}
                  title={language === 'am' ? 'የ7 ቀን ሰሌዳ' : '7-Day Grid'}
                  className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    dailySubView === 'week'
                      ? 'bg-[#0082ff] text-white shadow-xs scale-[1.02]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid size={15} strokeWidth={2.4} />
                  <span className="hidden md:inline">{language === 'am' ? 'ሰሌዳ' : 'Grid'}</span>
                </button>
              </div>
            )}

            {/* Active stream filter chip if collapsed */}
            {!isStreamFiltersExpanded && selectedStreamFilter !== 'all' && categoryPlans[selectedStreamFilter] && (
              <div className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs animate-fadeIn shrink-0">
                <span
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
                  style={{ backgroundColor: categoryPlans[selectedStreamFilter]?.color || '#0082ff' }}
                />
                <span className="max-w-[65px] sm:max-w-[110px] truncate">
                  {getCategoryTitleTranslated(selectedStreamFilter, categoryPlans[selectedStreamFilter]?.title)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStreamFilter('all');
                    try { soundEngine.playClick(); } catch {}
                  }}
                  className="p-0.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Clear filter"
                >
                  <X size={11} strokeWidth={2.4} />
                </button>
              </div>
            )}

            {/* 3-Vertical-Dots Button to Collapse / Expand Stream Filters */}
            <button
              type="button"
              data-testid="stream-filters-toggle"
              onClick={() => {
                setIsStreamFiltersExpanded(prev => !prev);
                try { soundEngine.playClick(); } catch {}
              }}
              title={
                isStreamFiltersExpanded
                  ? (language === 'am' ? 'የክፍል ማጣሪያዎችን አሳንስ' : 'Collapse Category Filters')
                  : (language === 'am' ? 'የክፍል ማጣሪያዎችን ዘርጋ' : 'Expand Category Filters')
              }
              className={`p-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative border shadow-xs active:scale-95 ${
                isStreamFiltersExpanded
                  ? 'bg-[#0082ff] text-white border-blue-600 shadow-sm scale-[1.02]'
                  : selectedStreamFilter !== 'all'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-[#0082ff] border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <MoreVertical size={16} strokeWidth={2.4} />
              {selectedStreamFilter !== 'all' && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"
                  style={{ backgroundColor: categoryPlans[selectedStreamFilter]?.color || '#0082ff' }}
                />
              )}
            </button>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            STREAM FILTER BAR: Collapsible under 3-Vertical-Dots
            ----------------------------------------------------------------------- */}
        {isStreamFiltersExpanded && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none select-none relative z-20 border-b border-black/5 dark:border-white/5 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setSelectedStreamFilter('all');
                try { soundEngine.playPencil(); } catch {}
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                selectedStreamFilter === 'all'
                  ? 'bg-[#0082ff] text-white shadow-xs scale-102 font-extrabold'
                  : `${currentTheme.buttonBg} ${currentTheme.textSecondary} hover:${currentTheme.textPrimary}`
              }`}
            >
              <span className="text-sm">🌐</span>
              <span>{language === 'am' ? 'ሁሉም' : 'All'}</span>
            </button>

            {Object.values(categoryPlans).filter(cat => cat && cat.id).map(cat => {
              const CatIcon = getCategoryIcon(cat.id);
              const isSelected = selectedStreamFilter === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedStreamFilter(isSelected ? 'all' : cat.id);
                    try { soundEngine.playPencil(); } catch {}
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'text-white shadow-xs scale-102 font-extrabold ring-1 ring-white/30'
                      : `${currentTheme.buttonBg} ${currentTheme.textSecondary} hover:${currentTheme.textPrimary}`
                  }`}
                  style={isSelected ? { backgroundColor: cat.color } : {}}
                >
                  <CatIcon size={13} style={{ color: isSelected ? '#ffffff' : cat.color }} />
                  <span>{getCategoryTitleTranslated(cat.id, cat.title)}</span>
                </button>
              );
            })}

            {/* Quick collapse button at end of row */}
            <button
              type="button"
              onClick={() => setIsStreamFiltersExpanded(false)}
              title={language === 'am' ? 'ማጣሪያዎችን አሳንስ' : 'Collapse filters'}
              className="px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronUp size={14} strokeWidth={2.4} />
              <span className="text-[11px] font-semibold">{language === 'am' ? 'አሳንስ' : 'Collapse'}</span>
            </button>
          </div>
        )}

        {/* =======================================================================
            HORIZON 1: DAILY PLANNING VIEW
            ======================================================================= */}
        {plannerHorizon === 'daily' && (
          <div className="space-y-4">
            
            {/* Dual Date Switcher Row */}
            <div className="flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-md">
                <button
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className={`p-1.5 rounded-xl cursor-pointer ${currentTheme.buttonBg} transition-transform active:scale-90`}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="px-2 py-0.5 text-center">
                  <div className={`text-xs sm:text-sm font-bold tracking-tight ${currentTheme.textPrimary} flex items-center gap-1.5`}>
                    <span>{dualDateInfo.shortDual}</span>
                  </div>
                </div>

                <button
                  onClick={handleNextDay}
                  title="Next Day"
                  className={`p-1.5 rounded-xl cursor-pointer ${currentTheme.buttonBg} transition-transform active:scale-90`}
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  onClick={handleJumpToToday}
                  className={`text-[10px] font-bold px-2 py-1 rounded-xl cursor-pointer ${
                    selectedDate.toDateString() === new Date().toDateString()
                      ? 'bg-[#0082ff] text-white shadow-xs'
                      : currentTheme.buttonBg
                  } transition-all active:scale-95 ml-0.5`}
                >
                  {language === 'am' ? 'ዛሬ' : 'Today'}
                </button>
              </div>

              {/* Quick + Add Block icon-only button on date row */}
              <button
                onClick={() => handleOpenNewBlockModal()}
                title={language === 'am' ? 'አዲስ ብሎክ ጨምር' : 'Add Block'}
                className="w-8 h-8 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-90 shrink-0"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* 7-Day Week Strip */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 relative z-10">
              {weekDays.map((day) => (
                <button
                  key={day.dayOfWeekNum}
                  onClick={() => {
                    setSelectedDate(day.date);
                    try { soundEngine.playPencil(); } catch {}
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-0.5 sm:py-2 sm:px-1 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer ${
                    day.isSelected
                      ? 'bg-[#0082ff] text-white border-blue-500 shadow-md scale-102 z-10'
                      : day.isToday
                      ? 'bg-amber-400/20 dark:bg-amber-400/10 border-amber-400/40 text-amber-900 dark:text-amber-300'
                      : `${currentTheme.cardBg} border-black/5 dark:border-white/5 ${currentTheme.textPrimary} hover:scale-101`
                  }`}
                >
                  <span className={`text-[8.5px] sm:text-[9.5px] font-semibold tracking-normal uppercase ${
                    day.isSelected ? 'text-white' : currentTheme.textSecondary
                  }`}>
                    {language === 'am' ? day.dayNameAm : day.dayNameEn}
                    {day.isSunday ? ' 🌿' : ''}
                  </span>

                  <span className={`text-xs sm:text-[13px] font-bold my-0.5 ${
                    day.isSelected ? 'text-white' : currentTheme.textPrimary
                  }`}>
                    {day.dayNumber}
                  </span>

                  <div className="h-1.5 sm:h-2 flex items-center justify-center gap-0.5">
                    {day.streamDots && day.streamDots.length > 0 ? (
                      day.streamDots.slice(0, 3).map((dotColor, dotIdx) => (
                        <span
                          key={dotIdx}
                          className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shadow-2xs"
                          style={{ backgroundColor: day.isSelected ? '#ffffff' : dotColor }}
                        />
                      ))
                    ) : day.taskCount > 0 ? (
                      <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                        day.isSelected ? 'bg-white' : 'bg-[#0082ff]'
                      }`} />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            {/* Daily Summary Card */}
            <div className={`p-3.5 sm:p-4 rounded-2xl ${currentTheme.cardBg} border border-black/5 dark:border-white/5 shadow-xs relative z-10`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={`text-xs sm:text-sm font-extrabold ${currentTheme.textPrimary} flex items-center gap-2`}>
                    <Clock size={15} className="text-[#0082ff]" />
                    <span>
                      {language === 'am' ? 'የታቀደ ሰዓት:' : 'Planned:'}{' '}
                      <span className="text-[#0082ff]">{activeStats.totalHours}h</span>
                    </span>
                    <span className="opacity-40">•</span>
                    <span>
                      {activeStats.allCount}{' '}
                      {language === 'am' ? 'ብሎኮች' : 'blocks'}
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {(['all', 'remaining', 'done'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setFilterMode(mode)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                          filterMode === mode
                            ? 'bg-[#0082ff] text-white shadow-xs'
                            : `${currentTheme.buttonBg} ${currentTheme.textSecondary}`
                        }`}
                      >
                        {mode === 'all' 
                          ? `${language === 'am' ? 'ሁሉም' : 'All'} (${activeStats.allCount})` 
                          : mode === 'remaining' 
                          ? `${language === 'am' ? 'የቀሩ' : 'Active'} (${activeStats.remainingCount})` 
                          : `${language === 'am' ? 'የተጠናቀቁ' : 'Done'} (${activeStats.doneCount})`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenNewBlockModal()}
                  className="px-4 py-2 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>{language === 'am' ? 'አዲስ ብሎክ' : 'Add Block'}</span>
                </button>
              </div>
            </div>

            {/* Daily Sub-View: Day Agenda vs 7-Day Grid */}
            {dailySubView === 'day' ? (
              <div className="space-y-3 relative z-10">
                
                {/* Sunday Special Card */}
                {isSelectedSunday && (
                  <div className={`p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/30 mb-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm">
                        <span>🌿</span>
                        <span>{language === 'am' ? 'የእሁድ እረፍትና መንፈሳዊ እድሳት' : 'Sunday Rest & Renewal'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700/80 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Sabbath Rest
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {sundayHabits.map(habit => (
                        <button
                          key={habit.id}
                          onClick={() => toggleSundayHabit(habit.id)}
                          className={`text-left p-2 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                            habit.completed
                              ? 'bg-emerald-600/20 line-through text-emerald-900/60 dark:text-emerald-300/50'
                              : 'bg-white/70 dark:bg-slate-900/50 hover:bg-white text-emerald-950 dark:text-emerald-100 shadow-2xs'
                          }`}
                        >
                          <span className="text-sm">{habit.icon}</span>
                          <span className="flex-1 truncate">{habit.text}</span>
                          {habit.completed && <Check size={14} className="text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scheduled Blocks grouped by Category */}
                {tasksGroupedByCategory.length > 0 ? (
                  tasksGroupedByCategory.map((group) => {
                    const CatIcon = group.category.Icon;
                    const isExpanded = expandedCategories[group.category.id] !== false;

                    return (
                      <div 
                        key={group.category.id} 
                        className="mb-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-xs hover:shadow-sm transition-all overflow-hidden"
                        style={{
                          boxShadow: `0 4px 20px -2px ${group.category.color}15`,
                        }}
                      >
                        {/* Category Group Header Card */}
                        <div 
                          onClick={() => toggleCategoryExpand(group.category.id)}
                          className="flex items-center justify-between p-3 sm:p-3.5 transition-all cursor-pointer select-none border-b border-black/5 dark:border-white/5"
                          style={{
                            background: `linear-gradient(to right, ${group.category.color}12, transparent 85%)`,
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                              style={{ 
                                backgroundColor: `${group.category.color}25`, 
                                color: group.category.color,
                                boxShadow: `0 2px 8px ${group.category.color}30`
                              }}
                            >
                              <CatIcon size={15} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 truncate">
                                  {getCategoryTitleTranslated(group.category.id, group.category.title)}
                                </span>
                                <span 
                                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                                  style={{ backgroundColor: `${group.category.color}18`, color: group.category.color }}
                                >
                                  {group.tasks.length} {group.tasks.length === 1 ? (language === 'am' ? 'ብሎክ' : 'block') : (language === 'am' ? 'ብሎኮች' : 'blocks')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                              {group.completedCount}/{group.tasks.length} • {formatTaskDuration(group.totalDuration)}
                            </span>

                            {/* Quick Add Block Button for this Category */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNewBlockModal(group.category.id);
                              }}
                              className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 flex items-center justify-center transition active:scale-90 cursor-pointer"
                              title={language === 'am' ? 'በዚህ ዘርፍ ብሎክ ጨምር' : `Add block to ${group.category.title}`}
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>

                            {/* Expand/Collapse Chevron */}
                            <div className="p-1 text-slate-400">
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </div>
                          </div>
                        </div>

                        {/* Task Cards under this Category */}
                        {isExpanded && (
                          <div className="p-2 sm:p-3 space-y-2">
                            {group.tasks.map((task) => {
                              const catInfo = resolveTaskCategory(task);
                              const isActive = activeTask?.id === task.id;
                              const timeRange = formatTimeRange(task.startTime, task.durationMin);

                              return (
                                <div
                                  key={task.id}
                                  data-plan-task-id={task.id}
                                  draggable={!task.completed}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    setDraggedTaskId(task.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', task.id);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.dataTransfer.dropEffect = 'move';
                                    if (dragOverTaskId !== task.id) {
                                      setDragOverTaskId(task.id);
                                    }
                                  }}
                                  onDragLeave={(e) => {
                                    e.stopPropagation();
                                    if (dragOverTaskId === task.id) setDragOverTaskId(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const fromId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                                    if (fromId && fromId !== task.id) {
                                      reorderTasks(fromId, task.id);
                                      try { soundEngine.playPencil(); } catch {}
                                    }
                                    setDraggedTaskId(null);
                                    setDragOverTaskId(null);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedTaskId(null);
                                    setDragOverTaskId(null);
                                  }}
                                  className={`group/task p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                                    draggedTaskId === task.id
                                      ? 'opacity-40 scale-98 border-dashed border-[#0082ff] bg-blue-50/30'
                                      : dragOverTaskId === task.id
                                      ? 'border-2 border-[#0082ff] bg-blue-50/40 scale-[1.01]'
                                      : isActive
                                      ? 'bg-blue-50/40 dark:bg-blue-950/30 border-[#0082ff]/40 shadow-sm ring-1 ring-[#0082ff]/30'
                                      : task.completed
                                      ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/40 dark:border-slate-800/40 opacity-70'
                                      : 'bg-white dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                                  }`}
                                >
                                  {/* Subtle Category Color Left Accent Pill */}
                                  <div 
                                    className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full transition-all group-hover/task:w-1.5"
                                    style={{ backgroundColor: catInfo.color }}
                                  />

                                  <div className="flex items-center justify-between gap-2 sm:gap-2.5 pl-1.5">
                                    {/* Left: Drag Handle, Completion / Status Ring, Time Range & Title */}
                                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                                      {/* Plan Task Drag Handle */}
                                      <div 
                                        className="text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0 -ml-1 select-none transition-colors"
                                        title={language === 'am' ? 'ብሎኩን ጎትተህ ቦታውን ቀይር' : 'Drag to reorder in plan'}
                                        onClick={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => handlePlanTaskTouchStart(e, task.id)}
                                        onTouchMove={handlePlanTaskTouchMove}
                                        onTouchEnd={handlePlanTaskTouchEnd}
                                      >
                                        <GripVertical size={14} />
                                      </div>

                                      {/* Completion / Status Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isViewingToday) {
                                            toggleTaskCompletion(task.id);
                                            try { soundEngine.playSound('CHIME_MEDITATION'); } catch {}
                                          }
                                        }}
                                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                          task.completed
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs scale-105'
                                            : isViewingToday
                                            ? 'border-slate-300 dark:border-slate-600 hover:border-[#0082ff] hover:scale-110 bg-transparent cursor-pointer'
                                            : 'border-dashed border-slate-300 dark:border-slate-600 bg-transparent cursor-default opacity-50'
                                        }`}
                                        title={task.completed ? 'Completed' : isViewingToday ? (language === 'am' ? 'እንደተጠናቀቀ ምልክት አድርግ' : 'Mark completed') : (language === 'am' ? 'የታቀደ ብሎክ' : 'Planned block')}
                                      >
                                        {task.completed ? (
                                          <Check size={12} strokeWidth={3} />
                                        ) : isFutureDay ? (
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        ) : null}
                                      </button>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                          {/* Time Range Pill */}
                                          <div className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold ${currentTheme.textSecondary} bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md`}>
                                            <Clock size={11} className="text-[#0082ff] shrink-0" />
                                            <span>{timeRange}</span>
                                          </div>

                                          {/* Duration Badge */}
                                          <span 
                                            className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md"
                                            style={{ backgroundColor: `${catInfo.color}15`, color: catInfo.color }}
                                          >
                                            {formatTaskDuration(task.durationMin || 45)}
                                          </span>

                                          {/* Cadence Badge */}
                                          {!task.date ? (
                                            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50">
                                              {language === 'am' ? 'ሳምንታዊ' : 'Weekly'}
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                              {task.date}
                                            </span>
                                          )}

                                          {/* Active LIVE timer pill */}
                                          {isActive && (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 animate-pulse">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                              <span>LIVE</span>
                                            </span>
                                          )}
                                        </div>

                                        {/* Task Title */}
                                        <h4 className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                                          task.completed ? 'line-through text-slate-400 dark:text-slate-500' : currentTheme.textPrimary
                                        }`}>
                                          {task.title}
                                        </h4>
                                      </div>
                                    </div>

                                    {/* Right: Quick Action Focus/Play Button, Edit & Menu */}
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                      {/* Quick Focus Session Play Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startTimerForTask(task);
                                          try { soundEngine.playBlockTimerStartMusic(); } catch {}
                                        }}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 hover:bg-[#0082ff] text-[#0082ff] hover:text-white dark:bg-blue-950/60 dark:hover:bg-[#0082ff] dark:text-blue-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
                                        title={language === 'am' ? 'ትኩረት ጀምር' : 'Start Focus Timer'}
                                      >
                                        <Play size={12} fill="currentColor" className="ml-0.5" />
                                      </button>

                                      {/* Quick Edit Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditBlockModal(task);
                                        }}
                                        className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                        title={language === 'am' ? 'አስተካክል' : 'Edit'}
                                      >
                                        <Edit3 size={13} />
                                      </button>

                                      {/* 3 Vertical Dots Menu: More / Delete */}
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenTaskMenuId(openTaskMenuId === task.id ? null : task.id);
                                          }}
                                          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                          title={language === 'am' ? 'ተጨማሪ አማራጮች' : 'More Options'}
                                        >
                                          <MoreVertical size={14} />
                                        </button>

                                        {openTaskMenuId === task.id && (
                                          <>
                                            <div 
                                              className="fixed inset-0 z-40" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenTaskMenuId(null);
                                              }} 
                                            />
                                            <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white dark:bg-[#1a202c] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-1.5 animate-fadeIn space-y-0.5">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenTaskMenuId(null);
                                                  handleOpenEditBlockModal(task);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#0082ff] transition-colors cursor-pointer"
                                              >
                                                <Edit3 size={13} className="text-indigo-500" />
                                                <span>{language === 'am' ? 'አስተካክል' : 'Edit Block'}</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenTaskMenuId(null);
                                                  addTask({
                                                    title: `${task.title} (Copy)`,
                                                    startTime: task.startTime,
                                                    durationMin: task.durationMin,
                                                    domain: task.domain,
                                                    badge: task.badge,
                                                    color: task.color,
                                                    completed: false,
                                                    date: task.date,
                                                  });
                                                  try { soundEngine.playPencil(); } catch {}
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                              >
                                                <Plus size={13} className="text-[#0082ff]" />
                                                <span>{language === 'am' ? 'ቅዳ' : 'Duplicate'}</span>
                                              </button>
                                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-0.5" />
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOpenTaskMenuId(null);
                                                  handleDeleteTask(task.id);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                                              >
                                                <Trash2 size={13} className="text-rose-500" />
                                                <span>{language === 'am' ? 'ሰርዝ' : 'Delete'}</span>
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-2xl mb-3 shadow-inner">
                      📝
                    </div>
                    <h4 className={`text-base font-bold ${currentTheme.textPrimary} tracking-tight`}>
                      {language === 'am' ? 'ለዚህ ቀን የተመዘገበ ብሎክ የለም' : 'No Routine Blocks Scheduled for this Day'}
                    </h4>
                    <p className={`text-xs ${currentTheme.textSecondary} max-w-sm mx-auto mt-1 mb-5`}>
                      {language === 'am'
                        ? 'ዕለታዊ ትኩረትህን ለመገንባት ከታች ካሉት ዘርፎች አንዱን ምረጥ ወይም አዲስ ብሎክ አቅድ።'
                        : 'Design your daily focus by scheduling a routine block from your categories below.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                      {Object.values(categoryPlans || {}).filter(cat => cat && cat.id).slice(0, 5).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleOpenNewBlockModal(cat.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                          style={{ 
                            backgroundColor: `${cat.color}15`, 
                            borderColor: `${cat.color}40`,
                            color: cat.color 
                          }}
                        >
                          <Plus size={13} />
                          <span>{cat.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 7-Day Grid View */
              <div className="space-y-3 relative z-10">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Weekly Routine Rhythm (Mon - Sun)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {weekDays.map(day => {
                    const daySchedule = getDaySchedule(day.date);
                    const dayTasks = daySchedule.tasks || [];
                    const dayMinutes = dayTasks.reduce((acc, t) => acc + (t.durationMin || 0), 0);
                    const dayHoursNum = (dayMinutes / 60).toFixed(1);
                    const dayHoursStr = Number(dayHoursNum) === 0 ? '0' : dayHoursNum;

                    return (
                      <div
                        key={day.dayOfWeekNum}
                        onClick={() => {
                          setSelectedDate(day.date);
                          setDailySubView('day');
                          try { soundEngine.playPencil(); } catch {}
                        }}
                        className={`p-3.5 rounded-2xl ${currentTheme.cardBg} border transition-all cursor-pointer hover:shadow-md ${
                          day.isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-black/5 dark:border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-extrabold ${day.isSelected ? 'text-[#0082ff]' : currentTheme.textPrimary}`}>
                              {language === 'am' ? day.dayNameAm : day.dayNameEn}
                              {day.isSunday ? ' 🌿' : ''}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-[#0082ff]">
                            {dayHoursStr}h ({dayTasks.length})
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {dayTasks.length > 0 ? (
                            dayTasks.map(t => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between text-xs px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || '#0082ff' }} />
                                  <span className={`font-semibold truncate ${currentTheme.textPrimary}`}>{t.title}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                                  {formatTaskDuration(t.durationMin)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-400 py-2 italic text-center">
                              {day.isSunday ? 'Rest & Recharge' : 'No blocks planned'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* =======================================================================
            HORIZON 2: WEEKLY CADENCE & TARGETS PLANNING VIEW
            ======================================================================= */}
        {plannerHorizon === 'weekly' && (
          <div className="space-y-4 relative z-10">
            
            {/* Week Navigator */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-md">
                <button
                  onClick={() => {
                    setWeekOffset(prev => prev - 1);
                    try { soundEngine.playPencil(); } catch {}
                  }}
                  title="Previous Week"
                  className={`p-1.5 rounded-xl cursor-pointer ${currentTheme.buttonBg} transition-transform active:scale-90`}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="px-3 py-0.5 text-center">
                  <span className={`text-xs sm:text-sm font-extrabold ${currentTheme.textPrimary}`}>
                    {weeklyInfo.dateRangeStr}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setWeekOffset(prev => prev + 1);
                    try { soundEngine.playPencil(); } catch {}
                  }}
                  title="Next Week"
                  className={`p-1.5 rounded-xl cursor-pointer ${currentTheme.buttonBg} transition-transform active:scale-90`}
                >
                  <ChevronRight size={16} />
                </button>

                {weekOffset !== 0 && (
                  <button
                    onClick={() => {
                      setWeekOffset(0);
                      try { soundEngine.playPencil(); } catch {}
                    }}
                    className={`text-[10px] font-bold px-2 py-1 rounded-xl cursor-pointer bg-[#0082ff] text-white shadow-xs ml-0.5`}
                  >
                    {language === 'am' ? 'ይህ ሳምንት' : 'This Week'}
                  </button>
                )}
              </div>

              {/* Action Button: + Add Weekly Routine */}
              <button
                onClick={() => handleOpenNewBlockModal(undefined, true)}
                title={language === 'am' ? 'ሳምንታዊ ሪትም ጨምር' : 'Add Routine'}
                className="w-8 h-8 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-90 shrink-0"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Weekly Summary Card */}
            <div className={`p-4 rounded-2xl ${currentTheme.cardBg} border border-black/5 dark:border-white/5 shadow-xs`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={`text-sm font-extrabold ${currentTheme.textPrimary} flex items-center gap-2`}>
                    <Target size={16} className="text-[#0082ff]" />
                    <span>
                      {language === 'am' ? 'ሳምንታዊ የዒላማ ድምር:' : 'Total Weekly Target:'}{' '}
                      <span className="text-[#0082ff]">{weeklyInfo.totalTargetHours}h / week</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {weeklyInfo.activeStreamsCount} {language === 'am' ? 'ንቁ ክፍሎች' : 'Active Categories'} • {weeklyInfo.totalPlannedRoutines} {language === 'am' ? 'የተመዘገቡ ሳምንታዊ ሪትሞች' : 'recurring routine slots'}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl">
                  {language === 'am' ? 'ከታች የሰዓት ድልድልን አስተካክል' : 'Adjust target hours & days per category'}
                </div>
              </div>
            </div>

            {/* Stream Weekly Cards Grid */}
            <div className="space-y-3">
              {Object.values(categoryPlans || {})
                .filter(cat => cat && cat.id && (selectedStreamFilter === 'all' || cat.id === selectedStreamFilter))
                .map(cat => {
                const IconComponent = getCategoryIcon(cat.id);
                const routines = cat.weeklyScheduleSummary || [];

                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-2xl ${currentTheme.cardBg} border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden transition-all hover:shadow-sm`}
                    style={{
                      boxShadow: `0 4px 20px -2px ${cat.color}15`,
                    }}
                  >
                    {/* Subtle Category Left Accent */}
                    <div 
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {/* Header: Stream Badge & Weekly Target Hours Adjustment */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <IconComponent size={16} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-extrabold ${currentTheme.textPrimary}`}>
                            {cat.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Weekly Cadence
                          </span>
                        </div>
                      </div>

                      {/* Target Hours Controls: [-] 5.0h [+] */}
                      <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-xl">
                        <span className="text-xs text-slate-400 font-bold mr-1">
                          {language === 'am' ? 'ዒላማ:' : 'Target:'}
                        </span>
                        <button
                          onClick={() => handleAdjustWeeklyHours(cat.id, -0.5)}
                          className="w-6 h-6 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer text-xs"
                          title="Decrease 0.5h"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-extrabold text-[#0082ff] px-1.5">
                          {cat.weeklyTargetHours || 5}h
                        </span>
                        <button
                          onClick={() => handleAdjustWeeklyHours(cat.id, 0.5)}
                          className="w-6 h-6 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer text-xs"
                          title="Increase 0.5h"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Recurring Weekly Schedule Slots */}
                    <div className="mb-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        {language === 'am' ? 'የተመዘገቡ ሳምንታዊ ሰዓታት:' : 'Recurring Routine Slots:'}
                      </div>
                      
                      {routines.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {routines.map((slot, sIdx) => (
                            <div
                              key={sIdx}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className={currentTheme.textPrimary}>{slot}</span>
                              <button
                                onClick={() => handleRemoveWeeklySlot(cat.id, slot)}
                                title="Remove Slot"
                                className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic py-1">
                          {language === 'am' ? 'ምንም ሳምንታዊ ሰዓት አልተመደበም።' : 'No recurring schedule slots assigned yet.'}
                        </div>
                      )}
                    </div>

                    {/* Quick + Add Routine Slot button */}
                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenNewBlockModal(cat.id, true)}
                        className="text-xs font-bold text-[#0082ff] hover:text-[#0070df] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        <span>{language === 'am' ? '+ ሳምንታዊ ሪትም ጨምር' : '+ Add Day Routine'}</span>
                      </button>

                      <button
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{language === 'am' ? 'ዝርዝር እይ' : 'Category Details'}</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* =======================================================================
            HORIZON 3: MONTHLY DELIVERABLES & GOALS PLANNING VIEW
            ======================================================================= */}
        {plannerHorizon === 'monthly' && (
          <div className="space-y-4 relative z-10">
            
            {/* Month Navigator */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-md">
                <button
                  onClick={() => {
                    setMonthOffset(prev => prev - 1);
                    try { soundEngine.playPencil(); } catch {}
                  }}
                  title="Previous Month"
                  className={`p-1.5 rounded-xl cursor-pointer ${currentTheme.buttonBg} transition-transform active:scale-90`}
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="px-3 py-0.5 text-center">
                  <span className={`text-xs sm:text-sm font-extrabold ${currentTheme.textPrimary}`}>
                    {monthlyInfo.monthNameEn}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {monthlyInfo.monthNameAm}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setMonthOffset(prev => prev + 1);
                    try { soundEngine.playPencil(); } catch {}
                  }}
                  title="Next Month"
                  className={`p-1.5 rounded-xl cursor-pointer ${currentTheme.buttonBg} transition-transform active:scale-90`}
                >
                  <ChevronRight size={16} />
                </button>

                {monthOffset !== 0 && (
                  <button
                    onClick={() => {
                      setMonthOffset(0);
                      try { soundEngine.playPencil(); } catch {}
                    }}
                    className={`text-[10px] font-bold px-2 py-1 rounded-xl cursor-pointer bg-[#0082ff] text-white shadow-xs ml-0.5`}
                  >
                    {language === 'am' ? 'ይህ ወር' : 'This Month'}
                  </button>
                )}
              </div>

              {/* Action Button: + Set Monthly Goal */}
              <button
                onClick={() => handleOpenMonthlyGoalModal()}
                title={language === 'am' ? 'ወርሃዊ ግብ መድብ' : 'Add Monthly Goal'}
                className="w-8 h-8 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-90 shrink-0"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Interactive Monthly Calendar Grid under Streams */}
            <div className={`p-4 rounded-3xl ${currentTheme.cardBg} border border-black/5 dark:border-white/5 shadow-xs space-y-3 select-none`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-extrabold tracking-wider uppercase ${currentTheme.textPrimary} flex items-center gap-1.5`}>
                  <Calendar size={13} className="text-[#0082ff]" />
                  <span>{monthlyInfo.monthNameEn}</span>
                  {selectedStreamFilter !== 'all' && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] text-white font-bold ml-1.5 shadow-2xs"
                      style={{ backgroundColor: categoryPlans[selectedStreamFilter]?.color || '#0082ff' }}
                    >
                      {categoryPlans[selectedStreamFilter]?.title}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-mono font-bold ${currentTheme.textSecondary}`}>
                  {language === 'am' ? 'ቀኑን በመጫን ተግባራትን ይመልከቱ' : 'Tap any day to preview category blocks'}
                </span>
              </div>

              {/* 7 Weekday Headers (Mon - Sun) */}
              <div className="grid grid-cols-7 gap-1 text-center pb-1 border-b border-black/5 dark:border-white/5">
                {(language === 'am' ? WEEKDAY_NAMES_AM : WEEKDAY_NAMES_EN).map((dName, idx) => (
                  <div 
                    key={dName} 
                    className={`text-[10px] sm:text-xs font-bold tracking-tight py-1 ${
                      idx === 6 ? 'text-emerald-700 dark:text-emerald-400 font-extrabold' : currentTheme.textSecondary
                    }`}
                  >
                    {dName}
                    {idx === 6 ? ' 🌿' : ''}
                  </div>
                ))}
              </div>

              {/* Monthly Dates Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {/* Padding before (previous month days) */}
                {monthlyCalendarData.paddingBefore.map((pDay, idx) => (
                  <div
                    key={`pad-${idx}`}
                    className="min-h-[46px] sm:min-h-[58px] p-1 rounded-xl opacity-20 flex flex-col items-center justify-start pointer-events-none"
                  >
                    <span className="text-[11px] font-mono text-slate-400">{pDay.dayNumber}</span>
                  </div>
                ))}

                {/* Current month days */}
                {monthlyCalendarData.currentMonthDays.map((mDay) => {
                  return (
                    <button
                      key={mDay.dayNumber}
                      type="button"
                      onClick={() => {
                        setSelectedDate(mDay.date);
                        try { soundEngine.playPencil(); } catch {}
                      }}
                      className={`min-h-[46px] sm:min-h-[58px] p-1.5 rounded-xl sm:rounded-2xl border transition-all duration-150 flex flex-col items-center justify-between cursor-pointer ${
                        mDay.isSelected
                          ? 'bg-[#0082ff] text-white border-blue-500 shadow-md scale-102 z-10'
                          : mDay.isToday
                          ? 'bg-amber-400/20 dark:bg-amber-400/10 border-amber-400/50 text-amber-950 dark:text-amber-200'
                          : `hover:bg-black/5 dark:hover:bg-white/5 border-black/5 dark:border-white/5 ${currentTheme.textPrimary}`
                      }`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className={`text-[11px] sm:text-xs font-mono font-bold ${
                          mDay.isSelected ? 'text-white' : mDay.isToday ? 'text-amber-600 dark:text-amber-400 font-black' : currentTheme.textPrimary
                        }`}>
                          {mDay.dayNumber}
                        </span>
                        {mDay.isToday && (
                          <span className={`w-1.5 h-1.5 rounded-full ${mDay.isSelected ? 'bg-white' : 'bg-amber-500'} shrink-0`} title="Today" />
                        )}
                      </div>

                      {/* Stream Dots Indicator */}
                      <div className="flex items-center justify-center gap-0.5 mt-1 flex-wrap h-2.5">
                        {mDay.streamDots.slice(0, 3).map((dotColor, dIdx) => (
                          <span
                            key={dIdx}
                            className="w-1.5 h-1.5 rounded-full shadow-2xs"
                            style={{ backgroundColor: mDay.isSelected ? '#ffffff' : dotColor }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}

                {/* Padding after (next month days) */}
                {monthlyCalendarData.paddingAfter.map((pDay, idx) => (
                  <div
                    key={`pad-after-${idx}`}
                    className="min-h-[46px] sm:min-h-[58px] p-1 rounded-xl opacity-20 flex flex-col items-center justify-start pointer-events-none"
                  >
                    <span className="text-[11px] font-mono text-slate-400">{pDay.dayNumber}</span>
                  </div>
                ))}
              </div>

              {/* Selected Day Agenda Snapshot & Jump to Daily view button */}
              {selectedDate && (
                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-2.5 bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📅</span>
                    <div>
                      <span className={`text-xs font-bold block ${currentTheme.textPrimary}`}>
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`text-[11px] ${currentTheme.textSecondary}`}>
                        {activeTasks.length}{' '}
                        {language === 'am' ? 'የተመዘገቡ ተግባራት' : 'scheduled routine block(s)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenNewBlockModal(selectedStreamFilter !== 'all' ? selectedStreamFilter : undefined);
                      }}
                      className="px-3 py-1.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>{language === 'am' ? 'ብሎክ አቅድ' : 'Plan Block'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectHorizon('daily')}
                      className={`px-3 py-1.5 ${currentTheme.buttonBg} rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-black/10 dark:border-white/10 active:scale-95`}
                    >
                      <span>☀️</span>
                      <span>{language === 'am' ? 'ዕለታዊ እይታ ክፈት' : 'Open in Daily'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Summary Card */}
            <div className={`p-4 rounded-2xl ${currentTheme.cardBg} border border-black/5 dark:border-white/5 shadow-xs`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={`text-sm font-extrabold ${currentTheme.textPrimary} flex items-center gap-2`}>
                    <Award size={16} className="text-[#0082ff]" />
                    <span>
                      {language === 'am' ? 'ወርሃዊ የዒላማ ድምር:' : 'Total Monthly Target:'}{' '}
                      <span className="text-[#0082ff]">{monthlyInfo.totalMonthlyTargetHours}h / month</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {monthlyInfo.deliverablesCount} of {monthlyInfo.activeStreamsCount} {language === 'am' ? 'ክፍሎች ወርሃዊ ግብ አላቸው' : 'categories have active monthly deliverables'}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl">
                  {language === 'am' ? 'ወርሃዊ ዋና ውጤቶችን አስቀምጥ' : 'Define core monthly outcomes'}
                </div>
              </div>
            </div>

            {/* Stream Monthly Cards Grid */}
            <div className="space-y-3">
              {Object.values(categoryPlans || {})
                .filter(cat => cat && cat.id && (selectedStreamFilter === 'all' || cat.id === selectedStreamFilter))
                .map(cat => {
                const IconComponent = getCategoryIcon(cat.id);
                const hasGoal = cat.monthlyGoalTitle && cat.monthlyGoalTitle.trim().length > 0;

                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-2xl ${currentTheme.cardBg} border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden transition-all hover:shadow-sm`}
                    style={{
                      boxShadow: `0 4px 20px -2px ${cat.color}15`,
                    }}
                  >
                    {/* Subtle Category Left Accent */}
                    <div 
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <IconComponent size={16} />
                        </div>
                        <div>
                          <h4 className={`text-sm font-extrabold ${currentTheme.textPrimary}`}>
                            {cat.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Monthly Deliverable
                          </span>
                        </div>
                      </div>

                      {/* Monthly Hours Controls */}
                      <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-xl">
                        <span className="text-xs text-slate-400 font-bold mr-1">
                          {language === 'am' ? 'ዒላማ:' : 'Target:'}
                        </span>
                        <button
                          onClick={() => handleAdjustMonthlyHours(cat.id, -2)}
                          className="w-6 h-6 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer text-xs"
                          title="Decrease 2h"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-extrabold text-[#0082ff] px-1.5">
                          {cat.monthlyTargetHours || 20}h
                        </span>
                        <button
                          onClick={() => handleAdjustMonthlyHours(cat.id, 2)}
                          className="w-6 h-6 rounded-lg bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer text-xs"
                          title="Increase 2h"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Monthly Goal Title & Metric */}
                    <div className="my-2.5 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                      {hasGoal ? (
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className={`text-sm font-bold ${currentTheme.textPrimary}`}>
                                {cat.monthlyGoalTitle}
                              </h5>
                              {cat.monthlyTargetMetric && (
                                <div className="text-xs text-[#0082ff] font-semibold mt-0.5">
                                  🎯 {cat.monthlyTargetMetric}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleOpenMonthlyGoalModal(cat.id)}
                              className="p-1 rounded-lg hover:bg-black/10 text-slate-400 hover:text-blue-500 cursor-pointer"
                              title="Edit Goal"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>

                          {/* Progress Quick Increment */}
                          <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400 font-bold">
                              Progress: {cat.monthlyProgress || 0}%
                            </span>
                            <div className="flex items-center gap-1">
                              {[25, 50, 75, 100].map(pct => (
                                <button
                                  key={pct}
                                  onClick={() => {
                                    updateCategoryPlan(cat.id, { monthlyProgress: pct });
                                    try { soundEngine.playPencil(); } catch {}
                                    if (pct === 100) confetti({ particleCount: 30, spread: 50 });
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                    (cat.monthlyProgress || 0) >= pct
                                      ? 'bg-[#0082ff] text-white'
                                      : 'bg-white/60 dark:bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-slate-400 italic">
                            {language === 'am' ? 'ምንም ወርሃዊ ግብ አልተመደበም።' : 'No monthly deliverable defined yet.'}
                          </span>
                          <button
                            onClick={() => handleOpenMonthlyGoalModal(cat.id)}
                            className="text-xs font-bold text-[#0082ff] hover:text-[#0070df] cursor-pointer flex items-center gap-1"
                          >
                            <Plus size={13} />
                            <span>{language === 'am' ? 'ግብ መድብ' : 'Set Goal'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{language === 'am' ? 'የክፍሉ ዝርዝር' : 'View Category Roadmap'}</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* =======================================================================
            HORIZON 4: STRATEGIC GOALS & HORIZONS PLANNING VIEW
            ======================================================================= */}
        {plannerHorizon === 'goals' && (
          <div className="space-y-4 relative z-10 pt-1">
            <StrategicHorizonsView streamFilter={selectedStreamFilter} isEmbedded={true} />
          </div>
        )}

      </div>

      {/* =========================================================================
          BOTTOM PILL: Clean Stream Quick Navigation
          ========================================================================= */}
      <div className="mt-4 p-2.5 rounded-2xl bg-white/70 dark:bg-[#141822]/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            {language === 'am' ? 'ክፍሎች:' : 'Categories:'}
          </span>
          {Object.values(categoryPlans).filter(cat => cat && cat.id).map(cat => {
            const Icon = getCategoryIcon(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                title={cat.title}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform active:scale-90 flex items-center justify-center shrink-0 cursor-pointer"
                style={{ color: cat.color }}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (plannerHorizon === 'monthly') handleOpenMonthlyGoalModal();
            else handleOpenNewBlockModal();
          }}
          className="text-xs font-bold text-[#0082ff] bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1"
        >
          <Plus size={14} />
          <span>{plannerHorizon === 'monthly' ? (language === 'am' ? 'ግብ' : 'Goal') : (language === 'am' ? 'አቅድ' : 'Plan')}</span>
        </button>
      </div>

      {/* =========================================================================
          MODAL 1: SUPER-FRIENDLY & SIMPLE PLAN BLOCK COMPOSER (Daily & Weekly)
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#181e29] border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {editingTask 
                    ? (language === 'am' ? 'ብሎክ አርትዕ' : 'Edit Routine Block') 
                    : (language === 'am' ? 'አዲስ ብሎክ እቀድ' : 'Plan Routine Block')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              
              {/* 1. Select Stream */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  1. {language === 'am' ? 'ዋና ክፍል ምረጥ' : 'Select Category'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {Object.values(categoryPlans).filter(cat => cat && cat.id).map(cat => {
                    const Icon = getCategoryIcon(cat.id);
                    const isSelected = modalCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setModalCategory(cat.id);
                          try { soundEngine.playPencil(); } catch {}
                        }}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-sm scale-102'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                        style={{
                          backgroundColor: isSelected ? cat.color : undefined,
                          borderColor: isSelected ? cat.color : undefined
                        }}
                      >
                        <Icon size={14} />
                        <span className="truncate">{cat.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Block Title & Quick Suggestions */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  2. {language === 'am' ? 'የብሎኩ ስም / ተግባር' : 'Routine Title'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deep Tactics Puzzles or Compound Workout"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                />
              </div>

              {/* 3. Time & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    {language === 'am' ? 'መጀመሪያ ሰዓት' : 'Start Time'}
                  </label>
                  <input
                    type="text"
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    {language === 'am' ? 'ቆይታ' : 'Duration'}
                  </label>
                  <DurationPicker
                    value={modalDuration}
                    onChange={setModalDuration}
                    size="md"
                    className="w-full justify-between"
                  />
                </div>
              </div>

              {/* 4. Cadence & Schedule Days (Daily / Weekly / Monthly) */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  4. {language === 'am' ? 'የእቅድ አድማስ (Cadence)' : 'Schedule Horizon'}
                </label>
                
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setModalCadenceType('daily');
                      try { soundEngine.playTouchSound(); } catch {}
                    }}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      modalCadenceType === 'daily'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>☀️</span>
                    <span>{language === 'am' ? 'ዕለታዊ' : 'Daily'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalCadenceType('weekly');
                      try { soundEngine.playTouchSound(); } catch {}
                    }}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      modalCadenceType === 'weekly'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>📅</span>
                    <span>{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalCadenceType('monthly');
                      try { soundEngine.playTouchSound(); } catch {}
                    }}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      modalCadenceType === 'monthly'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>🗓️</span>
                    <span>{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</span>
                  </button>
                </div>

                {/* Day Chooser for Weekly & Monthly */}
                {(modalCadenceType === 'weekly' || modalCadenceType === 'monthly') && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2 mb-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <span>{language === 'am' ? 'ብሎኩ የሚመጣባቸው ቀናት' : 'Choose Routine Days:'}</span>
                      <span className="text-[#0082ff] font-mono">{modalSelectedDays.length} days/week</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
                        const isSelected = modalSelectedDays.includes(dayNum);
                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => handleToggleModalDay(dayNum)}
                            className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0082ff] text-white shadow-xs scale-102'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {language === 'am' ? WEEKDAY_NAMES_AM[dayNum - 1] : WEEKDAY_NAMES_EN[dayNum - 1]}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5 text-[10px]">
                      <span className="text-slate-400">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setModalSelectedDays([1, 2, 3, 4, 5])}
                        className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700 font-semibold cursor-pointer"
                      >
                        Mon–Fri
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                        className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700 font-semibold cursor-pointer"
                      >
                        All 7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalSelectedDays([6, 7])}
                        className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700 font-semibold cursor-pointer"
                      >
                        Weekend
                      </button>
                    </div>
                  </div>
                )}

                {/* Monthly Specific: Amount of Weeks */}
                {modalCadenceType === 'monthly' && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 space-y-1.5 mb-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
                      <span>{language === 'am' ? 'የሳምንታት ብዛት ምረጥ' : 'Plan Amount of Weeks:'}</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400">{modalMonthlyWeeks} Weeks</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map(w => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => {
                            setModalMonthlyWeeks(w);
                            try { soundEngine.playTouchSound(); } catch {}
                          }}
                          className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            modalMonthlyWeeks === w
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                          }`}
                        >
                          {w} {w === 1 ? 'Week' : 'Weeks'}
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] text-amber-800 dark:text-amber-300/80 pt-0.5 font-medium flex items-center gap-1">
                      <span>⚡</span>
                      <span>
                        {language === 'am'
                          ? `በ${modalMonthlyWeeks} ሳምንታት ውስጥ ${modalMonthlyWeeks * modalSelectedDays.length} የብሎክ እቅዶች ይመዘገባሉ`
                          : `Creates ${modalMonthlyWeeks * modalSelectedDays.length} blocks across ${modalMonthlyWeeks} weeks`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                {language === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveBlock}
                disabled={!modalTitle.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 ${
                  modalTitle.trim() ? 'bg-[#0082ff] hover:bg-[#0070df]' : 'bg-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <Check size={16} strokeWidth={2.5} />
                <span>{language === 'am' ? 'መርሐግብሩን አስቀምጥ' : 'Save to Schedule'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SIMPLE MONTHLY DELIVERABLE COMPOSER
          ========================================================================= */}
      {isMonthlyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#181e29] border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'am' ? 'ወርሃዊ ግብ መድብ' : 'Set Monthly Deliverable'}
                </h3>
              </div>
              <button
                onClick={() => setIsMonthlyModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              
              {/* Select Stream */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  1. {language === 'am' ? 'ዋና ክፍል ምረጥ' : 'Select Category'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {Object.values(categoryPlans).filter(cat => cat && cat.id).map(cat => {
                    const Icon = getCategoryIcon(cat.id);
                    const isSelected = monthlyModalCatId === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setMonthlyModalCatId(cat.id);
                          setMonthlyModalGoalTitle(cat.monthlyGoalTitle || '');
                          setMonthlyModalMetric(cat.monthlyTargetMetric || '');
                          setMonthlyModalHours(cat.monthlyTargetHours || 20);
                          try { soundEngine.playPencil(); } catch {}
                        }}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-sm scale-102'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                        style={{
                          backgroundColor: isSelected ? cat.color : undefined,
                          borderColor: isSelected ? cat.color : undefined
                        }}
                      >
                        <Icon size={14} />
                        <span className="truncate">{cat.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Goal Title */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  2. {language === 'am' ? 'የወሩ ዋና ዒላማ / Deliverable' : 'Monthly Goal Title / Outcome'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete 50 Tactics Puzzles & Master French Defense"
                  value={monthlyModalGoalTitle}
                  onChange={(e) => setMonthlyModalGoalTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                />
              </div>

              {/* Target Metric */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  3. {language === 'am' ? 'የስኬት መለኪያ (Metric / KPI)' : 'Target Metric (KPI)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reach 1850 Blitz Rating or Complete Course"
                  value={monthlyModalMetric}
                  onChange={(e) => setMonthlyModalMetric(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                />
              </div>

              {/* Monthly Target Hours */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  4. {language === 'am' ? 'ወርሃዊ የታቀደ ሰዓት' : 'Monthly Target Hours'}
                </label>
                <div className="flex items-center gap-1.5">
                  {[10, 15, 20, 25, 30, 40].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setMonthlyModalHours(hrs)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        monthlyModalHours === hrs
                          ? 'bg-[#0082ff] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsMonthlyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                {language === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveMonthlyGoal}
                disabled={!monthlyModalGoalTitle.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 ${
                  monthlyModalGoalTitle.trim() ? 'bg-[#0082ff] hover:bg-[#0070df]' : 'bg-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <Check size={16} strokeWidth={2.5} />
                <span>{language === 'am' ? 'ወርሃዊ ግቡን አስቀምጥ' : 'Save Monthly Goal'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Schedule Overlap Conflict Stoppage Notification Modal */}
      <ScheduleConflictNotificationModal
        conflict={scheduleConflict}
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onApplySuggestedTime={(time) => setModalStartTime(time)}
      />

    </div>
  );
};
