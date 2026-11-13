/**
 * Comprehensive Translations for N e v a (Execution Cockpit & Mastery OS)
 * Supports English (en) and Amharic / አማርኛ (am).
 */

export type Language = 'en' | 'am';

export interface Translations {
  // Navigation & Branding
  appName: string;
  appTagline: string;
  menu: string;
  systemViews: string;
  plan: string;
  category: string;
  reminders: string;
  themeLight: string;
  themeDark: string;
  language: string;
  languageName: string;
  switchLanguage: string;
  
  // Navigation Tabs
  navToday: string;
  navStickyGallery: string;
  navCalendar: string;
  navWorkouts: string;
  navMeals: string;
  navDevotion: string;
  navGoals: string;
  navFocusTimer: string;
  
  // Status & Timing
  hoursShort: string;
  minShort: string;
  done: string;
  inProgress: string;
  upcoming: string;
  achieved: string;
  completed: string;
  remaining: string;
  percentDone: string;
  allDone: string;
  
  // Actions
  add: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  close: string;
  back: string;
  backToToday: string;
  start: string;
  pause: string;
  resume: string;
  reset: string;
  filter: string;
  search: string;
  all: string;
  options: string;
  
  // Categories (Default Pillars)
  categoriesTitle: string;
  categoryPillar: string;
  addNewCategory: string;
  catExercise: string;
  catChess: string;
  catArt: string;
  catMusic: string;
  catArchitecture: string;
  catTrading: string;
  catDevotion: string;
  catBuffer: string;
  
  // Today Cockpit
  todayExecution: string;
  todaySubtitle: string;
  dailyView: string;
  weeklyView: string;
  monthlyView: string;
  waterIntake: string;
  glasses: string;
  focusBlockLive: string;
  startFocus: string;
  activeTimer: string;
  
  // Daily Sticky Note
  dailyStickyTitle: string;
  addMicroPlan: string;
  hideCompleted: string;
  showAllTasks: string;
  tasksCompletedBadge: string;
  addActivity: string;
  newActivityPlaceholder: string;
  timeTakenHours: string;
  
  // Sticky Notes Gallery
  galleryTitle: string;
  gallerySubtitle: string;
  pinDayStickyNote: string;
  totalNotes: string;
  avgRating: string;
  fiveStarMastery: string;
  loggedFocusHours: string;
  filterAllDays: string;
  filterFiveStar: string;
  filterHighFocus: string;
  filterNeedsReview: string;
  searchPlaceholder: string;
  winsLabel: string;
  frictionLabel: string;
  tomorrowFocusLabel: string;
  checklistLabel: string;
  reflectionLabel: string;
  rateExecutionLabel: string;
  clickStarToRate: string;
  ratingStatusUnrated: string;
  ratingStatusNeedsReview: string;
  ratingStatusFair: string;
  ratingStatusSolid: string;
  ratingStatusHighFocus: string;
  ratingStatusFlawless: string;
  
  // Modals & Forms
  pinModalTitle: string;
  pinModalDateLabel: string;
  pinModalRatingLabel: string;
  pinModalThemeLabel: string;
  pinModalMoodLabel: string;
  pinModalTasksLabel: string;
  pinModalWinsPlaceholder: string;
  pinModalFrictionPlaceholder: string;
  pinModalTomorrowPlaceholder: string;
  saveDayNote: string;
  
  // Calendar View
  calendarHeader: string;
  calendarSubtitle: string;
  ethiopianCalendarName: string;
  gregorianCalendarName: string;
  todayBadge: string;
  
  // Workouts
  workoutsHeading: string;
  workoutsSub: string;
  exercisesLabel: string;
  setsLabel: string;
  repsLabel: string;
  weightLabel: string;
  
  // Meals
  mealsHeading: string;
  mealsSub: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  caloriesLabel: string;
  proteinLabel: string;
  carbsLabel: string;
  fatsLabel: string;
  
  // Goals
  goalsHeading: string;
  goalsSub: string;
  addGoal: string;
  
  // Practice Flow
  focusTimerHeading: string;
  focusTimerSub: string;
  focusSystemPomodoro: string;
  focusSystemUltradian: string;
  focusSystemDeskTime: string;
  focusSystemSprint: string;
  focusSystemCustom: string;
  focusSystemStopwatch: string;
  
