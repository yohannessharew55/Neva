import React, { useState, useEffect } from 'react';
import { 
  X, Cloud, Check, Copy, RefreshCw, Smartphone, 
  ShieldCheck, Sparkles, User, Lock, Mail, LogOut, 
  CheckCircle2, Wifi, WifiOff, Eye, EyeOff, AlertCircle,
  Layers, Flame, Clock
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { 
  authenticateUserAccount, 
  isDeviceOffline,
  UserAccountProfile 
} from '../utils/cloudSync';
import { iosNativeBridge } from '../utils/iosNativeBridge';

const AVATAR_COLORS = [
  { label: 'Electric Blue', value: '#0082ff', bg: 'bg-[#0082ff]' },
  { label: 'Emerald Aurora', value: '#10b981', bg: 'bg-emerald-500' },
  { label: 'Cyber Purple', value: '#8b5cf6', bg: 'bg-purple-500' },
  { label: 'Solar Amber', value: '#f59e0b', bg: 'bg-amber-500' },
  { label: 'Crimson Sunset', value: '#f43f5e', bg: 'bg-rose-500' },
  { label: 'Obsidian Slate', value: '#475569', bg: 'bg-slate-600' },
];

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
    language,
    currentUser,
    setCurrentUser,
    logoutUser,
    hydrateCloudState,
    tasks,
    workouts,
    meals,
    goals,
    sessions,
    categoryPlans,
    dailyStickyNotes
  } = useLivotion();

  const [authMode, setAuthMode] = useState<'profile' | 'login' | 'signup'>('login');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('#0082ff');
  const [migrateExistingData, setMigrateExistingData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isOffline = isDeviceOffline();

  // Reset or initialize state whenever modal opens
  useEffect(() => {
    if (isSyncModalOpen) {
      if (currentUser) {
        setAuthMode('profile');
      } else {
        setAuthMode('login');
      }
      setErrorMessage(null);
    }
  }, [isSyncModalOpen, currentUser]);

  if (!isSyncModalOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Handle Form Submission (Sign In or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters (letters, numbers, underscores).');
      await iosNativeBridge.haptic('error');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      await iosNativeBridge.haptic('error');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      await iosNativeBridge.haptic('error');
      return;
    }

    setIsSubmitting(true);
    await iosNativeBridge.haptic('medium');

    try {
      const initialPayload = (authMode === 'signup' && migrateExistingData) ? {
        tasks,
        workouts,
        meals,
        goals,
        sessions,
        categoryPlans,
        dailyStickyNotes
      } : undefined;

      const res = await authenticateUserAccount(authMode, {
        username: cleanUsername,
        password,
        name: name.trim() || cleanUsername,
        email: email.trim() || undefined,
        avatarColor: selectedColor,
        initialPayload
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        setSyncKey(res.user.username);

        // If login returned cloud-saved state, immediately hydrate cross-platform data!
        if (authMode === 'login' && res.state) {
          hydrateCloudState(res.state);
        } else if (authMode === 'signup') {
          // Push initial data
          await syncNow(res.user.username);
        }

        setAuthMode('profile');
        await iosNativeBridge.haptic('success');
        showFeedback(res.message || 'Logged in to NEVA Cloud!');
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please try again.');
        await iosNativeBridge.haptic('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
      await iosNativeBridge.haptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign out
  const handleSignOut = () => {
    if (confirm(language === 'am' ? 'ከአካውንትዎ መውጣት ይፈልጋሉ? የአሁን ዳታዎ በዚህ ስልክ ላይ ተቀምጦ ይቆያል።' : 'Sign out of your account? Your local data will remain safe on this device.')) {
      logoutUser();
      setAuthMode('login');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      iosNativeBridge.haptic('light');
      showFeedback('Signed out successfully.');
    }
  };

  // Trigger Manual Cloud Sync
  const handleManualSync = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    await iosNativeBridge.haptic('medium');
    try {
      const ok = await syncNow(currentUser.username);
      await iosNativeBridge.haptic('success');
      showFeedback(language === 'am' ? 'ከክላውድ ዳታቤዝ ጋር ተመሳስሏል!' : 'Cloud backup updated successfully!');
    } catch (e: any) {
      showFeedback('Sync status: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy shareable pairing link
  const handleCopyLink = () => {
    const origin = window.location.origin.includes('capacitor') ? 'https://neva-os.vercel.app' : window.location.origin;
    const key = currentUser ? currentUser.username : syncKey;
    const url = `${origin}?sync=${encodeURIComponent(key)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    iosNativeBridge.haptic('light');
    setTimeout(() => setCopied(false), 2500);
  };

  const totalFocusMinutes = sessions?.reduce((acc: number, s: any) => acc + (s.durationMinutes || s.minutes || 0), 0) || 0;
  const totalTasksCount = tasks?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in text-slate-800 dark:text-slate-100">
      <div 
        className="bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0"
              style={{ backgroundColor: currentUser?.avatarColor || '#0082ff' }}
            >
              {currentUser ? (
                <span className="font-black text-lg">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                </span>
              ) : (
                <User size={20} />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                {currentUser ? 'Personal Profile' : 'NEVA Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser ? `@${currentUser.username} · Cloud Active` : 'Sync your data across all devices'}
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

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div className="p-3 rounded-2xl bg-[#0082ff] text-white text-xs font-bold shadow-md flex items-center gap-2 animate-slide-down">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Standalone 100% Offline Notice Card */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              {isOffline ? <WifiOff size={16} /> : <ShieldCheck size={16} />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {isOffline ? 'Offline Standalone Mode' : 'Cloud Sync & Offline Protected'}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Works 100% offline. Automatically syncs to your profile when connected.
              </p>
            </div>
          </div>
        </div>

        {/* PROFILE VIEW (When Logged In) */}
        {currentUser && authMode === 'profile' ? (
          <div className="space-y-3.5">
            {/* User Profile Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/80 dark:border-blue-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl text-white font-black text-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: currentUser.avatarColor || '#0082ff' }}
                  >
                    {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Cloud Synced" />
                    </h4>
                    <span className="text-xs font-mono text-[#0082ff] font-bold block">
                      @{currentUser.username}
                    </span>
                    {currentUser.email && (
                      <span className="text-[11px] text-slate-400 block">
                        {currentUser.email}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Sign out of account"
                >
                  <LogOut size={16} />
                </button>
              </div>

              {/* Statistics & Sync Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Layers size={11} className="text-[#0082ff]" /> Active Tasks
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {totalTasksCount} items
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={11} className="text-amber-500" /> Focus Time
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {totalFocusMinutes} mins
                  </span>
                </div>
              </div>

              {/* Cloud Sync Status */}
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cloud Storage:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">NEVA Cloud DB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Sync Status:</span>
                  <span className="flex items-center gap-1.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Connected & Active'}
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
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer"
              >
                <RefreshCw size={15} className={isSubmitting ? 'animate-spin' : ''} />
                <span>{isSubmitting ? 'Syncing with Cloud...' : 'Sync / Backup Now'}</span>
              </button>
            </div>

            {/* Cross-Device Pairing Link */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-[#0082ff]" />
                  <span>Instant Cross-Device Link</span>
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
                Log in with your username <strong>@{currentUser.username}</strong> on your iPhone, PC or Mac to sync everything.
              </p>
            </div>
          </div>
        ) : (
          /* AUTH FORM (Sign In / Sign Up) */
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            {/* Tabs */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                  authMode === 'login' 
                    ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-sm font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
                  authMode === 'signup' 
                    ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-sm font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username Input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="e.g. john"
                    required
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                  />
                </div>
              </div>

              {/* Display Name & Email (Sign Up only) */}
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                    />
                  </div>

                  {/* Pick Avatar Color */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Choose Profile Theme
                    </label>
                    <div className="flex items-center gap-2">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setSelectedColor(c.value)}
                          className={`w-7 h-7 rounded-xl ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                            selectedColor === c.value ? 'ring-2 ring-offset-2 ring-[#0082ff] scale-110' : 'opacity-80 hover:opacity-100'
                          }`}
                          title={c.label}
                        >
                          {selectedColor === c.value && <Check size={14} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Password Input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign Up only) */}
              {authMode === 'signup' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                  />
                </div>
              )}

              {/* Migrate local data checkbox on signup */}
              {authMode === 'signup' && (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={migrateExistingData}
                    onChange={(e) => setMigrateExistingData(e.target.checked)}
                    className="rounded text-[#0082ff] focus:ring-[#0082ff]"
                  />
                  <span>Save my current device tasks & devotions to this account</span>
                </label>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                <span>
                  {authMode === 'signup' ? 'Create Account & Start Cloud Sync' : 'Sign In to My Profile'}
                </span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
