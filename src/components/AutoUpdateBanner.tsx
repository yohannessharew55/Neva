import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Sparkles, CheckCircle2, X } from 'lucide-react';
import { useLivotion } from '../context/LivotionContext';

// Current client build timestamp generated at compile time
export const APP_BUILD_VERSION = 'v1.0.18-20261122-0326';

export const AutoUpdateBanner: React.FC = () => {
  const { language } = useLivotion();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);

  const applyUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      // 1. Clear all browser cache storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      // 2. Unregister or update all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.update()));
      }
    } catch (e) {
      console.warn('AutoUpdate cache clearing error:', e);
    }
    // Force complete reload from network
    window.location.reload();
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version && data.version !== APP_BUILD_VERSION) {
          console.log(`[NEVA OTA] New version detected: ${data.version} (current: ${APP_BUILD_VERSION})`);
          setRemoteVersion(data.version);
          setUpdateAvailable(true);

          // If user hasn't interacted for 3 seconds, or on app open, auto-apply update!
          // We apply automatically so the user doesn't have to reinstall anything
          setTimeout(() => {
            applyUpdate();
          }, 2500);
        }
      }
    } catch (e) {
      // Offline or network error
    }
  }, [applyUpdate]);

  useEffect(() => {
    // 1. Initial check after 1.5s
    const timer = setTimeout(checkForUpdate, 1500);

    // 2. Periodic background check every 45s
    const interval = setInterval(checkForUpdate, 45000);

    // 3. When user returns to tab / unlocks phone / switches back to PWA
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkForUpdate);

    // 4. Listen for Service Worker broadcast messages
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && (event.data.type === 'NEW_VERSION_ACTIVATED' || event.data.type === 'UPDATE_AVAILABLE')) {
          setUpdateAvailable(true);
          setTimeout(applyUpdate, 1000);
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', checkForUpdate);
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkForUpdate);
    };
  }, [checkForUpdate, applyUpdate]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[92vw] animate-bounceIn">
      <div className="bg-[#0082ff] text-white p-3 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <RefreshCw size={16} className={isUpdating ? 'animate-spin' : 'animate-pulse'} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black truncate flex items-center gap-1.5">
              <span>{language === 'am' ? 'አዲስ ዝማኔ ተገኝቷል!' : 'Live Update Available!'}</span>
              <Sparkles size={12} className="text-amber-300" />
            </div>
            <div className="text-[10px] text-white/80 font-mono truncate">
              {isUpdating 
                ? (language === 'am' ? 'በማደስ ላይ...' : 'Applying live update...')
                : (language === 'am' ? 'አፕሊኬሽኑ በራሱ እየተዘመነ ነው...' : 'Auto-syncing newest version...')}
            </div>
          </div>
        </div>

        <button
          onClick={applyUpdate}
          disabled={isUpdating}
          className="px-3 py-1.5 rounded-xl bg-white text-[#0082ff] text-xs font-black shadow-xs hover:bg-slate-100 active:scale-95 transition cursor-pointer shrink-0 flex items-center gap-1"
        >
          {isUpdating ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <CheckCircle2 size={12} />
          )}
          <span>{language === 'am' ? 'አድስ' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
};
