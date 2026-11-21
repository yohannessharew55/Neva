import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, Plus, Trash2, Edit2, Play, Clock, 
  Palette, Sparkles, CheckCircle2, ChevronRight, X, Maximize2, Minimize2
} from 'lucide-react';
import { useLivotion, StickyNoteColor } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { formatTaskDuration } from '../utils/formatDuration';
import { DurationPicker } from './DurationPicker';

interface DailyPlansStickyCardProps {
  categoryId: string;
  className?: string;
  isCompact?: boolean;
}

const STICKY_THEMES: Record<StickyNoteColor, {
  bg: string;
  border: string;
  text: string;
  subtext: string;
  tape: string;
  tapeBorder: string;
  checkboxBg: string;
  checkboxBorder: string;
  checkboxCheck: string;
  badgeBg: string;
  badgeText: string;
  inputBg: string;
  inputBorder: string;
  name: string;
  dotColor: string;
  ruledLine: string;
  marginLine: string;
}> = {
  yellow: {
    bg: 'bg-[#fef9c3]',
    border: 'border-[#fef08a]',
    text: 'text-amber-950',
    subtext: 'text-amber-800/80',
    tape: 'bg-amber-100/70',
    tapeBorder: 'border-amber-200/80',
    checkboxBg: 'bg-amber-50',
    checkboxBorder: 'border-amber-400',
    checkboxCheck: 'bg-amber-600 text-white',
    badgeBg: 'bg-amber-200/80',
    badgeText: 'text-amber-950',
    inputBg: 'bg-amber-100/60',
    inputBorder: 'border-amber-300/80',
    name: 'Canary Yellow',
    dotColor: '#fde047',
    ruledLine: 'rgba(217, 119, 6, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  mint: {
    bg: 'bg-[#dcfce7]',
    border: 'border-[#bbf7d0]',
    text: 'text-emerald-950',
    subtext: 'text-emerald-800/80',
    tape: 'bg-emerald-100/70',
    tapeBorder: 'border-emerald-200/80',
    checkboxBg: 'bg-emerald-50',
    checkboxBorder: 'border-emerald-400',
    checkboxCheck: 'bg-emerald-600 text-white',
    badgeBg: 'bg-emerald-200/80',
    badgeText: 'text-emerald-950',
    inputBg: 'bg-emerald-100/60',
    inputBorder: 'border-emerald-300/80',
    name: 'Pastel Mint',
    dotColor: '#86efac',
    ruledLine: 'rgba(5, 150, 105, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  cyan: {
    bg: 'bg-[#e0f2fe]',
    border: 'border-[#bae6fd]',
    text: 'text-sky-950',
    subtext: 'text-sky-800/80',
    tape: 'bg-sky-100/70',
    tapeBorder: 'border-sky-200/80',
    checkboxBg: 'bg-sky-50',
    checkboxBorder: 'border-sky-400',
    checkboxCheck: 'bg-sky-600 text-white',
    badgeBg: 'bg-sky-200/80',
    badgeText: 'text-sky-950',
    inputBg: 'bg-sky-100/60',
    inputBorder: 'border-sky-300/80',
    name: 'Sky Blue',
    dotColor: '#7dd3fc',
    ruledLine: 'rgba(2, 132, 199, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  peach: {
    bg: 'bg-[#ffedd5]',
    border: 'border-[#fed7aa]',
    text: 'text-orange-950',
    subtext: 'text-orange-800/80',
    tape: 'bg-orange-100/70',
    tapeBorder: 'border-orange-200/80',
    checkboxBg: 'bg-orange-50',
    checkboxBorder: 'border-orange-400',
    checkboxCheck: 'bg-orange-600 text-white',
    badgeBg: 'bg-orange-200/80',
    badgeText: 'text-orange-950',
    inputBg: 'bg-orange-100/60',
    inputBorder: 'border-orange-300/80',
    name: 'Warm Peach',
    dotColor: '#fdba74',
    ruledLine: 'rgba(234, 88, 12, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  rose: {
    bg: 'bg-[#ffe4e6]',
    border: 'border-[#fecdd3]',
    text: 'text-rose-950',
    subtext: 'text-rose-800/80',
    tape: 'bg-rose-100/70',
    tapeBorder: 'border-rose-200/80',
    checkboxBg: 'bg-rose-50',
    checkboxBorder: 'border-rose-400',
    checkboxCheck: 'bg-rose-600 text-white',
    badgeBg: 'bg-rose-200/80',
    badgeText: 'text-rose-950',
    inputBg: 'bg-rose-100/60',
    inputBorder: 'border-rose-300/80',
    name: 'Soft Rose',
    dotColor: '#fda4af',
    ruledLine: 'rgba(225, 29, 72, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  lavender: {
    bg: 'bg-[#f3e8ff]',
    border: 'border-[#e9d5ff]',
    text: 'text-purple-950',
    subtext: 'text-purple-800/80',
    tape: 'bg-purple-100/70',
    tapeBorder: 'border-purple-200/80',
    checkboxBg: 'bg-purple-50',
    checkboxBorder: 'border-purple-400',
    checkboxCheck: 'bg-purple-600 text-white',
    badgeBg: 'bg-purple-200/80',
    badgeText: 'text-purple-950',
    inputBg: 'bg-purple-100/60',
    inputBorder: 'border-purple-300/80',
    name: 'Lavender',
    dotColor: '#d8b4fe',
    ruledLine: 'rgba(147, 51, 234, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  darkgrey: {
    bg: 'bg-[#1e293b]',
    border: 'border-[#334155]',
    text: 'text-slate-100',
    subtext: 'text-slate-400',
    tape: 'bg-slate-700/60',
    tapeBorder: 'border-slate-600/70',
    checkboxBg: 'bg-slate-800',
    checkboxBorder: 'border-slate-500',
    checkboxCheck: 'bg-[#0082ff] text-white',
    badgeBg: 'bg-slate-700/80',
    badgeText: 'text-slate-100',
    inputBg: 'bg-slate-900',
    inputBorder: 'border-slate-700',
    name: 'Dark Slate Grey',
    dotColor: '#334155',
    ruledLine: 'rgba(255, 255, 255, 0.05)',
    marginLine: 'rgba(244, 63, 94, 0.25)',
  },
  charcoal: {
    bg: 'bg-[#18181b]',
    border: 'border-[#27272a]',
    text: 'text-zinc-100',
    subtext: 'text-zinc-400',
    tape: 'bg-zinc-800/60',
    tapeBorder: 'border-zinc-700/70',
    checkboxBg: 'bg-zinc-800',
    checkboxBorder: 'border-zinc-600',
    checkboxCheck: 'bg-emerald-600 text-white',
    badgeBg: 'bg-zinc-800/80',
    badgeText: 'text-zinc-100',
    inputBg: 'bg-zinc-900',
    inputBorder: 'border-zinc-700',
    name: 'Charcoal Dark Grey',
    dotColor: '#262626',
    ruledLine: 'rgba(255, 255, 255, 0.05)',
    marginLine: 'rgba(239, 68, 68, 0.25)',
  },
  graphite: {
    bg: 'bg-[#111827]',
    border: 'border-[#1f2937]',
    text: 'text-gray-100',
    subtext: 'text-gray-400',
    tape: 'bg-gray-800/60',
    tapeBorder: 'border-gray-700/70',
    checkboxBg: 'bg-gray-800',
    checkboxBorder: 'border-gray-600',
    checkboxCheck: 'bg-purple-600 text-white',
    badgeBg: 'bg-gray-800/80',
    badgeText: 'text-gray-100',
    inputBg: 'bg-gray-900',
    inputBorder: 'border-gray-700',
    name: 'Graphite Dark Grey',
    dotColor: '#374151',
    ruledLine: 'rgba(255, 255, 255, 0.05)',
    marginLine: 'rgba(244, 63, 94, 0.25)',
  },
};

