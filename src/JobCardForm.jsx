import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Layers, Search, FileText } from 'lucide-react';
import { rememberPlateUsage, resolvePlateUseCount } from './utils/plateUsage';
import { mergePaperSizes } from './utils/paperStockSizes';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';

const buildPartySuggestions = (jobCards = []) => {
  const map = new Map();

  jobCards.forEach((card) => {
    const name = (card.partyName || card.companyName || '').trim();
    if (!name) return;

    const key = name.toLowerCase();
    const cardDate = new Date(card.jobDate || card.createdAt || 0);
    const existing = map.get(key);

    if (!existing || cardDate > existing.date) {
      map.set(key, {
        partyName: name,
        address: card.address || '',
        contactNo: card.contactNo || '',
        emailId: card.emailId || '',
        gstNo: card.gstNo || '',
        jobQty: card.jobQty || '',
        useShipAddress: !!(card.useShipAddress || card.shipAddress || card.shipPartyName),
        shipPartyName: card.shipPartyName || '',
        shipAddress: card.shipAddress || '',
        shipContactNo: card.shipContactNo || '',
        shipEmailId: card.shipEmailId || '',
        shipGstNo: card.shipGstNo || '',
        date: cardDate,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.partyName.localeCompare(b.partyName));
};

export default function JobCardForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;

  const [jobDate, setJobDate] = useState(editData ? new Date(editData.jobDate) : new Date());
  const [paperStocks, setPaperStocks] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(editData?.paper || '');
  const [selectedPaperLabel, setSelectedPaperLabel] = useState(editData?.paper || '');
  const [paperGSM, setPaperGSM] = useState(editData?.paperGSM || '');
  const [paperSearchTerm, setPaperSearchTerm] = useState('');
  const [isPaperDropdownOpen, setIsPaperDropdownOpen] = useState(false);
  const [selectedInnerPaper, setSelectedInnerPaper] = useState(editData?.innerPaper || '');
  const [selectedInnerPaperLabel, setSelectedInnerPaperLabel] = useState(editData?.innerPaper || '');
  const [innerPaperSearchTerm, setInnerPaperSearchTerm] = useState('');
  const [isInnerPaperDropdownOpen, setIsInnerPaperDropdownOpen] = useState(false);
  const [compose, setCompose] = useState(editData?.compose || 'No');
  const [design, setDesign] = useState(editData?.design || 'No');
  const [coverPaperCount, setCoverPaperCount] = useState(editData?.coverPaperCount || 0);
  const [coverPaperDetails, setCoverPaperDetails] = useState(editData?.coverPaperDetails || '');
  const [innerPaperGSM, setInnerPaperGSM] = useState(editData?.innerPaperGSM || '');
  const [innerPaperCount, setInnerPaperCount] = useState(editData?.innerPaperCount || 0);
  const [innerPaperDetails, setInnerPaperDetails] = useState(editData?.innerPaperDetails || '');
  const [paperSource, setPaperSource] = useState(editData?.paperSource || 'Company paper');
  const [useShipAddress, setUseShipAddress] = useState(
    editData?.useShipAddress || !!(editData?.shipAddress || editData?.shipPartyName)
  );
  const [plateSize, setPlateSize] = useState(editData?.plateSize || '');
  const [plateUseCount, setPlateUseCount] = useState(editData?.plateUseCount || '');
  const [jobCards, setJobCards] = useState([]);
  const [partySuggestions, setPartySuggestions] = useState([]);
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
  const [partyName, setPartyName] = useState(editData?.partyName || '');
  const [address, setAddress] = useState(editData?.address || '');
  const [contactNo, setContactNo] = useState(editData?.contactNo || '');
  const [emailId, setEmailId] = useState(editData?.emailId || '');
  const [gstNo, setGstNo] = useState(editData?.gstNo || '');
  const [jobQty, setJobQty] = useState(editData?.jobQty || '');
  const [shipPartyName, setShipPartyName] = useState(editData?.shipPartyName || '');
  const [shipAddress, setShipAddress] = useState(editData?.shipAddress || '');
  const [shipContactNo, setShipContactNo] = useState(editData?.shipContactNo || '');
  const [shipEmailId, setShipEmailId] = useState(editData?.shipEmailId || '');
  const [shipGstNo, setShipGstNo] = useState(editData?.shipGstNo || '');
  const paperDropdownRef = useRef(null);
  const innerPaperDropdownRef = useRef(null);
  const partyDropdownRef = useRef(null);

  const filteredPartySuggestions = partySuggestions.filter((party) => {
    const query = partyName.trim().toLowerCase();
    if (!query) return true;
    return party.partyName.toLowerCase().includes(query);
  }).slice(0, 8);

  const applyPartySuggestion = (party) => {
    setPartyName(party.partyName);
    setAddress(party.address);
    setContactNo(party.contactNo);
    setEmailId(party.emailId);
    setGstNo(party.gstNo);
    setJobQty(party.jobQty || '');

    if (party.useShipAddress) {
      setUseShipAddress(true);
      setShipPartyName(party.shipPartyName || party.partyName);
      setShipAddress(party.shipAddress);
      setShipContactNo(party.shipContactNo);
      setShipEmailId(party.shipEmailId);
      setShipGstNo(party.shipGstNo);
    } else {
      setUseShipAddress(false);
      setShipPartyName('');
      setShipAddress('');
      setShipContactNo('');
      setShipEmailId('');
      setShipGstNo('');
    }

    setIsPartyDropdownOpen(false);
  };

  const refreshPlateUseCount = (size, cards = []) => {
    if (!size) {
      setPlateUseCount('');
      return;
    }
    setPlateUseCount(resolvePlateUseCount(size, cards, editData));
  };

  const filteredStocks = paperStocks.filter(stock => {
    const source = stock.paperSource || 'Company paper';
    return source === paperSource;
  });

  const getCoverPaperLabel = (stock) => stock.coverName || stock.name || '';
  const getInnerPaperLabel = (stock) => stock.innerName || stock.name || '';

  const formatCoverPaperOption = (stock) => {
    const name = getCoverPaperLabel(stock);
    const gsm = stock.coverGSM || stock.gsm;
    if (!name) return '';
    const gsmText = gsm ? ` (${gsm} GSM)` : '';
    const sizeText = stock.coverPaperSize ? ` · ${stock.coverPaperSize}` : '';
    return `${name}${gsmText}${sizeText}`;
  };

  const formatInnerPaperOption = (stock) => {
    const name = getInnerPaperLabel(stock);
    const gsm = stock.innerGSM || stock.gsm;
    if (!name) return '';
    const gsmText = gsm ? ` (${gsm} GSM)` : '';
    const sizeText = stock.innerPaperSize ? ` · ${stock.innerPaperSize}` : '';
    return `${name}${gsmText}${sizeText}`;
  };

  const matchesCoverSearch = (stock, term) => {
    const query = term.toLowerCase();
    return (
      getCoverPaperLabel(stock).toLowerCase().includes(query) ||
      String(stock.coverGSM || stock.gsm || '').includes(query) ||
      (stock.coverPaperSize || '').toLowerCase().includes(query)
    );
  };

  const matchesInnerSearch = (stock, term) => {
    const query = term.toLowerCase();
    return (
      getInnerPaperLabel(stock).toLowerCase().includes(query) ||
      String(stock.innerGSM || stock.gsm || '').includes(query) ||
      (stock.innerPaperSize || '').toLowerCase().includes(query)
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (paperDropdownRef.current && !paperDropdownRef.current.contains(event.target)) {
        setIsPaperDropdownOpen(false);
      }
      if (innerPaperDropdownRef.current && !innerPaperDropdownRef.current.contains(event.target)) {
        setIsInnerPaperDropdownOpen(false);
      }
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(event.target)) {
        setIsPartyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchJobCards = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobcard`);
        const cards = await res.json();
        setJobCards(cards);
        setPartySuggestions(buildPartySuggestions(cards));
      } catch (err) {
        console.error('Job card fetch error:', err);
        setJobCards([]);
        setPartySuggestions([]);
      }
    };
    fetchJobCards();
  }, []);

  useEffect(() => {
    if (!isPaperDropdownOpen) {
      setPaperSearchTerm('');
    }
  }, [isPaperDropdownOpen]);

  useEffect(() => {
    if (!isInnerPaperDropdownOpen) {
      setInnerPaperSearchTerm('');
    }
  }, [isInnerPaperDropdownOpen]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/paper-stock`);
        const data = await res.json();
        setPaperStocks(mergePaperSizes(data));
      } catch (err) {
        console.error("Stock fetch error:", err);
      }
    };
    fetchStocks();
  }, []);

  useEffect(() => {
    if (!paperStocks.length) return;

    if (editData?.paper) {
      const coverMatch = paperStocks.find(
        (stock) => getCoverPaperLabel(stock).toLowerCase() === editData.paper.toLowerCase()
      );
      if (coverMatch) {
        setSelectedPaperLabel(formatCoverPaperOption(coverMatch));
      }
    }

    if (editData?.innerPaper) {
      const innerMatch = paperStocks.find(
        (stock) => getInnerPaperLabel(stock).toLowerCase() === editData.innerPaper.toLowerCase()
      );
      if (innerMatch) {
        setSelectedInnerPaperLabel(formatInnerPaperOption(innerMatch));
      }
    }
  }, [paperStocks, editData?.paper, editData?.innerPaper]);

  useEffect(() => {
    refreshPlateUseCount(plateSize, jobCards);
  }, [plateSize, jobCards, editData?._id]);

  const handlePlateSizeChange = (e) => {
    setPlateSize(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const jobCard = {
      ...Object.fromEntries(fd.entries()),
      jobDate: jobDate.toISOString(),
      companyName: fd.get('partyName'), // alias for backward compatibility
      useShipAddress,
      shipPartyName: useShipAddress ? (fd.get('shipPartyName') || '') : '',
      shipAddress: useShipAddress ? (fd.get('shipAddress') || '') : '',
      shipContactNo: useShipAddress ? (fd.get('shipContactNo') || '') : '',
      shipEmailId: useShipAddress ? (fd.get('shipEmailId') || '') : '',
      shipGstNo: useShipAddress ? (fd.get('shipGstNo') || '') : '',
      plateSize: plateSize || undefined,
      plateUseCount: plateUseCount ? Number(plateUseCount) : undefined,
      // Boolean conversion for binding checkboxes
      bindingCenterPin: fd.get('bindingCenterPin') === 'on',
      bindingSilai: fd.get('bindingSilai') === 'on',
      bindingSidePin: fd.get('bindingSidePin') === 'on',
      bindingFolding: fd.get('bindingFolding') === 'on',
      bindingPerforation: fd.get('bindingPerforation') === 'on',
      bindingNumbring: fd.get('bindingNumbring') === 'on',
      bindingRegister: fd.get('bindingRegister') === 'on',
      bindingGlue: fd.get('bindingGlue') === 'on',
      bindingKachhi: fd.get('bindingKachhi') === 'on',
      bindingPukki: fd.get('bindingPukki') === 'on',
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/jobcard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jobCard)
      });
      if (response.ok) {
        const saved = await response.json();
        rememberPlateUsage(saved.plateSize || plateSize, saved.plateUseCount || plateUseCount);
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
      {editData?._id && <input type="hidden" name="_id" value={editData._id} />}
      {editData?.jobNumber && <input type="hidden" name="jobNumber" value={editData.jobNumber} />}
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
            <div className="flex flex-col relative" ref={partyDropdownRef}>
              <label className="text-sm font-medium text-gray-700 mb-1">Party Name *</label>
              <input
                type="text"
                name="partyName"
                value={partyName}
                onChange={(e) => {
                  setPartyName(e.target.value);
                  setIsPartyDropdownOpen(true);
                }}
                onFocus={() => setIsPartyDropdownOpen(true)}
                required
                autoComplete="off"
                className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter party name"
              />
              {isPartyDropdownOpen && filteredPartySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 max-h-56 overflow-y-auto">
                  {filteredPartySuggestions.map((party) => (
                    <button
                      key={party.partyName}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyPartySuggestion(party)}
                      className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-sm font-bold text-gray-900">{party.partyName}</p>
                      {(party.address || party.contactNo || party.jobQty) && (
                        <p className="text-xs text-gray-500 truncate">
                          {[party.address, party.contactNo, party.jobQty && `Qty: ${party.jobQty}`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" name="address" value={address} onChange={(e) => setAddress(e.target.value)} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter address" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Contact No.</label>
              <input type="text" name="contactNo" value={contactNo} onChange={(e) => setContactNo(e.target.value)} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter Phone" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Gmail ID</label>
              <input type="email" name="emailId" value={emailId} onChange={(e) => setEmailId(e.target.value)} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter Gmail ID" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">GST No.</label>
              <input type="text" name="gstNo" value={gstNo} onChange={(e) => setGstNo(e.target.value)} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter GST number" />
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
              <input
                type="text"
                name="jobQty"
                value={jobQty}
                onChange={(e) => setJobQty(e.target.value)}
                required
                className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g. 1000, 50 Books"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useShipAddress}
                onChange={(e) => setUseShipAddress(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-800">Select Ship Address</span>
            </label>
          </div>

          {useShipAddress && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-sm font-semibold text-blue-700 mb-4">Ship Address Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Party Name</label>
                  <input
                    type="text"
                    name="shipPartyName"
                    value={shipPartyName}
                    onChange={(e) => setShipPartyName(e.target.value)}
                    className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter ship party name"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="shipAddress"
                    value={shipAddress}
                    onChange={(e) => setShipAddress(e.target.value)}
                    className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter ship address"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Contact No.</label>
                  <input
                    type="text"
                    name="shipContactNo"
                    value={shipContactNo}
                    onChange={(e) => setShipContactNo(e.target.value)}
                    className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter ship phone"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Gmail ID</label>
                  <input
                    type="email"
                    name="shipEmailId"
                    value={shipEmailId}
                    onChange={(e) => setShipEmailId(e.target.value)}
                    className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter ship Gmail ID"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">GST No.</label>
                  <input
                    type="text"
                    name="shipGstNo"
                    value={shipGstNo}
                    onChange={(e) => setShipGstNo(e.target.value)}
                    className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter ship GST number"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Type Of Work */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
          <div className="absolute top-0 left-6 -translate-y-1/2 bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Type Of Work
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input type="text" name="jobName" defaultValue={editData?.jobName} required className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Enter job/item name" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Item Size</label>
              <input type="text" name="pageSize" defaultValue={editData?.pageSize} className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="e.g. A4, 1/4" />
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
              <label className="text-sm font-medium text-gray-700 mb-2">Compose</label>
              <div className="flex items-center gap-6 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="compose"
                    value="Yes"
                    checked={compose === 'Yes'}
                    onChange={() => setCompose('Yes')}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="compose"
                    value="No"
                    checked={compose === 'No'}
                    onChange={() => setCompose('No')}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Design</label>
              <div className="flex items-center gap-6 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="design"
                    value="Yes"
                    checked={design === 'Yes'}
                    onChange={() => setDesign('Yes')}
                    className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="design"
                    value="No"
                    checked={design === 'No'}
                    onChange={() => setDesign('No')}
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

          {/* Paper Type (Radio group) */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <label className="text-sm font-black text-[#1e3a8a] uppercase tracking-wider mb-2.5 block">Paper Type</label>
            <div className="flex items-center gap-6 h-10">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="radio"
                  name="paperSource"
                  value="Party paper"
                  checked={paperSource === 'Party paper'}
                  onChange={() => {
                    setPaperSource('Party paper');
                    setSelectedPaper('');
                    setSelectedPaperLabel('');
                    setPaperGSM('');
                    setSelectedInnerPaper('');
                    setSelectedInnerPaperLabel('');
                    setInnerPaperGSM('');
                  }}
                  className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                />
                Party paper
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                <input
                  type="radio"
                  name="paperSource"
                  value="Company paper"
                  checked={paperSource === 'Company paper'}
                  onChange={() => {
                    setPaperSource('Company paper');
                    setSelectedPaper('');
                    setSelectedPaperLabel('');
                    setPaperGSM('');
                    setSelectedInnerPaper('');
                    setSelectedInnerPaperLabel('');
                    setInnerPaperGSM('');
                  }}
                  className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500"
                />
                Company paper
              </label>
            </div>
          </div>

          {/* Cover Paper Section */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">Cover Paper Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex flex-col relative" ref={paperDropdownRef}>
                <label className="text-xs font-bold text-gray-500 mb-1">Select Paper (From Stock)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPaperDropdownOpen(!isPaperDropdownOpen)}
                    className={`w-full h-10 border rounded-lg px-4 bg-white flex items-center justify-between transition-all duration-200 ${isPaperDropdownOpen ? 'ring-2 ring-sky-500 border-transparent' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={16} className={selectedPaper ? 'text-sky-500' : 'text-gray-400'} />
                      <span className={`text-sm truncate ${selectedPaper ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                        {selectedPaperLabel || selectedPaper || 'Choose Paper'}
                      </span>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isPaperDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPaperDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 pb-2 mb-2 border-b border-gray-50">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                          <input
                            type="text"
                            placeholder="Search paper..."
                            value={paperSearchTerm}
                            className="w-full bg-gray-50 border-none rounded-md py-1 pl-8 pr-3 text-xs focus:ring-1 focus:ring-sky-500"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setPaperSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {filteredStocks.filter((s) => matchesCoverSearch(s, paperSearchTerm)).length > 0 ? (
                        filteredStocks
                          .filter((s) => matchesCoverSearch(s, paperSearchTerm))
                          .map(stock => (
                            <button
                              key={stock._id}
                              type="button"
                              onClick={() => {
                                setSelectedPaper(getCoverPaperLabel(stock));
                                setSelectedPaperLabel(formatCoverPaperOption(stock));
                                setPaperGSM(stock.coverGSM || stock.gsm || '');
                                if (stock.coverPaperSize) {
                                  setCoverPaperDetails(stock.coverPaperSize);
                                }
                                setIsPaperDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-sky-50 transition-colors ${selectedPaper === getCoverPaperLabel(stock) ? 'bg-sky-50/50 text-sky-700 font-bold' : 'text-gray-700'}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText size={14} className={selectedPaper === getCoverPaperLabel(stock) ? 'text-sky-500' : 'text-gray-300'} />
                                <span className="truncate">
                                  {getCoverPaperLabel(stock)}{' '}
                                  <span className="text-[10px] text-gray-500">
                                    ({stock.coverGSM || stock.gsm} GSM)
                                  </span>
                                  {stock.coverPaperSize && (
                                    <span className="text-[10px] font-bold text-sky-600 ml-1">
                                      · {stock.coverPaperSize}
                                    </span>
                                  )}
                                </span>
                              </div>
                              {selectedPaper === getCoverPaperLabel(stock) && <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />}
                            </button>
                          ))
                      ) : (
                        <div className="px-4 py-2 text-xs text-gray-400 italic">No paper stocks found</div>
                      )}

                      <div className="border-t border-gray-50 mt-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaper('Custom');
                            setSelectedPaperLabel('Custom');
                            setIsPaperDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-xs font-black uppercase tracking-widest transition-colors ${selectedPaper === 'Custom' ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                        >
                          + Use Custom Paper
                        </button>
                      </div>
                    </div>
                  )}
                  <input type="hidden" name="paper" value={selectedPaper} />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Cover paper gsm</label>
                <input
                  type="text"
                  name="paperGSM"
                  value={paperGSM}
                  onChange={(e) => setPaperGSM(e.target.value)}
                  className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="e.g. 350, 250"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Cover paper count</label>
                <input
                  type="number"
                  name="coverPaperCount"
                  value={coverPaperCount}
                  onChange={(e) => setCoverPaperCount(e.target.value)}
                  min="0"
                  className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Cover paper Details</label>
                <input
                  type="text"
                  name="coverPaperDetails"
                  value={coverPaperDetails}
                  onChange={(e) => setCoverPaperDetails(e.target.value)}
                  className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="e.g. Size, Type"
                />
              </div>
            </div>
          </div>

          {/* Inner Paper Section */}
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 pl-1">Inner Paper Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex flex-col relative" ref={innerPaperDropdownRef}>
                <label className="text-xs font-bold text-gray-500 mb-1">Select Paper (From Stock)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsInnerPaperDropdownOpen(!isInnerPaperDropdownOpen)}
                    className={`w-full h-10 border rounded-lg px-4 bg-white flex items-center justify-between transition-all duration-200 ${isInnerPaperDropdownOpen ? 'ring-2 ring-sky-500 border-transparent' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={16} className={selectedInnerPaper ? 'text-sky-500' : 'text-gray-400'} />
                      <span className={`text-sm truncate ${selectedInnerPaper ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                        {selectedInnerPaperLabel || selectedInnerPaper || 'Choose Paper'}
                      </span>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isInnerPaperDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isInnerPaperDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 pb-2 mb-2 border-b border-gray-50">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                          <input
                            type="text"
                            placeholder="Search paper..."
                            value={innerPaperSearchTerm}
                            className="w-full bg-gray-50 border-none rounded-md py-1 pl-8 pr-3 text-xs focus:ring-1 focus:ring-sky-500"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setInnerPaperSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {filteredStocks.filter((s) => matchesInnerSearch(s, innerPaperSearchTerm)).length > 0 ? (
                        filteredStocks
                          .filter((s) => matchesInnerSearch(s, innerPaperSearchTerm))
                          .map(stock => (
                            <button
                              key={stock._id}
                              type="button"
                              onClick={() => {
                                setSelectedInnerPaper(getInnerPaperLabel(stock));
                                setSelectedInnerPaperLabel(formatInnerPaperOption(stock));
                                setInnerPaperGSM(stock.innerGSM || stock.gsm || '');
                                if (stock.innerPaperSize) {
                                  setInnerPaperDetails(stock.innerPaperSize);
                                }
                                setIsInnerPaperDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-sky-50 transition-colors ${selectedInnerPaper === getInnerPaperLabel(stock) ? 'bg-sky-50/50 text-sky-700 font-bold' : 'text-gray-700'}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText size={14} className={selectedInnerPaper === getInnerPaperLabel(stock) ? 'text-sky-500' : 'text-gray-300'} />
                                <span className="truncate">
                                  {getInnerPaperLabel(stock)}{' '}
                                  <span className="text-[10px] text-gray-500">
                                    ({stock.innerGSM || stock.gsm} GSM)
                                  </span>
                                  {stock.innerPaperSize && (
                                    <span className="text-[10px] font-bold text-indigo-600 ml-1">
                                      · {stock.innerPaperSize}
                                    </span>
                                  )}
                                </span>
                              </div>
                              {selectedInnerPaper === getInnerPaperLabel(stock) && <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />}
                            </button>
                          ))
                      ) : (
                        <div className="px-4 py-2 text-xs text-gray-400 italic">No paper stocks found</div>
                      )}

                      <div className="border-t border-gray-50 mt-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInnerPaper('Custom');
                            setSelectedInnerPaperLabel('Custom');
                            setIsInnerPaperDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-xs font-black uppercase tracking-widest transition-colors ${selectedInnerPaper === 'Custom' ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}
                        >
                          + Use Custom Paper
                        </button>
                      </div>
                    </div>
                  )}
                  <input type="hidden" name="innerPaper" value={selectedInnerPaper} />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Inner paper gsm</label>
                <input
                  type="text"
                  name="innerPaperGSM"
                  value={innerPaperGSM}
                  onChange={(e) => setInnerPaperGSM(e.target.value)}
                  className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="e.g. 80, 100"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Inner paper count</label>
                <input
                  type="number"
                  name="innerPaperCount"
                  value={innerPaperCount}
                  onChange={(e) => setInnerPaperCount(e.target.value)}
                  min="0"
                  className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 mb-1">Inner paper Details</label>
                <input
                  type="text"
                  name="innerPaperDetails"
                  value={innerPaperDetails}
                  onChange={(e) => setInnerPaperDetails(e.target.value)}
                  className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="e.g. Extra info"
                />
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
              <label className="text-sm font-medium text-gray-700 mb-1">Plate Size</label>
              <select
                name="plateSize"
                value={plateSize}
                onChange={handlePlateSizeChange}
                className="h-10 border border-gray-200 rounded-lg px-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Select Plate Size</option>
                <option value="560*670">560*670</option>
                <option value="800*1030">800*1030</option>
                <option value="820*1030">820*1030</option>
                <option value="540*780">540*780</option>
                <option value="608*890">608*890</option>
                <option value="715*915">715*915</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Plate Number</label>
              <input
                type="text"
                readOnly
                value={plateSize ? plateUseCount : ''}
                placeholder="Auto"
                className="h-10 border border-gray-200 rounded-lg px-4 bg-gray-50 text-gray-800 font-semibold focus:outline-none cursor-default"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Quantity Of Plates</label>
              <input
                type="text"
                name="plateQty"
                defaultValue={editData?.plateQty}
                className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g. 4, 8 plates"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Printing</label>
              <input
                type="text"
                name="printingQty"
                defaultValue={editData?.printingQty}
                className="h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g. 1000, 2 colors"
              />
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-14 text-gray-700">
          <div className="absolute -top-4 left-6 bg-amber-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm">
            Binding
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[
              { name: 'bindingCenterPin', label: 'Center Pin' },
              { name: 'bindingSilai', label: 'Silai' },
              { name: 'bindingSidePin', label: 'Side Pin' },
              { name: 'bindingFolding', label: 'Folding' },
              { name: 'bindingPerforation', label: 'Perforation' },
              { name: 'bindingNumbring', label: 'Numbring' },
              { name: 'bindingRegister', label: 'Register' },
              { name: 'bindingGlue', label: 'Glue Binding' },
              { name: 'bindingKachhi', label: 'Kechhi Binding' },
              { name: 'bindingPukki', label: 'Pukki Binding' }
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
            <label className="text-sm text-gray-700 mb-2 block font-semibold tracking-wide">Extra Instructions / Notes</label>
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
