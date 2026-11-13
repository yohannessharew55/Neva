import React, { useState, useEffect } from 'react';
import { RotateCcw, Lock, Eye, EyeOff, AlertTriangle, X, Check, RefreshCw } from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';
import { iosNativeBridge } from '../utils/iosNativeBridge';
import { verifyMainAccountPassword } from '../utils/cloudSync';

interface ClearScratchPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClearScratchPasswordModal: React.FC<ClearScratchPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, resetAllData, language } = useLivotion();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setIsSubmitting(false);
      setErrorMessage(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // If an account is registered/active, strictly require the main account's password
    if (currentUser?.username) {
      if (!password) {
        setErrorMessage(
          language === 'am'
            ? 'እባክዎን የይለፍ ቃልዎን ያስገቡ።'
            : 'Please enter your account password.'
        );
        await iosNativeBridge.haptic('error');
        return;
      }

      setIsSubmitting(true);
      await iosNativeBridge.haptic('medium');

      try {
        const res = await verifyMainAccountPassword(currentUser.username, password);
        if (!res.success) {
          setErrorMessage(
            res.message ||
              (language === 'am'
                ? 'የተሳሳተ የይለፍ ቃል! ማጥፋቱ ተሰርዟል።'
                : 'Incorrect password. Data was not erased.')
          );
          await iosNativeBridge.haptic('error');
          setIsSubmitting(false);
          return;
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Verification error.');
        await iosNativeBridge.haptic('error');
        setIsSubmitting(false);
        return;
      }
    } else {
      // Guest mode (no account signed in)
      if (password.trim().toUpperCase() !== 'SCRATCH' && password.trim().toUpperCase() !== 'RESET') {
        setErrorMessage(
          language === 'am'
            ? 'ለማጥፋት SCRATCH ብለው ይጻፉ'
            : 'Type "SCRATCH" to confirm wipe.'
        );
        await iosNativeBridge.haptic('error');
        return;
      }
    }

    // Password verified! Wipe all data and start from scratch
    setIsSubmitting(true);
    resetAllData();
    setSuccess(true);
    await iosNativeBridge.haptic('success');

    setTimeout(() => {
      onClose();
    }, 1100);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Minimal words & icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <RotateCcw size={17} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {language === 'am' ? 'ሁሉንም አጥፋ' : 'Clear All'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'am' ? 'ከባዶ ጀምር (Scratch)' : 'Start from scratch'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {language === 'am' ? 'ዳታው ተሰርዟል! አዲስ ጅምር!' : 'All data cleared. Welcome to a fresh start!'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Account Context Chip */}
            {currentUser ? (
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0"
                    style={{ backgroundColor: currentUser.avatarColor || '#0082ff' }}
                  >
                    {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      @{currentUser.username}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#0082ff] shrink-0">
                  Main Account
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{language === 'am' ? 'ከስርዓቱ ዳታን ሙሉ በሙሉ ለማጥፋት SCRATCH ብለው ይጻፉ' : 'Type "SCRATCH" to confirm wipe.'}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 animate-shake">
                <AlertTriangle size={13} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Password / Confirmation Input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {currentUser 
                  ? (language === 'am' ? `የ @${currentUser.username} የይለፍ ቃል` : `Password for @${currentUser.username}`)
                  : (language === 'am' ? 'ማረጋገጫ ቃል' : 'Type SCRATCH')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <Lock size={14} />
                </div>
                <input
                  type={currentUser ? (showPassword ? 'text' : 'password') : 'text'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={currentUser ? '••••••••' : 'SCRATCH'}
                  autoFocus
                  required
                  className="w-full pl-8 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>

            {/* Minimal Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                {language === 'am' ? 'ይቅር' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <RotateCcw size={13} />
                )}
                <span>{language === 'am' ? 'አጥፋ' : 'Clear All'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
