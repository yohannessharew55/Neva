import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  X,
  Tv,
  Maximize2,
  Minimize2,
  GripHorizontal,
  Palette,
} from 'lucide-react';
import { mobileTimerEngine, MobileTimerState } from '../utils/mobileTimerEngine';
import { useLivotion } from '../context/LivotionContext';

const QUICK_PALETTE = [
  { id: 'green', color: '#30d158', label: 'Emerald Green' },
  { id: 'orange', color: '#ff9f0a', label: 'iOS Orange' },
  { id: 'red', color: '#ff453a', label: 'Flame Red' },
  { id: 'purple', color: '#af52de', label: 'Sacred Violet' },
  { id: 'cyan', color: '#32ade6', label: 'Laser Cyan' },
  { id: 'indigo', color: '#5e5ce6', label: 'Sapphire Indigo' },
  { id: 'pink', color: '#ec4899', label: 'Rose Pink' },
  { id: 'mint', color: '#34d399', label: 'Restful Mint' },
];

const hexToRgba = (hex: string, alpha: number) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const FloatingMiniTimerWindow: React.FC = () => {
  const { activeTab, setActiveTab, language } = useLivotion();
  const [timerState, setTimerState] = useState<MobileTimerState>(() => mobileTimerEngine.getState());
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  // Capsule position on screen (freely draggable anywhere, safe from iPhone X notch)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('neva_ios_capsule_pos_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Prevent being stuck under the iPhone X notch (y < 64 on mobile)
          if (typeof window !== 'undefined' && window.innerWidth < 640 && parsed.y < 64) {
            parsed.y = 74;
          }
          return parsed;
        }
      }
    } catch (e) {}
    // Default position: centered, safely below the top notch on iPhone X / mobile
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return { x: Math.max(8, Math.floor((window.innerWidth - 325) / 2)), y: 74 };
    }
    return { x: typeof window !== 'undefined' ? Math.max(10, Math.floor((window.innerWidth - 340) / 2)) : 30, y: 30 };
  });

  // Presentation style: 'capsule' (exact iOS Live Activity) | 'expanded' (full card)
  const [viewStyle, setViewStyle] = useState<'capsule' | 'expanded'>(() => {
    try {
      const saved = localStorage.getItem('neva_timer_view_style_v1');
      if (saved === 'expanded' || saved === 'capsule') return saved;
    } catch (e) {}
    return 'capsule';
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = mobileTimerEngine.subscribe((state) => {
      setTimerState(state);
    });
    return unsubscribe;
  }, []);

  // Persist position
  useEffect(() => {
    try {
      localStorage.setItem('neva_ios_capsule_pos_v2', JSON.stringify(position));
    } catch (e) {}
  }, [position]);

  // Persist view style
  useEffect(() => {
    try {
      localStorage.setItem('neva_timer_view_style_v1', viewStyle);
    } catch (e) {}
  }, [viewStyle]);

  // Keep Dynamic Island capsule centered on window resize unless manually moved
  useEffect(() => {
    const handleResize = () => {
      try {
        if (!localStorage.getItem('neva_ios_capsule_pos_v2')) {
          const isMobile = window.innerWidth < 640;
          const width = viewStyle === 'expanded' ? 284 : 325;
          setPosition({
            x: Math.max(8, Math.floor((window.innerWidth - width) / 2)),
            y: isMobile ? 74 : 24,
          });
        }
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewStyle]);

  // If no timer is active or user is currently in the full practice/focus screen, do not render
  if (!timerState.isActive || timerState.windowMode === 'hidden' || activeTab === 'practice') {
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

  // Countdown progress percentage
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

  const handleOpenFullPractice = (e: React.MouseEvent | React.TouchEvent) => {
    if (hasMovedRef.current) return;
    e.stopPropagation();
    setActiveTab('practice');
  };

  // Drag listeners
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

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const capsuleWidth = viewStyle === 'expanded' ? 284 : 325;
    const capsuleHeight = viewStyle === 'expanded' ? 140 : 68;
    const minY = isMobile ? 64 : 20;
    const maxX = Math.max(0, window.innerWidth - capsuleWidth - 8);
    const maxY = Math.max(minY, window.innerHeight - capsuleHeight - (isMobile ? 80 : 16));

    const newX = Math.min(maxX, Math.max(8, dragStartRef.current.initialX + deltaX));
    const newY = Math.min(maxY, Math.max(minY, dragStartRef.current.initialY + deltaY));

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

  // Label text matching iOS Timer Live Activity
  const getTimerLabel = () => {
    if (isStopwatch) {
      return language === 'am' ? 'ክፍት ቆጣሪ' : 'Stopwatch';
    }
    if (timerState.system === 'bible-reading') {
      return language === 'am' ? 'ንባብ' : 'Bible';
    }
    if (timerState.system === 'silence') {
      return language === 'am' ? 'ጸሎት' : 'Devotion';
    }
    if (timerState.system === 'category-block') {
      return language === 'am' ? 'ብሎክ' : 'Focus';
    }
    return language === 'am' ? 'ቆጣሪ' : 'Timer';
  };

  // ----------------------------------------------------------------------------------
  // MODE: EXPANDED CARD (when user wants full details)
  // ----------------------------------------------------------------------------------
  const activeColor = timerState.themeColor || mobileTimerEngine.getThemeColor();

  if (viewStyle === 'expanded') {
    return (
      <div
        id="neva-floating-timer-window"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          touchAction: 'none',
          borderColor: hexToRgba(activeColor, 0.35),
          boxShadow: `0 16px 40px rgba(0,0,0,0.85), 0 0 24px ${hexToRgba(activeColor, 0.2)}`,
        }}
        className="w-[280px] sm:w-[296px] rounded-[30px] bg-black/95 text-white border backdrop-blur-2xl select-none group animate-fadeIn touch-manipulation"
      >
        {/* Header */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={onMouseDown}
          className="flex items-center justify-between px-4 pt-3 pb-1.5 cursor-grab active:cursor-grabbing border-b border-white/10"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                timerState.isRunning ? 'animate-pulse' : 'bg-slate-500'
              }`}
              style={timerState.isRunning ? { backgroundColor: activeColor } : {}}
            />
            <span
              className="text-[11px] font-mono font-bold tracking-wider uppercase truncate"
              style={{ color: activeColor }}
            >
              {getTimerLabel()} • {timerState.phase.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Color Palette Selector */}
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-7 h-7 rounded-full hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition cursor-pointer"
              title="Flex Color Theme"
            >
              <Palette size={13} style={{ color: activeColor }} />
            </button>

            <div className="text-white/40 px-0.5" title="Drag to reposition">
              <GripHorizontal size={14} />
            </div>

            <button
              type="button"
              onClick={() => setViewStyle('capsule')}
              className="w-7 h-7 rounded-full hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              title="Minimize to iOS Live Activity Pill"
            >
              <Minimize2 size={13} />
            </button>

            <button
              type="button"
              onClick={handleStop}
              className="w-7 h-7 rounded-full hover:bg-rose-500/80 active:bg-rose-600 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              title="Stop & Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Floating Quick Color Switcher Popover */}
        {showColorPicker && (
          <div className="px-3 py-2 bg-white/10 border-b border-white/10 flex items-center justify-between gap-1.5 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                mobileTimerEngine.setThemeColor('');
                setShowColorPicker(false);
              }}
              className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase transition ${
                !timerState.themeColor ? 'bg-white text-black' : 'text-slate-300 hover:text-white'
              }`}
            >
              Auto
            </button>
            <div className="flex items-center gap-1.5">
              {QUICK_PALETTE.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    mobileTimerEngine.setThemeColor(p.color);
                    setShowColorPicker(false);
                  }}
                  className="w-4 h-4 rounded-full border transition active:scale-90"
                  style={{
                    backgroundColor: p.color,
                    borderColor: activeColor === p.color ? '#ffffff' : 'transparent',
                    boxShadow: activeColor === p.color ? `0 0 6px ${p.color}` : 'none'
                  }}
                  title={p.label}
                />
              ))}
            </div>
          </div>
        )}

        {/* Big Digits */}
        <div
          onClick={handleOpenFullPractice}
          className="px-4 py-3 text-center cursor-pointer hover:opacity-95"
          title="Tap to open full Practice Flow"
        >
          <div
            className="flex items-baseline justify-center gap-1 font-mono font-bold text-4xl tracking-tight tabular-nums"
            style={{
              color: activeColor,
              textShadow: `0 2px 14px ${hexToRgba(activeColor, 0.45)}`
            }}
          >
            <span>{timeFormatted}</span>
          </div>

          {timerState.taskTitle ? (
            <p className="text-[11px] text-slate-300 font-medium truncate mt-1 max-w-full px-1">
              {timerState.taskTitle}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
              {timerState.category} • NEVA OS
            </p>
          )}

          {!isStopwatch && timerState.totalDurationSeconds > 0 ? (
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: activeColor
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 rounded-b-[30px] border-t border-white/5 gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              backgroundColor: hexToRgba(activeColor, 0.2),
              color: activeColor,
              borderColor: hexToRgba(activeColor, 0.45),
              boxShadow: `0 0 12px ${hexToRgba(activeColor, 0.25)}`
            }}
            className="flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            {timerState.isRunning ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
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

          <button
            type="button"
            onClick={handleTogglePiP}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-slate-200 border border-white/10 flex items-center gap-1.5 text-xs font-bold transition active:scale-95 cursor-pointer"
            title="Pop out Floating OS Window (Picture-in-Picture)"
          >
            <Tv size={13} />
            <span>PiP</span>
          </button>

          <button
            type="button"
            onClick={handleOpenFullPractice}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-slate-200 flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Open Full Screen Flow"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------
  // MODE: EXACT iOS LIVE ACTIVITY CAPSULE (Matching User Screenshots)
  // [ || ]  [ ✕ ]           Timer  29:51
  // ----------------------------------------------------------------------------------
  return (
    <div
      id="neva-dynamic-island-banner"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        touchAction: 'none',
      }}
      className="animate-fadeIn select-none touch-manipulation relative"
    >
      {/* Quick Color Switcher Floating Popover */}
      {showColorPicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-11 inset-x-0 mx-auto w-fit max-w-[95vw] px-3 py-1.5 rounded-full bg-black/95 border border-white/20 shadow-2xl backdrop-blur-2xl flex items-center gap-2 z-50 animate-fadeIn"
        >
          <button
            type="button"
            onClick={() => {
              mobileTimerEngine.setThemeColor('');
              setShowColorPicker(false);
            }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight uppercase transition ${
              !timerState.themeColor ? 'bg-white text-black' : 'text-slate-300 hover:text-white'
            }`}
            title="Auto sync color with clock & task"
          >
            Auto
          </button>
          <div className="flex items-center gap-1.5">
            {QUICK_PALETTE.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  mobileTimerEngine.setThemeColor(p.color);
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 rounded-full transition active:scale-90 border-2"
                style={{
                  backgroundColor: p.color,
                  borderColor: activeColor === p.color ? '#ffffff' : 'transparent',
                  boxShadow: activeColor === p.color ? `0 0 8px ${p.color}` : 'none',
                }}
                title={p.label}
              />
            ))}
          </div>
        </div>
      )}

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={onMouseDown}
        style={{
          borderColor: hexToRgba(activeColor, 0.45),
          boxShadow: `0 16px 40px rgba(0,0,0,0.85), 0 0 24px ${hexToRgba(activeColor, 0.25)}`,
        }}
        className="flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 rounded-full bg-black/95 text-white border backdrop-blur-2xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-grab active:cursor-grabbing group min-w-[320px] sm:min-w-[345px] h-[66px] sm:h-[70px]"
      >
        {/* Left Side: Circular Colored Pause/Play & Circular Dark Cancel Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Circular Button 1: Pause / Resume (Dynamic System/Task Theme) */}
          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              backgroundColor: hexToRgba(activeColor, 0.22),
              borderColor: hexToRgba(activeColor, 0.5),
              boxShadow: `0 0 14px ${hexToRgba(activeColor, 0.35)}`,
              color: activeColor,
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition active:scale-90 cursor-pointer touch-manipulation hover:opacity-90"
            title={timerState.isRunning ? 'Pause Timer' : 'Resume Timer'}
          >
            {timerState.isRunning ? (
              <Pause size={19} style={{ fill: activeColor, color: activeColor }} />
            ) : (
              <Play size={19} style={{ fill: activeColor, color: activeColor }} className="ml-0.5" />
            )}
          </button>

          {/* Circular Button 2: Cancel / Stop */}
          <button
            type="button"
            onClick={handleStop}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] active:bg-[#444447] text-white/95 border border-white/10 flex items-center justify-center transition active:scale-90 cursor-pointer touch-manipulation"
            title="Cancel & Reset Timer"
          >
            <X size={19} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Side: "Timer" Label + Flexible Digital Numbers */}
        <div
          onClick={handleOpenFullPractice}
          className="flex items-baseline justify-end flex-1 min-w-0 pr-1 cursor-pointer group-hover:opacity-95"
          title="Tap to view full session"
        >
          <span
            style={{
              color: activeColor,
              textShadow: `0 1px 8px ${hexToRgba(activeColor, 0.35)}`,
            }}
            className="text-sm sm:text-base font-semibold mr-2 tracking-tight select-none truncate"
          >
            {getTimerLabel()}
          </span>

          <span
            style={{
              color: activeColor,
              textShadow: `0 2px 14px ${hexToRgba(activeColor, 0.5)}`,
            }}
            className="font-mono font-bold text-3xl sm:text-[34px] tracking-tight tabular-nums select-none shrink-0"
          >
            {timeFormatted}
          </span>

          {/* Discreet secondary utility buttons (Palette, PiP & Expand) */}
          <div className="flex items-center gap-1 ml-2 opacity-75 hover:opacity-100 transition shrink-0">
            {/* Color Switcher Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="w-6 h-6 rounded-full hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition active:scale-90 cursor-pointer touch-manipulation"
              title="Flex Clock Color (Green, Orange, Red, Purple, Cyan, etc.)"
            >
              <Palette size={12} style={{ color: activeColor }} />
            </button>

            <button
              type="button"
              onClick={handleTogglePiP}
              style={
                timerState.isPipActive
                  ? {
                      backgroundColor: hexToRgba(activeColor, 0.3),
                      borderColor: hexToRgba(activeColor, 0.5),
                      color: activeColor,
                    }
                  : {}
              }
              className={`w-6 h-6 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer touch-manipulation ${
                timerState.isPipActive ? 'border' : 'hover:bg-white/20 text-slate-300'
              }`}
              title="Pop out Floating Picture-in-Picture window"
            >
              <Tv size={12} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewStyle('expanded');
              }}
              className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center text-slate-300 transition active:scale-90 cursor-pointer touch-manipulation"
              title="Expand Card"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
