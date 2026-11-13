import React, { useState } from 'react';
import { 
  Volume2, VolumeX, Bell, Waves, Play, Pause, 
  Sparkles, Check, X, Shield, Smartphone, Sliders
} from 'lucide-react';
import { 
  soundEngine, 
  FocusSoundSettings, 
  StartSoundType, 
  AlarmSoundType, 
  AmbienceType 
} from '../utils/audio';
import { iosNativeBridge } from '../utils/iosNativeBridge';

interface FocusSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'am';
}

const START_SOUND_OPTIONS: Array<{ id: StartSoundType; nameEn: string; nameAm: string; descEn: string }> = [
  { id: 'gentle_bell', nameEn: 'Gentle Bell', nameAm: 'ለስላሳ ደወል', descEn: 'Pure 528Hz calming tone' },
  { id: 'tibetan_bowl', nameEn: 'Tibetan Singing Bowl', nameAm: 'ቲቤታን ቦውል', descEn: 'Deep resonant spiritual overtone' },
  { id: 'zen_gong', nameEn: 'Zen Bronze Gong', nameAm: 'የዜን ጎንግ', descEn: 'Deep brass focus gong' },
  { id: 'crystal_chime', nameEn: 'Crystal Chimes', nameAm: 'ክሪስታል ቻይምስ', descEn: 'Sparkling ascending chord' },
  { id: 'none', nameEn: 'Silent (No Sound)', nameAm: 'ጸጥታ (ድምፅ የለም)', descEn: 'Completely quiet focus' }
];

const ALARM_SOUND_OPTIONS: Array<{ id: AlarmSoundType; nameEn: string; nameAm: string; descEn: string }> = [
  { id: 'tibetan_bowl', nameEn: 'Tibetan Singing Bowl', nameAm: 'ቲቤታን ቦውል', descEn: 'Warm harmonic multi-tone bowl' },
  { id: 'temple_bell', nameEn: 'Sacred Temple Bell', nameAm: 'የቤተመቅደስ ደወል', descEn: 'Clear resonant monastery bell' },
  { id: 'zen_gong', nameEn: 'Zen Bronze Gong', nameAm: 'የዜን ጎንግ', descEn: 'Authoritative peaceful bronze gong' },
  { id: 'sacred_chimes', nameEn: 'Sacred Triad Chimes', nameAm: 'ቅዱስ ቻይምስ', descEn: 'Harmonic 3-stage chimes' },
  { id: 'gentle_harp', nameEn: 'Gentle Harp Chords', nameAm: 'የበገና ቅኝት', descEn: 'Uplifting celestial arpeggio' },
  { id: 'digital_alert', nameEn: 'Digital Flow Beep', nameAm: 'ዲጂታል አለርት', descEn: 'Modern energetic dual-tone' },
  { id: 'none', nameEn: 'Silent (Vibrate Only)', nameAm: 'ጸጥታ (ንዝረት ብቻ)', descEn: 'Discreet haptic finish' }
];

const AMBIENCE_OPTIONS: Array<{ id: AmbienceType; nameEn: string; nameAm: string; descEn: string }> = [
  { id: 'none', nameEn: 'No Ambience', nameAm: 'ድባብ የለም', descEn: 'Pure silence while working' },
  { id: 'alpha432', nameEn: '432Hz Alpha Waves', nameAm: '432Hz አልፋ ሞገድ', descEn: 'Binaural meditative flow frequency' },
  { id: 'rain', nameEn: 'Peaceful Rain', nameAm: 'የዝናብ ድምፅ', descEn: 'Soothing organic rainfall' },
  { id: 'forest_stream', nameEn: 'Forest Stream & Wind', nameAm: 'የምንጭ ውኃ ድምፅ', descEn: 'Filtered gentle natural stream' },
  { id: 'white_noise', nameEn: 'Deep White Noise', nameAm: 'ነጭ ጫጫታ', descEn: 'Consistent focus masking sound' }
];

