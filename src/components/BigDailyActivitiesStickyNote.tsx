import React, { useState, useRef } from 'react';
import { 
  Check, Play, Plus, Clock, Wind, 
  Trash2, ChevronDown, ChevronUp, Palette,
  Dumbbell, Swords, Music, Building2, TrendingUp, 
  BookOpen, Shield, CheckCircle2, Sparkles, X, Edit2,
  ExternalLink, GripVertical, Settings, Copy, RotateCcw, Save, Calendar
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { gregorianToEthiopian, ETHIOPIAN_MONTHS, AMHARIC_DAYS } from '../utils/ethiopianCalendar';
import { soundEngine } from '../utils/audio';
import { DayDefaultsModal } from './DayDefaultsModal';
import { ApplyDayScheduleModal } from './ApplyDayScheduleModal';
import { ScheduleSaveScopeModal, ScheduleSaveScope } from './ScheduleSaveScopeModal';

type StickyColorTheme = 'canary' | 'peach' | 'mint' | 'sky' | 'rose' | 'lavender';

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
}> = {
  canary: {
    name: 'Classic Canary Yellow',
    dotColor: '#fde047',
    paperBg: 'bg-[#fef9c3] dark:bg-[#2a2305]',
    paperBorder: 'border-[#fef08a] dark:border-amber-700/60',
    textPrimary: 'text-amber-950 dark:text-amber-100',
    textSecondary: 'text-amber-800/80 dark:text-amber-300/80',
    tapeBg: 'bg-amber-100/70 dark:bg-amber-900/40',
    tapeBorder: 'border-amber-200/80 dark:border-amber-700/50',
    hourBadgeBg: 'bg-amber-200/80 dark:bg-amber-900/70',
    hourBadgeText: 'text-amber-950 dark:text-amber-200',
    checkBorder: 'border-amber-400 dark:border-amber-600',
    checkBgDone: 'bg-amber-600 text-white',
    ruledLineColor: 'rgba(217, 119, 6, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(180, 83, 9, 0.22)',
  },
  peach: {
    name: 'Warm Peach',
    dotColor: '#fdba74',
    paperBg: 'bg-[#ffedd5] dark:bg-[#2b1406]',
    paperBorder: 'border-[#fed7aa] dark:border-orange-700/60',
    textPrimary: 'text-orange-950 dark:text-orange-100',
    textSecondary: 'text-orange-800/80 dark:text-orange-300/80',
    tapeBg: 'bg-orange-100/70 dark:bg-orange-900/40',
    tapeBorder: 'border-orange-200/80 dark:border-orange-700/50',
    hourBadgeBg: 'bg-orange-200/80 dark:bg-orange-900/70',
    hourBadgeText: 'text-orange-950 dark:text-orange-200',
    checkBorder: 'border-orange-400 dark:border-orange-600',
    checkBgDone: 'bg-orange-600 text-white',
    ruledLineColor: 'rgba(234, 88, 12, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(194, 65, 12, 0.22)',
  },
  mint: {
    name: 'Mint Green',
    dotColor: '#86efac',
    paperBg: 'bg-[#dcfce7] dark:bg-[#072414]',
    paperBorder: 'border-[#bbf7d0] dark:border-emerald-700/60',
    textPrimary: 'text-emerald-950 dark:text-emerald-100',
    textSecondary: 'text-emerald-800/80 dark:text-emerald-300/80',
    tapeBg: 'bg-emerald-100/70 dark:bg-emerald-900/40',
    tapeBorder: 'border-emerald-200/80 dark:border-emerald-700/50',
    hourBadgeBg: 'bg-emerald-200/80 dark:bg-emerald-900/70',
    hourBadgeText: 'text-emerald-950 dark:text-emerald-200',
    checkBorder: 'border-emerald-400 dark:border-emerald-600',
    checkBgDone: 'bg-emerald-600 text-white',
    ruledLineColor: 'rgba(5, 150, 105, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(4, 120, 87, 0.22)',
  },
  sky: {
    name: 'Sky Blue',
    dotColor: '#7dd3fc',
    paperBg: 'bg-[#e0f2fe] dark:bg-[#062235]',
    paperBorder: 'border-[#bae6fd] dark:border-sky-700/60',
    textPrimary: 'text-sky-950 dark:text-sky-100',
    textSecondary: 'text-sky-800/80 dark:text-sky-300/80',
    tapeBg: 'bg-sky-100/70 dark:bg-sky-900/40',
    tapeBorder: 'border-sky-200/80 dark:border-sky-700/50',
    hourBadgeBg: 'bg-sky-200/80 dark:bg-sky-900/70',
    hourBadgeText: 'text-sky-950 dark:text-sky-200',
    checkBorder: 'border-sky-400 dark:border-sky-600',
    checkBgDone: 'bg-sky-600 text-white',
    ruledLineColor: 'rgba(2, 132, 199, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(3, 105, 161, 0.22)',
  },
  rose: {
    name: 'Soft Rose',
    dotColor: '#fda4af',
    paperBg: 'bg-[#ffe4e6] dark:bg-[#2b0814]',
    paperBorder: 'border-[#fecdd3] dark:border-rose-700/60',
    textPrimary: 'text-rose-950 dark:text-rose-100',
    textSecondary: 'text-rose-800/80 dark:text-rose-300/80',
    tapeBg: 'bg-rose-100/70 dark:bg-rose-900/40',
    tapeBorder: 'border-rose-200/80 dark:border-rose-700/50',
    hourBadgeBg: 'bg-rose-200/80 dark:bg-rose-900/70',
    hourBadgeText: 'text-rose-950 dark:text-rose-200',
    checkBorder: 'border-rose-400 dark:border-rose-600',
    checkBgDone: 'bg-rose-600 text-white',
    ruledLineColor: 'rgba(225, 29, 72, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(190, 18, 60, 0.22)',
  },
  lavender: {
    name: 'Pastel Lavender',
    dotColor: '#d8b4fe',
    paperBg: 'bg-[#f3e8ff] dark:bg-[#220730]',
    paperBorder: 'border-[#e9d5ff] dark:border-purple-700/60',
    textPrimary: 'text-purple-950 dark:text-purple-100',
    textSecondary: 'text-purple-800/80 dark:text-purple-300/80',
    tapeBg: 'bg-purple-100/70 dark:bg-purple-900/40',
    tapeBorder: 'border-purple-200/80 dark:border-purple-700/50',
    hourBadgeBg: 'bg-purple-200/80 dark:bg-purple-900/70',
    hourBadgeText: 'text-purple-950 dark:text-purple-200',
    checkBorder: 'border-purple-400 dark:border-purple-600',
    checkBgDone: 'bg-purple-600 text-white',
    ruledLineColor: 'rgba(147, 51, 234, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(126, 34, 206, 0.22)',
  },
};

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
    setSelectedCategoryId,
    getCategoryTitleTranslated,
    language,
    t,
    getDaySchedule,
    materializeDaySchedule,
    resetDayScheduleToDefault,
    saveDayAsWeekdayDefault,
    applyDayScheduleToDates,
    getWeekdayDefaultTasks,
    applyTaskActionWithScope,
  } = useLivotion();

  const [colorTheme, setColorTheme] = useState<StickyColorTheme>('canary');
  const [filterMode, setFilterMode] = useState<'all' | 'remaining' | 'completed'>('all');
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

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

  // Quick Add State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('music');
  const [newStartTime, setNewStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    let hours = d.getHours();
    const minutes = d.getMinutes() < 30 ? '00' : '30';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours < 10 ? '0' + hours : hours}:${minutes} ${ampm}`;
  });
  const [newDurationMin, setNewDurationMin] = useState<number>(45);

  const theme = THEMES[colorTheme];

  // Dual Date Calculation
  const today = targetDate || new Date();
  const activeDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const nowObj = new Date();
  const todayStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(nowObj.getDate()).padStart(2, '0')}`;
  const isViewingToday = activeDateStr === todayStr;
  const activeDayOfWeek = (today.getDay() + 6) % 7 + 1; // 1 = Mon, ..., 7 = Sun

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

  // Helper to map a task to its Main Stream Subject / Category
  const getCategoryForTask = (task: ScheduleTask): { id: string; title: string; color: string; icon: any } => {
    if (task.badge) {
      const badgeLower = task.badge.toLowerCase();
      for (const [id, plan] of Object.entries(categoryPlans)) {
        if (badgeLower.includes(id) || plan.title.toLowerCase().includes(badgeLower)) {
          return { id, title: plan.title, color: plan.color, icon: getCategoryIcon(id) };
        }
      }
    }

    switch (task.domain) {
      case 'PHYSICAL_FITNESS':
        return { id: 'exercise', title: categoryPlans['exercise']?.title || 'Exercise & Fitness', color: categoryPlans['exercise']?.color || '#ef4444', icon: Dumbbell };
      case 'CHESS':
        return { id: 'chess', title: categoryPlans['chess']?.title || 'Chess', color: categoryPlans['chess']?.color || '#8b5cf6', icon: Swords };
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
        return { id: 'buffer', title: categoryPlans['buffer']?.title || 'Rest & Buffer', color: categoryPlans['buffer']?.color || '#64748b', icon: Shield };
    }
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

  // User's custom drag-and-drop category order
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('neva_category_order_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
  const [dragOverSubjectId, setDragOverSubjectId] = useState<string | null>(null);

  const touchActiveId = useRef<string | null>(null);

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
        saveDayAsWeekdayDefault(activeDateStr, activeDayOfWeek);
        setToastMessage(language === 'am' ? `ለሁሉም ${dayName} ነባሪ ሆኖ ተቀምጧል!` : `Set as default routine for all ${dayName}s!`);
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
      } else if (pendingScopeAction.action === 'create') {
        setNewTitle('');
        setIsAdding(false);
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

  // Group tasks by Main Stream Subjects for this active day
  const sortedTasks = [...dayTasks].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

  const baseCategoryKeys = Object.keys(categoryPlans);
  const allCategoryKeys = [...baseCategoryKeys].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  const reorderSubjects = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const currentOrder = [...allCategoryKeys];
    const fromIndex = currentOrder.indexOf(fromId);
    const toIndex = currentOrder.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);

    setCategoryOrder(newOrder);
    try {
      localStorage.setItem('neva_category_order_v1', JSON.stringify(newOrder));
    } catch {}
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

    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, removed);

    setCategoryOrder(newOrder);
    try {
      localStorage.setItem('neva_category_order_v1', JSON.stringify(newOrder));
    } catch {}
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

  // Calculate grouped subjects with their tasks
  const subjectGroups = allCategoryKeys
    .map((catKey) => {
      const plan = categoryPlans[catKey];
      const catTasks = sortedTasks.filter((t) => getCategoryForTask(t).id === catKey);
      
      const filteredTasks = catTasks.filter((t) => {
        if (filterMode === 'remaining') return !t.completed;
        if (filterMode === 'completed') return t.completed;
        return true;
      });

      const completedCount = catTasks.filter((t) => t.completed).length;
      const totalCount = catTasks.length;
      // Main Stream Subject is marked as checked when ALL its under tasks are marked as done!
      const isAllDone = totalCount > 0 && completedCount === totalCount;
      const totalHours = (catTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0) / 60).toFixed(1);

      return {
        id: catKey,
        title: plan.title,
        translatedTitle: getCategoryTitleTranslated(catKey, plan.title),
        color: plan.color,
        icon: getCategoryIcon(catKey),
        tasks: catTasks,
        displayedTasks: filteredTasks,
        completedCount,
        totalCount,
        totalHours,
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
  const totalHours = (dayTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0) / 60).toFixed(1);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const catPlan = categoryPlans[selectedCategoryKey] || categoryPlans['music'];
    const domain = getDomainForCategory(selectedCategoryKey);

    setPendingScopeAction({
      isOpen: true,
      action: 'create',
      title: language === 'am' ? 'አዲስ ብሎክ / ተግባር አክል' : 'Add Block to Schedule',
      itemDescription: `"${newTitle.trim()}" under ${catPlan?.title || 'Main Stream'} (${newStartTime} • ${newDurationMin}m)`,
      newTaskData: {
        title: newTitle.trim(),
        startTime: newStartTime.trim() || 'Flexible',
        durationMin: Number(newDurationMin),
        domain,
        badge: catPlan?.title?.split(' ')[0] || 'Focus',
        color: catPlan?.color || '#0082ff',
        soundProfile: 'SOLFEGGIO_432',
        completed: false,
        checklist: [
          { id: `c-${Date.now()}-1`, text: 'Warm-up & context immersion', done: false },
          { id: `c-${Date.now()}-2`, text: 'Deliberate high-focus execution', done: false },
        ],
      },
    });

    setExpandedSubjects((prev) => ({ ...prev, [selectedCategoryKey]: true }));
  };

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

  const handleOpenAddForSubject = (catKey: string) => {
    setSelectedCategoryKey(catKey);
    setIsAdding(true);
    setExpandedSubjects((prev) => ({ ...prev, [catKey]: true }));
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto my-2 group/stickymaster">
      {/* 1. Translucent Frosted Washi Tape (Compact scale) */}
      <div 
        className={`w-28 sm:w-32 h-4.5 mx-auto -mb-2 rounded-xs shadow-xs rotate-[-0.4deg] border backdrop-blur-md z-30 relative select-none flex items-center justify-center ${theme.tapeBg} ${theme.tapeBorder}`}
        title="Pinned to Desk"
      >
        <span className="text-[8px] tracking-[0.2em] font-mono font-bold uppercase opacity-60">
          {language === 'am' ? 'የዕለት ተግባራት' : 'DAILY TO-DO'}
        </span>
      </div>

      {/* 2. Pushpin on Top Right */}
      <div 
        className="absolute top-1.5 right-4 sm:right-6 z-30 select-none cursor-pointer filter drop-shadow-xs transition-transform hover:scale-110 active:scale-95"
        title="Pinned Desk Note"
      >
        <span className="text-lg sm:text-xl">📌</span>
      </div>

      {/* 3. The Stationary Classic Sticky Note Card */}
      <div 
        className={`relative w-full rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 transition-all duration-200 overflow-hidden ${theme.paperBg} ${theme.paperBorder} ${theme.textPrimary}`}
        style={{
          boxShadow: `0 10px 24px -6px ${theme.shadowColor}, 0 4px 8px -2px rgba(0,0,0,0.05)`,
        }}
      >
        {/* Ruled Lined Paper & Red Left Margin Line */}
        <div 
          className="absolute inset-0 pointer-events-none select-none opacity-80"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 27px, ${theme.ruledLineColor} 28px),
              linear-gradient(90deg, transparent 32px, ${theme.marginLineColor} 33px, ${theme.marginLineColor} 34px, transparent 35px)
            `,
          }}
        />

        {/* Header */}
        <div className="relative z-10 border-b border-black/10 dark:border-white/10 pb-2.5 mb-2.5">
          <div className="flex items-center justify-between gap-2 pr-6">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
                  {dateBanner}
                </span>
                <span className="text-xs font-bold font-handwriting opacity-85">
                  {language === 'am' ? 'የዕለት ተግባራት' : 'Daily Activities'}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-extrabold tracking-tight mt-0.5 font-sans flex items-center gap-1.5">
                <span>{language === 'am' ? 'የዕለት የማስፈጸሚያ ዝርዝር' : 'Daily Execution To-Do'}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/15">
                  {totalCount}
                </span>
              </h2>
            </div>

            {/* Palette Controls */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPalette(!showColorPalette)}
                  className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 transition cursor-pointer active:scale-95"
                  title="Change Color"
                >
                  <Palette size={13} />
                </button>

                {showColorPalette && (
                  <div className="absolute right-0 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 z-40">
                    {(Object.keys(THEMES) as StickyColorTheme[]).map((cKey) => (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => {
                          setColorTheme(cKey);
                          setShowColorPalette(false);
                        }}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                          colorTheme === cKey ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: THEMES[cKey].dotColor }}
                        title={THEMES[cKey].name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 transition cursor-pointer active:scale-95 text-current flex items-center justify-center"
                  title={language === 'am' ? 'ዝጋ' : 'Close'}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Status & Day Customization Bar (Hidden on front page, opt-in for calendar views) */}
        {showScheduleBar && (
          <div className={`relative z-20 mb-2.5 px-3 py-2 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 backdrop-blur-xs transition-all shadow-2xs font-sans ${
            isCustomDay 
              ? 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-500/30 text-amber-950 dark:text-amber-100'
              : 'bg-blue-500/10 dark:bg-blue-950/30 border-blue-500/30 text-blue-950 dark:text-blue-100'
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
                      ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200' 
                      : 'bg-blue-500/20 text-blue-900 dark:text-blue-200'
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
                    className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-rose-50 hover:text-rose-600 border border-black/10 dark:border-white/10 text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
                    title="Reset this day back to the default routine template"
                  >
                    <RotateCcw size={11} />
                    <span>{language === 'am' ? 'ወደ ነባሪ መልስ' : 'Reset to Default'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowApplyModal(true)}
                    className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
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
                    className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-[10px] font-bold cursor-pointer transition active:scale-95 flex items-center gap-1"
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
          <div className="relative z-20 mb-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
            <Check size={14} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* The Smaller Sticky / Sticker: Placed over the Daily To-Do Sticky Note */}
        <div className="relative z-20 my-3 -rotate-0.5 sm:-rotate-1 hover:rotate-0 transition-transform duration-200">
          {/* Frosted Washi Tape / Tape Strip on Top Edge */}
          <div className="absolute -top-2 left-6 sm:left-10 w-20 sm:w-28 h-3.5 bg-white/75 dark:bg-white/20 backdrop-blur-xs border-y border-dashed border-amber-400/40 dark:border-white/20 rounded-xs shadow-2xs rotate-1 pointer-events-none z-30" />

          {/* Mini Sticky Note / Sticker Body */}
          <div className="relative rounded-2xl bg-amber-100/95 dark:bg-[#18202f] border border-amber-300/80 dark:border-amber-500/30 p-2.5 sm:p-3.5 shadow-md shadow-amber-950/10 dark:shadow-black/50 text-slate-800 dark:text-slate-100 overflow-hidden">
            
            {/* Subtle Ruled Texture for Authentic Sticky Note Paper Feel */}
            <div 
              className="absolute inset-0 pointer-events-none select-none opacity-30 dark:opacity-15"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.08) 20px)',
              }}
            />

            {/* Sticker Top Bar: Sticker Title */}
            <div className="relative z-10 flex items-center justify-between gap-2 pb-1.5 border-b border-amber-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🏷️</span>
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-900/80 dark:text-amber-200">
                  {language === 'am' ? 'የዕለት ማጠቃለያ ስቲከር' : 'TODAY EXECUTION STICKER'}
                </span>
              </div>
            </div>

            {/* Metrics summary & Filter Pills */}
            <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap text-[11px] font-mono font-semibold pt-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>{language === 'am' ? 'ጠቅላላ:' : 'Total:'} <strong className="font-extrabold text-slate-900 dark:text-white">{totalHours}h</strong></span>
                <span className="opacity-40">•</span>
                <span>{language === 'am' ? 'የተጠናቀቀ:' : 'done:'} <strong className="font-extrabold text-emerald-700 dark:text-emerald-400">{completedCount} ({progressPercent}%)</strong></span>
                <span className="opacity-40">•</span>
                <span>{language === 'am' ? 'የቀረ:' : 'remaining:'} <strong className="font-extrabold text-amber-800 dark:text-amber-300">{totalCount - completedCount}</strong></span>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 ${
                    filterMode === 'all' 
                      ? 'bg-amber-900/20 dark:bg-white/20 font-extrabold text-slate-900 dark:text-white shadow-2xs' 
                      : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {t('all')} ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('remaining')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 ${
                    filterMode === 'remaining' 
                      ? 'bg-amber-900/20 dark:bg-white/20 font-extrabold text-slate-900 dark:text-white shadow-2xs' 
                      : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {t('remaining')} ({totalCount - completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('completed')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition active:scale-95 ${
                    filterMode === 'completed' 
                      ? 'bg-amber-900/20 dark:bg-white/20 font-extrabold text-slate-900 dark:text-white shadow-2xs' 
                      : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {t('done')} ({completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(!isAdding)}
                  className="px-2.5 py-0.5 rounded-md bg-[#0082ff] hover:bg-[#0070df] text-white cursor-pointer font-extrabold ml-1 shadow-2xs transition active:scale-95 flex items-center gap-1"
                  title={isAdding ? 'Close form' : 'Add focus task'}
                >
                  <span>{isAdding ? '✕' : '+'}</span>
                  <span className="hidden sm:inline text-[9px] font-sans font-bold">{isAdding ? 'Close' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* Progress Line */}
            <div className="relative z-10 w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-[#0082ff] to-[#0082ff] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Add Form with Main Stream Subject Selector */}
        {isAdding && (() => {
          const SelectedSubjectIcon = getCategoryIcon(selectedCategoryKey);
          return (
            <form 
              onSubmit={handleCreateTask}
              className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2 relative z-10 text-xs w-full max-w-full overflow-hidden"
            >
              {/* Row 1: Task Title Input */}
              <div className="w-full">
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={language === 'am' ? 'አዲስ ዕለታዊ የትኩረት ተግባር...' : 'New daily focus activity...'}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl text-xs bg-white/90 dark:bg-black/40 border border-black/15 dark:border-white/15 outline-none font-medium placeholder:opacity-60 focus:border-[#0082ff] shadow-2xs"
                />
              </div>

              {/* Row 2: Subject Icon Selector, Time, Duration & Icon-Only Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap w-full max-w-full">
                {/* Left Controls: Subject with Icon only, Start Time, Duration */}
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {/* Subject Selector with Icon ONLY */}
                  <div 
                    className="flex items-center gap-1 bg-white/90 dark:bg-black/40 border border-black/15 dark:border-white/15 rounded-xl px-2 py-1 text-xs"
                    title={language === 'am' ? 'ዘርፍ ይምረጡ' : 'Select Stream'}
                  >
                    <SelectedSubjectIcon 
                      size={13} 
                      style={{ color: categoryPlans[selectedCategoryKey]?.color || '#0082ff' }}
                      className="shrink-0"
                    />
                    <select
                      value={selectedCategoryKey}
                      onChange={(e) => setSelectedCategoryKey(e.target.value)}
                      className="bg-transparent text-[11px] font-bold outline-none cursor-pointer max-w-[90px] sm:max-w-none truncate"
                    >
                      {allCategoryKeys.map((cKey) => {
                        const plan = categoryPlans[cKey];
                        return (
                          <option key={cKey} value={cKey} className="text-black">
                            {getCategoryTitleTranslated(cKey, plan.title)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-center gap-1 bg-white/90 dark:bg-black/40 border border-black/15 dark:border-white/15 rounded-xl px-2 py-1 text-xs">
                    <Clock size={11} className="opacity-50 shrink-0" />
                    <input
                      type="text"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      placeholder="02:00 PM"
                      className="w-16 bg-transparent text-[11px] font-mono outline-none text-center font-bold"
                    />
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-1 bg-white/90 dark:bg-black/40 border border-black/15 dark:border-white/15 rounded-xl px-2 py-1 text-xs">
                    <select
                      value={newDurationMin}
                      onChange={(e) => setNewDurationMin(Number(e.target.value))}
                      className="bg-transparent text-[11px] font-mono outline-none cursor-pointer font-bold"
                    >
                      <option value={15} className="text-black">15m</option>
                      <option value={20} className="text-black">20m</option>
                      <option value={30} className="text-black">30m</option>
                      <option value={45} className="text-black">45m</option>
                      <option value={60} className="text-black">60m</option>
                      <option value={90} className="text-black">90m</option>
                      <option value={120} className="text-black">120m</option>
                    </select>
                  </div>
                </div>

                {/* Right: Only Icons for Actions - Cancel (X) & Add (Check) */}
                <div className="flex items-center gap-1 ml-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="p-1.5 rounded-xl opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center text-slate-600 dark:text-slate-300"
                    title={language === 'am' ? 'ሰርዝ' : 'Cancel'}
                    aria-label="Cancel"
                  >
                    <X size={15} />
                  </button>
                  <button
                    type="submit"
                    className="p-1.5 px-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl shadow-xs cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
                    title={language === 'am' ? 'መዝግብ' : 'Add task'}
                    aria-label="Add task"
                  >
                    <Check size={15} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </form>
          );
        })()}

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
                  className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-between border transition-all ${
                    draggedSubjectId === group.id
                      ? 'opacity-40 scale-[0.98] border-dashed border-[#0082ff] bg-blue-50/20'
                      : dragOverSubjectId === group.id
                      ? 'border-2 border-[#0082ff] bg-blue-50/40 dark:bg-blue-950/30 scale-[1.01]'
                      : group.isAllDone 
                      ? 'bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/10 opacity-75' 
                      : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                  }`}
                >
                  {/* Left: Drag Handle, Main Stream Subject Checkbox & Title */}
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 mr-2 overflow-hidden">
                    {/* Drag Handle: Desktop mouse grab & Mobile touch handle */}
                    <div
                      className="text-black/30 dark:text-white/30 hover:text-black/80 dark:hover:text-white/80 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
                      title={language === 'am' ? 'ይጎትቱና ቦታውን ይቀይሩ' : 'Drag to reorder subjects'}
                      onTouchStart={(e) => handleTouchStart(e, group.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <GripVertical size={13} />
                    </div>

                    {/* Master Checkbox: Automatically checks itself when all under tasks are marked done! */}
                    <button
                      type="button"
                      onClick={() => handleToggleSubject(group.tasks, group.isAllDone)}
                      className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        group.isAllDone
                          ? `${theme.checkBgDone} border-transparent shadow-xs scale-105`
                          : `${theme.checkBorder} bg-transparent hover:scale-110`
                      }`}
                      title={group.isAllDone ? 'All tasks completed! Click to uncheck all' : 'Mark all tasks in this subject as completed'}
                    >
                      {group.isAllDone && <Check size={12} strokeWidth={3.5} />}
                    </button>

                    {/* Subject Icon & Title - Touching toggles expand sign */}
                    <div 
                      onClick={() => toggleSubjectExpand(group.id)}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-100 select-none min-w-0 flex-1 overflow-hidden"
                      title={group.translatedTitle}
                    >
                      <div 
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: `${group.color}25`, color: group.color }}
                      >
                        <SubjectIcon size={12} />
                      </div>
                      <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wider truncate ${
                        group.isAllDone ? 'line-through opacity-70' : 'opacity-95'
                      }`}>
                        {group.translatedTitle}
                      </span>
                    </div>

                    {/* Quick Link to open Category Detail View (desktop only) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryId(group.id);
                      }}
                      className="p-1 rounded opacity-30 hover:opacity-100 hover:text-[#0082ff] transition cursor-pointer shrink-0 hidden sm:inline-flex"
                      title={language === 'am' ? 'ሙሉ እቅድ ክፈት' : 'Open category detail view'}
                    >
                      <ExternalLink size={10} />
                    </button>
                  </div>

                  {/* Right: Progress Badge, Quick Add & Expand Little Sign */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                      group.isAllDone 
                        ? 'bg-emerald-500/25 text-emerald-800 dark:text-emerald-200' 
                        : `${theme.hourBadgeBg} ${theme.hourBadgeText}`
                    }`}>
                      {group.completedCount}/{group.totalCount} {group.isAllDone ? '✓ Done' : `${group.totalHours}h`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenAddForSubject(group.id)}
                      className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                      title={`Add task under ${group.translatedTitle}`}
                    >
                      <Plus size={12} />
                    </button>

                    {/* Expand Little Sign on the Main Stream */}
                    <button
                      type="button"
                      onClick={() => toggleSubjectExpand(group.id)}
                      className={`p-1 rounded-md transition cursor-pointer flex items-center justify-center ${
                        isExpanded 
                          ? 'bg-black/10 dark:bg-white/15 opacity-100 scale-105' 
                          : 'opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                      title={isExpanded ? (language === 'am' ? 'ንዑስ ተግባራትን ሰብስብ' : 'Collapse sub-tasks') : (language === 'am' ? 'ንዑስ ተግባራትን ዘርጋ' : 'Expand sub-tasks')}
                      aria-label={isExpanded ? 'Collapse sub-tasks' : 'Expand sub-tasks'}
                    >
                      {isExpanded ? (
                        <ChevronUp size={13} strokeWidth={2.5} />
                      ) : (
                        <ChevronDown size={13} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Tasks under this Main Stream Subject - ONLY SEEN IF EXPAND LITTLE SIGN IS TOUCHED */}
                {isExpanded && (
                  <div className="pl-3.5 sm:pl-4 space-y-1 border-l-2 border-black/15 dark:border-white/15 ml-3 transition-all duration-150">
                    {group.displayedTasks.map((task) => {
                      const hoursTaken = (task.durationMin / 60).toFixed(1);
                      const isSubtasksOpen = !!expandedSubtasks[task.id];
                      const hasSubtasks = task.checklist && task.checklist.length > 0;
                      const completedSubCount = task.checklist ? task.checklist.filter((c) => c.done).length : 0;
                      const isActive = activeTask?.id === task.id;

                      const isEditing = editingTaskId === task.id;

                      if (isEditing) {
                        return (
                          <form
                            key={task.id}
                            onSubmit={(e) => handleSaveEditTask(task.id, e)}
                            className="p-2.5 rounded-xl bg-white/95 dark:bg-black/60 border border-black/15 dark:border-white/15 space-y-2 shadow-2xs my-1"
                          >
                            <input
                              type="text"
                              autoFocus
                              required
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Task title..."
                              className="w-full px-2 py-1 rounded-lg text-xs font-bold bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 outline-none focus:border-[#0082ff]"
                            />
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-1 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg px-2 py-0.5 text-xs">
                                  <Clock size={10} className="opacity-50" />
                                  <input
                                    type="text"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    placeholder="09:00 PM"
                                    className="w-16 bg-transparent text-[10px] font-mono outline-none text-center font-bold"
                                  />
                                </div>
                                <select
                                  value={editDurationMin}
                                  onChange={(e) => setEditDurationMin(Number(e.target.value))}
                                  className="bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg px-1.5 py-0.5 text-[10px] font-mono outline-none font-bold cursor-pointer"
                                >
                                  <option value={15}>15m</option>
                                  <option value={20}>20m</option>
                                  <option value={30}>30m</option>
                                  <option value={45}>45m</option>
                                  <option value={60}>60m</option>
                                  <option value={90}>90m</option>
                                  <option value={120}>120m</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => setEditingTaskId(null)}
                                  className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer text-slate-600 dark:text-slate-300"
                                  title={language === 'am' ? 'ተው' : 'Cancel'}
                                  aria-label="Cancel"
                                >
                                  <X size={13} />
                                </button>
                                <button
                                  type="submit"
                                  className="p-1 px-1.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-lg shadow-2xs cursor-pointer flex items-center justify-center"
                                  title={language === 'am' ? 'አስቀምጥ' : 'Save'}
                                  aria-label="Save"
                                >
                                  <Check size={13} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          </form>
                        );
                      }

                      return (
                        <div 
                          key={task.id}
                          className={`group/task py-1.5 px-2.5 rounded-xl border transition-all duration-150 ${
                            task.completed 
                              ? 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 opacity-55' 
                              : isActive 
                                ? 'bg-white/90 dark:bg-black/40 border-[#0082ff] shadow-2xs'
                                : 'bg-white/50 dark:bg-black/15 hover:bg-white/80 dark:hover:bg-black/30 border-black/10 dark:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            {/* Checkbox, Time & Task Title */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(task)}
                                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                  task.completed 
                                    ? `${theme.checkBgDone} border-transparent` 
                                    : `${theme.checkBorder} bg-transparent hover:scale-110`
                                }`}
                                title={task.completed ? 'Mark uncompleted' : 'Mark completed'}
                              >
                                {task.completed && <Check size={11} strokeWidth={3} />}
                              </button>

                              <span className="font-mono text-[10px] font-bold shrink-0 opacity-65">
                                {task.startTime || 'Flexible'}
                              </span>

                              <span 
                                onClick={() => startEditTask(task)}
                                className={`truncate font-semibold cursor-pointer select-none ${
                                  task.completed ? 'line-through opacity-55' : 'opacity-90 hover:underline'
                                }`}
                                title={language === 'am' ? 'ለመቀየር ይንኩ' : 'Click to edit task'}
                              >
                                {task.title}
                              </span>
                            </div>

                            {/* Duration Pill, Hidden on Mobile Play Button, Edit & Delete */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span 
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold ${theme.hourBadgeBg} ${theme.hourBadgeText}`}
                                title={`${task.durationMin} minutes`}
                              >
                                {hoursTaken}h
                              </span>

                              {/* Play Button - HIDDEN ON MOBILE (Desktop only) */}
                              {!task.completed && (
                                <button
                                  type="button"
                                  onClick={() => startTask(task)}
                                  className={`hidden sm:flex px-2 py-0.5 rounded-lg text-[10px] font-bold transition items-center gap-0.5 cursor-pointer shadow-2xs ${
                                    isActive 
                                      ? 'bg-rose-500 text-white animate-pulse' 
                                      : 'bg-[#0082ff] hover:bg-[#0070df] text-white'
                                  }`}
                                  title="Start focus timer"
                                >
                                  <Play size={9} fill="currentColor" />
                                  <span className="hidden md:inline">{isActive ? 'Focusing' : 'Focus'}</span>
                                </button>
                              )}

                              {/* Edit Pencil Button for mobile and desktop */}
                              <button
                                type="button"
                                onClick={() => startEditTask(task)}
                                className="p-1 rounded text-slate-500 hover:text-[#0082ff] dark:hover:text-[#0082ff] hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                                title={language === 'am' ? 'ቀይር' : 'Edit task'}
                              >
                                <Edit2 size={11} />
                              </button>

                              {hasSubtasks && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedSubtasks((prev) => ({
                                      ...prev,
                                      [task.id]: !prev[task.id],
                                    }));
                                  }}
                                  className="px-1 py-0.5 rounded text-[9px] font-mono opacity-60 hover:opacity-100 flex items-center cursor-pointer"
                                >
                                  <span>{completedSubCount}/{task.checklist?.length || 0}</span>
                                  {isSubtasksOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task)}
                                className="p-1 rounded text-rose-500 opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover/task:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          {/* Checklist subtasks if expanded */}
                          {isSubtasksOpen && hasSubtasks && task.checklist && (
                            <div className="mt-1.5 pt-1.5 border-t border-black/5 dark:border-white/10 pl-6 space-y-1 text-[11px]">
                              {task.checklist.map((item) => (
                                <div 
                                  key={item.id} 
                                  onClick={() => handleToggleChecklist(task, item.id)}
                                  className="flex items-center gap-1.5 cursor-pointer opacity-75 hover:opacity-100"
                                >
                                  <div className={`w-3 h-3 rounded-xs border flex items-center justify-center text-[8px] ${
                                    item.done ? 'bg-current text-white dark:text-black border-transparent' : 'border-current'
                                  }`}>
                                    {item.done && <Check size={8} />}
                                  </div>
                                  <span className={item.done ? 'line-through opacity-50' : ''}>
                                    {item.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State: Prompt user to choose a Main Stream Subject to schedule */}
          {subjectGroups.length === 0 && !isAdding && (
            <div className="py-6 px-3 text-center space-y-3 select-none border border-dashed border-black/15 dark:border-white/15 rounded-2xl">
              <p className="font-hand text-sm sm:text-base font-bold opacity-80">
                {language === 'am' ? 'ምንም የተመዘገበ ተግባር የለም። ከዋና ዋናዎቹ ክፍሎች አንዱን ይምረጡ፡' : 'No activities scheduled yet. Schedule your first focus block for:'}
              </p>

              {/* Main Stream Subjects Quick-Starter Pills */}
              <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
                {allCategoryKeys.map((cKey) => {
                  const plan = categoryPlans[cKey];
                  const Icon = getCategoryIcon(cKey);
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => handleOpenAddForSubject(cKey)}
                      className="px-2.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 hover:bg-white/90 dark:bg-black/20 dark:hover:bg-black/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Icon size={12} style={{ color: plan.color }} />
                      <span>{getCategoryTitleTranslated(cKey, plan.title)}</span>
                    </button>
                  );
                })}
              </div>

              {/* One-click option to copy today's routine to this day for independent editing */}
              {!isViewingToday && (
                <div className="pt-2 border-t border-black/10 dark:border-white/10 mt-2">
                  <button
                    type="button"
                    onClick={handleCopyTodayRoutine}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer transition active:scale-95 inline-flex items-center gap-1.5"
                  >
                    <span>📋</span>
                    <span>{language === 'am' ? 'የዛሬውን ፕሮግራም ወደዚህ ቀን ቅዳ' : "Copy Today's Routine to this Day"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
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
