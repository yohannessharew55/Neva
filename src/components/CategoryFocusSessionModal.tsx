import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Check, SkipForward, SkipBack, 
  X, Sparkles, Volume2, VolumeX, CheckCircle2, Award, 
  Clock, Flame, ChevronRight, Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivotion } from '../context/LivotionContext';
import { ScheduleTask, DomainType } from '../types';
import { soundEngine } from '../utils/audio';

interface CategoryFocusSessionModalProps {
  categoryId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryFocusSessionModal: React.FC<CategoryFocusSessionModalProps> = ({
  categoryId,
  isOpen,
  onClose,
}) => {
  const { 
    tasks, 
    toggleTaskCompletion, 
    addTask,
    categoryPlans, 
    getCategoryTitleTranslated,
    language 
  } = useLivotion();

  const category = categoryPlans[categoryId];

  // Resolve domain types for this category
  const getDomainTypesForCat = (catId: string): DomainType[] => {
    switch (catId) {
      case 'exercise': return ['PHYSICAL_FITNESS'];
      case 'chess': return ['CHESS'];
      case 'art': return ['OIL_PAINTING'];
      case 'music': return ['GUITAR'];
      case 'architecture': return ['ARCHITECTURE_DESIGN', 'SITE_SUPERVISION'];
      case 'trading': return ['FOREX_TRADING'];
      case 'devotion': return ['DEVOTION_PRAYER'];
      case 'buffer': return ['OPEN_MULTIPURPOSE', 'RECREATION', 'CONTENT_CREATION'];
      default: return [catId.toUpperCase() as DomainType];
    }
  };

  const domainTypes = getDomainTypesForCat(categoryId);
  const categoryTasks = tasks.filter((t) => domainTypes.includes(t.domain));

  // Sequence state
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [completedInSession, setCompletedInSession] = useState<string[]>([]);

  // Quick add state for empty category
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(25);

  const activeBlock: ScheduleTask | undefined = categoryTasks[activeBlockIndex];

  // When modal opens or active block changes, initialize timer to that block's duration
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      return;
    }

