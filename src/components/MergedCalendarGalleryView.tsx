import React, { useState, useEffect } from 'react';
import { CalendarRange, CalendarDays, Star, PieChart } from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { IntegratedCalendarView } from './IntegratedCalendarView';
import { StreamCalendarSystemView } from './StreamCalendarSystemView';
import { DailyStickyNotesGalleryView } from './DailyStickyNotesGalleryView';
import { TripleEightLifeBalanceView } from './TripleEightLifeBalanceView';

export const MergedCalendarGalleryView: React.FC = () => {
  const { activeTab, language } = useLivotion();
  const [subTab, setSubTab] = useState<'planner' | 'calendar' | 'gallery' | 'triple-eight'>(() => {
    if (activeTab === 'notes-gallery') return 'gallery';
    if (activeTab === 'triple-eight') return 'triple-eight';
    return 'planner';
  });

  useEffect(() => {
    if (activeTab === 'notes-gallery') {
      setSubTab('gallery');
    } else if (activeTab === 'triple-eight' || activeTab === 'triple8') {
      setSubTab('triple-eight');
    } else if (activeTab === 'calendar') {
      if (subTab !== 'planner' && subTab !== 'calendar') {
        setSubTab('planner');
      }
    }
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen">
      {/* Top Segmented Sub-Nav: Expressed with only icons as requested */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-3 sm:pt-4 pb-1 flex justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs items-center gap-1">
          {/* 1. Tactical Stream Planner */}
          <button
            onClick={() => setSubTab('planner')}
            title={language === 'am' ? 'የዋና ዘርፎች ፕላነር' : 'Tactical Stream Planner'}
            aria-label="Tactical Stream Planner"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              subTab === 'planner'
                ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs scale-105'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <CalendarRange size={18} />
          </button>

          {/* 2. Stream Calendar System (Beside Sticky Gallery & Triple 8) */}
          <button
            onClick={() => setSubTab('calendar')}
            title={language === 'am' ? 'የቀን መቁጠሪያ ሰሌዳ' : 'Stream Calendar System'}
            aria-label="Stream Calendar System"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              subTab === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs scale-105'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <CalendarDays size={18} />
          </button>
          
          {/* 3. Sticky Notes Gallery */}
          <button
            onClick={() => setSubTab('gallery')}
            title={language === 'am' ? 'የስቲኪ ማስታወሻ ጋለሪ' : 'Sticky Notes Gallery'}
            aria-label="Sticky Notes Gallery"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              subTab === 'gallery'
                ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-xs scale-105'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Star size={18} className={subTab === 'gallery' ? 'fill-amber-400 text-amber-500' : ''} />
          </button>

          {/* 4. 24h Life Balance (8/8/8) */}
          <button
            onClick={() => setSubTab('triple-eight')}
            title={language === 'am' ? '24 ሰዓት ሚዛን (8/8/8)' : '24h Balance (8/8/8)'}
            aria-label="24h Triple-8 Life Balance"
            className={`p-2 sm:px-3 sm:py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              subTab === 'triple-eight'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs scale-105'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <PieChart size={18} className={subTab === 'triple-eight' ? 'text-purple-600 dark:text-purple-400' : ''} />
          </button>
        </div>
      </div>

      {/* Render Active Sub-View */}
      {subTab === 'planner' ? (
        <IntegratedCalendarView />
      ) : subTab === 'calendar' ? (
        <StreamCalendarSystemView />
      ) : subTab === 'gallery' ? (
        <DailyStickyNotesGalleryView />
      ) : (
        <TripleEightLifeBalanceView />
      )}
    </div>
  );
};
