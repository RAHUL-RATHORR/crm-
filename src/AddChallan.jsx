import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AddChallan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [jobCards, setJobCards] = useState([]);
  const [challanDate, setChallanDate] = useState(editData ? new Date(editData.date) : new Date());
  const [formData, setFormData] = useState({
    challanNo: editData ? editData.challanNo : 'CHLN' + String(Date.now()).slice(-4),
    jobCardId: editData ? editData.jobCardId : '',
    partyName: editData ? editData.partyName : '',
    description: editData ? editData.description : '',
    qty: editData ? editData.qty : 0,
    rate: editData ? editData.rate : 0,
    total: editData ? editData.total : 0,
    note: editData ? editData.note : ''
  });

  useEffect(() => {
    fetch('https://crm-qpw8.onrender.com/api/jobcard')
      .then(res => res.json())
      .then(data => setJobCards(data))
      .catch(err => console.error("Error fetching Job Cards:", err));
  }, []);

  // Auto-fill Party logic
  useEffect(() => {
    if (formData.jobCardId) {
      const selectedCard = jobCards.find(card => (card._id === formData.jobCardId || card.id === parseInt(formData.jobCardId)));
      if (selectedCard) {
        setFormData(prev => ({ ...prev, partyName: selectedCard.partyName }));
      }
    } else {
      setFormData(prev => ({ ...prev, partyName: '' }));
    }
  }, [formData.jobCardId, jobCards]);

  // Auto-calculate Total logic
  useEffect(() => {
    const qty = parseFloat(formData.qty || 0);
    const rate = parseFloat(formData.rate || 0);
    setFormData(prev => ({ ...prev, total: qty * rate }));
  }, [formData.qty, formData.rate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedCard = jobCards.find(card => (card._id === formData.jobCardId || card.id === parseInt(formData.jobCardId)));

    const challan = {
      challanNo: formData.challanNo,
      date: challanDate.toISOString(),
      jobCardId: formData.jobCardId,
      jobNumber: selectedCard?.jobNumber || '',
      jobName: selectedCard?.jobName || '',
      partyName: formData.partyName,
      description: formData.description,
      qty: formData.qty,
      rate: formData.rate,
      total: formData.total,
      note: formData.note,
      paymentStatus: editData ? (editData.paymentStatus || 'Pending') : 'Pending'
    };

    try {
      const response = await fetch('https://crm-qpw8.onrender.com/api/challan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challan)
      });

      if (response.ok) {
        navigate('/challan/list');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Error saving challan:", err);
      alert("Failed to save challan. Is server running?");
    }
  };

  return (
    <div className="mx-auto mt-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Manage Challan
          </h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Challan &gt; <span className="text-blue-600">{editData ? 'Edit Challan' : 'Add Challan'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
            Basic Details
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Challan No *</label>
              <input
                type="text"
                name="challanNo"
                value={formData.challanNo}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Date *</label>
              <DatePicker
                selected={challanDate}
                onChange={(date) => setChallanDate(date)}
                wrapperClassName="w-full"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Job Card *</label>
              <select
                name="jobCardId"
                value={formData.jobCardId}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              >
                <option value="">Select Job</option>
                {jobCards.map(card => (
                  <option key={card._id || card.id} value={card._id || card.id}>({card.jobNumber}) {card.jobName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Party *</label>
              <input
                type="text"
                name="partyName"
                value={formData.partyName}
                readOnly
                placeholder="Auto-filled"
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none cursor-not-allowed text-sm font-medium text-gray-600"
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-t border-gray-50 mt-4 pt-6">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Description *</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Item description"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Qty *</label>
              <input
                type="number"
                name="qty"
                value={formData.qty}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Rate *</label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 pt-0 grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-gray-50 mt-4 pt-6">
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows="1"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                placeholder="Enter additional notes..."
              ></textarea>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Total</label>
              <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-bold text-gray-700 flex items-center">
                ₹ {formData.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 text-white px-10 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {editData ? 'Update Challan' : 'Save Challan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddChallan;
