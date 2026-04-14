import React, { useState, useEffect } from 'react';
import { 
  FileLock, 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  Calendar, 
  User, 
  Hash, 
  ArrowDownCircle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const Statements = () => {
  const [statements, setStatements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    partyName: '',
    amount: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stmtRes, invRes, payRes] = await Promise.all([
        fetch('http://localhost:5011/api/statements'),
        fetch('http://localhost:5011/api/invoice'),
        fetch('http://localhost:5011/api/payment-type')
      ]);

      const [stmtData, invData, payData] = await Promise.all([
        stmtRes.json(),
        invRes.json(),
        payRes.json()
      ]);

      setStatements(stmtData);
      setInvoices(invData);
      setPaymentTypes(payData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (invNum) => {
    const selectedInv = invoices.find(inv => inv.invoiceNumber === invNum);
    if (selectedInv) {
      setFormData({
        ...formData,
        invoiceNumber: invNum,
        partyName: selectedInv.partyName,
        amount: selectedInv.totalAmount - (selectedInv.paidAmount || 0)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5011/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Payment Logged Successfully!' });
        setIsAdding(false);
        setFormData({ invoiceNumber: '', partyName: '', amount: '', paymentMethod: '', date: new Date().toISOString().split('T')[0], notes: '' });
        fetchData();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Failed to log payment' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server Error' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will also update the invoice balance.")) return;
    try {
      const res = await fetch(`http://localhost:5011/api/statements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const filteredStatements = statements.filter(s => 
    s.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
            isAdding ? 'bg-gray-100 text-gray-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isAdding ? 'Back to View' : <><Plus size={18} /> Log New Payment</>}
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' : 'bg-red-50 text-red-700 border border-red-100 shadow-sm'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          <span className="font-black uppercase tracking-wider text-xs">{message.text}</span>
        </div>
      )}

      {isAdding ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform animate-in slide-in-from-bottom-5 duration-500">
            <div className="p-8 border-b border-gray-50 bg-emerald-50/30 flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <ArrowDownCircle size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-gray-900 leading-none">Record Payment</h2>
                  <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] mt-2">Update Invoice Status</p>
               </div>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Select Invoice</label>
                  <select 
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                  >
                    <option value="">-- Choose Invoice --</option>
                    {invoices.map(inv => (
                      <option key={inv._id} value={inv.invoiceNumber}>
                        {inv.invoiceNumber} - {inv.partyName} (Bal: ₹{inv.totalAmount - (inv.paidAmount || 0)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Amount Received</label>
                  <input 
                    type="number" required
                    placeholder="₹ 0.00"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Payment Method</label>
                  <select 
                    required
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    <option value="">-- Method --</option>
                    {paymentTypes.map(pt => (
                      <option key={pt._id} value={pt.name}>{pt.name}</option>
                    ))}
                    <option value="Cash">Cash</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Payment Date</label>
                  <input 
                    type="date" required
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Reference / Notes</label>
                <textarea 
                  rows="3"
                  placeholder="e.g. Transaction ID, Check number..."
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 flex items-center justify-center gap-3">
                  <CheckCircle2 size={24} />
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
               <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <CreditCard size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Received</p>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">₹{statements.reduce((acc, s) => acc + s.amount, 0).toLocaleString()}</h3>
               </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
               <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                  <AlertCircle size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Balance</p>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">₹{invoices.reduce((acc, inv) => acc + (inv.totalAmount - (inv.paidAmount || 0)), 0).toLocaleString()}</h3>
               </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 group hover:shadow-md transition-all">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Calendar size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Transactions</p>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{statements.length} Logged</h3>
               </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                Transaction History
              </h2>
              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Party Name or Invoice #"
                  className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                    <th className="px-8 py-5">Date & Reference</th>
                    <th className="px-8 py-5">Party Name</th>
                    <th className="px-8 py-5">Method</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="5" className="px-8 py-32 text-center text-gray-400 font-bold animate-pulse uppercase tracking-[0.3em]">Processing Records...</td></tr>
                  ) : filteredStatements.length === 0 ? (
                    <tr><td colSpan="5" className="px-8 py-32 text-center text-gray-400 italic font-medium">No transactions found for your criteria.</td></tr>
                  ) : (
                    filteredStatements.map((item) => (
                      <tr key={item._id} className="hover:bg-emerald-50/10 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-gray-100 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                 <Calendar size={20} />
                              </div>
                              <div>
                                 <p className="font-black text-gray-900 text-sm">{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                 <div className="flex items-center gap-1.5 mt-1">
                                    <Hash size={10} className="text-gray-400" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.invoiceNumber}</span>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              <User size={14} className="text-gray-400" />
                              <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{item.partyName}</p>
                           </div>
                           {item.notes && <p className="text-[10px] text-gray-400 italic mt-1 font-medium">{item.notes}</p>}
                        </td>
                        <td className="px-8 py-6">
                           <span className="inline-flex items-center px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-blue-100">
                             {item.paymentMethod}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <p className="text-lg font-black text-gray-900 tracking-tight">₹{item.amount.toLocaleString()}</p>
                           <p className="text-[10px] font-black text-emerald-600 uppercase mt-0.5 tracking-tighter">Verified Inflow</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex justify-center">
                              <button 
                                onClick={() => handleDelete(item._id)}
                                className="p-3 text-red-400 hover:text-white hover:bg-red-500 rounded-2xl transition-all shadow-sm hover:shadow-red-200"
                              >
                                <Trash2 size={18} />
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
        </div>
      )}
    </div>
  );
};

export default Statements;
