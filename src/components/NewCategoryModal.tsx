import React, { useState } from 'react';
import { 
  X, Plus, Palette, AlertCircle, Briefcase, Heart
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { CATEGORY_PRESET_COLORS as PRESET_COLORS, CATEGORY_ICON_OPTIONS as AVAILABLE_ICONS } from '../utils/categoryIcons';
import confetti from 'canvas-confetti';

interface NewCategoryModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const STREAM_PRESETS = [
  { id: 'chess', title: 'Chess', color: '#8b5cf6', icon: 'Swords', hours: 5.0, triple8Type: 'hobby' as const },
  { id: 'exercise', title: 'Exercise & Fitness', color: '#ef4444', icon: 'Dumbbell', hours: 5.0, triple8Type: 'living' as const },
  { id: 'devotion', title: 'Devotion & Prayer', color: '#a855f7', icon: 'BookOpen', hours: 5.0, triple8Type: 'living' as const },
  { id: 'music', title: 'Music & Guitar', color: '#ec4899', icon: 'Music', hours: 5.0, triple8Type: 'hobby' as const },
  { id: 'art', title: 'Art & Painting', color: '#e11d48', icon: 'Palette', hours: 5.0, triple8Type: 'hobby' as const },
  { id: 'architecture', title: 'Architecture & Design', color: '#0082ff', icon: 'Building2', hours: 10.0, triple8Type: 'career' as const },
  { id: 'trading', title: 'Forex Trading', color: '#10b981', icon: 'TrendingUp', hours: 5.0, triple8Type: 'career' as const },
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
  const [triple8Type, setTriple8Type] = useState<'career' | 'hobby' | 'living'>('hobby');
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
      icon: selectedIconName,
      weeklyTargetHours: Number(weeklyTargetHours),
      currentWeeklyHours: 0,
      baseWeeklyHours: 0,
      baseMonthlyHours: 0,
      weeklyScheduleSummary: scheduleSummary.length > 0 ? scheduleSummary : ['Regular deliberate practice session'],
      monthlyGoalTitle: monthlyGoalTitle.trim() || `${title.trim()} Core Monthly Milestone`,
      monthlyTargetMetric: monthlyTargetMetric.trim() || 'Verified standard execution',
      monthlyProgress: 0,
      monthlyTargetHours: Number(monthlyTargetHours),
      triple8Type,
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
          {/* Quick Preset Templates */}
          <div>
            <label className="text-slate-500 dark:text-slate-400 block mb-1 text-[11px] font-bold">
              Quick Presets (Click to Auto-Fill)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STREAM_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setTitle(p.title);
                    setSelectedColor(p.color);
                    setSelectedIconName(p.icon);
                    setWeeklyTargetHours(p.hours);
                    setMonthlyTargetHours(p.hours * 4);
                    setTriple8Type(p.triple8Type);
                    setNameError('');
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:border-[#0082ff] bg-slate-50 dark:bg-slate-800/60 transition cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <span className="text-[#0082ff]">+</span>
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>

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

          {/* Triple-8 Life Balance Pillar Choice */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                Triple-8 Balance Classification *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Syncs with 24h Wheel</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTriple8Type('career')}
                className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  triple8Type === 'career'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Briefcase size={13} />
                <span>💼 Career</span>
              </button>
              <button
                type="button"
                onClick={() => setTriple8Type('hobby')}
                className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  triple8Type === 'hobby'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Palette size={13} />
                <span>🎨 Hobby</span>
              </button>
              <button
                type="button"
                onClick={() => setTriple8Type('living')}
                className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  triple8Type === 'living'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Heart size={13} />
                <span>🌿 Living</span>
              </button>
            </div>
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
              <label
                title="Custom Color"
                className={`w-7 h-7 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer transition hover:scale-110 overflow-hidden relative ${
                  !PRESET_COLORS.includes(selectedColor) ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                }`}
                style={{ backgroundColor: !PRESET_COLORS.includes(selectedColor) ? selectedColor : 'transparent' }}
              >
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                {PRESET_COLORS.includes(selectedColor) && (
                  <Plus size={14} className="text-slate-500 dark:text-slate-400 pointer-events-none" />
                )}
              </label>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-slate-600 dark:text-slate-400 block mb-1.5">
              Category Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-44 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
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
