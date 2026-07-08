import { fullPermissions, getCurrentUser } from './permissions';
import { DEFAULT_ADMIN_AUTH, DEFAULT_ADMIN_EMAIL } from './adminConfig';

export const saveSession = (user) => {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const preserveSession = () => {
  const user = getCurrentUser();
  if (user) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};

export const clearSession = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('currentUser');
};

export const getLegacyAdminUser = () => ({
  id: 'local-admin',
  name: 'Admin',
  email: DEFAULT_ADMIN_EMAIL,
  roleName: 'Admin',
  team: 'Management',
  permissions: fullPermissions(),
});

export const tryLegacyLogin = (email, password) => {
  const storedAdmin = JSON.parse(localStorage.getItem('adminAuth') || 'null');
  const fallback = storedAdmin || DEFAULT_ADMIN_AUTH;
  if (email === fallback.email && password === fallback.password) {
    const user = getLegacyAdminUser();
    saveSession(user);
    return user;
  }
  return null;
};
