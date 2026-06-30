import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Printer, UserPlus } from 'lucide-react';
import { buildPartySuggestions, partyNameExists } from './utils/partySuggestions';

const EMPTY_PARTY_FORM = {
  partyName: '',
  address: '',
  contactNo: '',
  emailId: '',
  gstNo: '',
  jobName: 'Direct Challan',
};

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
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [partyForm, setPartyForm] = useState(EMPTY_PARTY_FORM);
  const [isSavingParty, setIsSavingParty] = useState(false);
  const [isSavingChallan, setIsSavingChallan] = useState(false);
  const partyDropdownRef = useRef(null);
  const [challanDate, setChallanDate] = useState(editData ? new Date(editData.date) : new Date());
  const [formData, setFormData] = useState({
    challanNo: editData ? editData.challanNo : 'CHLN' + String(Date.now()).slice(-4),
    jobCardId: editData ? editData.jobCardId : '',
    partyName: editData ? editData.partyName : '',
    items: normalizeItems(editData),
    total: editData ? editData.total : 0,
    gstAmount: editData ? (editData.gstAmount || 0) : 0,
    grandTotal: editData ? (editData.grandTotal || editData.total || 0) : 0,
    freight: editData ? (editData.freight || 0) : 0,
    gstType: editData ? (editData.gstType || 'CGST/SGST') : 'CGST/SGST',
    reverseCharge: editData ? (editData.reverseCharge || 'No') : 'No',
    note: editData ? editData.note : ''
  });

  const totals = useMemo(() => {
    const items = formData.items.map(calcItemTotals);
    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const itemsGst = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const freight = Number(formData.freight) || 0;
    const freightGstPercent = items[0]?.gstPercent ?? 18;
    const freightGst = (freight * freightGstPercent) / 100;
    const gstAmount = itemsGst + freightGst;
    const halfGst = gstAmount / 2;
    const rawGrandTotal = subTotal + freight + gstAmount;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = grandTotal - rawGrandTotal;
    return { items, subTotal, freight, gstAmount, halfGst, grandTotal, roundOff };
  }, [formData.items, formData.freight]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobcard`)
      .then(res => res.json())
      .then(data => setJobCards(data))
      .catch(err => console.error("Error fetching Job Cards:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target)) {
        setIsPartyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const partySuggestions = useMemo(() => buildPartySuggestions(jobCards), [jobCards]);

  const filteredPartySuggestions = partySuggestions.filter((party) => {
    const query = formData.partyName.trim().toLowerCase();
    if (!query) return true;
    return party.partyName.toLowerCase().includes(query);
  }).slice(0, 8);

  const showAddPartyButton = formData.partyName.trim().length > 0
    && !partyNameExists(partySuggestions, formData.partyName);

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
      setIsPartyDropdownOpen(true);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applyPartySuggestion = (party) => {
    const linkedCard = jobCards.find((card) => card.jobNumber === party.jobNumber)
      || jobCards.find((card) => (card.partyName || '').trim().toLowerCase() === party.partyName.toLowerCase());

    setPickedJobIds([]);
    setFormData((prev) => ({
      ...prev,
      partyName: party.partyName,
      jobCardId: linkedCard?._id || linkedCard?.id || '',
    }));
    setIsPartyDropdownOpen(false);
  };

  const openAddPartyModal = () => {
    setPartyForm({
      ...EMPTY_PARTY_FORM,
      partyName: formData.partyName.trim(),
    });
    setIsAddPartyModalOpen(true);
    setIsPartyDropdownOpen(false);
  };

  const handlePartyFormChange = (e) => {
    const { name, value } = e.target;
    setPartyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPartySave = async (e) => {
    e.preventDefault();
    if (!partyForm.partyName.trim()) {
      alert('Party name is required');
      return;
    }

    setIsSavingParty(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobcard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: partyForm.partyName.trim(),
          companyName: partyForm.partyName.trim(),
          address: partyForm.address.trim(),
          contactNo: partyForm.contactNo.trim(),
          emailId: partyForm.emailId.trim(),
          gstNo: partyForm.gstNo.trim(),
          jobName: partyForm.jobName.trim() || 'Direct Challan',
          jobDate: new Date().toISOString(),
          jobQty: '1',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save party');
      }

      const savedJobCard = await response.json();
      setJobCards((prev) => [savedJobCard, ...prev]);
      setPickedJobIds([]);
      setFormData((prev) => ({
        ...prev,
        partyName: savedJobCard.partyName || partyForm.partyName.trim(),
        jobCardId: savedJobCard._id || savedJobCard.id || '',
        items: [itemFromJobCard(savedJobCard)],
      }));
      setIsAddPartyModalOpen(false);
      setPartyForm(EMPTY_PARTY_FORM);
    } catch (err) {
      console.error('Error saving party:', err);
      alert(err.message || 'Failed to add party');
    } finally {
      setIsSavingParty(false);
    }
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

  const buildChallanPayload = () => {
    const selectedCard = jobCards.find(card => (card._id === formData.jobCardId || card.id === parseInt(formData.jobCardId)));
    const jobNumbersFromItems = [...new Set(
      formData.items
        .map(i => i.jobNumber || (i.description?.match(/\((JOB[^)]+)\)/)?.[1]))
        .filter(Boolean)
    )];
    const computedItems = formData.items.map(calcItemTotals);
    const invoiceGstPercent = computedItems.length
      ? Math.round(computedItems.reduce((sum, item) => sum + item.gstPercent, 0) / computedItems.length)
      : 18;

    return {
      challanNo: formData.challanNo,
      date: challanDate.toISOString(),
      jobCardId: formData.jobCardId,
      jobNumber: jobNumbersFromItems.length ? jobNumbersFromItems.join(', ') : (selectedCard?.jobNumber || ''),
      jobName: selectedCard?.jobName || '',
      partyName: formData.partyName,
      items: computedItems,
      total: totals.subTotal,
      freight: totals.freight,
      gstPercent: invoiceGstPercent,
      gstType: formData.gstType,
      reverseCharge: formData.reverseCharge,
      gstAmount: totals.gstAmount,
      grandTotal: totals.grandTotal,
      note: formData.note,
      description: computedItems.length > 0 ? computedItems[0].description : '',
      qty: computedItems.length > 0 ? computedItems[0].qty : 0,
      rate: computedItems.length > 0 ? computedItems[0].rate : 0,
      paymentStatus: editData ? (editData.paymentStatus || 'Pending') : 'Pending',
    };
  };

  const saveChallan = async () => {
    const response = await fetch(`${API_BASE_URL}/api/challan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildChallanPayload()),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save challan');
    }

    return response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyName.trim()) {
      alert('Party name is required');
      return;
    }

    setIsSavingChallan(true);
    try {
      await saveChallan();
      navigate('/challan/list');
    } catch (err) {
      console.error('Error saving challan:', err);
      alert(err.message || 'Failed to save challan. Is server running?');
    } finally {
      setIsSavingChallan(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!formData.partyName.trim()) {
      alert('Party name is required');
      return;
    }

    setIsSavingChallan(true);
    try {
      const saved = await saveChallan();
      navigate('/challan/list', { state: { printChallanId: saved._id } });
    } catch (err) {
      console.error('Error saving challan:', err);
      alert(err.message || 'Failed to save challan. Is server running?');
    } finally {
      setIsSavingChallan(false);
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
            <div className="space-y-1 relative z-20" ref={partyDropdownRef}>
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Party *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="partyName"
                    value={formData.partyName}
                    onChange={handleInputChange}
                    onFocus={() => setIsPartyDropdownOpen(true)}
                    onBlur={() => {
                      const match = partySuggestions.find(
                        (party) => party.partyName.toLowerCase() === formData.partyName.trim().toLowerCase()
                      );
                      if (match) applyPartySuggestion(match);
                    }}
                    required
                    placeholder="Type or select Party"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                  />
                  {isPartyDropdownOpen && filteredPartySuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Existing parties
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredPartySuggestions.map((party) => (
                          <button
                            key={party.partyName}
                            type="button"
                            onClick={() => applyPartySuggestion(party)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 text-gray-700"
                          >
                            <span className="font-semibold text-gray-900">{party.partyName}</span>
                            {party.address && (
                              <span className="block text-xs text-gray-400 mt-0.5 truncate">{party.address}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {showAddPartyButton && (
                  <button
                    type="button"
                    onClick={openAddPartyModal}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                    title="Add new party"
                  >
                    <UserPlus size={16} />
                    Add
                  </button>
                )}
              </div>
              {showAddPartyButton && (
                <p className="text-[11px] text-emerald-700 font-semibold px-1">
                  New party — click Add to enter details
                </p>
              )}
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

          <div className="p-4 sm:p-6 border-t border-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Sub Total *</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base font-semibold text-gray-800">
                  ₹ {totals.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Freight</label>
                <input
                  type="number"
                  name="freight"
                  min="0"
                  step="0.01"
                  value={formData.freight}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base font-semibold text-gray-800"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">GST Amount</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base font-semibold text-gray-800">
                  ₹ {totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">GST Type *</label>
                <select
                  name="gstType"
                  value={formData.gstType}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base font-semibold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="CGST/SGST">CGST + SGST</option>
                  <option value="IGST">IGST</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Reverse Charge</label>
                <select
                  name="reverseCharge"
                  value={formData.reverseCharge}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base font-semibold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Grand Total</label>
                <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-bold text-blue-600">
                  ₹ {totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-50">
            <div className="space-y-1">
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
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleSaveAndPrint}
            disabled={isSavingChallan}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Printer size={18} />
            {isSavingChallan ? 'Saving...' : 'Save & Print'}
          </button>
          <button
            type="submit"
            disabled={isSavingChallan}
            className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white px-10 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {isSavingChallan ? 'Saving...' : (editData ? 'Update Challan' : 'Save Challan')}
          </button>
        </div>
      </form>

      {isAddPartyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Party</h2>
                <p className="text-sm text-gray-500">Basic details for challan printing</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPartyModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPartySave} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Party Name *</label>
                <input
                  type="text"
                  name="partyName"
                  value={partyForm.partyName}
                  onChange={handlePartyFormChange}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  name="address"
                  value={partyForm.address}
                  onChange={handlePartyFormChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Contact No</label>
                  <input
                    type="text"
                    name="contactNo"
                    value={partyForm.contactNo}
                    onChange={handlePartyFormChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">GST No</label>
                  <input
                    type="text"
                    name="gstNo"
                    value={partyForm.gstNo}
                    onChange={handlePartyFormChange}
                    placeholder="URP if unregistered"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  name="emailId"
                  value={partyForm.emailId}
                  onChange={handlePartyFormChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Job / Item Name</label>
                <input
                  type="text"
                  name="jobName"
                  value={partyForm.jobName}
                  onChange={handlePartyFormChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPartyModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingParty}
                  className="px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold text-sm"
                >
                  {isSavingParty ? 'Saving...' : 'Save Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddChallan;
