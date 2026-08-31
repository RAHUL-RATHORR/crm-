import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { API_BASE_URL } from './utils/apiBase';

const RecentDeleted = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/recent-deleted`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching deleted items:', err);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Are you sure you want to restore this item?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/recent-deleted/restore/${id}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to restore item');
      }
      alert('Item restored successfully');
      fetchItems();
    } catch (err) {
      console.error('Error restoring item:', err);
      alert(err.message || 'Failed to restore item');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const query = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!query) return true;
    return (
      item.itemName?.toLowerCase().includes(query) ||
      item.itemType?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full px-4 mt-8 pb-12 text-gray-800 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-red-600 w-1.5 h-6 rounded-full" />
            Recently Deleted
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 font-medium italic">
            View and restore recently deleted items.
          </p>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Settings &gt; <span className="text-red-600">Recently Deleted</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Trash2 size={20} className="text-red-600" />
                Deleted Items
              </h2>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or type..."
                className="w-full sm:w-64 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="overflow-x-auto min-h-75">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-4 py-3 w-14">S.No.</th>
                    <th className="px-4 py-3">Name / Ref</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Deleted At</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-gray-400 italic">
                        {items.length === 0 ? 'No deleted items found.' : 'No items match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-800">{item.itemName}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 capitalize">{item.itemType || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{new Date(item.createdAt).toLocaleString() || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleRestore(item._id)}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                              title="Restore"
                            >
                              <RotateCcw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentDeleted;
