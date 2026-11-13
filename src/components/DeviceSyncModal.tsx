import React, { useState } from 'react';
import { 
  X, Cloud, Check, Copy, RefreshCw, Smartphone, 
  Monitor, Database, ShieldCheck, ArrowRight, Sparkles 
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';

export const DeviceSyncModal: React.FC = () => {
  const { 
    isSyncModalOpen, 
    closeSyncModal, 
    syncKey, 
    setSyncKey, 
    cloudSyncStatus, 
    cloudDatabase, 
    lastSyncedAt, 
    syncNow,
    language 
  } = useLivotion();

  const [inputKey, setInputKey] = useState(syncKey);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isSyncModalOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setFeedbackMsg(null);
    try {
      const ok = await syncNow(inputKey.trim());
      if (ok) {
        setFeedbackMsg(language === 'am' ? 'ከዳታቤዙ ጋር በተሳካ ሁኔታ ተመሳስሏል!' : 'Synchronized successfully with PostgreSQL database!');
      } else {
        setFeedbackMsg(language === 'am' ? 'አዲስ መረጃ ተልኳል ወይም ምንም አዲስ መረጃ የለም።' : 'Data uploaded or up-to-date with cloud!');
      }
    } catch (e: any) {
      setFeedbackMsg(language === 'am' ? 'ስህተት ተፈጥሯል' : 'Sync error: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = inputKey.trim() || 'default_user';
    setSyncKey(cleanKey);
    setIsSyncing(true);
    setFeedbackMsg(null);
    try {
      await syncNow(cleanKey);
      setFeedbackMsg(language === 'am' ? `ማመሳሰያ ኮድ ወደ "${cleanKey}" ተቀይሯል!` : `Sync code switched to "${cleanKey}"!`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}?sync=${encodeURIComponent(inputKey.trim() || 'default_user')}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0082ff] flex items-center justify-center shadow-xs">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {language === 'am' ? 'የመሳሪያዎች ማመሳሰያ (Database Sync)' : 'Cross-Device Database Sync'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'am' ? 'ስልክዎ እና ኮምፒውተርዎ ላይ ተመሳሳይ መረጃ ይኑርዎት' : 'Seamless real-time sync between your Phone & PC'}
              </p>
            </div>
          </div>
          <button
            onClick={closeSyncModal}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cloud Database Status Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database size={13} className="text-[#0082ff]" />
              {cloudDatabase}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {cloudSyncStatus === 'syncing' ? (language === 'am' ? 'በማመሳሰል ላይ...' : 'Syncing...') : (language === 'am' ? 'ተገናኝቷል (Live)' : 'Connected (Live)')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">{language === 'am' ? 'የመጨረሻ ማመሳሰል፡' : 'Last Synced:'}</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : (language === 'am' ? 'አሁን' : 'Just now')}
            </span>
          </div>
        </div>

        {/* Sync Key / Pairing Form */}
        <form onSubmit={handleSaveKey} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {language === 'am' ? 'የማመሳሰያ ቁልፍ (Sync Key / Device Pair Code):' : 'Sync Key / Device Pair Code:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="default_user"
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-[#0082ff]"
              />
              <button
                type="submit"
                disabled={isSyncing}
                className="px-3.5 py-2.5 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {language === 'am' ? 'ቀይር' : 'Set Key'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {language === 'am' 
                ? 'በስልክዎ እና በኮምፒውተርዎ ላይ ይሄው ተመሳሳይ ቁልፍ መሆኑን ያረጋግጡ።' 
                : 'Any device using this Sync Key will automatically share all tasks, sticky notes, and workouts.'}
            </p>
          </div>
        </form>

        {/* One-Click Pair Link */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-bold text-[#0082ff] block">
              {language === 'am' ? 'የስልክ እና የኮምፒውተር ማገናኛ ሊንክ' : 'One-Click Device Pair Link'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {window.location.origin}?sync={inputKey.trim() || 'default_user'}
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? (language === 'am' ? 'ተቀድቷል!' : 'Copied!') : (language === 'am' ? 'ሊንክ ቅዳ' : 'Copy Link')}</span>
          </button>
        </div>

        {/* Feedback message */}
        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check size={14} /> {feedbackMsg}
          </div>
        )}

        {/* Sync Now Big Action Button */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-3 px-4 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>
              {isSyncing 
                ? (language === 'am' ? 'በማመሳሰል ላይ...' : 'Connecting to Database...') 
                : (language === 'am' ? 'አሁን ከዳታቤዝ አመሳስል (Sync Now)' : 'Sync with Database Now')}
            </span>
          </button>
        </div>

        {/* Visual Device Pair Graphic */}
        <div className="flex items-center justify-center gap-4 pt-1 text-slate-400 text-xs font-medium border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Smartphone size={15} className="text-[#0082ff]" />
            <span>iPhone / Phone</span>
          </div>
          <ArrowRight size={13} className="text-slate-300 dark:text-slate-600" />
          <Cloud size={16} className="text-emerald-500" />
          <ArrowRight size={13} className="text-slate-300 dark:text-slate-600" />
          <div className="flex items-center gap-1.5">
            <Monitor size={15} className="text-[#0082ff]" />
            <span>PC / Desktop</span>
          </div>
        </div>

      </div>
    </div>
  );
};
