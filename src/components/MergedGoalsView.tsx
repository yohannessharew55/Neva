import React, { useState, useEffect } from 'react';
import { Target, PieChart } from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { StrategicHorizonsView } from './StrategicHorizonsView';
import { TripleEightLifeBalanceView } from './TripleEightLifeBalanceView';

export const MergedGoalsView: React.FC = () => {
  const { activeTab, language } = useLivotion();
  const [subTab, setSubTab] = useState<'goals' | 'triple-eight'>(() => {
    return activeTab === 'triple-eight' ? 'triple-eight' : 'goals';
  });

  useEffect(() => {
    if (activeTab === 'triple-eight') {
      setSubTab('triple-eight');
    } else if (activeTab === 'goals') {
      setSubTab('goals');
    }
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen">
      {/* Top Segmented Sub-Nav: Strategic Goals vs 24h Triple Eight Balance */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-3 sm:pt-5 pb-1 flex justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
          <button
            onClick={() => setSubTab('goals')}
            className={`flex items-center gap-2 py-1.5 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              subTab === 'goals'
                ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Target size={16} />
            <span>{language === 'am' ? 'ስልታዊ ግቦች' : 'Strategic Goals'}</span>
          </button>
          <button
            onClick={() => setSubTab('triple-eight')}
            className={`flex items-center gap-2 py-1.5 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              subTab === 'triple-eight'
                ? 'bg-white dark:bg-slate-900 text-indigo-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <PieChart size={16} />
            <span>{language === 'am' ? '24 ሰዓት ሚዛን (8/8/8)' : '24h Life Balance (8/8/8)'}</span>
          </button>
        </div>
      </div>

      {/* Render Active Sub-View */}
      {subTab === 'goals' ? (
        <StrategicHorizonsView />
      ) : (
        <TripleEightLifeBalanceView />
      )}
    </div>
  );
};
