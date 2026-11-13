import { getUserState, saveUserState } from './_cloudDb.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET - Retrieve State
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, 'http://localhost');
      const syncId = url.searchParams.get('syncId') || (req.query && req.query.syncId) || 'default_user';

      const { payload, updatedAt } = await getUserState(syncId);

      if (payload) {
        return res.status(200).json({
          status: 'success',
          database: 'NEVA Cloud Storage',
          syncId,
          data: payload,
          updatedAt: updatedAt || new Date().toISOString()
        });
      } else {
        return res.status(200).json({
          status: 'empty',
          database: 'NEVA Cloud Storage',
          syncId,
          data: null
        });
      }
    } catch (error) {
      console.error('Cloud Sync GET error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Handle POST - Save/Sync State
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }

    if (!body) {
      return res.status(400).json({ error: 'Missing body payload' });
    }

    const syncId = body.syncId || 'default_user';
    const payload = body.payload || body.state || body;

    try {
      const success = await saveUserState(syncId, payload);
      if (success) {
        return res.status(200).json({
          status: 'success',
          message: 'Synced state to NEVA Cloud Storage successfully.',
          database: 'NEVA Cloud Storage',
          syncId,
          updatedAt: new Date().toISOString()
        });
      } else {
        throw new Error('Failed to save to cloud storage.');
      }
    } catch (error) {
      console.error('Cloud Sync POST error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