export const FocusSoundModal: React.FC<FocusSoundModalProps> = ({ isOpen, onClose, language }) => {
  const [settings, setSettings] = useState<FocusSoundSettings>(() => soundEngine.getSettings());
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = (updated: Partial<FocusSoundSettings>) => {
    const next = { ...settings, ...updated };
    setSettings(next);
    soundEngine.saveSettings(next);
  };

  const previewStartSound = (type: StartSoundType) => {
    setPreviewingSound(`start-${type}`);
    iosNativeBridge.haptic('light');
    soundEngine.playStartSound(type, settings.masterVolume);
    setTimeout(() => setPreviewingSound(null), 2500);
  };

  const previewAlarmSound = (type: AlarmSoundType) => {
    setPreviewingSound(`alarm-${type}`);
    iosNativeBridge.haptic('medium');
    soundEngine.playAlarmSound(type, settings.masterVolume);
    setTimeout(() => setPreviewingSound(null), 3000);
  };

  const toggleAmbiencePreview = (type: AmbienceType) => {
    if (previewingSound === `ambience-${type}`) {
      soundEngine.stopAmbience();
      setPreviewingSound(null);
    } else {
      setPreviewingSound(`ambience-${type}`);
      iosNativeBridge.haptic('light');
      soundEngine.startAmbience(type, settings.ambienceVolume);
    }
  };

  const handleClose = () => {
    soundEngine.stopAmbience();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-[#121927] border border-blue-500/20 dark:border-blue-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'am' ? 'የFocus ፕሮግራሞች የድምፅ መረጣ' : 'Focus Sound & Alarm Chooser'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === 'am' ? 'ደወሎች፣ የቲቤታን ቦውል፣ ዜን ጎንግ እና ድባብ' : 'Bells, Tibetan bowls, zen gongs & ambient flow'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Tabs / Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Master Volume Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Sliders size={14} className="text-blue-500" />
                {language === 'am' ? 'ዋና የድምፅ መጠን' : 'Master Audio Volume'}
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleUpdate({ masterVolume: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* 1. Timer Completion Alarm Sound */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Bell size={14} className="text-amber-500" />
                <span>{language === 'am' ? 'የክፍለ-ጊዜ ማጠናቀቂያ ደወል / አለርት' : 'Focus Completion Alarm Bell'}</span>
              </label>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                {language === 'am' ? 'ሰዓቱ ሲያልቅ ይደውላል' : 'Plays when time is up'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALARM_SOUND_OPTIONS.map((item) => {
                const isSelected = settings.alarmSound === item.id;
                const isPlaying = previewingSound === `alarm-${item.id}`;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      handleUpdate({ alarmSound: item.id });
                      if (item.id !== 'none') previewAlarmSound(item.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">
                        {language === 'am' ? item.nameAm : item.nameEn}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {item.descEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.id !== 'none' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewAlarmSound(item.id);
                          }}
                          className={`p-1.5 rounded-lg text-xs transition ${
                            isPlaying
                              ? 'bg-blue-500 text-white animate-pulse'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                          }`}
                          title="Preview sound"
                        >
                          <Play size={12} />
                        </button>
                      )}
                      {isSelected && <Check size={14} className="text-blue-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Focus Start Sound */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-500" />
                <span>{language === 'am' ? 'የክፍለ-ጊዜ መጀመሪያ ድምፅ' : 'Focus Start Chime'}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {START_SOUND_OPTIONS.map((item) => {
                const isSelected = settings.startSound === item.id;
                const isPlaying = previewingSound === `start-${item.id}`;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      handleUpdate({ startSound: item.id });
                      if (item.id !== 'none') previewStartSound(item.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">
                        {language === 'am' ? item.nameAm : item.nameEn}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {item.descEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.id !== 'none' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewStartSound(item.id);
                          }}
                          className={`p-1.5 rounded-lg text-xs transition ${
                            isPlaying
                              ? 'bg-blue-500 text-white animate-pulse'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                          }`}
                          title="Preview sound"
                        >
                          <Play size={12} />
                        </button>
                      )}
                      {isSelected && <Check size={14} className="text-blue-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Continuous Flow Ambience */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Waves size={14} className="text-teal-500" />
                <span>{language === 'am' ? 'የማሰላሰልና የትኩረት ድባብ (Ambience)' : 'Focus Background Ambience'}</span>
              </label>
              {settings.ambience !== 'none' && (
                <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                  {Math.round(settings.ambienceVolume * 100)}%
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AMBIENCE_OPTIONS.map((item) => {
                  const isSelected = settings.ambience === item.id;
                  const isPlaying = previewingSound === `ambience-${item.id}`;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        handleUpdate({ ambience: item.id });
                        if (item.id === 'none') {
                          soundEngine.stopAmbience();
                          setPreviewingSound(null);
                        } else {
                          toggleAmbiencePreview(item.id);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-teal-500/10 dark:bg-teal-500/20 border-teal-500 text-teal-700 dark:text-teal-300 shadow-xs'
                          : 'bg-white dark:bg-[#121927] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {language === 'am' ? item.nameAm : item.nameEn}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {item.descEn}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.id !== 'none' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAmbiencePreview(item.id);
                            }}
                            className={`p-1.5 rounded-lg text-xs transition ${
                              isPlaying
                                ? 'bg-teal-500 text-white'
                                : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                            }`}
                            title="Play/Stop ambience"
                          >
                            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                          </button>
                        )}
                        {isSelected && <Check size={14} className="text-teal-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {settings.ambience !== 'none' && (
                <div className="p-3 bg-teal-50/40 dark:bg-teal-950/20 rounded-xl border border-teal-200/60 dark:border-teal-900/40 flex items-center gap-3">
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 shrink-0">
                    {language === 'am' ? 'የድባብ መጠን' : 'Ambience Level'}:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.ambienceVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      handleUpdate({ ambienceVolume: v });
                      if (soundEngine.isAmbiencePlaying()) {
                        soundEngine.startAmbience(settings.ambience, v);
                      }
                    }}
                    className="w-full accent-teal-600 h-1.5 bg-teal-200/50 dark:bg-teal-900/50 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 4. iPhone Haptics & Critical Alarm Toggle */}
          <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Smartphone size={18} className="text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'am' ? 'የiPhone Taptic ንዝረትና የማንቂያ ደወል' : 'iPhone Taptic Engine & Alarm Sync'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {language === 'am' ? 'iOS 16+ Time-Sensitive ማንቂያ ጋር ይገናኛል' : 'Integrates with iOS 16+ time-sensitive alarms & Reminders'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.vibrationEnabled;
                handleUpdate({ vibrationEnabled: next });
                if (next) iosNativeBridge.haptic('success');
              }}
              className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                settings.vibrationEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
          <button
            onClick={() => {
              // Test Alarm right now
              soundEngine.playAlarmSound(settings.alarmSound, settings.masterVolume);
              if (settings.vibrationEnabled) iosNativeBridge.haptic('heavy');
            }}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <Bell size={13} className="text-amber-500" />
            <span>{language === 'am' ? 'አሁን ደውል (Test)' : 'Test Alarm'}</span>
          </button>

          <button
            onClick={handleClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>{language === 'am' ? 'ተጠናቋል' : 'Done & Apply'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
