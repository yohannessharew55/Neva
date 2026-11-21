import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, Play, Clock, Wind, 
  Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Palette, Maximize2, Minimize2,
  Dumbbell, Swords, ChessKnight, Music, Building2, TrendingUp, 
  BookOpen, Shield, CheckCircle2, Sparkles, X, Edit2,
  ExternalLink, GripVertical, Settings, Copy, RotateCcw, Save, Calendar, Compass, MoreVertical
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { gregorianToEthiopian, ETHIOPIAN_MONTHS, AMHARIC_DAYS } from '../utils/ethiopianCalendar';
import { soundEngine } from '../utils/audio';
import { DayDefaultsModal } from './DayDefaultsModal';
import { ApplyDayScheduleModal } from './ApplyDayScheduleModal';
import { ScheduleSaveScopeModal, ScheduleSaveScope } from './ScheduleSaveScopeModal';
import { formatTaskDuration } from '../utils/formatDuration';
import { DurationPicker } from './DurationPicker';

type StickyColorTheme = 'canary' | 'peach' | 'mint' | 'sky' | 'rose' | 'lavender' | 'darkgrey' | 'charcoal' | 'graphite';

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
  cardBg?: string;
  buttonBg?: string;
  inputBg?: string;
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
    cardBg: 'bg-white/70',
    buttonBg: 'bg-white/80 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/90 text-slate-900',
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
    cardBg: 'bg-white/70',
    buttonBg: 'bg-white/80 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/90 text-slate-900',
  },
  mint: {
    name: 'Mint Green',
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
    cardBg: 'bg-white/70',
    buttonBg: 'bg-white/80 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/90 text-slate-900',
  },
  sky: {
    name: 'Sky Blue',
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
    cardBg: 'bg-white/70',
    buttonBg: 'bg-white/80 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/90 text-slate-900',
  },
  rose: {
    name: 'Soft Rose',
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
    cardBg: 'bg-white/70',
    buttonBg: 'bg-white/80 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/90 text-slate-900',
  },
  lavender: {
    name: 'Pastel Lavender',
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
    cardBg: 'bg-white/70',
    buttonBg: 'bg-white/80 hover:bg-black/5 text-slate-800',
    inputBg: 'bg-white/90 text-slate-900',
  },
  darkgrey: {
    name: 'Dark Slate Grey',
    dotColor: '#334155',
    paperBg: 'bg-[#1e293b]',
    paperBorder: 'border-[#334155]',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    tapeBg: 'bg-slate-700/60',
    tapeBorder: 'border-slate-600/70',
    hourBadgeBg: 'bg-slate-700/80',
    hourBadgeText: 'text-slate-100',
    checkBorder: 'border-slate-500',
    checkBgDone: 'bg-[#0082ff] text-white',
    ruledLineColor: 'rgba(255, 255, 255, 0.05)',
    marginLineColor: 'rgba(244, 63, 94, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    cardBg: 'bg-slate-900/60',
    buttonBg: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-white/10',
    inputBg: 'bg-slate-900 text-slate-100 border-slate-700',
  },
  charcoal: {
    name: 'Charcoal Dark Grey',
    dotColor: '#262626',
    paperBg: 'bg-[#18181b]',
    paperBorder: 'border-[#27272a]',
    textPrimary: 'text-zinc-100',
    textSecondary: 'text-zinc-400',
    tapeBg: 'bg-zinc-800/60',
    tapeBorder: 'border-zinc-700/70',
    hourBadgeBg: 'bg-zinc-800/80',
    hourBadgeText: 'text-zinc-100',
    checkBorder: 'border-zinc-600',
    checkBgDone: 'bg-emerald-600 text-white',
    ruledLineColor: 'rgba(255, 255, 255, 0.05)',
    marginLineColor: 'rgba(239, 68, 68, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    cardBg: 'bg-black/40',
    buttonBg: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-white/10',
    inputBg: 'bg-zinc-900 text-zinc-100 border-zinc-700',
  },
  graphite: {
    name: 'Graphite Dark Grey',
    dotColor: '#374151',
    paperBg: 'bg-[#111827]',
    paperBorder: 'border-[#1f2937]',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-400',
    tapeBg: 'bg-gray-800/60',
    tapeBorder: 'border-gray-700/70',
    hourBadgeBg: 'bg-gray-800/80',
    hourBadgeText: 'text-gray-100',
    checkBorder: 'border-gray-600',
    checkBgDone: 'bg-purple-600 text-white',
    ruledLineColor: 'rgba(255, 255, 255, 0.05)',
    marginLineColor: 'rgba(244, 63, 94, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.65)',
    cardBg: 'bg-gray-900/70',
    buttonBg: 'bg-gray-800 hover:bg-gray-700 text-gray-100 border-white/10',
    inputBg: 'bg-gray-900 text-gray-100 border-gray-700',
  },
};

const getCategoryIcon = (catId: string) => {
  switch (catId) {
    case 'exercise': return Dumbbell;
    case 'chess': return ChessKnight;
    case 'art': return Palette;
    case 'music': return Music;
    case 'architecture': return Building2;
    case 'trading': return TrendingUp;
    case 'devotion': return BookOpen;
    default: return Shield;
  }
};

export function getStreamStickyTheme(categoryKey?: string, categoryColor?: string): StickyColorTheme {
  const key = (categoryKey || '').toLowerCase();
  if (key.includes('chess') || key.includes('devotion') || key.includes('spirit') || key.includes('study')) return 'lavender';
  if (key.includes('music') || key.includes('guitar') || key.includes('art') || key.includes('paint') || key.includes('piano')) return 'rose';
  if (key.includes('trade') || key.includes('trading') || key.includes('market') || key.includes('money') || key.includes('invest') || key.includes('finance')) return 'mint';
  if (key.includes('arch') || key.includes('work') || key.includes('code') || key.includes('tech') || key.includes('career') || key.includes('design')) return 'sky';
  if (key.includes('fit') || key.includes('exercise') || key.includes('gym') || key.includes('health') || key.includes('sport')) return 'peach';
  
  if (categoryColor) {
    const c = categoryColor.toLowerCase();
    // Purple / Indigo / Violet
    if (c.includes('8b5cf6') || c.includes('a855f7') || c.includes('9333ea') || c.includes('7c3aed') || c.includes('6366f1') || c.includes('purple') || c.includes('violet')) return 'lavender';
    // Pink / Rose / Fuchsia
    if (c.includes('ec4899') || c.includes('f43f5e') || c.includes('e11d48') || c.includes('d946ef') || c.includes('pink') || c.includes('rose')) return 'rose';
    // Blue / Cyan / Sky
    if (c.includes('0082ff') || c.includes('3b82f6') || c.includes('0284c7') || c.includes('06b6d4') || c.includes('0ea5e9') || c.includes('blue') || c.includes('cyan')) return 'sky';
    // Green / Emerald / Teal
    if (c.includes('10b981') || c.includes('22c55e') || c.includes('16a34a') || c.includes('14b8a6') || c.includes('green') || c.includes('emerald') || c.includes('teal')) return 'mint';
    // Orange / Red / Peach
    if (c.includes('ef4444') || c.includes('f97316') || c.includes('ea580c') || c.includes('f59e0b') || c.includes('orange') || c.includes('red') || c.includes('peach')) return 'peach';
    // Yellow
    if (c.includes('eab308') || c.includes('facc15') || c.includes('yellow')) return 'canary';
  }

  return 'canary';
}

export interface BigDailyActivitiesStickyNoteProps {
  targetDate?: Date;
  onClose?: () => void;
  showScheduleBar?: boolean;
}

