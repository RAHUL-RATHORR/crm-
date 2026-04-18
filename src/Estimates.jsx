import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Calculator,
  Check,
  AlertCircle,
  IndianRupee,
  Save,
  List,
  FileCheck,
  Printer,
  X,
  Phone,
  Mail
} from 'lucide-react';

export default function Estimates() {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [prices, setPrices] = useState({}); // Local state for pricing inputs
  const [saveStatus, setSaveStatus] = useState({}); // { id: 'idle' | 'saving' | 'saved' | 'error' }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://crm-qpw8.onrender.com/api/jobcard");
      const data = await response.json();
      setJobCards(data);

      // Initialize local price state from db data
      const initialPrices = {};
      data.forEach(card => {
        initialPrices[card._id] = card.totalAmount || 0;
      });
      setPrices(initialPrices);
    } catch (error) {
      console.error("Error loading job cards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePriceChange = (id, value) => {
    setPrices(prev => ({ ...prev, [id]: value }));
  };

  const updatePrice = async (id) => {
    const priceValue = prices[id];

    // Simple validation
    if (priceValue === undefined || priceValue === null || isNaN(Number(priceValue))) {
      alert("Please enter a valid price number");
      return;
    }

    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));

    try {
      const response = await fetch(`https://crm-qpw8.onrender.com/api/jobcard/${id}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: Number(priceValue) })
      });

      if (response.ok) {
        setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
        // Reset to idle after 3 seconds
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
        }, 3000);
      } else {
        alert("Failed to update price on server");
        setSaveStatus(prev => ({ ...prev, [id]: 'error' }));
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Network Error: Could not connect to the server.");
      setSaveStatus(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const handlePrint = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const executePrint = () => {
    window.scrollTo(0, 0);
    const container = document.querySelector('.a4-page-container');
    if (container) container.scrollTop = 0;
    window.print();
  };

  const filteredCards = jobCards.filter(card =>
    card.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.jobName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-4 mt-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <div className="bg-orange-600 w-2 h-8 rounded-full" />
            Estimate & Quotation
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic text-sm">Review job details and set final pricing for quotations.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <Calculator size={18} />
          </div>
          <span className="text-sm font-bold text-gray-700">Total Jobs: {jobCards.length}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-t-3xl border-x border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Party Name or Job Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 text-sm transition-all"
          />
        </div>
        <button
          onClick={loadData}
          className="p-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-all border border-gray-100 active:rotate-180 duration-500 group"
        >
          <RefreshCw size={20} className="group-active:scale-90" />
        </button>
      </div>

      <div className="bg-white rounded-b-3xl shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black uppercase text-gray-900 tracking-[0.2em] border-b border-gray-200">
                <th className="py-5 px-8">S.No.</th>
                <th className="py-5 px-8">Job Details</th>
                <th className="py-5 px-8">Party Name</th>
                <th className="py-5 px-8">Dimensions / Qty</th>
                <th className="py-5 px-8 text-center bg-orange-50/50 text-orange-700">Estimate Price (₹)</th>
                <th className="py-5 px-8 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-orange-500" size={32} />
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Fetching Accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-gray-400 italic">
                    No active job cards found to quote.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card, index) => (
                  <tr key={card._id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="py-6 px-8 text-gray-400 font-bold">{index + 1}</td>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                          <FileCheck size={20} />
                        </div>
                        <div>
                          <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ring-1 ring-orange-100">
                            {card.jobNumber}
                          </span>
                          <p className="text-gray-900 font-black mt-1">{new Date(card.jobDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <p className="font-bold text-gray-900">{card.partyName}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5 tracking-tight">{card.address || 'No Address'}</p>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Size:</span>
                          <span className="text-xs font-bold text-gray-700">{card.pageSize || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Qty:</span>
                          <span className="text-xs font-black text-blue-600">{card.jobQty || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8 bg-orange-50/30">
                      <div className="relative max-w-[150px] mx-auto">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                        <input
                          type="number"
                          value={prices[card._id] || ''}
                          onChange={(e) => handlePriceChange(card._id, e.target.value)}
                          className="w-full pl-8 pr-4 py-2 bg-white border border-orange-200 rounded-xl font-black text-orange-700 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-center"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="py-6 px-8 text-center flex items-center justify-center gap-3">
                      <button
                        onClick={() => handlePrint(card)}
                        className="p-2.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                        title="Print Quotation"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={() => updatePrice(card._id)}
                        disabled={saveStatus[card._id] === 'saving'}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:shadow-none ${saveStatus[card._id] === 'saved'
                          ? 'bg-green-600 text-white shadow-green-100'
                          : saveStatus[card._id] === 'error'
                            ? 'bg-red-600 text-white shadow-red-100'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                          }`}
                      >
                        {saveStatus[card._id] === 'saving' ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : saveStatus[card._id] === 'saved' ? (
                          <Check size={14} />
                        ) : (
                          <Save size={14} />
                        )}
                        {saveStatus[card._id] === 'saving'
                          ? 'Saving...'
                          : saveStatus[card._id] === 'saved'
                            ? 'Saved!'
                            : 'Update Price'
                        }
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Print Preview Modal */}
      {isModalOpen && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-none">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <h2 className="text-xl font-bold text-gray-800">Quotation Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={executePrint}
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
                id="printable-inner"
                className="bg-white mx-auto shadow-none a4-page"
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
                    <div className="bg-blue-600 text-white px-6 py-1.5 rounded text-[11px] font-black uppercase tracking-widest shadow-sm">
                      QUOTATION
                    </div>
                    <div className="text-[9px] font-black text-gray-500 uppercase flex flex-col gap-1 mt-2 tracking-wide">
                      <span>GSTIN: <span className="text-gray-900 border-b-2 border-gray-100 pb-0.5 ml-1">08AALPC9959M1ZV</span></span>
                      <span>PAN: <span className="text-gray-900 border-b-2 border-gray-100 pb-0.5 ml-1">AALPC9959M</span></span>
                    </div>
                  </div>
                </div>

                {/* Top Info Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Party Name</span>
                    <span className="text-sm font-black text-gray-900 leading-tight uppercase">{selectedCard.partyName}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Date</span>
                    <span className="text-sm font-black text-gray-900">{new Date(selectedCard.jobDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="col-span-1 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Address</span>
                    <span className="text-[10px] font-bold text-gray-600 uppercase">{selectedCard.address || 'Address Not Provided'}</span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-6 text-right">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Contact</span>
                      <span className="text-[10px] font-bold text-gray-900">{selectedCard.contactNo || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Job Qty</span>
                      <span className="text-[10px] font-black text-blue-600">{selectedCard.jobQty || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-2 gap-x-10">
                  {/* Left Section - Production Details */}
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-black uppercase text-blue-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                        <Calculator size={12} /> Production Specs
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: 'Job Number', value: selectedCard.jobNumber, bold: true, color: 'text-blue-700' },
                          { label: 'Job Name', value: selectedCard.jobName, uppercase: true },
                          { label: 'Paper Size', value: selectedCard.pageSize || '-' },
                          { label: 'Color Detail', value: selectedCard.printingType || '-' },
                          { label: 'Quotation Amount', value: `₹ ${Number(prices[selectedCard._id] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, bold: true, color: 'text-blue-700', bg: 'bg-blue-50/50 p-1.5' }
                        ].map((row, i) => (
                          <div key={i} className={`flex justify-between items-end gap-2 text-[11px] border-b border-gray-100 pb-2 ${row.bg || ''} rounded`}>
                            <span className="font-bold uppercase text-gray-400 min-w-fit">{row.label}</span>
                            <span className={`text-right ${row.bold ? 'font-black' : 'font-bold'} ${row.color || 'text-gray-900'} ${row.uppercase ? 'uppercase' : ''}`}>
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] font-black uppercase text-cyan-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                        <List size={12} /> Paper & Stock
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase block">Source</span>
                          <div className={`px-2 py-1 rounded border text-[10px] font-black text-center uppercase ${selectedCard.paperSource === 'Company paper' ? 'bg-cyan-50 border-cyan-100 text-cyan-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                            {selectedCard.paperSource || 'Company paper'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-gray-400 uppercase block">Page & GSM</span>
                          <div className="text-[11px] font-bold text-gray-900 border-b border-gray-100 pb-2">
                            C: {selectedCard.coverPaperCount || 0} ({selectedCard.paperGSM || '-'}) / I: {selectedCard.innerPaperCount || 0} ({selectedCard.innerPaperGSM || '-'})
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 border-t border-gray-50 pt-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-gray-400 uppercase">Paper Type</span>
                          <span className="font-bold text-gray-900 uppercase">{selectedCard.paper || '-'}</span>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Right Section */}
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                        <Printer size={12} /> Press Details
                      </h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        {[
                          { label: 'Compose', value: selectedCard.compose || 'No' },
                          { label: 'Design', value: selectedCard.design || 'No' },
                          { label: 'Plate Type', value: selectedCard.plateType || 'New' },
                          { label: 'Plate Number', value: selectedCard.plateNumber || '-' },
                          { label: 'Plate Qty', value: selectedCard.plateQty || 0 },
                          { label: 'Lamination', value: selectedCard.lamination || '-' }
                        ].map((row, i) => (
                          <div key={i} className="flex flex-col gap-1 border-b border-gray-100 pb-2.5">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">{row.label}</span>
                            <span className="text-[11px] font-bold text-gray-900 leading-tight">{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Printing Quantity</span>
                        <span className="text-xl font-black text-indigo-700">{selectedCard.printingQty || 0}</span>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] font-black uppercase text-rose-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} /> Quotation Terms
                      </h4>
                      <div className="border border-rose-100 p-4 rounded-xl bg-rose-50/20 min-h-[80px]">
                        <p className="text-[10px] italic leading-relaxed text-gray-700 font-medium">
                          {selectedCard.notes || 'Note: Prices are valid for 7 days. Taxes extras as applicable unless mentioned.'}
                        </p>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Footer Signatory Area */}
                <div className="mt-10 pt-10 grid grid-cols-2 gap-4 border-t border-gray-100 border-dashed">
                  <div className="text-center">
                    <div className="w-16 h-1 border-b border-gray-300 mx-auto mb-2"></div>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Customer Signature</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-1 border-b border-gray-300 mx-auto mb-2"></div>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">For Harihar Printers</span>
                  </div>
                </div>

                {/* Branding Footer */}
                <div className="mt-12 pt-4 border-t border-gray-100 flex justify-between items-center px-2">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Harihar Printers • Production System</p>
                  <div className="flex gap-4">
                    <p className="text-[8px] font-black text-gray-300 uppercase letter-spacing-1">Original</p>
                    <p className="text-[8px] font-black text-gray-300 uppercase letter-spacing-1">Duplicate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
