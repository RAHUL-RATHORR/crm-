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

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'print'];

export const emptyPermissions = () => {
  const permissions = {};
  MODULES.forEach(({ key }) => {
    permissions[key] = {
      view: false,
      create: false,
      edit: false,
      delete: false,
      print: false,
    };
  });
  return permissions;
};

export const fullPermissions = () => {
  const permissions = emptyPermissions();
  MODULES.forEach(({ key }) => {
    ACTIONS.forEach((action) => {
      permissions[key][action] = true;
    });
  });
  return permissions;
};

export const managerPermissions = () => {
  const permissions = emptyPermissions();
  const modules = ['dashboard', 'jobCard', 'invoice', 'challan', 'payments', 'paperStock', 'statements', 'estimates', 'itemList'];
  modules.forEach((key) => {
    permissions[key] = { view: true, create: true, edit: true, delete: false, print: true };
  });
  permissions.dashboard.delete = false;
  return permissions;
};

export const staffPermissions = () => {
  const permissions = emptyPermissions();
  ['dashboard', 'jobCard', 'invoice', 'challan', 'itemList'].forEach((key) => {
    permissions[key] = { view: true, create: true, edit: true, delete: false, print: true };
  });
  return permissions;
};
