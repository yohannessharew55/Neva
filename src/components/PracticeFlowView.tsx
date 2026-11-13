import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Timer, CheckCircle2, 
  Sparkles, Coffee, Flame, Zap, Sliders, Plus, Minus,
  SkipForward, Clock, History, Award, Shield, BookOpen,
  Dumbbell, Swords, Palette, Music, Building2, TrendingUp,
  Check, Brain, Maximize2, Minimize2, Activity, Waves,
  Volume2, Bell, Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask } from '../types';
import { soundEngine } from '../utils/audio';
import { iosNativeBridge } from '../utils/iosNativeBridge';
import { FocusSoundModal } from './FocusSoundModal';

type FocusSystemType = 'pomodoro' | 'ultradian' | 'desktime' | 'sprint' | 'custom' | 'stopwatch';
type IntervalPhase = 'focus' | 'short_break' | 'long_break';

interface CompletedSessionLog {
  id: string;
  system: FocusSystemType;
  durationMinutes: number;
  category: string;
  notes: string;
  timestamp: string;
}

export const PracticeFlowView: React.FC = () => {
  const { logSession, categoryPlans, tasks, language, t } = useLivotion();

  // Selected Focus System
  const [selectedSystem, setSelectedSystem] = useState<FocusSystemType>('pomodoro');

  // Interval Phase
  const [phase, setPhase] = useState<IntervalPhase>('focus');

  // Pomodoro cycle (1 through 4)
  const [pomodoroCycle, setPomodoroCycle] = useState<number>(1);
  const [pomodoroLength, setPomodoroLength] = useState<number>(25); // 25m standard or 50m deep

  // Custom Minutes Setting
  const [customMinutes, setCustomMinutes] = useState<number>(25);

  // Selected Category / Pillar
  const [selectedCategory, setSelectedCategory] = useState<string>('buffer');

  // Active focused task (if user selected a specific activity/task)
  const [activeTaskTitle, setActiveTaskTitle] = useState<string | null>(null);

  // Zen Theater Fullscreen Mode
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Sound Chooser & iPhone Alarm Modal
  const [isSoundModalOpen, setIsSoundModalOpen] = useState<boolean>(false);

  // Timer Core State
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);

  // Session Note
  const [sessionNote, setSessionNote] = useState<string>('');

  // History Log
  const [recentSessions, setRecentSessions] = useState<CompletedSessionLog[]>(() => {
    try {
      const saved = localStorage.getItem('livotion_focus_sessions_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Keep track of current system config
  const getSystemDurations = (system: FocusSystemType, pLength: number, customMins: number) => {
    switch (system) {
      case 'pomodoro':
        return {
          focus: pLength * 60,
          shortBreak: pLength === 50 ? 10 * 60 : 5 * 60,
          longBreak: 15 * 60
        };
      case 'ultradian':
        return {
          focus: 90 * 60,
          shortBreak: 20 * 60,
          longBreak: 20 * 60
        };
      case 'desktime':
        return {
          focus: 52 * 60,
          shortBreak: 17 * 60,
          longBreak: 17 * 60
        };
      case 'sprint':
        return {
          focus: 15 * 60,
          shortBreak: 5 * 60,
          longBreak: 10 * 60
        };
      case 'custom':
        return {
          focus: customMins * 60,
          shortBreak: Math.max(3, Math.round(customMins * 0.2)) * 60,
          longBreak: Math.max(10, Math.round(customMins * 0.4)) * 60
        };
      case 'stopwatch':
      default:
        return {
          focus: 0,
          shortBreak: 0,
          longBreak: 0
        };
    }
  };

  // Reset timer immediately when changing system, custom minutes, or pomodoro length (zero splash, instant switch)
  const applySystem = (system: FocusSystemType, pLength: number = pomodoroLength, customM: number = customMinutes, _taskName?: string) => {
    setIsTimerRunning(false);
    setSelectedSystem(system);
    setPhase('focus');

    if (system === 'stopwatch') {
      setStopwatchSeconds(0);
      setSecondsRemaining(0);
      setTotalDurationSeconds(0);
    } else {
      const durations = getSystemDurations(system, pLength, customM);
      setSecondsRemaining(durations.focus);
      setTotalDurationSeconds(durations.focus);
    }
  };

  // Map Task to Focus Category and launch with tailored rhythm
  const handleLaunchTaskFocus = (task: ScheduleTask) => {
    setActiveTaskTitle(task.title);

    // Map domain to category
    let matchedCategory = 'buffer';
    if (task.domain.includes('MUSIC') || task.domain.includes('GUITAR')) matchedCategory = 'music';
    else if (task.domain.includes('CHESS')) matchedCategory = 'chess';
    else if (task.domain.includes('FITNESS') || task.domain.includes('EXERCISE')) matchedCategory = 'exercise';
    else if (task.domain.includes('DEVOTION')) matchedCategory = 'devotion';
    else if (task.domain.includes('ART')) matchedCategory = 'art';
    else if (task.domain.includes('ARCHITECTURE')) matchedCategory = 'architecture';
    else if (task.domain.includes('TRADING')) matchedCategory = 'trading';

    setSelectedCategory(matchedCategory);

    // Choose optimal rhythm: if task duration >= 75m use Ultradian, else custom or current
    let targetSystem: FocusSystemType = selectedSystem;
    if (task.durationMin >= 75) {
      targetSystem = 'ultradian';
    } else if (task.durationMin === 25 || task.durationMin === 50) {
      targetSystem = 'pomodoro';
      setPomodoroLength(task.durationMin);
    } else if (task.durationMin <= 15) {
      targetSystem = 'sprint';
    } else {
      targetSystem = 'custom';
      setCustomMinutes(task.durationMin);
    }

    applySystem(targetSystem, task.durationMin === 50 ? 50 : 25, task.durationMin, task.title);
  };

  // Switch phase (e.g. from focus to break)
  const switchPhase = (targetPhase: IntervalPhase) => {
    soundEngine.stopAmbience();
    iosNativeBridge.cancelAlarm('focus-timer');
    const durations = getSystemDurations(selectedSystem, pomodoroLength, customMinutes);
    let duration = durations.focus;
    if (targetPhase === 'short_break') duration = durations.shortBreak;
    if (targetPhase === 'long_break') duration = durations.longBreak;

    setPhase(targetPhase);
    setSecondsRemaining(duration);
    setTotalDurationSeconds(duration);
    setIsTimerRunning(false);
  };

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('livotion_focus_sessions_history_v1', JSON.stringify(recentSessions));
    } catch (e) {}
  }, [recentSessions]);

  // Main countdown / stopwatch timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerRunning) {
      interval = setInterval(() => {
        if (selectedSystem === 'stopwatch') {
          setStopwatchSeconds((prev) => prev + 1);
        } else {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              // Timer completed!
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, selectedSystem, phase, pomodoroCycle]);

  // Handle countdown completion
  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    soundEngine.stopAmbience();
    soundEngine.playAlarmSound();
    iosNativeBridge.haptic('heavy');

    if (phase === 'focus') {
      // Confetti burst for focus session
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      // Log session
      const durationMins = Math.round(totalDurationSeconds / 60);
      logCompletedSession(durationMins);

      // Advance Pomodoro or System phase
      if (selectedSystem === 'pomodoro') {
        if (pomodoroCycle >= 4) {
          setPhase('long_break');
          const durations = getSystemDurations('pomodoro', pomodoroLength, customMinutes);
          setSecondsRemaining(durations.longBreak);
          setTotalDurationSeconds(durations.longBreak);
          setPomodoroCycle(1);
        } else {
          setPhase('short_break');
          const durations = getSystemDurations('pomodoro', pomodoroLength, customMinutes);
          setSecondsRemaining(durations.shortBreak);
          setTotalDurationSeconds(durations.shortBreak);
          setPomodoroCycle((prev) => prev + 1);
        }
      } else {
        // Other interval systems
        const durations = getSystemDurations(selectedSystem, pomodoroLength, customMinutes);
        setPhase('short_break');
        setSecondsRemaining(durations.shortBreak);
        setTotalDurationSeconds(durations.shortBreak);
      }
    } else {
      // Break completed -> Return to focus
      setPhase('focus');
      const durations = getSystemDurations(selectedSystem, pomodoroLength, customMinutes);
      setSecondsRemaining(durations.focus);
      setTotalDurationSeconds(durations.focus);
    }
  };

  const logCompletedSession = (durationMinutes: number) => {
    if (durationMinutes <= 0) return;

    // Log to Livotion Context
    logSession({
      categoryId: selectedCategory,
      title: `${selectedSystem.toUpperCase()} Focus Session`,
      durationMinutes,
      notes: sessionNote || `${selectedSystem.toUpperCase()} completed block.`
    });

    // Add to local history log
    const newLog: CompletedSessionLog = {
      id: `log-${Date.now()}`,
      system: selectedSystem,
      durationMinutes,
      category: selectedCategory,
      notes: sessionNote || 'Completed focused block',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setRecentSessions((prev) => [newLog, ...prev.slice(0, 9)]);
    setSessionNote('');
  };

  // Controls
  const toggleStartPause = () => {
    setIsTimerRunning((prev) => {
      const next = !prev;
      if (next) {
        soundEngine.playStartSound();
        soundEngine.startAmbience();
        iosNativeBridge.haptic('medium');

        if (selectedSystem !== 'stopwatch' && secondsRemaining > 0) {
          iosNativeBridge.scheduleFocusAlarm(
            'focus-timer',
            language === 'am' ? 'የትኩረት ሰዓት ተጠናቀቀ!' : 'Focus Block Complete!',
            activeTaskTitle
              ? `${activeTaskTitle} - ${language === 'am' ? 'በስኬት ተጠናቋል!' : 'Completed with excellence!'}`
              : (language === 'am' ? 'የጥልቅ ስራ ሰዓትዎ ተጠናቋል። አሁን ጥቂት ያርፉ።' : 'Deep work session complete. Take a mindful break.'),
            secondsRemaining
          );
        }
      } else {
        soundEngine.stopAmbience();
        iosNativeBridge.haptic('light');
        iosNativeBridge.cancelAlarm('focus-timer');
      }
      return next;
    });
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    soundEngine.stopAmbience();
    iosNativeBridge.cancelAlarm('focus-timer');
    if (selectedSystem === 'stopwatch') {
      setStopwatchSeconds(0);
    } else {
      const durations = getSystemDurations(selectedSystem, pomodoroLength, customMinutes);
      let duration = durations.focus;
      if (phase === 'short_break') duration = durations.shortBreak;
      if (phase === 'long_break') duration = durations.longBreak;
      setSecondsRemaining(duration);
      setTotalDurationSeconds(duration);
    }
  };

  const adjustSeconds = (deltaSeconds: number) => {
    if (selectedSystem === 'stopwatch') {
      setStopwatchSeconds((prev) => Math.max(0, prev + deltaSeconds));
    } else {
      setSecondsRemaining((prev) => Math.max(10, prev + deltaSeconds));
      setTotalDurationSeconds((prev) => Math.max(10, prev + deltaSeconds));
    }
  };

  // Format Time display
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress percentage for circular ring
  const calculateProgress = () => {
    if (selectedSystem === 'stopwatch') return 100;
    if (totalDurationSeconds === 0) return 0;
    const progress = ((totalDurationSeconds - secondsRemaining) / totalDurationSeconds) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Color theme according to system & phase
  const getThemeColor = () => {
    if (phase === 'short_break' || phase === 'long_break') return '#10b981'; // Emerald break
    switch (selectedSystem) {
      case 'pomodoro': return '#ef4444'; // Tomato Red
      case 'ultradian': return '#8b5cf6'; // Violet / Purple
      case 'desktime': return '#06b6d4'; // Cyan
      case 'sprint': return '#f59e0b'; // Amber
      case 'custom': return '#0082ff'; // Royal Blue
      case 'stopwatch': return '#6366f1'; // Indigo
      default: return '#0082ff';
    }
  };

  const getSystemIcon = (sys: FocusSystemType) => {
    switch (sys) {
      case 'pomodoro': return '🍅';
      case 'ultradian': return '🧠';
      case 'desktime': return '⚡';
      case 'sprint': return '🚀';
      case 'custom': return '🎯';
      case 'stopwatch': return '⏱️';
    }
  };

  const categoryOptions = [
    { id: 'devotion', label: language === 'am' ? 'ጸሎት' : 'Devotion', color: '#a855f7', icon: BookOpen },
    { id: 'exercise', label: language === 'am' ? 'ስፖርት' : 'Exercise', color: '#ef4444', icon: Dumbbell },
    { id: 'chess', label: language === 'am' ? 'ቼዝ' : 'Chess', color: '#6366f1', icon: Swords },
    { id: 'art', label: language === 'am' ? 'ስዕል' : 'Art', color: '#ec4899', icon: Palette },
    { id: 'music', label: language === 'am' ? 'ሙዚቃ' : 'Music', color: '#f59e0b', icon: Music },
    { id: 'architecture', label: language === 'am' ? 'አርክቴክቸር' : 'Architecture', color: '#06b6d4', icon: Building2 },
    { id: 'trading', label: language === 'am' ? 'ንግድ' : 'Trading', color: '#10b981', icon: TrendingUp },
    { id: 'buffer', label: language === 'am' ? 'አጠቃላይ' : 'General Focus', color: '#64748b', icon: Shield },
  ];

  const currentCategoryObj = categoryOptions.find((c) => c.id === selectedCategory) || categoryOptions[7];
  const CategoryIcon = currentCategoryObj.icon;

  const currentDisplaySeconds = selectedSystem === 'stopwatch' ? stopwatchSeconds : secondsRemaining;
  const progressPercent = calculateProgress();
  const themeColor = getThemeColor();

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Timer className="text-[#0082ff]" /> 
            {language === 'am' ? 'የትኩረት ስራ ሰዓት ቆጣሪ' : 'Deep Focus & Flow Timer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'am'
              ? 'የቲማቲም ዘዴ (ፖሞዶሮ)፣ የ90/20 ጥልቅ የትኩረት ሥርዓት፣ እና ብጁ የደቂቃ ቆጣሪ።'
              : 'Choose the Pomodoro Tomato system, Ultradian rhythm, 52/17 performance rule, or custom countdown.'}
          </p>
        </div>
      </div>

      {/* Focus System Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        
        {/* 1. Pomodoro / Tomato System */}
        <button
          onClick={() => applySystem('pomodoro', 25, customMinutes)}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'pomodoro'
              ? 'bg-red-50/80 dark:bg-red-950/30 border-red-300 dark:border-red-800/80 shadow-xs ring-2 ring-red-400/30'
              : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">🍅</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300">
              25m / 5m
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              {language === 'am' ? 'የቲማቲም ዘዴ' : 'Tomato System'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Pomodoro 4-Cycle
            </div>
          </div>
        </button>

        {/* 2. Ultradian 90/20 Protocol */}
        <button
          onClick={() => applySystem('ultradian', pomodoroLength, customMinutes)}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'ultradian'
              ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800/80 shadow-xs ring-2 ring-purple-400/30'
              : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">🧠</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
              90m / 20m
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              {language === 'am' ? 'የ90/20 ጥልቅ ዘዴ' : 'Ultradian Flow'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Peak Neurobiology
            </div>
          </div>
        </button>

        {/* 3. 52/17 Rule */}
        <button
          onClick={() => applySystem('desktime', pomodoroLength, customMinutes)}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'desktime'
              ? 'bg-cyan-50/80 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800/80 shadow-xs ring-2 ring-cyan-400/30'
              : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">⚡</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300">
              52m / 17m
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              52/17 Rule
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              DeskTime Metric
            </div>
          </div>
        </button>

        {/* 4. Quick Sprint 15/5 */}
        <button
          onClick={() => applySystem('sprint', pomodoroLength, customMinutes)}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'sprint'
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-xs ring-2 ring-amber-400/30'
              : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">🚀</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
              15m / 5m
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              {language === 'am' ? 'ፈጣን ስፕሪንት' : 'Power Sprint'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Micro Burst
            </div>
          </div>
        </button>

        {/* 5. Custom Countdown */}
        <button
          onClick={() => applySystem('custom', pomodoroLength, customMinutes)}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'custom'
              ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/80 shadow-xs ring-2 ring-blue-400/30'
              : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">🎯</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
              {customMinutes}m
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              {language === 'am' ? 'ብጁ ቆጣሪ' : 'Custom Minutes'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Set Exact Time
            </div>
          </div>
        </button>

        {/* 6. Open Stopwatch */}
        <button
          onClick={() => applySystem('stopwatch', pomodoroLength, customMinutes)}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'stopwatch'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/80 shadow-xs ring-2 ring-indigo-400/30'
              : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl">⏱️</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              Open
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
              {language === 'am' ? 'ክፍት ቆጣሪ' : 'Stopwatch'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Count Up
            </div>
          </div>
        </button>
      </div>

      {/* Today's Focus Activities Hub: Click any task to launch its tailored focus & motion graphics */}
      {tasks.length > 0 && (
        <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#0082ff]" />
              {language === 'am' ? 'የዛሬ ተግባራትን በመንካት ትኩረትና እንቅስቃሴ ይጀምሩ' : "Click Today's Tasks to Trigger Focus & Motion Graphics"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const items = tasks.filter(t => !t.completed).map(t => ({
                    title: t.title,
                    notes: `${t.domain} • ${t.durationMin}m block in NEVA`,
                    dueMinutes: t.durationMin
                  }));
                  await iosNativeBridge.syncTasksToReminders(items);
                  alert(language === 'am' ? 'ተግባራት ወደ iPhone Reminders ተልከዋል!' : 'Tasks synced to iPhone Reminders!');
                }}
                className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center gap-1 hover:bg-blue-100 transition cursor-pointer"
                title="Sync tasks to iPhone Reminders"
              >
                <Smartphone size={12} />
                <span>{language === 'am' ? 'ወደ Reminders' : 'To Reminders'}</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                {tasks.filter(t => !t.completed).length} {language === 'am' ? 'የቀሩ' : 'remaining'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tasks.map((task) => {
              const isSelected = activeTaskTitle === task.title;
              return (
                <button
                  key={task.id}
                  onClick={() => handleLaunchTaskFocus(task)}
                  className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#0082ff] text-white border-[#0082ff] shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
                  }`}
                  title={`Launch Focus Mode for ${task.title}`}
                >
                  <span className={`w-2 h-2 rounded-full ${task.completed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="truncate max-w-[170px]">{task.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'}`}>
                    {task.durationMin}m
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Focus Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Timer Arena & Hypnotic Circular Progress (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center justify-between relative overflow-hidden">
          
          {/* Breathing Ambient Respiration Aura */}
          <div 
            className={`absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isTimerRunning ? 'animate-neva-breathe opacity-25 dark:opacity-35' : 'opacity-10 scale-90'
            }`}
            style={{ backgroundColor: themeColor }}
          />

          {/* Top Status & Phase Badges & Zen Theater Toggle */}
          <div className="w-full flex items-center justify-between gap-2 flex-wrap z-10">
            {/* System Name Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{getSystemIcon(selectedSystem)}</span>
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  {selectedSystem === 'pomodoro' ? (language === 'am' ? 'የቲማቲም ዘዴ' : 'Pomodoro Tomato') :
                   selectedSystem === 'ultradian' ? 'Ultradian 90/20 Flow' :
                   selectedSystem === 'desktime' ? '52/17 Performance' :
                   selectedSystem === 'sprint' ? '15m Power Sprint' :
                   selectedSystem === 'custom' ? (language === 'am' ? `ብጁ ${customMinutes} ደቂቃ` : `Custom ${customMinutes}m`) :
                   'Open Flow Stopwatch'}
                </span>
                {activeTaskTitle && (
                  <span className="text-[10px] text-[#0082ff] font-bold truncate max-w-[200px] block">
                    🎯 {activeTaskTitle}
                  </span>
                )}
              </div>
            </div>

            {/* Phase Badge & Zen Theater Mode Toggle */}
            <div className="flex items-center gap-2">
              {phase === 'focus' ? (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-[#0082ff] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 shadow-2xs">
                  <Flame size={13} className="text-[#0082ff] animate-pulse" />
                  {language === 'am' ? 'የትኩረት ስራ' : 'Focus Block'}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                  <Coffee size={13} className="text-emerald-500" />
                  {phase === 'long_break' 
                    ? (language === 'am' ? 'ረጅም እረፍት (15ደ)' : 'Long Break (15m)') 
                    : (language === 'am' ? 'አጭር እረፍት' : 'Short Break')}
                </span>
              )}

              {/* Sound & Alarm Settings Button */}
              <button
                type="button"
                onClick={() => setIsSoundModalOpen(true)}
                className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1"
                title={language === 'am' ? 'የድምፅና የማንቂያ ደወል መረጣ' : 'Focus Sound & Alarm Chooser'}
              >
                <Volume2 size={15} />
              </button>

              {/* Theater / Fullscreen Zen Button */}
              <button
                type="button"
                onClick={() => setIsZenMode(true)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Deep Flow Theater (Full-Screen Focus Mode)"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>

          {/* Pomodoro Tomato Cycles Indicator (if pomodoro selected) */}
          {selectedSystem === 'pomodoro' && (
            <div className="w-full flex items-center justify-center gap-3 py-2.5 z-10">
              <span className="text-xs font-bold text-slate-400">Cycles:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((cycleNum) => {
                  const isDone = cycleNum < pomodoroCycle;
                  const isCurrent = cycleNum === pomodoroCycle;
                  return (
                    <div 
                      key={cycleNum}
                      className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-red-500 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-2 border-red-500 scale-110 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      🍅
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hypnotic Motion Graphics Chronometer with Real Time Movement */}
          {(() => {
            const photonAngleRad = (progressPercent / 100) * 2 * Math.PI;
            const photonX = 50 + 42 * Math.cos(photonAngleRad);
            const photonY = 50 + 42 * Math.sin(photonAngleRad);
            const secondAngle = ((currentDisplaySeconds % 60) / 60) * 2 * Math.PI;

            return (
              <div className="relative w-68 h-68 sm:w-80 sm:h-80 my-3 flex items-center justify-center z-10">
                
                {/* SVG Motion Chronometer Stage */}
                <svg className="w-full h-full transform -rotate-90 select-none" viewBox="0 0 100 100">
                  {/* Outer Orbit Concentric Gyroscope Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="47.5"
                    fill="none"
                    stroke={themeColor}
                    strokeWidth="0.6"
                    strokeDasharray="2.5 5.5"
                    opacity={isTimerRunning ? 0.45 : 0.22}
                    className="animate-neva-orbit origin-center"
                  />

                  {/* Inner Counter-Rotating Telemetry Sub-Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="0.4"
                    strokeDasharray="1.5 6"
                    opacity={isTimerRunning ? 0.35 : 0.15}
                    className="animate-neva-orbit-reverse origin-center"
                  />

                  {/* 12 Cardinal Hour Marks with Kinetic Illumination */}
                  {[...Array(12)].map((_, i) => {
                    const tickAngle = (i / 12) * 2 * Math.PI;
                    const x1 = 50 + 44 * Math.cos(tickAngle);
                    const y1 = 50 + 44 * Math.sin(tickAngle);
                    const x2 = 50 + 46.5 * Math.cos(tickAngle);
                    const y2 = 50 + 46.5 * Math.sin(tickAngle);
                    const isLit = (i / 12) * 100 <= progressPercent;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isLit ? themeColor : '#94a3b8'}
                        strokeWidth={i % 3 === 0 ? '1.2' : '0.6'}
                        opacity={isLit ? 0.9 : 0.25}
                      />
                    );
                  })}

                  {/* 60-Second Real-Time Sweeping Radar Ray */}
                  {isTimerRunning && (
                    <line
                      x1="50"
                      y1="50"
                      x2={50 + 38 * Math.cos(secondAngle)}
                      y2={50 + 38 * Math.sin(secondAngle)}
                      stroke={themeColor}
                      strokeWidth="0.6"
                      strokeDasharray="2 3"
                      opacity="0.38"
                    />
                  )}

                  {/* Base Track Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="5.5"
                    fill="none"
                  />

                  {/* Animated Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke={themeColor}
                    strokeWidth="5.5"
                    strokeDasharray="264"
                    strokeDashoffset={264 - (264 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-300"
                  />

                  {/* Kinetic Leading Photon Comet Tip */}
                  {progressPercent > 0 && (
                    <>
                      <circle
                        cx={photonX}
                        cy={photonY}
                        r="4.5"
                        fill={themeColor}
                        opacity="0.5"
                        className="animate-pulse"
                      />
                      <circle
                        cx={photonX}
                        cy={photonY}
                        r="2.6"
                        fill="#ffffff"
                        filter={`drop-shadow(0 0 6px ${themeColor})`}
                      />
                    </>
                  )}
                </svg>

                {/* Oscillating Neural / Frequency Waves in Center Behind Digits */}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none opacity-20 dark:opacity-30 z-0">
                  {[0.55, 1.1, 1.8, 1.3, 0.65].map((scale, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${isTimerRunning ? 'animate-neva-wave' : 'h-3'}`}
                      style={{
                        backgroundColor: themeColor,
                        height: isTimerRunning ? `${24 * scale}px` : '6px',
                        animationDelay: `${i * 150}ms`
                      }}
                    />
                  ))}
                </div>

                {/* Time Display Inside Circle */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                  <div 
                    className="text-5xl sm:text-6xl font-mono font-black tracking-tight drop-shadow-xs transition-transform duration-150"
                    style={{ color: isTimerRunning ? themeColor : undefined }}
                  >
                    {formatTime(currentDisplaySeconds)}
                  </div>
                  <div className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                    <span>{CategoryIcon && <CategoryIcon size={13} className="inline mr-1" />}</span>
                    <span>{currentCategoryObj.label}</span>
                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Adjustment Micro-Pills (+1m, +5m, -1m, -5m) */}
          <div className="flex items-center justify-center gap-2 pb-2 z-10">
            <button
              onClick={() => adjustSeconds(-60)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              title="Subtract 1 minute"
            >
              -1m
            </button>
            <button
              onClick={() => adjustSeconds(-300)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              title="Subtract 5 minutes"
            >
              -5m
            </button>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 font-mono">
              {language === 'am' ? 'ደቂቃ አስተካክል' : 'Adjust'}
            </span>
            <button
              onClick={() => adjustSeconds(60)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              title="Add 1 minute"
            >
              +1m
            </button>
            <button
              onClick={() => adjustSeconds(300)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              title="Add 5 minutes"
            >
              +5m
            </button>
          </div>

          {/* Primary Action Buttons: Start / Pause / Reset / Skip */}
          <div className="flex items-center justify-center gap-3 w-full pt-3 border-t border-slate-100 dark:border-slate-800/80 z-10">
            <button
              onClick={handleReset}
              className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={toggleStartPause}
              style={{ backgroundColor: isTimerRunning ? '#334155' : themeColor }}
              className="px-8 py-3.5 text-white font-black text-sm sm:text-base rounded-2xl flex items-center gap-2 shadow-md hover:opacity-95 active:scale-95 transition cursor-pointer"
            >
              {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
              <span>
                {isTimerRunning 
                  ? (language === 'am' ? 'አፍታ አቁም' : 'Pause') 
                  : (language === 'am' ? 'ትኩረት ጀምር' : 'Start Focus')}
              </span>
            </button>

            {/* Skip phase button */}
            {selectedSystem !== 'stopwatch' && (
              <button
                onClick={() => {
                  if (phase === 'focus') {
                    switchPhase('short_break');
                  } else {
                    switchPhase('focus');
                  }
                }}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer"
                title={phase === 'focus' ? 'Skip to Break' : 'Skip to Focus'}
              >
                <SkipForward size={18} />
              </button>
            )}

            {/* Sound & Alarm Settings Button */}
            <button
              type="button"
              onClick={() => setIsSoundModalOpen(true)}
              className="p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={language === 'am' ? 'የድምፅና የማንቂያ ደወል መረጣ' : 'Sound & Alarm Chooser'}
            >
              <Volume2 size={18} />
              <span className="hidden sm:inline text-xs font-bold">
                {language === 'am' ? 'ድምፅ' : 'Sound'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Customization, Pillar Tagging & Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Custom Minute Picker (if Custom Countdown or Pomodoro selected) */}
          {selectedSystem === 'custom' && (
            <div className="bg-white dark:bg-[#121927] border border-blue-200 dark:border-blue-900/60 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock size={15} className="text-[#0082ff]" />
                  {language === 'am' ? 'የሚፈለገውን ደቂቃ ይምረጡ' : 'Select Countdown Minutes'}
                </span>
                <span className="text-xs font-black text-[#0082ff]">
                  {customMinutes} min
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[5, 10, 15, 20, 25, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setCustomMinutes(mins);
                      applySystem('custom', pomodoroLength, mins);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      customMinutes === mins
                        ? 'bg-[#0082ff] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Custom Number Input */}
              <div className="flex items-center gap-2 pt-1">
                <label className="text-[11px] font-semibold text-slate-500">
                  {language === 'am' ? 'ወይም ደቂቃ ይጻፉ:' : 'Or enter custom minutes:'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={customMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(240, Number(e.target.value) || 1));
                    setCustomMinutes(val);
                    applySystem('custom', pomodoroLength, val);
                  }}
                  className="w-20 px-2.5 py-1 text-center font-bold text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#0082ff]"
                />
              </div>
            </div>
          )}

          {/* Pomodoro Length Variant (25m vs 50m) */}
          {selectedSystem === 'pomodoro' && (
            <div className="bg-white dark:bg-[#121927] border border-red-200 dark:border-red-900/60 rounded-3xl p-5 shadow-xs space-y-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>🍅</span>
                {language === 'am' ? 'የቲማቲም ክፍለ-ጊዜ ርዝማኔ' : 'Pomodoro Interval Variant'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setPomodoroLength(25);
                    applySystem('pomodoro', 25, customMinutes);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-extrabold text-center transition cursor-pointer ${
                    pomodoroLength === 25
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Classic (25m / 5m)
                </button>
                <button
                  onClick={() => {
                    setPomodoroLength(50);
                    applySystem('pomodoro', 50, customMinutes);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-extrabold text-center transition cursor-pointer ${
                    pomodoroLength === 50
                      ? 'bg-red-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Deep 50 (50m / 10m)
                </button>
              </div>
            </div>
          )}

          {/* Pillar / Category Tagging */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Award size={15} className="text-[#0082ff]" />
              {language === 'am' ? 'የትኩረት ዓምድ (Category Pillar)' : 'Tag Focus to Mastery Pillar'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {categoryOptions.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon size={12} style={{ color: isSelected ? undefined : cat.color }} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session Accomplishment Note */}
          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {language === 'am' ? 'የክፍለ-ጊዜ ማስታወሻ (አማራጭ)' : 'Session Goal / Notes (Optional)'}
            </label>
            <input
              type="text"
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder={
                language === 'am' 
                  ? 'ምን ላይ ትኩረት አደረጉ? (ለምሳሌ፦ ምዕራፍ 3፣ ኮዲንግ...)' 
                  : 'What are you executing? (e.g., Chapter 3, Feature build...)'
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-1 focus:ring-[#0082ff]"
            />
          </div>

          {/* Completed Sessions Log Today */}
          {recentSessions.length > 0 && (
            <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <History size={14} className="text-[#0082ff]" />
                  {language === 'am' ? 'የዛሬ የተጠናቀቁ የትኩረት ሰዓታት' : 'Today’s Logged Focus Sessions'}
                </span>
                <span className="text-[11px] font-extrabold text-[#0082ff]">
                  {recentSessions.reduce((acc, s) => acc + s.durationMinutes, 0)} min total
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recentSessions.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{getSystemIcon(log.system)}</span>
                      <div className="truncate">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {log.durationMinutes}m
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1.5">
                          ({log.category})
                        </span>
                        {log.notes && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {log.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zen Theater Fullscreen Flow Mode */}
      {isZenMode && (() => {
        const photonAngleRad = (progressPercent / 100) * 2 * Math.PI;
        const photonX = 50 + 42 * Math.cos(photonAngleRad);
        const photonY = 50 + 42 * Math.sin(photonAngleRad);
        const secondAngle = ((currentDisplaySeconds % 60) / 60) * 2 * Math.PI;

        return (
          <div className="fixed inset-0 z-[99990] bg-[#faf9f6] dark:bg-[#080c14] flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-fadeIn">
            {/* Ambient Breathing Background Aura */}
            <div 
              className={`absolute w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
                isTimerRunning ? 'animate-neva-breathe opacity-25 dark:opacity-35' : 'opacity-10 scale-90'
              }`}
              style={{ backgroundColor: themeColor }}
            />

            {/* Zen Top Header */}
            <div className="w-full max-w-4xl flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{getSystemIcon(selectedSystem)}</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    {selectedSystem === 'ultradian' ? 'Ultradian 90/20 Rhythm' :
                     selectedSystem === 'pomodoro' ? 'Tomato Pomodoro System' :
                     selectedSystem.toUpperCase()}
                  </h3>
                  {activeTaskTitle && (
                    <span className="text-xs text-[#0082ff] font-bold block truncate max-w-xs">
                      🎯 {activeTaskTitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsZenMode(false)}
                  className="px-3.5 py-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Minimize2 size={14} />
                  <span>Exit Zen</span>
                </button>
              </div>
            </div>

            {/* Giant Centered Motion Chronometer */}
            <div className="relative w-72 h-72 sm:w-[420px] sm:h-[420px] flex items-center justify-center z-10 my-auto">
              <svg className="w-full h-full transform -rotate-90 select-none" viewBox="0 0 100 100">
                {/* Outer Celestial Orbit Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="0.5"
                  strokeDasharray="2 6"
                  opacity={isTimerRunning ? 0.5 : 0.25}
                  className="animate-neva-orbit origin-center"
                />

                {/* Counter-Rotating Gyroscope Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="0.4"
                  strokeDasharray="2 8"
                  opacity={isTimerRunning ? 0.35 : 0.15}
                  className="animate-neva-orbit-reverse origin-center"
                />

                {/* 12 Cardinal Hour Marks with Kinetic Illumination */}
                {[...Array(12)].map((_, i) => {
                  const tickAngle = (i / 12) * 2 * Math.PI;
                  const x1 = 50 + 44 * Math.cos(tickAngle);
                  const y1 = 50 + 44 * Math.sin(tickAngle);
                  const x2 = 50 + 47 * Math.cos(tickAngle);
                  const y2 = 50 + 47 * Math.sin(tickAngle);
                  const isLit = (i / 12) * 100 <= progressPercent;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isLit ? themeColor : '#94a3b8'}
                      strokeWidth={i % 3 === 0 ? '1.2' : '0.6'}
                      opacity={isLit ? 0.9 : 0.25}
                    />
                  );
                })}

                {/* 60-Second Real-Time Sweeping Radar Ray */}
                {isTimerRunning && (
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + 38 * Math.cos(secondAngle)}
                    y2={50 + 38 * Math.sin(secondAngle)}
                    stroke={themeColor}
                    strokeWidth="0.8"
                    strokeDasharray="2 4"
                    opacity="0.45"
                  />
                )}

                {/* Base Track Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="5"
                  fill="none"
                />

                {/* Animated Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={themeColor}
                  strokeWidth="5"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-300"
                />

                {/* Leading Photon Comet Tip */}
                {progressPercent > 0 && (
                  <>
                    <circle
                      cx={photonX}
                      cy={photonY}
                      r="4.5"
                      fill={themeColor}
                      opacity="0.5"
                      className="animate-pulse"
                    />
                    <circle
                      cx={photonX}
                      cy={photonY}
                      r="2.8"
                      fill="#ffffff"
                      filter={`drop-shadow(0 0 8px ${themeColor})`}
                    />
                  </>
                )}
              </svg>

              {/* Oscillating Neural / Audio Frequency Waves */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none opacity-25 dark:opacity-35 z-0">
                {[0.5, 1.2, 1.9, 1.4, 0.7].map((scale, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${isTimerRunning ? 'animate-neva-wave' : 'h-4'}`}
                    style={{
                      backgroundColor: themeColor,
                      height: isTimerRunning ? `${32 * scale}px` : '8px',
                      animationDelay: `${i * 150}ms`
                    }}
                  />
                ))}
              </div>

              {/* Time Numbers */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                <div 
                  className="text-6xl sm:text-7xl font-mono font-black tracking-tight"
                  style={{ color: isTimerRunning ? themeColor : undefined }}
                >
                  {formatTime(currentDisplaySeconds)}
                </div>
                <div className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {Math.round(progressPercent)}% • {phase === 'focus' ? 'Deep Work' : 'Break'}
                  </span>
                </div>
              </div>
            </div>

            {/* Zen Bottom Action Controls */}
            <div className="flex items-center justify-center gap-4 z-10 w-full max-w-md pb-4">
              <button
                type="button"
                onClick={handleReset}
                className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw size={20} />
              </button>

              <button
                type="button"
                onClick={() => setIsSoundModalOpen(true)}
                className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-2xl transition cursor-pointer"
                title="Focus Sound & Alarm Chooser"
              >
                <Volume2 size={20} />
              </button>

              <button
                type="button"
                onClick={toggleStartPause}
                style={{ backgroundColor: isTimerRunning ? '#334155' : themeColor }}
                className="flex-1 py-4 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-95 transition cursor-pointer"
              >
                {isTimerRunning ? <Pause size={22} /> : <Play size={22} />}
                <span>
                  {isTimerRunning 
                    ? (language === 'am' ? 'አፍታ አቁም' : 'Pause Focus') 
                    : (language === 'am' ? 'ትኩረት ጀምር' : 'Start Focus')}
                </span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Focus Sound & Alarm Chooser Modal */}
      <FocusSoundModal 
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
        language={language}
      />
    </div>
  );
};
