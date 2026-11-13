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
  username: string;
  name: string;
  email?: string | null;
  avatarColor?: string;
  createdAt?: string;
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
  const cleanSyncId = syncId.trim() || 'default_user';

  // If offline, save locally without network delay
  if (isDeviceOffline()) {
    try {
      localStorage.setItem(`neva_local_mirror_${cleanSyncId}`, JSON.stringify(stateData));
    } catch (e) {}
    return {
      success: true,
      database: 'Local Mirror (100% Offline)',
      syncId: cleanSyncId,
      message: 'Persisted to local device storage while offline.',
      updatedAt: new Date().toISOString()
    };
  }

  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(`${baseUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        syncId: cleanSyncId,
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
      success: result.status === 'success',
      database: result.database || 'NEVA Cloud Storage',
      syncId: result.syncId || cleanSyncId,
      message: result.message,
      updatedAt: result.updatedAt || new Date().toISOString(),
    };
  } catch (error: any) {
    // Offline or network error - fall back to local storage
    try {
      localStorage.setItem(`neva_local_mirror_${cleanSyncId}`, JSON.stringify(stateData));
    } catch (e) {}

    return {
      success: false,
      database: 'Local Mirror (Offline Ready)',
      syncId: cleanSyncId,
      message: error.message || 'Saved locally in offline mode.',
      updatedAt: new Date().toISOString()
    };
  }
};

// Retrieve State from Cloud (or local mirror if offline)
export const fetchStateFromCloud = async (syncId: string = 'default_user'): Promise<{ data: any; database: string; updatedAt?: string } | null> => {
  const cleanSyncId = syncId.trim() || 'default_user';

  // Check offline first
  if (isDeviceOffline()) {
    try {
      const local = localStorage.getItem(`neva_local_mirror_${cleanSyncId}`);
      if (local) {
        return {
          data: JSON.parse(local),
          database: 'Local Mirror (Offline)'
        };
      }
    } catch (e) {}
    return null;
  }

  const baseUrl = getApiBaseUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${baseUrl}/api/sync?syncId=${encodeURIComponent(cleanSyncId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.data) {
      // Mirror locally in case device goes offline later
      try {
        localStorage.setItem(`neva_local_mirror_${cleanSyncId}`, JSON.stringify(result.data));
      } catch (e) {}

      return {
        data: result.data,
        database: result.database || 'NEVA Cloud Storage',
        updatedAt: result.updatedAt
      };
    }
    return null;
  } catch (error: any) {
    // Fallback to local mirror on fetch failure
    try {
      const local = localStorage.getItem(`neva_local_mirror_${cleanSyncId}`);
      if (local) {
        return {
          data: JSON.parse(local),
          database: 'Local Mirror (Cached)'
        };
      }
    } catch (e) {}
    return null;
  }
};

// Account Authentication: Sign Up or Log In
export const authenticateUserAccount = async (
  action: 'signup' | 'login',
  params: {
    username: string;
    password?: string;
    name?: string;
    email?: string;
    avatarColor?: string;
    initialPayload?: any;
  }
): Promise<{ success: boolean; user?: UserAccountProfile; state?: any; message?: string }> => {
  const baseUrl = getApiBaseUrl();
  const cleanUsername = params.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const displayName = params.name?.trim() || cleanUsername;

  // If completely offline
  if (isDeviceOffline()) {
    const offlineUser: UserAccountProfile = {
      id: `usr_${cleanUsername}_offline`,
      username: cleanUsername,
      name: displayName,
      email: params.email?.trim() || null,
      avatarColor: params.avatarColor || '#0082ff',
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      isOnlineAccount: false
    };
    saveAccountToStorage(offlineUser);
    return {
      success: true,
      user: offlineUser,
      message: 'Offline profile created. Data will sync automatically when back online.'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        username: cleanUsername,
        name: displayName,
        email: params.email?.trim() || undefined,
        password: params.password,
        avatarColor: params.avatarColor || '#0082ff',
        initialPayload: params.initialPayload
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || `Authentication failed (HTTP ${response.status})`
      };
    }

    if (data.user) {
      const profile: UserAccountProfile = {
        id: data.user.id || cleanUsername,
        username: data.user.username || cleanUsername,
        name: data.user.name || displayName,
        email: data.user.email || null,
        avatarColor: data.user.avatarColor || '#0082ff',
        createdAt: data.user.createdAt,
        lastSyncedAt: data.user.lastSyncedAt || new Date().toISOString(),
        isOnlineAccount: true
      };
      saveAccountToStorage(profile);
      return {
        success: true,
        user: profile,
        state: data.state,
        message: data.message || 'Connected to NEVA Cloud Account!'
      };
    }

    return {
      success: false,
      message: data.error || 'Authentication failed.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error during authentication.'
    };
  }
};

// Local storage account persistence
export const getStoredUserAccount = (): UserAccountProfile | null => {
  try {
    const saved = localStorage.getItem('neva_user_account_v2');
    if (saved) return JSON.parse(saved);
    // Legacy migration check
    const legacy = localStorage.getItem('neva_user_account_v1');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const migrated: UserAccountProfile = {
        id: parsed.id || 'usr_default',
        username: parsed.email ? parsed.email.split('@')[0].replace(/[^a-z0-9_]/g, '') : 'user',
        name: parsed.name || 'User',
        email: parsed.email || null,
        avatarColor: '#0082ff',
        createdAt: new Date().toISOString(),
        lastSyncedAt: parsed.lastSyncedAt,
        isOnlineAccount: parsed.isOnlineAccount ?? true
      };
      localStorage.setItem('neva_user_account_v2', JSON.stringify(migrated));
      return migrated;
    }
  } catch (e) {}
  return null;
};

export const saveAccountToStorage = (user: UserAccountProfile): void => {
  try {
    localStorage.setItem('neva_user_account_v2', JSON.stringify(user));
  } catch (e) {}
};

export const clearStoredUserAccount = (): void => {
  try {
    localStorage.removeItem('neva_user_account_v2');
    localStorage.removeItem('neva_user_account_v1');
  } catch (e) {}
};
