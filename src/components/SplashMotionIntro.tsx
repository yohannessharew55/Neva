import React, { useState, useEffect } from 'react';

interface SplashMotionIntroProps {
  onComplete?: () => void;
  minDurationMs?: number; // default 5900ms (extended by another +2.0s per user request)
}

export const SplashMotionIntro: React.FC<SplashMotionIntroProps> = ({
  onComplete,
  minDurationMs = 5900
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(true);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [animationStep, setAnimationStep] = useState<number>(0);

  // Listen for replay requests (e.g. from navbar logo or settings)
  useEffect(() => {
    const handleReplay = () => {
      setIsMounted(true);
      setIsExiting(false);
      setAnimationStep(0);
    };
    window.addEventListener('neva-replay-splash', handleReplay);
    return () => window.removeEventListener('neva-replay-splash', handleReplay);
  }, []);

  // Choreographed Staggered Animation Sequence (smoothly paced across the extended duration)
  useEffect(() => {
    if (!isMounted || isExiting) return;

    // Step 1: Icon container scales in (200ms)
    const t1 = setTimeout(() => setAnimationStep(1), 200);
    // Step 2: N E V A Letters expand (950ms)
    const t2 = setTimeout(() => setAnimationStep(2), 950);
    // Step 3: Subtitle and laser beam illuminate (1650ms)
    const t3 = setTimeout(() => setAnimationStep(3), 1650);
    // Step 4: Begin smooth dissolve & scale exit (minDurationMs: 5900ms)
    const t4 = setTimeout(() => {
      setIsExiting(true);
    }, minDurationMs);
    // Step 5: Clean unmount after transition completes
    const t5 = setTimeout(() => {
      setIsMounted(false);
      onComplete?.();
    }, minDurationMs + 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isMounted, isExiting, minDurationMs, onComplete]);

  // Handle immediate tap to launch/skip
  const handleImmediateSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsMounted(false);
      onComplete?.();
    }, 280);
  };

  // Keyboard accessibility (Esc, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleImmediateSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isMounted) return null;

  return (
    <div
      onClick={handleImmediateSkip}
      className={`fixed inset-0 z-[99999] h-[100dvh] w-screen flex flex-col items-center justify-center select-none overflow-hidden touch-none cursor-pointer bg-[#faf9f6] dark:bg-[#0b0f17] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none blur-xs'
          : 'opacity-100 scale-100'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Soft Ambient Radial Energy Glow */}
      <div className="absolute w-[360px] h-[360px] sm:w-[540px] sm:h-[540px] rounded-full bg-[#0082ff] opacity-10 dark:opacity-20 blur-[110px] animate-neva-glow pointer-events-none" />

      {/* Orbiting Precision Geometry Rings */}
      <div className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] pointer-events-none opacity-40 dark:opacity-25">
        <svg viewBox="0 0 400 400" className="w-full h-full animate-neva-orbit">
          <circle
            cx="200"
            cy="200"
            r="160"
            fill="none"
            stroke="#0082ff"
            strokeWidth="1.2"
            strokeDasharray="4 8"
            opacity="0.35"
          />
          <circle
            cx="200"
            cy="200"
            r="190"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.8"
            strokeDasharray="3 14"
            opacity="0.45"
          />
          {/* Subtle orbiting light points */}
          <circle cx="200" cy="40" r="3.5" fill="#0082ff" />
          <circle cx="360" cy="200" r="3" fill="#38bdf8" />
        </svg>
      </div>

      {/* Center Motion Graphic Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 sm:space-y-7">
        
        {/* Animated App Icon Container */}
        <div
          className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#0082ff] via-[#0070df] to-[#0055d4] p-[1.5px] shadow-[0_14px_45px_rgba(0,130,255,0.35)] dark:shadow-[0_14px_45px_rgba(0,130,255,0.55)] ring-1 ring-black/5 dark:ring-white/20 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            animationStep >= 1
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-50 translate-y-6'
          }`}
        >
          {/* Glass Specular Core */}
          <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-white/25 via-transparent to-black/20 flex items-center justify-center relative overflow-hidden">
            
            {/* Dynamic Glass Light Sheen */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-neva-sheen pointer-events-none" />

            {/* Crisp Bold Letter 'N' Brand Glyph */}
            <span className="font-black text-3xl sm:text-4xl text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] select-none">
              N
            </span>
          </div>
        </div>

        {/* Wordmark: N E V A with Staggered Kinetic Letter Expansion */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center justify-center overflow-hidden h-10 sm:h-12">
            {['N', 'E', 'V', 'A'].map((letter, idx) => (
              <span
                key={letter}
                className={`inline-block font-black text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-[0.45em] sm:tracking-[0.6em] uppercase transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  animationStep >= 2
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-8 scale-90'
                }`}
                style={{
                  transitionDelay: `${idx * 70 + 80}ms`,
                  marginLeft: idx === 0 ? '0.35em' : '0' // optical tracking compensation
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Subtitle Horizon */}
          <div
            className={`transition-all duration-700 ease-out ${
              animationStep >= 3
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.45em] uppercase text-[#0082ff] font-mono">
              Execution Cockpit
            </span>
          </div>
        </div>

        {/* Sleek Laser Loading Accent Beam */}
        <div
          className={`w-32 sm:w-44 h-[2px] bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden transition-opacity duration-500 ${
            animationStep >= 2 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="h-full bg-gradient-to-r from-transparent via-[#0082ff] to-[#38bdf8] rounded-full animate-neva-laser" />
        </div>
      </div>

      {/* Top-Right Skip Indicator (Safe Area Aware for iPhone Notch/Island) */}
      <div 
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20"
        style={{
          marginTop: 'env(safe-area-inset-top, 0px)',
          marginRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <button
          type="button"
          onClick={handleImmediateSkip}
          className="px-3 py-1 rounded-full bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200/80 dark:border-white/10 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition cursor-pointer backdrop-blur-md"
        >
          Skip ✕
        </button>
      </div>

      {/* Bottom Hint */}
      <div
        className="absolute bottom-6 sm:bottom-8 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider"
        style={{
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <span>Tap anywhere to launch</span>
      </div>
    </div>
  );
};
