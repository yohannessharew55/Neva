import React, { useState } from 'react';
import { 
  Sun, Moon, Download, Upload, RotateCcw, 
  Menu, X, Calendar, Dumbbell, Target, Timer, 
  MoreHorizontal, Swords, ChessKnight, Palette, Music, Building2, 
  TrendingUp, BookOpen, Shield, ChevronRight,
  PlusCircle, CalendarDays, CalendarRange, BellRing, Plus, Sparkles, Database, Cloud, Star,
  Languages, Globe, SquarePen, StickyNote, User, LogOut,
  PieChart, RefreshCw, Trash2, FileText, Trophy, Settings as SettingsIcon
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { PlanningModal } from './PlanningModal';
import { ReminderCenterModal } from './ReminderCenterModal';
import { NewCategoryModal } from './NewCategoryModal';
import { ClearScratchPasswordModal } from './ClearScratchPasswordModal';
import { WeeklyMasteryReviewModal } from './WeeklyMasteryReviewModal';
import { syncStateToCloud } from '../utils/cloudSync';
import { soundEngine } from '../utils/audio';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    theme,
    toggleTheme,
    language,
    toggleLanguage,
    setLanguage,
    t,
    getCategoryTitleTranslated,
    exportDataJson, 
    importDataJson, 
    resetAllData,
    tasks,
    categoryPlans,
    deleteCategoryPlan,
    openManageCategoriesModal,
    selectedCategoryId,
    setSelectedCategoryId,
    openNewCategoryModal,
    openSyncModal,
    openSettingsModal,
    cloudSyncStatus,
    cloudDatabase,
    syncKey,
    currentUser,
    logoutUser,
    syncNow
  } = useLivotion();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; title: string } | null>(null);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  const getIconForCategory = (id: string) => {
    switch (id) {
      case 'chess': return ChessKnight;
      case 'art': return Palette;
      case 'music': return Music;
      case 'exercise': return Dumbbell;
      case 'architecture': return Building2;
      case 'trading': return TrendingUp;
      case 'devotion': return BookOpen;
      default: return Shield;
    }
  };

  const navItems = [
    { id: 'cockpit', label: t('navToday'), icon: Calendar },
    { id: 'calendar', label: language === 'am' ? 'ዕቅድ' : 'Plan', icon: CalendarRange },
    { id: 'practice', label: t('navFocusTimer'), icon: Timer },
    { id: 'notes', label: language === 'am' ? 'ማስታወሻ' : 'Notes', icon: FileText },
  ];


  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setActiveTab('cockpit');
    setDrawerOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const success = importDataJson(text);
          if (success) {
            alert('Data restored successfully!');
          } else {
            alert('Invalid backup JSON file.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const allCategories = Object.values(categoryPlans).filter(cat => cat && cat.id);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors pt-[max(env(safe-area-inset-top),16px)] pb-2 sm:pt-0 sm:pb-0 shadow-xs">
        <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Left: Hamburger Button & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Main Hamburger Menu Button - Restored to comfortable touch size */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-90 min-w-[40px] min-h-[40px]"
              title={language === 'am' ? 'ማውጫ ክፈት' : 'Open Categories & Menu'}
            >
              <Menu size={18} />
              <span className="hidden sm:inline text-xs font-bold text-slate-600 dark:text-slate-300">{t('menu')}</span>
            </button>

            {/* Logo - Always clean single-line N E V A on mobile and desktop */}
            <div 
              onClick={() => {
                if (activeTab === 'cockpit' && !selectedCategoryId) {
                  window.dispatchEvent(new CustomEvent('neva-replay-splash'));
                } else {
                  setSelectedCategoryId(null);
                  setActiveTab('cockpit');
                }
              }}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0 active:scale-95 transition-transform"
              title="Home (Click to replay N e v a intro)"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0082ff] text-white flex items-center justify-center font-black text-sm tracking-tight shadow-sm group-hover:scale-105 transition-transform shrink-0">
                N
              </div>
              <span className="font-black text-sm sm:text-base tracking-[0.24em] uppercase text-slate-900 dark:text-white font-sans whitespace-nowrap shrink-0 select-none">
                N E V A
              </span>
            </div>
          </div>

          {/* Clean Center Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-full border border-slate-200/60 dark:border-slate-800 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = !selectedCategoryId && (
                item.id === 'cockpit' ? activeTab === 'cockpit' :
                item.id === 'calendar' ? (activeTab === 'calendar' || activeTab === 'goals' || activeTab === 'notes-gallery' || activeTab === 'triple-eight') :
                item.id === 'practice' ? activeTab === 'practice' :
                item.id === 'notes' ? activeTab === 'notes' :
                activeTab === item.id
              );
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setActiveTab(item.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#0082ff] shadow-xs font-bold dark:bg-slate-900 dark:text-[#0082ff]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-[#0082ff]' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons - Restored to previous comfortable size */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Add Category Button */}
            <button
              onClick={() => openNewCategoryModal()}
              className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              title={t('addNewCategory')}
            >
              <Plus size={13} />
              <span>{t('category')}</span>
            </button>

            {/* Day progress indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{completedCount}/{totalCount} {t('done')}</span>
            </div>

            {/* Language Switcher (EN 🇬🇧 <-> አማ 🇪🇹) - hidden on mobile, placed inside Hamburger Drawer */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex h-9 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer active:scale-90 min-w-[38px] min-h-[36px] items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
              title={language === 'en' ? 'ወደ አማርኛ ቀይር (Switch to Amharic)' : 'Switch to English (ወደ እንግሊዝኛ ቀይር)'}
            >
              <Languages size={15} className="text-[#0082ff]" />
              <span className="font-extrabold text-xs tracking-tight">
                {language === 'en' ? 'አማ' : 'EN'}
              </span>
            </button>

            {/* Theme Toggle (Daytime vs Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer active:scale-90 min-w-[40px] min-h-[40px] flex items-center justify-center shadow-2xs"
              title={theme === 'light' ? t('themeDark') : t('themeLight')}
            >
              {theme === 'light' ? (
                <Sun size={18} className="text-amber-500 fill-amber-400" />
              ) : (
                <Moon size={18} className="text-cyan-400" />
              )}
            </button>

            {/* More Dropdown (Account, Options & Backup) */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer active:scale-90 min-w-[40px] min-h-[40px] flex items-center justify-center relative shadow-2xs"
                title={currentUser ? `@${currentUser.username} (${t('options')})` : t('options')}
              >
                {currentUser ? (
                  currentUser.avatarPhoto ? (
                    <img 
                      src={currentUser.avatarPhoto} 
                      alt={currentUser.name} 
                      className="w-6 h-6 rounded-full object-cover ring-2 ring-[#0082ff]/60 shadow-xs" 
                    />
                  ) : (
                    <div 
                      className="w-6 h-6 rounded-md text-white font-black text-xs flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: currentUser.avatarColor || '#0082ff' }}
                    >
                      {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                    </div>
                  )
                ) : (
                  <MoreHorizontal size={18} />
                )}
                {/* Active indicator dot */}
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-transparent'}`} />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-76 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 z-50 text-xs font-medium space-y-2.5 animate-scale-in">
                  
                  {/* Personal Account / Profile Section */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-slate-50 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-slate-800/80 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
                    {currentUser ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-11 h-11 rounded-2xl overflow-hidden text-white font-black text-lg flex items-center justify-center shadow-md ring-2 ring-blue-500/30 shrink-0"
                            style={{ backgroundColor: currentUser.avatarColor || '#0082ff' }}
                          >
                            {currentUser.avatarPhoto ? (
                              <img src={currentUser.avatarPhoto} alt={currentUser.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              <span className="truncate">{currentUser.name}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Cloud Active" />
                            </div>
                            <div className="text-[10px] font-mono text-[#0082ff] font-bold truncate">
                              @{currentUser.username}
                            </div>
                            {currentUser.role && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">
                                {currentUser.role}
                              </div>
                            )}
                          </div>
                        </div>

                        {currentUser.motto && (
                          <div className="text-[10px] italic text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800 line-clamp-2">
                            "{currentUser.motto}"
                          </div>
                        )}

                        {/* Account Staffs & Actions Bar */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <button
                            onClick={() => {
                              setShowMoreMenu(false);
                              openSyncModal();
                            }}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/60 dark:border-slate-700/60 shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                          >
                            <User size={13} className="text-[#0082ff]" />
                            <span>Manage Profile & Sync</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#0082ff]/10 text-[#0082ff] border border-[#0082ff]/20 flex items-center justify-center shrink-0">
                            <User size={17} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              Personal Profile
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              Sign in to sync across devices
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false);
                            openSyncModal();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[#0082ff] text-white font-bold text-[10px] shadow-2xs hover:bg-[#0070df] transition cursor-pointer active:scale-95 shrink-0"
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Programs & Protocols: Devotion, Nutrition, Exercise */}
                  <div className="p-2 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <div className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                      {language === 'am' ? 'ፕሮግራሞችና ፕሮቶኮሎች' : 'Programs & Protocols'}
                    </div>

                    {/* Devotion Protocol */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setActiveTab('devotion');
                        setShowMoreMenu(false);
                        try { soundEngine.playTouchSound(); } catch {}
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-between transition cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                          🙏
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {language === 'am' ? 'የጸሎትና መንፈሳዊ ፕሮቶኮል' : 'Devotion Protocol'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {language === 'am' ? 'የሰንበት እረፍት፣ መጽሐፍ ቅዱስና ጸሎት' : 'Sabbath rest, scripture & prayer'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={13} className="text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Meal Plan & Nutrition */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setActiveTab('nutrition');
                        setShowMoreMenu(false);
                        try { soundEngine.playTouchSound(); } catch {}
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-between transition cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                          🥗
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {language === 'am' ? 'የምግብ እቅድና ኒውትሪሽን' : 'Meal Plan & Nutrition'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {language === 'am' ? 'ማክሮ፣ ካሎሪና ጤናማ አመጋገብ' : 'Macros, calories & hydration'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={13} className="text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Exercise & Fitness Plan */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setActiveTab('fitness');
                        setShowMoreMenu(false);
                        try { soundEngine.playTouchSound(); } catch {}
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-between transition cursor-pointer group shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm group-hover:scale-105 transition-transform">
                          🏋️‍♂️
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                            {language === 'am' ? 'የአካል ብቃትና ስፖርት እቅድ' : 'Exercise & Fitness Plan'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {language === 'am' ? 'የጡንቻ ጥንካሬ፣ ካርዲዮና እረፍት ሰዓት' : 'Splits, movements & rest timer'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={13} className="text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>

                  {/* System Settings Primary Action */}
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      openSettingsModal();
                      try { soundEngine.playTouchSound(); } catch {}
                    }}
                    className="w-full text-left p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-purple-900/20 border border-blue-200/80 dark:border-blue-800/80 hover:border-[#0082ff] flex items-center justify-between cursor-pointer transition-all shadow-2xs group active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#0082ff] text-white flex items-center justify-center shadow-xs group-hover:rotate-45 transition-transform duration-300">
                        <SettingsIcon size={16} />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#0082ff] transition-colors">
                          {language === 'am' ? 'ስርዓት እና ቅንብሮች' : 'System Settings'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {language === 'am' ? 'ገጽታ፣ የንክኪ ድምፅ፣ ቋንቋ...' : 'Theme, Touch Sounds, Audio...'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-[#0082ff] group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {/* Quick Controls: Theme & Language */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Quick Theme Switcher */}
                    <button
                      onClick={() => {
                        toggleTheme();
                        try { soundEngine.playTouchSound(); } catch {}
                      }}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      {theme === 'dark' ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-indigo-500" />}
                      <span>{theme === 'dark' ? (language === 'am' ? 'ብርሃን' : 'Light') : (language === 'am' ? 'ጨለማ' : 'Dark')}</span>
                    </button>

                    {/* Quick Language Toggle */}
                    <button
                      onClick={() => {
                        toggleLanguage();
                        try { soundEngine.playTouchSound(); } catch {}
                      }}
                      className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      <Globe size={13} className="text-[#0082ff]" />
                      <span>{language === 'am' ? 'English (GB)' : 'አማርኛ (ET)'}</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    onClick={() => {
                      exportDataJson();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-bold text-xs transition"
                  >
                    <Download size={14} /> {t('backupData')}
                  </button>
                  <label className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-bold text-xs transition">
                    <Upload size={14} /> {t('restoreData')}
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowClearModal(true);
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-gradient-to-r from-rose-50/80 to-amber-50/40 dark:from-rose-950/30 dark:to-slate-900/40 border border-rose-200/80 dark:border-rose-900/60 hover:border-rose-400 dark:hover:border-rose-700 flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 text-white flex items-center justify-center shadow-xs group-hover:rotate-[-45deg] transition-all duration-300 shrink-0">
                        <RotateCcw size={13} strokeWidth={2.5} />
                      </div>
                      <span className="font-black text-xs text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {language === 'am' ? 'ሁሉንም አጥፋ' : 'Clear All Data'}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0 flex items-center gap-1 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-2xs">
                      <Sparkles size={9} />
                      <span>Scratch</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Navbar Structural Layout Spacer (prevents page content from sliding under the fixed header) */}
      <div 
        className="w-full pt-[max(env(safe-area-inset-top),16px)] pb-2 sm:pt-0 sm:pb-0 pointer-events-none select-none invisible" 
        aria-hidden="true"
      >
        <div className="h-13 sm:h-16" />
      </div>

      {/* Slide-over Hamburger Drawer with Categories */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
          />

          {/* Drawer Sidebar */}
          <div className="relative w-84 max-w-[85vw] bg-white dark:bg-[#121927] border-r border-slate-200 dark:border-slate-800 h-full p-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),20px)] flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Top */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#0082ff] text-white flex items-center justify-center font-black text-xs">
                    N
                  </div>
                  <span className="font-black text-sm tracking-[0.24em] uppercase text-slate-900 dark:text-white font-sans">
                    N E V A
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                  title={t('close')}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Personal Profile Card */}
              <div 
                onClick={() => {
                  setDrawerOpen(false);
                  openSyncModal();
                }}
                className="relative overflow-hidden p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-[#151c2e] dark:via-[#192238] dark:to-[#1a2035] border border-blue-200/80 dark:border-indigo-900/50 flex items-center justify-between gap-3 cursor-pointer hover:border-[#0082ff] dark:hover:border-indigo-500/60 transition-all duration-300 shadow-[0_2px_12px_-2px_rgba(0,130,255,0.06)] hover:shadow-md group"
              >
                {/* Ambient glow */}
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10 flex items-center gap-3 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-xl overflow-hidden text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-blue-500/20 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: currentUser?.avatarColor || '#0082ff' }}
                  >
                    {currentUser ? (
                      currentUser.avatarPhoto ? (
                        <img src={currentUser.avatarPhoto} alt={currentUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}</span>
                      )
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      <span className="truncate">{currentUser ? currentUser.name : (language === 'am' ? 'የግል መገለጫ' : 'Personal Profile')}</span>
                      {currentUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />}
                    </div>
                    <div className="text-[10px] font-mono text-[#0082ff] dark:text-sky-400 font-bold truncate flex items-center gap-1">
                      <Cloud size={10} className="shrink-0" />
                      <span className="truncate">{currentUser ? `@${currentUser.username}` : (language === 'am' ? 'ይግቡና ዳታ ያመሳስሉ' : 'Sign in & Cloud Sync')}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 w-7 h-7 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-[#0082ff] group-hover:border-blue-200 dark:group-hover:border-blue-800 group-hover:translate-x-0.5 transition-all shrink-0">
                  <ChevronRight size={14} />
                </div>
              </div>

              {/* Main Categories Section */}
              <div className="space-y-2">
                {/* Header Row: Title & + Add Button */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Sparkles size={12} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        {t('categoriesTitle')}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0082ff] dark:text-sky-400 text-[10px] font-mono font-black border border-blue-200/60 dark:border-blue-900/60">
                        {allCategories.length}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      openNewCategoryModal();
                    }}
                    className="px-3 py-1 rounded-full bg-[#0082ff] hover:bg-[#0070df] text-white text-[11px] font-bold shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus size={12} strokeWidth={2.5} />
                    <span>{language === 'am' ? 'አዲስ' : 'Add'}</span>
                  </button>
                </div>

                {/* Sub-toolbar: Manage modal & Review */}
                <div className="flex items-center justify-between gap-2 px-1 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      openManageCategoriesModal();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5"
                    title={language === 'am' ? 'ሁሉንም ዘርፎች በዝርዝር አስተዳድር' : 'Manage all streams & priorities'}
                  >
                    <SettingsIcon size={12} />
                    <span>{language === 'am' ? 'ዘርፎችን አስተዳድር' : 'Manage Streams'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowWeeklyReviewModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5"
                    title={language === 'am' ? 'ሳምንታዊ ግምገማ እና የደረጃዎች እድገት' : 'Weekly Review & Milestones'}
                  >
                    <Trophy size={12} className="text-amber-500" />
                    <span>{language === 'am' ? 'ሳምንታዊ ግምገማ' : 'Weekly Review'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 px-1 font-medium leading-relaxed">
                  {language === 'am' 
                    ? 'ሙሉ እቅዶችን፣ ስኬቶችንና ቀጣይ ደረጃዎችን ለማየት ማንኛውንም ዘርፍ ይንኩ።' 
                    : 'Click any category to open its full plan, achievements, and roadmap.'}
                </p>

                <div className="space-y-1.5 max-h-[56vh] overflow-y-auto pr-1">
                  {allCategories.map((cat) => {
                    const CatIcon = getIconForCategory(cat.id);
                    const isCurrentSelected = selectedCategoryId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className={`w-full text-left p-2.5 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer group ${
                          isCurrentSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 shadow-2xs'
                            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                        }`}
                        onClick={() => handleSelectCategory(cat.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                            style={{ 
                              backgroundColor: `${cat.color}18`, 
                              color: cat.color,
                              border: `1px solid ${cat.color}35`
                            }}
                          >
                            <CatIcon size={16} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-[#0082ff] block truncate">
                              {getCategoryTitleTranslated(cat.id, cat.title)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60">
                                {cat.weeklyTargetHours}{t('hoursShort')} / {language === 'am' ? 'ሳምንት' : 'week'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-[#0082ff] group-hover:border-blue-200 group-hover:translate-x-0.5 transition-all shrink-0 ml-2">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

                <div className="pt-3 pb-1 text-center text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none">
                  NEVA Standalone • v1.0.4
                </div>
              </div>


          </div>
        </div>
      )}

      {/* Planning Modal */}
      <PlanningModal
        isOpen={showPlanningModal}
        onClose={() => setShowPlanningModal(false)}
      />

      {/* Schedule Reminder Center Modal */}
      <ReminderCenterModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />

      {/* Add Mainstream Category Modal */}
      <NewCategoryModal />

      {/* Clear All Data Password Verification Modal */}
      <ClearScratchPasswordModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
      />

      {/* Weekly Mastery Review & Milestone Progress Modal */}
      <WeeklyMasteryReviewModal
        isOpen={showWeeklyReviewModal}
        onClose={() => setShowWeeklyReviewModal(false)}
      />

      {/* Delete Main Stream Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {language === 'am' ? `${categoryToDelete.title} ዋና ዘርፍ ሰርዝ?` : `Delete ${categoryToDelete.title}?`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'am' ? 'ዘርፍን በቋሚነት የማስወገድ ማረጋገጫ' : 'Confirm Permanent Removal'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'am' 
                ? `ይህ "${categoryToDelete.title}" የሚለውን ዋና ዘርፍ፣ የተመዘገቡትን ዕለታዊ ዕቅዶች እና የጊዜ ሰሌዳ ተግባራት በሙሉ ከስርዓቱ ያጠፋዋል። እርግጠኛ ነዎት?` 
                : `Are you sure you want to permanently delete "${categoryToDelete.title}"? This will remove its roadmap, daily plans, and all associated scheduled activities.`}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                {language === 'am' ? 'ይቅር / ተመለስ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCategoryPlan(categoryToDelete.id);
                  setCategoryToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Trash2 size={13} />
                <span>{language === 'am' ? 'በቋሚነት ሰርዝ' : 'Delete Stream'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
