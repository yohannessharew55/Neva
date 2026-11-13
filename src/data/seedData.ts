import { 
  SkillDomain, 
  WorkoutProtocol, 
  MealPlan, 
  StrategicGoal, 
  ScheduleTask, 
  PracticeSession, 
  FeedbackReview,
  UserProfile,
  DailyStickyReviewNote
} from '../types';

export const initialUser: UserProfile = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'mastery@neva.app',
  fullName: 'Neva Practitioner',
  timezone: 'UTC',
  targetDailyCalories: 2000,
  targetProteinGrams: 150,
  targetCarbsGrams: 200,
  targetFatsGrams: 65,
};

export const initialDomains: SkillDomain[] = [
  {
    id: 'dom-1',
    domainType: 'PHYSICAL_FITNESS',
    title: 'Physical Fitness & Conditioning',
    currentTier: 'Starting Tier',
    weeklyTargetHours: 5.0,
    currentHours: 0,
    accentColor: '#EF4444',
    config: { split: 'Custom Split', default_gym_duration: 60 },
  },
  {
    id: 'dom-2',
    domainType: 'NUTRITION_MEALS',
    title: 'Precision Nutrition & Meal Timing',
    currentTier: 'Starting Tier',
    weeklyTargetHours: 3.0,
    currentHours: 0,
    accentColor: '#10B981',
    config: { daily_calories: 2000, protein_g: 150, carbs_g: 200, fats_g: 65 },
  },
  {
    id: 'dom-3',
    domainType: 'DEVOTION_PRAYER',
    title: 'Devotion & Spiritual Anchor',
    currentTier: 'Spiritual Core',
    weeklyTargetHours: 5.0,
    currentHours: 0,
    accentColor: '#A855F7',
    config: { scripture_plan: '', prayer_duration_min: 30 },
  },
  {
    id: 'dom-4',
    domainType: 'FOREX_TRADING',
    title: 'Forex Trading',
    currentTier: 'Starting Tier',
    weeklyTargetHours: 5.0,
    currentHours: 0,
    accentColor: '#059669',
    config: { sessions: [], pairs: [] },
  },
  {
    id: 'dom-5',
    domainType: 'ARCHITECTURE_DESIGN',
    title: 'Architectural Design',
    currentTier: 'Starting Tier',
    weeklyTargetHours: 10.0,
    currentHours: 0,
    accentColor: '#3B82F6',
    config: { cad_tools: [], focus_deliverable: '' },
  },
  {
    id: 'dom-6',
    domainType: 'CHESS',
    title: 'Chess Mastery',
    currentTier: 'Starting Tier',
    weeklyTargetHours: 5.0,
    currentHours: 0,
    accentColor: '#8B5CF6',
    config: { focus: '' },
  },
  {
    id: 'dom-7',
    domainType: 'GUITAR',
    title: 'Guitar & Music Practice',
    currentTier: 'Starting Tier',
    weeklyTargetHours: 5.0,
    currentHours: 0,
    accentColor: '#EC4899',
    config: { bpm_target: '', focus: '' },
  },
  {
    id: 'dom-8',
    domainType: 'OIL_PAINTING',
    title: 'Oil Painting & Fine Art',
    currentTier: 'Starting Tier',
    weeklyTargetHours: 5.0,
    currentHours: 0,
    accentColor: '#E11D48',
    config: { technique: '', subject: '' },
  },
];

// Clean scratch state: Zero pre-filled tasks so the user can start from scratch
export const initialTasks: ScheduleTask[] = [];

// Clean workout templates: 7 days with zero pre-filled exercises
export const initialWorkouts: WorkoutProtocol[] = [
  {
    id: 'wo-1',
    dayOfWeek: 1,
    workoutName: 'Monday: Workout Routine',
    exerciseType: 'STRENGTH_COMPOUND',
    targetDurationMinutes: 60,
    movementList: [],
  },
  {
    id: 'wo-2',
    dayOfWeek: 2,
    workoutName: 'Tuesday: Workout Routine',
    exerciseType: 'STRENGTH_COMPOUND',
    targetDurationMinutes: 60,
    movementList: [],
  },
  {
    id: 'wo-3',
    dayOfWeek: 3,
    workoutName: 'Wednesday: Cardio & Mobility',
    exerciseType: 'ZONE_2_CARDIO',
    targetDurationMinutes: 45,
    movementList: [],
  },
  {
    id: 'wo-4',
    dayOfWeek: 4,
    workoutName: 'Thursday: Workout Routine',
    exerciseType: 'HYPERTROPHY',
    targetDurationMinutes: 60,
    movementList: [],
  },
  {
    id: 'wo-5',
    dayOfWeek: 5,
    workoutName: 'Friday: Workout Routine',
    exerciseType: 'HYPERTROPHY',
    targetDurationMinutes: 60,
    movementList: [],
  },
  {
    id: 'wo-6',
    dayOfWeek: 6,
    workoutName: 'Saturday: Conditioning & Active',
    exerciseType: 'HIIT',
    targetDurationMinutes: 45,
    movementList: [],
  },
  {
    id: 'wo-7',
    dayOfWeek: 7,
    workoutName: 'Sunday: Rest & Recovery',
    exerciseType: 'ACTIVE_RECOVERY',
    targetDurationMinutes: 30,
    movementList: [],
  },
];

// Clean scratch state: Zero pre-filled meals
export const initialMeals: MealPlan[] = [];

// Clean scratch state: Zero pre-filled goals
export const initialGoals: StrategicGoal[] = [];

// Clean scratch state: Zero pre-filled sessions
export const initialSessions: PracticeSession[] = [];

// Clean scratch state: Zero pre-filled feedback reviews
export const initialReviews: FeedbackReview[] = [];

// Clean scratch state: Zero pre-filled daily sticky notes
export const initialDailyStickyNotes: DailyStickyReviewNote[] = [];
