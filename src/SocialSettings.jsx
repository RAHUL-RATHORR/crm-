import React from 'react';
import { Share2, Globe, Link, Save } from 'lucide-react';

const SocialSettings = () => {
  return (
    <div className="mx-auto mt-8 pb-12 text-gray-800 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Social Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 font-medium">Link your social media profiles</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Social Connections</h2>
        </div>

        <div className="p-8 max-w-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} className="text-blue-600" /> Facebook URL
              </label>
              <input type="url" placeholder="https://facebook.com/your-brand" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Link size={14} className="text-sky-500" /> Twitter URL
              </label>
              <input type="url" placeholder="https://twitter.com/your-brand" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Link size={14} className="text-pink-500" /> Instagram URL
              </label>
              <input type="url" placeholder="https://instagram.com/your-brand" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Link size={14} className="text-indigo-600" /> LinkedIn URL
              </label>
              <input type="url" placeholder="https://linkedin.com/your-brand" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-100 active:scale-95">
              <Save size={18} /> Update Links
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialSettings;