export const DailyPlansStickyCard: React.FC<DailyPlansStickyCardProps> = ({ 
  categoryId, 
  className = '',
  isCompact = false 
}) => {
  const { 
    categoryPlans, 
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    startTask,
    activeTask,
    isRunning,
    setCategoryStickyNoteColor,
    dailyStickyColor,
    language,
    t
  } = useLivotion();

  const category = categoryPlans[categoryId];
  const mappedColor: StickyNoteColor = dailyStickyColor === 'canary' ? 'yellow' : (dailyStickyColor === 'sky' ? 'cyan' : (dailyStickyColor as StickyNoteColor));
  const noteColor: StickyNoteColor = category?.stickyNoteColor || mappedColor || 'yellow';
  const theme = STICKY_THEMES[noteColor] || STICKY_THEMES.yellow;

  // Resolve domain types for this category
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

  const domainTypes = getDomainTypesForCat(categoryId);
  const categoryTasks = tasks.filter((t) => domainTypes.includes(t.domain));

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    let hours = d.getHours();
    const minutes = d.getMinutes() < 30 ? '00' : '30';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours < 10 ? '0' + hours : hours}:${minutes} ${ampm}`;
  });
  const [newDurationMin, setNewDurationMin] = useState<number>(45);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // True Native Mobile Touch + Desktop Double-Tap Detection for Sticky Paper
  const lastTouchTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const blockToggleUntilRef = useRef<number>(0);

  const handlePaperTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handlePaperTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, select, input, textarea, a, [role="button"], form, .group\\/task, [data-no-fullscreen-toggle]')) {
      return;
    }

    if (Date.now() < blockToggleUntilRef.current) {
      return;
    }

    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const moveDistance = Math.hypot(endX - touchStartPosRef.current.x, endY - touchStartPosRef.current.y);
      if (moveDistance > 35) return;

      const now = Date.now();
      const timeSinceLast = now - lastTouchTimeRef.current;
      if (timeSinceLast >= 50 && timeSinceLast <= 650) {
        e.stopPropagation();
        lastTouchTimeRef.current = 0;
        blockToggleUntilRef.current = now + 1000;
        setIsFullScreen((prev) => !prev);
      } else {
        lastTouchTimeRef.current = now;
      }
    }
  };

  const handlePaperDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, select, input, textarea, a, [role="button"], form, .group\\/task, [data-no-fullscreen-toggle]')) {
      return;
    }
    if (Date.now() < blockToggleUntilRef.current) {
      return;
    }
    e.stopPropagation();
    blockToggleUntilRef.current = Date.now() + 1000;
    setIsFullScreen((prev) => !prev);
  };

  const handleTopDoubleTap = handlePaperTouchEnd;
  const handleTopDoubleClick = handlePaperDoubleClick;

  // Full Screen Scroll Lock and Escape Key handling
  useEffect(() => {
    if (!isFullScreen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // In-line task editing state (allows modifying title, time, and duration)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editDurationMin, setEditDurationMin] = useState<number>(45);

  const startEditTask = (task: ScheduleTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditStartTime(task.startTime || '02:00 PM');
    setEditDurationMin(task.durationMin || 45);
  };

  const handleSaveEditTask = (taskId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitle.trim()) return;

    updateTask(taskId, {
      title: editTitle.trim(),
      startTime: editStartTime.trim() || 'Flexible',
      durationMin: Number(editDurationMin),
    });

    setEditingTaskId(null);
  };

  const completedCount = categoryTasks.filter((t) => t.completed).length;
  const totalCount = categoryTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalHoursPlanned = (categoryTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0) / 60).toFixed(1);

  const handleCreateBlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;

    addTask({
      domain: domainTypes[0],
      title: newTitle.trim(),
      startTime: newStartTime.trim() || 'Flexible',
      durationMin: Number(newDurationMin),
      completed: false,
      color: category?.color || '#0082ff',
      badge: category?.title?.split(' ')[0] || 'Focus',
      checklist: [
        { id: `c-${Date.now()}-1`, text: 'Warm-up & mental setup', done: false },
        { id: `c-${Date.now()}-2`, text: 'Core deliberate execution', done: false },
      ],
    });

    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div 
      onClick={(e) => {
        // Tapping the dark backdrop outside the paper exits full screen
        if (isFullScreen && e.target === e.currentTarget) {
          setIsFullScreen(false);
        }
      }}
      className={
      isFullScreen
        ? "fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),24px)] px-2.5 sm:px-4 flex flex-col items-center justify-start animate-in fade-in duration-200"
        : `relative transition-all duration-300 group/sticky ${className}`
    }>
      <div className={isFullScreen ? "relative w-full max-w-lg sm:max-w-2xl flex-1 flex flex-col my-1 py-1" : "relative w-full"}>
        {/* 1. Translucent Frosted Washi Tape at Top Center */}
        <div 
          onTouchStart={handlePaperTouchStart}
          onTouchEnd={handlePaperTouchEnd}
          onDoubleClick={handlePaperDoubleClick}
          className={`w-24 h-5 mx-auto -mb-3 rounded-xs shadow-2xs rotate-0.5 border backdrop-blur-xs select-none z-20 relative cursor-pointer touch-manipulation active:scale-95 transition-transform ${theme.tape} ${theme.tapeBorder}`}
          title={isFullScreen ? "Double Tap to Exit Full Screen" : "Double Tap to View Full Screen"}
        />

        {/* The Authentic Sticky Note Paper Card - Double tap on clear area toggles full screen */}
        <div 
          onTouchStart={handlePaperTouchStart}
          onTouchEnd={handlePaperTouchEnd}
          onDoubleClick={handlePaperDoubleClick}
          className={`relative p-5 sm:p-6 rounded-3xl border shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden touch-manipulation select-none ${isFullScreen ? 'flex-1 min-h-[85vh] sm:min-h-[88vh] shadow-2xl flex flex-col' : ''} ${theme.bg} ${theme.border} ${theme.text}`}
        >
        {/* Lined Paper Lines Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, ${theme.ruledLine} 28px)`,
          }}
        />

        {/* Sticky Note Corner Fold */}
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.12) 50%)',
          }}
        />

        {/* Card Header - Double tap / click to toggle full screen */}
        <div 
          onDoubleClick={handleTopDoubleClick}
          onTouchEnd={handleTopDoubleTap}
          className="flex items-start justify-between gap-3 pb-3 border-b border-black/10 relative z-10 cursor-pointer touch-manipulation select-none"
          title={isFullScreen ? "Double tap to exit full screen" : "Double tap to view full screen"}
        >
          <div className="pointer-events-none">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base uppercase tracking-tight flex items-center gap-1.5">
                {category?.title} {language === 'am' ? 'የትኩረት ዕቅዶች' : 'Focus Blocks & Daily Intentions'}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                {completedCount}/{totalCount} {language === 'am' ? 'ተጠናቋል' : 'done'}
              </span>
              {totalCount > 0 && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                  {formatTaskDuration(categoryTasks.reduce((sum, t) => sum + (t.durationMin || 0), 0))} {language === 'am' ? 'እቅድ' : 'planned'}
                </span>
              )}
            </div>
            <p className={`text-[11px] font-medium mt-0.5 ${theme.subtext}`}>
              {language === 'am' ? 'የዛሬው ልዩ ትኩረት፣ የታቀዱ ሰዓታት እና ተግባራት' : "Today's deliberate focus blocks, schedule & execution"}
            </p>
          </div>

          {/* Top Actions: Add Button, Color Switcher & Full Screen */}
          <div className="flex items-center gap-1.5 pr-6 relative z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAdding(!isAdding);
              }}
              className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isAdding ? 'bg-black/15' : 'bg-black/5 hover:bg-black/10'
              }`}
              title={isAdding ? 'Close form' : 'Add focus block'}
            >
              {isAdding ? <X size={13} /> : <Plus size={13} />}
              <span className="hidden sm:inline">{isAdding ? 'Close' : 'Add'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPalette(!showColorPalette);
              }}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-xl opacity-70 hover:opacity-100 transition cursor-pointer flex items-center justify-center"
              title="Change Sticky Note Color"
            >
              <Palette size={14} />
            </button>

            {/* Full Screen Symbol Button - Beside color palette */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullScreen(!isFullScreen);
              }}
              className="p-1.5 min-w-[28px] min-h-[28px] rounded-xl opacity-70 hover:opacity-100 transition cursor-pointer flex items-center justify-center text-current"
              title={isFullScreen ? "Exit Full Screen" : "View Full Screen"}
              aria-label="Toggle Full Screen"
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Color Palette Popover */}
            {showColorPalette && (
              <div className="absolute right-0 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 z-40">
                {(Object.keys(STICKY_THEMES) as StickyNoteColor[]).map((cKey) => (
                  <button
                    key={cKey}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryStickyNoteColor(categoryId, cKey);
                      setShowColorPalette(false);
                    }}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      noteColor === cKey ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: STICKY_THEMES[cKey].dotColor }}
                    title={STICKY_THEMES[cKey].name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mini Progress Bar */}
        {totalCount > 0 && (
          <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden my-3 relative z-10">
            <div 
              className="h-full bg-current transition-all duration-300 opacity-80"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Sticky Note Interactive Focus Blocks List */}
        <div className="space-y-2.5 py-2 relative z-10 min-h-[90px]">
          {categoryTasks.map((task) => {
            const isTaskActive = isRunning && activeTask?.id === task.id;
            const isEditing = editingTaskId === task.id;

            if (isEditing) {
              return (
                <form 
                  key={task.id}
                  onSubmit={(e) => handleSaveEditTask(task.id, e)}
                  className="p-3 rounded-2xl bg-white/90 border border-black/15 space-y-2 shadow-2xs"
                >
                  <div className="w-full">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Task title..."
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-black/10 outline-none focus:border-[#0082ff] text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-white border border-black/10 rounded-xl px-2 py-1 text-xs text-slate-900">
                        <Clock size={11} className="opacity-50" />
                        <input
                          type="text"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          placeholder="09:00 PM"
                          className="w-18 bg-transparent text-[11px] font-mono outline-none text-center font-bold"
                        />
                      </div>

                      <DurationPicker
                        value={editDurationMin}
                        onChange={setEditDurationMin}
                        size="xs"
                      />
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 transition cursor-pointer text-slate-600"
                        title={language === 'am' ? 'ተው' : 'Cancel'}
                        aria-label="Cancel"
                      >
                        <X size={14} />
                      </button>
                      <button
                        type="submit"
                        className="p-1 px-1.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-lg shadow-2xs cursor-pointer flex items-center justify-center"
                        title={language === 'am' ? 'አስቀምጥ' : 'Save'}
                        aria-label="Save"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </form>
              );
            }

            return (
              <div 
                key={task.id}
                className={`group/task flex items-center justify-between gap-2.5 text-xs font-semibold p-2 sm:p-2.5 rounded-2xl transition-all border ${
                  task.completed
                    ? 'bg-black/5 border-transparent opacity-60'
                    : isTaskActive
                    ? 'bg-white/80 border-[#0082ff] shadow-sm ring-1 ring-[#0082ff]/50'
                    : 'bg-white/60 hover:bg-white/90 border-black/5'
                }`}
              >
                {/* Left: Checkbox & Task Information */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      task.completed 
                        ? `${theme.checkboxCheck} border-transparent` 
                        : `${theme.checkboxBg} ${theme.checkboxBorder} hover:scale-110`
                    }`}
                    title={task.completed ? 'Mark uncompleted' : 'Mark done'}
                  >
                    {task.completed && <Check size={11} strokeWidth={3} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${theme.badgeBg} ${theme.badgeText} shrink-0`}>
                        {task.startTime || 'Flexible'}
                      </span>
                      <span 
                        onClick={() => startEditTask(task)}
                        className={`truncate text-xs font-bold cursor-pointer select-none ${
                          task.completed ? 'line-through opacity-60' : 'hover:underline'
                        }`}
                        title={language === 'am' ? 'ለመቀየር ይንኩ' : 'Click to edit task'}
                      >
                        {task.title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Duration Pill, Hidden on Mobile Play Button, Edit Button & Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span 
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                    title={`${task.durationMin} minutes focus`}
                  >
                    {formatTaskDuration(task.durationMin)}
                  </span>

                  {/* Play Button - HIDDEN ON MOBILE (Desktop only) */}
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => startTask(task)}
                      className={`hidden sm:flex px-2.5 py-1 rounded-xl text-xs font-bold transition items-center gap-1 cursor-pointer shadow-2xs ${
                        isTaskActive
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-[#0082ff] hover:bg-[#0070df] text-white'
                      }`}
                      title={isTaskActive ? 'Focus timer running' : 'Start Focus Timer'}
                    >
                      <Play size={10} fill="currentColor" />
                      <span>{isTaskActive ? 'Focusing...' : 'Focus'}</span>
                    </button>
                  )}

                  {/* Edit Button (Pencil) - Fully accessible on mobile & desktop */}
                  <button
                    type="button"
                    onClick={() => startEditTask(task)}
                    className="p-1 text-slate-400 hover:text-[#0082ff] rounded-lg hover:bg-black/5 transition cursor-pointer"
                    title={language === 'am' ? 'ቀይር' : 'Edit Focus Block'}
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-black/5 transition cursor-pointer"
                    title="Delete Focus Block"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {categoryTasks.length === 0 && !isAdding && (
            <div className="py-7 text-center space-y-2 border border-dashed border-black/15 rounded-2xl">
              <p className="text-xs font-medium opacity-70">
                {language === 'am' 
                  ? `ለዚህ ክፍል የተያዘ የትኩረት ክፍለ-ጊዜ የለም። አዲስ የትኩረት እቅድ ይጨምሩ!` 
                  : `No focus blocks scheduled for ${category?.title || 'this category'} yet.`}
              </p>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="px-3 py-1.5 bg-[#0082ff] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus size={12} /> {language === 'am' ? 'የትኩረት ክፍለ-ጊዜ ጨምር' : 'Add First Focus Block'}
              </button>
            </div>
          )}
        </div>

        {/* Quick Add Form (Responsive: Won't pass lines or overflow on mobile) */}
        {isAdding && (
          <form 
            onSubmit={handleCreateBlock}
            className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-black/5 border border-black/10 space-y-2.5 relative z-10 w-full"
          >
            {/* Row 1: Title Input */}
            <div className="w-full">
              <input
                type="text"
                required
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={language === 'am' ? 'የትኩረት ተግባር ርዕስ (ምሳሌ፡ የቼዝ ስልጠና)...' : 'Focus block or intention title...'}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white/90 border border-black/15 outline-none font-semibold placeholder:opacity-60 focus:border-[#0082ff] shadow-2xs text-slate-900"
              />
            </div>

            {/* Row 2: Start Time, Duration & Actions */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap pt-0.5">
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Time picker */}
                <div className="flex items-center gap-1 bg-white/90 border border-black/15 rounded-xl px-2.5 py-1.5 text-xs text-slate-900">
                  <Clock size={12} className="opacity-50 shrink-0" />
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="02:00 PM"
                    className="w-20 bg-transparent text-[11px] font-mono outline-none text-center font-bold"
                  />
                </div>

                {/* Duration select with custom minute support */}
                <DurationPicker
                  value={newDurationMin}
                  onChange={setNewDurationMin}
                  size="sm"
                />
              </div>

              {/* Action buttons - ONLY ICONS */}
              <div className="flex items-center gap-1 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1.5 rounded-xl opacity-70 hover:opacity-100 hover:bg-black/10 transition cursor-pointer flex items-center justify-center text-slate-600"
                  title={language === 'am' ? 'ተው' : 'Cancel'}
                  aria-label="Cancel"
                >
                  <X size={15} />
                </button>
                <button
                  type="submit"
                  className="p-1.5 px-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl shadow-xs cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
                  title={language === 'am' ? 'አስቀምጥ' : 'Pin Block'}
                  aria-label="Pin Block"
                >
                  <Check size={15} strokeWidth={3} />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
      </div>
    </div>
  );
};
