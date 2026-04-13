import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Truck, Pencil, ChevronDown, Check } from 'lucide-react';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const ChallanList = () => {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    fetchChallans();
  }, []);

  const fetchChallans = () => {
    fetch('https://crm-qpw8.onrender.com/api/challan')
      .then(res => res.json())
      .then(data => setChallans(data))
      .catch(err => console.error("Error fetching Challans:", err));
  };

  const handleDelete = (id) => {
    setChallanToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (challanToDelete) {
      try {
        const response = await fetch(`https://crm-qpw8.onrender.com/api/challan/${challanToDelete}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchChallans();
          setIsDeleteModalOpen(false);
          setChallanToDelete(null);
        }
      } catch (err) {
        console.error("Error deleting challan:", err);
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    // 1. Update UI instantly
    setChallans((prev) =>
      prev.map((ch) =>
        ch._id === id ? { ...ch, paymentStatus: newStatus } : ch
      )
    );
    setOpenDropdownId(null);

    try {
      const response = await fetch(`https://crm-qpw8.onrender.com/api/challan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus })
      });

      if (!response.ok) {
        throw new Error("Failed to update status on server");
      }
      
      // Optionally fetch again to ensure sync, but the instant update is already done.
      // fetchChallans(); 
    } catch (err) {
      console.error("Error updating challan status:", err);
      // Revert UI on error
      fetchChallans();
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div className="w-full px-4 mt-8 pb-12 text-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Manage Challan
          </h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Challan &gt; <span className="text-blue-600">Challan Listings</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Challan Listings</h2>
          <button
            onClick={() => navigate('/challan/add')}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} /> Add New
          </button>
        </div>

        <div className="overflow-x-auto min-h-[400px] pb-40">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                <th className="px-4 sm:px-6 py-4">S.No.</th>
                <th className="px-4 sm:px-6 py-4">Challan Number</th>
                <th className="px-4 sm:px-6 py-4">Job Card</th>
                <th className="px-4 sm:px-6 py-4">Party Name</th>
                <th className="px-4 sm:px-6 py-4">Total Amount</th>
                <th className="px-4 sm:px-6 py-4">Payment Status</th>
                <th className="px-4 sm:px-6 py-4">Created At</th>
                <th className="px-4 sm:px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {challans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 sm:px-6 py-10 text-center text-gray-500">
                    No challans found. Click "Add New" to create one.
                  </td>
                </tr>
              ) : (
                challans.map((ch, index) => (
                  <tr key={ch._id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-blue-600 underline underline-offset-4 decoration-blue-100">{ch.challanNo}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-800">
                      <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-xs text-gray-600 mr-2">
                        {ch.jobNumber}
                      </span>
                      {ch.jobName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-800">{ch.partyName}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-bold text-gray-900">₹ {ch.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 sm:px-6 py-4 relative">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === ch._id ? null : ch._id)}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-bold transition-all shadow-sm ${(ch.paymentStatus === 'Completed') ? 'bg-emerald-500' : 'bg-orange-500'
                            }`}
                        >
                          {ch.paymentStatus === 'Completed' ? (
                            <>
                              Completed <Check size={14} className="stroke-[3px]" />
                            </>
                          ) : (
                            <>
                              Pending <ChevronDown size={14} className="stroke-[3px]" />
                            </>
                          )}
                        </button>
 
                        {openDropdownId === ch._id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 z-30 overflow-hidden py-1 animated fadeIn">
                              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                                Change Status
                              </div>
                              {(!ch.paymentStatus || ch.paymentStatus === 'Pending') ? (
                                <button
                                  onClick={() => handleStatusUpdate(ch._id, 'Completed')}
                                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 flex items-center gap-3"
                                >
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                  Completed
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusUpdate(ch._id, 'Pending')}
                                  className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 flex items-center gap-3"
                                >
                                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
                                  Pending
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium">{new Date(ch.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] uppercase opacity-60 tracking-wider">
                          {new Date(ch.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => navigate('/challan/add', { state: { editData: ch } })}
                          className="bg-teal-50 text-teal-600 p-2 rounded-lg hover:bg-teal-100 transition-all active:scale-90"
                          title="Edit challan"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ch._id)}
                          className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-all active:scale-90"
                          title="Delete challan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
            Showing {challans.length > 0 ? `1 to ${challans.length}` : '0'} of {challans.length} entries
          </p>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Are you sure?"
        message="Are you sure you want to move this challan to trash?"
      />
    </div>
  );
};

export default ChallanList;
