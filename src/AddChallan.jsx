import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';

const defaultItem = () => ({ description: '', qty: 0, rate: 0, gstPercent: 18, total: 0, gstAmount: 0 });

const backfillItemForEdit = (item, editData) => {
  const total = Number(item.total) || 0;
  let qty = Number(item.qty) || 0;
  let rate = Number(item.rate) || 0;
  if (total > 0 && qty === 0 && rate === 0) {
    qty = 1;
    rate = total;
  }
  return {
    description: item.description || '',
    qty,
    rate,
    gstPercent: item.gstPercent ?? editData?.gstPercent ?? 18,
    total,
    gstAmount: item.gstAmount || 0,
    jobNumber: item.jobNumber || '',
  };
};

const normalizeItems = (editData) => {
  if (editData?.items?.length) {
    return editData.items.map((item) => backfillItemForEdit(item, editData));
  }
  if (editData?.description) {
    return [backfillItemForEdit({
      description: editData.description,
      qty: editData.qty,
      rate: editData.rate,
      gstPercent: editData.gstPercent,
      total: editData.total,
      gstAmount: 0,
    }, editData)];
  }
  return [defaultItem()];
};

const parseJobQty = (value) => {
  const match = String(value || '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

const itemFromJobCard = (card) => ({
  description: `${card.jobName || 'Job'} (${card.jobNumber || ''})`.trim(),
  qty: parseJobQty(card.jobQty),
  rate: 0,
  gstPercent: 18,
  total: 0,
  gstAmount: 0,
  jobCardId: card._id || card.id,
  jobNumber: card.jobNumber || '',
});

const calcItemTotals = (item) => {
  const qty = parseFloat(item.qty || 0);
  const rate = parseFloat(item.rate || 0);
  const gstPercent = parseFloat(item.gstPercent ?? 18);
  const lineTotal = qty * rate;
  const gstAmount = (lineTotal * gstPercent) / 100;
  return {
    ...item,
    qty,
    rate,
    gstPercent,
    total: lineTotal,
    gstAmount,
  };
};

const AddChallan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [jobCards, setJobCards] = useState([]);
  const [pickedJobIds, setPickedJobIds] = useState([]);
  const [challanDate, setChallanDate] = useState(editData ? new Date(editData.date) : new Date());
  const [formData, setFormData] = useState({
    challanNo: editData ? editData.challanNo : 'CHLN' + String(Date.now()).slice(-4),
    jobCardId: editData ? editData.jobCardId : '',
    partyName: editData ? editData.partyName : '',
    items: normalizeItems(editData),
    total: editData ? editData.total : 0,
    gstAmount: editData ? (editData.gstAmount || 0) : 0,
    grandTotal: editData ? (editData.grandTotal || editData.total || 0) : 0,
    note: editData ? editData.note : ''
  });

  const totals = useMemo(() => {
    const items = formData.items.map(calcItemTotals);
    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const halfGst = gstAmount / 2;
    const rawGrandTotal = subTotal + gstAmount;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = grandTotal - rawGrandTotal;
    return { items, subTotal, gstAmount, halfGst, grandTotal, roundOff };
  }, [formData.items]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobcard`)
      .then(res => res.json())
      .then(data => setJobCards(data))
      .catch(err => console.error("Error fetching Job Cards:", err));
  }, []);

  const uniqueParties = [...new Set(jobCards.map(card => card.partyName).filter(Boolean))];

  useEffect(() => {
    if (formData.jobCardId) {
      const selectedCard = jobCards.find(card => (card._id === formData.jobCardId || card.id === parseInt(formData.jobCardId)));
      if (selectedCard && formData.partyName !== selectedCard.partyName) {
        setFormData(prev => ({ ...prev, partyName: selectedCard.partyName }));
      }
    }
  }, [formData.jobCardId, jobCards]);

  const filteredJobCards = formData.partyName
    ? jobCards.filter(card => card.partyName && card.partyName.toLowerCase().includes(formData.partyName.toLowerCase()))
    : jobCards;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jobCardId') {
      const selectedCard = jobCards.find(card => (card._id === value || card.id === parseInt(value)));
      setFormData(prev => ({
        ...prev,
        jobCardId: value,
        partyName: selectedCard?.partyName || prev.partyName,
        items: selectedCard ? [itemFromJobCard(selectedCard)] : prev.items,
      }));
      return;
    }
    if (name === 'partyName') {
      setPickedJobIds([]);
      setFormData(prev => ({ ...prev, partyName: value, jobCardId: '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleJobPick = (id) => {
    setPickedJobIds(prev => (
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    ));
  };

  const addSelectedJobsToItems = () => {
    const picked = filteredJobCards.filter(card => pickedJobIds.includes(card._id || card.id));
    if (!picked.length) return;

    const newItems = picked.map(itemFromJobCard);
    const existingDescs = new Set(formData.items.map(i => i.description).filter(Boolean));
    const toAdd = newItems.filter(i => !existingDescs.has(i.description));

    setFormData(prev => {
      const hasContent = prev.items.some(i => i.description || i.qty || i.rate);
      const merged = hasContent ? [...prev.items, ...toAdd] : toAdd.length ? toAdd : [defaultItem()];
      return {
        ...prev,
        items: merged,
        jobCardId: prev.jobCardId || (picked[0]._id || picked[0].id),
      };
    });
    setPickedJobIds([]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, defaultItem()]
    }));
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedCard = jobCards.find(card => (card._id === formData.jobCardId || card.id === parseInt(formData.jobCardId)));
    const jobNumbersFromItems = [...new Set(
      formData.items
        .map(i => i.jobNumber || (i.description?.match(/\((JOB[^)]+)\)/)?.[1]))
        .filter(Boolean)
    )];
    const computedItems = formData.items.map(calcItemTotals);

    const challan = {
      challanNo: formData.challanNo,
      date: challanDate.toISOString(),
      jobCardId: formData.jobCardId,
      jobNumber: jobNumbersFromItems.length ? jobNumbersFromItems.join(', ') : (selectedCard?.jobNumber || ''),
      jobName: selectedCard?.jobName || '',
      partyName: formData.partyName,
      items: computedItems,
      total: totals.subTotal,
      gstAmount: totals.gstAmount,
      grandTotal: totals.grandTotal,
      note: formData.note,
      description: computedItems.length > 0 ? computedItems[0].description : '',
      qty: computedItems.length > 0 ? computedItems[0].qty : 0,
      rate: computedItems.length > 0 ? computedItems[0].rate : 0,
      paymentStatus: editData ? (editData.paymentStatus || 'Pending') : 'Pending'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/challan`, {
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
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Party *</label>
              <input
                list="partyList"
                type="text"
                name="partyName"
                value={formData.partyName}
                onChange={handleInputChange}
                required
                placeholder="Type or select Party"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
              />
              <datalist id="partyList">
                {uniqueParties.map((party, idx) => (
                  <option key={idx} value={party} />
                ))}
              </datalist>
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
                <option value="">{formData.partyName ? `Select Job (${filteredJobCards.length} found)` : "Select Job"}</option>
                {filteredJobCards.map(card => (
                  <option key={card._id || card.id} value={card._id || card.id}>({card.jobNumber}) {card.jobName} - {card.partyName}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.partyName && filteredJobCards.length > 0 && (
            <div className="px-4 sm:px-6 pb-4 border-t border-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 mt-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Multiple Jobs — select karke items mein add karo ({filteredJobCards.length} found)
                </p>
                <button
                  type="button"
                  onClick={() => setPickedJobIds(filteredJobCards.map(c => c._id || c.id))}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold self-start"
                >
                  Select All
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 mb-3 bg-gray-50">
                {filteredJobCards.map(card => {
                  const id = card._id || card.id;
                  return (
                    <label key={id} className="flex items-start gap-3 p-3 hover:bg-white cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={pickedJobIds.includes(id)}
                        onChange={() => toggleJobPick(id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-800 leading-snug">
                        <span className="font-semibold text-blue-700">({card.jobNumber})</span> {card.jobName}
                      </span>
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addSelectedJobsToItems}
                disabled={pickedJobIds.length === 0}
                className="w-full sm:w-auto text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span>
                Add Selected to Items ({pickedJobIds.length})
              </button>
            </div>
          )}

          <div className="p-4 sm:p-6 border-t border-gray-50 mt-4 pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Items</label>
              <button type="button" onClick={addItem} className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1">
                <span className="text-lg leading-none">+</span> Add Row
              </button>
            </div>

            {totals.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-3 mb-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100 relative group">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Description *</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                    placeholder="Item description"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Qty *</label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                    required
                    min="0"
                    step="any"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Rate *</label>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    required
                    min="0"
                    step="any"
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="sm:col-span-1 space-y-1">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">GST %</label>
                  <input
                    type="number"
                    value={item.gstPercent}
                    onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)}
                    min="0"
                    step="any"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</label>
                  <div className="w-full bg-transparent border border-transparent rounded-lg px-2 py-2.5 text-sm font-bold text-gray-700">
                    ₹ {item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                {formData.items.length > 1 && (
                  <div className="sm:col-span-1 flex justify-end sm:justify-center mb-2">
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-gray-50 mt-4 pt-6">
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
                ₹ {totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
