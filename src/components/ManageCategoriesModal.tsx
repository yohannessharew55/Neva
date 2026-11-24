import React, { useState } from 'react';
import { 
  X, Trash2, Plus, ArrowUp, ArrowDown, Palette,
  AlertTriangle, RotateCcw, 
  SlidersHorizontal, CheckCircle2, ChevronRight, Layers,
  Edit3, Check, Settings, Briefcase, Heart, Sparkles, Image as ImageIcon, Upload, Link2
} from 'lucide-react';
import { useLivotion, CategoryPlan } from '../context/LivotionContext';
import {
  CATEGORY_PRESET_COLORS as PRESET_COLORS,
  CATEGORY_ICON_OPTIONS,
  getDefaultCategoryIconId,
  resolveCategoryIcon,
  compressImageFileToDataUrl
} from '../utils/categoryIcons';

interface ManageCategoriesModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose
}) => {
  const {
    isManageCategoriesModalOpen,
    closeManageCategoriesModal,
    categoryPlans,
    updateCategoryPlan,
    deleteCategoryPlan,
    openNewCategoryModal,
    restoreDefaultCategories,
    categoryOrder,
    reorderCategories,
    getCategoryTitleTranslated,
    tasks,
    language,
    t
  } = useLivotion();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isManageCategoriesModalOpen;
  const handleClose = propOnClose !== undefined ? propOnClose : closeManageCategoriesModal;

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState('#0082ff');
  const [editIcon, setEditIcon] = useState('Shield');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [editWeeklyHours, setEditWeeklyHours] = useState<number>(5);
  const [editMonthlyGoal, setEditMonthlyGoal] = useState('');
  const [editMonthlyMetric, setEditMonthlyMetric] = useState('');
  const [editMonthlyHours, setEditMonthlyHours] = useState<number>(20);
  const [editTriple8Type, setEditTriple8Type] = useState<'career' | 'hobby' | 'living'>('hobby');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const getIcon = (id: string, iconName?: string) => resolveCategoryIcon(id, iconName);

  const baseCategoryKeys = Object.keys(categoryPlans);
  const orderedCategoryKeys = [...baseCategoryKeys].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  const categories = orderedCategoryKeys.map((key) => categoryPlans[key]).filter(Boolean);

  const moveCategory = (id: string, direction: 'up' | 'down') => {
    const currentIndex = orderedCategoryKeys.indexOf(id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedCategoryKeys.length) return;
    const targetId = orderedCategoryKeys[targetIndex];
    reorderCategories(id, targetId);
  };

  const startEditing = (cat: CategoryPlan) => {
    setConfirmDeleteId(null);
    setEditingCatId(cat.id);
    setEditTitle(cat.title);
    setEditColor(cat.color || PRESET_COLORS[0]);
    setEditIcon(cat.icon || getDefaultCategoryIconId(cat.id));
    setEditBannerImage(cat.bannerImage || '');
    setEditWeeklyHours(cat.weeklyTargetHours || 5);
    setEditMonthlyGoal(cat.monthlyGoalTitle || '');
    setEditMonthlyMetric(cat.monthlyTargetMetric || '');
    setEditMonthlyHours(cat.monthlyTargetHours || 20);
    const defaultType = (cat.id === 'architecture' || cat.id === 'trading' || cat.id === 'career' || cat.id === 'work')
      ? 'career'
      : (cat.id === 'chess' || cat.id === 'music' || cat.id === 'art' || cat.id === 'guitar' || cat.id === 'painting')
      ? 'hobby'
      : 'living';
    setEditTriple8Type(cat.triple8Type || defaultType);
  };

  const cancelEditing = () => {
    setEditingCatId(null);
  };

  const handleSaveEdit = (catId: string) => {
    if (!editTitle.trim()) {
      setToastMessage(language === 'am' ? 'እባክዎ ትክክለኛ የዘርፍ ስም ያስገቡ' : 'Please provide a valid stream title');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    updateCategoryPlan(catId, {
      title: editTitle.trim(),
      color: editColor,
      icon: editIcon,
      bannerImage: editBannerImage.trim() || undefined,
      weeklyTargetHours: Math.max(0.5, Number(editWeeklyHours) || 1),
      monthlyGoalTitle: editMonthlyGoal.trim(),
      monthlyTargetMetric: editMonthlyMetric.trim(),
      monthlyTargetHours: Math.max(1, Number(editMonthlyHours) || 1),
      triple8Type: editTriple8Type
    });

    setEditingCatId(null);
    setToastMessage(language === 'am' ? `"${editTitle.trim()}" ዘርፍ በተሳካ ሁኔታ ተስተካክሏል!` : `Updated "${editTitle.trim()}" successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = (categoryId: string) => {
    const catTitle = categoryPlans[categoryId]?.title || categoryId;
    deleteCategoryPlan(categoryId);
    setConfirmDeleteId(null);
    setEditingCatId(null);
    setToastMessage(language === 'am' ? `"${catTitle}" ዘርፍ ተሰርዟል!` : `Deleted "${catTitle}" successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm(language === 'am' 
      ? 'ነባሪ ዋና ዘርፎችን (ስፖርት፣ ቼዝ፣ ጊታር፣ ጸሎት ወዘተ) መልሰው ማምጣት ይፈልጋሉ?' 
      : 'Restore all default main streams (Exercise, Chess, Music, Devotion, etc.)?')) {
      restoreDefaultCategories();
      setToastMessage(language === 'am' ? 'ነባሪ ዋና ዘርፎች ተመልሰዋል!' : 'Default streams restored!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className="bg-white dark:bg-[#121927] border border-slate-200/90 dark:border-slate-800 w-full max-w-xl rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0082ff]/10 text-[#0082ff] flex items-center justify-center shrink-0">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'የዋና ዘርፎች ቅንብሮች እና ማስተካከያ' : 'Core Pillars & Stream Settings'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'am' ? 'ስሞችን፣ ቀለማትን፣ የታለሙ ሰዓታትን ያስተካክሉ፣ ቅደም ተከተል ይቀይሩ ወይም ይሰርዙ' : 'Edit stream names, colors, targets, reorder, or delete'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title={t('close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn shrink-0">
            <CheckCircle2 size={15} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Stream Count & Action Bar */}
        <div className="flex items-center justify-between px-1 text-xs shrink-0">
          <span className="font-mono text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
            {language === 'am' ? 'አሁን ያሉ ዋና ዘርፎች' : 'Active Main Streams'} ({categories.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              title="Restore standard default streams"
            >
              <RotateCcw size={11} />
              <span>{language === 'am' ? 'ነባሪዎችን መልስ' : 'Defaults'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleClose();
                openNewCategoryModal();
              }}
              className="px-2.5 py-1 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus size={12} strokeWidth={3} />
              <span>{language === 'am' ? 'አዲስ ዘርፍ አክል' : 'Add Stream'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Stream Cards with Direct Edit & Delete Buttons */}
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 max-h-[55vh]">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <p className="text-xs font-bold">
                {language === 'am' ? 'ምንም ዋና ዘርፍ የለም።' : 'No main streams active.'}
              </p>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-4 py-2 rounded-xl bg-[#0082ff] text-white text-xs font-bold cursor-pointer"
              >
                {language === 'am' ? 'ነባሪ ዋና ዘርፎችን መልስ' : 'Restore Default Streams'}
              </button>
            </div>
          ) : (
            categories.map((cat, idx) => {
              const Icon = getIcon(cat.id, cat.icon);
              const isConfirming = confirmDeleteId === cat.id;
              const isEditing = editingCatId === cat.id;
              const catTasksCount = tasks.filter((t) => (t.badge && t.badge.toLowerCase().includes(cat.id)) || (t.domain && t.domain.toLowerCase().includes(cat.id))).length;

              return (
                <div 
                  key={cat.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    isConfirming 
                      ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900' 
                      : isEditing
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-[#0082ff]/60 shadow-xs ring-1 ring-[#0082ff]/30'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left: Reorder Controls + Icon + Title */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {/* Priority Up/Down */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCategory(cat.id, 'up')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
                          title="Move Up"
                        >
                          <ArrowUp size={11} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categories.length - 1}
                          onClick={() => moveCategory(cat.id, 'down')}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
                          title="Move Down"
                        >
                          <ArrowDown size={11} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Stream Icon */}
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                            {getCategoryTitleTranslated(cat.id, cat.title)}
                          </h4>
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-white dark:border-slate-800 shadow-2xs" 
                            style={{ backgroundColor: cat.color }} 
                            title={cat.color}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                          <span>{cat.weeklyTargetHours}h / {language === 'am' ? 'ሳምንት' : 'week'}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            (cat.triple8Type || (['architecture', 'trading', 'career', 'work'].includes(cat.id) ? 'career' : ['chess', 'music', 'art', 'guitar', 'painting'].includes(cat.id) ? 'hobby' : 'living')) === 'career'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                              : (cat.triple8Type || (['architecture', 'trading', 'career', 'work'].includes(cat.id) ? 'career' : ['chess', 'music', 'art', 'guitar', 'painting'].includes(cat.id) ? 'hobby' : 'living')) === 'hobby'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {(cat.triple8Type || (['architecture', 'trading', 'career', 'work'].includes(cat.id) ? 'career' : ['chess', 'music', 'art', 'guitar', 'painting'].includes(cat.id) ? 'hobby' : 'living')) === 'career'
                              ? '💼 Career'
                              : (cat.triple8Type || (['architecture', 'trading', 'career', 'work'].includes(cat.id) ? 'career' : ['chess', 'music', 'art', 'guitar', 'painting'].includes(cat.id) ? 'hobby' : 'living')) === 'hobby'
                              ? '🎨 Hobby'
                              : '🌿 Living'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions (Edit & Delete) */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            <span>{language === 'am' ? 'አረጋግጥና ሰርዝ' : 'Confirm'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer"
                          >
                            {language === 'am' ? 'ይቅር' : 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => isEditing ? cancelEditing() : startEditing(cat)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                              isEditing
                                ? 'bg-[#0082ff] text-white border-[#0082ff] shadow-xs'
                                : 'bg-[#0082ff]/10 hover:bg-[#0082ff]/20 text-[#0082ff] border-[#0082ff]/20'
                            }`}
                            title={language === 'am' ? `${cat.title} አስተካክል` : `Edit ${cat.title}`}
                          >
                            <Edit3 size={12} />
                            <span>{isEditing ? (language === 'am' ? 'ሰብስብ' : 'Close') : (language === 'am' ? 'አስተካክል' : 'Edit')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              cancelEditing();
                              setConfirmDeleteId(cat.id);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-rose-200/80 dark:border-rose-900/60 active:scale-95"
                            title={language === 'am' ? `${cat.title} ዋና ዘርፍ ሰርዝ` : `Delete ${cat.title}`}
                          >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">{language === 'am' ? 'ሰርዝ' : 'Delete'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline Stream Edit Panel */}
                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-slate-200/90 dark:border-slate-700/80 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-black uppercase tracking-wider text-[#0082ff] flex items-center gap-1.5">
                          <Edit3 size={12} />
                          <span>{language === 'am' ? 'የዘርፉን መረጃዎች ማስተካከያ' : 'Edit Stream Details & Targets'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {cat.id}
                        </span>
                      </div>

                      {/* Stream Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {language === 'am' ? 'የዋና ዘርፉ ስም (Stream Name)' : 'Stream Title / Name'}
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                          placeholder="e.g., Exercise & Fitness"
                        />
                      </div>

                      {/* Triple-8 Life Balance Pillar Choice (Career vs Hobby vs Living) */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#0082ff]" />
                            <span>{language === 'am' ? 'የ24 ሰዓት ሚዛን ምደባ (Triple-8 Type)' : 'Triple-8 Life Balance Category'}</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {language === 'am' ? 'ከ24 ሰዓት ሚዛን ጋር ይሰምራል' : 'Syncs with 24h Wheel'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditTriple8Type('career')}
                            className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                              editTriple8Type === 'career'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Briefcase size={16} />
                            <span className="font-extrabold">{language === 'am' ? 'ስራ/ሙያ' : 'Career'}</span>
                            <span className="text-[9px] opacity-80 font-mono">8h Work/Craft</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditTriple8Type('hobby')}
                            className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                              editTriple8Type === 'hobby'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-1 ring-purple-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Palette size={16} />
                            <span className="font-extrabold">{language === 'am' ? 'ተሰጥኦ' : 'Hobby'}</span>
                            <span className="text-[9px] opacity-80 font-mono">8h Passions/Chess</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditTriple8Type('living')}
                            className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                              editTriple8Type === 'living'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Heart size={16} />
                            <span className="font-extrabold">{language === 'am' ? 'ኑሮ/እረፍት' : 'Living'}</span>
                            <span className="text-[9px] opacity-80 font-mono">8h Health/Rest</span>
                          </button>
                        </div>
                      </div>

                      {/* Color Palette Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>{language === 'am' ? 'የዘርፉ ቀለም (Theme Color)' : 'Theme Color'}</span>
                          <span className="text-[10px] font-mono text-slate-400">{editColor}</span>
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {PRESET_COLORS.map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setEditColor(col)}
                              className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                                editColor.toLowerCase() === col.toLowerCase()
                                  ? 'scale-110 ring-2 ring-offset-2 ring-[#0082ff] dark:ring-offset-slate-900'
                                  : 'hover:scale-105 opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: col }}
                              title={col}
                            >
                              {editColor.toLowerCase() === col.toLowerCase() && (
                                <Check size={12} className="text-white drop-shadow-xs" strokeWidth={3} />
                              )}
                            </button>
                          ))}
                          <label
                            title={language === 'am' ? 'ሌላ ቀለም ምረጥ' : 'Custom Color'}
                            className={`w-7 h-7 rounded-full border border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center cursor-pointer transition hover:scale-110 overflow-hidden relative ${
                              !PRESET_COLORS.some((c) => c.toLowerCase() === editColor.toLowerCase())
                                ? 'scale-110 ring-2 ring-offset-2 ring-[#0082ff] dark:ring-offset-slate-900'
                                : ''
                            }`}
                            style={{
                              backgroundColor: !PRESET_COLORS.some((c) => c.toLowerCase() === editColor.toLowerCase())
                                ? editColor
                                : 'transparent'
                            }}
                          >
                            <input
                              type="color"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                            {PRESET_COLORS.some((c) => c.toLowerCase() === editColor.toLowerCase()) && (
                              <Plus size={13} className="text-slate-500 dark:text-slate-300 pointer-events-none" />
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Category Icon Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>{language === 'am' ? 'የዘርፉ ምልክት (Category Icon)' : 'Category Icon'}</span>
                          <span className="text-[10px] font-mono text-slate-400">{editIcon}</span>
                        </label>
                        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                          {CATEGORY_ICON_OPTIONS.map((item) => {
                            const IconItemComp = item.icon;
                            const isSelectedIcon = editIcon === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setEditIcon(item.id)}
                                title={item.label}
                                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition cursor-pointer ${
                                  isSelectedIcon
                                    ? 'bg-[#0082ff] text-white shadow-xs font-bold'
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <IconItemComp size={15} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Banner Image (Unsplash Link or Local Upload) */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ImageIcon size={12} className="text-[#0082ff]" />
                            <span>{language === 'am' ? 'የዳራ ምስል (Banner Photo)' : 'Banner Image (Unsplash Link or Local)'}</span>
                          </span>
                          {editBannerImage && (
                            <button
                              type="button"
                              onClick={() => setEditBannerImage('')}
                              className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              {language === 'am' ? 'ወደ ነባሪ መልስ' : 'Reset Default'}
                            </button>
                          )}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Link2 size={13} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              value={editBannerImage.startsWith('data:') ? '' : editBannerImage}
                              onChange={(e) => setEditBannerImage(e.target.value)}
                              placeholder={editBannerImage.startsWith('data:') ? 'Local photo uploaded ✓' : 'https://images.unsplash.com/...'}
                              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                            />
                          </div>
                          <label className="px-3 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition">
                            <Upload size={13} />
                            <span>{language === 'am' ? 'ጫን' : 'Upload'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const dataUrl = await compressImageFileToDataUrl(file);
                                  setEditBannerImage(dataUrl);
                                } catch {}
                              }}
                            />
                          </label>
                        </div>
                        {editBannerImage && (
                          <div className="relative h-14 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={editBannerImage} alt="Banner preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Cadence Targets Grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {language === 'am' ? 'ሳምንታዊ ሰዓታት (Weekly Target)' : 'Weekly Target (Hours)'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="168"
                              value={editWeeklyHours}
                              onChange={(e) => setEditWeeklyHours(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                              h/wk
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {language === 'am' ? 'ወርሃዊ ሰዓታት (Monthly Target)' : 'Monthly Target (Hours)'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="1"
                              min="1"
                              max="720"
                              value={editMonthlyHours}
                              onChange={(e) => setEditMonthlyHours(parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                              h/mo
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Milestone / Goal Title & Target Metric */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {language === 'am' ? 'የወሩ ዋና ግብ (Monthly Goal)' : 'Monthly Focus Milestone'}
                          </label>
                          <input
                            type="text"
                            value={editMonthlyGoal}
                            onChange={(e) => setEditMonthlyGoal(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                            placeholder="e.g., Master 10 classical opening positions"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {language === 'am' ? 'የመለኪያ ዝርዝር (Target Metric)' : 'Target Metric / Details'}
                          </label>
                          <input
                            type="text"
                            value={editMonthlyMetric}
                            onChange={(e) => setEditMonthlyMetric(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                            placeholder="e.g., 20 sessions / 100% consistency"
                          />
                        </div>
                      </div>

                      {/* Save & Cancel Row */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer active:scale-95"
                        >
                          {language === 'am' ? 'ይቅር' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-4 py-2 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check size={13} strokeWidth={3} />
                          <span>{language === 'am' ? 'ለውጦችን መዝግብ' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Warning Notice while confirming delete */}
                  {isConfirming && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-[10px] text-rose-700 dark:text-rose-300 font-bold animate-fadeIn">
                      <AlertTriangle size={13} className="shrink-0 text-rose-600" />
                      <span>
                        {language === 'am' 
                          ? `ይህ "${cat.title}" ዋና ዘርፍን እና ሁሉንም የተመዘገቡ ተግባራት በቋሚነት ያጠፋዋል።` 
                          : `This will permanently wipe "${cat.title}" and remove all its activities across the app.`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono">
            {language === 'am' ? 'ለውጦች ወዲያውኑ በሁሉም ገጾች ይተገበራሉ' : 'Changes take effect immediately across NEVA'}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black transition cursor-pointer hover:opacity-90 active:scale-95"
          >
            {language === 'am' ? 'ተጠናቋል' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
