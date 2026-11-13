import React, { useState } from 'react';
import { 
  Clock, Plus, Trash2, CheckCircle2, Play, 
  Square, CheckSquare, Bell, Sparkles, Filter 
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { DomainType, PriorityLevel, ScheduleTask } from '../types';

export const MasterScheduleView: React.FC = () => {
  const { tasks, startTask, toggleTaskCompletion, toggleChecklistItem, addTask, deleteTask, domains } = useLivotion();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterDomain, setFilterDomain] = useState<string>('ALL');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState<DomainType>('ARCHITECTURE_DESIGN');
  const [newStartTime, setNewStartTime] = useState('02:00 PM');
  const [newDuration, setNewDuration] = useState(60);
  const [newPriority, setNewPriority] = useState<PriorityLevel>('DEEP_WORK');
  const [newBadge, setNewBadge] = useState('Deep Work');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const matchedDomain = domains.find((d) => d.domainType === newDomain);
    const color = matchedDomain ? matchedDomain.accentColor : '#0082ff';

    addTask({
      domain: newDomain,
      title: newTitle,
      startTime: newStartTime,
      durationMin: Number(newDuration),
      completed: false,
      color,
      badge: newBadge,
      priority: newPriority,
      checklist: [
        { id: `c-${Date.now()}-1`, text: 'Initial context & immersion', done: false },
        { id: `c-${Date.now()}-2`, text: 'High-focus deliberate execution', done: false },
        { id: `c-${Date.now()}-3`, text: 'Session artifact checkpoint', done: false },
      ],
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  const filteredTasks = filterDomain === 'ALL'
    ? tasks
    : tasks.filter((t) => t.domain === filterDomain);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 bg-[#faf9f6] dark:bg-[#0b0f17] text-[#1e2530] dark:text-slate-100 min-h-screen transition-colors">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e8e6df] dark:border-[#1e2530] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1e2530] dark:text-white">Master Daily Schedule & Timeline</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Full 24-hour tactical roadmap synchronizing spiritual core, market windows, deep work, and physical conditioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-[#121927] border border-slate-200 dark:border-[#1e2530] px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <Filter size={13} className="text-slate-400" />
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 outline-none cursor-pointer font-medium"
            >
              <option value="ALL" className="bg-white dark:bg-[#121927]">All 11 Domains</option>
              {domains.map((d) => (
                <option key={d.id} value={d.domainType} className="bg-white dark:bg-[#121927]">
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus size={14} /> Add Block
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l-2 border-slate-200 dark:border-[#1e2530] ml-4 md:ml-6 pl-6 space-y-5 my-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="relative group">
            {/* Timeline node */}
            <div 
              className="absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-white dark:border-[#0b0f17] transition-transform group-hover:scale-125 shadow-xs"
              style={{ backgroundColor: task.color }}
            />

            <div className={`p-5 rounded-2xl border transition-all ${
              task.completed 
                ? 'bg-slate-100/60 dark:bg-[#121927]/40 border-slate-200/60 dark:border-[#1e2530]/60 text-slate-400 dark:text-slate-500' 
                : 'bg-white dark:bg-[#121927] border-[#e8e6df] dark:border-[#1e2530] hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider"
                      style={{ backgroundColor: `${task.color}15`, color: task.color }}
                    >
                      {task.badge || task.domain}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" /> {task.startTime} ({task.durationMin} mins)
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#162032] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                      {task.priority}
                    </span>
                  </div>
                  <h3 className={`text-base font-bold ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                    {task.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {!task.completed ? (
                    <button
                      onClick={() => startTask(task)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-[#0082ff] text-[#0082ff] hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-blue-200 dark:bg-[#162032] dark:border-[#0082ff]/40 transition cursor-pointer"
                    >
                      <Play size={12} /> Focus
                    </button>
                  ) : null}

                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                      task.completed 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-[#162032] dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 size={13} /> {task.completed ? 'Done' : 'Mark Done'}
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162032] transition cursor-pointer"
                    title="Delete Block"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Sub-checklists */}
              {task.checklist && task.checklist.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {task.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(task.id, item.id)}
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-[#0082ff] cursor-pointer select-none"
                    >
                      {item.done ? (
                        <CheckSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square size={13} className="text-slate-400 dark:text-slate-600" />
                      )}
                      <span className={item.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-[#1e2530] w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Schedule New Execution Block</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Block Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Architectural Facade Coordination"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#162032] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0082ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Domain Pillar</label>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value as DomainType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#162032] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.domainType}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#162032] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="DEEP_WORK">Deep Work</option>
                    <option value="SPIRITUAL">Spiritual</option>
                    <option value="PHYSICAL">Physical</option>
                    <option value="SITE_OPS">Site Ops</option>
                    <option value="FLEX_BUFFER">Flex Buffer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Start Time</label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="01:15 PM"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#162032] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Duration (min)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    min={5}
                    max={480}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#162032] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Badge Tag</label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="Deep Work"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#162032] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#162032] dark:hover:bg-[#1e2530] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl text-xs font-mono font-bold"
                >
                  Schedule Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
