import React, { useState, useEffect } from 'react';
import { 
  X, Check, Edit2, Trash2, Plus, Clock, Swords, Dumbbell, Palette, 
  Music, Building2, TrendingUp, BookOpen, Shield, Sparkles, CheckSquare,
  AlertCircle, ArrowRight
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { ScheduleSaveScopeModal, ScheduleSaveScope } from './ScheduleSaveScopeModal';
import { soundEngine } from '../utils/audio';
import { gregorianToEthiopian, ETHIOPIAN_MONTHS, AMHARIC_DAYS } from '../utils/ethiopianCalendar';

interface CalendarDayBlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  initialEditingTaskId?: string | null;
}

export const CalendarDayBlockEditorModal: React.FC<CalendarDayBlockEditorModalProps> = ({
  isOpen,
  onClose,
  date,
  initialEditingTaskId,
}) => {
  const { 
    language, 
    categoryPlans, 
    getDaySchedule, 
    materializeDaySchedule,
    applyTaskActionWithScope 
  } = useLivotion();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(initialEditingTaskId || null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editDurationMin, setEditDurationMin] = useState(45);
  const [editCategoryKey, setEditCategoryKey] = useState('chess');

  // Quick Add State inside Modal
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryKey, setNewCategoryKey] = useState('chess');
  const [newStartTime, setNewStartTime] = useState('09:00 AM');
  const [newDurationMin, setNewDurationMin] = useState(45);

  // Scope Prompt State
  const [pendingScopeAction, setPendingScopeAction] = useState<{
    isOpen: boolean;
    action: 'edit' | 'create' | 'delete';
    title?: string;
    itemDescription?: string;
    taskId?: string;
    originalTask?: ScheduleTask;
    updatedTaskData?: Partial<ScheduleTask>;
    newTaskData?: Omit<ScheduleTask, 'id'>;
  } | null>(null);

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dayOfWeek = (date.getDay() + 6) % 7 + 1; // 1 = Mon ... 7 = Sun
  const daySchedule = getDaySchedule(date);
  const dayTasks = daySchedule.tasks;
  const isCustomDay = daySchedule.isCustom;

  const startEdit = (task: ScheduleTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditStartTime(task.startTime || '08:00 AM');
    setEditDurationMin(task.durationMin || 45);
    const matchedCat = Object.keys(categoryPlans).find((k) => 
      task.domain.toLowerCase().includes(k) || (task.badge && task.badge.toLowerCase().includes(k))
    ) || 'chess';
    setEditCategoryKey(matchedCat);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (initialEditingTaskId) {
      const task = dayTasks.find((t) => t.id === initialEditingTaskId);
      if (task) {
        startEdit(task);
      }
    } else {
      setEditingTaskId(null);
    }
  }, [isOpen, initialEditingTaskId, dateStr]);

  if (!isOpen) return null;

  const ethDate = gregorianToEthiopian(date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const gregFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const amharicDay = (AMHARIC_DAYS[date.getDay()] as any)?.am || (AMHARIC_DAYS[date.getDay()] as any)?.amharic || '';
  const ethMonthName = (ETHIOPIAN_MONTHS[ethDate.month - 1] as any)?.am || (ETHIOPIAN_MONTHS[ethDate.month - 1] as any)?.amharic || '';

  const categoryList = Object.entries(categoryPlans).map(([id, plan]) => ({
    id,
    title: plan.title,
    color: plan.color,
  }));

  const getDomainForCategory = (catKey: string): DomainType => {
    switch (catKey) {
      case 'exercise': return 'PHYSICAL_FITNESS';
      case 'chess': return 'CHESS';
      case 'art': return 'OIL_PAINTING';
      case 'music': return 'GUITAR';
      case 'architecture': return 'ARCHITECTURE_DESIGN';
      case 'trading': return 'FOREX_TRADING';
      case 'devotion': return 'DEVOTION_PRAYER';
      default: return 'OPEN_MULTIPURPOSE';
    }
  };

  const getCategoryIcon = (key: string) => {
    switch (key) {
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

  const handleSaveEdit = (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const originalTask = dayTasks.find((t) => t.id === taskId);
    const catPlan = categoryPlans[editCategoryKey] || categoryPlans['chess'];
    const domain = getDomainForCategory(editCategoryKey);

    setPendingScopeAction({
      isOpen: true,
      action: 'edit',
      title: language === 'am' ? 'የብሎክ ለውጥ አስቀምጥ' : 'Save Block Changes',
      itemDescription: `"${editTitle.trim()}" (${editStartTime} • ${editDurationMin}m)`,
      taskId,
      originalTask,
      updatedTaskData: {
        title: editTitle.trim(),
        startTime: editStartTime.trim() || 'Flexible',
        durationMin: Number(editDurationMin),
        domain,
        badge: catPlan?.title?.split(' ')[0] || 'Focus',
        color: catPlan?.color || '#0082ff',
      },
    });
  };

  const handleDelete = (task: ScheduleTask) => {
    setPendingScopeAction({
      isOpen: true,
      action: 'delete',
      title: language === 'am' ? 'ብሎክ ሰርዝ' : 'Delete Block',
      itemDescription: `Remove "${task.title}" (${task.startTime || 'Flexible'})`,
      taskId: task.id,
      originalTask: task,
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const catPlan = categoryPlans[newCategoryKey] || categoryPlans['chess'];
    const domain = getDomainForCategory(newCategoryKey);

    setPendingScopeAction({
      isOpen: true,
      action: 'create',
      title: language === 'am' ? 'አዲስ ብሎክ ወደ ቀኑ አክል' : 'Add Block to Schedule',
      itemDescription: `"${newTitle.trim()}" under ${catPlan?.title || 'Main Stream'} (${newStartTime} • ${newDurationMin}m)`,
      newTaskData: {
        title: newTitle.trim(),
        startTime: newStartTime.trim() || 'Flexible',
        durationMin: Number(newDurationMin),
        domain,
        badge: catPlan?.title?.split(' ')[0] || 'Focus',
        color: catPlan?.color || '#0082ff',
        soundProfile: 'SOLFEGGIO_432',
        completed: false,
        checklist: [
          { id: `c-${Date.now()}-1`, text: 'Warm-up & context immersion', done: false },
          { id: `c-${Date.now()}-2`, text: 'Deliberate high-focus practice', done: false },
        ],
      },
    });
  };

  const handleConfirmScope = (scope: ScheduleSaveScope, targetDates: string[]) => {
    if (!pendingScopeAction) return;

    applyTaskActionWithScope({
      action: pendingScopeAction.action,
      scope,
      sourceDateStr: dateStr,
      targetDateStrs: targetDates,
      dayOfWeek,
      taskId: pendingScopeAction.taskId,
      originalTask: pendingScopeAction.originalTask,
      updatedTaskData: pendingScopeAction.updatedTaskData,
      newTaskData: pendingScopeAction.newTaskData,
    });

    if (pendingScopeAction.action === 'edit') {
      setEditingTaskId(null);
    } else if (pendingScopeAction.action === 'create') {
      setNewTitle('');
      setIsAdding(false);
    }

    setPendingScopeAction(null);
    try { soundEngine.playPencil(); } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'am' ? 'የቀኑ ብሎኮችና ተግባራት' : 'Edit Day Schedule Blocks'}
              </h3>
              {isCustomDay && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
                  ⭐ {language === 'am' ? 'ልዩ ሰሌዳ' : 'Custom'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {dayName}, {gregFormatted} • {amharicDay} {ethMonthName} {ethDate.day}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Task Blocks List */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {language === 'am' 
                ? `በዚህ ቀን ያሉ ${dayTasks.length} ብሎኮች፡` 
                : `${dayTasks.length} Scheduled Blocks for this day:`}
            </span>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="px-2.5 py-1 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus size={12} />
                <span>{language === 'am' ? 'ብሎክ አክል' : 'Add Block'}</span>
              </button>
            )}
          </div>

          {/* Quick Add Form */}
          {isAdding && (
            <form onSubmit={handleCreate} className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 dark:text-blue-200">
                  {language === 'am' ? 'አዲስ ብሎክ ወደዚህ ቀን አክል' : 'Add New Block to this Day'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={14} />
                </button>
              </div>

              <input
                type="text"
                required
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Block title (e.g., Puzzle training, Repertoire...)"
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-[#0082ff]"
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Stream</label>
                  <select
                    value={newCategoryKey}
                    onChange={(e) => setNewCategoryKey(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Time</label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Duration</label>
                  <select
                    value={newDurationMin}
                    onChange={(e) => setNewDurationMin(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    <option value={15}>15m</option>
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>60m (1h)</option>
                    <option value={90}>90m (1.5h)</option>
                    <option value={120}>120m (2h)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Block
                </button>
              </div>
            </form>
          )}

          {/* Blocks */}
          {dayTasks.map((task) => {
            const isEditing = editingTaskId === task.id;
            const matchedCatKey = Object.keys(categoryPlans).find((k) => 
              task.domain.toLowerCase().includes(k) || (task.badge && task.badge.toLowerCase().includes(k))
            ) || 'chess';
            const cat = categoryPlans[matchedCatKey] || categoryPlans['chess'];
            const Icon = getCategoryIcon(matchedCatKey);

            if (isEditing) {
              return (
                <form
                  key={task.id}
                  onSubmit={(e) => handleSaveEdit(task.id, e)}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border-2 border-[#0082ff] space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#0082ff]">
                      {language === 'am' ? 'ብሎክ አስተካክል' : 'Edit Block Details'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-[#0082ff]"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Stream</label>
                      <select
                        value={editCategoryKey}
                        onChange={(e) => setEditCategoryKey(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                      >
                        {categoryList.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Time</label>
                      <input
                        type="text"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Duration</label>
                      <select
                        value={editDurationMin}
                        onChange={(e) => setEditDurationMin(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                      >
                        <option value={15}>15m</option>
                        <option value={30}>30m</option>
                        <option value={45}>45m</option>
                        <option value={60}>60m (1h)</option>
                        <option value={90}>90m (1.5h)</option>
                        <option value={120}>120m (2h)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(task)}
                      className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>{language === 'am' ? 'ሰርዝ' : 'Delete'}</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="px-3 py-1 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check size={13} strokeWidth={3} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={task.id}
                className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between gap-3 shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {task.title}
                      </span>
                      <span
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        {cat.title.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{task.startTime || 'Flexible'}</span>
                      <span>•</span>
                      <span>{((task.durationMin || 30) / 60).toFixed(1)}h ({task.durationMin}m)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(task)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-[#0082ff] hover:text-white dark:bg-slate-800 dark:hover:bg-[#0082ff] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title={language === 'am' ? 'ቀይር' : 'Edit block'}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(task)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-500 text-slate-400 hover:text-white transition cursor-pointer"
                    title={language === 'am' ? 'ሰርዝ' : 'Delete block'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {dayTasks.length === 0 && !isAdding && (
            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs font-bold">No blocks scheduled for this day.</p>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="mt-2 text-xs font-black text-[#0082ff] hover:underline cursor-pointer"
              >
                + Add your first block
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-400">
            {language === 'am'
              ? 'ለውጦች ሲቀመጡ ለዚህ ቀን ብቻ ወይም ለሁሉም ቀናት እንደ ነባሪ መምረጥ ይችላሉ።'
              : 'Saving prompts whether to apply to this day only or across all days.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
          >
            {language === 'am' ? 'ዝጋ' : 'Done'}
          </button>
        </div>
      </div>

      {/* Scope confirmation dialog */}
      {pendingScopeAction && (
        <ScheduleSaveScopeModal
          isOpen={pendingScopeAction.isOpen}
          onClose={() => setPendingScopeAction(null)}
          title={pendingScopeAction.title}
          itemDescription={pendingScopeAction.itemDescription}
          sourceDate={date}
          onConfirm={handleConfirmScope}
        />
      )}
    </div>
  );
};
