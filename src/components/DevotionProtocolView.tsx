import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Heart, Sparkles, CheckCircle2, Square, 
  Play, Pause, RotateCcw, Plus, Trash2, Check, 
  Volume2, Flame, Sun, Moon, Sunrise, Clock, Star,
  Share2, BookmarkCheck, Shield, ChevronRight, ChevronDown, ChevronUp, Pencil, X,
  Dumbbell, ArrowLeft
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { soundEngine } from '../utils/audio';
import { mobileTimerEngine } from '../utils/mobileTimerEngine';
import { FitnessProtocolView } from './FitnessProtocolView';
import { BIBLE_QUOTES_LIBRARY, BibleVerse } from '../data/bibleData';
import { VerseMemorizePaperCard } from './devotion/VerseMemorizePaperCard';
import { BibleReadingSessionView } from './devotion/BibleReadingSessionView';
import { WeeklyBibleStudyView } from './devotion/WeeklyBibleStudyView';
import { BibleQuotesGallery } from './devotion/BibleQuotesGallery';
import { BibleQuoteHeroCard } from './devotion/BibleQuoteHeroCard';

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
  startTime?: string;
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
    titleEn: 'Dawn Gratitude & Bible Reading',
    titleAm: 'የንጋት ምስጋናና የመጽሐፍ ቅዱስ ንባብ',
    durationMinutes: 30,
    startTime: '06:00 AM',
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
    startTime: '12:30 PM',
    descriptionEn: 'Pause active work. Breathe deep, reset priorities, and reaffirm humility & grace.',
    descriptionAm: 'ከስራ ጫና ጥቂት ቆም ማለት፣ ትንፋሽ መውሰድና በትዕግስትና በሰላም ልብን ማደስ።',
    completed: false
  },
  {
    id: 'rhythm-evening',
    timeSlot: 'evening',
    titleEn: 'Evening Examen & Peaceful Surrender',
    titleAm: 'የማታ ቆጠራና የሰላም ጸሎት',
    durationMinutes: 20,
    startTime: '09:30 PM',
    descriptionEn: 'Review the day\'s blessings, release stress, forgive offenses, and rest in Divine peace.',
    descriptionAm: 'የቀኑን በረከቶች ማሰብ፣ ጭንቀትንና ቂምን ማራገፍ እና በሰላም እንቅልፍ ማረፍ።',
    completed: false
  }
];

const DEVOTION_SUB_TABS = [
  { id: 'all', labelEn: 'All Features', labelAm: 'ሁሉንም በአንድ', icon: '🌟' },
  { id: 'reading', labelEn: 'Bible Reading Session', labelAm: 'የመጽሐፍ ቅዱስ ንባብ', icon: '📖' },
  { id: 'memorize', labelEn: 'Verse Card Paper', labelAm: 'የዕለቱ ቃል በካርድ ወረቀት', icon: '📜' },
  { id: 'study', labelEn: 'Weekly Bible Study', labelAm: 'ሳምንታዊ ጥናትና ውጤት', icon: '📊' },
  { id: 'prayer', labelEn: 'Protocols & Prayer', labelAm: 'የጸሎት ፕሮቶኮልና ልመና', icon: '🕊️' },
  { id: 'quotes', labelEn: 'Quotes of the Day', labelAm: 'የጥቅሶች ስብስብና የዘፈቀደ ቃል', icon: '✨' },
];

