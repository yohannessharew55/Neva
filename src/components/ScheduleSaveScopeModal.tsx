import React, { useState } from 'react';
import { X, Check, Calendar, RotateCcw, Copy, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { soundEngine } from '../utils/audio';

export type ScheduleSaveScope = 'this_day_only' | 'all_days' | 'chosen_days';

interface ScheduleSaveScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  itemDescription?: string;
  sourceDate: Date;
  onConfirm: (scope: ScheduleSaveScope, targetDates: string[]) => void;
}

export const ScheduleSaveScopeModal: React.FC<ScheduleSaveScopeModalProps> = ({
  isOpen,
  onClose,
  title,
  itemDescription,
  sourceDate,
  onConfirm,
}) => {
  const { language } = useLivotion();
  const [viewMode, setViewMode] = useState<'options' | 'picker'>('options');
  const [targetDates, setTargetDates] = useState<string[]>([]);

  if (!isOpen) return null;

  const dayName = sourceDate.toLocaleDateString('en-US', { weekday: 'short' });
  const formattedDate = sourceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const sourceDateStr = `${sourceDate.getFullYear()}-${String(sourceDate.getMonth() + 1).padStart(2, '0')}-${String(sourceDate.getDate()).padStart(2, '0')}`;

  // Generate 21 upcoming days from the source date for the day picker
  const upcomingDays: { dateStr: string; dayName: string; formatted: string; isWeekend: boolean }[] = [];
  for (let i = 0; i <= 21; i++) {
    const nd = new Date(sourceDate);
    nd.setDate(sourceDate.getDate() + i);
    const dateStr = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`;
    const dName = nd.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = nd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isWeekend = nd.getDay() === 0 || nd.getDay() === 6;
    upcomingDays.push({ dateStr, dayName: dName, formatted, isWeekend });
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

  const selectAllWeekends = () => {
    const weekends = upcomingDays.filter((d) => d.isWeekend).map((d) => d.dateStr);
    setTargetDates(weekends);
  };

  const selectNext14Days = () => {
    setTargetDates(upcomingDays.slice(0, 14).map((d) => d.dateStr));
  };

  const clearAll = () => {
    setTargetDates([]);
  };

  const handleSelectThisDay = () => {
    onConfirm('this_day_only', [sourceDateStr]);
    try { soundEngine.playPencil(); } catch {}
    onClose();
  };

  const handleSelectAllDays = () => {
    onConfirm('all_days', [sourceDateStr]);
    try { soundEngine.playPencil(); } catch {}
    onClose();
  };

  const handleConfirmChosenDays = () => {
    if (targetDates.length === 0) return;
    onConfirm('chosen_days', targetDates);
    try { soundEngine.playPencil(); } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{viewMode === 'picker' ? '📋' : '💾'}</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {title || (language === 'am' ? 'የጊዜ ሰሌዳ ለውጦችን አስቀምጥ' : 'Save Schedule Changes')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {itemDescription || (language === 'am'
                ? `ለውጥ የተደረገበት ቀን፡ ${dayName}, ${formattedDate}`
                : `Editing schedule for ${dayName}, ${formattedDate}`)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* VIEW 1: Main 3 Scope Options */}
        {viewMode === 'options' ? (
          <div className="space-y-3 overflow-y-auto pr-1">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {language === 'am'
                ? 'ይህ ለውጥ የት እንዲተገበር ይፈልጋሉ?'
                : 'How would you like to apply this change?'}
            </div>

            {/* Option 1: This Specific Day Only (Recommended) */}
            <button
              type="button"
              onClick={handleSelectThisDay}
              className="w-full p-3.5 rounded-2xl border-2 border-[#0082ff]/40 hover:border-[#0082ff] bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-left transition cursor-pointer flex items-start gap-3 group shadow-2xs active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0082ff] text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-sm">
                📅
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm text-blue-950 dark:text-blue-100 group-hover:text-[#0082ff] transition">
                    {language === 'am' ? 'ለዚህ ቀን ብቻ (ተለይቶ ይቀመጣል)' : 'This Specific Day Only'}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-200 font-bold">
                    {language === 'am' ? 'የሚመከር' : 'Recommended'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-900/80 dark:text-blue-200/80 mt-1 leading-snug">
                  {language === 'am'
                    ? `ለውጡ ለ${dayName} (${formattedDate}) ብቻ ይተገበራል። ሌሎች ቀናት በመደበኛ ነባሪ ዕቅዳቸው ይቀጥላሉ።`
                    : `Apply strictly to ${dayName} (${formattedDate}). Other days remain on their default routine.`}
                </p>
              </div>
            </button>

            {/* Option 2: For Whole Days / All Days (Recurring Default Template) */}
            <button
              type="button"
              onClick={handleSelectAllDays}
              className="w-full p-3.5 rounded-2xl border-2 border-purple-500/30 hover:border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-left transition cursor-pointer flex items-start gap-3 group shadow-2xs active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-sm">
                🔄
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm text-purple-950 dark:text-purple-100 group-hover:text-purple-600 transition">
                    {language === 'am' ? 'ለሁሉም ቀናት (ነባሪ የጊዜ ሰሌዳ)' : 'For Whole Days / All Days'}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-800 dark:text-purple-200 font-bold">
                    {language === 'am' ? 'ነባሪ' : 'Default Template'}
                  </span>
                </div>
                <p className="text-[11px] text-purple-900/80 dark:text-purple-200/80 mt-1 leading-snug">
                  {language === 'am'
                    ? `መደበኛ ነባሪውን የጊዜ ሰሌዳ ያሻሽላል፤ በዚህም በወሩ ውስጥ ባሉ ሁሉም ${dayName} ቀናት ላይ ይታያል።`
                    : `Update the recurring default schedule so this block/task appears on all ${dayName}s throughout the calendar.`}
                </p>
              </div>
            </button>

            {/* Option 3: Choose Set Amount of Chosen Days */}
            <button
              type="button"
              onClick={() => {
                if (targetDates.length === 0) {
                  setTargetDates([sourceDateStr]);
                }
                setViewMode('picker');
              }}
              className="w-full p-3.5 rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-left transition cursor-pointer flex items-start gap-3 group shadow-2xs active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-sm">
                📋
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 group-hover:text-emerald-600 transition">
                    {language === 'am' ? 'የተመረጡ ቀናትን ምረጥ...' : 'Choose Specific Days...'}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold">
                    {language === 'am' ? 'ብጁ ምርጫ' : 'Custom Days'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/80 dark:text-emerald-200/80 mt-1 leading-snug">
                  {language === 'am'
                    ? 'በካላንደሩ ላይ ያሉ የተወሰኑ ቀናትን (ሰኞ፣ ረቡዕ፣ አርብ ወዘተ) በመምረጥ ይህንን ብሎክ ይተግብሩ።'
                    : 'Select a custom set of dates from the calendar to apply these blocks to.'}
                </p>
              </div>
            </button>
          </div>
        ) : (
          /* VIEW 2: Interactive Day Picker */
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            {/* Quick Select Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold shrink-0">
              <span className="text-[11px] text-slate-400 mr-1">
                {language === 'am' ? 'ፈጣን ምርጫ፡' : 'Quick select:'}
              </span>
              <button
                type="button"
                onClick={selectAllWeekdays}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#0082ff] transition cursor-pointer text-[11px]"
              >
                {language === 'am' ? 'የስራ ቀናት (Mon-Fri)' : 'Weekdays (Mon-Fri)'}
              </button>
              <button
                type="button"
                onClick={selectAllWeekends}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#0082ff] transition cursor-pointer text-[11px]"
              >
                {language === 'am' ? 'የሳምንት መጨረሻ' : 'Weekends'}
              </button>
              <button
                type="button"
                onClick={selectNext14Days}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-[#0082ff] transition cursor-pointer text-[11px]"
              >
                {language === 'am' ? 'ቀጣይ 14 ቀናት' : 'Next 14 Days'}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="px-2 py-1 rounded-xl text-slate-400 hover:text-rose-500 transition cursor-pointer text-[11px] ml-auto"
              >
                {language === 'am' ? 'አጽዳ' : 'Clear'}
              </button>
            </div>

            {/* Date Selection Grid */}
            <div className="overflow-y-auto flex-1 max-h-[300px] pr-1 space-y-1.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {upcomingDays.map((d) => {
                  const isSelected = targetDates.includes(d.dateStr);
                  const isSource = d.dateStr === sourceDateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => toggleDate(d.dateStr)}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/60 border-[#0082ff] ring-1 ring-[#0082ff] shadow-2xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black ${isSelected ? 'text-[#0082ff]' : 'text-slate-800 dark:text-slate-200'}`}>
                            {d.dayName}
                          </span>
                          {isSource && (
                            <span className="text-[9px] px-1 py-0.2 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
                              {language === 'am' ? 'ዋና' : 'Current'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                          {d.formatted}
                        </span>
                      </div>

                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-[#0082ff] border-[#0082ff] text-white shadow-2xs'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions for Picker View */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('options')}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                <span>{language === 'am' ? 'ወደ ኋላ' : 'Back to Options'}</span>
              </button>

              <button
                type="button"
                disabled={targetDates.length === 0}
                onClick={handleConfirmChosenDays}
                className="px-4 py-2.5 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-2"
              >
                <Check size={14} strokeWidth={3} />
                <span>
                  {language === 'am'
                    ? `ለ${targetDates.length} የተመረጡ ቀናት ተግብር`
                    : `Apply to ${targetDates.length} Chosen Days`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        {viewMode === 'options' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
            <span className="text-[11px] text-slate-400">
              {language === 'am'
                ? 'የቀኑ ሰሌዳዎች ራሳቸውን ችለው ሊስተካከሉ ይችላሉ።'
                : 'Day blocks can be edited independently without altering other days.'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
            >
              {language === 'am' ? 'ተው' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
