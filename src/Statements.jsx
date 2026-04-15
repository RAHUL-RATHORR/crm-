import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CreditCard, 
  Calendar, 
  User, 
  Hash, 
  ArrowDownCircle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  FileText,
  IndianRupee,
  Clock,
  TrendingUp
} from 'lucide-react';

const Statements = () => {
  const [statements, setStatements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('1m'); 
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'invoices'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stmtRes, invRes] = await Promise.all([
        fetch('https://crm-qpw8.onrender.com/api/statements'),
        fetch('https://crm-qpw8.onrender.com/api/invoice'),
      ]);
      const [stmtData, invData] = await Promise.all([
        stmtRes.json(),
        invRes.json(),
      ]);
      setStatements(stmtData);
      setInvoices(invData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This will also update the invoice balance.")) {
      try {
        const res = await fetch(`https://crm-qpw8.onrender.com/api/statements/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
      } catch (err) {
        console.error("Delete Error:", err);
      }
    }
  };

  const filteredStatements = statements.filter(s => {
    const matchesSearch = s.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (dateFilter === 'all') return true;

    const stmtDate = new Date(s.date);
    const now = new Date();
    now.setHours(0,0,0,0);
    const diffDays = (now - stmtDate) / (1000 * 60 * 60 * 24);

    switch(dateFilter) {
      case '1v': return diffDays <= 7 && diffDays >= 0;
      case '1m': return diffDays <= 30 && diffDays >= 0;
      case '3m': return diffDays <= 90 && diffDays >= 0;
      case '6m': return diffDays <= 180 && diffDays >= 0;
      case '12m': return diffDays <= 365 && diffDays >= 0;
      case 'custom': 
        if (!customRange.start || !customRange.end) return true;
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        return stmtDate >= start && stmtDate <= end;
      default: return true;
    }
  });

  // Only show fully paid invoices in statements
  const filteredInvoices = invoices.filter(inv => {
    const balance = (inv.totalAmount || 0) - (inv.paidAmount || 0);
    const isPaid = balance <= 0 && (inv.paidAmount || 0) > 0;
    const matchesSearch = inv.partyName?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                          inv.invoiceNumber?.toLowerCase().includes(invoiceSearch.toLowerCase());
    return isPaid && matchesSearch;
  });

  // Summary stats
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalPending = totalInvoiced - totalCollected;

  const getStatusBadge = (inv) => {
    const balance = inv.totalAmount - (inv.paidAmount || 0);
    if (balance <= 0) return { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' };
    if ((inv.paidAmount || 0) > 0) return { label: 'Partial', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' };
    return { label: 'Pending', bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' };
  };

  return (
    <div className="w-full px-4 mt-8 pb-12 text-gray-800 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <div className="bg-emerald-600 w-2 h-8 rounded-full" />
            Financial Statements
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium italic">Track payment records, invoice balances, and revenue logs.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <TrendingUp size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Invoiced</p>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">₹{totalInvoiced.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <CreditCard size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Collected</p>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">₹{totalCollected.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
            <Clock size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Balance Pending</p>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">₹{totalPending.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'transactions'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-400'
          }`}
        >
          <CreditCard size={16} />
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-400'
          }`}
        >
          <FileText size={16} />
          Invoice Statements
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'invoices' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {invoices.length}
          </span>
        </button>
      </div>

      {/* TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Date Filter */}
              <div className="relative w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:border-emerald-500 transition-all min-w-[150px] justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-500" />
                    <span>
                      {dateFilter === 'custom' ? 'Custom Range' :
                       dateFilter === '1v' ? 'Last Week' :
                       dateFilter === '1m' ? 'Last Month' :
                       dateFilter === '3m' ? 'Last 3 Months' :
                       dateFilter === '6m' ? 'Last 6 Months' :
                       'Last 12 Months'}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {isFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2">
                    {[
                      { id: 'custom', label: 'Custom Range' },
                      { id: '1v', label: 'Last Week' },
                      { id: '1m', label: 'Last Month' },
                      { id: '3m', label: 'Last 3 Months' },
                      { id: '6m', label: 'Last 6 Months' },
                      { id: '12m', label: 'Last 12 Months' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setDateFilter(opt.id); setIsFilterOpen(false); }}
                        className={`flex items-center justify-between w-full px-5 py-2.5 text-sm font-medium hover:bg-emerald-50 ${
                          dateFilter === opt.id ? 'text-emerald-600 font-bold' : 'text-gray-600'
                        }`}
                      >
                        {opt.label}
                        {dateFilter === opt.id && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <input type="date" className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    value={customRange.start}
                    onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                    onClick={(e) => { try { e.target.showPicker(); } catch(_) {} }}
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="date" className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    value={customRange.end}
                    onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                    onClick={(e) => { try { e.target.showPicker(); } catch(_) {} }}
                  />
                </div>
              )}

              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                  <th className="px-8 py-4">Date & Reference</th>
                  <th className="px-8 py-4">Party Name</th>
                  <th className="px-8 py-4">Method</th>
                  <th className="px-8 py-4 text-right">Amount</th>
                  <th className="px-8 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="px-8 py-20 text-center text-gray-400 font-bold animate-pulse uppercase">Processing Records...</td></tr>
                ) : filteredStatements.length === 0 ? (
                  <tr><td colSpan="5" className="px-8 py-20 text-center text-gray-400 italic">No transactions found.</td></tr>
                ) : (
                  filteredStatements.map((item) => (
                    <tr key={item._id} className="hover:bg-emerald-50/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gray-100 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-sm">{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Hash size={9} className="text-gray-400" />
                              <span className="text-[10px] font-black text-emerald-600 uppercase">{item.invoiceNumber}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-gray-400" />
                          <p className="font-bold text-gray-900 text-sm">{item.partyName}</p>
                        </div>
                        {item.notes && <p className="text-[10px] text-gray-400 italic mt-0.5">{item.notes}</p>}
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase ring-1 ring-blue-100">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-base font-black text-gray-900">₹{item.amount?.toLocaleString()}</p>
                        <p className="text-[10px] font-black text-emerald-600 uppercase mt-0.5">Verified Inflow</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button onClick={() => handleDelete(item._id)}
                          className="p-2.5 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVOICE STATEMENTS TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Invoice Statements</h2>
              <p className="text-xs text-gray-400 mt-0.5">Showing only fully paid invoices</p>
            </div>
              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search invoices..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)}
                />
              </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                  <th className="px-8 py-4">Invoice #</th>
                  <th className="px-8 py-4">Party Name</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4 text-right">Total Amount</th>
                  <th className="px-8 py-4 text-right">Paid</th>
                  <th className="px-8 py-4 text-right">Balance Due</th>
                  <th className="px-8 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="7" className="px-8 py-20 text-center text-gray-400 font-bold animate-pulse uppercase">Loading Invoices...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr><td colSpan="7" className="px-8 py-20 text-center text-gray-400 italic">No completed invoices found.</td></tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const balance = (inv.totalAmount || 0) - (inv.paidAmount || 0);
                    const badge = getStatusBadge(inv);
                    return (
                      <tr key={inv._id} className="hover:bg-gray-50/60 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                              <FileText size={16} />
                            </div>
                            <span className="font-black text-indigo-700 text-sm">{inv.invoiceNumber}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <User size={13} className="text-gray-400" />
                            <p className="font-bold text-gray-900 text-sm">{inv.partyName}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-gray-500 text-sm">
                          {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="font-black text-gray-900 text-sm">₹{(inv.totalAmount || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="font-bold text-emerald-600 text-sm">₹{(inv.paidAmount || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className={`font-black text-sm ${balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            ₹{Math.max(0, balance).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ring-1 ${badge.bg} ${badge.text} ${badge.ring}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer totals */}
          {filteredInvoices.length > 0 && (
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-6 justify-end text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Total Invoiced:</span>
                <span className="font-black text-gray-900">₹{filteredInvoices.reduce((a, i) => a + (i.totalAmount || 0), 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Total Paid:</span>
                <span className="font-black text-emerald-600">₹{filteredInvoices.reduce((a, i) => a + (i.paidAmount || 0), 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">Total Due:</span>
                <span className="font-black text-red-500">₹{filteredInvoices.reduce((a, i) => a + Math.max(0, (i.totalAmount || 0) - (i.paidAmount || 0)), 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Statements;
