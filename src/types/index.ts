export type DomainType =
  | 'PHYSICAL_FITNESS'
  | 'NUTRITION_MEALS'
  | 'DEVOTION_PRAYER'
  | 'FOREX_TRADING'
  | 'ARCHITECTURE_DESIGN'
  | 'SITE_SUPERVISION'
  | 'CHESS'
  | 'GUITAR'
  | 'OIL_PAINTING'
  | 'CONTENT_CREATION'
  | 'OPEN_MULTIPURPOSE'
  | 'RECREATION'
  | (string & {});

export type HorizonLevel = 'YEARLY' | 'QUARTERLY' | 'MONTHLY' | 'WEEKLY';

export type PriorityLevel = 'SPIRITUAL' | 'DEEP_WORK' | 'PHYSICAL' | 'SITE_OPS' | 'FLEX_BUFFER';

export type ExerciseCategory =
  | 'STRENGTH_COMPOUND'
  | 'HYPERTROPHY'
  | 'ZONE_2_CARDIO'
  | 'HIIT'
  | 'MOBILITY_FLEXIBILITY'
  | 'ACTIVE_RECOVERY'
  | (string & {});

export type MealType = 'BREAKFAST' | 'LUNCH' | 'PRE_WORKOUT' | 'POST_WORKOUT' | 'DINNER' | 'SNACK';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  timezone: string;
  targetDailyCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatsGrams: number;
}

export interface SkillDomain {
  id: string;
  domainType: DomainType;
  title: string;
  currentTier: string;
  weeklyTargetHours: number;
  accentColor: string;
  currentHours: number;
  config: Record<string, any>;
}

export interface MovementItem {
  id?: string;
  exercise: string;
  sets: number;
  reps: string;
  rpe?: number;
  notes?: string;
  completed?: boolean;
}

export interface WorkoutProtocol {
  id: string;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  workoutName: string;
  exerciseType: ExerciseCategory;
  targetDurationMinutes: number;
  movementList: MovementItem[];
  completedToday?: boolean;
}

export interface MealPlan {
  id: string;
  dayOfWeek: number;
  mealCategory: MealType;
  mealTitle: string;
  scheduledTime: string; // "07:30 AM" or "07:30:00"
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  ingredients: string[];
  prepInstructions?: string;
  consumed?: boolean;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetDate?: string;
  isCompleted: boolean;
}

export interface StrategicGoal {
  id: string;
  domainId?: string;
  category?: string;
  parentGoalId?: string;
  horizon: HorizonLevel;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year?: number;
  title: string;
  targetMetric?: string;
  startDate: string;
  endDate: string;
  progressPercentage: number;
  isCompleted: boolean;
  milestones?: GoalMilestone[];
  notes?: string;
}

export interface ScheduleTask {
  id: string;
  domain: DomainType;
  title: string;
  startTime: string;
  durationMin: number;
  completed: boolean;
  color: string;
  badge?: string;
  priority?: PriorityLevel;
  checklist?: { id: string; text: string; done: boolean }[];
  soundProfile?: string;
  date?: string;
  dayOfWeek?: number;
}

export interface PracticeSession {
  id: string;
  domainId: string;
  domainType: DomainType;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  actualDurationSeconds: number;
  flowStateRating: number; // 1-5
  notesMarkdown: string;
  metricsSnapshot: Record<string, any>;
}

export interface FeedbackReview {
  id: string;
  horizonReviewed: HorizonLevel;
  periodStart: string;
  periodEnd: string;
  totalHoursLogged: number;
  hoursPerDomain: Record<string, number>;
  adherenceRates: Record<string, string>;
  winsSummary: string;
  frictionPoints: string;
  adjustmentsForNextCycle: string;
  createdAt: string;
}

export interface AlertTrigger {
  id: string;
  taskId: string;
  triggerTime: string;
  soundProfile: 'CHIME_MEDITATION' | 'TIBETAN_BOWL' | 'ZEN_GONG' | 'DIGITAL_ALERT' | 'SOLFEGGIO_432';
  isPersistent: boolean;
  isDismissed: boolean;
}

export type StickyNoteThemeColor = 'canary' | 'peach' | 'mint' | 'sky' | 'rose' | 'lavender';

export interface DailyStickyTaskItem {
  id: string;
  title: string;
  startTime?: string;
  durationMin: number;
  completed: boolean;
  category?: string;
}

export interface DailyStickyReviewNote {
  id: string;
  dateStr: string; // e.g. "2026-11-11"
  dayName: string; // e.g. "Wednesday"
  ethiopianDateStr?: string; // e.g. "ረቡዕ • ጥቅምት 2, 2019"
  ratingStars: number; // 1 to 5
  colorTheme: StickyNoteThemeColor;
  moodEmoji: string; // 🔥, ⚡, 🎯, 🧘, 🏆, ✨, ☕
  summaryReview: string;
  wins: string[];
  frictionPoints?: string;
  tomorrowFocus?: string;
  focusHoursLogged: number;
  totalTargetHours: number;
  tasks: DailyStickyTaskItem[];
  createdAt: string;
}
