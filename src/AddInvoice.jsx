import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Trash2, Search, ChevronDown } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';

const AddInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [invoiceDate, setInvoiceDate] = useState(editData ? new Date(editData.date) : new Date());
  const [orderDate, setOrderDate] = useState(
    editData?.orderDate ? new Date(editData.orderDate) : (editData?.date ? new Date(editData.date) : new Date())
  );
  const [jobCards, setJobCards] = useState([]);
  const [formData, setFormData] = useState({
    invoiceNo: editData ? editData.invoiceNumber : 'INVN' + String(Date.now()).slice(-4),
    jobCard: editData ? editData.jobCard : '',
    orderNo: editData ? (editData.orderNo || editData.jobCard || '') : '',
    party: editData ? editData.partyName : '',
    gstPercent: editData ? editData.gstPercent : 18,
    gstType: editData ? (editData.gstType || 'CGST/SGST') : 'CGST/SGST',
    freight: editData ? (editData.freight || 0) : 0,
    reverseCharge: editData ? (editData.reverseCharge || 'No') : 'No',
  });

  const [items, setItems] = useState(editData ? editData.items.map(item => ({
    ...item,
    id: item.id || item._id || Date.now() + Math.random(),
    hsn: item.hsn || ''
  })) : [
    { id: Date.now(), description: 'Paper Sheet', hsn: '', qty: 0, rate: 0, total: 0 }
  ]);

  const [jobCardSearchTerm, setJobCardSearchTerm] = useState('');
  const [isJobCardDropdownOpen, setIsJobCardDropdownOpen] = useState(false);
  const jobCardDropdownRef = useRef(null);

  const filteredJobCards = jobCards.filter((card) => {
    const query = jobCardSearchTerm.toLowerCase();
    return (
      card.jobNumber?.toLowerCase().includes(query) ||
      card.partyName?.toLowerCase().includes(query) ||
      card.jobName?.toLowerCase().includes(query)
    );
  });

  const selectedJobCard = jobCards.find((card) => card.jobNumber === formData.jobCard);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (jobCardDropdownRef.current && !jobCardDropdownRef.current.contains(event.target)) {
        setIsJobCardDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isJobCardDropdownOpen) {
      setJobCardSearchTerm('');
    }
  }, [isJobCardDropdownOpen]);

  const openJobCardDropdown = () => {
    setIsJobCardDropdownOpen(true);
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobcard`)
      .then(res => res.json())
      .then(data => setJobCards(data))
      .catch(err => console.error("Error fetching Job Cards:", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJobCardSelect = (card) => {
    setFormData((prev) => ({
      ...prev,
      jobCard: card.jobNumber,
      orderNo: card.jobNumber || '',
      party: card.partyName || '',
    }));
    if (card.jobDate) {
      setOrderDate(new Date(card.jobDate));
    }
    setIsJobCardDropdownOpen(false);
    setJobCardSearchTerm('');
  };

  const handleItemChange = (id, field, value) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'qty' || field === 'rate') {
            updatedItem.total = parseFloat(updatedItem.qty || 0) * parseFloat(updatedItem.rate || 0);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addRow = () => {
    setItems([...items, { id: Date.now(), description: '', hsn: '', qty: 0, rate: 0, total: 0 }]);
  };

  const removeRow = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const subTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const freight = Number(formData.freight) || 0;
  const taxableAmount = subTotal + freight;
  const gstAmount = (taxableAmount * (formData.gstPercent || 0)) / 100;
  const grandTotal = taxableAmount + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invoice = {
      invoiceNumber: formData.invoiceNo,
      date: invoiceDate.toISOString(),
      jobCard: formData.jobCard,
      orderNo: formData.orderNo,
      orderDate: orderDate.toISOString(),
      partyName: formData.party,
      items: items,
      subTotal: subTotal,
      freight,
      reverseCharge: formData.reverseCharge || 'No',
      gstPercent: formData.gstPercent,
      gstType: formData.gstType,
      gstAmount: gstAmount,
      totalAmount: grandTotal
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice)
      });

      if (response.ok) {
        navigate('/invoice/list');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Error saving invoice:", err);
      alert("Failed to save invoice. Is server running?");
    }
  };

  return (
    <div className="mx-auto mt-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Manage Invoice
          </h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Invoice &gt; <span className="text-blue-600">{editData ? 'Edit Invoice' : 'Add Invoice'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
            Basic Details
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Invoice No *</label>
              <input
                type="text"
                name="invoiceNo"
                value={formData.invoiceNo}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Date *</label>
              <DatePicker
                selected={invoiceDate}
                onChange={(date) => setInvoiceDate(date)}
                wrapperClassName="w-full"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Order No.</label>
              <input
                type="text"
                name="orderNo"
                value={formData.orderNo}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="Order number"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Order Date</label>
              <DatePicker
                selected={orderDate}
                onChange={(date) => setOrderDate(date || new Date())}
                wrapperClassName="w-full"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1 relative z-30" ref={jobCardDropdownRef}>
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Job Card *</label>
              <input type="hidden" name="jobCard" value={formData.jobCard} required />

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <input
                  type="text"
                  value={jobCardSearchTerm}
                  onChange={(e) => {
                    setJobCardSearchTerm(e.target.value);
                    setIsJobCardDropdownOpen(true);
                  }}
                  onFocus={openJobCardDropdown}
                  placeholder={selectedJobCard ? `${selectedJobCard.jobNumber} - ${selectedJobCard.partyName}` : 'Search job no, party, item...'}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsJobCardDropdownOpen(!isJobCardDropdownOpen)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                  aria-label="Toggle job card list"
                >
                  <ChevronDown size={18} className={`transition-transform ${isJobCardDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {selectedJobCard && !isJobCardDropdownOpen && (
                <p className="text-[11px] text-blue-700 font-semibold px-1 truncate">
                  Selected: {selectedJobCard.jobNumber} - {selectedJobCard.partyName}
                </p>
              )}

              {isJobCardDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                    {filteredJobCards.length} job card{filteredJobCards.length !== 1 ? 's' : ''} found
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredJobCards.length > 0 ? (
                      filteredJobCards.map((card) => (
                        <button
                          key={card._id || card.jobNumber}
                          type="button"
                          onClick={() => handleJobCardSelect(card)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${formData.jobCard === card.jobNumber ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                        >
                          <span className="font-semibold text-blue-700">{card.jobNumber}</span>
                          <span className="text-gray-500"> - {card.partyName}</span>
                          {card.jobName && <span className="block text-xs text-gray-400 mt-0.5 truncate">{card.jobName}</span>}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-400 italic">
                        No job card found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Party *</label>
              <input
                type="text"
                name="party"
                value={formData.party}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-237.5">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider w-64">Description *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider w-64">HSN/SAC</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-28">Qty *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-32">Rate *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-36">Total</th>
                  <th className="px-6 py-3 w-14"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-t border-gray-100 group">
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        required
                        placeholder="Description"
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={item.hsn || ''}
                        onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                        placeholder="HSN/SAC"
                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                          required
                          className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                          required
                          className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="text"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="w-28 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 focus:outline-none text-sm text-center font-semibold text-blue-700"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-100"
                        title="Remove row"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex justify-end bg-gray-50/50">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus size={16} /> Add Row
            </button>
          </div>
        </div>

        {/* Calculations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Sub Total *</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-semibold text-gray-800">
              ₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Freight</label>
            <input
              type="number"
              name="freight"
              min="0"
              step="0.01"
              value={formData.freight}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base sm:text-lg font-semibold text-gray-800"
              placeholder="0.00"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">GST (%) *</label>
            <select
              name="gstPercent"
              value={formData.gstPercent}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base sm:text-lg font-semibold text-gray-800 outline-none cursor-pointer"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="18">18%</option>
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">GST Type *</label>
            <select
              name="gstType"
              value={formData.gstType}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base sm:text-lg font-semibold text-gray-800 outline-none cursor-pointer"
            >
              <option value="CGST/SGST">CGST + SGST</option>
              <option value="IGST">IGST</option>
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Reverse Charge</label>
            <select
              name="reverseCharge"
              value={formData.reverseCharge}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base sm:text-lg font-semibold text-gray-800 outline-none cursor-pointer"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Grand Total</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-bold text-blue-600">
              ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 text-white px-10 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {editData ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInvoice;
