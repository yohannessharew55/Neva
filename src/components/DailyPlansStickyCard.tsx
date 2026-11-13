import React, { useState } from 'react';
import { 
  Check, Plus, Trash2, Edit2, Play, Clock, 
  Palette, Sparkles, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { useLivotion, StickyNoteColor } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';

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
    bg: 'bg-[#fef9c3] dark:bg-[#2c2405]',
    border: 'border-[#fef08a] dark:border-amber-700/60',
    text: 'text-amber-950 dark:text-amber-100',
    subtext: 'text-amber-800/80 dark:text-amber-300/80',
    tape: 'bg-amber-100/70 dark:bg-amber-900/40',
    tapeBorder: 'border-amber-200/80 dark:border-amber-700/40',
    checkboxBg: 'bg-amber-50 dark:bg-amber-950/60',
    checkboxBorder: 'border-amber-400 dark:border-amber-600',
    checkboxCheck: 'bg-amber-600 text-white',
    badgeBg: 'bg-amber-200/80 dark:bg-amber-900/70',
    badgeText: 'text-amber-950 dark:text-amber-200',
    inputBg: 'bg-amber-100/60 dark:bg-amber-950/40',
    inputBorder: 'border-amber-300/80 dark:border-amber-700/60',
    name: 'Canary Yellow',
    dotColor: '#fde047',
    ruledLine: 'rgba(217, 119, 6, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  mint: {
    bg: 'bg-[#dcfce7] dark:bg-[#062615]',
    border: 'border-[#bbf7d0] dark:border-emerald-700/60',
    text: 'text-emerald-950 dark:text-emerald-100',
    subtext: 'text-emerald-800/80 dark:text-emerald-300/80',
    tape: 'bg-emerald-100/70 dark:bg-emerald-900/40',
    tapeBorder: 'border-emerald-200/80 dark:border-emerald-700/40',
    checkboxBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    checkboxBorder: 'border-emerald-400 dark:border-emerald-600',
    checkboxCheck: 'bg-emerald-600 text-white',
    badgeBg: 'bg-emerald-200/80 dark:bg-emerald-900/70',
    badgeText: 'text-emerald-950 dark:text-emerald-200',
    inputBg: 'bg-emerald-100/60 dark:bg-emerald-950/40',
    inputBorder: 'border-emerald-300/80 dark:border-emerald-700/60',
    name: 'Pastel Mint',
    dotColor: '#86efac',
    ruledLine: 'rgba(5, 150, 105, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  cyan: {
    bg: 'bg-[#e0f2fe] dark:bg-[#072436]',
    border: 'border-[#bae6fd] dark:border-sky-700/60',
    text: 'text-sky-950 dark:text-sky-100',
    subtext: 'text-sky-800/80 dark:text-sky-300/80',
    tape: 'bg-sky-100/70 dark:bg-sky-900/40',
    tapeBorder: 'border-sky-200/80 dark:border-sky-700/40',
    checkboxBg: 'bg-sky-50 dark:bg-sky-950/60',
    checkboxBorder: 'border-sky-400 dark:border-sky-600',
    checkboxCheck: 'bg-sky-600 text-white',
    badgeBg: 'bg-sky-200/80 dark:bg-sky-900/70',
    badgeText: 'text-sky-950 dark:text-sky-200',
    inputBg: 'bg-sky-100/60 dark:bg-sky-950/40',
    inputBorder: 'border-sky-300/80 dark:border-sky-700/60',
    name: 'Sky Blue',
    dotColor: '#7dd3fc',
    ruledLine: 'rgba(2, 132, 199, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  peach: {
    bg: 'bg-[#ffedd5] dark:bg-[#2e1507]',
    border: 'border-[#fed7aa] dark:border-orange-700/60',
    text: 'text-orange-950 dark:text-orange-100',
    subtext: 'text-orange-800/80 dark:text-orange-300/80',
    tape: 'bg-orange-100/70 dark:bg-orange-900/40',
    tapeBorder: 'border-orange-200/80 dark:border-orange-700/40',
    checkboxBg: 'bg-orange-50 dark:bg-orange-950/60',
    checkboxBorder: 'border-orange-400 dark:border-orange-600',
    checkboxCheck: 'bg-orange-600 text-white',
    badgeBg: 'bg-orange-200/80 dark:bg-orange-900/70',
    badgeText: 'text-orange-950 dark:text-orange-200',
    inputBg: 'bg-orange-100/60 dark:bg-orange-950/40',
    inputBorder: 'border-orange-300/80 dark:border-orange-700/60',
    name: 'Warm Peach',
    dotColor: '#fdba74',
    ruledLine: 'rgba(234, 88, 12, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  rose: {
    bg: 'bg-[#ffe4e6] dark:bg-[#2e0915]',
    border: 'border-[#fecdd3] dark:border-rose-700/60',
    text: 'text-rose-950 dark:text-rose-100',
    subtext: 'text-rose-800/80 dark:text-rose-300/80',
    tape: 'bg-rose-100/70 dark:bg-rose-900/40',
    tapeBorder: 'border-rose-200/80 dark:border-rose-700/40',
    checkboxBg: 'bg-rose-50 dark:bg-rose-950/60',
    checkboxBorder: 'border-rose-400 dark:border-rose-600',
    checkboxCheck: 'bg-rose-600 text-white',
    badgeBg: 'bg-rose-200/80 dark:bg-rose-900/70',
    badgeText: 'text-rose-950 dark:text-rose-200',
    inputBg: 'bg-rose-100/60 dark:bg-rose-950/40',
    inputBorder: 'border-rose-300/80 dark:border-rose-700/60',
    name: 'Soft Rose',
    dotColor: '#fda4af',
    ruledLine: 'rgba(225, 29, 72, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
  },
  lavender: {
    bg: 'bg-[#f3e8ff] dark:bg-[#250936]',
    border: 'border-[#e9d5ff] dark:border-purple-700/60',
    text: 'text-purple-950 dark:text-purple-100',
    subtext: 'text-purple-800/80 dark:text-purple-300/80',
    tape: 'bg-purple-100/70 dark:bg-purple-900/40',
    tapeBorder: 'border-purple-200/80 dark:border-purple-700/40',
    checkboxBg: 'bg-purple-50 dark:bg-purple-950/60',
    checkboxBorder: 'border-purple-400 dark:border-purple-600',
    checkboxCheck: 'bg-purple-600 text-white',
    badgeBg: 'bg-purple-200/80 dark:bg-purple-900/70',
    badgeText: 'text-purple-950 dark:text-purple-200',
    inputBg: 'bg-purple-100/60 dark:bg-purple-950/40',
    inputBorder: 'border-purple-300/80 dark:border-purple-700/60',
    name: 'Lavender',
    dotColor: '#d8b4fe',
    ruledLine: 'rgba(147, 51, 234, 0.08)',
    marginLine: 'rgba(225, 29, 72, 0.15)',
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
    language,
    t
  } = useLivotion();

  const category = categoryPlans[categoryId];
  const noteColor: StickyNoteColor = category?.stickyNoteColor || 'yellow';
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
    <div className={`relative transition-all duration-300 group/sticky ${className}`}>
      {/* 1. Translucent Frosted Washi Tape at Top Center */}
      <div 
        className={`w-24 h-5 mx-auto -mb-3 rounded-xs shadow-2xs rotate-0.5 border backdrop-blur-xs select-none z-20 relative ${theme.tape} ${theme.tapeBorder}`}
        title="Washi Tape"
      />

      {/* 2. Pushpin pinned on the top right */}
      <div 
        className="absolute top-2 right-4 text-xl filter drop-shadow-xs select-none z-30 transition-transform group-hover/sticky:scale-110"
        title="Pinned Category Focus Note"
      >
        📌
      </div>

      {/* 3. The Authentic Sticky Note Paper Card */}
      <div 
        className={`relative p-5 sm:p-6 rounded-3xl border shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden ${theme.bg} ${theme.border} ${theme.text}`}
      >
        {/* Lined Paper Lines Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, ${theme.ruledLine} 28px)`,
          }}
        />

        {/* Red/Rose Left Margin Line */}
        <div 
          className="absolute top-0 bottom-0 left-9 sm:left-11 w-px pointer-events-none"
          style={{ backgroundColor: theme.marginLine }}
        />

        {/* Sticky Note Corner Fold */}
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.12) 50%)',
          }}
        />

        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base uppercase tracking-tight flex items-center gap-1.5">
                {category?.title} {language === 'am' ? 'የትኩረት ዕቅዶች' : 'Focus Blocks & Daily Intentions'}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                {completedCount}/{totalCount} {language === 'am' ? 'ተጠናቋል' : 'done'}
              </span>
              {totalCount > 0 && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText}`}>
                  {totalHoursPlanned}h {language === 'am' ? 'እቅድ' : 'planned'}
                </span>
              )}
            </div>
            <p className={`text-[11px] font-medium mt-0.5 ${theme.subtext}`}>
              {language === 'am' ? 'የዛሬው ልዩ ትኩረት፣ የታቀዱ ሰዓታት እና ተግባራት' : "Today's deliberate focus blocks, schedule & execution"}
            </p>
          </div>

          {/* Top Actions: Add Button & Color Switcher */}
          <div className="flex items-center gap-1.5 pr-6 relative">
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isAdding ? 'bg-black/15 dark:bg-white/20' : 'bg-black/5 hover:bg-black/10 dark:bg-white/10'
              }`}
              title={isAdding ? 'Close form' : 'Add focus block'}
            >
              {isAdding ? <X size={13} /> : <Plus size={13} />}
              <span className="hidden sm:inline">{isAdding ? 'Close' : 'Add'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowColorPalette(!showColorPalette)}
              className="p-1.5 rounded-xl opacity-70 hover:opacity-100 transition cursor-pointer"
              title="Change Sticky Note Color"
            >
              <Palette size={14} />
            </button>

            {/* Color Palette Popover */}
            {showColorPalette && (
              <div className="absolute right-0 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 z-40">
                {(Object.keys(STICKY_THEMES) as StickyNoteColor[]).map((cKey) => (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => {
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
          <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden my-3 relative z-10">
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
                  className="p-3 rounded-2xl bg-white/90 dark:bg-black/40 border border-black/15 dark:border-white/15 space-y-2 shadow-2xs"
                >
                  <div className="w-full">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Task title..."
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 outline-none focus:border-[#0082ff]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-2 py-1 text-xs">
                        <Clock size={11} className="opacity-50" />
                        <input
                          type="text"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          placeholder="09:00 PM"
                          className="w-18 bg-transparent text-[11px] font-mono outline-none text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-2 py-1 text-xs">
                        <select
                          value={editDurationMin}
                          onChange={(e) => setEditDurationMin(Number(e.target.value))}
                          className="bg-transparent text-[11px] font-mono outline-none font-bold cursor-pointer"
                        >
                          <option value={15} className="text-black">15m (0.2h)</option>
                          <option value={30} className="text-black">30m (0.5h)</option>
                          <option value={45} className="text-black">45m (0.8h)</option>
                          <option value={60} className="text-black">60m (1.0h)</option>
                          <option value={90} className="text-black">90m (1.5h)</option>
                          <option value={120} className="text-black">120m (2.0h)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer text-slate-600 dark:text-slate-300"
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
                    ? 'bg-black/5 dark:bg-white/5 border-transparent opacity-60'
                    : isTaskActive
                    ? 'bg-white/80 dark:bg-black/40 border-[#0082ff] shadow-sm ring-1 ring-[#0082ff]/50'
                    : 'bg-white/60 hover:bg-white/90 dark:bg-black/20 dark:hover:bg-black/40 border-black/5 dark:border-white/5'
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
                    {(task.durationMin / 60).toFixed(1)}h
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
                    className="p-1 text-slate-400 hover:text-[#0082ff] dark:hover:text-[#0082ff] rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    title={language === 'am' ? 'ቀይር' : 'Edit Focus Block'}
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    title="Delete Focus Block"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {categoryTasks.length === 0 && !isAdding && (
            <div className="py-7 text-center space-y-2 border border-dashed border-black/15 dark:border-white/15 rounded-2xl">
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
            className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2.5 relative z-10 w-full"
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
                className="w-full px-3 py-2 rounded-xl text-xs bg-white/90 dark:bg-black/50 border border-black/15 dark:border-white/15 outline-none font-semibold placeholder:opacity-60 focus:border-[#0082ff] shadow-2xs"
              />
            </div>

            {/* Row 2: Start Time, Duration & Actions */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap pt-0.5">
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Time picker */}
                <div className="flex items-center gap-1 bg-white/90 dark:bg-black/50 border border-black/15 dark:border-white/15 rounded-xl px-2.5 py-1.5 text-xs">
                  <Clock size={12} className="opacity-50 shrink-0" />
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="02:00 PM"
                    className="w-20 bg-transparent text-[11px] font-mono outline-none text-center font-bold"
                  />
                </div>

                {/* Duration select */}
                <div className="flex items-center gap-1 bg-white/90 dark:bg-black/50 border border-black/15 dark:border-white/15 rounded-xl px-2 py-1.5 text-xs">
                  <select
                    value={newDurationMin}
                    onChange={(e) => setNewDurationMin(Number(e.target.value))}
                    className="bg-transparent text-[11px] font-mono outline-none cursor-pointer font-bold"
                  >
                    <option value={15} className="text-black">15m</option>
                    <option value={30} className="text-black">30m</option>
                    <option value={45} className="text-black">45m</option>
                    <option value={60} className="text-black">60m</option>
                    <option value={90} className="text-black">90m</option>
                    <option value={120} className="text-black">120m</option>
                  </select>
                </div>
              </div>

              {/* Action buttons - ONLY ICONS */}
              <div className="flex items-center gap-1 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1.5 rounded-xl opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer flex items-center justify-center text-slate-600 dark:text-slate-300"
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
  );
};
