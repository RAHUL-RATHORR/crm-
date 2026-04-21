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
                className="bg-white mx-auto shadow-none a4-page"
              >
                {/* Refined Traditional GST Delivery Challan Layout */}
                <div className="border-[1px] border-black p-0 text-black leading-tight font-sans" style={{ minHeight: '1050px', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Top Badge */}
                  <div className="flex justify-center -mt-3 mb-1">
                    <span className="bg-black text-white px-8 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] border border-black">
                      Delivery Challan
                    </span>
                  </div>

                  {/* Top Branding Section */}
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
                        <p>Email : hariharprinters1@gmail.com</p>
                        <p>Ph.: 0141-2600850 ● Mob.: 9314130859, 9414043763</p>
                      </div>
                    </div>
                    <div className="w-5/12 text-[9px] font-bold border-l border-black pl-3 pt-2 relative">
                       {/* Copy info box */}
                       <div className="absolute top-1 right-2 border border-black p-0.5 text-[7px] font-black leading-tight text-right uppercase bg-white">
                         <p>WHITE - ORIGINAL</p>
                         <p>GREEN - DUPLICATE</p>
                         <p>WHITE - OFFICE COPY</p>
                       </div>

                       <table className="w-full border-collapse mt-10">
                          <tbody>
                            <tr className="h-5">
                              <td className="w-24">Challan No.</td>
                              <td className="border-b border-black uppercase text-[10px] font-black">{selectedChallan.challanNo}</td>
                              <td className="w-8 text-center px-1">Date</td>
                              <td className="border-b border-black w-24 text-right px-1">{new Date(selectedChallan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                            </tr>
                            <tr className="h-5">
                              <td>Order No.</td>
                              <td className="border-b border-black"></td>
                              <td className="text-center px-1">Date</td>
                              <td className="border-b border-black"></td>
                            </tr>
                            <tr className="h-5">
                              <td>Veh. No.</td>
                              <td className="border-b border-black"></td>
                              <td className="text-center px-1">Date</td>
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
                      <div className="bg-gray-100 border-b border-black px-2 py-0.5 text-[9px] font-bold italic uppercase">Challan to Party</div>
                      <div className="p-3 space-y-2 flex-grow">
                        <div className="flex items-start">
                          <span className="text-[10px] font-bold mr-1">M/s.</span>
                          <span className="text-xs font-black uppercase underline decoration-dotted underline-offset-4">{selectedChallan.partyName}</span>
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
                      <div className="bg-gray-100 border-b border-black px-2 py-0.5 text-[9px] font-bold italic uppercase">Place of Supply</div>
                      <div className="p-3 space-y-2 flex-grow">
                        <div className="flex items-start">
                          <span className="text-[10px] font-bold mr-1">M/s.</span>
                          <span className="text-xs font-black uppercase underline decoration-dotted underline-offset-4">{selectedChallan.partyName}</span>
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

                  {/* Instruction Message */}
                  <div className="px-4 py-2 text-[9px] font-bold border-b border-black leading-tight">
                    Kindly Count the following Material in presence our delegate. We are not responsible any complete in later. Please return one copy with our signature.
                  </div>

                  {/* Main Items Table */}
                  <div className="flex-grow overflow-hidden flex flex-col border-x border-black border-b border-black">
                    <table className="w-full border-collapse font-sans">
                      <thead>
                        <tr className="bg-gray-100 text-[9px] font-black border-b border-black text-center">
                          <th className="border-r border-black w-12 py-1">S.No</th>
                          <th className="border-r border-black py-1 px-4 text-black">Description of Goods</th>
                          <th className="border-r border-black w-28 py-1">HSN/SAC Code</th>
                          <th className="w-24 py-1">Qty.</th>
                        </tr>
                      </thead>
                      <tbody className="flex-grow">
                        <tr className="text-[10px] font-bold h-10">
                          <td className="border-r border-black text-center">1</td>
                          <td className="border-r border-black px-4 uppercase leading-relaxed font-black text-black">
                            {selectedChallan.jobName}
                            <div className="text-[8px] font-black text-gray-600 mt-0.5 tracking-wider">JOB CARD NO: {selectedChallan.jobNumber}</div>
                          </td>
                          <td className="border-r border-black text-center">4911</td>
                          <td className="text-center font-black text-xs text-black">{selectedChallan.qty}</td>
                        </tr>
                        {/* Empty spacing rows with vertical lines only */}
                        {[...Array(18)].map((_, i) => (
                          <tr key={`empty-${i}`} className="h-10">
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Section */}
                  <div className="mt-auto border-t border-black p-4 pt-6">
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="w-48 text-center flex flex-col items-center">
                        <div className="h-12"></div>
                        <div className="border-t border-black w-full mb-1"></div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Receiver's Signature</span>
                      </div>
                      <div className="w-56 text-right flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase mb-10 w-full text-right pr-4 text-black">For Harihar Printers</p>
                        <div className="border-t border-black w-full mb-1"></div>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-black">Authorised Signatory</span>
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

export default ChallanList;
