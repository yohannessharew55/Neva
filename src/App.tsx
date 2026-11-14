import React from 'react';
import { LivotionProvider, useLivotion } from './context/LivotionContext';
import { Navbar } from './components/Navbar';
import { TodayCockpitV2 } from './components/TodayCockpitV2';
import { FitnessProtocolView } from './components/FitnessProtocolView';
import { DevotionProtocolView } from './components/DevotionProtocolView';
import { PrecisionNutritionView } from './components/PrecisionNutritionView';
import { StrategicHorizonsView } from './components/StrategicHorizonsView';
import { PracticeFlowView } from './components/PracticeFlowView';
import { CategoryDetailView } from './components/CategoryDetailView';
import { MergedCalendarGalleryView } from './components/MergedCalendarGalleryView';
import { MergedGoalsView } from './components/MergedGoalsView';
import { IntegratedCalendarView } from './components/IntegratedCalendarView';
import { DailyStickyNotesGalleryView } from './components/DailyStickyNotesGalleryView';
import { IosNotesAppView } from './components/IosNotesAppView';
import { TripleEightLifeBalanceView } from './components/TripleEightLifeBalanceView';
import { IosBottomTabBar } from './components/IosBottomTabBar';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { SplashMotionIntro } from './components/SplashMotionIntro';

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
  const { activeTab, selectedCategoryId } = useLivotion();

  // If a valid category deep-dive is selected (from menu or category click), show its big dedicated page!
  if (selectedCategoryId && selectedCategoryId !== 'null' && selectedCategoryId !== 'undefined') {
    return (
      <main className="flex-1 w-full animate-fadeIn pb-24 md:pb-8">
        <CategoryDetailView />
      </main>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'notes-gallery':
      case 'calendar':
        return <MergedCalendarGalleryView />;
      case 'fitness':
      case 'devotion':
      case 'nutrition':
        return <DevotionProtocolView />;
      case 'goals':
        return <MergedGoalsView />;
      case 'practice':
        return <PracticeFlowView />;
      case 'notes':
        return <IosNotesAppView />;
      case 'triple-eight':
        return <TripleEightLifeBalanceView />;
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
  return (
    <ErrorBoundary>
      <LivotionProvider>
        <SplashMotionIntro />
        <div className="min-h-screen max-w-full overflow-x-clip bg-[#fcfbf9] text-slate-800 dark:bg-[#0b0f17] dark:text-slate-100 flex flex-col w-full font-sans transition-colors selection:bg-[#0082ff] selection:text-white">
          <Navbar />
          <DeviceSyncModal />
          <MainContent />
          <IosBottomTabBar />
          <AppFooter />
        </div>
      </LivotionProvider>
    </ErrorBoundary>
  );
};

export default App;
