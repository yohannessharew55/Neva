import React from 'react';
import { LivotionProvider, useLivotion } from './context/LivotionContext';
import { Navbar } from './components/Navbar';
import { TodayCockpitV2 } from './components/TodayCockpitV2';
import { FitnessProtocolView } from './components/FitnessProtocolView';
import { DevotionProtocolView } from './components/DevotionProtocolView';
import { PrecisionNutritionView } from './components/PrecisionNutritionView';
import { StrategicHorizonsView } from './components/StrategicHorizonsView';
import { PracticeFlowView } from './components/PracticeFlowView';
import { FloatingMiniTimerWindow } from './components/FloatingMiniTimerWindow';
import { CategoryDetailView } from './components/CategoryDetailView';
import { MergedCalendarGalleryView } from './components/MergedCalendarGalleryView';
import { MergedGoalsView } from './components/MergedGoalsView';
import { IntegratedCalendarView } from './components/IntegratedCalendarView';
import { DailyStickyNotesGalleryView } from './components/DailyStickyNotesGalleryView';
import { IosNotesAppView } from './components/IosNotesAppView';
import { TripleEightLifeBalanceView } from './components/TripleEightLifeBalanceView';
import { IosBottomTabBar } from './components/IosBottomTabBar';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { SettingsModal } from './components/SettingsModal';
import { AutoUpdateBanner } from './components/AutoUpdateBanner';
import { SplashMotionIntro } from './components/SplashMotionIntro';
import { TimerCompletionModal } from './components/TimerCompletionModal';
import { TaskAlarmBanner } from './components/TaskAlarmBanner';
import { PlanningModal } from './components/PlanningModal';
import { Plus } from 'lucide-react';
import { soundEngine } from './utils/audio';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Neva App Render Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#faf9f6] dark:bg-[#0b0f17] text-slate-800 dark:text-slate-100 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0082ff] mx-auto flex items-center justify-center font-bold text-2xl">
              N
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              N e v a Recovery
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {this.state.error?.message || 'The page encountered a temporary issue.'}
            </p>
            <button
              onClick={() => {
                try {
                  localStorage.clear();
                } catch (e) {}
                window.location.href = '/';
              }}
              className="px-5 py-2.5 bg-[#0082ff] hover:bg-[#0070df] text-white rounded-2xl text-xs font-bold cursor-pointer transition shadow-xs"
            >
              Reload & Clear Cache
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainContent: React.FC = () => {
  const { activeTab, selectedCategoryId, categoryPlans } = useLivotion();

  // If a valid category deep-dive is selected (from menu or category click), show its big dedicated page!
  if (
    selectedCategoryId && 
    selectedCategoryId !== 'null' && 
    selectedCategoryId !== 'undefined' && 
    categoryPlans && 
    categoryPlans[selectedCategoryId]
  ) {
    return (
      <main className="flex-1 w-full animate-fadeIn pb-24 md:pb-8">
        <CategoryDetailView />
      </main>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'calendar':
        return <IntegratedCalendarView />;
      case 'notes-gallery':
        return <DailyStickyNotesGalleryView />;
      case 'triple-eight':
      case 'triple8':
        return <TripleEightLifeBalanceView />;
      case 'fitness':
        return <FitnessProtocolView />;
      case 'devotion':
        return <DevotionProtocolView />;
      case 'nutrition':
        return <PrecisionNutritionView />;
      case 'goals':
        return <IntegratedCalendarView initialHorizon="goals" />;
      case 'practice':
        return <PracticeFlowView />;
      case 'notes':
        return <IosNotesAppView />;
      case 'cockpit':
      default:
        return <TodayCockpitV2 />;
    }
  };

  return (
    <main className="flex-1 w-full animate-fadeIn pb-24 md:pb-8">
      {renderActiveView()}
    </main>
  );
};

const AppFooter: React.FC = () => {
  const { language } = useLivotion();
  return (
    <footer className="hidden md:block border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#0b0f17]/50 py-5 px-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {language === 'am' ? 'ኔ ቫ' : 'N e v a'}
        </span>
        <span>
          {language === 'am' ? 'የዕለታዊ ትኩረትና የልህቀት ማስፈጸሚያ ሥርዓት' : 'Minimalist Daily Focus & Categorized Mastery'}
        </span>
        <span>
          {language === 'am' ? 'በPostgreSQL ክላውድ የተመሳሰለ • iOS PWA' : 'PostgreSQL & Cloud Synced • iOS PWA Standalone'}
        </span>
      </div>
    </footer>
  );
};

export const App: React.FC = () => {
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);

  return (
    <ErrorBoundary>
      <LivotionProvider>
        <SplashMotionIntro />
        <AutoUpdateBanner />
        <TaskAlarmBanner />
        <FloatingMiniTimerWindow />
        <TimerCompletionModal />
        <div className="min-h-screen max-w-full overflow-x-clip bg-[#fcfbf9] text-slate-800 dark:bg-[#0b0f17] dark:text-slate-100 flex flex-col w-full font-sans transition-colors selection:bg-[#0082ff] selection:text-white">
          <Navbar />
          <DeviceSyncModal />
          <ManageCategoriesModal />
          <SettingsModal />
          <MainContent />
          <IosBottomTabBar />
          <AppFooter />

          {/* Mobile Sleek Quick-Add Floating Action Button (Elevated comfortably above iPhone X home indicator & bottom dock) */}
          <button
            type="button"
            onClick={() => {
              try { soundEngine.playPencil(); } catch {}
              setIsQuickAddOpen(true);
            }}
            className="md:hidden fixed bottom-[max(calc(env(safe-area-inset-bottom,0px)+104px),108px)] right-4.5 z-30 w-12 h-12 rounded-full bg-gradient-to-tr from-[#0070df] to-[#00a2ff] text-white flex items-center justify-center shadow-xl shadow-blue-500/40 active:scale-90 transition-all cursor-pointer border border-white/25 hover:brightness-110"
            title="Quick Add Plan Block"
            aria-label="Quick Add Plan Block"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>

          <PlanningModal 
            isOpen={isQuickAddOpen} 
            onClose={() => setIsQuickAddOpen(false)} 
          />
        </div>
      </LivotionProvider>
    </ErrorBoundary>
  );
};

export default App;
