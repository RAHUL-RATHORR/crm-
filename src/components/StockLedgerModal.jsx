import React, { useState, useEffect } from 'react';
import { X, Calendar, ArrowUpCircle, ArrowDownCircle, Info, Hash, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiBase';

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const StockLedgerModal = ({ stockId, stockName, onClose }) => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stockId) return;

    const fetchLedger = async () => {
      try {
        setLoading(true);
        const url = `${API_BASE_URL}/api/paper-stock/${stockId}/ledger`;
        const res = await fetch(url);
        if (!res.ok) {
          const errText = await res.text();
          console.error(`Ledger fetch failed for ${url}: ${res.status} ${res.statusText}`, errText);
          throw new Error(`Failed to load ledger: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setLedger(data);
      } catch (err) {
        console.error('Ledger fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, [stockId]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Stock Ledger</h2>
            <p className="text-sm font-bold text-indigo-600 mt-1 uppercase tracking-wider">{stockName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-indigo-500">
              <Loader2 size={32} className="animate-spin mb-3" />
              <p className="font-bold">Loading ledger history...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold text-center border border-red-100">
              {error}
            </div>
          ) : ledger.length === 0 ? (
            <div className="text-center text-gray-500 italic py-10 font-medium">
              No transactions found for this stock.
            </div>
          ) : (
            <div className="space-y-4">
              {ledger.map((item, index) => {
                const isAdd = item.transactionType === 'add';
                const isRestore = item.note && item.note.toLowerCase().includes('restore');
                
                let icon = <ArrowDownCircle size={18} className="text-red-500" />;
                let badgeClass = "bg-red-50 text-red-700 ring-red-200";
                let typeLabel = "DEDUCTED";
                let qtyPrefix = "-";

                if (isAdd) {
                  icon = <ArrowUpCircle size={18} className={isRestore ? "text-amber-500" : "text-emerald-500"} />;
                  badgeClass = isRestore ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200";
                  typeLabel = isRestore ? "RESTORED" : "ADDED";
                  qtyPrefix = "+";
                }

                return (
                  <div key={item._id || index} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all bg-gray-50/30 group">
                    
                    {/* Left block: Icon & Date */}
                    <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:w-40 shrink-0">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ring-1 ${badgeClass}`}>
                          {typeLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mt-0 sm:mt-1">
                        <Calendar size={12} />
                        {formatDateTime(item.createdAt)}
                      </div>
                    </div>

                    {/* Middle block: Details */}
                    <div className="flex-1 flex flex-col justify-center">
                      {item.jobNumber ? (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-700 mb-1">
                          <Hash size={14} />
                          Job Card: {item.jobNumber}
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-700 mb-1">
                          Direct Update
                        </div>
                      )}
                      
                      {item.note && (
                        <div className="flex items-start gap-1.5 text-xs font-medium text-gray-500">
                          <Info size={14} className="shrink-0 mt-0.5 opacity-70" />
                          <p>{item.note}</p>
                        </div>
                      )}
                    </div>

                    {/* Right block: Quantity & Balance */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 sm:w-32 shrink-0 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
                      <div className={`text-base sm:text-lg font-black ${isAdd ? (isRestore ? 'text-amber-600' : 'text-emerald-600') : 'text-red-500'}`}>
                        {qtyPrefix}{item.quantity?.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Balance: <span className="text-gray-700 text-xs">{item.balanceAfter?.toLocaleString() || '---'}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockLedgerModal;
