import React from 'react';
import { Navigate } from 'react-router-dom';
import { canAccessStaffTeam } from './utils/permissions';
import StaffManage from './staff/StaffManage';
import StaffRoles from './staff/StaffRoles';
import StaffPermissions from './staff/StaffPermissions';

const AccessDenied = () => (
  <div className="mx-auto mt-16 max-w-lg bg-white border border-red-100 rounded-xl p-8 text-center shadow-sm">
    <h2 className="text-lg font-bold text-red-700 mb-2">Access Denied</h2>
    <p className="text-sm text-gray-600">You do not have permission to view Staff &amp; Team settings.</p>
  </div>
);

const StaffTeamManagement = ({ page = 'manage' }) => {
  if (!canAccessStaffTeam()) return <AccessDenied />;

  if (page === 'roles') return <StaffRoles />;
  if (page === 'permissions') return <StaffPermissions />;
  if (page === 'manage') return <StaffManage />;
  return <Navigate to="/staff-team/manage" replace />;
};

export default StaffTeamManagement;
