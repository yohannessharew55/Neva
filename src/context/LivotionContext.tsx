import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  UserProfile, 
  SkillDomain, 
  ScheduleTask, 
  WorkoutProtocol, 
  MealPlan, 
  StrategicGoal, 
  PracticeSession, 
  FeedbackReview,
  DomainType,
  DailyStickyReviewNote,
  StickyNoteThemeColor,
  AccentColor,
  CalendarSystem,
  DailyStickyTaskItem,
  IosNoteItem
} from '../types';
import { 
  initialUser, 
  initialDomains, 
  initialTasks, 
  initialWorkouts, 
  initialMeals, 
  initialGoals, 
  initialSessions, 
  initialReviews,
  initialDailyStickyNotes
} from '../data/seedData';
import { autoResolveOverlappingTasks } from '../utils/scheduleConflictDetector';
import { soundEngine } from '../utils/audio';
import { mobileTimerEngine } from '../utils/mobileTimerEngine';
import { timerNotificationService } from '../utils/timerNotificationService';
import { taskAlarmService } from '../utils/taskAlarmNotificationService';
import { 
  syncStateToCloud, 
  fetchStateFromCloud, 
  UserAccountProfile, 
  getStoredUserAccount, 
  saveAccountToStorage, 
  clearStoredUserAccount,
  hasPendingSync,
  clearPendingSync,
  markPendingSync,
  isDeviceOffline
} from '../utils/cloudSync';
import { 
  Language, 
  Translations, 
  getTranslation, 
  getTranslatedCategoryTitle 
} from '../utils/translations';

export interface CategoryLiveMetrics {
  currentWeeklyHours: number;
  weeklyTargetHours: number;
  weeklyPercentile: number;
  currentMonthlyHours: number;
  monthlyTargetHours: number;
  monthlyPercentile: number;
  todayCompletedHours: number;
  todayCompletedTasks: number;
  todayTotalTasks: number;
  todayTaskPercentile: number;
  activeElapsedHours: number;
  milestonePercentile: number;
}

export type StickyNoteColor = 'yellow' | 'mint' | 'cyan' | 'peach' | 'rose' | 'lavender' | 'darkgrey' | 'charcoal' | 'graphite';

export interface CategoryDailyPlanItem {
  id: string;
  text: string;
  completed: boolean;
  timeSlot?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface CategoryPlan {
  id: string;
  title: string;
  color: string;
  weeklyTargetHours: number;
  currentWeeklyHours: number;
  baseWeeklyHours?: number;
  baseMonthlyHours?: number;
  weeklyScheduleSummary: string[];
  monthlyGoalTitle: string;
  monthlyTargetMetric: string;
  monthlyProgress: number;
  monthlyTargetHours: number;
  inProgressItems: string[];
  achievedItems: string[];
  upcomingItems: string[];
  isCustom?: boolean;
  dailyPlans?: CategoryDailyPlanItem[];
  stickyNoteColor?: StickyNoteColor;
  triple8Type?: 'career' | 'hobby' | 'living';
}

export const INITIAL_CATEGORY_PLANS: Record<string, CategoryPlan> = {
  exercise: {
    id: 'exercise',
    title: 'Exercise & Fitness',
    color: '#ef4444',
    weeklyTargetHours: 5.0,
    currentWeeklyHours: 0,
    baseWeeklyHours: 0,
    baseMonthlyHours: 0,
    weeklyScheduleSummary: [],
    monthlyGoalTitle: '',
    monthlyTargetMetric: '',
    monthlyProgress: 0,
    monthlyTargetHours: 20.0,
    inProgressItems: [],
    achievedItems: [],
    upcomingItems: [],
    stickyNoteColor: 'peach',
    dailyPlans: [],
    triple8Type: 'living'
  },
  chess: {
    id: 'chess',
    title: 'Chess',
    color: '#8b5cf6',
    weeklyTargetHours: 5.0,
    currentWeeklyHours: 0,
    baseWeeklyHours: 0,
    baseMonthlyHours: 0,
    weeklyScheduleSummary: [],
    monthlyGoalTitle: '',
    monthlyTargetMetric: '',
    monthlyProgress: 0,
    monthlyTargetHours: 20.0,
    inProgressItems: [],
    achievedItems: [],
    upcomingItems: [],
    stickyNoteColor: 'yellow',
    dailyPlans: [],
    triple8Type: 'hobby'
  },
  art: {
    id: 'art',
    title: 'Art & Painting',
    color: '#e11d48',
    weeklyTargetHours: 5.0,
    currentWeeklyHours: 0,
    baseWeeklyHours: 0,
    baseMonthlyHours: 0,
    weeklyScheduleSummary: [],
    monthlyGoalTitle: '',
    monthlyTargetMetric: '',
    monthlyProgress: 0,
    monthlyTargetHours: 20.0,
    inProgressItems: [],
    achievedItems: [],
    upcomingItems: [],
    stickyNoteColor: 'peach',
    dailyPlans: [],
    triple8Type: 'hobby'
  },
  music: {
    id: 'music',
    title: 'Music & Guitar',
    color: '#ec4899',
    weeklyTargetHours: 5.0,
    currentWeeklyHours: 0,
    baseWeeklyHours: 0,
    baseMonthlyHours: 0,
    weeklyScheduleSummary: [],
    monthlyGoalTitle: '',
    monthlyTargetMetric: '',
    monthlyProgress: 0,
    monthlyTargetHours: 20.0,
    inProgressItems: [],
    achievedItems: [],
    upcomingItems: [],
    stickyNoteColor: 'rose',
    dailyPlans: [],
    triple8Type: 'hobby'
  },
  architecture: {
    id: 'architecture',
    title: 'Architecture & Design',
    color: '#0082ff',
    weeklyTargetHours: 10.0,
    currentWeeklyHours: 0,
    baseWeeklyHours: 0,
    baseMonthlyHours: 0,
    weeklyScheduleSummary: [],
    monthlyGoalTitle: '',
    monthlyTargetMetric: '',
    monthlyProgress: 0,
    monthlyTargetHours: 40.0,
    inProgressItems: [],
    achievedItems: [],
    upcomingItems: [],
    stickyNoteColor: 'cyan',
    dailyPlans: [],
    triple8Type: 'career'
  },
  trading: {
    id: 'trading',
    title: 'Trading',
    color: '#10b981',
    weeklyTargetHours: 5.0,
    currentWeeklyHours: 0,
    baseWeeklyHours: 0,
    baseMonthlyHours: 0,
    weeklyScheduleSummary: [],
    monthlyGoalTitle: '',
    monthlyTargetMetric: '',
    monthlyProgress: 0,
    monthlyTargetHours: 20.0,
    inProgressItems: [],
    achievedItems: [],
    upcomingItems: [],
    stickyNoteColor: 'mint',
    dailyPlans: [],
    triple8Type: 'career'
  },
  devotion: {
    id: 'devotion',
    title: 'Devotion & Prayer',
    color: '#a855f7',
    weeklyTargetHours: 5.0,
    currentWeeklyHours: 0,
    baseWeeklyHours: 0,
    baseMonthlyHours: 0,
    weeklyScheduleSummary: [],
    monthlyGoalTitle: '',
    monthlyTargetMetric: '',
    monthlyProgress: 0,
    monthlyTargetHours: 20.0,
    inProgressItems: [],
    achievedItems: [],
    upcomingItems: [],
    stickyNoteColor: 'lavender',
    dailyPlans: [],
    triple8Type: 'living'
  },
  buffer: {
    id: 'buffer',
    title: 'Rest & Buffer',
    color: '#64748b',
    weeklyTargetHours: 5.0,
    currentWeeklyHours: 0,
    baseWeeklyHours: 0,
    baseMonthlyHours: 0,
    weeklyScheduleSummary: [],
    monthlyGoalTitle: '',
    monthlyTargetMetric: '',
    monthlyProgress: 0,
    monthlyTargetHours: 20.0,
    inProgressItems: [],
    achievedItems: [],
    upcomingItems: [],
    stickyNoteColor: 'mint',
    dailyPlans: [],
    triple8Type: 'living'
  }
};

interface LivotionContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  domains: SkillDomain[];
  updateDomainHours: (domainId: string, hours: number) => void;
  tasks: ScheduleTask[];
  activeTask: ScheduleTask | null;
  secondsRemaining: number;
  isRunning: boolean;
  startTask: (task: ScheduleTask) => void;
  startTimerForTask: (task: ScheduleTask) => void;
  toggleTimer: () => void;
  stopTimer: () => void;
  toggleTaskCompletion: (taskId: string) => void;
  toggleChecklistItem: (taskId: string, checklistId: string) => void;
  addTask: (task: Omit<ScheduleTask, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<ScheduleTask>) => void;
  deleteTask: (taskId: string) => void;
  soundProfile: string;
  setSoundProfile: (profile: string) => void;
  triggerAlarmSound: (profile?: string) => void;
  workouts: WorkoutProtocol[];
  toggleExerciseCompletion: (workoutId: string, exerciseIndex: number) => void;
  updateWorkout: (workoutId: string, updates: Partial<WorkoutProtocol>) => void;
  addExerciseToWorkout: (workoutId: string, exercise: MovementItem) => void;
  updateExerciseInWorkout: (workoutId: string, exerciseIndex: number, updates: Partial<MovementItem>) => void;
  deleteExerciseFromWorkout: (workoutId: string, exerciseIndex: number) => void;
  reorderExerciseInWorkout: (workoutId: string, fromIndex: number, toIndex: number) => void;
  meals: MealPlan[];
  toggleMealConsumed: (mealId: string) => void;
  goals: StrategicGoal[];
  updateGoalProgress: (goalId: string, progress: number) => void;
  toggleGoalCompleted: (goalId: string) => void;
  addGoal: (goal: Omit<StrategicGoal, 'id'>) => void;
  updateGoal: (goalId: string, updates: Partial<StrategicGoal>) => void;
  deleteGoal: (goalId: string) => void;
  sessions: PracticeSession[];
  logSession: (session: Omit<PracticeSession, 'id'>) => void;
  reviews: FeedbackReview[];
  addReview: (review: Omit<FeedbackReview, 'id' | 'createdAt'>) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  calendarSystem: CalendarSystem;
  setCalendarSystem: (system: CalendarSystem) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
  getCategoryTitleTranslated: (catId: string, currentTitle: string) => string;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (categoryId: string | null) => void;
  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  isNewCategoryModalOpen: boolean;
  openNewCategoryModal: () => void;
  closeNewCategoryModal: () => void;
  isManageCategoriesModalOpen: boolean;
  openManageCategoriesModal: () => void;
  closeManageCategoriesModal: () => void;
  restoreDefaultCategories: () => void;
  categoryPlans: Record<string, CategoryPlan>;
  updateCategoryPlan: (categoryId: string, updates: Partial<CategoryPlan>) => void;
  getCategoryLiveMetrics: (categoryId: string) => CategoryLiveMetrics;
  addNewCategory: (newCategory: CategoryPlan) => void;
  deleteCategoryPlan: (categoryId: string) => void;
  updateCategorySchedule: (categoryId: string, summary: string[], targetHours: number) => void;
  updateCategoryMonthlyDeliverable: (
    categoryId: string,
    goalTitle: string,
    metric: string,
    monthlyTargetHours: number,
    baseProgress?: number
  ) => void;
  addCategoryDailyPlan: (categoryId: string, text: string) => void;
  toggleCategoryDailyPlan: (categoryId: string, planId: string) => void;
  deleteCategoryDailyPlan: (categoryId: string, planId: string) => void;
  updateCategoryDailyPlan: (categoryId: string, planId: string, text: string) => void;
  setCategoryStickyNoteColor: (categoryId: string, color: StickyNoteColor) => void;
  dailyStickyColor: StickyNoteThemeColor;
  setDailyStickyColor: (color: StickyNoteThemeColor) => void;
  isAutoStickyColor: boolean;
  setIsAutoStickyColor: (enabled: boolean) => void;
  dailyStickyNotes: DailyStickyReviewNote[];
  updateDailyStickyNoteRating: (id: string, stars: number) => void;
  updateDailyStickyNoteReview: (id: string, reviewText: string) => void;
  updateDailyStickyNoteColor: (id: string, color: StickyNoteThemeColor) => void;
  updateDailyStickyNoteMood: (id: string, mood: string) => void;
  toggleDailyStickyTask: (noteId: string, taskId: string) => void;
  addDailyStickyNote: (note: Omit<DailyStickyReviewNote, 'id' | 'createdAt'>) => void;
  deleteDailyStickyNote: (id: string) => void;
  applySystematicPreset: (presetType: 'balanced' | 'focus' | 'reset') => void;
  resetAllData: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;
  syncKey: string;
  setSyncKey: (key: string) => void;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error' | 'initial_pull';
  cloudDatabase: string;
  lastSyncedAt: string | null;
  syncNow: (customSyncKey?: string) => Promise<boolean>;
  isSyncModalOpen: boolean;
  openSyncModal: () => void;
  closeSyncModal: () => void;
  currentUser: UserAccountProfile | null;
  setCurrentUser: (user: UserAccountProfile | null) => void;
  hydrateCloudState: (data: any) => void;
  logoutUser: () => void;
  getDaySchedule: (date: Date) => {
    tasks: ScheduleTask[];
    isCustom: boolean;
    source: 'custom' | 'weekday_default' | 'global_default' | 'rest_day';
    dateStr: string;
    dayOfWeek: number;
  };
  materializeDaySchedule: (dateStr: string) => ScheduleTask[];
  resetDayScheduleToDefault: (dateStr: string) => void;
  saveDayAsWeekdayDefault: (dateStr: string, dayOfWeek: number) => void;
  saveDayAsGlobalRoutine: (dateStr: string) => void;
  applyDayScheduleToDates: (sourceDateStr: string, targetDateStrs: string[]) => void;
  updateWeekdayDefaultSchedule: (dayOfWeek: number, newDefaultTasks: Omit<ScheduleTask, 'id' | 'date'>[]) => void;
  getWeekdayDefaultTasks: (dayOfWeek: number) => ScheduleTask[];
  updateDevotionRoutine: (id: string, updates: { title?: string; durationMinutes?: number; startTime?: string; completed?: boolean }) => void;
  applyTaskActionWithScope: (params: {
    action: 'edit' | 'create' | 'delete';
    scope: 'this_day_only' | 'all_days' | 'chosen_days';
    sourceDateStr: string;
    targetDateStrs?: string[];
    dayOfWeek?: number;
    taskId?: string;
    originalTask?: ScheduleTask;
    updatedTaskData?: Partial<ScheduleTask>;
    newTaskData?: Omit<ScheduleTask, 'id'>;
  }) => void;
  categoryOrder: string[];
  setCategoryOrder: (order: string[]) => void;
  reorderCategories: (fromCatId: string, toCatId: string) => void;
  reorderTasks: (fromTaskId: string, toTaskId: string) => void;
  iosNotes: IosNoteItem[];
  setIosNotes: React.Dispatch<React.SetStateAction<IosNoteItem[]>>;
  addIosNote: (note: Omit<IosNoteItem, 'id' | 'updatedAt'>) => void;
  updateIosNote: (id: string, updates: Partial<IosNoteItem>) => void;
  deleteIosNote: (id: string) => void;
  togglePinIosNote: (id: string) => void;
}

