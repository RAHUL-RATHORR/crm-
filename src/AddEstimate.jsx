import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Plus, Trash2, Save, UserPlus } from 'lucide-react';
import { buildPartySuggestions, partyNameExists } from './utils/partySuggestions';
import { masterItemToLineFields } from './utils/itemSuggestions';
import ItemDescriptionInput from './components/ItemDescriptionInput';

const EMPTY_PARTY_FORM = {
  partyName: '',
  address: '',
  contactNo: '',
  emailId: '',
  gstNo: '',
};

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';

const parseJobQty = (value) => {
  const match = String(value || '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

const defaultItem = () => ({
  description: '',
  qty: 0,
  rate: 0,
  per: 'PCS',
  gstPercent: 18,
  total: 0,
});

const calcItemTotals = (item) => {
  const qty = parseFloat(item.qty || 0);
  const rate = parseFloat(item.rate || 0);
  const gstPercent = parseFloat(item.gstPercent ?? 18);
  const lineTotal = qty * rate;
  const gstAmount = (lineTotal * gstPercent) / 100;
  return { ...item, qty, rate, gstPercent, total: lineTotal, gstAmount };
};

const itemsFromEditData = (editData) => {
  if (!editData) return [defaultItem()];

  const qty = parseJobQty(editData.jobQty);
  const total = Number(editData.totalAmount) || 0;
  const rate = qty > 0 ? total / qty : total;

  return [{
    description: editData.jobName || '',
    qty,
    rate,
    per: 'PCS',
    gstPercent: 18,
    total,
    gstAmount: 0,
  }];
};

const itemFromJobCard = (card) => ({
  description: card.jobName || '',
  qty: parseJobQty(card.jobQty),
  rate: 0,
  per: 'PCS',
  gstPercent: 18,
  total: 0,
  gstAmount: 0,
});

const AddEstimate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [jobCards, setJobCards] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [pickedJobIds, setPickedJobIds] = useState([]);
  const [quoteDate, setQuoteDate] = useState(editData?.quoteDate ? new Date(editData.quoteDate) : new Date());
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [partyForm, setPartyForm] = useState(EMPTY_PARTY_FORM);
  const [isSavingParty, setIsSavingParty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const partyDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    quoteNumber: editData?.quoteNumber || '',
    partyName: editData?.partyName || '',
    address: editData?.address || '',
    gstNo: editData?.gstNo || '',
    salesPerson: editData?.salesPerson || 'Admin',
    paymentTerms: editData?.paymentTerms || '7 Days',
    jobCardId: '',
    items: itemsFromEditData(editData),
    pageSize: editData?.pageSize || '',
    printingType: editData?.printingType || '',
    paper: editData?.paper || '',
    note: editData?.notes || '',
  });

  const totals = useMemo(() => {
    const items = formData.items.map(calcItemTotals);
    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const grandTotal = subTotal;
    return { items, subTotal, gstAmount, grandTotal };
  }, [formData.items]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobcard`)
      .then((res) => res.json())
      .then((data) => setJobCards(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching job cards:', err));

    fetch(`${API_BASE_URL}/api/items`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data.filter((item) => item.isActive !== false) : [];
        setMasterItems(list);
      })
      .catch((err) => console.error('Error fetching items:', err));
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

  const filteredJobCards = useMemo(() => {
    if (!formData.partyName.trim()) return jobCards;
    const party = formData.partyName.trim().toLowerCase();
    return jobCards.filter((card) => card.partyName?.toLowerCase().includes(party));
  }, [jobCards, formData.partyName]);

  const filteredPartySuggestions = partySuggestions.filter((party) => {
    const query = formData.partyName.trim().toLowerCase();
    if (!query) return true;
    return party.partyName.toLowerCase().includes(query);
  }).slice(0, 8);

  const showAddPartyButton = formData.partyName.trim().length > 0
    && !partyNameExists(partySuggestions, formData.partyName);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jobCardId') {
      const selectedCard = jobCards.find((card) => card._id === value || card.id === parseInt(value, 10));
      setPickedJobIds([]);
      if (selectedCard) {
        setFormData((prev) => ({
          ...prev,
          jobCardId: value,
          partyName: selectedCard.partyName || prev.partyName,
          address: selectedCard.address || prev.address,
          gstNo: selectedCard.gstNo || prev.gstNo,
          pageSize: selectedCard.pageSize || prev.pageSize,
          printingType: selectedCard.printingType || prev.printingType,
          paper: selectedCard.paper || prev.paper,
          items: [itemFromJobCard(selectedCard)],
        }));
      } else {
        setFormData((prev) => ({ ...prev, jobCardId: value }));
      }
      return;
    }
    if (name === 'partyName') {
      setPickedJobIds([]);
      setFormData((prev) => ({ ...prev, partyName: value, jobCardId: '' }));
      setIsPartyDropdownOpen(true);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyPartySuggestion = (party) => {
    setPickedJobIds([]);
    setFormData((prev) => ({
      ...prev,
      partyName: party.partyName,
      address: party.address || prev.address,
      gstNo: party.gstNo || prev.gstNo,
      jobCardId: '',
    }));
    setIsPartyDropdownOpen(false);
  };

  const openAddPartyModal = () => {
    setPartyForm({ ...EMPTY_PARTY_FORM, partyName: formData.partyName.trim() });
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
      setFormData((prev) => ({
        ...prev,
        partyName: partyForm.partyName.trim(),
        address: partyForm.address.trim(),
        gstNo: partyForm.gstNo.trim(),
      }));
      setIsAddPartyModalOpen(false);
      setPartyForm(EMPTY_PARTY_FORM);
    } finally {
      setIsSavingParty(false);
    }
  };

  const toggleJobPick = (id) => {
    setPickedJobIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const addSelectedJobsToItems = () => {
    const picked = filteredJobCards.filter((card) => pickedJobIds.includes(card._id || card.id));
    if (!picked.length) return;

    const newItems = picked.map(itemFromJobCard);
    const existingDescs = new Set(formData.items.map((i) => i.description).filter(Boolean));
    const toAdd = newItems.filter((i) => !existingDescs.has(i.description));

    setFormData((prev) => {
      const hasContent = prev.items.some((i) => i.description || i.qty || i.rate);
      const merged = hasContent ? [...prev.items, ...toAdd] : (toAdd.length ? toAdd : [defaultItem()]);
      const first = picked[0];
      return {
        ...prev,
        items: merged,
        jobCardId: prev.jobCardId || (first._id || first.id),
        pageSize: prev.pageSize || first.pageSize || '',
        printingType: prev.printingType || first.printingType || '',
        paper: prev.paper || first.paper || '',
      };
    });
    setPickedJobIds([]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const applyMasterItemToRow = (index, masterItem) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      ...masterItemToLineFields(masterItem, { includeHsn: false }),
    };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, defaultItem()] }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const buildPayload = () => {
    const primary = totals.items[0] || defaultItem();
    const jobName = totals.items
      .map((item) => item.description?.trim())
      .filter(Boolean)
      .join(' / ') || primary.description;

    return {
      partyName: formData.partyName.trim(),
      address: formData.address,
      gstNo: formData.gstNo,
      quoteDate: quoteDate ? new Date(quoteDate) : new Date(),
      salesPerson: formData.salesPerson,
      paymentTerms: formData.paymentTerms,
      jobName,
      jobQty: String(primary.qty || totals.items.reduce((sum, item) => sum + (item.qty || 0), 0) || 0),
      pageSize: formData.pageSize,
      printingType: formData.printingType,
      paper: formData.paper,
      totalAmount: totals.grandTotal,
      notes: formData.note,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.partyName.trim()) {
      alert('Party Name is required');
      return;
    }

    if (!totals.items.some((item) => item.description?.trim())) {
      alert('Please add at least one item description');
      return;
    }

    setIsSaving(true);

    try {
      const url = editData?._id
        ? `${API_BASE_URL}/api/estimate/${editData._id}`
        : `${API_BASE_URL}/api/estimate`;
      const method = editData?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || 'Failed to save estimate');
        return;
      }

      navigate('/estimates');
    } catch (error) {
      console.error('Save Error:', error);
      alert('Network Error: Could not save estimate.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm';
  const labelClass = 'text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider';

  return (
    <div className="mx-auto mt-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Manage Estimate & Quotation
          </h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Estimate &gt; <span className="text-blue-600">{editData ? 'Edit Estimate' : 'Add Estimate'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
            Basic Details
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className={labelClass}>Quote No *</label>
              <input
                type="text"
                name="quoteNumber"
                value={formData.quoteNumber || (editData ? '' : 'Auto-generated')}
                readOnly
                className={`${inputClass} bg-gray-100 text-gray-600 cursor-not-allowed`}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Date *</label>
              <DatePicker
                selected={quoteDate}
                onChange={(date) => setQuoteDate(date || new Date())}
                wrapperClassName="w-full"
                className={inputClass}
              />
            </div>
            <div className="space-y-1 relative z-20" ref={partyDropdownRef}>
              <label className={labelClass}>Party *</label>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    name="partyName"
                    value={formData.partyName}
                    onChange={handleInputChange}
                    onFocus={() => setIsPartyDropdownOpen(true)}
                    onBlur={() => {
                      const match = partySuggestions.find(
                        (party) => party.partyName.toLowerCase() === formData.partyName.trim().toLowerCase(),
                      );
                      if (match) applyPartySuggestion(match);
                    }}
                    required
                    placeholder="Type party name..."
                    className={inputClass}
                  />
                  {isPartyDropdownOpen && filteredPartySuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
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
                    className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                    title="Add new party"
                  >
                    <UserPlus size={16} />
                    Add
                  </button>
                )}
              </div>
              {showAddPartyButton && (
                <p className="text-[11px] text-emerald-700 font-semibold px-1">New party — click Add</p>
              )}
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Sales Person</label>
              <input
                type="text"
                name="salesPerson"
                value={formData.salesPerson}
                onChange={handleInputChange}
                className={inputClass}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className={labelClass}>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Party address"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>GST No</label>
              <input
                type="text"
                name="gstNo"
                value={formData.gstNo}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="GSTIN or URP"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Payment Terms</label>
              <input
                type="text"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="e.g. 7 Days"
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 pb-4">
            <div className="space-y-1 max-w-xl">
              <label className={labelClass}>Job Card</label>
              <select
                name="jobCardId"
                value={formData.jobCardId}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="">
                  {formData.partyName
                    ? `Select Job (${filteredJobCards.length} found)`
                    : 'Select party first'}
                </option>
                {filteredJobCards.map((card) => (
                  <option key={card._id || card.id} value={card._id || card.id}>
                    ({card.jobNumber}) {card.jobName} - {card.partyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.partyName && filteredJobCards.length > 0 && (
            <div className="px-4 sm:px-6 pb-4 border-t border-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 mt-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Multiple Jobs — select and add to items ({filteredJobCards.length} found)
                </p>
                <button
                  type="button"
                  onClick={() => setPickedJobIds(filteredJobCards.map((c) => c._id || c.id))}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold self-start"
                >
                  Select All
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 mb-3 bg-gray-50">
                {filteredJobCards.map((card) => {
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
                <Plus size={16} />
                Add Selected to Items ({pickedJobIds.length})
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
            Item Details
          </div>
          <div className="overflow-x-auto overflow-y-visible -mx-1 px-1">
            <table className="crm-items-table w-full text-left border-collapse min-w-[880px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider w-56">Description *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-24">Qty *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-28">Rate *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-20">per</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-24">GST %</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-32">Amount</th>
                  <th className="px-6 py-3 w-14" />
                </tr>
              </thead>
              <tbody>
                {totals.items.map((item, index) => (
                  <tr key={index} className="border-t border-gray-100 group">
                    <td className="px-6 py-4">
                      <ItemDescriptionInput
                        value={item.description}
                        onChange={(value) => handleItemChange(index, 'description', value)}
                        onSelectMaster={(masterItem) => applyMasterItemToRow(index, masterItem)}
                        masterItems={masterItems}
                        required
                      />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          required
                          min="0"
                          step="any"
                          className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          required
                          min="0"
                          step="any"
                          className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="text"
                          value={item.per ?? ''}
                          onChange={(e) => handleItemChange(index, 'per', e.target.value)}
                          placeholder="PCS"
                          className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center uppercase"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="number"
                          value={item.gstPercent}
                          onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)}
                          min="0"
                          step="any"
                          className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-center"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="text"
                          value={Number(item.total || 0).toFixed(2)}
                          readOnly
                          className="w-28 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 focus:outline-none text-sm text-center font-semibold text-blue-700"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
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

          <div className="px-4 sm:px-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <div className="space-y-1">
              <label className={labelClass}>Page Size</label>
              <input
                type="text"
                name="pageSize"
                value={formData.pageSize}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="e.g. 20*26/4"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Printing Type</label>
              <input
                type="text"
                name="printingType"
                value={formData.printingType}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="e.g. Full Color"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Paper</label>
              <input
                type="text"
                name="paper"
                value={formData.paper}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Paper details"
              />
            </div>
          </div>

          <div className="p-4 flex justify-end bg-gray-50/50 border-t border-gray-100">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus size={16} /> Add Row
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className={labelClass}>Sub Total *</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-semibold text-gray-800">
              ₹ {totals.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className={labelClass}>GST Amount</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-semibold text-gray-800">
              ₹ {totals.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
            <label className={labelClass}>Grand Total</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-bold text-blue-600">
              ₹ {totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2">
          <label className={labelClass}>Note</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleInputChange}
            rows="2"
            className={inputClass}
            placeholder="Enter additional notes..."
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/estimates')}
            className="w-full sm:w-auto px-8 py-3 rounded-lg border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white px-10 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : (editData ? 'Update Estimate' : 'Save Estimate')}
          </button>
        </div>
      </form>

      {isAddPartyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Party</h2>
                <p className="text-sm text-gray-500">Basic details for quotation</p>
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
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  name="address"
                  value={partyForm.address}
                  onChange={handlePartyFormChange}
                  className={inputClass}
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
                  className={inputClass}
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

export default AddEstimate;
