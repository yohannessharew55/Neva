import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Heart, Sparkles, CheckCircle2, Square, 
  Play, Pause, RotateCcw, Plus, Trash2, Check, 
  Volume2, Flame, Sun, Moon, Sunrise, Clock, Star,
  Share2, BookmarkCheck, Shield, ChevronRight, Pencil, X
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { soundEngine } from '../utils/audio';

interface PrayerIntention {
  id: string;
  title: string;
  category: 'thanksgiving' | 'intercession' | 'guidance' | 'healing';
  answered: boolean;
  dateAdded: string;
}

interface DailyRhythmItem {
  id: string;
  timeSlot: 'morning' | 'midday' | 'evening' | 'anytime';
  titleEn: string;
  titleAm: string;
  durationMinutes: number;
  descriptionEn: string;
  descriptionAm: string;
  completed: boolean;
}

const SCRIPTURE_VERSES = [
  {
    refEn: 'Psalm 23:1-3',
    refAm: 'መዝሙረ ዳዊት 23:1-3',
    textEn: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
    textAm: 'እግዚአብሔር እረኛዬ ነው፥ የሚያሳጣኝም የለም። በለመለመ መስክ ያሳድረኛል፤ በዕረፍት ውኃ ዘንድ ይመራኛል። ነፍሴን መለሳት።',
    theme: 'Peace & Provision'
  },
  {
    refEn: 'Proverbs 3:5-6',
    refAm: 'ምሳሌ 3:5-6',
    textEn: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge Him, and He will make straight your paths.',
    textAm: 'በፍጹም ልብህ በእግዚአብሔር ታመን፥ በራስህም ማስተዋል አትደገፍ፤ በመንገድህ ሁሉ እርሱን እወቅ፥ እርሱም ጎዳናህን ያቀናልሃል።',
    theme: 'Trust & Guidance'
  },
  {
    refEn: 'Philippians 4:6-7',
    refAm: 'ፊልጵስዩስ 4:6-7',
    textEn: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts.',
    textAm: 'በነገር ሁሉ በጸሎትና በምልጃ ከምስጋና ጋር በእግዚአብሔር ዘንድ ልመናችሁን አስታውቁ እንጂ በአንዳች አትጨነቁ። አእምሮንም ሁሉ የሚያልፍ የእግዚአብሔር ሰላም ልባችሁን ይጠብቃል።',
    theme: 'Peace & Prayer'
  },
  {
    refEn: 'Isaiah 40:31',
    refAm: 'ኢሳይያስ 40:31',
    textEn: 'Those who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.',
    textAm: 'እግዚአብሔርን በመተማመን የሚጠባበቁ ግን ኃይላቸውን ያድሳሉ፤ እንደ ንስር በክንፍ ይወጣሉ፤ ይሮጣሉ፥ አይታክቱም፤ ይሄዳሉ፥ አይደክሙም።',
    theme: 'Strength & Renewal'
  },
  {
    refEn: 'Romans 12:2',
    refAm: 'ሮሜ 12:2',
    textEn: 'Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.',
    textAm: 'የእግዚአብሔር ፈቃድ እርሱም መልካምና ደስ የሚያሰኝ ፍጹምም የሆነው ነገር ምን እንደ ሆነ ፈትናችሁ ታውቁ ዘንድ በልባችሁ መታደስ ተለወጡ እንጂ ይህን ዓለም አትምሰሉ።',
    theme: 'Mind Renewal'
  }
];

const DEFAULT_RHYTHMS: DailyRhythmItem[] = [
  {
    id: 'rhythm-morning',
    timeSlot: 'morning',
    titleEn: 'Dawn Gratitude & Word Meditation',
    titleAm: 'የንጋት ምስጋናና የቃሉ ማሰላሰል',
    durationMinutes: 20,
    descriptionEn: 'Give thanks for life, read today\'s scripture chapter, and dedicate day\'s focus to God.',
    descriptionAm: 'ለተሰጠው አዲስ ቀን ማመስገን፣ የዕለቱን ምዕራፍ ማንበብና የዕለቱን ስራ ለእግዚአብሔር አደራ መስጠት።',
    completed: false
  },
  {
    id: 'rhythm-midday',
    timeSlot: 'midday',
    titleEn: 'Midday Sacred Pause & Centering',
    titleAm: 'የቀትር ጸጥታና የመንፈስ ማደስ',
    durationMinutes: 10,
    descriptionEn: 'Pause active work. Breathe deep, reset priorities, and reaffirm humility & grace.',
    descriptionAm: 'ከስራ ጫና ጥቂት ቆም ማለት፣ ትንፋሽ መውሰድና በትዕግስትና በሰላም ልብን ማደስ።',
    completed: false
  },
  {
    id: 'rhythm-evening',
    timeSlot: 'evening',
    titleEn: 'Evening Examen & Peaceful Surrender',
    titleAm: 'የማታ ቆጠራና የሰላም ጸሎት',
    durationMinutes: 15,
    descriptionEn: 'Review the day\'s blessings, release stress, forgive offenses, and rest in Divine peace.',
    descriptionAm: 'የቀኑን በረከቶች ማሰብ፣ ጭንቀትንና ቂምን ማራገፍ እና በሰላም እንቅልፍ ማረፍ።',
    completed: false
  }
];

