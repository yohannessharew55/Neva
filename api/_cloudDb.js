import https from 'https';
import crypto from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.NEVA_CLOUD_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'yohannessharew55/Neva';

// Memory cache for superfast serverless warm hits
const memCache = {
  users: null,
  usersSha: null,
  states: new Map()
};

function githubRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}${path}`,
      method,
      headers: {
        'User-Agent': 'NEVA-Cloud-DB',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Password hashing
export function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

// Read all users
export async function getUsersDb() {
  const res = await githubRequest('/contents/data/users_db.json');
  if (res.status === 200 && res.data && res.data.content) {
    try {
      const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
      const db = JSON.parse(content);
      memCache.users = db;
      memCache.usersSha = res.data.sha;
      return { db, sha: res.data.sha };
    } catch (e) {
      console.error('Error parsing users_db:', e);
    }
  }
  return { db: { users: {} }, sha: null };
}

// Save all users
export async function saveUsersDb(db, sha = null) {
  const putData = {
    message: 'Update NEVA user accounts [skip ci]',
    content: Buffer.from(JSON.stringify(db, null, 2)).toString('base64')
  };
  if (sha) putData.sha = sha;

  const res = await githubRequest('/contents/data/users_db.json', 'PUT', putData);
  if (res.status === 200 || res.status === 201) {
    memCache.users = db;
    memCache.usersSha = res.data?.content?.sha || res.data?.commit?.sha;
    return true;
  }
  return false;
}

// Find user by username or email
export async function findUser(identifier) {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();
  const { db } = await getUsersDb();
  
  // Try direct username match
  if (db.users[cleanId]) return db.users[cleanId];

  // Try matching by email
  for (const u of Object.values(db.users)) {
    if (u.email && u.email.toLowerCase() === cleanId) {
      return u;
    }
  }
  return null;
}

// Create new user
export async function createUser({ username, name, email, password, avatarColor, avatarPhoto, motto, role, location }) {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const { db, sha } = await getUsersDb();

  if (db.users[cleanUsername]) {
    throw new Error('Username already exists. Please pick a different username.');
  }

  // Check email
  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    for (const u of Object.values(db.users)) {
      if (u.email && u.email.toLowerCase() === cleanEmail) {
        throw new Error('An account with this email already exists.');
      }
    }
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: `usr_${cleanUsername}_${Date.now()}`,
    username: cleanUsername,
    name: name?.trim() || cleanUsername,
    email: email?.trim().toLowerCase() || null,
    avatarColor: avatarColor || '#0082ff',
    avatarPhoto: avatarPhoto || null,
    motto: motto?.trim() || null,
    role: role?.trim() || null,
    location: location?.trim() || null,
    salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  db.users[cleanUsername] = newUser;
  const saved = await saveUsersDb(db, sha);
  if (!saved) {
    throw new Error('Failed to persist user to Cloud DB. Please try again.');
  }

  // Return public user profile without sensitive salt/hash
  return {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    email: newUser.email,
    avatarColor: newUser.avatarColor,
    avatarPhoto: newUser.avatarPhoto,
    motto: newUser.motto,
    role: newUser.role,
    location: newUser.location,
    createdAt: newUser.createdAt
  };
}

// Update existing user profile
export async function updateUserProfile(username, updates) {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const { db, sha } = await getUsersDb();

  const user = db.users[cleanUsername];
  if (!user) {
    throw new Error('User not found.');
  }

  // Update allowed profile fields
  if (updates.name !== undefined) user.name = updates.name.trim() || cleanUsername;
  if (updates.email !== undefined) user.email = updates.email?.trim().toLowerCase() || null;
  if (updates.avatarColor !== undefined) user.avatarColor = updates.avatarColor;
  if (updates.avatarPhoto !== undefined) user.avatarPhoto = updates.avatarPhoto; // Base64 data URL or null
  if (updates.motto !== undefined) user.motto = updates.motto.trim();
  if (updates.role !== undefined) user.role = updates.role.trim();
  if (updates.location !== undefined) user.location = updates.location.trim();

  // If password update requested
  if (updates.newPassword) {
    const { hash, salt } = hashPassword(updates.newPassword);
    user.passwordHash = hash;
    user.salt = salt;
  }

  user.updatedAt = new Date().toISOString();

  const saved = await saveUsersDb(db, sha);
  if (!saved) {
    throw new Error('Failed to save profile updates to Cloud DB.');
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    avatarPhoto: user.avatarPhoto || null,
    motto: user.motto || null,
    role: user.role || null,
    location: user.location || null,
    createdAt: user.createdAt,
    lastSyncedAt: new Date().toISOString()
  };
}

// Get user saved state
export async function getUserState(username) {
  const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const res = await githubRequest(`/contents/data/states/${cleanUser}.json`);
  if (res.status === 200 && res.data && res.data.content) {
    try {
      const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
      return { payload: JSON.parse(content), sha: res.data.sha, updatedAt: res.data.updated_at || new Date().toISOString() };
    } catch (e) {}
  }
  return { payload: null, sha: null, updatedAt: null };
}

// Save user state
export async function saveUserState(username, payload) {
  const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  
  // Get current sha if exists
  const existing = await githubRequest(`/contents/data/states/${cleanUser}.json`);
  const sha = existing.status === 200 ? existing.data.sha : undefined;

  const putData = {
    message: `Sync state for ${cleanUser} [skip ci]`,
    content: Buffer.from(JSON.stringify(payload, null, 2)).toString('base64')
  };
  if (sha) putData.sha = sha;

  const res = await githubRequest(`/contents/data/states/${cleanUser}.json`, 'PUT', putData);
  return res.status === 200 || res.status === 201;
}
