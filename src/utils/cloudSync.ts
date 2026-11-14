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
  avatarPhoto?: string | null;
  motto?: string | null;
  role?: string | null;
  location?: string | null;
  tier?: string;
  createdAt?: string;
  lastSyncedAt?: string;
  isOnlineAccount: boolean;
}

// Ensure mobile app on iOS connects to the production Vercel cloud endpoint
export const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const isCapacitorNative = Capacitor.isNativePlatform() || 
    window.location.protocol === 'capacitor:' || 
    window.location.protocol === 'ionic:' ||
    window.location.protocol === 'file:' ||
    window.location.origin.includes('capacitor://') ||
    window.location.origin.includes('ionic://') ||
    (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'));
  
  if (isCapacitorNative) {
    return 'https://neva-os.vercel.app';
  }
  return '';
};

// Check if currently offline
export const isDeviceOffline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
};

// Offline pending sync tracking
export const markPendingSync = (syncId: string = 'default_user', data?: any): void => {
  try {
    const cleanId = syncId.trim() || 'default_user';
    localStorage.setItem(`neva_pending_sync_${cleanId}`, 'true');
    localStorage.setItem(`neva_last_local_edit_${cleanId}`, Date.now().toString());
    if (data) {
      localStorage.setItem(`neva_local_mirror_${cleanId}`, JSON.stringify(data));
    }
  } catch (e) {}
};

export const clearPendingSync = (syncId: string = 'default_user'): void => {
  try {
    const cleanId = syncId.trim() || 'default_user';
    localStorage.removeItem(`neva_pending_sync_${cleanId}`);
  } catch (e) {}
};

export const hasPendingSync = (syncId: string = 'default_user'): boolean => {
  try {
    const cleanId = syncId.trim() || 'default_user';
    return localStorage.getItem(`neva_pending_sync_${cleanId}`) === 'true';
  } catch (e) {
    return false;
  }
};

export const getPendingSyncData = (syncId: string = 'default_user'): any | null => {
  try {
    const cleanId = syncId.trim() || 'default_user';
    const local = localStorage.getItem(`neva_local_mirror_${cleanId}`);
    return local ? JSON.parse(local) : null;
  } catch (e) {
    return null;
  }
};

// Sync State to Cloud (or gracefully mirror locally if offline)
export const syncStateToCloud = async (stateData: any, syncId: string = 'default_user'): Promise<CloudSyncResult> => {
  const cleanSyncId = syncId.trim() || 'default_user';

  // Always persist local mirror first so data is 100% safe on device
  try {
    localStorage.setItem(`neva_local_mirror_${cleanSyncId}`, JSON.stringify(stateData));
  } catch (e) {}

  // If offline, queue for auto-sync when online
  if (isDeviceOffline()) {
    markPendingSync(cleanSyncId, stateData);
    return {
      success: false,
      database: 'Local Storage (Offline - Queued)',
      syncId: cleanSyncId,
      message: 'Saved on device. Will automatically sync to cloud when online.',
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
    if (result.status === 'success') {
      clearPendingSync(cleanSyncId);
      return {
        success: true,
        database: result.database || 'NEVA Cloud Storage',
        syncId: result.syncId || cleanSyncId,
        message: result.message || 'Synced successfully to NEVA Cloud.',
        updatedAt: result.updatedAt || new Date().toISOString(),
      };
    } else {
      throw new Error(result.message || 'Sync failed on server');
    }
  } catch (error: any) {
    // Network or server error - mark pending for auto-sync when connection restores
    markPendingSync(cleanSyncId, stateData);

    return {
      success: false,
      database: 'Local Storage (Offline Pending)',
      syncId: cleanSyncId,
      message: error.message || 'Saved locally. Will auto-sync when back online.',
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
    const timeoutId = setTimeout(() => controller.abort(), 3500); // Fast 3.5s timeout for snappy startup

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
        avatarPhoto: data.user.avatarPhoto || null,
        motto: data.user.motto || null,
        role: data.user.role || null,
        location: data.user.location || null,
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

// Update User Account Profile (photo, motto, role, theme color, etc.)
export const updateUserAccountProfile = async (
  username: string,
  updates: {
    name?: string;
    email?: string;
    avatarColor?: string;
    avatarPhoto?: string | null;
    motto?: string;
    role?: string;
    location?: string;
    currentPassword?: string;
    newPassword?: string;
  }
): Promise<{ success: boolean; user?: UserAccountProfile; message?: string }> => {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (isDeviceOffline()) {
    const current = getStoredUserAccount();
    if (current && current.username === cleanUsername) {
      const merged: UserAccountProfile = {
        ...current,
        name: updates.name !== undefined ? (updates.name.trim() || current.name) : current.name,
        email: updates.email !== undefined ? updates.email : current.email,
        avatarColor: updates.avatarColor !== undefined ? updates.avatarColor : current.avatarColor,
        avatarPhoto: updates.avatarPhoto !== undefined ? updates.avatarPhoto : current.avatarPhoto,
        motto: updates.motto !== undefined ? updates.motto : current.motto,
        role: updates.role !== undefined ? updates.role : current.role,
        location: updates.location !== undefined ? updates.location : current.location,
        lastSyncedAt: new Date().toISOString()
      };
      saveAccountToStorage(merged);
      return { success: true, user: merged, message: 'Profile updated locally (offline).' };
    }
  }

  const baseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_profile',
        username: cleanUsername,
        ...updates
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.error || 'Failed to update profile' };
    }

    if (data.user) {
      const updatedProfile: UserAccountProfile = {
        ...data.user,
        isOnlineAccount: true
      };
      saveAccountToStorage(updatedProfile);
      return { success: true, user: updatedProfile, message: 'Profile updated successfully!' };
    }
    return { success: false, message: 'Failed to update profile.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error updating profile.' };
  }
};

// Local storage and persistent cookie account session management (Keep signed in until explicit logout)
export const getStoredUserAccount = (): UserAccountProfile | null => {
  try {
    // 1. Primary localStorage session
    const saved = localStorage.getItem('neva_user_account_v2');
    if (saved) return JSON.parse(saved);

    // 2. Backup persistent session key
    const persistent = localStorage.getItem('neva_persistent_session');
    if (persistent) {
      const parsed = JSON.parse(persistent);
      localStorage.setItem('neva_user_account_v2', persistent);
      return parsed;
    }

    // 3. Persistent cookie backup (survives WKWebView cache evictions)
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(/(?:^|;\s*)neva_user_account=([^;]+)/);
      if (match && match[1]) {
        try {
          const cookieUser = JSON.parse(decodeURIComponent(match[1]));
          if (cookieUser && cookieUser.username) {
            saveAccountToStorage(cookieUser);
            return cookieUser;
          }
        } catch (e) {}
      }
    }

    // 4. Legacy migration check
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
      saveAccountToStorage(migrated);
      return migrated;
    }

    // 5. Automatic session recovery from existing sync key
    const activeSyncKey = localStorage.getItem('neva_mastery_scratch_v1_sync_key') || 
                          localStorage.getItem('livotion_mastery_state_v2_sync_key') ||
                          localStorage.getItem('neva_sync_key');
    if (activeSyncKey && activeSyncKey !== 'default_user' && activeSyncKey.trim().length >= 3) {
      const clean = activeSyncKey.trim();
      const recovered: UserAccountProfile = {
        id: `usr_${clean}`,
        username: clean,
        name: clean.charAt(0).toUpperCase() + clean.slice(1),
        email: null,
        avatarColor: '#0082ff',
        createdAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        isOnlineAccount: true
      };
      saveAccountToStorage(recovered);
      return recovered;
    }
  } catch (e) {}
  return null;
};

