import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, AlertTriangle, Edit2, Trash2, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';

const PaperStockManagement = () => {
  const [stock, setStock] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    gsm: '',
    quantity: '',
    description: '',
    lowStockThreshold: 100
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const gsmGuide = [
    { type: 'Visiting Card', gsm: '300–350 GSM', paper: 'Art Card', icon: '📇' },
    { type: 'Brochure', gsm: '130–170 GSM', paper: 'Gloss/Matte', icon: '📖' },
    { type: 'Book', gsm: '70–100 GSM', paper: 'Offset', icon: '📚' },
    { type: 'Poster', gsm: '170–250 GSM', paper: 'Art Paper', icon: '🖼️' }
  ];

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch('https://crm-qpw8.onrender.com/api/paper-stock');
      const data = await res.json();
      setStock(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingId 
      ? `https://crm-qpw8.onrender.com/api/paper-stock/${editingId}`
      : 'https://crm-qpw8.onrender.com/api/paper-stock';
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: editingId ? 'Stock updated!' : 'Paper added to stock!' });
        setFormData({ name: '', gsm: '', quantity: '', description: '', lowStockThreshold: 100 });
        setIsAdding(false);
        setEditingId(null);
        fetchStock();
      } else {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error' });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      gsm: item.gsm,
      quantity: item.quantity,
      description: item.description || '',
      lowStockThreshold: item.lowStockThreshold || 100
    });
    setEditingId(item._id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this paper stock?")) return;
    try {
      await fetch(`https://crm-qpw8.onrender.com/api/paper-stock/${id}`, { method: 'DELETE' });
      fetchStock();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="w-full px-4 mt-8 pb-12 text-gray-800 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="bg-blue-600 w-2 h-8 rounded-full" />
            Paper Stock Management
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium italic">Track inventory and auto-deduct sheets from Job Cards.</p>
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
            isAdding ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isAdding ? 'Back to List' : <><Plus size={18} /> Add Stock Feed</>}
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      {isAdding ? (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Layers className="text-blue-600" size={20} />
                {editingId ? 'Edit Paper Stock' : 'Feed New Stock Entry'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Paper Name</label>
                    <input 
                      type="text" required
                      placeholder="e.g. Art Card, Glossy, Offset"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">GSM</label>
                    <input 
                      type="number" required
                      placeholder="e.g. 350, 130, 70"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                      value={formData.gsm}
                      onChange={(e) => setFormData({...formData, gsm: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Initial Sheet Count</label>
                    <input 
                      type="number" required
                      placeholder="e.g. 1200, 5000"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Low Stock Alert (Value)</label>
                    <input 
                      type="number" required
                      placeholder="Alert when below..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})}
                    />
                 </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 pl-1 tracking-widest">Description / Best Use</label>
                <textarea 
                  rows="3"
                  placeholder="Notes for the team..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3">
                  <CheckCircle2 size={20} />
                  {editingId ? 'Update Inventory' : 'Save To Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* GSM Guide Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gsmGuide.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Info size={14} />
                  </div>
                </div>
                <h3 className="font-black text-gray-900 uppercase text-xs tracking-wider">{item.type}</h3>
                <p className="text-xl font-black text-blue-600 mt-1">{item.gsm}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">{item.paper}</p>
              </div>
            ))}
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 underline decoration-blue-500 decoration-4 underline-offset-8">
                Current Inventory
              </h2>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search stock..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <th className="px-6 py-4">Paper Name & GSM</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-bold animate-pulse uppercase tracking-[0.2em]">Loading Inventory...</td></tr>
                  ) : stock.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-20 text-center text-gray-400 italic">No inventory records found. Feed new stock to start tracking.</td></tr>
                  ) : (
                    stock.map((item) => {
                      const isLow = item.quantity <= item.lowStockThreshold;
                      return (
                        <tr key={item._id} className="hover:bg-blue-50/10 transition-colors group">
                          <td className="px-6 py-5">
                             <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gray-100 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                   <Layers size={18} />
                                </div>
                                <div>
                                   <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-sm">{item.name}</p>
                                   <p className="text-[10px] font-black text-blue-400 tracking-widest">{item.gsm} GSM</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-5">
                             <p className="text-xl font-black text-gray-900 tracking-tighter">
                               {item.quantity.toLocaleString()} 
                               <span className="text-[10px] ml-1 text-gray-400 uppercase font-black">{item.unit}</span>
                             </p>
                             {item.description && <p className="text-[9px] text-gray-400 font-medium italic mt-0.5">{item.description}</p>}
                          </td>
                          <td className="px-6 py-5">
                             {isLow ? (
                               <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase ring-1 ring-red-100 w-fit animate-pulse">
                                 <AlertTriangle size={12} /> Low Stock
                               </span>
                             ) : (
                               <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase ring-1 ring-emerald-100 w-fit">
                                 <CheckCircle2 size={12} /> In Stock
                               </span>
                             )}
                          </td>
                          <td className="px-6 py-5 text-xs font-bold text-gray-400 uppercase">
                             {new Date(item.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => handleEdit(item)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(item._id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      );
                    })
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

export default PaperStockManagement;
