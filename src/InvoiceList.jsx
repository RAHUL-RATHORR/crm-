import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Pencil, Printer, Eye, X, Download, Phone, Mail, Globe, Building2, MapPin, Calendar, FileDigit, AlertCircle } from 'lucide-react';
import { downloadAsPDF } from './utils/pdfExport';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const NumberToWords = (num) => {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{1})(\d{1})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'lakh ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'thousand ' : '';
  str += (n[5] != 0) ? (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'hundred ' : '';
  str += (n[6] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[6])] || b[n[6][0]] + ' ' + a[n[6][1]]) + 'only ' : '';
  return str.trim();
};

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
    await downloadAsPDF(
      'printable-invoice',
      `Invoice_${selectedInvoice.invoiceNumber}`,
      setIsGenerating
    );
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
                {/* Refined Traditional GST Invoice Layout */}
                <div className="border-[1px] border-black p-0 text-black leading-tight font-sans" style={{ minHeight: '1050px', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Top Badge */}
                  <div className="flex justify-center -mt-3 mb-1">
                    <span className="bg-black text-white px-8 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] border border-black">
                      TAX INVOICE
                    </span>
                  </div>

                  {/* Header Section */}
                  <div className="flex justify-between px-4 pb-1.5 border-b border-black">
                    <div className="w-7/12 pt-2">
                      <div className="flex items-center">
                        <h1 className="text-[38px] font-black tracking-tighter" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          Harihar <span className="ml-2 font-sans text-[32px]">Printers</span>
                        </h1>
                      </div>
                      <div className="text-[9px] font-bold mt-0.5 space-y-0.5">
                        <p>Office : J-97, Ashok Chowk, Adarsh Nagar, Jaipur-302 004</p>
                        <p>Factory : G-139, Hirawala Industrial Area, Kanota, Agra Road, Jaipur</p>
                        <p>Mob.: 9314130859, 9414043763</p>
                      </div>
                    </div>
                    <div className="w-5/12 text-[9px] font-bold border-l border-black pl-3 pt-2 relative">
                       {/* Copy info box */}
                       <div className="absolute top-1 right-2 border border-black p-0.5 text-[7px] font-black leading-tight text-right uppercase">
                         <p>WHITE - ORIGINAL</p>
                         <p>GREEN - DUPLICATE</p>
                         <p>WHITE - OFFICE COPY</p>
                       </div>

                       <table className="w-full border-collapse mt-4">
                          <tbody>
                            <tr className="h-5">
                              <td className="w-24">Reverse Charge</td>
                              <td className="border-b border-black h-4 px-2 uppercase">NO</td>
                              <td className="w-8 text-center"></td>
                              <td className="w-20"></td>
                            </tr>
                            <tr className="h-5">
                              <td>Invoice No.</td>
                              <td className="border-b border-black uppercase text-[10px] font-black">{selectedInvoice.invoiceNumber}</td>
                              <td className="text-center">Date</td>
                              <td className="border-b border-black text-right px-1">{new Date(selectedInvoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                            </tr>
                            <tr className="h-5">
                              <td>Order No.</td>
                              <td className="border-b border-black"></td>
                              <td className="text-center">Date</td>
                              <td className="border-b border-black"></td>
                            </tr>
                            <tr className="h-5">
                              <td>Challan No.</td>
                              <td className="border-b border-black"></td>
                              <td className="text-center">Date</td>
                              <td className="border-b border-black"></td>
                            </tr>
                          </tbody>
                       </table>
                    </div>
                  </div>

                  {/* GSTIN and PAN Bar */}
                  <div className="grid grid-cols-2 border-b border-black text-[10px] font-bold">
                    <div className="px-4 py-1 border-r border-black flex justify-between">
                      <span>GSTIN : 08AALPC9959M1ZV</span>
                    </div>
                    <div className="px-4 py-1 flex justify-between">
                      <span>PAN No. AALPC9959M</span>
                    </div>
                  </div>

                  {/* Party Details Grid */}
                  <div className="flex border-b border-black h-[140px]">
                    <div className="w-1/2 border-r border-black flex flex-col">
                      <div className="bg-gray-100 border-b border-black px-2 py-0.5 text-[9px] font-bold italic">Bill to Party</div>
                      <div className="p-3 space-y-2 flex-grow">
                        <div className="flex items-start">
                          <span className="text-[10px] font-bold mr-1">M/s.</span>
                          <span className="text-xs font-black uppercase underline decoration-dotted underline-offset-4">{selectedInvoice.partyName}</span>
                        </div>
                        <div className="border-b border-black h-4 mt-2"></div>
                        <div className="border-b border-black h-4"></div>
                        <div className="flex items-center gap-4 mt-3 text-[9px] font-bold">
                          <div className="flex items-center gap-1">State Code<span className="border-b border-black w-10 text-center">08</span></div>
                          <div className="flex items-center gap-1 flex-grow">GSTIN<span className="border-b border-black flex-grow"></span></div>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/2 flex flex-col">
                      <div className="bg-gray-100 border-b border-black px-2 py-0.5 text-[9px] font-bold italic">Place of Supply</div>
                      <div className="p-3 space-y-2 flex-grow">
                        <div className="flex items-start">
                          <span className="text-[10px] font-bold mr-1">M/s.</span>
                          <span className="text-xs font-black uppercase underline decoration-dotted underline-offset-4">{selectedInvoice.partyName}</span>
                        </div>
                        <div className="border-b border-black h-4 mt-2"></div>
                        <div className="border-b border-black h-4"></div>
                        <div className="flex items-center gap-4 mt-3 text-[9px] font-bold">
                          <div className="flex items-center gap-1">State Code<span className="border-b border-black w-10 text-center">08</span></div>
                          <div className="flex items-center gap-1 flex-grow">GSTIN<span className="border-b border-black flex-grow"></span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Items Table */}
                  <div className="flex-grow overflow-hidden flex flex-col">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-[9px] font-black border-b border-black text-center">
                          <th className="border-r border-black w-10 py-1">S. No.</th>
                          <th className="border-r border-black py-1 px-4">DESCRIPTION</th>
                          <th className="border-r border-black w-24 py-1">HSN/SAC Code</th>
                          <th className="border-r border-black w-16 py-1">Qty</th>
                          <th className="border-r border-black w-24 py-1">Rate</th>
                          <th className="w-28 py-0">
                            <div className="py-1">Amount</div>
                            <div className="flex border-t border-black">
                              <span className="w-1/2 border-r border-black py-0.5">Rs.</span>
                              <span className="w-1/2 py-0.5">P.</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="flex-grow">
                        {selectedInvoice.items?.map((item, idx) => {
                          const total = item.total || 0;
                          const rs = Math.floor(total);
                          const p = Math.round((total - rs) * 100);
                          return (
                            <tr key={idx} className="text-[10px] font-bold h-7 border-b border-gray-100">
                              <td className="border-r border-black text-center">{idx + 1}</td>
                              <td className="border-r border-black px-4 uppercase">{item.description}</td>
                              <td className="border-r border-black text-center">4911</td>
                              <td className="border-r border-black text-center">{item.qty}</td>
                              <td className="border-r border-black text-right pr-2">₹{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="flex h-7 items-center">
                                <span className="w-1/2 border-r border-black h-full flex items-center justify-end pr-1">{rs.toLocaleString('en-IN')}</span>
                                <span className="w-1/2 h-full flex items-center justify-center font-mono text-[9px]">{p.toString().padStart(2, '0')}</span>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Empty spacing rows to fill page height */}
                        {[...Array(Math.max(0, 15 - (selectedInvoice.items?.length || 0)))].map((_, i) => (
                          <tr key={`empty-${i}`} className="h-7 border-b border-gray-50 border-dotted">
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="flex h-7">
                               <span className="w-1/2 border-r border-black h-full"></span>
                               <span className="w-1/2 h-full"></span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Section - Integrated into Flow */}
                  <div className="mt-auto border-t border-black">
                    <div className="flex">
                      {/* Left Side: Words and Bank Details */}
                      <div className="w-7/12 border-r border-black flex flex-col">
                        <div className="p-4 border-b border-black">
                          <div className="border border-black p-2.5 rounded shadow-sm text-[9px] font-bold leading-relaxed">
                            <div className="text-center underline font-black mb-1.5 uppercase tracking-wider">Our Bank Details</div>
                            <p className="flex items-center"><span className="text-gray-500 w-24">Bank Name</span> : Indusind Bank</p>
                            <p className="flex items-center"><span className="text-gray-500 w-24">Branch</span> : Raja Park, B-10, Govind Marg, Jaipur-302004</p>
                            <p className="flex items-center"><span className="text-gray-500 w-24">A/c No.</span> : <span className="font-black text-[11px]">650014092175</span></p>
                            <p className="flex items-center"><span className="text-gray-500 w-24">IFSC Code</span> : <span className="font-black">INDB0000278</span></p>
                          </div>
                        </div>
                        <div className="p-4 text-[9px] font-bold">
                          <div className="flex items-start gap-1">
                            <span className="whitespace-nowrap">Rupees in Words.</span>
                            <span className="border-b border-black flex-grow font-black pl-2 py-0.5 lowercase text-black">({NumberToWords(selectedInvoice.totalAmount)} Only)</span>
                          </div>
                          
                          <div className="mt-4 text-[8px] leading-relaxed text-gray-700 space-y-0.5">
                            <p className="font-black text-black">E. & O. E.</p>
                            <p>1. Goods once sold will not be taken back.</p>
                            <p>2. Our responsibility ceases after the goods leave our premises.</p>
                            <p>3. 18% Interest will be charged if payment is not made within 15 days.</p>
                            <p>4. All Subjects to Jaipur Jurisdiction. 5. Payment by A/c Payee Cheque only.</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Tax Table */}
                      <div className="w-5/12 text-[9px] font-bold">
                        <table className="w-full border-collapse">
                          <tbody>
                            {[
                              { label: 'Freight', value: '-' },
                              { label: 'Total Taxable Amount', value: `₹${(selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                              { label: `ADD CGST @ ${selectedInvoice.gstRate / 2}%`, value: `₹${((selectedInvoice.totalAmount - (selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100)))) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                              { label: `ADD SGST @ ${selectedInvoice.gstRate / 2}%`, value: `₹${((selectedInvoice.totalAmount - (selectedInvoice.totalAmount / (1 + (selectedInvoice.gstRate / 100)))) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                              { label: 'Round off', value: '₹0.00' },
                              { label: 'Total Amount after tax', value: `₹${selectedInvoice.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, highlight: true },
                              { label: 'Reverse Charge', value: '-' }
                            ].map((row, i) => (
                              <tr key={i} className={`h-8 border-b border-black ${row.highlight ? 'bg-gray-100 text-xs' : ''}`}>
                                <td className="px-4 py-1">{row.label}</td>
                                <td className="border-l border-black text-right px-4 font-black">{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        <div className="p-4 pt-10 text-right">
                           <p className="text-[10px] font-black italic mb-14">For HARIHAR PRINTERS</p>
                           <span className="border-t border-black px-6 pt-1 font-black text-[9px] uppercase tracking-tighter">Authorised Signatory</span>
                        </div>
                      </div>
                    </div>
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
