import { findUser, createUser, verifyPassword, getUserState, saveUserState } from './_cloudDb.js';

export default async function handler(req, res) {
  // CORS configuration for Web and Capacitor iOS/Android
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }

  const { action, username, password, name, email, avatarColor, initialPayload } = body || {};

  try {
    // 1. SIGN UP
    if (action === 'signup') {
      if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters (letters, numbers, underscores)' });
      }
      if (!password || password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
      }

      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username must contain at least 3 valid characters (a-z, 0-9, _)' });
      }

      const user = await createUser({
        username: cleanUsername,
        name: name || cleanUsername,
        email: email || null,
        password,
        avatarColor: avatarColor || '#0082ff'
      });

      // If initial local state was provided on signup, save it immediately to cloud
      if (initialPayload) {
        try {
          await saveUserState(cleanUsername, initialPayload);
        } catch (e) {
          console.error('Error saving initial state on signup:', e);
        }
      }

      return res.status(201).json({
        status: 'success',
        message: 'Account created successfully! Your data is now synced to the cloud.',
        user
      });
    }

    // 2. LOG IN
    if (action === 'login') {
      const identifier = username || email;
      if (!identifier || !identifier.trim()) {
        return res.status(400).json({ error: 'Please enter your username or email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Please enter your password' });
      }

      const userRecord = await findUser(identifier);
      if (!userRecord) {
        return res.status(404).json({ error: 'Account not found. Please check your username or sign up.' });
      }

      const isValid = verifyPassword(password, userRecord.salt, userRecord.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
      }

      // Fetch user's saved cloud state
      const { payload, updatedAt } = await getUserState(userRecord.username);

      const publicUser = {
        id: userRecord.id,
        username: userRecord.username,
        name: userRecord.name,
        email: userRecord.email,
        avatarColor: userRecord.avatarColor || '#0082ff',
        createdAt: userRecord.createdAt,
        lastSyncedAt: updatedAt || new Date().toISOString()
      };

      return res.status(200).json({
        status: 'success',
        message: `Welcome back, ${publicUser.name}!`,
        user: publicUser,
        state: payload // Hydrate cross-platform data immediately!
      });
    }

    // 3. CHECK USER PROFILE
    if (action === 'get_profile') {
      if (!username) return res.status(400).json({ error: 'Username required' });
      const userRecord = await findUser(username);
      if (!userRecord) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({
        status: 'success',
        user: {
          id: userRecord.id,
          username: userRecord.username,
          name: userRecord.name,
          email: userRecord.email,
          avatarColor: userRecord.avatarColor || '#0082ff',
          createdAt: userRecord.createdAt
        }
      });
    }

    return res.status(400).json({ error: `Unknown action '${action}'` });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(400).json({ error: err.message || 'Authentication failed' });
  }
}
