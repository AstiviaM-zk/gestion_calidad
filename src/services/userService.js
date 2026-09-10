import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON database file
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory map loaded from users.json file
const usersMap = new Map();

// Load existing users from disk on startup
function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const rawData = fs.readFileSync(USERS_FILE, 'utf-8');
      const usersList = JSON.parse(rawData);
      usersList.forEach(user => {
        usersMap.set(user.email, user);
      });
      console.log(`📂 Base de datos de usuarios cargada desde ${USERS_FILE} (${usersMap.size} usuarios registrados)`);
    }
  } catch (err) {
    console.error('Error cargando base de datos de usuarios:', err.message);
  }
}

// Save users to disk
function saveUsersToDisk() {
  try {
    const usersList = Array.from(usersMap.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error guardando base de datos de usuarios en disco:', err.message);
  }
}

// Initial load
loadUsersFromDisk();

/**
 * Upserts user into the real system user store upon Google login
 * @param {Object} googleUser 
 * @returns {Object} user record
 */
export function upsertUserFromGoogle(googleUser) {
  if (!googleUser || !googleUser.email) return null;

  const email = googleUser.email;
  const existing = usersMap.get(email);
  const now = new Date().toISOString();

  if (existing) {
    existing.name = googleUser.name || existing.name;
    existing.givenName = googleUser.givenName || existing.givenName;
    existing.familyName = googleUser.familyName || existing.familyName;
    existing.picture = googleUser.picture || existing.picture;
    existing.googleId = googleUser.googleId || existing.googleId;
    existing.lastLogin = now;
    existing.status = 'Activo';
    usersMap.set(email, existing);
    saveUsersToDisk();
    return existing;
  }

  // First user to log in gets 'Administrador' role, subsequent users get 'Usuario'
  const isFirstUser = usersMap.size === 0;
  const role = isFirstUser ? 'Administrador' : 'Usuario';

  const newUser = {
    id: `USR-${(usersMap.size + 1).toString().padStart(3, '0')}`,
    googleId: googleUser.googleId,
    name: googleUser.name,
    givenName: googleUser.givenName || googleUser.name,
    familyName: googleUser.familyName || '',
    email: googleUser.email,
    picture: googleUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(googleUser.name)}&background=4f46e5&color=fff`,
    role: role,
    status: 'Activo',
    createdAt: now,
    lastLogin: now
  };

  usersMap.set(email, newUser);
  saveUsersToDisk();
  return newUser;
}

/**
 * Update a user's role
 */
export function updateUserRole(email, newRole) {
  const user = usersMap.get(email);
  if (user) {
    user.role = newRole;
    usersMap.set(email, user);
    saveUsersToDisk();
    return user;
  }
  return null;
}

/**
 * Get all real users registered in the system
 */
export function getAllUsers() {
  return Array.from(usersMap.values());
}
