import React, { useState } from 'react';
import { X, Check, Copy, Calendar, Sparkles } from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { soundEngine } from '../utils/audio';

interface ApplyDayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDateStr: string;
  sourceDayName: string;
  sourceTasksCount: number;
}

export const ApplyDayScheduleModal: React.FC<ApplyDayScheduleModalProps> = ({
  isOpen,
  onClose,
  sourceDateStr,
  sourceDayName,
  sourceTasksCount
}) => {
  const { language, applyDayScheduleToDates } = useLivotion();

  // Generate the next 14 calendar dates starting from tomorrow or source date
  const [targetDates, setTargetDates] = useState<string[]>([]);

  if (!isOpen) return null;

  const [y, m, d] = sourceDateStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);

  // Generate 14 upcoming days
  const upcomingDays: { dateStr: string; dayName: string; formatted: string; isWeekend: boolean }[] = [];
  for (let i = 1; i <= 14; i++) {
    const nd = new Date(baseDate);
    nd.setDate(baseDate.getDate() + i);
    const dateStr = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`;
    const dayName = nd.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = nd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isWeekend = nd.getDay() === 0 || nd.getDay() === 6;
    upcomingDays.push({ dateStr, dayName, formatted, isWeekend });
  }

  const toggleDate = (dateStr: string) => {
    setTargetDates((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
  };

  const selectAllWeekdays = () => {
    const weekdays = upcomingDays.filter((d) => !d.isWeekend).map((d) => d.dateStr);
    setTargetDates(weekdays);
  };

  const selectAllDays = () => {
    setTargetDates(upcomingDays.map((d) => d.dateStr));
  };

  const clearAll = () => {
    setTargetDates([]);
  };

  const handleApply = () => {
    if (targetDates.length === 0) return;
    applyDayScheduleToDates(sourceDateStr, targetDates);
    try { soundEngine.playPencil(); } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'am' ? 'የቀኑን ሰሌዳ ለሌሎች ቀናት ቅዳ' : 'Apply Schedule to Other Days'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'am'
                ? `የ${sourceDayName} (${sourceDateStr}) ${sourceTasksCount} ብሎኮችን ወደተመረጡት ቀናት እንደ ራሳቸው የተለየ ሰሌዳ ይቅዱ።`
                : `Copy ${sourceTasksCount} blocks from ${sourceDayName} (${sourceDateStr}) into selected dates as independent custom schedules.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Select Preset Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold shrink-0">
          <span className="text-[11px] text-slate-400 mr-1">
            {language === 'am' ? 'ፈጣን ምርጫ፡' : 'Quick select:'}
          </span>
          <button
            type="button"
            onClick={selectAllWeekdays}
            className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0082ff] border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 cursor-pointer transition text-[11px]"
          >
            {language === 'am' ? 'የስራ ቀናት (ሰኞ-አርብ)' : 'Weekdays Only'}
          </button>
          <button
            type="button"
            onClick={selectAllDays}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition text-[11px]"
          >
            {language === 'am' ? 'ሁሉንም 14 ቀናት' : 'All 14 Days'}
          </button>
          {targetDates.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition text-[11px]"
            >
              {language === 'am' ? 'አጽዳ' : 'Clear'}
            </button>
          )}
        </div>

        {/* Calendar Days Checkbox Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {upcomingDays.map((d) => {
              const isChecked = targetDates.includes(d.dateStr);
              return (
                <div
                  key={d.dateStr}
                  onClick={() => toggleDate(d.dateStr)}
                  className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-[#0082ff] ring-1 ring-[#0082ff]'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {d.dayName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {d.formatted}
                    </span>
                  </div>

                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                    isChecked
                      ? 'bg-[#0082ff] border-[#0082ff] text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs font-mono font-bold text-slate-500">
            {targetDates.length} {language === 'am' ? 'ቀናት ተመርጠዋል' : 'days selected'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              {language === 'am' ? 'ሰርዝ' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={targetDates.length === 0}
              onClick={handleApply}
              className="px-4 py-2 bg-[#0082ff] hover:bg-[#0070df] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
            >
              <Copy size={13} />
              <span>{language === 'am' ? 'ሰሌዳውን ይቅዱ' : `Apply to ${targetDates.length} Days`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
