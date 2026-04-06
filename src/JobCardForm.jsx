import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useLocation } from 'react-router-dom';

export default function JobCardForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [jobDate, setJobDate] = useState(editData ? new Date(editData.jobDate) : new Date());

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const jobCard = {
      ...Object.fromEntries(fd.entries()),
      jobDate: jobDate.toISOString(),
      companyName: fd.get('partyName'), // alias for backward compatibility
    };

    try {
      const response = await fetch("https://crm-qpw8.onrender.com/api/jobcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jobCard)
      });
      if (response.ok) {
        navigate('/job-card-list');
      } else {
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
        console.error("Save Error:", errorData);
      }
    } catch (error) {
      alert("Network Error: Could not connect to server.");
      console.error("Error saving job card:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 pb-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
          Manage Job Card
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base italic">Enter job card details below</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Section 1: Basic Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Basic Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Party Name *</label>
              <input type="text" name="partyName" defaultValue={editData?.partyName} required className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter party name" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Job Name *</label>
              <input type="text" name="jobName" defaultValue={editData?.jobName} required className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter job name" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Job No *</label>
              <input type="text" name="jobNumber" defaultValue={editData?.jobNumber} required className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter job no" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Job Qty</label>
              <input type="number" name="jobQty" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="0" />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Job Date</label>
              <DatePicker
                selected={jobDate}
                onChange={(date) => setJobDate(date)}
                wrapperClassName="w-full"
                className="w-full h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 space-y-2 lg:mt-2">
              <label className="text-sm font-medium text-gray-700 block">Paper Type</label>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="paperType" className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked />
                  <span className="text-sm text-gray-700">Company Paper</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="paperType" className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Paper Party</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Printing Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Printing Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Control Print</label>
              <input type="text" name="controlPrint" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col pt-0 sm:pt-6">
              <input type="text" name="paper" placeholder="Paper" defaultValue={editData?.paper} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Printing U/C</label>
              <input type="text" name="printingUC" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Printing Color</label>
              <select name="printingType" defaultValue={editData?.printingType} className="h-10 border border-gray-200 rounded-lg px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <option>Select Color</option>
                <option value="CMYK">CMYK</option>
                <option value="Pantone">Pantone</option>
                <option value="Black & White">Black & White</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Printing Price</label>
              <input type="number" name="printingPrice" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="0" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Binding No. Finished</label>
              <select name="bindingNo" className="h-10 border border-gray-200 rounded-lg px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <option>Select Binding</option>
                <option>Perfect Binding</option>
                <option>Saddle Stitch</option>
                <option>Spiral</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Binding Note</label>
              <input type="text" name="bindingNote" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">File Path</label>
              <input type="text" name="filePath" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Plate No</label>
              <select name="plateNo" className="h-10 border border-gray-200 rounded-lg px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <option>Select Plate No</option>
                <option>Plate 1</option>
                <option>Plate 2</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Plate Price</label>
              <input type="number" name="platePrice" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="0" />
            </div>
          </div>
        </div>

        {/* Section 3: Job Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-teal-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Job Summary
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-b border-gray-100 pb-6 mb-6">
            <div className="flex flex-col sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Plate From</label>
              <input type="text" name="plateFrom" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Paper From</label>
              <input type="text" name="paperFrom" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Paper Size</label>
              <input type="text" name="paperSize" defaultValue={editData?.paperSize} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Cutting Size</label>
              <input type="text" name="cuttingSize" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Paper GSM</label>
              <input type="text" name="paperGSM" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">Printing Sheet</label>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="printSheet" className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked />
                  <span className="text-sm text-gray-700">Single</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="printSheet" className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Double</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Folding</label>
              <input type="text" name="folding" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>

            <div className="flex flex-col sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2">Job Color</label>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 h-10">
                {[1, 2, 3, 4].map((num) => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:col-span-2 lg:mt-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Job Counter</label>
              <input type="number" name="jobCounter" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="0" />
            </div>

            <div className="flex flex-col sm:col-span-2 lg:mt-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <div className="relative h-10">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">₹</span>
                </div>
                <input type="number" name="totalAmount" defaultValue={editData?.totalAmount} className="w-full h-full pl-8 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-semibold" placeholder="0" />
              </div>
            </div>

            <div className="space-y-1 col-span-full mt-4">
              <label className="text-sm font-medium text-gray-700">Note</label>
              <textarea name="notes" className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" rows="3" placeholder="Enter any extra instructions or notes..."></textarea>
            </div>

          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {editData ? 'Update Job Card' : 'Save Job Card'}
        </button>
      </div>
    </form>
  );
}
