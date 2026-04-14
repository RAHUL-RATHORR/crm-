import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Pencil, Printer, Eye, X, Download, Phone, Mail, Globe, Building2, MapPin, Calendar, FileDigit, AlertCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    fetchInvoice();
  }, []);

  const fetchInvoice = () => {
    fetch('https://crm-qpw8.onrender.com/api/invoice')
      .then(res => res.json())
      .then(data => setInvoices(data))
      .catch(err => console.error("Error fetching Invoices:", err));
  };

  const handleDelete = (id) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        const response = await fetch(`https://crm-qpw8.onrender.com/api/invoice/${invoiceToDelete}`, {
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

  const handleStatusUpdate = async (id, newStatus) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv._id === id ? { ...inv, paymentStatus: newStatus } : inv
      )
    );
    setOpenDropdownId(null);

    try {
      const response = await fetch(`https://crm-qpw8.onrender.com/api/invoice/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus })
      });

      if (!response.ok) {
        throw new Error("Failed to update status on server");
      }
    } catch (err) {
      console.error("Error updating invoice status:", err);
      fetchInvoice();
    }
  };

  const openPreview = (inv) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const element = document.getElementById('printable-invoice');
      if (!element) throw new Error("Printable element not found");

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${selectedInvoice.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full px-4 mt-8 pb-12 text-gray-800">
      <div className="no-print">
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
                  <th className="px-4 sm:px-6 py-4 text-center">Status</th>
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
                      <td className="px-4 sm:px-6 py-4 text-center relative">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === inv._id ? null : inv._id)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${(inv.paymentStatus === 'Completed') ? 'bg-emerald-500' : 'bg-orange-500'}`}
                          >
                            {inv.paymentStatus === 'Completed' ? 'Completed' : 'Pending'}
                          </button>

                          {openDropdownId === inv._id && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                              {inv.paymentStatus === 'Completed' ? (
                                <button
                                  onClick={() => handleStatusUpdate(inv._id, 'Pending')}
                                  className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-orange-600 hover:bg-orange-50 transition-colors"
                                >
                                  Pending
                                  <AlertCircle size={14} className="opacity-50" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusUpdate(inv._id, 'Completed')}
                                  className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  Completed
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
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
                            onClick={() => openPreview(inv)}
                            className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-all active:scale-90"
                            title="Print / View Invoice"
                          >
                            <Printer size={16} />
                          </button>
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
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Are you sure?"
        message="Are you sure you want to move to trash?"
      />

      {/* Invoice Preview & Print Modal */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-2xl animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <Printer size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Invoice Preview</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">#{selectedInvoice.invoiceNumber} • {selectedInvoice.partyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {isGenerating ? "..." : <Download size={14} />}
                  PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  onClick={closePreview}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors ml-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body - Printable Content */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-grow bg-gray-50">
              <div 
                id="printable-invoice"
                className="bg-white mx-auto shadow-none border border-gray-200"
                style={{ 
                  minHeight: '148mm',
                  fontFamily: "'Inter', sans-serif",
                  color: '#000000'
                }}
              >
                {/* Visual Header - Identical to Job Card Screenshot */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2" style={{ borderColor: '#3b82f6' }}>
                  <div>
                    <h1 className="text-4xl font-extrabold uppercase tracking-tighter" style={{ color: '#1e3a8a' }}>TRICKWRIC</h1>
                    <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#3b82f6' }}>Production & Quality Control</p>
                  </div>
                  <div className="bg-blue-50 border-2 px-6 py-2 rounded-lg text-sm font-black uppercase flex flex-col items-center" style={{ borderColor: '#3b82f6', color: '#1e3a8a', backgroundColor: '#eff6ff' }}>
                    <span className="text-[10px] opacity-70">Document</span>
                    Tax Invoice
                  </div>
                </div>

                {/* Top Info Grid - Exact Job Card Layout */}
                <div className="grid grid-cols-1 gap-y-3 mb-4">
                  <div className="border-b pb-1 flex items-center gap-2" style={{ borderColor: '#cbd5e1' }}>
                    <Building2 size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-28 opacity-60">Party Name:</span>
                    <span className="flex-grow font-bold text-sm" style={{ color: '#000000' }}>{selectedInvoice.partyName}</span>
                  </div>
                  <div className="border-b pb-1 flex items-center gap-2" style={{ borderColor: '#cbd5e1' }}>
                    <MapPin size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-28 opacity-60">Address:</span>
                    <span className="flex-grow font-bold text-xs" style={{ color: '#000000' }}>{selectedInvoice.address || '-'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-6">
                  <div className="border-b pb-1 flex items-center gap-2 col-span-1" style={{ borderColor: '#cbd5e1' }}>
                    <Phone size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-16 opacity-60">Contact:</span>
                    <span className="flex-grow font-bold text-xs" style={{ color: '#000000' }}>{selectedInvoice.contactNo || '-'}</span>
                  </div>
                  <div className="border-b pb-1 flex items-center gap-2 col-span-1" style={{ borderColor: '#cbd5e1' }}>
                    <FileDigit size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-16 opacity-60">INV NO:</span>
                    <span className="flex-grow font-bold text-xs" style={{ color: '#000000' }}>{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="border-b pb-1 flex items-center gap-2 col-span-1" style={{ borderColor: '#cbd5e1' }}>
                    <Calendar size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-12 opacity-60">Date:</span>
                    <span className="flex-grow font-bold text-xs" style={{ color: '#000000' }}>{new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Items Table - Clean Minimal Style */}
                <div className="mt-8 border-t-2 pt-4" style={{ borderColor: '#3b82f6' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-50/50 uppercase text-[10px] font-black tracking-wider text-blue-900 border-b" style={{ borderColor: '#bfdbfe' }}>
                        <th className="px-4 py-3">Description of Goods</th>
                        <th className="px-4 py-3 text-center">HSN</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx} className="text-gray-900 border-b" style={{ borderColor: '#f1f5f9' }}>
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold uppercase">{item.jobName}</p>
                            <p className="text-[9px] text-gray-400 italic">Professional Printing Service</p>
                          </td>
                          <td className="px-4 py-4 text-center text-[11px] font-medium text-gray-500">9988</td>
                          <td className="px-4 py-4 text-center text-[11px] font-black">{item.qty || 0}</td>
                          <td className="px-4 py-4 text-right text-[11px] font-bold">₹{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-4 text-right text-[11px] font-black">₹{item.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {/* Placeholder Rows to fill height */}
                      {[...Array(Math.max(0, 8 - (selectedInvoice.items?.length || 0)))].map((_, i) => (
                         <tr key={i} className="h-10 border-b opacity-10" style={{ borderColor: '#e2e8f0' }}><td colSpan="5"></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="mt-8 flex justify-between gap-10">
                  {/* Left Bottom - Bank & Words */}
                  <div className="w-[60%] space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">Amount in Words</p>
                      <p className="text-[11px] font-black text-gray-900 italic capitalize italic leading-relaxed">Indian Rupees Only.</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                       <h4 className="text-[9px] font-black uppercase text-blue-600 mb-2 bottom-border pb-1 border-b" style={{ borderColor: '#dbeafe' }}>Bank Details</h4>
                       <div className="grid grid-cols-2 gap-y-2 text-[9px] font-bold uppercase">
                          <p><span className="text-gray-400 mr-2 uppercase">Bank:</span> HDFC BANK LTD</p>
                          <p><span className="text-gray-400 mr-2 uppercase">A/C:</span> 5020000XXXXXXX</p>
                          <p><span className="text-gray-400 mr-2 uppercase">IFSC:</span> HDFC0001234</p>
                          <p><span className="text-gray-400 mr-2 uppercase">Branch:</span> DHARUHERA</p>
                       </div>
                    </div>
                  </div>

                  {/* Right Bottom - Totals */}
                  <div className="w-[35%] space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                      <span>Sub Total</span>
                      <span className="text-gray-900">₹{(selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-blue-600 italic">
                      <span>CGST ({selectedInvoice.gstRate/2}%)</span>
                      <span>₹{((selectedInvoice.totalAmount - (selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100)))) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-blue-600 italic border-b pb-2" style={{ borderColor: '#cbd5e1' }}>
                      <span>SGST ({selectedInvoice.gstRate/2}%)</span>
                      <span>₹{((selectedInvoice.totalAmount - (selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100)))) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-100 mt-4">
                      <span className="text-[10px] font-black uppercase">Net Payable</span>
                      <span className="text-xl font-black">₹{selectedInvoice.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="pt-12 text-center">
                      <div className="border-t pt-2" style={{ borderColor: '#00000030' }}>
                        <span className="text-[10px] font-black uppercase block">Authorized Signatory</span>
                        <span className="text-[8px] text-gray-400 italic">For Sneha Graphics Solutions</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Icons - Identical to Job Card */}
                <div className="mt-12 pt-4 border-t flex justify-between items-center" style={{ borderColor: '#e2e8f0' }}>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <Phone size={10} style={{ color: '#3b82f6' }} />
                      <span className="text-[9px] font-bold" style={{ color: '#64748b' }}>+91-98765-43210</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail size={10} style={{ color: '#3b82f6' }} />
                      <span className="text-[9px] font-bold" style={{ color: '#64748b' }}>billing@snehagraphics.in</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe size={10} style={{ color: '#3b82f6' }} />
                      <span className="text-[9px] font-bold" style={{ color: '#64748b' }}>www.snehagraphics.in</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] italic opacity-50 block" style={{ color: '#000000' }}>Automatically generated by TRICKWRIC CRM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
