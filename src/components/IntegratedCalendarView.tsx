import React, { useState, useRef } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Clock, Plus, CheckCircle2, Play, Filter, Globe, Sparkles
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
import { BigDailyActivitiesStickyNote } from './BigDailyActivitiesStickyNote';

type CalendarMode = 'ethiopian' | 'gregorian' | 'dual';

export const IntegratedCalendarView: React.FC = () => {
  const { 
    tasks, 
    categoryPlans, 
    startTask, 
    toggleTaskCompletion, 
    setSelectedCategoryId,
    openNewCategoryModal,
    language,
    t
  } = useLivotion();

  const today = new Date();
  const todayEth = gregorianToEthiopian(today);
  const dualToday = formatDualDate(today);

  const [mode, setMode] = useState<CalendarMode>('ethiopian');
  const [selectedEthYear, setSelectedEthYear] = useState<number>(todayEth.year);
  const [selectedEthMonth, setSelectedEthMonth] = useState<number>(todayEth.month);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Ethiopian month data
  const ethMonthData = getEthiopianMonthCalendar(selectedEthYear, selectedEthMonth);

  const handlePrevMonth = () => {
    if (selectedEthMonth === 1) {
      setSelectedEthMonth(13);
      setSelectedEthYear(selectedEthYear - 1);
    } else {
      setSelectedEthMonth(selectedEthMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedEthMonth === 13) {
      setSelectedEthMonth(1);
      setSelectedEthYear(selectedEthYear + 1);
    } else {
      setSelectedEthMonth(selectedEthMonth + 1);
    }
  };

  const handleJumpToday = () => {
    setSelectedEthYear(todayEth.year);
    setSelectedEthMonth(todayEth.month);
    setSelectedDate(today);
    setTimeout(() => {
      stickyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
    setTimeout(() => {
      stickyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  // Get matching category list
  const categoryList = Object.values(categoryPlans);

  // Map tasks to days based on schedule or day-of-week cadence
  const getTasksForGregorianDate = (gregDate: Date) => {
    const dayOfWeek = gregDate.getDay(); // 0 is Sun, 1 is Mon, etc.
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
    
    // Filter tasks matching day
    return tasks.filter((t) => {
      if (selectedCategoryFilter !== 'all') {
        const cat = categoryPlans[selectedCategoryFilter];
        if (cat && !t.domain.toLowerCase().includes(selectedCategoryFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  };

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Top Header: Dual Date Hero */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
              Integrated Multi-Calendar
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Ethiopian (ዘመን አቆጣጠር) + Gregorian
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
            <span>{dualToday.ethiopianStr}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Gregorian: <span className="font-semibold text-slate-800 dark:text-slate-200">{dualToday.gregorianStr}</span>
          </p>
        </div>

        {/* Right Actions: Mode Switch & Add Category */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setMode('ethiopian')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'ethiopian'
                  ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🇪🇹 Ethiopian</span>
            </button>
            <button
              onClick={() => setMode('dual')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'dual'
                  ? 'bg-white text-purple-600 shadow-xs dark:bg-slate-900 dark:text-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🌗 Dual View</span>
            </button>
            <button
              onClick={() => setMode('gregorian')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'gregorian'
                  ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Globe size={13} />
              <span>Gregorian</span>
            </button>
          </div>

          {/* Add Mainstream Category Button */}
          <button
            onClick={() => openNewCategoryModal()}
            className="px-3.5 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus size={14} /> Add Category
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs font-bold">
        <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
          <Filter size={12} /> Pillar:
        </span>
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
            selectedCategoryFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          All Categories ({categoryList.length})
        </button>

        {categoryList.map((cat) => {
          const isSelected = selectedCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-white text-slate-900 shadow-xs border-slate-900 dark:bg-slate-900 dark:text-white dark:border-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        {/* Calendar Month Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{ethMonthData.monthMeta.am} ({ethMonthData.monthMeta.en})</span>
              <span className="text-[#0082ff] font-mono">{ethMonthData.year} ዓ.ም.</span>
            </h2>
            <span className="text-xs text-slate-400 hidden sm:inline">
              • 30 Days Cycle
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleJumpToday}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

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
            <div key={`empty-${i}`} className="min-h-[70px] sm:min-h-[90px] rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 border border-transparent" />
          ))}

          {/* Month Days */}
          {ethMonthData.days.map((dayItem) => {
            const isToday =
              dayItem.ethDay === todayEth.day &&
              dayItem.ethMonth === todayEth.month &&
              dayItem.ethYear === todayEth.year;

            const isSelected = selectedDate &&
              dayItem.gregDate.getFullYear() === selectedDate.getFullYear() &&
              dayItem.gregDate.getMonth() === selectedDate.getMonth() &&
              dayItem.gregDate.getDate() === selectedDate.getDate();

            const dayTasks = getTasksForGregorianDate(dayItem.gregDate);
            const gregShortStr = dayItem.gregDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div
                key={dayItem.ethDay}
                onClick={() => handleSelectDay(dayItem.gregDate)}
                className={`min-h-[75px] sm:min-h-[95px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 border-[#0082ff] ring-2 ring-[#0082ff] shadow-md scale-[1.02]'
                    : isToday
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#0082ff] shadow-xs'
                    : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm sm:text-base font-extrabold font-mono ${
                    isSelected ? 'text-[#0082ff]' : isToday ? 'text-[#0082ff]' : 'text-slate-900 dark:text-white'
                  }`}>
                    {dayItem.ethDay}
                  </span>

                  {(mode === 'dual' || mode === 'gregorian') && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {gregShortStr}
                    </span>
                  )}
                </div>

                {/* Scheduled Category Dots / Pills */}
                <div className="space-y-1 mt-1">
                  {dayTasks.slice(0, 2).map((t, tidx) => {
                    const matchedCat = categoryList.find((c) => t.domain.toLowerCase().includes(c.id.toLowerCase())) || categoryList[0];
                    return (
                      <div
                        key={tidx}
                        className="px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold truncate flex items-center gap-1"
                        style={{ backgroundColor: `${matchedCat.color}15`, color: matchedCat.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: matchedCat.color }} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    );
                  })}

                  {dayTasks.length > 2 && (
                    <span className="text-[9px] text-slate-400 font-bold block pl-1">
                      +{dayTasks.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Sticky Note View showing that day's tasks & blocks */}
      {selectedDate && (
        <div ref={stickyRef} className="space-y-3 pt-2 scroll-mt-24 animate-fadeIn">
          <div className="flex items-center justify-between px-2 max-w-xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-xl">📌</span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'am' ? 'የተመረጠው ቀን ስቲኪ ማስታወሻ' : 'Selected Day Sticky Note & Blocks'}
              </span>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg cursor-pointer transition"
            >
              {language === 'am' ? 'ዝጋ (✕)' : 'Close (✕)'}
            </button>
          </div>

          <BigDailyActivitiesStickyNote
            targetDate={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        </div>
      )}
    </div>
  );
};
