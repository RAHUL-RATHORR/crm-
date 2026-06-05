import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Pencil, Printer, Eye, X, Download, Phone, Mail, Globe, Building2, MapPin, Calendar, FileDigit, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { downloadAsPDF } from './utils/pdfExport';
import { printElement } from './utils/printDocument';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { getBillToDetails, getShipToDetails } from './utils/shipAddress';
import { numberToWords } from './utils/numberToWords';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [tempGstType, setTempGstType] = useState('CGST/SGST');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [jobCards, setJobCards] = useState([]);

  const gstPercent = selectedInvoice ? (selectedInvoice.gstPercent !== undefined ? selectedInvoice.gstPercent : 18) : 18;
  const freight = selectedInvoice ? (Number(selectedInvoice.freight) || 0) : 0;
  const taxableValue = selectedInvoice ? (selectedInvoice.totalAmount / (1 + (gstPercent / 100))) : 0;
  const totalGstAmount = selectedInvoice ? (selectedInvoice.totalAmount - taxableValue) : 0;
  const halfGstAmount = totalGstAmount / 2;
  const isIGST = tempGstType === 'IGST';
  const itemsSubTotal = selectedInvoice ? (Number(selectedInvoice.subTotal) || Math.max(0, taxableValue - freight)) : 0;
  const totalAmount = itemsSubTotal;
  const roundOff = selectedInvoice
    ? (selectedInvoice.totalAmount - (itemsSubTotal + freight + (selectedInvoice.gstAmount ?? totalGstAmount)))
    : 0;

  const linkedJobCard = selectedInvoice
    ? jobCards.find((card) => card.jobNumber === selectedInvoice.jobCard)
    : null;

  const displayOrderNo = selectedInvoice?.orderNo || linkedJobCard?.jobNumber || selectedInvoice?.jobCard || '-';
  const displayOrderDate = selectedInvoice?.orderDate || linkedJobCard?.jobDate || selectedInvoice?.date;
  const billTo = getBillToDetails(linkedJobCard, selectedInvoice || {});
  const shipTo = getShipToDetails(linkedJobCard, selectedInvoice || {});

  useEffect(() => {
    fetchInvoice();
    fetch(`${API_BASE_URL}/api/jobcard`)
      .then((res) => res.json())
      .then((data) => setJobCards(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching job cards:', err));
  }, []);

  const fetchInvoice = () => {
    fetch(`${API_BASE_URL}/api/invoice`)
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
        const response = await fetch(`${API_BASE_URL}/api/invoice/${invoiceToDelete}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/invoice/${id}`, {
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
    setTempGstType(inv.gstType || 'CGST/SGST');
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const handlePrint = () => {
    printElement('printable-invoice');
  };

  const handleDownloadPDF = async () => {
    await downloadAsPDF(
      'printable-invoice',
      `Invoice_${selectedInvoice.invoiceNumber}`,
      setIsGenerating
    );
  };

  return (
    <div className="w-full px-4 mt-8 pb-12 text-gray-800 print:p-0 print:m-0">
      <div className="no-print print:hidden">
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
            <table className="w-full text-left whitespace-nowrap min-w-175">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                  <th className="px-4 sm:px-6 py-4">S.No.</th>
                  <th className="px-4 sm:px-6 py-4">Invoice Number</th>
                  <th className="px-4 sm:px-6 py-4">Party Name</th>
                  <th className="px-4 sm:px-6 py-4">Total Amount</th>
                  <th className="px-4 sm:px-6 py-4">Status</th>
                  <th className="px-4 sm:px-6 py-4">Created At</th>
                  <th className="px-4 sm:px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
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
                      <td className="px-4 sm:px-6 py-4 relative">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === inv._id ? null : inv._id)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-bold transition-all shadow-sm ${(inv.paymentStatus === 'Completed') ? 'bg-emerald-500' : 'bg-orange-500'}`}
                          >
                            <div className="flex items-center gap-1.5">
                              {inv.paymentStatus === 'Completed' ? 'Completed' : 'Pending'}
                              {inv.paymentStatus === 'Completed' && <Check size={12} strokeWidth={3} />}
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdownId === inv._id ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdownId === inv._id && (
                            <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                              {inv.paymentStatus === 'Completed' ? (
                                <button
                                  onClick={() => handleStatusUpdate(inv._id, 'Pending')}
                                  className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                                >
                                  Pending
                                  <AlertCircle size={14} className="opacity-50" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusUpdate(inv._id, 'Completed')}
                                  className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
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
        <div className="print-modal-overlay fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4 overflow-y-auto print:static print:overflow-visible print:bg-white print:p-0">
          <div className="print-modal-shell bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <h2 className="text-xl font-bold text-gray-800">Invoice Preview</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200">
                  <span className="text-gray-500 font-medium">GST Mode:</span>
                  <select
                    value={tempGstType}
                    onChange={async (e) => {
                      const newType = e.target.value;
                      setTempGstType(newType);
                      // Update state locally
                      setInvoices(prev => prev.map(inv => inv._id === selectedInvoice._id ? { ...inv, gstType: newType } : inv));
                      // Update on server
                      try {
                        await fetch(`${API_BASE_URL}/api/invoice/${selectedInvoice._id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ gstType: newType })
                        });
                      } catch (err) {
                        console.error("Error updating GST Type on server:", err);
                      }
                    }}
                    className="bg-transparent text-blue-700 outline-none cursor-pointer font-bold"
                  >
                    <option value="CGST/SGST">CGST + SGST</option>
                    <option value="IGST">IGST</option>
                  </select>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {isGenerating ? "..." : <Download size={18} />}
                  PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  <Printer size={18} /> Print
                </button>
                <button
                  onClick={closePreview}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto grow a4-page-container print:overflow-visible print:max-h-none print:h-auto print:p-0 print:grow-0" id="printable-content">
              <div
                id="printable-invoice"
                className="bg-white mx-auto shadow-none a4-page invoice-print-page font-sans"
                style={{ color: '#334155' }}
              >
                {/* Traditional Green/Teal Design - Matching Estimates */}
                <div className="mb-3 print:mb-1">
                  <h1 className="text-3xl print:text-2xl font-bold text-center mb-2 print:mb-1" style={{ color: '#1e3a8a' }}>
                    Tax Invoice
                  </h1>

                  <div className="flex justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Harihar Printers</h2>
                      <p className="text-[10px] text-gray-700 font-medium italic">Your Vision, Our Print.</p>

                      <div className="mt-2">
                        <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Address :</h4>
                        <div className="text-[12px] space-y-1 font-medium text-gray-600">
                          <p className="font-bold text-gray-800">Harihar Printers</p>
                          <p>Office: J-97, Ashok Chowk, Adarsh Nagar, Jaipur</p>
                          <p>Factory: G-139, Hirawala Ind. Area, Kanota, Jaipur</p>
                          <p>Tel: +91 94140-43763</p>
                        </div>
                      </div>
                    </div>
                  
                    <div className="shrink-0 flex flex-col items-end">
                      {/* Metadata Table */}
                      <div className="w-72 min-w-72 border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[11px]" style={{ tableLayout: 'fixed' }}>
                      <colgroup>
                        <col className="w-[38%]" />
                        <col className="w-[62%]" />
                      </colgroup>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase whitespace-nowrap">DATE :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800 whitespace-nowrap">
                            {new Date(selectedInvoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase whitespace-nowrap">Invoice No :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800 whitespace-nowrap">#{selectedInvoice.invoiceNumber}</td>
                        </tr>
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase whitespace-nowrap">Order No. :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-blue-700 whitespace-nowrap">{displayOrderNo}</td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase whitespace-nowrap">Order Date :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800 whitespace-nowrap">
                            {displayOrderDate
                              ? new Date(displayOrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                          </td>
                        </tr>
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase whitespace-nowrap">GSTIN :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-blue-700 uppercase text-[10px] whitespace-nowrap">08AALPC9959M1ZV</td>
                        </tr>

                      </tbody>
                    </table>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start gap-10 mt-3 print:mt-1">
                    <div className="flex-1">
                      <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Bill To :</h4>
                      <div className="text-[12px] space-y-1 font-medium text-gray-600">
                        <p className="font-bold uppercase text-xs" style={{ color: '#1e3a8a' }}>{billTo.partyName}</p>
                        <p className="uppercase">{billTo.address || billTo.partyName}</p>
                        <p>GSTIN: <span className="font-bold">{billTo.gstNo || 'URP'}</span></p>
                        {billTo.contactNo && <p>Tel: {billTo.contactNo}</p>}
                        <p>Jaipur, Rajasthan</p>
                      </div>
                    </div>

                    <div className="flex-1 flex justify-end pr-22">
                      <div className="w-48">
                      <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Ship To :</h4>
                      <div className="text-[12px] space-y-1 font-medium text-gray-600">
                        <p className="font-bold uppercase text-xs" style={{ color: '#1e3a8a' }}>{shipTo.partyName}</p>
                        <p className="uppercase">{shipTo.address || shipTo.partyName}</p>
                        {shipTo.contactNo && <p>Tel: {shipTo.contactNo}</p>}
                        {shipTo.gstNo && shipTo.gstNo !== billTo.gstNo && (
                          <p>GSTIN: <span className="font-bold">{shipTo.gstNo}</span></p>
                        )}
                        <p>Jaipur, Rajasthan</p>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- ITEMS TABLE --- */}
                <div className="mb-4 print:mb-2 border border-gray-200 rounded-sm overflow-hidden flex flex-col">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-white text-[12px] font-black uppercase tracking-widest invoice-table-header" style={{ backgroundColor: '#1e3a8a' }}>
                        <th className="px-3 py-2 print:py-1 border-r border-teal-500/30 w-12 text-center">S.No</th>
                        <th className="px-3 py-2 print:py-1 border-r border-teal-500/30">Description of Goods/Services</th>
                        <th className="px-3 py-2 print:py-1 border-r border-teal-500/30 text-center w-36">HSN/SAC</th>
                        <th className="px-3 py-2 print:py-1 border-r border-teal-500/30 text-center w-20">Qty</th>
                        <th className="px-3 py-2 print:py-1 border-r border-teal-500/30 text-right w-24">Rate</th>
                        <th className="px-3 py-2 print:py-1 text-right w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 grow">
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx} className="text-[13px] group">
                          <td className="px-3 py-2 print:py-1 border-r border-gray-50 text-center font-bold text-gray-600 align-top">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 print:py-1 border-r border-gray-50 align-top">
                            <div className="space-y-1">
                              <p className="font-black text-gray-900 uppercase" style={{ color: '#1e3a8a' }}>{item.description}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2 print:py-1 border-r border-gray-50 text-center font-medium align-top text-gray-700 uppercase">
                            {item.hsn || ''}
                          </td>
                          <td className="px-3 py-2 print:py-1 border-r border-gray-50 text-center font-bold align-top text-gray-700">
                            {item.qty}
                          </td>
                          <td className="px-3 py-2 print:py-1 border-r border-gray-50 font-bold align-top text-right text-gray-700">
                            ₹ {item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 print:py-1 font-black align-top text-right text-gray-900 bg-gray-50/30">
                            ₹ {item.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {/* Blank rows — preview only, hidden when printing */}
                      {[...Array(Math.max(0, 2 - (selectedInvoice.items?.length || 0)))].map((_, i) => (
                        <tr key={`empty-${i}`} className="invoice-fill-row print:hidden border-0">
                          <td className="px-3 py-3 border-r border-gray-50">&nbsp;</td>
                          <td className="px-3 py-3 border-r border-gray-50">&nbsp;</td>
                          <td className="px-3 py-3 border-r border-gray-50">&nbsp;</td>
                          <td className="px-3 py-3 border-r border-gray-50">&nbsp;</td>
                          <td className="px-3 py-3 border-r border-gray-50">&nbsp;</td>
                          <td className="px-3 py-3">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                                 {/* Total Section */}
                  <div className="border-t border-gray-200 mt-auto bg-gray-50/50">
                    <div className="flex">
                      <div className="grow p-3 print:p-2">
                        <p className="text-[10px] font-black text-gray-600 uppercase mb-1 tracking-widest">Amount in Words</p>
                        <p className="text-[12px] font-bold text-gray-700 italic">{numberToWords(selectedInvoice.totalAmount)} Only</p>
                      </div>
                      <div className="flex flex-col w-56 border-l border-gray-200">
                        <div className="flex justify-between px-3 py-1 print:py-0.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">Freight</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {freight.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1 print:py-0.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">Total Amount</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1 print:py-0.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">CGST {isIGST ? '(0%)' : `(${gstPercent / 2}%)`}</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {isIGST ? '0.00' : halfGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1 print:py-0.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">SGST {isIGST ? '(0%)' : `(${gstPercent / 2}%)`}</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {isIGST ? '0.00' : halfGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1 print:py-0.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">IGST {isIGST ? `(${gstPercent}%)` : '(0%)'}</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {isIGST ? totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1 print:py-0.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">Round Off</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-3 py-2 print:py-1.5 invoice-grand-total" style={{ backgroundColor: '#1e3a8a' }}>
                          <span className="text-[12px] font-black text-white uppercase tracking-wider">Grand Total</span>
                          <span className="text-sm font-black text-white">₹ {selectedInvoice.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-3 py-1 print:py-0.5 border-t border-gray-200 bg-gray-50/80">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">Reverse Charge</span>
                          <span className="text-[12px] font-bold text-gray-800">{selectedInvoice.reverseCharge || 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- BANK DETAILS BAR --- */}
                <div className="mb-3 print:mb-1">
                  <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 print:mb-1 pb-0.5 inline-block uppercase tracking-wider">Account Details :</h4>
                  <div className="p-2 print:p-1.5 border border-gray-200 rounded-lg bg-gray-50/30 flex justify-between items-center">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Bank Name</p>
                      <p className="text-[12px] font-bold text-gray-800">Indusind Bank</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Account Number</p>
                      <p className="text-[12px] font-bold text-gray-800">650014092175</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-600 uppercase mb-1">IFSC Code</p>
                      <p className="text-[12px] font-bold text-gray-800 uppercase">INDB0000278</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Branch</p>
                    <p className="text-[12px] font-bold text-gray-800">Raja Park, Jaipur</p>
                  </div>
                  </div>
                </div>

                {/* --- FOOTER SECTION --- */}
                <div className="invoice-footer mt-4 print:mt-2 text-[11px] text-gray-700 space-y-2 print:space-y-1">
                  <div className="grid grid-cols-2 gap-8 print:gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-800 underline uppercase tracking-tighter">Terms & Conditions :</p>
                      <p>1. Goods once sold will not be taken back.</p>
                      <p>2. Interest @18% p.a. will be charged if payment is not made within 15 days.</p>
                      <p>3. Subject to Jaipur Jurisdiction Only.</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold uppercase tracking-widest text-[#1e3a8a]">For Harihar Printers</p>
                       <p className="mt-6 print:mt-3 font-black text-gray-800">Authorised Signatory</p>
                    </div>
                  </div>

                  <div className="pt-2 print:pt-1 text-center">

                    <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-widest">E. & O. E.</p>
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
