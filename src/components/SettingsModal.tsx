import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, X, Sun, Moon, Globe, Volume2, 
  VolumeX, Bell, Vibrate, Check, Play, Smartphone, 
  Download, Upload, RotateCcw, Sparkles, User, Shield, 
  Sliders, SlidersHorizontal, CheckCircle2, ChevronRight, Layers,
  Palette, Calendar, Clock
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { AccentColor, CalendarSystem } from '../types';
import { 
  soundEngine, 
  FocusSoundSettings, 
  TouchSoundType, 
  StartSoundType, 
  AlarmSoundType 
} from '../utils/audio';
import { iosNativeBridge } from '../utils/iosNativeBridge';

interface SettingsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export interface AccentColorOption {
  id: AccentColor;
  nameEn: string;
  nameAm: string;
  hex: string;
  tag: string;
}

export const ACCENT_COLOR_OPTIONS: AccentColorOption[] = [
  { id: 'blue', nameEn: 'Electric Blue', nameAm: 'ሰማያዊ', hex: '#0082ff', tag: 'Classic' },
  { id: 'emerald', nameEn: 'Emerald Green', nameAm: 'አረንጓዴ', hex: '#10b981', tag: 'Vitality' },
  { id: 'violet', nameEn: 'Royal Violet', nameAm: 'ወይንጠጅ', hex: '#8b5cf6', tag: 'Flow' },
  { id: 'amber', nameEn: 'Sunset Amber', nameAm: 'ብርቱካናማ', hex: '#f59e0b', tag: 'Energy' },
  { id: 'rose', nameEn: 'Crimson Rose', nameAm: 'ሮዝ ቀይ', hex: '#f43f5e', tag: 'Bold' },
  { id: 'cyan', nameEn: 'Cyber Cyan', nameAm: 'ሳይበር ሲያን', hex: '#06b6d4', tag: 'Crisp' },
  { id: 'indigo', nameEn: 'Deep Indigo', nameAm: 'ኢንዲጎ', hex: '#6366f1', tag: 'Wisdom' },
  { id: 'slate', nameEn: 'Obsidian Slate', nameAm: 'ኦብሲዲያን', hex: '#475569', tag: 'Stealth' }
];

const TOUCH_SOUND_OPTIONS: Array<{
  id: TouchSoundType;
  nameEn: string;
  nameAm: string;
  descEn: string;
  descAm: string;
  icon: string;
}> = [
  {
    id: 'pencil',
    nameEn: 'Pencil on Paper',
    nameAm: 'እርሳስ በወረቀት ላይ',
    descEn: 'Subtle, tactile graphite sketch sensation',
    descAm: 'ለስላሳ፣ የወረቀትና የእርሳስ ንክኪ ስሜት',
    icon: '✏️'
  },
  {
    id: 'pop',
    nameEn: 'Bubble Pop',
    nameAm: 'የአረፋ ድምፅ (ፖፕ)',
    descEn: 'Crisp, juicy modern interface pop',
    descAm: 'ደማቅ እና ዘመናዊ የፖፕ ንክኪ ድምፅ',
    icon: '🫧'
  },
  {
    id: 'click',
    nameEn: 'Mechanical Switch',
    nameAm: 'ሜካኒካል ክሊክ',
    descEn: 'Tactile, crisp precision switch tick',
    descAm: 'ጥርት ያለ የሜካኒክስ ቁልፍ ንክኪ',
    icon: '🔘'
  },
  {
    id: 'chime',
    nameEn: 'Crystal Micro-Chime',
    nameAm: 'ክሪስታል ጥቃቅን ቻይም',
    descEn: 'Peaceful, uplifting zen chime tone',
    descAm: 'ረጋ ያለ መንፈሳዊ የብርሃን ቅላጼ',
    icon: '🔔'
  },
  {
    id: 'wood',
    nameEn: 'Woodblock Tap',
    nameAm: 'የእንጨት ንክኪ',
    descEn: 'Warm, organic resonant wooden acoustic',
    descAm: 'ተፈጥሯዊ እና ሞቅ ያለ የእንጨት ምት',
    icon: '🪵'
  },
  {
    id: 'none',
    nameEn: 'Silent / Muted',
    nameAm: 'ጸጥታ (ድምፅ አልባ)',
    descEn: 'Completely silent touches and taps',
    descAm: 'ምንም አይነት የንክኪ ድምፅ የለም',
    icon: '🔇'
  }
];

