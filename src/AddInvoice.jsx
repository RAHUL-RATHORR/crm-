import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Trash2, Search, ChevronDown, X, Printer, UserPlus } from 'lucide-react';
import { buildPartySuggestions, partyNameExists } from './utils/partySuggestions';

const EMPTY_PARTY_FORM = {
  partyName: '',
  address: '',
  contactNo: '',
  emailId: '',
  gstNo: '',
  jobName: 'Direct Invoice',
};

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';

const defaultInvoiceItem = () => ({
  id: Date.now() + Math.random(),
  description: '',
  hsn: '',
  qty: 0,
  rate: 0,
  gstPercent: 18,
  total: 0,
  gstAmount: 0,
});

const calcInvoiceItem = (item, fallbackGst = 18) => {
  const qty = parseFloat(item.qty || 0);
  const rate = parseFloat(item.rate || 0);
  const gstPercent = parseFloat(item.gstPercent ?? fallbackGst);
  const total = qty * rate;
  const gstAmount = (total * gstPercent) / 100;
  return { ...item, qty, rate, gstPercent, total, gstAmount };
};

const normalizeInvoiceItems = (editData) => {
  if (editData?.items?.length) {
    return editData.items.map((item) => calcInvoiceItem({
      ...item,
      id: item.id || item._id || Date.now() + Math.random(),
      hsn: item.hsn || '',
      gstPercent: item.gstPercent ?? editData.gstPercent ?? 18,
    }, editData.gstPercent ?? 18));
  }
  return [defaultInvoiceItem()];
};

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
    gstType: editData ? (editData.gstType || 'CGST/SGST') : 'CGST/SGST',
    freight: editData ? (editData.freight || 0) : 0,
    reverseCharge: editData ? (editData.reverseCharge || 'No') : 'No',
  });

  const [items, setItems] = useState(() => normalizeInvoiceItems(editData));

  const [jobCardSearchTerm, setJobCardSearchTerm] = useState('');
  const [isJobCardDropdownOpen, setIsJobCardDropdownOpen] = useState(false);
  const jobCardDropdownRef = useRef(null);

  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [partyForm, setPartyForm] = useState(EMPTY_PARTY_FORM);
  const [isSavingParty, setIsSavingParty] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const partyDropdownRef = useRef(null);

  const partySuggestions = useMemo(() => buildPartySuggestions(jobCards), [jobCards]);

  const filteredPartySuggestions = partySuggestions.filter((party) => {
    const query = formData.party.trim().toLowerCase();
    if (!query) return true;
    return party.partyName.toLowerCase().includes(query);
  }).slice(0, 8);

  const showAddPartyButton = formData.party.trim().length > 0
    && !partyNameExists(partySuggestions, formData.party);

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
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target)) {
        setIsPartyDropdownOpen(false);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'party') {
      setIsPartyDropdownOpen(true);
    }
  };

  const applyPartySuggestion = (party) => {
    const latestJobCard = jobCards.find(
      (card) => (card.partyName || card.companyName || '').trim().toLowerCase() === party.partyName.toLowerCase()
    );

    setFormData((prev) => ({
      ...prev,
      party: party.partyName,
      jobCard: latestJobCard?.jobNumber || party.jobNumber || prev.jobCard,
      orderNo: latestJobCard?.jobNumber || party.jobNumber || prev.orderNo,
    }));
    setIsPartyDropdownOpen(false);
  };

  const openAddPartyModal = () => {
    setPartyForm({
      ...EMPTY_PARTY_FORM,
      partyName: formData.party.trim(),
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
          jobName: partyForm.jobName.trim() || 'Direct Invoice',
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
      setFormData((prev) => ({
        ...prev,
        party: savedJobCard.partyName || partyForm.partyName.trim(),
        jobCard: savedJobCard.jobNumber || prev.jobCard,
        orderNo: savedJobCard.jobNumber || prev.orderNo,
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
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;
        return calcInvoiceItem({ ...item, [field]: value });
      })
    );
  };

  const addRow = () => {
    setItems((prev) => [...prev, defaultInvoiceItem()]);
  };

  const removeRow = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const computedItems = useMemo(() => items.map((item) => calcInvoiceItem(item)), [items]);

  const subTotal = computedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const itemsGstAmount = computedItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
  const freight = Number(formData.freight) || 0;
  const freightGstPercent = computedItems[0]?.gstPercent ?? 18;
  const freightGstAmount = (freight * freightGstPercent) / 100;
  const gstAmount = itemsGstAmount + freightGstAmount;
  const grandTotal = subTotal + freight + gstAmount;
  const invoiceGstPercent = computedItems.length
    ? Math.round(computedItems.reduce((sum, item) => sum + item.gstPercent, 0) / computedItems.length)
    : 18;

  const buildInvoicePayload = () => ({
    invoiceNumber: formData.invoiceNo,
    date: invoiceDate.toISOString(),
    jobCard: formData.jobCard,
    orderNo: formData.orderNo,
    orderDate: orderDate.toISOString(),
    partyName: formData.party,
    items: computedItems,
    subTotal,
    freight,
    reverseCharge: formData.reverseCharge || 'No',
    gstPercent: invoiceGstPercent,
    gstType: formData.gstType,
    gstAmount,
    totalAmount: grandTotal,
  });

  const saveInvoice = async () => {
    const response = await fetch(`${API_BASE_URL}/api/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildInvoicePayload()),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save invoice');
    }

    return response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.party.trim()) {
      alert('Party name is required');
      return;
    }

    setIsSavingInvoice(true);
    try {
      await saveInvoice();
      navigate('/invoice/list');
    } catch (err) {
      console.error('Error saving invoice:', err);
      alert(err.message || 'Failed to save invoice. Is server running?');
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!formData.party.trim()) {
      alert('Party name is required');
      return;
    }

    setIsSavingInvoice(true);
    try {
      const saved = await saveInvoice();
      navigate('/invoice/list', { state: { printInvoiceId: saved._id } });
    } catch (err) {
      console.error('Error saving invoice:', err);
      alert(err.message || 'Failed to save invoice. Is server running?');
    } finally {
      setIsSavingInvoice(false);
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
            <div className="space-y-1 relative z-20" ref={partyDropdownRef}>
              <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Party *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="party"
                    value={formData.party}
                    onChange={handleInputChange}
                    onFocus={() => setIsPartyDropdownOpen(true)}
                    onBlur={() => {
                      const match = partySuggestions.find(
                        (party) => party.partyName.toLowerCase() === formData.party.trim().toLowerCase()
                      );
                      if (match) applyPartySuggestion(match);
                    }}
                    required
                    placeholder="Type party name..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
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
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider w-56">Description *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider w-40">HSN/SAC</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-24">Qty *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-28">Rate *</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-24">GST %</th>
                  <th className="px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider text-center w-32">Amount</th>
                  <th className="px-6 py-3 w-14"></th>
                </tr>
              </thead>
              <tbody>
                {computedItems.map((item) => (
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
                          type="number"
                          value={item.gstPercent}
                          onChange={(e) => handleItemChange(item.id, 'gstPercent', e.target.value)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
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
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">GST Amount</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-semibold text-gray-800">
              ₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Grand Total</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-lg font-bold text-blue-600">
              ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleSaveAndPrint}
            disabled={isSavingInvoice}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Printer size={18} />
            {isSavingInvoice ? 'Saving...' : 'Save & Print'}
          </button>
          <button
            type="submit"
            disabled={isSavingInvoice}
            className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white px-10 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {isSavingInvoice ? 'Saving...' : (editData ? 'Update Invoice' : 'Save Invoice')}
          </button>
        </div>
      </form>

      {isAddPartyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Party</h2>
                <p className="text-sm text-gray-500">Basic details for invoice printing</p>
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

export default AddInvoice;
