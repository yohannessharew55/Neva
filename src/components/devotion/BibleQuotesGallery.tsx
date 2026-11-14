import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Copy, Check, Star, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('neva_collapse_devotion_quotes_gallery') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('neva_collapse_devotion_quotes_gallery', String(next));
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
    <div className="w-full bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all duration-300">
      {/* Unified Card Header */}
      <div 
        onClick={toggleCollapse}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-[#a855f7] flex items-center justify-center font-bold shadow-2xs shrink-0">
            <span className="text-xl">📚</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'am' ? 'የዕለቱ የመጽሐፍ ቅዱስ ጥቅሶች ስብስብ' : 'Bunch of Daily Bible Quotes'}
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-[#a855f7] border border-purple-200/80 dark:border-purple-900/40 shrink-0">
                {filteredVerses.length} {language === 'am' ? 'ጥቅሶች' : 'Verses'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              {isCollapsed ? 'Themed inspirational scriptures on Peace, Faith, Strength, and Wisdom' : (language === 'am' ? 'የተመረጡ ቅዱሳት ጥቅሶችን በዘርፍ መመልከትና ለልብ ማሰላሰል መምረጥ' : 'Browse inspirational scriptures categorized by theme')}
            </p>
          </div>
        </div>

        {/* Section Expand/Collapse Chevron Button */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
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
        <div className="p-4 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar pt-3">
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
        )}
      </div>
  );
};
