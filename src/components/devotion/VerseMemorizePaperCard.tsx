import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Check, ChevronRight, ChevronLeft, Shuffle, 
  Copy, Eye, EyeOff, Award, RotateCw, BookOpen, Star, Plus, X, Bookmark
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BibleVerse, BIBLE_QUOTES_LIBRARY } from '../../data/bibleData';
import { soundEngine } from '../../utils/audio';

interface VerseMemorizePaperCardProps {
  currentVerse: BibleVerse;
  onNextVerse: () => void;
  onPrevVerse: () => void;
  onRandomVerse: () => void;
  onSelectCustomVerse?: (verse: BibleVerse) => void;
  language: string;
}

export const VerseMemorizePaperCard: React.FC<VerseMemorizePaperCardProps> = ({
  currentVerse,
  onNextVerse,
  onPrevVerse,
  onRandomVerse,
  onSelectCustomVerse,
  language
}) => {
  // Memorization Mode: 'full' | 'blanks' | 'flashcard' (First Letters removed per user request)
  const [memoMode, setMemoMode] = useState<'full' | 'blanks' | 'flashcard'>('full');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [paperColor, setPaperColor] = useState<'canary' | 'parchment' | 'mint' | 'rose'>('parchment');
  const [copiedToast, setCopiedToast] = useState(false);
  const [showMemorizedModal, setShowMemorizedModal] = useState(false);
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);

  // Custom Verses added by user
  const [customVerses, setCustomVerses] = useState<BibleVerse[]>(() => {
    try {
      const saved = localStorage.getItem('livotion_custom_bible_verses_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Custom Verse Form State
  const [customRef, setCustomRef] = useState('');
  const [customTextEn, setCustomTextEn] = useState('');
  const [customTextAm, setCustomTextAm] = useState('');
  const [customTheme, setCustomTheme] = useState('Faith & Guidance');

  // Memorized verses list stored in localStorage
  const [memorizedIds, setMemorizedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('livotion_memorized_verses_v1');
      return saved ? JSON.parse(saved) : ['bv-1', 'bv-2'];
    } catch (e) {
      return ['bv-1', 'bv-2'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('livotion_memorized_verses_v1', JSON.stringify(memorizedIds));
    } catch (e) {}
  }, [memorizedIds]);

  // Reset flip when verse changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentVerse.id]);

  const isCurrentMemorized = memorizedIds.includes(currentVerse.id);

  const toggleMemorized = () => {
    if (isCurrentMemorized) {
      setMemorizedIds((prev) => prev.filter((id) => id !== currentVerse.id));
    } else {
      setMemorizedIds((prev) => [...prev, currentVerse.id]);
      try {
        confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
        soundEngine.playSound('CHIME_MEDITATION');
      } catch (e) {}
    }
  };

  const handleCopy = () => {
    const textToCopy = `"${currentVerse.textEn}"\n"${currentVerse.textAm}"\n— ${currentVerse.refEn} (${currentVerse.refAm})`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
  };

  // Helper to blank out ~40% of words for active recall practice
  const getBlankedText = (text: string): string => {
    const words = text.split(' ');
    return words
      .map((word, idx) => {
        const clean = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        if (clean.length <= 2) return word;
        return idx % 2 === 1 ? '______' : word;
      })
      .join(' ');
  };

  // Save Custom Verse pasted by User
  const handleSaveCustomVerse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTextEn.trim() && !customTextAm.trim()) return;

    const newVerse: BibleVerse = {
      id: `custom-verse-${Date.now()}`,
      refEn: customRef.trim() || (language === 'am' ? 'የተቀዳ ጥቅስ' : 'My Bible Verse'),
      refAm: customRef.trim() || 'የተቀዳ ጥቅስ',
      textEn: customTextEn.trim() || customTextAm.trim(),
      textAm: customTextAm.trim() || customTextEn.trim(),
      theme: customTheme.trim() || 'My Scripture',
      themeAm: 'የተመረጠ ጥቅስ',
      category: 'faith'
    };

    const updated = [newVerse, ...customVerses];
    setCustomVerses(updated);
    try {
      localStorage.setItem('livotion_custom_bible_verses_v1', JSON.stringify(updated));
      soundEngine.playPencil();
      confetti({ particleCount: 35, spread: 60 });
    } catch (e) {}

    // Load newly added custom verse immediately on card paper
    onSelectCustomVerse?.(newVerse);
    setIsAddCustomModalOpen(false);
    setCustomRef('');
    setCustomTextEn('');
    setCustomTextAm('');
  };

  // Paper Theme Configurations
  const PAPER_THEMES = {
    parchment: {
      bg: 'bg-[#fef9ee] dark:bg-[#1f1b13]',
      border: 'border-[#ebd9b4] dark:border-[#52442a]',
      tapeBg: 'bg-amber-200/80 dark:bg-amber-900/60',
      tapeBorder: 'border-amber-300 dark:border-amber-700',
      text: 'text-[#38260f] dark:text-[#f7e7ce]',
      subtext: 'text-[#6e532d] dark:text-[#c4a97f]',
      ruleLine: 'rgba(180, 140, 80, 0.12)',
      marginLine: 'rgba(230, 80, 80, 0.20)'
    },
    canary: {
      bg: 'bg-[#fefce8] dark:bg-[#201f0c]',
      border: 'border-[#fef08a] dark:border-[#59551c]',
      tapeBg: 'bg-yellow-200/80 dark:bg-yellow-900/60',
      tapeBorder: 'border-yellow-300 dark:border-yellow-700',
      text: 'text-[#3b3506] dark:text-[#fef08a]',
      subtext: 'text-[#716712] dark:text-[#ded263]',
      ruleLine: 'rgba(202, 138, 4, 0.12)',
      marginLine: 'rgba(239, 68, 68, 0.22)'
    },
    mint: {
      bg: 'bg-[#f0fdf4] dark:bg-[#0c1f14]',
      border: 'border-[#bbf7d0] dark:border-[#1d5232]',
      tapeBg: 'bg-emerald-200/80 dark:bg-emerald-900/60',
      tapeBorder: 'border-emerald-300 dark:border-emerald-700',
      text: 'text-[#062c16] dark:text-[#bbf7d0]',
      subtext: 'text-[#166534] dark:text-[#86efac]',
      ruleLine: 'rgba(16, 185, 129, 0.12)',
      marginLine: 'rgba(239, 68, 68, 0.20)'
    },
    rose: {
      bg: 'bg-[#fff1f2] dark:bg-[#250d13]',
      border: 'border-[#fecdd3] dark:border-[#5e212f]',
      tapeBg: 'bg-rose-200/80 dark:bg-rose-900/60',
      tapeBorder: 'border-rose-300 dark:border-rose-700',
      text: 'text-[#3b0d18] dark:text-[#fecdd3]',
      subtext: 'text-[#9f1239] dark:text-[#fda4af]',
      ruleLine: 'rgba(244, 63, 94, 0.12)',
      marginLine: 'rgba(225, 29, 72, 0.22)'
    }
  };

  const theme = PAPER_THEMES[paperColor];

  // All verses list for memorized modal lookup
  const allVersesLookup = [...BIBLE_QUOTES_LIBRARY, ...customVerses];
  const memorizedVersesList = allVersesLookup.filter((v) => memorizedIds.includes(v.id));

  return (
    <div className="w-full space-y-4">
      {/* Top Bar: Title, Add Custom Verse & Memorized Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xl">📜</span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{language === 'am' ? 'የዕለቱ ቃል ለማስታወስ (ካርድ ወረቀት)' : 'Verse of the Day Card Paper'}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {currentVerse.theme}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {language === 'am' ? 'የእግዚአብሔርን ቃል በልብ ለማኖርና በቃለ-ቃል ለመሸምደድ' : 'Internalize Scripture into your heart with tactile card paper'}
            </p>
          </div>
        </div>

        {/* Right Header Actions: Add Custom Verse, Mode & Memorized Counter */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Button: Add Custom Quote from Bible (Copy & Paste) */}
          <button
            type="button"
            onClick={() => setIsAddCustomModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
            title="Paste and memorize your own Scripture from Bible"
          >
            <Plus size={14} />
            <span>{language === 'am' ? 'ከመጽሐፍ ቅዱስ ለጥፍ' : 'Paste from Bible'}</span>
          </button>

          <button
            onClick={() => setShowMemorizedModal(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-[#a855f7] border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
            title="View all memorized verses"
          >
            <Award size={14} />
            <span>{memorizedIds.length} {language === 'am' ? 'የተሸመደዱ' : 'Memorized'}</span>
          </button>

          {/* Color Paper Palette Picker */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {(['parchment', 'canary', 'mint', 'rose'] as const).map((colorKey) => (
              <button
                key={colorKey}
                onClick={() => setPaperColor(colorKey)}
                className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                  colorKey === 'parchment' ? 'bg-[#ebd9b4]' : colorKey === 'canary' ? 'bg-[#fef08a]' : colorKey === 'mint' ? 'bg-[#bbf7d0]' : 'bg-[#fecdd3]'
                } ${paperColor === colorKey ? 'scale-125 ring-2 ring-purple-500 ring-offset-1' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                title={`Paper color: ${colorKey}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Memorization Mode Pill Switcher (3 Modes: Full Text, Word Blanks, Flashcard Flip) */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto text-xs font-bold">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMemoMode('full')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              memoMode === 'full'
                ? 'bg-white dark:bg-slate-900 text-[#a855f7] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Eye size={13} />
            <span>{language === 'am' ? '1. ሙሉ ቃል' : '1. Full Text'}</span>
          </button>

          <button
            onClick={() => setMemoMode('blanks')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              memoMode === 'blanks'
                ? 'bg-white dark:bg-slate-900 text-[#a855f7] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Hides 40% of words for recall practice"
          >
            <EyeOff size={13} />
            <span>{language === 'am' ? '2. የተደበቁ ቃላት (40%)' : '2. Word Blanks (40%)'}</span>
          </button>

          <button
            onClick={() => setMemoMode('flashcard')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              memoMode === 'flashcard'
                ? 'bg-white dark:bg-slate-900 text-[#a855f7] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Flip flashcard mode"
          >
            <RotateCw size={13} />
            <span>{language === 'am' ? '3. ፍላሽ ካርድ' : '3. Flashcard Flip'}</span>
          </button>
        </div>

        {/* Quick Shuffle Random */}
        <button
          onClick={onRandomVerse}
          className="px-2.5 py-1 rounded-xl text-slate-500 hover:text-[#a855f7] dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition cursor-pointer flex items-center gap-1 shrink-0"
          title="Random Scripture"
        >
          <Shuffle size={13} />
          <span className="hidden sm:inline">{language === 'am' ? 'የዘፈቀደ' : 'Random'}</span>
        </button>
      </div>

      {/* The Authentic Card Paper Note */}
      <div className="relative group/paper transition-transform duration-200">
        {/* Top Washi Tape / Tape Strip */}
        <div 
          className={`w-28 sm:w-36 h-4 mx-auto -mb-2 rounded-xs border-y border-dashed shadow-2xs backdrop-blur-xs relative z-20 select-none flex items-center justify-center -rotate-0.5 pointer-events-none ${theme.tapeBg} ${theme.tapeBorder}`}
        >
          <span className="text-[8px] font-mono font-black uppercase tracking-widest opacity-60">
            {language === 'am' ? 'የዕለቱ ቃል' : 'SCRIPTURE MEMORY'}
          </span>
        </div>

        {/* Brass Pushpin on Top Right */}
        <div className="absolute top-2 right-4 sm:right-6 z-30 select-none pointer-events-none filter drop-shadow-xs">
          <span className="text-lg">📌</span>
        </div>

        {/* The Card Paper Body */}
        <div
          onClick={() => {
            if (memoMode === 'flashcard') {
              setIsFlipped((prev) => !prev);
              try { soundEngine.playPencil(); } catch (e) {}
            }
          }}
          className={`relative rounded-3xl border p-6 sm:p-8 shadow-md transition-all overflow-hidden select-none ${theme.bg} ${theme.border} ${theme.text} ${
            memoMode === 'flashcard' ? 'cursor-pointer hover:shadow-lg' : ''
          }`}
          style={{
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06), 0 4px 10px -2px rgba(0,0,0,0.03)'
          }}
        >
          {/* Subtle Ruled Texture for Authentic Sticky Note Paper Feel */}
          <div 
            className="absolute inset-0 pointer-events-none select-none opacity-90"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 27px, ${theme.ruleLine} 28px),
                linear-gradient(90deg, transparent 32px, ${theme.marginLine} 33px, ${theme.marginLine} 34px, transparent 35px)
              `
            }}
          />

          <div className="relative z-10 space-y-4">
            {/* Card Header: Category & Reference */}
            <div className="flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-extrabold uppercase tracking-wider bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
                  {language === 'am' ? currentVerse.themeAm : currentVerse.theme}
                </span>
                <span className="text-xs font-bold opacity-60">
                  • {language === 'am' ? 'የልብ ቃል' : 'Daily Treasure'}
                </span>
              </div>

              {/* Action Icons with Right Top Memorized Check */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer opacity-70 hover:opacity-100"
                  title={copiedToast ? 'Copied!' : 'Copy verse'}
                >
                  {copiedToast ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>

                {/* Right Top Memorized Check Button */}
                <button
                  type="button"
                  onClick={toggleMemorized}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    isCurrentMemorized
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/40 ring-offset-1'
                      : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
                  }`}
                  title={isCurrentMemorized ? 'Memorized into heart! Click to uncheck' : 'Click when memorized to mark as checked'}
                >
                  {isCurrentMemorized ? (
                    <Check size={14} className="stroke-[3]" />
                  ) : (
                    <Star size={13} />
                  )}
                  <span>
                    {isCurrentMemorized 
                      ? (language === 'am' ? 'ተሸምድዷል ✓' : 'Memorized ✓') 
                      : (language === 'am' ? 'ሸምድጃለሁ' : 'Mark Memorized')}
                  </span>
                </button>
              </div>
            </div>

            {/* Verse Body depending on Mode */}
            {memoMode === 'flashcard' && !isFlipped ? (
              <div className="py-12 sm:py-16 text-center space-y-3 cursor-pointer">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-2xl">
                  📖
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-black tracking-tight">
                  {language === 'am' ? currentVerse.refAm : currentVerse.refEn}
                </h3>
                <p className="text-xs sm:text-sm font-semibold opacity-70 max-w-sm mx-auto">
                  {language === 'am' 
                    ? 'ቃሉን በልብህ ታስታውሰዋለህ? ቃሉን ለማየት ካርዱን ጠቅ አድርገህ ገልብጠው።' 
                    : 'Can you recite this holy verse from memory? Tap anywhere on this card to flip and verify!'}
                </p>
                <div className="pt-2">
                  <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-black/10 dark:bg-white/15 animate-pulse">
                    {language === 'am' ? 'ለመገልበጥ ንካ 🔄' : 'Tap to Flip & Reveal 🔄'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* English / Primary Text */}
                <div className="space-y-1">
                  <blockquote className="text-base sm:text-lg md:text-xl font-serif italic font-medium leading-relaxed">
                    "{memoMode === 'blanks' 
                      ? getBlankedText(currentVerse.textEn) 
                      : currentVerse.textEn}"
                  </blockquote>
                  <p className="text-xs font-mono font-bold tracking-wider opacity-65">
                    — {currentVerse.refEn}
                  </p>
                </div>

                {/* Amharic / Secondary Text Divider & Verse */}
                {currentVerse.textAm && currentVerse.textAm !== currentVerse.textEn && (
                  <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-1">
                    <blockquote className="text-sm sm:text-base md:text-lg font-serif font-semibold leading-relaxed">
                      "{memoMode === 'blanks' 
                        ? getBlankedText(currentVerse.textAm) 
                        : currentVerse.textAm}"
                    </blockquote>
                    <p className="text-xs font-mono font-bold tracking-wider opacity-65">
                      — {currentVerse.refAm}
                    </p>
                  </div>
                )}

                {memoMode === 'flashcard' && isFlipped && (
                  <div className="pt-2 text-center">
                    <span className="text-[10px] font-mono font-bold opacity-60">
                      {language === 'am' ? 'ካርዱን ለመመለስ ደግመው ይንኩ' : 'Tap card again to flip back'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Card Footer: Navigation Controls */}
            <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={onPrevVerse}
                className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>{language === 'am' ? 'ያለፈው' : 'Prev'}</span>
              </button>

              <button
                type="button"
                onClick={onRandomVerse}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Shuffle size={13} />
                <span>{language === 'am' ? 'ቃል ቀይር' : 'Shuffle Verse'}</span>
              </button>

              <button
                type="button"
                onClick={onNextVerse}
                className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <span>{language === 'am' ? 'ቀጣይ' : 'Next'}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add & Paste Custom Bible Verse */}
      {isAddCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'am' ? 'የመጽሐፍ ቅዱስ ቃል ለጥፍና ሸምድድ' : 'Paste Bible Verse to Memorize'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddCustomModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomVerse} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'የመጽሐፍ ቅዱስ ጥቅስ አድራሻ (ምሳሌ: ሮሜ 8:28 / Philippians 4:13)' : 'Scripture Reference (e.g. Philippians 4:13, Romans 8:28)'}
                </label>
                <input
                  type="text"
                  required
                  value={customRef}
                  onChange={(e) => setCustomRef(e.target.value)}
                  placeholder="e.g. Philippians 4:13 or ፊልጵስዩስ 4:13"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'የጥቅሱ ጽሑፍ (ከመጽሐፍ ቅዱስህ ኮፒ አድርገህ እዚህ ለጥፈው)' : 'Scripture Text (Copy from your Bible & paste here)'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={customTextEn}
                  onChange={(e) => setCustomTextEn(e.target.value)}
                  placeholder="Paste Scripture text here..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'የአማርኛ ወይም ሁለተኛ ትርጉም (አስገዳጅ አይደለም)' : 'Amharic or Second Translation (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={customTextAm}
                  onChange={(e) => setCustomTextAm(e.target.value)}
                  placeholder="Paste Amharic translation or secondary version..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'ጭብጥ / ምድብ' : 'Theme / Topic'}
                </label>
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="e.g. Faith & Victory, Peace, Prayer"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {language === 'am' ? 'ተወው' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                >
                  <Bookmark size={14} />
                  <span>{language === 'am' ? 'መዝግብና በካርድ ሸምድድ' : 'Save & Memorize on Paper'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Memorized Verses Library */}
      {showMemorizedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-amber-500" size={20} />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'am' ? 'በልብ የተሸመደዱ ጥቅሶች' : 'Verses Memorized in Heart'} ({memorizedVersesList.length})
                </h3>
              </div>
              <button
                onClick={() => setShowMemorizedModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {memorizedVersesList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {language === 'am' ? 'እስካሁን የተሸመደደ ቃል የለም። ካርዱ ላይ ሸምድጃለሁ የሚለውን ይጫኑ!' : 'No verses marked as memorized yet. Use the card paper to memorize Scripture!'}
                </div>
              ) : (
                memorizedVersesList.map((verse) => (
                  <div
                    key={verse.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold font-mono text-purple-600 dark:text-purple-400">
                          {verse.refEn} ({verse.refAm})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                          ✓ Memorized
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-serif italic text-slate-800 dark:text-slate-200 pt-1">
                        "{verse.textEn}"
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                      <button
                        onClick={() => {
                          onSelectCustomVerse?.(verse);
                          setShowMemorizedModal(false);
                        }}
                        className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        {language === 'am' ? 'ካርድ ላይ አሳይ' : 'Review on Card'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