export const DevotionProtocolView: React.FC = () => {
  const { 
    language, 
    categoryPlans, 
    logSession, 
    tasks,
    getDaySchedule, 
    updateDevotionRoutine, 
    startTask,
    setActiveTab
  } = useLivotion();
  const devotionCategory = categoryPlans['devotion'];

  // Active Devotion Sub-Tab: 'all' | 'reading' | 'memorize' | 'study' | 'quotes' | 'prayer'
  const [devotionSubTab, setDevotionSubTab] = useState<'all' | 'reading' | 'memorize' | 'study' | 'quotes' | 'prayer'>('all');

  // Collapse states for Prayer sections
  const [isProtocolsCollapsed, setIsProtocolsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('neva_collapse_devotion_protocols') === 'true';
    } catch {
      return false;
    }
  });

  const [isJournalCollapsed, setIsJournalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('neva_collapse_devotion_journal') === 'true';
    } catch {
      return false;
    }
  });

  const toggleProtocolsCollapse = () => {
    setIsProtocolsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('neva_collapse_devotion_protocols', String(next));
        soundEngine.playPencil();
      } catch {}
      return next;
    });
  };

  const toggleJournalCollapse = () => {
    setIsJournalCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('neva_collapse_devotion_journal', String(next));
        soundEngine.playPencil();
      } catch {}
      return next;
    });
  };

  const areAllCollapsed = isProtocolsCollapsed && isJournalCollapsed;

  const toggleAllSections = () => {
    const nextState = !areAllCollapsed;
    setIsProtocolsCollapsed(nextState);
    setIsJournalCollapsed(nextState);
    try {
      localStorage.setItem('neva_collapse_devotion_protocols', String(nextState));
      localStorage.setItem('neva_collapse_devotion_journal', String(nextState));
      localStorage.setItem('neva_collapse_devotion_quote_hero', String(nextState));
      localStorage.setItem('neva_collapse_devotion_verse_paper', String(nextState));
      localStorage.setItem('neva_collapse_devotion_reading_session', String(nextState));
      localStorage.setItem('neva_collapse_devotion_weekly_study', String(nextState));
      localStorage.setItem('neva_collapse_devotion_quotes_gallery', String(nextState));
      window.dispatchEvent(new CustomEvent('neva-toggle-all-devotion-sections', { detail: { collapsed: nextState } }));
      soundEngine.playPencil();
    } catch {}
  };

  useEffect(() => {
    const handler = (e: any) => {
      if (typeof e.detail?.collapsed === 'boolean') {
        setIsProtocolsCollapsed(e.detail.collapsed);
        setIsJournalCollapsed(e.detail.collapsed);
      }
    };
    window.addEventListener('neva-toggle-all-devotion-sections', handler);
    return () => window.removeEventListener('neva-toggle-all-devotion-sections', handler);
  }, []);

  // Verse of the Day Card Verse state
  const [cardVerse, setCardVerse] = useState<BibleVerse>(() => BIBLE_QUOTES_LIBRARY[0]);

  const handleNextCardVerse = () => {
    const currentIdx = BIBLE_QUOTES_LIBRARY.findIndex((v) => v.id === cardVerse.id);
    const nextIdx = (currentIdx + 1) % BIBLE_QUOTES_LIBRARY.length;
    setCardVerse(BIBLE_QUOTES_LIBRARY[nextIdx]);
  };

  const handlePrevCardVerse = () => {
    const currentIdx = BIBLE_QUOTES_LIBRARY.findIndex((v) => v.id === cardVerse.id);
    const prevIdx = (currentIdx - 1 + BIBLE_QUOTES_LIBRARY.length) % BIBLE_QUOTES_LIBRARY.length;
    setCardVerse(BIBLE_QUOTES_LIBRARY[prevIdx]);
  };

  const handleRandomCardVerse = () => {
    let nextIdx = Math.floor(Math.random() * BIBLE_QUOTES_LIBRARY.length);
    if (BIBLE_QUOTES_LIBRARY[nextIdx].id === cardVerse.id) {
      nextIdx = (nextIdx + 1) % BIBLE_QUOTES_LIBRARY.length;
    }
    setCardVerse(BIBLE_QUOTES_LIBRARY[nextIdx]);
  };

  const handleSelectVerseToMemorize = (verse: BibleVerse) => {
    setCardVerse(verse);
    setDevotionSubTab('memorize');
    setTimeout(() => {
      const el = document.getElementById('verse-memorize-card-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLogDevotionSession = (durationMinutes: number, title: string, notes?: string) => {
    logSession({
      domainId: 'dom-3',
      domainType: 'DEVOTION_PRAYER',
      startedAt: new Date(Date.now() - durationMinutes * 60000).toISOString(),
      endedAt: new Date().toISOString(),
      actualDurationSeconds: durationMinutes * 60,
      flowStateRating: 5,
      notesMarkdown: notes || title,
      metricsSnapshot: { title, durationMinutes }
    } as any);
  };

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
    durationMinutes: 30,
    startTime: '06:00 AM',
    timeSlot: 'morning' as 'morning' | 'midday' | 'evening' | 'anytime',
    description: ''
  });

  const handleOpenAddProtocol = () => {
    setEditingProtocol(null);
    setProtocolForm({
      title: '',
      durationMinutes: 20,
      startTime: '06:00 AM',
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
      durationMinutes: item.durationMinutes || 20,
      startTime: item.startTime || (item.timeSlot === 'morning' ? '06:00 AM' : item.timeSlot === 'midday' ? '12:30 PM' : '09:30 PM'),
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

    const durationMinutes = Number(protocolForm.durationMinutes) || 15;
    const startTime = protocolForm.startTime || (protocolForm.timeSlot === 'morning' ? '06:00 AM' : protocolForm.timeSlot === 'midday' ? '12:30 PM' : '09:30 PM');
    const title = protocolForm.title.trim();

    if (editingProtocol) {
      setRhythms((prev) =>
        prev.map((r) =>
          r.id === editingProtocol.id
            ? {
                ...r,
                titleEn: title,
                titleAm: language === 'am' ? title : (r.titleAm || title),
                durationMinutes,
                startTime,
                timeSlot: protocolForm.timeSlot,
                descriptionEn: protocolForm.description.trim() || 'Daily sacred contemplation and prayer.',
                descriptionAm: language === 'am' ? protocolForm.description.trim() : (r.descriptionAm || protocolForm.description.trim())
              }
            : r
        )
      );
      // Synchronize with master schedule tasks
      updateDevotionRoutine(editingProtocol.id, {
        title,
        durationMinutes,
        startTime
      });
    } else {
      const newId = `rhythm-${Date.now()}`;
      const newProtocol: DailyRhythmItem = {
        id: newId,
        timeSlot: protocolForm.timeSlot,
        titleEn: title,
        titleAm: title,
        durationMinutes,
        startTime,
        descriptionEn: protocolForm.description.trim() || 'Daily sacred contemplation and prayer.',
        descriptionAm: protocolForm.description.trim() || 'የዕለት የጸሎትና የማሰላሰል ክፍለ-ጊዜ።',
        completed: false
      };
      setRhythms((prev) => [...prev, newProtocol]);
      // Synchronize with master schedule tasks
      updateDevotionRoutine(newId, {
        title,
        durationMinutes,
        startTime,
        completed: false
      });
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

  const targetEndTimeRef = useRef<number | null>(null);

  // Contemplative Timer countdown with timestamp accuracy & wake-lock & Little Window/Lockscreen sync
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && secondsRemaining > 0) {
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;

      // Broadcast to mobileTimerEngine for Floating Little Window, PiP & Lock Screen
      mobileTimerEngine.startCountdown({
        durationSeconds: timerMinutes * 60,
        initialRemainingSeconds: secondsRemaining,
        taskTitle: language === 'am' ? 'የፀጥታ ጸሎትና ማሰላሰል' : 'Contemplative Prayer & Meditation',
        category: 'devotion',
        system: 'silence',
        phase: 'focus',
        onComplete: () => {
          setIsTimerRunning(false);
          setTimerCompleted(true);
        },
      });

      const syncTime = () => {
        if (!targetEndTimeRef.current) return;
        const diff = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
        setSecondsRemaining(diff);

        if (diff <= 0) {
          targetEndTimeRef.current = null;
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
      if (mobileTimerEngine.getState().system === 'silence') {
        mobileTimerEngine.pause();
      }
    }
  }, [isTimerRunning, timerMinutes, logSession]);

  const setTimerPreset = (minutes: number) => {
    setTimerMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setIsTimerRunning(false);
    setTimerCompleted(false);
    if (mobileTimerEngine.getState().system === 'silence') {
      mobileTimerEngine.stop();
    }
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
    if (mobileTimerEngine.getState().system === 'silence') {
      mobileTimerEngine.stop();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRhythm = (id: string) => {
    let nextCompleted = false;
    let targetTitle = '';
    setRhythms((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          nextCompleted = !r.completed;
          targetTitle = language === 'am' ? r.titleAm : r.titleEn;
          return { ...r, completed: nextCompleted };
        }
        return r;
      })
    );
    // Sync with tasks on Today's sticky note & calendar
    updateDevotionRoutine(id, {
      title: targetTitle || undefined,
      completed: nextCompleted
    });
  };

  const handleStartRhythmTimer = (rhythm: DailyRhythmItem, e: React.MouseEvent) => {
    e.stopPropagation();
    startTask({
      id: `task-${rhythm.id}`,
      title: language === 'am' ? rhythm.titleAm : rhythm.titleEn,
      startTime: rhythm.startTime || (rhythm.timeSlot === 'morning' ? '06:00 AM' : rhythm.timeSlot === 'midday' ? '12:30 PM' : '09:30 PM'),
      durationMin: rhythm.durationMinutes,
      completed: rhythm.completed,
      domain: 'DEVOTION_PRAYER',
      badge: 'Devotion',
      color: '#a855f7',
      soundProfile: 'SOLFEGGIO_432',
      checklist: [
        { id: `c-${Date.now()}-1`, text: rhythm.descriptionEn || 'Scripture & contemplation', done: false }
      ]
    });
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
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                try { soundEngine.playTouchSound(); } catch {}
                setActiveTab('cockpit');
              }}
              className="p-2 -ml-1 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs active:scale-95"
              title={language === 'am' ? 'ወደ ኮክፒት ተመለስ' : 'Back to Cockpit'}
              aria-label="Back to Cockpit"
            >
              <ArrowLeft size={18} />
            </button>
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

      {/* Devotion Feature Sub-Navigator Bar with Master Expand/Collapse Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {DEVOTION_SUB_TABS.map((tab) => {
            const isActive = devotionSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setDevotionSubTab(tab.id as any);
                  try { soundEngine.playPencil(); } catch (e) {}
                }}
                className={`px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-[#a855f7] shadow-xs scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{language === 'am' ? tab.labelAm : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Master Expand All / Collapse All Toggle */}
        <div className="flex items-center gap-1.5 justify-end px-1 shrink-0">
          <button
            type="button"
            onClick={toggleAllSections}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-[#a855f7] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
            title={areAllCollapsed ? 'Expand all sections' : 'Collapse all sections for ultra-minimal view'}
          >
            {areAllCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span>
              {areAllCollapsed 
                ? (language === 'am' ? 'ሁሉንም ዘርጋ' : 'Expand All') 
                : (language === 'am' ? 'ሁሉንም ሰብስብ' : 'Collapse All')}
            </span>
          </button>
        </div>
      </div>

      {/* TOP: Daily Inspiring Scripture Quote Hero Card with Hover Chevrons (PC) & Mobile Swipe */}
      {(devotionSubTab === 'all' || devotionSubTab === 'quotes') && (
        <div className="w-full">
          <BibleQuoteHeroCard
            language={language}
            onSelectVerseToMemorize={handleSelectVerseToMemorize}
          />
        </div>
      )}

      {/* 1. Feature 2: Verse of the Day to Memorize with Card Paper */}
      {(devotionSubTab === 'all' || devotionSubTab === 'memorize') && (
        <div id="verse-memorize-card-section" className="space-y-4">
          <VerseMemorizePaperCard
            currentVerse={cardVerse}
            onNextVerse={handleNextCardVerse}
            onPrevVerse={handlePrevCardVerse}
            onRandomVerse={handleRandomCardVerse}
            onSelectCustomVerse={(verse) => setCardVerse(verse)}
            language={language}
          />
        </div>
      )}

      {/* 2. Feature 1: Bible Reading Session & Immersion Timer */}
      {(devotionSubTab === 'all' || devotionSubTab === 'reading') && (
        <div className="pt-2">
          <BibleReadingSessionView
            language={language}
            onLogDevotionSession={handleLogDevotionSession}
          />
        </div>
      )}

      {/* 3. Feature 3: Weekly Bible Study Tracker with Result Metric Time & Study Area */}
      {(devotionSubTab === 'all' || devotionSubTab === 'study') && (
        <div className="pt-2">
          <WeeklyBibleStudyView
            language={language}
            onLogDevotionSession={handleLogDevotionSession}
          />
        </div>
      )}

      {/* 4. Daily Spiritual Protocols & Contemplative Silence Timer (Placed ABOVE Bible Quotes Gallery per user request) */}
      {(devotionSubTab === 'all' || devotionSubTab === 'prayer') && (
        <div className="w-full bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all duration-300">
          {/* Unified Card Header */}
          <div 
            onClick={toggleProtocolsCollapse}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-[#a855f7] flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Clock size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {language === 'am' ? 'የዕለት የጸሎት ፕሮቶኮልና የጸጥታ ሰዓት' : 'Daily Devotion Protocols & Sacred Silence'}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shrink-0">
                    {completedRhythmsCount} / {rhythms.length} {language === 'am' ? 'ተጠናቋል' : 'done'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {isProtocolsCollapsed 
                    ? `${completedRhythmsCount} / ${rhythms.length} completed • Contemplative silence timer & sacred pauses`
                    : (language === 'am' ? 'ዕለታዊ መንፈሳዊ ልምምዶች፣ ጸሎትና ጸጥታ' : 'Daily spiritual rhythms, prayer checkpoints, and quiet meditation timer')}
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleOpenAddProtocol}
                className="px-3 py-1.5 bg-[#a855f7] hover:bg-purple-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                title={language === 'am' ? 'አዲስ ፕሮቶኮል ጨምር' : 'Add New Protocol'}
              >
                <Plus size={13} />
                <span>{language === 'am' ? 'አዲስ' : 'Add New'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaultProtocols}
                className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={language === 'am' ? 'ወደ ነባሪ መልስ' : 'Reset to default protocols'}
              >
                <RotateCcw size={14} />
              </button>

              <button
                type="button"
                onClick={toggleProtocolsCollapse}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title={isProtocolsCollapsed ? (language === 'am' ? 'ዘርጋ' : 'Expand Section') : (language === 'am' ? 'ሰብስብ' : 'Collapse Section')}
              >
                {isProtocolsCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
              </button>
            </div>
          </div>

          {/* Card Content (Only visible when expanded) */}
          {!isProtocolsCollapsed && (
            <div className="p-4 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
          
          {/* Left Column: Daily Spiritual Rhythms (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
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
                      {rhythm.startTime && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                          {rhythm.startTime}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                        ({rhythm.durationMinutes} min)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {language === 'am' ? rhythm.descriptionAm : rhythm.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleStartRhythmTimer(rhythm, e)}
                      className="p-1.5 bg-purple-500/10 hover:bg-[#a855f7] text-[#a855f7] hover:text-white rounded-lg transition cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center"
                      title={language === 'am' ? 'ሰዓት ጀምር' : 'Start Focus Timer'}
                    >
                      <Play size={13} fill="currentColor" />
                    </button>
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
    </div>
  )}
</div>
)}

      {/* 5. Prayer Intentions & Thanksgiving Journal */}
      {(devotionSubTab === 'all' || devotionSubTab === 'prayer') && (
        <div className="w-full bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all duration-300">
          {/* Unified Card Header */}
          <div 
            onClick={toggleJournalCollapse}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-[#a855f7] flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Heart size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {language === 'am' ? 'የጸሎት ልመናዎችና የምስጋና ማስታወሻ' : 'Prayer Intentions & Gratitude Journal'}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shrink-0">
                    {prayers.length} {language === 'am' ? 'ልመናዎች' : 'Entries'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {isJournalCollapsed 
                    ? `${prayers.length} prayers • ${prayers.filter((p) => p.answered).length} answered prayers 🎉`
                    : (language === 'am' ? 'የጸሎት ርዕሶች፣ ልመናዎችና ምስጋናዎችን መመዝገብ' : 'Record prayer requests, intentional intercessions, and answered praises')}
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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

              {/* Section Expand/Collapse Chevron Button */}
              <button
                type="button"
                onClick={toggleJournalCollapse}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title={isJournalCollapsed ? (language === 'am' ? 'ዘርጋ' : 'Expand Section') : (language === 'am' ? 'ሰብስብ' : 'Collapse Section')}
              >
                {isJournalCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
              </button>
            </div>
          </div>

          {/* Card Content (Only visible when expanded) */}
          {!isJournalCollapsed && (
            <div className="p-4 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
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
    )}
  </div>
)}

      {/* 6. Feature 4: Bunch of Daily Bible Quotes Gallery (Positioned BELOW Prayer Section per user request) */}
      {(devotionSubTab === 'all' || devotionSubTab === 'quotes') && (
        <div className="pt-2">
          <BibleQuotesGallery
            language={language}
            onSelectVerseToMemorize={handleSelectVerseToMemorize}
          />
        </div>
      )}

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

              {/* Scheduled Start Time Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'am' ? 'የመጀመሪያ ሰዓት (የቀን ሰሌዳ)' : 'Scheduled Start Time'}
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                    {protocolForm.startTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['06:00 AM', '07:00 AM', '12:30 PM', '06:00 PM', '09:30 PM'].map((tStr) => (
                    <button
                      key={tStr}
                      type="button"
                      onClick={() => setProtocolForm((prev) => ({ ...prev, startTime: tStr }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        protocolForm.startTime === tStr
                          ? 'bg-[#a855f7] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {tStr}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={protocolForm.startTime}
                  onChange={(e) => setProtocolForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  placeholder="06:00 AM"
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white mt-1 focus:outline-hidden focus:ring-2 focus:ring-[#a855f7]"
                />
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
