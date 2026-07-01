export const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'jobCard', label: 'Job Card' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'challan', label: 'Challan' },
  { key: 'payments', label: 'Payments' },
  { key: 'paperStock', label: 'Paper Stock' },
  { key: 'statements', label: 'Statements' },
  { key: 'estimates', label: 'Estimates' },
  { key: 'itemList', label: 'Item List' },
  { key: 'settings', label: 'Settings' },
  { key: 'staffTeam', label: 'Staff & Team' },
];

export const ACTIONS = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'print', label: 'Print' },
];

export const emptyPermissions = () => {
  const permissions = {};
  MODULES.forEach(({ key }) => {
    permissions[key] = { view: false, create: false, edit: false, delete: false, print: false };
  });
  return permissions;
};

export const fullPermissions = () => {
  const permissions = emptyPermissions();
  MODULES.forEach(({ key }) => {
    ACTIONS.forEach(({ key: action }) => {
      permissions[key][action] = true;
    });
  });
  return permissions;
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const hasPermission = (moduleKey, action = 'view') => {
  const user = getCurrentUser();
  if (!user) return true;
  if (user.roleName === 'Admin') return true;
  return !!user.permissions?.[moduleKey]?.[action];
};

export const canAccessStaffTeam = () => hasPermission('staffTeam', 'view');
export const canManageStaff = () => hasPermission('staffTeam', 'edit') || hasPermission('staffTeam', 'create');
