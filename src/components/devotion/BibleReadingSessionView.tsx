import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Play, Pause, RotateCcw, Check, Clock, 
  Calendar, Flame, Sparkles, Plus, Trash2, Volume2, VolumeX,
  ChevronDown, ChevronUp, BookMarked
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BIBLE_BOOKS, BibleBook, BibleReadingSession } from '../../data/bibleData';
import { soundEngine } from '../../utils/audio';
import { mobileTimerEngine } from '../../utils/mobileTimerEngine';

interface BibleReadingSessionViewProps {
  language: string;
  onLogDevotionSession: (durationMinutes: number, title: string, notes?: string) => void;
}

export const BibleReadingSessionView: React.FC<BibleReadingSessionViewProps> = ({
  language,
  onLogDevotionSession
}) => {
  // Reading Plan / Selection
  const [selectedBook, setSelectedBook] = useState<string>('John');
  const [chapterStart, setChapterStart] = useState<number>(1);
  const [chapterEnd, setChapterEnd] = useState<number>(3);
  const [readingNotes, setReadingNotes] = useState<string>('');

  // Timer states
  const [timerMinutes, setTimerMinutes] = useState<number>(20);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isAmbienceEnabled, setIsAmbienceEnabled] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('neva_collapse_devotion_reading_session') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('neva_collapse_devotion_reading_session', String(next));
        soundEngine.playPencil();
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handler = (e: any) => {
      if (typeof e.detail?.collapsed === 'boolean') {
        setIsCollapsed(e.detail.collapsed);
      }
    };
    window.addEventListener('neva-toggle-all-devotion-sections', handler);
    return () => window.removeEventListener('neva-toggle-all-devotion-sections', handler);
  }, []);

  // Past Reading Sessions stored in localStorage
  const [readingSessions, setReadingSessions] = useState<BibleReadingSession[]>(() => {
    try {
      const saved = localStorage.getItem('livotion_bible_reading_sessions_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'read-1',
        date: new Date().toISOString().split('T')[0],
        book: 'John',
        chapterStart: 1,
        chapterEnd: 3,
        durationMinutes: 25,
        notes: 'The Word became flesh; grace and truth through Jesus Christ.',
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'read-2',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        book: 'Psalms',
        chapterStart: 23,
        chapterEnd: 24,
        durationMinutes: 20,
        notes: 'The Lord is my shepherd. The earth is the Lord’s and the fullness thereof.',
        completedAt: '08:30 AM'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('livotion_bible_reading_sessions_v1', JSON.stringify(readingSessions));
    } catch (e) {}
  }, [readingSessions]);

  const targetEndTimeRef = useRef<number | null>(null);

  // Timer Countdown logic with timestamp accuracy & wake-lock & Little Window/Lockscreen sync
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && secondsRemaining > 0) {
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;

      // Broadcast to mobileTimerEngine for Floating Little Window, PiP & Lock Screen
      mobileTimerEngine.startCountdown({
        durationSeconds: timerMinutes * 60,
        initialRemainingSeconds: secondsRemaining,
        taskTitle: `${selectedBook} ${chapterStart}-${chapterEnd} Reading`,
        category: 'devotion',
        system: 'bible-reading',
        phase: 'focus',
        onComplete: () => {
          setIsRunning(false);
          setIsCompleted(true);
        },
      });

      const syncTime = () => {
        if (!targetEndTimeRef.current) return;
        const diff = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
        setSecondsRemaining(diff);
        setElapsedSeconds(Math.max(0, (timerMinutes * 60) - diff));

        if (diff <= 0) {
          targetEndTimeRef.current = null;
          setIsRunning(false);
          setIsCompleted(true);
          try {
            soundEngine.playSound('CHIME_MEDITATION');
            confetti({ particleCount: 60, spread: 70 });
          } catch (e) {}
        }
      };

      interval = setInterval(syncTime, 1000);

      const handleVis = () => {
        if (document.visibilityState === 'visible') {
          syncTime();
        }
      };
      document.addEventListener('visibilitychange', handleVis);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVis);
      };
    } else {
      targetEndTimeRef.current = null;
      if (mobileTimerEngine.getState().system === 'bible-reading') {
        mobileTimerEngine.pause();
      }
    }
  }, [isRunning, timerMinutes, selectedBook, chapterStart, chapterEnd]);

  const setPreset = (mins: number) => {
    setTimerMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
    setIsCompleted(false);
    setElapsedSeconds(0);
    if (mobileTimerEngine.getState().system === 'bible-reading') {
      mobileTimerEngine.stop();
    }
  };

  const toggleTimer = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(timerMinutes * 60);
      setIsCompleted(false);
      setElapsedSeconds(0);
    }
    setIsRunning((prev) => !prev);
    try { soundEngine.playPencil(); } catch (e) {}
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(timerMinutes * 60);
    setIsCompleted(false);
    setElapsedSeconds(0);
    if (mobileTimerEngine.getState().system === 'bible-reading') {
      mobileTimerEngine.stop();
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find book details
  const activeBookObj = BIBLE_BOOKS.find((b) => b.nameEn === selectedBook) || BIBLE_BOOKS[0];

  const handleFinishAndLog = () => {
    const duration = Math.max(1, Math.round(elapsedSeconds > 0 ? elapsedSeconds / 60 : timerMinutes));
    const title = `${selectedBook} ${chapterStart}${chapterEnd > chapterStart ? `-${chapterEnd}` : ''}`;
    
    const newSession: BibleReadingSession = {
      id: `read-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      book: selectedBook,
      chapterStart,
      chapterEnd,
      durationMinutes: duration,
      notes: readingNotes.trim() || undefined,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setReadingSessions([newSession, ...readingSessions]);
    onLogDevotionSession(duration, `Bible Reading: ${title}`, readingNotes.trim());

    setIsRunning(false);
    setIsCompleted(true);
    setReadingNotes('');
    resetTimer();

    try {
      soundEngine.playSound('CHIME_MEDITATION');
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    alert(language === 'am' 
      ? `የመጽሐፍ ቅዱስ ንባብ ተመዝግቧል! (${title} • ${duration} ደቂቃ)` 
      : `Bible Reading Logged! (${title} • ${duration} mins) credited to Devotion weekly hours.`
    );
  };

  const handleDeleteSession = (id: string) => {
    if (confirm(language === 'am' ? 'ይህንን የንባብ ክፍለ-ጊዜ ማጥፋት ይፈልጋሉ?' : 'Remove this reading record?')) {
      setReadingSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Metrics
  const totalReadingMinutes = readingSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalReadingHours = (totalReadingMinutes / 60).toFixed(1);
  const totalChaptersRead = readingSessions.reduce((sum, s) => sum + Math.max(1, s.chapterEnd - s.chapterStart + 1), 0);

  return (
    <div className="w-full bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all duration-300">
      {/* Unified Card Header */}
      <div 
        onClick={toggleCollapse}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-[#a855f7] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <BookOpen size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'የመጽሐፍ ቅዱስ ንባብ ክፍለ-ጊዜ' : 'Bible Reading Session & Immersion'}
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-[#a855f7] border border-purple-200/80 dark:border-purple-900/40 shrink-0">
                {selectedBook} {chapterStart}{chapterEnd > chapterStart ? `-${chapterEnd}` : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {isCollapsed ? `${timerMinutes}m immersion timer • ${totalChaptersRead} chapters read (${totalReadingHours}h logged)` : (language === 'am' ? 'የቅዱሳት መጻሕፍት ንባብ ጊዜን መመደብና የንባብ እድገትን መከታተል' : 'Dedicated Scripture reading timer and automatic tracking')}
            </p>
          </div>
        </div>

        {/* Live Reading Metrics Counter & Expand/Collapse Icon */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-2 text-xs font-bold">
            <Flame size={14} className="text-amber-500" />
            <span className="text-slate-600 dark:text-slate-300">
              {totalChaptersRead} {language === 'am' ? 'ምዕራፎች' : 'Chapters'}
            </span>
            <span className="opacity-30">•</span>
            <span className="text-purple-600 dark:text-purple-400 font-mono">
              {totalReadingHours}h
            </span>
          </div>

          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
            title={isCollapsed ? (language === 'am' ? 'ዘርጋ' : 'Expand Section') : (language === 'am' ? 'ሰብስብ' : 'Collapse Section')}
          >
            {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
          </button>
        </div>
      </div>

      {/* Card Content (Only visible when expanded) */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 space-y-6">
          {/* Main Grid: Reading Setup & Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Passage Selector & Notes (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookMarked size={17} className="text-[#a855f7]" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {language === 'am' ? 'የንባብ ክፍል ምረጥ' : 'Select Book & Chapters'}
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#a855f7]">
              {activeBookObj.testament === 'OT' 
                ? (language === 'am' ? 'ብሉይ ኪዳን' : 'Old Testament') 
                : (language === 'am' ? 'አዲስ ኪዳን' : 'New Testament')}
            </span>
          </div>

          {/* Book Dropdown & Chapters Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Book Selector (6 cols) */}
            <div className="sm:col-span-6 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'መጽሐፍ' : 'Book of Bible'}
              </label>
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setChapterStart(1);
                  setChapterEnd(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7] cursor-pointer"
              >
                <optgroup label={language === 'am' ? 'አዲስ ኪዳን (New Testament)' : 'New Testament'}>
                  {BIBLE_BOOKS.filter((b) => b.testament === 'NT').map((b) => (
                    <option key={b.nameEn} value={b.nameEn}>
                      {b.nameEn} ({b.nameAm}) • {b.chapters} ch
                    </option>
                  ))}
                </optgroup>
                <optgroup label={language === 'am' ? 'ብሉይ ኪዳን (Old Testament)' : 'Old Testament'}>
                  {BIBLE_BOOKS.filter((b) => b.testament === 'OT').map((b) => (
                    <option key={b.nameEn} value={b.nameEn}>
                      {b.nameEn} ({b.nameAm}) • {b.chapters} ch
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Chapter Start (3 cols) */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'ከምዕራፍ' : 'From Ch.'}
              </label>
              <input
                type="number"
                min={1}
                max={activeBookObj.chapters}
                value={chapterStart}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(activeBookObj.chapters, Number(e.target.value)));
                  setChapterStart(val);
                  if (chapterEnd < val) setChapterEnd(val);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-center text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
              />
            </div>

            {/* Chapter End (3 cols) */}
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {language === 'am' ? 'እስከ ምዕራፍ' : 'To Ch.'}
              </label>
              <input
                type="number"
                min={chapterStart}
                max={activeBookObj.chapters}
                value={chapterEnd}
                onChange={(e) => {
                  const val = Math.max(chapterStart, Math.min(activeBookObj.chapters, Number(e.target.value)));
                  setChapterEnd(val);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold text-center text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
              />
            </div>
          </div>

          {/* Quick Reflection Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {language === 'am' ? 'የንባብ ማስታወሻና ማሰላሰል' : 'Key Scripture Verse & Reflection'}
            </label>
            <textarea
              rows={2}
              value={readingNotes}
              onChange={(e) => setReadingNotes(e.target.value)}
              placeholder={
                language === 'am'
                  ? 'በዚህ ንባብ ልብህ የነካው ቃል ወይም አጭር ማስታወሻ ጻፍ...'
                  : 'Write a verse that touched your spirit or key reflection from these chapters...'
              }
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
            />
          </div>

          {/* Passage Target Banner */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <div>
                <p className="text-xs font-black text-purple-950 dark:text-purple-100">
                  {selectedBook} {chapterStart}{chapterEnd > chapterStart ? `-${chapterEnd}` : ''} ({activeBookObj.nameAm})
                </p>
                <p className="text-[10px] text-purple-700 dark:text-purple-300">
                  {Math.max(1, chapterEnd - chapterStart + 1)} {language === 'am' ? 'ምዕራፎች ለዛሬ የታቀደ' : 'chapter(s) scheduled for this session'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishAndLog}
              className="px-4 py-2 bg-[#a855f7] hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{language === 'am' ? 'ንባቡን ጨርሼ መዝግብ' : 'Log Reading'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Immersive Reading Timer (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 text-center space-y-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-[#a855f7]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {language === 'am' ? 'የንባብ ቆጣሪ' : 'Reading Session Timer'}
              </span>
            </div>

            {/* Solfeggio / Ambient Chime Toggle */}
            <button
              onClick={() => {
                const next = !isAmbienceEnabled;
                setIsAmbienceEnabled(next);
                if (next) {
                  try { soundEngine.playSound('CHIME_MEDITATION'); } catch (e) {}
                }
              }}
              className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                isAmbienceEnabled 
                  ? 'bg-purple-100 text-[#a855f7] dark:bg-purple-950' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Ambience bell sound on start/complete"
            >
              {isAmbienceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span className="text-[10px]">{language === 'am' ? 'ደውል' : 'Bell'}</span>
            </button>
          </div>

          {/* Time Presets */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {[15, 20, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => setPreset(mins)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  timerMinutes === mins && !isRunning
                    ? 'bg-[#a855f7] text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Large Countdown Display */}
          <div className="py-2">
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-[#30d158] drop-shadow-[0_2px_12px_rgba(48,209,88,0.35)]">
              {formatTime(secondsRemaining)}
            </div>
            <p className="text-xs text-[#30d158]/80 font-semibold mt-2">
              {isRunning
                ? (language === 'am' ? 'የእግዚአብሔርን ቃል በጸጥታ እያነበቡ ነው...' : 'Immersed in holy Scripture...')
                : isCompleted
                ? (language === 'am' ? 'የንባብ ክፍለ-ጊዜ ተጠናቋል!' : 'Reading session goal reached!')
                : (language === 'am' ? 'ንባብ ለመጀመር ጀምርን ይጫኑ' : 'Press start to begin reading')}
            </p>
          </div>

          {/* Timer Buttons */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={toggleTimer}
              className={`px-6 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer transition shadow-xs active:scale-95 ${
                isRunning
                  ? 'bg-[#30d158] hover:bg-[#28b84d] text-slate-950'
                  : 'bg-[#30d158]/20 hover:bg-[#30d158]/30 text-[#30d158] border border-[#30d158]/40'
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              <span>{isRunning ? (language === 'am' ? 'አፍታ አቁም' : 'Pause') : (language === 'am' ? 'ጀምር' : 'Start')}</span>
            </button>

            <button
              onClick={resetTimer}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Reset"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reading Sessions History */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#a855f7]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'am' ? 'የቅርብ ጊዜ የንባብ ታሪክ' : 'Recent Reading Sessions'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {readingSessions.length} {language === 'am' ? 'ተመዝግበዋል' : 'records'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {readingSessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 space-y-2 relative group/record"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📖</span>
                  <span>{session.book} {session.chapterStart}{session.chapterEnd > session.chapterStart ? `-${session.chapterEnd}` : ''}</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  {session.durationMinutes} min
                </span>
              </div>

              {session.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">
                  "{session.notes}"
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                <span>{session.date} • {session.completedAt}</span>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="opacity-0 group-hover/record:opacity-100 hover:text-rose-500 transition cursor-pointer p-1"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
  );
};
