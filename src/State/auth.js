export const ROLES = Object.freeze({
  OWNER: 'Owner',
  CEO: 'Owner',
  USER: 'User',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Accountant',
});

export const DEFAULT_CEO_CREDENTIALS = Object.freeze({
  email: 'ceo@manufacture.local',
  password: 'CEO@123',
});

const USERS_KEY = 'manufacture-erp-users';
const SESSION_KEY = 'manufacture-erp-session';
const ACTIVITY_KEY = 'manufacture-erp-owner-activity';
const allowedRoles = new Set(Object.values(ROLES));
const defaultCEO = {
  id: 'default-ceo',
  name: 'Company CEO',
  ...DEFAULT_CEO_CREDENTIALS,
  mobile: '',
  address: '',
  role: ROLES.CEO,
  status: 'Active',
  lastLogin: null,
};

function readUsers() {
  const storedUsers = localStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultCEO]));
    return [defaultCEO];
  }

  try {
    const users = JSON.parse(storedUsers);
    if (!Array.isArray(users)) throw new Error('Stored user list is invalid.');
    const validUsers = users
      .map((user) => ({ ...user, role: user.role === 'CEO' ? ROLES.OWNER : user.role, status: user.status || 'Active', lastLogin: user.lastLogin || null }))
      .filter((user) => allowedRoles.has(user.role) && user.email && user.password);
    if (!validUsers.some((user) => user.role === ROLES.CEO)) validUsers.unshift(defaultCEO);
    return validUsers;
  } catch (error) {
    console.error('Unable to read saved accounts.', error);
    localStorage.setItem(USERS_KEY, JSON.stringify([defaultCEO]));
    return [defaultCEO];
  }
}

function publicUser(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export function getCurrentUser() {
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  const user = readUsers().find((account) => account.email.toLowerCase() === email.toLowerCase());
  return publicUser(user);
}

export function getUsers() {
  return readUsers().map(publicUser);
}

export function getOwnerActivity() {
  if (getCurrentUser()?.role !== ROLES.OWNER) return [];
  try {
    const entries = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

export function recordOwnerActivity(action, module, recordId = '') {
  const actor = getCurrentUser();
  if (actor?.role !== ROLES.OWNER) return;
  const entries = getOwnerActivity();
  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: actor.id,
    name: actor.name || 'Unknown user',
    action,
    module,
    recordId: String(recordId || ''),
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(entries.slice(0, 250)));
}

export function loginUser(email, password) {
  const users = readUsers();
  const userIndex = users.findIndex((account) =>
    account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password,
  );
  if (userIndex < 0 || users[userIndex].status !== 'Active') return false;
  const user = { ...users[userIndex], lastLogin: new Date().toISOString() };
  users[userIndex] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(SESSION_KEY, user.email);
  return true;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function registerUser(account) {
  const name = String(account.name || '').trim();
  const email = String(account.email || '').trim().toLowerCase();
  const mobile = String(account.mobile || '').trim();
  const address = String(account.address || '').trim();
  const password = String(account.password || '');

  if (!name || !email || !password || !mobile || !address) {
    throw new Error('Complete all required fields.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }
  if (password !== account.confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    password,
    mobile,
    address,
    role: ROLES.USER,
    status: 'Active',
    lastLogin: null,
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  return publicUser(newUser);
}

export function createManagedUser(account) {
  if (getCurrentUser()?.role !== ROLES.OWNER) throw new Error('Only an Owner can create accounts.');
  if (![ROLES.OWNER, ROLES.USER, ROLES.MANAGER, ROLES.ACCOUNTANT].includes(account.role)) {
    throw new Error('Choose a supported account role.');
  }

  const users = readUsers();
  const email = account.email.trim().toLowerCase();
  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    ...account,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    name: account.name.trim(),
    status: 'Active',
    lastLogin: null,
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  recordOwnerActivity(`Created ${newUser.role} account`, 'Account Management', newUser.id);
  return publicUser(newUser);
}

export function approveUserAsOwner(userId) {
  if (getCurrentUser()?.role !== ROLES.OWNER) throw new Error('Only an Owner can approve Owner access.');
  const users = readUsers();
  const user = users.find((account) => account.id === userId);
  if (!user || user.role !== ROLES.USER) throw new Error('Only registered Users can be approved.');
  user.role = ROLES.OWNER;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  recordOwnerActivity('Approved User for Owner access', 'Account Management', user.id);
  return publicUser(user);
}

const sharedPaths = ['/dashboard', '/inventory', '/attendance', '/salary'];

export function canAccessPath(role, path) {
  if (!allowedRoles.has(role)) return false;
  if (role === ROLES.OWNER) return true;
  if (sharedPaths.includes(path)) return true;
  if (role === ROLES.ACCOUNTANT && ['/income', '/expense'].includes(path)) return true;
  if (role === ROLES.CEO && path === '/account-management') return true;
  return false;
}

export function maskSensitiveAmount(amount, role) {
  if (role === ROLES.CEO) return `₹ ${Number(amount).toLocaleString('en-IN')}`;
  const numericAmount = Number(amount);
  const digitCount = String(Math.trunc(Number.isFinite(numericAmount) ? Math.abs(numericAmount) : 0)).length;
  return `₹ ${'*'.repeat(digitCount)}`;
}
