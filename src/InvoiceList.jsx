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

const SELLER = {
  name: 'HARIHAR PRINTERS',
  factory: 'G-139, Hirawala Ind. Area, Kanota, Jaipur',
  office: 'J-97, Ashok Chowk, Adarsh Nagar, Jaipur',
  gstin: '08AALPC9959M1ZV',
  state: 'Rajasthan',
  stateCode: '08',
  tel: '94140-43763',
  bank: {
    holder: 'Harihar Printers',
    name: 'IndusInd Bank',
    account: '650014092175',
    branch: 'Raja Park, Jaipur',
    ifsc: 'INDB0000278',
  },
};

const fmtInvoiceDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const day = d.getDate();
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  const yr = String(d.getFullYear()).slice(-2);
  return `${day}-${mon}-${yr}`;
};

const fmtAmt = (value) =>
  Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getStateFromGst = (gstNo) => {
  const gst = (gstNo || '').trim();
  if (gst.length >= 2 && gst !== 'URP') {
    return { state: 'Rajasthan', code: gst.slice(0, 2) };
  }
  return { state: 'Rajasthan', code: '08' };
};

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

  const freight = selectedInvoice ? (Number(selectedInvoice.freight) || 0) : 0;
  const isIGST = tempGstType === 'IGST';
  const itemsSubTotal = selectedInvoice
    ? (Number(selectedInvoice.subTotal) || (selectedInvoice.items || []).reduce((sum, item) => sum + (Number(item.total) || 0), 0))
    : 0;
  const totalGstAmount = selectedInvoice
    ? (Number(selectedInvoice.gstAmount) || (selectedInvoice.items || []).reduce((sum, item) => {
        const line = Number(item.total) || 0;
        const pct = Number(item.gstPercent ?? selectedInvoice.gstPercent ?? 18);
        return sum + (line * pct) / 100;
      }, 0) + ((freight * Number((selectedInvoice.items?.[0]?.gstPercent ?? selectedInvoice.gstPercent ?? 18))) / 100))
    : 0;
  const halfGstAmount = totalGstAmount / 2;
  const totalAmount = itemsSubTotal;
  const roundOff = selectedInvoice
    ? (selectedInvoice.totalAmount - (itemsSubTotal + freight + totalGstAmount))
    : 0;

  const linkedJobCard = selectedInvoice
    ? jobCards.find((card) => card.jobNumber === selectedInvoice.jobCard)
    : null;

  const displayOrderNo = selectedInvoice?.orderNo || linkedJobCard?.jobNumber || selectedInvoice?.jobCard || '-';
  const displayOrderDate = selectedInvoice?.orderDate || linkedJobCard?.jobDate || selectedInvoice?.date;
  const billTo = getBillToDetails(linkedJobCard, selectedInvoice || {});
  const shipTo = getShipToDetails(linkedJobCard, selectedInvoice || {});
  const billToState = getStateFromGst(billTo.gstNo);
  const shipToState = getStateFromGst(shipTo.gstNo);

  const hsnSummaryRows = selectedInvoice
    ? Object.values(
        (selectedInvoice.items || []).reduce((acc, item) => {
          const hsn = item.hsn || '';
          const pct = Number(item.gstPercent ?? selectedInvoice.gstPercent ?? 18);
          const key = `${hsn}__${pct}`;
          if (!acc[key]) acc[key] = { hsn, pct, taxable: 0 };
          acc[key].taxable += Number(item.total) || 0;
          return acc;
        }, {})
      ).map((row) => ({
        hsn: row.hsn,
        taxable: row.taxable,
        cgstRate: isIGST ? 0 : row.pct / 2,
        sgstRate: isIGST ? 0 : row.pct / 2,
        cgstAmt: isIGST ? 0 : (row.taxable * (row.pct / 2)) / 100,
        sgstAmt: isIGST ? 0 : (row.taxable * (row.pct / 2)) / 100,
        igstRate: isIGST ? row.pct : 0,
        igstAmt: isIGST ? (row.taxable * row.pct) / 100 : 0,
      }))
    : [];

  const summaryTaxableTotal = hsnSummaryRows.reduce((sum, row) => sum + row.taxable, 0);
  const summaryCgstTotal = hsnSummaryRows.reduce((sum, row) => sum + row.cgstAmt, 0);
  const summarySgstTotal = hsnSummaryRows.reduce((sum, row) => sum + row.sgstAmt, 0);
  const summaryIgstTotal = hsnSummaryRows.reduce((sum, row) => sum + row.igstAmt, 0);
  const summaryTaxTotal = summaryCgstTotal + summarySgstTotal + summaryIgstTotal;
  const emptyItemRows = Math.max(0, 3 - (selectedInvoice?.items?.length || 0));

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
                className="bg-white mx-auto shadow-none a4-page invoice-print-page gst-invoice-print-page"
              >
                <table className="gst-invoice w-full border-collapse text-black" style={{ fontSize: '9px', fontFamily: 'Arial, sans-serif' }}>
                  <tbody>
                    {/* Title */}
                    <tr>
                      <td colSpan={8} className="gst-cell text-center font-bold py-1" style={{ fontSize: '13px' }}>
                        Invoice-cum-Bill of Supply
                      </td>
                    </tr>

                    {/* Seller + Invoice meta */}
                    <tr>
                      <td colSpan={4} rowSpan={3} className="gst-cell align-top p-1" valign="top">
                        <p className="font-bold text-[11px]">{SELLER.name}</p>
                        <p>Factory: {SELLER.factory}</p>
                        <p>Office: {SELLER.office}</p>
                        <p>GSTIN/UIN: {SELLER.gstin}</p>
                        <p>State Name: {SELLER.state}, Code: {SELLER.stateCode}</p>
                        <p>Tel: {SELLER.tel}</p>
                      </td>
                      <td className="gst-cell font-semibold">Invoice No.</td>
                      <td className="gst-cell">{selectedInvoice.invoiceNumber}</td>
                      <td className="gst-cell font-semibold">Dated</td>
                      <td className="gst-cell">{fmtInvoiceDate(selectedInvoice.date)}</td>
                    </tr>
                    <tr>
                      <td className="gst-cell font-semibold">Delivery Note</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell font-semibold">Mode/Terms of Payment</td>
                      <td className="gst-cell">&nbsp;</td>
                    </tr>
                    <tr>
                      <td className="gst-cell font-semibold">Reference No. &amp; Date.</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell font-semibold">Other References</td>
                      <td className="gst-cell">&nbsp;</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="gst-cell align-top p-1" valign="top">
                        <p className="font-semibold">Consignee (Ship to)</p>
                        <p className="font-bold">{shipTo.partyName}</p>
                        <p>{shipTo.address}</p>
                        <p>State Name: {shipToState.state}, Code: {shipToState.code}</p>
                      </td>
                      <td className="gst-cell font-semibold">Buyer&apos;s Order No.</td>
                      <td className="gst-cell">{displayOrderNo}</td>
                      <td className="gst-cell font-semibold">Dated</td>
                      <td className="gst-cell">{displayOrderDate ? fmtInvoiceDate(displayOrderDate) : ''}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="gst-cell align-top p-1" valign="top">
                        <p className="font-semibold">Buyer (Bill to)</p>
                        <p className="font-bold">{billTo.partyName}</p>
                        <p>{billTo.address}</p>
                        <p>GSTIN: {billTo.gstNo || 'URP'}</p>
                        <p>State Name: {billToState.state}, Code: {billToState.code}</p>
                      </td>
                      <td className="gst-cell font-semibold">Dispatch Doc No.</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell font-semibold">Delivery Note Date</td>
                      <td className="gst-cell">&nbsp;</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="gst-cell">&nbsp;</td>
                      <td className="gst-cell font-semibold">Dispatched through</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell font-semibold">Destination</td>
                      <td className="gst-cell">Jaipur</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="gst-cell">&nbsp;</td>
                      <td colSpan={2} className="gst-cell font-semibold">Terms of Delivery</td>
                      <td colSpan={2} className="gst-cell">&nbsp;</td>
                    </tr>

                    {/* Items header */}
                    <tr className="text-center font-semibold">
                      <td className="gst-cell w-[4%]">SI<br />No.</td>
                      <td className="gst-cell">Description of Goods</td>
                      <td className="gst-cell w-[9%]">HSN/SAC</td>
                      <td className="gst-cell w-[11%]">Quantity</td>
                      <td className="gst-cell w-[10%]">Rate<br />(incl. of Tax)</td>
                      <td className="gst-cell w-[9%]">Rate</td>
                      <td className="gst-cell w-[5%]">per</td>
                      <td className="gst-cell w-[12%]">Amount</td>
                    </tr>

                    {/* Item rows */}
                    {selectedInvoice.items?.map((item, idx) => {
                      const rate = Number(item.rate) || 0;
                      const itemGstPercent = Number(item.gstPercent ?? selectedInvoice.gstPercent ?? 18);
                      const rateIncl = rate * (1 + itemGstPercent / 100);
                      return (
                        <tr key={idx}>
                          <td className="gst-cell text-center align-top">{idx + 1}</td>
                          <td className="gst-cell align-top uppercase">{item.description}</td>
                          <td className="gst-cell text-center align-top">{item.hsn || ''}</td>
                          <td className="gst-cell text-right align-top">{Number(item.qty || 0).toFixed(2)} Nos.</td>
                          <td className="gst-cell text-right align-top">{fmtAmt(rateIncl)}</td>
                          <td className="gst-cell text-right align-top">{fmtAmt(rate)}</td>
                          <td className="gst-cell text-center align-top">Nos.</td>
                          <td className="gst-cell text-right align-top">{fmtAmt(item.total)}</td>
                        </tr>
                      );
                    })}

                    {freight > 0 && (
                      <tr>
                        <td className="gst-cell text-center align-top">{(selectedInvoice.items?.length || 0) + 1}</td>
                        <td className="gst-cell align-top">Freight</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell text-right align-top">{fmtAmt(freight)}</td>
                      </tr>
                    )}

                    {[...Array(emptyItemRows)].map((_, i) => (
                      <tr key={`empty-${i}`} className="invoice-fill-row print:hidden">
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                      </tr>
                    ))}

                    {/* Tax rows */}
                    {!isIGST && (
                      <>
                        <tr>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell text-right font-semibold">CGST</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell text-right">{fmtAmt(halfGstAmount)}</td>
                        </tr>
                        <tr>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell text-right font-semibold">SGST</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell">&nbsp;</td>
                          <td className="gst-cell text-right">{fmtAmt(halfGstAmount)}</td>
                        </tr>
                      </>
                    )}
                    {isIGST && (
                      <tr>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell text-right font-semibold">IGST</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell">&nbsp;</td>
                        <td className="gst-cell text-right">{fmtAmt(totalGstAmount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell text-right font-semibold">Round Off</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell text-right">{fmtAmt(roundOff)}</td>
                    </tr>
                    <tr>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell text-right font-bold">Total</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell text-right font-bold">₹ {fmtAmt(selectedInvoice.totalAmount)}</td>
                    </tr>

                    {/* Amount in words */}
                    <tr>
                      <td colSpan={8} className="gst-cell">
                        <span className="font-semibold">Amount Chargeable (in words):</span>{' '}
                        INR {numberToWords(selectedInvoice.totalAmount)} Only
                      </td>
                    </tr>

                    {/* HSN summary header */}
                    <tr className="text-center font-semibold">
                      <td colSpan={2} className="gst-cell">HSN/SAC</td>
                      <td colSpan={2} className="gst-cell">Taxable Value</td>
                      <td colSpan={2} className="gst-cell">CGST</td>
                      <td colSpan={2} className="gst-cell">SGST/UTGST</td>
                    </tr>
                    <tr className="text-center font-semibold">
                      <td colSpan={2} className="gst-cell">&nbsp;</td>
                      <td colSpan={2} className="gst-cell">&nbsp;</td>
                      <td className="gst-cell">Rate</td>
                      <td className="gst-cell">Amount</td>
                      <td className="gst-cell">Rate</td>
                      <td className="gst-cell">Amount</td>
                    </tr>

                    {hsnSummaryRows.map((row) => (
                      <tr key={row.hsn || 'na'}>
                        <td colSpan={2} className="gst-cell text-center">{row.hsn}</td>
                        <td colSpan={2} className="gst-cell text-right">{fmtAmt(row.taxable)}</td>
                        <td className="gst-cell text-center">{isIGST ? '' : `${row.cgstRate}%`}</td>
                        <td className="gst-cell text-right">{isIGST ? '' : fmtAmt(row.cgstAmt)}</td>
                        <td className="gst-cell text-center">{isIGST ? '' : `${row.sgstRate}%`}</td>
                        <td className="gst-cell text-right">{isIGST ? '' : fmtAmt(row.sgstAmt)}</td>
                      </tr>
                    ))}

                    <tr className="font-semibold">
                      <td colSpan={2} className="gst-cell text-right">Total</td>
                      <td colSpan={2} className="gst-cell text-right">{fmtAmt(summaryTaxableTotal)}</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell text-right">{fmtAmt(summaryCgstTotal)}</td>
                      <td className="gst-cell">&nbsp;</td>
                      <td className="gst-cell text-right">{fmtAmt(summarySgstTotal)}</td>
                    </tr>

                    <tr>
                      <td colSpan={8} className="gst-cell">
                        <span className="font-semibold">Tax Amount (in words):</span>{' '}
                        INR {numberToWords(summaryTaxTotal)} Only
                      </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                      <td colSpan={4} className="gst-cell align-top p-1" valign="top">
                        <p className="font-semibold">Company&apos;s PAN :</p>
                        <p className="font-semibold mt-2">Declaration</p>
                        <p className="mt-1 leading-snug">
                          We declare that this invoice shows the actual price of the goods described and that all
                          particulars are true and correct. Goods once sold will not be taken back. Interest @18% p.a.
                          will be charged if payment is not made within 15 days.
                        </p>
                      </td>
                      <td colSpan={4} className="gst-cell align-top p-1" valign="top">
                        <p className="font-semibold">Company&apos;s Bank Details</p>
                        <p>A/c Holder&apos;s Name: {SELLER.bank.holder}</p>
                        <p>Bank Name: {SELLER.bank.name}</p>
                        <p>A/c No.: {SELLER.bank.account}</p>
                        <p>Branch &amp; IFS Code: {SELLER.bank.branch} &amp; {SELLER.bank.ifsc}</p>
                        <p className="text-right mt-6 font-semibold">for {SELLER.name}</p>
                        <p className="text-right mt-8">Authorised Signatory</p>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={8} className="gst-cell text-center font-semibold py-1">
                        SUBJECT TO JAIPUR JURISDICTION
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={8} className="gst-cell text-center py-1">
                        This is a Computer Generated Invoice
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
