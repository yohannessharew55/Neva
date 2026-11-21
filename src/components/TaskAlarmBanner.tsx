import React, { useState, useEffect } from 'react';
import { Play, X, Bell, Clock, Sparkles } from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { TaskAlarmEventDetail } from '../utils/taskAlarmNotificationService';
import { formatTaskDuration } from '../utils/formatDuration';
import { soundEngine } from '../utils/audio';

export const TaskAlarmBanner: React.FC = () => {
  const { startTask, language } = useLivotion();
  const [activeAlarm, setActiveAlarm] = useState<TaskAlarmEventDetail | null>(null);

  useEffect(() => {
    const handleAlarmEvent = (e: CustomEvent<TaskAlarmEventDetail>) => {
      setActiveAlarm(e.detail);
    };

    window.addEventListener('neva-task-alarm-triggered' as any, handleAlarmEvent);
    return () => {
      window.removeEventListener('neva-task-alarm-triggered' as any, handleAlarmEvent);
    };
  }, []);

  if (!activeAlarm) return null;

  const handleStart = () => {
    try { soundEngine.playPencil(); } catch {}
    startTask({
      ...activeAlarm.task,
      durationMin: activeAlarm.task.durationMin || 30,
    });
    setActiveAlarm(null);
  };

  const handleDismiss = () => {
    setActiveAlarm(null);
  };

  return (
    <div className="fixed top-3 inset-x-3 sm:top-5 sm:inset-x-auto sm:right-6 sm:max-w-md z-[10001] animate-slideDown pointer-events-auto">
      <div className="rounded-3xl bg-slate-900/95 dark:bg-[#121626]/95 backdrop-blur-md text-white border border-indigo-500/40 p-4 shadow-2xl space-y-3 ring-1 ring-white/10">
        
        {/* Top: Category tag & Dismiss */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span 
              className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs"
              style={{ 
                backgroundColor: `${activeAlarm.categoryColor}30`, 
                color: activeAlarm.categoryColor,
                border: `1px solid ${activeAlarm.categoryColor}60`
              }}
            >
              <Bell size={11} className="animate-bounce" />
              <span>Time for {activeAlarm.categoryTitle}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {activeAlarm.formattedStartTime}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
            title="Dismiss alarm"
          >
            <X size={15} />
          </button>
        </div>

        {/* Task Details */}
        <div className="space-y-0.5">
          <h4 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
            {activeAlarm.task.title}
          </h4>
          <p className="text-xs text-slate-300/80 font-medium flex items-center gap-1.5">
            <Clock size={12} className="text-[#0082ff]" />
            <span>Scheduled block starting now ({formatTaskDuration(activeAlarm.task.durationMin || 30)})</span>
          </p>
        </div>

        {/* Action Button: Start Focus Block */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleStart}
            className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-[#0082ff] to-indigo-600 hover:from-[#0070df] hover:to-indigo-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Play size={13} fill="currentColor" />
            <span>{language === 'am' ? 'የትኩረት ብሎክ ጀምር' : 'Start Focus Block'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            {language === 'am' ? 'አቆይ' : 'Dismiss'}
          </button>
        </div>

      </div>
    </div>
  );
};
