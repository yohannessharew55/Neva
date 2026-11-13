import React, { createContext, useContext, useState, useEffect } from 'react';
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
  DailyStickyTaskItem
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
import { soundEngine } from '../utils/audio';
import { 
  syncStateToCloud, 
  fetchStateFromCloud, 
  UserAccountProfile, 
  getStoredUserAccount, 
  saveAccountToStorage, 
  clearStoredUserAccount 
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

export type StickyNoteColor = 'yellow' | 'mint' | 'cyan' | 'peach' | 'rose' | 'lavender';

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
    dailyPlans: []
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
    dailyPlans: []
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
    dailyPlans: []
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
    dailyPlans: []
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
    dailyPlans: []
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
    dailyPlans: []
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
    dailyPlans: []
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
    dailyPlans: []
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
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
  getCategoryTitleTranslated: (catId: string, currentTitle: string) => string;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (categoryId: string | null) => void;
  isNewCategoryModalOpen: boolean;
  openNewCategoryModal: () => void;
  closeNewCategoryModal: () => void;
  categoryPlans: Record<string, CategoryPlan>;
  updateCategoryPlan: (categoryId: string, updates: Partial<CategoryPlan>) => void;
  getCategoryLiveMetrics: (categoryId: string) => CategoryLiveMetrics;
  addNewCategory: (newCategory: CategoryPlan) => void;
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
}

const LivotionContext = createContext<LivotionContextType | undefined>(undefined);

const OLD_STORAGE_KEY = 'livotion_mastery_state_v2';
const STORAGE_KEY = 'neva_mastery_scratch_v1';

