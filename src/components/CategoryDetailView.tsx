import React, { useState } from 'react';
import { 
  ArrowLeft, Play, CheckCircle2, Clock, 
  Plus, Target, Award, Calendar, CheckSquare, 
  Square, Sparkles, TrendingUp, ChevronRight,
  Flame, Swords, Palette, Music, Dumbbell,
  Building2, BookOpen, Shield, Edit3, Trash2, 
  ChevronDown, ChevronUp, Layers, Check, Save, X
} from 'lucide-react';
import { useLivotion, CategoryPlan } from '../context/LivotionContext';
import { DomainType, ScheduleTask } from '../types';
import { DailyPlansStickyCard } from './DailyPlansStickyCard';
import { CategoryFocusSessionModal } from './CategoryFocusSessionModal';

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
    deleteTask,
    language,
    t,
    getCategoryTitleTranslated
  } = useLivotion();

  const [activeTab, setActiveTab] = useState<'overview' | 'inprogress' | 'achieved' | 'upcoming'>('overview');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditDailyModal, setShowEditDailyModal] = useState(false);
  const [showEditWeeklyModal, setShowEditWeeklyModal] = useState(false);
  const [showEditMonthlyModal, setShowEditMonthlyModal] = useState(false);
  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);
  const [showMonthlyDetail, setShowMonthlyDetail] = useState(false);
  const [showStickyDrawer, setShowStickyDrawer] = useState(false);
  const [showFocusSessionModal, setShowFocusSessionModal] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('06:00 PM');
  const [taskDuration, setTaskDuration] = useState(45);

  // Daily focus & block modal state
  const [newDailyPlanText, setNewDailyPlanText] = useState('');
  const [dailyBlockTitle, setDailyBlockTitle] = useState('');
  const [dailyBlockTime, setDailyBlockTime] = useState('08:00 AM');
  const [dailyBlockDuration, setDailyBlockDuration] = useState(45);

  // New item input
  const [newItemText, setNewItemText] = useState('');

  const category = (selectedCategoryId && categoryPlans[selectedCategoryId]) 
    ? categoryPlans[selectedCategoryId] 
    : categoryPlans['chess'];

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

  // Monthly Deliverable Edit form states
  const [editGoalTitle, setEditGoalTitle] = useState(category.monthlyGoalTitle);
  const [editTargetMetric, setEditTargetMetric] = useState(category.monthlyTargetMetric);
  const [editMonthlyTargetHours, setEditMonthlyTargetHours] = useState(category.monthlyTargetHours);

  const getIcon = (id: string) => {
    switch (id) {
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

  const Icon = getIcon(category.id);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask({
      domain: domainTypes[0],
      title: taskTitle,
      startTime: taskTime,
      durationMin: Number(taskDuration),
      completed: false,
      color: category.color,
      badge: category.title.split(' ')[0],
      checklist: [
        { id: `c-${Date.now()}-1`, text: 'Warm-up & context immersion', done: false },
        { id: `c-${Date.now()}-2`, text: 'Deliberate high-focus execution', done: false },
      ],
    });

    setTaskTitle('');
    setShowAddTaskModal(false);
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

      {/* 4 Stat Overview Cards: MATHEMATICALLY EXACT IN REAL TIME */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Weekly Hours Card */}
        <div className="p-4.5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">{t('weeklyHours')}</span>
            <span 
              className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              {metrics.weeklyPercentile.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
              {metrics.currentWeeklyHours.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {metrics.weeklyTargetHours}{t('hoursShort')}</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, Math.max(0, metrics.weeklyPercentile))}%`,
                backgroundColor: category.color 
              }}
            />
          </div>

          <p className="text-[11px] text-slate-400 truncate">
            {metrics.activeElapsedHours > 0 
              ? `🔥 +${(metrics.activeElapsedHours * 60).toFixed(0)}m focus live`
              : metrics.todayCompletedHours > 0
                ? `+${metrics.todayCompletedHours.toFixed(1)}h logged today`
                : `${Math.max(0, metrics.weeklyTargetHours - metrics.currentWeeklyHours).toFixed(1)}h remaining`}
          </p>
        </div>

        {/* 2. Monthly Target Card */}
        <div className="p-3.5 sm:p-4.5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{t('monthlyTarget')}</span>
            <span className="text-[10px] font-mono font-bold text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full shrink-0">
              {metrics.currentMonthlyHours.toFixed(1)} / {metrics.monthlyTargetHours}{t('hoursShort')}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#0082ff]">
              {metrics.monthlyPercentile.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">{t('percentDone')}</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#0082ff] h-full transition-all duration-300" 
              style={{ width: `${Math.min(100, Math.max(0, metrics.monthlyPercentile))}%` }} 
            />
          </div>

          <p className="text-[11px] text-slate-400 truncate" title={category.monthlyGoalTitle}>
            {language === 'am' ? `ግብ፡ ${category.monthlyGoalTitle}` : `Paced for ${category.monthlyGoalTitle}`}
          </p>
        </div>

        {/* 3. Tasks Today Card */}
        <div className="p-3.5 sm:p-4.5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{t('todaysTasks')}</span>
            <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full shrink-0">
              {metrics.todayTaskPercentile.toFixed(0)}%
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {metrics.todayCompletedTasks}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {metrics.todayTotalTasks} {t('done')}</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300" 
              style={{ width: `${Math.min(100, Math.max(0, metrics.todayTaskPercentile))}%` }} 
            />
          </div>

          <p className="text-[11px] text-slate-400 truncate">
            {metrics.todayCompletedTasks === metrics.todayTotalTasks && metrics.todayTotalTasks > 0
              ? `✓ ${language === 'am' ? 'የዛሬው 100% ተጠናቋል!' : '100% finished today!'}` 
              : `${metrics.todayTotalTasks - metrics.todayCompletedTasks} ${language === 'am' ? 'የትኩረት ክፍለ-ጊዜ ቀርቷል' : 'focus blocks left'}`}
          </p>
        </div>

        {/* 4. Monthly Target Volume Card */}
        <div className="p-3.5 sm:p-4.5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xs space-y-2 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            {t('monthlyHoursPlanned')}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
              {metrics.monthlyTargetHours}
            </span>
            <span className="text-xs text-slate-400 font-mono">hrs planned</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-slate-400 h-full" 
              style={{ width: '100%' }} 
            />
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {(metrics.monthlyTargetHours / 4).toFixed(1)}h / week target cadence
          </p>
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

      {/* Tab 1: Overview & Detailed Plan (Unified Category Focus Sticky Note + Cadence & Milestones) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary 2 Columns: The Category Focus Sticky Note (Unified with Focus Blocks) */}
          <div className="lg:col-span-2 space-y-4">
            <div id="category-sticky-note-card">
              <DailyPlansStickyCard categoryId={category.id} />
            </div>
          </div>

          {/* Secondary 1 Column: Weekly Schedule Cadence & Monthly Milestone */}
          <div className="space-y-6">

            {/* 2. WEEKLY SCHEDULE BOX (as seen in user image) */}
            <div className="p-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#0082ff]" /> Weekly Schedule
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {metrics.weeklyTargetHours}h / week
                  </span>
                  <button
                    onClick={() => {
                      setEditWeeklyHours(category.weeklyTargetHours);
                      setEditScheduleSlots([...category.weeklyScheduleSummary]);
                      setShowEditWeeklyModal(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-[#0082ff] hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit with Main Database"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => setShowWeeklyDetail(!showWeeklyDetail)}
                    className="text-[11px] font-bold text-[#0082ff] hover:underline"
                  >
                    {showWeeklyDetail ? 'Less' : 'Detail'}
                  </button>
                </div>
              </div>

              {/* Routine Bullet Points */}
              <div className="space-y-1.5">
                {category.weeklyScheduleSummary.map((slot, i) => (
                  <div key={i} className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                      <span className="truncate">{slot}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expanded Detailed 7-Day Matrix */}
              {showWeeklyDetail && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    7-Day Cadence Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const daySlot = category.weeklyScheduleSummary.find((s) => s.toLowerCase().includes(day.slice(0, 3).toLowerCase())) || 'Active recovery / review';
                      return (
                        <div key={day} className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{day}</span>
                          <span className="text-slate-500 text-[10px] truncate block">{daySlot}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. MONTHLY DELIVERABLE BOX (as seen in user image) */}
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

      {/* Sequential Focus Countdown Runner Popup Modal */}
      {selectedCategoryId && (
        <CategoryFocusSessionModal
          categoryId={selectedCategoryId}
          isOpen={showFocusSessionModal}
          onClose={() => setShowFocusSessionModal(false)}
        />
      )}
    </div>
  );
};
