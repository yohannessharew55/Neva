export interface CloudSyncResult {
  success: boolean;
  database: string;
  syncId?: string;
  message?: string;
  updatedAt?: string;
}

export const syncStateToCloud = async (stateData: any, syncId: string = 'default_user'): Promise<CloudSyncResult> => {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        syncId,
        payload: stateData,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.status === 'success',
      database: result.database || 'PostgreSQL (Neon)',
      syncId: result.syncId || syncId,
      message: result.message,
      updatedAt: result.updatedAt,
    };
  } catch (error: any) {
    // Offline or network error - gracefully fall back
    console.warn('Cloud sync skipped (offline or serverless endpoint pending):', error.message);
    return {
      success: false,
      database: 'Local Mirror (Offline)',
      message: error.message,
    };
  }
};

export const fetchStateFromCloud = async (
  syncId: string = 'default_user'
): Promise<{ data: any; updatedAt?: string; database?: string } | null> => {
  try {
    const response = await fetch(`/api/sync?syncId=${encodeURIComponent(syncId)}`, {
      method: 'GET',
    });

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
    return null;
  }
};
