import React, { useState } from 'react';
import { 
  Target, CheckCircle2, Plus, Clock, 
  Check, Trash2, Edit3, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivotion } from '../context/LivotionContext';
import { HorizonLevel, StrategicGoal, GoalMilestone } from '../types';
import { soundEngine } from '../utils/audio';

export const StrategicHorizonsView: React.FC = () => {
  const { 
    goals, 
    updateGoalProgress, 
    toggleGoalCompleted, 
    addGoal, 
    updateGoal, 
    deleteGoal, 
    language,
    addTask
  } = useLivotion();

  // Simple Segmented Horizon: 'QUARTERLY' | 'YEARLY' | 'ALL'
  const [horizonFilter, setHorizonFilter] = useState<'QUARTERLY' | 'YEARLY' | 'ALL'>('QUARTERLY');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL'>('Q4');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [horizon, setHorizon] = useState<HorizonLevel>('QUARTERLY');
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q4');
  const [year, setYear] = useState<number>(2026);
  const [category, setCategory] = useState<string>('architecture');
  const [targetMetric, setTargetMetric] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Clock & Real-Time Schedule Calculations
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 
    currentMonth < 3 ? 'Q1' :
    currentMonth < 6 ? 'Q2' :
    currentMonth < 9 ? 'Q3' : 'Q4';

  const quarterDates = {
    Q1: { start: '2026-01-01', end: '2026-03-31' },
    Q2: { start: '2026-04-01', end: '2026-06-30' },
    Q3: { start: '2026-07-01', end: '2026-09-30' },
    Q4: { start: '2026-10-01', end: '2026-12-31' },
  };

  const activeQRange = quarterDates[currentQuarter];
  const qEnd = new Date(activeQRange.end).getTime();
  const qDaysLeft = Math.max(0, Math.ceil((qEnd - today.getTime()) / (1000 * 60 * 60 * 24)));

  const yearEnd = new Date('2026-12-31').getTime();
  const yearDaysLeft = Math.max(0, Math.ceil((yearEnd - today.getTime()) / (1000 * 60 * 60 * 24)));

  const categoryLabels: Record<string, string> = {
    devotion: language === 'am' ? 'ጸሎት' : 'Devotion',
    exercise: language === 'am' ? 'ስፖርት' : 'Exercise',
    chess: language === 'am' ? 'ቼዝ' : 'Chess',
    art: language === 'am' ? 'ስዕል' : 'Art',
    music: language === 'am' ? 'ሙዚቃ' : 'Music',
    architecture: language === 'am' ? 'አርክቴክቸር' : 'Architecture',
    trading: language === 'am' ? 'ንግድ' : 'Trading',
    buffer: language === 'am' ? 'አጠቃላይ' : 'General',
  };

  // Open clean add modal
  const handleOpenAdd = () => {
    setEditingGoalId(null);
    setTitle('');
    const defaultH = horizonFilter === 'YEARLY' ? 'YEARLY' : 'QUARTERLY';
    setHorizon(defaultH);
    setQuarter(currentQuarter);
    setYear(2026);
    setCategory('architecture');
    setTargetMetric('');

    if (defaultH === 'QUARTERLY') {
      setStartDate(quarterDates[currentQuarter].start);
      setEndDate(quarterDates[currentQuarter].end);
    } else {
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
    }

    setMilestones([]);
    setNewMilestoneText('');
    setShowModal(true);
  };

  const handleEdit = (g: StrategicGoal) => {
    setEditingGoalId(g.id);
    setTitle(g.title);
    setHorizon(g.horizon);
    setQuarter(g.quarter || currentQuarter);
    setYear(g.year || 2026);
    setCategory(g.category || 'architecture');
    setTargetMetric(g.targetMetric || '');
    setStartDate(g.startDate);
    setEndDate(g.endDate);
    setMilestones(g.milestones || []);
    setNewMilestoneText('');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingGoalId) {
      updateGoal(editingGoalId, {
        title: title.trim(),
        horizon,
        quarter: horizon === 'QUARTERLY' ? quarter : undefined,
        year,
        category,
        targetMetric: targetMetric.trim(),
        startDate,
        endDate,
        milestones
      });
    } else {
      addGoal({
        title: title.trim(),
        horizon,
        quarter: horizon === 'QUARTERLY' ? quarter : undefined,
        year,
        category,
        targetMetric: targetMetric.trim(),
        startDate,
        endDate,
        progressPercentage: 0,
        isCompleted: false,
        milestones
      });
    }

    try {
      soundEngine.playPencil();
    } catch (e) {}

    setShowModal(false);
  };

  const addMilestone = () => {
    if (!newMilestoneText.trim()) return;
    const m: GoalMilestone = {
      id: `m-${Date.now()}`,
      title: newMilestoneText.trim(),
      isCompleted: false
    };
    setMilestones([...milestones, m]);
    setNewMilestoneText('');
  };

  const toggleMilestone = (goal: StrategicGoal, mId: string) => {
    const list = (goal.milestones || []).map((m) =>
      m.id === mId ? { ...m, isCompleted: !m.isCompleted } : m
    );
    const completed = list.filter((m) => m.isCompleted).length;
    const pct = list.length > 0 ? Math.round((completed / list.length) * 100) : goal.progressPercentage;

    updateGoal(goal.id, {
      milestones: list,
      progressPercentage: pct,
      isCompleted: pct >= 100
    });
  };

  // Seed sample real-time strategic roadmap if empty
  const handleSeedRoadmap = () => {
    const defaultGoals: Omit<StrategicGoal, 'id'>[] = [
      {
        title: 'Ship N e v a Architecture & Core Modules',
        horizon: 'QUARTERLY',
        quarter: 'Q4',
        year: 2026,
        category: 'architecture',
        targetMetric: '100% Core Modules',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        progressPercentage: 75,
        isCompleted: false,
        milestones: [
          { id: 'm1', title: 'Mobile Navigation Refactor', isCompleted: true },
          { id: 'm2', title: 'Devotion & Focus Systems', isCompleted: true },
          { id: 'm3', title: 'Real-time schedule based horizons', isCompleted: false },
        ]
      },
      {
        title: '50h Deep Focus Practice in Q4',
        horizon: 'QUARTERLY',
        quarter: 'Q4',
        year: 2026,
        category: 'devotion',
        targetMetric: '50h Practice Logged',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        progressPercentage: 60,
        isCompleted: false,
      },
      {
        title: 'Master Forex & Algorithmic Trading Execution',
        horizon: 'YEARLY',
        year: 2026,
        category: 'trading',
        targetMetric: '15% Alpha',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        progressPercentage: 70,
        isCompleted: false,
      },
      {
        title: '10 Master Oil Paintings & Studio Portfolio',
        horizon: 'YEARLY',
        year: 2026,
        category: 'art',
        targetMetric: '10 Canvases',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        progressPercentage: 80,
        isCompleted: false,
      }
    ];

    defaultGoals.forEach((g) => addGoal(g));
    try {
      soundEngine.playPencil();
    } catch (e) {}
  };

  const scheduleToday = (goal: StrategicGoal) => {
    addTask({
      domain: (goal.category ? goal.category.toUpperCase() : 'ARCHITECTURE_DESIGN') as any,
      title: `[Goal] ${goal.title}`,
      startTime: '10:00 AM',
      durationMin: 45,
      completed: false,
      color: '#0082ff',
      badge: goal.quarter || 'GOAL'
    });
    alert(language === 'am' ? 'የትኩረት ስራ በዛሬ እቅድ ውስጥ ተመዝግቧል!' : 'Scheduled a 45m block in Today’s plan!');
  };

  // Filtered Goals
  const filteredGoals = goals.filter((g) => {
    if (horizonFilter === 'QUARTERLY') {
      if (g.horizon !== 'QUARTERLY') return false;
      if (selectedQuarter !== 'ALL' && g.quarter && g.quarter !== selectedQuarter) return false;
      return true;
    }
    if (horizonFilter === 'YEARLY') {
      return g.horizon === 'YEARLY';
    }
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Target className="text-[#0082ff]" size={26} /> 
            {language === 'am' ? 'ግቦች' : 'Goals'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {horizonFilter === 'YEARLY' 
              ? (language === 'am' ? `2026 ዓመት · ${yearDaysLeft} ቀናት ቀርተዋል` : `2026 Annual Horizon · ${yearDaysLeft} days remaining`)
              : (language === 'am' ? `2026 ${currentQuarter} · ${qDaysLeft} ቀናት ቀርተዋል` : `2026 ${currentQuarter} · ${qDaysLeft} days remaining`)}
          </p>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {goals.length === 0 && (
            <button
              onClick={handleSeedRoadmap}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>{language === 'am' ? 'ምሳሌ ጫን' : 'Load Roadmap'}</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus size={14} /> 
            <span>{language === 'am' ? 'አዲስ ግብ' : 'Add Goal'}</span>
          </button>
        </div>
      </div>

      {/* Clean iOS Segmented Filter Control */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setHorizonFilter('QUARTERLY')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              horizonFilter === 'QUARTERLY'
                ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {language === 'am' ? 'ሩብ ዓመት' : 'Quarterly'}
          </button>
          <button
            onClick={() => setHorizonFilter('YEARLY')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              horizonFilter === 'YEARLY'
                ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {language === 'am' ? 'ዓመታዊ' : 'Yearly'}
          </button>
          <button
            onClick={() => setHorizonFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              horizonFilter === 'ALL'
                ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {language === 'am' ? 'ሁሉም' : 'All'}
          </button>
        </div>

        {/* Minimal Sub-Quarter Pills (only if Quarterly selected) */}
        {horizonFilter === 'QUARTERLY' && (
          <div className="flex items-center gap-1 text-xs font-semibold">
            {(['Q1', 'Q2', 'Q3', 'Q4', 'ALL'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedQuarter === q
                    ? 'bg-blue-50 text-[#0082ff] font-bold dark:bg-blue-950/60'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {q === 'ALL' ? (language === 'am' ? 'ሁሉም' : 'All') : q}
                {q === currentQuarter && <span className="ml-1 text-[9px] text-emerald-500">•</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clean Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-[#121927] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <Target size={28} className="mx-auto text-[#0082ff] opacity-60" />
          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
            {language === 'am' ? 'በዚህ የጊዜ ሰሌዳ ምንም ግብ አልተመዘገበም' : 'No goals scheduled for this horizon yet.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={handleOpenAdd}
              className="text-xs font-bold text-[#0082ff] hover:underline cursor-pointer"
            >
              + {language === 'am' ? 'አዲስ ግብ ፍጠር' : 'Create a goal'}
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={handleSeedRoadmap}
              className="text-xs font-bold text-slate-500 hover:underline cursor-pointer"
            >
              {language === 'am' ? 'ምሳሌ ሮድማፕ ጫን' : 'Load sample roadmap'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const endMs = new Date(goal.endDate).getTime();
            const daysLeft = Math.ceil((endMs - today.getTime()) / (1000 * 60 * 60 * 24));
            const categoryName = categoryLabels[goal.category || 'buffer'] || 'General';

            return (
              <div
                key={goal.id}
                className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                  goal.isCompleted
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-75'
                    : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Header: Badges & Complete Checkbox */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                        {goal.horizon === 'QUARTERLY' ? (goal.quarter || 'Q4') : `${goal.year || 2026}`}
                      </span>

                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {categoryName}
                      </span>

                      <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                        daysLeft < 0 ? 'text-rose-500' : 'text-slate-400'
                      }`}>
                        <Clock size={10} />
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    </div>

                    <h3 className={`text-sm sm:text-base font-bold ${
                      goal.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {goal.title}
                    </h3>

                    {goal.targetMetric && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Target: {goal.targetMetric}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      toggleGoalCompleted(goal.id);
                      if (!goal.isCompleted) {
                        try {
                          confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
                          soundEngine.playPencil();
                        } catch (e) {}
                      }
                    }}
                    className={`p-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
                      goal.isCompleted
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>

                {/* Milestones (if any) */}
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {goal.milestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMilestone(goal, m.id)}
                        className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none"
                      >
                        <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center shrink-0 ${
                          m.isCompleted ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-600'
                        }`}>
                          {m.isCompleted && <Check size={10} />}
                        </div>
                        <span className={`truncate ${m.isCompleted ? 'line-through text-slate-400' : ''}`}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress Bar & Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>{language === 'am' ? 'ሂደት' : 'Progress'}</span>
                    <span className="text-slate-800 dark:text-slate-200">{goal.progressPercentage}%</span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={goal.progressPercentage}
                    onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                    className="w-full accent-[#0082ff] cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <button
                    onClick={() => scheduleToday(goal)}
                    className="text-[#0082ff] font-bold hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <Plus size={12} />
                    <span>{language === 'am' ? 'ዛሬ ስራ' : 'Schedule Today'}</span>
                  </button>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this goal?')) deleteGoal(goal.id);
                      }}
                      className="p-1 hover:text-rose-500 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Minimal Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingGoalId ? 'Edit Goal' : 'New Goal'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {/* Horizon & Quarter */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Horizon</label>
                  <select
                    value={horizon}
                    onChange={(e) => {
                      const h = e.target.value as HorizonLevel;
                      setHorizon(h);
                      if (h === 'QUARTERLY') {
                        setStartDate(quarterDates[quarter].start);
                        setEndDate(quarterDates[quarter].end);
                      } else {
                        setStartDate('2026-01-01');
                        setEndDate('2026-12-31');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                {horizon === 'QUARTERLY' ? (
                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">Quarter</label>
                    <select
                      value={quarter}
                      onChange={(e) => {
                        const q = e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4';
                        setQuarter(q);
                        setStartDate(quarterDates[q].start);
                        setEndDate(quarterDates[q].end);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="Q1">Q1 (Jan–Mar)</option>
                      <option value="Q2">Q2 (Apr–Jun)</option>
                      <option value="Q3">Q3 (Jul–Sep)</option>
                      <option value="Q4">Q4 (Oct–Dec)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">Year</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] text-slate-500 font-bold block mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete mobile architecture release"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              {/* Category & Metric */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Pillar</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  >
                    {Object.entries(categoryLabels).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Target Note</label>
                  <input
                    type="text"
                    value={targetMetric}
                    onChange={(e) => setTargetMetric(e.target.value)}
                    placeholder="e.g. 100% completed"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] text-slate-500 font-bold block">Action Steps / Milestones</label>
                {milestones.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {milestones.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg">
                        <span className="truncate">{m.title}</span>
                        <button
                          type="button"
                          onClick={() => setMilestones(milestones.filter((x) => x.id !== m.id))}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newMilestoneText}
                    onChange={(e) => setNewMilestoneText(e.target.value)}
                    placeholder="Add step..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-xl"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0082ff] text-white rounded-xl text-xs font-bold"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
