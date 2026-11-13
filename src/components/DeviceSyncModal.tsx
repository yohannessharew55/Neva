import React, { useState, useEffect } from 'react';
import { 
  X, Cloud, Check, Copy, RefreshCw, Smartphone, 
  Monitor, Database, ShieldCheck, ArrowRight, Sparkles,
  User, Lock, Mail, LogOut, CheckCircle2, Wifi, WifiOff,
  Download, Upload, Shield
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { 
  authenticateUserAccount, 
  getStoredUserAccount, 
  saveAccountToStorage, 
  clearStoredUserAccount, 
  UserAccountProfile,
  isDeviceOffline 
} from '../utils/cloudSync';
import { iosNativeBridge } from '../utils/iosNativeBridge';

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

  const [authMode, setAuthMode] = useState<'profile' | 'login' | 'signup'>('profile');
  const [currentUser, setCurrentUser] = useState<UserAccountProfile | null>(getStoredUserAccount());
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual key sync
  const [inputKey, setInputKey] = useState(syncKey);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const isOffline = isDeviceOffline();

  // If user opens and has no account, default to login/signup
  useEffect(() => {
    const saved = getStoredUserAccount();
    if (saved) {
      setCurrentUser(saved);
      setAuthMode('profile');
    } else {
      setAuthMode('login');
    }
  }, [isSyncModalOpen]);

  if (!isSyncModalOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Handle Account Authentication (Sign Up or Log In)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    await iosNativeBridge.haptic('medium');

    try {
      const res = await authenticateUserAccount(
        authMode === 'signup' ? 'signup' : 'login',
        email.trim(),
        name.trim() || undefined,
        password || undefined
      );

      if (res.success && res.user) {
        setCurrentUser(res.user);
        setAuthMode('profile');
        setSyncKey(res.user.email);
        await syncNow(res.user.email);
        await iosNativeBridge.haptic('success');
        showFeedback(res.message || 'Connected to your NEVA Online Account!');
      } else {
        showFeedback(res.message || 'Authentication error.');
      }
    } catch (err: any) {
      showFeedback('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign out
  const handleSignOut = () => {
    clearStoredUserAccount();
    setCurrentUser(null);
    setAuthMode('login');
    iosNativeBridge.haptic('light');
    showFeedback('Signed out. Local data remains safe on this device.');
  };

  // Trigger Manual Cloud Sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    await iosNativeBridge.haptic('medium');
    const keyToSync = currentUser?.email || inputKey.trim() || syncKey;
    try {
      const ok = await syncNow(keyToSync);
      await iosNativeBridge.haptic('success');
      showFeedback(language === 'am' ? 'ከክላውድ ዳታቤዝ ጋር ተመሳስሏል!' : 'Cloud backup updated successfully!');
    } catch (e: any) {
      showFeedback('Sync status: ' + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy shareable link
  const handleCopyLink = () => {
    const origin = window.location.origin.includes('capacitor') ? 'https://neva-os.vercel.app' : window.location.origin;
    const key = currentUser?.email || inputKey.trim() || syncKey;
    const url = `${origin}?sync=${encodeURIComponent(key)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    iosNativeBridge.haptic('light');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in text-slate-800 dark:text-slate-100">
      <div 
        className="bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0082ff] to-[#0055d4] text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                {language === 'am' ? 'የክላውድ አካውንት እና ማመሳሰያ' : 'Online Account & Cloud Sync'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'am' ? '100% ያለ ኢንተርኔት ይሰራል ወይም በክላውድ ይቀመጣል' : '100% Offline Standalone + Cloud Backup'}
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

        {/* Global Feedback Alert */}
        {feedbackMsg && (
          <div className="p-3 rounded-2xl bg-[#0082ff] text-white text-xs font-bold shadow-md flex items-center gap-2 animate-slide-down">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Standalone 100% Offline Notice Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              {isOffline ? <WifiOff size={16} /> : <ShieldCheck size={16} />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  100% Standalone Offline Mode
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                All data, timers & sounds work with zero internet. Saved safely on this iPhone.
              </p>
            </div>
          </div>
        </div>

        {/* ACCOUNT SECTION */}
        {currentUser && authMode === 'profile' ? (
          // Logged In Account Card
          <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/80 dark:border-blue-800/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0082ff] text-white font-black text-lg flex items-center justify-center shadow-md">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'N'}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </h4>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Sign out of account"
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Sync Status Info */}
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Cloud Storage:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{cloudDatabase}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Sync Status:</span>
                <span className="flex items-center gap-1.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Connected & Backed Up'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Synced:</span>
                <span className="font-mono text-slate-500">
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            </div>

            {/* Sync Now Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-3 px-4 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Backing Up to Cloud...' : 'Backup / Sync All Data Now'}</span>
            </button>
          </div>
        ) : (
          // Log In / Sign Up Form
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {authMode === 'signup' ? 'Create Online Account' : 'Log In to Cloud Account'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sync seamlessly between iPhone X, Mac & PC
                </p>
              </div>

              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`px-3 py-1 rounded-lg transition ${authMode === 'login' ? 'bg-white dark:bg-slate-700 text-[#0082ff] shadow-xs' : 'text-slate-500'}`}
                >
                  Log In
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`px-3 py-1 rounded-lg transition ${authMode === 'signup' ? 'bg-white dark:bg-slate-700 text-[#0082ff] shadow-xs' : 'text-slate-500'}`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-2.5">
              {authMode === 'signup' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Yohannes"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0082ff]"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0082ff]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0082ff]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition cursor-pointer mt-1"
              >
                {isSubmitting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>
                  {authMode === 'signup' ? 'Create Account & Enable Cloud' : 'Log In & Sync Data'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Cross-Device Share Link Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Smartphone size={14} className="text-[#0082ff]" />
              <span>Cross-Device Pairing Link</span>
            </span>
            <button
              onClick={handleCopyLink}
              className="text-xs font-bold text-[#0082ff] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Open this link on your computer or iPad to instantly mirror your iPhone X tasks and routines.
          </p>
        </div>

      </div>
    </div>
  );
};
