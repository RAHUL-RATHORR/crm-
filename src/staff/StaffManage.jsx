import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Users, UserPlus, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiBase';
import { canManageStaff } from '../utils/permissions';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  mobile: '',
  team: '',
  roleId: '',
  isActive: true,
};

const StaffManage = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const canEdit = canManageStaff();

  const teams = useMemo(() => {
    const set = new Set(staff.map((s) => s.team).filter(Boolean));
    return Array.from(set).sort();
  }, [staff]);

  const filteredStaff = staff.filter((member) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [member.name, member.email, member.team, member.roleName]
      .some((v) => String(v || '').toLowerCase().includes(q));
  });

  const fetchData = async () => {
    try {
      const [staffRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/staff`),
        fetch(`${API_BASE_URL}/api/roles`),
      ]);
      const staffData = await staffRes.json();
      const rolesData = await rolesRes.json();
      setStaff(Array.isArray(staffData) ? staffData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!form.roleId && roles.length) {
      const staffRole = roles.find((r) => r.name === 'Staff') || roles[0];
      setForm((prev) => ({ ...prev, roleId: staffRole._id }));
    }
  }, [roles, form.roleId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    const staffRole = roles.find((r) => r.name === 'Staff') || roles[0];
    setForm({ ...EMPTY_FORM, roleId: staffRole?._id || '' });
    setEditingId(null);
    setShowPassword(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!form.name.trim() || !form.email.trim()) {
      alert('Name and email are required');
      return;
    }
    if (!editingId && !form.password.trim()) {
      alert('Password is required for new staff');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/staff/${editingId}`
        : `${API_BASE_URL}/api/staff`;
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        team: form.team.trim(),
        roleId: form.roleId,
        isActive: form.isActive,
      };
      if (form.password.trim()) body.password = form.password.trim();

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save staff member');
      }

      await fetchData();
      resetForm();
    } catch (err) {
      alert(err.message || 'Failed to save staff member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (member) => {
    if (!canEdit) return;
    setEditingId(member._id);
    setForm({
      name: member.name || '',
      email: member.email || '',
      password: '',
      mobile: member.mobile || '',
      team: member.team || '',
      roleId: member.roleId || '',
      isActive: member.isActive !== false,
    });
    setShowPassword(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (!canEdit) return;
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/staff/${deletingId}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
        if (editingId === deletingId) resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to deactivate staff');
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto mt-8 pb-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
          Manage Staff &amp; Teams
        </h1>
        <p className="text-sm text-gray-500 mt-1">Add staff, assign teams and roles for CRM login access.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            <div className="bg-blue-900 text-white px-5 py-2.5 font-semibold text-sm flex items-center gap-2">
              <UserPlus size={16} />
              {editingId ? 'Edit Staff' : 'Add Staff'}
            </div>
            <form onSubmit={handleSave} autoComplete="off" className="p-5 space-y-4">
              {!canEdit && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  You have view-only access. Ask Admin to add or edit staff.
                </p>
              )}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required disabled={!canEdit} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={!canEdit}
                  autoComplete="off"
                  readOnly={!editingId}
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  placeholder="Enter staff email"
                  className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">{editingId ? 'New Password' : 'Password *'}</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={!canEdit}
                    autoComplete="new-password"
                    readOnly={!editingId}
                    onFocus={(e) => e.target.removeAttribute('readonly')}
                    placeholder={editingId ? 'Leave blank to keep current' : 'Enter password'}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile</label>
                <input name="mobile" value={form.mobile} onChange={handleChange} disabled={!canEdit} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Team</label>
                <input name="team" list="team-suggestions" value={form.team} onChange={handleChange} disabled={!canEdit} placeholder="Printing, Accounts..." className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                <datalist id="team-suggestions">
                  {teams.map((team) => <option key={team} value={team} />)}
                </datalist>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Role *</label>
                <select name="roleId" value={form.roleId} onChange={handleChange} required disabled={!canEdit} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} disabled={!canEdit} className="rounded border-gray-300 text-blue-600" />
                Active
              </label>
              {canEdit && (
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={isSaving} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg font-bold text-sm disabled:opacity-60">
                    {isSaving ? 'Saving...' : (editingId ? 'Update Staff' : 'Save Staff')}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-gray-800 font-bold">
                <Users size={18} className="text-blue-600" />
                Staff List ({filteredStaff.length})
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, team..."
                className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-4 py-10 text-center text-gray-400 text-sm">No staff members found.</td>
                    </tr>
                  ) : filteredStaff.map((member) => (
                    <tr key={member._id} className="border-t border-gray-100 hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{member.team || '-'}</td>
                      <td className="px-4 py-3 text-sm"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{member.roleName}</span></td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => handleEdit(member)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                              <Pencil size={16} />
                            </button>
                            {member.email !== 'admin@gmail.com' && (
                              <button type="button" onClick={() => handleDelete(member._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Deactivate">
                                <Trash2 size={16} />
                              </button>
                            )}
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
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        message="Deactivate this staff member? They will not be able to login."
      />
    </div>
  );
};

export default StaffManage;
