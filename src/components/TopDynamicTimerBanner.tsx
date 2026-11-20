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
  const activeColor = timerState.themeColor || mobileTimerEngine.getThemeColor();

  const hexToRgba = (hex: string, alpha: number) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

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
        style={{
          borderColor: hexToRgba(activeColor, 0.4),
          boxShadow: `0 12px 36px rgba(0,0,0,0.85), 0 0 24px ${hexToRgba(activeColor, 0.25)}`,
        }}
        className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-black/95 text-white border backdrop-blur-md max-w-md w-full transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
      >
        {/* Left: Animated Icon + Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            style={{
              backgroundColor: hexToRgba(activeColor, 0.2),
              borderColor: hexToRgba(activeColor, 0.4),
            }}
            className="relative flex items-center justify-center w-7 h-7 rounded-full border shrink-0"
          >
            {timerState.isRunning ? (
              <span
                style={{ backgroundColor: hexToRgba(activeColor, 0.4) }}
                className="absolute inset-0 rounded-full animate-ping"
              />
            ) : null}
            <Clock size={15} style={{ color: activeColor }} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                style={{ color: activeColor }}
                className="text-[10px] font-mono font-bold uppercase tracking-wider"
              >
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
          <span
            style={{
              color: activeColor,
              textShadow: `0 2px 10px ${hexToRgba(activeColor, 0.4)}`,
            }}
            className="font-mono font-black text-sm sm:text-base tracking-tight"
          >
            {timeFormatted}
          </span>

          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              backgroundColor: hexToRgba(activeColor, 0.22),
              borderColor: hexToRgba(activeColor, 0.45),
              color: activeColor,
            }}
            className="w-7 h-7 rounded-full border flex items-center justify-center transition active:scale-90 cursor-pointer"
            title={timerState.isRunning ? 'Pause' : 'Resume'}
          >
            {timerState.isRunning ? (
              <Pause size={12} style={{ fill: activeColor, color: activeColor }} />
            ) : (
              <Play size={12} style={{ fill: activeColor, color: activeColor }} className="ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleStop}
            className="w-7 h-7 rounded-full bg-[#2c2c2e] hover:bg-rose-500/80 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
            title="Stop Timer"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
