import React, { useState } from 'react';
import {
  X,
  Trophy,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Flame,
  Check,
  ChevronRight,
  BookOpen,
  Dumbbell,
  Swords,
  Palette,
  Music,
  Building2,
  TrendingUp,
  Shield,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivotion } from '../context/LivotionContext';
import { soundEngine } from '../utils/audio';

interface WeeklyMasteryReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyMasteryReviewModal: React.FC<WeeklyMasteryReviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    categoryPlans,
    updateCategoryPlan,
    setSelectedCategoryId,
    getCategoryLiveMetrics,
    getCategoryTitleTranslated,
    language,
  } = useLivotion();

  const [newMilestoneText, setNewMilestoneText] = useState<Record<string, string>>({});
  const [addingForCat, setAddingForCat] = useState<string | null>(null);

  // Weekly Reflection Note state
  const [weeklyNote, setWeeklyNote] = useState<string>(() => {
    try {
      return localStorage.getItem('neva_weekly_mastery_reflection') || '';
    } catch {
      return '';
    }
  });

  if (!isOpen) return null;

  const categories = Object.values(categoryPlans).filter(cat => cat && cat.id);

  // Calculate totals across all pillars
  let totalTargetWeeklyHours = 0;
  let totalLoggedWeeklyHours = 0;
  let totalActiveMilestones = 0;
  let totalAchievedBreakthroughs = 0;

  categories.forEach((cat) => {
    const metrics = getCategoryLiveMetrics(cat.id);
    totalTargetWeeklyHours += Number(cat.weeklyTargetHours) || 0;
    totalLoggedWeeklyHours += Number(metrics.currentWeeklyHours) || 0;
    totalActiveMilestones += (cat.inProgressItems?.length || 0);
    totalAchievedBreakthroughs += (cat.achievedItems?.length || 0);
  });

  const overallProgressPct =
    totalTargetWeeklyHours > 0
      ? Math.min(100, Math.round((totalLoggedWeeklyHours / totalTargetWeeklyHours) * 100))
      : 0;

  // Complete an active milestone: move from inProgressItems to achievedItems with micro-confetti celebration
  const handleCompleteMilestone = (catId: string, milestoneIndex: number) => {
    const cat = categoryPlans[catId];
    if (!cat || !cat.inProgressItems || !cat.inProgressItems[milestoneIndex]) return;

    const completedMilestone = cat.inProgressItems[milestoneIndex];
    const updatedInProgress = cat.inProgressItems.filter((_, idx) => idx !== milestoneIndex);
    const updatedAchieved = [completedMilestone, ...(cat.achievedItems || [])];

    updateCategoryPlan(catId, {
      inProgressItems: updatedInProgress,
      achievedItems: updatedAchieved,
    });

    try {
      soundEngine.playSound('CHIME_MEDITATION');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: [cat.color, '#0082ff', '#10b981', '#f59e0b'],
      });
    } catch {}
  };

  // Add a new milestone directly from the review modal
  const handleAddMilestone = (catId: string) => {
    const text = (newMilestoneText[catId] || '').trim();
    if (!text) return;

    const cat = categoryPlans[catId];
    if (!cat) return;

    const updatedInProgress = [...(cat.inProgressItems || []), text];
    updateCategoryPlan(catId, {
      inProgressItems: updatedInProgress,
    });

    setNewMilestoneText((prev) => ({ ...prev, [catId]: '' }));
    setAddingForCat(null);
    try {
      soundEngine.playPencil();
    } catch {}
  };

  const handleSaveReflection = (val: string) => {
    setWeeklyNote(val);
    try {
      localStorage.setItem('neva_weekly_mastery_reflection', val);
    } catch {}
  };

  const getPillarIcon = (id: string) => {
    switch (id) {
      case 'devotion': return BookOpen;
      case 'exercise': return Dumbbell;
      case 'chess': return Swords;
      case 'art': return Palette;
      case 'music': return Music;
      case 'architecture': return Building2;
      case 'trading': return TrendingUp;
      case 'buffer': return Shield;
      default: return Layers;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0082ff] to-[#60a5fa] text-white flex items-center justify-center shrink-0 shadow-md">
              <Trophy size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                {language === 'am' ? 'ሳምንታዊ የልህቀት ግምገማ እና የደረጃዎች እድገት' : 'Weekly Mastery Review & Milestones'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                {language === 'am'
                  ? 'የሳምንታዊ ሰዓታት ማስፈጸሚያ እና የደረጃዎች ስኬት መከታተያ'
                  : 'Track weekly hours, milestones, and breakthroughs across all pillars'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer shrink-0"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Executive Overview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-[#0082ff]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  {language === 'am' ? 'ሳምንታዊ አጠቃላይ ቁርጠኝነት' : 'Weekly Execution Pulse'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-[#0082ff] dark:text-blue-300">
                {overallProgressPct}% {language === 'am' ? 'ተጠናቋል' : 'Completed'}
              </span>
            </div>

            {/* Metrics Triad */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {language === 'am' ? 'ዒላማ ሰዓታት' : 'Target Hours'}
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                  {totalTargetWeeklyHours}h
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {language === 'am' ? 'የተከናወኑ' : 'Logged Hours'}
                </div>
                <div className="text-base sm:text-lg font-black text-[#0082ff] mt-0.5 font-mono">
                  {totalLoggedWeeklyHours.toFixed(1)}h
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {language === 'am' ? 'ስኬቶች' : 'Breakthroughs'}
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  🏆 {totalAchievedBreakthroughs}
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0082ff] to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
          </div>

          {/* Mastery Pillars Review List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono px-1">
              {language === 'am' ? 'የዋና ዋና ዘርፎች ዝርዝር ደረጃ' : 'Pillar-by-Pillar Milestone Track'}
            </h3>

            {categories.map((cat) => {
              const Icon = getPillarIcon(cat.id);
              const metrics = getCategoryLiveMetrics(cat.id);
              const targetHours = Number(cat.weeklyTargetHours) || 1;
              const loggedHours = Number(metrics.currentWeeklyHours) || 0;
              const pct = Math.min(100, Math.round((loggedHours / targetHours) * 100));
              const activeMilestones = cat.inProgressItems || [];
              const achievedCount = cat.achievedItems?.length || 0;

              return (
                <div
                  key={cat.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs space-y-3 transition"
                >
                  {/* Top Bar: Icon, Title, Weekly Target, Open Roadmap */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                          border: `1px solid ${cat.color}40`,
                        }}
                      >
                        <Icon size={16} strokeWidth={2.4} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block">
                          {getCategoryTitleTranslated(cat.id, cat.title)}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-slate-400">
                          {loggedHours.toFixed(1)}h / {targetHours}h {language === 'am' ? 'በሳምንት' : 'weekly'} ({pct}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        {targetHours}h/wk
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setSelectedCategoryId(cat.id);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                        title="Open full roadmap"
                      >
                        <span>{language === 'am' ? 'እቅድ ክፈት' : 'Roadmap'}</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Pillar Hours Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>

                  {/* Active Milestones Section */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{language === 'am' ? 'ንቁ ደረጃዎች / ግቦች' : 'Active Milestones'}</span>
                      {achievedCount > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold">
                          🏆 {achievedCount} {language === 'am' ? 'ተሳክተዋል' : 'achieved'}
                        </span>
                      )}
                    </div>

                    {activeMilestones.length > 0 ? (
                      <div className="space-y-1.5">
                        {activeMilestones.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium group"
                          >
                            <span className="text-slate-800 dark:text-slate-200 truncate flex-1">
                              • {m}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCompleteMilestone(cat.id, mIdx)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                              title="Mark milestone complete"
                            >
                              <Check size={11} strokeWidth={3} />
                              <span>{language === 'am' ? 'አጠናቅቅ' : 'Complete'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        {language === 'am' ? 'ምንም ንቁ ደረጃ አልተመዘገበም።' : 'No active milestone in progress.'}
                      </p>
                    )}

                    {/* Quick Add Next Milestone */}
                    {addingForCat === cat.id ? (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={newMilestoneText[cat.id] || ''}
                          onChange={(e) =>
                            setNewMilestoneText((prev) => ({ ...prev, [cat.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddMilestone(cat.id);
                            if (e.key === 'Escape') setAddingForCat(null);
                          }}
                          placeholder={language === 'am' ? 'ቀጣይ ደረጃ ይጻፉ...' : 'Write next milestone...'}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0082ff]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddMilestone(cat.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#0082ff] text-white text-xs font-bold hover:bg-[#0070df] transition active:scale-95 cursor-pointer"
                        >
                          {language === 'am' ? 'አክል' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingForCat(null)}
                          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingForCat(cat.id)}
                        className="text-[11px] font-bold text-[#0082ff] hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>{language === 'am' ? '+ ቀጣይ ደረጃ አክል' : '+ Add Milestone'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weekly Synthesis & Reflection Note */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📝</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 font-mono">
                {language === 'am' ? 'የሳምንቱ ማጠቃለያና ማስታወሻ' : 'Weekly Breakthrough Reflection'}
              </h4>
            </div>
            <textarea
              rows={2}
              value={weeklyNote}
              onChange={(e) => handleSaveReflection(e.target.value)}
              placeholder={
                language === 'am'
                  ? 'የሳምንቱን ዋና ዋና ስኬቶች እና ለሚቀጥለው ሳምንት ትኩረት የሚሹ ነገሮችን ይጻፉ...'
                  : 'Capture this week\'s key breakthroughs, lessons learned, and top focus for next sprint...'
              }
              className="w-full p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-white/80 dark:bg-[#121927] text-xs font-hand text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 font-mono">
            {categories.length} {language === 'am' ? 'ዋና ዋና ዘርፎች' : 'Mastery Pillars Active'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-xs"
          >
            {language === 'am' ? 'ተጠናቋል' : 'Done & Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
