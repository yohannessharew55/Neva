import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Clock, RotateCcw,
  Palette, Music, Swords, ChessKnight, Building2, TrendingUp,
  Shield, ChevronRight, ChevronDown, ChevronUp, Dumbbell, BookOpen, Settings, Layers, Sparkles,
  ExternalLink, Zap
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { PlanningModal } from './PlanningModal';
import { BigDailyActivitiesStickyNote } from './BigDailyActivitiesStickyNote';
import { ReminderCenterModal } from './ReminderCenterModal';
import { gregorianToEthiopian, AMHARIC_DAYS } from '../utils/ethiopianCalendar';
import { soundEngine } from '../utils/audio';
import { formatTaskDuration } from '../utils/formatDuration';



export const TodayCockpitV2: React.FC = () => {
  const { 
    tasks, 
    activeTask, 
    secondsRemaining, 
    isRunning, 
    startTask, 
    toggleTimer, 
    stopTimer, 
    toggleTaskCompletion, 
    categoryPlans,
    deleteCategoryPlan,
    openManageCategoriesModal,
    setSelectedCategoryId,
    setActiveTab,
    language,
    t,
    getCategoryTitleTranslated,
    getDaySchedule,
    categoryOrder,
  } = useLivotion();

  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isPillarsExpanded, setIsPillarsExpanded] = useState(false);

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

  const allCategories = Object.values(categoryPlans).filter(cat => cat && cat.id);

  const formatClock = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Date formatting for Today
  const now = new Date();
  const ethDate = gregorianToEthiopian(now);
  const dayNameEn = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDayEn = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dayNameAm = AMHARIC_DAYS[now.getDay()]?.am || '';
  const ethMonthName = ethDate.monthNameAm;
  
  const todayDateDisplay = language === 'am' 
    ? `${dayNameAm}፣ ${ethMonthName} ${ethDate.day} (${monthDayEn})`
    : `${dayNameEn}, ${monthDayEn} • ${ethDate.monthNameEn} ${ethDate.day}`;

  // Active Day Schedule & Tasks
  const daySchedule = getDaySchedule(now);
  const dayTasks = daySchedule.tasks;

  // Today's metrics (matches today's schedule)
  const completedCount = dayTasks.filter((t) => t.completed).length;
  const totalCount = dayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalHoursPlanned = (dayTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0) / 60).toFixed(1);
  const remainingMinutes = dayTasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.durationMin || 0), 0);
  const remainingFormatted = formatTaskDuration(remainingMinutes);

  // Helper to map task to category key
  const getCategoryKeyForTask = (task: ScheduleTask): string => {
    if (task.badge) {
      const badgeLower = task.badge.toLowerCase();
      for (const [id, plan] of Object.entries(categoryPlans)) {
        if (!plan) continue;
        if (badgeLower.includes(id) || (plan.title && plan.title.toLowerCase().includes(badgeLower))) {
          return id;
        }
      }
    }
    switch (task.domain) {
      case 'PHYSICAL_FITNESS':
      case 'EXERCISE': return 'exercise';
      case 'CHESS': return 'chess';
      case 'OIL_PAINTING':
      case 'ART': return 'art';
      case 'GUITAR':
      case 'MUSIC': return 'music';
      case 'ARCHITECTURE_DESIGN':
      case 'SITE_SUPERVISION':
      case 'ARCHITECTURE': return 'architecture';
      case 'FOREX_TRADING':
      case 'TRADING': return 'trading';
      case 'DEVOTION_PRAYER':
      case 'DEVOTION': return 'devotion';
      default: return 'buffer';
    }
  };

  // Order categories according to live custom categoryOrder
  const baseCategoryKeys = Object.keys(categoryPlans);
  const orderedCategoryKeys = [...baseCategoryKeys].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr || timeStr.toLowerCase().includes('flex')) return 0;
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

  // Up Next Focus Task:
  // Strictly respects the top-to-bottom order of main categories from the sticky note!
  // Whichever category is on top with uncompleted tasks is the active focus block.
  const topPendingCategoryKey = orderedCategoryKeys.find((catKey) => {
    return dayTasks.some((t) => getCategoryKeyForTask(t) === catKey && !t.completed);
  });

  const activeFocusCategoryKey = topPendingCategoryKey || orderedCategoryKeys.find((catKey) => {
    return dayTasks.some((t) => getCategoryKeyForTask(t) === catKey);
  }) || orderedCategoryKeys[0] || 'chess';

  // Tasks in this active focus category - strictly follows the sticky note task drag order!
  // (Whichever task is on top in the category list on the sticky note is the active focus task)
  const tasksInActiveCategory = dayTasks.filter((t) => getCategoryKeyForTask(t) === activeFocusCategoryKey);
  const uncompletedInCat = tasksInActiveCategory.filter((t) => !t.completed);
  const activeFocusTask = uncompletedInCat[0] || tasksInActiveCategory[0] || dayTasks.find((t) => !t.completed) || dayTasks[0];

  const getCategoryTheme = (catKey: string) => {
    switch (catKey) {
      case 'chess':
        return {
          title: categoryPlans['chess']?.title || 'Chess',
          color: '#8b5cf6',
          gradientBg: 'from-violet-500/15 via-purple-500/5 to-transparent dark:from-violet-950/40 dark:via-purple-900/20 dark:to-[#121927]',
          borderColor: 'border-violet-500/30 dark:border-violet-500/30',
          badgeBg: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
          buttonGrad: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-violet-500/25',
          accentText: 'text-violet-600 dark:text-violet-400',
          Icon: ChessKnight,
          tagline: language === 'am' ? 'ስልታዊ ጥልቀትና የቦርድ እይታ' : 'Tactical Calculation & Board Vision',
        };
      case 'music':
        return {
          title: categoryPlans['music']?.title || 'Music & Guitar',
          color: '#ec4899',
          gradientBg: 'from-pink-500/15 via-rose-500/5 to-transparent dark:from-pink-950/40 dark:via-rose-900/20 dark:to-[#121927]',
          borderColor: 'border-pink-500/30 dark:border-pink-500/30',
          badgeBg: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
          buttonGrad: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-md shadow-pink-500/25',
          accentText: 'text-pink-600 dark:text-pink-400',
          Icon: Music,
          tagline: language === 'am' ? 'ሪትምና የጣቶች ቅልጥፍና' : 'Acoustic Touch & Repertoire Flow',
        };
      case 'exercise':
        return {
          title: categoryPlans['exercise']?.title || 'Physical Fitness',
          color: '#ef4444',
          gradientBg: 'from-red-500/15 via-orange-500/5 to-transparent dark:from-red-950/40 dark:via-orange-900/20 dark:to-[#121927]',
          borderColor: 'border-red-500/30 dark:border-red-500/30',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
          buttonGrad: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-md shadow-red-500/25',
          accentText: 'text-red-600 dark:text-red-400',
          Icon: Dumbbell,
          tagline: language === 'am' ? 'የጥንካሬና ጽናት ስልጠና' : 'Peak Conditioning & Muscle Drive',
        };
      case 'art':
        return {
          title: categoryPlans['art']?.title || 'Art & Painting',
          color: '#e11d48',
          gradientBg: 'from-rose-500/15 via-amber-500/5 to-transparent dark:from-rose-950/40 dark:via-amber-900/20 dark:to-[#121927]',
          borderColor: 'border-rose-500/30 dark:border-rose-500/30',
          badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          buttonGrad: 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-md shadow-rose-500/25',
          accentText: 'text-rose-600 dark:text-rose-400',
          Icon: Palette,
          tagline: language === 'am' ? 'የቀለም ቅንብርና ፈጠራ' : 'Creative Vision & Layered Brushwork',
        };
      case 'architecture':
        return {
          title: categoryPlans['architecture']?.title || 'Architecture & Design',
          color: '#0082ff',
          gradientBg: 'from-blue-500/15 via-cyan-500/5 to-transparent dark:from-blue-950/40 dark:via-cyan-900/20 dark:to-[#121927]',
          borderColor: 'border-blue-500/30 dark:border-blue-500/30',
          badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
          buttonGrad: 'bg-gradient-to-r from-[#0082ff] to-cyan-600 hover:from-[#0070df] hover:to-cyan-500 text-white shadow-md shadow-blue-500/25',
          accentText: 'text-[#0082ff] dark:text-blue-400',
          Icon: Building2,
          tagline: language === 'am' ? 'መዋቅራዊ ንድፍና ትክክለኛነት' : 'Blueprint Drafting & Structural Scale',
        };
      case 'trading':
        return {
          title: categoryPlans['trading']?.title || 'Trading & Markets',
          color: '#10b981',
          gradientBg: 'from-emerald-500/15 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-900/20 dark:to-[#121927]',
          borderColor: 'border-emerald-500/30 dark:border-emerald-500/30',
          badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          buttonGrad: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25',
          accentText: 'text-emerald-600 dark:text-emerald-400',
          Icon: TrendingUp,
          tagline: language === 'am' ? 'የገበያ ስነ-ስርዓትና ጥንቃቄ' : 'Market Discipline & Risk Execution',
        };
      case 'devotion':
        return {
          title: categoryPlans['devotion']?.title || 'Devotion & Prayer',
          color: '#a855f7',
          gradientBg: 'from-purple-500/15 via-amber-500/5 to-transparent dark:from-purple-950/40 dark:via-amber-900/20 dark:to-[#121927]',
          borderColor: 'border-purple-500/30 dark:border-purple-500/30',
          badgeBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
          buttonGrad: 'bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white shadow-md shadow-purple-500/25',
          accentText: 'text-purple-600 dark:text-purple-400',
          Icon: BookOpen,
          tagline: language === 'am' ? 'መንፈሳዊ ጽሞናና ጸሎት' : 'Spiritual Grounding & Sacred Stillness',
        };
      default:
        return {
          title: categoryPlans[catKey]?.title || 'Rest & Buffer',
          color: '#64748b',
          gradientBg: 'from-slate-500/15 via-zinc-500/5 to-transparent dark:from-slate-900/40 dark:via-slate-800/20 dark:to-[#121927]',
          borderColor: 'border-slate-300/30 dark:border-slate-700/30',
          badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
          buttonGrad: 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 text-white shadow-md shadow-slate-500/25',
          accentText: 'text-slate-600 dark:text-slate-400',
          Icon: Shield,
          tagline: language === 'am' ? 'ዕረፍትና ማገገም' : 'Rest, Recharging & Reflection',
        };
    }
  };

  const currentTheme = getCategoryTheme(activeFocusCategoryKey);
  const WatermarkIcon = currentTheme.Icon;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 space-y-4 sm:space-y-6 max-w-full overflow-x-clip">
      {/* 1. The Stationary Sticky Note: Central Hub & First Impression for Today's Execution */}
      <BigDailyActivitiesStickyNote />

      {/* Active Focus Session Timer (if currently running) */}
      {activeTask && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#121927] border border-emerald-500/30 dark:border-emerald-500/30 rounded-3xl shadow-[0_4px_20px_rgba(48,209,88,0.1)] transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#30d158] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-ping" />
                {language === 'am' ? 'ትኩረት በሂደት ላይ' : 'Active Focus Session'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {activeTask.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={12} className="text-[#30d158]" /> {activeTask.startTime} • {activeTask.durationMin} {language === 'am' ? 'ደቂቃዎች' : 'minutes'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl font-mono font-extrabold text-[#30d158] tracking-tight drop-shadow-[0_2px_12px_rgba(48,209,88,0.3)]">
                {formatClock(secondsRemaining)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTimer}
                  className="p-3 sm:p-3.5 bg-[#30d158] hover:bg-[#28b84d] text-slate-950 font-bold rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
                  title={isRunning ? 'Pause' : 'Start'}
                >
                  {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <button
                  onClick={stopTimer}
                  className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Creative Focus Block: Changes dynamically based on Main Categories */}
      {!activeTask && activeFocusTask && (
        <div className={`rounded-3xl border ${currentTheme.borderColor} bg-gradient-to-br ${currentTheme.gradientBg} bg-white dark:bg-[#121927] p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all duration-300`}>
          {/* Subtle Ambient Watermark Graphic in Background */}
          <div className="absolute -right-3 -bottom-4 opacity-[0.06] dark:opacity-[0.09] pointer-events-none select-none text-current">
            <WatermarkIcon size={130} strokeWidth={1.5} />
          </div>

          <div className="relative z-10 space-y-3.5">
            {/* 1. Header: Automatic Category Badge & Direct Stream Link */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-2xs transition-all ${currentTheme.badgeBg}`}>
                  <WatermarkIcon size={13} strokeWidth={2.5} />
                  <span>{currentTheme.title}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:inline">
                  {language === 'am' ? 'ቀጣይ የትኩረት ብሎክ' : 'Up Next Focus Block'}
                </span>
              </div>

              {/* Direct Link to Category Master Page */}
              <button
                type="button"
                onClick={() => setSelectedCategoryId(activeFocusCategoryKey)}
                className="text-[10px] font-mono font-bold opacity-60 hover:opacity-100 hover:text-[#0082ff] flex items-center gap-1 transition cursor-pointer shrink-0"
                title={language === 'am' ? `${currentTheme.title} ገጽ ክፈት` : `Open ${currentTheme.title}`}
              >
                <span>{language === 'am' ? 'ወደ ክፍል' : 'Category'}</span>
                <ExternalLink size={10} />
              </button>
            </div>

            {/* 2. Main Focus Task Title & Information */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 sm:hidden">
                    {language === 'am' ? 'ቀጣይ የትኩረት ብሎክ' : 'Up Next'}
                  </span>
                  <span className={`text-[11px] font-bold ${currentTheme.accentText}`}>
                    {currentTheme.tagline}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">
                  {activeFocusTask.title}
                </h2>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 font-mono font-semibold">
                    <Clock size={11} className={currentTheme.accentText} />
                    {activeFocusTask.startTime || 'Flexible'}
                  </span>
                  <span>•</span>
                  <span>
                    {(activeFocusTask.durationMin || 30)} {language === 'am' ? 'ደቂቃዎች' : 'minutes'}
                  </span>
                </div>
              </div>

              {/* 3. Action Button: Glowing with Category Colors */}
              <button
                type="button"
                onClick={() => {
                  try { soundEngine.playPencil(); } catch {}
                  startTask({
                    ...activeFocusTask,
                    durationMin: activeFocusTask.durationMin || 30
                  });
                }}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto active:scale-95 shadow-md ${currentTheme.buttonGrad}`}
              >
                <Play size={13} fill="currentColor" />
                <span>{language === 'am' ? 'ትኩረት ጀምር' : 'Start Focus Block'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sunday Rest & Sabbath Day Hero Card (when on Sunday with no active weekday task) */}
      {!activeTask && (!activeFocusTask || now.getDay() === 0) && now.getDay() === 0 && (
        <div className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 bg-white dark:bg-[#121927] p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
                <span>🌿</span>
                <span>{language === 'am' ? 'የእሁድ እረፍትና ሰንበት' : 'Sunday Sabbath & Sacred Rest'}</span>
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'የመንፈስ ጽሞናና የአካል ማገገሚያ ቀን' : 'Spiritual Stillness & Total Renewal'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'am'
                  ? 'ስድስት ቀን የልፋትህ ስራ ሲሆን፣ በሰባተኛው ቀን ግን ለነፍስህ ዕረፍት ትሰጣለህ። ከስራ ጫና ነፃ ሆነህ በጸሎት፣ በቤተሰብና በማሰላሰል እራስህን አድስ።'
                  : 'Six days you shall labor; on the seventh day you shall rest. Take time today for prayer, reflection, family, and deep rest with zero work pressure.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  try { soundEngine.playPencil(); } catch {}
                  setActiveTab('devotion');
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20"
              >
                <span>🙏</span>
                <span>{language === 'am' ? 'ወደ ጸሎት ፕሮቶኮል' : 'Devotion Protocol'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Core Pillars & Milestones: High-End Graphic Widget (Default Collapsed) */}
      <div className="pt-1">
        {!isPillarsExpanded ? (
          /* Collapsed State: Minimal, Simple & Clean Single-Row Capsule */
          <div
            onClick={() => setIsPillarsExpanded(true)}
            className="group rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 bg-white dark:bg-[#121927] border border-slate-200/90 dark:border-slate-800/90 hover:border-[#0082ff]/50 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-between gap-3"
            title={language === 'am' ? 'የዋና ዋና ዘርፎች እቅዶችን ዘርጋ' : 'Expand Core Pillars & Milestones'}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsPillarsExpanded(true);
              }
            }}
          >
            {/* Left: Overlapping Stream Avatar Jewels */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                {allCategories.slice(0, 5).map((cat) => {
                  const Icon = getIcon(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-[#121927] shadow-2xs"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      title={getCategoryTitleTranslated(cat.id, cat.title)}
                    >
                      <Icon size={12} strokeWidth={2.5} />
                    </div>
                  );
                })}
                {allCategories.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-[#121927] flex items-center justify-center text-[10px] font-mono font-bold text-slate-500 shadow-2xs">
                    +{allCategories.length - 5}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Chevron Down */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0 transition">
                <ChevronDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ) : (
          /* Expanded State: Smooth open view with cards and collapse button */
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                  {language === 'am' ? 'የዋና ዋና ዘርፎች እቅዶች' : 'Core Pillars & Milestones'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {allCategories.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openManageCategoriesModal()}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                  title={language === 'am' ? 'ዘርፎችን አስተካክልና አስተዳድር' : 'Edit & Manage Streams'}
                  aria-label="Edit & Manage Streams"
                >
                  <Settings size={12} />
                  <span className="hidden sm:inline">{language === 'am' ? 'አስተካክል' : 'Edit & Settings'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPillarsExpanded(false)}
                  className="px-2.5 py-1 rounded-xl bg-[#0082ff]/10 hover:bg-[#0082ff]/20 text-[#0082ff] text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  title={language === 'am' ? 'ሰብስብ' : 'Collapse Pillars'}
                >
                  <ChevronUp size={13} />
                  <span>{language === 'am' ? 'ሰብስብ' : 'Collapse'}</span>
                </button>
              </div>
            </div>

            {/* Expanded Cards Grid with Rich Graphic Gradients */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {allCategories.map((cat) => {
                const Icon = getIcon(cat.id);
                const domainTypes = getDomainTypesForCat(cat.id);
                const todayTasks = tasks.filter((t) => domainTypes.includes(t.domain));
                const completedToday = todayTasks.filter((t) => t.completed).length;
                const progressPct = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="p-3.5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md group relative overflow-hidden bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 hover:border-[#0082ff]/50 active:scale-98"
                    title={`Open full ${cat.title} roadmap`}
                  >
                    {/* Ambient Category Gradient Blob */}
                    <div 
                      className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none group-hover:opacity-30 transition-opacity"
                      style={{ backgroundColor: cat.color }}
                    />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs"
                          style={{ 
                            backgroundColor: `${cat.color}18`, 
                            color: cat.color,
                            border: `1px solid ${cat.color}35`
                          }}
                        >
                          <Icon size={18} strokeWidth={2.4} />
                        </div>
                        <span 
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                          style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                        >
                          {cat.weeklyTargetHours || 5}h/wk
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0082ff] transition-colors">
                        {getCategoryTitleTranslated(cat.id, cat.title)}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        {todayTasks.length > 0 
                          ? `${completedToday}/${todayTasks.length} ${language === 'am' ? 'ተጠናቋል' : 'done'}` 
                          : (language === 'am' ? 'ዛሬ ክፍት' : '0 scheduled')}
                      </p>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: todayTasks.length > 0 ? `${progressPct}%` : '0%', 
                            backgroundColor: cat.color 
                          }}
                        />
                      </div>
                      <ChevronRight size={13} className="text-slate-400 group-hover:text-[#0082ff] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Planning Modal */}
      <PlanningModal
        isOpen={showPlanningModal}
        onClose={() => setShowPlanningModal(false)}
      />

      {/* Mobile Alarms & Reminders Hub Modal */}
      <ReminderCenterModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
    </div>
  );
};