export const saveAccountToStorage = (user: UserAccountProfile): void => {
  try {
    const serialized = JSON.stringify(user);
    localStorage.setItem('neva_user_account_v2', serialized);
    localStorage.setItem('neva_persistent_session', serialized);
    localStorage.setItem('neva_keep_signed_in', 'true');
    // Set 10-year persistent cookie
    if (typeof document !== 'undefined') {
      document.cookie = `neva_user_account=${encodeURIComponent(serialized)}; max-age=315360000; path=/; SameSite=Lax`;
    }
  } catch (e) {}
};

export const clearStoredUserAccount = (): void => {
  try {
    localStorage.removeItem('neva_user_account_v2');
    localStorage.removeItem('neva_persistent_session');
    localStorage.removeItem('neva_keep_signed_in');
    localStorage.removeItem('neva_mastery_scratch_v1_sync_key');
    localStorage.removeItem('livotion_mastery_state_v2_sync_key');
    if (typeof document !== 'undefined') {
      document.cookie = `neva_user_account=; max-age=0; path=/; SameSite=Lax`;
    }
  } catch (e) {}
};

// SHA-256 helper for client-side password verification and caching
export const hashPasswordSha256 = async (text: string): Promise<string> => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {}
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
};

export const cacheAccountPasswordVerifier = async (username: string, password: string): Promise<void> => {
  try {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const hash = await hashPasswordSha256(password);
    localStorage.setItem(`neva_pwd_sha_${clean}`, hash);
  } catch (e) {}
};

// Verify main account password for security-sensitive actions (e.g. Clear All & Start from Scratch)
export const verifyMainAccountPassword = async (
  username: string,
  password: string
): Promise<{ success: boolean; message?: string }> => {
  if (!password) {
    return { success: false, message: 'Please enter your password.' };
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!cleanUsername) {
    return { success: false, message: 'Invalid username.' };
  }

  // 1. Verify online with /api/auth if device is online
  if (!isDeviceOffline()) {
    try {
      const res = await authenticateUserAccount('login', {
        username: cleanUsername,
        password: password
      });
      if (res.success) {
        await cacheAccountPasswordVerifier(cleanUsername, password);
        return { success: true };
      } else {
        return { success: false, message: res.message || 'Incorrect password.' };
      }
    } catch (err: any) {
      // Fall through to offline cache check
    }
  }

  // 2. Offline fallback check against cached SHA-256 verifier
  try {
    const cachedHash = localStorage.getItem(`neva_pwd_sha_${cleanUsername}`);
    if (cachedHash) {
      const inputHash = await hashPasswordSha256(password);
      if (inputHash === cachedHash) {
        return { success: true };
      }
      return { success: false, message: 'Incorrect password.' };
    }
  } catch (e) {}

  return { success: false, message: 'Unable to verify password while offline without prior cached login.' };
};

