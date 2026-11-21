import { ScheduleTask, DomainType } from '../types';
import { CategoryPlan } from '../context/LivotionContext';

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

export const formatMinutesToTime = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const isPM = hours >= 12;
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
};

/**
 * Automatically detects and resolves overlapping start times for tasks scheduled on the same date/day.
 * If two tasks have the same start time or overlap (e.g. Pushup at 08:00 AM 45m and Pullup at 08:00 AM 45m),
 * the subsequent task is automatically sequenced to begin right after the preceding task completes (08:45 AM).
 */
export const autoResolveOverlappingTasks = (taskList: ScheduleTask[]): ScheduleTask[] => {
  if (!taskList || taskList.length <= 1) return taskList;

  // Group tasks by their specific date or day-of-week identifier
  const dateGroups: Record<string, ScheduleTask[]> = {};
  const ungroupedTasks: ScheduleTask[] = [];

  taskList.forEach((t) => {
    const key = t.date || (t.dayOfWeek ? `dow-${t.dayOfWeek}` : null);
    if (key) {
      if (!dateGroups[key]) dateGroups[key] = [];
      dateGroups[key].push({ ...t });
    } else {
      ungroupedTasks.push({ ...t });
    }
  });

  const resolvedTasks: ScheduleTask[] = [];

  Object.values(dateGroups).forEach((group) => {
    let occupiedUntilMin = 0;

    group.forEach((task) => {
      // Ignore tasks without valid start times or marked as Flexible
      if (!task.startTime || task.startTime.toLowerCase().includes('flex')) {
        resolvedTasks.push(task);
        return;
      }

      const startMin = parseTimeToMinutes(task.startTime);
      if (startMin < 0) {
        resolvedTasks.push(task);
        return;
      }

      const duration = task.durationMin && task.durationMin > 0 ? task.durationMin : 45;

      // If this task starts before the previous task finishes on the exact same day:
      if (startMin < occupiedUntilMin) {
        // Shift this task to begin cleanly when the previous one ends!
        const newStartTime = formatMinutesToTime(occupiedUntilMin);
        task.startTime = newStartTime;
        occupiedUntilMin = occupiedUntilMin + duration;
      } else {
        occupiedUntilMin = startMin + duration;
      }

      resolvedTasks.push(task);
    });
  });

  return [...resolvedTasks, ...ungroupedTasks];
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
}): ScheduleConflictResult => {
  const { proposedTask, dateStr, dayOfWeek, existingTasks, categoryPlans = {} } = options;

  const pillar = getPillarForCategory(proposedTask.categoryId || proposedTask.badge, proposedTask.domain, proposedTask.title);
  const pillarTitle = pillar === 'career' ? 'Career' : pillar === 'hobby' ? 'Hobby' : 'Living';

  const proposedStartMin = parseTimeToMinutes(proposedTask.startTime);
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
      conflictMessage: '',
    };
  }

  const proposedDuration = Math.max(1, proposedTask.durationMin || 30);
  const proposedEndMin = proposedStartMin + proposedDuration;
  const proposedWindow = {
    start: formatMinutesToTime(proposedStartMin),
    end: formatMinutesToTime(proposedEndMin),
  };

  // 1. Filter existing tasks for the same scheduled date or weekday
  const sameDayTasks = existingTasks.filter((t) => {
    if (proposedTask.id && t.id === proposedTask.id) return false;
    if (t.date && t.date === dateStr) return true;
    if (dayOfWeek && t.dayOfWeek === dayOfWeek) return true;
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
        start: formatMinutesToTime(st.startMin),
        end: formatMinutesToTime(st.endMin),
      };
      break;
    }
  }

  // 4. Dedicated sleep protection:
  // In Triple 8, 8 hours are dedicated to Sleep and strictly guarded
  const isSleepProtected = true;

  if (conflictingTask && occupiedWindow) {
    // Find next available free opening that fits the proposed duration
    const neededMin = Math.max(15, proposedTask.durationMin || 30);
    let foundSlot: { start: number; free: number } | null = null;

    // First try immediately after conflicting task
    const candidateAfterConflict = parseTimeToMinutes(occupiedWindow.end);
    const hasOverlapAfter = sortedTasks.some(
      (st) => candidateAfterConflict < st.endMin && candidateAfterConflict + neededMin > st.startMin
    );

    if (!hasOverlapAfter && candidateAfterConflict + neededMin <= 1440) {
      const nextTask = sortedTasks.find((st) => st.startMin >= candidateAfterConflict);
      const limit = nextTask ? nextTask.startMin : 1440;
      foundSlot = { start: candidateAfterConflict, free: limit - candidateAfterConflict };
    } else {
      // Scan for open slot in 15-minute increments
      for (let t = 0; t <= 1440 - neededMin; t += 15) {
        const collides = sortedTasks.some(
          (st) => t < st.endMin && t + neededMin > st.startMin
        );
        if (!collides) {
          const nextTask = sortedTasks.find((st) => st.startMin >= t);
          const limit = nextTask ? nextTask.startMin : 1440;
          foundSlot = { start: t, free: limit - t };
          break;
        }
      }
    }

    const finalStart = foundSlot ? foundSlot.start : candidateAfterConflict;
    const finalFree = foundSlot ? foundSlot.free : 60;

    const suggestedOpening = {
      startTime: formatMinutesToTime(finalStart),
      availableMinutes: finalFree,
    };

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
      isSleepProtected: true,
      suggestedOpening,
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
    isSleepProtected: true,
    conflictMessage: '',
  };
};