const START_SOUND_OPTIONS: Array<{ id: StartSoundType; nameEn: string; nameAm: string }> = [
  { id: 'gentle_bell', nameEn: 'Gentle Bell', nameAm: 'ለስላሳ ደወል' },
  { id: 'tibetan_bowl', nameEn: 'Tibetan Singing Bowl', nameAm: 'ቲቤታን ቦውል' },
  { id: 'zen_gong', nameEn: 'Zen Bronze Gong', nameAm: 'የዜን ጎንግ' },
  { id: 'crystal_chime', nameEn: 'Crystal Chimes', nameAm: 'ክሪስታል ቻይምስ' },
  { id: 'none', nameEn: 'Silent', nameAm: 'ጸጥታ' }
];

const ALARM_SOUND_OPTIONS: Array<{ id: AlarmSoundType; nameEn: string; nameAm: string }> = [
  { id: 'tibetan_bowl', nameEn: 'Tibetan Singing Bowl', nameAm: 'ቲቤታን ቦውል' },
  { id: 'temple_bell', nameEn: 'Sacred Temple Bell', nameAm: 'የቤተመቅደስ ደወል' },
  { id: 'zen_gong', nameEn: 'Zen Bronze Gong', nameAm: 'የዜን ጎንግ' },
  { id: 'sacred_chimes', nameEn: 'Sacred Chimes', nameAm: 'ቅዱስ ቻይምስ' },
  { id: 'gentle_harp', nameEn: 'Gentle Harp', nameAm: 'የበገና ቅኝት' },
  { id: 'digital_alert', nameEn: 'Digital Alert', nameAm: 'ዲጂታል አለርት' },
  { id: 'none', nameEn: 'Silent', nameAm: 'ጸጥታ' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose
}) => {
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    calendarSystem,
    setCalendarSystem,
    timeFormat,
    setTimeFormat,
    language,
    setLanguage,
    openSyncModal,
    exportDataJson,
    importDataJson
  } = useLivotion();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isSettingsModalOpen;
  const handleClose = propOnClose !== undefined ? propOnClose : closeSettingsModal;

  const [activeTab, setActiveTab] = useState<'general' | 'audio' | 'data'>('general');
  const [soundSettings, setSoundSettings] = useState<FocusSoundSettings>(() => soundEngine.getSettings());
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state if localStorage changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSoundSettings(soundEngine.getSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateSoundSettings = (updates: Partial<FocusSoundSettings>) => {
    const next = { ...soundSettings, ...updates };
    setSoundSettings(next);
    soundEngine.saveSettings(next);
  };

  const handleSelectTouchSound = (type: TouchSoundType) => {
    updateSoundSettings({ touchSoundType: type, touchSoundEnabled: type !== 'none' });
    setPreviewingId(`touch-${type}`);
    iosNativeBridge.haptic('light');
    if (type !== 'none') {
      soundEngine.playTouchSound(type, soundSettings.touchSoundVolume);
    }
    setTimeout(() => setPreviewingId(null), 600);
  };

  const handlePreviewStartSound = (type: StartSoundType) => {
    setPreviewingId(`start-${type}`);
    iosNativeBridge.haptic('light');
    soundEngine.playStartSound(type, soundSettings.masterVolume);
    setTimeout(() => setPreviewingId(null), 2000);
  };

  const handlePreviewAlarmSound = (type: AlarmSoundType) => {
    setPreviewingId(`alarm-${type}`);
    iosNativeBridge.haptic('medium');
    soundEngine.playAlarmSound(type, soundSettings.masterVolume);
    setTimeout(() => setPreviewingId(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        importDataJson(text);
        showToast(language === 'am' ? 'መረጃ በተሳካ ሁኔታ ተመልሷል!' : 'Data restored successfully!');
        try { soundEngine.playTouchSound('chime'); } catch {}
      } catch (err) {
        showToast(language === 'am' ? 'የተሳሳተ የፋይል ቅርጸት!' : 'Invalid JSON file format!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className="bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0082ff]/10 text-[#0082ff] flex items-center justify-center shrink-0 shadow-2xs">
              <SettingsIcon size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{language === 'am' ? 'ስርዓት እና ምርጫዎች' : 'System Settings'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'am' ? 'ቋንቋ፣ ገጽታ፣ የንክኪ ድምፅ እና የማከማቻ ምርጫዎች' : 'Theme, language, touch sounds, and storage'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer active:scale-90"
            title={language === 'am' ? 'ዝጋ' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn shrink-0">
            <CheckCircle2 size={15} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-1.5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800/80 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('general');
              soundEngine.playTouchSound();
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-[#0082ff] text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun size={14} />
            <span>{language === 'am' ? 'ገጽታና ቋንቋ' : 'General & Theme'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('audio');
              soundEngine.playTouchSound();
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-[#0082ff] text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Volume2 size={14} />
            <span>{language === 'am' ? 'የንክኪና የሰዓት ድምፆች' : 'Sound & Tactile'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('data');
              soundEngine.playTouchSound();
            }}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'bg-[#0082ff] text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Download size={14} />
            <span>{language === 'am' ? 'መረጃና ማከማቻ' : 'Data & Cloud'}</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">

          {/* TAB 1: GENERAL & THEME */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Appearance / Theme Mode Card */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sun size={14} className="text-amber-500" />
                      <span>{language === 'am' ? 'የስርዓት ገጽታ (Theme)' : 'Appearance & Theme'}</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'am' ? 'የቀን እና የሌሊት ገጽታ ይቀያይሩ' : 'Switch between light and dark display mode'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      soundEngine.playTouchSound();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      theme === 'light'
                        ? 'bg-white border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-slate-900'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                        <Sun size={17} />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{language === 'am' ? 'ብርሃን (Light)' : 'Light Studio'}</div>
                        <div className="text-[10px] text-slate-400">{language === 'am' ? 'ንጹህ ነጭ ገጽታ' : 'Crisp daylight'}</div>
                      </div>
                    </div>
                    {theme === 'light' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      soundEngine.playTouchSound();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      theme === 'dark'
                        ? 'bg-[#121927] border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-white'
                        : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                        <Moon size={17} />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{language === 'am' ? 'ጨለማ (Dark)' : 'Midnight Dark'}</div>
                        <div className="text-[10px] text-slate-400">{language === 'am' ? 'ለዓይን ምቹ ጥቁር' : 'OLED deep slate'}</div>
                      </div>
                    </div>
                    {theme === 'dark' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                  </button>
                </div>
              </div>

              {/* Theme Accent Color Selection Card */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Palette size={14} className="text-[#0082ff]" />
                      <span>{language === 'am' ? 'የገጽታ ማድመቂያ ቀለም (Accent Color)' : 'Theme Accent Color'}</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'am'
                        ? 'ለመተግበሪያው ቁልፎች፣ ማድመቂያዎች እና ምልክቶች የሚሆን ቀለም ይምረጡ'
                        : 'Choose primary accent color for active buttons, tabs, badges, and highlights'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {ACCENT_COLOR_OPTIONS.map((opt) => {
                    const isSelected = accentColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setAccentColor(opt.id);
                          soundEngine.playTouchSound();
                          iosNativeBridge.haptic('light');
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 relative group ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 shadow-md ring-2'
                            : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        style={{
                          borderColor: isSelected ? opt.hex : undefined,
                          '--tw-ring-color': isSelected ? `${opt.hex}33` : undefined
                        } as React.CSSProperties}
                      >
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                          style={{ backgroundColor: opt.hex }}
                        >
                          {isSelected && <Check size={14} className="text-white stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {language === 'am' ? opt.nameAm : opt.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {opt.tag}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection Card */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Globe size={14} className="text-blue-500" />
                      <span>{language === 'am' ? 'የመተግበሪያ ቋንቋ' : 'Interface Language'}</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'am' ? 'የእንግሊዝኛ እና የአማርኛ አማራጭ' : 'Choose primary language for all labels and views'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      soundEngine.playTouchSound();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      language === 'en'
                        ? 'bg-white dark:bg-slate-800 border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🇬🇧</span>
                      <div>
                        <div className="text-xs font-bold">English</div>
                        <div className="text-[10px] text-slate-400">International</div>
                      </div>
                    </div>
                    {language === 'en' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('am');
                      soundEngine.playTouchSound();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      language === 'am'
                        ? 'bg-white dark:bg-slate-800 border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🇪🇹</span>
                      <div>
                        <div className="text-xs font-bold">አማርኛ</div>
                        <div className="text-[10px] text-slate-400">ኢትዮጵያ</div>
                      </div>
                    </div>
                    {language === 'am' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                  </button>
                </div>
              </div>

              {/* Calendar System: GC / ET / Dual */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#0082ff]" />
                    <span>{language === 'am' ? 'የቀን መቁጠሪያ ስርዓት (Calendar System)' : 'Calendar System'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0082ff]/10 text-[#0082ff] uppercase">
                    {calendarSystem.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'am'
                    ? 'በቀን፣ ሳምንት እና ወርሃዊ እቅድ ላይ የሚታየውን የቀን መቁጠሪያ ይምረጡ'
                    : 'Choose your default calendar format for daily, weekly, and monthly planning'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* GC */}
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarSystem('gc');
                      soundEngine.playTouchSound();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      calendarSystem === 'gc'
                        ? 'bg-white dark:bg-slate-800 border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg">🌍</span>
                      {calendarSystem === 'gc' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Gregorian (GC)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {language === 'am' ? 'ጎርጎሪዮሳዊ' : 'International Standard'}
                      </div>
                    </div>
                  </button>

                  {/* ET */}
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarSystem('et');
                      soundEngine.playTouchSound();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      calendarSystem === 'et'
                        ? 'bg-white dark:bg-slate-800 border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg">🇪🇹</span>
                      {calendarSystem === 'et' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Ethiopian (ET)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {language === 'am' ? 'የኢትዮጵያ ዘመን አቆጣጠር' : '13 Months of Sunshine (ዓ.ም)'}
                      </div>
                    </div>
                  </button>

                  {/* Dual */}
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarSystem('dual');
                      soundEngine.playTouchSound();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      calendarSystem === 'dual'
                        ? 'bg-white dark:bg-slate-800 border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg">⚖️</span>
                      {calendarSystem === 'dual' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Dual (ET + GC)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {language === 'am' ? 'ኢትዮጵያ + ጎርጎሪዮሳዊ' : 'Side-by-side both'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Time Display Format Setting (12-Hour vs 24-Hour) */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#0082ff]" />
                      <span>{language === 'am' ? 'የሰዓት አቀራረብ ስርዓት (Time Format)' : 'Time Display Format'}</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'am'
                        ? 'በ12 ሰዓት (AM/PM) እና በ24 ሰዓት ዓለም አቀፍ ቅርጸት መካከል ይምረጡ'
                        : 'Choose between 12-Hour (AM/PM) and 24-Hour (Military / International) format'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0082ff]/10 text-[#0082ff] uppercase font-mono">
                    {timeFormat.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTimeFormat('12h');
                      soundEngine.playTouchSound();
                      iosNativeBridge.haptic('light');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      timeFormat === '12h'
                        ? 'bg-white dark:bg-slate-800 border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-[#0082ff] flex items-center justify-center font-mono font-black text-xs">
                        12h
                      </div>
                      <div>
                        <div className="text-xs font-bold">{language === 'am' ? '12 ሰዓት (AM/PM)' : '12-Hour'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">02:30 PM</div>
                      </div>
                    </div>
                    {timeFormat === '12h' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTimeFormat('24h');
                      soundEngine.playTouchSound();
                      iosNativeBridge.haptic('light');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      timeFormat === '24h'
                        ? 'bg-white dark:bg-slate-800 border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/20 text-slate-900 dark:text-white'
                        : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-mono font-black text-xs">
                        24h
                      </div>
                      <div>
                        <div className="text-xs font-bold">{language === 'am' ? '24 ሰዓት (ዓለም አቀፍ)' : '24-Hour'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">14:30</div>
                      </div>
                    </div>
                    {timeFormat === '24h' && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SOUND & TACTILE SETTINGS */}
          {activeTab === 'audio' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Touch & Tap Feedback Sounds Selector */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-indigo-500" />
                      <span>{language === 'am' ? 'የንክኪ ድምፅ ምርጫ (Touch Sound Selection)' : 'Touch & Tap Feedback Sound'}</span>
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'am' ? 'ቁልፎችን እና ዕቅዶችን ሲነኩ የሚሰማውን ድምፅ ይምረጡ' : 'Choose acoustic feedback when tapping buttons, cards, and tabs'}
                    </p>
                  </div>

                  {/* Toggle Touch Sounds on/off */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundSettings.touchSoundEnabled;
                      updateSoundSettings({ touchSoundEnabled: next });
                      if (next) soundEngine.playTouchSound();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      soundSettings.touchSoundEnabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-transparent'
                    }`}
                  >
                    {soundSettings.touchSoundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                    <span>{soundSettings.touchSoundEnabled ? (language === 'am' ? 'በርቷል' : 'Enabled') : (language === 'am' ? 'ጠፍቷል' : 'Muted')}</span>
                  </button>
                </div>

                {/* Touch Sound Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {TOUCH_SOUND_OPTIONS.map((opt) => {
                    const isSelected = soundSettings.touchSoundType === opt.id;
                    const isPreviewing = previewingId === `touch-${opt.id}`;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectTouchSound(opt.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-[#0082ff] shadow-md ring-2 ring-[#0082ff]/25 text-slate-900 dark:text-white'
                            : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-lg shrink-0">{opt.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">
                              {language === 'am' ? opt.nameAm : opt.nameEn}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {language === 'am' ? opt.descAm : opt.descEn}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {opt.id !== 'none' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTouchSound(opt.id);
                              }}
                              className={`w-7 h-7 rounded-xl flex items-center justify-center transition cursor-pointer ${
                                isPreviewing
                                  ? 'bg-[#0082ff] text-white scale-110'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200'
                              }`}
                              title={language === 'am' ? 'ድምፁን አድምጥ' : 'Preview Sound'}
                            >
                              <Play size={10} fill="currentColor" />
                            </button>
                          )}
                          {isSelected && <CheckCircle2 size={16} className="text-[#0082ff]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Touch Sound Volume Slider */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 size={13} className="text-slate-400" />
                      <span>{language === 'am' ? 'የንክኪ ድምፅ መጠን' : 'Touch Sound Volume'}</span>
                    </span>
                    <span className="font-mono text-[#0082ff]">
                      {Math.round((soundSettings.touchSoundVolume ?? 0.7) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundSettings.touchSoundVolume ?? 0.7}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateSoundSettings({ touchSoundVolume: val });
                      soundEngine.playTouchSound(undefined, val);
                    }}
                    className="w-full accent-[#0082ff] cursor-pointer"
                  />
                </div>

                {/* Vibration / Haptic Feedback Switch */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Vibrate size={13} className="text-pink-500" />
                      <span>{language === 'am' ? 'የንዝረት ንክኪ (Haptic Feedback)' : 'Haptic Vibration Feedback'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {language === 'am' ? 'በስልኮች ላይ ሲነኩ ጥቃቅን ንዝረት ይሰጣል' : 'Tactile vibration pulse on mobile taps and actions'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundSettings.vibrationEnabled;
                      updateSoundSettings({ vibrationEnabled: next });
                      if (next) iosNativeBridge.haptic('medium');
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      soundSettings.vibrationEnabled ? 'bg-[#0082ff]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span 
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        soundSettings.vibrationEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`} 
                    />
                  </button>
                </div>
              </div>

              {/* Timer Focus Bells & Alarm Sounds */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Bell size={14} className="text-amber-500" />
                  <span>{language === 'am' ? 'የትኩረት ሰዓት ድምፆች (Timer & Bell)' : 'Timer & Focus Bell Sounds'}</span>
                </span>

                {/* Focus Start Bell */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>{language === 'am' ? 'ሰዓት ሲጀምር የሚሰማ ድምፅ' : 'Session Start Sound'}</span>
                    <span className="font-mono text-[#0082ff] font-bold text-[10px]">
                      {START_SOUND_OPTIONS.find(s => s.id === soundSettings.startSound)?.nameEn || 'Gentle Bell'}
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={soundSettings.startSound}
                      onChange={(e) => {
                        const val = e.target.value as StartSoundType;
                        updateSoundSettings({ startSound: val });
                        handlePreviewStartSound(val);
                      }}
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0082ff]"
                    >
                      {START_SOUND_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {language === 'am' ? opt.nameAm : opt.nameEn}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handlePreviewStartSound(soundSettings.startSound)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Play size={11} fill="currentColor" />
                      <span>{language === 'am' ? 'አድምጥ' : 'Test'}</span>
                    </button>
                  </div>
                </div>

                {/* Focus Alarm Sound */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>{language === 'am' ? 'ሰዓት ሲጠናቀቅ የሚሰማ ደወል' : 'Completion Alarm Sound'}</span>
                    <span className="font-mono text-amber-500 font-bold text-[10px]">
                      {ALARM_SOUND_OPTIONS.find(a => a.id === soundSettings.alarmSound)?.nameEn || 'Tibetan Bowl'}
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={soundSettings.alarmSound}
                      onChange={(e) => {
                        const val = e.target.value as AlarmSoundType;
                        updateSoundSettings({ alarmSound: val });
                        handlePreviewAlarmSound(val);
                      }}
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {ALARM_SOUND_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {language === 'am' ? opt.nameAm : opt.nameEn}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handlePreviewAlarmSound(soundSettings.alarmSound)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Play size={11} fill="currentColor" />
                      <span>{language === 'am' ? 'አድምጥ' : 'Test'}</span>
                    </button>
                  </div>
                </div>

                {/* Master Volume Slider */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 size={13} className="text-slate-400" />
                      <span>{language === 'am' ? 'አጠቃላይ የድምፅ መጠን' : 'Master Audio Volume'}</span>
                    </span>
                    <span className="font-mono text-[#0082ff]">
                      {Math.round((soundSettings.masterVolume ?? 0.8) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundSettings.masterVolume ?? 0.8}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateSoundSettings({ masterVolume: val });
                    }}
                    className="w-full accent-[#0082ff] cursor-pointer"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: DATA & STORAGE */}
          {activeTab === 'data' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Cloud Account & Profile */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-slate-50 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-slate-800/80 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#0082ff] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {language === 'am' ? 'የግል መለያ እና ክላውድ ሲንክ' : 'Personal Profile & Cloud Sync'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {language === 'am' ? 'በስልክ እና በኮምፒውተር መካከል መረጃን ያመሳስሉ' : 'Keep your execution data in sync across iPhone & Mac'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    openSyncModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold transition cursor-pointer shadow-2xs shrink-0 active:scale-95"
                >
                  {language === 'am' ? 'ክፈት' : 'Manage'}
                </button>
              </div>

              {/* JSON Backup & Restore Card */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Download size={14} className="text-emerald-500" />
                  <span>{language === 'am' ? 'የመረጃ ምትኬ (Backup & Restore)' : 'Offline Backup & Transfer'}</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'am' ? 'ሁሉንም ዕቅዶችና ዘርፎች በJSON ፋይል ያውርዱ ወይም መልሰው ይጫኑ' : 'Save all tasks, roadmaps, and categories to a JSON file or import back'}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      exportDataJson();
                      showToast(language === 'am' ? 'ፋይሉ ወርዷል!' : 'Backup JSON exported!');
                      try { soundEngine.playTouchSound('pop'); } catch {}
                    }}
                    className="flex-1 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download size={13} className="text-emerald-500" />
                    <span>{language === 'am' ? 'ምትኬ አውርድ' : 'Export JSON'}</span>
                  </button>

                  <label className="flex-1 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload size={13} className="text-blue-500" />
                    <span>{language === 'am' ? 'ምትኬ ጫን' : 'Import JSON'}</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Version & Build Footprint */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px]">NEVA OS • Mastery Engine</div>
                  <div className="text-[10px] font-mono">v1.0.8 (Full Bundle Standalone + OTA Sync)</div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                  READY
                </span>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
          >
            {language === 'am' ? 'ተጠናቋል' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
