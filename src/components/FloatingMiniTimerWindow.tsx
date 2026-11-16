import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  X,
  Clock,
  Tv,
  Maximize2,
  Minimize2,
  GripHorizontal,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { mobileTimerEngine, MobileTimerState } from '../utils/mobileTimerEngine';
import { useLivotion } from '../context/LivotionContext';

export const FloatingMiniTimerWindow: React.FC = () => {
  const { activeTab, setActiveTab, language } = useLivotion();
  const [timerState, setTimerState] = useState<MobileTimerState>(() => mobileTimerEngine.getState());

  // Window position for floating card mode
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('neva_floating_timer_pos_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return { x: Math.max(12, Math.floor((window.innerWidth - 272) / 2)), y: 48 };
    }
    return { x: typeof window !== 'undefined' ? window.innerWidth - 290 : 20, y: 30 };
  });

  // Minimized Pill position (freely draggable anywhere on screen)
  const [minimizedPos, setMinimizedPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('neva_minimized_timer_pos_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch (e) {}
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return { x: Math.max(8, Math.floor((window.innerWidth - 280) / 2)), y: 12 };
    }
    return { x: typeof window !== 'undefined' ? Math.max(10, Math.floor((window.innerWidth - 320) / 2)) : 30, y: 14 };
  });

  // Drag tracking refs for Floating Card
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedRef = useRef(false);

  // Drag tracking refs for Minimized Pill
  const isDraggingMiniRef = useRef(false);
  const dragStartMiniRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedMiniRef = useRef(false);

  useEffect(() => {
    const unsubscribe = mobileTimerEngine.subscribe((state) => {
      setTimerState(state);
    });
    return unsubscribe;
  }, []);

  // Save floating position whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem('neva_floating_timer_pos_v1', JSON.stringify(position));
    } catch (e) {}
  }, [position]);

  // Save minimized position whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem('neva_minimized_timer_pos_v1', JSON.stringify(minimizedPos));
    } catch (e) {}
  }, [minimizedPos]);

  // If no timer is active or mode is 'hidden', don't render anything
  if (!timerState.isActive || timerState.windowMode === 'hidden') {
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

  // Calculate countdown progress percentage
  const progressPercent =
    !isStopwatch && timerState.totalDurationSeconds > 0
      ? Math.min(100, Math.max(0, Math.round((1 - timerState.secondsRemaining / timerState.totalDurationSeconds) * 100)))
      : 0;

  const handleTogglePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (timerState.isRunning) {
      mobileTimerEngine.pause();
    } else {
      mobileTimerEngine.resume();
    }
  };

  const handleStop = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    mobileTimerEngine.stop();
  };

  const handleTogglePiP = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    await mobileTimerEngine.togglePictureInPicture();
  };

  const handleExpandToPractice = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setActiveTab('practice');
  };

  const handleSwitchToFloating = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    mobileTimerEngine.setWindowMode('floating');
  };

  const handleSwitchToIsland = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    mobileTimerEngine.setWindowMode('island');
  };

  // ----------------------------------------------------------------------------------
  // Drag handlers for the floating little window card
  // ----------------------------------------------------------------------------------
  const handleDragStart = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - dragStartRef.current.startX;
    const deltaY = clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }

    const windowWidth = 272;
    const windowHeight = 140;
    const maxX = Math.max(0, window.innerWidth - windowWidth - 10);
    const maxY = Math.max(0, window.innerHeight - windowHeight - 10);

    const newX = Math.min(maxX, Math.max(10, dragStartRef.current.initialX + deltaX));
    const newY = Math.min(maxY, Math.max(10, dragStartRef.current.initialY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      handleDragStart(e.clientX, e.clientY);

      const onMouseMove = (ev: MouseEvent) => {
        handleDragMove(ev.clientX, ev.clientY);
      };

      const onMouseUp = () => {
        handleDragEnd();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  // ----------------------------------------------------------------------------------
  // Drag handlers for the MINIMIZED pill (Draggable Minimized Mode)
  // ----------------------------------------------------------------------------------
  const handleMiniDragStart = (clientX: number, clientY: number) => {
    isDraggingMiniRef.current = true;
    hasMovedMiniRef.current = false;
    dragStartMiniRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: minimizedPos.x,
      initialY: minimizedPos.y,
    };
  };

  const handleMiniDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingMiniRef.current) return;
    const deltaX = clientX - dragStartMiniRef.current.startX;
    const deltaY = clientY - dragStartMiniRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedMiniRef.current = true;
    }

    const pillWidth = 280;
    const pillHeight = 44;
    const maxX = Math.max(0, window.innerWidth - pillWidth - 8);
    const maxY = Math.max(0, window.innerHeight - pillHeight - 12);

    const newX = Math.min(maxX, Math.max(8, dragStartMiniRef.current.initialX + deltaX));
    const newY = Math.min(maxY, Math.max(8, dragStartMiniRef.current.initialY + deltaY));

    setMinimizedPos({ x: newX, y: newY });
  };

  const handleMiniDragEnd = () => {
    isDraggingMiniRef.current = false;
  };

  const onMiniTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMiniDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onMiniTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMiniDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onMiniMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      handleMiniDragStart(e.clientX, e.clientY);

      const onMouseMove = (ev: MouseEvent) => {
        handleMiniDragMove(ev.clientX, ev.clientY);
      };

      const onMouseUp = () => {
        handleMiniDragEnd();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  const handleMiniPillClick = (e: React.MouseEvent) => {
    // If the user was dragging the pill, do not trigger the expand click
    if (hasMovedMiniRef.current) {
      return;
    }
    handleSwitchToFloating(e);
  };

  // System Badge Label
  const getSystemLabel = () => {
    if (isStopwatch) {
      return language === 'am' ? 'ክፍት ቆጣሪ' : 'STOPWATCH';
    }
    if (timerState.system === 'bible-reading') {
      return language === 'am' ? 'የመጽሐፍ ቅዱስ ንባብ' : 'BIBLE IMMERSION';
    }
    if (timerState.system === 'silence') {
      return language === 'am' ? 'የፀጥታ ጸሎት' : 'CONTEMPLATIVE SILENCE';
    }
    if (timerState.system === 'category-block') {
      return language === 'am' ? 'ብሎክ ትኩረት' : 'CATEGORY BLOCK';
    }
    if (timerState.system === 'task') {
      return language === 'am' ? 'ዕለታዊ ተግባር' : 'TASK FOCUS';
    }
    return `${timerState.system.toUpperCase()} • ${timerState.phase.toUpperCase()}`;
  };

  // ----------------------------------------------------------------------------------
  // MODE A: FLOATING LITTLE WINDOW (Draggable Mini Card on top of everything)
  // ----------------------------------------------------------------------------------
  if (timerState.windowMode === 'floating') {
    return (
      <div
        id="neva-floating-timer-window"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          touchAction: 'none',
        }}
        className="w-[272px] sm:w-[288px] rounded-3xl bg-slate-950/95 text-white shadow-2xl border border-white/20 backdrop-blur-xl transition-shadow select-none group animate-fadeIn"
      >
        {/* Top Header & Drag Handle */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={onMouseDown}
          className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing border-b border-white/10"
        >
          {/* Status Indicator & Label */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                timerState.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase truncate">
              {getSystemLabel()}
            </span>
          </div>

          {/* Grip Icon & Window Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="text-white/30 px-1 py-0.5" title="Drag to reposition">
              <GripHorizontal size={14} />
            </div>

            {/* Minimize to Draggable Island Pill */}
            <button
              type="button"
              onClick={handleSwitchToIsland}
              className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              title={language === 'am' ? 'ወደ ትንሽ ተንሳፋፊ አይላንድ ቀንስ' : 'Minimize to Draggable Pill'}
            >
              <Minimize2 size={11} />
            </button>

            {/* Close / Stop */}
            <button
              type="button"
              onClick={handleStop}
              className="w-5 h-5 rounded-full hover:bg-rose-500/80 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              title={language === 'am' ? 'አቁም' : 'Stop & Close'}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Middle: Big Digital Time & Task Name */}
        <div className="px-4 py-2.5 text-center">
          <div className="flex items-baseline justify-center gap-1 font-mono font-black text-3xl sm:text-4xl tracking-tight text-white drop-shadow-sm">
            <span>{timeFormatted}</span>
            {isStopwatch ? (
              <span className="text-xs text-emerald-400/80 font-normal">SEC</span>
            ) : null}
          </div>

          {timerState.taskTitle ? (
            <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5 max-w-full px-1">
              {timerState.taskTitle}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              {timerState.category} • NEVA OS
            </p>
          )}

          {/* Progress Bar for countdown */}
          {!isStopwatch && timerState.totalDurationSeconds > 0 ? (
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          ) : null}
        </div>

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-white/5 rounded-b-3xl border-t border-white/5 gap-1.5">
          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition active:scale-95 cursor-pointer ${
              timerState.isRunning
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {timerState.isRunning ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
            <span>
              {timerState.isRunning
                ? language === 'am'
                  ? 'አቁም'
                  : 'Pause'
                : language === 'am'
                ? 'ቀጥል'
                : 'Resume'}
            </span>
          </button>

          {/* Popout Picture-in-Picture Button */}
          <button
            type="button"
            onClick={handleTogglePiP}
            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 text-[11px] font-bold transition active:scale-95 cursor-pointer ${
              timerState.isPipActive
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/20'
            }`}
            title={language === 'am' ? 'በስልክ/ኮምፒውተር ላይ ተንሳፋፊ መስኮት (PiP)' : 'Pop out OS Floating Window (Picture-in-Picture)'}
          >
            <Tv size={12} />
            <span>PiP</span>
          </button>

          {/* Expand to Full Page */}
          <button
            type="button"
            onClick={handleExpandToPractice}
            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            title={language === 'am' ? 'ሙሉ ገጽ ክፈት' : 'Open Full Screen Flow'}
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------
  // MODE B: DRAGGABLE MINIMIZED PILL (Freely Draggable Anywhere on Screen!)
  // ----------------------------------------------------------------------------------
  return (
    <div
      id="neva-dynamic-island-banner"
      style={{
        position: 'fixed',
        left: `${minimizedPos.x}px`,
        top: `${minimizedPos.y}px`,
        zIndex: 9999,
        touchAction: 'none',
      }}
      className="animate-fadeIn select-none"
    >
      <div
        onTouchStart={onMiniTouchStart}
        onTouchMove={onMiniTouchMove}
        onTouchEnd={handleMiniDragEnd}
        onMouseDown={onMiniMouseDown}
        onClick={handleMiniPillClick}
        className="flex items-center justify-between gap-2 sm:gap-2.5 px-3 py-1.5 sm:py-2 rounded-full bg-slate-900/95 dark:bg-black/95 text-white shadow-2xl border border-white/20 backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.99] cursor-grab active:cursor-grabbing group min-w-[250px] sm:min-w-[280px]"
      >
        {/* Left: Drag Grip & Animated Indicator */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="text-white/40 group-hover:text-white/70 transition shrink-0" title="Drag anywhere">
            <GripHorizontal size={13} />
          </div>

          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/10 shrink-0">
            {timerState.isRunning ? (
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            ) : null}
            <Clock size={13} className={timerState.isRunning ? 'text-emerald-400' : 'text-amber-400'} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 truncate max-w-[80px] sm:max-w-[100px]">
                {getSystemLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Digits */}
        <div className="font-mono font-black text-sm sm:text-base text-white tracking-tight shrink-0 px-1">
          {timeFormatted}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* PiP Popout */}
          <button
            type="button"
            onClick={handleTogglePiP}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
              timerState.isPipActive
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
            }`}
            title={language === 'am' ? 'ተንሳፋፊ መስኮት (PiP)' : 'Picture-in-Picture Popout'}
          >
            <Tv size={11} />
          </button>

          {/* Expand to Little Window Card */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSwitchToFloating();
            }}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-purple-600/80 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
            title={language === 'am' ? 'መስኮት ዘርጋ' : 'Expand to Card Window'}
          >
            <Maximize2 size={11} />
          </button>

          {/* Quick Play/Pause */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition active:scale-90 cursor-pointer"
            title={timerState.isRunning ? 'Pause' : 'Resume'}
          >
            {timerState.isRunning ? (
              <Pause size={11} className="fill-white" />
            ) : (
              <Play size={11} className="fill-white ml-0.5" />
            )}
          </button>

          {/* Quick Stop */}
          <button
            type="button"
            onClick={handleStop}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-rose-500/80 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-90 cursor-pointer"
            title="Stop Timer"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
