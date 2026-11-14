import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Copy, Check, Bookmark, 
  Sparkles, Layers
} from 'lucide-react';
import { BibleVerse, BIBLE_QUOTES_LIBRARY } from '../../data/bibleData';
import { soundEngine } from '../../utils/audio';

interface BibleQuoteHeroCardProps {
  language: string;
  onSelectVerseToMemorize: (verse: BibleVerse) => void;
  initialVerse?: BibleVerse;
}

export const BibleQuoteHeroCard: React.FC<BibleQuoteHeroCardProps> = ({
  language,
  onSelectVerseToMemorize,
  initialVerse
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialVerse) {
      const idx = BIBLE_QUOTES_LIBRARY.findIndex((v) => v.id === initialVerse.id);
      if (idx !== -1) return idx;
    }
    return Math.floor(Math.random() * BIBLE_QUOTES_LIBRARY.length);
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('neva_collapse_devotion_quote_hero') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('neva_collapse_devotion_quote_hero', String(next));
        soundEngine.playPencil();
      } catch {}
      return next;
    });
  };

  // Touch swipe support for mobile
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const currentQuote = BIBLE_QUOTES_LIBRARY[currentIndex] || BIBLE_QUOTES_LIBRARY[0];

  const handleNextQuote = () => {
    setIsTransitioning(true);
    try { soundEngine.playPencil(); } catch (e) {}
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % BIBLE_QUOTES_LIBRARY.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrevQuote = () => {
    setIsTransitioning(true);
    try { soundEngine.playPencil(); } catch (e) {}
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + BIBLE_QUOTES_LIBRARY.length) % BIBLE_QUOTES_LIBRARY.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 40) {
      // Swiped Left -> Next Quote
      handleNextQuote();
    } else if (diff < -40) {
      // Swiped Right -> Previous Quote
      handlePrevQuote();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleCopy = () => {
    const text = `"${currentQuote.textEn}"\n"${currentQuote.textAm}"\n— ${currentQuote.refEn} (${currentQuote.refAm})`;
    navigator.clipboard.writeText(text);
    setCopiedId(currentQuote.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative group/quote overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 border border-purple-500/30 text-white shadow-xl transition-all duration-300 select-none"
    >
      {/* Background Decorative Cross / Star */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles size={140} />
      </div>

      {/* Left Chevron Button: Visible on Hover for PC, Clickable to navigate to Previous Quote (only when expanded) */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={handlePrevQuote}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all opacity-0 group-hover/quote:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-lg z-20 focus:outline-none"
          title={language === 'am' ? 'ያለፈው ጥቅስ' : 'Previous Quote'}
        >
          <ChevronLeft size={22} className="text-white" />
        </button>
      )}

      {/* Right Chevron Button: Visible on Hover for PC, Clickable to navigate to Next Quote (only when expanded) */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={handleNextQuote}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all opacity-0 group-hover/quote:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-lg z-20 focus:outline-none"
          title={language === 'am' ? 'ቀጣይ ጥቅስ' : 'Next Quote'}
        >
          <ChevronRight size={22} className="text-white" />
        </button>
      )}

      {/* Card Content */}
      <div className="relative z-10 px-5 sm:px-10 py-5 sm:py-6 space-y-4">
        
        {/* Top Bar with Badge & Expand/Collapse Button */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={14} className="text-purple-300 shrink-0" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-200 truncate">
              {language === 'am' ? 'የዕለቱ ቅዱስ ቃል' : 'SCRIPTURE QUOTE OF THE DAY'}
            </span>
            {isCollapsed && (
              <span className="text-xs font-bold text-purple-300 truncate">
                • {currentQuote.refEn} ({currentQuote.refAm})
              </span>
            )}
          </div>
          
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
            title={isCollapsed ? (language === 'am' ? 'ዘርጋ' : 'Expand Section') : (language === 'am' ? 'ሰብስብ' : 'Collapse Section')}
          >
            <span className="text-[11px] font-mono hidden sm:inline">
              {isCollapsed ? (language === 'am' ? 'ዘርጋ' : 'Expand') : (language === 'am' ? 'ሰብስብ' : 'Collapse')}
            </span>
            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>

        {/* Collapsed Compact Preview */}
        {isCollapsed ? (
          <div 
            onClick={toggleCollapse}
            className="cursor-pointer py-1 flex items-center justify-between gap-3 text-xs sm:text-sm italic font-serif text-purple-100 hover:text-white transition group/preview"
          >
            <p className="truncate">"{currentQuote.textEn}"</p>
            <span className="shrink-0 text-[11px] font-mono not-italic text-purple-400 group-hover/preview:text-purple-200 underline">
              {language === 'am' ? 'ሙሉውን አሳይ' : 'show full'}
            </span>
          </div>
        ) : (
          <>
            {/* Quote Scripture Text */}
            <div className={`space-y-3 transition-opacity duration-200 ${isTransitioning ? 'opacity-30' : 'opacity-100'}`}>
              <blockquote className="text-lg sm:text-xl md:text-2xl font-serif italic text-purple-50 leading-relaxed tracking-wide">
                "{currentQuote.textEn}"
              </blockquote>

              <blockquote className="text-base sm:text-lg md:text-xl font-serif font-semibold text-purple-200/90 leading-relaxed pt-2 border-t border-white/10">
                "{currentQuote.textAm}"
              </blockquote>
            </div>

            {/* Bottom Bar: Reference & Action Buttons */}
            <div className="flex items-center justify-between pt-2 flex-wrap gap-3 border-t border-white/10">
              <span className="text-sm font-bold tracking-wide text-purple-300">
                — {currentQuote.refEn} ({currentQuote.refAm})
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Copy Scripture"
                >
                  {copiedId === currentQuote.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedId === currentQuote.id ? (language === 'am' ? 'ተቀድቷል' : 'Copied') : (language === 'am' ? 'ቅዳ' : 'Copy')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectVerseToMemorize(currentQuote);
                    try { soundEngine.playPencil(); } catch (e) {}
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#a855f7] hover:bg-purple-600 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                  title="Practice memorizing this verse on card paper below"
                >
                  <Bookmark size={14} />
                  <span>{language === 'am' ? 'በካርድ ወረቀት ሸምድድ' : 'Memorize on Card Paper'}</span>
                </button>
              </div>
            </div>

            {/* Mobile Swipe Guidance Hint */}
            <div className="md:hidden text-center pt-1">
              <span className="text-[10px] font-mono text-purple-300/60 uppercase tracking-widest">
                {language === 'am' ? '← ጥቅሶችን ለመቀየር ወደ ግራ ወይም ቀኝ ያንሸራትቱ →' : '← Swipe left or right to change quote →'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
