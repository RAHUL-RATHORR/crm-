import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useLocation } from 'react-router-dom';

export default function JobCardForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [jobDate, setJobDate] = useState(editData ? new Date(editData.jobDate) : new Date());
  const [paperStocks, setPaperStocks] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(editData?.paper || '');

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('http://localhost:5011/api/paper-stock');
        const data = await res.json();
        setPaperStocks(data);
      } catch (err) {
        console.error("Stock fetch error:", err);
      }
    };
    fetchStocks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const jobCard = {
      ...Object.fromEntries(fd.entries()),
      jobDate: jobDate.toISOString(),
      companyName: fd.get('partyName'), // alias for backward compatibility
      // Boolean conversion for binding checkboxes
      bindingCenterPin: fd.get('bindingCenterPin') === 'on',
      bindingSilai: fd.get('bindingSilai') === 'on',
      bindingSidePin: fd.get('bindingSidePin') === 'on',
      bindingFolding: fd.get('bindingFolding') === 'on',
      bindingPerforation: fd.get('bindingPerforation') === 'on',
      bindingNumbring: fd.get('bindingNumbring') === 'on',
      bindingRegister: fd.get('bindingRegister') === 'on',
    };

    try {
      const response = await fetch("http://localhost:5011/api/jobcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jobCard)
      });
      if (response.ok) {
        window.dispatchEvent(new Event('fetchNotifications'));
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Party Name *</label>
              <input type="text" name="partyName" defaultValue={editData?.partyName} required className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter party name" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" defaultValue={editData?.address} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter address" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Contact Details</label>
              <input type="text" name="contactNo" defaultValue={editData?.contactNo} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Phone or Email" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">GST No.</label>
              <input type="text" name="gstNo" defaultValue={editData?.gstNo} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter GST number" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Date</label>
              <DatePicker
                selected={jobDate}
                onChange={(date) => setJobDate(date)}
                wrapperClassName="w-full"
                className="w-full h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Job Quantity *</label>
              <input type="number" name="jobQty" defaultValue={editData?.jobQty || 0} required className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="0" />
            </div>
          </div>
        </div>

        {/* Section 2: Type Of Work */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Type Of Work
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Page Size</label>
              <input type="text" name="pageSize" defaultValue={editData?.pageSize} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="e.g. A4, 1/4" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Page</label>
              <input type="text" name="pageCount" defaultValue={editData?.pageCount} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Number of pages" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Color</label>
              <select name="printingType" defaultValue={editData?.printingType} className="h-10 border border-gray-200 rounded-lg px-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <option value="">Select Color</option>
                <option value="Single Color">Single Color</option>
                <option value="Multi Color">Multi Color</option>
                <option value="CMYK">CMYK</option>
                <option value="Pantone">Pantone</option>
                <option value="Black & White">Black & White</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Computer Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Computer Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Compose Design</label>
              <div className="flex items-center gap-6 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="composeDesign"
                    value="Yes"
                    defaultChecked={editData?.composeDesign === 'Yes'}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="composeDesign"
                    value="No"
                    defaultChecked={editData?.composeDesign !== 'Yes'}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* Section 4: Paper details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-sky-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Paper details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Select Paper (From Stock)</label>
              <select 
                name="paper" 
                value={selectedPaper}
                onChange={(e) => setSelectedPaper(e.target.value)}
                className="h-10 border border-gray-200 rounded-lg px-4 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              >
                <option value="">-- Choose Paper --</option>
                {paperStocks.map(stock => (
                  <option key={stock._id} value={stock.name}>
                    {stock.name} ({stock.gsm} GSM) - Stock: {stock.quantity}
                  </option>
                ))}
                <option value="Other">Other (Custom)</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Paper GSM</label>
              <input
                type="text"
                name="paperGSM"
                defaultValue={editData?.paperGSM}
                className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="e.g. 350, 130"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Cover paper count</label>
              <input
                type="number"
                name="coverPaperCount"
                defaultValue={editData?.coverPaperCount || 0}
                min="0"
                className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Inner paper count</label>
              <input
                type="number"
                name="innerPaperCount"
                defaultValue={editData?.innerPaperCount || 0}
                min="0"
                className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Paper Type</label>
              <div className="flex items-center gap-6 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paperSource"
                    value="Party paper"
                    defaultChecked={editData?.paperSource === 'Party paper'}
                    className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700">Party paper</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paperSource"
                    value="Company paper"
                    defaultChecked={editData?.paperSource !== 'Party paper'}
                    className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700">Company paper</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Printing Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Printing Details
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Plate Number</label>
              <input type="text" name="plateNo" defaultValue={editData?.plateNo} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="Enter plate no" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Quantity Of Plates</label>
              <input type="number" name="plateQty" defaultValue={editData?.plateQty || 0} min="0" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Printing</label>
              <input type="number" name="printingQty" defaultValue={editData?.printingQty || 0} min="0" className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Lamination</label>
              <select name="lamination" defaultValue={editData?.lamination} className="h-10 border border-gray-200 rounded-lg px-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all">
                <option value="">Select Lamination</option>
                <option value="BOPP">BOPP</option>
                <option value="MATT">MATT</option>
                <option value="GLOSS">GLOSS</option>
                <option value="AQUOS COATING">AQUOS COATING</option>
                <option value="UV">UV</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Plate</label>
              <div className="flex items-center gap-4 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="plateType" value="Old" defaultChecked={editData?.plateType === 'Old'} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Old</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="plateType" value="New" defaultChecked={editData?.plateType !== 'Old'} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">New</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Binding */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-amber-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Binding
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {[
              { name: 'bindingCenterPin', label: 'Center Pin' },
              { name: 'bindingSilai', label: 'Silai' },
              { name: 'bindingSidePin', label: 'Side Pin' },
              { name: 'bindingFolding', label: 'Folding' },
              { name: 'bindingPerforation', label: 'Perforation' },
              { name: 'bindingNumbring', label: 'Numbring' },
              { name: 'bindingRegister', label: 'Register' }
            ].map(item => (
              <label key={item.name} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name={item.name}
                  defaultChecked={editData?.[item.name]}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 transition-all"
                />
                <span className="text-sm text-gray-700 group-hover:text-amber-700 transition-colors uppercase font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 7: Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-teal-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Notes
          </div>

          <div className="w-full">
            <label className="text-sm font-medium text-gray-700 mb-2 block font-semibold tracking-wide">Extra Instructions / Notes</label>
            <textarea
              name="notes"
              defaultValue={editData?.notes}
              className="w-full h-40 border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none shadow-sm text-sm"
              placeholder="Enter any extra instructions or notes here..."
            ></textarea>
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
