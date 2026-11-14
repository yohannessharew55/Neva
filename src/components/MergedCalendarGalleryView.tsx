import React, { useState, useEffect } from 'react';
import { CalendarDays, Star } from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { IntegratedCalendarView } from './IntegratedCalendarView';
import { DailyStickyNotesGalleryView } from './DailyStickyNotesGalleryView';

export const MergedCalendarGalleryView: React.FC = () => {
  const { activeTab, language } = useLivotion();
  const [subTab, setSubTab] = useState<'calendar' | 'gallery'>(() => {
    return activeTab === 'notes-gallery' ? 'gallery' : 'calendar';
  });

  useEffect(() => {
    if (activeTab === 'notes-gallery') {
      setSubTab('gallery');
    } else if (activeTab === 'calendar') {
      setSubTab('calendar');
    }
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen">
      {/* Top Segmented Sub-Nav: Calendar vs Sticky Notes Gallery */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-3 sm:pt-5 pb-1 flex justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <button
            onClick={() => setSubTab('calendar')}
            className={`flex items-center gap-2 py-1.5 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              subTab === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <CalendarDays size={16} />
            <span>{language === 'am' ? 'ቀን መቁጠሪያ (🇪🇹/ዓ.ም)' : 'Calendar & Schedule'}</span>
          </button>
          <button
            onClick={() => setSubTab('gallery')}
            className={`flex items-center gap-2 py-1.5 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              subTab === 'gallery'
                ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Star size={16} className={subTab === 'gallery' ? 'fill-amber-400 text-amber-500' : ''} />
            <span>{language === 'am' ? 'የስቲኪ ማስታወሻ ጋለሪ' : 'Sticky Notes Gallery'}</span>
          </button>
        </div>
      </div>

      {/* Render Active Sub-View */}
      {subTab === 'calendar' ? (
        <IntegratedCalendarView />
      ) : (
        <DailyStickyNotesGalleryView />
      )}
    </div>
  );
};
