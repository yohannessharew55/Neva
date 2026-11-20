import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, CheckCircle2, Coffee, Sparkles, 
  RotateCcw, ArrowRight, X, Clock, Zap, Target
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { mobileTimerEngine } from '../utils/mobileTimerEngine';
import { timerNotificationService, TimerCompletionData } from '../utils/timerNotificationService';
import { soundEngine } from '../utils/audio';
import { iosNativeBridge } from '../utils/iosNativeBridge';

export const TimerCompletionModal: React.FC = () => {
  const { language, activeTask, toggleTaskCompletion, logSession } = useLivotion();
  const [data, setData] = useState<TimerCompletionData | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Trigger celebration effects
  const triggerCelebration = (sessionData: TimerCompletionData) => {
    setData(sessionData);
    setIsOpen(true);

    // Audio chime & heavy haptic
    soundEngine.playAlarmSound();
    iosNativeBridge.haptic('heavy');

    // Confetti explosion
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#0082ff', '#30d158', '#ffd60a', '#ff453a', '#bf5af2'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 250);
    } catch {}
  };

  useEffect(() => {
    // 1. Listen for real-time timer completion events
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<TimerCompletionData>;
      if (customEvent.detail) {
        triggerCelebration(customEvent.detail);
      }
    };
    window.addEventListener('neva-timer-completed', handleEvent);

    // 2. Check if a timer finished while the app was closed or backgrounded
    const pending = timerNotificationService.getPendingCompletion();
    if (pending) {
      triggerCelebration(pending);
      timerNotificationService.clearPendingCompletion();
    }

    return () => {
      window.removeEventListener('neva-timer-completed', handleEvent);
    };
  }, []);

  if (!isOpen || !data) return null;

  const categoryColor = data.categoryColor || '#0082ff';

  const handleClose = () => {
    setIsOpen(false);
    timerNotificationService.clearPendingCompletion();
    if (activeTask) {
      toggleTaskCompletion(activeTask.id);
    }
  };

  const handleTakeBreak = (minutes: number) => {
    setIsOpen(false);
    timerNotificationService.clearPendingCompletion();

    mobileTimerEngine.startCountdown({
      durationSeconds: minutes * 60,
      initialRemainingSeconds: minutes * 60,
      taskTitle: minutes <= 5 ? '☕ Short Refresh' : '🧘 Restorative Break',
      category: 'rest',
      system: 'break',
      phase: minutes <= 5 ? 'short_break' : 'long_break',
      themeColor: '#10b981',
      onComplete: () => {
        timerNotificationService.handleTimerEnd({
          title: 'Break Finished',
          category: 'Break',
          durationMinutes: minutes,
          phase: 'short_break',
        });
      },
    });
  };

  const handleRepeat = () => {
    setIsOpen(false);
    timerNotificationService.clearPendingCompletion();

    mobileTimerEngine.startCountdown({
      durationSeconds: data.durationMinutes * 60,
      initialRemainingSeconds: data.durationMinutes * 60,
      taskTitle: data.title,
      category: data.category,
      system: data.system,
      phase: 'focus',
      themeColor: categoryColor,
      onComplete: () => {
        timerNotificationService.handleTimerEnd(data);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      {/* Radiant ambient glow matching session category */}
      <div 
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-35 pointer-events-none"
        style={{ backgroundColor: categoryColor }}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden text-slate-900 dark:text-white transition-all scale-100 animate-zoomIn">
        
        {/* Top accent badge & Close icon */}
        <div className="flex items-center justify-between pb-3">
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide border shadow-2xs"
            style={{ 
              backgroundColor: `${categoryColor}18`, 
              color: categoryColor,
              borderColor: `${categoryColor}35`
            }}
          >
            <Sparkles size={13} className="animate-spin text-amber-500" />
            <span className="uppercase">{data.category || 'Focus Block'}</span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Celebration Icon */}
        <div className="my-3 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div 
              className="w-18 h-18 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform"
              style={{ backgroundColor: categoryColor }}
            >
              <Trophy size={36} className="text-white drop-shadow-md animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 size={16} />
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {language === 'am' ? 'የትኩረት ስራ ተጠናቋል!' : 'Focus Block Complete!'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs font-medium">
            {language === 'am' 
              ? 'ድንቅ ትጋት! ይህንን ክፍለ-ጊዜ በልህቀት አጠናቀዋል።' 
              : 'Outstanding discipline. You stayed present and conquered this focus session.'}
          </p>
        </div>

        {/* Session Summary Card */}
        <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'am' ? 'የስራው ርዕስ' : 'Session'}
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-500 flex items-center gap-1">
              <CheckCircle2 size={12} /> 100% Accomplished
            </span>
          </div>

          <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 truncate">
            {data.title}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/40 dark:border-slate-800">
              <Clock size={15} className="text-[#0082ff] shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Focused</div>
                <div className="font-extrabold text-slate-700 dark:text-slate-200">{data.durationMinutes} Minutes</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/40 dark:border-slate-800">
              <Zap size={15} className="text-amber-500 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Ended At</div>
                <div className="font-extrabold text-slate-700 dark:text-slate-200">{data.completedAt}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Recovery Action Options */}
        <div className="space-y-2 mt-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            {language === 'am' ? 'ቀጣይ እርምጃ ይምረጡ' : 'Next Step'}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTakeBreak(5)}
              className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/25 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <Coffee size={14} />
              <span>{language === 'am' ? '5ደቂቃ እረፍት' : '5m Break'}</span>
            </button>

            <button
              onClick={() => handleTakeBreak(15)}
              className="py-2.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-indigo-500/25 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <Sparkles size={14} />
              <span>{language === 'am' ? '15ደቂቃ ረጅም እረፍት' : '15m Rest'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRepeat}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <RotateCcw size={14} />
              <span>{language === 'am' ? 'እንደገና ጀምር' : 'Repeat'}</span>
            </button>

            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md shadow-blue-500/20"
            >
              <span>{language === 'am' ? 'ጨርስና ተመለስ' : 'Done & Close'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
