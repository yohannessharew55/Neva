import React, { useEffect, useState } from 'react';
import { Play, Pause, X, ExternalLink, Clock } from 'lucide-react';
import { mobileTimerEngine, MobileTimerState } from '../utils/mobileTimerEngine';
import { useLivotion } from '../context/LivotionContext';

export const TopDynamicTimerBanner: React.FC = () => {
  const { activeTab, setActiveTab, language } = useLivotion();
  const [timerState, setTimerState] = useState<MobileTimerState>(() => mobileTimerEngine.getState());

  useEffect(() => {
    const unsubscribe = mobileTimerEngine.subscribe((state) => {
      setTimerState(state);
    });
    return unsubscribe;
  }, []);

  // Only show floating top banner if a timer/stopwatch is active AND user is not currently on the practice/focus tab
  if (!timerState.isActive || activeTab === 'practice') {
    return null;
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isStopwatch = timerState.mode === 'stopwatch';
  const displaySeconds = isStopwatch ? timerState.stopwatchSeconds : timerState.secondsRemaining;
  const timeFormatted = formatTime(displaySeconds);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerState.isRunning) {
      mobileTimerEngine.pause();
    } else {
      mobileTimerEngine.resume();
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    mobileTimerEngine.stop();
  };

  const handleBannerClick = () => {
    setActiveTab('practice');
  };

  return (
    <div className="fixed top-2 sm:top-3 inset-x-0 z-50 flex justify-center px-3 pointer-events-none animate-fadeIn">
      <div
        onClick={handleBannerClick}
        className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-black/95 text-white shadow-xl border border-white/15 backdrop-blur-md max-w-md w-full transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
      >
        {/* Left: Animated Icon + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/10 shrink-0">
            {timerState.isRunning ? (
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            ) : null}
            <Clock size={15} className={timerState.isRunning ? 'text-emerald-400' : 'text-amber-400'} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                {isStopwatch 
                  ? (language === 'am' ? 'ክፍት ቆጣሪ' : 'Stopwatch') 
                  : `${timerState.system.toUpperCase()} • ${timerState.phase.toUpperCase()}`}
              </span>
              {timerState.taskTitle ? (
                <span className="text-xs text-slate-300 font-medium truncate max-w-[130px] sm:max-w-[180px]">
                  • {timerState.taskTitle}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Digital Time Display + Quick Play/Pause & Stop */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono font-black text-sm sm:text-base text-white tracking-tight">
            {timeFormatted}
          </span>

          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition active:scale-90 cursor-pointer"
            title={timerState.isRunning ? 'Pause' : 'Resume'}
          >
            {timerState.isRunning ? <Pause size={12} className="fill-white" /> : <Play size={12} className="fill-white ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleStop}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-500/80 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-90 cursor-pointer"
            title="Stop Timer"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
