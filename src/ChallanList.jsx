import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Truck, Pencil, ChevronDown, Check, AlertCircle, Printer, X, Download, Phone, Mail, Globe, Building2, MapPin, Calendar, FileDigit } from 'lucide-react';
import { downloadAsPDF } from './utils/pdfExport';
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
    window.scrollTo(0, 0);
    const container = document.querySelector('.a4-page-container');
    if (container) container.scrollTop = 0;
    window.print();
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

          <div className="overflow-x-auto min-h-[400px] pb-40">
            <table className="w-full text-left whitespace-nowrap min-w-[800px]">
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
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-none">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <h2 className="text-xl font-bold text-gray-800">Challan Preview</h2>
              <div className="flex items-center gap-3">
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
            <div className="p-8 overflow-y-auto flex-grow a4-page-container" id="printable-content">
              <div
                id="printable-challan"
                className="bg-white mx-auto shadow-none a4-page font-sans"
                style={{ color: '#334155' }}
              >
                {/* Traditional Green/Teal Design - Matching Estimates */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-1" style={{ color: '#1e3a8a' }}>
                      Delivery Challan
                    </h1>
                    <div className="mt-2">
                      <h2 className="text-xl font-bold text-gray-800 tracking-tight">Harihar Printers</h2>
                      <p className="text-[10px] text-gray-700 font-medium italic">Your Vision, Our Print.</p>
                    </div>
                  </div>

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

                {/* --- ADDRESS SECTION --- */}
                <div className="flex justify-between gap-10 mb-8 px-1">
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Address :</h4>
                    <div className="text-[12px] space-y-1 font-medium text-gray-600">
                      <p className="font-bold text-gray-800">Harihar Printers</p>
                      <p>Office: J-97, Ashok Chowk, Adarsh Nagar, Jaipur</p>
                      <p>Factory: G-139, Hirawala Ind. Area, Kanota, Jaipur</p>
                      <p>Tel: +91 94140-43763</p>
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Deliver To :</h4>
                    <div className="text-[12px] space-y-1 font-medium text-gray-600">
                      <p className="font-bold uppercase text-xs" style={{ color: '#1e3a8a' }}>{selectedChallan.partyName}</p>
                      <p className="uppercase">{selectedChallan.partyName}</p>
                      <p>Jaipur, Rajasthan</p>
                      <p>Tel: Contact Provided</p>
                    </div>
                  </div>
                </div>

                {/* --- INFO BAR --- */}
                <div className="grid grid-cols-4 mb-8 border border-gray-200">
                  {[
                    { label: 'CHALLAN NO', value: selectedChallan.challanNo },
                    { label: 'JOB Number', value: selectedChallan.jobNumber },
                    { label: 'PAYMENT TERMS', value: '7 Days' },
                    { label: 'DATE', value: new Date(selectedChallan.createdAt).toLocaleDateString() }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 border-r border-gray-200 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <p className="text-[10px] font-black text-gray-600 uppercase mb-1" style={{ color: '#1e3a8a' }}>{item.label}</p>
                      <p className="text-[12px] font-bold text-gray-800 uppercase">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* --- ITEMS TABLE --- */}
                <div className="mb-8 border border-gray-200 rounded-sm overflow-hidden min-h-[350px] flex flex-col">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-white text-[12px] font-black uppercase tracking-widest" style={{ backgroundColor: '#1e3a8a' }}>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 w-24">Quantity</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30">Description of Goods</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 text-right w-28">Rate</th>
                        <th className="px-4 py-2.5 text-right w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 flex-grow">
                      <tr className="text-[13px] group">
                        <td className="px-4 py-8 border-r border-gray-50 font-bold align-top text-center text-gray-700">
                          {selectedChallan.qty} NOS
                        </td>
                        <td className="px-4 py-8 border-r border-gray-50 align-top">
                          <div className="space-y-1">
                            <p className="font-black text-gray-900 uppercase text-xs" style={{ color: '#1e3a8a' }}>{selectedChallan.jobName}</p>
                            <p className="text-[11px] text-gray-700 font-medium leading-relaxed italic uppercase">
                              Standard Printing Specifications / Job Ref: {selectedChallan.jobNumber}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-8 border-r border-gray-50 font-bold align-top text-right text-gray-700">
                          ₹ {(selectedChallan.total / (selectedChallan.qty || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-8 font-black align-top text-right text-gray-900 bg-gray-50/30">
                          ₹ {selectedChallan.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {/* Blank rows to fill space */}
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <tr key={i} className="border-0">
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
                    <div className="flex flex-col w-56 ml-auto border-l border-gray-200">
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-[11px] font-bold text-gray-700 uppercase">Sub Total</span>
                        <span className="text-[12px] font-bold text-gray-800">₹ {selectedChallan.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-[11px] font-bold text-gray-700 uppercase">GST</span>
                        <span className="text-[12px] font-bold text-gray-800">₹ 0.00</span>
                      </div>
                      <div className="flex justify-between px-4 py-3" style={{ backgroundColor: '#1e3a8a' }}>
                        <span className="text-[12px] font-black text-white uppercase tracking-wider">Total Amount</span>
                        <span className="text-sm font-black text-white">₹ {selectedChallan.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- FOOTER SECTION --- */}
                <div className="mt-8 text-[11px] text-gray-700 space-y-4">
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
