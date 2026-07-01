import React, { useEffect, useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiBase';
import { ACTIONS, MODULES, emptyPermissions, canManageStaff } from '../utils/permissions';

const StaffPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [permissions, setPermissions] = useState(emptyPermissions());
  const [isSaving, setIsSaving] = useState(false);
  const canEdit = canManageStaff();

  const selectedRole = roles.find((r) => r._id === selectedRoleId);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/roles`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setRoles(list);
      if (!selectedRoleId && list.length) setSelectedRoleId(list[0]._id);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  useEffect(() => {
    if (!selectedRole) return;
    setPermissions({ ...emptyPermissions(), ...(selectedRole.permissions || {}) });
  }, [selectedRoleId, roles, selectedRole]);

  const togglePermission = (moduleKey, actionKey) => {
    if (!canEdit) return;
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [actionKey]: !prev[moduleKey]?.[actionKey],
      },
    }));
  };

  const toggleRow = (moduleKey, value) => {
    if (!canEdit) return;
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: ACTIONS.reduce((acc, { key }) => ({ ...acc, [key]: value }), {}),
    }));
  };

  const handleSave = async () => {
    if (!canEdit || !selectedRoleId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save permissions');
      }
      await fetchRoles();
      alert('Permissions saved successfully');
    } catch (err) {
      alert(err.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto mt-8 pb-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Permissions
          </h1>
          <p className="text-sm text-gray-500 mt-1">Control module access for each role.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold min-w-[200px]"
          >
            {roles.map((role) => (
              <option key={role._id} value={role._id}>{role.name}</option>
            ))}
          </select>
          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !selectedRoleId}
              className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Permissions'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600">
          <ShieldCheck size={18} className="text-blue-600" />
          Role: <strong className="text-gray-900">{selectedRole?.name || '-'}</strong>
          {selectedRole?.isSystem && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold ml-2">System Role</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-4 py-3">Module</th>
                {ACTIONS.map(({ key, label }) => (
                  <th key={key} className="px-3 py-3 text-center">{label}</th>
                ))}
                {canEdit && <th className="px-3 py-3 text-center">All</th>}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(({ key, label }) => (
                <tr key={key} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{label}</td>
                  {ACTIONS.map(({ key: actionKey }) => (
                    <td key={actionKey} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!permissions[key]?.[actionKey]}
                        onChange={() => togglePermission(key, actionKey)}
                        disabled={!canEdit}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                    </td>
                  ))}
                  {canEdit && (
                    <td className="px-3 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button type="button" onClick={() => toggleRow(key, true)} className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold">On</button>
                        <button type="button" onClick={() => toggleRow(key, false)} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 font-bold">Off</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffPermissions;
