import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = () => {
    fetch('http://localhost:5011/api/invoice')
      .then(res => res.json())
      .then(data => setInvoices(data))
      .catch(err => console.error("Error fetching Invoices:", err));
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const handleDelete = (id) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        const response = await fetch(`http://localhost:5011/api/invoice/${invoiceToDelete}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchInvoice();
          setIsDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }
      } catch (err) {
        console.error("Error deleting invoice:", err);
      }
    }
  };

  return (
    <div className="mx-auto mt-8 pb-12 text-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Manage Invoice
          </h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Invoice &gt; <span className="text-blue-600">Invoice Listings</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Invoice Listings</h2>
          <button
            onClick={() => navigate('/invoice/add')}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} /> Add New
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                <th className="px-4 sm:px-6 py-4">S.No.</th>
                <th className="px-4 sm:px-6 py-4">Invoice Number</th>
                <th className="px-4 sm:px-6 py-4">Party Name</th>
                <th className="px-4 sm:px-6 py-4">Total Amount</th>
                <th className="px-4 sm:px-6 py-4">Created At</th>
                <th className="px-4 sm:px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    No invoices found. Click "Add New" to create one.
                  </td>
                </tr>
              ) : (
                invoices.map((inv, index) => (
                  <tr key={inv._id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-blue-600 underline underline-offset-4 decoration-blue-100">{inv.invoiceNumber}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-800">{inv.partyName}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-bold text-gray-900">₹ {inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-medium">{new Date(inv.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] uppercase opacity-60 tracking-wider">
                          {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => navigate('/invoice/add', { state: { editData: inv } })}
                          className="bg-teal-50 text-teal-600 p-2 rounded-lg hover:bg-teal-100 transition-all active:scale-90"
                          title="Edit invoice"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-all active:scale-90"
                          title="Delete invoice"
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
            Showing {invoices.length > 0 ? `1 to ${invoices.length}` : '0'} of {invoices.length} entries
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Are you sure?"
        message="Are you sure you want to move to trash?"
      />
    </div>
  );
};

export default InvoiceList;
