import React, { useState } from 'react';
import { 
  Sun, Moon, Download, Upload, RotateCcw, 
  Menu, X, Calendar, Dumbbell, Target, Timer, 
  MoreHorizontal, Swords, Palette, Music, Building2, 
  TrendingUp, BookOpen, Shield, ChevronRight, SlidersHorizontal,
  PlusCircle, CalendarDays, BellRing, Plus, Sparkles, Database, Cloud, Star,
  Languages, Globe, SquarePen, StickyNote, User, LogOut,
  PieChart
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { PlanningModal } from './PlanningModal';
import { ReminderCenterModal } from './ReminderCenterModal';
import { NewCategoryModal } from './NewCategoryModal';
import { QuickScratchModal } from './QuickScratchModal';
import { syncStateToCloud } from '../utils/cloudSync';

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
    setSelectedCategoryId,
    openNewCategoryModal,
    openSyncModal,
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
  const [showScratchModal, setShowScratchModal] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  const getIconForCategory = (id: string) => {
    switch (id) {
      case 'chess': return Swords;
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
    { id: 'notes-gallery', label: t('navStickyGallery'), icon: Star },
    { id: 'calendar', label: t('navCalendar'), icon: CalendarDays },
    { id: 'fitness', label: t('navWorkouts'), icon: Dumbbell },
    { id: 'devotion', label: language === 'am' ? 'ጸሎት' : 'Devotion', icon: BookOpen },
    { id: 'goals', label: t('navGoals'), icon: Target },
    { id: 'practice', label: t('navFocusTimer'), icon: Timer },
    { id: 'triple-eight', label: language === 'am' ? '24 ሰዓት ሚዛን' : '24h Balance', icon: PieChart },
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

  const allCategories = Object.values(categoryPlans);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full bg-white/95 dark:bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors pt-[max(env(safe-area-inset-top),16px)] pb-2 sm:pt-0 sm:pb-0 shadow-xs">
        <div className="w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Left: Hamburger Button & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Main Hamburger Menu Button - Ergonomic 42x42px touch target */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-90 min-w-[40px] min-h-[40px]"
              title={language === 'am' ? 'ማውጫ ክፈት' : 'Open Categories & Menu'}
            >
              <Menu size={19} />
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
              const isActive = activeTab === item.id;
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

          {/* Right Action Icons - Uncluttered on mobile, secondary actions moved under hamburger drawer */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Schedule Reminders & Alarms Button - Always accessible on mobile & desktop */}
            <button
              onClick={() => setShowReminderModal(true)}
              className="flex p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer relative active:scale-90 min-w-[40px] min-h-[40px] items-center justify-center shadow-2xs"
              title={language === 'am' ? 'አስታዋሾች እና የማንቂያ ደወል (Reminders & Alarms)' : 'Reminders & Alarms Hub'}
            >
              <BellRing size={18} className="text-[#0082ff]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>

            {/* Plan Routine Button - hidden on mobile, placed inside Hamburger Drawer */}
            <button
              onClick={() => setShowPlanningModal(true)}
              className="hidden sm:flex h-10 px-3 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-90 shrink-0"
              title={t('plan')}
            >
              <PlusCircle size={15} />
              <span className="hidden sm:inline">{t('plan')}</span>
            </button>

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
              className="hidden sm:flex h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer active:scale-90 min-w-[42px] min-h-[40px] items-center justify-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
              title={language === 'en' ? 'ወደ አማርኛ ቀይር (Switch to Amharic)' : 'Switch to English (ወደ እንግሊዝኛ ቀይር)'}
            >
              <Languages size={16} className="text-[#0082ff]" />
              <span className="font-extrabold text-xs tracking-tight">
                {language === 'en' ? 'አማ' : 'EN'}
              </span>
            </button>



            {/* Quick Scratchpad / Classic Note Icon - Always visible on mobile & desktop navbar */}
            <button
              onClick={() => setShowScratchModal(true)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-500 hover:text-amber-600 transition cursor-pointer active:scale-90 min-w-[40px] min-h-[40px] flex items-center justify-center relative shadow-2xs"
              title={language === 'am' ? 'ፈጣን ማስታወሻ' : 'Quick Scratch & Notes'}
            >
              <StickyNote size={18} className="text-amber-500 fill-amber-400/20" />
            </button>

            {/* Theme Toggle (Daytime vs Dark) - Quick ergonomic access on mobile & desktop */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer active:scale-90 min-w-[40px] min-h-[40px] flex items-center justify-center"
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
                      className="w-5 h-5 rounded-md text-white font-black text-[10px] flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: currentUser.avatarColor || '#0082ff' }}
                    >
                      {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                    </div>
                  )
                ) : (
                  <MoreHorizontal size={18} />
                )}
                {/* Active indicator dot */}
                <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-transparent'}`} />
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
                            className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] border border-slate-200/60 dark:border-slate-700/60 shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                          >
                            <User size={12} className="text-[#0082ff]" />
                            <span>Profile</span>
                          </button>
                          <button
                            onClick={async () => {
                              setShowMoreMenu(false);
                              await syncNow();
                            }}
                            className="py-1.5 px-2 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold text-[10px] shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 shrink-0"
                            title="Sync all data to cloud"
                          >
                            <Cloud size={12} className={cloudSyncStatus === 'syncing' ? 'animate-spin' : ''} />
                            <span>{cloudSyncStatus === 'syncing' ? 'Syncing' : 'Sync'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowMoreMenu(false);
                              if (confirm(language === 'am' ? 'ከአካውንትዎ መውጣት ይፈልጋሉ? የአሁን ዳታዎ በዚህ ስልክ ላይ ተቀምጦ ይቆያል።' : `Sign out of @${currentUser.username}? Your local data will remain safe.`)) {
                                logoutUser();
                              }
                            }}
                            className="py-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10px] shadow-2xs flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 shrink-0"
                            title="Sign out of account"
                          >
                            <LogOut size={12} />
                            <span>Sign Out</span>
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
                  
                  {/* Language Selection Bar (Moved from Hamburger Drawer) */}
                  <div className="p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                    <button
                      onClick={() => {
                        setLanguage('en');
                        setShowMoreMenu(false);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        language === 'en'
                          ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="font-extrabold text-[10px] font-mono">GB</span>
                      <span>English</span>
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('am');
                        setShowMoreMenu(false);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        language === 'am'
                          ? 'bg-white text-[#0082ff] shadow-xs dark:bg-slate-900 dark:text-[#0082ff]'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="font-extrabold text-[10px] font-mono">ET</span>
                      <span>አማርኛ</span>
                    </button>
                  </div>

                  {/* Quick Actions Bar (Moved from Hamburger Drawer) */}
                  <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                    {/* 1. Database Sync Icon Button */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        openSyncModal();
                      }}
                      className="flex-1 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0082ff] transition cursor-pointer active:scale-95 flex items-center justify-center relative shadow-2xs border border-slate-200/50 dark:border-slate-700/50"
                      title={language === 'am' ? `የዳታቤዝ ማመሳሰያ (${cloudDatabase})` : `Database Sync (${cloudDatabase})`}
                    >
                      <Cloud size={16} className={cloudSyncStatus === 'syncing' ? 'animate-pulse' : ''} />
                      <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${cloudSyncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    </button>

                    {/* 2. Reminders Icon Button */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowReminderModal(true);
                      }}
                      className="flex-1 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer active:scale-95 flex items-center justify-center relative shadow-2xs border border-slate-200/50 dark:border-slate-700/50"
                      title={t('reminders')}
                    >
                      <BellRing size={16} className="text-[#0082ff]" />
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    </button>

                    {/* 3. Planning Icon Button */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowPlanningModal(true);
                      }}
                      className="flex-1 py-2 rounded-lg bg-[#0082ff] hover:bg-[#0070df] text-white transition cursor-pointer active:scale-95 flex items-center justify-center shadow-xs"
                      title={t('plan')}
                    >
                      <PlusCircle size={16} />
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  {/* 24h Triple-8 Life Balance View */}
                  <button
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setActiveTab('triple-eight');
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer font-bold text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <PieChart size={14} className="text-[#0082ff]" />
                      <span>{language === 'am' ? 'የ24 ሰዓት ሚዛን (8/8/8)' : '24h Triple-8 Balance'}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#0082ff]">
                      8/8/8
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      exportDataJson();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={14} /> {t('backupData')}
                  </button>
                  <label className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer">
                    <Upload size={14} /> {t('restoreData')}
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    onClick={() => {
                      openSyncModal();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Cloud size={14} className="text-[#0082ff]" /> {language === 'am' ? 'የዳታቤዝ ማመሳሰያ' : 'Cross-Device Sync'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </button>
                  {currentUser && (
                    <>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          if (confirm(language === 'am' ? 'ከአካውንትዎ መውጣት ይፈልጋሉ? የአሁን ዳታዎ በዚህ ስልክ ላይ ተቀምጦ ይቆያል።' : `Sign out of @${currentUser.username}? Your local data will remain safe on this device.`)) {
                            logoutUser();
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-between cursor-pointer font-bold"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut size={14} /> {language === 'am' ? 'ከአካውንት ውጣ' : 'Sign Out'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">@{currentUser.username}</span>
                      </button>
                    </>
                  )}
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                  <button
                    onClick={() => {
                      if (confirm(language === 'am' ? 'ሁሉንም ዳታ አጥፍተው ከመጀመሪያ መጀመር ይፈልጋሉ?' : 'Clear all data and start completely from scratch?')) {
                        resetAllData();
                        setShowMoreMenu(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={14} /> {t('resetAllDefaults')}
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
                className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-slate-50 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-slate-800/80 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-between gap-2.5 cursor-pointer hover:border-[#0082ff] transition shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-xl overflow-hidden text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0"
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      <span className="truncate">{currentUser ? currentUser.name : 'Personal Profile'}</span>
                      {currentUser && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />}
                    </div>
                    <div className="text-[10px] font-mono text-[#0082ff] font-bold truncate">
                      {currentUser ? `@${currentUser.username}` : 'Sign in & Cloud Sync'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 shrink-0" />
              </div>

              {/* Main Categories Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    {t('categoriesTitle')} ({allCategories.length})
                  </span>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      openNewCategoryModal();
                    }}
                    className="text-[11px] font-bold text-[#0082ff] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={12} /> {language === 'am' ? 'አዲስ ዘርፍ' : 'Add New'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 px-2 pb-1">
                  {language === 'am' 
                    ? 'ሙሉ እቅዶችን፣ ስኬቶችንና ቀጣይ ደረጃዎችን ለማየት ማንኛውንም ዘርፍ ይንኩ።' 
                    : 'Click any category to open its full plan, achievements, and roadmap.'}
                </p>

                <div className="space-y-1 max-h-[36vh] overflow-y-auto pr-1">
                  {allCategories.map((cat) => {
                    const CatIcon = getIconForCategory(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.id)}
                        className="w-full text-left p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          >
                            <CatIcon size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#0082ff] block">
                              {getCategoryTitleTranslated(cat.id, cat.title)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {cat.weeklyTargetHours}{t('hoursShort')} / {language === 'am' ? 'ሳምንት' : 'week'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-[#0082ff] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Navigation Section */}
              <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block px-2">
                  {t('systemViews')}
                </span>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setActiveTab(item.id);
                        setDrawerOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Icon size={15} className="text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
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

      {/* Quick Scratchpad Floating Modal */}
      <QuickScratchModal
        isOpen={showScratchModal}
        onClose={() => setShowScratchModal(false)}
        onOpenNotesApp={() => {
          setSelectedCategoryId(null);
          setActiveTab('notes');
        }}
      />

      {/* Add Mainstream Category Modal */}
      <NewCategoryModal />
    </>
  );
};
