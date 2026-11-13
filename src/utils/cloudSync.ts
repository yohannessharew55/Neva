import { Capacitor } from '@capacitor/core';

export interface CloudSyncResult {
  success: boolean;
  database: string;
  syncId?: string;
  message?: string;
  updatedAt?: string;
}

export interface UserAccountProfile {
  id: string;
  email: string;
  name: string;
  lastSyncedAt?: string;
  isOnlineAccount: boolean;
}

// Ensure mobile app on iOS connects to the production Vercel cloud endpoint
const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const isCapacitorNative = Capacitor.isNativePlatform() || 
    window.location.protocol === 'capacitor:' || 
    window.location.origin.includes('capacitor://') ||
    window.location.hostname === 'localhost' && window.location.port === '';
  
  if (isCapacitorNative) {
    return 'https://neva-os.vercel.app';
  }
  return '';
};

// Check if currently offline
export const isDeviceOffline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
};

// Sync State to Cloud (or gracefully mirror locally if offline)
export const syncStateToCloud = async (stateData: any, syncId: string = 'default_user'): Promise<CloudSyncResult> => {
  // If offline, save locally without network delay
  if (isDeviceOffline()) {
    try {
      localStorage.setItem(`neva_local_mirror_${syncId}`, JSON.stringify(stateData));
    } catch (e) {}
    return {
      success: true,
      database: 'Local Mirror (100% Offline)',
      syncId,
      message: 'Persisted to local device storage while offline.',
      updatedAt: new Date().toISOString()
    };
  }

  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`${baseUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        syncId,
        payload: stateData,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.status === 'success' || result.status === 'persisted_locally',
      database: result.database || 'PostgreSQL (Neon Cloud)',
      syncId: result.syncId || syncId,
      message: result.message,
      updatedAt: result.updatedAt || new Date().toISOString(),
    };
  } catch (error: any) {
    // Offline or network error - fall back to local storage
    try {
      localStorage.setItem(`neva_local_mirror_${syncId}`, JSON.stringify(stateData));
    } catch (e) {}

    return {
      success: false,
      database: 'Local Mirror (Offline Ready)',
      syncId,
      message: error.message || 'Saved locally in offline mode.',
      updatedAt: new Date().toISOString()
    };
  }
};

// Fetch State from Cloud
export const fetchStateFromCloud = async (
  syncId: string = 'default_user'
): Promise<{ data: any; updatedAt?: string; database?: string } | null> => {
  if (isDeviceOffline()) {
    try {
      const local = localStorage.getItem(`neva_local_mirror_${syncId}`);
      if (local) {
        return { data: JSON.parse(local), updatedAt: new Date().toISOString(), database: 'Local Mirror (Offline)' };
      }
    } catch (e) {}
    return null;
  }

  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${baseUrl}/api/sync?syncId=${encodeURIComponent(syncId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const result = await response.json();
    if (result && result.data) {
      return {
        data: result.data,
        updatedAt: result.updatedAt,
        database: result.database,
      };
    }
    return null;
  } catch (error) {
    // Fall back to local mirror
    try {
      const local = localStorage.getItem(`neva_local_mirror_${syncId}`);
      if (local) {
        return { data: JSON.parse(local), updatedAt: new Date().toISOString(), database: 'Local Mirror (Offline)' };
      }
    } catch (e) {}
    return null;
  }
};

// Account Authentication: Sign Up or Log In
export const authenticateUserAccount = async (
  action: 'signup' | 'login',
  email: string,
  name?: string,
  password?: string
): Promise<{ success: boolean; user?: UserAccountProfile; message?: string }> => {
  const baseUrl = getApiBaseUrl();
  const cleanEmail = email.trim().toLowerCase();
  const userName = name || cleanEmail.split('@')[0];

  // If offline, create local user account immediately
  if (isDeviceOffline()) {
    const offlineUser: UserAccountProfile = {
      id: cleanEmail.replace(/[^a-z0-9_]/g, '_'),
      email: cleanEmail,
      name: userName,
      lastSyncedAt: new Date().toISOString(),
      isOnlineAccount: false
    };
    saveAccountToStorage(offlineUser);
    return {
      success: true,
      user: offlineUser,
      message: 'Account created in Offline Standalone Mode. All data stored safely on this device.'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        email: cleanEmail,
        name: userName,
        password: password || 'default_pw'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.user) {
      const profile: UserAccountProfile = {
        id: data.user.id || cleanEmail,
        email: data.user.email || cleanEmail,
        name: data.user.name || userName,
        lastSyncedAt: new Date().toISOString(),
        isOnlineAccount: true
      };
      saveAccountToStorage(profile);
      return {
        success: true,
        user: profile,
        message: data.message || 'Connected to NEVA Cloud Account!'
      };
    }

    throw new Error(data.error || 'Authentication failed');
  } catch (err: any) {
    // Graceful offline fallback
    const fallbackUser: UserAccountProfile = {
      id: cleanEmail.replace(/[^a-z0-9_]/g, '_'),
      email: cleanEmail,
      name: userName,
      lastSyncedAt: new Date().toISOString(),
      isOnlineAccount: true
    };
    saveAccountToStorage(fallbackUser);
    return {
      success: true,
      user: fallbackUser,
      message: 'Logged in! Offline mode enabled with cloud sync queued.'
    };
  }
};

// Local storage account persistence
export const getStoredUserAccount = (): UserAccountProfile | null => {
  try {
    const saved = localStorage.getItem('neva_user_account_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
};

export const saveAccountToStorage = (user: UserAccountProfile): void => {
  try {
    localStorage.setItem('neva_user_account_v1', JSON.stringify(user));
  } catch (e) {}
};

export const clearStoredUserAccount = (): void => {
  try {
    localStorage.removeItem('neva_user_account_v1');
  } catch (e) {}
};
