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
  address: 'J-97, Ashok Chowk, Adarsh Nagar, Jaipur, Rajasthan, 302004',
  gstin: '08AALPC9959M1ZV',
  state: 'Rajasthan',
  stateCode: '08',
  tel: '94140-43763',
  email: 'hariharprinters1@gmail.com',
  bank: {
    holder: 'Harihar Printers',
    name: 'IndusInd Bank',
    account: '650014092175',
    branch: 'Raja Park, Jaipur',
    ifsc: 'INDB0000278',
  },
};

const fmtTaxDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
};

const fmtAmt = (value) =>
  Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TaxFieldsTable = ({ rows }) => (
  <table className="tax-fields-inner w-full">
    <tbody>
      {rows.map(([label, value], i) => (
        <tr key={i}>
          <td className="align-top tax-field-label">{label}</td>
          <td className="align-top tax-field-colon">:</td>
          <td className="align-top tax-field-value">{value ?? ''}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

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
  const linkedJobCard = selectedInvoice
    ? jobCards.find((card) => card.jobNumber === selectedInvoice.jobCard)
    : null;

  const billTo = getBillToDetails(linkedJobCard, selectedInvoice || {});
  const shipTo = getShipToDetails(linkedJobCard, selectedInvoice || {});
  const billToState = getStateFromGst(billTo.gstNo);
  const shipToState = getStateFromGst(shipTo.gstNo);

  const freightGstPercent = selectedInvoice
    ? Number(selectedInvoice.items?.[0]?.gstPercent ?? selectedInvoice.gstPercent ?? 18)
    : 18;
  const freightCgstAmt = isIGST ? 0 : (freight * (freightGstPercent / 2)) / 100;
  const freightSgstAmt = isIGST ? 0 : (freight * (freightGstPercent / 2)) / 100;
  const freightIgstAmt = isIGST ? (freight * freightGstPercent) / 100 : 0;

  const itemLines = selectedInvoice
    ? (selectedInvoice.items || []).map((item, idx) => {
        const taxable = Number(item.total) || 0;
        const pct = Number(item.gstPercent ?? selectedInvoice.gstPercent ?? 18);
        const cgstRate = isIGST ? 0 : pct / 2;
        const sgstRate = isIGST ? 0 : pct / 2;
        const igstRate = isIGST ? pct : 0;
        const cgstAmt = isIGST ? 0 : (taxable * cgstRate) / 100;
        const sgstAmt = isIGST ? 0 : (taxable * sgstRate) / 100;
        const igstAmt = isIGST ? (taxable * igstRate) / 100 : 0;
        return {
          idx: idx + 1,
          item,
          taxable,
          cgstRate,
          sgstRate,
          igstRate,
          cgstAmt,
          sgstAmt,
          igstAmt,
          lineTotal: taxable + cgstAmt + sgstAmt + igstAmt,
        };
      })
    : [];

  const totalQty = itemLines.reduce((sum, row) => sum + (Number(row.item.qty) || 0), 0);
  const totalTaxable = itemsSubTotal + freight;
  const totalCgst = itemLines.reduce((sum, row) => sum + row.cgstAmt, 0) + freightCgstAmt;
  const totalSgst = itemLines.reduce((sum, row) => sum + row.sgstAmt, 0) + freightSgstAmt;
  const totalIgst = itemLines.reduce((sum, row) => sum + row.igstAmt, 0) + freightIgstAmt;
  const amountBeforeTax = totalTaxable;
  const amountWithTax = selectedInvoice?.totalAmount || 0;

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
          <div className="print-modal-shell bg-white border border-gray-300 w-full max-w-full relative max-h-[95vh] flex flex-col shadow-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
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

            <div className="p-2 overflow-y-auto grow a4-page-container print:overflow-visible print:max-h-none print:h-auto print:p-0 print:grow-0" id="printable-content">
              <div
                id="printable-invoice"
                className="bg-white w-full shadow-none tax-invoice-print-page"
              >
                <table className="tax-invoice w-full border-collapse text-black" style={{ fontSize: '11px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <tbody>
                    {/* Company header — full width */}
                    <tr>
                      <td colSpan={12} className="tax-cell text-center align-middle py-2">
                        <p className="tax-company-name uppercase">{SELLER.name}</p>
                        <p className="tax-header-line">{SELLER.address}</p>
                        <p className="tax-header-line">{SELLER.tel}, {SELLER.email}</p>
                        <p className="tax-header-line"><span className="tax-field-label">GSTIN :</span> {SELLER.gstin}</p>
                      </td>
                    </tr>

                    {/* TAX INVOICE bar + copy type (right) */}
                    <tr>
                      <td colSpan={12} className="tax-cell tax-blue p-0">
                        <div className="tax-title-bar">
                          <div className="tax-title-text">TAX INVOICE</div>
                          <div className="tax-copy-box">
                            <p>Original for Recipient</p>
                            <p>Duplicate for Transporter</p>
                            <p>Triplicate for Supplier</p>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Invoice meta */}
                    <tr>
                      <td colSpan={6} className="tax-cell align-top p-1">
                        <TaxFieldsTable rows={[
                          ['Reverse Charge', selectedInvoice.reverseCharge || 'No'],
                          ['Invoice No.', selectedInvoice.invoiceNumber],
                          ['Invoice Date', fmtTaxDate(selectedInvoice.date)],
                          ['State', SELLER.state],
                          ['State Code', SELLER.stateCode],
                        ]} />
                      </td>
                      <td colSpan={6} className="tax-cell align-top p-1">
                        <TaxFieldsTable rows={[
                          ['Transportation Mode', 'Road'],
                          ['Vehicle No.', ''],
                          ['Date of Supply', fmtTaxDate(selectedInvoice.date)],
                          ['Place of Supply', 'Jaipur'],
                        ]} />
                      </td>
                    </tr>

                    {/* Bill to / Ship to */}
                    <tr>
                      <td colSpan={6} className="tax-cell align-top p-0">
                        <div className="tax-blue tax-section-title text-center py-0.5 px-1">Details of Receiver | Billed to:</div>
                        <div className="p-1">
                          <TaxFieldsTable rows={[
                            ['Name', billTo.partyName],
                            ['Address', billTo.address || '-'],
                            ['E-MAIL', billTo.emailId || '-'],
                            ['GSTIN', billTo.gstNo || 'URP'],
                            ['MOBILE', billTo.contactNo || '-'],
                            ['State', billToState.state],
                            ['State Code', billToState.code],
                          ]} />
                        </div>
                      </td>
                      <td colSpan={6} className="tax-cell align-top p-0">
                        <div className="tax-blue tax-section-title text-center py-0.5 px-1">Details of Consignee | Shipped to:</div>
                        <div className="p-1">
                          <TaxFieldsTable rows={[
                            ['Name', shipTo.partyName],
                            ['Address', shipTo.address || '-'],
                            ['E-MAIL', shipTo.emailId || '-'],
                            ['GSTIN', shipTo.gstNo || 'URP'],
                            ['MOBILE', shipTo.contactNo || '-'],
                            ['State', shipToState.state],
                            ['State Code', shipToState.code],
                          ]} />
                        </div>
                      </td>
                    </tr>

                    {/* Items table header row 1 */}
                    <tr className="tax-blue text-center font-bold">
                      <td className="tax-cell" rowSpan={2}>Sr.<br />No.</td>
                      <td className="tax-cell" rowSpan={2}>Name of product</td>
                      <td className="tax-cell" rowSpan={2}>HSN/SAC</td>
                      <td className="tax-cell" rowSpan={2}>QTY</td>
                      <td className="tax-cell" rowSpan={2}>Unit</td>
                      <td className="tax-cell" rowSpan={2}>Rate</td>
                      <td className="tax-cell" rowSpan={2}>Taxable<br />Value</td>
                      {isIGST ? (
                        <>
                          <td className="tax-cell" colSpan={2}>IGST</td>
                          <td className="tax-cell" colSpan={2}>&nbsp;</td>
                        </>
                      ) : (
                        <>
                          <td className="tax-cell" colSpan={2}>CGST</td>
                          <td className="tax-cell" colSpan={2}>SGST</td>
                        </>
                      )}
                      <td className="tax-cell" rowSpan={2}>Total</td>
                    </tr>
                    <tr className="tax-blue text-center font-bold">
                      {isIGST ? (
                        <>
                          <td className="tax-cell">Rate</td>
                          <td className="tax-cell">Amount</td>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell">&nbsp;</td>
                        </>
                      ) : (
                        <>
                          <td className="tax-cell">Rate</td>
                          <td className="tax-cell">Amount</td>
                          <td className="tax-cell">Rate</td>
                          <td className="tax-cell">Amount</td>
                        </>
                      )}
                    </tr>

                    {/* Item rows */}
                    {itemLines.map((row) => (
                      <tr key={row.idx}>
                        <td className="tax-cell text-center align-top tax-item-value">{row.idx}</td>
                        <td className="tax-cell align-top tax-item-value">{row.item.description}</td>
                        <td className="tax-cell text-center align-top tax-item-value">{row.item.hsn || ''}</td>
                        <td className="tax-cell text-center align-top tax-item-value">{Number(row.item.qty || 0)}</td>
                        <td className="tax-cell text-center align-top tax-item-value">PCS</td>
                        <td className="tax-cell text-right align-top tax-item-value">{fmtAmt(row.item.rate)}</td>
                        <td className="tax-cell text-right align-top tax-item-value">{fmtAmt(row.taxable)}</td>
                        {isIGST ? (
                          <>
                            <td className="tax-cell text-center align-top">{row.igstRate}%</td>
                            <td className="tax-cell text-right align-top">{fmtAmt(row.igstAmt)}</td>
                            <td className="tax-cell">&nbsp;</td>
                            <td className="tax-cell">&nbsp;</td>
                          </>
                        ) : (
                          <>
                            <td className="tax-cell text-center align-top">{row.cgstRate}%</td>
                            <td className="tax-cell text-right align-top">{fmtAmt(row.cgstAmt)}</td>
                            <td className="tax-cell text-center align-top">{row.sgstRate}%</td>
                            <td className="tax-cell text-right align-top">{fmtAmt(row.sgstAmt)}</td>
                          </>
                        )}
                        <td className="tax-cell text-right align-top tax-item-total">{fmtAmt(row.lineTotal)}</td>
                      </tr>
                    ))}

                    {freight > 0 && (
                      <tr>
                        <td className="tax-cell text-center align-top">{itemLines.length + 1}</td>
                        <td className="tax-cell align-top">Freight</td>
                        <td className="tax-cell">&nbsp;</td>
                        <td className="tax-cell">&nbsp;</td>
                        <td className="tax-cell">&nbsp;</td>
                        <td className="tax-cell">&nbsp;</td>
                        <td className="tax-cell text-right align-top">{fmtAmt(freight)}</td>
                        {isIGST ? (
                          <>
                            <td className="tax-cell text-center align-top">{freightGstPercent}%</td>
                            <td className="tax-cell text-right align-top">{fmtAmt(freightIgstAmt)}</td>
                            <td className="tax-cell">&nbsp;</td>
                            <td className="tax-cell">&nbsp;</td>
                          </>
                        ) : (
                          <>
                            <td className="tax-cell text-center align-top">{freightGstPercent / 2}%</td>
                            <td className="tax-cell text-right align-top">{fmtAmt(freightCgstAmt)}</td>
                            <td className="tax-cell text-center align-top">{freightGstPercent / 2}%</td>
                            <td className="tax-cell text-right align-top">{fmtAmt(freightSgstAmt)}</td>
                          </>
                        )}
                        <td className="tax-cell text-right align-top font-bold">
                          {fmtAmt(freight + freightCgstAmt + freightSgstAmt + freightIgstAmt)}
                        </td>
                      </tr>
                    )}

                    {/* Items footer totals */}
                    <tr className="tax-blue font-bold">
                      <td className="tax-cell" colSpan={3}>Total Quantity</td>
                      <td className="tax-cell text-center">{totalQty}</td>
                      <td className="tax-cell" colSpan={2}>&nbsp;</td>
                      <td className="tax-cell text-right">{fmtAmt(totalTaxable)}</td>
                      {isIGST ? (
                        <>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell text-right">{fmtAmt(totalIgst)}</td>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell">&nbsp;</td>
                        </>
                      ) : (
                        <>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell text-right">{fmtAmt(totalCgst)}</td>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell text-right">{fmtAmt(totalSgst)}</td>
                        </>
                      )}
                      <td className="tax-cell text-right">{fmtAmt(amountWithTax)}</td>
                    </tr>

                    {/* Amount in words + summary */}
                    <tr>
                      <td colSpan={6} className="tax-cell align-top p-0">
                        <div className="tax-blue tax-section-title text-center py-0.5 px-1">Total Invoice Amount in words</div>
                        <p className="text-center py-2 px-1 tax-amount-words">{numberToWords(amountWithTax)} Rupees Only</p>
                      </td>
                      <td colSpan={6} className="tax-cell align-top p-0">
                        <table className="w-full border-collapse tax-summary-table">
                          <tbody>
                            <tr>
                              <td className="tax-cell font-bold tax-summary-label">Total Amount Before Tax</td>
                              <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(amountBeforeTax)}</td>
                            </tr>
                            {isIGST ? (
                              <tr>
                                <td className="tax-cell font-bold tax-summary-label">Add : IGST</td>
                                <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(totalIgst)}</td>
                              </tr>
                            ) : (
                              <>
                                <tr>
                                  <td className="tax-cell font-bold tax-summary-label">Add : CGST</td>
                                  <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(totalCgst)}</td>
                                </tr>
                                <tr>
                                  <td className="tax-cell font-bold tax-summary-label">Add : SGST</td>
                                  <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(totalSgst)}</td>
                                </tr>
                              </>
                            )}
                            <tr className="tax-blue">
                              <td className="tax-cell font-bold tax-summary-label">Tax Amount : GST</td>
                              <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(totalGstAmount)}</td>
                            </tr>
                            <tr className="tax-blue">
                              <td className="tax-cell font-bold tax-summary-label">Amount With Tax</td>
                              <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(amountWithTax)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Bank + Signature */}
                    <tr>
                      <td colSpan={6} className="tax-cell align-top p-1">
                        <p className="tax-section-title mb-1">Bank Details</p>
                        <TaxFieldsTable rows={[
                          ['Account Holder Name', SELLER.bank.holder],
                          ['Bank Account Number', SELLER.bank.account],
                          ['Bank IFSC Code', SELLER.bank.ifsc],
                          ['Bank Name', SELLER.bank.name],
                          ['Bank Branch Name', SELLER.bank.branch],
                        ]} />
                        <p className="tax-section-title mt-2 mb-1">Terms And Conditions</p>
                        <ol className="tax-terms-list">
                          <li>Goods once sold will not be taken back.</li>
                          <li>Any Dispute Shall Subject to Jaipur Jurisdiction.</li>
                          <li>E.&amp;O.E.</li>
                          <li>The company is not responsible for any transit damage or loss.</li>
                          <li>All Goods Return / Replace only if damage by company transport.</li>
                        </ol>
                      </td>
                      <td colSpan={6} className="tax-cell align-top p-1">
                        <p className="text-center mb-2 tax-header-line">Certified that the particular given above are true and correct</p>
                        <p className="tax-section-title text-right">For, {SELLER.name}</p>
                        <div className="tax-sign-space">&nbsp;</div>
                        <p className="text-right tax-section-title">Authorised Signatory</p>
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
