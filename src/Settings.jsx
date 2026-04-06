import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    const storedAdmin = JSON.parse(localStorage.getItem('adminAuth'));

    // Validation
    if (formData.oldPassword !== storedAdmin.password) {
      setStatus({ type: 'error', message: 'Old password does not match our records.' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    // Update password
    const updatedAdmin = { ...storedAdmin, password: formData.newPassword };
    localStorage.setItem('adminAuth', JSON.stringify(updatedAdmin));

    setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setStatus({ type: 'success', message: 'Password updated successfully! Next time you log in, use your new password.' });
  };

  return (
    <div className="mx-auto mt-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Change Password
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 font-medium italic">Update your account security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Security Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Account Security</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Keeping your password updated is essential for protecting your business data. We recommend using a strong password that you don't use elsewhere.
            </p>
          </div>

          <div className="bg-indigo-900 p-6 rounded-2xl shadow-xl text-white">
            <h3 className="font-bold mb-2">Need help?</h3>
            <p className="text-xs text-indigo-100/80 leading-relaxed mb-4">
              If you've forgotten your current password, please contact the developer for a manual reset.
            </p>
            <button className="text-xs font-bold uppercase tracking-wider text-white border-b border-indigo-400 pb-0.5 hover:text-indigo-300 transition-colors">
              Contact Developer
            </button>
          </div>
        </div>

        {/* Right Column: Change Password Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <Lock className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Change Password</h2>
            </div>

            <div className="p-8">
              {status.message && (
                <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                  {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  <p className="text-sm font-semibold">{status.message}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Current Password</label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={formData.oldPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all transform active:scale-95"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
