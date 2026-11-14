import React, { useState } from 'react';
import { 
  Sparkles, Shuffle, Copy, Check, Bookmark, 
  Share2, Heart, Star, BookOpen, Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BibleVerse, BIBLE_QUOTES_LIBRARY, BIBLE_THEMES_FILTER } from '../../data/bibleData';
import { soundEngine } from '../../utils/audio';

interface BibleQuotesGalleryProps {
  language: string;
  onSelectVerseToMemorize: (verse: BibleVerse) => void;
}

export const BibleQuotesGallery: React.FC<BibleQuotesGalleryProps> = ({
  language,
  onSelectVerseToMemorize
}) => {
  // Random Featured Quote State
  const [featuredQuote, setFeaturedQuote] = useState<BibleVerse>(() => {
    const randomIndex = Math.floor(Math.random() * BIBLE_QUOTES_LIBRARY.length);
    return BIBLE_QUOTES_LIBRARY[randomIndex];
  });

  const [isRolling, setIsRolling] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Trigger New Random Quote
  const handleRollRandom = () => {
    setIsRolling(true);
    try {
      soundEngine.playPencil();
    } catch (e) {}

    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * BIBLE_QUOTES_LIBRARY.length);
      // Ensure it's different from the current one
      if (BIBLE_QUOTES_LIBRARY[nextIndex].id === featuredQuote.id) {
        nextIndex = (nextIndex + 1) % BIBLE_QUOTES_LIBRARY.length;
      }
      setFeaturedQuote(BIBLE_QUOTES_LIBRARY[nextIndex]);
      setIsRolling(false);
      try {
        soundEngine.playSound('CHIME_MEDITATION');
      } catch (e) {}
    }, 250);
  };

  const handleCopy = (verse: BibleVerse) => {
    const text = `"${verse.textEn}"\n"${verse.textAm}"\n— ${verse.refEn} (${verse.refAm})`;
    navigator.clipboard.writeText(text);
    setCopiedId(verse.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter verses for the Bunch Grid
  const filteredVerses = BIBLE_QUOTES_LIBRARY.filter((v) => {
    if (activeCategory === 'all') return true;
    return v.category === activeCategory;
  });

  return (
    <div className="w-full space-y-6">
      {/* 1. HERO: Everytime New & Random Quote from the Bible */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 border border-purple-500/30 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={140} />
        </div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-purple-300" />
              <span>{language === 'am' ? 'የዘፈቀደ አዲስ ቃል' : 'Instant Random Quote'}</span> • {language === 'am' ? featuredQuote.themeAm : featuredQuote.theme}
            </span>

            {/* The Prominent Random Roll Button */}
            <button
              onClick={handleRollRandom}
              disabled={isRolling}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-md active:scale-95 disabled:opacity-50"
              title="Get a fresh random quote from the Bible"
            >
              <Shuffle size={14} className={isRolling ? 'animate-spin' : ''} />
              <span>{language === 'am' ? '🎲 አዲስ የዘፈቀደ ቃል ቀይር' : '🎲 New Random Quote'}</span>
            </button>
          </div>

          {/* Featured Quote Display */}
          <div className={`space-y-3 transition-opacity duration-200 ${isRolling ? 'opacity-30' : 'opacity-100'}`}>
            <blockquote className="text-lg sm:text-xl md:text-2xl font-serif italic text-purple-50 leading-relaxed">
              "{featuredQuote.textEn}"
            </blockquote>

            <blockquote className="text-base sm:text-lg md:text-xl font-serif font-semibold text-purple-200/90 leading-relaxed pt-1 border-t border-white/10">
              "{featuredQuote.textAm}"
            </blockquote>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <span className="text-sm font-bold tracking-wide text-purple-300">
                — {featuredQuote.refEn} ({featuredQuote.refAm})
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(featuredQuote)}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  {copiedId === featuredQuote.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedId === featuredQuote.id ? (language === 'am' ? 'ተቀድቷል' : 'Copied') : (language === 'am' ? 'ቅዳ' : 'Copy')}</span>
                </button>

                <button
                  onClick={() => {
                    onSelectVerseToMemorize(featuredQuote);
                    try { soundEngine.playPencil(); } catch (e) {}
                  }}
                  className="px-3.5 py-1 rounded-xl bg-[#a855f7] hover:bg-purple-600 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Star size={13} />
                  <span>{language === 'am' ? 'በካርድ ወረቀት ሸምድድ' : 'Memorize on Card Paper'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BUNCH OF DAILY QUOTES GALLERY */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{language === 'am' ? 'የዕለቱ የመጽሐፍ ቅዱስ ጥቅሶች ስብስብ' : 'Bunch of Daily Bible Quotes'}</span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  ({filteredVerses.length})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === 'am' 
                  ? 'የተመረጡ ቅዱሳት ጥቅሶችን በዘርፍ መመልከትና ለልብ ማሰላሰል መምረጥ' 
                  : 'Browse a rich bunch of inspirational scriptures categorized by theme.'}
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          {BIBLE_THEMES_FILTER.map((theme) => {
            const isActive = activeCategory === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setActiveCategory(theme.id)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#a855f7] text-white shadow-2xs'
                    : 'bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-purple-300'
                }`}
              >
                {language === 'am' ? theme.nameAm : theme.nameEn}
              </button>
            );
          })}
        </div>

        {/* Bunch Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVerses.map((verse) => (
            <div
              key={verse.id}
              className="p-5 rounded-3xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-2xs hover:border-purple-300 dark:hover:border-purple-800/60 transition-all flex flex-col justify-between group/quote"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/70 text-[#a855f7] border border-purple-200/80 dark:border-purple-900/40">
                    {language === 'am' ? verse.themeAm : verse.theme}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {verse.refEn}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed">
                  "{verse.textEn}"
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-serif leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  "{verse.textAm}"
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <span className="text-[10px] text-slate-400 font-bold">
                  {verse.refAm}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(verse)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Copy"
                  >
                    {copiedId === verse.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>

                  <button
                    onClick={() => {
                      onSelectVerseToMemorize(verse);
                      try { soundEngine.playPencil(); } catch (e) {}
                    }}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#a855f7] font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Load into Card Paper Memorizer"
                  >
                    <Star size={11} />
                    <span>{language === 'am' ? 'ሸምድድ' : 'Memorize'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