export const BigDailyActivitiesStickyNote: React.FC<BigDailyActivitiesStickyNoteProps> = ({
  targetDate,
  onClose,
  showScheduleBar = false,
}) => {
  const { 
    tasks, 
    startTask, 
    toggleTaskCompletion, 
    toggleChecklistItem,
    addTask, 
    deleteTask,
    updateTask,
    activeTask,
    categoryPlans,
    deleteCategoryPlan,
    setSelectedCategoryId,
    getCategoryTitleTranslated,
    language,
    t,
    getDaySchedule,
    materializeDaySchedule,
    resetDayScheduleToDefault,
    saveDayAsWeekdayDefault,
    saveDayAsGlobalRoutine,
    applyDayScheduleToDates,
    getWeekdayDefaultTasks,
    applyTaskActionWithScope,
    categoryOrder,
    setCategoryOrder,
    reorderCategories,
    reorderTasks,
    dailyStickyColor,
    setDailyStickyColor,
    isAutoStickyColor,
    setIsAutoStickyColor,
    setActiveTab,
    theme: appTheme,
  } = useLivotion();

  // Active viewing date state with Quick-Swipe & day step support
  const [currentDate, setCurrentDate] = useState<Date>(() => targetDate || new Date());

  useEffect(() => {
    if (targetDate) {
      setCurrentDate(targetDate);
    }
  }, [targetDate]);

  const handlePrevDay = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
    try { soundEngine.playPencil(); } catch {}
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
    try { soundEngine.playPencil(); } catch {}
  };

  const handleResetToToday = () => {
    setCurrentDate(new Date());
    try { soundEngine.playPencil(); } catch {}
  };

  const [filterMode, setFilterMode] = useState<'all' | 'remaining' | 'completed'>('all');
  const [showStickyMenu, setShowStickyMenu] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // True Native Mobile Touch + Desktop Double-Tap Detection for Sticky Paper
  const lastTouchTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const blockToggleUntilRef = useRef<number>(0);

  const handlePaperTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handlePaperTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Don't toggle if tapping directly on interactive controls or task actions
    if (target.closest('button, select, input, textarea, a, [role="button"], form, .group\\/task, [data-no-fullscreen-toggle]')) {
      return;
    }

    // Suppress if already toggled recently to avoid synthetic double-trigger
    if (Date.now() < blockToggleUntilRef.current) {
      return;
    }

    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStartPosRef.current.x;
      const deltaY = endY - touchStartPosRef.current.y;
      const moveDistance = Math.hypot(deltaX, deltaY);

      // Horizontal Quick-Swipe Detection (swipe left = next day, swipe right = previous day)
      if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        if (deltaX < 0) {
          handleNextDay();
        } else {
          handlePrevDay();
        }
        return;
      }

      // Generous jitter tolerance for mobile fingers (up to 35px)
      if (moveDistance > 35) return;

      const now = Date.now();
      const timeSinceLast = now - lastTouchTimeRef.current;
      if (timeSinceLast >= 50 && timeSinceLast <= 650) {
        e.stopPropagation();
        lastTouchTimeRef.current = 0;
        blockToggleUntilRef.current = now + 1000;
        setIsFullScreen((prev) => !prev);
        try {
          soundEngine.playPencil();
        } catch {}
      } else {
        lastTouchTimeRef.current = now;
      }
    }
  };

  const handlePaperDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, select, input, textarea, a, [role="button"], form, .group\\/task, [data-no-fullscreen-toggle]')) {
      return;
    }
    // Prevent synthetic bounce if touchEnd already handled it
    if (Date.now() < blockToggleUntilRef.current) {
      return;
    }
    e.stopPropagation();
    blockToggleUntilRef.current = Date.now() + 1000;
    setIsFullScreen((prev) => !prev);
    try {
      soundEngine.playPencil();
    } catch {}
  };

  const handleTopDoubleTap = handlePaperTouchEnd;
  const handleTopDoubleClick = handlePaperDoubleClick;

  // Full Screen Scroll Lock and Escape Key handling
  useEffect(() => {
    if (!isFullScreen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Day Defaults & Multi-Day Apply Modals
  const [showDefaultsModal, setShowDefaultsModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scope Confirmation Modal State (Independent day vs whole days vs chosen days)
  const [pendingScopeAction, setPendingScopeAction] = useState<{
    isOpen: boolean;
    action: 'edit' | 'create' | 'delete' | 'day_schedule';
    title?: string;
    itemDescription?: string;
    taskId?: string;
    originalTask?: ScheduleTask;
    updatedTaskData?: Partial<ScheduleTask>;
    newTaskData?: Omit<ScheduleTask, 'id'>;
  } | null>(null);

  const toggleSubjectExpand = (subjectId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  // Mobile & Desktop Inline Edit Task State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editDurationMin, setEditDurationMin] = useState(30);

  const startEditTask = (task: ScheduleTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditStartTime(task.startTime || '06:00 PM');
    setEditDurationMin(task.durationMin || 30);
  };

  const handleSaveEditTask = (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    const targetTask = dayTasks.find((t) => t.id === taskId);
    setPendingScopeAction({
      isOpen: true,
      action: 'edit',
      title: language === 'am' ? 'የብሎክ / ተግባር ለውጥ አስቀምጥ' : 'Save Block Changes',
      itemDescription: `"${editTitle.trim()}" (${editStartTime || 'Flexible'} • ${editDurationMin}m)`,
      taskId,
      originalTask: targetTask,
      updatedTaskData: {
        title: editTitle.trim(),
        startTime: editStartTime.trim() || 'Flexible',
        durationMin: Number(editDurationMin),
      },
    });
  };

  // Dual Date Calculation
  const today = currentDate;
  const activeDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const nowObj = new Date();
  const todayStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(nowObj.getDate()).padStart(2, '0')}`;
  const isViewingToday = activeDateStr === todayStr;
  const activeDayOfWeek = (today.getDay() + 6) % 7 + 1; // 1 = Mon, ..., 7 = Sun
  const isSunday = activeDayOfWeek === 7;

  const ethDate = gregorianToEthiopian(today);
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
  const gregFormatted = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const amharicDay = (AMHARIC_DAYS[today.getDay()] as any)?.am || (AMHARIC_DAYS[today.getDay()] as any)?.amharic || '';
  const ethMonthName = (ETHIOPIAN_MONTHS[ethDate.month - 1] as any)?.am || (ETHIOPIAN_MONTHS[ethDate.month - 1] as any)?.amharic || '';
  const dateBanner = language === 'am'
    ? `${amharicDay} • ${ethMonthName} ${ethDate.day}, ${ethDate.year} ዓ.ም (${gregFormatted})`
    : `${dayName}, ${gregFormatted} • ${amharicDay} ${ethMonthName} ${ethDate.day}`;

  const parseTimeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [_, h, m, meridiem] = match;
    let hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

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

  // Helper to map a task to its Subject / Category
  const getCategoryForTask = (task: ScheduleTask): { id: string; title: string; color: string; icon: any } => {
    if (task.badge && task.badge.toUpperCase() !== 'STREAM' && task.badge.toUpperCase() !== 'FOCUS') {
      const badgeLower = task.badge.toLowerCase();
      for (const [id, plan] of Object.entries(categoryPlans)) {
        if (badgeLower.includes(id) || plan.title.toLowerCase().includes(badgeLower)) {
          return { id, title: plan.title, color: plan.color, icon: getCategoryIcon(id) };
        }
      }
    }

    if (task.domain) {
      switch (task.domain) {
        case 'PHYSICAL_FITNESS':
          return { id: 'exercise', title: categoryPlans['exercise']?.title || 'Exercise & Fitness', color: categoryPlans['exercise']?.color || '#ef4444', icon: Dumbbell };
        case 'CHESS':
          return { id: 'chess', title: categoryPlans['chess']?.title || 'Chess', color: categoryPlans['chess']?.color || '#8b5cf6', icon: ChessKnight };
        case 'OIL_PAINTING':
          return { id: 'art', title: categoryPlans['art']?.title || 'Art & Painting', color: categoryPlans['art']?.color || '#e11d48', icon: Palette };
        case 'GUITAR':
          return { id: 'music', title: categoryPlans['music']?.title || 'Music & Guitar', color: categoryPlans['music']?.color || '#ec4899', icon: Music };
        case 'ARCHITECTURE_DESIGN':
        case 'SITE_SUPERVISION':
          return { id: 'architecture', title: categoryPlans['architecture']?.title || 'Architecture & Design', color: categoryPlans['architecture']?.color || '#0082ff', icon: Building2 };
        case 'FOREX_TRADING':
          return { id: 'trading', title: categoryPlans['trading']?.title || 'Trading', color: categoryPlans['trading']?.color || '#10b981', icon: TrendingUp };
        case 'DEVOTION_PRAYER':
          return { id: 'devotion', title: categoryPlans['devotion']?.title || 'Devotion & Prayer', color: categoryPlans['devotion']?.color || '#a855f7', icon: BookOpen };
        default:
          break;
      }
    }

    // Title keyword matching
    const titleLower = (task.title || '').toLowerCase();
    for (const [id, plan] of Object.entries(categoryPlans)) {
      if (titleLower.includes(id) || titleLower.includes(plan.title.toLowerCase())) {
        return { id, title: plan.title, color: plan.color, icon: getCategoryIcon(id) };
      }
    }
    if (titleLower.includes('chess') || titleLower.includes('tactic') || titleLower.includes('puzzle') || titleLower.includes('grandmaster')) {
      return { id: 'chess', title: categoryPlans['chess']?.title || 'Chess', color: categoryPlans['chess']?.color || '#8b5cf6', icon: ChessKnight };
    }
    if (titleLower.includes('guitar') || titleLower.includes('repertoire') || titleLower.includes('music') || titleLower.includes('finger')) {
      return { id: 'music', title: categoryPlans['music']?.title || 'Music & Guitar', color: categoryPlans['music']?.color || '#ec4899', icon: Music };
    }
    if (titleLower.includes('workout') || titleLower.includes('fitness') || titleLower.includes('gym') || titleLower.includes('exercise')) {
      return { id: 'exercise', title: categoryPlans['exercise']?.title || 'Exercise & Fitness', color: categoryPlans['exercise']?.color || '#ef4444', icon: Dumbbell };
    }
    if (titleLower.includes('art') || titleLower.includes('painting') || titleLower.includes('oil') || titleLower.includes('drawing')) {
      return { id: 'art', title: categoryPlans['art']?.title || 'Art & Painting', color: categoryPlans['art']?.color || '#e11d48', icon: Palette };
    }
    if (titleLower.includes('trading') || titleLower.includes('forex') || titleLower.includes('crypto') || titleLower.includes('market') || titleLower.includes('trade') || titleLower.includes('xau') || titleLower.includes('gold') || titleLower.includes('nasdaq')) {
      return { id: 'trading', title: categoryPlans['trading']?.title || 'Trading', color: categoryPlans['trading']?.color || '#10b981', icon: TrendingUp };
    }
    if (titleLower.includes('architect') || titleLower.includes('design') || titleLower.includes('autocad') || titleLower.includes('site')) {
      return { id: 'architecture', title: categoryPlans['architecture']?.title || 'Architecture & Design', color: categoryPlans['architecture']?.color || '#0082ff', icon: Building2 };
    }
    if (titleLower.includes('devotion') || titleLower.includes('bible') || titleLower.includes('prayer') || titleLower.includes('scripture')) {
      return { id: 'devotion', title: categoryPlans['devotion']?.title || 'Devotion & Prayer', color: categoryPlans['devotion']?.color || '#a855f7', icon: BookOpen };
    }

    const firstCat = Object.values(categoryPlans)[0];
    return { id: firstCat?.id || 'chess', title: firstCat?.title || 'Chess', color: firstCat?.color || '#8b5cf6', icon: getCategoryIcon(firstCat?.id || 'chess') };
  };

  const getDomainForCategory = (catKey: string): DomainType => {
    switch (catKey) {
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

  // Drag-and-drop state for subjects and tasks
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
  const [dragOverSubjectId, setDragOverSubjectId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  const touchActiveId = useRef<string | null>(null);
  const touchActiveTaskId = useRef<string | null>(null);

  // Resolve Day Schedule (Unique vs Default Routine)
  const daySchedule = getDaySchedule(today);
  const dayTasks = daySchedule.tasks;
  const isCustomDay = daySchedule.isCustom;

  const handleCustomizeDay = () => {
    materializeDaySchedule(activeDateStr);
    setToastMessage(language === 'am' ? 'ይህ ቀን ራሱን ችሎ ተለይቷል!' : 'Day customized independently!');
    setTimeout(() => setToastMessage(null), 3000);
    try { soundEngine.playPencil(); } catch {}
  };

  const handleResetDayToDefault = () => {
    if (window.confirm(language === 'am' 
      ? 'የዚህን ቀን ልዩ ለውጦች በማጥፋት ወደ መደበኛው ነባሪ የጊዜ ሰሌዳ መመለስ ይፈልጋሉ?' 
      : `Reset ${dayName}'s schedule back to the default routine template? Custom blocks for this date will be cleared.`
    )) {
      resetDayScheduleToDefault(activeDateStr);
      setToastMessage(language === 'am' ? 'ወደ ነባሪ ዕቅድ ተመልሷል!' : 'Reverted to default template!');
      setTimeout(() => setToastMessage(null), 3000);
      try { soundEngine.playPencil(); } catch {}
    }
  };

  const handleSaveAsDefault = () => {
    saveDayAsWeekdayDefault(activeDateStr, activeDayOfWeek);
    setToastMessage(language === 'am' 
      ? `የዚህ ቀን ሰሌዳ ለሁሉም ${dayName} እንደ ነባሪ ተመዝግቧል!` 
      : `Saved current schedule as default for ${dayName}!`
    );
    setTimeout(() => setToastMessage(null), 3000);
    try { soundEngine.playPencil(); } catch {}
  };

  const handleToggleTask = (task: ScheduleTask) => {
    if (!isCustomDay) {
      const materialized = materializeDaySchedule(activeDateStr);
      const match = materialized.find((m) => m.title === task.title) || materialized[0];
      if (match) {
        toggleTaskCompletion(match.id);
      }
    } else {
      toggleTaskCompletion(task.id);
    }
  };

  const handleToggleChecklist = (task: ScheduleTask, checklistId: string) => {
    if (!isCustomDay) {
      const materialized = materializeDaySchedule(activeDateStr);
      const match = materialized.find((m) => m.title === task.title);
      if (match && match.checklist) {
        const cMatch = match.checklist.find((c) => c.text === task.checklist?.find((tc) => tc.id === checklistId)?.text) || match.checklist[0];
        if (cMatch) {
          toggleChecklistItem(match.id, cMatch.id);
        }
      }
    } else {
      toggleChecklistItem(task.id, checklistId);
    }
  };

  const handleDeleteTask = (task: ScheduleTask) => {
    setPendingScopeAction({
      isOpen: true,
      action: 'delete',
      title: language === 'am' ? 'ብሎክ / ተግባር ሰርዝ' : 'Delete Block / Task',
      itemDescription: `"${task.title}" (${task.startTime || 'Flexible'})`,
      taskId: task.id,
      originalTask: task,
    });
  };

  const handleOpenSaveDaySchedule = () => {
    setPendingScopeAction({
      isOpen: true,
      action: 'day_schedule',
      title: language === 'am' ? 'የቀኑን ሰሌዳ አስቀምጥ' : 'Save Day Schedule',
      itemDescription: `${dayName}, ${gregFormatted} (${dayTasks.length} blocks)`,
    });
  };

  const handleConfirmScope = (scope: ScheduleSaveScope, targetDates: string[]) => {
    if (!pendingScopeAction) return;

    if (pendingScopeAction.action === 'day_schedule') {
      if (scope === 'this_day_only') {
        materializeDaySchedule(activeDateStr);
        setToastMessage(language === 'am' ? 'ለዚህ ቀን ብቻ ተቀምጧል!' : `Saved strictly for ${dayName}!`);
      } else if (scope === 'all_days') {
        saveDayAsGlobalRoutine(activeDateStr);
        setToastMessage(language === 'am' ? 'ለሁሉም ቀናት እንደ መደበኛ ሰሌዳ ተቀምጧል!' : 'Set as default routine for ALL days!');
      } else if (scope === 'chosen_days') {
        applyDayScheduleToDates(activeDateStr, targetDates);
        setToastMessage(language === 'am' ? `ለ${targetDates.length} ቀናት ተተግብሯል!` : `Applied schedule to ${targetDates.length} chosen days!`);
      }
    } else {
      applyTaskActionWithScope({
        action: pendingScopeAction.action as 'edit' | 'create' | 'delete',
        scope,
        sourceDateStr: activeDateStr,
        targetDateStrs: targetDates,
        dayOfWeek: activeDayOfWeek,
        taskId: pendingScopeAction.taskId,
        originalTask: pendingScopeAction.originalTask,
        updatedTaskData: pendingScopeAction.updatedTaskData,
        newTaskData: pendingScopeAction.newTaskData,
      });

      if (pendingScopeAction.action === 'edit') {
        setEditingTaskId(null);
      }

      if (scope === 'this_day_only') {
        setToastMessage(language === 'am' ? `ለ${dayName} (${activeDateStr}) ብቻ ተቀምጧል!` : `Saved for ${dayName} (${activeDateStr}) only!`);
      } else if (scope === 'all_days') {
        setToastMessage(language === 'am' ? 'ለሁሉም ቀናት እንደ ነባሪ ተቀምጧል!' : 'Updated default routine for all days!');
      } else if (scope === 'chosen_days') {
        setToastMessage(language === 'am' ? `ለ${targetDates.length} የተመረጡ ቀናት ተተግብሯል!` : `Applied to ${targetDates.length} chosen days!`);
      }
    }

    setPendingScopeAction(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Group tasks by Main Stream Subjects for this active day: strictly preserves drag order and plan system
  const sortedTasks = [...dayTasks];

  const baseCategoryKeys = Object.keys(categoryPlans);
  const allCategoryKeys = [...baseCategoryKeys].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  // Calculate the active / top main stream subject for auto sticky note color
  const topPendingSubjectKey = allCategoryKeys.find((catKey) => {
    return dayTasks.some((t) => {
      const c = getCategoryForTask(t);
      return c && c.id === catKey && !t.completed;
    });
  });

  const topActiveSubjectKey = topPendingSubjectKey || allCategoryKeys.find((catKey) => {
    return dayTasks.some((t) => {
      const c = getCategoryForTask(t);
      return c && c.id === catKey;
    });
  }) || allCategoryKeys[0] || 'chess';

  const colorTheme: StickyColorTheme = React.useMemo(() => {
    if (isAutoStickyColor) {
      const streamColor = categoryPlans[topActiveSubjectKey]?.color;
      return getStreamStickyTheme(topActiveSubjectKey, streamColor);
    }
    if (dailyStickyColor && (dailyStickyColor in THEMES)) {
      const savedExplicit = localStorage.getItem('neva_daily_sticky_color_custom');
      if (appTheme === 'dark' && (!savedExplicit || dailyStickyColor === 'canary')) {
        return 'darkgrey';
      }
      return dailyStickyColor as StickyColorTheme;
    }
    return appTheme === 'dark' ? 'darkgrey' : 'canary';
  }, [isAutoStickyColor, topActiveSubjectKey, categoryPlans, dailyStickyColor, appTheme]);

  const theme = THEMES[colorTheme];

  const reorderSubjects = (fromId: string, toId: string) => {
    reorderCategories(fromId, toId);
    try {
      soundEngine.playPencil();
    } catch {}
  };

  const moveSubject = (id: string, direction: 'up' | 'down') => {
    const currentOrder = [...allCategoryKeys];
    const index = currentOrder.indexOf(id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    const targetId = currentOrder[targetIndex];
    reorderCategories(id, targetId);
    try {
      soundEngine.playPencil();
    } catch {}
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchActiveId.current = id;
    setDraggedSubjectId(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchActiveId.current) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = targetElement?.closest('[data-subject-id]');
    if (card) {
      const targetId = card.getAttribute('data-subject-id');
      if (targetId && targetId !== touchActiveId.current) {
        setDragOverSubjectId(targetId);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchActiveId.current && dragOverSubjectId && touchActiveId.current !== dragOverSubjectId) {
      reorderSubjects(touchActiveId.current, dragOverSubjectId);
    }
    touchActiveId.current = null;
    setDraggedSubjectId(null);
    setDragOverSubjectId(null);
  };

  const handleTaskTouchStart = (e: React.TouchEvent, taskId: string) => {
    e.stopPropagation();
    touchActiveTaskId.current = taskId;
    setDraggedTaskId(taskId);
  };

  const handleTaskTouchMove = (e: React.TouchEvent) => {
    if (!touchActiveTaskId.current) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = targetElement?.closest('[data-task-id]');
    if (card) {
      const targetId = card.getAttribute('data-task-id');
      if (targetId && targetId !== touchActiveTaskId.current) {
        setDragOverTaskId(targetId);
      }
    }
  };

  const handleTaskTouchEnd = () => {
    if (touchActiveTaskId.current && dragOverTaskId && touchActiveTaskId.current !== dragOverTaskId) {
      reorderTasks(touchActiveTaskId.current, dragOverTaskId);
      try {
        soundEngine.playPencil();
      } catch {}
    }
    touchActiveTaskId.current = null;
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  // Calculate grouped subjects with their tasks
  const subjectGroups = allCategoryKeys
    .filter((catKey) => categoryPlans && categoryPlans[catKey])
    .map((catKey) => {
      const plan = categoryPlans[catKey];
      const catTasks = sortedTasks.filter((t) => (getCategoryForTask(t)?.id || '') === catKey);
      
      const filteredTasks = catTasks.filter((t) => {
        if (filterMode === 'remaining') return !t.completed;
        if (filterMode === 'completed') return t.completed;
        return true;
      });

      const completedCount = catTasks.filter((t) => t.completed).length;
      const totalCount = catTasks.length;
      // Main Stream Subject is marked as checked when ALL its under tasks are marked as done!
      const isAllDone = totalCount > 0 && completedCount === totalCount;
      const totalMinutes = catTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);
      const formattedDuration = formatTaskDuration(totalMinutes);

      return {
        id: catKey,
        title: plan?.title || catKey,
        translatedTitle: getCategoryTitleTranslated(catKey, plan?.title || catKey),
        color: plan?.color || '#0082ff',
        icon: getCategoryIcon(catKey),
        tasks: catTasks,
        displayedTasks: filteredTasks,
        completedCount,
        totalCount,
        totalHours,
        formattedDuration,
        isAllDone,
      };
    })
    .filter((group) => {
      // Show subject if it has tasks matching the filter
      if (filterMode === 'all') return group.totalCount > 0;
      return group.displayedTasks.length > 0;
    });

  // Calculate day-specific sticky note metrics
  const completedCount = dayTasks.filter((t) => t.completed).length;
  const totalCount = dayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalDayMinutes = dayTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0);
  const totalHours = (totalDayMinutes / 60).toFixed(1);
  const formattedDayDuration = formatTaskDuration(totalDayMinutes);

  const handleCopyTodayRoutine = () => {
    const todayTasks = tasks.filter((t) => t.date ? t.date === todayStr : isViewingToday);
    if (todayTasks.length === 0) return;
    todayTasks.forEach((t, idx) => {
      addTask({
        title: t.title,
        startTime: t.startTime || 'Flexible',
        durationMin: t.durationMin || 60,
        domain: t.domain,
        badge: t.badge || 'Focus',
        color: t.color || '#0082ff',
        soundProfile: t.soundProfile || 'SOLFEGGIO_432',
        completed: false,
        date: activeDateStr,
        checklist: t.checklist ? t.checklist.map((c, cidx) => ({ id: `c-${Date.now()}-${idx}-${cidx}`, text: c.text, done: false })) : undefined,
      });
    });
    try { soundEngine.playSound('CHIME_MEDITATION'); } catch {}
  };

  // Master Subject Checkbox: Toggling subject checks or unchecks all tasks under it
  const handleToggleSubject = (groupTasks: ScheduleTask[], isCurrentlyAllDone: boolean) => {
    let currentTasks = groupTasks;
    if (!isCustomDay) {
      const materialized = materializeDaySchedule(activeDateStr);
      const titles = new Set(groupTasks.map((t) => t.title));
      currentTasks = materialized.filter((t) => titles.has(t.title));
    }
    const nextCompletedState = !isCurrentlyAllDone;
    if (nextCompletedState) {
      soundEngine.playSound('CHIME_MEDITATION');
    }
    currentTasks.forEach((t) => {
      if (t.completed !== nextCompletedState) {
        toggleTaskCompletion(t.id);
      }
    });
  };

  return (
    <div 
      onClick={(e) => {
        // Tapping the dark backdrop outside the paper exits full screen
        if (isFullScreen && e.target === e.currentTarget) {
          setIsFullScreen(false);
          try { soundEngine.playPencil(); } catch {}
        }
      }}
      className={
      isFullScreen
        ? "fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),24px)] px-2.5 sm:px-4 flex flex-col items-center justify-start animate-in fade-in duration-200"
        : "relative w-full max-w-2xl mx-auto my-2 group/stickymaster"
    }>
      <div className={isFullScreen ? "relative w-full max-w-lg sm:max-w-2xl flex-1 flex flex-col my-1 py-1" : "relative w-full"}>
        {/* 1. Translucent Frosted Washi Tape (Double tap / click toggles full screen) */}
        <div 
          onTouchStart={handlePaperTouchStart}
          onTouchEnd={handlePaperTouchEnd}
          onDoubleClick={handlePaperDoubleClick}
          className={`w-28 sm:w-32 h-4.5 mx-auto -mb-2 rounded-xs shadow-xs rotate-[-0.4deg] border backdrop-blur-md z-30 relative select-none flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 transition-transform ${theme.tapeBg} ${theme.tapeBorder}`}
          title={isFullScreen ? (language === 'am' ? 'ከሙሉ ገጽ ውጣ (ሁለት ጊዜ ጠቅ ያድርጉ)' : 'Double Tap to Exit Full Screen') : (language === 'am' ? 'በሙሉ ገጽ ተመልከት (ሁለት ጊዜ ጠቅ ያድርጉ)' : 'Double Tap to View Full Screen')}
        >
          <span className="text-[8px] tracking-[0.2em] font-mono font-bold uppercase opacity-60 pointer-events-none">
            {language === 'am' ? 'የዕለት ተግባራት' : 'DAILY TO-DO'}
          </span>
        </div>

        {/* The Stationary Classic Sticky Note Card - Double tap on clear area toggles full screen */}
        <div 
          onTouchStart={handlePaperTouchStart}
          onTouchEnd={handlePaperTouchEnd}
          onDoubleClick={handlePaperDoubleClick}
          className={`relative w-full ${isFullScreen ? 'flex-1 min-h-[85vh] sm:min-h-[88vh] shadow-2xl flex flex-col' : ''} rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 transition-all duration-200 ${showStickyMenu ? 'overflow-visible z-50' : 'overflow-hidden'} touch-manipulation select-none ${theme.paperBg} ${theme.paperBorder} ${theme.textPrimary}`}
          title={isFullScreen ? (language === 'am' ? 'ከሙሉ ገጽ ውጣ (በወረቀቱ ላይ ሁለት ጊዜ ይንኩ)' : 'Double tap on paper to exit full screen') : (language === 'am' ? 'በሙሉ ገጽ ተመልከት (በወረቀቱ ላይ ሁለት ጊዜ ይንኩ)' : 'Double tap on paper to expand full screen')}
          style={{
            boxShadow: isFullScreen
              ? `0 25px 50px -12px ${theme.shadowColor}, 0 10px 25px -5px rgba(0,0,0,0.3)`
              : `0 10px 24px -6px ${theme.shadowColor}, 0 4px 8px -2px rgba(0,0,0,0.05)`,
          }}
        >
        {/* Ruled Lined Paper Background */}
        <div 
          className="absolute inset-0 pointer-events-none select-none opacity-80"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, ${theme.ruledLineColor} 28px)`,
          }}
        />

        {/* Header - Double tap or double click anywhere on top of sticky note card to toggle full screen */}
        <div 
          onTouchStart={handlePaperTouchStart}
          onTouchEnd={handlePaperTouchEnd}
          onDoubleClick={handlePaperDoubleClick}
          className={`border-b border-black/10 pb-2.5 mb-2.5 cursor-pointer touch-manipulation select-none transition-all ${
            showStickyMenu ? 'relative z-[100]' : 'relative z-10'
          }`}
          title={isFullScreen ? (language === 'am' ? 'ከሙሉ ገጽ ውጣ (ሁለት ጊዜ ጠቅ ያድርጉ)' : 'Double tap to exit full screen') : (language === 'am' ? 'በሙሉ ገጽ ተመልከት (ሁለት ጊዜ ጠቅ ያድርጉ)' : 'Double tap to view full screen')}
        >
          <div className="flex items-center justify-between gap-2 pr-7 sm:pr-8">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap z-20">
              {/* Previous Day Chevron */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevDay();
                }}
                className="w-6 h-6 rounded-md bg-black/5 hover:bg-black/10 active:scale-90 flex items-center justify-center transition cursor-pointer text-current pointer-events-auto"
                title={language === 'am' ? 'ያለፈው ቀን (ወደ ቀኝ ያንሸራትቱ)' : 'Previous Day (Swipe Right)'}
                aria-label="Previous Day"
              >
                <ChevronLeft size={13} strokeWidth={2.5} />
              </button>

              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 border border-black/5 select-none">
                {dateBanner}
              </span>

              {/* Next Day Chevron */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextDay();
                }}
                className="w-6 h-6 rounded-md bg-black/5 hover:bg-black/10 active:scale-90 flex items-center justify-center transition cursor-pointer text-current pointer-events-auto"
                title={language === 'am' ? 'ቀጣይ ቀን (ወደ ግራ ያንሸራትቱ)' : 'Next Day (Swipe Left)'}
                aria-label="Next Day"
              >
                <ChevronRight size={13} strokeWidth={2.5} />
              </button>

              {/* Return to Today Button */}
              {!isViewingToday && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetToToday();
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0082ff] text-white shadow-2xs hover:bg-[#0070df] active:scale-95 transition cursor-pointer pointer-events-auto animate-fadeIn"
                  title={language === 'am' ? 'ወደ ዛሬ ተመለስ' : 'Return to Today'}
                >
                  {language === 'am' ? 'ዛሬ' : 'Today'}
                </button>
              )}

              <span className="text-sm font-bold font-handwriting opacity-85 select-none hidden sm:inline">
                {language === 'am' ? 'የዕለት ተግባራት' : 'Daily Activities'}
              </span>
            </div>

            {/* 3-Dots Sticky Note Action Menu (Color Palette & Full Screen) */}
            <div className="flex items-center gap-1.5 relative z-[100]">
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStickyMenu(!showStickyMenu);
                  }}
                  className="p-1.5 min-w-[30px] min-h-[30px] rounded-xl bg-black/5 hover:bg-black/10 transition cursor-pointer active:scale-95 flex items-center justify-center text-current shadow-2xs"
                  title={language === 'am' ? 'ተጨማሪ አማራጮች' : 'Options'}
                  aria-label="Sticky note options"
                >
                  <MoreVertical size={15} strokeWidth={2.4} />
                </button>

                {showStickyMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[9990] bg-black/25 dark:bg-black/50 backdrop-blur-[1px]" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStickyMenu(false);
                      }} 
                    />
                    <div 
                      className="absolute right-0 top-full mt-2 z-[9999] w-64 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2.5 animate-fadeIn select-none ring-1 ring-black/10 pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Full Screen Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowStickyMenu(false);
                          setIsFullScreen(!isFullScreen);
                          try { soundEngine.playPencil(); } catch {}
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                      >
                        {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        <span>{isFullScreen ? (language === 'am' ? 'ከሙሉ ገጽ ውጣ' : 'Exit Full Screen') : (language === 'am' ? 'በሙሉ ገጽ ተመልከት' : 'Full Screen')}</span>
                      </button>

                      {/* Sticky Color Section */}
                      <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
                        {/* Auto Category Color Option Toggle */}
                        <div className="px-2 py-1.5 flex items-center justify-between gap-2 rounded-xl bg-black/5 dark:bg-white/5">
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                              <Palette size={12} className={isAutoStickyColor ? 'text-emerald-600 dark:text-emerald-400 shrink-0' : 'text-slate-400 shrink-0'} />
                              <span>{language === 'am' ? 'አውቶማቲክ የቀለም ቅንብር' : 'Auto Category Color'}</span>
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                              {language === 'am' ? 'ከዋናው ርዕስ ጋር ይቀያየራል' : 'Adapts to active category'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextVal = !isAutoStickyColor;
                              setIsAutoStickyColor(nextVal);
                              try { soundEngine.playPencil(); } catch {}
                            }}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                              isAutoStickyColor ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                            title={isAutoStickyColor ? 'Disable auto category color' : 'Enable auto category color'}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                              isAutoStickyColor ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>

                        {/* Palette Heading & Swatches */}
                        <div>
                          <div className="px-1 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span>{language === 'am' ? 'የወረቀት ቀለም' : 'Sticky Color'}</span>
                            {isAutoStickyColor && (
                              <span className="text-[9px] font-sans font-semibold text-emerald-600 dark:text-emerald-400 lowercase">
                                ({THEMES[colorTheme]?.name})
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-5 gap-2 px-1 py-1.5">
                            {(Object.keys(THEMES) as StickyColorTheme[]).map((cKey) => (
                              <button
                                key={cKey}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsAutoStickyColor(false);
                                  setDailyStickyColor(cKey);
                                  try { 
                                    localStorage.setItem('neva_daily_sticky_color_custom', 'true'); 
                                    soundEngine.playPencil();
                                  } catch {}
                                  setShowStickyMenu(false);
                                }}
                                className={`w-6 h-6 rounded-full transition-all cursor-pointer border border-black/15 dark:border-white/20 shadow-2xs ${
                                  colorTheme === cKey ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : 'opacity-85 hover:opacity-100 hover:scale-105'
                                }`}
                                style={{ backgroundColor: THEMES[cKey].dotColor }}
                                title={THEMES[cKey].name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1.5 min-w-[28px] min-h-[28px] rounded-lg bg-black/5 hover:bg-black/10 transition cursor-pointer active:scale-95 text-current flex items-center justify-center"
                  title={language === 'am' ? 'ዝጋ' : 'Close'}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Status & Day Customization Bar (Hidden on front page, opt-in for calendar views) */}
        {showScheduleBar && (
          <div className={`relative z-20 mb-2.5 px-3 py-2 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 backdrop-blur-xs transition-all shadow-2xs font-sans ${
            isCustomDay 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-950'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-950'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg">{isCustomDay ? '⭐' : '📅'}</span>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-[11px] sm:text-xs">
                    {isCustomDay 
                      ? (language === 'am' ? 'የዚህ ቀን ልዩ የተለየ የጊዜ ሰሌዳ' : 'Unique Custom Schedule')
                      : (language === 'am' ? `መደበኛ የ${dayName} የጊዜ ሰሌዳ` : `Default Routine (${dayName})`)}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase ${
                    isCustomDay 
                      ? 'bg-amber-500/20 text-amber-900' 
                      : 'bg-blue-500/20 text-blue-900'
                  }`}>
                    {isCustomDay ? (language === 'am' ? 'ልዩ' : 'Custom') : (language === 'am' ? 'ነባሪ' : 'Default')}
                  </span>
                </div>
                <p className="text-[10px] opacity-75 leading-tight">
                  {isCustomDay
                    ? (language === 'am' ? 'ለዚህ ቀን ብቻ የተቀመጠ ገለልተኛ ሰሌዳ።' : 'Independent schedule strictly for this date.')
                    : (language === 'am' ? 'ነባሪ ዕቅድን ይጠቀማል። ለውጥ ሲያደርጉ ለዚህ ቀን ብቻ ተለይቶ ይቀመጣል።' : 'Using default template. Changes will save uniquely for this day.')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
              {/* Global Save / Apply Button (prompts for scope) */}
              <button
                type="button"
                onClick={handleOpenSaveDaySchedule}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1 shadow-2xs"
                title="Save or apply this schedule to this day, all days, or chosen days"
              >
                <Save size={11} />
                <span>{language === 'am' ? 'ሰሌዳ አስቀምጥ / ተግብር' : 'Save / Apply Schedule'}</span>
              </button>

              {isCustomDay ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetDayToDefault}
                    className="px-2.5 py-1 rounded-xl bg-black/5 hover:bg-rose-50 hover:text-rose-600 border border-black/10 text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
                    title="Reset this day back to the default routine template"
                  >
                    <RotateCcw size={11} />
                    <span>{language === 'am' ? 'ወደ ነባሪ መልስ' : 'Reset to Default'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowApplyModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 border border-black/10 text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
                    title="Apply this day schedule to other dates"
                  >
                    <Copy size={11} />
                    <span>{language === 'am' ? 'ለቀናት ቅዳ' : 'Apply to Days...'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCustomizeDay}
                    className="px-3 py-1 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1 shadow-2xs"
                    title="Customize schedule uniquely for this date"
                  >
                    <Edit2 size={11} />
                    <span>{language === 'am' ? 'ይህንን ቀን ለይተህ አዘጋጅ' : 'Customize for this Day'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDefaultsModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 border border-black/10 text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
                    title="Manage default templates for all weekdays"
                  >
                    <Settings size={11} />
                    <span>{language === 'am' ? 'የቀን ነባሪዎች' : 'Day Defaults'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="relative z-20 mb-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
            <Check size={14} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Metrics summary & Filter Pills - Right directly on the sticky note (No white box, no sticker) */}
        <div className="relative z-20 my-2 px-1 pt-1 pb-1">
          {/* Metrics summary & Filter Pills */}
          {isSunday && totalCount === 0 ? (
            <div className="py-1 text-xs font-mono font-bold flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="text-sm">☕</span>
                <span className="font-sans font-extrabold text-xs sm:text-sm">
                  {language === 'am' ? 'የዕረፍት ቀን - ዘና ይበሉ' : 'Rest Day and Relax'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-900">
                  {language === 'am' ? 'ዕረፍት' : 'Rest Day & Relax'}
                </span>
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-between gap-2 text-[11px] font-mono font-semibold ${theme.textSecondary}`}>
              <div className="flex items-center gap-1.5 shrink-0">
                <span>{language === 'am' ? 'ጠቅላላ:' : 'Total:'} <strong className="font-extrabold text-slate-900">{formattedDayDuration}</strong></span>
                <span className="opacity-40">•</span>
                <span className="text-emerald-700 font-extrabold">{progressPercent}%</span>
              </div>

              <div className="flex items-center gap-1 text-[10px] shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 ${
                    filterMode === 'all' 
                      ? `${theme.hourBadgeBg} ${theme.hourBadgeText} font-extrabold shadow-2xs` 
                      : 'opacity-70 hover:opacity-100 hover:bg-black/5'
                  }`}
                >
                  {t('all')} ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('remaining')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 ${
                    filterMode === 'remaining' 
                      ? `${theme.hourBadgeBg} ${theme.hourBadgeText} font-extrabold shadow-2xs` 
                      : 'opacity-70 hover:opacity-100 hover:bg-black/5'
                  }`}
                >
                  {t('remaining')} ({totalCount - completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('completed')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 ${
                    filterMode === 'completed' 
                      ? `${theme.hourBadgeBg} ${theme.hourBadgeText} font-extrabold shadow-2xs` 
                      : 'opacity-70 hover:opacity-100 hover:bg-black/5'
                  }`}
                >
                  {t('done')} ({completedCount})
                </button>
              </div>
            </div>
          )}

          {/* Progress Line directly on sticky paper */}
          <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-[#0082ff] to-[#0082ff] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable Tasks grouped by Main Stream Subjects */}
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 relative z-10">
          {subjectGroups.map((group) => {
            const SubjectIcon = group.icon;
            const isExpanded = !!expandedSubjects[group.id];

            return (
              <div 
                key={group.id}
                className="space-y-1.5 transition-all"
              >
                {/* 1. Main Stream Subject Header Card with Automatic Master Checkbox, Drag Handle & Expand Sign */}
                <div 
                  data-subject-id={group.id}
                  draggable={true}
                  onDragStart={(e) => {
                    setDraggedSubjectId(group.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', group.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverSubjectId !== group.id) {
                      setDragOverSubjectId(group.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverSubjectId === group.id) {
                      setDragOverSubjectId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromId = e.dataTransfer.getData('text/plain') || draggedSubjectId;
                    if (fromId) {
                      reorderSubjects(fromId, group.id);
                    }
                    setDraggedSubjectId(null);
                    setDragOverSubjectId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedSubjectId(null);
                    setDragOverSubjectId(null);
                  }}
                  onClick={() => toggleSubjectExpand(group.id)}
                  className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-between border transition-all cursor-pointer select-none ${
                    draggedSubjectId === group.id
                      ? 'opacity-40 scale-[0.98] border-dashed border-[#0082ff] bg-blue-50/20'
                      : dragOverSubjectId === group.id
                      ? 'border-2 border-[#0082ff] bg-blue-50/60 scale-[1.01]'
                      : group.isAllDone 
                      ? 'bg-black/10 border-black/10 opacity-75' 
                      : 'bg-black/5 border-black/10 hover:border-black/25 hover:bg-black/[0.08]'
                  }`}
                >
                  {/* Left: Drag Handle, Main Stream Subject Checkbox & Title */}
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 mr-2 overflow-hidden">
                    {/* Drag Handle: Desktop mouse grab & Mobile touch handle */}
                    <div
                      className="text-black/30 hover:text-black/80 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
                      title={language === 'am' ? 'ይጎትቱና ቦታውን ይቀይሩ' : 'Drag to reorder subjects'}
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => handleTouchStart(e, group.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <GripVertical size={13} />
                    </div>

                    {/* Master Checkbox: Automatically checks itself when all under tasks are marked done! */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSubject(group.tasks, group.isAllDone);
                      }}
                      className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        group.isAllDone
                          ? `${theme.checkBgDone} border-transparent shadow-xs scale-105`
                          : `${theme.checkBorder} bg-transparent hover:scale-110`
                      }`}
                      title={group.isAllDone ? 'All tasks completed! Click to uncheck all' : 'Mark all tasks in this subject as completed'}
                    >
                      {group.isAllDone && <Check size={12} strokeWidth={3.5} />}
                    </button>

                    {/* Subject Icon - Display only */}
                    <div 
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs select-none"
                      style={{ backgroundColor: `${group.color}25`, color: group.color }}
                    >
                      <SubjectIcon size={12} />
                    </div>

                    {/* Subject Title Text */}
                    <span 
                      className={`text-[11px] sm:text-xs font-black uppercase tracking-wider truncate select-none ${
                        group.isAllDone ? 'line-through opacity-70' : 'opacity-95'
                      }`}
                    >
                      {group.translatedTitle}
                    </span>
                  </div>

                  {/* Right: Progress Badge & Expand Little Sign */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                      group.isAllDone 
                        ? 'bg-emerald-500/25 text-emerald-800' 
                        : `${theme.hourBadgeBg} ${theme.hourBadgeText}`
                    }`}>
                      {group.completedCount}/{group.totalCount} {group.isAllDone ? '✓ Done' : group.formattedDuration}
                    </span>

                    {/* Expand Little Sign on Category */}
                    <div
                      className={`p-1 rounded-md transition flex items-center justify-center ${
                        isExpanded 
                          ? 'bg-black/10 opacity-100 scale-105' 
                          : 'opacity-70 hover:opacity-100 hover:bg-black/10'
                      }`}
                      title={isExpanded ? (language === 'am' ? 'ተግባራትን ሰብስብ' : 'Collapse tasks') : (language === 'am' ? 'ተግባራትን ዘርጋ' : 'Expand tasks')}
                      aria-label={isExpanded ? 'Collapse tasks' : 'Expand tasks'}
                    >
                      {isExpanded ? (
                        <ChevronUp size={13} strokeWidth={2.5} />
                      ) : (
                        <ChevronDown size={13} strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasks under this Category - directly on the main sticky */}
                {isExpanded && (
                  <div className="space-y-1.5 pt-2 pb-1 pl-1 sm:pl-2 transition-all duration-200">
                    {group.displayedTasks.map((task) => {
                          const formattedDuration = formatTaskDuration(task.durationMin);
                          const isActive = activeTask?.id === task.id;

                          return (
                            <div 
                              key={task.id}
                              data-task-id={task.id}
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
                                if (dragOverTaskId === task.id) {
                                  setDragOverTaskId(null);
                                }
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
                              className={`group/task py-1.5 px-2 rounded-xl transition-all duration-150 ${
                                draggedTaskId === task.id
                                  ? 'opacity-40 scale-98 border border-dashed border-[#0082ff] bg-blue-50/20'
                                  : dragOverTaskId === task.id
                                  ? 'bg-blue-500/20 border-2 border-[#0082ff] scale-[1.01] shadow-xs'
                                  : task.completed 
                                  ? 'opacity-55 hover:bg-black/5' 
                                  : isActive 
                                    ? 'bg-black/10 border border-black/15 shadow-2xs'
                                    : 'hover:bg-black/5'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                {/* Drag Handle, Checkbox, Time & Task Title */}
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  {/* Task Drag Handle (Desktop & Mobile Touch) */}
                                  <div 
                                    className="text-black/35 hover:text-black/80 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0 -ml-1 select-none transition-colors"
                                    title={language === 'am' ? 'ብሎኩን ጎትተህ ቦታውን ቀይር' : 'Drag to reorder block'}
                                    onClick={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => handleTaskTouchStart(e, task.id)}
                                    onTouchMove={handleTaskTouchMove}
                                    onTouchEnd={handleTaskTouchEnd}
                                  >
                                    <GripVertical size={12} />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleTask(task)}
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                      task.completed 
                                        ? `${theme.checkBgDone} border-transparent` 
                                        : `${theme.checkBorder} bg-transparent hover:scale-110`
                                    }`}
                                    title={task.completed ? (language === 'am' ? 'ያልተጠናቀቀ አድርግ' : 'Mark uncompleted') : (language === 'am' ? 'እንደተጠናቀቀ ምልክት አድርግ' : 'Mark completed')}
                                  >
                                    {task.completed && <Check size={11} strokeWidth={3} />}
                                  </button>

                                  <span className="font-mono text-[10px] font-bold shrink-0 opacity-65">
                                    {formatTaskTime(task.startTime)}
                                  </span>

                                  <span 
                                    onClick={() => handleToggleTask(task)}
                                    className={`truncate font-semibold cursor-pointer select-none ${
                                      task.completed ? 'line-through opacity-55' : 'opacity-90 hover:opacity-100'
                                    }`}
                                    title={task.completed ? (language === 'am' ? 'ያልተጠናቀቀ አድርግ' : 'Mark uncompleted') : (language === 'am' ? 'እንደተጠናቀቀ ምልክት አድርግ' : 'Mark completed')}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                {/* Duration Pill */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span 
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold ${theme.hourBadgeBg} ${theme.hourBadgeText}`}
                                    title={`${task.durationMin} minutes`}
                                  >
                                    {formattedDuration}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Sunday Rest Day Card: Shown on Sundays when no devotion/Sunday activities are scheduled */}
          {isSunday && subjectGroups.length === 0 && (
            <div className="py-8 px-4 text-center select-none rounded-3xl border border-emerald-500/20 bg-emerald-50/70 backdrop-blur-xs space-y-4 shadow-xs my-2 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center text-3xl shadow-inner">
                🌿
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black font-sans tracking-tight text-emerald-950">
                  {language === 'am' ? 'የዕረፍት ቀን - ዘና ይበሉ' : 'Rest Day and Relax'}
                </h3>
                <p className="text-xs sm:text-sm font-medium opacity-80 max-w-md mx-auto text-emerald-900/80 leading-relaxed font-sans">
                  {language === 'am' 
                    ? 'እሁድ የተመደበው የዕረፍትና የመረጋጊያ ቀንዎ ነው። አዕምሮዎን ያሳርፉ፣ ጸጥታን ይለማመዱ እና ለሚመጣው አዲስ ሳምንት ራስዎን ያድሱ።' 
                    : 'Sunday is your designated rest day. Relax, reflect, recharge, and enjoy peaceful moments with loved ones.'}
                </p>
              </div>
            </div>
          )}

          {/* Weekday Empty State: Pure execution notice reflecting Main Streams & Planner */}
          {!isSunday && subjectGroups.length === 0 && (
            <div className="py-10 px-4 text-center space-y-4 select-none animate-fadeIn">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-black/5 flex items-center justify-center text-2xl shadow-inner">
                📋
              </div>
              <div className="space-y-1.5">
                <h4 className="font-sans text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {language === 'am' ? 'ለዚህ ቀን የተመዘገበ ፕሮግራም የለም' : 'No Blocks Scheduled for this Day'}
                </h4>
                <p className="text-xs font-mono opacity-60 max-w-sm mx-auto leading-relaxed">
                  {language === 'am'
                    ? 'በዋና ዘርፎች ወይም በታክቲካል ፕላነር የተመዘገቡ ፕሮግራሞችና ተግባራት በቀጥታ በዚህ ሰሌዳ ላይ ይቀርባሉ።'
                    : 'Blocks and routines registered in your Category programs or Tactical Planner directly display here.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className="px-4 py-2 rounded-xl bg-[#0082ff] hover:bg-blue-600 text-white text-xs font-bold shadow-xs cursor-pointer transition active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Calendar size={13} />
                  <span>{language === 'am' ? 'ታክቲካል ፕላነር ክፈት' : 'Open Tactical Planner'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const firstCat = allCategoryKeys.find((k) => categoryPlans && categoryPlans[k]);
                    if (firstCat) setSelectedCategoryId(firstCat);
                  }}
                  className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-bold border border-black/10 dark:border-white/10 cursor-pointer transition active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Compass size={13} />
                  <span>{language === 'am' ? 'ዋና ክፍሎችን ተመልከት' : 'View Categories'}</span>
                </button>
              </div>

              {/* One-click option to copy today's routine to this day for independent editing */}
              {!isViewingToday && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyTodayRoutine}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/90 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer transition active:scale-95 inline-flex items-center gap-1.5"
                  >
                    <span>📋</span>
                    <span>{language === 'am' ? 'የዛሬውን ፕሮግራም ወደዚህ ቀን ቅዳ' : "Copy Today's Routine to this Day"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Dedicated Clear Paper Area for effortless double-tap to toggle full-screen on mobile & desktop */}
          <div 
            onTouchStart={handlePaperTouchStart}
            onTouchEnd={handlePaperTouchEnd}
            onDoubleClick={handlePaperDoubleClick}
            className="w-full py-4 mt-1 cursor-pointer select-none touch-manipulation min-h-[36px]"
            title={isFullScreen ? (language === 'am' ? 'ከሙሉ ገጽ ለመውጣት ወረቀቱን ሁለት ጊዜ ይንኩ' : 'Double tap paper to exit full screen') : (language === 'am' ? 'በሙሉ ገጽ ለማየት ወረቀቱን ሁለት ጊዜ ይንኩ' : 'Double tap paper to expand full screen')}
          />
        </div>
      </div>
      </div>

      <DayDefaultsModal
        isOpen={showDefaultsModal}
        onClose={() => setShowDefaultsModal(false)}
        initialDayOfWeek={activeDayOfWeek}
      />

      <ApplyDayScheduleModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        sourceDateStr={activeDateStr}
        sourceDayName={dayName}
        sourceTasksCount={dayTasks.length}
      />

      {pendingScopeAction && (
        <ScheduleSaveScopeModal
          isOpen={pendingScopeAction.isOpen}
          onClose={() => setPendingScopeAction(null)}
          title={pendingScopeAction.title}
          itemDescription={pendingScopeAction.itemDescription}
          sourceDate={today}
          onConfirm={handleConfirmScope}
        />
      )}
    </div>
  );
};
