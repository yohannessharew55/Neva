import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Cloud, Check, Copy, RefreshCw, Smartphone, 
  ShieldCheck, Sparkles, User, Lock, Mail, LogOut, 
  CheckCircle2, Wifi, WifiOff, Eye, EyeOff, AlertCircle,
  Layers, Flame, Clock, Camera, Trash2, Edit3, Award, 
  Target, Crown, Quote, MapPin, Briefcase, Key, ChevronRight
} from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { 
  authenticateUserAccount, 
  updateUserAccountProfile,
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

export const PERSONA_ARCHETYPES = [
  {
    id: 'architect',
    title: 'The Architect',
    roleDefault: 'Lead Systems Architect',
    color: '#0082ff',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e3a8a"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><rect width="100" height="100" rx="30" fill="url(%23g1)"/><polygon points="50,20 80,45 80,80 20,80 20,45" fill="none" stroke="%23ffffff" stroke-width="5"/><line x1="50" y1="20" x2="50" y2="80" stroke="%2393c5fd" stroke-width="4"/><line x1="20" y1="52" x2="80" y2="52" stroke="%2393c5fd" stroke-width="4"/><circle cx="50" cy="52" r="8" fill="%23ffffff"/></svg>'
  },
  {
    id: 'sovereign',
    title: 'The Sovereign',
    roleDefault: 'Executive Leader & Builder',
    color: '#f59e0b',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97706"/><stop offset="100%" stop-color="%23fbbf24"/></linearGradient></defs><rect width="100" height="100" rx="30" fill="url(%23g2)"/><path d="M25 68 L25 42 L38 52 L50 32 L62 52 L75 42 L75 68 Z" fill="%23ffffff"/><circle cx="25" cy="38" r="4" fill="%23ffffff"/><circle cx="50" cy="27" r="5" fill="%23ffffff"/><circle cx="75" cy="38" r="4" fill="%23ffffff"/><rect x="25" y="72" width="50" height="5" rx="2.5" fill="%23ffffff"/></svg>'
  },
  {
    id: 'stoic',
    title: 'The Stoic',
    roleDefault: 'Deep Work Practitioner',
    color: '#475569',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23334155"/><stop offset="100%" stop-color="%2364748b"/></linearGradient></defs><rect width="100" height="100" rx="30" fill="url(%23g3)"/><path d="M50 24 C38 24 30 36 30 50 C30 68 40 76 50 76 C60 76 70 68 70 50 C70 36 62 24 50 24 Z" fill="none" stroke="%23ffffff" stroke-width="5"/><path d="M40 46 Q45 44 49 46" stroke="%23ffffff" stroke-width="3.5" fill="none"/><path d="M51 46 Q55 44 60 46" stroke="%23ffffff" stroke-width="3.5" fill="none"/><line x1="50" y1="46" x2="49" y2="58" stroke="%23ffffff" stroke-width="3.5"/><path d="M43 65 Q50 69 57 65" stroke="%23ffffff" stroke-width="3.5" fill="none"/></svg>'
  },
  {
    id: 'strategist',
    title: 'The Strategist',
    roleDefault: 'High-Leverage Operator',
    color: '#10b981',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f766e"/><stop offset="100%" stop-color="%2314b8a6"/></linearGradient></defs><rect width="100" height="100" rx="30" fill="url(%23g4)"/><circle cx="50" cy="50" r="28" fill="none" stroke="%23ffffff" stroke-width="5"/><circle cx="50" cy="50" r="16" fill="none" stroke="%23a7f3d0" stroke-width="4"/><circle cx="50" cy="50" r="6" fill="%23ffffff"/><line x1="50" y1="14" x2="50" y2="28" stroke="%23ffffff" stroke-width="4"/><line x1="50" y1="72" x2="50" y2="86" stroke="%23ffffff" stroke-width="4"/><line x1="14" y1="50" x2="28" y2="50" stroke="%23ffffff" stroke-width="4"/><line x1="72" y1="50" x2="86" y2="50" stroke="%23ffffff" stroke-width="4"/></svg>'
  },
  {
    id: 'creator',
    title: 'The Creator',
    roleDefault: 'Visionary & Maker',
    color: '#8b5cf6',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%236d28d9"/><stop offset="100%" stop-color="%23a855f7"/></linearGradient></defs><rect width="100" height="100" rx="30" fill="url(%23g5)"/><polygon points="50,18 58,40 82,42 63,57 70,80 50,66 30,80 37,57 18,42 42,40" fill="%23ffffff"/><circle cx="50" cy="50" r="8" fill="%23e9d5ff"/></svg>'
  },
  {
    id: 'warrior',
    title: 'The Warrior',
    roleDefault: 'Relentless Disciplinarian',
    color: '#f43f5e',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23be123c"/><stop offset="100%" stop-color="%23fb7185"/></linearGradient></defs><rect width="100" height="100" rx="30" fill="url(%23g6)"/><path d="M50 20 L76 30 L76 56 C76 72 50 82 50 82 C50 82 24 72 24 56 L24 30 Z" fill="none" stroke="%23ffffff" stroke-width="5"/><path d="M50 28 L50 72" stroke="%23ffffff" stroke-width="4"/><path d="M36 44 L64 44" stroke="%23ffffff" stroke-width="4"/></svg>'
  }
];

const CREED_PRESETS = [
  'Discipline equals freedom.',
  'Focus on what moves the needle.',
  'Calm mind. Relentless execution.',
  'Mastery through deliberate practice.',
  'Consistency beats intensity.',
  'Design your days, or someone else will.'
];

export const DeviceSyncModal: React.FC = () => {
  const { 
    isSyncModalOpen, 
    closeSyncModal, 
    syncKey, 
    setSyncKey, 
    cloudSyncStatus, 
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
  const [profileTab, setProfileTab] = useState<'overview' | 'edit' | 'security'>('overview');
  
  // Auth Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('#0082ff');
  const [migrateExistingData, setMigrateExistingData] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Edit Profile Form fields
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editMotto, setEditMotto] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editColor, setEditColor] = useState('#0082ff');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);

  // Change Password Form fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOffline = isDeviceOffline();

  // Reset or initialize state whenever modal opens or currentUser updates
  useEffect(() => {
    if (isSyncModalOpen) {
      if (currentUser) {
        setAuthMode('profile');
        setEditName(currentUser.name || '');
        setEditRole(currentUser.role || '');
        setEditMotto(currentUser.motto || '');
        setEditLocation(currentUser.location || '');
        setEditEmail(currentUser.email || '');
        setEditColor(currentUser.avatarColor || '#0082ff');
        setEditPhoto(currentUser.avatarPhoto || null);
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

  // Client-side instant image resize to 256x256 JPEG
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setEditPhoto(compressed);
            iosNativeBridge.haptic('success');
            showFeedback('Photo loaded! Tap "Save Changes" to apply.');
          }
        } catch {
          setErrorMessage('Could not process this image format.');
        }
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle Sign In or Sign Up Form Submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
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

        if (authMode === 'login' && res.state) {
          hydrateCloudState(res.state);
        } else if (authMode === 'signup') {
          await syncNow(res.user.username);
        }

        setAuthMode('profile');
        setProfileTab('overview');
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

  // Save Profile Edits (Photo, Title, Creed, etc.)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    await iosNativeBridge.haptic('medium');

    try {
      const res = await updateUserAccountProfile(currentUser.username, {
        name: editName.trim() || currentUser.username,
        role: editRole.trim(),
        motto: editMotto.trim(),
        location: editLocation.trim(),
        email: editEmail.trim() || undefined,
        avatarColor: editColor,
        avatarPhoto: editPhoto
      });

      if (res.success && res.user) {
        setCurrentUser(res.user);
        await iosNativeBridge.haptic('success');
        showFeedback('Profile updated & synced successfully!');
        setProfileTab('overview');
      } else {
        setErrorMessage(res.message || 'Failed to update profile.');
        await iosNativeBridge.haptic('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating profile.');
      await iosNativeBridge.haptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      await iosNativeBridge.haptic('error');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('New password must be at least 4 characters.');
      await iosNativeBridge.haptic('error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      await iosNativeBridge.haptic('error');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    await iosNativeBridge.haptic('medium');

    try {
      const res = await updateUserAccountProfile(currentUser.username, {
        currentPassword,
        newPassword
      });

      if (res.success) {
        await iosNativeBridge.haptic('success');
        showFeedback('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setProfileTab('overview');
      } else {
        setErrorMessage(res.message || 'Failed to change password.');
        await iosNativeBridge.haptic('error');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error changing password.');
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
      await syncNow(currentUser.username);
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

  // Lifetime Metrics Calculations
  const totalFocusMinutes = sessions?.reduce((acc: number, s: any) => acc + (s.durationMinutes || s.minutes || 0), 0) || 0;
  const totalTasksCount = tasks?.length || 0;
  const totalCompletedTasks = tasks?.filter((t: any) => t.completed)?.length || 0;
  const totalDevotionsCount = categoryPlans?.length || 0;
  const focusHours = totalFocusMinutes / 60;

  // Mastery Tier System
  const getMasteryTier = (hours: number) => {
    if (hours < 5) {
      return {
        tierName: 'Initiate',
        badge: 'Tier 1 · Initiate',
        icon: Sparkles,
        progress: Math.min(100, Math.round((hours / 5) * 100)),
        progressLabel: `${hours.toFixed(1)} / 5.0 hrs`,
        nextTier: 'Focus Adept (5h)',
        color: 'from-blue-500 to-indigo-600',
        textColor: 'text-blue-500',
        description: 'Building unbreakable foundations for daily focus rituals.'
      };
    } else if (hours < 25) {
      return {
        tierName: 'Focus Adept',
        badge: 'Tier 2 · Focus Adept',
        icon: Target,
        progress: Math.min(100, Math.round(((hours - 5) / 20) * 100)),
        progressLabel: `${hours.toFixed(1)} / 25.0 hrs`,
        nextTier: 'Mastery Practitioner (25h)',
        color: 'from-emerald-500 to-teal-600',
        textColor: 'text-emerald-500',
        description: 'Sustained cognitive endurance across deep work blocks.'
      };
    } else if (hours < 100) {
      return {
        tierName: 'Mastery Practitioner',
        badge: 'Tier 3 · Mastery Practitioner',
        icon: Flame,
        progress: Math.min(100, Math.round(((hours - 25) / 75) * 100)),
        progressLabel: `${hours.toFixed(1)} / 100.0 hrs`,
        nextTier: 'Elite Sovereign (100h)',
        color: 'from-amber-500 to-orange-600',
        textColor: 'text-amber-500',
        description: 'Mastery of flow state and relentless execution.'
      };
    } else {
      return {
        tierName: 'Elite Sovereign',
        badge: 'Tier 4 · Elite Sovereign',
        icon: Crown,
        progress: 100,
        progressLabel: `${hours.toFixed(1)} hrs logged`,
        nextTier: 'Apex Master Achieved',
        color: 'from-purple-500 to-pink-600',
        textColor: 'text-purple-500',
        description: 'Unrivaled sovereign discipline and legendary consistency.'
      };
    }
  };

  const masteryTier = getMasteryTier(focusHours);
  const TierIcon = masteryTier.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in text-slate-800 dark:text-slate-100">
      <div 
        className="bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 w-full max-w-lg rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        
        {/* Hidden image input for camera / file picker */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handlePhotoUpload} 
          className="hidden" 
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl overflow-hidden text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0"
              style={{ backgroundColor: currentUser?.avatarColor || '#0082ff' }}
            >
              {currentUser ? (
                currentUser.avatarPhoto ? (
                  <img src={currentUser.avatarPhoto} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-lg">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                  </span>
                )
              ) : (
                <User size={20} />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>{currentUser ? 'Executive Profile' : 'NEVA Cloud Account'}</span>
                {currentUser && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-blue-500/10 text-[#0082ff] border border-blue-500/20">
                    {masteryTier.tierName}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser ? `@${currentUser.username} · Multi-Device Cloud Sync` : 'Create your personal account to sync data across all platforms'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {currentUser && (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                title="Sign out of account"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            )}
            <button
              onClick={closeSyncModal}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
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
                Works 100% offline. Automatically syncs to your personal profile when connected.
              </p>
            </div>
          </div>
        </div>

        {/* LOGGED IN USER PROFILE MANAGEMENT */}
        {currentUser && authMode === 'profile' ? (
          <div className="space-y-4">
            
            {/* Top Navigation Tabs for Profile */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setProfileTab('overview')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  profileTab === 'overview'
                    ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Award size={13} />
                <span>Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('edit')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  profileTab === 'edit'
                    ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('security')}
                className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  profileTab === 'security'
                    ? 'bg-white dark:bg-slate-900 text-[#0082ff] shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Lock size={13} />
                <span>Security</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & MASTERY */}
            {profileTab === 'overview' && (
              <div className="space-y-3.5 animate-fade-in">
                
                {/* Executive Identity Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/80 dark:border-blue-800/80 space-y-3.5 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar with Glow Ring */}
                      <div className="relative group">
                        <div 
                          className="w-16 h-16 rounded-2xl overflow-hidden text-white font-black text-2xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/30"
                          style={{ backgroundColor: currentUser.avatarColor || '#0082ff' }}
                        >
                          {currentUser.avatarPhoto ? (
                            <img src={currentUser.avatarPhoto} alt={currentUser.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setProfileTab('edit')}
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0082ff] text-white flex items-center justify-center shadow-md hover:scale-110 transition cursor-pointer"
                          title="Change photo / avatar"
                        >
                          <Camera size={12} />
                        </button>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{currentUser.name}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Cloud Synced" />
                        </h4>
                        <span className="text-xs font-mono text-[#0082ff] font-bold block">
                          @{currentUser.username}
                        </span>
                        {currentUser.role && (
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                            <Briefcase size={11} className="text-slate-400" />
                            <span>{currentUser.role}</span>
                          </span>
                        )}
                        {currentUser.location && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin size={10} className="text-slate-400" />
                            <span>{currentUser.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setProfileTab('edit')}
                        className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 shadow-2xs hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        <Edit3 size={12} className="text-[#0082ff]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                        title="Sign out of account"
                      >
                        <LogOut size={12} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>

                  {/* Personal Creed / Motto Card */}
                  {currentUser.motto ? (
                    <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        <Quote size={11} className="text-[#0082ff]" />
                        <span>Personal Creed</span>
                      </div>
                      <p className="italic font-medium text-slate-800 dark:text-slate-200 pl-2 border-l-2 border-[#0082ff]">
                        "{currentUser.motto}"
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setProfileTab('edit')}
                      className="w-full p-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Quote size={12} />
                      <span>Add your personal creed / motto...</span>
                    </button>
                  )}
                </div>

                {/* Mastery Tier Progression Card */}
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <TierIcon size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {masteryTier.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {masteryTier.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-amber-500">
                      {masteryTier.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${masteryTier.color} transition-all duration-500`}
                        style={{ width: `${masteryTier.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{masteryTier.progressLabel}</span>
                      <span>Next: {masteryTier.nextTier}</span>
                    </div>
                  </div>
                </div>

                {/* Lifetime Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={11} className="text-amber-500" /> Focus Time
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Layers size={11} className="text-[#0082ff]" /> Tasks Mastered
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {totalCompletedTasks} / {totalTasksCount}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Flame size={11} className="text-rose-500" /> Devotions
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {totalDevotionsCount} habits
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Sparkles size={11} className="text-purple-500" /> Brain Ideas
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {dailyStickyNotes?.length || 0} notes
                    </span>
                  </div>
                </div>

                {/* Cloud Sync Status & Instant Sync */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Database Engine:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      NEVA Cloud DB · High Availability
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Last Synced:</span>
                    <span className="font-mono text-slate-500">
                      {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Up to date'}
                    </span>
                  </div>

                  <button
                    onClick={handleManualSync}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer"
                  >
                    <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
                    <span>{isSubmitting ? 'Syncing with Cloud...' : 'Instant Cloud Backup & Sync'}</span>
                  </button>
                </div>

                {/* Instant Cross-Device Link */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-[#0082ff]" />
                      <span>Instant Device Pairing Link</span>
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
                    Open this link on your iPhone, PC or Mac to automatically pair and access your profile data.
                  </p>
                </div>

                {/* Direct Sign Out Action Card on Overview */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                  >
                    <LogOut size={14} />
                    <span>Sign Out of @{currentUser.username}</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    Your local tasks and devotions will remain safe on this device.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: EDIT PROFILE */}
            {profileTab === 'edit' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in">
                
                {/* Photo & Persona Avatar Studio */}
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Profile Photo & Avatar Studio
                  </label>

                  <div className="flex items-center gap-4">
                    {/* Live Preview Avatar */}
                    <div 
                      className="w-16 h-16 rounded-2xl overflow-hidden text-white font-black text-2xl flex items-center justify-center shadow-lg ring-2 ring-[#0082ff]/40 shrink-0"
                      style={{ backgroundColor: editColor }}
                    >
                      {editPhoto ? (
                        <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>{editName ? editName[0].toUpperCase() : currentUser.username[0].toUpperCase()}</span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-95"
                        >
                          <Camera size={13} />
                          <span>Upload Photo</span>
                        </button>

                        {editPhoto && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditPhoto(null);
                              iosNativeBridge.haptic('light');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Remove photo & use monogram"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Camera or file upload. Auto-cropped to 256×256 square.
                      </p>
                    </div>
                  </div>

                  {/* Curated Persona Archetypes */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Or Choose Curated Persona Archetype:
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {PERSONA_ARCHETYPES.map((arch) => (
                        <button
                          key={arch.id}
                          type="button"
                          onClick={() => {
                            setEditPhoto(arch.svg);
                            setEditColor(arch.color);
                            if (!editRole) setEditRole(arch.roleDefault);
                            iosNativeBridge.haptic('light');
                          }}
                          className={`p-1 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            editPhoto === arch.svg
                              ? 'border-[#0082ff] ring-2 ring-[#0082ff]/30 scale-105 bg-blue-50/50 dark:bg-blue-950/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                          }`}
                          title={`${arch.title} (${arch.roleDefault})`}
                        >
                          <img src={arch.svg} alt={arch.title} className="w-9 h-9 rounded-xl object-cover" />
                          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate w-full text-center">
                            {arch.title.replace('The ', '')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Identity Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Executive Title / Calling
                    </label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      placeholder="e.g. Lead Architect & Deep Work Practitioner"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                    />
                  </div>
                </div>

                {/* Personal Creed & Quick Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Personal Creed / Motto
                    </label>
                    <span className="text-[10px] text-slate-400">Your core guiding principle</span>
                  </div>
                  <input
                    type="text"
                    value={editMotto}
                    onChange={(e) => setEditMotto(e.target.value)}
                    placeholder="e.g. Discipline equals freedom."
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                  />

                  {/* 1-Tap Creed Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {CREED_PRESETS.map((quote) => (
                      <button
                        key={quote}
                        type="button"
                        onClick={() => {
                          setEditMotto(quote);
                          iosNativeBridge.haptic('light');
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition cursor-pointer"
                      >
                        "{quote}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Location / Timezone
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. Addis Ababa, UTC+3"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                    />
                  </div>
                </div>

                {/* Accent Theme Color */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Profile Theme Accent
                  </label>
                  <div className="flex items-center gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setEditColor(c.value);
                          iosNativeBridge.haptic('light');
                        }}
                        className={`w-7 h-7 rounded-xl ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                          editColor === c.value ? 'ring-2 ring-offset-2 ring-[#0082ff] scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        title={c.label}
                      >
                        {editColor === c.value && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-2xl bg-[#0082ff] hover:bg-[#0070df] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition cursor-pointer"
                  >
                    {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>{isSubmitting ? 'Saving to Cloud...' : 'Save Profile Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileTab('overview')}
                    className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: SECURITY & SYNC */}
            {profileTab === 'security' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Account Details Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">@{currentUser.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account Created:</span>
                    <span className="font-mono text-slate-500">
                      {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Active Member'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Password Encryption:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">PBKDF2 / SHA-512</span>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key size={15} className="text-[#0082ff]" />
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Change Account Password
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="text-xs font-bold text-[#0082ff] hover:underline cursor-pointer"
                    >
                      {showPasswordChange ? 'Hide Form' : 'Update Password'}
                    </button>
                  </div>

                  {showPasswordChange && (
                    <form onSubmit={handleChangePassword} className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0082ff]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-xl bg-[#0082ff] hover:bg-[#0070df] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer"
                      >
                        {isSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Lock size={13} />}
                        <span>Update Password in Cloud</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Sign Out Card */}
                <div className="pt-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                  >
                    <LogOut size={15} />
                    <span>Sign Out of NEVA Account</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Your local tasks and devotions will remain saved on this device.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* AUTH FORM (Sign In / Sign Up for Guests) */
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

            <form onSubmit={handleAuthSubmit} className="space-y-3">
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
