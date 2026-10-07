export const ROLES = Object.freeze({
  CEO: 'CEO',
  MANAGER: 'Manager',
  ACCOUNTANT: 'Accountant',
});

export const DEFAULT_CEO_CREDENTIALS = Object.freeze({
  email: 'ceo@manufacture.local',
  password: 'CEO@123',
});

const USERS_KEY = 'manufacture-erp-users';
const SESSION_KEY = 'manufacture-erp-session';
const allowedRoles = new Set(Object.values(ROLES));
const defaultCEO = {
  id: 'default-ceo',
  name: 'Company CEO',
  ...DEFAULT_CEO_CREDENTIALS,
  mobile: '',
  address: '',
  role: ROLES.CEO,
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
    const validUsers = users.filter((user) => allowedRoles.has(user.role) && user.email && user.password);
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

export function loginUser(email, password) {
  const user = readUsers().find((account) =>
    account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password,
  );
  if (!user) return false;
  localStorage.setItem(SESSION_KEY, user.email);
  return true;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function createManagedUser(account) {
  if (getCurrentUser()?.role !== ROLES.CEO) throw new Error('Only the CEO can create accounts.');
  if (![ROLES.MANAGER, ROLES.ACCOUNTANT].includes(account.role)) {
    throw new Error('Only Manager and Accountant accounts can be created here.');
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
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  return publicUser(newUser);
}

const sharedPaths = ['/dashboard', '/inventory', '/attendance', '/salary'];

export function canAccessPath(role, path) {
  if (!allowedRoles.has(role)) return false;
  if (role === ROLES.CEO) return true;
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