  // Category Detail View
  weeklyHours: string;
  monthlyTarget: string;
  todaysTasks: string;
  monthlyHoursPlanned: string;
  upcomingTargets: string;
  plannedRoadmap: string;
  addRoadmapItem: string;
  editWeekly: string;
  editMonthly: string;
  addTask: string;
  
  // Cloud & Backup
  backupData: string;
  restoreData: string;
  syncPostgres: string;
  resetAllDefaults: string;
  dataRestoredSuccess: string;
  dataRestoreInvalid: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    appName: 'Neva',
    appTagline: 'Execution Cockpit & Mastery OS',
    menu: 'Menu',
    systemViews: 'System Views',
    plan: 'Plan',
    category: 'Category',
    reminders: 'Reminders',
    themeLight: 'Switch to Daytime Light Mode',
    themeDark: 'Switch to Dark Mode',
    language: 'Language',
    languageName: 'English',
    switchLanguage: 'Switch to Amharic (ወደ አማርኛ ቀይር)',
    
    navToday: 'Today',
    navStickyGallery: 'Sticky Gallery ⭐',
    navCalendar: 'Calendar (🇪🇹)',
    navWorkouts: 'Workouts',
    navMeals: 'Devotion',
    navDevotion: 'Devotion',
    navGoals: 'Goals',
    navFocusTimer: 'Focus Timer',
    
    hoursShort: 'h',
    minShort: 'm',
    done: 'done',
    inProgress: 'In Progress',
    upcoming: 'Upcoming & Soon',
    achieved: 'Achieved',
    completed: 'Completed',
    remaining: 'remaining',
    percentDone: 'Done',
    allDone: 'All tasks finished today!',
    
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    back: 'Back',
    backToToday: 'Back to Today',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    filter: 'Filter',
    search: 'Search',
    all: 'All',
    options: 'Options',
    
    categoriesTitle: 'Mastery Pillars',
    categoryPillar: 'Pillar',
    addNewCategory: '+ Add Category',
    catExercise: 'Exercise & Fitness',
    catChess: 'Grandmaster Chess',
    catArt: 'Art & Oil Painting',
    catMusic: 'Flamenco & Classical Guitar',
    catArchitecture: 'Architecture & Design',
    catTrading: 'Forex & Algorithmic Trading',
    catDevotion: 'Daily Devotion & Prayer',
    catBuffer: 'Multipurpose Buffer & Flow',
    
    todayExecution: 'Today’s Execution Cockpit',
    todaySubtitle: 'Deliberate mastery, cadence, and focused execution.',
    dailyView: 'Daily',
    weeklyView: 'Weekly',
    monthlyView: 'Monthly',
    waterIntake: 'Water Intake',
    glasses: 'glasses',
    focusBlockLive: 'focus live',
    startFocus: 'Start Focus',
    activeTimer: 'Active Focus Session',
    
    dailyStickyTitle: 'Daily Activities & Priorities',
    addMicroPlan: '+ Add daily micro-plan (press Enter)...',
    hideCompleted: 'Hide Done',
    showAllTasks: 'Show All',
    tasksCompletedBadge: 'done',
    addActivity: 'Add Activity',
    newActivityPlaceholder: 'What are you working on today?',
    timeTakenHours: 'Duration (hours)',
    
    galleryTitle: 'Sticky Notes Gallery ⭐',
    gallerySubtitle: 'Review past days, reflect on execution, and rate your mastery.',
    pinDayStickyNote: '+ Pin Day Sticky Note',
    totalNotes: 'Total Notes',
    avgRating: 'Average Rating',
    fiveStarMastery: '5-Star Mastery',
    loggedFocusHours: 'Logged Focus Hours',
    filterAllDays: 'All Days',
    filterFiveStar: '5-Star Mastery ⭐',
    filterHighFocus: 'High Focus (4+h)',
    filterNeedsReview: 'Needs Review (≤3★)',
    searchPlaceholder: 'Search days, wins, activities...',
    winsLabel: 'Wins & Breakthroughs',
    frictionLabel: 'Friction Points & Adjustments',
    tomorrowFocusLabel: 'Tomorrow’s Focus',
    checklistLabel: 'Activity Checklist',
    reflectionLabel: 'Daily Review & Debrief',
    rateExecutionLabel: 'Rate Day Execution:',
    clickStarToRate: 'Tap a star to rate:',
    ratingStatusUnrated: 'Unrated',
    ratingStatusNeedsReview: 'Needs Review',
    ratingStatusFair: 'Fair',
    ratingStatusSolid: 'Solid Execution',
    ratingStatusHighFocus: 'High Focus',
    ratingStatusFlawless: 'Flawless Mastery ⭐',
    
