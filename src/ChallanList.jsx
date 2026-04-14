import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Truck, Pencil, ChevronDown, Check, Printer, X, Download, Phone, Mail, Globe, Building2, MapPin, Calendar, FileDigit } from 'lucide-react';
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
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-xs font-bold transition-all shadow-sm ${(ch.paymentStatus === 'Completed') ? 'bg-emerald-500' : 'bg-orange-500'
                              }`}
                          >
                            {ch.paymentStatus === 'Completed' ? 'Completed' : 'Pending'}
                          </button>
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
            <div className="p-4 sm:p-8 overflow-y-auto flex-grow bg-gray-50">
              <div 
                id="printable-challan"
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
                    Delivery Challan
                  </div>
                </div>

                {/* Top Info Grid - Exact Job Card Layout */}
                <div className="grid grid-cols-1 gap-y-3 mb-4">
                  <div className="border-b pb-1 flex items-center gap-2" style={{ borderColor: '#cbd5e1' }}>
                    <Building2 size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-28 opacity-60">Party Name:</span>
                    <span className="flex-grow font-bold text-sm" style={{ color: '#000000' }}>{selectedChallan.partyName}</span>
                  </div>
                  <div className="border-b pb-1 flex items-center gap-2" style={{ borderColor: '#cbd5e1' }}>
                    <MapPin size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-28 opacity-60">Address:</span>
                    <span className="flex-grow font-bold text-xs" style={{ color: '#000000' }}>Rewari, Haryana, India</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-6">
                  <div className="border-b pb-1 flex items-center gap-2 col-span-1" style={{ borderColor: '#cbd5e1' }}>
                    <Phone size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-16 opacity-60">Contact:</span>
                    <span className="flex-grow font-bold text-xs" style={{ color: '#000000' }}>-</span>
                  </div>
                  <div className="border-b pb-1 flex items-center gap-2 col-span-1" style={{ borderColor: '#cbd5e1' }}>
                    <FileDigit size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-16 opacity-60">CH NO:</span>
                    <span className="flex-grow font-bold text-sm text-blue-700" style={{ color: '#1d4ed8' }}>{selectedChallan.challanNo}</span>
                  </div>
                  <div className="border-b pb-1 flex items-center gap-2 col-span-1" style={{ borderColor: '#cbd5e1' }}>
                    <Calendar size={13} style={{ color: '#3b82f6' }} />
                    <span className="text-[9px] font-bold uppercase w-12 opacity-60">Date:</span>
                    <span className="flex-grow font-bold text-xs" style={{ color: '#000000' }}>{new Date(selectedChallan.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                {/* Delivery Table */}
                <div className="mt-8 border-t-2 pt-4" style={{ borderColor: '#3b82f6' }}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-blue-50/50 uppercase text-[10px] font-black tracking-wider text-blue-900 border-b" style={{ borderColor: '#bfdbfe' }}>
                        <th className="px-4 py-3">S.No</th>
                        <th className="px-4 py-3">Description of Goods</th>
                        <th className="px-4 py-3 text-center">Job Card</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="text-gray-900 border-b" style={{ borderColor: '#f1f5f9' }}>
                        <td className="px-4 py-5 text-xs font-bold text-gray-400">01</td>
                        <td className="px-4 py-5">
                          <p className="text-xs font-black uppercase">{selectedChallan.jobName}</p>
                          <p className="text-[9px] text-gray-400 font-medium italic">Premium Delivery Item</p>
                        </td>
                        <td className="px-4 py-5 text-center text-[11px] font-bold">#{selectedChallan.jobNumber}</td>
                        <td className="px-4 py-5 text-right text-sm font-black text-blue-700">1 Unit</td>
                      </tr>
                      {/* Blank rows for spacing */}
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="h-10 border-b opacity-5" style={{ borderColor: '#e2e8f0' }}><td colSpan="4"></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Signature Section - Styled like Job Card */}
                <div className="mt-12 flex justify-between gap-10">
                  <div className="w-1/2 p-6 border-2 border-gray-100 rounded-3xl border-dashed bg-gray-50/30">
                     <p className="text-[10px] font-black text-blue-300 uppercase mb-10 tracking-widest pl-1">Receiver's Seal & Signature</p>
                     <div className="flex justify-between items-center text-[8px] font-bold text-gray-300 italic">
                        <span>Received above goods in perfect condition.</span>
                     </div>
                  </div>
                  <div className="w-1/3 pt-10">
                    <div className="border-t-2 pt-2 text-center" style={{ borderColor: '#1e293b' }}>
                      <p className="text-[10px] font-black uppercase" style={{ color: '#1e293b' }}>Authorized Signatory</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Sneha Graphics Solutions</p>
                    </div>
                  </div>
                </div>

                {/* Branded Footer Icons */}
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
                    <span className="text-[8px] italic opacity-40 block" style={{ color: '#000000' }}>Automatically generated by TRICKWRIC CRM</span>
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
