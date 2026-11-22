import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Timer, CheckCircle2, 
  Sparkles, Coffee, Flame, Zap, Sliders, Plus, Minus,
  SkipForward, Clock, History, Award, Shield, BookOpen,
  Dumbbell, Swords, ChessKnight, Palette, Music, Building2, TrendingUp,
  Check, Brain, Maximize2, Minimize2, Activity, Waves,
  Volume2, Bell, Smartphone, Tv, Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask } from '../types';
import { soundEngine } from '../utils/audio';
import { iosNativeBridge } from '../utils/iosNativeBridge';
import { mobileTimerEngine } from '../utils/mobileTimerEngine';
import { timerNotificationService } from '../utils/timerNotificationService';
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

  // Flexible Dynamic Clock Color Theme Override (null = auto sync with system/task)
  const [customThemeColor, setCustomThemeColor] = useState<string | null>(null);
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState<boolean>(false);

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
    mobileTimerEngine.stop();
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

    // Flexibly change clock theme color to match system (unless user manually chose a color)
    if (!customThemeColor) {
      const sysColor =
        system === 'pomodoro' ? '#ff453a' :
        system === 'ultradian' ? '#af52de' :
        system === 'custom' ? '#30d158' : '#5e5ce6';
      mobileTimerEngine.setThemeColor(sysColor);
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

    // Flexibly change clock theme color to match task category
    if (!customThemeColor) {
      const cat = categoryOptions.find((c) => c.id === matchedCategory);
      if (cat) {
        mobileTimerEngine.setThemeColor(cat.color);
      }
    }

    // Choose optimal rhythm: if task duration >= 75m use Ultradian, else pomodoro or custom
    let targetSystem: FocusSystemType = selectedSystem;
    if (task.durationMin >= 75) {
      targetSystem = 'ultradian';
    } else if (task.durationMin === 25 || task.durationMin === 50) {
      targetSystem = 'pomodoro';
      setPomodoroLength(task.durationMin);
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
    mobileTimerEngine.stop();
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

  // Subscribe to mobileTimerEngine (timestamp-accurate, wake-lock enabled, lock-screen active)
  useEffect(() => {
    const unsubscribe = mobileTimerEngine.subscribe((engineState) => {
      if (engineState.isActive) {
        setIsTimerRunning(engineState.isRunning);
        if (engineState.mode === 'stopwatch') {
          setSelectedSystem('stopwatch');
          setStopwatchSeconds(engineState.stopwatchSeconds);
        } else {
          setSecondsRemaining(engineState.secondsRemaining);
          setTotalDurationSeconds(engineState.totalDurationSeconds);
          setPhase(engineState.phase);
          if (engineState.system && engineState.system !== 'stopwatch') {
            setSelectedSystem(engineState.system as FocusSystemType);
          }
        }
        if (engineState.taskTitle) {
          setActiveTaskTitle(engineState.taskTitle);
        }
        if (engineState.category) {
          setSelectedCategory(engineState.category);
        }
      }
    });

    return unsubscribe;
  }, []);

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
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      soundEngine.playStartSound();
      soundEngine.startAmbience();
      iosNativeBridge.haptic('medium');
      timerNotificationService.requestPermission().catch(() => {});

      if (selectedSystem === 'stopwatch') {
        mobileTimerEngine.startStopwatch({
          initialElapsedSeconds: stopwatchSeconds,
          taskTitle: activeTaskTitle || undefined,
          category: selectedCategory,
          system: 'stopwatch',
          themeColor: getThemeColor(),
        });
      } else {
        mobileTimerEngine.startCountdown({
          durationSeconds: totalDurationSeconds,
          initialRemainingSeconds: secondsRemaining,
          taskTitle: activeTaskTitle || undefined,
          category: selectedCategory,
          system: selectedSystem,
          phase,
          themeColor: getThemeColor(),
          onComplete: handleTimerComplete
        });
      }
    } else {
      setIsTimerRunning(false);
      soundEngine.stopAmbience();
      iosNativeBridge.haptic('light');
      mobileTimerEngine.pause();
    }
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    soundEngine.stopAmbience();
    iosNativeBridge.cancelAlarm('focus-timer');
    mobileTimerEngine.stop();

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
      const next = Math.max(0, stopwatchSeconds + deltaSeconds);
      setStopwatchSeconds(next);
      mobileTimerEngine.updateStopwatchSeconds(next);
    } else {
      const next = Math.max(10, secondsRemaining + deltaSeconds);
      const nextTotal = Math.max(10, totalDurationSeconds + deltaSeconds);
      setSecondsRemaining(next);
      setTotalDurationSeconds(nextTotal);
      mobileTimerEngine.updateRemainingSeconds(next, nextTotal);
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

  // Flexible dynamic color theme according to system, task, phase, and user preference
  const getThemeColor = () => {
    // 1. If user locked a custom color preference
    if (customThemeColor) return customThemeColor;

    // 2. Rest / Break phase
    if (phase === 'short_break' || phase === 'long_break') return '#34d399'; // Mint break

    // 3. Task specific category color (if running a tagged task)
    if (selectedCategory && selectedCategory !== 'buffer') {
      const cat = categoryOptions.find((c) => c.id === selectedCategory);
      if (cat) return cat.color;
    }

    // 4. Default signature color for each clock system
    switch (selectedSystem) {
      case 'pomodoro': return '#ff453a'; // Flame Tomato Red
      case 'ultradian': return '#af52de'; // Cognitive Purple / Violet (90/20)
      case 'custom': return '#30d158'; // Apple Vivid Emerald Green
      case 'stopwatch': return '#5e5ce6'; // Precision Sapphire Indigo
      default: return '#30d158';
    }
  };

  const getSystemIcon = (sys: FocusSystemType) => {
    switch (sys) {
      case 'pomodoro': return '🍅';
      case 'ultradian': return '🧠';
      case 'custom': return '🎯';
      case 'stopwatch': return '⏱️';
      default: return '⏱️';
    }
  };

  const categoryOptions = [
    { id: 'devotion', label: language === 'am' ? 'ጸሎት' : 'Devotion', color: '#a855f7', icon: BookOpen },
    { id: 'exercise', label: language === 'am' ? 'ስፖርት' : 'Exercise', color: '#ef4444', icon: Dumbbell },
    { id: 'chess', label: language === 'am' ? 'ቼዝ' : 'Chess', color: '#6366f1', icon: ChessKnight },
    { id: 'art', label: language === 'am' ? 'ስዕል' : 'Art', color: '#ec4899', icon: Palette },
    { id: 'music', label: language === 'am' ? 'ሙዚቃ' : 'Music', color: '#f59e0b', icon: Music },
    { id: 'architecture', label: language === 'am' ? 'አርክቴክቸር' : 'Architecture', color: '#06b6d4', icon: Building2 },
    { id: 'trading', label: language === 'am' ? 'ንግድ' : 'Trading', color: '#10b981', icon: TrendingUp },
    { id: 'buffer', label: language === 'am' ? 'አጠቃላይ' : 'General Focus', color: '#64748b', icon: Shield },
  ];

  const currentCategoryObj = categoryOptions.find((c) => c.id === selectedCategory) || categoryOptions[0] || { id: 'buffer', label: 'Focus', color: '#0082ff', icon: Shield };
  const CategoryIcon = currentCategoryObj.icon;

  const currentDisplaySeconds = selectedSystem === 'stopwatch' ? stopwatchSeconds : secondsRemaining;
  const progressPercent = calculateProgress();
  const themeColor = getThemeColor();

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 animate-fadeIn select-none overflow-x-hidden">
      
      {/* Top Header - Executive Flow Cockpit Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50/70 to-blue-50/30 dark:from-[#121927] dark:via-[#0f172a] dark:to-[#1e293b]/40 border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-6 shadow-xs">
        {/* Ambient atmospheric lighting */}
        <div 
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 dark:opacity-30 transition-all duration-700"
          style={{ backgroundColor: themeColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-[#0082ff] to-cyan-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Timer className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {language === 'am' ? 'የትኩረትና ፍሰት ስራ ሰዓት ቆጣሪ' : 'Deep Focus & Flow Engine'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {language === 'am'
                    ? 'የተረጋገጡ የሳይንስ የትኩረት ስልቶችን ይምረጡ፡ ፖሞዶሮ፣ 90/20 ጥልቅ ሪትም፣ ብጁ ቆጣሪ ወይም ክፍት ስቶፕዎች።'
                    : 'Scientifically-tuned cognitive protocols: Pomodoro cadence, Ultradian 90/20 bio-rhythm, bespoke target blocks, or unbounded flow.'}
                </p>
              </div>
            </div>
          </div>

          {/* Active Mode Cockpit Telemetry Badge */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
              <div 
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: themeColor,
                  boxShadow: `0 0 10px ${themeColor}`
                }}
              />
              <div className="text-left">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500 block font-bold">
                  {language === 'am' ? 'የተመረጠ ሁነታ' : 'Active Protocol'}
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>
                    {selectedSystem === 'pomodoro' 
                      ? (language === 'am' ? 'ፖሞዶሮ 🍅' : `Pomodoro (${pomodoroLength}m) 🍅`)
                      : selectedSystem === 'ultradian' 
                      ? (language === 'am' ? 'ጥልቅ ስራ (90/20) 🧠' : 'Deep Work (90/20) 🧠')
                      : selectedSystem === 'custom' 
                      ? (language === 'am' ? `ብጁ (${customMinutes}ደ) 🎯` : `Custom (${customMinutes}m) 🎯`)
                      : (language === 'am' ? 'ስቶፕዎች ⏱️' : 'Stopwatch Flow ⏱️')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus System Switcher Tabs - 4 High-Performance Interactive Protocol Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 1. Pomodoro / Tomato Cadence Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => applySystem('pomodoro', pomodoroLength, customMinutes)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applySystem('pomodoro', pomodoroLength, customMinutes); }}
          className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'pomodoro'
              ? 'bg-gradient-to-br from-rose-500/10 via-red-500/5 to-white dark:from-rose-950/40 dark:via-red-950/20 dark:to-[#121927] border-rose-400 dark:border-rose-500/70 shadow-md shadow-rose-500/10 ring-2 ring-rose-400/30 -translate-y-1'
              : 'bg-white/90 dark:bg-[#121927]/90 border-slate-200/90 dark:border-slate-800/90 hover:border-rose-300 dark:hover:border-rose-700/60 hover:shadow-xs hover:-translate-y-0.5'
          }`}
        >
          {/* Subtle Watermark Arc */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 pointer-events-none opacity-5 dark:opacity-10 group-hover:opacity-15 transition-opacity">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-rose-500 stroke-current" strokeWidth="6">
              <circle cx="50" cy="50" r="40" strokeDasharray="15 8" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {/* Bespoke Tomato Vector Art */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-rose-500/20 via-red-500/10 to-transparent border border-rose-200 dark:border-rose-800/60 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="pomoArtGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ff453a" />
                      <stop offset="1" stopColor="#e11d48" />
                    </linearGradient>
                    <linearGradient id="pomoLeafGrad" x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#34d399" />
                      <stop offset="1" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  {/* Cadence orbit */}
                  <circle cx="18" cy="20" r="13" stroke="#ff453a" strokeWidth="1" strokeDasharray="2.5 2.5" opacity="0.3" />
                  {/* 4 cadence dots */}
                  <circle cx="18" cy="7" r="1.2" fill="#ff453a" />
                  <circle cx="31" cy="20" r="1.2" fill="#ff453a" />
                  <circle cx="18" cy="33" r="1.2" fill="#ff453a" />
                  <circle cx="5" cy="20" r="1.2" fill="#ff453a" />
                  {/* Tomato Body */}
                  <path d="M18 11C12 11 8.5 15 8.5 21C8.5 26.5 12.5 30 18 30C23.5 30 27.5 26.5 27.5 21C27.5 15 24 11 18 11Z" fill="url(#pomoArtGrad)" />
                  <ellipse cx="14.5" cy="16.5" rx="2.5" ry="1.2" transform="rotate(-30 14.5 16.5)" fill="white" opacity="0.4" />
                  {/* Stem & Leaves */}
                  <path d="M18 7C18 8.5 17.5 10 18 11.5M18 9C20 7.5 22.5 8 23.5 9.5C21 10 19.5 10 18 9ZM18 9C16 7.5 13.5 8 12.5 9.5C15 10 16.5 10 18 9Z" stroke="url(#pomoLeafGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1 shrink-0">
                {selectedSystem === 'pomodoro' && (
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-rose-500 text-white tracking-wider animate-pulse">
                    ACTIVE
                  </span>
                )}
                <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all ${
                  selectedSystem === 'pomodoro'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                }`}>
                  {pomodoroLength}m / {pomodoroLength === 50 ? '10m' : '5m'}
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'የቲማቲም ዘዴ' : 'Pomodoro Flow'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'am' ? '25ደ/50ደ የትኩረት ዑደት' : '25m / 50m Cycles'}
              </div>
            </div>
          </div>

          {/* Quick Segmented Duration Toggle (25m vs 50m) */}
          <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPomodoroLength(25);
                applySystem('pomodoro', 25, customMinutes);
              }}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold font-mono text-center transition-all cursor-pointer ${
                pomodoroLength === 25
                  ? 'bg-rose-500 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              25m Classic
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPomodoroLength(50);
                applySystem('pomodoro', 50, customMinutes);
              }}
              className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold font-mono text-center transition-all cursor-pointer ${
                pomodoroLength === 50
                  ? 'bg-rose-500 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              50m Deep
            </button>
          </div>
        </div>

        {/* 2. Ultradian 90/20 Protocol Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => applySystem('ultradian', pomodoroLength, customMinutes)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applySystem('ultradian', pomodoroLength, customMinutes); }}
          className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'ultradian'
              ? 'bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-white dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-[#121927] border-purple-400 dark:border-purple-500/70 shadow-md shadow-purple-500/10 ring-2 ring-purple-400/30 -translate-y-1'
              : 'bg-white/90 dark:bg-[#121927]/90 border-slate-200/90 dark:border-slate-800/90 hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-xs hover:-translate-y-0.5'
          }`}
        >
          {/* Subtle Watermark Wave */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 pointer-events-none opacity-5 dark:opacity-10 group-hover:opacity-15 transition-opacity">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-purple-500 stroke-current" strokeWidth="6">
              <path d="M10 50 Q 30 20, 50 50 T 90 50" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {/* Bespoke Brain & Ultradian Sine Wave Art */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-indigo-500/10 to-transparent border border-purple-200 dark:border-purple-800/60 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="ultraArtGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#c084fc" />
                      <stop offset="1" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="waveArtGrad" x1="0" y1="18" x2="36" y2="18" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#a855f7" />
                      <stop offset="0.7" stopColor="#6366f1" />
                      <stop offset="1" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                  {/* Brain silhouette */}
                  <path d="M18 9C15 9 13 11 13 13C11.5 13 10 14.5 10 16.5C10 18 11 19.5 12 20C11.5 21 11.5 22.5 12.5 23.5C13.5 24.5 15 24.5 16 24M18 9C21 9 23 11 23 13C24.5 13 26 14.5 26 16.5C26 18 25 19.5 24 20C24.5 21 24.5 22.5 23.5 23.5C22.5 24.5 21 24.5 20 24" stroke="url(#ultraArtGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Ultradian Harmonic Wave */}
                  <path d="M5 28C9 28 12 18 18 18C24 18 27 30 31 30" stroke="url(#waveArtGrad)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="18" cy="18" r="1.8" fill="#a855f7" />
                  <circle cx="29" cy="29.5" r="1.4" fill="#34d399" />
                </svg>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1 shrink-0">
                {selectedSystem === 'ultradian' && (
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-600 text-white tracking-wider animate-pulse">
                    ACTIVE
                  </span>
                )}
                <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all ${
                  selectedSystem === 'ultradian'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                }`}>
                  90m / 20m
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'የ90/20 ጥልቅ ዘዴ' : 'Deep Work Flow'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'am' ? 'የተፈጥሮ 90ደ ጥልቅ ሪትም' : 'Ultradian Rhythm'}
              </div>
            </div>
          </div>

          {/* Ultradian Frequency Tag */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span>90m Peak Alert</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">20m Rest</span>
          </div>
        </div>

        {/* 3. Custom Countdown Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => applySystem('custom', pomodoroLength, customMinutes)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applySystem('custom', pomodoroLength, customMinutes); }}
          className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'custom'
              ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-white dark:from-cyan-950/40 dark:via-blue-950/20 dark:to-[#121927] border-cyan-400 dark:border-cyan-500/70 shadow-md shadow-cyan-500/10 ring-2 ring-cyan-400/30 -translate-y-1'
              : 'bg-white/90 dark:bg-[#121927]/90 border-slate-200/90 dark:border-slate-800/90 hover:border-cyan-300 dark:hover:border-cyan-700/60 hover:shadow-xs hover:-translate-y-0.5'
          }`}
        >
          {/* Subtle Watermark Reticle */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 pointer-events-none opacity-5 dark:opacity-10 group-hover:opacity-15 transition-opacity">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-cyan-500 stroke-current" strokeWidth="6">
              <circle cx="50" cy="50" r="38" strokeDasharray="10 10" />
              <line x1="50" y1="5" x2="50" y2="95" strokeWidth="2" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {/* Bespoke Precision Target Reticle Art */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent border border-cyan-200 dark:border-cyan-800/60 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="targetArtGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38bdf8" />
                      <stop offset="1" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  {/* Outer reticle */}
                  <circle cx="18" cy="18" r="13" stroke="url(#targetArtGrad)" strokeWidth="1.2" strokeDasharray="3.5 2.5" />
                  <circle cx="18" cy="18" r="8" stroke="url(#targetArtGrad)" strokeWidth="1.6" />
                  {/* Crosshairs */}
                  <line x1="18" y1="3" x2="18" y2="7" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="18" y1="29" x2="18" y2="33" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="3" y1="18" x2="7" y2="18" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="29" y1="18" x2="33" y2="18" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
                  {/* Center pip */}
                  <circle cx="18" cy="18" r="2.8" fill="#0284c7" />
                  <circle cx="18" cy="18" r="1" fill="#ffffff" />
                </svg>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1 shrink-0">
                {selectedSystem === 'custom' && (
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-cyan-600 text-white tracking-wider animate-pulse">
                    ACTIVE
                  </span>
                )}
                <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all ${
                  selectedSystem === 'custom'
                    ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                }`}>
                  {customMinutes}m
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'ብጁ ቆጣሪ' : 'Custom Minutes'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'am' ? 'የሚፈልጉትን ደቂቃ ይምረጡ' : 'Set Any Duration'}
              </div>
            </div>
          </div>

          {/* Custom Duration Sub-Detail */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>Target Duration</span>
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-extrabold">{customMinutes} Min Block</span>
          </div>
        </div>

        {/* 4. Open Stopwatch Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => applySystem('stopwatch', pomodoroLength, customMinutes)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') applySystem('stopwatch', pomodoroLength, customMinutes); }}
          className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
            selectedSystem === 'stopwatch'
              ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-[#121927] border-emerald-400 dark:border-emerald-500/70 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-400/30 -translate-y-1'
              : 'bg-white/90 dark:bg-[#121927]/90 border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-xs hover:-translate-y-0.5'
          }`}
        >
          {/* Subtle Watermark Tachymeter */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 pointer-events-none opacity-5 dark:opacity-10 group-hover:opacity-15 transition-opacity">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-emerald-500 stroke-current" strokeWidth="6">
              <circle cx="50" cy="50" r="38" strokeDasharray="5 5" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {/* Bespoke Chronometer & Infinity Flow Art */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-200 dark:border-emerald-800/60 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 36 36" fill="none">
                  <defs>
                    <linearGradient id="chronoArtGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#34d399" />
                      <stop offset="1" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  {/* Top Crown & Pushers */}
                  <rect x="16" y="2.5" width="4" height="2.5" rx="1" fill="#34d399" />
                  <line x1="14" y1="3" x2="22" y2="3" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="26" y1="5.5" x2="28" y2="7.5" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round" />
                  {/* Chrono casing */}
                  <circle cx="18" cy="20" r="12.5" stroke="url(#chronoArtGrad)" strokeWidth="1.6" />
                  {/* Inner tick ring */}
                  <circle cx="18" cy="20" r="9.5" stroke="#34d399" strokeWidth="0.8" strokeDasharray="1.5 3" opacity="0.6" />
                  {/* Infinity Symbol representing unbounded flow */}
                  <path d="M14 20C14 18.6 12.6 17.5 11.2 17.5C9.8 17.5 8.7 18.6 8.7 20C8.7 21.4 9.8 22.5 11.2 22.5C12.6 22.5 14 21.4 14 20ZM14 20L22 20M22 20C22 18.6 23.4 17.5 24.8 17.5C26.2 17.5 27.3 18.6 27.3 20C27.3 21.4 26.2 22.5 24.8 22.5C23.4 22.5 22 21.4 22 20Z" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1 shrink-0">
                {selectedSystem === 'stopwatch' && (
                  <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-600 text-white tracking-wider animate-pulse">
                    ACTIVE
                  </span>
                )}
                <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all ${
                  selectedSystem === 'stopwatch'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                }`}>
                  Open
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'ክፍት ስቶፕዎች' : 'Stopwatch Flow'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'am' ? 'ቆጥሮ የሚጨምር ክፍት ፍሰት' : 'Open Count Up'}
              </div>
            </div>
          </div>

          {/* Stopwatch Immersion Tag */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Unbounded Flow</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">∞ Zero Limit</span>
          </div>
        </div>
      </div>

      {/* Today's Focus Activities Hub: Mission Launch Deck */}
      {tasks.length > 0 && (
        <div className="bg-gradient-to-b from-white via-white to-slate-50/50 dark:from-[#121927] dark:via-[#121927] dark:to-[#0f172a] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0082ff] flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
                <Sparkles size={14} className="animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 block truncate">
                  {language === 'am' ? 'የዛሬ ተግባራትን በመንካት ትኩረት ይጀምሩ' : "Click Today's Tasks to Trigger Focus"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block font-medium">
                  {language === 'am' ? 'የተግባሩን ሰዓት እና ዘርፍ በቅጽበት ወደ ሰዓት ቆጣሪው ይጭናል' : 'Instantly maps task duration and domain into tailored flow rhythm'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#0082ff] dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 border border-blue-200/60 dark:border-blue-800/60"
                title="Sync tasks to iPhone Reminders"
              >
                <Smartphone size={13} />
                <span>{language === 'am' ? 'ወደ Reminders' : 'To Reminders'}</span>
              </button>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                {tasks.filter(t => !t.completed).length} {language === 'am' ? 'የቀሩ' : 'remaining'}
              </span>
            </div>
          </div>

          {/* Task pills carousel with category icons and instant launch */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none w-full max-w-full">
            {tasks.map((task) => {
              const isSelected = activeTaskTitle === task.title;
              return (
                <button
                  key={task.id}
                  onClick={() => handleLaunchTaskFocus(task)}
                  className={`group px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 shrink-0 max-w-[240px] sm:max-w-[280px] transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-[#0082ff] text-white border-[#0082ff] shadow-md shadow-blue-500/20'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/90 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-2xs'
                  }`}
                  title={`Launch Focus Mode for ${task.title}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${task.completed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="truncate">{task.title}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {task.durationMin}m
                  </span>
                  <Play size={10} className={`shrink-0 transition-transform group-hover:scale-125 ${isSelected ? 'text-white fill-white' : 'text-blue-500 dark:text-blue-400'}`} />
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
                  {selectedSystem === 'pomodoro' ? (language === 'am' ? 'የቲማቲም ዘዴ' : 'Pomodoro Flow') :
                   selectedSystem === 'ultradian' ? (language === 'am' ? 'የ90/20 ጥልቅ ዘዴ' : 'Deep Work Flow') :
                   selectedSystem === 'custom' ? (language === 'am' ? `ብጁ ${customMinutes} ደቂቃ` : `Custom ${customMinutes}m`) :
                   (language === 'am' ? 'ክፍት ስቶፕዎች' : 'Open Stopwatch')}
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

              {/* Dynamic Color Palette Chooser */}
              <button
                type="button"
                onClick={() => setIsColorPaletteOpen((prev) => !prev)}
                className="p-1.5 rounded-xl transition cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1 border"
                style={{
                  backgroundColor: isColorPaletteOpen ? `${themeColor}22` : 'transparent',
                  borderColor: isColorPaletteOpen ? themeColor : 'rgba(148, 163, 184, 0.25)',
                  color: themeColor
                }}
                title={language === 'am' ? 'የትኩረት ሰዓት ቀለም ምርጫ' : 'Clock Theme & Widget Color'}
              >
                <Palette size={15} />
              </button>

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

          {/* Quick Color Palette Drawer */}
          {isColorPaletteOpen && (
            <div className="w-full mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'am' ? 'የሰዓትና የዊድጄት ቀለም፡' : 'Clock & Widget Color:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomThemeColor(null);
                    mobileTimerEngine.setThemeColor('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                    !customThemeColor
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300'
                  }`}
                >
                  ⚡ AUTO
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'green', label: 'Emerald Green', color: '#30d158' },
                  { id: 'orange', label: 'iOS Orange', color: '#ff9f0a' },
                  { id: 'red', label: 'Tomato Red', color: '#ff453a' },
                  { id: 'purple', label: 'Cognitive Purple', color: '#af52de' },
                  { id: 'cyan', label: 'Sky Cyan', color: '#32ade6' },
                  { id: 'indigo', label: 'Sapphire Indigo', color: '#5e5ce6' },
                  { id: 'pink', label: 'Rose Pink', color: '#ec4899' },
                  { id: 'mint', label: 'Break Mint', color: '#34d399' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCustomThemeColor(item.color);
                      mobileTimerEngine.setThemeColor(item.color);
                    }}
                    className="w-6 h-6 rounded-full border-2 transition transform active:scale-90 flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: item.color,
                      borderColor: (customThemeColor || themeColor) === item.color ? '#ffffff' : 'transparent',
                      boxShadow: (customThemeColor || themeColor) === item.color ? `0 0 10px ${item.color}` : 'none'
                    }}
                    title={item.label}
                  >
                    {(customThemeColor || themeColor) === item.color && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

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

            {/* Little Window / PiP Button */}
            <button
              type="button"
              onClick={() => {
                mobileTimerEngine.setWindowMode('floating');
                mobileTimerEngine.togglePictureInPicture();
              }}
              className="p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={language === 'am' ? 'ትንሽ መስኮት / PiP አሳይ' : 'Pop out Little Window / PiP'}
            >
              <Tv size={18} />
              <span className="hidden sm:inline text-xs font-bold">
                {language === 'am' ? 'ትንሽ መስኮት' : 'Little Window'}
              </span>
            </button>

            {/* Sync to Apple System Clock Button */}
            <button
              type="button"
              onClick={() => {
                const mins = Math.max(1, Math.round(totalDurationSeconds / 60));
                iosNativeBridge.openSystemTimer(mins);
              }}
              className="p-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={language === 'am' ? 'ወደ iPhone ሲስተም ሰዓት ቆጣሪ ላክ' : 'Start Apple System Timer Widget'}
            >
              <Smartphone size={18} />
              <span className="hidden sm:inline text-xs font-bold">
                {language === 'am' ? 'የiPhone ሰዓት' : 'iPhone Clock'}
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
          <div className="fixed inset-0 z-[99990] bg-[#faf9f6] dark:bg-[#080c14] flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-fadeIn overflow-hidden">
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
                onClick={() => {
                  mobileTimerEngine.setWindowMode('floating');
                  mobileTimerEngine.togglePictureInPicture();
                }}
                className="p-3.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl transition cursor-pointer"
                title={language === 'am' ? 'ትንሽ መስኮት / PiP' : 'Little Window / PiP'}
              >
                <Tv size={20} />
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