    pinModalTitle: 'Pin New Day Sticky Note',
    pinModalDateLabel: 'Gregorian Date',
    pinModalRatingLabel: 'Execution Rating',
    pinModalThemeLabel: 'Sticky Color Theme',
    pinModalMoodLabel: 'Mood Emoji Sticker',
    pinModalTasksLabel: 'Daily Focus Tasks',
    pinModalWinsPlaceholder: 'Key breakthroughs, milestone progress, or deep focus wins...',
    pinModalFrictionPlaceholder: 'Distractions, unexpected friction, or process adjustments...',
    pinModalTomorrowPlaceholder: 'Top priorities for tomorrow’s cadence...',
    saveDayNote: 'Pin Day Note',
    
    calendarHeader: 'Integrated Ethiopian & Gregorian Calendar',
    calendarSubtitle: 'Seamless dual-calendar alignment for daily cadences and spiritual tracking.',
    ethiopianCalendarName: 'የኢትዮጵያ ዘመን አቆጣጠር',
    gregorianCalendarName: 'Gregorian Calendar',
    todayBadge: 'Today',
    
    workoutsHeading: 'Daily Movement & Physical Protocol',
    workoutsSub: 'Target hypertrophy, strength progressive overload, and active recovery.',
    exercisesLabel: 'Exercises',
    setsLabel: 'Sets',
    repsLabel: 'Reps',
    weightLabel: 'Weight',
    
    mealsHeading: 'Precision Nutrition & Meal Cadence',
    mealsSub: 'Caloric balance, macronutrient targets, and scheduled sustenance.',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
    caloriesLabel: 'Calories',
    proteinLabel: 'Protein',
    carbsLabel: 'Carbs',
    fatsLabel: 'Fats',
    
    goalsHeading: 'Strategic Horizons & Long-Term Milestones',
    goalsSub: 'High-level objectives cascaded into actionable milestones.',
    addGoal: '+ Add Strategic Goal',
    
    focusTimerHeading: 'Deliberate Practice Flow & Deep Work Timer',
    focusTimerSub: 'Pure immersion without distraction with Solfeggio soundscapes.',
    focusSystemPomodoro: 'Tomato / Pomodoro (25m / 5m)',
    focusSystemUltradian: 'Ultradian 90/20 Protocol',
    focusSystemDeskTime: '52/17 Performance Rule',
    focusSystemSprint: 'Quick Sprint (15m / 5m)',
    focusSystemCustom: 'Custom Countdown',
    focusSystemStopwatch: 'Open Stopwatch',
    
    weeklyHours: 'Weekly Hours',
    monthlyTarget: 'Monthly Target',
    todaysTasks: 'Today\'s Tasks',
    monthlyHoursPlanned: 'Monthly Hours Planned',
    upcomingTargets: 'Upcoming Targets & Next Sprints',
    plannedRoadmap: 'Planned roadmap items for the next cycle.',
    addRoadmapItem: 'Add Roadmap Item',
    editWeekly: 'Edit Weekly',
    editMonthly: 'Edit Monthly',
    addTask: 'Add Task',
    
