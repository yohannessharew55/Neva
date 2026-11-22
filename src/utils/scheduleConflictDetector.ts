import { ScheduleTask, DomainType } from '../types';
import { CategoryPlan } from '../context/LivotionContext';

export interface FreeTimeSlot {
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  label: string;
  fitsProposedDuration?: boolean;
  candidateStarts?: string[];
}

export interface ScheduleConflictResult {
  hasConflict: boolean;
  conflictingTask?: ScheduleTask;
  occupiedWindow?: { start: string; end: string };
  proposedWindow: { start: string; end: string };
  pillar: 'career' | 'hobby' | 'living';
  pillarTitle: string;
  pillarRemainingHours: number;
  pillarAllocatedHours: number;
  pillarTotalTarget: number;
  sleepDedicatedHours: number;
  isSleepProtected: boolean;
  suggestedOpening?: {
    startTime: string;
    availableMinutes: number;
  };
  availableFreeSlots: FreeTimeSlot[];
  conflictMessage: string;
}

export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr || timeStr.toLowerCase().includes('flex')) return -1;
  const match = timeStr.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return -1;
  let [_, hStr, mStr, meridiem] = match;
  let hours = parseInt(hStr, 10);
  const minutes = mStr ? parseInt(mStr, 10) : 0;
  if (meridiem) {
    if (meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

export const formatMinutesToTime = (totalMinutes: number, format: '12h' | '24h' = '12h'): string => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  if (format === '24h') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  const isPM = hours >= 12;
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
};

export const formatDisplayTime = (timeStr?: string, format: '12h' | '24h' = '12h'): string => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('flex')) return timeStr;
  const minutes = parseTimeToMinutes(timeStr);
  if (minutes < 0) return timeStr;
  return formatMinutesToTime(minutes, format);
};

/**
 * Automatically detects and resolves overlapping start times for tasks scheduled on the same date/day.
 * Groups tasks, sorts chronologically, and cleanly sequences overlapping tasks so subsequent tasks begin
 * right after the preceding task ends.
 */
export const autoResolveOverlappingTasks = (taskList: ScheduleTask[], timeFormat: '12h' | '24h' = '12h'): ScheduleTask[] => {
  if (!taskList || taskList.length <= 1) return taskList;

  // Group tasks by their specific date or day-of-week identifier or a default active bucket
  const dateGroups: Record<string, ScheduleTask[]> = {};

  taskList.forEach((t) => {
    const key = t.date || (t.dayOfWeek ? `dow-${t.dayOfWeek}` : 'active-schedule');
    if (!dateGroups[key]) dateGroups[key] = [];
    dateGroups[key].push({ ...t });
  });

  const resolvedTasks: ScheduleTask[] = [];

  Object.values(dateGroups).forEach((group) => {
    const timedTasks: ScheduleTask[] = [];
    const flexibleTasks: ScheduleTask[] = [];

    group.forEach((task) => {
      if (!task.startTime || task.startTime.toLowerCase().includes('flex') || parseTimeToMinutes(task.startTime) < 0) {
        flexibleTasks.push(task);
      } else {
        timedTasks.push(task);
      }
    });

    // Sort timed tasks by chronological start minutes
    timedTasks.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    let occupiedUntilMin = 0;

    timedTasks.forEach((task) => {
      const startMin = parseTimeToMinutes(task.startTime);
      const duration = task.durationMin && task.durationMin > 0 ? task.durationMin : 45;

      if (startMin < occupiedUntilMin) {
        // Shift this task to begin cleanly when the previous one ends
        task.startTime = formatMinutesToTime(occupiedUntilMin, timeFormat);
        occupiedUntilMin = occupiedUntilMin + duration;
      } else {
        occupiedUntilMin = startMin + duration;
      }

      resolvedTasks.push(task);
    });

    flexibleTasks.forEach((task) => resolvedTasks.push(task));
  });

  return resolvedTasks;
};

export const getPillarForCategory = (categoryId?: string, domain?: DomainType, title?: string): 'career' | 'hobby' | 'living' => {
  const text = `${categoryId || ''} ${title || ''}`.toLowerCase();
  if (
    ['architecture', 'trading', 'career', 'work', 'forex', 'study'].some(k => text.includes(k)) ||
    domain === 'ARCHITECTURE_DESIGN' ||
    domain === 'SITE_SUPERVISION' ||
    domain === 'FOREX_TRADING'
  ) {
    return 'career';
  }
  if (
    ['chess', 'music', 'art', 'guitar', 'painting', 'tactic', 'drill', 'hobby', 'creative'].some(k => text.includes(k)) ||
    domain === 'CHESS' ||
    domain === 'GUITAR' ||
    domain === 'OIL_PAINTING'
  ) {
    return 'hobby';
  }
  return 'living';
};

/**
 * Computes all available free time windows for a given day across waking hours (07:00 to 23:00)
 * minus all scheduled task windows. Returns formatted slots with candidate start times.
 */