export const DevotionProtocolView: React.FC = () => {
  const { language, categoryPlans, logSession } = useLivotion();
  const devotionCategory = categoryPlans['devotion'];

  // Current Verse Index
  const [verseIndex, setVerseIndex] = useState<number>(0);

  // Contemplative Timer State
  const [timerMinutes, setTimerMinutes] = useState<number>(10);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);

  // Daily Rhythms checklist with local storage persistence
  const [rhythms, setRhythms] = useState<DailyRhythmItem[]>(() => {
    const saved = localStorage.getItem('livotion_devotion_rhythms_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_RHYTHMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('livotion_devotion_rhythms_v1', JSON.stringify(rhythms));
    } catch (e) {}
  }, [rhythms]);

  // Devotion Protocol Modal State (Edit & Create)
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<DailyRhythmItem | null>(null);
  const [protocolForm, setProtocolForm] = useState({
    title: '',
    durationMinutes: 15,
    timeSlot: 'morning' as 'morning' | 'midday' | 'evening' | 'anytime',
    description: ''
  });

  const handleOpenAddProtocol = () => {
    setEditingProtocol(null);
    setProtocolForm({
      title: '',
      durationMinutes: 15,
      timeSlot: 'morning',
      description: ''
    });
    setIsProtocolModalOpen(true);
  };

  const handleOpenEditProtocol = (item: DailyRhythmItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProtocol(item);
    setProtocolForm({
      title: language === 'am' ? (item.titleAm || item.titleEn) : item.titleEn,
      durationMinutes: item.durationMinutes || 15,
      timeSlot: item.timeSlot || 'morning',
      description: language === 'am' ? (item.descriptionAm || item.descriptionEn) : item.descriptionEn
    });
    setIsProtocolModalOpen(true);
  };

  const handleDeleteProtocol = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(language === 'am' ? 'ይህን የጸሎት ፕሮቶኮል ማጥፋት ይፈልጋሉ?' : 'Delete this devotion protocol?')) {
      setRhythms((prev) => prev.filter((r) => r.id !== id));
      if (editingProtocol?.id === id) {
        setIsProtocolModalOpen(false);
        setEditingProtocol(null);
      }
    }
  };

  const handleResetDefaultProtocols = () => {
    if (confirm(language === 'am' ? 'ፕሮቶኮሎችን ወደ ነባሪ ቅንብር መመለስ ይፈልጋሉ?' : 'Reset protocols to default recommendations?')) {
      setRhythms(DEFAULT_RHYTHMS);
    }
  };

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolForm.title.trim()) return;

    if (editingProtocol) {
      setRhythms((prev) =>
        prev.map((r) =>
          r.id === editingProtocol.id
            ? {
                ...r,
                titleEn: protocolForm.title.trim(),
                titleAm: language === 'am' ? protocolForm.title.trim() : (r.titleAm || protocolForm.title.trim()),
                durationMinutes: Number(protocolForm.durationMinutes) || 15,
                timeSlot: protocolForm.timeSlot,
                descriptionEn: protocolForm.description.trim() || 'Daily sacred contemplation and prayer.',
                descriptionAm: language === 'am' ? protocolForm.description.trim() : (r.descriptionAm || protocolForm.description.trim())
              }
            : r
        )
      );
    } else {
      const newProtocol: DailyRhythmItem = {
        id: `rhythm-${Date.now()}`,
        timeSlot: protocolForm.timeSlot,
        titleEn: protocolForm.title.trim(),
        titleAm: protocolForm.title.trim(),
        durationMinutes: Number(protocolForm.durationMinutes) || 15,
        descriptionEn: protocolForm.description.trim() || 'Daily sacred contemplation and prayer.',
        descriptionAm: protocolForm.description.trim() || 'የዕለት የጸሎትና የማሰላሰል ክፍለ-ጊዜ።',
        completed: false
      };
      setRhythms((prev) => [...prev, newProtocol]);
    }

    setIsProtocolModalOpen(false);
    setEditingProtocol(null);
  };

  // Prayer Intentions List
  const [prayers, setPrayers] = useState<PrayerIntention[]>(() => {
    const saved = localStorage.getItem('livotion_devotion_prayers_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'p-1',
        title: 'Wisdom, clarity and excellence in my craft & daily execution',
        category: 'guidance',
        answered: false,
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        id: 'p-2',
        title: 'Health, protection and boundless peace over family & loved ones',
        category: 'intercession',
        answered: false,
        dateAdded: new Date().toISOString().split('T')[0]
      },
      {
        id: 'p-3',
        title: 'Gratitude for resilience, discipline, and daily provision',
        category: 'thanksgiving',
        answered: true,
        dateAdded: new Date().toISOString().split('T')[0]
      }
    ];
  });

  const [newPrayerText, setNewPrayerText] = useState('');
  const [newPrayerCategory, setNewPrayerCategory] = useState<'thanksgiving' | 'intercession' | 'guidance' | 'healing'>('guidance');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'answered'>('all');

  // Persist rhythms
  useEffect(() => {
    localStorage.setItem('livotion_devotion_rhythms_v1', JSON.stringify(rhythms));
  }, [rhythms]);

  // Persist prayers
  useEffect(() => {
    localStorage.setItem('livotion_devotion_prayers_v1', JSON.stringify(prayers));
  }, [prayers]);

  // Contemplative Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setTimerCompleted(true);
            try {
              soundEngine.playPencil();
            } catch (e) {}
            // Automatically log devotion practice session
            if (timerMinutes > 0) {
              logSession({
                categoryId: 'devotion',
                title: 'Contemplative Prayer & Meditation',
                durationMinutes: timerMinutes,
                notes: 'Completed dedicated spiritual silence & prayer session'
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining, timerMinutes, logSession]);

  const setTimerPreset = (minutes: number) => {
    setTimerMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setIsTimerRunning(false);
    setTimerCompleted(false);
  };

  const toggleTimer = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(timerMinutes * 60);
      setTimerCompleted(false);
    }
    setIsTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setSecondsRemaining(timerMinutes * 60);
    setTimerCompleted(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRhythm = (id: string) => {
    setRhythms((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = !r.completed;
          if (updated) {
            try {
              soundEngine.playPencil();
            } catch (e) {}
          }
          return { ...r, completed: updated };
        }
        return r;
      })
    );
  };

  const addPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayerText.trim()) return;
    const newP: PrayerIntention = {
      id: `p-${Date.now()}`,
      title: newPrayerText.trim(),
      category: newPrayerCategory,
      answered: false,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setPrayers([newP, ...prayers]);
    setNewPrayerText('');
    try {
      soundEngine.playPencil();
    } catch (e) {}
  };

  const togglePrayerAnswered = (id: string) => {
    setPrayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const next = !p.answered;
          if (next) {
            try {
              soundEngine.playPencil();
            } catch (e) {}
          }
          return { ...p, answered: next };
        }
        return p;
      })
    );
  };

  const deletePrayer = (id: string) => {
    setPrayers((prev) => prev.filter((p) => p.id !== id));
  };

  const currentVerse = SCRIPTURE_VERSES[verseIndex];
  const nextVerse = () => {
    setVerseIndex((prev) => (prev + 1) % SCRIPTURE_VERSES.length);
  };

  const completedRhythmsCount = rhythms.filter((r) => r.completed).length;
  const filteredPrayers = prayers.filter((p) => {
    if (filterMode === 'active') return !p.answered;
    if (filterMode === 'answered') return p.answered;
    return true;
  });

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-[#a855f7] flex items-center justify-center font-bold shadow-xs">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {language === 'am' ? 'የዕለት ጸሎትና መንፈሳዊ ህይወት' : 'Devotion & Prayer'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {language === 'am' 
                  ? 'መንፈሳዊ ጽናት፣ የጸሎት ሰዓትና የቅዱስ ቃሉ ማሰላሰል' 
                  : 'Spiritual grounding, scripture reflection, and contemplative stillness.'}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Devotion Target Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#121927] border border-purple-200 dark:border-purple-900/60 px-4 py-2.5 rounded-2xl shadow-xs self-start sm:self-auto">
          <Sparkles size={18} className="text-[#a855f7]" />
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">
              {language === 'am' ? 'የሳምንቱ ኢላማ' : 'Weekly Pillar Target'}
            </div>
            <div className="text-xs font-black text-slate-800 dark:text-slate-100">
              {devotionCategory ? `${devotionCategory.currentWeeklyHours || 0} / ${devotionCategory.weeklyTargetHours}h` : '5.0h Target'}
            </div>
          </div>
        </div>
      </div>

      {/* Scripture Verse of the Day Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BookOpen size={160} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-purple-300" />
              {language === 'am' ? 'የዕለቱ የቅዱስ ቃል ቃልኪዳን' : 'Daily Word & Promise'} • {currentVerse.theme}
            </span>
            <button
              onClick={nextVerse}
              className="text-xs font-bold text-purple-200 hover:text-white px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-1"
            >
              <span>{language === 'am' ? 'ቀጣይ ቃል' : 'Next Verse'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <blockquote className="text-lg sm:text-xl md:text-2xl font-serif italic text-purple-50 leading-relaxed">
            "{language === 'am' ? currentVerse.textAm : currentVerse.textEn}"
          </blockquote>

          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm font-bold tracking-wide text-purple-300">
              — {language === 'am' ? currentVerse.refAm : currentVerse.refEn}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Daily Rhythms & Contemplative Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Daily Spiritual Rhythms (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#a855f7]" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'am' ? 'የዕለት የጸሎት ፕሮቶኮል' : 'Daily Devotion Protocols'}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {completedRhythmsCount} / {rhythms.length} {language === 'am' ? 'ተጠናቋል' : 'done'}
              </span>
              <button
                type="button"
                onClick={handleOpenAddProtocol}
                className="px-2.5 py-1 bg-[#a855f7] hover:bg-purple-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                title={language === 'am' ? 'አዲስ ፕሮቶኮል ጨምር' : 'Add New Protocol'}
              >
                <Plus size={13} />
                <span>{language === 'am' ? 'አዲስ' : 'Add New'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefaultProtocols}
                className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition cursor-pointer"
                title={language === 'am' ? 'ወደ ነባሪ መልስ' : 'Reset to default protocols'}
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {rhythms.map((rhythm) => {
              const isMorning = rhythm.timeSlot === 'morning';
              const isMidday = rhythm.timeSlot === 'midday';
              const isEvening = rhythm.timeSlot === 'evening';
              const Icon = isMorning ? Sunrise : isMidday ? Sun : isEvening ? Moon : Clock;
              const iconColor = isMorning ? 'text-amber-500' : isMidday ? 'text-blue-500' : isEvening ? 'text-indigo-400' : 'text-purple-500';

              return (
                <div
                  key={rhythm.id}
                  onClick={() => toggleRhythm(rhythm.id)}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    rhythm.completed
                      ? 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50 opacity-90'
                      : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 shadow-xs'
                  }`}
                >
                  <button 
                    type="button" 
                    className="mt-0.5 text-purple-600 dark:text-purple-400 shrink-0 cursor-pointer"
                  >
                    {rhythm.completed ? (
                      <CheckCircle2 size={22} className="text-[#a855f7] fill-purple-100 dark:fill-purple-950" />
                    ) : (
                      <Square size={22} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon size={16} className={iconColor} />
                      <span className={`text-sm font-bold ${
                        rhythm.completed 
                          ? 'line-through text-slate-500 dark:text-slate-400' 
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {language === 'am' ? rhythm.titleAm : rhythm.titleEn}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        ({rhythm.durationMinutes} min)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {language === 'am' ? rhythm.descriptionAm : rhythm.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditProtocol(rhythm, e)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition cursor-pointer"
                      title={language === 'am' ? 'አስተካክል' : 'Edit protocol'}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProtocol(rhythm.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                      title={language === 'am' ? 'አጥፋ' : 'Delete protocol'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action: Log Prayer into Devotion Pillar */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Shield size={18} className="text-[#a855f7]" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'am' ? 'የጸሎት ሰዓት መመዝገቢያ' : 'Log Spiritual Practice'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'am' ? '30 ደቂቃ ወደ ሳምንታዊ የጸሎት ኢላማ ጨምር' : 'Add 30 minutes to weekly Devotion target'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logSession({
                  categoryId: 'devotion',
                  title: 'Daily Devotion & Scripture Study',
                  durationMinutes: 30,
                  notes: 'Completed daily spiritual scripture study & prayer'
                });
                try {
                  soundEngine.playPencil();
                } catch (e) {}
                alert(language === 'am' ? '30 ደቂቃ በጸሎት ክፍል ተመዝግቧል!' : '30 minutes logged to Devotion & Prayer!');
              }}
              className="px-3.5 py-1.5 bg-[#a855f7] hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs shrink-0"
            >
              + 30m
            </button>
          </div>
        </div>

        {/* Right Column: Contemplative Prayer & Silence Timer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-[#a855f7]" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {language === 'am' ? 'የጸጥታና የተመስጦ ሰዓት' : 'Contemplative Prayer Timer'}
            </h2>
          </div>

          <div className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 text-center space-y-5 shadow-xs">
            {/* Presets */}
            <div className="flex items-center justify-center gap-1.5">
              {[5, 10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setTimerPreset(mins)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    timerMinutes === mins && !isTimerRunning
                      ? 'bg-[#a855f7] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* Countdown Display */}
            <div className="py-4">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {formatTime(secondsRemaining)}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-2">
                {isTimerRunning
                  ? (language === 'am' ? 'ዝም በሉ፥ እኔም አምላክ እንደ ሆንሁ እወቁ...' : 'Be still, and know that I am God...')
                  : timerCompleted
                  ? (language === 'am' ? 'ተጠናቋል! አሜን።' : 'Session Completed! Amen.')
                  : (language === 'am' ? 'ጸጥታን ለመጀመር ጀምርን ይጫኑ' : 'Press start for sacred silence')}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleTimer}
                className={`px-6 py-2.5 rounded-2xl font-bold text-sm text-white flex items-center gap-2 cursor-pointer transition shadow-sm ${
                  isTimerRunning
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-[#a855f7] hover:bg-purple-600'
                }`}
              >
                {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{isTimerRunning ? (language === 'am' ? 'አፍታ አቁም' : 'Pause') : (language === 'am' ? 'ጀምር' : 'Start')}</span>
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
      </div>

      {/* Bottom Section: Prayer Intentions & Thanksgiving Journal */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-[#a855f7]" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {language === 'am' ? 'የጸሎት ልመናዎችና የምስጋና ማስታወሻ' : 'Prayer Intentions & Gratitude Journal'}
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-[#a855f7] shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {language === 'am' ? 'ሁሉም' : 'All'} ({prayers.length})
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-white dark:bg-slate-900 text-[#a855f7] shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {language === 'am' ? 'በጸሎት ላይ' : 'Active'} ({prayers.filter((p) => !p.answered).length})
            </button>
            <button
              onClick={() => setFilterMode('answered')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                filterMode === 'answered'
                  ? 'bg-white dark:bg-slate-900 text-[#a855f7] shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {language === 'am' ? 'የተመለሱ 🎉' : 'Answered 🎉'} ({prayers.filter((p) => p.answered).length})
            </button>
          </div>
        </div>

        {/* Add Prayer Input Form */}
        <form onSubmit={addPrayer} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newPrayerText}
            onChange={(e) => setNewPrayerText(e.target.value)}
            placeholder={
              language === 'am'
                ? 'አዲስ የጸሎት ልመና ወይም ምስጋና ጻፍ...'
                : 'Add a new prayer request, intention, or thanksgiving...'
            }
            className="flex-1 bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
          />
          <select
            value={newPrayerCategory}
            onChange={(e) => setNewPrayerCategory(e.target.value as any)}
            className="bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="guidance">{language === 'am' ? 'መምራትና ጥበብ' : 'Guidance & Wisdom'}</option>
            <option value="thanksgiving">{language === 'am' ? 'ምስጋና' : 'Thanksgiving'}</option>
            <option value="intercession">{language === 'am' ? 'ምልጃ' : 'Intercession'}</option>
            <option value="healing">{language === 'am' ? 'ፈውስና ሰላም' : 'Healing & Peace'}</option>
          </select>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#a855f7] hover:bg-purple-600 text-white font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus size={15} />
            <span>{language === 'am' ? 'መዝግብ' : 'Add Prayer'}</span>
          </button>
        </form>

        {/* Prayer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredPrayers.map((prayer) => (
            <div
              key={prayer.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                prayer.answered
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                  : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900/50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    prayer.category === 'thanksgiving'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : prayer.category === 'guidance'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {prayer.category}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    {prayer.dateAdded}
                  </span>
                </div>

                <p className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                  prayer.answered
                    ? 'text-slate-600 dark:text-slate-300'
                    : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {prayer.title}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  onClick={() => togglePrayerAnswered(prayer.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition cursor-pointer px-2.5 py-1 rounded-xl ${
                    prayer.answered
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Check size={13} />
                  <span>{prayer.answered ? (language === 'am' ? 'የተመለሰ' : 'Answered!') : (language === 'am' ? 'ተመልሷል?' : 'Mark Answered')}</span>
                </button>

                <button
                  onClick={() => deletePrayer(prayer.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Devotion Protocol Modal (Create / Edit) */}
      {isProtocolModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsProtocolModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#121927] border border-purple-200/80 dark:border-purple-900/60 rounded-3xl shadow-2xl overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-purple-50/40 dark:bg-purple-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-[#a855f7] flex items-center justify-center">
                  {editingProtocol ? <Pencil size={18} /> : <Plus size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editingProtocol
                      ? (language === 'am' ? 'የጸሎት ፕሮቶኮል ማስተካከያ' : 'Edit Devotion Protocol')
                      : (language === 'am' ? 'አዲስ የጸሎት ፕሮቶኮል ጨምር' : 'New Devotion Protocol')}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'am'
                      ? 'የዕለት መንፈሳዊ ልምምድዎን እንደ ፍላጎትዎ ያብጁ'
                      : 'Customize your spiritual rhythms and focus.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProtocolModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveProtocol} className="p-6 space-y-4">
              {/* Protocol Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'am' ? 'የፕሮቶኮል ስም' : 'Protocol Title'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={protocolForm.title}
                  onChange={(e) => setProtocolForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={
                    language === 'am'
                      ? 'ምሳሌ፡ የጠዋት ምስጋና፣ የመጽሐፍ ቅዱስ ንባብ...'
                      : 'e.g. Dawn Scripture Meditation, Family Prayer...'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
                />
              </div>

              {/* Time Slot Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'am' ? 'የጊዜ ሰሌዳ' : 'Time Slot'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'morning', labelEn: 'Dawn', labelAm: 'ንጋት', icon: Sunrise },
                    { id: 'midday', labelEn: 'Midday', labelAm: 'ቀትር', icon: Sun },
                    { id: 'evening', labelEn: 'Evening', labelAm: 'ማታ', icon: Moon },
                    { id: 'anytime', labelEn: 'Anytime', labelAm: 'በማንኛውም', icon: Clock }
                  ].map((slot) => {
                    const SlotIcon = slot.icon;
                    const isSelected = protocolForm.timeSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setProtocolForm((prev) => ({ ...prev, timeSlot: slot.id as any }))}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <SlotIcon size={14} className={isSelected ? 'text-[#a855f7]' : 'text-slate-400'} />
                        <span>{language === 'am' ? slot.labelAm : slot.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration with quick select chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'am' ? 'የቆይታ ጊዜ (ደቂቃዎች)' : 'Duration (minutes)'}
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                    {protocolForm.durationMinutes} min
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setProtocolForm((prev) => ({ ...prev, durationMinutes: mins }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        protocolForm.durationMinutes === mins
                          ? 'bg-[#a855f7] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="1"
                  max="180"
                  value={protocolForm.durationMinutes}
                  onChange={(e) => setProtocolForm((prev) => ({ ...prev, durationMinutes: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white mt-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
                />
              </div>

              {/* Guidance / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'am' ? 'የልምምድ መመሪያ / ማስታወሻ' : 'Guidance & Contemplation Note'}
                </label>
                <textarea
                  rows={3}
                  value={protocolForm.description}
                  onChange={(e) => setProtocolForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    language === 'am'
                      ? 'ምሳሌ፡ ለተሰጠው አዲስ ቀን ማመስገን፣ ጸጥታ መውሰድና የዕለቱን ስራ ለእግዚአብሔር አደራ መስጠት...'
                      : 'e.g. Give thanks for life, read scripture, and dedicate day’s focus to God...'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7] resize-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {editingProtocol ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteProtocol(editingProtocol.id)}
                    className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>{language === 'am' ? 'አጥፋ' : 'Delete'}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProtocolModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    {language === 'am' ? 'ሰርዝ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#a855f7] hover:bg-purple-600 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>
                      {editingProtocol
                        ? (language === 'am' ? 'ለውጦችን መዝግብ' : 'Save Changes')
                        : (language === 'am' ? 'ፕሮቶኮል ፍጠር' : 'Add Protocol')}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
