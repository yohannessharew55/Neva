import React, { useState, useMemo } from 'react';
import { 
  Star, Calendar, Plus, Filter, Search, Check, 
  Trash2, Palette, Sparkles, Flame, Clock, Award, 
  ChevronDown, ChevronUp, Edit3, X, CheckCircle2,
  CalendarDays, Shield, Heart, Zap, Smile
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { DailyStickyReviewNote, StickyNoteThemeColor, DailyStickyTaskItem } from '../types';
import { gregorianToEthiopian, ETHIOPIAN_MONTHS, AMHARIC_DAYS } from '../utils/ethiopianCalendar';

const THEME_STYLES: Record<StickyNoteThemeColor, {
  name: string;
  dotColor: string;
  paperBg: string;
  paperBorder: string;
  textPrimary: string;
  textSecondary: string;
  tapeBg: string;
  tapeBorder: string;
  hourBadgeBg: string;
  hourBadgeText: string;
  checkBorder: string;
  checkBgDone: string;
  ruledLineColor: string;
  marginLineColor: string;
  shadowColor: string;
  accentStar: string;
}> = {
  canary: {
    name: 'Classic Canary Yellow',
    dotColor: '#fde047',
    paperBg: 'bg-[#fef9c3] dark:bg-[#2a2305]',
    paperBorder: 'border-[#fef08a] dark:border-amber-700/60',
    textPrimary: 'text-amber-950 dark:text-amber-100',
    textSecondary: 'text-amber-800/80 dark:text-amber-300/80',
    tapeBg: 'bg-amber-100/70 dark:bg-amber-900/40',
    tapeBorder: 'border-amber-200/80 dark:border-amber-700/50',
    hourBadgeBg: 'bg-amber-200/80 dark:bg-amber-900/70',
    hourBadgeText: 'text-amber-950 dark:text-amber-200',
    checkBorder: 'border-amber-400 dark:border-amber-600',
    checkBgDone: 'bg-amber-600 text-white',
    ruledLineColor: 'rgba(217, 119, 6, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(180, 83, 9, 0.22)',
    accentStar: 'text-amber-500 fill-amber-400',
  },
  peach: {
    name: 'Warm Peach',
    dotColor: '#fdba74',
    paperBg: 'bg-[#ffedd5] dark:bg-[#2b1406]',
    paperBorder: 'border-[#fed7aa] dark:border-orange-700/60',
    textPrimary: 'text-orange-950 dark:text-orange-100',
    textSecondary: 'text-orange-800/80 dark:text-orange-300/80',
    tapeBg: 'bg-orange-100/70 dark:bg-orange-900/40',
    tapeBorder: 'border-orange-200/80 dark:border-orange-700/50',
    hourBadgeBg: 'bg-orange-200/80 dark:bg-orange-900/70',
    hourBadgeText: 'text-orange-950 dark:text-orange-200',
    checkBorder: 'border-orange-400 dark:border-orange-600',
    checkBgDone: 'bg-orange-600 text-white',
    ruledLineColor: 'rgba(234, 88, 12, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(194, 65, 12, 0.22)',
    accentStar: 'text-orange-500 fill-orange-400',
  },
  mint: {
    name: 'Pastel Mint',
    dotColor: '#86efac',
    paperBg: 'bg-[#dcfce7] dark:bg-[#072513]',
    paperBorder: 'border-[#bbf7d0] dark:border-emerald-700/60',
    textPrimary: 'text-emerald-950 dark:text-emerald-100',
    textSecondary: 'text-emerald-800/80 dark:text-emerald-300/80',
    tapeBg: 'bg-emerald-100/70 dark:bg-emerald-900/40',
    tapeBorder: 'border-emerald-200/80 dark:border-emerald-700/50',
    hourBadgeBg: 'bg-emerald-200/80 dark:bg-emerald-900/70',
    hourBadgeText: 'text-emerald-950 dark:text-emerald-200',
    checkBorder: 'border-emerald-400 dark:border-emerald-600',
    checkBgDone: 'bg-emerald-600 text-white',
    ruledLineColor: 'rgba(5, 150, 105, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(4, 120, 87, 0.22)',
    accentStar: 'text-emerald-500 fill-emerald-400',
  },
  sky: {
    name: 'Sky Blue',
    dotColor: '#7dd3fc',
    paperBg: 'bg-[#e0f2fe] dark:bg-[#072336]',
    paperBorder: 'border-[#bae6fd] dark:border-sky-700/60',
    textPrimary: 'text-sky-950 dark:text-sky-100',
    textSecondary: 'text-sky-800/80 dark:text-sky-300/80',
    tapeBg: 'bg-sky-100/70 dark:bg-sky-900/40',
    tapeBorder: 'border-sky-200/80 dark:border-sky-700/50',
    hourBadgeBg: 'bg-sky-200/80 dark:bg-sky-900/70',
    hourBadgeText: 'text-sky-950 dark:text-sky-200',
    checkBorder: 'border-sky-400 dark:border-sky-600',
    checkBgDone: 'bg-sky-600 text-white',
    ruledLineColor: 'rgba(2, 132, 199, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(3, 105, 161, 0.22)',
    accentStar: 'text-sky-500 fill-sky-400',
  },
  rose: {
    name: 'Soft Rose',
    dotColor: '#fda4af',
    paperBg: 'bg-[#ffe4e6] dark:bg-[#2b0814]',
    paperBorder: 'border-[#fecdd3] dark:border-rose-700/60',
    textPrimary: 'text-rose-950 dark:text-rose-100',
    textSecondary: 'text-rose-800/80 dark:text-rose-300/80',
    tapeBg: 'bg-rose-100/70 dark:bg-rose-900/40',
    tapeBorder: 'border-rose-200/80 dark:border-rose-700/50',
    hourBadgeBg: 'bg-rose-200/80 dark:bg-rose-900/70',
    hourBadgeText: 'text-rose-950 dark:text-rose-200',
    checkBorder: 'border-rose-400 dark:border-rose-600',
    checkBgDone: 'bg-rose-600 text-white',
    ruledLineColor: 'rgba(225, 29, 72, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(190, 18, 60, 0.22)',
    accentStar: 'text-rose-500 fill-rose-400',
  },
  lavender: {
    name: 'Pastel Lavender',
    dotColor: '#d8b4fe',
    paperBg: 'bg-[#f3e8ff] dark:bg-[#220730]',
    paperBorder: 'border-[#e9d5ff] dark:border-purple-700/60',
    textPrimary: 'text-purple-950 dark:text-purple-100',
    textSecondary: 'text-purple-800/80 dark:text-purple-300/80',
    tapeBg: 'bg-purple-100/70 dark:bg-purple-900/40',
    tapeBorder: 'border-purple-200/80 dark:border-purple-700/50',
    hourBadgeBg: 'bg-purple-200/80 dark:bg-purple-900/70',
    hourBadgeText: 'text-purple-950 dark:text-purple-200',
    checkBorder: 'border-purple-400 dark:border-purple-600',
    checkBgDone: 'bg-purple-600 text-white',
    ruledLineColor: 'rgba(147, 51, 234, 0.08)',
    marginLineColor: 'rgba(225, 29, 72, 0.15)',
    shadowColor: 'rgba(126, 34, 206, 0.22)',
    accentStar: 'text-purple-500 fill-purple-400',
  },
};

const MOODS = ['🔥', '🎯', '⚡', '🧘', '🏆', '✨', '☕', '💪'];

const RATING_LABELS: Record<number, string> = {
  5: '5.0 ★ Masterclass Execution',
  4: '4.0 ★ High Cognitive Flow',
  3: '3.0 ★ Moderate Progress',
  2: '2.0 ★ High Friction Day',
  1: '1.0 ★ Rough / Rebuild Required',
};

export const DailyStickyNotesGalleryView: React.FC = () => {
  const { 
    dailyStickyNotes, 
    updateDailyStickyNoteRating,
    updateDailyStickyNoteReview,
    updateDailyStickyNoteColor,
    updateDailyStickyNoteMood,
    toggleDailyStickyTask,
    addDailyStickyNote,
    deleteDailyStickyNote,
    language,
    t
  } = useLivotion();

  const getRatingLabel = (stars: number) => {
    if (language === 'am') {
      switch (stars) {
        case 5: return '5.0 ★ ፍጹም ልህቀት';
        case 4: return '4.0 ★ ከፍተኛ ትኩረት';
        case 3: return '3.0 ★ መካከለኛ አፈጻጸም';
        case 2: return '2.0 ★ ከፍተኛ ተግዳሮት';
        default: return '1.0 ★ ክለሳ ያስፈልገዋል';
      }
    }
    return RATING_LABELS[stars] || `${stars}.0 ★`;
  };

  // Search & Filter state
  const [filterMode, setFilterMode] = useState<'all' | 'this_week' | '5_star' | 'high_focus' | 'needs_review'>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Active color palette popover note ID
  const [activePaletteNoteId, setActivePaletteNoteId] = useState<string | null>(null);

  // Inline editing state for reviews
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // New Note Modal Form State
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newRating, setNewRating] = useState(5);
  const [newColor, setNewColor] = useState<StickyNoteThemeColor>('canary');
  const [newMood, setNewMood] = useState('🔥');
  const [newReview, setNewReview] = useState('');
  const [newWin, setNewWin] = useState('');

  // Overall Gallery Statistics
  const totalNotes = dailyStickyNotes.length;
  const avgRating = totalNotes > 0 
    ? (dailyStickyNotes.reduce((sum, n) => sum + (n.ratingStars || 0), 0) / totalNotes).toFixed(1)
    : '5.0';
  
  const fiveStarDays = dailyStickyNotes.filter((n) => n.ratingStars === 5).length;
  const totalHoursLogged = dailyStickyNotes
    .reduce((sum, n) => sum + (n.focusHoursLogged || 0), 0)
    .toFixed(1);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return dailyStickyNotes.filter((note) => {
      // 1. Star / Category Filter
      if (filterMode === '5_star' && note.ratingStars !== 5) return false;
      if (filterMode === 'high_focus' && (note.ratingStars || 0) < 4) return false;
      if (filterMode === 'needs_review' && (note.ratingStars || 0) >= 4) return false;

      // 2. Color Filter
      if (colorFilter !== 'all' && note.colorTheme !== colorFilter) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = note.dateStr.toLowerCase().includes(q) || note.dayName.toLowerCase().includes(q);
        const matchesReview = note.summaryReview.toLowerCase().includes(q);
        const matchesWins = note.wins?.some((w) => w.toLowerCase().includes(q));
        const matchesTasks = note.tasks?.some((t) => t.title.toLowerCase().includes(q));
        if (!matchesDate && !matchesReview && !matchesWins && !matchesTasks) return false;
      }

      return true;
    });
  }, [dailyStickyNotes, filterMode, colorFilter, searchQuery]);

  // Handle new note creation
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    const d = new Date(newDate + 'T12:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const eth = gregorianToEthiopian(d);
    const amharicDay = AMHARIC_DAYS[d.getDay()]?.amharic || '';
    const ethMonth = ETHIOPIAN_MONTHS[eth.month - 1]?.amharic || '';
    const ethDateStr = `${amharicDay} • ${ethMonth} ${eth.day}, ${eth.year}`;

    addDailyStickyNote({
      dateStr: newDate,
      dayName,
      ethiopianDateStr: ethDateStr,
      ratingStars: newRating,
      colorTheme: newColor,
      moodEmoji: newMood,
      summaryReview: newReview.trim() || 'Daily deliberate mastery review logged.',
      wins: newWin.trim() ? [newWin.trim()] : ['Deep cognitive execution maintained.'],
      focusHoursLogged: 8.0,
      totalTargetHours: 10.0,
      tasks: [
        { id: `t-${Date.now()}-1`, title: 'Scripture Study & Stillness', durationMin: 45, completed: true },
        { id: `t-${Date.now()}-2`, title: 'Core Mastery Focus Block', durationMin: 120, completed: true },
        { id: `t-${Date.now()}-3`, title: 'Physical Training Protocol', durationMin: 60, completed: true },
      ],
    });

    setNewReview('');
    setNewWin('');
    setShowAddModal(false);
  };

  const startEditingReview = (note: DailyStickyReviewNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.summaryReview);
  };

  const saveEditingReview = (noteId: string) => {
    if (editingText.trim()) {
      updateDailyStickyNoteReview(noteId, editingText.trim());
    }
    setEditingNoteId(null);
  };

  return (
    <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6">
      {/* 1. Header & Studio Board Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
              📌 Studio Memo Pad Wall
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Daily Star Reviews & Retrospectives
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <span>{t('galleryTitle')}</span>
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            {t('gallerySubtitle')}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>{t('pinDayStickyNote')}</span>
          </button>
        </div>
      </div>

      {/* 2. Gallery Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            {t('avgRating')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
              {avgRating}
            </span>
            <div className="flex items-center text-amber-500 text-sm">
              {'★'.repeat(Math.round(Number(avgRating)))}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {language === 'am' ? `በ${totalNotes} የተገመገሙ ቀናት ላይ የተመሰረተ` : `Based on ${totalNotes} days reviewed`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            {t('fiveStarMastery')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {fiveStarDays}
            </span>
            <span className="text-xs font-bold text-slate-500">/ {totalNotes} {language === 'am' ? 'ቀናት' : 'total'}</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {totalNotes > 0 ? Math.round((fiveStarDays / totalNotes) * 100) : 100}% {language === 'am' ? 'ከፍተኛ ስኬት' : 'peak adherence'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            {t('loggedFocusHours')}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-extrabold text-[#0082ff]">
              {totalHoursLogged}{t('hoursShort')}
            </span>
            <span className="text-xs font-bold text-slate-500">{language === 'am' ? 'ትኩረት' : 'focused'}</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {language === 'am' ? 'በስቲኪ ማስታወሻዎች ውስጥ' : 'Across gallery notes'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            {language === 'am' ? 'የኢትዮጵያ ዘመን አቆጣጠር' : 'Ethiopian Calendar Sync'}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {dailyStickyNotes[0]?.ethiopianDateStr?.split('•')[0]?.trim() || 'የኢትዮጵያ'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
            {dailyStickyNotes[0]?.ethiopianDateStr || 'ዘመን አቆጣጠር'}
          </span>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Left: Star / Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('filterAllDays')} ({dailyStickyNotes.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('5_star')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              filterMode === '5_star'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span>{language === 'am' ? 'ባለ 5 ኮከብ' : '5 Stars'}</span>
            <span className="text-amber-200">★</span>
            <span>({dailyStickyNotes.filter(n => n.ratingStars === 5).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('high_focus')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filterMode === 'high_focus'
                ? 'bg-[#0082ff] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('filterHighFocus')}
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('needs_review')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filterMode === 'needs_review'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('filterNeedsReview')}
          </button>
        </div>

        {/* Right: Color Filter & Search */}
        <div className="flex items-center gap-2">
          {/* Color filter dots */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setColorFilter('all')}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                colorFilter === 'all' ? 'bg-white dark:bg-slate-700 shadow-2xs' : 'opacity-60'
              }`}
            >
              {t('all')}
            </button>
            {(Object.keys(THEME_STYLES) as StickyNoteThemeColor[]).map((cKey) => (
              <button
                key={cKey}
                onClick={() => setColorFilter(colorFilter === cKey ? 'all' : cKey)}
                className={`w-4.5 h-4.5 rounded-full transition-transform cursor-pointer ${
                  colorFilter === cKey ? 'scale-125 ring-2 ring-slate-800 dark:ring-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: THEME_STYLES[cKey].dotColor }}
                title={THEME_STYLES[cKey].name}
              />
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 outline-none w-32 sm:w-44 focus:w-48 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. The Sticky Notes Gallery Wall */}
      {filteredNotes.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-[#121927] border border-dashed border-slate-200/80 dark:border-slate-800 rounded-3xl p-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-xl">
            📌
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {dailyStickyNotes.length === 0 
              ? (language === 'am' ? 'የማስታወሻ ጋለሪው ባዶ ነው' : 'Your Review Gallery is Empty')
              : (language === 'am' ? 'ምንም ማስታወሻ አልተገኘም' : 'No Sticky Notes Match Filter')}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {dailyStickyNotes.length === 0
              ? (language === 'am' ? 'የመጀመሪያውን የዕለት ማስታወሻዎንና ባለ ኮከብ ግምገማዎን አሁን ይለጥፉ!' : 'Start your mastery review journey! Pin your first daily sticky note and star review.')
              : (language === 'am' ? 'ማጣሪያውን ዳግም ያስጀምሩ ወይም አዲስ ማስታወሻ ይለጥፉ።' : 'Try resetting your color or star filter, or pin a new day sticky note to the gallery.')}
          </p>
          <div className="flex items-center justify-center gap-2">
            {dailyStickyNotes.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-[#0082ff] text-white text-xs font-bold hover:bg-[#0070df] transition cursor-pointer shadow-sm"
              >
                + {language === 'am' ? 'የመጀመሪያውን ማስታወሻ ይለጥፉ' : 'Pin First Review Note'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setFilterMode('all'); setColorFilter('all'); setSearchQuery(''); }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-start">
          {filteredNotes.map((note, index) => {
            const theme = THEME_STYLES[note.colorTheme] || THEME_STYLES.canary;
            const completedCount = note.tasks.filter((t) => t.completed).length;
            const totalTasksCount = note.tasks.length;
            const adherencePercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 100;
            const isEditing = editingNoteId === note.id;
            const isPaletteOpen = activePaletteNoteId === note.id;

            // Micro tilt to give authentic corkboard feel
            const rotations = ['rotate-[-0.6deg]', 'rotate-[0.5deg]', 'rotate-[-0.3deg]', 'rotate-[0.7deg]', 'rotate-[-0.5deg]'];
            const tapeRotations = ['rotate-[-0.4deg]', 'rotate-[0.8deg]', 'rotate-[-0.6deg]', 'rotate-[0.5deg]'];
            const cardRotation = rotations[index % rotations.length];
            const tapeRotation = tapeRotations[index % tapeRotations.length];

            return (
              <div 
                key={note.id} 
                className={`relative group/stickynote transition-transform duration-200 hover:-translate-y-1 ${cardRotation}`}
              >
                {/* 1. Translucent Frosted Washi Tape (Centered) */}
                <div 
                  className={`w-28 sm:w-32 h-5 mx-auto -mb-2.5 rounded-xs shadow-2xs border backdrop-blur-md z-20 relative select-none flex items-center justify-center ${tapeRotation} ${theme.tapeBg} ${theme.tapeBorder}`}
                  title="Pinned with washi tape"
                >
                  <span className="text-[8px] tracking-[0.2em] font-mono font-extrabold uppercase opacity-65">
                    {note.dayName.slice(0, 3)} MEMO
                  </span>
                </div>

                {/* 2. Brass Pushpin on Top Right */}
                <div 
                  className="absolute top-2 right-4 z-20 select-none cursor-pointer filter drop-shadow-xs transition-transform group-hover/stickynote:scale-125"
                  title="Pinned Daily Review Note"
                >
                  <span className="text-xl">📌</span>
                </div>

                {/* 3. The Physical Sticky Note Card */}
                <div 
                  className={`relative rounded-3xl border p-5 sm:p-5.5 transition-all duration-200 overflow-hidden ${theme.paperBg} ${theme.paperBorder} ${theme.textPrimary}`}
                  style={{
                    boxShadow: `0 12px 26px -6px ${theme.shadowColor}, 0 4px 8px -2px rgba(0,0,0,0.06)`,
                  }}
                >
                  {/* Subtle Ruled Lined Notebook Pattern */}
                  <div 
                    className="absolute inset-0 pointer-events-none select-none opacity-80"
                    style={{
                      backgroundImage: `
                        repeating-linear-gradient(0deg, transparent, transparent 27px, ${theme.ruledLineColor} 28px),
                        linear-gradient(90deg, transparent 32px, ${theme.marginLineColor} 33px, ${theme.marginLineColor} 34px, transparent 35px)
                      `,
                    }}
                  />

                  {/* Note Header: Specific Day, Gregorian & Ethiopian Date */}
                  <div className="relative z-10 border-b border-black/10 dark:border-white/10 pb-3 mb-3">
                    <div className="flex items-start justify-between gap-2 pr-6">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10">
                            {note.dayName} • {note.dateStr}
                          </span>
                          {note.moodEmoji && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextIndex = (MOODS.indexOf(note.moodEmoji) + 1) % MOODS.length;
                                updateDailyStickyNoteMood(note.id, MOODS[nextIndex]);
                              }}
                              className="text-sm cursor-pointer hover:scale-125 transition-transform"
                              title="Click to cycle daily mood sticker"
                            >
                              {note.moodEmoji}
                            </button>
                          )}
                        </div>

                        {/* Ethiopian Date Badge */}
                        {note.ethiopianDateStr && (
                          <p className="text-[11px] font-mono font-bold opacity-75 mt-1">
                            🇪🇹 {note.ethiopianDateStr}
                          </p>
                        )}
                      </div>

                      {/* Color Palette Popover Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActivePaletteNoteId(isPaletteOpen ? null : note.id)}
                          className="p-1 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 transition cursor-pointer"
                          title="Change Note Color"
                        >
                          <Palette size={13} />
                        </button>

                        {isPaletteOpen && (
                          <div className="absolute right-0 top-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-xl flex items-center gap-1 z-30">
                            {(Object.keys(THEME_STYLES) as StickyNoteThemeColor[]).map((cKey) => (
                              <button
                                key={cKey}
                                type="button"
                                onClick={() => {
                                  updateDailyStickyNoteColor(note.id, cKey);
                                  setActivePaletteNoteId(null);
                                }}
                                className={`w-4.5 h-4.5 rounded-full transition-transform cursor-pointer ${
                                  note.colorTheme === cKey ? 'scale-125 ring-2 ring-slate-800 dark:ring-white' : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: THEME_STYLES[cKey].dotColor }}
                                title={THEME_STYLES[cKey].name}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INTERACTIVE 5-STAR RATING BAR */}
                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono font-extrabold uppercase opacity-70 mr-1">
                            {t('rateExecutionLabel')}
                          </span>
                          {[1, 2, 3, 4, 5].map((starValue) => {
                            const isFilled = starValue <= (note.ratingStars || 0);
                            return (
                              <button
                                key={starValue}
                                type="button"
                                onClick={() => updateDailyStickyNoteRating(note.id, starValue)}
                                className="p-0.5 cursor-pointer transition-transform hover:scale-130 active:scale-95"
                                title={`Rate ${starValue} Stars`}
                              >
                                <Star
                                  size={16}
                                  className={isFilled ? theme.accentStar : 'text-black/20 dark:text-white/20 stroke-current'}
                                />
                              </button>
                            );
                          })}
                        </div>

                        <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/15">
                          {getRatingLabel(note.ratingStars)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Focus Hours & Progress Pill */}
                  <div className="relative z-10 flex items-center justify-between gap-2 py-1 px-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[11px] font-mono font-bold mb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="opacity-70" />
                      <span>{note.focusHoursLogged}{t('hoursShort')} {language === 'am' ? 'ትኩረት' : 'focus'}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="opacity-70" />
                      <span>{completedCount}/{totalTasksCount} {language === 'am' ? 'ተግባራት' : 'tasks'} ({adherencePercent}%)</span>
                    </div>
                  </div>

                  {/* Tasks List for the Day */}
                  <div className="relative z-10 space-y-1 mb-3.5 max-h-[170px] overflow-y-auto pr-1">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider opacity-65 block mb-1">
                      {t('checklistLabel')}:
                    </span>
                    {note.tasks.map((task) => {
                      const hours = (task.durationMin / 60).toFixed(1);
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => toggleDailyStickyTask(note.id, task.id)}
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition cursor-pointer ${
                                task.completed 
                              ? `${theme.checkBgDone} border-transparent` 
                              : `${theme.checkBorder} bg-transparent hover:scale-110`
                              }`}
                            >
                              {task.completed && <Check size={10} strokeWidth={3} />}
                            </button>
                            <span 
                              onClick={() => toggleDailyStickyTask(note.id, task.id)}
                              className={`truncate font-semibold cursor-pointer select-none text-[11px] ${
                                task.completed ? 'line-through opacity-50' : 'opacity-90'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${theme.hourBadgeBg} ${theme.hourBadgeText} shrink-0`}>
                            {hours}{t('hoursShort')}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Daily Review & Retrospective Debrief (Inline Editable) */}
                  <div className="relative z-10 border-t border-black/10 dark:border-white/10 pt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider opacity-75">
                        {t('reflectionLabel')}:
                      </span>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => startEditingReview(note)}
                          className="text-[10px] font-bold opacity-60 hover:opacity-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={10} /> {t('edit')}
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-2 text-xs rounded-xl bg-white/80 dark:bg-black/30 border border-black/20 dark:border-white/20 outline-none font-medium resize-none"
                          placeholder={language === 'am' ? 'የዛሬ ዋና ስኬቶች ምን ነበሩ? ተግዳሮቶችና ትምህርቶች...' : 'What went well today? Any frictions or lessons?'}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/10 dark:bg-white/10 cursor-pointer"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditingReview(note.id)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-black text-white dark:bg-white dark:text-black cursor-pointer"
                          >
                            {t('save')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-handwriting leading-relaxed opacity-90 text-[13px] font-semibold italic">
                        "{note.summaryReview}"
                      </p>
                    )}

                    {/* Key Wins Tags */}
                    {note.wins && note.wins.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {note.wins.map((w, i) => (
                          <span 
                            key={i}
                            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10"
                          >
                            ✓ {w}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="relative z-10 flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-2.5 mt-3 text-[10px] font-mono">
                    <span className="opacity-60 flex items-center gap-1">
                      <span>📌 Fixed Desk Memo</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete sticky review for ${note.dayName} (${note.dateStr})?`)) {
                          deleteDailyStickyNote(note.id);
                        }
                      }}
                      className="p-1 rounded text-rose-600 opacity-40 hover:opacity-100 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Physical Dog-Ear Fold at Bottom Right */}
                  <div 
                    className="absolute bottom-0 right-0 w-5.5 h-5.5 pointer-events-none select-none"
                    style={{
                      background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.14) 50%)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Pin New Day Sticky Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📌</span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {language === 'am' ? 'አዲስ የዕለት ስቲኪ ማስታወሻ መዝግብ' : 'Pin New Day Sticky Note'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3.5 text-xs">
              {/* Date & Day picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'ቀን ይምረጡ *' : 'Select Specific Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-base sm:text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-mono"
                />
              </div>

              {/* Star Rating Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'የትኩረት አፈጻጸም ደረጃ (ኮከብ) *' : 'Day Rating (Stars) *'}
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewRating(s)}
                        className="cursor-pointer hover:scale-125 transition-transform"
                      >
                        <Star
                          size={20}
                          className={s <= newRating ? 'text-amber-500 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 ml-2">
                    {getRatingLabel(newRating)}
                  </span>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'የስቲኪ ማስታወሻው ቀለም' : 'Sticky Note Color Theme'}
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {(Object.keys(THEME_STYLES) as StickyNoteThemeColor[]).map((cKey) => (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => setNewColor(cKey)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        newColor === cKey ? 'scale-125 ring-2 ring-slate-800 dark:ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: THEME_STYLES[cKey].dotColor }}
                      title={THEME_STYLES[cKey].name}
                    />
                  ))}
                  <span className="text-[11px] font-medium text-slate-500 ml-2 capitalize">
                    {THEME_STYLES[newColor].name}
                  </span>
                </div>
              </div>

              {/* Daily Mood Emoji */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'የዕለቱ ስሜት ስቲከር' : 'Day Mood Sticker'}
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewMood(m)}
                      className={`text-xl p-1 rounded-lg cursor-pointer transition ${
                        newMood === m ? 'bg-black/10 dark:bg-white/20 scale-125' : 'hover:scale-110 opacity-70'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Review Text */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'የዕለቱ ግምገማና ማስታወሻ' : 'Daily Review & Debrief Note'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder={language === 'am' ? 'የዛሬ አፈጻጸምዎ እንዴት ነበር? ዋናው ስኬት ምን ነበር?' : 'How did deliberate execution go today? What was the primary victory?'}
                  className="w-full p-2.5 rounded-xl text-base sm:text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-medium resize-none"
                />
              </div>

              {/* Primary Win */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'am' ? 'ዋና ስኬት ወይም የተከናወነ ድል (አማራጭ)' : 'Key Accomplishment / Win (Optional)'}
                </label>
                <input
                  type="text"
                  value={newWin}
                  onChange={(e) => setNewWin(e.target.value)}
                  placeholder={language === 'am' ? 'ምሳሌ፡ 100% የታቀዱ ልምምዶችን ማጠናቀቅ' : 'e.g. 100% adherence on push power workout'}
                  className="w-full px-3 py-2 rounded-xl text-base sm:text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                >
                  {language === 'am' ? 'ማስታወሻውን መዝግብ' : 'Pin Sticky Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