const LivotionContext = createContext<LivotionContextType | undefined>(undefined);

const OLD_STORAGE_KEY = 'livotion_mastery_state_v2';
const STORAGE_KEY = 'neva_mastery_scratch_v1';

export const DEFAULT_IOS_NOTES: IosNoteItem[] = [
  {
    id: 'note-1',
    title: 'Neva Mastery OS • Core Directives',
    body: '1. Relentless daily execution beats erratic bursts.\n2. 90-minute Ultradian blocks for deep cognitive architecture.\n3. Keep the schedule clean, minimalist, and truthful.\n\n- [x] Morning devotional reading\n- [x] Strength training compound lift\n- [ ] Evening review & day closeout',
    folder: 'Work',
    pinned: true,
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'note-2',
    title: 'Guitar Solo Phrasing & Dorian Scale',
    body: 'Focus on hitting the 6th degree on the resolution chord.\nUse subtle vibrato on whole-tone bends at 12th fret.\n\nKey practice chords:\n- Dm7 -> G7 -> Cmaj7\n- Target tempo: 110 BPM with clean articulation.',
    folder: 'Ideas',
    pinned: false,
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'note-3',
    title: 'Architecture & Site Supervision Checkpoints',
    body: 'Foundation pour verification:\n- Check rebar spacing on grid B-4\n- Verify concrete slump test before pour\n- Confirm curing compound spray coverage',
    folder: 'Work',
    pinned: false,
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export const LivotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
      return saved ? JSON.parse(saved) : initialUser;
    } catch {
      return initialUser;
    }
  });

  const [domains, setDomains] = useState<SkillDomain[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_domains`);
      return saved ? JSON.parse(saved) : initialDomains;
    } catch {
      return initialDomains;
    }
  });

  const [tasks, setTasks] = useState<ScheduleTask[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
    if (saved) {
      try {
        const parsed: ScheduleTask[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed
            .map((t) => {
              // Self-heal any tasks saved with 2025-11- date due to previous calendar year calculation offset
              if (t && t.date && t.date.startsWith('2025-11-')) {
                return { ...t, date: t.date.replace('2025-11-', '2026-11-') };
              }
              return t;
            })
            .filter((t) => 
              t && 
              !t.id?.startsWith('def-') && 
              !t.id?.startsWith('carry-') && 
              !['Compound Strength & Conditioning', 'Tactical Chess Study & Calculation', 'Guitar Repertoire & Fretboard Mastery', 'Dawn Gratitude & Bible Reading', 'Evening Examen & Prayer', 'Morning Devotion & Scripture Study', 'Evening Reflection & Gratitude Prayer', 'Evening Prayer & Spiritual Rest', 'Sunday Worship & Word Meditation'].includes(t.title)
            );
          return autoResolveOverlappingTasks(sanitized);
        }
      } catch (e) {
        return autoResolveOverlappingTasks(initialTasks);
      }
    }
    return autoResolveOverlappingTasks(initialTasks);
  });

  const [workouts, setWorkouts] = useState<WorkoutProtocol[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_workouts`);
      return saved ? JSON.parse(saved) : initialWorkouts;
    } catch {
      return initialWorkouts;
    }
  });

  const [meals, setMeals] = useState<MealPlan[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_meals`);
      return saved ? JSON.parse(saved) : initialMeals;
    } catch {
      return initialMeals;
    }
  });

  const [goals, setGoals] = useState<StrategicGoal[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_goals`);
      return saved ? JSON.parse(saved) : initialGoals;
    } catch {
      return initialGoals;
    }
  });

  const [sessions, setSessions] = useState<PracticeSession[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sessions`);
      return saved ? JSON.parse(saved) : initialSessions;
    } catch {
      return initialSessions;
    }
  });

  const [reviews, setReviews] = useState<FeedbackReview[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_reviews`);
      return saved ? JSON.parse(saved) : initialReviews;
    } catch {
      return initialReviews;
    }
  });

  const [categoryPlans, setCategoryPlans] = useState<Record<string, CategoryPlan>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_category_plans`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const updated = { ...parsed };
          Object.keys(updated).forEach((k) => {
            if (!updated[k].triple8Type) {
              if (k === 'architecture' || k === 'trading' || k === 'career' || k === 'work') {
                updated[k].triple8Type = 'career';
              } else if (k === 'chess' || k === 'music' || k === 'art' || k === 'guitar' || k === 'painting') {
                updated[k].triple8Type = 'hobby';
              } else {
                updated[k].triple8Type = 'living';
              }
            }
          });
          return updated;
        }
        return INITIAL_CATEGORY_PLANS;
      } catch (e) {
        return INITIAL_CATEGORY_PLANS;
      }
    }
    return INITIAL_CATEGORY_PLANS;
  });

  const [categoryOrder, setCategoryOrderState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('neva_category_order_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('neva_deleted_task_ids_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const recordDeletedTaskId = (id: string) => {
    setDeletedTaskIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('neva_deleted_task_ids_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const setCategoryOrder = (order: string[]) => {
    setCategoryOrderState(order);
    try {
      localStorage.setItem('neva_category_order_v1', JSON.stringify(order));
    } catch {}
  };

  const reorderCategories = (fromCatId: string, toCatId: string) => {
    if (fromCatId === toCatId) return;
    const baseCategoryKeys = Object.keys(categoryPlans);
    const currentOrder = [...baseCategoryKeys].sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
    const fromIndex = currentOrder.indexOf(fromCatId);
    const toIndex = currentOrder.indexOf(toCatId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);

    setCategoryOrder(newOrder);
  };

  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let [_, h, m, meridiem] = match;
    let hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (meridiem) {
      if (meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  };

  const reorderTasks = (fromTaskId: string, toTaskId: string) => {
    if (fromTaskId === toTaskId) return;

    setTasks((prev) => {
      let currentTasks = [...prev];
      let fromIdx = currentTasks.findIndex((t) => t.id === fromTaskId);
      let toIdx = currentTasks.findIndex((t) => t.id === toTaskId);

      // If either task is not found directly, check today's generated schedule and materialize it
      if (fromIdx === -1 || toIdx === -1) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const daySched = getDaySchedule(today);
        const dayTaskList = daySched.tasks;

        const fromTaskInDay = dayTaskList.find(t => t.id === fromTaskId || t.title === fromTaskId);
        const toTaskInDay = dayTaskList.find(t => t.id === toTaskId || t.title === toTaskId);

        if (fromTaskInDay && toTaskInDay) {
          const nonToday = currentTasks.filter(t => t.date !== todayStr);
          const clonedDayTasks: ScheduleTask[] = dayTaskList.map(t => ({
            ...t,
            date: todayStr
          }));
          currentTasks = [...nonToday, ...clonedDayTasks];
          fromIdx = currentTasks.findIndex((t) => t.id === fromTaskId || t.title === fromTaskId);
          toIdx = currentTasks.findIndex((t) => t.id === toTaskId || t.title === toTaskId);
        }
      }

      if (fromIdx === -1 || toIdx === -1) return prev;

      const fromTask = currentTasks[fromIdx];
      const toTask = currentTasks[toIdx];

      // Extract start times to ensure chronological alignment across the plan system
      const time1 = fromTask.startTime;
      const time2 = toTask.startTime;
      const min1 = parseTimeToMinutes(time1);
      const min2 = parseTimeToMinutes(time2);
      const hasTimes = min1 > 0 && min2 > 0;
      const earlierTime = min1 <= min2 ? time1 : time2;
      const laterTime = min1 <= min2 ? time2 : time1;

      // Reorder items in array
      const next = [...currentTasks];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);

      // Whichever task is placed higher in the sequence gets the earlier start time in the plan system
      if (hasTimes) {
        const newIdxFrom = next.findIndex(t => t.id === fromTaskId || (fromTask && t.title === fromTask.title));
        const newIdxTo = next.findIndex(t => t.id === toTaskId || (toTask && t.title === toTask.title));
        if (newIdxFrom !== -1 && newIdxTo !== -1) {
          if (newIdxFrom < newIdxTo) {
            next[newIdxFrom] = { ...next[newIdxFrom], startTime: earlierTime };
            next[newIdxTo] = { ...next[newIdxTo], startTime: laterTime };
          } else {
            next[newIdxTo] = { ...next[newIdxTo], startTime: earlierTime };
            next[newIdxFrom] = { ...next[newIdxFrom], startTime: laterTime };
          }
        }
      }

      try {
        localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(next));
        localStorage.setItem('livotion_tasks_v1', JSON.stringify(next));
        localStorage.setItem('neva_os_state_tasks', JSON.stringify(next));
      } catch {}

      return next;
    });
  };

  const [dailyStickyNotes, setDailyStickyNotes] = useState<DailyStickyReviewNote[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_daily_sticky_notes`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return initialDailyStickyNotes;
      }
    }
    return initialDailyStickyNotes;
  });

  const [dailyStickyColor, setDailyStickyColorState] = useState<StickyNoteThemeColor>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_daily_sticky_color`) || localStorage.getItem('neva_daily_sticky_color');
      if (saved && ['canary', 'peach', 'mint', 'sky', 'rose', 'lavender', 'darkgrey', 'charcoal', 'graphite'].includes(saved)) {
        return saved as StickyNoteThemeColor;
      }
    } catch {}
    return 'canary';
  });

  const setDailyStickyColor = (color: StickyNoteThemeColor) => {
    setDailyStickyColorState(color);
    try {
      localStorage.setItem(`${STORAGE_KEY}_daily_sticky_color`, color);
      localStorage.setItem('neva_daily_sticky_color', color);
    } catch {}
    setDailyStickyNotes((prev) =>
      prev.map((n) => ({ ...n, colorTheme: color }))
    );
  };

  const [isAutoStickyColor, setIsAutoStickyColorState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('neva_auto_sticky_stream_color');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // Default to true: automatically adapts sticky note color to active main stream
  });

  const setIsAutoStickyColor = (enabled: boolean) => {
    setIsAutoStickyColorState(enabled);
    try {
      localStorage.setItem('neva_auto_sticky_stream_color', String(enabled));
    } catch {}
  };

  const [iosNotes, setIosNotes] = useState<IosNoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('livotion_apple_notes_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_IOS_NOTES;
  });

  const addIosNote = (note: Omit<IosNoteItem, 'id' | 'updatedAt'>) => {
    const newNote: IosNoteItem = {
      ...note,
      id: `note-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    setIosNotes((prev) => [newNote, ...prev]);
  };

  const updateIosNote = (id: string, updates: Partial<IosNoteItem>) => {
    setIosNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  const deleteIosNote = (id: string) => {
    setIosNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const togglePinIosNote = (id: string) => {
    setIosNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n))
    );
  };

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'cockpit';
    }
    return 'cockpit';
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('category') || params.get('cat') || null;
    }
    return null;
  });
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState<boolean>(false);
  const openNewCategoryModal = () => setIsNewCategoryModalOpen(true);
  const closeNewCategoryModal = () => setIsNewCategoryModalOpen(false);

  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState<boolean>(false);
  const openManageCategoriesModal = () => setIsManageCategoriesModalOpen(true);
  const closeManageCategoriesModal = () => setIsManageCategoriesModalOpen(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  const restoreDefaultCategories = () => {
    setCategoryPlans((prev) => {
      const merged = { ...prev, ...INITIAL_CATEGORY_PLANS };
      try {
        localStorage.setItem(`${STORAGE_KEY}_category_plans`, JSON.stringify(merged));
        localStorage.setItem('neva_last_local_edit_time', new Date().toISOString());
      } catch {}
      return merged;
    });
  };
  const [soundProfile, setSoundProfile] = useState<string>('CHIME_MEDITATION');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_theme`) || localStorage.getItem(`${OLD_STORAGE_KEY}_theme`);
    return (saved === 'dark' ? 'dark' : 'light');
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_language`) || localStorage.getItem(`${OLD_STORAGE_KEY}_language`);
    return (saved === 'am' ? 'am' : 'en');
  });

  // Purge deprecated v2 seed data and any default/mock blocks so user starts completely clean from scratch
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('livotion_mastery_state_v2_') && !key.includes('theme') && !key.includes('language')) {
          localStorage.removeItem(key);
        }
      });

      const savedTasks = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((t: any) => 
            t && 
            !t.id?.startsWith('def-') && 
            !t.id?.startsWith('carry-') && 
            !['Compound Strength & Conditioning', 'Tactical Chess Study & Calculation', 'Guitar Repertoire & Fretboard Mastery', 'Dawn Gratitude & Bible Reading', 'Evening Examen & Prayer', 'Morning Devotion & Scripture Study', 'Evening Reflection & Gratitude Prayer', 'Evening Prayer & Spiritual Rest', 'Sunday Worship & Word Meditation'].includes(t.title)
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(cleaned));
            setTasks(cleaned);
          }
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_language`, language);
    document.documentElement.lang = language === 'am' ? 'am' : 'en';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'am' : 'en'));
  };

  const t = (key: keyof Translations): string => {
    return getTranslation(key, language);
  };

  const getCategoryTitleTranslated = (catId: string, currentTitle: string): string => {
    return getTranslatedCategoryTitle(catId, currentTitle, language);
  };

  // Persistent Clock / Active Timer State (Immune to app close, reload, backgrounding & switching apps)
  const CLOCK_SESSION_KEY = 'neva_active_clock_session_v2';

  const [activeTask, setActiveTask] = useState<ScheduleTask | null>(() => {
    try {
      const saved = localStorage.getItem(CLOCK_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeTask) return parsed.activeTask;
      }
    } catch {}
    return null;
  });

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CLOCK_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.targetEndTime) {
          const diff = Math.max(0, Math.ceil((parsed.targetEndTime - Date.now()) / 1000));
          return diff;
        } else if (parsed.secondsRemaining) {
          return parsed.secondsRemaining;
        }
      }
    } catch {}
    return 0;
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(CLOCK_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.targetEndTime) {
          return Date.now() < parsed.targetEndTime;
        }
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_theme`, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // App Theme Accent Color (Default: 'blue' / #0082ff)
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_accent_color`) as AccentColor;
      if (['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'indigo', 'slate'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'blue';
  });

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    try {
      localStorage.setItem(`${STORAGE_KEY}_accent_color`, color);
      document.documentElement.setAttribute('data-accent', color);
    } catch {}
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  // Calendar System Selection: 'gc' (Gregorian), 'et' (Ethiopian), 'dual' (Both)
  const [calendarSystem, setCalendarSystemState] = useState<CalendarSystem>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_calendar_system`) as CalendarSystem;
      if (saved === 'gc' || saved === 'et' || saved === 'dual') {
        return saved;
      }
    } catch {}
    return 'dual';
  });

  const setCalendarSystem = (system: CalendarSystem) => {
    setCalendarSystemState(system);
    try {
      localStorage.setItem(`${STORAGE_KEY}_calendar_system`, system);
    } catch {}
  };

  // Cross-Device Cloud Sync State & User Account
  const [currentUser, setCurrentUserState] = useState<UserAccountProfile | null>(() => getStoredUserAccount());

  const [syncKey, setSyncKeyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSync = params.get('sync') || params.get('syncKey');
      if (urlSync) {
        const clean = urlSync.trim();
        localStorage.setItem(`${STORAGE_KEY}_sync_key`, clean);
        return clean;
      }
    }
    const savedUser = getStoredUserAccount();
    if (savedUser && savedUser.username) {
      return savedUser.username;
    }
    return localStorage.getItem(`${STORAGE_KEY}_sync_key`) || 'default_user';
  });

  const setCurrentUser = (account: UserAccountProfile | null) => {
    setCurrentUserState(account);
    if (account) {
      saveAccountToStorage(account);
      setSyncKey(account.username);
    } else {
      clearStoredUserAccount();
    }
  };

  const logoutUser = () => {
    setCurrentUserState(null);
    clearStoredUserAccount();
    setSyncKey('default_user');
  };

  // Keep active user session permanently persisted until user explicitly clicks logout
  useEffect(() => {
    if (currentUser) {
      saveAccountToStorage(currentUser);
    }
  }, [currentUser]);

  const hydrateCloudState = (d: any) => {
    if (!d) return;
    if (d.user) setUser(d.user);
    if (d.domains) setDomains(d.domains);
    if (d.tasks) setTasks(d.tasks);
    if (d.workouts) setWorkouts(d.workouts);
    if (d.meals) setMeals(d.meals);
    if (d.goals) setGoals(d.goals);
    if (d.sessions) setSessions(d.sessions);
    if (d.reviews) setReviews(d.reviews);
    if (d.categoryPlans) setCategoryPlans(d.categoryPlans);
    if (d.dailyStickyNotes) setDailyStickyNotes(d.dailyStickyNotes);
    if (d.iosNotes && Array.isArray(d.iosNotes)) {
      setIosNotes(d.iosNotes);
      try {
        localStorage.setItem('livotion_apple_notes_v1', JSON.stringify(d.iosNotes));
      } catch {}
    }
    if (d.dailyStickyColor) {
      setDailyStickyColorState(d.dailyStickyColor);
      try {
        localStorage.setItem(`${STORAGE_KEY}_daily_sticky_color`, d.dailyStickyColor);
        localStorage.setItem('neva_daily_sticky_color', d.dailyStickyColor);
      } catch {}
    }
  };
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error' | 'initial_pull'>('synced');
  const [cloudDatabase, setCloudDatabase] = useState<string>('NEVA Cloud DB');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isCloudHydrated, setIsCloudHydrated] = useState<boolean>(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  const openSyncModal = () => setIsSyncModalOpen(true);
  const closeSyncModal = () => setIsSyncModalOpen(false);

  const setSyncKey = (key: string) => {
    const trimmed = key.trim() || 'default_user';
    setSyncKeyState(trimmed);
    localStorage.setItem(`${STORAGE_KEY}_sync_key`, trimmed);
  };

  // Push all local state to cloud immediately
  const pushStateToCloudImmediate = async (customSyncKey?: string): Promise<boolean> => {
    const keyToUse = (customSyncKey || syncKey).trim() || 'default_user';
    if (isDeviceOffline()) {
      markPendingSync(keyToUse, {
        user, domains, tasks, workouts, meals, goals, sessions, reviews, categoryPlans, dailyStickyNotes, iosNotes
      });
      setCloudSyncStatus('offline');
      return false;
    }

    setCloudSyncStatus('syncing');
    try {
      const res = await syncStateToCloud({
        user,
        domains,
        tasks,
        workouts,
        meals,
        goals,
        sessions,
        reviews,
        categoryPlans,
        dailyStickyNotes,
        dailyStickyColor,
        iosNotes,
      }, keyToUse);

      if (res.success) {
        clearPendingSync(keyToUse);
        setCloudSyncStatus('synced');
        if (res.database) setCloudDatabase(res.database);
        setLastSyncedAt(res.updatedAt || new Date().toISOString());
        return true;
      } else {
        setCloudSyncStatus('offline');
        return false;
      }
    } catch (e) {
      setCloudSyncStatus('offline');
      return false;
    }
  };

  const isFirstMount = useRef(true);

  // Pull latest updates from server and seamlessly hydrate the app UI
  const pullLatestStateFromCloud = async (force: boolean = false): Promise<boolean> => {
    if (isDeviceOffline()) return false;
    const keyToUse = syncKey.trim() || 'default_user';
    try {
      const remote = await fetchStateFromCloud(keyToUse);
      if (remote && remote.data) {
        const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
        const lastLocalEdit = localStorage.getItem('neva_last_local_edit_time');
        const localEditTime = lastLocalEdit ? new Date(lastLocalEdit).getTime() : 0;

        // If remote was updated on website, or no pending local edits, or force: hydrate immediately!
        if (force || !hasPendingSync(keyToUse) || remoteTime > localEditTime) {
          const d = remote.data;
          if (d.user) setUser(d.user);
          if (d.domains) setDomains(d.domains);
          if (d.tasks) setTasks(d.tasks);
          if (d.workouts) setWorkouts(d.workouts);
          if (d.meals) setMeals(d.meals);
          if (d.goals) setGoals(d.goals);
          if (d.sessions) setSessions(d.sessions);
          if (d.reviews) setReviews(d.reviews);
          if (d.categoryPlans) setCategoryPlans(d.categoryPlans);
          if (d.dailyStickyNotes) setDailyStickyNotes(d.dailyStickyNotes);
          if (d.iosNotes && Array.isArray(d.iosNotes)) {
            setIosNotes(d.iosNotes);
            try {
              localStorage.setItem('livotion_apple_notes_v1', JSON.stringify(d.iosNotes));
            } catch {}
          }
          if (remote.database) setCloudDatabase(remote.database);
          setLastSyncedAt(remote.updatedAt || new Date().toISOString());
          clearPendingSync(keyToUse);
          setCloudSyncStatus('synced');
          return true;
        } else if (hasPendingSync(keyToUse)) {
          // Local has newer edits, push to cloud
          await pushStateToCloudImmediate(keyToUse);
        }
      }
    } catch (e) {
      console.warn('Realtime cloud pull notice:', e);
    }
    return false;
  };

  // Initial sync on app startup or syncKey change
  useEffect(() => {
    let isMounted = true;
    const initializeSync = async () => {
      if (isDeviceOffline()) {
        if (isMounted) setCloudSyncStatus('offline');
        return;
      }

      try {
        if (isMounted) setCloudSyncStatus('syncing');
        await pullLatestStateFromCloud(true);
      } catch (err) {
        if (isMounted) setCloudSyncStatus('offline');
      }
    };

    initializeSync();
    return () => { isMounted = false; };
  }, [syncKey]);

  // Persist locally immediately & debounced push to Cloud
  useEffect(() => {
    // 1. Synchronously save all state locally on device
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
    localStorage.setItem(`${STORAGE_KEY}_domains`, JSON.stringify(domains));
    localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
    localStorage.setItem(`${STORAGE_KEY}_workouts`, JSON.stringify(workouts));
    localStorage.setItem(`${STORAGE_KEY}_meals`, JSON.stringify(meals));
    localStorage.setItem(`${STORAGE_KEY}_goals`, JSON.stringify(goals));
    localStorage.setItem(`${STORAGE_KEY}_sessions`, JSON.stringify(sessions));
    localStorage.setItem(`${STORAGE_KEY}_reviews`, JSON.stringify(reviews));
    localStorage.setItem(`${STORAGE_KEY}_category_plans`, JSON.stringify(categoryPlans));
    localStorage.setItem(`${STORAGE_KEY}_daily_sticky_notes`, JSON.stringify(dailyStickyNotes));
    localStorage.setItem('livotion_apple_notes_v1', JSON.stringify(iosNotes));

    // Skip marking pending and pushing to cloud on initial mount
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // 2. Mark that user-initiated local edits have occurred
    markPendingSync(syncKey);
    localStorage.setItem('neva_last_local_edit_time', new Date().toISOString());

    // If device is offline, set status immediately without trying network
    if (isDeviceOffline()) {
      setCloudSyncStatus('offline');
      return;
    }

    setCloudSyncStatus('syncing');
    const syncTimer = setTimeout(async () => {
      const res = await syncStateToCloud({
        user,
        domains,
        tasks,
        workouts,
        meals,
        goals,
        sessions,
        reviews,
        categoryPlans,
        dailyStickyNotes,
        dailyStickyColor,
        iosNotes,
      }, syncKey);

      if (res.success) {
        clearPendingSync(syncKey);
        setCloudSyncStatus('synced');
        if (res.database) setCloudDatabase(res.database);
        setLastSyncedAt(res.updatedAt || new Date().toISOString());
      } else {
        setCloudSyncStatus('offline');
      }
    }, 1200);

    return () => clearTimeout(syncTimer);
  }, [user, domains, tasks, workouts, meals, goals, sessions, reviews, categoryPlans, dailyStickyNotes, dailyStickyColor, iosNotes, syncKey]);

  // Sync high-priority task start-time alarms for mobile notifications & in-app alerts
  useEffect(() => {
    try {
      taskAlarmService.syncTaskAlarms(tasks, categoryPlans);
    } catch (e) {
      console.warn('Task alarm sync error:', e);
    }
  }, [tasks, categoryPlans]);

  // 3. Automatic Realtime Sync: Pull updates when opening app, on focus, on reconnect, or on 10s heartbeat
  useEffect(() => {
    const handleAutoSync = async () => {
      if (isDeviceOffline()) return;

      if (hasPendingSync(syncKey)) {
        await pushStateToCloudImmediate(syncKey);
      } else {
        await pullLatestStateFromCloud();
      }
    };

    const handleOffline = () => {
      setCloudSyncStatus('offline');
    };

    window.addEventListener('online', handleAutoSync);
    window.addEventListener('offline', handleOffline);

    // Sync when app comes back to foreground (unlocked, app switch, tab focus)
    const handleForeground = () => {
      if (document.visibilityState === 'visible' && !isDeviceOffline()) {
        pullLatestStateFromCloud();
      }
    };
    document.addEventListener('visibilitychange', handleForeground);
    window.addEventListener('focus', handleForeground);

    // Heartbeat auto-sync check every 10 seconds while app is active
    const heartbeat = setInterval(() => {
      if (!isDeviceOffline() && document.visibilityState === 'visible' && !hasPendingSync(syncKey)) {
        pullLatestStateFromCloud();
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleAutoSync);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleForeground);
      window.removeEventListener('focus', handleForeground);
      clearInterval(heartbeat);
    };
  }, [syncKey]);

  // Auto-migration & stream preservation:
  // If the user has created tasks (e.g. on Saturday or under date/dayOfWeek) and there are no global tasks,
  // ensure these user-created tasks are also registered as recurring global tasks (!t.date && !t.dayOfWeek)
  // so the user's main stream blocks never vanish or get wiped out when the day changes at midnight!
  useEffect(() => {
    setTasks((prev) => {
      const userTasks = prev.filter((t) => !t.id.startsWith('def-') && !t.id.startsWith('carry-'));
      if (userTasks.length === 0) return prev;

      const hasGlobal = prev.some((t) => !t.date && !t.dayOfWeek && !t.id.startsWith('def-') && !t.id.startsWith('carry-'));
      if (!hasGlobal) {
        const seen = new Set<string>();
        const newGlobals: ScheduleTask[] = [];
        userTasks.forEach((t, idx) => {
          const key = t.title.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            newGlobals.push({
              ...t,
              id: `promoted-global-${Date.now()}-${idx}`,
              date: undefined,
              dayOfWeek: undefined,
              completed: false,
              checklist: t.checklist ? t.checklist.map((c) => ({ ...c, done: false })) : undefined,
            });
          }
        });
        if (newGlobals.length > 0) {
          return [...prev, ...newGlobals];
        }
      }
      return prev;
    });
  }, []);

  const syncNow = async (customSyncKey?: string): Promise<boolean> => {
    const keyToUse = (customSyncKey || syncKey).trim() || 'default_user';
    if (customSyncKey && customSyncKey !== syncKey) {
      setSyncKey(keyToUse);
    }

    if (isDeviceOffline()) {
      setCloudSyncStatus('offline');
      return false;
    }

    setCloudSyncStatus('syncing');
    try {
      if (hasPendingSync(keyToUse)) {
        const pushRes = await pushStateToCloudImmediate(keyToUse);
        return pushRes;
      } else {
        const pullRes = await pullLatestStateFromCloud(true);
        return pullRes;
      }
    } catch (e) {
      setCloudSyncStatus('offline');
      return false;
    }
  };

  const targetEndTimeRef = useRef<number | null>(null);
  const activeTaskRef = useRef<ScheduleTask | null>(activeTask);

  useEffect(() => {
    activeTaskRef.current = activeTask;
  }, [activeTask]);

  // Synchronize targetEndTimeRef & active countdown on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CLOCK_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.targetEndTime && parsed.targetEndTime > Date.now()) {
          targetEndTimeRef.current = parsed.targetEndTime;
          const diff = Math.max(0, Math.ceil((parsed.targetEndTime - Date.now()) / 1000));
          if (!mobileTimerEngine.getState().isActive) {
            mobileTimerEngine.startCountdown({
              durationSeconds: parsed.totalDurationSeconds || diff,
              initialRemainingSeconds: diff,
              taskTitle: parsed.activeTask?.title || 'Daily Activity Block',
              category: parsed.activeTask?.domain || 'task',
              system: 'task',
              phase: 'focus',
            });
          }
        }
      }
    } catch {}
  }, []);

  // 100% Two-Way Synchronization with mobileTimerEngine (Top Dynamic Island / floating capsule <-> Main cockpit block)
  useEffect(() => {
    const unsubscribe = mobileTimerEngine.subscribe((engineState) => {
      // 1. Synchronize running / paused state
      setIsRunning(engineState.isRunning);

      // 2. Synchronize seconds remaining if in countdown mode
      if (engineState.mode === 'countdown') {
        setSecondsRemaining(engineState.secondsRemaining);
      }

      // 3. Synchronize targetEndTime
      targetEndTimeRef.current = engineState.targetEndTime;

      // 4. Handle complete stop / cancellation / reset
      if (!engineState.isActive && !engineState.isRunning) {
        setIsRunning(false);
        setSecondsRemaining(0);
        targetEndTimeRef.current = null;
        setActiveTask(null);
        activeTaskRef.current = null;
        try { localStorage.removeItem(CLOCK_SESSION_KEY); } catch {}
      } else if (engineState.isActive) {
        // Keep session storage synchronized
        try {
          localStorage.setItem(CLOCK_SESSION_KEY, JSON.stringify({
            activeTask: activeTaskRef.current,
            targetEndTime: engineState.targetEndTime,
            secondsRemaining: engineState.secondsRemaining,
            totalDurationSeconds: engineState.totalDurationSeconds,
            isRunning: engineState.isRunning,
            updatedAt: Date.now()
          }));
        } catch {}
      }
    });

    return () => unsubscribe();
  }, []);

  const startTask = (task: ScheduleTask) => {
    setActiveTask(task);
    activeTaskRef.current = task;
    const secs = task.durationMin * 60;
    setSecondsRemaining(secs);
    const targetEnd = Date.now() + secs * 1000;
    targetEndTimeRef.current = targetEnd;
    setIsRunning(true);

    try {
      localStorage.setItem(CLOCK_SESSION_KEY, JSON.stringify({
        activeTask: task,
        targetEndTime: targetEnd,
        secondsRemaining: secs,
        totalDurationSeconds: secs,
        isRunning: true,
        startedAt: Date.now()
      }));
    } catch {}

    soundEngine.playBlockTimerStartMusic();

    mobileTimerEngine.startCountdown({
      durationSeconds: secs,
      initialRemainingSeconds: secs,
      taskTitle: task.title,
      category: task.domain || 'task',
      system: 'task',
      phase: 'focus',
      onComplete: () => {
        setIsRunning(false);
        setSecondsRemaining(0);
        targetEndTimeRef.current = null;
        setActiveTask(null);
        activeTaskRef.current = null;
        try { localStorage.removeItem(CLOCK_SESSION_KEY); } catch {}
        soundEngine.playSound(task.soundProfile || soundProfile);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
        toggleTaskCompletion(task.id);
      }
    });
  };

  const toggleTimer = () => {
    const engineState = mobileTimerEngine.getState();
    if (engineState.isRunning) {
      // Synchronous pause across top capsule and main cockpit block
      mobileTimerEngine.pause();
    } else {
      // Synchronous resume across top capsule and main cockpit block with uplifting music
      soundEngine.playBlockTimerStartMusic();
      if (engineState.isActive) {
        mobileTimerEngine.resume();
      } else if (activeTask || secondsRemaining > 0) {
        const curTask = activeTask;
        const totalSecs = (curTask?.durationMin ? curTask.durationMin * 60 : 0) || secondsRemaining || 25 * 60;
        const remainingSecs = secondsRemaining > 0 ? secondsRemaining : totalSecs;

        mobileTimerEngine.startCountdown({
          durationSeconds: totalSecs,
          initialRemainingSeconds: remainingSecs,
          taskTitle: curTask?.title || 'Daily Focus Block',
          category: curTask?.domain || 'task',
          system: 'task',
          phase: 'focus',
          onComplete: () => {
            setIsRunning(false);
            setSecondsRemaining(0);
            targetEndTimeRef.current = null;
            setActiveTask(null);
            activeTaskRef.current = null;
            try { localStorage.removeItem(CLOCK_SESSION_KEY); } catch {}
            if (curTask) {
              soundEngine.playSound(curTask.soundProfile || soundProfile);
              try {
                confetti({
                  particleCount: 80,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              } catch (e) {}
              toggleTaskCompletion(curTask.id);
            }
          }
        });
      }
    }
  };

  const stopTimer = () => {
    mobileTimerEngine.stop();
    setIsRunning(false);
    setActiveTask(null);
    activeTaskRef.current = null;
    setSecondsRemaining(0);
    targetEndTimeRef.current = null;
    try { localStorage.removeItem(CLOCK_SESSION_KEY); } catch {}
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === taskId);
      if (exists) {
        return prev.map((t) => {
          if (t.id === taskId) {
            const nextCompleted = !t.completed;
            if (nextCompleted) {
              soundEngine.playSound('CHIME_MEDITATION');
            }
            return { ...t, completed: nextCompleted };
          }
          return t;
        });
      }

      // If taskId is a dynamic routine task, materialize it directly into state with toggled completion
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const sched = getDaySchedule(now);
      const dynamicTask = sched.tasks.find((t) => t.id === taskId);
      if (dynamicTask) {
        soundEngine.playSound('CHIME_MEDITATION');
        return [
          ...prev,
          {
            ...dynamicTask,
            id: taskId,
            date: dynamicTask.date || todayStr,
            completed: !dynamicTask.completed,
          },
        ];
      }
      return prev;
    });
  };

  const toggleChecklistItem = (taskId: string, checklistId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.checklist) {
          return {
            ...t,
            checklist: t.checklist.map((item) =>
              item.id === checklistId ? { ...item, done: !item.done } : item
            ),
          };
        }
        return t;
      })
    );

    // Bidirectional sync with Category dailyPlans if this item originated from a Main Stream plan
    setCategoryPlans((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((catId) => {
        const cat = next[catId];
        if (cat.dailyPlans && cat.dailyPlans.some((dp) => dp.id === checklistId)) {
          changed = true;
          next[catId] = {
            ...cat,
            dailyPlans: cat.dailyPlans.map((dp) =>
              dp.id === checklistId ? { ...dp, completed: !dp.completed } : dp
            ),
          };
        }
      });
      return changed ? next : prev;
    });
  };

  const addTask = (newTask: Omit<ScheduleTask, 'id'>) => {
    const id = `task-${Date.now()}`;
    setTasks((prev) => autoResolveOverlappingTasks([...prev, { ...newTask, id }]));
  };

  const updateTask = (taskId: string, updates: Partial<ScheduleTask>) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === taskId);
      if (exists) {
        return prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      }

      // If not in prev, this is a routine/default task being edited for the first time
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const sched = getDaySchedule(now);
      const dynamicTask = sched.tasks.find((t) => t.id === taskId || (updates.title && t.title.toLowerCase().trim() === updates.title.toLowerCase().trim()));

      if (dynamicTask) {
        return [
          ...prev,
          {
            ...dynamicTask,
            ...updates,
            id: taskId,
            date: updates.date || dynamicTask.date || todayStr,
          },
        ];
      }

      return [
        ...prev,
        {
          id: taskId,
          title: updates.title || 'Focus Block',
          startTime: updates.startTime || '09:00 AM',
          durationMin: updates.durationMin || 45,
          completed: updates.completed ?? false,
          color: updates.color || '#0082ff',
          badge: updates.badge || 'Focus',
          domain: updates.domain || 'OPEN_MULTIPURPOSE',
          date: updates.date || todayStr,
          ...updates,
        } as ScheduleTask,
      ];
    });

    if (activeTask?.id === taskId) {
      setActiveTask((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    recordDeletedTaskId(taskId);
    if (activeTask?.id === taskId) {
      stopTimer();
    }
  };

  // Standard Default Devotion and Exercise Tasks
  const getStandardDevotionTasks = (dow: number): ScheduleTask[] => {
    if (dow === 7) {
      return [
        {
          id: `def-sun-dev-1`,
          domain: 'DEVOTION_PRAYER',
          title: 'Sunday Worship & Word Meditation',
          startTime: '08:30 AM',
          durationMin: 60,
          completed: false,
          color: '#a855f7',
          badge: 'Devotion',
          dayOfWeek: 7,
          checklist: [
            { id: 'c-sun-1', text: 'Fellowship & scripture contemplation', done: false },
            { id: 'c-sun-2', text: 'Spiritual rest & dedication prayer', done: false }
          ]
        },
        {
          id: `def-sun-dev-2`,
          domain: 'DEVOTION_PRAYER',
          title: 'Evening Prayer & Spiritual Rest',
          startTime: '08:00 PM',
          durationMin: 30,
          completed: false,
          color: '#a855f7',
          badge: 'Devotion',
          dayOfWeek: 7,
          checklist: [
            { id: 'c-sun-3', text: 'Family thanksgiving & week preview', done: false },
            { id: 'c-sun-4', text: 'Peaceful Sabbath closeout prayer', done: false }
          ]
        }
      ];
    }
    return [
      {
        id: `def-wd-${dow}-dev-1`,
        domain: 'DEVOTION_PRAYER',
        title: 'Dawn Gratitude & Bible Reading',
        startTime: '06:00 AM',
        durationMin: 30,
        completed: false,
        color: '#a855f7',
        badge: 'Devotion',
        dayOfWeek: dow,
        checklist: [
          { id: `c-dev-${dow}-1`, text: 'Give thanks for life & peace', done: false },
          { id: `c-dev-${dow}-2`, text: 'Daily scripture chapter & meditation', done: false },
          { id: `c-dev-${dow}-3`, text: 'Dedicate daily execution to God', done: false }
        ]
      },
      {
        id: `def-wd-${dow}-dev-2`,
        domain: 'DEVOTION_PRAYER',
        title: 'Evening Examen & Prayer',
        startTime: '09:30 PM',
        durationMin: 20,
        completed: false,
        color: '#a855f7',
        badge: 'Devotion',
        dayOfWeek: dow,
        checklist: [
          { id: `c-dev-${dow}-4`, text: 'Review blessings & surrender stress', done: false },
          { id: `c-dev-${dow}-5`, text: 'Forgive offenses & sleep in peace', done: false }
        ]
      }
    ];
  };

  const getStandardExerciseTask = (dow: number): ScheduleTask => ({
    id: `def-wd-${dow}-ex-1`,
    domain: 'PHYSICAL_FITNESS',
    title: 'Compound Strength & Conditioning',
    startTime: '06:00 PM',
    durationMin: 60,
    completed: false,
    color: '#ef4444',
    badge: 'Workout',
    dayOfWeek: dow,
    checklist: []
  });

  // Ensure routines are present - passthrough (no artificial injection of mock tasks)
  const ensureRoutinesPresent = (taskList: ScheduleTask[], _dow: number): ScheduleTask[] => {
    return taskList;
  };

  // Helper to extract recurring stream tasks configured across Main Stream programs (categoryPlans)
  const getStreamTasksForDayOfWeek = (dow: number): ScheduleTask[] => {
    const streamTasks: ScheduleTask[] = [];
    const dayKeywords: Record<number, string[]> = {
      1: ['mon', 'ሰኞ', 'monday'],
      2: ['tue', 'ማክ', 'tuesday'],
      3: ['wed', 'ረቡ', 'wednesday'],
      4: ['thu', 'ሐሙ', 'thursday'],
      5: ['fri', 'አር', 'friday'],
      6: ['sat', 'ቅዳ', 'saturday'],
      7: ['sun', 'እሁ', 'sunday'],
    };
    const keywords = dayKeywords[dow] || [];

    Object.entries(categoryPlans || {}).forEach(([catKey, plan]) => {
      if (dow === 7 && catKey !== 'devotion') return; // Sunday rest day except devotion

      const summarySlots = plan.weeklyScheduleSummary || [];
      summarySlots.forEach((slot, slotIdx) => {
        const slotLower = slot.toLowerCase();
        const matchesDay = keywords.some((kw) => slotLower.includes(kw));
        if (!matchesDay) return;

        // Parse start time
        const timeMatch = slot.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i);
        const startTime = timeMatch ? timeMatch[0] : '07:00 AM';

        // Parse duration
        const durationMatch = slot.match(/\b(\d+)\s*(?:m|min|mins|minutes)\b/i);
        const durationMin = durationMatch ? Number(durationMatch[1]) : 60;

        // Parse title
        let cleanTitle = slot
          .replace(/^[a-z]{3,}\s*/i, '')
          .replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b:?\s*/i, '')
          .replace(/\(\d+\s*m\)/i, '')
          .replace(/^[:\s-]+/, '')
          .trim();
        if (!cleanTitle) {
          cleanTitle = `${plan.title} Focus`;
        }

        const domain = getDomainTypesForCat(catKey)[0] || 'OPEN_MULTIPURPOSE';

        const checklist: any[] = [];

        streamTasks.push({
          id: `stream-slot-${catKey}-${dow}-${slotIdx}`,
          title: cleanTitle,
          startTime,
          durationMin,
          completed: false,
          domain,
          badge: plan.title.split(' ')[0],
          color: plan.color,
          dayOfWeek: dow,
          soundProfile: 'SOLFEGGIO_432',
          checklist,
        });
      });
    });

    return streamTasks;
  };

  // Helper to get default tasks for a given day of week (1 = Mon ... 7 = Sun)
  // Seamlessly merges explicit user recurring tasks and Main Stream weekly routine schedules
  const getWeekdayDefaultTasks = (dayOfWeek: number): ScheduleTask[] => {
    if (dayOfWeek === 7) {
      const weekdayDomains = ['PHYSICAL_FITNESS', 'CHESS', 'GUITAR', 'ARCHITECTURE_DESIGN', 'SITE_SUPERVISION', 'FOREX_TRADING', 'OIL_PAINTING'];
      const sundayTasks = tasks.filter((t) => {
        if (t.date) return false;
        if (t.id.startsWith('def-') || t.id.startsWith('carry-')) return false;
        if (weekdayDomains.includes(t.domain)) return false;
        return t.domain === 'DEVOTION_PRAYER' || t.dayOfWeek === 7;
      });
      const streamSunTasks = getStreamTasksForDayOfWeek(7);
      const combinedSun: ScheduleTask[] = [...sundayTasks];
      const seenSun = new Set(sundayTasks.map(t => t.title.toLowerCase().trim()));
      streamSunTasks.forEach((st) => {
        if (!seenSun.has(st.title.toLowerCase().trim())) {
          combinedSun.push(st);
          seenSun.add(st.title.toLowerCase().trim());
        }
      });
      return combinedSun;
    }

    // Day-of-week specific recurring tasks (!t.date && t.dayOfWeek === dayOfWeek)
    const dayMatches = tasks.filter((t) => !t.date && t.dayOfWeek === dayOfWeek && !t.id.startsWith('def-') && !t.id.startsWith('carry-'));

    // Global recurring tasks under main streams (!t.date && !t.dayOfWeek)
    const globalTasks = tasks.filter((t) => !t.date && !t.dayOfWeek && !t.id.startsWith('def-') && !t.id.startsWith('carry-'));

    // Main Stream program weekly cadence slots
    const streamWeeklySlots = getStreamTasksForDayOfWeek(dayOfWeek);

    const combined: ScheduleTask[] = [];
    const seenTitles = new Set<string>();

    dayMatches.forEach((t) => {
      combined.push(t);
      seenTitles.add(t.title.toLowerCase().trim());
    });

    streamWeeklySlots.forEach((t) => {
      if (!seenTitles.has(t.title.toLowerCase().trim())) {
        combined.push(t);
        seenTitles.add(t.title.toLowerCase().trim());
      }
    });

    globalTasks.forEach((t) => {
      if (!seenTitles.has(t.title.toLowerCase().trim())) {
        combined.push(t);
        seenTitles.add(t.title.toLowerCase().trim());
      }
    });

    return combined;
  };

  const getDaySchedule = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayOfWeek = (date.getDay() + 6) % 7 + 1; // 1 = Mon ... 7 = Sun
    const customTasks = tasks.filter((t) => {
      if (t.id.startsWith('def-') || t.id.startsWith('carry-')) return false;
      if (t.date === dateStr) return true;
      if (t.date && dateStr.startsWith('2026-11-') && t.date === dateStr.replace('2026-11-', '2025-11-')) return true;
      return false;
    });

    if (dayOfWeek === 7) {
      // SUNDAY REST DAY:
      const weekdayDomains = ['PHYSICAL_FITNESS', 'CHESS', 'GUITAR', 'ARCHITECTURE_DESIGN', 'SITE_SUPERVISION', 'FOREX_TRADING', 'OIL_PAINTING'];
      const sundayAllowed = customTasks.filter((t) => {
        if (t.domain === 'DEVOTION_PRAYER') return true;
        if (weekdayDomains.includes(t.domain)) {
          const titleLower = (t.title || '').toLowerCase();
          const badgeLower = (t.badge || '').toLowerCase();
          return titleLower.includes('sunday') || titleLower.includes('እሁድ') || badgeLower.includes('sunday');
        }
        return true;
      });

      if (sundayAllowed.length > 0) {
        return {
          tasks: sundayAllowed,
          isCustom: true,
          source: 'rest_day' as const,
          dateStr,
          dayOfWeek
        };
      }

      const defaultSunday = getWeekdayDefaultTasks(7);
      return {
        tasks: defaultSunday,
        isCustom: false,
        source: 'rest_day' as const,
        dateStr,
        dayOfWeek
      };
    }

    if (customTasks.length > 0) {
      // Seamlessly merge any registered stream routine tasks for this day that aren't already represented in customTasks or deleted!
      const defaultTasks = getWeekdayDefaultTasks(dayOfWeek);
      const isRepresented = (dt: ScheduleTask) => 
        deletedTaskIds.includes(dt.id) || 
        customTasks.some((ct) => ct.id === dt.id || ((ct as any).originalId && (ct as any).originalId === dt.id) || ct.title.toLowerCase().trim() === dt.title.toLowerCase().trim());
      const streamTasksToAdd = defaultTasks.filter((dt) => !isRepresented(dt));

      return {
        tasks: autoResolveOverlappingTasks([...customTasks, ...streamTasksToAdd]),
        isCustom: true,
        source: 'custom' as const,
        dateStr,
        dayOfWeek
      };
    }

    const defaultTasks = getWeekdayDefaultTasks(dayOfWeek).filter((dt) => !deletedTaskIds.includes(dt.id));
    const source = tasks.some((t) => !t.date && t.dayOfWeek === dayOfWeek)
      ? ('weekday_default' as const)
      : ('global_default' as const);

    return {
      tasks: defaultTasks,
      isCustom: false,
      source,
      dateStr,
      dayOfWeek
    };
  };

  // Synchronize Devotion rhythms & routines across the entire system
  const updateDevotionRoutine = (id: string, updates: { title?: string; durationMinutes?: number; startTime?: string; completed?: boolean }) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayOfWeek = (today.getDay() + 6) % 7 + 1;

    setTasks((prev) => {
      let matched = false;
      const updated = prev.map((t) => {
        const isDevotion = t.domain === 'DEVOTION_PRAYER';
        if (!isDevotion) return t;

        const isExactId = t.id === id;
        const isTimeMatch = (id.includes('morning') && (t.title.toLowerCase().includes('dawn') || t.title.toLowerCase().includes('morning') || (t.startTime && t.startTime.includes('AM')))) ||
                            (id.includes('evening') && (t.title.toLowerCase().includes('evening') || t.title.toLowerCase().includes('examen') || (t.startTime && t.startTime.includes('PM')))) ||
                            (id.includes('midday') && t.title.toLowerCase().includes('midday'));
        const isTitleMatch = updates.title && t.title.toLowerCase().trim() === updates.title.toLowerCase().trim();

        if (isExactId || isTimeMatch || isTitleMatch) {
          matched = true;
          return {
            ...t,
            title: updates.title !== undefined ? updates.title : t.title,
            durationMin: updates.durationMinutes !== undefined ? updates.durationMinutes : t.durationMin,
            startTime: updates.startTime !== undefined ? updates.startTime : t.startTime,
            completed: updates.completed !== undefined ? updates.completed : t.completed,
          };
        }
        return t;
      });

      if (!matched && updates.title) {
        // Create an explicit task for today's schedule
        updated.push({
          id: `task-dev-${Date.now()}`,
          date: todayStr,
          dayOfWeek,
          domain: 'DEVOTION_PRAYER',
          title: updates.title,
          startTime: updates.startTime || '06:00 AM',
          durationMin: updates.durationMinutes || 20,
          completed: updates.completed || false,
          color: '#a855f7',
          badge: 'Devotion',
          checklist: [
            { id: `c-dev-${Date.now()}-1`, text: 'Scripture reflection & prayer', done: false }
          ]
        });
      }

      return updated;
    });

    if (updates.completed) {
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.6 },
        });
        soundEngine.playPencil();
      } catch (e) {}
    }
  };

  const materializeDaySchedule = (dateStr: string): ScheduleTask[] => {
    const existing = tasks.filter((t) => 
      (t.date === dateStr || (t.date && dateStr.startsWith('2026-11-') && t.date === dateStr.replace('2026-11-', '2025-11-'))) && 
      !t.id.startsWith('def-') && 
      !t.id.startsWith('carry-')
    );
    if (existing.length > 0) return existing;

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = (dateObj.getDay() + 6) % 7 + 1;
    const defaults = getWeekdayDefaultTasks(dayOfWeek);
    if (!defaults || defaults.length === 0) return [];

    const cloned: ScheduleTask[] = defaults.map((t, idx) => ({
      ...t,
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      date: dateStr,
      dayOfWeek,
      completed: false,
      checklist: t.checklist ? t.checklist.map((c, cidx) => ({ ...c, id: `c-${Date.now()}-${idx}-${cidx}`, done: false })) : undefined
    }));

    setTasks((prev) => [...prev, ...cloned]);
    return cloned;
  };

  const resetDayScheduleToDefault = (dateStr: string) => {
    setTasks((prev) => prev.filter((t) => t.date !== dateStr));
  };

  const saveDayAsWeekdayDefault = (dateStr: string, dayOfWeek: number) => {
    const dateTasks = tasks.filter((t) => t.date === dateStr);
    const sourceTasks = dateTasks.length > 0 ? dateTasks : getWeekdayDefaultTasks(dayOfWeek);

    setTasks((prev) => {
      const filtered = prev.filter((t) => !(t.dayOfWeek === dayOfWeek && !t.date));
      const newDefaults: ScheduleTask[] = sourceTasks.map((t, idx) => ({
        ...t,
        id: `user-wd-task-${dayOfWeek}-${Date.now()}-${idx}`,
        dayOfWeek,
        date: undefined,
        completed: false,
        checklist: t.checklist ? t.checklist.map((c, cidx) => ({ ...c, id: `c-wd-${dayOfWeek}-${idx}-${cidx}`, done: false })) : undefined
      }));
      return [...filtered, ...newDefaults];
    });
  };

  const saveDayAsGlobalRoutine = (dateStr: string) => {
    const dateTasks = tasks.filter((t) => t.date === dateStr);
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const sourceTasks = dateTasks.length > 0 ? dateTasks : getDaySchedule(dateObj).tasks;

    setTasks((prev) => {
      // Keep date-specific tasks and day-specific tasks, replace/update global tasks (!t.date && !t.dayOfWeek)
      const nonGlobals = prev.filter((t) => t.date || t.dayOfWeek);
      const newGlobals: ScheduleTask[] = sourceTasks.map((t, idx) => ({
        ...t,
        id: `global-task-${Date.now()}-${idx}`,
        dayOfWeek: undefined,
        date: undefined,
        completed: false,
        checklist: t.checklist ? t.checklist.map((c, cidx) => ({ ...c, id: `c-glob-${idx}-${cidx}`, done: false })) : undefined
      }));
      return [...nonGlobals, ...newGlobals];
    });
  };

  const applyDayScheduleToDates = (sourceDateStr: string, targetDateStrs: string[]) => {
    const [y, m, d] = sourceDateStr.split('-').map(Number);
    const sourceDate = new Date(y, m - 1, d);
    const sourceSched = getDaySchedule(sourceDate);
    const templateTasks = sourceSched.tasks;

    setTasks((prev) => {
      let next = prev.filter((t) => !t.date || !targetDateStrs.includes(t.date));
      targetDateStrs.forEach((tDate) => {
        const [ty, tm, td] = tDate.split('-').map(Number);
        const dayOfWeek = (new Date(ty, tm - 1, td).getDay() + 6) % 7 + 1;
        const newDayTasks: ScheduleTask[] = templateTasks.map((t, idx) => ({
          ...t,
          id: `task-${Date.now()}-${tDate}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          date: tDate,
          dayOfWeek,
          completed: false,
          checklist: t.checklist ? t.checklist.map((c, cidx) => ({ ...c, id: `c-${tDate}-${idx}-${cidx}`, done: false })) : undefined
        }));
        next = [...next, ...newDayTasks];
      });
      return next;
    });
  };

  const updateWeekdayDefaultSchedule = (dayOfWeek: number, newDefaultTasks: Omit<ScheduleTask, 'id' | 'date'>[]) => {
    setTasks((prev) => {
      const filtered = prev.filter((t) => !(t.dayOfWeek === dayOfWeek && !t.date));
      const cleaned = filtered.filter((t) => t.date || t.dayOfWeek);
      const created: ScheduleTask[] = newDefaultTasks.map((t, idx) => ({
        ...t,
        id: `user-wd-task-${dayOfWeek}-${Date.now()}-${idx}`,
        dayOfWeek,
        date: undefined,
        completed: false,
      }));
      return [...cleaned, ...created];
    });
  };

  const applyTaskActionWithScope = (params: {
    action: 'edit' | 'create' | 'delete';
    scope: 'this_day_only' | 'all_days' | 'chosen_days';
    sourceDateStr: string;
    targetDateStrs?: string[];
    dayOfWeek?: number;
    taskId?: string;
    originalTask?: ScheduleTask;
    updatedTaskData?: Partial<ScheduleTask>;
    newTaskData?: Omit<ScheduleTask, 'id'>;
  }) => {
    const {
      action,
      scope,
      sourceDateStr,
      targetDateStrs = [sourceDateStr],
      taskId,
      originalTask,
      updatedTaskData,
      newTaskData
    } = params;

    const [y, m, d] = sourceDateStr.split('-').map(Number);
    const sourceDate = new Date(y, m - 1, d);
    const dayOfWeek = params.dayOfWeek || ((sourceDate.getDay() + 6) % 7 + 1);

    if (scope === 'this_day_only') {
      // 1. Materialize this day so edits remain completely unique to this date
      materializeDaySchedule(sourceDateStr);

      if (action === 'create' && newTaskData) {
        addTask({
          ...newTaskData,
          date: sourceDateStr,
          dayOfWeek,
        });
      } else if (action === 'edit' && updatedTaskData) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.date === sourceDateStr && (t.id === taskId || (originalTask && t.title === originalTask.title))) {
              return { ...t, ...updatedTaskData, date: sourceDateStr };
            }
            return t;
          })
        );
      } else if (action === 'delete') {
        setTasks((prev) =>
          prev.filter((t) => !(t.date === sourceDateStr && (t.id === taskId || (originalTask && t.title === originalTask.title))))
        );
      }
    } else if (scope === 'all_days') {
      // 2. Apply to default routine so all days throughout the calendar receive this change
      if (action === 'create' && newTaskData) {
        addTask({
          ...newTaskData,
          dayOfWeek: undefined, // undefined applies globally to all 7 days
          date: undefined,
        });
        // Also update sourceDateStr if already custom
        const isSourceCustom = tasks.some((t) => t.date === sourceDateStr);
        if (isSourceCustom) {
          addTask({
            ...newTaskData,
            date: sourceDateStr,
            dayOfWeek,
          });
        }
      } else if (action === 'edit' && updatedTaskData) {
        setTasks((prev) =>
          prev.map((t) => {
            const isMatching = (t.id === taskId || (originalTask && t.title.toLowerCase().trim() === originalTask.title.toLowerCase().trim()));
            if (isMatching) {
              return { ...t, ...updatedTaskData };
            }
            return t;
          })
        );
      } else if (action === 'delete') {
        setTasks((prev) =>
          prev.filter((t) => {
            const isMatching = (t.id === taskId || (originalTask && t.title.toLowerCase().trim() === originalTask.title.toLowerCase().trim()));
            return !isMatching;
          })
        );
      }
    } else if (scope === 'chosen_days') {
      // 3. Apply to source date + each selected date
      const allDates = Array.from(new Set([sourceDateStr, ...targetDateStrs]));
      allDates.forEach((dateStr) => {
        materializeDaySchedule(dateStr);
      });

      setTasks((prev) => {
        let next = [...prev];

        allDates.forEach((dateStr) => {
          const [ty, tm, td] = dateStr.split('-').map(Number);
          const tDow = (new Date(ty, tm - 1, td).getDay() + 6) % 7 + 1;

          if (action === 'create' && newTaskData) {
            const created: ScheduleTask = {
              ...newTaskData,
              id: `task-${Date.now()}-${dateStr}-${Math.random().toString(36).substring(2, 6)}`,
              date: dateStr,
              dayOfWeek: tDow,
              completed: false,
            };
            next.push(created);
          } else if (action === 'edit' && updatedTaskData) {
            let found = false;
            next = next.map((t) => {
              if (t.date === dateStr && (t.id === taskId || (originalTask && t.title === originalTask.title))) {
                found = true;
                return { ...t, ...updatedTaskData, date: dateStr };
              }
              return t;
            });
            if (!found && originalTask) {
              const added: ScheduleTask = {
                ...originalTask,
                ...updatedTaskData,
                id: `task-${Date.now()}-${dateStr}-${Math.random().toString(36).substring(2, 6)}`,
                date: dateStr,
                dayOfWeek: tDow,
                completed: false,
              };
              next.push(added);
            }
          } else if (action === 'delete') {
            next = next.filter((t) => !(t.date === dateStr && (t.id === taskId || (originalTask && t.title === originalTask.title))));
          }
        });

        return next;
      });
    }
  };

  const triggerAlarmSound = (customProfile?: string) => {
    soundEngine.playSound(customProfile || soundProfile);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const updateDomainHours = (domainId: string, hours: number) => {
    setDomains((prev) =>
      prev.map((d) => (d.id === domainId ? { ...d, currentHours: hours } : d))
    );
  };

  const updateCategoryPlan = (categoryId: string, updates: Partial<CategoryPlan>) => {
    setCategoryPlans((prev) => {
      const current = prev[categoryId];
      if (!current) return prev;
      return {
        ...prev,
        [categoryId]: { ...current, ...updates }
      };
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

  const getCategoryLiveMetrics = (catId: string): CategoryLiveMetrics => {
    const cat = categoryPlans[catId];
    if (!cat) {
      return {
        currentWeeklyHours: 0,
        weeklyTargetHours: 1,
        weeklyPercentile: 0,
        currentMonthlyHours: 0,
        monthlyTargetHours: 1,
        monthlyPercentile: 0,
        todayCompletedHours: 0,
        todayCompletedTasks: 0,
        todayTotalTasks: 0,
        todayTaskPercentile: 0,
        activeElapsedHours: 0,
        milestonePercentile: 0,
      };
    }

    const domainTypes = getDomainTypesForCat(catId);
    const catTasks = tasks.filter((t) => domainTypes.includes(t.domain));
    const completedTasks = catTasks.filter((t) => t.completed);

    // Exact hours from today's completed tasks
    const completedMinutes = completedTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0);
    const todayCompletedHours = Number((completedMinutes / 60).toFixed(2));

    // Active live timer if running on this category
    let activeElapsedHours = 0;
    if (isRunning && activeTask && domainTypes.includes(activeTask.domain)) {
      const elapsedSeconds = Math.max(0, (activeTask.durationMin * 60) - secondsRemaining);
      activeElapsedHours = Number((elapsedSeconds / 3600).toFixed(3));
    }

    // Sessions logged
    const catSessions = sessions.filter((s) => domainTypes.includes(s.domainType));
    const sessionSeconds = catSessions.reduce((sum, s) => sum + (s.actualDurationSeconds || 0), 0);
    const sessionHours = Number((sessionSeconds / 3600).toFixed(2));

    const baseWeekly = cat.baseWeeklyHours ?? cat.currentWeeklyHours ?? 0;
    const baseMonthly = cat.baseMonthlyHours ?? (baseWeekly * 4);

    // Exact weekly calculation
    const currentWeeklyHours = Number((baseWeekly + todayCompletedHours + activeElapsedHours + sessionHours).toFixed(2));
    const weeklyTargetHours = cat.weeklyTargetHours || 1;
    const weeklyPercentile = Number(((currentWeeklyHours / weeklyTargetHours) * 100).toFixed(1));

    // Exact monthly calculation
    const currentMonthlyHours = Number((baseMonthly + todayCompletedHours + activeElapsedHours + sessionHours).toFixed(2));
    const monthlyTargetHours = cat.monthlyTargetHours || (weeklyTargetHours * 4);
    const monthlyPercentile = Number(((currentMonthlyHours / monthlyTargetHours) * 100).toFixed(1));

    const todayCompletedTasks = completedTasks.length;
    const todayTotalTasks = catTasks.length;
    const todayTaskPercentile = todayTotalTasks > 0 ? Number(((todayCompletedTasks / todayTotalTasks) * 100).toFixed(1)) : 0;

    const totalMilestones = cat.inProgressItems.length + cat.achievedItems.length + cat.upcomingItems.length;
    const milestonePercentile = totalMilestones > 0 ? Number(((cat.achievedItems.length / totalMilestones) * 100).toFixed(1)) : 0;

    return {
      currentWeeklyHours,
      weeklyTargetHours,
      weeklyPercentile,
      currentMonthlyHours,
      monthlyTargetHours,
      monthlyPercentile,
      todayCompletedHours,
      todayCompletedTasks,
      todayTotalTasks,
      todayTaskPercentile,
      activeElapsedHours,
      milestonePercentile,
    };
  };

  const addNewCategory = (newCat: CategoryPlan) => {
    setCategoryPlans((prev) => ({
      ...prev,
      [newCat.id]: newCat,
    }));

    const domainId = `domain-${newCat.id}`;
    setDomains((prev) => [
      ...prev,
      {
        id: domainId,
        domainType: newCat.id.toUpperCase() as DomainType,
        title: newCat.title,
        currentTier: 'Level 1: Novice Initiation',
        weeklyTargetHours: newCat.weeklyTargetHours,
        accentColor: newCat.color,
        currentHours: newCat.baseWeeklyHours || 0,
        config: { monthlyTargetMetric: newCat.monthlyTargetMetric },
      },
    ]);

    const goalId = `goal-${newCat.id}`;
    setGoals((prev) => [
      ...prev,
      {
        id: goalId,
        domainId: domainId,
        horizon: 'MONTHLY',
        title: newCat.monthlyGoalTitle,
        targetMetric: newCat.monthlyTargetMetric,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        progressPercentage: 0,
        isCompleted: false,
      },
    ]);
  };

  const deleteCategoryPlan = (categoryId: string) => {
    // 0. Immediately reset selectedCategoryId if it matches the deleted stream
    setSelectedCategoryId((prev) => (prev === categoryId ? null : prev));

    // 1. Remove from categoryPlans state
    setCategoryPlans((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      try {
        localStorage.setItem(`${STORAGE_KEY}_category_plans`, JSON.stringify(next));
        localStorage.setItem('neva_last_local_edit_time', new Date().toISOString());
      } catch {}
      return next;
    });

    // 2. Remove from categoryOrder state and persist
    setCategoryOrderState((prev) => {
      const next = prev.filter((id) => id !== categoryId);
      try {
        localStorage.setItem('neva_category_order_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Remove associated domain and goals
    const domainTypes = getDomainTypesForCat(categoryId);
    const domainId = `domain-${categoryId}`;
    setDomains((prev) =>
      prev.filter(
        (d) =>
          !domainTypes.includes(d.domainType) &&
          d.id !== domainId &&
          !d.id.toLowerCase().includes(categoryId.toLowerCase())
      )
    );
    setGoals((prev) =>
      prev.filter((g) => !g.id.includes(categoryId) && g.domainId !== domainId)
    );

    // 4. Remove all tasks belonging to this category from schedule
    setTasks((prev) =>
      prev.filter((t) => {
        const isMatchingDomain = domainTypes.includes(t.domain);
        const isMatchingBadge =
          t.badge &&
          (t.badge.toLowerCase().includes(categoryId.toLowerCase()) ||
            t.badge.toLowerCase().replace(/[^a-z]/g, '') ===
              categoryId.toLowerCase().replace(/[^a-z]/g, ''));
        return !isMatchingDomain && !isMatchingBadge;
      })
    );

    // 5. If active timer is running on this category, stop timer
    if (
      activeTask &&
      (domainTypes.includes(activeTask.domain) ||
        activeTask.badge?.toLowerCase().includes(categoryId.toLowerCase()))
    ) {
      stopTimer();
    }

    // 6. If selected category is the deleted one, reset
    setSelectedCategoryId((prev) => (prev === categoryId ? null : prev));
  };

  const updateCategorySchedule = (categoryId: string, summary: string[], targetHours: number) => {
    updateCategoryPlan(categoryId, {
      weeklyScheduleSummary: summary,
      weeklyTargetHours: targetHours,
    });

    const domainTypes = getDomainTypesForCat(categoryId);
    setDomains((prev) =>
      prev.map((d) => (domainTypes.includes(d.domainType) ? { ...d, weeklyTargetHours: targetHours } : d))
    );

    // Synchronize weekly cadence slots directly into recurring tasks
    const dayKeywords: Record<number, string[]> = {
      1: ['mon', 'ሰኞ', 'monday'],
      2: ['tue', 'ማክ', 'tuesday'],
      3: ['wed', 'ረቡ', 'wednesday'],
      4: ['thu', 'ሐሙ', 'thursday'],
      5: ['fri', 'አር', 'friday'],
      6: ['sat', 'ቅዳ', 'saturday'],
      7: ['sun', 'እሁ', 'sunday'],
    };

    const targetCat = categoryPlans[categoryId];
    const catTitle = targetCat?.title || categoryId;
    const catColor = targetCat?.color || '#0082ff';
    const primaryDomain = domainTypes[0] || 'OPEN_MULTIPURPOSE';

    const newRecurringTasks: ScheduleTask[] = [];

    summary.forEach((slot, slotIdx) => {
      const slotLower = slot.toLowerCase();
      for (let dow = 1; dow <= 7; dow++) {
        const kws = dayKeywords[dow];
        if (kws.some((kw) => slotLower.includes(kw))) {
          const timeMatch = slot.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/i);
          const startTime = timeMatch ? timeMatch[0] : '07:00 AM';

          const durationMatch = slot.match(/\b(\d+)\s*(?:m|min|mins|minutes)\b/i);
          const durationMin = durationMatch ? Number(durationMatch[1]) : 60;

          let cleanTitle = slot
            .replace(/^[a-z]{3,}\s*/i, '')
            .replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM)\b:?\s*/i, '')
            .replace(/\(\d+\s*m\)/i, '')
            .replace(/^[:\s-]+/, '')
            .trim();
          if (!cleanTitle) cleanTitle = `${catTitle} Focus`;

          newRecurringTasks.push({
            id: `stream-slot-${categoryId}-${dow}-${slotIdx}`,
            title: cleanTitle,
            startTime,
            durationMin,
            completed: false,
            domain: primaryDomain,
            badge: catTitle.split(' ')[0],
            color: catColor,
            dayOfWeek: dow,
            soundProfile: 'SOLFEGGIO_432',
            checklist: []
          });
        }
      }
    });

    setTasks((prev) => {
      const filtered = prev.filter((t) => !(t.id.startsWith(`stream-slot-${categoryId}-`) || (!t.date && domainTypes.includes(t.domain) && t.badge === catTitle.split(' ')[0])));
      return [...filtered, ...newRecurringTasks];
    });
  };

  const updateCategoryMonthlyDeliverable = (
    categoryId: string,
    goalTitle: string,
    metric: string,
    monthlyTargetHours: number,
    baseProgress?: number
  ) => {
    const updates: Partial<CategoryPlan> = {
      monthlyGoalTitle: goalTitle,
      monthlyTargetMetric: metric,
      monthlyTargetHours: monthlyTargetHours,
    };
    if (baseProgress !== undefined) {
      updates.monthlyProgress = baseProgress;
    }
    updateCategoryPlan(categoryId, updates);

    const domainTypes = getDomainTypesForCat(categoryId);
    setGoals((prev) =>
      prev.map((g) => {
        const match = domains.find((d) => domainTypes.includes(d.domainType));
        if (match && g.domainId === match.id && g.horizon === 'MONTHLY') {
          return {
            ...g,
            title: goalTitle,
            targetMetric: metric,
          };
        }
        return g;
      })
    );
  };

  const addCategoryDailyPlan = (categoryId: string, text: string) => {
    if (!text.trim()) return;
    setCategoryPlans((prev) => {
      const current = prev[categoryId];
      if (!current) return prev;
      const currentPlans = current.dailyPlans || [];
      const newPlan: CategoryDailyPlanItem = {
        id: `dp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text: text.trim(),
        completed: false,
      };
      return {
        ...prev,
        [categoryId]: {
          ...current,
          dailyPlans: [...currentPlans, newPlan],
        },
      };
    });
  };

  const toggleCategoryDailyPlan = (categoryId: string, planId: string) => {
    setCategoryPlans((prev) => {
      const current = prev[categoryId];
      if (!current || !current.dailyPlans) return prev;
      const updated = current.dailyPlans.map((p) => {
        if (p.id === planId) {
          const nextVal = !p.completed;
          if (nextVal) {
            confetti({
              particleCount: 25,
              spread: 45,
              origin: { y: 0.6 },
            });
          }
          return { ...p, completed: nextVal };
        }
        return p;
      });
      return {
        ...prev,
        [categoryId]: {
          ...current,
          dailyPlans: updated,
        },
      };
    });

    // Bidirectional sync with tasks checklist on Home Sticky Note
    setTasks((prev) =>
      prev.map((t) => {
        if (t.checklist && t.checklist.some((c) => c.id === planId)) {
          return {
            ...t,
            checklist: t.checklist.map((c) =>
              c.id === planId ? { ...c, done: !c.done } : c
            ),
          };
        }
        return t;
      })
    );
  };

  const deleteCategoryDailyPlan = (categoryId: string, planId: string) => {
    setCategoryPlans((prev) => {
      const current = prev[categoryId];
      if (!current || !current.dailyPlans) return prev;
      return {
        ...prev,
        [categoryId]: {
          ...current,
          dailyPlans: current.dailyPlans.filter((p) => p.id !== planId),
        },
      };
    });
  };

  const updateCategoryDailyPlan = (categoryId: string, planId: string, text: string) => {
    setCategoryPlans((prev) => {
      const current = prev[categoryId];
      if (!current || !current.dailyPlans) return prev;
      return {
        ...prev,
        [categoryId]: {
          ...current,
          dailyPlans: current.dailyPlans.map((p) => p.id === planId ? { ...p, text } : p),
        },
      };
    });
  };

  const setCategoryStickyNoteColor = (categoryId: string, color: StickyNoteColor) => {
    setCategoryPlans((prev) => {
      const current = prev[categoryId];
      if (!current) return prev;
      return {
        ...prev,
        [categoryId]: {
          ...current,
          stickyNoteColor: color,
        },
      };
    });
  };

  const toggleExerciseCompletion = (workoutId: string, exerciseIndex: number) => {
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id === workoutId) {
          const updatedList = [...w.movementList];
          const current = updatedList[exerciseIndex];
          updatedList[exerciseIndex] = {
            ...current,
            completed: !current.completed,
          };
          return { ...w, movementList: updatedList };
        }
        return w;
      })
    );
  };

  const updateWorkout = (workoutId: string, updates: Partial<WorkoutProtocol>) => {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === workoutId ? { ...w, ...updates } : w))
    );
  };

  const addExerciseToWorkout = (workoutId: string, exercise: MovementItem) => {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? { ...w, movementList: [...w.movementList, { ...exercise, completed: false }] }
          : w
      )
    );
  };

  const updateExerciseInWorkout = (
    workoutId: string,
    exerciseIndex: number,
    updates: Partial<MovementItem>
  ) => {
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id === workoutId) {
          const nextList = [...w.movementList];
          nextList[exerciseIndex] = { ...nextList[exerciseIndex], ...updates };
          return { ...w, movementList: nextList };
        }
        return w;
      })
    );
  };

  const deleteExerciseFromWorkout = (workoutId: string, exerciseIndex: number) => {
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id === workoutId) {
          const nextList = [...w.movementList];
          nextList.splice(exerciseIndex, 1);
          return { ...w, movementList: nextList };
        }
        return w;
      })
    );
  };

  const reorderExerciseInWorkout = (workoutId: string, fromIndex: number, toIndex: number) => {
    setWorkouts((prev) =>
      prev.map((w) => {
        if (w.id === workoutId) {
          const nextList = [...w.movementList];
          const [moved] = nextList.splice(fromIndex, 1);
          nextList.splice(toIndex, 0, moved);
          return { ...w, movementList: nextList };
        }
        return w;
      })
    );
  };

  const toggleMealConsumed = (mealId: string) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, consumed: !m.consumed } : m))
    );
  };

  const updateGoalProgress = (goalId: string, progress: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              progressPercentage: Math.max(0, Math.min(100, progress)),
              isCompleted: progress >= 100,
            }
          : g
      )
    );
  };

  const toggleGoalCompleted = (goalId: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              isCompleted: !g.isCompleted,
              progressPercentage: !g.isCompleted ? 100 : g.progressPercentage,
            }
          : g
      )
    );
  };

  const addGoal = (newGoal: Omit<StrategicGoal, 'id'>) => {
    const id = `goal-${Date.now()}`;
    setGoals((prev) => [...prev, { ...newGoal, id }]);
  };

  const updateGoal = (goalId: string, updates: Partial<StrategicGoal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
    );
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const logSession = (newSession: Omit<PracticeSession, 'id'>) => {
    const id = `ses-${Date.now()}`;
    setSessions((prev) => [{ ...newSession, id }, ...prev]);
    const domainHoursToAdd = newSession.actualDurationSeconds / 3600;
    setDomains((prev) =>
      prev.map((d) =>
        d.id === newSession.domainId
          ? { ...d, currentHours: Number((d.currentHours + domainHoursToAdd).toFixed(1)) }
          : d
      )
    );
    confetti({ particleCount: 50, spread: 60 });
  };

  const addReview = (newReview: Omit<FeedbackReview, 'id' | 'createdAt'>) => {
    const id = `rev-${Date.now()}`;
    const createdAt = new Date().toISOString();
    setReviews((prev) => [{ ...newReview, id, createdAt }, ...prev]);
  };

  const updateDailyStickyNoteRating = (id: string, stars: number) => {
    setDailyStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ratingStars: stars } : note))
    );
  };

  const updateDailyStickyNoteReview = (id: string, reviewText: string) => {
    setDailyStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, summaryReview: reviewText } : note))
    );
  };

  const updateDailyStickyNoteColor = (id: string, color: StickyNoteThemeColor) => {
    setDailyStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, colorTheme: color } : note))
    );
  };

  const updateDailyStickyNoteMood = (id: string, mood: string) => {
    setDailyStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, moodEmoji: mood } : note))
    );
  };

  const toggleDailyStickyTask = (noteId: string, taskId: string) => {
    setDailyStickyNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) return note;
        const updatedTasks = note.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        const doneTasks = updatedTasks.filter((t) => t.completed);
        const hoursLogged = Number((doneTasks.reduce((acc, t) => acc + (t.durationMin || 0), 0) / 60).toFixed(1));
        return {
          ...note,
          tasks: updatedTasks,
          focusHoursLogged: hoursLogged,
        };
      })
    );
  };

  const addDailyStickyNote = (newNote: Omit<DailyStickyReviewNote, 'id' | 'createdAt'>) => {
    const id = `note-${Date.now()}`;
    const createdAt = new Date().toISOString();
    setDailyStickyNotes((prev) => [{ ...newNote, id, createdAt }, ...prev]);
  };

  const deleteDailyStickyNote = (id: string) => {
    setDailyStickyNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const applySystematicPreset = (presetType: 'balanced' | 'focus' | 'reset') => {
    if (presetType === 'reset') {
      setCategoryPlans(INITIAL_CATEGORY_PLANS);
      setTasks(initialTasks);
      return;
    }
    // Boost focus hours or balanced routine
    setCategoryPlans((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (presetType === 'focus') {
          next[key] = {
            ...next[key],
            weeklyTargetHours: Number((next[key].weeklyTargetHours * 1.25).toFixed(1)),
            monthlyTargetHours: Number((next[key].monthlyTargetHours * 1.25).toFixed(1)),
          };
        } else {
          next[key] = INITIAL_CATEGORY_PLANS[key];
        }
      });
      return next;
    });
    confetti({ particleCount: 40 });
  };

  const resetAllData = () => {
    setUser(initialUser);
    setDomains(initialDomains);
    setTasks([]);
    setWorkouts(initialWorkouts);
    setMeals([]);
    setGoals([]);
    setSessions([]);
    setReviews([]);
    setDailyStickyNotes([]);
    setCategoryPlans(INITIAL_CATEGORY_PLANS);
    setSelectedCategoryId(null);
    stopTimer();
    try {
      Object.keys(localStorage).forEach((key) => {
        if ((key.startsWith('livotion_') || key.startsWith('neva_')) && 
            !key.includes('theme') && 
            !key.includes('language') && 
            !key.includes('sync_key') && 
            !key.includes('user_account') && 
            !key.includes('pwd_sha')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}

    // Synchronize the fresh reset state with Neon PostgreSQL so all paired devices reset
    syncStateToCloud({
      user: initialUser,
      domains: initialDomains,
      tasks: [],
      workouts: initialWorkouts,
      meals: [],
      goals: [],
      sessions: [],
      reviews: [],
      categoryPlans: INITIAL_CATEGORY_PLANS,
      dailyStickyNotes: [],
      dailyStickyColor: 'canary',
      iosNotes: DEFAULT_IOS_NOTES,
    }, syncKey);
  };

  const exportDataJson = () => {
    const exportBundle = {
      user,
      domains,
      tasks,
      workouts,
      meals,
      goals,
      sessions,
      reviews,
      dailyStickyNotes,
      categoryPlans,
      iosNotes,
      exportedAt: new Date().toISOString(),
      system: 'N e v a v2.0',
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neva-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.user) setUser(data.user);
      if (data.domains) setDomains(data.domains);
      if (data.tasks) setTasks(data.tasks);
      if (data.workouts) setWorkouts(data.workouts);
      if (data.meals) setMeals(data.meals);
      if (data.goals) setGoals(data.goals);
      if (data.sessions) setSessions(data.sessions);
      if (data.reviews) setReviews(data.reviews);
      if (data.dailyStickyNotes) setDailyStickyNotes(data.dailyStickyNotes);
      if (data.categoryPlans) setCategoryPlans(data.categoryPlans);
      if (data.iosNotes && Array.isArray(data.iosNotes)) setIosNotes(data.iosNotes);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  return (
    <LivotionContext.Provider
      value={{
        user,
        updateUser,
        domains,
        updateDomainHours,
        tasks,
        activeTask,
        secondsRemaining,
        isRunning,
        startTask,
        startTimerForTask: startTask,
        toggleTimer,
        stopTimer,
        toggleTaskCompletion,
        toggleChecklistItem,
        addTask,
        updateTask,
        deleteTask,
        soundProfile,
        setSoundProfile,
        triggerAlarmSound,
        workouts,
        toggleExerciseCompletion,
        updateWorkout,
        addExerciseToWorkout,
        updateExerciseInWorkout,
        deleteExerciseFromWorkout,
        reorderExerciseInWorkout,
        meals,
        toggleMealConsumed,
        goals,
        updateGoalProgress,
        toggleGoalCompleted,
        addGoal,
        updateGoal,
        deleteGoal,
        sessions,
        logSession,
        reviews,
        addReview,
        activeTab,
        setActiveTab,
        theme,
        setTheme,
        toggleTheme,
        accentColor,
        setAccentColor,
        calendarSystem,
        setCalendarSystem,
        language,
        setLanguage,
        toggleLanguage,
        t,
        getCategoryTitleTranslated,
        selectedCategoryId,
        setSelectedCategoryId,
        isSettingsModalOpen,
        openSettingsModal,
        closeSettingsModal,
        isNewCategoryModalOpen,
        openNewCategoryModal,
        closeNewCategoryModal,
        isManageCategoriesModalOpen,
        openManageCategoriesModal,
        closeManageCategoriesModal,
        restoreDefaultCategories,
        categoryPlans,
        updateCategoryPlan,
        getCategoryLiveMetrics,
        addNewCategory,
        deleteCategoryPlan,
        updateCategorySchedule,
        updateCategoryMonthlyDeliverable,
        addCategoryDailyPlan,
        toggleCategoryDailyPlan,
        deleteCategoryDailyPlan,
        updateCategoryDailyPlan,
        setCategoryStickyNoteColor,
        dailyStickyColor,
        setDailyStickyColor,
        isAutoStickyColor,
        setIsAutoStickyColor,
        dailyStickyNotes,
        updateDailyStickyNoteRating,
        updateDailyStickyNoteReview,
        updateDailyStickyNoteColor,
        updateDailyStickyNoteMood,
        toggleDailyStickyTask,
        addDailyStickyNote,
        deleteDailyStickyNote,
        applySystematicPreset,
        resetAllData,
        exportDataJson,
        importDataJson,
        syncKey,
        setSyncKey,
        cloudSyncStatus,
        cloudDatabase,
        lastSyncedAt,
        syncNow,
        isSyncModalOpen,
        openSyncModal,
        closeSyncModal,
        currentUser,
        setCurrentUser,
        hydrateCloudState,
        logoutUser,
        getDaySchedule,
        materializeDaySchedule,
        resetDayScheduleToDefault,
        saveDayAsWeekdayDefault,
        saveDayAsGlobalRoutine,
        applyDayScheduleToDates,
        updateWeekdayDefaultSchedule,
        getWeekdayDefaultTasks,
        updateDevotionRoutine,
        applyTaskActionWithScope,
        categoryOrder,
        setCategoryOrder,
        reorderCategories,
        reorderTasks,
        iosNotes,
        setIosNotes,
        addIosNote,
        updateIosNote,
        deleteIosNote,
        togglePinIosNote,
      }}
    >
      {children}
    </LivotionContext.Provider>
  );
};

export const useLivotion = () => {
  const context = useContext(LivotionContext);
  if (!context) {
    throw new Error('useLivotion must be used within a LivotionProvider');
  }
  return context;
};
