import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusSquare, Trash2, Printer, X, Download, Pencil, RefreshCw, Filter, Search, Check, Share2, Loader2, Building2, Hash, Calendar, Layers, FileText, Globe, Phone, Mail, MapPin, FileDigit, Calculator, List, FileCheck, AlertCircle } from 'lucide-react';
import { downloadAsPDF } from './utils/pdfExport';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { syncPlateUsageFromCards } from './utils/plateUsage';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://crm-qpw8.onrender.com'
  : 'https://crm-qpw8.onrender.com';

export default function JobCardListing() {
  const navigate = useNavigate();
  const [jobCards, setJobCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('jobCardColumnVisibility');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved visibility:", e);
      }
    }
    return {
      partyName: true,
      jobNumber: true,
      jobDate: true,
      jobQty: true,
      jobName: true,
      pageSize: true,
      pageCount: false,
      printingType: true,
      paper: true,
      paperGSM: true,
      innerPaperGSM: false,
      lamination: true,
      binding: true,
      createdAt: true
    };
  });

  useEffect(() => {
    localStorage.setItem('jobCardColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const loadData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobcard`);
      const data = await response.json();
      syncPlateUsageFromCards(data);
      setJobCards(data);
    } catch (error) {
      console.error("Error loading job cards:", error);
    }
  };

  useEffect(() => {
    loadData();

    // Close filter dropdown on click outside
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshData = () => {
    loadData();
  };

  const getBindingText = (card) => {
    const bindings = [
      { key: 'bindingCenterPin', label: 'Center Pin' },
      { key: 'bindingSilai', label: 'Silai' },
      { key: 'bindingSidePin', label: 'Side Pin' },
      { key: 'bindingFolding', label: 'Folding' },
      { key: 'bindingPerforation', label: 'Perforation' },
      { key: 'bindingNumbring', label: 'Numbring' },
      { key: 'bindingRegister', label: 'Register' },
      { key: 'bindingGlue', label: 'Glue Binding' },
      { key: 'bindingKachhi', label: 'Kechhi Binding' },
      { key: 'bindingPukki', label: 'Pukki Binding' }
    ].filter(b => card[b.key]).map(b => b.label);
    return bindings.length > 0 ? bindings : null;
  };

  const formatShortDate = (value) =>
    new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const formatShortDateTime = (value) => {
    const d = new Date(value);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  };

  const exportToCSV = () => {
    const visibleData = jobCards.map(card => {
      const exportRow = {};
      if (columnVisibility.partyName) exportRow['Party Name'] = card.partyName;
      if (columnVisibility.jobNumber) exportRow['Job Number'] = card.jobNumber;
      if (columnVisibility.jobDate) exportRow['Job Date'] = new Date(card.jobDate).toLocaleDateString();
      if (columnVisibility.jobQty) exportRow['Job Qty'] = card.jobQty || 0;
      if (columnVisibility.pageSize) exportRow['Page Size'] = card.pageSize || '-';
      if (columnVisibility.pageCount) exportRow['Page Count'] = card.pageCount || '-';
      if (columnVisibility.printingType) exportRow['Color'] = card.printingType || '-';
      if (columnVisibility.paper) exportRow['Paper'] = card.paper || '-';
      if (columnVisibility.paperGSM) exportRow['Paper GSM'] = card.paperGSM || '-';
      if (columnVisibility.lamination) exportRow['Lamination'] = card.lamination || '-';
      if (columnVisibility.binding) exportRow['Binding'] = (getBindingText(card) || []).join(' • ');
      if (columnVisibility.createdAt) exportRow['Created At'] = new Date(card.createdAt).toLocaleString();
      return exportRow;
    });

    if (visibleData.length === 0) return;

    const headers = Object.keys(visibleData[0]);
    const csvContent = [
      headers.join(','),
      ...visibleData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `job_card_listing_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleColumn = (col) => {
    setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const filteredCards = jobCards.filter(card =>
    card.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.jobName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  const handleDelete = (id) => {
    setCardToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (cardToDelete) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/jobcard/${cardToDelete}`, {
          method: "DELETE"
        });
        if (response.ok) {
          setJobCards(jobCards.filter(card => card._id !== cardToDelete));
          setIsDeleteModalOpen(false);
          setCardToDelete(null);
        } else {
          console.error("Failed to delete job card");
        }
      } catch (error) {
        console.error("Error deleting job card:", error);
      }
    }
  };

  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openPreview = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handlePrint = () => {
    window.scrollTo(0, 0);
    const container = document.querySelector('.a4-page-container');
    if (container) container.scrollTop = 0;
    window.print();
  };

  const handleSharePDF = async () => {
    await downloadAsPDF(
      'printable-inner',
      `JobCard_${selectedCard?.jobNumber || 'preview'}`,
      setIsGenerating
    );
  };

  return (
    <div className="w-full px-0 mt-8 pb-12 max-w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Job Card Listings
          </h1>
          <p className="text-gray-500 mt-1 font-medium text-sm sm:text-base italic">Manage and view all your job cards</p>
        </div>
        <button
          onClick={() => navigate('/job-card')}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
        >
          <PlusSquare size={20} />
          Add New Job Card
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-2xl border-x border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-print">
        <div className="relative w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={refreshData}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 group shrink-0"
            title="Refresh Data"
          >
            <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
          <button
            onClick={exportToCSV}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 flex items-center gap-2 text-sm font-semibold shrink-0"
            title="Export CSV"
          >
            <Download size={18} /> <span className="hidden xs:inline">Export</span>
          </button>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-xl transition-all border flex items-center gap-2 text-sm font-semibold ${isFilterOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
              <Filter size={18} /> <span className="hidden xs:inline">Filter</span>
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Column Display</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {[
                    { id: 'partyName', label: 'Party Name' },
                    { id: 'jobNumber', label: 'Job Number' },
                    { id: 'jobDate', label: 'Job Date' },
                    { id: 'jobQty', label: 'Job Qty' },
                    { id: 'jobName', label: 'Item Name' },
                    { id: 'pageSize', label: 'Item Size' },
                    { id: 'pageCount', label: 'Page Count' },
                    { id: 'printingType', label: 'Color' },
                    { id: 'paper', label: 'Paper' },
                    { id: 'paperGSM', label: 'Cover GSM' },
                    { id: 'innerPaperGSM', label: 'Inner GSM' },
                    { id: 'lamination', label: 'Lamination' },
                    { id: 'binding', label: 'Binding' },
                    { id: 'createdAt', label: 'Created At' }
                  ].map((col) => (
                    <label key={col.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                      <span className="text-sm font-medium text-gray-700">{col.label}</span>
                      <div
                        onClick={(e) => { e.preventDefault(); toggleColumn(col.id); }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${columnVisibility[col.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}
                      >
                        {columnVisibility[col.id] && <Check size={12} className="text-white" strokeWidth={4} />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden no-print max-w-full">
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-xs text-left">
            <colgroup>
              <col style={{ width: '28px' }} />
              {columnVisibility.partyName && <col style={{ width: '13%' }} />}
              {columnVisibility.jobNumber && <col style={{ width: '9%' }} />}
              {columnVisibility.jobDate && <col style={{ width: '7%' }} />}
              {columnVisibility.jobQty && <col style={{ width: '10%' }} />}
              {columnVisibility.jobName && <col style={{ width: '14%' }} />}
              {columnVisibility.pageSize && <col style={{ width: '7%' }} />}
              {columnVisibility.pageCount && <col style={{ width: '5%' }} />}
              {columnVisibility.printingType && <col style={{ width: '7%' }} />}
              {columnVisibility.paper && <col style={{ width: '7%' }} />}
              {columnVisibility.paperGSM && <col style={{ width: '5%' }} />}
              {columnVisibility.innerPaperGSM && <col style={{ width: '5%' }} />}
              {columnVisibility.lamination && <col style={{ width: '7%' }} />}
              {columnVisibility.binding && <col style={{ width: '8%' }} />}
              {columnVisibility.createdAt && <col style={{ width: '9%' }} />}
              <col style={{ width: '56px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wide text-[10px]">
                <th className="py-2 px-0.5 text-center normal-case tracking-normal">#</th>
                {columnVisibility.partyName && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Party Name</th>}
                {columnVisibility.jobNumber && <th className="py-2 px-1.5 whitespace-normal leading-tight">Job No.</th>}
                {columnVisibility.jobDate && <th className="py-2 px-1.5 leading-tight">Date</th>}
                {columnVisibility.jobQty && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Qty</th>}
                {columnVisibility.jobName && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Item Name</th>}
                {columnVisibility.pageSize && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Size</th>}
                {columnVisibility.pageCount && <th className="py-2 px-1.5 leading-tight">Pages</th>}
                {columnVisibility.printingType && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Color</th>}
                {columnVisibility.paper && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Paper</th>}
                {columnVisibility.paperGSM && <th className="py-2 px-1.5 leading-tight">C.GSM</th>}
                {columnVisibility.innerPaperGSM && <th className="py-2 px-1.5 leading-tight">I.GSM</th>}
                {columnVisibility.lamination && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Lam.</th>}
                {columnVisibility.binding && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Binding</th>}
                {columnVisibility.createdAt && <th className="py-2 px-1.5 wrap-break-word whitespace-normal leading-tight">Created</th>}
                <th className="py-2 px-1 text-center leading-tight">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan="20" className="py-8 text-center text-gray-500 text-sm">
                    No job cards found.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card, index) => (
                  <tr key={card._id} className="border-b last:border-0 border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-0.5 text-gray-500 align-top text-center text-[11px]">{index + 1}</td>
                    {columnVisibility.partyName && (
                      <td className="py-2 px-1.5 font-medium text-gray-900 align-top wrap-break-word whitespace-normal leading-snug">{card.partyName}</td>
                    )}
                    {columnVisibility.jobNumber && (
                      <td className="py-2 px-1.5 align-top wrap-break-word whitespace-normal leading-snug">
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold inline-block break-all">
                          {card.jobNumber}
                        </span>
                      </td>
                    )}
                    {columnVisibility.jobDate && (
                      <td className="py-2 px-1.5 text-gray-500 align-top whitespace-normal leading-snug">
                        {formatShortDate(card.jobDate)}
                      </td>
                    )}
                    {columnVisibility.jobQty && (
                      <td className="py-2 px-1.5 text-gray-800 font-semibold align-top break-all whitespace-normal overflow-hidden max-w-0 leading-snug">
                        {card.jobQty || 0}
                      </td>
                    )}
                    {columnVisibility.jobName && (
                      <td className="py-2 px-1.5 text-gray-900 align-top wrap-break-word whitespace-normal leading-snug">{card.jobName || '-'}</td>
                    )}
                    {columnVisibility.pageSize && (
                      <td className="py-2 px-1.5 text-gray-700 align-top wrap-break-word whitespace-normal leading-snug">{card.pageSize || '-'}</td>
                    )}
                    {columnVisibility.pageCount && (
                      <td className="py-2 px-1.5 text-gray-700 align-top">{card.pageCount || '-'}</td>
                    )}
                    {columnVisibility.printingType && (
                      <td className="py-2 px-1.5 align-top wrap-break-word whitespace-normal leading-snug">
                        {card.printingType ? (
                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium inline-block">{card.printingType}</span>
                        ) : '-'}
                      </td>
                    )}
                    {columnVisibility.paper && (
                      <td className="py-2 px-1.5 text-gray-700 align-top wrap-break-word whitespace-normal leading-snug">{card.paper || '-'}</td>
                    )}
                    {columnVisibility.paperGSM && <td className="py-2 px-1.5 text-gray-700 align-top">{card.paperGSM || '-'}</td>}
                    {columnVisibility.innerPaperGSM && <td className="py-2 px-1.5 text-gray-700 align-top">{card.innerPaperGSM || '-'}</td>}
                    {columnVisibility.lamination && (
                      <td className="py-2 px-1.5 align-top wrap-break-word whitespace-normal leading-snug">
                        {card.lamination ? (
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-medium inline-block">{card.lamination}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                    )}
                    {columnVisibility.binding && (
                      <td className="py-2 px-1.5 align-top wrap-break-word whitespace-normal leading-snug">
                        {(() => {
                          const chips = getBindingText(card);
                          return chips ? (
                            <div className="flex flex-wrap gap-0.5">
                              {chips.map((b, i) => (
                                <span key={i} className="bg-amber-50 text-amber-700 border border-amber-100 px-1 py-0.5 rounded text-[9px] font-semibold">{b}</span>
                              ))}
                            </div>
                          ) : <span className="text-gray-400">-</span>;
                        })()}
                      </td>
                    )}
                    {columnVisibility.createdAt && (
                      <td className="py-2 px-1.5 text-gray-500 align-top wrap-break-word whitespace-normal leading-tight">
                        <span className="block">{formatShortDateTime(card.createdAt).date}</span>
                        <span className="block text-[10px] text-gray-400">{formatShortDateTime(card.createdAt).time}</span>
                      </td>
                    )}
                    <td className="py-2 px-0.5 align-top">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => openPreview(card)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-0.5 rounded transition-colors focus:outline-none"
                          title="Print Preview"
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          onClick={() => navigate('/job-card', { state: { editData: card } })}
                          className="text-teal-500 hover:text-teal-700 hover:bg-teal-50 p-0.5 rounded transition-colors focus:outline-none"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(card._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded transition-colors focus:outline-none"
                          title="Delete"
                        >
                          <Trash2 size={13} />
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

      {/* Print Preview Modal */}
      {isModalOpen && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-none">
            {/* Modal Header */}
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <h2 className="text-xl font-bold text-gray-800">Job Card Preview</h2>
              <button
                onClick={closePreview}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Printable Content */}
            <div className="p-8 overflow-y-auto grow a4-page-container" id="printable-content">
              <div
                id="printable-inner"
                className="bg-white mx-auto shadow-none a4-page"
              >
                {/* Header Branding */}
                <div className="flex justify-between items-start mb-6 border-b-2 pb-4 px-2" style={{ borderColor: '#1e293b' }}>
                  <div className="grow">
                    <div className="flex items-center gap-4 mb-2">
                      <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-none">
                        Harihar <span className="text-blue-600">Printers</span>
                      </h1>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-gray-700">
                        <span className="text-blue-600 uppercase">Office:</span> J-97, Ashok Chowk, Adarsh Nagar, Jaipur-302 004
                      </p>
                      <p className="text-[10px] font-bold text-gray-700">
                        <span className="text-blue-600 uppercase">Factory:</span> G-139, Hirawala Industrial Area, Kanota, Agra Road, Jaipur
                      </p>
                      <div className="flex gap-4 mt-1">
                        <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                          <Phone size={10} className="text-blue-500" /> 0141-2600850, 9414043763
                        </p>
                        <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                          <Mail size={10} className="text-blue-500" /> hariharprinters1@gmail.com
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="bg-blue-600 text-white px-6 py-1.5 rounded text-[11px] font-black uppercase tracking-widest shadow-sm">
                      Job Card
                    </div>
                    <div className="text-[9px] font-black text-gray-500 uppercase flex flex-col gap-1 mt-2 tracking-wide">
                      <span>GSTIN: <span className="text-gray-900 border-b-2 border-gray-100 pb-0.5 ml-1">08AALPC9959M1ZV</span></span>
                      <span>PAN: <span className="text-gray-900 border-b-2 border-gray-100 pb-0.5 ml-1">AALPC9959M</span></span>
                    </div>
                  </div>
                </div>

                {/* Top Info Grid - Premium Style */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Party Name</span>
                    <span className="text-base font-black text-gray-900 leading-tight uppercase">{selectedCard.partyName}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Job Date</span>
                    <span className="text-base font-black text-gray-900">{new Date(selectedCard.jobDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="col-span-1 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Address</span>
                      <span className="text-[12px] font-bold text-gray-600 uppercase">{selectedCard.address || 'Address Not Provided'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Gmail ID</span>
                      <span className="text-[12px] font-bold text-gray-900 break-all">{selectedCard.emailId || '-'}</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end gap-6 text-right">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Contact</span>
                      <span className="text-[12px] font-bold text-gray-900">{selectedCard.contactNo || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">GST No.</span>
                      <span className="text-[12px] font-bold text-gray-900">{selectedCard.gstNo || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Job Qty</span>
                      <span className="text-[12px] font-black text-blue-600">{selectedCard.jobQty || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Sections */}
                <div className="grid grid-cols-2 gap-x-10">
                  {/* Left Section - Production Details */}
                  <div className="space-y-6">
                    {/* Work Type */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase text-blue-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                        <Calculator size={12} /> Production Specs
                      </h4>
                      <div className="space-y-2">                             {[
                        { label: 'Job Number', value: selectedCard.jobNumber, bold: true, color: 'text-blue-700' },
                        { label: 'Item Name', value: selectedCard.jobName, uppercase: true },
                        { label: 'Item Size', value: selectedCard.pageSize || '-' },
                        { label: 'Color Detail', value: selectedCard.printingType || '-' }
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-end gap-2 text-[13px] border-b border-gray-100 pb-2">
                          <span className="font-bold uppercase text-gray-600 min-w-fit">{row.label}</span>
                          <span className={`text-right ${row.bold ? 'font-black' : 'font-bold'} ${row.color || 'text-gray-900'} ${row.uppercase ? 'uppercase' : ''}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                      </div>
                    </section>

                    {/* Paper Details */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase text-cyan-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                        <List size={12} /> Paper & Stock
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-[11px] font-black text-gray-600 uppercase block">Source</span>
                          <div className={`px-2 py-1 rounded border text-[12px] font-black text-center uppercase ${selectedCard.paperSource === 'Company paper' ? 'bg-cyan-50 border-cyan-100 text-cyan-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                            {selectedCard.paperSource || 'Company paper'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[11px] font-black text-gray-600 uppercase block">Page & GSM</span>
                          <div className="text-[13px] font-bold text-gray-900 border-b border-gray-100 pb-2">
                            C: {selectedCard.coverPaperCount || 0} ({selectedCard.paperGSM || '-'}) / I: {selectedCard.innerPaperCount || 0} ({selectedCard.innerPaperGSM || '-'})
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 border-t border-gray-50 pt-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Cover Details</span>
                          <span className="text-[12px] font-bold text-gray-900">{selectedCard.coverPaperDetails || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">Inner Details</span>
                          <span className="text-[12px] font-bold text-gray-900">{selectedCard.innerPaperDetails || '-'}</span>
                        </div>
                      </div>
                      <div className="mt-2 border-t border-gray-50 pt-2">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="font-bold text-gray-600 uppercase">Paper Type</span>
                          <span className="font-bold text-gray-900 uppercase">{selectedCard.paper || '-'}</span>
                        </div>
                      </div>
                    </section>

                    {/* Binding Options */}
                    {(() => {
                      const selectedBinding = [
                        { key: 'bindingCenterPin', label: 'Center Pin' },
                        { key: 'bindingSilai', label: 'Silai' },
                        { key: 'bindingSidePin', label: 'Side Pin' },
                        { key: 'bindingFolding', label: 'Folding' },
                        { key: 'bindingPerforation', label: 'Perforation' },
                        { key: 'bindingNumbring', label: 'Numbring' },
                        { key: 'bindingRegister', label: 'Register' },
                        { key: 'bindingGlue', label: 'Glue Binding' },
                        { key: 'bindingKachhi', label: 'Kechhi Binding' },
                        { key: 'bindingPukki', label: 'Pukki Binding' }
                      ].filter(item => selectedCard[item.key]);

                      if (selectedBinding.length === 0) return null;

                      return (
                        <section>
                          <h4 className="text-[10px] font-black uppercase text-amber-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                            <FileCheck size={12} /> Post-Press / Binding
                          </h4>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {selectedBinding.map((item, idx) => (
                              <span key={idx} className="bg-amber-50 px-2 py-1 rounded text-[9px] font-black border border-amber-100 uppercase text-amber-700 shadow-sm">
                                {item.label}
                              </span>
                            ))}
                          </div>
                        </section>
                      );
                    })()}
                  </div>

                  {/* Right Section - Print Details & Instructions */}
                  <div className="space-y-6">
                    {/* Printing Tech */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase text-indigo-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                        <Printer size={12} /> Press Details
                      </h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">                             {[
                        { label: 'Compose', value: selectedCard.compose || 'No' },
                        { label: 'Design', value: selectedCard.design || 'No' },
                        { label: 'Plate Type', value: selectedCard.plateType || 'New' },
                        { label: 'Plate Size', value: selectedCard.plateSize || '-' },
                        { label: 'Plate Used', value: selectedCard.plateUseCount || '-' },
                        { label: 'Plate Number', value: selectedCard.plateNo || '-' },
                        { label: 'Plate Qty', value: selectedCard.plateQty || 0 },
                        { label: 'Lamination', value: selectedCard.lamination || '-' }
                      ].map((row, i) => (
                        <div key={i} className="flex flex-col gap-1 border-b border-gray-100 pb-2.5">
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">{row.label}</span>
                          <span className="text-[13px] font-bold text-gray-900 leading-tight">{row.value}</span>
                        </div>
                      ))}
                      </div>
                      <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-center">
                        <span className="text-[11px] font-black text-gray-600 uppercase block mb-1">Printing Quantity</span>
                        <span className="text-2xl font-black text-indigo-700">{selectedCard.printingQty || 0}</span>
                      </div>
                    </section>

                    {/* Work Instructions Box */}
                    <section>
                      <h4 className="text-[10px] font-black uppercase text-rose-600 border-b pb-1 mb-3 tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} /> Work Instructions
                      </h4>
                      <div className="border border-rose-100 p-4 rounded-xl bg-rose-50/20 min-h-25">
                        <p className="text-[11px] italic leading-relaxed text-gray-700 font-medium">
                          {selectedCard.notes || 'Handle with care. Ensure high quality print and accurate alignment.'}
                        </p>
                      </div>
                    </section>

                    {/* Signatory Area */}
                    <div className="pt-8 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="border-b-2 border-gray-100 h-10 mb-2"></div>
                        <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Office Signature</span>
                      </div>
                      <div className="text-center">
                        <div className="border-b-2 border-gray-100 h-10 mb-2"></div>
                        <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Press Signature</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Branded Footer */}
                <div className="mt-auto pt-8 border-t flex justify-between items-center opacity-60 px-2" style={{ borderColor: '#e2e8f0' }}>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-1.5">
                      <Phone size={10} className="text-blue-500" />
                      <span className="text-[9px] font-bold text-gray-600">0141-2600850, 9414043763</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail size={10} className="text-blue-500" />
                      <span className="text-[9px] font-bold text-gray-600">hariharprinters1@gmail.com</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] italic font-bold text-gray-400 block uppercase tracking-widest">
                      Harihar PRINTERS • Production System
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-white flex justify-end gap-3 modal-footer no-print">
              <button
                onClick={closePreview}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Printer size={16} /> Print
              </button>
              <button
                onClick={handleSharePDF}
                disabled={isGenerating}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all ${isGenerating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Share2 size={16} /> Share
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Are you sure?"
        message="Are you sure you want to move to trash?"
      />
    </div>
  );
}



