import React from 'react';
import { Users } from 'lucide-react';

const PAGE_CONTENT = {
  manage: {
    title: 'Manage Staff & Teams',
    description: 'Add staff members, organize teams, and manage team assignments.',
  },
  roles: {
    title: 'Roles',
    description: 'Define roles such as Admin, Manager, and Staff for your organization.',
  },
  permissions: {
    title: 'Permissions',
    description: 'Control what each role can view, create, edit, or delete in the CRM.',
  },
};

const StaffTeamManagement = ({ page = 'manage' }) => {
  const content = PAGE_CONTENT[page] || PAGE_CONTENT.manage;

  return (
    <div className="mx-auto mt-8 pb-12 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            {content.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 font-medium">{content.description}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4">
          <Users size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Coming Soon</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          This section is being prepared. You will be able to manage staff, roles, and permissions from here.
        </p>
      </div>
    </div>
  );
};

export default StaffTeamManagement;
