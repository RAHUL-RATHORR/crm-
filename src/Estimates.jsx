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
  Mail,
  Download,
  FileText
} from 'lucide-react';
import { downloadAsPDF } from './utils/pdfExport';

export default function Estimates() {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [prices, setPrices] = useState({}); // Local state for pricing inputs
  const [saveStatus, setSaveStatus] = useState({}); // { id: 'idle' | 'saving' | 'saved' | 'error' }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleDownloadPDF = async () => {
    if (!selectedCard) return;
    await downloadAsPDF(
      'printable-inner',
      `Quotation_${selectedCard.jobNumber}`,
      setIsGenerating
    );
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
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {isGenerating ? "..." : <Download size={18} />}
                  PDF
                </button>
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
                className="bg-white mx-auto shadow-none a4-page font-sans"
                style={{ color: '#334155' }}
              >
                {/* --- HEADER SECTION --- */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-1" style={{ color: '#5E9681' }}>
                      Computer Quotation
                    </h1>
                    <div className="mt-2">
                      <h2 className="text-xl font-bold text-gray-800 tracking-tight">Harihar Printers</h2>
                      <p className="text-[10px] text-gray-500 font-medium italic">Your Vision, Our Print.</p>
                    </div>
                  </div>

                  {/* Metadata Table */}
                  <div className="w-48 border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[10px]">
                      <tbody className="divide-y divide-gray-200">
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-500 uppercase">DATE :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800">
                            {new Date(selectedCard.jobDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5 font-bold text-gray-500 uppercase">Quote No :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800">{selectedCard.jobNumber}</td>
                        </tr>
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-500 uppercase">Expiration :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800">
                            {new Date(new Date(selectedCard.jobDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* --- ADDRESS SECTION --- */}
                <div className="flex justify-between gap-10 mb-8 px-1">
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Address :</h4>
                    <div className="text-[10px] space-y-0.5 font-medium text-gray-600">
                      <p className="font-bold text-gray-800">Harihar Printers</p>
                      <p>Office: J-97, Ashok Chowk, Adarsh Nagar, Jaipur</p>
                      <p>Factory: G-139, Hirawala Ind. Area, Kanota, Jaipur</p>
                      <p>Tel: +91 94140-43763</p>
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">To :</h4>
                    <div className="text-[10px] space-y-0.5 font-medium text-gray-600">
                      <p className="font-bold text-teal-800 uppercase text-xs">{selectedCard.partyName}</p>
                      <p className="uppercase">{selectedCard.address || 'Address Not Provided'}</p>
                      <p>GSTIN: {selectedCard.gstNumber || '-'}</p>
                      <p>Tel: {selectedCard.contactNo || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* --- INFO BAR --- */}
                <div className="grid grid-cols-4 mb-8 border border-gray-200">
                  {[
                    { label: 'SALES PERSON', value: 'Admin' },
                    { label: 'JOB Number', value: selectedCard.jobNumber },
                    { label: 'PAYMENT TERMS', value: '7 Days' },
                    { label: 'DUE DATE', value: new Date(selectedCard.jobDate).toLocaleDateString() }
                  ].map((item, i) => (
                    <div key={i} className={`p-2 border-r border-gray-200 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1" style={{ color: '#5E9681' }}>{item.label}</p>
                      <p className="text-[10px] font-bold text-gray-800">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* --- ITEMS TABLE --- */}
                <div className="mb-8 border border-gray-200 rounded-sm overflow-hidden min-h-[300px] flex flex-col">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-white text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: '#5E9681' }}>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 w-20">Quantity</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30">Description</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 text-right w-28">Unit Price</th>
                        <th className="px-4 py-2.5 text-right w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 flex-grow">
                      <tr className="text-[11px] group">
                        <td className="px-4 py-4 border-r border-gray-100 font-bold align-top text-center text-gray-700">
                          {selectedCard.jobQty}
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 align-top">
                          <div className="space-y-1">
                            <p className="font-black text-teal-900 uppercase text-xs">{selectedCard.jobName}</p>
                            <p className="text-[9px] text-gray-500 font-medium leading-relaxed italic">
                              Printing Specifications: {selectedCard.printingType || 'Full Color'} /
                              Size: {selectedCard.pageSize || 'Standard'} /
                              Paper: {selectedCard.paper || 'Premium Stock'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 font-bold align-top text-right text-gray-700">
                          ₹ {(Number(prices[selectedCard._id] || 0) / (selectedCard.jobQty || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 font-black align-top text-right text-gray-900">
                          ₹ {Number(prices[selectedCard._id] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {/* Blank rows to fill space */}
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-0">
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Total Calculation Section */}
                  <div className="border-t border-gray-200 mt-auto bg-gray-50/50">
                    <div className="flex flex-col w-56 ml-auto border-l border-gray-200">
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">Sub Total</span>
                        <span className="text-[10px] font-bold text-gray-800">₹ {Number(prices[selectedCard._id] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-[9px] font-bold text-gray-500 uppercase">GST (If applicable)</span>
                        <span className="text-[10px] font-bold text-gray-800">As per norms</span>
                      </div>
                      <div className="flex justify-between px-4 py-3" style={{ backgroundColor: '#5E9681' }}>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Total Amount</span>
                        <span className="text-xs font-black text-white">₹ {Number(prices[selectedCard._id] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- FOOTER SECTION --- */}
                <div className="mt-12 text-[9px] text-gray-500 space-y-4">
                  <p className="font-medium">This Quotation is prepared by: <span className="font-bold text-gray-800 ml-1">Admin @ Harihar Printers</span></p>

                  <div className="pt-8 grid grid-cols-2 gap-20">
                    <div className="border-t border-gray-300 pt-1">
                      <p className="font-bold uppercase tracking-widest text-[#5E9681]">Quotation accepted by :</p>
                    </div>
                    <div className="border-t border-gray-300 pt-1 text-right">
                      <p className="font-bold uppercase tracking-widest text-[#5E9681]">Authorised Signatory</p>
                    </div>
                  </div>

                  <p className="text-center pt-8 font-medium">
                    If you have any enquiries about this, please contact us on Tel: <span className="text-gray-900 font-bold">+91 0141-2600850, 94140-43763</span>
                  </p>


                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
