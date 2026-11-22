import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Play, CheckCircle2, Clock, 
  Plus, Target, Award, Calendar, CalendarDays, ChevronLeft, CheckSquare, 
  Square, Sparkles, TrendingUp, ChevronRight,
  Flame, Swords, ChessKnight, Palette, Music, Dumbbell,
  Building2, BookOpen, Shield, Edit3, Trash2, 
  ChevronDown, ChevronUp, Layers, Check, Save, X, MoreVertical
} from 'lucide-react';
import { useLivotion, CategoryPlan } from '../context/LivotionContext';
import { DomainType, ScheduleTask } from '../types';
import { DailyPlansStickyCard } from './DailyPlansStickyCard';
import { CategoryFocusSessionModal } from './CategoryFocusSessionModal';
import { DurationPicker } from './DurationPicker';
import { soundEngine } from '../utils/audio';
import { formatTaskDuration } from '../utils/formatDuration';
import { gregorianToEthiopian, getEthiopianMonthCalendar, ETHIOPIAN_MONTHS, AMHARIC_DAYS } from '../utils/ethiopianCalendar';
import { getLocalDateStr } from '../utils/dateUtils';
import { 
  checkScheduleConflict, 
  ScheduleConflictResult, 
  autoResolveOverlappingTasks, 
  parseTimeToMinutes, 
  formatMinutesToTime 
} from '../utils/scheduleConflictDetector';
import { ScheduleConflictNotificationModal } from './ScheduleConflictNotificationModal';

