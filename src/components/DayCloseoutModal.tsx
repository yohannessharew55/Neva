import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLivotion } from '../context/LivotionContext';
import { StickyNoteThemeColor, DailyStickyTaskItem } from '../types';
import { gregorianToEthiopian, AMHARIC_DAYS } from '../utils/ethiopianCalendar';

interface DayCloseoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGallery?: () => void;
}

export const DayCloseoutModal: React.FC<DayCloseoutModalProps> = ({
  isOpen,
  onClose,
  onNavigateToGallery
}) => {
  const { tasks, addDailyStickyNote, language } = useLivotion();

  const [ratingStars, setRatingStars] = useState<number>(5);
  const [moodEmoji, setMoodEmoji] = useState<string>('🔥');
  const [winText, setWinText] = useState<string>('');
  const [frictionPoint, setFrictionPoint] = useState<string>('');
  const [tomorrowFocus, setTomorrowFocus] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<StickyNoteThemeColor>('canary');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const now = new Date();
  const eth = gregorianToEthiopian(now);
  const dayNameEn = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDayEn = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dayNameAm = AMHARIC_DAYS[now.getDay()]?.am || '';
  const ethDateStr = `${dayNameAm} • ${eth.monthNameAm} ${eth.day}, ${eth.year}`;

  const completedTasks = tasks.filter((t) => t.completed);
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const loggedHours = Number((completedTasks.reduce((acc, t) => acc + (t.durationMin || 0), 0) / 60).toFixed(1));
  const targetHours = Number((tasks.reduce((acc, t) => acc + (t.durationMin || 0), 0) / 60).toFixed(1));

  const moodOptions = ['🔥', '⚡', '🎯', '🧘', '🏆', '✨', '☕'];
  const colorOptions: { id: StickyNoteThemeColor; bg: string; label: string }[] = [
    { id: 'canary', bg: '#fef08a', label: 'Yellow' },
    { id: 'peach', bg: '#fed7aa', label: 'Peach' },
    { id: 'mint', bg: '#bbf7d0', label: 'Mint' },
    { id: 'sky', bg: '#bae6fd', label: 'Sky' },
    { id: 'rose', bg: '#fecdd3', label: 'Rose' },
    { id: 'lavender', bg: '#e9d5ff', label: 'Lavender' }
  ];

  const handleSaveCloseout = (e: React.FormEvent) => {
    e.preventDefault();

    const todayIso = now.toISOString().split('T')[0];
    const mappedTasks: DailyStickyTaskItem[] = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      startTime: t.startTime,
      durationMin: t.durationMin,
      completed: t.completed,
      category: t.domain
    }));

    addDailyStickyNote({
      dateStr: todayIso,
      dayName: dayNameEn,
      ethiopianDateStr: ethDateStr,
      ratingStars,
      colorTheme: selectedColor,
      moodEmoji,
      summaryReview: winText.trim() ? winText.trim() : (language === 'am' ? 'የዛሬ የታቀዱ ተግባራት ተጠናቀዋል' : 'Completed scheduled execution for the day.'),
      wins: winText.trim() ? [winText.trim()] : [language === 'am' ? 'የዛሬ የትኩረት ክፍለ-ጊዜያት' : 'Consistent execution of today\'s priorities'],
      frictionPoints: frictionPoint.trim() || undefined,
      tomorrowFocus: tomorrowFocus.trim() || undefined,
      focusHoursLogged: loggedHours,
      totalTargetHours: targetHours,
      tasks: mappedTasks
    });

    try {
      localStorage.setItem('livotion_last_closeout_date', todayIso);
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {}

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
      if (onNavigateToGallery) {
        onNavigateToGallery();
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0082ff]/10 text-[#0082ff] uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} />
                {language === 'am' ? 'የዕለቱ ማጠቃለያ' : '60-SECOND RECEIPT'}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {dayNameEn}, {monthDayEn}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {language === 'am' ? 'የቀኑን ስራ ዝጋ' : 'Close Out Today'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {isSaved ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የዕለቱ ማጠቃለያ ተመዝግቧል!' : 'Day Successfully Closed!'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              {language === 'am' ? 'የተመዘገበው ማስታወሻ ወደ ጋለሪ ታክሏል።' : 'Your evening receipt has been pinned to the Sticky Gallery.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveCloseout} className="mt-4 space-y-4">
            
            {/* Today's Score Summary Pill */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#0082ff]">
                  {completedTasks.length}/{totalTasks}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {language === 'am' ? 'ተግባራት ተጠናቀዋል' : 'tasks completed'} ({progressPercent}%)
                </span>
              </div>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {loggedHours}h / {targetHours}h {language === 'am' ? 'ተመዝግቧል' : 'logged'}
              </span>
            </div>

            {/* 1. Star Rating & Mood */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === 'am' ? 'የዕለቱ ደረጃ (1-5 ኮከብ)' : 'Execution Rating'}
                </label>
                <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      className="p-1 transition hover:scale-110 cursor-pointer"
                    >
                      <Star
                        size={20}
                        className={star <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === 'am' ? 'የቀኑ ስሜት' : 'State / Mood'}
                </label>
                <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {moodOptions.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setMoodEmoji(emoji)}
                      className={`w-7 h-7 rounded-xl text-base flex items-center justify-center transition cursor-pointer ${
                        moodEmoji === emoji ? 'bg-white dark:bg-slate-800 shadow-xs scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. #1 Win of the Day */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {language === 'am' ? 'የዕለቱ ዋና ድል / ውጤት' : '#1 Victory / Main Win'}
              </label>
              <input
                type="text"
                value={winText}
                onChange={(e) => setWinText(e.target.value)}
                placeholder={language === 'am' ? 'ዛሬ ምን ትልቅ ነገር አከናወኑ?' : 'e.g. Mastered guitar chord transition & completed 90m deep work'}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#0082ff] transition"
              />
            </div>

            {/* 3. Tomorrow's #1 Focus */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {language === 'am' ? 'የነገ የመጀመሪያ ትኩረት' : "Tomorrow's Priority Focus"}
              </label>
              <input
                type="text"
                value={tomorrowFocus}
                onChange={(e) => setTomorrowFocus(e.target.value)}
                placeholder={language === 'am' ? 'ነገ ጠዋት ቅድሚያ የሚሰጠው ስራ' : 'e.g. 7:00 AM workout + complete architectural design draft'}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#0082ff] transition"
              />
            </div>

            {/* 4. Sticky Note Color Theme */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {language === 'am' ? 'የማስታወሻ ቀለም' : 'Sticky Receipt Color'}
              </label>
              <div className="flex items-center gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                      selectedColor === c.id ? 'ring-2 ring-[#0082ff] ring-offset-2 scale-105' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.bg }}
                    title={c.label}
                  >
                    {selectedColor === c.id && <span className="text-[10px] text-slate-900 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {language === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span>{language === 'am' ? 'በጋለሪ አስቀምጥ' : 'Pin to Sticky Gallery'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
