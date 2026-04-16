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
    window.scrollTo(0, 0);
    const container = document.querySelector('.a4-page-container');
    if (container) container.scrollTop = 0;
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
                  <th className="px-4 sm:px-6 py-4">Created At</th>
                  <th className="px-4 sm:px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                      No invoices found. Click &quot;Add New&quot; to create one.
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

            <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-gray-100/50 a4-page-container">
              <div
                id="printable-invoice"
                className="bg-white mx-auto a4-page"
              >
                {/* Header Branding */}
                <div className="flex justify-between items-start mb-6 border-b-2 pb-4 px-2" style={{ borderColor: '#1e293b' }}>
                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-none">
                            Harihar <span className="text-blue-600">Printers</span>
                        </h1>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-700">
                           <span className="text-blue-600">OFFICE:</span> J-97, Ashok Chowk, Adarsh Nagar, Jaipur-302 004
                        </p>
                        <p className="text-[10px] font-bold text-gray-700">
                           <span className="text-blue-600">FACTORY:</span> G-139, Hirawala Industrial Area, Kanota, Agra Road, Jaipur
                        </p>
                        <div className="flex gap-4 mt-1">
                            <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                                <Phone size={10} className="text-blue-500" /> 0141-2600850, 9414043763
                            </p>
                        </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="bg-blue-600 text-white px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-widest shadow-sm">
                        GST Tax Invoice
                    </div>
                    <div className="text-[9px] font-black text-gray-500 uppercase flex flex-col gap-0.5 mt-2">
                        <span>GSTIN: <span className="text-gray-900 border-b border-gray-200">08AALPC9959M1ZV</span></span>
                        <span>PAN: <span className="text-gray-900 border-b border-gray-200">AALPC9959M</span></span>
                    </div>
                  </div>
                </div>

                {/* Meta Information Bar */}
                <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Invoice Number</span>
                        <span className="text-sm font-black text-blue-700">{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-4">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Date</span>
                        <span className="text-sm font-black text-gray-900">{new Date(selectedInvoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-4">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Reverse Charge</span>
                        <span className="text-sm font-black text-gray-900 uppercase">NO</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-4">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">State Code</span>
                        <span className="text-sm font-black text-gray-900">08 (Raj)</span>
                    </div>
                </div>

                {/* Party Details Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Bill to Party */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-blue-600 border-b pb-1 flex items-center gap-2">
                            <Building2 size={12} /> Bill To Party
                        </h4>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-gray-900 leading-tight uppercase">{selectedInvoice.partyName}</p>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase pr-4">
                                {selectedInvoice.address || 'Address Not Provided'}
                            </p>
                            {selectedInvoice.contactNo && (
                                <p className="text-[10px] font-bold text-gray-700 flex items-center gap-2">
                                    <span className="text-gray-400">CONTACT:</span> {selectedInvoice.contactNo}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Place of Supply */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 border-b pb-1 flex items-center gap-2 italic">
                            <MapPin size={12} /> Place of Supply
                        </h4>
                        <div className="space-y-1 opacity-80">
                            <p className="text-sm font-black text-gray-900 leading-tight uppercase">{selectedInvoice.partyName}</p>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase">
                                {selectedInvoice.address || 'Same as Billing'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Item Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden mt-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900 text-white uppercase text-[9px] font-black tracking-widest">
                                <th className="px-4 py-3 w-12 text-center border-r border-gray-700">S.No.</th>
                                <th className="px-4 py-3 border-r border-gray-700">Description of Goods</th>
                                <th className="px-4 py-3 text-center border-r border-gray-700">HSN/SAC</th>
                                <th className="px-4 py-3 text-center border-r border-gray-700">Qty</th>
                                <th className="px-4 py-3 text-right border-r border-gray-700">Rate</th>
                                <th className="px-4 py-3 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {selectedInvoice.items?.map((item, idx) => (
                                <tr key={idx} className="text-gray-900">
                                    <td className="px-4 py-4 text-center text-[11px] font-black text-gray-400 border-r border-gray-100">{idx + 1}</td>
                                    <td className="px-4 py-4 border-r border-gray-100">
                                        <p className="text-xs font-black uppercase text-gray-900">{item.jobName}</p>
                                        <p className="text-[9px] font-bold text-gray-400 tracking-wide mt-0.5">Printing & Services</p>
                                    </td>
                                    <td className="px-4 py-4 text-center text-[11px] font-bold text-gray-600 tracking-wider font-mono border-r border-gray-100">4901</td>
                                    <td className="px-4 py-4 text-center text-[11px] font-black border-r border-gray-100">{item.qty || 0}</td>
                                    <td className="px-4 py-4 text-right text-[11px] font-bold border-r border-gray-100">₹{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-4 text-right text-[11px] font-black">₹{item.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                             {/* Empty spacing rows with vertical grid lines */}
                             {[...Array(Math.max(0, 10 - (selectedInvoice.items?.length || 0)))].map((_, i) => (
                                 <tr key={`empty-${i}`} className="h-10 opacity-5">
                                     <td className="border-r border-gray-100 border-b border-gray-100"></td>
                                     <td className="border-r border-gray-100 border-b border-gray-100"></td>
                                     <td className="border-r border-gray-100 border-b border-gray-100"></td>
                                     <td className="border-r border-gray-100 border-b border-gray-100"></td>
                                     <td className="border-r border-gray-100 border-b border-gray-100"></td>
                                     <td className="border-b border-gray-100"></td>
                                 </tr>
                             ))}
                        </tbody>
                    </table>
                </div>

                {/* Finals Section */}
                <div className="mt-8 flex justify-between gap-12">
                   {/* Left side: Words & Bank */}
                   <div className="flex-grow space-y-6">
                        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-md">
                            <h4 className="text-sm font-black uppercase text-blue-700 mb-5 flex items-center gap-2 border-b-2 pb-2 border-blue-50">
                                <Building2 size={18} /> Bank Deposit Information
                            </h4>
                            <div className="grid grid-cols-2 gap-y-4 text-sm font-black">
                                <p><span className="text-gray-400 uppercase tracking-tighter mr-3 text-[11px]">Bank:</span> Indusind Bank</p>
                                <p><span className="text-gray-400 uppercase tracking-tighter mr-3 text-[11px]">IFSC:</span> INDB0000278</p>
                                <p><span className="text-gray-400 uppercase tracking-tighter mr-3 text-[11px]">Account:</span> 650014092175</p>
                                <p><span className="text-gray-400 uppercase tracking-tighter mr-3 text-[11px]">Branch:</span> Raja Park, Jaipur</p>
                            </div>
                        </div>

                        <div className="text-[9px] text-gray-400 font-bold leading-relaxed space-y-1">
                            <p>E. & O.E.</p>
                            <p>1. Goods once sold will not be taken back.</p>
                            <p>2. Our responsibility ceases after the goods leave our premises.</p>
                            <p>3. 18% Interest will be charged if payment is not made within 15 days.</p>
                            <p>4. All Subjects to Jaipur Jurisdiction.</p>
                            <p>5. Payment by A/c Payee Cheque only.</p>
                        </div>
                   </div>

                   {/* Right side: Calculations */}
                   <div className="w-[300px] space-y-3">
                        <div className="space-y-2 pt-2">
                             <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                                <span>Total Taxable Value</span>
                                <span className="text-gray-900">₹{(selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
                                <span>(+) Freight / Packaging</span>
                                <span className="text-gray-900">₹0.00</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-blue-600">
                                <span>Add: CGST ({selectedInvoice.gstRate / 2}%)</span>
                                <span>₹{((selectedInvoice.totalAmount - (selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100)))) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-blue-600 border-b border-gray-100 pb-2">
                                <span>Add: SGST ({selectedInvoice.gstRate / 2}%)</span>
                                <span>₹{((selectedInvoice.totalAmount - (selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100)))) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="bg-blue-600 text-white rounded-xl px-5 py-4 shadow-xl shadow-blue-100">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] font-black uppercase opacity-70 tracking-widest">Total Amount (Tax Incl.)</span>
                                <span className="text-2xl font-black">₹{selectedInvoice.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="pt-8 text-center">
                            <div className="border-t border-gray-200 mt-4 pt-3 flex flex-col gap-1 items-center">
                                <span className="text-[10px] font-black uppercase text-gray-900">For HARIHAR PRINTERS</span>
                                <div className="h-10"></div> {/* Signature Space */}
                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-4 border-t border-gray-100 pt-1">Authorised Signatory</span>
                            </div>
                        </div>
                   </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center opacity-40 px-2 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Professionally Generated via Harihar Printers</p>
                    <div className="flex gap-4">
                        <Phone size={10} />
                        <Mail size={10} />
                        <Globe size={10} />
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
