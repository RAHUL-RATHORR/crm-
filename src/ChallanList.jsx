import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Truck, Pencil, ChevronDown, Check, AlertCircle, Printer, X, Download, Phone, Mail, Globe, Building2, MapPin, Calendar, FileDigit } from 'lucide-react';
import { downloadAsPDF } from './utils/pdfExport';
import { printElement } from './utils/printDocument';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { getBillToDetails, getShipToDetails } from './utils/shipAddress';
import { numberToWords } from './utils/numberToWords';

const ChallanList = () => {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // New states for Printing
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [tempGstType, setTempGstType] = useState('CGST/SGST');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobCards, setJobCards] = useState([]);

  const gstPercent = selectedChallan ? (selectedChallan.gstPercent ?? 18) : 18;
  const totalAmount = selectedChallan ? (selectedChallan.total ?? 0) : 0;
  const totalGstAmount = (totalAmount * gstPercent) / 100;
  const halfGstAmount = totalGstAmount / 2;
  const isIGST = tempGstType === 'IGST';
  const rawGrandTotal = totalAmount + totalGstAmount;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = grandTotal - rawGrandTotal;

  const linkedJobCard = selectedChallan
    ? jobCards.find((card) => card.jobNumber === selectedChallan.jobNumber)
    : null;

  const challanPartyFallback = selectedChallan ? { partyName: selectedChallan.partyName } : {};
  const billTo = getBillToDetails(linkedJobCard, challanPartyFallback);
  const shipTo = getShipToDetails(linkedJobCard, challanPartyFallback);

  useEffect(() => {
    fetchChallans();
    fetch('https://crm-qpw8.onrender.com/api/jobcard')
      .then((res) => res.json())
      .then((data) => setJobCards(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching job cards:', err));
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
    } catch (err) {
      console.error("Error updating challan status:", err);
      fetchChallans();
      alert("Failed to update status. Please try again.");
    }
  };

  // Printing functions
  const openPreview = (ch) => {
    setSelectedChallan(ch);
    setTempGstType(ch.gstType || 'CGST/SGST');
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setSelectedChallan(null);
  };

  const handlePrint = () => {
    printElement('printable-challan');
  };

  const handleDownloadPDF = async () => {
    await downloadAsPDF(
      'printable-challan',
      `Challan_${selectedChallan.challanNo}`,
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

          <div className="overflow-x-auto min-h-100 pb-40">
            <table className="w-full text-left whitespace-nowrap min-w-200">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                  <th className="px-4 sm:px-6 py-4">S.No.</th>
                  <th className="px-4 sm:px-6 py-4">Challan Number</th>
                  <th className="px-4 sm:px-6 py-4">Job Card</th>
                  <th className="px-4 sm:px-6 py-4">Party Name</th>
                  <th className="px-4 sm:px-6 py-4">Total Amount</th>
                  <th className="px-4 sm:px-6 py-4">Created At</th>
                  <th className="px-4 sm:px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 sm:px-6 py-10 text-center text-gray-500">
                      No challans found.
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
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => openPreview(ch)}
                            className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-all active:scale-90"
                            title="Print Challan"
                          >
                            <Printer size={16} />
                          </button>
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
        </div>

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Are you sure?"
          message="Are you sure you want to move this challan to trash?"
        />
      </div>

      {/* Challan Preview & Print Modal */}
      {isModalOpen && selectedChallan && (
        <div className="print-modal-overlay fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4 overflow-y-auto print:static print:overflow-visible print:bg-white print:p-0">
          <div className="print-modal-shell bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <h2 className="text-xl font-bold text-gray-800">Challan Preview</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200">
                  <span className="text-gray-500 font-medium">GST Mode:</span>
                  <select
                    value={tempGstType}
                    onChange={(e) => setTempGstType(e.target.value)}
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

            {/* Modal Body - Printable Content */}
            <div className="p-8 overflow-y-auto grow a4-page-container print:overflow-visible print:max-h-none print:h-auto print:p-0 print:grow-0" id="printable-content">
              <div
                id="printable-challan"
                className="bg-white mx-auto shadow-none a4-page challan-print-page font-sans"
                style={{ color: '#334155' }}
              >
                {/* Traditional Green/Teal Design - Matching Estimates */}
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-center mb-3" style={{ color: '#1e3a8a' }}>
                    Delivery Challan
                  </h1>

                  <div className="flex justify-between items-start gap-10">
                    <div className="flex-1">
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

                    <div className="flex-1 flex flex-col items-end">
                      {/* Metadata Table */}
                      <div className="w-48 border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[12px]">
                      <tbody className="divide-y divide-gray-200">
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase tracking-tighter">DATE :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800">
                            {new Date(selectedChallan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase tracking-tighter">Challan No :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800">#{selectedChallan.challanNo}</td>
                        </tr>
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase tracking-tighter">Job Ref :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-blue-700">{selectedChallan.jobNumber}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-start gap-10 mt-4">
                    <div className="flex-1">
                      <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Bill To :</h4>
                      <div className="text-[12px] space-y-1 font-medium text-gray-600">
                        <p className="font-bold uppercase text-xs" style={{ color: '#1e3a8a' }}>{billTo.partyName}</p>
                        <p className="uppercase">{billTo.address || billTo.partyName}</p>
                        <p>Jaipur, Rajasthan</p>
                        <p>Tel: {billTo.contactNo || 'Contact Provided'}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex justify-end">
                      <div className="w-48">
                      <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Ship To :</h4>
                      <div className="text-[12px] space-y-1 font-medium text-gray-600">
                        <p className="font-bold uppercase text-xs" style={{ color: '#1e3a8a' }}>{shipTo.partyName}</p>
                        <p className="uppercase">{shipTo.address || shipTo.partyName}</p>
                        <p>Jaipur, Rajasthan</p>
                        <p>Tel: {shipTo.contactNo || 'Contact Provided'}</p>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- ITEMS TABLE --- */}
                <div className="challan-items-table mb-8 border border-gray-200 rounded-sm overflow-hidden min-h-87.5 flex flex-col">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-white text-[12px] font-black uppercase tracking-widest" style={{ backgroundColor: '#1e3a8a' }}>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 w-24">Quantity</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30">Description of Goods</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 text-right w-28">Rate</th>
                        <th className="px-4 py-2.5 text-right w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 grow">
                      {(selectedChallan.items && selectedChallan.items.length > 0 ? selectedChallan.items : [{ description: selectedChallan.description || selectedChallan.jobName, qty: selectedChallan.qty, rate: selectedChallan.rate, total: selectedChallan.total }]).map((item, idx) => (
                        <tr key={idx} className="text-[13px] group">
                          <td className="px-4 py-4 border-r border-gray-50 font-bold align-top text-center text-gray-700">
                            {item.qty} NOS
                          </td>
                          <td className="px-4 py-4 border-r border-gray-50 align-top">
                            <div className="space-y-1">
                              <p className="font-black text-gray-900 uppercase text-xs" style={{ color: '#1e3a8a' }}>{item.description || selectedChallan.jobName}</p>
                              {idx === 0 && selectedChallan.jobNumber && (
                                <p className="text-[11px] text-gray-700 font-medium leading-relaxed italic uppercase">
                                  Job Ref: {selectedChallan.jobNumber}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 border-r border-gray-50 font-bold align-top text-right text-gray-700">
                            ₹ {Number(item.rate || (item.total / (item.qty || 1)) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 font-black align-top text-right text-gray-900 bg-gray-50/30">
                            ₹ {Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {/* Blank rows to fill space — hidden only when printing */}
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <tr key={i} className="invoice-fill-row border-0">
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Total Section */}
                  <div className="border-t border-gray-200 mt-auto bg-gray-50/50">
                    <div className="flex">
                      <div className="grow p-4">
                        <p className="text-[10px] font-black text-gray-600 uppercase mb-1 tracking-widest">Amount in Words</p>
                        <p className="text-[12px] font-bold text-gray-700 italic">{numberToWords(grandTotal)} Only</p>
                      </div>
                      <div className="flex flex-col w-56 border-l border-gray-200">
                        <div className="flex justify-between px-4 py-1.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">Total Amount</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-4 py-1.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">CGST {isIGST ? '(0%)' : `(${gstPercent / 2}%)`}</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {isIGST ? '0.00' : halfGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-4 py-1.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">SGST {isIGST ? '(0%)' : `(${gstPercent / 2}%)`}</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {isIGST ? '0.00' : halfGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-4 py-1.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">IGST {isIGST ? `(${gstPercent}%)` : '(0%)'}</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {isIGST ? totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
                        </div>
                        <div className="flex justify-between px-4 py-1.5 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-700 uppercase">Round Off</span>
                          <span className="text-[12px] font-bold text-gray-800">₹ {roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 invoice-grand-total" style={{ backgroundColor: '#1e3a8a' }}>
                          <span className="text-[12px] font-black text-white uppercase tracking-wider">Grand Total</span>
                          <span className="text-sm font-black text-white">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- BANK DETAILS BAR --- */}
                <div className="mb-6">
                  <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-3 pb-0.5 inline-block uppercase tracking-wider">Account Details :</h4>
                  <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/30 flex justify-between items-center">
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
                <div className="invoice-footer mt-8 text-[11px] text-gray-700 space-y-4">
                  <div className="pt-8 grid grid-cols-2 gap-20">
                    <div className="border-t border-gray-300 pt-1">
                      <p className="font-bold uppercase tracking-widest text-[#1e3a8a]">Receiver's Signature :</p>
                    </div>
                    <div className="border-t border-gray-300 pt-1 text-right">
                      <p className="font-bold uppercase tracking-widest text-[#1e3a8a]">For Harihar Printers</p>
                      <p className="mt-8 font-black text-gray-800">Authorised Signatory</p>
                    </div>
                  </div>

                  <div className="pt-12 text-center">

                    <p className="text-[10px] font-bold text-gray-600 mt-2 uppercase tracking-widest">Subject to Jaipur Jurisdiction Only</p>
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

export default ChallanList;
