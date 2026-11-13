import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Clock, CheckCircle2, Square, 
  Play, Pause, RotateCcw, Plus, Edit3, Trash2, 
  ChevronUp, ChevronDown, Check, X, Sparkles, Flame
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { soundEngine } from '../utils/audio';
import { ExerciseCategory, MovementItem } from '../types';

export const FitnessProtocolView: React.FC = () => {
  const { 
    workouts, 
    toggleExerciseCompletion,
    updateWorkout,
    addExerciseToWorkout,
    updateExerciseInWorkout,
    deleteExerciseFromWorkout,
    reorderExerciseInWorkout
  } = useLivotion();

  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Modals state
  const [showEditProtocolModal, setShowEditProtocolModal] = useState<boolean>(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  // Form states for Workout Protocol
  const [editWorkoutName, setEditWorkoutName] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState(60);
  const [editExerciseType, setEditExerciseType] = useState<ExerciseCategory>('STRENGTH_COMPOUND');

  // Form states for New / Edit Exercise
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseSets, setExerciseSets] = useState(4);
  const [exerciseReps, setExerciseReps] = useState('8-10');
  const [exerciseNotes, setExerciseNotes] = useState('');

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState<number>(60);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState<boolean>(false);
  const [initialRestSeconds, setInitialRestSeconds] = useState<number>(60);

  const activeWorkout = workouts.find((w) => w.dayOfWeek === selectedDay) || workouts[0];

  const days = [
    { num: 1, name: 'Mon', defaultLabel: 'Push' },
    { num: 2, name: 'Tue', defaultLabel: 'Pull' },
    { num: 3, name: 'Wed', defaultLabel: 'Cardio' },
    { num: 4, name: 'Thu', defaultLabel: 'Legs' },
    { num: 5, name: 'Fri', defaultLabel: 'Upper' },
    { num: 6, name: 'Sat', defaultLabel: 'Conditioning' },
    { num: 7, name: 'Sun', defaultLabel: 'Recovery' },
  ];

  const exerciseCategories: { id: ExerciseCategory; label: string }[] = [
    { id: 'STRENGTH_COMPOUND', label: 'Strength & Compound' },
    { id: 'HYPERTROPHY', label: 'Hypertrophy & Muscle Building' },
    { id: 'ZONE_2_CARDIO', label: 'Zone 2 Aerobic Cardio' },
    { id: 'HIIT', label: 'High Intensity Interval (HIIT)' },
    { id: 'MOBILITY_FLEXIBILITY', label: 'Mobility & Flexibility' },
    { id: 'ACTIVE_RECOVERY', label: 'Active Recovery & Deload' },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRestTimerRunning && restSeconds > 0) {
      timer = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            soundEngine.playSound('DIGITAL_ALERT');
            setIsRestTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRestTimerRunning, restSeconds]);

  const startRestTimer = (seconds: number) => {
    setInitialRestSeconds(seconds);
    setRestSeconds(seconds);
    setIsRestTimerRunning(true);
  };

  const handleOpenEditProtocol = () => {
    if (!activeWorkout) return;
    setEditWorkoutName(activeWorkout.workoutName);
    setEditDurationMinutes(activeWorkout.targetDurationMinutes);
    setEditExerciseType(activeWorkout.exerciseType);
    setShowEditProtocolModal(true);
  };

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkout) return;
    updateWorkout(activeWorkout.id, {
      workoutName: editWorkoutName.trim() || activeWorkout.workoutName,
      targetDurationMinutes: Number(editDurationMinutes),
      exerciseType: editExerciseType,
    });
    setShowEditProtocolModal(false);
  };

  const handleOpenAddExercise = () => {
    setExerciseName('');
    setExerciseSets(4);
    setExerciseReps('8-10');
    setExerciseNotes('');
    setEditingExerciseIndex(null);
    setShowAddExerciseModal(true);
  };

  const handleOpenEditExercise = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = activeWorkout.movementList[idx];
    setExerciseName(item.exercise);
    setExerciseSets(item.sets);
    setExerciseReps(item.reps);
    setExerciseNotes(item.notes || '');
    setEditingExerciseIndex(idx);
    setShowAddExerciseModal(true);
  };

  const handleSaveExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim() || !activeWorkout) return;

    if (editingExerciseIndex !== null) {
      updateExerciseInWorkout(activeWorkout.id, editingExerciseIndex, {
        exercise: exerciseName.trim(),
        sets: Number(exerciseSets),
        reps: exerciseReps.trim(),
        notes: exerciseNotes.trim(),
      });
    } else {
      addExerciseToWorkout(activeWorkout.id, {
        exercise: exerciseName.trim(),
        sets: Number(exerciseSets),
        reps: exerciseReps.trim(),
        notes: exerciseNotes.trim(),
        completed: false,
      });
    }

    setShowAddExerciseModal(false);
    setEditingExerciseIndex(null);
  };

  const handleDeleteExercise = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeWorkout) return;
    if (confirm(`Remove "${activeWorkout.movementList[idx].exercise}"?`)) {
      deleteExerciseFromWorkout(activeWorkout.id, idx);
    }
  };

  const handleMoveUp = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx === 0 || !activeWorkout) return;
    reorderExerciseInWorkout(activeWorkout.id, idx, idx - 1);
  };

  const handleMoveDown = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeWorkout || idx === activeWorkout.movementList.length - 1) return;
    reorderExerciseInWorkout(activeWorkout.id, idx, idx + 1);
  };

  const completedCount = activeWorkout?.movementList.filter((m) => m.completed).length || 0;
  const totalCount = activeWorkout?.movementList.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Dumbbell className="text-rose-500" /> Workouts & Exercise Protocols
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Your weekly exercise plan. Fully customizable daily splits, exercise types, sets, and durations.
          </p>
        </div>

        {/* Rest Timer */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 p-2 rounded-2xl shadow-xs self-start sm:self-auto">
          <Clock size={15} className="text-rose-500 ml-1" />
          <span className="text-xs font-mono font-bold text-rose-500">
            {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1">
            {[45, 60, 90].map((sec) => (
              <button
                key={sec}
                onClick={() => startRestTimer(sec)}
                className={`px-2 py-1 text-[11px] font-mono rounded-lg transition cursor-pointer ${
                  initialRestSeconds === sec && isRestTimerRunning
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {sec}s
              </button>
            ))}
            <button
              onClick={() => setIsRestTimerRunning(!isRestTimerRunning)}
              className="p-1.5 text-rose-500 hover:text-rose-600 cursor-pointer"
              title={isRestTimerRunning ? 'Pause rest timer' : 'Start rest timer'}
            >
              {isRestTimerRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* 7 Days of Week Split Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {days.map((day) => {
          const isSelected = selectedDay === day.num;
          const workoutForDay = workouts.find((w) => w.dayOfWeek === day.num);
          const isDone = workoutForDay && workoutForDay.movementList.length > 0 && workoutForDay.movementList.every((m) => m.completed);
          const workoutShortName = workoutForDay ? workoutForDay.workoutName.split(':')[1]?.trim() || workoutForDay.workoutName.split(' ')[0] : day.defaultLabel;

          return (
            <button
              key={day.num}
              onClick={() => setSelectedDay(day.num)}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-white border-2 border-rose-500 shadow-sm dark:bg-[#121927] dark:border-rose-500'
                  : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{day.name}</span>
                {isDone && <CheckCircle2 size={13} className="text-emerald-500" />}
              </div>
              <p className={`text-xs font-bold mt-1 truncate ${isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {workoutShortName || day.defaultLabel}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Workout Card */}
      {activeWorkout && (
        <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xs">
          
          {/* Workout Header with In-Place Edit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {activeWorkout.workoutName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  {activeWorkout.exerciseType?.replace('_', ' ')}
                </span>
                <button
                  onClick={handleOpenEditProtocol}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Edit day protocol, duration, and exercise category"
                >
                  <Edit3 size={15} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-rose-500" />
                  <strong>{activeWorkout.targetDurationMinutes} min target</strong>
                </span>
                <span>•</span>
                <span>{totalCount} exercises programmed</span>
              </div>
            </div>

            {/* Progress & Add Exercise Header Button */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {completedCount} of {totalCount} completed ({progressPercent}%)
                </span>
                <div className="w-32 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleOpenAddExercise}
                className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add Exercise
              </button>
            </div>
          </div>

          {/* Exercise Rows List */}
          <div className="space-y-2.5">
            {activeWorkout.movementList.map((movement, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition group ${
                  movement.completed
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 text-slate-400'
                    : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                {/* Checkbox & Exercise Details */}
                <div 
                  onClick={() => toggleExerciseCompletion(activeWorkout.id, idx)}
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer select-none"
                >
                  {movement.completed ? (
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Square size={20} className="text-slate-400 hover:text-slate-600 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className={`text-sm sm:text-base font-bold truncate ${
                      movement.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {movement.exercise}
                    </h4>

                    {movement.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {movement.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Sets × Reps Pill & Management Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Sets × Reps Pill */}
                  <div className="px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                    {movement.sets} sets × {movement.reps}
                  </div>

                  {/* Reorder Up / Down */}
                  <div className="flex flex-col opacity-60 group-hover:opacity-100 transition">
                    <button
                      disabled={idx === 0}
                      onClick={(e) => handleMoveUp(idx, e)}
                      className={`p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white ${idx === 0 ? 'cursor-not-allowed opacity-20' : 'cursor-pointer'}`}
                      title="Move up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      disabled={idx === activeWorkout.movementList.length - 1}
                      onClick={(e) => handleMoveDown(idx, e)}
                      className={`p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white ${idx === activeWorkout.movementList.length - 1 ? 'cursor-not-allowed opacity-20' : 'cursor-pointer'}`}
                      title="Move down"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>

                  {/* Edit Exercise Button */}
                  <button
                    onClick={(e) => handleOpenEditExercise(idx, e)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#0082ff] transition cursor-pointer"
                    title="Edit exercise name, sets, reps & notes"
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* Delete Exercise Button */}
                  <button
                    onClick={(e) => handleDeleteExercise(idx, e)}
                    className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    title="Delete exercise"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {activeWorkout.movementList.length === 0 && (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                <Dumbbell size={24} className="mx-auto text-slate-400" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  No movements programmed for this session yet.
                </p>
                <button
                  onClick={handleOpenAddExercise}
                  className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus size={13} /> Add First Exercise
                </button>
              </div>
            )}
          </div>

          {/* Quick Bottom Add Movement Row */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Need more movements? Add as many custom exercises as you want.
            </span>
            <button
              onClick={handleOpenAddExercise}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={13} /> Add Exercise
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT WORKOUT PROTOCOL (Name, Duration, Category) */}
      {showEditProtocolModal && activeWorkout && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Daily Workout Protocol
                </h3>
                <p className="text-xs text-slate-500">Day {selectedDay} Workout Split Settings</p>
              </div>
              <button 
                onClick={() => setShowEditProtocolModal(false)} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProtocol} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Workout Title / Split Name *
                </label>
                <input
                  type="text"
                  required
                  value={editWorkoutName}
                  onChange={(e) => setEditWorkoutName(e.target.value)}
                  placeholder="e.g. Monday: Push Power & Calisthenics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Exercise Category Type
                </label>
                <select
                  value={editExerciseType}
                  onChange={(e) => setEditExerciseType(e.target.value as ExerciseCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                >
                  {exerciseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Target Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="10"
                  max="240"
                  step="5"
                  required
                  value={editDurationMinutes}
                  onChange={(e) => setEditDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditProtocolModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold"
                >
                  Save Workout Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT EXERCISE (Name, Sets, Reps, Notes) */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingExerciseIndex !== null ? 'Edit Exercise Movement' : 'Add New Movement'}
                </h3>
                <p className="text-xs text-slate-500">Configures exercise name, volume sets, reps, and form notes.</p>
              </div>
              <button 
                onClick={() => setShowAddExerciseModal(false)} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  required
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="e.g. Incline Dumbbell Bench Press, Barbell Squats..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">
                    Number of Sets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={exerciseSets}
                    onChange={(e) => setExerciseSets(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">
                    Reps / Duration Target
                  </label>
                  <input
                    type="text"
                    required
                    value={exerciseReps}
                    onChange={(e) => setExerciseReps(e.target.value)}
                    placeholder="e.g. 8-10, 12-15, 60 sec holds"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Form Coaching Cues & Notes
                </label>
                <input
                  type="text"
                  value={exerciseNotes}
                  onChange={(e) => setExerciseNotes(e.target.value)}
                  placeholder="e.g. Control 3-sec eccentric on drop, brace core tight"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddExerciseModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check size={14} /> {editingExerciseIndex !== null ? 'Save Changes' : 'Add Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