export const getAvailableFreeSlots = (options: {
  existingTasks: ScheduleTask[];
  dateStr?: string;
  dayOfWeek?: number;
  excludeTaskId?: string;
  proposedDurationMin?: number;
  timeFormat?: '12h' | '24h';
  isAlreadyScopedToDay?: boolean;
  wakeMinutes?: number;  // default 7 * 60 = 420 (07:00 AM)
  sleepMinutes?: number; // default 23 * 60 = 1380 (11:00 PM)
}): FreeTimeSlot[] => {
  const {
    existingTasks,
    dateStr,
    dayOfWeek,
    excludeTaskId,
    proposedDurationMin = 30,
    timeFormat = '12h',
    isAlreadyScopedToDay = false,
    wakeMinutes = 7 * 60,   // 07:00 AM
    sleepMinutes = 23 * 60, // 11:00 PM
  } = options;

  const targetDayOfWeek = dayOfWeek ?? (() => {
    if (!dateStr) return undefined;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return (d.getDay() + 6) % 7 + 1;
      }
    } catch {}
    return undefined;
  })();

  // Filter tasks belonging to this day
  const dayTasks = existingTasks.filter((t) => {
    if (excludeTaskId && t.id === excludeTaskId) return false;
    if (isAlreadyScopedToDay) return true;
    if (dateStr && t.date === dateStr) return true;
    if (targetDayOfWeek && t.dayOfWeek === targetDayOfWeek) return true;
    if (!t.date && !t.dayOfWeek) return true;
    return false;
  });

  // Collect busy intervals
  const rawIntervals: Array<{ start: number; end: number }> = [];
  dayTasks.forEach((t) => {
    const sMin = parseTimeToMinutes(t.startTime);
    if (sMin >= 0) {
      const dMin = Math.max(1, t.durationMin || 30);
      rawIntervals.push({ start: sMin, end: sMin + dMin });
    }
  });

  // Sort raw intervals by start time
  rawIntervals.sort((a, b) => a.start - b.start);

  // Merge overlapping or adjacent busy intervals
  const mergedBusy: Array<{ start: number; end: number }> = [];
  rawIntervals.forEach((interval) => {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ ...interval });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        mergedBusy.push({ ...interval });
      }
    }
  });

  // Day boundaries: waking window 07:00 AM to 11:00 PM (or extended if tasks exist earlier/later)
  let windowStart = wakeMinutes;
  let windowEnd = sleepMinutes;

  if (mergedBusy.length > 0) {
    if (mergedBusy[0].start < windowStart) windowStart = Math.max(0, mergedBusy[0].start);
    if (mergedBusy[mergedBusy.length - 1].end > windowEnd) windowEnd = Math.min(1440, mergedBusy[mergedBusy.length - 1].end);
  }

  // Calculate free gaps
  const freeGaps: Array<{ start: number; end: number }> = [];
  let currentPointer = windowStart;

  mergedBusy.forEach((busy) => {
    if (busy.end <= windowStart) return;
    const effectiveBusyStart = Math.max(busy.start, windowStart);
    if (effectiveBusyStart > currentPointer) {
      freeGaps.push({ start: currentPointer, end: effectiveBusyStart });
    }
    currentPointer = Math.max(currentPointer, busy.end);
  });

  if (currentPointer < windowEnd) {
    freeGaps.push({ start: currentPointer, end: windowEnd });
  }

  // Transform gaps to FreeTimeSlot objects
  const freeSlots: FreeTimeSlot[] = [];

  freeGaps.forEach((gap) => {
    const duration = gap.end - gap.start;
    if (duration >= 15) { // Minimum 15-minute gap
      const fitsProposed = duration >= proposedDurationMin;
      const startStr = formatMinutesToTime(gap.start, timeFormat);
      const endStr = formatMinutesToTime(gap.end, timeFormat);
      
      // Calculate candidate start points inside long gaps (e.g. 30m steps)
      const candidateStarts: string[] = [startStr];
      if (duration >= proposedDurationMin * 2) {
        for (let t = gap.start + 30; t + proposedDurationMin <= gap.end; t += 30) {
          candidateStarts.push(formatMinutesToTime(t, timeFormat));
          if (candidateStarts.length >= 4) break;
        }
      }

      freeSlots.push({
        start: startStr,
        end: endStr,
        startMinutes: gap.start,
        endMinutes: gap.end,
        durationMinutes: duration,
        label: `${startStr} – ${endStr}`,
        fitsProposedDuration: fitsProposed,
        candidateStarts,
      });
    }
  });

  return freeSlots;
};