export const LivotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [domains, setDomains] = useState<SkillDomain[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_domains`);
    return saved ? JSON.parse(saved) : initialDomains;
  });

  const [tasks, setTasks] = useState<ScheduleTask[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [workouts, setWorkouts] = useState<WorkoutProtocol[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_workouts`);
    return saved ? JSON.parse(saved) : initialWorkouts;
  });

  const [meals, setMeals] = useState<MealPlan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_meals`);
    return saved ? JSON.parse(saved) : initialMeals;
  });

  const [goals, setGoals] = useState<StrategicGoal[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_goals`);
    return saved ? JSON.parse(saved) : initialGoals;
  });

  const [sessions, setSessions] = useState<PracticeSession[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sessions`);
    return saved ? JSON.parse(saved) : initialSessions;
  });

  const [reviews, setReviews] = useState<FeedbackReview[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reviews`);
    return saved ? JSON.parse(saved) : initialReviews;
  });

  const [categoryPlans, setCategoryPlans] = useState<Record<string, CategoryPlan>>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_category_plans`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_CATEGORY_PLANS;
      }
    }
    return INITIAL_CATEGORY_PLANS;
  });

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
  const [soundProfile, setSoundProfile] = useState<string>('CHIME_MEDITATION');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_theme`) || localStorage.getItem(`${OLD_STORAGE_KEY}_theme`);
    return (saved === 'dark' ? 'dark' : 'light');
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_language`) || localStorage.getItem(`${OLD_STORAGE_KEY}_language`);
    return (saved === 'am' ? 'am' : 'en');
  });

  // Purge deprecated v2 seed data so user starts completely from scratch
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('livotion_mastery_state_v2_') && !key.includes('theme') && !key.includes('language')) {
          localStorage.removeItem(key);
        }
      });
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

  // Timer states
  const [activeTask, setActiveTask] = useState<ScheduleTask | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

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
  };
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error' | 'initial_pull'>('initial_pull');
  const [cloudDatabase, setCloudDatabase] = useState<string>('PostgreSQL (Neon)');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isCloudHydrated, setIsCloudHydrated] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  const openSyncModal = () => setIsSyncModalOpen(true);
  const closeSyncModal = () => setIsSyncModalOpen(false);

  const setSyncKey = (key: string) => {
    const trimmed = key.trim() || 'default_user';
    setSyncKeyState(trimmed);
    localStorage.setItem(`${STORAGE_KEY}_sync_key`, trimmed);
  };

  // Initial pull from Neon PostgreSQL on app startup / syncKey change
  useEffect(() => {
    let isMounted = true;
    const loadFromCloud = async () => {
      try {
        setCloudSyncStatus('initial_pull');
        const remote = await fetchStateFromCloud(syncKey);
        if (remote && remote.data && isMounted) {
          const d = remote.data;
          // Hydrate from cloud if data exists
          if (d.tasks || d.workouts || d.meals || d.goals || d.categoryPlans || d.dailyStickyNotes || d.user) {
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
            if (remote.database) setCloudDatabase(remote.database);
            setLastSyncedAt(remote.updatedAt || new Date().toISOString());
            setCloudSyncStatus('synced');
          } else {
            setCloudSyncStatus('synced');
          }
        } else {
          setCloudSyncStatus('synced');
        }
      } catch (err) {
        console.warn('Initial cloud sync error:', err);
        setCloudSyncStatus('offline');
      } finally {
        if (isMounted) {
          setIsCloudHydrated(true);
        }
      }
    };

    loadFromCloud();
    return () => { isMounted = false; };
  }, [syncKey]);

  // Persist locally & debounced sync to PostgreSQL (only after initial hydration)
  useEffect(() => {
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

    if (!isCloudHydrated) return;

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
      }, syncKey);

      if (res.success) {
        setCloudSyncStatus('synced');
        if (res.database) setCloudDatabase(res.database);
        setLastSyncedAt(res.updatedAt || new Date().toISOString());
      } else {
        setCloudSyncStatus('offline');
      }
    }, 1500);

    return () => clearTimeout(syncTimer);
  }, [user, domains, tasks, workouts, meals, goals, sessions, reviews, categoryPlans, dailyStickyNotes, isCloudHydrated, syncKey]);

  const syncNow = async (customSyncKey?: string): Promise<boolean> => {
    const keyToUse = (customSyncKey || syncKey).trim() || 'default_user';
    if (customSyncKey && customSyncKey !== syncKey) {
      setSyncKey(keyToUse);
    }
    setCloudSyncStatus('syncing');
    try {
      const remote = await fetchStateFromCloud(keyToUse);
      if (remote && remote.data) {
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
        if (remote.database) setCloudDatabase(remote.database);
        setLastSyncedAt(remote.updatedAt || new Date().toISOString());
        setCloudSyncStatus('synced');
        return true;
      } else {
        // If remote is empty, push current state to cloud
        const pushRes = await syncStateToCloud({
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
        }, keyToUse);
        if (pushRes.success) {
          setCloudSyncStatus('synced');
          setLastSyncedAt(pushRes.updatedAt || new Date().toISOString());
          return true;
        }
      }
      setCloudSyncStatus('synced');
      return false;
    } catch (e) {
      setCloudSyncStatus('offline');
      return false;
    }
  };

  // Timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            soundEngine.playSound(activeTask?.soundProfile || soundProfile);
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
            setIsRunning(false);
            if (activeTask) {
              toggleTaskCompletion(activeTask.id);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, activeTask, soundProfile]);

  const startTask = (task: ScheduleTask) => {
    setActiveTask(task);
    setSecondsRemaining(task.durationMin * 60);
    setIsRunning(true);
    soundEngine.playSound('SOLFEGGIO_432');
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setActiveTask(null);
    setSecondsRemaining(0);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            soundEngine.playSound('CHIME_MEDITATION');
          }
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
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
  };

  const addTask = (newTask: Omit<ScheduleTask, 'id'>) => {
    const id = `task-${Date.now()}`;
    setTasks((prev) => [...prev, { ...newTask, id }]);
  };

  const updateTask = (taskId: string, updates: Partial<ScheduleTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    if (activeTask?.id === taskId) {
      setActiveTask((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTask?.id === taskId) {
      stopTimer();
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
      const current = prev[categoryId] || INITIAL_CATEGORY_PLANS[categoryId];
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
    const cat = categoryPlans[catId] || INITIAL_CATEGORY_PLANS[catId];
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

  const updateCategorySchedule = (categoryId: string, summary: string[], targetHours: number) => {
    updateCategoryPlan(categoryId, {
      weeklyScheduleSummary: summary,
      weeklyTargetHours: targetHours,
    });

    const domainTypes = getDomainTypesForCat(categoryId);
    setDomains((prev) =>
      prev.map((d) => (domainTypes.includes(d.domainType) ? { ...d, weeklyTargetHours: targetHours } : d))
    );
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
      const current = prev[categoryId] || INITIAL_CATEGORY_PLANS[categoryId];
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
      const current = prev[categoryId] || INITIAL_CATEGORY_PLANS[categoryId];
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
  };

  const deleteCategoryDailyPlan = (categoryId: string, planId: string) => {
    setCategoryPlans((prev) => {
      const current = prev[categoryId] || INITIAL_CATEGORY_PLANS[categoryId];
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
      const current = prev[categoryId] || INITIAL_CATEGORY_PLANS[categoryId];
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
      const current = prev[categoryId] || INITIAL_CATEGORY_PLANS[categoryId];
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
        toggleTheme,
        language,
        setLanguage,
        toggleLanguage,
        t,
        getCategoryTitleTranslated,
        selectedCategoryId,
        setSelectedCategoryId,
        isNewCategoryModalOpen,
        openNewCategoryModal,
        closeNewCategoryModal,
        categoryPlans,
        updateCategoryPlan,
        getCategoryLiveMetrics,
        addNewCategory,
        updateCategorySchedule,
        updateCategoryMonthlyDeliverable,
        addCategoryDailyPlan,
        toggleCategoryDailyPlan,
        deleteCategoryDailyPlan,
        updateCategoryDailyPlan,
        setCategoryStickyNoteColor,
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
