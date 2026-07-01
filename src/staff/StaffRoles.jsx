import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Shield } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiBase';
import { canManageStaff } from '../utils/permissions';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const EMPTY_FORM = { name: '', description: '' };

const StaffRoles = () => {
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const canEdit = canManageStaff();

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/roles`);
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit || !form.name.trim()) return;

    setIsSaving(true);
    try {
      const url = editingId ? `${API_BASE_URL}/api/roles/${editingId}` : `${API_BASE_URL}/api/roles`;
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save role');
      }
      await fetchRoles();
      resetForm();
    } catch (err) {
      alert(err.message || 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (role) => {
    if (!canEdit) return;
    setEditingId(role._id);
    setForm({ name: role.name, description: role.description || '' });
  };

  const handleDelete = (id) => {
    if (!canEdit) return;
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const visibleRoles = roles.filter((role) => role.name !== 'Admin');

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/roles/${deletingId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete role');
      } else {
        await fetchRoles();
        if (editingId === deletingId) resetForm();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto mt-8 pb-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
          Roles
        </h1>
        <p className="text-sm text-gray-500 mt-1">Create and manage roles like Manager, Staff or custom roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Shield size={18} className="text-blue-600" />{editingId ? 'Edit Role' : 'Add Role'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Role Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required disabled={!canEdit} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} disabled={!canEdit} className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            {canEdit && (
              <button type="submit" disabled={isSaving} className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg font-bold text-sm">
                {isSaving ? 'Saving...' : (editingId ? 'Update Role' : 'Save Role')}
              </button>
            )}
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                {canEdit && <th className="px-4 py-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRoles.map((role) => (
                <tr key={role._id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{role.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{role.description || '-'}</td>
                  <td className="px-4 py-3 text-sm">{role.isSystem ? <span className="text-xs font-bold text-indigo-600">System</span> : <span className="text-xs text-gray-500">Custom</span>}</td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => handleEdit(role)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={16} /></button>
                        <button type="button" onClick={() => handleDelete(role._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        message="Delete this role permanently?"
      />
    </div>
  );
};

export default StaffRoles;
