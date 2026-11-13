import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  // Handle GET - Retrieve State
  if (req.method === 'GET') {
    if (!connectionString) {
      return res.status(200).json({
        status: 'offline_fallback',
        message: 'No POSTGRES_URL environment variable provided. Using browser client storage.',
        database: 'Local Mirror',
        data: null
      });
    }

    try {
      const url = new URL(req.url, 'http://localhost');
      const syncId = url.searchParams.get('syncId') || (req.query && req.query.syncId) || 'default_user';

      const sql = neon(connectionString);
      await sql`
        CREATE TABLE IF NOT EXISTS neva_mastery_state (
          user_id TEXT PRIMARY KEY,
          payload JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const rows = await sql`
        SELECT payload, updated_at FROM neva_mastery_state WHERE user_id = ${syncId} LIMIT 1;
      `;

      if (rows && rows.length > 0) {
        return res.status(200).json({
          status: 'success',
          database: 'PostgreSQL (Neon)',
          syncId,
          data: rows[0].payload,
          updatedAt: rows[0].updated_at
        });
      } else {
        return res.status(200).json({
          status: 'empty',
          database: 'PostgreSQL (Neon)',
          syncId,
          data: null
        });
      }
    } catch (error) {
      console.error('Postgres GET error:', error);
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

    if (!connectionString) {
      return res.status(200).json({
        status: 'persisted_locally',
        message: 'Saved to local browser storage. Connect PostgreSQL on Vercel for cross-device cloud sync.',
        database: 'Local Mirror'
      });
    }

    try {
      const sql = neon(connectionString);
      await sql`
        CREATE TABLE IF NOT EXISTS neva_mastery_state (
          user_id TEXT PRIMARY KEY,
          payload JSONB,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const payloadJson = JSON.stringify(payload);

      await sql`
        INSERT INTO neva_mastery_state (user_id, payload, updated_at)
        VALUES (${syncId}, ${payloadJson}::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP;
      `;

      return res.status(200).json({
        status: 'success',
        database: 'PostgreSQL (Neon)',
        syncId,
        message: 'State synchronized with PostgreSQL database successfully',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Postgres POST error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
