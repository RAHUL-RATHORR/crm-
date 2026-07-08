export const DEFAULT_ADMIN_EMAIL = 'hariharprinters1@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'Printosync@HR@#1573';
export const LEGACY_ADMIN_EMAIL = 'admin@gmail.com';

export const DEFAULT_ADMIN_AUTH = {
  email: DEFAULT_ADMIN_EMAIL,
  password: DEFAULT_ADMIN_PASSWORD,
};

export const isAdminEmail = (email) =>
  String(email || '').trim().toLowerCase() === DEFAULT_ADMIN_EMAIL;
