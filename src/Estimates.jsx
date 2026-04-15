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
  FileCheck
} from 'lucide-react';

export default function Estimates() {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [prices, setPrices] = useState({}); // Local state for pricing inputs

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
    setUpdatingId(id);
    try {
      const response = await fetch(`https://crm-qpw8.onrender.com/api/jobcard/${id}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: Number(prices[id]) })
      });
      
      if (response.ok) {
        // Show success briefly
        const btn = document.getElementById(`save-btn-${id}`);
        if(btn) {
          const originalContent = btn.innerHTML;
          btn.innerHTML = 'Saved!';
          btn.classList.replace('bg-blue-600', 'bg-green-600');
          setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.replace('bg-green-600', 'bg-blue-600');
            setUpdatingId(null);
          }, 2000);
        }
      } else {
        alert("Failed to update price");
        setUpdatingId(null);
      }
    } catch (error) {
      console.error("Update Error:", error);
      alert("Network Error");
      setUpdatingId(null);
    }
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
                    <td className="py-6 px-8 text-center">
                      <button
                        id={`save-btn-${card._id}`}
                        onClick={() => updatePrice(card._id)}
                        disabled={updatingId === card._id}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:bg-gray-400 disabled:shadow-none"
                      >
                        {updatingId === card._id ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : (
                            <Save size={14} />
                        )}
                        Update Price
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
