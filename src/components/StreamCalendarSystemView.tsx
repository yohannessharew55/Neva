import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, CalendarDays, ChevronLeft, ChevronRight, 
  Clock, Plus, Filter, Globe, Sparkles, Check, Trash2, Edit3, Play,
  Dumbbell, Swords, Palette, Music, Building2, TrendingUp, BookOpen, Shield,
  CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { 
  gregorianToEthiopian, 
  ethiopianToGregorian, 
  getEthiopianMonthCalendar, 
  ETHIOPIAN_MONTHS, 
  AMHARIC_DAYS, 
  formatDualDate 
} from '../utils/ethiopianCalendar';
import { CalendarDayBlockEditorModal } from './CalendarDayBlockEditorModal';
import { formatTaskDuration } from '../utils/formatDuration';
import { soundEngine } from '../utils/audio';
import { ScheduleTask } from '../types';

type CalendarMode = 'ethiopian' | 'gregorian' | 'dual';

export const StreamCalendarSystemView: React.FC = () => {
  const { 
    language, 
    getDaySchedule, 
    categoryPlans, 
    toggleTaskCompletion, 
    deleteTask,
    startTimerForTask 
  } = useLivotion();

  const categoryList = useMemo(() => Object.values(categoryPlans || {}).filter((c): c is any => !!c && !!c.id), [categoryPlans]);

  const today = useMemo(() => new Date(), []);
  const todayEth = useMemo(() => gregorianToEthiopian(today), [today]);

  const [selectedEthYear, setSelectedEthYear] = useState<number>(todayEth.year);
  const [selectedEthMonth, setSelectedEthMonth] = useState<number>(todayEth.month);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('dual');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState<string>('all');

  const isSelectedDatePast = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
    return targetStart < todayStart;
  }, [selectedDate]);

  // Block Editor Modal State
  const [blockEditorState, setBlockEditorState] = useState<{
    isOpen: boolean;
    date: Date;
    taskId: string | null;
  }>({
    isOpen: false,
    date: today,
    taskId: null,
  });

  // Ethiopian month data
  const ethMonthData = useMemo(() => {
    return getEthiopianMonthCalendar(selectedEthYear, selectedEthMonth);
  }, [selectedEthYear, selectedEthMonth]);

  // Gregorian month data (for navigation display)
  const firstGregDateOfMonth = ethMonthData.days[0]?.gregDate || today;
  const lastGregDateOfMonth = ethMonthData.days[ethMonthData.days.length - 1]?.gregDate || today;

  // Navigation handlers
  const handlePrevMonth = () => {
    try { soundEngine.playClick(); } catch {}
    if (selectedEthMonth === 1) {
      setSelectedEthMonth(13);
      setSelectedEthYear(prev => prev - 1);
    } else {
      setSelectedEthMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    try { soundEngine.playClick(); } catch {}
    if (selectedEthMonth === 13) {
      setSelectedEthMonth(1);
      setSelectedEthYear(prev => prev + 1);
    } else {
      setSelectedEthMonth(prev => prev + 1);
    }
  };

  const handleJumpToday = () => {
    try { soundEngine.playClick(); } catch {}
    setSelectedEthYear(todayEth.year);
    setSelectedEthMonth(todayEth.month);
    setSelectedDate(today);
  };

  // Helper: Get category icon
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'PHYSICAL_FITNESS': return Dumbbell;
      case 'CHESS': return Swords;
      case 'OIL_PAINTING': return Palette;
      case 'GUITAR': return Music;
      case 'ARCHITECTURE_DESIGN': return Building2;
      case 'FOREX_TRADING': return TrendingUp;
      case 'DEVOTION_PRAYER': return BookOpen;
      case 'REST_RECOVERY': return Shield;
      default: return Sparkles;
    }
  };

  // Helper: Match task domain to Category accurately
  const getCategoryForTask = (task: ScheduleTask) => {
    const domain = (task.domain || '').toUpperCase();
    const domainLower = (task.domain || '').toLowerCase();
    const titleLower = (task.title || '').toLowerCase();
    const badgeLower = (task.badge || '').toLowerCase();

    // Direct domain mapping
    if (domain === 'PHYSICAL_FITNESS' || domain === 'NUTRITION_MEALS' || domainLower.includes('fit') || domainLower.includes('exerc')) {
      const cat = categoryList.find(c => c.id === 'exercise');
      if (cat) return cat;
    }
    if (domain === 'CHESS' || domainLower.includes('chess') || titleLower.includes('chess') || titleLower.includes('aagard') || titleLower.includes('15+10')) {
      const cat = categoryList.find(c => c.id === 'chess');
      if (cat) return cat;
    }
    if (domain === 'GUITAR' || domainLower.includes('guitar') || domainLower.includes('music') || titleLower.includes('guitar') || titleLower.includes('fretboard') || titleLower.includes('warmup exercise')) {
      const cat = categoryList.find(c => c.id === 'guitar');
      if (cat) return cat;
    }
    if (domain === 'OIL_PAINTING' || domainLower.includes('art') || domainLower.includes('paint') || titleLower.includes('paint') || titleLower.includes('sketch')) {
      const cat = categoryList.find(c => c.id === 'art');
      if (cat) return cat;
    }
    if (domain === 'ARCHITECTURE_DESIGN' || domain === 'SITE_SUPERVISION' || domainLower.includes('arch') || titleLower.includes('cad') || titleLower.includes('blueprint')) {
      const cat = categoryList.find(c => c.id === 'architecture');
      if (cat) return cat;
    }
    if (domain === 'FOREX_TRADING' || domainLower.includes('trad') || domainLower.includes('forex') || titleLower.includes('chart') || titleLower.includes('scalp')) {
      const cat = categoryList.find(c => c.id === 'trading');
      if (cat) return cat;
    }
    if (domain === 'DEVOTION_PRAYER' || domainLower.includes('devot') || domainLower.includes('pray') || titleLower.includes('pray') || titleLower.includes('bible') || titleLower.includes('examen') || titleLower.includes('worship')) {
      const cat = categoryList.find(c => c.id === 'devotion');
      if (cat) return cat;
    }
    if (domain === 'RECREATION' || domainLower.includes('rest') || domainLower.includes('buffer') || titleLower.includes('relax') || titleLower.includes('recovery')) {
      const cat = categoryList.find(c => c.id === 'rest');
      if (cat) return cat;
    }

    // Secondary fallback by ID/title/color matching
    const matched = categoryList.find(c => {
      if (!c || !c.id) return false;
      const cId = c.id.toLowerCase();
      const cTitle = (c.title || '').toLowerCase();
      return (
        domainLower.includes(cId) ||
        badgeLower.includes(cId) ||
        titleLower.includes(cId) ||
        domainLower.includes(cTitle) ||
        titleLower.includes(cTitle) ||
        (task.color && c.color && task.color.toLowerCase() === c.color.toLowerCase())
      );
    });

    return matched || categoryList[0] || { id: 'stream', title: 'Focus', color: '#0082ff' };
  };

  // Tasks for selected day
  const selectedDaySchedule = useMemo(() => {
    return getDaySchedule(selectedDate);
  }, [selectedDate, getDaySchedule]);

  // Tasks for selected day filtered
  const selectedDayFilteredTasks = useMemo(() => {
    if (selectedStreamFilter === 'all') return selectedDaySchedule.tasks;
    return selectedDaySchedule.tasks.filter(t => {
      const cat = getCategoryForTask(t);
      return cat?.id === selectedStreamFilter;
    });
  }, [selectedDaySchedule, selectedStreamFilter, categoryList]);

  // Group selected day tasks by stream
  const selectedDayTasksByStream = useMemo(() => {
    const groups: { category: typeof categoryList[0]; tasks: ScheduleTask[] }[] = [];
    categoryList.filter(Boolean).forEach(cat => {
      if (!cat?.id) return;
      if (selectedStreamFilter !== 'all' && selectedStreamFilter !== cat.id) return;
      const streamTasks = selectedDaySchedule.tasks.filter(t => {
        const matched = getCategoryForTask(t);
        return matched?.id === cat.id;
      });
      if (streamTasks.length > 0) {
        groups.push({ category: cat, tasks: streamTasks });
      }
    });
    return groups;
  }, [selectedDaySchedule, selectedStreamFilter, categoryList]);

  // Month-level stream stats
  const monthStreamStats = useMemo(() => {
    const stats: Record<string, { daysCount: number; blocksCount: number }> = {};
    categoryList.filter(Boolean).forEach(cat => {
      if (!cat?.id) return;
      stats[cat.id] = { daysCount: 0, blocksCount: 0 };
    });

    ethMonthData.days.forEach(d => {
      const dayTasks = getDaySchedule(d.gregDate).tasks;
      const activeCatsOnDay = new Set<string>();
      dayTasks.forEach(t => {
        const cat = getCategoryForTask(t);
        if (cat?.id && stats[cat.id]) {
          stats[cat.id].blocksCount++;
          activeCatsOnDay.add(cat.id);
        }
      });
      activeCatsOnDay.forEach(catId => {
        if (stats[catId]) stats[catId].daysCount++;
      });
    });

    return stats;
  }, [ethMonthData, getDaySchedule, categoryList]);

  const selectedDateDual = formatDualDate(selectedDate);

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 animate-fadeIn">
      {/* 1. TOP HEADER & MONTH NAVIGATOR */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 font-medium">
              🇪🇹 {selectedDateDual.ethiopianStr} • 🌐 {selectedDateDual.gregorianStr}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarDays size={24} className="text-[#0082ff]" />
            <span>{language === 'am' ? 'የቀን መቁጠሪያ ሰሌዳ (Calendar System)' : 'Stream Calendar System'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'am' 
              ? 'በዋና ዋና ዘርፎች (Streams) የታቀዱትን ዕለታዊ ብሎኮች እና የጊዜ ሰሌዳዎችን በቀን መቁጠሪያው ላይ ይመልከቱ።' 
              : 'Inspect and schedule all blocks and routines across your Mastery Streams by day.'}
          </p>
        </div>

        {/* Month Navigator & Calendar Mode Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Previous / Jump Today / Next Month */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={language === 'am' ? 'ያለፈው ወር' : 'Previous Month'}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleJumpToday}
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-[#0082ff] hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {language === 'am' ? 'ዛሬ' : 'Today'}
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={language === 'am' ? 'ቀጣዩ ወር' : 'Next Month'}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month Label Pill */}
          <div className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/60 text-[#0082ff] rounded-2xl text-xs font-black flex items-center gap-1.5">
            <span>{ethMonthData.monthMeta.am} ({ethMonthData.monthMeta.en})</span>
            <span className="font-mono">{ethMonthData.year} ዓ.ም.</span>
          </div>

          {/* Dual / Ethiopian / Gregorian Mode Switcher */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
            <button
              onClick={() => setCalendarMode('dual')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                calendarMode === 'dual'
                  ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {language === 'am' ? 'ሁለቱም' : 'Dual'}
            </button>
            <button
              onClick={() => setCalendarMode('ethiopian')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                calendarMode === 'ethiopian'
                  ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              🇪🇹 {language === 'am' ? 'ኢትዮጵያ' : 'Eth'}
            </button>
            <button
              onClick={() => setCalendarMode('gregorian')}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer ${
                calendarMode === 'gregorian'
                  ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              🌐 {language === 'am' ? 'ፈረንጅ' : 'Greg'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN STREAMS FILTER BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1 shrink-0">
          <Filter size={12} /> {language === 'am' ? 'የዘርፍ ማጣሪያ፡' : 'Filter by Stream:'}
        </span>
        <button
          onClick={() => setSelectedStreamFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
            selectedStreamFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          {language === 'am' ? 'ሁሉም ዋና ዘርፎች' : 'All Main Streams'} ({categoryList.length})
        </button>

        {categoryList.map((cat) => {
          const isSelected = selectedStreamFilter === cat.id;
          const Icon = getCategoryIcon(cat.id);
          const stat = monthStreamStats[cat.id] || { daysCount: 0, blocksCount: 0 };

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedStreamFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs border-slate-900 dark:bg-slate-900 dark:text-white dark:border-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <Icon size={13} style={{ color: cat.color }} />
              <span>{cat.title}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                {stat.blocksCount} blk
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. CALENDAR SYSTEM MAIN GRID */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* 7 Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          {AMHARIC_DAYS.map((d, idx) => (
            <div key={idx} className="py-1">
              <span className="block sm:hidden">{d.short}</span>
              <span className="hidden sm:block">{d.am} ({d.en.slice(0, 3)})</span>
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
          {/* Empty cells before start day */}
          {Array.from({ length: ethMonthData.startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[85px] sm:min-h-[110px] rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-transparent" />
          ))}

          {/* Month Days */}
          {ethMonthData.days.map((dayItem) => {
            const isToday =
              dayItem.ethDay === todayEth.day &&
              dayItem.ethMonth === todayEth.month &&
              dayItem.ethYear === todayEth.year;

            const isSelected =
              dayItem.gregDate.getFullYear() === selectedDate.getFullYear() &&
              dayItem.gregDate.getMonth() === selectedDate.getMonth() &&
              dayItem.gregDate.getDate() === selectedDate.getDate();

            const daySched = getDaySchedule(dayItem.gregDate);
            const allDayTasks = daySched.tasks;

            // Filter tasks by active stream filter
            const visibleDayTasks = selectedStreamFilter === 'all'
              ? allDayTasks
              : allDayTasks.filter(t => getCategoryForTask(t).id === selectedStreamFilter);

            const hasBlocks = visibleDayTasks.length > 0;
            const gregShortStr = dayItem.gregDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Unique categories on this day
            const dayCategories = Array.from(new Set(visibleDayTasks.map(t => getCategoryForTask(t))));

            return (
              <div
                key={dayItem.ethDay}
                onClick={() => {
                  try { soundEngine.playClick(); } catch {}
                  setSelectedDate(dayItem.gregDate);
                }}
                className={`min-h-[85px] sm:min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 border-[#0082ff] ring-2 ring-[#0082ff] shadow-md scale-[1.01]'
                    : isToday
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-[#0082ff] shadow-xs'
                    : hasBlocks
                    ? 'bg-white dark:bg-[#121927] border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    : 'bg-slate-50/30 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/60 hover:border-slate-300'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm sm:text-base font-extrabold font-mono ${
                      isSelected ? 'text-[#0082ff]' : isToday ? 'text-[#0082ff]' : 'text-slate-900 dark:text-white'
                    }`}>
                      {calendarMode === 'gregorian' ? dayItem.gregDate.getDate() : dayItem.ethDay}
                    </span>
                    {daySched.isCustom && (
                      <span className="text-[10px] text-amber-500 font-bold" title="Custom day schedule">
                        ⭐
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {(calendarMode === 'dual' || calendarMode === 'gregorian') && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {calendarMode === 'gregorian' ? `ET ${dayItem.ethDay}` : gregShortStr}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(dayItem.gregDate);
                        setBlockEditorState({
                          isOpen: true,
                          date: dayItem.gregDate,
                          taskId: null,
                        });
                      }}
                      className="w-4 h-4 rounded-md text-slate-400 hover:text-[#0082ff] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
                      title={language === 'am' ? 'ወደዚህ ቀን ብሎክ አቅድ' : 'Add block to this day'}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>

                {/* Stream Blocks Badges & Pills */}
                <div className="space-y-1 mt-1 flex-1 flex flex-col justify-end">
                  {visibleDayTasks.slice(0, 2).map((t, tidx) => {
                    const matchedCat = getCategoryForTask(t);
                    return (
                      <div
                        key={tidx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dayItem.gregDate);
                          setBlockEditorState({
                            isOpen: true,
                            date: dayItem.gregDate,
                            taskId: t.id,
                          });
                        }}
                        className="px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold truncate flex items-center justify-between gap-1 cursor-pointer hover:scale-[1.02] hover:shadow-xs transition group/pill"
                        style={{ backgroundColor: `${matchedCat.color}15`, color: matchedCat.color }}
                        title={`${matchedCat.title}: ${t.title}`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: matchedCat.color }} />
                          <span className="truncate">{t.title}</span>
                        </div>
                        <Edit3 size={9} className="opacity-0 group-hover/pill:opacity-100 shrink-0 text-slate-600 dark:text-slate-300" />
                      </div>
                    );
                  })}

                  {visibleDayTasks.length > 2 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(dayItem.gregDate);
                      }}
                      className="text-[9px] text-slate-400 hover:text-[#0082ff] font-bold block pl-1 cursor-pointer hover:underline"
                    >
                      +{visibleDayTasks.length - 2} {language === 'am' ? 'ተጨማሪ' : 'more'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SELECTED DAY STREAM BREAKDOWN CARD */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        {/* Header with Selected Date & Add Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0082ff] flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarIcon size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'am' ? 'የተመረጠው ቀን የዋና ዘርፎች ዝርዝር' : 'Selected Day Stream Breakdown'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0082ff]">
                  {selectedDayFilteredTasks.length} {language === 'am' ? 'ብሎኮች' : 'blocks'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                🇪🇹 {selectedDateDual.ethiopianStr} • 🌐 {selectedDateDual.gregorianStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSelectedDatePast ? (
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                📜 {language === 'am' ? 'ያለፈ ቀን መዝገብ' : 'Historical Record'}
              </span>
            ) : (
              <button
                onClick={() => {
                  setBlockEditorState({
                    isOpen: true,
                    date: selectedDate,
                    taskId: null,
                  });
                }}
                className="px-3 py-1.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Plus size={13} />
                <span>{language === 'am' ? 'አዲስ ብሎክ አቅድ' : 'Plan Block for this Day'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stream Breakdown Content */}
        {selectedDayTasksByStream.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <CalendarDays size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isSelectedDatePast
                ? (language === 'am' ? 'በዚህ ያለፈ ቀን የተመዘገበ የዘርፍ ብሎክ አልነበረም።' : 'No stream blocks were recorded for this past day.')
                : (language === 'am' ? 'በዚህ ቀን የታቀደ የዘርፍ ብሎክ የለም።' : 'No stream blocks scheduled for this day.')}
            </p>
            {!isSelectedDatePast && (
              <p className="text-[11px] text-slate-400">
                {language === 'am'
                  ? 'ከላይ ያለውን "አዲስ ብሎክ አቅድ" በመንካት ለዋና ዘርፎችዎ ብሎክ ይመድቡ።'
                  : 'Click "Plan Block for this Day" above to schedule tasks from your Mastery Streams.'}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {selectedDayTasksByStream.map(({ category: cat, tasks: catTasks }) => {
              const Icon = getCategoryIcon(cat.id);
              return (
                <div 
                  key={cat.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2.5 bg-slate-50/40 dark:bg-slate-900/30"
                  style={{ borderLeftWidth: 4, borderLeftColor: cat.color }}
                >
                  {/* Stream Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <Icon size={12} />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {cat.title}
                      </span>
                    </div>
                    <span 
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                    >
                      {catTasks.length} {catTasks.length === 1 ? 'block' : 'blocks'}
                    </span>
                  </div>

                  {/* Tasks in Stream */}
                  <div className="space-y-1.5">
                    {catTasks.map(task => (
                      <div 
                        key={task.id}
                        className="p-2 rounded-xl bg-white dark:bg-[#121927] border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2 shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelectedDatePast ? (
                            task.completed ? (
                              <div 
                                className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 shrink-0"
                                title={language === 'am' ? 'የተጠናቀቀ' : 'Done & Checked'}
                              >
                                <Check size={11} strokeWidth={3} />
                                <span>{language === 'am' ? 'ተጠናቋል' : 'Done'}</span>
                              </div>
                            ) : (
                              <div 
                                className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1 shrink-0"
                                title={language === 'am' ? 'ያልተጠናቀቀ' : 'Undone / Missed'}
                              >
                                <X size={11} strokeWidth={3} />
                                <span>{language === 'am' ? 'ያልተጠናቀቀ' : 'Undone'}</span>
                              </div>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleTaskCompletion(task.id)}
                              className="cursor-pointer shrink-0 text-slate-400 hover:text-[#0082ff] transition"
                            >
                              {task.completed ? (
                                <CheckCircle2 size={16} className="text-[#0082ff] fill-blue-500/10" />
                              ) : (
                                <div className="w-4 h-4 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-[#0082ff]" />
                              )}
                            </button>
                          )}
                          <div className="min-w-0">
                            <p className={`text-xs font-bold truncate ${
                              task.completed 
                                ? 'line-through text-slate-400 dark:text-slate-500' 
                                : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {task.title}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {task.time || 'Flexible'} • {formatTaskDuration(task.duration)}
                            </p>
                          </div>
                        </div>

                        {!isSelectedDatePast && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startTimerForTask(task)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-500 cursor-pointer transition"
                              title="Start Focus Timer"
                            >
                              <Play size={12} className="fill-blue-500/20" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBlockEditorState({
                                  isOpen: true,
                                  date: selectedDate,
                                  taskId: task.id,
                                });
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition"
                              title="Edit Block"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 cursor-pointer transition"
                              title="Delete Block"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Calendar Day Block Editor Modal */}
      <CalendarDayBlockEditorModal
        isOpen={blockEditorState.isOpen}
        onClose={() => setBlockEditorState(prev => ({ ...prev, isOpen: false }))}
        date={blockEditorState.date}
        initialEditingTaskId={blockEditorState.taskId}
      />
    </div>
  );
};