export const checkScheduleConflict = (options: {
  proposedTask: {
    id?: string;
    title: string;
    startTime: string;
    durationMin: number;
    categoryId?: string;
    domain?: DomainType;
    badge?: string;
  };
  dateStr: string;
  dayOfWeek?: number;
  existingTasks: ScheduleTask[];
  categoryPlans?: Record<string, CategoryPlan>;
  isAlreadyScopedToDay?: boolean;
  timeFormat?: '12h' | '24h';
}): ScheduleConflictResult => {
  const {
    proposedTask,
    dateStr,
    dayOfWeek,
    existingTasks,
    isAlreadyScopedToDay = false,
    timeFormat = '12h',
  } = options;

  const pillar = getPillarForCategory(proposedTask.categoryId || proposedTask.badge, proposedTask.domain, proposedTask.title);
  const pillarTitle = pillar === 'career' ? 'Career' : pillar === 'hobby' ? 'Hobby' : 'Living';

  const proposedStartMin = parseTimeToMinutes(proposedTask.startTime);
  const proposedDuration = Math.max(1, proposedTask.durationMin || 30);

  // Compute all available free time slots for this day
  const availableFreeSlots = getAvailableFreeSlots({
    existingTasks,
    dateStr,
    dayOfWeek,
    excludeTaskId: proposedTask.id,
    proposedDurationMin: proposedDuration,
    timeFormat,
    isAlreadyScopedToDay,
  });

  const bestSlot = availableFreeSlots.find(s => s.fitsProposedDuration) || availableFreeSlots[0];
  const suggestedOpening = bestSlot ? {
    startTime: bestSlot.start,
    availableMinutes: bestSlot.durationMinutes,
  } : undefined;

  if (proposedStartMin < 0) {
    return {
      hasConflict: false,
      proposedWindow: { start: 'Flexible', end: 'Flexible' },
      pillar,
      pillarTitle,
      pillarRemainingHours: 8.0,
      pillarAllocatedHours: 0,
      pillarTotalTarget: 8.0,
      sleepDedicatedHours: 8.0,
      isSleepProtected: true,
      suggestedOpening,
      availableFreeSlots,
      conflictMessage: '',
    };
  }

  const proposedEndMin = proposedStartMin + proposedDuration;
  const proposedWindow = {
    start: formatMinutesToTime(proposedStartMin, timeFormat),
    end: formatMinutesToTime(proposedEndMin, timeFormat),
  };

  const targetDayOfWeek = dayOfWeek ?? (() => {
    if (!dateStr) return undefined;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return (d.getDay() + 6) % 7 + 1;
      }
    } catch {}
    return undefined;
  })();

  // 1. Filter existing tasks for the same scheduled date or weekday
  const sameDayTasks = existingTasks.filter((t) => {
    if (proposedTask.id && t.id === proposedTask.id) return false;
    if (isAlreadyScopedToDay) return true;
    if (t.date && t.date === dateStr) return true;
    if (targetDayOfWeek && t.dayOfWeek === targetDayOfWeek) return true;
    if (!t.date && !t.dayOfWeek) return true;
    return false;
  });

  // Calculate pillar allocations today
  let pillarAllocatedMinutes = 0;
  sameDayTasks.forEach((t) => {
    const tPillar = getPillarForCategory(t.badge?.toLowerCase(), t.domain, t.title);
    if (tPillar === pillar) {
      pillarAllocatedMinutes += t.durationMin || 0;
    }
  });
  const pillarAllocatedHours = Number((pillarAllocatedMinutes / 60).toFixed(1));
  const pillarRemainingHours = Math.max(0, Number((8.0 - pillarAllocatedHours).toFixed(1)));

  // 2. Sort tasks chronologically to test collisions and find gaps
  const sortedTasks = sameDayTasks
    .map((t) => ({
      task: t,
      startMin: parseTimeToMinutes(t.startTime),
      endMin: parseTimeToMinutes(t.startTime) + Math.max(1, t.durationMin || 30),
    }))
    .filter((st) => st.startMin >= 0)
    .sort((a, b) => a.startMin - b.startMin);

  // 3. Check for direct collision with another scheduled task
  let conflictingTask: ScheduleTask | undefined;
  let occupiedWindow: { start: string; end: string } | undefined;

  for (const st of sortedTasks) {
    if (proposedStartMin < st.endMin && proposedEndMin > st.startMin) {
      conflictingTask = st.task;
      occupiedWindow = {
        start: formatMinutesToTime(st.startMin, timeFormat),
        end: formatMinutesToTime(st.endMin, timeFormat),
      };
      break;
    }
  }

  // 4. Dedicated sleep protection:
  const isSleepProtected = true;

  if (conflictingTask && occupiedWindow) {
    const conflictMessage = `The time slot ${proposedWindow.start} – ${proposedWindow.end} is already occupied by "${conflictingTask.title}" (${occupiedWindow.start} – ${occupiedWindow.end}). This block was not saved to prevent overlapping.`;

    return {
      hasConflict: true,
      conflictingTask,
      occupiedWindow,
      proposedWindow,
      pillar,
      pillarTitle,
      pillarRemainingHours,
      pillarAllocatedHours,
      pillarTotalTarget: 8.0,
      sleepDedicatedHours: 8.0,
      isSleepProtected,
      suggestedOpening,
      availableFreeSlots,
      conflictMessage,
    };
  }

  return {
    hasConflict: false,
    proposedWindow,
    pillar,
    pillarTitle,
    pillarRemainingHours,
    pillarAllocatedHours,
    pillarTotalTarget: 8.0,
    sleepDedicatedHours: 8.0,
    isSleepProtected,
    suggestedOpening,
    availableFreeSlots,
    conflictMessage: '',
  };
};
