import React, { useState } from 'react';
import { 
  Play, Pause, CheckCircle2, Clock, 
  RotateCcw, Plus,
  Palette, Music, Swords, Building2, TrendingUp,
  Shield, Calendar, ChevronRight, SlidersHorizontal,
  ExternalLink, Dumbbell, BookOpen, Sparkles, Flame, SquarePen,
  AlarmClock, BellRing
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { PlanningModal } from './PlanningModal';
import { BigDailyActivitiesStickyNote } from './BigDailyActivitiesStickyNote';
import { DayCloseoutModal } from './DayCloseoutModal';
import { QuickScratchpadCard } from './QuickScratchpadCard';
import { ReminderCenterModal } from './ReminderCenterModal';
import { gregorianToEthiopian, AMHARIC_DAYS } from '../utils/ethiopianCalendar';

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
    setSelectedCategoryId,
    setActiveTab,
    language,
    t,
    getCategoryTitleTranslated
  } = useLivotion();

  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showCloseoutModal, setShowCloseoutModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

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
      case 'chess': return Swords;
      case 'art': return Palette;
      case 'music': return Music;
      case 'architecture': return Building2;
      case 'trading': return TrendingUp;
      case 'devotion': return BookOpen;
      default: return Shield;
    }
  };

  const allCategories = Object.values(categoryPlans);

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

  // Today's metrics
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalHoursPlanned = (tasks.reduce((sum, t) => sum + (t.durationMin || 0), 0) / 60).toFixed(1);
  const remainingHours = (tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.durationMin || 0), 0) / 60).toFixed(1);

  // Up Next / Active task
  const nextTask = activeTask || tasks.find((t) => !t.completed);

  // 7-Day Consistency Dot Matrix calculation (Option 3)
  const getWeeklyMomentum = () => {
    const days = [
      { key: 'mon', labelEn: 'M', labelAm: 'ሰ', dayIndex: 1 },
      { key: 'tue', labelEn: 'T', labelAm: 'ማ', dayIndex: 2 },
      { key: 'wed', labelEn: 'W', labelAm: 'ረ', dayIndex: 3 },
      { key: 'thu', labelEn: 'T', labelAm: 'ሐ', dayIndex: 4 },
      { key: 'fri', labelEn: 'F', labelAm: 'አ', dayIndex: 5 },
      { key: 'sat', labelEn: 'S', labelAm: 'ቅ', dayIndex: 6 },
      { key: 'sun', labelEn: 'S', labelAm: 'እ', dayIndex: 0 },
    ];
    const currentJsDay = now.getDay();
    const currentMonDay = currentJsDay === 0 ? 7 : currentJsDay;

    return days.map((d) => {
      const targetMonDay = d.dayIndex === 0 ? 7 : d.dayIndex;
      const isToday = targetMonDay === currentMonDay;
      const isPast = targetMonDay < currentMonDay;
      const isCompleted = isToday ? (completedCount > 0 || progressPercent >= 50) : isPast;

      return {
        ...d,
        isToday,
        isPast,
        isCompleted
      };
    });
  };

  const weeklyMomentum = getWeeklyMomentum();
  const activeDaysCount = weeklyMomentum.filter((d) => d.isCompleted).length;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 space-y-4 sm:space-y-6 max-w-full overflow-x-clip">
      
      {/* 1. Header: Focused on That Specific Day */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0082ff]/10 text-[#0082ff] uppercase tracking-wider">
                {language === 'am' ? 'የዛሬ እቅድ' : 'TODAY'}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {todayDateDisplay}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              {language === 'am' ? 'የዛሬ ትኩረትና ተግባራት' : "Today's Focus & Execution"}
            </h1>
          </div>

          {/* Today's Live Metric Pills & Action */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                  {completedCount}/{totalCount} {language === 'am' ? 'ተጠናቋል' : 'Done'} ({progressPercent}%)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  • {remainingHours}h {language === 'am' ? 'ቀሪ' : 'left'}
                </span>
              </div>
              <div className="w-36 sm:w-44 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-[#0082ff] h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>

            {/* Option 2: 60-Second Day Closeout Button */}
            <button
              onClick={() => setShowCloseoutModal(true)}
              className="p-2 sm:px-3 sm:py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-[#0082ff] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
              title={language === 'am' ? 'የቀኑን ስራ ዝጋና ማጠቃለያ አስቀምጥ' : 'Close out today with evening receipt'}
            >
              <Sparkles size={14} className="text-[#0082ff]" />
              <span className="hidden sm:inline">{language === 'am' ? 'ማጠቃለያ' : 'Close Out'}</span>
            </button>

            <button
              onClick={() => setShowPlanningModal(true)}
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title={language === 'am' ? 'መርሐግብር አዘጋጅ' : 'Open Planner'}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">{language === 'am' ? 'መርሐግብር' : 'Planner'}</span>
            </button>
          </div>
        </div>

        {/* Option 3: 7-Day Consistency Dot Matrix (Minimalist Momentum Tracker) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {language === 'am' ? 'ሳምንታዊ ፍሰት' : 'Week Momentum'}:
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              {weeklyMomentum.map((d) => (
                <div 
                  key={d.key} 
                  className="flex flex-col items-center gap-0.5"
                  title={`${d.labelEn} - ${d.isCompleted ? 'Active Flow' : d.isToday ? 'Today' : 'Upcoming'}`}
                >
                  <span className={`text-[9px] font-mono font-bold ${
                    d.isToday ? 'text-[#0082ff]' : 'text-slate-400'
                  }`}>
                    {language === 'am' ? d.labelAm : d.labelEn}
                  </span>
                  <div className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    d.isCompleted
                      ? 'bg-[#0082ff] text-white shadow-xs'
                      : d.isToday
                      ? 'border-2 border-[#0082ff] text-[#0082ff] bg-blue-50/50 dark:bg-blue-950/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-300 dark:text-slate-600'
                  }`}>
                    {d.isCompleted ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-center gap-1">
              <Flame size={12} className="text-amber-500 fill-amber-500" />
              <span>{activeDaysCount}/7 {language === 'am' ? 'ቀናት' : 'Active'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Alarms & Apple Reminders Action Hub */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/80 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0082ff] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <AlarmClock size={19} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {language === 'am' ? 'የስልክ ማንቂያ እና አፕል አስታዋሽ' : 'Mobile Phone Alarms & Apple Reminders'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                iOS 16 Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'am' ? 'የስልክ ማንቂያ ያዘጋጁ፣ በድምጽ ያስደውሉ ወይም ወደ አፕል አስታዋሽ ይላኩ' : 'Arm phone focus alarms, countdown timers & sync to iPhone Reminders app'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 shrink-0">
          <button
            onClick={() => setShowReminderModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs shrink-0"
          >
            <AlarmClock size={14} />
            <span>{language === 'am' ? 'ማንቂያ አዘጋጅ' : 'Set Phone Alarm'}</span>
          </button>

          <button
            onClick={() => setShowReminderModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs shrink-0"
          >
            <BellRing size={14} className="text-[#0082ff]" />
            <span>{language === 'am' ? 'አፕል አስታዋሽ' : 'Sync Reminders'}</span>
          </button>
        </div>
      </div>

      {/* 2. Hero: Active Focus Timer or Up Next Task for Today */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs transition-all">
        {activeTask ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0082ff] animate-ping" />
                {language === 'am' ? 'ትኩረት በሂደት ላይ' : 'Active Focus Session'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {activeTask.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={12} /> {activeTask.startTime} • {activeTask.durationMin} {language === 'am' ? 'ደቂቃዎች' : 'minutes'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl font-mono font-extrabold text-[#0082ff] tracking-tight">
                {formatClock(secondsRemaining)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTimer}
                  className="p-3 sm:p-3.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
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
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-mono">
                {language === 'am' ? 'ቀጣይ የትኩረት ክፍለ-ጊዜ' : 'Up Next Today'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {nextTask?.title || (tasks.length === 0 
                  ? (language === 'am' ? 'ምንም የተመዘገበ ተግባር የለም' : 'No activities scheduled for today') 
                  : (language === 'am' ? 'የዛሬ ተግባራት በሙሉ ተጠናቀዋል! 🎉' : 'All tasks completed for today! 🎉'))}
              </h2>
              {nextTask && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Clock size={11} /> {nextTask.startTime} • {nextTask.durationMin} {language === 'am' ? 'ደቂቃዎች' : 'minutes'}
                </p>
              )}
            </div>

            {nextTask && (
              <button
                onClick={() => startTask(nextTask)}
                className="px-4 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer self-start sm:self-auto active:scale-95"
              >
                <Play size={13} fill="currentColor" /> {language === 'am' ? 'ትኩረት ጀምር' : 'Start Focus Block'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. The Stationary Sticky Note: Central Hub for Today's Execution */}
      <BigDailyActivitiesStickyNote />

      {/* Option 4: Quick Scratchpad / "Parking Lot" Micro-Sticky */}
      <QuickScratchpadCard onOpenAppleNotes={() => setActiveTab('notes')} />

      {/* 4. Core Pillars Quick Access: Clean, lightweight cards to jump to any category plan without cluttering today's landing page */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono">
            {language === 'am' ? 'የዋና ዋና ክፍሎች እቅዶች' : 'Core Pillars & Milestones'}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {language === 'am' ? 'ሙሉ እቅዶችን ለማየት ይንኩ' : 'Tap any pillar for full plan'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {allCategories.map((cat) => {
            const Icon = getIcon(cat.id);
            const domainTypes = getDomainTypesForCat(cat.id);
            const todayTasks = tasks.filter((t) => domainTypes.includes(t.domain));
            const completedToday = todayTasks.filter((t) => t.completed).length;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className="p-3 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 hover:border-[#0082ff]/50 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-2xs hover:shadow-xs group"
                title={`Open full ${cat.title} roadmap`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0082ff]">
                      {getCategoryTitleTranslated(cat.id, cat.title)}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {todayTasks.length > 0 
                        ? `${completedToday}/${todayTasks.length} ${language === 'am' ? 'ተጠናቋል' : 'done'}` 
                        : (language === 'am' ? 'ዛሬ ክፍት' : '0 scheduled')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={13} className="text-slate-400 group-hover:text-[#0082ff] shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Planning Modal */}
      <PlanningModal
        isOpen={showPlanningModal}
        onClose={() => setShowPlanningModal(false)}
      />

      {/* Option 2: 60-Second Day Closeout Evening Receipt Modal */}
      <DayCloseoutModal
        isOpen={showCloseoutModal}
        onClose={() => setShowCloseoutModal(false)}
        onNavigateToGallery={() => setActiveTab('notes-gallery')}
      />

      {/* Mobile Alarms & Reminders Hub Modal */}
      <ReminderCenterModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
    </div>
  );
};
