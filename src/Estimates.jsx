import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Calculator,
  Check,
  IndianRupee,
  Save,
  FileCheck,
  Printer,
  X,
  Download,
  Plus,
  Pencil,
} from 'lucide-react';
import { downloadAsPDF } from './utils/pdfExport';

const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalHost ? 'http://localhost:5011' : 'https://crm-qpw8.onrender.com';

const EMPTY_FORM = {
  quoteDate: new Date().toISOString().split('T')[0],
  partyName: '',
  address: '',
  gstNo: '',
  jobName: '',
  pageSize: '',
  jobQty: '',
  printingType: '',
  paper: '',
  totalAmount: '',
  salesPerson: 'Admin',
  paymentTerms: '7 Days',
};

const formatQuoteDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [prices, setPrices] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/estimate`);
      const data = await response.json();
      setEstimates(Array.isArray(data) ? data : []);

      const initialPrices = {};
      (Array.isArray(data) ? data : []).forEach((item) => {
        initialPrices[item._id] = item.totalAmount || 0;
      });
      setPrices(initialPrices);
    } catch (error) {
      console.error('Error loading estimates:', error);
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePriceChange = (id, value) => {
    setPrices((prev) => ({ ...prev, [id]: value }));
  };

  const updatePrice = async (id) => {
    const priceValue = prices[id];

    if (priceValue === undefined || priceValue === null || isNaN(Number(priceValue))) {
      alert('Please enter a valid price number');
      return;
    }

    setSaveStatus((prev) => ({ ...prev, [id]: 'saving' }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/estimate/${id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount: Number(priceValue) }),
      });

      if (response.ok) {
        setSaveStatus((prev) => ({ ...prev, [id]: 'saved' }));
        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [id]: 'idle' }));
        }, 3000);
        loadData();
      } else {
        alert('Failed to update price on server');
        setSaveStatus((prev) => ({ ...prev, [id]: 'error' }));
      }
    } catch (error) {
      console.error('Update Error:', error);
      alert('Network Error: Could not connect to the server.');
      setSaveStatus((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (estimate) => {
    setEditingId(estimate._id);
    setFormData({
      quoteDate: estimate.quoteDate ? new Date(estimate.quoteDate).toISOString().split('T')[0] : EMPTY_FORM.quoteDate,
      partyName: estimate.partyName || '',
      address: estimate.address || '',
      gstNo: estimate.gstNo || '',
      jobName: estimate.jobName || '',
      pageSize: estimate.pageSize || '',
      jobQty: estimate.jobQty || '',
      printingType: estimate.printingType || '',
      paper: estimate.paper || '',
      totalAmount: estimate.totalAmount ?? '',
      salesPerson: estimate.salesPerson || 'Admin',
      paymentTerms: estimate.paymentTerms || '7 Days',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();

    if (!formData.partyName.trim()) {
      alert('Party Name is required');
      return;
    }

    setFormSaving(true);

    const payload = {
      ...formData,
      totalAmount: Number(formData.totalAmount) || 0,
      quoteDate: formData.quoteDate ? new Date(formData.quoteDate) : new Date(),
    };

    try {
      const url = editingId
        ? `${API_BASE_URL}/api/estimate/${editingId}`
        : `${API_BASE_URL}/api/estimate`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || 'Failed to save estimate');
        return;
      }

      closeForm();
      loadData();
    } catch (error) {
      console.error('Save Error:', error);
      alert('Network Error: Could not save estimate.');
    } finally {
      setFormSaving(false);
    }
  };

  const handlePrint = (estimate) => {
    setSelectedEstimate(estimate);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setSelectedEstimate(null);
  };

  const executePrint = () => {
    window.scrollTo(0, 0);
    const container = document.querySelector('.a4-page-container');
    if (container) container.scrollTop = 0;
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!selectedEstimate) return;
    await downloadAsPDF(
      'printable-inner',
      `Quotation_${selectedEstimate.quoteNumber}`,
      setIsGenerating
    );
  };

  const filteredEstimates = estimates.filter((item) =>
    item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jobName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPrice = selectedEstimate ? Number(prices[selectedEstimate._id] ?? selectedEstimate.totalAmount ?? 0) : 0;
  const selectedQty = Number(selectedEstimate?.jobQty) || 1;

  return (
    <div className="w-full min-w-0 max-w-full mt-8 pb-12 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <div className="bg-orange-600 w-2 h-8 rounded-full" />
            Estimate & Quotation
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic text-sm">Create and manage quotations with final pricing.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <Calculator size={18} />
          </div>
          <span className="text-sm font-bold text-gray-700">Total Estimates: {estimates.length}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-t-3xl border-x border-t border-gray-50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Party Name or Quote Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 text-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-100 active:scale-95"
          >
            <Plus size={18} />
            Add New Estimate & Quotation
          </button>
          <button
            onClick={loadData}
            className="p-3 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-2xl transition-all border border-gray-100 active:rotate-180 duration-500 group"
            title="Refresh"
          >
            <RefreshCw size={20} className="group-active:scale-90" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-b-3xl shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden max-w-full">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-0 text-left text-sm table-fixed">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black uppercase text-gray-900 tracking-[0.15em] border-b border-gray-200">
                <th className="py-4 px-3 sm:px-4 w-12">S.No.</th>
                <th className="py-4 px-3 sm:px-4 w-[18%]">Quote Details</th>
                <th className="py-4 px-3 sm:px-4 w-[22%]">Party Name</th>
                <th className="py-4 px-3 sm:px-4 w-[16%]">Dimensions / Qty</th>
                <th className="py-4 px-3 sm:px-4 text-center bg-orange-50/50 text-orange-700 w-[18%]">Estimate Price (₹)</th>
                <th className="py-4 px-3 sm:px-4 text-center w-[14%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-orange-500" size={32} />
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Loading Estimates...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEstimates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-gray-400 italic">
                    No estimates found. Click &quot;Add New Estimate &amp; Quotation&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredEstimates.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="py-4 px-3 sm:px-4 text-gray-400 font-bold align-top">{index + 1}</td>
                    <td className="py-4 px-3 sm:px-4 align-top">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                          <FileCheck size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="inline-block max-w-full truncate bg-orange-50 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ring-1 ring-orange-100">
                            {item.quoteNumber}
                          </span>
                          <p className="text-gray-900 font-black mt-1 text-xs sm:text-sm">{formatQuoteDate(item.quoteDate)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 sm:px-4 align-top">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm break-words">{item.partyName}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5 tracking-tight line-clamp-1">{item.address || 'No Address'}</p>
                    </td>
                    <td className="py-4 px-3 sm:px-4 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Size:</span>
                          <span className="text-xs font-bold text-gray-700 break-all">{item.pageSize || '-'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Qty:</span>
                          <span className="text-xs font-black text-blue-600">{item.jobQty || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3 sm:px-4 bg-orange-50/30 align-top">
                      <div className="relative max-w-[130px] mx-auto">
                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                        <input
                          type="number"
                          value={prices[item._id] ?? ''}
                          onChange={(e) => handlePriceChange(item._id, e.target.value)}
                          className="w-full pl-7 pr-2 py-2 bg-white border border-orange-200 rounded-xl font-black text-orange-700 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-center text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-3 sm:px-4 text-center align-top">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditForm(item)}
                          className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                          title="Edit Estimate"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handlePrint(item)}
                          className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                          title="Print Quotation"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={() => updatePrice(item._id)}
                          disabled={saveStatus[item._id] === 'saving'}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:shadow-none shrink-0 ${saveStatus[item._id] === 'saved'
                            ? 'bg-green-600 text-white shadow-green-100'
                            : saveStatus[item._id] === 'error'
                              ? 'bg-red-600 text-white shadow-red-100'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                            }`}
                          title={saveStatus[item._id] === 'saved' ? 'Saved' : 'Update Price'}
                        >
                          {saveStatus[item._id] === 'saving' ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : saveStatus[item._id] === 'saved' ? (
                            <Check size={14} />
                          ) : (
                            <Save size={14} />
                          )}
                          <span className="hidden xl:inline">
                            {saveStatus[item._id] === 'saving'
                              ? 'Saving...'
                              : saveStatus[item._id] === 'saved'
                                ? 'Saved!'
                                : 'Update'}
                          </span>
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-gray-100 shadow-2xl relative max-h-[95vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {editingId ? 'Edit Estimate & Quotation' : 'Add New Estimate & Quotation'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Fill details to create a standalone quotation.</p>
              </div>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Quote Date</label>
                  <input
                    type="date"
                    value={formData.quoteDate}
                    onChange={(e) => handleFormChange('quoteDate', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Party Name *</label>
                  <input
                    type="text"
                    value={formData.partyName}
                    onChange={(e) => handleFormChange('partyName', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                    placeholder="Enter party name"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                    placeholder="Party address"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">GST No</label>
                  <input
                    type="text"
                    value={formData.gstNo}
                    onChange={(e) => handleFormChange('gstNo', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                    placeholder="GSTIN or URP"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Job / Product Name</label>
                  <input
                    type="text"
                    value={formData.jobName}
                    onChange={(e) => handleFormChange('jobName', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                    placeholder="Description of work"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Page Size</label>
                  <input
                    type="text"
                    value={formData.pageSize}
                    onChange={(e) => handleFormChange('pageSize', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                    placeholder="e.g. 20*26/4"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Quantity</label>
                  <input
                    type="text"
                    value={formData.jobQty}
                    onChange={(e) => handleFormChange('jobQty', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                    placeholder="e.g. 10000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Printing Type</label>
                  <input
                    type="text"
                    value={formData.printingType}
                    onChange={(e) => handleFormChange('printingType', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                    placeholder="e.g. Full Color"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Paper</label>
                  <input
                    type="text"
                    value={formData.paper}
                    onChange={(e) => handleFormChange('paper', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                    placeholder="Paper details"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Estimate Price (₹)</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => handleFormChange('totalAmount', e.target.value)}
                    className="w-full px-4 py-3 bg-orange-50 border border-orange-200 rounded-2xl text-sm font-black text-orange-700 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Sales Person</label>
                  <input
                    type="text"
                    value={formData.salesPerson}
                    onChange={(e) => handleFormChange('salesPerson', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Payment Terms</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => handleFormChange('paymentTerms', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all shadow-lg shadow-orange-100 active:scale-95 disabled:opacity-60"
                >
                  {formSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {formSaving ? 'Saving...' : editingId ? 'Update Estimate' : 'Save Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && selectedEstimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-none">
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <h2 className="text-xl font-bold text-gray-800">Quotation Preview</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {isGenerating ? '...' : <Download size={18} />}
                  PDF
                </button>
                <button
                  onClick={executePrint}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  <Printer size={18} /> Print
                </button>
                <button onClick={closePreview} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-grow a4-page-container" id="printable-content">
              <div
                id="printable-inner"
                className="bg-white mx-auto shadow-none a4-page font-sans"
                style={{ color: '#334155' }}
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-1" style={{ color: '#5E9681' }}>
                      Computer Quotation
                    </h1>
                    <div className="mt-2">
                      <h2 className="text-xl font-bold text-gray-800 tracking-tight">Harihar Printers</h2>
                      <p className="text-[10px] text-gray-700 font-medium italic">Your Vision, Our Print.</p>
                    </div>
                  </div>

                  <div className="w-48 border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[12px]">
                      <tbody className="divide-y divide-gray-200">
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase">DATE :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800">{formatQuoteDate(selectedEstimate.quoteDate)}</td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase">Quote No :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800">{selectedEstimate.quoteNumber}</td>
                        </tr>
                        <tr className="bg-gray-50/50">
                          <td className="px-2 py-1.5 font-bold text-gray-700 uppercase">Expiration :</td>
                          <td className="px-2 py-1.5 font-bold text-right text-gray-800">
                            {formatQuoteDate(new Date(new Date(selectedEstimate.quoteDate).getTime() + 7 * 24 * 60 * 60 * 1000))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between gap-10 mb-8 px-1">
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Address :</h4>
                    <div className="text-[12px] space-y-1 font-medium text-gray-600">
                      <p className="font-bold text-gray-800">Harihar Printers</p>
                      <p>Office: J-97, Ashok Chowk, Adarsh Nagar, Jaipur</p>
                      <p>Factory: G-139, Hirawala Ind. Area, Kanota, Jaipur</p>
                      <p>Tel: +91 94140-43763</p>
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="text-[11px] font-black text-gray-900 border-b-2 mb-2 pb-0.5 inline-block uppercase tracking-wider">Quote To :</h4>
                    <div className="text-[12px] space-y-1 font-medium text-gray-600">
                      <p className="font-bold uppercase text-xs" style={{ color: '#5E9681' }}>{selectedEstimate.partyName}</p>
                      <p className="uppercase">{selectedEstimate.address || selectedEstimate.partyName}</p>
                      <p>GSTIN: <span className="font-bold">{selectedEstimate.gstNo || 'URP'}</span></p>
                      <p>Jaipur, Rajasthan</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 mb-8 border border-gray-200">
                  {[
                    { label: 'SALES PERSON', value: selectedEstimate.salesPerson || 'Admin' },
                    { label: 'Quote Number', value: selectedEstimate.quoteNumber },
                    { label: 'PAYMENT TERMS', value: selectedEstimate.paymentTerms || '7 Days' },
                    { label: 'DUE DATE', value: formatQuoteDate(selectedEstimate.quoteDate) },
                  ].map((item, i) => (
                    <div key={i} className={`p-2 border-r border-gray-200 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <p className="text-[10px] font-black text-gray-600 uppercase mb-1" style={{ color: '#5E9681' }}>{item.label}</p>
                      <p className="text-[12px] font-bold text-gray-800">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-8 border border-gray-200 rounded-sm overflow-hidden min-h-[300px] flex flex-col">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-white text-[12px] font-black uppercase tracking-widest" style={{ backgroundColor: '#5E9681' }}>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 w-12 text-center">S.No</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30">Description of Goods</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 text-center w-20">Qty</th>
                        <th className="px-4 py-2.5 border-r border-teal-500/30 text-right w-24">Rate</th>
                        <th className="px-4 py-2.5 text-right w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 flex-grow">
                      <tr className="text-[13px] group">
                        <td className="px-4 py-4 border-r border-gray-50 text-center font-bold text-gray-600 align-top">1</td>
                        <td className="px-4 py-4 border-r border-gray-50 align-top">
                          <div className="space-y-1">
                            <p className="font-black text-teal-900 uppercase text-xs">{selectedEstimate.jobName || 'Printing Job'}</p>
                            <p className="text-[11px] text-gray-700 font-medium leading-relaxed italic">
                              Printing Specifications: {selectedEstimate.printingType || 'Full Color'} /
                              Size: {selectedEstimate.pageSize || 'Standard'} /
                              Paper: {selectedEstimate.paper || 'Premium Stock'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 font-bold align-top text-center text-gray-700">
                          {selectedEstimate.jobQty}
                        </td>
                        <td className="px-4 py-4 border-r border-gray-100 font-bold align-top text-right text-gray-700">
                          ₹ {(selectedPrice / selectedQty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 font-black align-top text-right text-gray-900">
                          ₹ {selectedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-0">
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4 border-r border-gray-50">&nbsp;</td>
                          <td className="px-4 py-4">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t border-gray-200 mt-auto bg-gray-50/50">
                    <div className="flex flex-col w-56 ml-auto border-l border-gray-200">
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-[11px] font-bold text-gray-700 uppercase">Sub Total</span>
                        <span className="text-[12px] font-bold text-gray-800">₹ {selectedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2 border-b border-gray-200">
                        <span className="text-[11px] font-bold text-gray-700 uppercase">GST (If applicable)</span>
                        <span className="text-[12px] font-bold text-gray-800">As per norms</span>
                      </div>
                      <div className="flex justify-between px-4 py-3" style={{ backgroundColor: '#5E9681' }}>
                        <span className="text-[12px] font-black text-white uppercase tracking-wider">Grand Total</span>
                        <span className="text-sm font-black text-white">₹ {selectedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-[11px] text-gray-700 space-y-4">
                  <p className="font-medium">
                    This Quotation is prepared by: <span className="font-bold text-gray-800 ml-1">{selectedEstimate.salesPerson || 'Admin'} @ Harihar Printers</span>
                  </p>

                  <div className="pt-8 grid grid-cols-2 gap-20">
                    <div className="border-t border-gray-300 pt-1">
                      <p className="font-bold uppercase tracking-widest text-[#5E9681]">Quotation accepted by :</p>
                    </div>
                    <div className="border-t border-gray-300 pt-1 text-right">
                      <p className="font-bold uppercase tracking-widest text-[#5E9681]">Authorised Signatory</p>
                    </div>
                  </div>

                  <p className="text-center pt-8 font-medium">
                    If you have any enquiries about this, please contact us on Tel: <span className="text-gray-900 font-bold">+91 0141-2600850, 94140-43763</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
