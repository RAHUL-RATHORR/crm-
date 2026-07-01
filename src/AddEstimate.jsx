import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Save } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';

const buildFormFromEstimate = (editData) => ({
  quoteDate: editData?.quoteDate ? new Date(editData.quoteDate) : new Date(),
  partyName: editData?.partyName || '',
  address: editData?.address || '',
  gstNo: editData?.gstNo || '',
  jobName: editData?.jobName || '',
  pageSize: editData?.pageSize || '',
  jobQty: editData?.jobQty || '',
  printingType: editData?.printingType || '',
  paper: editData?.paper || '',
  totalAmount: editData?.totalAmount ?? '',
  salesPerson: editData?.salesPerson || 'Admin',
  paymentTerms: editData?.paymentTerms || '7 Days',
});

const AddEstimate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [formData, setFormData] = useState(() => buildFormFromEstimate(editData));
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.partyName.trim()) {
      alert('Party Name is required');
      return;
    }

    setIsSaving(true);

    const payload = {
      ...formData,
      totalAmount: Number(formData.totalAmount) || 0,
      quoteDate: formData.quoteDate ? new Date(formData.quoteDate) : new Date(),
    };

    try {
      const url = editData?._id
        ? `${API_BASE_URL}/api/estimate/${editData._id}`
        : `${API_BASE_URL}/api/estimate`;
      const method = editData?._id ? 'PUT' : 'POST';

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
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className={labelClass}>Quote Date *</label>
              <DatePicker
                selected={formData.quoteDate}
                onChange={(date) => handleChange('quoteDate', date || new Date())}
                wrapperClassName="w-full"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Party Name *</label>
              <input
                type="text"
                value={formData.partyName}
                onChange={(e) => handleChange('partyName', e.target.value)}
                className={inputClass}
                placeholder="Enter party name"
                required
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>GST No</label>
              <input
                type="text"
                value={formData.gstNo}
                onChange={(e) => handleChange('gstNo', e.target.value)}
                className={inputClass}
                placeholder="GSTIN or URP"
              />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={inputClass}
                placeholder="Party address"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Sales Person</label>
              <input
                type="text"
                value={formData.salesPerson}
                onChange={(e) => handleChange('salesPerson', e.target.value)}
                className={inputClass}
              />
            </div>
            {editData?.quoteNumber && (
              <div className="space-y-1">
                <label className={labelClass}>Quote Number</label>
                <input
                  type="text"
                  value={editData.quoteNumber}
                  readOnly
                  className={`${inputClass} bg-gray-100 text-gray-600 cursor-not-allowed`}
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
            Job Details
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-1 sm:col-span-2">
              <label className={labelClass}>Job / Product Name</label>
              <input
                type="text"
                value={formData.jobName}
                onChange={(e) => handleChange('jobName', e.target.value)}
                className={inputClass}
                placeholder="Description of work"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Page Size</label>
              <input
                type="text"
                value={formData.pageSize}
                onChange={(e) => handleChange('pageSize', e.target.value)}
                className={inputClass}
                placeholder="e.g. 20*26/4"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Quantity</label>
              <input
                type="text"
                value={formData.jobQty}
                onChange={(e) => handleChange('jobQty', e.target.value)}
                className={inputClass}
                placeholder="e.g. 10000"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Printing Type</label>
              <input
                type="text"
                value={formData.printingType}
                onChange={(e) => handleChange('printingType', e.target.value)}
                className={inputClass}
                placeholder="e.g. Full Color"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Paper</label>
              <input
                type="text"
                value={formData.paper}
                onChange={(e) => handleChange('paper', e.target.value)}
                className={inputClass}
                placeholder="Paper details"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
          <div className="bg-blue-900 text-white px-6 py-2 w-fit relative font-semibold text-xs sm:text-sm rounded-br-2xl">
            Pricing & Terms
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1">
              <label className={labelClass}>Estimate Price (₹)</label>
              <input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => handleChange('totalAmount', e.target.value)}
                className={`${inputClass} font-bold text-blue-700`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                className={inputClass}
                placeholder="e.g. 7 Days"
              />
            </div>
          </div>
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
    </div>
  );
};

export default AddEstimate;
