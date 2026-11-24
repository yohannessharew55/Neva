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

// Read all users from data-sync branch to protect main branch deployment limits
export async function getUsersDb() {
  const res = await githubRequest('/contents/data/users_db.json?ref=data-sync');
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

// Save all users to data-sync branch
export async function saveUsersDb(db, sha = null) {
  const putData = {
    message: 'Update NEVA user accounts [skip ci]',
    content: Buffer.from(JSON.stringify(db, null, 2)).toString('base64'),
    branch: 'data-sync'
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

// Helper to merge user states bidirectionally without losing completions or recent edits
export function mergeUserStates(existing, incoming) {
  if (!existing || typeof existing !== 'object') return incoming;
  if (!incoming || typeof incoming !== 'object') return existing;

  const merged = { ...existing, ...incoming };

  // 1. Merge tasks
  if (Array.isArray(existing.tasks) && Array.isArray(incoming.tasks)) {
    const taskMap = new Map();

    const getTaskKey = (t) => {
      const datePart = t.date || '';
      const titlePart = (t.title || '').trim().toLowerCase();
      return `${titlePart}::${datePart}`;
    };

    existing.tasks.forEach((et) => {
      if (et.id) taskMap.set(et.id, et);
      const key = getTaskKey(et);
      if (key !== '::') taskMap.set(key, et);
    });

    incoming.tasks.forEach((it) => {
      const key = getTaskKey(it);
      let match = (it.id && taskMap.get(it.id)) || (key !== '::' && taskMap.get(key));

      if (match) {
        const existingTime = match.updatedAt ? new Date(match.updatedAt).getTime() : 0;
        const incomingTime = it.updatedAt ? new Date(it.updatedAt).getTime() : 0;

        let completed = match.completed;
        let completedAt = match.completedAt;

        if (incomingTime > existingTime + 500) {
          completed = it.completed;
          completedAt = it.completedAt;
        } else if (existingTime > incomingTime + 500) {
          completed = match.completed;
          completedAt = match.completedAt;
        } else {
          completed = !!(match.completed || it.completed);
          completedAt = match.completed ? match.completedAt : it.completedAt;
        }

        let checklist = match.checklist;
        if (Array.isArray(match.checklist) && Array.isArray(it.checklist) && match.checklist.length > 0 && it.checklist.length > 0) {
          const checkMap = new Map();
          match.checklist.forEach((c) => checkMap.set((c.text || '').trim().toLowerCase(), c));
          it.checklist.forEach((ic) => {
            const k = (ic.text || '').trim().toLowerCase();
            const mc = checkMap.get(k);
            if (mc) {
              checkMap.set(k, {
                ...mc,
                ...ic,
                done: !!(mc.done || ic.done)
              });
            } else {
              checkMap.set(k, ic);
            }
          });
          checklist = Array.from(checkMap.values());
        } else if (Array.isArray(it.checklist) && it.checklist.length > 0) {
          checklist = it.checklist;
        } else if (Array.isArray(match.checklist) && match.checklist.length > 0) {
          checklist = match.checklist;
        }

        const mergedTask = {
          ...match,
          ...it,
          id: match.id || it.id,
          completed,
          completedAt,
          checklist,
          updatedAt: new Date(Math.max(existingTime, incomingTime, Date.now())).toISOString()
        };

        taskMap.set(mergedTask.id, mergedTask);
        if (key !== '::') taskMap.set(key, mergedTask);
      } else {
        taskMap.set(it.id || key, it);
      }
    });

    const seenKeys = new Set();
    const finalTasks = [];
    for (const t of taskMap.values()) {
      const uniqueKey = t.id || getTaskKey(t);
      const titleDateKey = getTaskKey(t);
      if (titleDateKey !== '::') {
        if (!seenKeys.has(titleDateKey)) {
          seenKeys.add(titleDateKey);
          finalTasks.push(t);
        }
      } else if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        finalTasks.push(t);
      }
    }
    merged.tasks = finalTasks;
  }

  // 2. Merge categoryPlans
  if (existing.categoryPlans && incoming.categoryPlans) {
    const mergedPlans = { ...existing.categoryPlans };
    for (const [catId, incPlan] of Object.entries(incoming.categoryPlans)) {
      if (!mergedPlans[catId]) {
        mergedPlans[catId] = incPlan;
      } else {
        const exPlan = mergedPlans[catId];
        const dpMap = new Map();
        (exPlan.dailyPlans || []).forEach((p) => dpMap.set(p.id || p.text, p));
        (incPlan.dailyPlans || []).forEach((ip) => {
          const k = ip.id || ip.text;
          const ep = dpMap.get(k);
          if (ep) {
            dpMap.set(k, { ...ep, ...ip, completed: !!(ep.completed || ip.completed) });
          } else {
            dpMap.set(k, ip);
          }
        });

        const achieved = new Set([...(exPlan.achievedItems || []), ...(incPlan.achievedItems || [])]);
        const inProgress = new Set([...(exPlan.inProgressItems || []), ...(incPlan.inProgressItems || [])]);
        achieved.forEach(a => inProgress.delete(a));

        mergedPlans[catId] = {
          ...exPlan,
          ...incPlan,
          dailyPlans: Array.from(dpMap.values()),
          achievedItems: Array.from(achieved),
          inProgressItems: Array.from(inProgress)
        };
      }
    }
    merged.categoryPlans = mergedPlans;
  }

  // 3. Merge dailyStickyNotes
  if (Array.isArray(existing.dailyStickyNotes) && Array.isArray(incoming.dailyStickyNotes)) {
    const noteMap = new Map();
    existing.dailyStickyNotes.forEach((n) => noteMap.set(n.id || n.date, n));
    incoming.dailyStickyNotes.forEach((n) => {
      const k = n.id || n.date;
      const ex = noteMap.get(k);
      if (!ex) {
        noteMap.set(k, n);
      } else {
        const exTime = ex.updatedAt ? new Date(ex.updatedAt).getTime() : 0;
        const incTime = n.updatedAt ? new Date(n.updatedAt).getTime() : 0;
        noteMap.set(k, incTime >= exTime ? n : ex);
      }
    });
    merged.dailyStickyNotes = Array.from(noteMap.values());
  }

  // 4. Merge iosNotes
  if (Array.isArray(existing.iosNotes) && Array.isArray(incoming.iosNotes)) {
    const noteMap = new Map();
    existing.iosNotes.forEach((n) => noteMap.set(n.id, n));
    incoming.iosNotes.forEach((n) => {
      const ex = noteMap.get(n.id);
      if (!ex) {
        noteMap.set(n.id, n);
      } else {
        const exTime = ex.updatedAt ? new Date(ex.updatedAt).getTime() : 0;
        const incTime = n.updatedAt ? new Date(n.updatedAt).getTime() : 0;
        noteMap.set(n.id, incTime >= exTime ? n : ex);
      }
    });
    merged.iosNotes = Array.from(noteMap.values());
  }

  // 5. Merge goals, workouts, meals, sessions, reviews
  const mergeById = (exList, incList) => {
    if (!Array.isArray(incList)) return exList;
    if (!Array.isArray(exList)) return incList;
    const map = new Map();
    exList.forEach((item) => { if (item.id) map.set(item.id, item); });
    incList.forEach((item) => {
      if (item.id) {
        const ex = map.get(item.id);
        map.set(item.id, ex ? { ...ex, ...item } : item);
      }
    });
    return Array.from(map.values());
  };

  if (existing.goals && incoming.goals) merged.goals = mergeById(existing.goals, incoming.goals);
  if (existing.workouts && incoming.workouts) merged.workouts = mergeById(existing.workouts, incoming.workouts);
  if (existing.meals && incoming.meals) merged.meals = mergeById(existing.meals, incoming.meals);
  if (existing.sessions && incoming.sessions) merged.sessions = mergeById(existing.sessions, incoming.sessions);
  if (existing.reviews && incoming.reviews) merged.reviews = mergeById(existing.reviews, incoming.reviews);

  return merged;
}

// Get user saved state from data-sync branch
export async function getUserState(username) {
  const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  // Check in-memory hot cache first
  if (memCache.states && memCache.states.has(cleanUser)) {
    const cached = memCache.states.get(cleanUser);
    if (cached && cached.payload) {
      return {
        payload: cached.payload,
        sha: cached.sha || null,
        updatedAt: cached.updatedAt || new Date().toISOString()
      };
    }
  }

  const res = await githubRequest(`/contents/data/states/${cleanUser}.json?ref=data-sync&_cb=${Date.now()}`);
  if (res.status === 200 && res.data && res.data.content) {
    try {
      const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
      const payload = JSON.parse(content);
      const savedUpdatedAt = payload._updatedAt || payload._metadata?.updatedAt || null;
      if (memCache.states) {
        memCache.states.set(cleanUser, { payload, sha: res.data.sha, updatedAt: savedUpdatedAt });
      }
      return { 
        payload, 
        sha: res.data.sha, 
        updatedAt: savedUpdatedAt || new Date().toISOString() 
      };
    } catch (e) {}
  }
  return { payload: null, sha: null, updatedAt: null };
}

// Save user state to data-sync branch with smart server-side merging
export async function saveUserState(username, payload) {
  const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  
  // Get current state from data-sync branch if exists to merge
  const existing = await githubRequest(`/contents/data/states/${cleanUser}.json?ref=data-sync&_cb=${Date.now()}`);
  const sha = existing.status === 200 ? existing.data.sha : undefined;
  let existingPayload = null;

  if (existing.status === 200 && existing.data && existing.data.content) {
    try {
      const existingStr = Buffer.from(existing.data.content, 'base64').toString('utf-8');
      existingPayload = JSON.parse(existingStr);
    } catch (e) {}
  }

  // Smart server-side merge so completions from other devices are NEVER overwritten
  let finalPayload = payload;
  if (existingPayload) {
    finalPayload = mergeUserStates(existingPayload, payload);
  }

  const nowIso = new Date().toISOString();
  if (typeof finalPayload === 'object' && finalPayload !== null) {
    finalPayload._updatedAt = nowIso;
    finalPayload._updatedTimestamp = Date.now();
  }

  // Deduplicate redundant identical commits to save GitHub API quota and prevent commit spamming
  if (existingPayload) {
    try {
      const cleanExisting = { ...existingPayload, _updatedAt: undefined, _updatedTimestamp: undefined, _metadata: undefined };
      const cleanFinal = { ...finalPayload, _updatedAt: undefined, _updatedTimestamp: undefined, _metadata: undefined };
      if (JSON.stringify(cleanExisting) === JSON.stringify(cleanFinal)) {
        if (memCache.states) {
          memCache.states.set(cleanUser, { payload: existingPayload, sha, updatedAt: existingPayload._updatedAt });
        }
        return { success: true, payload: existingPayload, updatedAt: existingPayload._updatedAt };
      }
    } catch (e) {}
  }

  const putData = {
    message: `Sync state for ${cleanUser} [skip ci]`,
    content: Buffer.from(JSON.stringify(finalPayload, null, 2)).toString('base64'),
    branch: 'data-sync'
  };
  if (sha) putData.sha = sha;

  const res = await githubRequest(`/contents/data/states/${cleanUser}.json`, 'PUT', putData);
  const success = res.status === 200 || res.status === 201;

  if (success && memCache.states) {
    memCache.states.set(cleanUser, {
      payload: finalPayload,
      sha: res.data?.content?.sha || res.data?.commit?.sha,
      updatedAt: nowIso
    });
  }

  return { success, payload: finalPayload, updatedAt: nowIso };
}
