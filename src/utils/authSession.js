import { fullPermissions } from './permissions';

export const saveSession = (user) => {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('currentUser');
};

export const getLegacyAdminUser = () => ({
  id: 'local-admin',
  name: 'Admin',
  email: 'admin@gmail.com',
  roleName: 'Admin',
  team: 'Management',
  permissions: fullPermissions(),
});

export const tryLegacyLogin = (email, password) => {
  const storedAdmin = JSON.parse(localStorage.getItem('adminAuth') || 'null');
  const fallback = storedAdmin || { email: 'admin@gmail.com', password: '123456' };
  if (email === fallback.email && password === fallback.password) {
    const user = getLegacyAdminUser();
    saveSession(user);
    return user;
  }
  return null;
};