export const CategoryDetailView: React.FC = () => {
  const { 
    selectedCategoryId, 
    setSelectedCategoryId,
    categoryPlans,
    updateCategoryPlan,
    getCategoryLiveMetrics,
    updateCategorySchedule,
    updateCategoryMonthlyDeliverable,
    addCategoryDailyPlan,
    toggleCategoryDailyPlan,
    deleteCategoryDailyPlan,
    tasks,
    startTask,
    toggleTaskCompletion,
    addTask,
    updateTask,
    deleteTask,
    activeTask,
    calendarSystem,
    language,
    t,
    getCategoryTitleTranslated,
    setActiveTab: setGlobalActiveTab,
    getDaySchedule,
    timeFormat,
    formatDisplayTime
  } = useLivotion();

  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'inprogress' | 'achieved' | 'upcoming'>('overview');
  const [timelineViewMode, setTimelineViewMode] = useState<'strip' | 'calendar'>('strip');
  const [stickyNoteDay, setStickyNoteDay] = useState<Date | null>(null);
  const [stickyQuickTitle, setStickyQuickTitle] = useState('');
  const [stickyQuickTime, setStickyQuickTime] = useState('08:00 AM');
  const [stickyQuickDuration, setStickyQuickDuration] = useState(45);
  const [stickyQuickIsCustom, setStickyQuickIsCustom] = useState(false);
  const [stickyTaskDayAlerts, setStickyTaskDayAlerts] = useState<Record<string, string>>({});
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const sheetDragStartY = useRef<number | null>(null);

  const isStickyDayPast = useMemo(() => {
    if (!stickyNoteDay) return false;
    const targetStr = getLocalDateStr(stickyNoteDay);
    const todayStr = getLocalDateStr(new Date());
    return targetStr < todayStr;
  }, [stickyNoteDay]);

  const isStickyDayFuture = useMemo(() => {
    if (!stickyNoteDay) return false;
    const targetStr = getLocalDateStr(stickyNoteDay);
    const todayStr = getLocalDateStr(new Date());
    return targetStr > todayStr;
  }, [stickyNoteDay]);

  const isStickyDayToday = useMemo(() => {
    if (!stickyNoteDay) return false;
    const targetStr = getLocalDateStr(stickyNoteDay);
    const todayStr = getLocalDateStr(new Date());
    return targetStr === todayStr;
  }, [stickyNoteDay]);

  // When stickyNoteDay opens, automatically calculate the next free start time so tasks never overlap
  useEffect(() => {
    if (!stickyNoteDay) return;
    const existing = getTasksForStreamDate(stickyNoteDay);
    if (existing.length > 0) {
      let maxEndMin = 0;
      existing.forEach((t) => {
        const s = parseTimeToMinutes(t.startTime);
        if (s >= 0) {
          const e = s + (t.durationMin || 45);
          if (e > maxEndMin) maxEndMin = e;
        }
      });
      if (maxEndMin > 0) {
        setStickyQuickTime(formatMinutesToTime(maxEndMin));
        return;
      }
    }
    setStickyQuickTime('08:00 AM');
  }, [stickyNoteDay]);

  const today = useMemo(() => new Date(), []);
  const todayEth = useMemo(() => gregorianToEthiopian(today), [today]);
  const [selectedEthYear, setSelectedEthYear] = useState<number>(todayEth.year);
  const [selectedEthMonth, setSelectedEthMonth] = useState<number>(todayEth.month);
  const [selectedGregYear, setSelectedGregYear] = useState<number>(today.getFullYear());
  const [selectedGregMonth, setSelectedGregMonth] = useState<number>(today.getMonth());
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditDailyModal, setShowEditDailyModal] = useState(false);
  const [showEditWeeklyModal, setShowEditWeeklyModal] = useState(false);
  const [showEditMonthlyModal, setShowEditMonthlyModal] = useState(false);
  const [showWeeklyDetail, setShowWeeklyDetail] = useState(true);
  const [showMonthlyDetail, setShowMonthlyDetail] = useState(false);
  const [showStickyDrawer, setShowStickyDrawer] = useState(false);
  const [showFocusSessionModal, setShowFocusSessionModal] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('06:00 PM');
  const [taskDuration, setTaskDuration] = useState(45);

  // Schedule Overlap Conflict Modal State
  const [scheduleConflict, setScheduleConflict] = useState<ScheduleConflictResult | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Daily focus & block modal state
  const [newDailyPlanText, setNewDailyPlanText] = useState('');
  const [dailyBlockTitle, setDailyBlockTitle] = useState('');
  const [dailyBlockTime, setDailyBlockTime] = useState('08:00 AM');
  const [dailyBlockDuration, setDailyBlockDuration] = useState(45);

  // New item input
  const [newItemText, setNewItemText] = useState('');

  const allAvailable = Object.values(categoryPlans || {}).filter(cat => cat && cat.id);
  const category = (selectedCategoryId && categoryPlans[selectedCategoryId]) 
    ? categoryPlans[selectedCategoryId] 
    : allAvailable[0] || null;

  if (!category || !category.id) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-sm font-bold text-slate-500 mb-4">
          {language === 'am' ? 'ይህ ዘርፍ አልተገኘም ወይም ተሰርዟል' : 'This stream was deleted or not found.'}
        </p>
        <button
          onClick={() => {
            setSelectedCategoryId(null);
            setGlobalActiveTab('cockpit');
          }}
          className="px-5 py-2.5 rounded-xl bg-[#0082ff] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-blue-600 transition"
        >
          {language === 'am' ? 'ወደ ዛሬ ተመለስ' : 'Return to Today'}
        </button>
      </div>
    );
  }

  // Real-time live mathematical metrics
  const metrics = getCategoryLiveMetrics(category.id);

  // Match tasks for this category
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

  const domainTypes = getDomainTypesForCat(category.id);
  const categoryTasks = tasks.filter((t) => domainTypes.includes(t.domain));
  const completedCategoryTasks = categoryTasks.filter((t) => t.completed).length;

  // Weekly Schedule Edit form states
  const [editWeeklyHours, setEditWeeklyHours] = useState(category.weeklyTargetHours);
  const [editScheduleSlots, setEditScheduleSlots] = useState<string[]>([...category.weeklyScheduleSummary]);
  const [newSlotText, setNewSlotText] = useState('');

  // Weekly Days Selector State (Mon, Tue, Wed, Thu, Fri, Sat, Sun 🌿)
  const WEEK_DAYS = [
    { id: 'Mon', en: 'Mon', am: 'ሰኞ', isRest: false },
    { id: 'Tue', en: 'Tue', am: 'ማክ', isRest: false },
    { id: 'Wed', en: 'Wed', am: 'ረቡ', isRest: false },
    { id: 'Thu', en: 'Thu', am: 'ሐሙ', isRest: false },
    { id: 'Fri', en: 'Fri', am: 'አር', isRest: false },
    { id: 'Sat', en: 'Sat', am: 'ቅዳ', isRest: false },
    { id: 'Sun', en: 'Sun 🌿', am: 'እሁ 🌿', isRest: true },
  ];
  const [selectedWeeklyDays, setSelectedWeeklyDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [weeklyDayDefaultTime, setWeeklyDayDefaultTime] = useState('07:00 AM');

  const handleToggleDay = (dayId: string) => {
    setSelectedWeeklyDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleApplyDaysToSchedule = () => {
    if (selectedWeeklyDays.length === 0) return;
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sorted = [...selectedWeeklyDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    const newSlots = sorted.map(d => `${d} ${weeklyDayDefaultTime}: ${category.title} Focus`);
    const merged = Array.from(new Set([...editScheduleSlots, ...newSlots]));
    setEditScheduleSlots(merged);
  };

  // 7-Day Cadence Breakdown direct day editing state
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editDayTime, setEditDayTime] = useState<string>('07:00 AM');
  const [editDayText, setEditDayText] = useState<string>('');

  const handleStartEditingDay = (dayName: string) => {
    const dayShort = dayName.slice(0, 3);
    const existingSlot = category.weeklyScheduleSummary.find((s) =>
      s.toLowerCase().includes(dayShort.toLowerCase())
    );

    setEditingDay(dayName);
    if (existingSlot) {
      const timeMatch = existingSlot.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i);
      setEditDayTime(timeMatch ? timeMatch[0] : '07:00 AM');
      
      const parts = existingSlot.split(':');
      if (parts.length > 2) {
        setEditDayText(parts.slice(2).join(':').trim());
      } else if (parts.length === 2 && !parts[1].toLowerCase().includes('am') && !parts[1].toLowerCase().includes('pm')) {
        setEditDayText(parts[1].trim());
      } else {
        const withoutDayAndTime = existingSlot
          .replace(new RegExp(`^${dayShort}\\s*`, 'i'), '')
          .replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b:?\s*/i, '')
          .trim();
        setEditDayText(withoutDayAndTime || `${category.title} Focus`);
      }
    } else {
      setEditDayTime(dayName === 'Sunday' ? '08:00 AM' : '07:00 AM');
      setEditDayText(dayName === 'Sunday' ? 'Serene Reflection & Devotion' : `${category.title} Focus Block`);
    }
  };

  const handleToggleDayCadence = (dayName: string) => {
    const dayShort = dayName.slice(0, 3);
    const existingSlot = category.weeklyScheduleSummary.find((s) =>
      s.toLowerCase().includes(dayShort.toLowerCase())
    );

    let updatedSlots: string[];
    if (existingSlot) {
      updatedSlots = category.weeklyScheduleSummary.filter(
        (s) => !s.toLowerCase().includes(dayShort.toLowerCase())
      );
    } else {
      const defaultText =
        dayName.toLowerCase().startsWith('sun')
          ? `${dayShort} 08:00 AM: ${category.title} Rest & Serene Reflection`
          : `${dayShort} 07:00 AM: ${category.title} Focus`;
      updatedSlots = [...category.weeklyScheduleSummary, defaultText];
    }

    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    updatedSlots.sort((a, b) => {
      const aDay = dayOrder.findIndex((d) => a.toLowerCase().startsWith(d.toLowerCase()));
      const bDay = dayOrder.findIndex((d) => b.toLowerCase().startsWith(d.toLowerCase()));
      return (aDay === -1 ? 99 : aDay) - (bDay === -1 ? 99 : bDay);
    });

    updateCategorySchedule(category.id, updatedSlots, Number(category.weeklyTargetHours));
  };

  const handleSaveDayCadence = (dayName: string) => {
    const dayShort = dayName.slice(0, 3);
    const cleanText = editDayText.trim() || `${category.title} Focus`;
    const newSlot = `${dayShort} ${editDayTime}: ${cleanText}`;

    const withoutThisDay = category.weeklyScheduleSummary.filter(
      (s) => !s.toLowerCase().includes(dayShort.toLowerCase())
    );
    const updatedSlots = [...withoutThisDay, newSlot];

    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    updatedSlots.sort((a, b) => {
      const aDay = dayOrder.findIndex((d) => a.toLowerCase().startsWith(d.toLowerCase()));
      const bDay = dayOrder.findIndex((d) => b.toLowerCase().startsWith(d.toLowerCase()));
      return (aDay === -1 ? 99 : aDay) - (bDay === -1 ? 99 : bDay);
    });

    updateCategorySchedule(category.id, updatedSlots, Number(category.weeklyTargetHours));
    setEditingDay(null);
  };

  const handleSetDayAsRest = (dayName: string) => {
    const dayShort = dayName.slice(0, 3);
    const updatedSlots = category.weeklyScheduleSummary.filter(
      (s) => !s.toLowerCase().includes(dayShort.toLowerCase())
    );
    updateCategorySchedule(category.id, updatedSlots, Number(category.weeklyTargetHours));
    setEditingDay(null);
  };

  // Monthly Deliverable Edit form states
  const [editGoalTitle, setEditGoalTitle] = useState(category.monthlyGoalTitle);
  const [editTargetMetric, setEditTargetMetric] = useState(category.monthlyTargetMetric);
  const [editMonthlyTargetHours, setEditMonthlyTargetHours] = useState(category.monthlyTargetHours);

  const getIcon = (id: string) => {
    switch (id) {
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

  const Icon = getIcon(category.id);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const dateStr = selectedTimelineDate.toISOString().split('T')[0];
    const timelineDateTasks = getDaySchedule(selectedTimelineDate).tasks;
    const conflict = checkScheduleConflict({
      proposedTask: {
        title: taskTitle.trim(),
        startTime: taskTime,
        durationMin: Number(taskDuration),
        categoryId: category.id,
        domain: domainTypes[0],
        badge: category.title.split(' ')[0],
      },
      dateStr,
      existingTasks: timelineDateTasks,
      isAlreadyScopedToDay: true,
      categoryPlans,
      timeFormat,
    });

    if (conflict.hasConflict) {
      setScheduleConflict(conflict);
      setIsConflictModalOpen(true);
      try { soundEngine.playTouchSound(); } catch {}
      return;
    }

    addTask({
      domain: domainTypes[0],
      title: taskTitle,
      startTime: taskTime,
      durationMin: Number(taskDuration),
      completed: false,
      color: category.color,
      badge: category.title.split(' ')[0],
      checklist: [],
    });

    setTaskTitle('');
    setShowAddTaskModal(false);
  };

  // =========================================================================
  // STREAM EXECUTION TIMELINE & PROGRESS TRACKING (Mobile Timeline & Circular Ring)
  // =========================================================================
  const [selectedTimelineDate, setSelectedTimelineDate] = useState<Date>(() => new Date());

  const isSelectedTimelineDatePast = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetStart = new Date(selectedTimelineDate.getFullYear(), selectedTimelineDate.getMonth(), selectedTimelineDate.getDate()).getTime();
    return targetStart < todayStart;
  }, [selectedTimelineDate]);
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);
  const [taskModalTitle, setTaskModalTitle] = useState('');
  const [taskModalTime, setTaskModalTime] = useState('08:00 AM');
  const [taskModalDuration, setTaskModalDuration] = useState(45);
  const [taskModalNotes, setTaskModalNotes] = useState('');
  const [taskPlanHorizon, setTaskPlanHorizon] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [taskSelectedDays, setTaskSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // 1=Mon..7=Sun
  const [taskMonthlyWeeks, setTaskMonthlyWeeks] = useState<number>(4); // 1..4 weeks
  const [inlineTaskStepInputs, setInlineTaskStepInputs] = useState<Record<string, string>>({});

  // 7-day strip around selectedTimelineDate
  const timelineWeekDays = useMemo(() => {
    const curr = new Date(selectedTimelineDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const days = [];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesAm = ['እሁ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'አር', 'ቅዳ'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayIndex = d.getDay();
      const ethDate = gregorianToEthiopian(d);

      let displayDayNum: number = d.getDate();
      let secondaryDayNum: number | null = null;
      if (calendarSystem === 'et') {
        displayDayNum = ethDate.day;
      } else if (calendarSystem === 'dual') {
        displayDayNum = d.getDate();
        secondaryDayNum = ethDate.day;
      }

      days.push({
        date: d,
        dateStr: getLocalDateStr(d),
        dayNum: displayDayNum,
        secondaryDayNum,
        dayShort: dayNamesEn[dayIndex],
        dayAm: dayNamesAm[dayIndex],
        ethDate,
        isSunday: dayIndex === 0,
        isToday: d.toDateString() === new Date().toDateString(),
        isSelected: d.toDateString() === selectedTimelineDate.toDateString(),
      });
    }
    return days;
  }, [selectedTimelineDate, calendarSystem]);

  // Helper to extract all tasks for a specific date in this stream
  const getTasksForStreamDate = (targetDate: Date): ScheduleTask[] => {
    if (!category) return [];
    const dateStr = getLocalDateStr(targetDate);
    const todayStr = getLocalDateStr(new Date());
    const isTargetFuture = dateStr > todayStr;
    const dayIndex = targetDate.getDay();
    const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];

    const sanitizeTargetTasks = (list: ScheduleTask[]): ScheduleTask[] => {
      const resolved = autoResolveOverlappingTasks(list);
      if (!isTargetFuture) return resolved;
      // Future tasks are planned only, never pre-completed
      return resolved.map(t => ({
        ...t,
        completed: false,
        checklist: t.checklist ? t.checklist.map(c => ({ ...c, done: false })) : []
      }));
    };

    // 1. Explicit tasks in context matching domain/badge and this date
    const explicitTasks = tasks.filter((t) => {
      const matches = domainTypes.includes(t.domain) || 
        (t.badge && t.badge.toLowerCase().includes(category.id.toLowerCase())) ||
        (t.title && t.title.toLowerCase().includes(category.title.toLowerCase()));
      return matches && (t.date === dateStr || (t.date && dateStr.startsWith('2026-11-') && t.date === dateStr.replace('2026-11-', '2025-11-')));
    });

    if (explicitTasks.length > 0) return sanitizeTargetTasks(explicitTasks);

    // 2. Check weekly schedule summary cadence slots for this day
    const daySlots = (category.weeklyScheduleSummary || []).filter((s) =>
      s.toLowerCase().includes(dayShort.toLowerCase())
    );

    if (daySlots.length > 0) {
      const generated = daySlots.map((slot, idx) => {
        const timeMatch = slot.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i);
        const timeStr = timeMatch ? timeMatch[0] : '08:00 AM';
        const cleanTitle = slot
          .replace(new RegExp(`^${dayShort}\\s*`, 'i'), '')
          .replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b:?\s*/i, '')
          .trim() || `${category.title} Focus`;

        const existing = tasks.find(t => 
          (domainTypes.includes(t.domain) || t.badge?.toLowerCase().includes(category.id.toLowerCase())) &&
          t.title === cleanTitle && 
          t.date === dateStr
        );
        if (existing) return existing;

        return {
          id: `cadence-${category.id}-${dayShort}-${idx}`,
          title: cleanTitle,
          domain: domainTypes[0],
          startTime: timeStr,
          durationMin: 45,
          color: category.color,
          badge: category.title.split(' ')[0],
          completed: false,
          date: dateStr,
          checklist: [],
          notes: `${category.title} Scheduled Cadence`,
        };
      });
      return sanitizeTargetTasks(generated);
    }

    // 3. Category daily plans if targetDate is today
    if (targetDate.toDateString() === new Date().toDateString() && category.dailyPlans && category.dailyPlans.length > 0) {
      return category.dailyPlans.map(dp => ({
        id: dp.id,
        title: dp.title,
        domain: domainTypes[0],
        startTime: '08:00 AM',
        durationMin: 45,
        color: category.color,
        badge: category.title.split(' ')[0],
        completed: dp.completed,
        date: dateStr,
        checklist: [],
        notes: 'Daily Plan',
      }));
    }

    // 4. Fallback recurring tasks without date (only if targetDate is today)
    if (targetDate.toDateString() === new Date().toDateString()) {
      return tasks.filter((t) => {
        const matches = domainTypes.includes(t.domain) || 
          (t.badge && t.badge.toLowerCase().includes(category.id.toLowerCase()));
        return matches && (!t.date || t.date === '');
      });
    }

    return [];
  };

  // Tasks for category on selected date
  const streamTasksForSelectedDay = useMemo(() => {
    return getTasksForStreamDate(selectedTimelineDate);
  }, [selectedTimelineDate, tasks, category, domainTypes]);

  // Calendar month data calculation (Ethiopian / Dual / Gregorian)
  const calendarMonthData = useMemo(() => {
    if (calendarSystem === 'et' || calendarSystem === 'dual') {
      const data = getEthiopianMonthCalendar(selectedEthYear, selectedEthMonth);
      const monthMeta = ETHIOPIAN_MONTHS[selectedEthMonth - 1] || { am: '', en: '' };
      return {
        type: 'ethiopian' as const,
        title: `${monthMeta.am} (${monthMeta.en}) ${selectedEthYear} ዓ.ም.`,
        subTitle: data.days[0]?.gregDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDayOfWeek: data.startDayOfWeek,
        days: data.days.map(d => ({
          key: `eth-${d.ethYear}-${d.ethMonth}-${d.ethDay}`,
          primaryNum: d.ethDay,
          secondaryNum: d.gregDate.getDate(),
          secondaryLabel: d.gregDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          gregDate: d.gregDate,
          dateStr: getLocalDateStr(d.gregDate),
          isToday: d.ethDay === todayEth.day && d.ethMonth === todayEth.month && d.ethYear === todayEth.year,
        }))
      };
    } else {
      // Gregorian calendar
      const firstDay = new Date(selectedGregYear, selectedGregMonth, 1);
      const lastDay = new Date(selectedGregYear, selectedGregMonth + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay();
      const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const days = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(selectedGregYear, selectedGregMonth, i);
        const eth = gregorianToEthiopian(d);
        days.push({
          key: `greg-${selectedGregYear}-${selectedGregMonth}-${i}`,
          primaryNum: i,
          secondaryNum: eth.day,
          secondaryLabel: `${eth.monthNameAm} ${eth.day}`,
          gregDate: d,
          dateStr: getLocalDateStr(d),
          isToday: d.toDateString() === today.toDateString(),
        });
      }
      return {
        type: 'gregorian' as const,
        title: monthName,
        subTitle: `${gregorianToEthiopian(firstDay).monthNameAm} ${gregorianToEthiopian(firstDay).year} ዓ.ም.`,
        startDayOfWeek,
        days,
      };
    }
  }, [calendarSystem, selectedEthYear, selectedEthMonth, selectedGregYear, selectedGregMonth, today, todayEth]);

  // Calendar Navigation Handlers
  const handlePrevMonth = () => {
    try { soundEngine.playClick(); } catch {}
    if (calendarSystem === 'et' || calendarSystem === 'dual') {
      if (selectedEthMonth === 1) {
        setSelectedEthMonth(13);
        setSelectedEthYear(prev => prev - 1);
      } else {
        setSelectedEthMonth(prev => prev - 1);
      }
    } else {
      if (selectedGregMonth === 0) {
        setSelectedGregMonth(11);
        setSelectedGregYear(prev => prev - 1);
      } else {
        setSelectedGregMonth(prev => prev - 1);
      }
    }
  };

  const handleNextMonth = () => {
    try { soundEngine.playClick(); } catch {}
    if (calendarSystem === 'et' || calendarSystem === 'dual') {
      if (selectedEthMonth === 13) {
        setSelectedEthMonth(1);
        setSelectedEthYear(prev => prev + 1);
      } else {
        setSelectedEthMonth(prev => prev + 1);
      }
    } else {
      if (selectedGregMonth === 11) {
        setSelectedGregMonth(0);
        setSelectedGregYear(prev => prev + 1);
      } else {
        setSelectedGregMonth(prev => prev + 1);
      }
    }
  };

  const handleJumpToday = () => {
    try { soundEngine.playClick(); } catch {}
    setSelectedEthYear(todayEth.year);
    setSelectedEthMonth(todayEth.month);
    setSelectedGregYear(today.getFullYear());
    setSelectedGregMonth(today.getMonth());
    setSelectedTimelineDate(today);
  };

  const handleCalendarDayClick = (dayDate: Date) => {
    try { soundEngine.playClick(); } catch {}
    setSelectedTimelineDate(dayDate);
    setStickyNoteDay(dayDate);
  };

  const handleToggleStickyTask = (task: ScheduleTask, date: Date) => {
    try { soundEngine.playClick(); } catch {}
    const dateStr = getLocalDateStr(date);
    const todayStr = getLocalDateStr(new Date());

    if (dateStr > todayStr) {
      setStickyTaskDayAlerts(prev => ({
        ...prev,
        [task.id]: language === 'am'
          ? 'ተግባራትን እንደተጠናቀቁ ምልክት ማድረግ የሚቻለው ለዛሬ ብቻ ነው! የወደፊት ቀናት ለማቀድና ለማስተካከል ብቻ ናቸው።'
          : 'Tasks can only be marked done on today! Future days are for planning and editing only.'
      }));
      setTimeout(() => {
        setStickyTaskDayAlerts(prev => {
          const copy = { ...prev };
          delete copy[task.id];
          return copy;
        });
      }, 3500);
      try { soundEngine.playTouchSound(); } catch {}
      return;
    }

    if (dateStr < todayStr) return; // Past days read-only

    if (task.id.startsWith('cadence-')) {
      addTask({
        domain: task.domain,
        title: task.title,
        startTime: task.startTime,
        durationMin: task.durationMin,
        completed: true,
        color: task.color,
        badge: task.badge,
        date: dateStr,
        checklist: [],
        notes: task.notes,
      });
      try { soundEngine.playSuccess(); } catch {}
    } else {
      const willBeCompleted = !task.completed;
      updateTask(task.id, { completed: willBeCompleted });
      toggleTaskCompletion(task.id);
      if (willBeCompleted) {
        try { soundEngine.playSuccess(); } catch {}
      }
    }
  };

  const handleAddStickyQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stickyNoteDay || !stickyQuickTitle.trim() || !category) return;

    const dateStr = getLocalDateStr(stickyNoteDay);
    const duration = stickyQuickDuration || 45;
    const currentStartMin = parseTimeToMinutes(stickyQuickTime);
    const safeStartMin = currentStartMin >= 0 ? currentStartMin : 8 * 60; // 08:00 AM default
    const startTimeStr = formatMinutesToTime(safeStartMin);

    addTask({
      domain: domainTypes[0],
      title: stickyQuickTitle.trim(),
      startTime: startTimeStr,
      durationMin: duration,
      completed: false,
      color: category.color,
      badge: category.title.split(' ')[0],
      date: dateStr,
      checklist: [],
      notes: `Added from ${category.title} Calendar Sticky Note`,
    });

    // Automatically advance start time for the next task so tasks never overlap!
    const nextStartMin = safeStartMin + duration;
    setStickyQuickTime(formatMinutesToTime(nextStartMin));

    setStickyQuickTitle('');
    try { soundEngine.playSuccess(); } catch {}
  };

  const handleStartStickyTaskFocus = (task: ScheduleTask) => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let targetDate: Date | null = null;
    if (task.date) {
      const cleanDateStr = task.date.startsWith('2025-11-') ? task.date.replace('2025-11-', '2026-11-') : task.date;
      const parts = cleanDateStr.split('-').map(Number);
      if (parts.length === 3) {
        targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    if (!targetDate && stickyNoteDay) {
      targetDate = new Date(stickyNoteDay.getFullYear(), stickyNoteDay.getMonth(), stickyNoteDay.getDate());
    }
    if (!targetDate) {
      targetDate = new Date(todayDate);
    }
    targetDate.setHours(0, 0, 0, 0);

    const diffMs = targetDate.getTime() - todayDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // The play button will work ONLY on that specific day (today)
    if (diffDays !== 0) {
      let alertMsg = '';
      if (diffDays > 0) {
        if (diffDays === 1) {
          alertMsg = language === 'am'
            ? 'ይህ ተግባር ለነገ ነው። እባክዎ የዛሬን ተግባራት ያጠናቅቁ!'
            : "This task is tomorrow. Please do today's tasks first!";
        } else {
          alertMsg = language === 'am'
            ? `ይህ ተግባር ከ${diffDays} ቀናት በኋላ ነው። እባክዎ የዛሬን ተግባራት ያጠናቅቁ!`
            : `This task is in ${diffDays} days. Please do today's tasks first!`;
        }
      } else {
        const pastDays = Math.abs(diffDays);
        if (pastDays === 1) {
          alertMsg = language === 'am'
            ? 'ይህ ተግባር የትናንት ነበር። እባክዎ የዛሬን ተግባራት ያጠናቅቁ!'
            : "This task was yesterday. Please do today's tasks first!";
        } else {
          alertMsg = language === 'am'
            ? `ይህ ተግባር የ${pastDays} ቀናት በፊት ነበር። እባክዎ የዛሬን ተግባራት ያጠናቅቁ!`
            : `This task was ${pastDays} days ago. Please do today's tasks first!`;
        }
      }

      setStickyTaskDayAlerts((prev) => ({ ...prev, [task.id]: alertMsg }));
      try { soundEngine.playClick(); } catch {}

      // Clear the message after 4.5 seconds
      setTimeout(() => {
        setStickyTaskDayAlerts((prev) => {
          const updated = { ...prev };
          delete updated[task.id];
          return updated;
        });
      }, 4500);

      return;
    }

    try { soundEngine.playClick(); } catch {}
    startTask(task);
    setStickyNoteDay(null);
    setGlobalActiveTab('practice');
  };

  // Daily task completion stats
  const dayTotalCount = streamTasksForSelectedDay.length;
  const dayCompletedCount = streamTasksForSelectedDay.filter(t => t.completed).length;
  const dayPercentage = dayTotalCount > 0 ? Math.round((dayCompletedCount / dayTotalCount) * 100) : 0;

  // Stream streak calculation (consecutive days with completed tasks in this stream)
  const streamStreak = useMemo(() => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const hasDone = tasks.some(t => 
        (domainTypes.includes(t.domain) || t.badge?.toLowerCase().includes(category.id.toLowerCase())) &&
        t.completed &&
        (t.date === ds || (!t.date && i === 0))
      );
      if (hasDone) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [tasks, domainTypes, category]);

  const totalStreamCompleted = useMemo(() => {
    return tasks.filter(t => 
      (domainTypes.includes(t.domain) || t.badge?.toLowerCase().includes(category.id.toLowerCase())) &&
      t.completed
    ).length;
  }, [tasks, domainTypes, category]);

  const motivationalMsg = useMemo(() => {
    if (dayPercentage === 100) return language === 'am' ? 'የዛሬው ዒላማ ተጠናቋል!' : 'Mastery achieved today!';
    if (dayPercentage >= 50) return language === 'am' ? 'ጥሩ ጉልበት — ቀጥሉበት!' : 'Great momentum — keep going!';
    if (dayTotalCount > 0) return language === 'am' ? 'ቀጥሉበት!' : 'keep going!';
    return language === 'am' ? 'ለዚህ ቀን ተግባር መድቡ' : 'Ready to plan this day';
  }, [dayPercentage, dayTotalCount, language]);

  // Handlers for task actions
  const handleToggleStreamTask = (task: ScheduleTask) => {
    if (task.id.startsWith('cadence-')) {
      addTask({
        title: task.title,
        domain: task.domain,
        startTime: task.startTime,
        durationMin: task.durationMin,
        color: task.color,
        badge: task.badge,
        completed: true,
        date: task.date || selectedTimelineDate.toISOString().split('T')[0],
        checklist: task.checklist || [],
        notes: task.notes,
      });
    } else {
      toggleTaskCompletion(task.id);
    }
    try { soundEngine.playTouchSound(); } catch {}
  };

  const handleDeleteStreamTask = (taskId: string) => {
    if (!taskId.startsWith('cadence-')) {
      deleteTask(taskId);
    }
    try { soundEngine.playTouchSound(); } catch {}
  };

  const handleOpenEditStreamTask = (task: ScheduleTask) => {
    setEditingTask(task);
    setTaskModalTitle(task.title);
    setTaskModalTime(task.startTime || '08:00 AM');
    setTaskModalDuration(task.durationMin || 45);
    setTaskModalNotes(task.notes || '');
    setTaskPlanHorizon('daily');
    setIsTaskModalOpen(true);
  };

  const handleOpenAddStreamTask = () => {
    setEditingTask(null);
    setTaskModalTitle('');
    setTaskModalTime('08:00 AM');
    setTaskModalDuration(45);
    setTaskModalNotes('');
    setTaskPlanHorizon('daily');
    const dayOfWeek = selectedTimelineDate.getDay();
    const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
    setTaskSelectedDays([dayNum]);
    setTaskMonthlyWeeks(4);
    setIsTaskModalOpen(true);
  };

  const handleToggleTaskModalDay = (dayNum: number) => {
    setTaskSelectedDays((prev) => {
      if (prev.includes(dayNum)) {
        if (prev.length === 1) return prev; // keep at least 1 day
        return prev.filter((d) => d !== dayNum);
      }
      return [...prev, dayNum].sort((a, b) => a - b);
    });
  };

  const handleSaveStreamTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskModalTitle.trim()) return;

    const dateStr = selectedTimelineDate.toISOString().split('T')[0];
    const dayOfWeek = selectedTimelineDate.getDay();
    const dayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
    const timelineDateTasks = getDaySchedule(selectedTimelineDate).tasks;

    const conflict = checkScheduleConflict({
      proposedTask: {
        id: editingTask?.id,
        title: taskModalTitle.trim(),
        startTime: taskModalTime,
        durationMin: Number(taskModalDuration),
        categoryId: category.id,
        domain: domainTypes[0],
        badge: category.title.split(' ')[0],
      },
      dateStr,
      dayOfWeek: taskPlanHorizon !== 'daily' ? dayNum : undefined,
      existingTasks: timelineDateTasks,
      isAlreadyScopedToDay: true,
      categoryPlans,
      timeFormat,
    });

    if (conflict.hasConflict) {
      setScheduleConflict(conflict);
      setIsConflictModalOpen(true);
      try { soundEngine.playTouchSound(); } catch {}
      return; // Stoppage: Do not save overlapping schedule block
    }

    if (editingTask && !editingTask.id.startsWith('cadence-')) {
      updateTask(editingTask.id, {
        title: taskModalTitle.trim(),
        startTime: taskModalTime,
        durationMin: Number(taskModalDuration),
        notes: taskModalNotes.trim(),
      });
    } else {
      if (taskPlanHorizon === 'daily') {
        addTask({
          title: taskModalTitle.trim(),
          domain: domainTypes[0],
          startTime: taskModalTime,
          durationMin: Number(taskModalDuration),
          color: category.color,
          badge: category.title.split(' ')[0],
          completed: false,
          date: selectedTimelineDate.toISOString().split('T')[0],
          checklist: [],
          notes: taskModalNotes.trim(),
        });
      } else if (taskPlanHorizon === 'weekly') {
        // Schedule for each selected day in the current week
        const curr = new Date(selectedTimelineDate);
        const day = curr.getDay();
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diff));

        taskSelectedDays.forEach((dayNum) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + (dayNum - 1));
          addTask({
            title: taskModalTitle.trim(),
            domain: domainTypes[0],
            startTime: taskModalTime,
            durationMin: Number(taskModalDuration),
            color: category.color,
            badge: category.title.split(' ')[0],
            completed: false,
            date: d.toISOString().split('T')[0],
            checklist: [],
            notes: taskModalNotes.trim() ? `${taskModalNotes.trim()} (Weekly Routine)` : 'Weekly Routine',
          });
        });
      } else if (taskPlanHorizon === 'monthly') {
        // Plan set amount of weeks with set amount of days
        const curr = new Date(selectedTimelineDate);
        const day = curr.getDay();
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diff));

        const weeksToSchedule = Math.max(1, Math.min(taskMonthlyWeeks, 12));
        for (let w = 0; w < weeksToSchedule; w++) {
          taskSelectedDays.forEach((dayNum) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + (w * 7) + (dayNum - 1));
            addTask({
              title: taskModalTitle.trim(),
              domain: domainTypes[0],
              startTime: taskModalTime,
              durationMin: Number(taskModalDuration),
              color: category.color,
              badge: category.title.split(' ')[0],
              completed: false,
              date: d.toISOString().split('T')[0],
              checklist: [],
              notes: taskModalNotes.trim() ? `${taskModalNotes.trim()} (Week ${w + 1})` : `Week ${w + 1} Routine`,
            });
          });
        }
      }
    }

    setIsTaskModalOpen(false);
    try { soundEngine.playTouchSound(); } catch {}
  };

  const handleAddInlineStep = (taskId: string) => {
    const text = inlineTaskStepInputs[taskId];
    if (!text || !text.trim()) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = [
      ...(task.checklist || []),
      { id: `step-${Date.now()}`, text: text.trim(), done: false }
    ];
    updateTask(taskId, { checklist: updated });
    setInlineTaskStepInputs(prev => ({ ...prev, [taskId]: '' }));
    try { soundEngine.playTouchSound(); } catch {}
  };

  const handleToggleChecklistStep = (taskId: string, stepId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.checklist) return;

    const updated = task.checklist.map(c => c.id === stepId ? { ...c, done: !c.done } : c);
    updateTask(taskId, { checklist: updated });
    try { soundEngine.playTouchSound(); } catch {}
  };

  const handleAddItem = (type: 'inProgress' | 'achieved' | 'upcoming') => {
    if (!newItemText.trim()) return;
    if (type === 'inProgress') {
      updateCategoryPlan(category.id, {
        inProgressItems: [...category.inProgressItems, newItemText.trim()]
      });
    } else if (type === 'achieved') {
      updateCategoryPlan(category.id, {
        achievedItems: [...category.achievedItems, newItemText.trim()]
      });
    } else {
      updateCategoryPlan(category.id, {
        upcomingItems: [...category.upcomingItems, newItemText.trim()]
      });
    }
    setNewItemText('');
  };

  const removeItem = (type: 'inProgress' | 'achieved' | 'upcoming', index: number) => {
    if (type === 'inProgress') {
      const next = [...category.inProgressItems];
      next.splice(index, 1);
      updateCategoryPlan(category.id, { inProgressItems: next });
    } else if (type === 'achieved') {
      const next = [...category.achievedItems];
      next.splice(index, 1);
      updateCategoryPlan(category.id, { achievedItems: next });
    } else {
      const next = [...category.upcomingItems];
      next.splice(index, 1);
      updateCategoryPlan(category.id, { upcomingItems: next });
    }
  };

  const handleSaveWeeklySchedule = (e: React.FormEvent) => {
    e.preventDefault();
    updateCategorySchedule(category.id, editScheduleSlots, Number(editWeeklyHours));
    setShowEditWeeklyModal(false);
  };

  const handleSaveMonthlyDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    updateCategoryMonthlyDeliverable(
      category.id,
      editGoalTitle,
      editTargetMetric,
      Number(editMonthlyTargetHours)
    );
    setShowEditMonthlyModal(false);
  };

  // Render Stream Month Calendar Grid
  const renderStreamMonthCalendar = () => {
    return (
      <div className="p-4 sm:p-6 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4 animate-fadeIn">
        {/* Calendar Header with Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: category.color }}
            >
              <Icon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {calendarMonthData.title}
                </h3>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${category.color}15`, color: category.color }}
                >
                  {getCategoryTitleTranslated(category.id, category.title)}
                </span>
              </div>
              {calendarMonthData.subTitle && (
                <p className="text-[11px] font-medium text-slate-400">
                  {calendarMonthData.subTitle}
                </p>
              )}
            </div>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title={language === 'am' ? 'ያለፈው ወር' : 'Previous Month'}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleJumpToday}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0082ff] text-xs font-bold transition cursor-pointer"
            >
              {language === 'am' ? 'ዛሬ' : 'Today'}
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title={language === 'am' ? 'ቀጣዩ ወር' : 'Next Month'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Week Days Header (7 Columns: Sun, Mon, Tue, Wed, Thu, Fri, Sat) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {AMHARIC_DAYS.map((d, idx) => (
            <div key={idx} className="py-1">
              <span className="block sm:hidden">{calendarSystem === 'et' ? d.short : d.en.slice(0, 3)}</span>
              <span className="hidden sm:block">{calendarSystem === 'et' ? `${d.am} (${d.en.slice(0, 3)})` : d.en}</span>
            </div>
          ))}
        </div>

        {/* Month Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells before start of month */}
          {Array.from({ length: calendarMonthData.startDayOfWeek }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="min-h-[72px] sm:min-h-[92px] rounded-2xl bg-slate-50/40 dark:bg-slate-900/20 border border-transparent" 
            />
          ))}

          {/* Days of Month */}
          {calendarMonthData.days.map((dayItem) => {
            const dayTasks = getTasksForStreamDate(dayItem.gregDate);
            const hasTasks = dayTasks.length > 0;
            const isSelected = selectedTimelineDate.toDateString() === dayItem.gregDate.toDateString();

            return (
              <div
                key={dayItem.key}
                onClick={() => handleCalendarDayClick(dayItem.gregDate)}
                className={`min-h-[72px] sm:min-h-[92px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 border-[#0082ff] ring-2 ring-[#0082ff] shadow-md scale-[1.02]'
                    : dayItem.isToday
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-700 shadow-2xs'
                    : hasTasks
                    ? 'bg-white dark:bg-[#151c28] border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                    : 'bg-slate-50/30 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/60 hover:border-slate-300'
                }`}
                title={language === 'am' ? 'የዕለቱ ማስታወሻና ተግባራት ለመመልከት ይጫኑ' : `Click to open ${category.title} Sticky Note for this day`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-black font-mono ${
                    isSelected ? 'text-[#0082ff]' : dayItem.isToday ? 'text-[#0082ff]' : 'text-slate-900 dark:text-white'
                  }`}>
                    {dayItem.primaryNum}
                  </span>

                  {dayItem.secondaryNum !== undefined && (
                    <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                      {dayItem.secondaryNum}
                    </span>
                  )}
                </div>

                {/* Tasks Indicators / Stream Badges */}
                <div className="space-y-1 mt-1 flex-1 flex flex-col justify-end">
                  {hasTasks ? (
                    <>
                      <div 
                        className="px-1.5 py-0.5 rounded-lg text-[8.5px] sm:text-[9.5px] font-bold truncate flex items-center justify-between gap-1 shadow-2xs"
                        style={{ 
                          backgroundColor: `${category.color}20`, 
                          color: category.color,
                          border: `1px solid ${category.color}40`
                        }}
                      >
                        <span className="truncate">{dayTasks[0].title}</span>
                      </div>

                      {dayTasks.length > 1 && (
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 pl-0.5">
                          +{dayTasks.length - 1} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[9px] text-transparent group-hover:text-amber-500 font-bold transition flex items-center gap-0.5 pl-0.5">
                      📌 <span className="hidden sm:inline">note</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Helpful Hint Legend */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <span>📌</span>
            <span>{language === 'am' ? 'የትኛውንም ቀን በመጫን የዕለቱን ማስታወሻ (Sticky Note) እና ተግባራት መክፈት ይችላሉ።' : 'Click any day to pop up its Sticky Note and view/schedule tasks.'}</span>
          </span>
          <button
            type="button"
            onClick={() => handleCalendarDayClick(new Date())}
            className="text-xs font-bold text-[#0082ff] hover:underline cursor-pointer"
          >
            {language === 'am' ? "የዛሬ ማስታወሻ ክፈት" : "Today's Sticky Note"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Top Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 sm:pb-4">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0082ff] dark:text-slate-400 dark:hover:text-[#0082ff] transition cursor-pointer px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 shrink-0"
        >
          <ArrowLeft size={14} /> <span>{language === 'am' ? 'ተመለስ' : 'Back to Today'}</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-3 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus size={13} /> <span>{t('addTask')}</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-blue-50 text-[#0082ff] border-blue-200 dark:bg-blue-950/60 dark:border-blue-800'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
            }`}
            title={language === 'am' ? 'የዘርፉ የቀን መቁጠሪያ ሰሌዳ' : 'Open Stream Calendar'}
          >
            <CalendarDays size={13} className="text-[#0082ff]" /> <span>{language === 'am' ? 'የቀን መቁጠሪያ' : 'Calendar'}</span>
          </button>
          <button
            onClick={() => setShowEditDailyModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200/80 dark:border-slate-700 shrink-0"
          >
            <Clock size={12} className="text-[#0082ff]" /> <span>{language === 'am' ? 'ዕለታዊ' : 'Daily'}</span>
          </button>
          <button
            onClick={() => {
              setEditWeeklyHours(category.weeklyTargetHours);
              setEditScheduleSlots([...category.weeklyScheduleSummary]);
              setShowEditWeeklyModal(true);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200/80 dark:border-slate-700 shrink-0"
          >
            <Edit3 size={12} /> <span>{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</span>
          </button>
          <button
            onClick={() => {
              setEditGoalTitle(category.monthlyGoalTitle);
              setEditTargetMetric(category.monthlyTargetMetric);
              setEditMonthlyTargetHours(category.monthlyTargetHours);
              setShowEditMonthlyModal(true);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200/80 dark:border-slate-700 shrink-0"
          >
            <Edit3 size={12} /> <span>{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</span>
          </button>
        </div>
      </div>

      {/* Hero Category Banner */}
      <div className="p-6 sm:p-8 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div 
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: category.color }}
        />

        <div className="flex items-start sm:items-center gap-4 z-10">
          <div 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ 
              backgroundColor: `${category.color}15`, 
              color: category.color,
              border: `1.5px solid ${category.color}40`
            }}
          >
            <Icon size={30} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {getCategoryTitleTranslated(category.id, category.title)}
              </h1>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${category.color}15`, color: category.color }}
              >
                {t('categoryPillar')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {language === 'am' ? 'የታቀደ ልህቀት፣ ሳምንታዊ የማስፈጸሚያ ሰዓታት እና የደረጃዎች እቅድ።' : 'Deliberate Mastery, execution cadence, and milestones roadmap.'}
            </p>
          </div>
        </div>

        {/* Quick Launch Focus Button - Opens Sequential Focus Countdown Runner Modal */}
        <button
          onClick={() => setShowFocusSessionModal(true)}
          className="px-5 py-3 rounded-2xl text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer self-start md:self-auto z-10 hover:opacity-90"
          style={{ backgroundColor: category.color }}
          title={language === 'am' ? 'የትኩረት ክፍለ-ጊዜዎችን በቅደም ተከተል በቆጣሪ ጀምር' : 'Run category focus blocks sequentially with countdown timer'}
        >
          <Play size={15} fill="currentColor" /> {language === 'am' ? `${getCategoryTitleTranslated(category.id, category.title)} ትኩረት ጀምር` : `Start ${category.title} Focus`}
        </button>
      </div>

      {/* 2 High-Impact Mastery Cadence Capsules (Mobile Ergonomic & Clean - No Truncation) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Capsule 1: Weekly Execution Cadence */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('weeklyHours')}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                • {language === 'am' ? 'የሳምንት ግብ' : 'Weekly Target'}
              </span>
            </div>
            <span 
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-2xs"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              {metrics.weeklyPercentile.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight">
                {metrics.currentWeeklyHours.toFixed(1)}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 font-mono">/ {metrics.weeklyTargetHours}{t('hoursShort')}</span>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {metrics.activeElapsedHours > 0 
                ? `🔥 +${(metrics.activeElapsedHours * 60).toFixed(0)}m live`
                : metrics.todayCompletedHours > 0
                  ? `+${metrics.todayCompletedHours.toFixed(1)}h logged today`
                  : `${Math.max(0, metrics.weeklyTargetHours - metrics.currentWeeklyHours).toFixed(1)}h remaining`}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300 rounded-full"
              style={{ 
                width: `${Math.min(100, Math.max(0, metrics.weeklyPercentile))}%`,
                backgroundColor: category.color 
              }}
            />
          </div>
        </div>

        {/* Capsule 2: Monthly Target & Today's Momentum */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('monthlyTarget')}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                • {language === 'am' ? 'የወር እና የዛሬ' : 'Month & Today'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full shadow-2xs">
              {metrics.currentMonthlyHours.toFixed(1)} / {metrics.monthlyTargetHours}{t('hoursShort')} ({metrics.monthlyPercentile.toFixed(0)}%)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-0.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                {language === 'am' ? 'የዛሬ ብሎኮች' : "Today's Blocks"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  {metrics.todayCompletedTasks}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {metrics.todayTotalTasks} {t('done')}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                {language === 'am' ? 'የሳምንት ፍጥነት' : 'Weekly Pacing'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-mono font-extrabold text-[#0082ff]">
                  {(metrics.monthlyTargetHours / 4).toFixed(1)}h
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {language === 'am' ? 'ሳምንት' : 'wk'}</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex gap-1">
            <div 
              className="bg-[#0082ff] h-full transition-all duration-300 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(0, metrics.monthlyPercentile))}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Sticky Note Quick Access */}
      <div className="flex items-center justify-between gap-2.5 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold shrink-0 whitespace-nowrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {language === 'am' ? 'ዕለታዊ እቅድ' : 'Daily & Weekly'}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <CalendarDays size={13} className="text-[#0082ff]" />
            <span>{language === 'am' ? 'የቀን መቁጠሪያ' : 'Calendar'}</span>
          </button>

          <button
            onClick={() => setActiveTab('inprogress')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'inprogress'
                ? 'bg-white text-amber-600 shadow-xs dark:bg-slate-900 dark:text-amber-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>⏳ {t('inProgress')}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px]">
              {category.inProgressItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('achieved')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'achieved'
                ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🏆 {t('achieved')}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
              {category.achievedItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'upcoming'
                ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-900 dark:text-purple-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🚀 {t('upcoming')}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px]">
              {category.upcomingItems.length}
            </span>
          </button>
        </div>

        {/* Quick Sticky Note Pill Button */}
        <button
          onClick={() => {
            if (activeTab !== 'overview') {
              setShowStickyDrawer(!showStickyDrawer);
            } else {
              const el = document.getElementById('category-sticky-note-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs ${
            showStickyDrawer && activeTab !== 'overview'
              ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 border-amber-300'
              : 'bg-[#fef9c3] hover:bg-[#fef08a] dark:bg-[#2c2405] dark:hover:bg-[#382d07] text-amber-950 dark:text-amber-100 border-[#fef08a] dark:border-amber-700/60'
          }`}
          title="Toggle Daily Plans Sticky Note"
        >
          <span>📌</span>
          <span>Daily Sticky Note</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-800 text-[10px] font-mono">
            {category.dailyPlans?.filter((p) => p.completed).length || 0}/{category.dailyPlans?.length || 0}
          </span>
        </button>
      </div>

      {/* Floating / Dropped Sticky Drawer when on In Progress, Achieved, or Upcoming tabs */}
      {showStickyDrawer && activeTab !== 'overview' && (
        <div className="max-w-xl animate-fadeIn">
          <DailyPlansStickyCard categoryId={category.id} />
        </div>
      )}

      {/* Tab 1: Overview & Detailed Plan (Stream Execution Timeline & Progress Tracking) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary 2 Columns: Stream Execution Timeline & Progress Tracking */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* 1. TODAY'S / DAY'S PROGRESS TRACKING CARD (Dark mode from user design, Creative & Beautiful Day Mode) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ffffff] via-[#f8faff] to-[#eef2ff] dark:from-[#15162d] dark:via-[#191c3e] dark:to-[#1c2045] p-5 sm:p-6 border border-indigo-100/90 dark:border-indigo-900/40 shadow-[0_12px_32px_-4px_rgba(79,70,229,0.08),0_4px_12px_-2px_rgba(0,0,0,0.02)] dark:shadow-2xl transition-all duration-300">
              {/* Subtle atmospheric ambient glow */}
              <div className="absolute -top-12 -right-12 w-52 h-52 bg-gradient-to-br from-indigo-300/20 via-sky-300/15 to-transparent dark:from-blue-500/10 dark:via-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-blue-300/15 via-indigo-200/10 to-transparent dark:from-indigo-600/5 dark:to-transparent rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] sm:text-xs font-black text-indigo-600 dark:text-[#8b97cc] tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles size={12} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span>
                      {selectedTimelineDate.toDateString() === new Date().toDateString()
                        ? (language === 'am' ? 'የዛሬ እድገት' : "Today's Progress")
                        : `${selectedTimelineDate.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${language === 'am' ? 'እድገት' : 'Progress'}`}
                    </span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {dayCompletedCount} of {dayTotalCount} completed
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-indigo-200/70 font-semibold flex items-center gap-1">
                    <span>{dayPercentage}% done — {motivationalMsg}</span>
                    <span>🚀</span>
                  </p>
                </div>

                {/* Circular Progress Ring */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <svg className="w-18 h-18 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      stroke="currentColor"
                      strokeWidth="6.5"
                      fill="transparent"
                      className="text-indigo-100/90 dark:text-[#21264c]"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="30"
                      stroke="currentColor"
                      strokeWidth="6.5"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 30}
                      strokeDashoffset={2 * Math.PI * 30 - (dayPercentage / 100) * (2 * Math.PI * 30)}
                      strokeLinecap="round"
                      className="text-[#4f46e5] dark:text-[#818cf8] transition-all duration-700 ease-out"
                    />
                  </svg>
                  <span className="absolute text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                    {dayPercentage}%
                  </span>
                </div>
              </div>

              {/* Footer Row: Streak & Total Completed */}
              <div className="relative z-10 mt-4 pt-3 border-t border-indigo-100/80 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-300 font-bold">
                  <span>🔥</span>
                  <span>{streamStreak} {language === 'am' ? 'ቀናት ተከታታይ' : 'day streak'}</span>
                  <span>🔥</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{totalStreamCompleted} {language === 'am' ? 'ተጠናቋል' : 'total completed'}</span>
                </div>
              </div>
            </div>

            {/* 2. THE TIMELINE CONTAINER (From Mobile Design) */}
            <div className="p-4 sm:p-6 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-5">
              
              {/* Header: Date + Day Name + Quick Action */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    {(() => {
                      const eth = gregorianToEthiopian(selectedTimelineDate);
                      if (calendarSystem === 'et') {
                        return `${eth.monthNameAm} ${eth.day}፣ ${eth.year} ዓ.ም.`;
                      } else if (calendarSystem === 'dual') {
                        const greg = selectedTimelineDate.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        return `${greg} • ${eth.monthNameAm} ${eth.day}`;
                      }
                      return selectedTimelineDate.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    })()}
                  </span>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {selectedTimelineDate.toDateString() === new Date().toDateString() 
                        ? (language === 'am' ? 'ዛሬ' : 'Today') 
                        : (calendarSystem === 'et'
                            ? gregorianToEthiopian(selectedTimelineDate).dayOfWeekAm
                            : selectedTimelineDate.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { weekday: 'long' }))}
                    </h2>
                    {selectedTimelineDate.toDateString() !== new Date().toDateString() && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTimelineDate(new Date());
                          try { soundEngine.playTouchSound(); } catch {}
                        }}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-[#0082ff] hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                        title={language === 'am' ? 'ወደ ዛሬ ተመለስ' : 'Jump to Today'}
                      >
                        {language === 'am' ? 'ዛሬ' : 'Today'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {/* View Mode Toggle: 7 Days Strip vs Month Calendar */}
                  <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[10px] font-bold border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setTimelineViewMode('strip')}
                      className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                        timelineViewMode === 'strip' ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {language === 'am' ? '7 ቀናት' : '7 Days'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineViewMode('calendar')}
                      className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        timelineViewMode === 'calendar' ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <CalendarDays size={11} />
                      <span>{language === 'am' ? 'የወር ሰሌዳ' : 'Calendar'}</span>
                    </button>
                  </div>

                  {/* Quick Open Sticky Note for Selected Day */}
                  <button
                    type="button"
                    onClick={() => setStickyNoteDay(selectedTimelineDate)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                    title="Open Sticky Note for this day"
                  >
                    <span>📌</span>
                    <span className="hidden sm:inline">Sticky Note</span>
                  </button>

                  {isSelectedTimelineDatePast ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1.5">
                      📜 {language === 'am' ? 'ያለፈ ቀን መዝገብ' : 'Past Day Log'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenAddStreamTask}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs hover:opacity-90 active:scale-95 transition cursor-pointer"
                      style={{ backgroundColor: category.color }}
                    >
                      <Plus size={14} />
                      <span>{language === 'am' ? 'ብሎክ አቅድ' : 'Plan Block'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Horizontal 7-Day Day Selector Strip with Previous/Next Week Navigation OR Full Month Calendar */}
              {timelineViewMode === 'strip' ? (
                <div className="flex items-center gap-1 sm:gap-2 px-0.5">
                  {/* Previous Week Navigation Button (<) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTimelineDate((prev) => {
                        const d = new Date(prev);
                        d.setDate(d.getDate() - 7);
                        return d;
                      });
                      try { soundEngine.playTouchSound(); } catch {}
                    }}
                    className="w-7 h-8 sm:w-8 sm:h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-90 transition cursor-pointer shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    title={language === 'am' ? 'ያለፈው ሳምንት' : 'Previous Week'}
                    aria-label="Previous Week"
                  >
                    <ChevronLeft size={18} strokeWidth={2.4} />
                  </button>

                  {/* 7 Days of the Week */}
                  <div className="flex-1 grid grid-cols-7 gap-1 sm:gap-1.5">
                    {timelineWeekDays.map((day) => (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => setSelectedTimelineDate(day.date)}
                        onDoubleClick={() => {
                          setSelectedTimelineDate(day.date);
                          setStickyNoteDay(day.date);
                        }}
                        className={`py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex flex-col items-center gap-0.5 transition cursor-pointer ${
                          day.isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-[#0082ff] font-bold shadow-2xs border border-blue-200 dark:border-blue-900/60 scale-102'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                        title={language === 'am' ? 'ይጫኑ (ወይም ሁለቴ ይጫኑ ለማስታወሻ)' : 'Click to select date, double-click for Sticky Note'}
                      >
                        <span className="text-[8.5px] sm:text-[9.5px] font-semibold opacity-80 uppercase tracking-normal">
                          {calendarSystem === 'et' ? day.ethDate.dayOfWeekAm : (language === 'am' ? day.dayAm : day.dayShort)}
                          {day.isSunday ? ' 🌿' : ''}
                        </span>
                        <span className={`text-xs sm:text-[13px] font-bold ${day.isSelected ? 'text-[#0082ff]' : 'text-slate-900 dark:text-slate-200'}`}>
                          {day.dayNum}
                          {day.secondaryDayNum !== null && (
                            <span className="text-[8px] font-normal opacity-70 ml-0.5">({day.secondaryDayNum})</span>
                          )}
                        </span>
                        {day.isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0082ff] mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Next Week Navigation Button (>) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTimelineDate((prev) => {
                        const d = new Date(prev);
                        d.setDate(d.getDate() + 7);
                        return d;
                      });
                      try { soundEngine.playTouchSound(); } catch {}
                    }}
                    className="w-7 h-8 sm:w-8 sm:h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-90 transition cursor-pointer shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    title={language === 'am' ? 'ቀጣይ ሳምንት' : 'Next Week'}
                    aria-label="Next Week"
                  >
                    <ChevronRight size={18} strokeWidth={2.4} />
                  </button>
                </div>
              ) : (
                <div className="pt-1">
                  {renderStreamMonthCalendar()}
                </div>
              )}

              {/* Vertical Timeline & Task Cards */}
              <div className="relative pl-6 sm:pl-7 pt-2 space-y-3.5">
                {/* Vertical Timeline Thread */}
                <div className="absolute left-2.5 sm:left-3 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800" />

                {streamTasksForSelectedDay.length > 0 ? (
                  streamTasksForSelectedDay.map((task) => {
                    const isActiveRunning = activeTask?.id === task.id;

                    return (
                      <div key={task.id} className="relative group">
                        {/* Milestone Node on Timeline */}
                        {isSelectedTimelineDatePast ? (
                          <div
                            className={`absolute -left-6 sm:-left-7 top-4 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all z-10 flex items-center justify-center ${
                              task.completed
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-2xs'
                                : 'border-rose-500 bg-rose-500 text-white shadow-2xs'
                            }`}
                            title={task.completed ? 'Completed' : 'Undone'}
                          >
                            {task.completed ? <Check size={10} strokeWidth={3} className="text-white" /> : <X size={10} strokeWidth={3} className="text-white" />}
                          </div>
                        ) : (
                          <div
                            onClick={() => handleToggleStreamTask(task)}
                            className={`absolute -left-6 sm:-left-7 top-4 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all cursor-pointer z-10 flex items-center justify-center ${
                              isActiveRunning
                                ? 'border-[#0082ff] bg-[#0082ff] ring-4 ring-blue-500/20 shadow-xs scale-110'
                                : task.completed
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-blue-400 dark:border-blue-500 bg-white dark:bg-[#121927] hover:border-[#0082ff]'
                            }`}
                            title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                          >
                            {task.completed && <Check size={10} strokeWidth={3} className="text-white" />}
                          </div>
                        )}

                        {/* Task Card with 3 Vertical Dots */}
                        <div
                          className={`p-3.5 sm:p-4 rounded-2xl transition-all relative ${
                            isActiveRunning
                              ? 'bg-gradient-to-r from-[#0082ff] to-blue-600 text-white shadow-md'
                              : 'bg-slate-50 dark:bg-[#161c28] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xs hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                  isActiveRunning
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {formatDisplayTime(task.startTime) || '08:00 AM'}
                                </span>
                                <span className={`text-[10px] font-bold ${isActiveRunning ? 'text-white/80' : 'text-[#0082ff]'}`}>
                                  {formatTaskDuration(task.durationMin || 45)}
                                </span>
                                {isSelectedTimelineDatePast && (
                                  task.completed ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                                      <Check size={10} strokeWidth={3} /> {language === 'am' ? 'ተጠናቋል' : 'Done'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1 shrink-0">
                                      <X size={10} strokeWidth={3} /> {language === 'am' ? 'ያልተጠናቀቀ' : 'Undone'}
                                    </span>
                                  )
                                )}
                              </div>

                              <h4 className={`text-sm sm:text-base font-bold tracking-tight ${
                                task.completed ? 'line-through opacity-60' : ''
                              } ${isActiveRunning ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                {task.title}
                              </h4>

                              {task.notes && (
                                <p className={`text-xs mt-1 ${isActiveRunning ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                  {task.notes}
                                </p>
                              )}
                            </div>

                            {/* 3 Vertical Dots Menu: Edit & Delete (Only on today / future days) */}
                            {!isSelectedTimelineDatePast && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenTaskMenuId(openTaskMenuId === task.id ? null : task.id);
                                  }}
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition cursor-pointer ${
                                    isActiveRunning
                                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                                  }`}
                                  title={language === 'am' ? 'አማራጮች' : 'Options'}
                                >
                                  <MoreVertical size={16} />
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
                                    <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-white dark:bg-[#1a202c] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-1.5 animate-fadeIn space-y-0.5">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenTaskMenuId(null);
                                          handleOpenEditStreamTask(task);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#0082ff] transition cursor-pointer"
                                      >
                                        <Edit3 size={14} className="text-indigo-500" />
                                        <span>{language === 'am' ? 'አስተካክል' : 'Edit'}</span>
                                      </button>
                                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-0.5" />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenTaskMenuId(null);
                                          handleDeleteStreamTask(task.id);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition cursor-pointer"
                                      >
                                        <Trash2 size={14} className="text-rose-500" />
                                        <span>{language === 'am' ? 'ሰርዝ' : 'Delete'}</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl mb-2.5 shadow-2xs">
                      📜
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isSelectedTimelineDatePast
                        ? (language === 'am' ? 'ለዚህ ያለፈ ቀን ምንም የተመዘገበ ተግባር አልነበረም' : 'No tasks were recorded for this past day')
                        : (language === 'am' ? 'ለዚህ ቀን ምንም የታቀደ ተግባር የለም' : 'No tasks scheduled for this day yet')}
                    </h4>
                    {!isSelectedTimelineDatePast && (
                      <>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-3">
                          {language === 'am'
                            ? 'ለዚህ ዘርፍ አዲስ የትኩረት ብሎክ ለመመደብ ከታች ያለውን ይጫኑ።'
                            : `Plan a deliberate focus block or routine for ${category.title}.`}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddStreamTask}
                          className="px-4 py-2 bg-[#0082ff] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus size={14} />
                          <span>{language === 'am' ? 'የመጀመሪያውን ብሎክ አቅድ' : 'Plan First Block'}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Optional Collapsible Sticky Note Card */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowStickyDrawer(!showStickyDrawer)}
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>📌</span>
                  <span>{language === 'am' ? 'ዕለታዊ ማስታወሻና ፈጣን እቅድ' : 'Daily Sticky Note & Quick Notes'}</span>
                </div>
                {showStickyDrawer ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showStickyDrawer && (
                <div className="mt-3 animate-fadeIn">
                  <DailyPlansStickyCard categoryId={category.id} />
                </div>
              )}
            </div>
          </div>

          {/* Secondary 1 Column: Monthly Milestone & Deliverables */}
          <div className="space-y-6">

            {/* MONTHLY DELIVERABLE BOX */}
            <div className="p-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Target size={13} className="text-amber-500" /> Monthly Deliverable
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditGoalTitle(category.monthlyGoalTitle);
                      setEditTargetMetric(category.monthlyTargetMetric);
                      setEditMonthlyTargetHours(category.monthlyTargetHours);
                      setShowEditMonthlyModal(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit with Main Database"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => setShowMonthlyDetail(!showMonthlyDetail)}
                    className="text-[11px] font-bold text-amber-600 hover:underline"
                  >
                    {showMonthlyDetail ? 'Less' : 'Detail'}
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {category.monthlyGoalTitle}
              </h4>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target: {category.monthlyTargetMetric}
              </p>

              {/* Progress: EXACT MATHEMATICALLY */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#0082ff]">
                  <span>Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px] font-normal">
                      {metrics.currentMonthlyHours.toFixed(1)} / {metrics.monthlyTargetHours}h
                    </span>
                    <span>{metrics.monthlyPercentile.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#0082ff] h-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, Math.max(0, metrics.monthlyPercentile))}%` }} 
                  />
                </div>
              </div>

              {/* Expanded Detailed Milestones Breakdown */}
              {showMonthlyDetail && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Milestones In Cycle ({category.achievedItems.length} achieved)
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {category.inProgressItems.map((item, idx) => (
                      <div key={`ip-${idx}`} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                    {category.achievedItems.map((item, idx) => (
                      <div key={`ac-${idx}`} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={12} className="shrink-0" />
                        <span className="truncate line-through opacity-80">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Dedicated Stream Calendar View */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {renderStreamMonthCalendar()}
        </div>
      )}

      {/* Tab 2: In Progress Items */}
      {activeTab === 'inprogress' && (
        <div className="p-6 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>⏳ Active Drills & Ongoing Work for {category.title}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Projects and exercises currently in progress.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              {category.inProgressItems.length} active
            </span>
          </div>

          <div className="space-y-2">
            {category.inProgressItems.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{item}</span>
                </div>
                <button
                  onClick={() => removeItem('inProgress', idx)}
                  className="text-xs text-slate-400 hover:text-rose-500 p-1"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Quick Add In Progress Item */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add new in-progress drill or project item..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-[#0082ff]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem('inProgress');
              }}
            />
            <button
              onClick={() => handleAddItem('inProgress')}
              className="px-4 py-2.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl text-xs font-bold"
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Achieved / Completed Milestones */}
      {activeTab === 'achieved' && (
        <div className="p-6 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🏆 Completed Milestones & Breakthroughs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Verified results achieved in this discipline.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {category.achievedItems.length} achieved
            </span>
          </div>

          <div className="space-y-2">
            {category.achievedItems.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{item}</span>
                </div>
                <button
                  onClick={() => removeItem('achieved', idx)}
                  className="text-xs text-slate-400 hover:text-rose-500 p-1"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Quick Add Achieved Item */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Record a new completed achievement..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem('achieved');
              }}
            />
            <button
              onClick={() => handleAddItem('achieved')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold"
            >
              Record Win
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Upcoming & Soon */}
      {activeTab === 'upcoming' && (
        <div className="p-6 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🚀 {t('upcomingTargets')}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('plannedRoadmap')}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              {category.upcomingItems.length} {language === 'am' ? 'የታቀዱ' : 'planned'}
            </span>
          </div>

          <div className="space-y-2">
            {category.upcomingItems.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{item}</span>
                </div>
                <button
                  onClick={() => removeItem('upcoming', idx)}
                  className="text-xs text-slate-400 hover:text-rose-500 p-1"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Quick Add Upcoming Item */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder={language === 'am' ? 'ቀጣይ የልህቀት ደረጃ ወይም ዒላማ...' : 'Add next roadmap sprint or milestone...'}
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:border-purple-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem('upcoming');
              }}
            />
            <button
              onClick={() => handleAddItem('upcoming')}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold"
            >
              {t('addRoadmapItem')}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add {category.title} Task
              </h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder={`e.g. ${category.title} deliberate practice`}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#0082ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    placeholder="06:00 PM"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(Number(e.target.value))}
                    min={5}
                    max={240}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0082ff] text-white rounded-xl text-xs font-bold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1.5: EDIT DAILY FOCUS & SCHEDULE FOR THIS PILLAR */}
      {showEditDailyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color }}
                >
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {language === 'am' ? `${category.title} - ዕለታዊ የትኩረት እቅድ` : `Daily Focus & Schedule (${category.title})`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'am' ? 'ዕለታዊ ተግባራትን ያክሉና ይቆጣጠሩ' : 'Manage daily focus items and schedule today\'s time block'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEditDailyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            {/* Daily Focus Items List */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {language === 'am' ? 'የዛሬ የትኩረት ተግባራት' : "Today's Focus Items"} ({(category.dailyPlans || []).length})
              </label>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(category.dailyPlans || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    {language === 'am' ? 'ምንም ዕለታዊ ተግባር አልተመዘገበም' : 'No daily focus items added for this pillar yet.'}
                  </p>
                ) : (
                  (category.dailyPlans || []).map((p) => (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategoryDailyPlan(category.id, p.id)}
                        className="flex items-center gap-2 text-left cursor-pointer min-w-0"
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          p.completed 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {p.completed && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className={`text-xs truncate ${p.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
                          {p.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategoryDailyPlan(category.id, p.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Focus item */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newDailyPlanText}
                  onChange={(e) => setNewDailyPlanText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newDailyPlanText.trim()) return;
                      addCategoryDailyPlan(category.id, newDailyPlanText.trim());
                      setNewDailyPlanText('');
                    }
                  }}
                  placeholder={language === 'am' ? `ለ${category.title} ዕለታዊ ተግባር ጻፍና Enter ንካ...` : `+ Add focus item for ${category.title} (press Enter)...`}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newDailyPlanText.trim()) return;
                    addCategoryDailyPlan(category.id, newDailyPlanText.trim());
                    setNewDailyPlanText('');
                  }}
                  className="px-3 py-2 bg-[#0082ff] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Schedule a Today's Time Block */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                {language === 'am' ? 'የዛሬ የጊዜ ሰሌዳ ብሎክ መዝግብ' : 'Schedule Today\'s Tactical Block'}
              </label>

              <input
                type="text"
                value={dailyBlockTitle}
                onChange={(e) => setDailyBlockTitle(e.target.value)}
                placeholder={language === 'am' ? 'የብሎክ ስም (ምሳሌ፡ የክለሳ ልምምድ)' : 'Block title (e.g. Deliberate Practice Session)'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={dailyBlockTime}
                    onChange={(e) => setDailyBlockTime(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={dailyBlockDuration}
                    onChange={(e) => setDailyBlockDuration(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const title = dailyBlockTitle.trim() || `${category.title} Tactical Focus`;
                  addTask({
                    domain: getDomainTypesForCat(category.id)[0],
                    title,
                    startTime: dailyBlockTime,
                    durationMin: Number(dailyBlockDuration),
                    completed: false,
                    color: category.color,
                    badge: category.title.split(' ')[0],
                    priority: 'DEEP_WORK',
                    checklist: [
                      { id: `c-${Date.now()}-1`, text: 'Initial setup & context', done: false },
                      { id: `c-${Date.now()}-2`, text: 'High focus execution', done: false }
                    ]
                  });
                  setDailyBlockTitle('');
                  alert(language === 'am' ? 'የዕለቱ ብሎክ ተመዝግቧል!' : 'Daily block scheduled for today!');
                }}
                className="w-full py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
              >
                {language === 'am' ? '+ የዛሬ ብሎክ ወደ ሰሌዳው አክል' : '+ Add Block to Today\'s Schedule'}
              </button>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditDailyModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                {language === 'am' ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT WEEKLY SCHEDULE (Direct to Main Database) */}
      {showEditWeeklyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Weekly Schedule & Target Hours
                </h3>
                <p className="text-xs text-slate-500">Syncs directly with main database</p>
              </div>
              <button onClick={() => setShowEditWeeklyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveWeeklySchedule} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Weekly Target Hours ({category.title})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="100"
                  required
                  value={editWeeklyHours}
                  onChange={(e) => setEditWeeklyHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                />
              </div>

              {/* Day Selection Options: Mon, Tue, Wed, Thu, Fri, Sat, Sun 🌿 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-bold block">
                    {language === 'am' ? 'የሳምንቱን ቀናት ይምረጡ (Mon, Tue, Wed...)' : 'Choose Weekly Days (Mon, Tue, Wed...)'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedWeeklyDays.length} {language === 'am' ? 'ቀናት ተመርጠዋል' : 'days chosen'}
                  </span>
                </div>

                {/* Day Buttons */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEK_DAYS.map((d) => {
                    const isSelected = selectedWeeklyDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleToggleDay(d.id)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer flex flex-col items-center gap-0.5 border ${
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
                {selectedWeeklyDays.includes('Sun') && (
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
                    <span>🌿</span>
                    <span>{language === 'am' ? 'እሁድ ይፋዊ የእረፍትና የመዝናናት ቀን ነው። ለቀላል መንፈሳዊ ወይም የመዝናኛ ሰዓት ብቻ ይመደባል።' : 'Sunday is officially designated as a Rest & Recovery Day. Scheduled for light restorative reflection.'}</span>
                  </div>
                )}

                {/* Time Slot & Apply Button */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={weeklyDayDefaultTime}
                      onChange={(e) => setWeeklyDayDefaultTime(e.target.value)}
                      placeholder="07:00 AM"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyDaysToSchedule}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    {language === 'am' ? '+ የተመረጡትን ቀናት አክል' : '+ Apply Days to Schedule'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Weekly Routine Cadence Items
                </label>
                <div className="space-y-2 mb-2">
                  {editScheduleSlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={slot}
                        onChange={(e) => {
                          const next = [...editScheduleSlots];
                          next[idx] = e.target.value;
                          setEditScheduleSlots(next);
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...editScheduleSlots];
                          next.splice(idx, 1);
                          setEditScheduleSlots(next);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Slot */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSlotText}
                    onChange={(e) => setNewSlotText(e.target.value)}
                    placeholder="e.g. Fri 05:00 PM: Deep Focus Review"
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSlotText.trim()) return;
                      setEditScheduleSlots([...editScheduleSlots, newSlotText.trim()]);
                      setNewSlotText('');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                  >
                    + Add Slot
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditWeeklyModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0082ff] text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Save size={13} /> Save to Main Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT MONTHLY DELIVERABLE (Direct to Main Database) */}
      {showEditMonthlyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Monthly Deliverable & Verification Metric
                </h3>
                <p className="text-xs text-slate-500">Syncs directly with main database</p>
              </div>
              <button onClick={() => setShowEditMonthlyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveMonthlyDeliverable} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Monthly Goal Deliverable Title
                </label>
                <input
                  type="text"
                  required
                  value={editGoalTitle}
                  onChange={(e) => setEditGoalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Target Verification Metric
                </label>
                <input
                  type="text"
                  required
                  value={editTargetMetric}
                  onChange={(e) => setEditTargetMetric(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Monthly Target Volume (Hours)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="400"
                  required
                  value={editMonthlyTargetHours}
                  onChange={(e) => setEditMonthlyTargetHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditMonthlyModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0082ff] text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Save size={13} /> Save to Main Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stream Task Add / Edit Modal (Daily, Weekly, Monthly) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#121927] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs" style={{ backgroundColor: category.color }}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {editingTask ? (language === 'am' ? 'ብሎክ አስተካክል' : 'Edit Task Block') : (language === 'am' ? 'አዲስ ብሎክ አቅድ' : 'Plan Block')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {category.title} • {taskPlanHorizon.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStreamTask} className="space-y-4">
              
              {/* 1. Cadence Mode: Daily / Weekly / Monthly */}
              {!editingTask && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'am' ? 'የእቅድ አድማስ (Plan Horizon)' : 'Plan Cadence'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setTaskPlanHorizon('daily');
                        soundEngine.playTouchSound();
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        taskPlanHorizon === 'daily'
                          ? 'bg-white dark:bg-[#1a2333] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>☀️</span>
                      <span>{language === 'am' ? 'ዕለታዊ' : 'Daily'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTaskPlanHorizon('weekly');
                        soundEngine.playTouchSound();
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        taskPlanHorizon === 'weekly'
                          ? 'bg-white dark:bg-[#1a2333] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>📅</span>
                      <span>{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTaskPlanHorizon('monthly');
                        soundEngine.playTouchSound();
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        taskPlanHorizon === 'monthly'
                          ? 'bg-white dark:bg-[#1a2333] text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>🗓️</span>
                      <span>{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Weekly or Monthly Day Chooser */}
              {!editingTask && (taskPlanHorizon === 'weekly' || taskPlanHorizon === 'monthly') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>{language === 'am' ? 'ብሎኩ የሚመጣባቸው ቀናት' : 'Choose Routine Days:'}</span>
                    <span className="text-[#0082ff] font-mono">{taskSelectedDays.length} days/week</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { id: 1, en: 'Mon', am: 'ሰኞ' },
                      { id: 2, en: 'Tue', am: 'ማክ' },
                      { id: 3, en: 'Wed', am: 'ረቡ' },
                      { id: 4, en: 'Thu', am: 'ሐሙ' },
                      { id: 5, en: 'Fri', am: 'አር' },
                      { id: 6, en: 'Sat', am: 'ቅዳ' },
                      { id: 7, en: 'Sun 🌿', am: 'እሁ 🌿', isRest: true },
                    ].map((d) => {
                      const isSel = taskSelectedDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleToggleTaskModalDay(d.id)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isSel
                              ? 'bg-[#0082ff] text-white shadow-xs scale-102'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span>{language === 'am' ? d.am : d.en}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 pt-0.5 text-[10px]">
                    <span className="text-slate-400">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setTaskSelectedDays([1, 2, 3, 4, 5])}
                      className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      Mon–Fri
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                      className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      All 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskSelectedDays([6, 7])}
                      className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      Weekend
                    </button>
                  </div>
                </div>
              )}

              {/* Monthly Specific: Set amount of weeks */}
              {!editingTask && taskPlanHorizon === 'monthly' && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    <span>{language === 'am' ? 'የሳምንታት ብዛት ምረጥ' : 'Plan Amount of Weeks:'}</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400">{taskMonthlyWeeks} Weeks</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          setTaskMonthlyWeeks(w);
                          soundEngine.playTouchSound();
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          taskMonthlyWeeks === w
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
                        ? `በ${taskMonthlyWeeks} ሳምንታት ውስጥ ${taskMonthlyWeeks * taskSelectedDays.length} የብሎክ እቅዶች ይመዘገባሉ`
                        : `Schedules ${taskMonthlyWeeks * taskSelectedDays.length} sessions across ${taskMonthlyWeeks} weeks (${taskSelectedDays.length} days/week)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Task Title Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  {language === 'am' ? 'የተግባሩ ስም' : 'Task Title'}
                </label>
                <input
                  type="text"
                  required
                  value={taskModalTitle}
                  onChange={(e) => setTaskModalTitle(e.target.value)}
                  placeholder={language === 'am' ? 'ምሳሌ፡ የቼስ ታክቲክ ስልጠና' : 'e.g., Tactical Calculation Drill'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-[#0082ff]"
                />
              </div>

              {/* Start Time & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ሰዓት' : 'Start Time'}
                  </label>
                  <input
                    type="text"
                    value={taskModalTime}
                    onChange={(e) => setTaskModalTime(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold outline-none focus:border-[#0082ff]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {language === 'am' ? 'ቆይታ' : 'Duration'}
                  </label>
                  <DurationPicker
                    value={taskModalDuration}
                    onChange={setTaskModalDuration}
                    size="md"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  {language === 'am' ? 'ተጨማሪ ማስታወሻ' : 'Notes / Focus Drill Goal'}
                </label>
                <textarea
                  rows={2}
                  value={taskModalNotes}
                  onChange={(e) => setTaskModalNotes(e.target.value)}
                  placeholder={language === 'am' ? 'ለዚህ ብሎክ ዋና ዒላማ...' : 'Key objective or instructions for this session...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-[#0082ff]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  {language === 'am' ? 'ይቅር' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer shadow-xs active:scale-95 transition flex items-center gap-1.5"
                  style={{ backgroundColor: category.color }}
                >
                  <Plus size={14} />
                  <span>
                    {editingTask
                      ? (language === 'am' ? 'አስቀምጥ' : 'Save Changes')
                      : taskPlanHorizon === 'daily'
                      ? (language === 'am' ? 'ቀን አቅድ' : 'Schedule Daily')
                      : taskPlanHorizon === 'weekly'
                      ? (language === 'am' ? 'ሳምንታዊ አቅድ' : `Schedule Weekly (${taskSelectedDays.length} days)`)
                      : (language === 'am' ? 'ወርሃዊ አቅድ' : `Schedule Monthly (${taskMonthlyWeeks * taskSelectedDays.length} blocks)`)}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Overlap Conflict Stoppage Notification Modal */}
      <ScheduleConflictNotificationModal
        conflict={scheduleConflict}
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onApplySuggestedTime={(time) => {
          setTaskModalTime(time);
          setTaskTime(time);
        }}
      />

      {/* Sequential Focus Countdown Runner Popup Modal */}
      {selectedCategoryId && (
        <CategoryFocusSessionModal
          categoryId={selectedCategoryId}
          isOpen={showFocusSessionModal}
          onClose={() => setShowFocusSessionModal(false)}
        />
      )}

      {/* Native iOS Slide-Up Bottom Sheet on Mobile & Paper Sticky Note on Desktop */}
      {stickyNoteDay && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setStickyNoteDay(null)}
        >
          <div 
            className="relative w-full max-w-md bg-[#fef9c3] dark:bg-[#231e0c] border-t-2 sm:border-2 border-[#fef08a] dark:border-amber-700/60 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] sm:shadow-[0_25px_60px_rgba(0,0,0,0.4)] text-amber-950 dark:text-amber-100 animate-slideUp sm:animate-scaleUp transition-transform duration-150 overflow-hidden max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundImage: 'linear-gradient(rgba(217, 119, 6, 0.06) 1px, transparent 1px)',
              backgroundSize: '100% 28px',
              transform: sheetTranslateY > 0 ? `translateY(${sheetTranslateY}px)` : undefined,
            }}
          >
            {/* Mobile Bottom Sheet Grab Handle (Swipe down to dismiss) */}
            <div 
              className="sm:hidden w-12 h-1.5 bg-amber-900/25 dark:bg-amber-100/25 rounded-full mx-auto -mt-1 mb-3.5 cursor-grab active:cursor-grabbing shrink-0 touch-none"
              onTouchStart={(e) => {
                sheetDragStartY.current = e.touches[0].clientY;
              }}
              onTouchMove={(e) => {
                if (sheetDragStartY.current !== null) {
                  const dy = e.touches[0].clientY - sheetDragStartY.current;
                  if (dy > 0) setSheetTranslateY(dy);
                }
              }}
              onTouchEnd={() => {
                if (sheetTranslateY > 60) {
                  setStickyNoteDay(null);
                }
                setSheetTranslateY(0);
                sheetDragStartY.current = null;
              }}
            />

            {/* Desktop Top Tape Graphic */}
            <div className="hidden sm:block w-28 h-5 mx-auto -mt-8 mb-3 bg-amber-100/90 dark:bg-amber-800/60 border border-amber-300/80 dark:border-amber-700/80 rounded-sm shadow-xs backdrop-blur-xs shrink-0" />

            {/* Header: Date + Stream Badge + Close Button */}
            <div className="flex items-start justify-between gap-3 border-b border-amber-300/60 dark:border-amber-800/60 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: category.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {getCategoryTitleTranslated(category.id, category.title)}
                    </span>
                    {isStickyDayPast ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 flex items-center gap-1">
                        📜 {language === 'am' ? 'ያለፈ ቀን መዝገብ' : 'Past Day Log'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800/80 dark:text-amber-300/80 flex items-center gap-0.5">
                        <span>📌</span> Sticky Note
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5 truncate text-amber-950 dark:text-white">
                    {stickyNoteDay.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-[11px] font-semibold text-amber-800/70 dark:text-amber-300/70">
                    {(() => {
                      const eth = gregorianToEthiopian(stickyNoteDay);
                      return `${eth.dayOfWeekAm}፣ ${eth.monthNameAm} ${eth.day} ቀን ${eth.year} ዓ.ም.`;
                    })()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStickyNoteDay(null)}
                className="w-8 h-8 rounded-full bg-amber-200/60 hover:bg-amber-300/80 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Close Sticky Note"
              >
                <X size={16} />
              </button>
            </div>

            {/* Task List on This Specific Day */}
            <div className="my-4 space-y-2.5 max-h-60 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800/80 dark:text-amber-300/80 px-1">
                <span>{language === 'am' ? (isStickyDayPast ? 'የተመዘገቡ ተግባራት' : 'የዕለቱ ተግባራት') : (isStickyDayPast ? 'LOGGED TASKS FOR THIS DAY' : 'TASKS FOR THIS DAY')}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-[10px] font-mono">
                  {getTasksForStreamDate(stickyNoteDay).filter(t => t.completed).length} / {getTasksForStreamDate(stickyNoteDay).length} {language === 'am' ? 'ተጠናቋል' : 'done'}
                </span>
              </div>

              {getTasksForStreamDate(stickyNoteDay).length > 0 ? (
                getTasksForStreamDate(stickyNoteDay).map((t) => (
                  <div 
                    key={t.id}
                    className="p-3 rounded-2xl bg-white/85 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start justify-between gap-2.5 shadow-2xs hover:shadow-xs transition"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {!isStickyDayPast && (
                        isStickyDayToday ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStickyTask(t, stickyNoteDay)}
                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center mt-0.5 transition cursor-pointer shrink-0 ${
                              t.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-amber-400 dark:border-amber-600 bg-white/90 dark:bg-amber-900/40 hover:border-amber-600'
                            }`}
                            title={t.completed ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {t.completed && <Check size={12} strokeWidth={3} />}
                          </button>
                        ) : (
                          <div 
                            className="w-5 h-5 rounded-lg border-2 border-dashed border-amber-400/80 dark:border-amber-600/80 flex items-center justify-center mt-0.5 cursor-pointer hover:border-amber-600 transition shrink-0"
                            title={language === 'am' ? 'የታቀደ ተግባር (ዛሬ ሲደርስ ብቻ ማጠናቀቅ ይቻላል)' : 'Planned task (can only be marked done on today)'}
                            onClick={() => handleToggleStickyTask(t, stickyNoteDay)}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600/60 dark:bg-amber-400/60" />
                          </div>
                        )
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                            🕒 {t.startTime || '08:00 AM'}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            ⏱️ {formatTaskDuration(t.durationMin || 45)}
                          </span>
                        </div>

                        {/* Very simple text only message under time and minute */}
                        {stickyTaskDayAlerts[t.id] && (
                          <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 mt-1 animate-fadeIn leading-snug">
                            {stickyTaskDayAlerts[t.id]}
                          </p>
                        )}

                        <h4 className={`text-xs sm:text-sm font-bold tracking-tight mt-1 text-slate-900 dark:text-white ${
                          t.completed ? 'line-through opacity-60 text-slate-500' : ''
                        }`}>
                          {t.title}
                        </h4>

                        {t.notes && (
                          <p className="text-[11px] text-amber-800/70 dark:text-amber-300/70 mt-0.5 line-clamp-2">
                            {t.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Play & Action: Only on Today / Future days */}
                    {!isStickyDayPast && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartStickyTaskFocus(t)}
                          className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 transition cursor-pointer"
                          title="Run Focus Timer"
                        >
                          <Play size={12} fill="currentColor" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center bg-amber-100/40 dark:bg-amber-950/20 rounded-2xl border border-dashed border-amber-300/80 dark:border-amber-800/60 p-4">
                  <span className="text-2xl block mb-1">{isStickyDayPast ? '📜' : '📝'}</span>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {isStickyDayPast 
                      ? (language === 'am' ? 'ለዚህ ያለፈ ቀን ምንም የተመዘገበ ተግባር አልነበረም' : 'No tasks were recorded for this past day')
                      : (language === 'am' ? 'ለዚህ ቀን ምንም የታቀደ ተግባር የለም' : 'No tasks scheduled for this day yet')}
                  </p>
                  {!isStickyDayPast && (
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mt-0.5">
                      {language === 'am' ? 'ከታች አዲስ ተግባር በፈጣን ይጻፉ' : 'Quickly jot down a task for this day below:'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Add Task Input on the Sticky Note (LOCKED FOR PAST DAYS) */}
            {isStickyDayPast ? (
              <div className="pt-2 border-t border-amber-300/60 dark:border-amber-800/60">
                <div className="p-3 rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center justify-center gap-1.5">
                    <span>🔒</span>
                    <span>{language === 'am' ? 'ያለፈ ቀን ታሪክ - ባለፉ ቀናት ላይ አዲስ ተግባር ማቀድ አይቻልም' : 'Past Day Record: Planning or scheduling tasks is locked'}</span>
                  </p>
                  <p className="text-[11px] text-amber-800/70 dark:text-amber-300/70">
                    {language === 'am' ? 'ይህ ክፍል የታለፉ ዕለታት አፈጻጸም መመልከቻ ብቻ ነው።' : 'Strictly shows historical records of completed or undone tasks.'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddStickyQuickTask} className="pt-2 border-t border-amber-300/60 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={stickyQuickTitle}
                    onChange={(e) => setStickyQuickTitle(e.target.value)}
                    placeholder={language === 'am' ? '+ አዲስ ተግባር ለዚህ ቀን...' : '+ Add task for this day...'}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white/90 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/80 text-amber-950 dark:text-white placeholder:text-amber-800/50 dark:placeholder:text-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!stickyQuickTitle.trim()}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>{language === 'am' ? 'መዝግብ' : 'Add'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-amber-800/80 dark:text-amber-300/80 px-1 gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span>🕒</span>
                    <input
                      type="text"
                      value={stickyQuickTime}
                      onChange={(e) => setStickyQuickTime(e.target.value)}
                      placeholder="08:00 AM"
                      className="w-20 px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-white/80 dark:bg-amber-950/60 border border-amber-300/70 dark:border-amber-700/70 text-amber-950 dark:text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      title={language === 'am' ? 'ብጁ ሰዓት ያስገቡ' : 'Custom start time (e.g. 08:00 AM, 02:30 PM)'}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span>⏱️</span>
                    {[25, 45, 60].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setStickyQuickDuration(d);
                          setStickyQuickIsCustom(false);
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          !stickyQuickIsCustom && stickyQuickDuration === d
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 hover:bg-amber-300/80'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}

                    {stickyQuickIsCustom ? (
                      <div className="flex items-center gap-0.5 bg-white/95 dark:bg-amber-950/90 px-1.5 py-0.5 rounded-md border border-amber-400 dark:border-amber-600 shadow-2xs">
                        <input
                          type="number"
                          min={5}
                          max={480}
                          value={stickyQuickDuration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) setStickyQuickDuration(Math.min(val, 720));
                          }}
                          className="w-10 text-[10px] font-mono font-bold text-center bg-transparent text-amber-950 dark:text-white outline-none"
                          placeholder="min"
                          autoFocus
                        />
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">m</span>
                        <button
                          type="button"
                          onClick={() => setStickyQuickIsCustom(false)}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-800 dark:text-amber-300 ml-0.5 px-0.5 cursor-pointer"
                          title="Done"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setStickyQuickIsCustom(true)}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          stickyQuickIsCustom || ![25, 45, 60].includes(stickyQuickDuration)
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 hover:bg-amber-300/80'
                        }`}
                        title={language === 'am' ? 'ብጁ ደቂቃ ያስገቡ' : 'Add custom duration minutes'}
                      >
                        {![25, 45, 60].includes(stickyQuickDuration)
                          ? `${stickyQuickDuration}m`
                          : (language === 'am' ? '+ ብጁ' : '+ Custom')}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* Footer Toolbar: Plan Full Block & Close */}
            <div className="mt-3 pt-3 border-t border-amber-300/60 dark:border-amber-800/60 flex items-center justify-between gap-2">
              {!isStickyDayPast ? (
                <button
                  type="button"
                  onClick={() => {
                    const day = stickyNoteDay;
                    setStickyNoteDay(null);
                    setSelectedTimelineDate(day);
                    handleOpenAddStreamTask();
                  }}
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 dark:text-amber-200 dark:hover:text-white flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>{language === 'am' ? 'ሙሉ ብሎክ አቅድ' : 'Plan Full Routine Block'}</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-300/80 flex items-center gap-1">
                  <span>📜</span>
                  <span>{language === 'am' ? 'የታሪክ ዕይታ ብቻ' : 'Read-only Past Record'}</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setStickyNoteDay(null)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 text-xs font-bold transition cursor-pointer"
              >
                {language === 'am' ? 'ጨርስ' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