    backupData: 'Backup Data',
    restoreData: 'Restore Data',
    syncPostgres: 'Sync PostgreSQL',
    resetAllDefaults: 'Clear All (Scratch)',
    dataRestoredSuccess: 'Data restored successfully!',
    dataRestoreInvalid: 'Invalid backup JSON file.',
  },
  am: {
    appName: 'ኔቫ',
    appTagline: 'የዕለታዊ ትኩረትና የልህቀት ማስፈጸሚያ ሥርዓት',
    menu: 'ማውጫ',
    systemViews: 'የስርዓቱ ገጾች',
    plan: 'እቅድ',
    category: 'ዘርፍ',
    reminders: 'ማስታወሻ',
    themeLight: 'ወደ ብሩህ ቀን ገጽታ ቀይር',
    themeDark: 'ወደ ማታ ገጽታ ቀይር',
    language: 'ቋንቋ',
    languageName: 'አማርኛ',
    switchLanguage: 'Switch to English (ወደ እንግሊዝኛ ቀይር)',
    
    navToday: 'ዛሬ',
    navStickyGallery: 'ስቲኪ ማስታወሻ ⭐',
    navCalendar: 'ቀን መቁጠሪያ (🇪🇹)',
    navWorkouts: 'ስፖርት',
    navMeals: 'ጸሎት',
    navDevotion: 'ጸሎት',
    navGoals: 'ግቦች',
    navFocusTimer: 'የትኩረት ሰዓት',
    
    hoursShort: 'ሰዓት',
    minShort: 'ደቂቃ',
    done: 'ተጠናቋል',
    inProgress: 'በሂደት ላይ',
    upcoming: 'ቀጣይ እቅዶች',
    achieved: 'የተሳኩ ግቦች',
    completed: 'የተጠናቀቀ',
    remaining: 'የቀረ',
    percentDone: 'የተጠናቀቀ',
    allDone: 'የዛሬ ተግባራት በሙሉ ተጠናቀዋል!',
    
    add: 'ጨምር',
    edit: 'አስተካክል',
    delete: 'ሰርዝ',
    save: 'አስቀምጥ',
    cancel: 'ይቅር',
    close: 'ዝጋ',
    back: 'ተመለስ',
    backToToday: 'ወደ ዛሬ ተመለስ',
    start: 'ጀምር',
    pause: 'ለአፍታ አቁም',
    resume: 'ቀጥል',
    reset: 'ዳግም ጀምር',
    filter: 'አጣራ',
    search: 'ፈልግ',
    all: 'ሁሉም',
    options: 'አማራጮች',
    
    categoriesTitle: 'ዋና የልህቀት ዘርፎች',
    categoryPillar: 'ዋና ዘርፍ',
    addNewCategory: '+ አዲስ ዘርፍ ጨምር',
    catExercise: 'ስፖርትና የአካል ብቃት',
    catChess: 'የቼስ ልህቀት',
    catArt: 'ስነ-ጥበብና የዘይት ቀለም ሥዕል',
    catMusic: 'ጊታርና ሙዚቃ',
    catArchitecture: 'አርክቴክቸርና ዲዛይን',
    catTrading: 'የውጭ ምንዛሪ ንግድ (Forex)',
    catDevotion: 'የዕለት ጸሎትና መንፈሳዊ ህይወት',
    catBuffer: 'ተለዋዋጭ የመጠባበቂያ ጊዜ',
    
    todayExecution: 'የዛሬ የትኩረትና የማስፈጸሚያ ማዕከል',
    todaySubtitle: 'የታቀደ ልህቀት፣ ተከታታይ ስራ እና ከፍተኛ የትኩረት አፈጻጸም።',
    dailyView: 'ዕለታዊ',
    weeklyView: 'ሳምንታዊ',
    monthlyView: 'ወርሃዊ',
    waterIntake: 'የውሃ መጠጥ',
    glasses: 'ብርጭቆ',
    focusBlockLive: 'ትኩረት በስራ ላይ',
    startFocus: 'ትኩረት ጀምር',
    activeTimer: 'ንቁ የትኩረት ክፍለ-ጊዜ',
    
    dailyStickyTitle: 'የዕለቱ ተግባራትና ቅድሚያ የሚሰጣቸው',
    addMicroPlan: '+ ዕለታዊ ተግባር ጻፍና Enter ንካ...',
    hideCompleted: 'የተጠናቀቁትን ደብቅ',
    showAllTasks: 'ሁሉንም አሳይ',
    tasksCompletedBadge: 'ተጠናቋል',
    addActivity: 'ተግባር መዝግብ',
    newActivityPlaceholder: 'ዛሬ ምን ላይ ያተኩራሉ?',
    timeTakenHours: 'የሚፈጀው ጊዜ (ሰዓት)',
    
    galleryTitle: 'የዕለታዊ ስቲኪ ማስታወሻዎች ማዕከል ⭐',
    gallerySubtitle: 'ያለፉትን ቀናት ይገምግሙ፣ አፈጻጸምዎን ይመርምሩ እና የትኩረት ደረጃዎን በኮከብ ይስጡ።',
    pinDayStickyNote: '+ አዲስ ዕለታዊ ማስታወሻ ጀምር',
    totalNotes: 'ጠቅላላ ማስታወሻዎች',
    avgRating: 'አማካይ ደረጃ',
    fiveStarMastery: 'ባለ 5-ኮከብ ልህቀት',
    loggedFocusHours: 'የተመዘገበ የትኩረት ሰዓታት',
    filterAllDays: 'ሁሉም ቀናት',
    filterFiveStar: 'ባለ 5 ኮከብ ⭐',
    filterHighFocus: 'ከፍተኛ ትኩረት (4+ ሰዓት)',
    filterNeedsReview: 'ክለሳ የሚያስፈልጋቸው (≤3★)',
    searchPlaceholder: 'ቀናት፣ ስኬቶች፣ ተግባራት ይፈልጉ...',
    winsLabel: 'ስኬቶችና የተከናወኑ ድሎች',
    frictionLabel: 'ተግዳሮቶችና መሻሻል ያለባቸው',
    tomorrowFocusLabel: 'የነገ ዋና የትኩረት አቅጣጫ',
    checklistLabel: 'የዕለቱ ተግባራት ዝርዝር',
    reflectionLabel: 'የዕለቱ ግምገማና ማጠቃለያ',
    rateExecutionLabel: 'የዕለቱን አፈጻጸም ደረጃ ይስጡ:',
    clickStarToRate: 'ደረጃ ለመስጠት ኮከብ ይንኩ:',
    ratingStatusUnrated: 'ደረጃ አልተሰጠም',
    ratingStatusNeedsReview: 'ክለሳ ያስፈልገዋል',
    ratingStatusFair: 'መካከለኛ',
    ratingStatusSolid: 'ጥሩ አፈጻጸም',
    ratingStatusHighFocus: 'ከፍተኛ ትኩረት',
    ratingStatusFlawless: 'ፍጹም ልህቀት ⭐',
    
    pinModalTitle: 'አዲስ የዕለት ስቲኪ ማስታወሻ መዝግብ',
    pinModalDateLabel: 'ቀን (የፈረንጆች)',
    pinModalRatingLabel: 'የትኩረት አፈጻጸም ደረጃ',
    pinModalThemeLabel: 'የማስታወሻው ቀለም ገጽታ',
    pinModalMoodLabel: 'የዕለቱ ስሜት ምልክት',
    pinModalTasksLabel: 'የዕለቱ የትኩረት ተግባራት',
    pinModalWinsPlaceholder: 'ዋና ዋና ስኬቶች፣ የተከናወኑ ስራዎች ወይም ከፍተኛ የትኩረት ድሎች...',
    pinModalFrictionPlaceholder: 'ትኩረት የከፋፈሉ ነገሮች፣ ያልተጠበቁ ተግዳሮቶች ወይም ማስተካከያዎች...',
    pinModalTomorrowPlaceholder: 'ለነገ ቅድሚያ የሚሰጣቸው ዋና ተግባራት...',
    saveDayNote: 'ማስታወሻውን መዝግብ',
    
    calendarHeader: 'የተቀናጀ የኢትዮጵያና የፈረንጅ ቀን መቁጠሪያ',
    calendarSubtitle: 'ለዕለታዊ ስራዎች እና ለመንፈሳዊ ቀናት የተዋሃደ የቀን መቁጠሪያ ስርዓት።',
    ethiopianCalendarName: 'የኢትዮጵያ ዘመን አቆጣጠር',
    gregorianCalendarName: 'የፈረንጆች ቀን መቁጠሪያ',
    todayBadge: 'ዛሬ',
    
    workoutsHeading: 'የዕለት እንቅስቃሴና የአካል ብቃት ፕሮግራም',
    workoutsSub: 'የጡንቻ እድገት፣ የክብደት ማሳደግ እና የአካል ጥንካሬ ልምምድ።',
    exercisesLabel: 'ልምምዶች',
    setsLabel: 'ሴቶች',
    repsLabel: 'ድግግሞሽ',
    weightLabel: 'ክብደት',
    
    mealsHeading: 'ትክክለኛ የአመጋገብ እቅድና ሰዓታት',
    mealsSub: 'የካሎሪ ሚዛን፣ የፕሮቲንና ንጥረ ነገሮች መጠን እና ጤናማ አመጋገብ።',
    breakfast: 'ቁርስ',
    lunch: 'ምሳ',
    dinner: 'እራት',
    snacks: 'መክሰስ',
    caloriesLabel: 'ካሎሪ',
    proteinLabel: 'ፕሮቲን',
    carbsLabel: 'ካርቦሃይድሬት',
    fatsLabel: 'ቅባት',
    
    goalsHeading: 'ስትራቴጂካዊ ግቦችና የረጅም ጊዜ ራዕዮች',
    goalsSub: 'ከፍተኛ ግቦችን ወደ ተጨባጭ የዕለት ደረጃዎች መተርጎም።',
    addGoal: '+ አዲስ ስትራቴጂካዊ ግብ ጨምር',
    
    focusTimerHeading: 'የትኩረት ስራ ሰዓት ቆጣሪ (Deep Work)',
    focusTimerSub: 'ያለ ምንም ትኩረት መበታተን በሶልፌጂዮ ድምፅ ተመስጦ የመስራት ሂደት።',
    focusSystemPomodoro: 'የቲማቲም ዘዴ (ፖሞዶሮ 25ደ / 5ደ)',
    focusSystemUltradian: 'የ90/20 ጥልቅ የትኩረት ሥርዓት',
    focusSystemDeskTime: 'የ52/17 የውጤታማነት ደንብ',
    focusSystemSprint: 'ፈጣን ስፕሪንት (15ደ / 5ደ)',
    focusSystemCustom: 'ብጁ የቆጣሪ ሰዓት',
    focusSystemStopwatch: 'ክፍት የሰከንድ ቆጣሪ',
    
    weeklyHours: 'ሳምንታዊ ሰዓታት',
    monthlyTarget: 'ወርሃዊ ዒላማ',
    todaysTasks: 'የዛሬ ተግባራት',
    monthlyHoursPlanned: 'የታቀደ ወርሃዊ ሰዓታት',
    upcomingTargets: 'ቀጣይ ዒላማዎችና ደረጃዎች',
    plannedRoadmap: 'ለቀጣዩ ዙር የታቀዱ የልህቀት ግቦች።',
    addRoadmapItem: 'ግቡን መዝግብ',
    editWeekly: 'ሳምንታዊ አድስ',
    editMonthly: 'ወርሃዊ አድስ',
    addTask: 'ተግባር ጨምር',
    
    backupData: 'ምትኬ ዳታ አስቀምጥ',
    restoreData: 'ምትኬ መልስ',
    syncPostgres: 'PostgreSQL ክላውድ አመሳስል',
    resetAllDefaults: 'ሁሉንም አጥፋ (Scratch)',
    dataRestoredSuccess: 'ዳታው በተሳካ ሁኔታ ተመልሷል!',
    dataRestoreInvalid: 'ትክክለኛ ያልሆነ የJSON ፋይል ነው።',
  }
};

export function getTranslation(key: keyof Translations, lang: Language): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

export function getTranslatedCategoryTitle(catId: string, currentTitle: string, lang: Language): string {
  if (lang === 'en') return currentTitle;
  const amharicTitles: Record<string, string> = {
    exercise: 'ስፖርትና የአካል ብቃት',
    chess: 'የቼስ ልህቀት',
    art: 'ስነ-ጥበብና የዘይት ቀለም ሥዕል',
    music: 'ጊታርና ሙዚቃ',
    architecture: 'አርክቴክቸርና ዲዛይን',
    trading: 'የውጭ ምንዛሪ ንግድ (Forex)',
    devotion: 'የዕለት ጸሎትና መንፈሳዊ ህይወት',
    buffer: 'ተለዋዋጭ የመጠባበቂያ ጊዜ',
  };
  return amharicTitles[catId] || currentTitle;
}
