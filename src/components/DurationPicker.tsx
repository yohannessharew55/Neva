import React, { useState, useEffect, useRef } from 'react';
import { useLivotion } from '../context/LivotionContext';
import { formatTaskDuration } from '../utils/formatDuration';
import { Edit2, List, Check } from 'lucide-react';

export const STANDARD_DURATION_PRESETS = [
  10, 15, 20, 25, 30, 45, 50, 60, 75, 90, 120, 150, 180
];

interface DurationPickerProps {
  value: number; // in minutes
  onChange: (durationMin: number) => void;
  className?: string;
  size?: 'sm' | 'xs' | 'md';
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
  className = '',
  size = 'sm',
}) => {
  const { language } = useLivotion();
  const [isCustom, setIsCustom] = useState(() => !STANDARD_DURATION_PRESETS.includes(value));
  const [customInputValue, setCustomInputValue] = useState<string>(String(value || 30));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomInputValue(String(value || 30));
  }, [value]);

  useEffect(() => {
    if (isCustom && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isCustom]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      onChange(Number(val));
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInputValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      onChange(Math.min(num, 1440));
    }
  };

  const handleCustomInputBlur = () => {
    const num = parseInt(customInputValue, 10);
    if (isNaN(num) || num <= 0) {
      setCustomInputValue('30');
      onChange(30);
    } else {
      const clamped = Math.min(Math.max(1, num), 1440);
      setCustomInputValue(String(clamped));
      onChange(clamped);
    }
  };

  const textSize = size === 'xs' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-[11px]';
  const pySize = size === 'xs' ? 'py-0.5' : size === 'md' ? 'py-2' : 'py-1';
  const pxSize = size === 'xs' ? 'px-1.5' : size === 'md' ? 'px-3' : 'px-2';

  if (isCustom) {
    return (
      <div 
        className={`inline-flex items-center justify-between gap-1.5 bg-slate-50 dark:bg-slate-800 border-2 border-[#0082ff] rounded-xl ${pxSize} ${pySize} shadow-xs transition ${className}`}
        title={language === 'am' ? 'ብጁ ደቂቃ ያስገቡ' : 'Enter custom duration in minutes'}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            ref={inputRef}
            type="number"
            min="1"
            max="1440"
            value={customInputValue}
            onChange={handleCustomInputChange}
            onBlur={handleCustomInputBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomInputBlur();
              }
            }}
            className={`w-12 sm:w-16 bg-transparent ${textSize} font-mono font-black outline-none text-left text-slate-900 dark:text-white`}
            placeholder="min"
          />
          <span className="text-[11px] font-mono font-bold opacity-60 text-slate-700 dark:text-slate-300">min</span>
          <span className="text-[10px] font-mono font-extrabold text-[#0082ff] px-2 py-0.5 rounded-md bg-blue-500/15 shrink-0">
            {formatTaskDuration(value)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            if (!STANDARD_DURATION_PRESETS.includes(value)) {
              onChange(45);
            }
          }}
          className="p-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-[#0082ff] hover:text-white text-slate-500 dark:text-slate-400 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
          title={language === 'am' ? 'ነባሪ አማራጮች' : 'Switch back to preset list'}
        >
          <List size={12} />
          <span className="hidden sm:inline">{language === 'am' ? 'ነባሪ' : 'Presets'}</span>
        </button>
      </div>
    );
  }

  const isPresetValue = STANDARD_DURATION_PRESETS.includes(value);

  return (
    <div className={`inline-flex items-center justify-between gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl ${pxSize} ${pySize} ${className}`}>
      <select
        value={isPresetValue ? value : 'custom'}
        onChange={handleSelectChange}
        className={`bg-transparent flex-1 ${textSize} font-semibold outline-none cursor-pointer text-slate-800 dark:text-slate-200`}
      >
        {!isPresetValue && (
          <option value={value} className="text-black dark:text-white font-mono">
            {formatTaskDuration(value)} ({language === 'am' ? 'ብጁ ጊዜ' : 'Custom Time'})
          </option>
        )}
        <option value={10} className="text-black">10 min</option>
        <option value={15} className="text-black">15 min</option>
        <option value={20} className="text-black">20 min</option>
        <option value={25} className="text-black">25 min (Pomodoro)</option>
        <option value={30} className="text-black">30 min</option>
        <option value={45} className="text-black">45 min (Standard)</option>
        <option value={50} className="text-black">50 min</option>
        <option value={60} className="text-black">60 min (1 Hour)</option>
        <option value={75} className="text-black">75 min (1.15h)</option>
        <option value={90} className="text-black">90 min (Deep Work)</option>
        <option value={120} className="text-black">120 min (2 Hours)</option>
        <option value={150} className="text-black">150 min (2.5 Hours)</option>
        <option value={180} className="text-black">180 min (3 Hours)</option>
        <option value="custom" className="text-[#0082ff] font-bold">
          ✏️ {language === 'am' ? 'ብጁ ጊዜ (Custom Time)...' : 'Custom Time...'}
        </option>
      </select>
      <button
        type="button"
        onClick={() => setIsCustom(true)}
        className="p-1 rounded-md opacity-50 hover:opacity-100 hover:text-[#0082ff] transition cursor-pointer"
        title={language === 'am' ? 'ብጁ ጊዜ ያስገቡ' : 'Add custom time'}
      >
        <Edit2 size={12} />
      </button>
    </div>
  );
};