    if (categoryTasks.length > 0) {
      // Find the first uncompleted block or start at 0
      const firstIncompleteIdx = categoryTasks.findIndex((t) => !t.completed);
      const startingIdx = firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0;
      setActiveBlockIndex(startingIdx);
      const targetBlock = categoryTasks[startingIdx];
      if (targetBlock) {
        setSecondsRemaining(targetBlock.durationMin * 60);
        setIsRunning(true);
        if (soundEnabled) {
          soundEngine.playSound('SOLFEGGIO_432');
        }
      }
      setIsSessionComplete(false);
    }
  }, [isOpen, categoryId, categoryTasks.length]);

  // When activeBlockIndex changes while modal is open, load its duration
  const loadBlock = (index: number) => {
    if (index >= 0 && index < categoryTasks.length) {
      setActiveBlockIndex(index);
      const block = categoryTasks[index];
      setSecondsRemaining(block.durationMin * 60);
      setIsRunning(true);
      if (soundEnabled) {
        soundEngine.playSound('SOLFEGGIO_432');
      }
    }
  };

  // Timer countdown loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleBlockTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isRunning, secondsRemaining, activeBlockIndex, categoryTasks]);

  // When timer ends correctly for the active block:
  // 1. Mark task as checked
  // 2. Play chime
  // 3. Move to next block 1 by 1
  const handleBlockTimerComplete = () => {
    if (!activeBlock) return;

    // Check task as done if not already completed
    if (!activeBlock.completed) {
      toggleTaskCompletion(activeBlock.id);
    }

    setCompletedInSession((prev) => [...prev, activeBlock.id]);

    if (soundEnabled) {
      soundEngine.playSound('CHIME_MEDITATION');
    }

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });

    // Check if there is a next block in the sequence
    const nextIdx = activeBlockIndex + 1;
    if (nextIdx < categoryTasks.length) {
      // Advance to next block 1 by 1
      setActiveBlockIndex(nextIdx);
      const nextBlock = categoryTasks[nextIdx];
      setSecondsRemaining(nextBlock.durationMin * 60);
      setIsRunning(true);
    } else {
      // All blocks in this category completed!
      setIsRunning(false);
      setIsSessionComplete(true);
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
      });
    }
  };

  // Manual complete & advance to next block
  const handleCompleteCurrentAndNext = () => {
    handleBlockTimerComplete();
  };

  // Skip to next block without marking done
  const handleSkipNext = () => {
    const nextIdx = activeBlockIndex + 1;
    if (nextIdx < categoryTasks.length) {
      loadBlock(nextIdx);
    }
  };

  // Go to previous block
  const handlePrevious = () => {
    const prevIdx = activeBlockIndex - 1;
    if (prevIdx >= 0) {
      loadBlock(prevIdx);
    }
  };

  const handleResetCurrent = () => {
    if (activeBlock) {
      setSecondsRemaining(activeBlock.durationMin * 60);
      setIsRunning(false);
    }
  };

  const handleCreateAndStartFirstBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTask({
      title: newTitle.trim(),
      startTime: 'Flexible',
      durationMin: Number(newDuration),
      domain: domainTypes[0],
      badge: category?.title?.split(' ')[0] || 'Focus',
      color: category?.color || '#0082ff',
      completed: false,
      soundProfile: 'SOLFEGGIO_432',
    });

    setNewTitle('');
  };

  if (!isOpen) return null;

  // Format MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalBlockDurationSec = (activeBlock?.durationMin || 1) * 60;
  const elapsedSec = totalBlockDurationSec - secondsRemaining;
  const progressPercent = Math.min(100, Math.max(0, (elapsedSec / totalBlockDurationSec) * 100));

  const completedBlocksCount = categoryTasks.filter((t) => t.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between max-h-[92vh] overflow-y-auto"
      >
        {/* Glow ambient background based on category color */}
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: category?.color || '#0082ff' }}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs font-bold"
              style={{ backgroundColor: category?.color || '#0082ff' }}
            >
              <Play size={18} fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {getCategoryTitleTranslated(categoryId, category?.title || 'Category')} {language === 'am' ? 'የትኩረት ክፍለ-ጊዜ' : 'Focus Session'}
                </h2>
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                  style={{ backgroundColor: `${category?.color || '#0082ff'}20`, color: category?.color || '#0082ff' }}
                >
                  {completedBlocksCount}/{categoryTasks.length} {language === 'am' ? 'ተጠናቋል' : 'done'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'am' ? 'ተከታታይ የትኩረት ክፍለ-ጊዜዎች 1 በ 1 ይቆጠራሉ' : 'Running scheduled focus blocks 1 by 1 sequentially'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 size={18} className="text-[#0082ff]" /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close window"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Empty State if category has 0 blocks */}
        {categoryTasks.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-4 relative z-10">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-[#0082ff] flex items-center justify-center">
              <Sparkles size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'am' ? 'ምንም የትኩረት ብሎክ አልተገኘም' : `No focus blocks found for ${category?.title || 'this category'}`}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {language === 'am' 
                  ? 'የመጀመሪያውን የትኩረት ክፍለ-ጊዜ አሁን ይመዝግቡና ቆጣሪውን ያስጀምሩ!' 
                  : 'Add your first focus block below to immediately begin your guided countdown session!'}
              </p>
            </div>

            <form onSubmit={handleCreateAndStartFirstBlock} className="max-w-md mx-auto space-y-3 pt-2">
              <input
                type="text"
                required
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={language === 'am' ? 'የትኩረት ተግባር (ምሳሌ፡ የጣት ልምምድ)...' : 'Focus task (e.g. Finger warmup)...'}
                className="w-full px-4 py-2.5 rounded-2xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 rounded-2xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value={15}>15 minutes</option>
                  <option value={25}>25 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {language === 'am' ? 'ጀምር' : 'Start Focus'}
                </button>
              </div>
            </form>
          </div>
        ) : isSessionComplete ? (
          /* All Blocks Finished Celebration Screen */
          <div className="py-12 px-4 text-center space-y-5 relative z-10 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center shadow-lg border-2 border-emerald-400 animate-bounce">
              <Award size={36} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                🎉 {language === 'am' ? 'ሁሉም የትኩረት ክፍለ-ጊዜዎች ተጠናቀዋል!' : `All ${category?.title || ''} Focus Blocks Completed!`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {language === 'am'
                  ? 'ዛሬ ያቀዷቸው ተግባራት በሙሉ በተሳካ ሁኔታ ተጠናቀዋል፤ በዳታቤዝ ላይ ተመዝግቧል።'
                  : 'Every focus block under this category was completed. Great deliberate execution!'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 max-w-xs mx-auto text-xs font-bold text-emerald-700 dark:text-emerald-300">
              ✓ {categoryTasks.length} / {categoryTasks.length} blocks checked as done
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer"
            >
              {language === 'am' ? 'ክፍለ-ጊዜውን ዝጋ' : 'Finish & Close Session'}
            </button>
          </div>
        ) : (
          /* Main Active Block Runner View */
          <div className="py-6 space-y-6 relative z-10">
            {/* Step Sequence Indicator: Block X of N */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-2">
              <span className="font-mono uppercase tracking-wider">
                {language === 'am' ? `ብሎክ ${activeBlockIndex + 1} ከ ${categoryTasks.length}` : `Block ${activeBlockIndex + 1} of ${categoryTasks.length}`}
              </span>
              <span className="text-[11px] font-mono text-[#0082ff] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                {activeBlock?.startTime || 'Flexible'} • {activeBlock?.durationMin}m
              </span>
            </div>

            {/* Active Task Title Header */}
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeBlock?.title}
              </h1>
              <p className="text-xs text-slate-400">
                {isRunning ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {language === 'am' ? 'ቆጣሪው እየቆጠረ ነው...' : 'Countdown timer active (checks itself when done)'}
                  </span>
                ) : (
                  <span className="text-amber-500 font-semibold">
                    {language === 'am' ? 'ቆሟል (Paused)' : 'Timer paused'}
                  </span>
                )}
              </p>
            </div>

            {/* Large Digital Countdown Timer Display */}
            <div className="py-4 text-center">
              <div className="relative inline-flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-inner">
                <span className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {timeFormatted}
                </span>

                {/* Progress bar underneath the big timer */}
                <div className="w-56 sm:w-72 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${progressPercent}%`, 
                      backgroundColor: category?.color || '#0082ff' 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Play, Pause, Reset Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleResetCurrent}
                className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer active:scale-95"
                title="Restart Block Timer"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={() => setIsRunning(!isRunning)}
                className="px-8 py-4 rounded-2xl text-white font-bold text-sm shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
                style={{ backgroundColor: category?.color || '#0082ff' }}
                title={isRunning ? 'Pause' : 'Resume'}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                <span>{isRunning ? (language === 'am' ? 'አቁም' : 'Pause') : (language === 'am' ? 'ቀጥል' : 'Resume')}</span>
              </button>

              <button
                onClick={handleCompleteCurrentAndNext}
                className="px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Mark this block done and move to next"
              >
                <Check size={16} strokeWidth={3} />
                <span>{language === 'am' ? 'ተጠናቀቀ & ቀጣይ' : 'Done & Next ▶'}</span>
              </button>
            </div>

            {/* Next / Previous Block Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={handlePrevious}
                disabled={activeBlockIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <SkipBack size={13} />
                <span>{language === 'am' ? 'ቀዳሚ ብሎክ' : 'Previous Block'}</span>
              </button>

              <button
                onClick={handleSkipNext}
                disabled={activeBlockIndex >= categoryTasks.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-[#0082ff]"
              >
                <span>{language === 'am' ? 'ዝለል ወደ ቀጣይ' : 'Skip to Next'}</span>
                <SkipForward size={13} />
              </button>
            </div>

            {/* Sequence Playlist Tray of All Category Blocks */}
            <div className="pt-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                {language === 'am' ? 'የብሎኮች ቅደም ተከተል (1 በ 1)' : 'Sequence Queue (1 by 1)'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {categoryTasks.map((t, idx) => {
                  const isCurrent = idx === activeBlockIndex;
                  const isDone = t.completed;

                  return (
                    <div
                      key={t.id}
                      onClick={() => loadBlock(idx)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-blue-50/80 dark:bg-blue-950/60 border-[#0082ff] shadow-xs'
                          : isDone
                          ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 font-bold ${
                          isDone 
                            ? 'bg-emerald-500 text-white' 
                            : isCurrent 
                            ? 'bg-[#0082ff] text-white' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <span className={`truncate ${isDone ? 'line-through' : ''}`}>
                          {t.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {t.durationMin}m
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
