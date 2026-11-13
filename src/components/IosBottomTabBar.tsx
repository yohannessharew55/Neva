import React from 'react';
import { 
  Calendar, CalendarDays, Dumbbell, BookOpen, 
  Target, Timer, Star
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';

export const IosBottomTabBar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    selectedCategoryId, 
    setSelectedCategoryId,
    language,
    t
  } = useLivotion();

  const tabs = [
    { id: 'cockpit', label: t('navToday'), icon: Calendar },
    { id: 'notes-gallery', label: language === 'am' ? 'ማስታወሻ ⭐' : 'Gallery ⭐', icon: Star },
    { id: 'calendar', label: language === 'am' ? 'ቀን' : 'Calendar', icon: CalendarDays },
    { id: 'fitness', label: t('navWorkouts'), icon: Dumbbell },
    { id: 'devotion', label: language === 'am' ? 'ጸሎት' : 'Devotion', icon: BookOpen },
    { id: 'goals', label: t('navGoals'), icon: Target },
    { id: 'practice', label: language === 'am' ? 'ትኩረት' : 'Focus', icon: Timer },
  ];

  const handleTabClick = (tabId: string) => {
    setSelectedCategoryId(null);
    setActiveTab(tabId);
  };

  return (
    <nav 
      aria-label="iPhone Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0b0f17]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),12px)] transition-colors select-none shadow-lg"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !selectedCategoryId;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-150 cursor-pointer active:scale-90 ${
                isActive 
                  ? 'text-[#0082ff] font-bold' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform ${isActive ? 'scale-110' : ''}`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0082ff]" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-[56px] ${
                isActive ? 'font-bold' : 'font-medium'
              }`}>
                {tab.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* iOS Home Indicator Bar representation on standalone PWAs */}
      <div className="w-32 h-1 bg-slate-300/80 dark:bg-slate-700/80 rounded-full mx-auto mt-2 pointer-events-none opacity-40 sm:opacity-0" />
    </nav>
  );
};
