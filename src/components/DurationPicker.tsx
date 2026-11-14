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
  size?: 'sm' | 'xs';
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

  const textSize = size === 'xs' ? 'text-[10px]' : 'text-[11px]';
  const pySize = size === 'xs' ? 'py-0.5' : 'py-1';
  const pxSize = size === 'xs' ? 'px-1.5' : 'px-2';

  if (isCustom) {
    return (
      <div 
        className={`inline-flex items-center gap-1 bg-white/95 dark:bg-black/60 border border-[#0082ff] rounded-xl ${pxSize} ${pySize} shadow-2xs transition ${className}`}
        title={language === 'am' ? 'ብጁ ደቂቃ ያስገቡ' : 'Enter custom duration in minutes'}
      >
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
          className={`w-9 sm:w-11 bg-transparent ${textSize} font-mono font-extrabold outline-none text-center text-slate-900 dark:text-white`}
          placeholder="min"
        />
        <span className="text-[10px] font-mono font-bold opacity-60 text-slate-700 dark:text-slate-300">m</span>
        <span className="text-[9px] font-mono font-extrabold text-[#0082ff] px-1 py-0.2 rounded bg-blue-500/15 shrink-0">
          {formatTaskDuration(value)}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            if (!STANDARD_DURATION_PRESETS.includes(value)) {
              onChange(30);
            }
          }}
          className="p-0.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          title={language === 'am' ? 'ነባሪ አማራጮች' : 'Switch back to preset list'}
        >
          <List size={11} />
        </button>
      </div>
    );
  }

  const isPresetValue = STANDARD_DURATION_PRESETS.includes(value);

  return (
    <div className={`inline-flex items-center gap-1 bg-white/90 dark:bg-black/40 border border-black/15 dark:border-white/15 rounded-xl ${pxSize} ${pySize} ${className}`}>
      <select
        value={isPresetValue ? value : 'custom'}
        onChange={handleSelectChange}
        className={`bg-transparent ${textSize} font-mono font-bold outline-none cursor-pointer text-slate-800 dark:text-slate-200`}
      >
        {!isPresetValue && (
          <option value={value} className="text-black dark:text-white font-mono">
            {formatTaskDuration(value)} ({language === 'am' ? 'ብጁ' : 'Custom'})
          </option>
        )}
        <option value={10} className="text-black">10m</option>
        <option value={15} className="text-black">15m</option>
        <option value={20} className="text-black">20m</option>
        <option value={25} className="text-black">25m</option>
        <option value={30} className="text-black">30m</option>
        <option value={45} className="text-black">45m</option>
        <option value={50} className="text-black">50m</option>
        <option value={60} className="text-black">1h</option>
        <option value={75} className="text-black">1.15h</option>
        <option value={90} className="text-black">1.30h</option>
        <option value={120} className="text-black">2h</option>
        <option value={150} className="text-black">2.30h</option>
        <option value={180} className="text-black">3h</option>
        <option value="custom" className="text-[#0082ff] font-bold">
          ✏️ {language === 'am' ? 'ብጁ ደቂቃ...' : 'Custom min...'}
        </option>
      </select>
      <button
        type="button"
        onClick={() => setIsCustom(true)}
        className="p-0.5 rounded opacity-40 hover:opacity-100 hover:text-[#0082ff] transition cursor-pointer"
        title={language === 'am' ? 'ብጁ ደቂቃ ያስገቡ' : 'Enter custom minute duration'}
      >
        <Edit2 size={10} />
      </button>
    </div>
  );
};
