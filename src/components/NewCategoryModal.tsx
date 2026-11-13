import React, { useState } from 'react';
import { 
  X, Plus, Swords, Palette, Music, 
  Dumbbell, Building2, TrendingUp, BookOpen, Shield, 
  Code, Flame, Target, Compass, Laptop, Feather, AlertCircle
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import confetti from 'canvas-confetti';

interface NewCategoryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'Swords', label: 'Chess / Battle', icon: Swords },
  { id: 'Palette', label: 'Art / Creative', icon: Palette },
  { id: 'Music', label: 'Music / Sound', icon: Music },
  { id: 'Dumbbell', label: 'Fitness / Strength', icon: Dumbbell },
  { id: 'Building2', label: 'Design / Arch', icon: Building2 },
  { id: 'TrendingUp', label: 'Trading / Market', icon: TrendingUp },
  { id: 'BookOpen', label: 'Devotion / Study', icon: BookOpen },
  { id: 'Shield', label: 'Rest / Buffer', icon: Shield },
  { id: 'Code', label: 'Coding / Software', icon: Code },
  { id: 'Flame', label: 'Sprint / Peak', icon: Flame },
  { id: 'Target', label: 'Precision Goal', icon: Target },
  { id: 'Compass', label: 'Exploration', icon: Compass },
  { id: 'Laptop', label: 'Deep Work', icon: Laptop },
  { id: 'Feather', label: 'Writing / Journal', icon: Feather },
];

const PRESET_COLORS = [
  '#0082ff', // Electric Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#e11d48', // Crimson Rose
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#64748b', // Slate
];

export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({ 
  isOpen: propIsOpen, 
  onClose: propOnClose 
}) => {
  const { 
    isNewCategoryModalOpen, 
    closeNewCategoryModal, 
    addNewCategory, 
    setSelectedCategoryId 
  } = useLivotion();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isNewCategoryModalOpen;
  const handleClose = propOnClose !== undefined ? propOnClose : closeNewCategoryModal;

  const [title, setTitle] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedIconName, setSelectedIconName] = useState('Code');
  const [weeklyTargetHours, setWeeklyTargetHours] = useState(6.0);
  const [scheduleItem1, setScheduleItem1] = useState('Mon/Wed/Fri: Core Deep Work Session');
  const [scheduleItem2, setScheduleItem2] = useState('Tue/Thu: Technical Review & Practice');
  const [monthlyGoalTitle, setMonthlyGoalTitle] = useState('');
  const [monthlyTargetMetric, setMonthlyTargetMetric] = useState('');
  const [monthlyTargetHours, setMonthlyTargetHours] = useState(24.0);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      setNameError('Please enter a category name before saving');
      return;
    }

    setNameError('');
    const id = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const scheduleSummary = [scheduleItem1.trim(), scheduleItem2.trim()].filter(Boolean);

    addNewCategory({
      id,
      title: title.trim(),
      color: selectedColor,
      weeklyTargetHours: Number(weeklyTargetHours),
      currentWeeklyHours: 0,
      baseWeeklyHours: 0,
      baseMonthlyHours: 0,
      weeklyScheduleSummary: scheduleSummary.length > 0 ? scheduleSummary : ['Regular deliberate practice session'],
      monthlyGoalTitle: monthlyGoalTitle.trim() || `${title.trim()} Core Monthly Milestone`,
      monthlyTargetMetric: monthlyTargetMetric.trim() || 'Verified standard execution',
      monthlyProgress: 0,
      monthlyTargetHours: Number(monthlyTargetHours),
      inProgressItems: [
        'Initial mastery syllabus setup and immersion',
        'Daily consistent practice habit baseline',
      ],
      achievedItems: [],
      upcomingItems: [
        'Advanced sprint and performance benchmark evaluation',
      ],
      isCustom: true,
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    // Reset fields for next time
    setTitle('');
    setMonthlyGoalTitle('');
    setMonthlyTargetMetric('');

    setSelectedCategoryId(id);
    handleClose();
  };

  const preventEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        // Only close if user clicked directly on the dark backdrop background
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: selectedColor }}
            >
              <Plus size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Add Mainstream Category
              </h3>
              <p className="text-xs text-slate-500">
                Creates a new top-level mastery pillar in the database.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Container (No form tag to prevent any unexpected browser submission) */}
        <div className="space-y-4 text-xs font-semibold">
          {/* Title */}
          <div>
            <label className="text-slate-600 dark:text-slate-400 block mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onKeyDown={preventEnterSubmit}
              onChange={(e) => {
                setTitle(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="e.g. Coding & AI, Language Learning, Novel Writing..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium outline-none focus:border-[#0082ff]"
            />
            {nameError && (
              <p className="text-rose-500 text-[11px] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {nameError}
              </p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-slate-600 dark:text-slate-400 block mb-1.5">
              Theme Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    selectedColor === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-slate-600 dark:text-slate-400 block mb-1.5">
              Category Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIconName === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedIconName(item.id)}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer text-center ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <IconComp size={16} />
                    <span className="text-[9px] truncate max-w-[50px]">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly & Monthly Hours Targets */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">
                Weekly Target (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                value={weeklyTargetHours}
                onKeyDown={preventEnterSubmit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setWeeklyTargetHours(val);
                  setMonthlyTargetHours(Number((val * 4).toFixed(1)));
                }}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">
                Monthly Target (Hours)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="400"
                value={monthlyTargetHours}
                onKeyDown={preventEnterSubmit}
                onChange={(e) => setMonthlyTargetHours(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          {/* Weekly Cadence Summary */}
          <div className="space-y-2">
            <label className="text-slate-600 dark:text-slate-400 block">
              Weekly Schedule Cadence
            </label>
            <input
              type="text"
              value={scheduleItem1}
              onKeyDown={preventEnterSubmit}
              onChange={(e) => setScheduleItem1(e.target.value)}
              placeholder="e.g. Mon/Wed 06:00 PM: Deep Focus Block"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal"
            />
            <input
              type="text"
              value={scheduleItem2}
              onKeyDown={preventEnterSubmit}
              onChange={(e) => setScheduleItem2(e.target.value)}
              placeholder="e.g. Sat 10:00 AM: Weekly Project Review"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal"
            />
          </div>

          {/* Monthly Deliverable */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">
                Monthly Deliverable Goal Title
              </label>
              <input
                type="text"
                value={monthlyGoalTitle}
                onKeyDown={preventEnterSubmit}
                onChange={(e) => setMonthlyGoalTitle(e.target.value)}
                placeholder="e.g. Ship V1 prototype / Complete 5 chapters"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal"
              />
            </div>

            <div>
              <label className="text-slate-600 dark:text-slate-400 block mb-1">
                Target Verification Metric
              </label>
              <input
                type="text"
                value={monthlyTargetMetric}
                onKeyDown={preventEnterSubmit}
                onChange={(e) => setMonthlyTargetMetric(e.target.value)}
                placeholder="e.g. 100% test coverage / 25,000 words written"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
            >
              <Plus size={14} /> Create Mainstream Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
