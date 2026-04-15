import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Truck, Pencil, ChevronDown, Check, AlertCircle, Printer, X, Download, Phone, Mail, Globe, Building2, MapPin, Calendar, FileDigit } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const ChallanList = () => {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // New states for Printing
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setSelectedChallan(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const element = document.getElementById('printable-challan');
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Challan_${selectedChallan.challanNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF Error:", error);
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
                  <th className="px-4 sm:px-6 py-4">Status</th>
                  <th className="px-4 sm:px-6 py-4">Created At</th>
                  <th className="px-4 sm:px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 sm:px-6 py-10 text-center text-gray-500">
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
                      <td className="px-4 sm:px-6 py-4 relative">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === ch._id ? null : ch._id)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-bold transition-all shadow-sm ${(ch.paymentStatus === 'Completed') ? 'bg-emerald-500' : 'bg-orange-500'}`}
                          >
                            <div className="flex items-center gap-1.5">
                              {ch.paymentStatus === 'Completed' ? 'Completed' : 'Pending'}
                              {ch.paymentStatus === 'Completed' && <Check size={12} strokeWidth={3} />}
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdownId === ch._id ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdownId === ch._id && (
                            <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                              {ch.paymentStatus === 'Completed' ? (
                                <button
                                  onClick={() => handleStatusUpdate(ch._id, 'Pending')}
                                  className="flex items-center justify-between w-full px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors"
                                >
                                  Pending
                                  <AlertCircle size={14} className="opacity-50" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusUpdate(ch._id, 'Completed')}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-2xl animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <Printer size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Challan Preview</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">#{selectedChallan.challanNo} • {selectedChallan.partyName}</p>
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
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors ml-2 font-bold"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-gray-100/50 a4-page-container">
              <div 
                id="printable-challan"
                className="bg-white mx-auto shadow-sm border border-gray-200 a4-page"
              >
                {/* Header Branding */}
                <div className="flex justify-between items-start mb-6 border-b-2 pb-4" style={{ borderColor: '#1e293b' }}>
                  <div className="flex-grow">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-none">
                            Harihar <span className="text-blue-600">Printers</span>
                        </h1>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-gray-700">
                           <span className="text-blue-600 uppercase">Office:</span> J-97, Ashok Chowk, Adarsh Nagar, Jaipur-302 004
                        </p>
                        <p className="text-[10px] font-bold text-gray-700">
                           <span className="text-blue-600 uppercase">Factory:</span> G-139, Hirawala Industrial Area, Kanota, Agra Road, Jaipur
                        </p>
                        <div className="flex gap-4 mt-1">
                            <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                                <Phone size={10} className="text-blue-500" /> 0141-2600850, 9414043763
                            </p>
                            <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                                <Mail size={10} className="text-blue-500" /> hariharprinters1@gmail.com
                            </p>
                        </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="bg-blue-600 text-white px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-widest shadow-sm">
                        GST Delivery Challan
                    </div>
                    <div className="text-[9px] font-black text-gray-500 uppercase flex flex-col gap-0.5 mt-2 tracking-wide">
                        <span>GSTIN: <span className="text-gray-900 border-b border-gray-200">08AALPC9959M1ZV</span></span>
                        <span>PAN: <span className="text-gray-900 border-b border-gray-200">AALPC9959M</span></span>
                    </div>
                  </div>
                </div>

                {/* Meta Information Bar */}
                <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Challan Number</span>
                        <span className="text-sm font-black text-blue-700">{selectedChallan.challanNo}</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-4">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Date</span>
                        <span className="text-sm font-black text-gray-900">{new Date(selectedChallan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-4">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Order No.</span>
                        <span className="text-sm font-black text-gray-900 uppercase"> - </span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-4">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Veh. No.</span>
                        <span className="text-sm font-black text-gray-900"> - </span>
                    </div>
                </div>

                {/* Party Details Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Challan to Party */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-blue-600 border-b pb-1 flex items-center gap-2">
                            <Building2 size={12} /> Challan To Party
                        </h4>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-gray-900 leading-tight uppercase">{selectedChallan.partyName}</p>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase pr-4">
                                {selectedChallan.address || 'Address Not Provided'}
                            </p>
                        </div>
                    </div>

                    {/* Place of Supply */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 border-b pb-1 flex items-center gap-2 italic">
                            <MapPin size={12} /> Place of Supply
                        </h4>
                        <div className="space-y-1 opacity-80">
                            <p className="text-sm font-black text-gray-900 leading-tight uppercase">{selectedChallan.partyName}</p>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase">
                                {selectedChallan.address || 'Same as Billing'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Message Section */}
                <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <p className="text-[10px] font-bold text-blue-900 leading-relaxed text-center italic">
                        "Kindly Count the following Material in presence our delegate. We are not responsible any complete in later. Please return one copy with our signature"
                    </p>
                </div>

                {/* Item Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden mt-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900 text-white uppercase text-[9px] font-black tracking-widest">
                                <th className="px-4 py-3 w-12 text-center">S.No.</th>
                                <th className="px-4 py-3">Description of Goods</th>
                                <th className="px-4 py-3 text-center">HSN/SAC</th>
                                <th className="px-4 py-3 text-right pr-8">Quantity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="text-gray-900">
                                <td className="px-4 py-8 text-center text-[11px] font-black text-gray-400">01</td>
                                <td className="px-4 py-8">
                                    <p className="text-sm font-black uppercase text-gray-900">{selectedChallan.jobName}</p>
                                    <p className="text-[10px] font-bold text-gray-400 tracking-wide mt-1 uppercase">Printing Services - {selectedChallan.jobNumber}</p>
                                </td>
                                <td className="px-4 py-8 text-center text-xs font-bold text-gray-600 tracking-wider font-mono">4901</td>
                                <td className="px-4 py-8 text-right text-lg font-black text-blue-700 pr-8">
                                    1 <span className="text-[10px] text-gray-400 uppercase ml-1">Unit</span>
                                </td>
                            </tr>
                            {/* Empty spacing rows */}
                            {[...Array(6)].map((_, i) => (
                                <tr key={`empty-${i}`} className="h-12 opacity-5"><td colSpan="4" className="border-b border-gray-100 font-bold"></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Signature Section */}
                <div className="mt-16 flex justify-between gap-12">
                   {/* Receiver Signature Side */}
                   <div className="w-[45%] flex flex-col justify-end">
                        <div className="border-t-2 border-dashed border-gray-200 pt-3 text-center bg-gray-50/50 p-6 rounded-2xl border-2">
                            <div className="h-12"></div> {/* Signature Space */}
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Receiver's Signature</span>
                            <span className="text-[8px] text-gray-300 font-bold italic block">Received goods in perfect condition</span>
                        </div>
                   </div>

                   {/* Authorised Signatory Side */}
                   <div className="w-[45%] flex flex-col justify-end">
                        <div className="pt-3 text-center bg-white border-2 border-gray-50 rounded-2xl p-6">
                            <span className="text-[11px] font-black uppercase text-gray-900 block mb-1">For HARIHAR PRINTERS</span>
                            <div className="h-12"></div> {/* Signature Space */}
                            <div className="border-t border-gray-200 pt-2 mx-4">
                                <span className="text-[10px] font-black uppercase text-blue-700 tracking-widest block">Authorised Signatory</span>
                            </div>
                        </div>
                   </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-20 pt-6 border-t border-gray-100 flex justify-between items-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Professionally Generated via Harihar CRM Platform</p>
                    <div className="flex gap-4">
                        <Phone size={10} className="text-blue-500" />
                        <Mail size={10} className="text-blue-500" />
                        <Globe size={10} className="text-blue-500" />
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
