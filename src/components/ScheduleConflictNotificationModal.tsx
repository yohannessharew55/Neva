import React from 'react';
import { AlertTriangle, Clock, Moon, Sparkles, Check, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { ScheduleConflictResult } from '../utils/scheduleConflictDetector';
import { formatTaskDuration } from '../utils/formatDuration';
import { soundEngine } from '../utils/audio';

interface ScheduleConflictNotificationModalProps {
  conflict: ScheduleConflictResult | null;
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestedTime?: (time: string) => void;
}

export const ScheduleConflictNotificationModal: React.FC<ScheduleConflictNotificationModalProps> = ({
  conflict,
  isOpen,
  onClose,
  onApplySuggestedTime,
}) => {
  if (!isOpen || !conflict || !conflict.hasConflict) return null;

  const handleApply = () => {
    try { soundEngine.playPencil(); } catch {}
    if (conflict.suggestedOpening && onApplySuggestedTime) {
      onApplySuggestedTime(conflict.suggestedOpening.startTime);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#141928] border border-amber-200 dark:border-amber-900/60 p-5 sm:p-6 shadow-2xl space-y-4 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Alert Icon & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                Time Conflict
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Slot Already Scheduled
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conflict Description Box */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-2">
          <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
            The time slot <strong className="font-bold underline">{conflict.proposedWindow.start} – {conflict.proposedWindow.end}</strong> is already occupied by{' '}
            <strong className="font-bold">"{conflict.conflictingTask?.title}"</strong> ({conflict.occupiedWindow?.start} – {conflict.occupiedWindow?.end}).
          </p>
          <div className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-300/80 flex items-center gap-1.5 pt-0.5">
            <ShieldAlert size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>To maintain clean deep work blocks, scheduled sessions cannot overlap.</span>
          </div>
        </div>

        {/* Triple 8 Budget & Sleep Protection Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Pillar Remaining Budget (Career or Hobby) */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1a2236] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {conflict.pillarTitle} Balance Today
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-[#0082ff] font-mono">
                {conflict.pillarRemainingHours}h
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                / {conflict.pillarTotalTarget}h cap
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
              {conflict.pillarRemainingHours > 0 
                ? `${conflict.pillarRemainingHours}h unallocated capacity available today.`
                : `Fully allocated for today.`}
            </p>
          </div>

          {/* Dedicated Sleep Protection */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1">
            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Moon size={11} /> Dedicated Sleep
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                8.0h
              </span>
              <span className="text-[10px] text-indigo-400/80 font-semibold">
                Protected
              </span>
            </div>
            <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 font-medium leading-tight">
              Sleep is dedicated and strictly guarded in your Triple 8 balance.
            </p>
          </div>
        </div>

        {/* Suggested Next Free Opening */}
        {conflict.suggestedOpening && (
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0082ff] flex items-center gap-1">
                <Sparkles size={11} /> Next Available Opening
              </span>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                {conflict.suggestedOpening.startTime} (open for {formatTaskDuration(conflict.suggestedOpening.availableMinutes)})
              </p>
            </div>
            {onApplySuggestedTime && (
              <button
                type="button"
                onClick={handleApply}
                className="px-3.5 py-1.5 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>Use {conflict.suggestedOpening.startTime}</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Adjust Schedule Time
          </button>
        </div>
      </div>
    </div>
  );
};
