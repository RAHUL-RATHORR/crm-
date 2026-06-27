import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, MoreHorizontal, Truck, Pencil, ChevronDown, Check, AlertCircle, Printer, X, Download, Phone, Mail, Globe, Building2, MapPin, Calendar, FileDigit } from 'lucide-react';
import { downloadAsPDF } from './utils/pdfExport';
import { printElement } from './utils/printDocument';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import { getBillToDetails, getShipToDetails } from './utils/shipAddress';
import { numberToWords } from './utils/numberToWords';
import { getChallanLineItems, computeLineItemsTotals, buildMergedChallanMeta } from './utils/challanTotals';
import { SELLER, fmtTaxDate, fmtAmt, getStateFromGst, TaxFieldsTable, buildTaxItemLine, TaxItemEmptyRow, EMPTY_PRODUCT_ROWS, CompanyBrandName, TaxCopyBox, TaxCopyTypeControls, DEFAULT_TAX_COPY_SELECTION } from './utils/taxDocumentPrint';

const ChallanList = () => {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [challanToDelete, setChallanToDelete] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Printing states
  const [previewChallans, setPreviewChallans] = useState([]);
  const [selectedChallanIds, setSelectedChallanIds] = useState([]);
  const [partyFilter, setPartyFilter] = useState('');
  const [tempGstType, setTempGstType] = useState('CGST/SGST');
  const [copySelection, setCopySelection] = useState(DEFAULT_TAX_COPY_SELECTION);
  const isIGST = tempGstType === 'IGST';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobCards, setJobCards] = useState([]);

  const isMergedPrint = previewChallans.length > 1;
  const primaryChallan = previewChallans[0] || null;

  const challanItems = previewChallans.flatMap(getChallanLineItems);
  const { subTotal: totalAmount, freight: totalFreight, gstAmount: totalGstAmount, grandTotal } =
    computeLineItemsTotals(challanItems, primaryChallan?.gstPercent ?? 18, previewChallans);
  const mergedMeta = buildMergedChallanMeta(previewChallans);

  const linkedJobCard = primaryChallan
    ? jobCards.find((card) => card.jobNumber === primaryChallan.jobNumber)
    : null;

  const challanPartyFallback = primaryChallan ? { partyName: primaryChallan.partyName } : {};
  const billTo = getBillToDetails(linkedJobCard, challanPartyFallback);
  const shipTo = getShipToDetails(linkedJobCard, challanPartyFallback);
  const billToState = getStateFromGst(billTo.gstNo);
  const shipToState = getStateFromGst(shipTo.gstNo);

  const challanFallbackGst = primaryChallan?.gstPercent ?? 18;
  const freightGstPercent = challanItems[0]?.gstPercent ?? challanFallbackGst;
  const freightCgstAmt = isIGST ? 0 : (totalFreight * (freightGstPercent / 2)) / 100;
  const freightSgstAmt = isIGST ? 0 : (totalFreight * (freightGstPercent / 2)) / 100;
  const freightIgstAmt = isIGST ? (totalFreight * freightGstPercent) / 100 : 0;

  const itemLines = challanItems.map((item, idx) => buildTaxItemLine(item, idx, challanFallbackGst, isIGST));
  const totalQty = itemLines.reduce((sum, row) => sum + (Number(row.item.qty) || 0), 0);
  const totalTaxable = totalAmount + totalFreight;
  const totalCgst = itemLines.reduce((sum, row) => sum + row.cgstAmt, 0) + freightCgstAmt;
  const totalSgst = itemLines.reduce((sum, row) => sum + row.sgstAmt, 0) + freightSgstAmt;
  const totalIgst = itemLines.reduce((sum, row) => sum + row.igstAmt, 0) + freightIgstAmt;
  const amountBeforeTax = totalTaxable;
  const amountWithTax = grandTotal;
  const challanDate = mergedMeta.date || primaryChallan?.date || primaryChallan?.createdAt;
  const challanNoLabel = isMergedPrint ? mergedMeta.challanLabel : primaryChallan?.challanNo;
  const jobRefLabel = isMergedPrint ? mergedMeta.jobRefLabel : primaryChallan?.jobNumber;
  const emptyProductRows = EMPTY_PRODUCT_ROWS;

  const partyCounts = challans.reduce((acc, ch) => {
    const name = (ch.partyName || '').trim();
    if (name) acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const filteredChallans = partyFilter
    ? challans.filter((ch) => (ch.partyName || '').toLowerCase() === partyFilter.toLowerCase())
    : challans;

  const selectedPartyName = selectedChallanIds.length
    ? challans.find((ch) => ch._id === selectedChallanIds[0])?.partyName
    : '';

  useEffect(() => {
    fetchChallans();
    fetch('https://crm-qpw8.onrender.com/api/jobcard')
      .then((res) => res.json())
      .then((data) => setJobCards(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching job cards:', err));
  }, []);

  const fetchChallans = () => {
    fetch('https://crm-qpw8.onrender.com/api/challan')
      .then(res => res.json())
      .then(data => setChallans(data))
      .catch(err => console.error("Error fetching Challans:", err));
  };

  const handleDelete = (id) => {
    setChallanToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (challanToDelete) {
      try {
        const response = await fetch(`https://crm-qpw8.onrender.com/api/challan/${challanToDelete}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchChallans();
          setIsDeleteModalOpen(false);
          setChallanToDelete(null);
        }
      } catch (err) {
        console.error("Error deleting challan:", err);
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setChallans((prev) =>
      prev.map((ch) =>
        ch._id === id ? { ...ch, paymentStatus: newStatus } : ch
      )
    );
    setOpenDropdownId(null);

    try {
      const response = await fetch(`https://crm-qpw8.onrender.com/api/challan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus })
      });

      if (!response.ok) {
        throw new Error("Failed to update status on server");
      }
    } catch (err) {
      console.error("Error updating challan status:", err);
      fetchChallans();
      alert("Failed to update status. Please try again.");
    }
  };

  const toggleChallanSelect = (ch) => {
    setSelectedChallanIds((prev) => {
      if (prev.includes(ch._id)) {
        return prev.filter((id) => id !== ch._id);
      }
      if (prev.length > 0) {
        const first = challans.find((item) => item._id === prev[0]);
        if (first && first.partyName !== ch.partyName) {
          alert('Sirf ek hi party ke challan select kar sakte ho.');
          return prev;
        }
      }
      return [...prev, ch._id];
    });
  };

  const selectAllForParty = () => {
    if (!partyFilter) return;
    const ids = filteredChallans.map((ch) => ch._id);
    setSelectedChallanIds(ids);
  };

  const clearSelection = () => setSelectedChallanIds([]);

  const openPreview = (ch) => {
    setPreviewChallans([ch]);
    setTempGstType(ch.gstType || 'CGST/SGST');
    setCopySelection({ ...DEFAULT_TAX_COPY_SELECTION });
    setIsModalOpen(true);
  };

  const openMergedPreview = () => {
    const selected = challans.filter((ch) => selectedChallanIds.includes(ch._id));
    if (selected.length < 2) {
      alert('Combined print ke liye kam se kam 2 challan select karo.');
      return;
    }
    setPreviewChallans(selected);
    setTempGstType(selected[0]?.gstType || 'CGST/SGST');
    setCopySelection({ ...DEFAULT_TAX_COPY_SELECTION });
    setIsModalOpen(true);
  };

  const handleCopySelectionChange = (id, checked) => {
    setCopySelection((prev) => ({ ...prev, [id]: checked }));
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewChallans([]);
  };

  const handlePrint = () => {
    printElement('printable-challan');
  };

  const handleDownloadPDF = async () => {
    const label = isMergedPrint
      ? `Challan_Combined_${primaryChallan?.partyName || 'party'}`
      : `Challan_${primaryChallan?.challanNo}`;
    await downloadAsPDF('printable-challan', label, setIsGenerating);
  };

  return (
    <div className="w-full px-4 mt-8 pb-12 text-gray-800">
      <div className="no-print">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 group flex items-center gap-3">
              <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
              Manage Challan
            </h1>
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Challan &gt; <span className="text-blue-600">Challan Listings</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6 flex flex-col gap-4 border-b border-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800">Challan Listings</h2>
              <button
                onClick={() => navigate('/challan/add')}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
              >
                <Plus size={18} /> Add New
              </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <select
                  value={partyFilter}
                  onChange={(e) => {
                    setPartyFilter(e.target.value);
                    setSelectedChallanIds([]);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium min-w-48"
                >
                  <option value="">All Parties</option>
                  {Object.entries(partyCounts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([name, count]) => (
                      <option key={name} value={name}>{name} ({count} challan{count > 1 ? 's' : ''})</option>
                    ))}
                </select>
                {partyFilter && (
                  <button
                    type="button"
                    onClick={selectAllForParty}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Select all for {partyFilter}
                  </button>
                )}
              </div>
              {selectedChallanIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedChallanIds.length} selected{selectedPartyName ? ` — ${selectedPartyName}` : ''}
                  </span>
                  {selectedChallanIds.length >= 2 && (
                    <button
                      type="button"
                      onClick={openMergedPreview}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
                    >
                      <Printer size={16} /> Print Combined
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-3 py-2"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-100 pb-40">
            <table className="w-full text-left whitespace-nowrap min-w-200">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                  <th className="px-3 py-4 w-10">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 sm:px-6 py-4">S.No.</th>
                  <th className="px-4 sm:px-6 py-4">Challan Number</th>
                  <th className="px-4 sm:px-6 py-4">Job Card</th>
                  <th className="px-4 sm:px-6 py-4">Party Name</th>
                  <th className="px-4 sm:px-6 py-4">Total Amount</th>
                  <th className="px-4 sm:px-6 py-4">Created At</th>
                  <th className="px-4 sm:px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 sm:px-6 py-10 text-center text-gray-500">
                      {partyFilter ? `No challans found for ${partyFilter}.` : 'No challans found.'}
                    </td>
                  </tr>
                ) : (
                  filteredChallans.map((ch, index) => (
                    <tr key={ch._id} className={`hover:bg-gray-50/80 transition-colors group ${selectedChallanIds.includes(ch._id) ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-3 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedChallanIds.includes(ch._id)}
                          onChange={() => toggleChallanSelect(ch)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          title="Combined print ke liye select karo"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-blue-600 underline underline-offset-4 decoration-blue-100">{ch.challanNo}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-800">
                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-xs text-gray-600 mr-2">
                          {ch.jobNumber}
                        </span>
                        {ch.jobName}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-800">{ch.partyName}</td>
                      <td className="px-4 sm:px-6 py-4 text-sm font-bold text-gray-900">₹ {(ch.grandTotal ?? ch.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500">
                        {new Date(ch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => openPreview(ch)}
                            className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-all active:scale-90"
                            title="Print Challan"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            onClick={() => navigate('/challan/add', { state: { editData: ch } })}
                            className="bg-teal-50 text-teal-600 p-2 rounded-lg hover:bg-teal-100 transition-all active:scale-90"
                            title="Edit challan"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(ch._id)}
                            className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-all active:scale-90"
                            title="Delete challan"
                          >
                            <Trash2 size={16} />
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

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Are you sure?"
          message="Are you sure you want to move this challan to trash?"
        />
      </div>

      {/* Challan Preview & Print Modal */}
      {isModalOpen && primaryChallan && (
        <div className="print-modal-overlay fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4 overflow-y-auto print:static print:overflow-visible print:bg-white print:p-0">
          <div className="print-modal-shell bg-white border border-gray-300 w-full max-w-full relative max-h-[95vh] flex flex-col shadow-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
            <div className="p-4 border-b flex justify-between items-center bg-white modal-header no-print">
              <h2 className="text-xl font-bold text-gray-800">
                {isMergedPrint ? `Combined Challan (${previewChallans.length})` : 'Challan Preview'}
              </h2>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <TaxCopyTypeControls selection={copySelection} onChange={handleCopySelectionChange} />
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200">
                  <span className="text-gray-500 font-medium">GST Mode:</span>
                  <select
                    value={tempGstType}
                    onChange={(e) => setTempGstType(e.target.value)}
                    className="bg-transparent text-blue-700 outline-none cursor-pointer font-bold"
                  >
                    <option value="CGST/SGST">CGST + SGST</option>
                    <option value="IGST">IGST</option>
                  </select>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  {isGenerating ? "..." : <Download size={18} />}
                  PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  <Printer size={18} /> Print
                </button>
                <button
                  onClick={closePreview}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body - Printable Content */}
            <div className="p-2 overflow-y-auto grow a4-page-container print:overflow-visible print:max-h-none print:h-auto print:p-0 print:grow-0" id="printable-content">
              <div
                id="printable-challan"
                className="bg-white w-full shadow-none tax-invoice-print-page"
              >
                <table className="tax-invoice w-full border-collapse text-black" style={{ fontSize: '11px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td colSpan={12} className="tax-cell text-center align-middle py-2">
                        <CompanyBrandName />
                        <p className="tax-header-line">{SELLER.address}</p>
                        <p className="tax-header-line">{SELLER.tel}, {SELLER.email}</p>
                        <p className="tax-header-line"><span className="tax-field-label">GSTIN :</span> {SELLER.gstin}</p>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={12} className="tax-cell tax-blue p-0">
                        <div className="tax-title-bar">
                          <div className="tax-title-text">DELIVERY CHALLAN</div>
                          <TaxCopyBox selection={copySelection} />
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={6} className="tax-cell align-top p-1">
                        <TaxFieldsTable rows={[
                          ['Reverse Charge', primaryChallan.reverseCharge || 'No'],
                          ['Challan No.', challanNoLabel],
                          ['Challan Date', fmtTaxDate(challanDate)],
                          ['State', SELLER.state],
                          ['State Code', SELLER.stateCode],
                        ]} />
                      </td>
                      <td colSpan={6} className="tax-cell align-top p-1">
                        <TaxFieldsTable rows={[
                          ['Transportation Mode', 'Road'],
                          ['Vehicle No.', ''],
                          ['Date of Supply', fmtTaxDate(challanDate)],
                          ['Place of Supply', 'Jaipur'],
                          ['Job Ref', jobRefLabel || ''],
                        ]} />
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={6} className="tax-cell align-top p-0">
                        <div className="tax-blue tax-section-title text-center py-0.5 px-1">Details of Receiver | Billed to:</div>
                        <div className="p-1">
                          <TaxFieldsTable rows={[
                            ['Name', billTo.partyName],
                            ['Address', billTo.address || '-'],
                            ['E-MAIL', billTo.emailId || '-'],
                            ['GSTIN', billTo.gstNo || 'URP'],
                            ['MOBILE', billTo.contactNo || '-'],
                            ['State', billToState.state],
                            ['State Code', billToState.code],
                          ]} />
                        </div>
                      </td>
                      <td colSpan={6} className="tax-cell align-top p-0">
                        <div className="tax-blue tax-section-title text-center py-0.5 px-1">Details of Consignee | Shipped to:</div>
                        <div className="p-1">
                          <TaxFieldsTable rows={[
                            ['Name', shipTo.partyName],
                            ['Address', shipTo.address || '-'],
                            ['E-MAIL', shipTo.emailId || '-'],
                            ['GSTIN', shipTo.gstNo || 'URP'],
                            ['MOBILE', shipTo.contactNo || '-'],
                            ['State', shipToState.state],
                            ['State Code', shipToState.code],
                          ]} />
                        </div>
                      </td>
                    </tr>

                    <tr className="tax-blue text-center font-bold tax-item-header-row">
                      <td className="tax-cell" rowSpan={2}>Sr.<br />No.</td>
                      <td className="tax-cell" rowSpan={2}>Name of product</td>
                      <td className="tax-cell" rowSpan={2}>HSN/SAC</td>
                      <td className="tax-cell" rowSpan={2}>QTY</td>
                      <td className="tax-cell" rowSpan={2}>Unit</td>
                      <td className="tax-cell" rowSpan={2}>Rate</td>
                      <td className="tax-cell" rowSpan={2}>Taxable<br />Value</td>
                      {isIGST ? (
                        <>
                          <td className="tax-cell" colSpan={2}>IGST</td>
                          <td className="tax-cell" colSpan={2}>&nbsp;</td>
                        </>
                      ) : (
                        <>
                          <td className="tax-cell" colSpan={2}>CGST</td>
                          <td className="tax-cell" colSpan={2}>SGST</td>
                        </>
                      )}
                      <td className="tax-cell" rowSpan={2}>Total</td>
                    </tr>
                    <tr className="tax-blue text-center font-bold tax-item-header-row">
                      {isIGST ? (
                        <>
                          <td className="tax-cell">Rate</td>
                          <td className="tax-cell">Amount</td>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell">&nbsp;</td>
                        </>
                      ) : (
                        <>
                          <td className="tax-cell">Rate</td>
                          <td className="tax-cell">Amount</td>
                          <td className="tax-cell">Rate</td>
                          <td className="tax-cell">Amount</td>
                        </>
                      )}
                    </tr>

                    {itemLines.map((row) => (
                      <tr key={`${row.item.challanNo || ''}-${row.idx}`}>
                        <td className="tax-cell text-center align-top tax-item-value">{row.idx}</td>
                        <td className="tax-cell align-top tax-item-value">
                          <div>{row.item.description}</div>
                          {row.item.jobNumber && (
                            <div className="text-[9px] font-bold mt-0.5">Job Ref: {row.item.jobNumber}</div>
                          )}
                          {isMergedPrint && row.item.challanNo && (
                            <div className="text-[9px] font-bold">Challan: {row.item.challanNo}</div>
                          )}
                        </td>
                        <td className="tax-cell text-center align-top tax-item-value">&nbsp;</td>
                        <td className="tax-cell text-center align-top tax-item-value">{Number(row.item.qty || 0)}</td>
                        <td className="tax-cell text-center align-top tax-item-value">PCS</td>
                        <td className="tax-cell text-right align-top tax-item-value">{fmtAmt(row.item.rate)}</td>
                        <td className="tax-cell text-right align-top tax-item-value">{fmtAmt(row.taxable)}</td>
                        {isIGST ? (
                          <>
                            <td className="tax-cell text-center align-top tax-item-gst">{row.igstRate}%</td>
                            <td className="tax-cell text-right align-top tax-item-gst">{fmtAmt(row.igstAmt)}</td>
                            <td className="tax-cell">&nbsp;</td>
                            <td className="tax-cell">&nbsp;</td>
                          </>
                        ) : (
                          <>
                            <td className="tax-cell text-center align-top tax-item-gst">{row.cgstRate}%</td>
                            <td className="tax-cell text-right align-top tax-item-gst">{fmtAmt(row.cgstAmt)}</td>
                            <td className="tax-cell text-center align-top tax-item-gst">{row.sgstRate}%</td>
                            <td className="tax-cell text-right align-top tax-item-gst">{fmtAmt(row.sgstAmt)}</td>
                          </>
                        )}
                        <td className="tax-cell text-right align-top tax-item-total">{fmtAmt(row.lineTotal)}</td>
                      </tr>
                    ))}

                    <TaxItemEmptyRow rowCount={emptyProductRows} />

                    {totalFreight > 0 && (
                      <tr>
                        <td className="tax-cell text-center align-top">{itemLines.length + 1}</td>
                        <td className="tax-cell align-top">Freight</td>
                        <td className="tax-cell">&nbsp;</td>
                        <td className="tax-cell">&nbsp;</td>
                        <td className="tax-cell">&nbsp;</td>
                        <td className="tax-cell">&nbsp;</td>
                        <td className="tax-cell text-right align-top">{fmtAmt(totalFreight)}</td>
                        {isIGST ? (
                          <>
                            <td className="tax-cell text-center align-top tax-item-gst">{freightGstPercent}%</td>
                            <td className="tax-cell text-right align-top tax-item-gst">{fmtAmt(freightIgstAmt)}</td>
                            <td className="tax-cell">&nbsp;</td>
                            <td className="tax-cell">&nbsp;</td>
                          </>
                        ) : (
                          <>
                            <td className="tax-cell text-center align-top tax-item-gst">{freightGstPercent / 2}%</td>
                            <td className="tax-cell text-right align-top tax-item-gst">{fmtAmt(freightCgstAmt)}</td>
                            <td className="tax-cell text-center align-top tax-item-gst">{freightGstPercent / 2}%</td>
                            <td className="tax-cell text-right align-top tax-item-gst">{fmtAmt(freightSgstAmt)}</td>
                          </>
                        )}
                        <td className="tax-cell text-right align-top font-bold">
                          {fmtAmt(totalFreight + freightCgstAmt + freightSgstAmt + freightIgstAmt)}
                        </td>
                      </tr>
                    )}

                    <tr className="tax-blue font-bold">
                      <td className="tax-cell" colSpan={3}>Total Quantity</td>
                      <td className="tax-cell text-center">{totalQty}</td>
                      <td className="tax-cell" colSpan={2}>&nbsp;</td>
                      <td className="tax-cell text-right">{fmtAmt(totalTaxable)}</td>
                      {isIGST ? (
                        <>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell text-right tax-item-gst">{fmtAmt(totalIgst)}</td>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell">&nbsp;</td>
                        </>
                      ) : (
                        <>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell text-right tax-item-gst">{fmtAmt(totalCgst)}</td>
                          <td className="tax-cell">&nbsp;</td>
                          <td className="tax-cell text-right tax-item-gst">{fmtAmt(totalSgst)}</td>
                        </>
                      )}
                      <td className="tax-cell text-right">{fmtAmt(amountWithTax)}</td>
                    </tr>

                    <tr>
                      <td colSpan={6} className="tax-cell align-top p-0">
                        <div className="tax-blue tax-section-title text-center py-0.5 px-1">Total Challan Amount in words</div>
                        <p className="text-center py-2 px-1 tax-amount-words">{numberToWords(amountWithTax)} Only</p>
                      </td>
                      <td colSpan={6} className="tax-cell align-top p-0">
                        <table className="w-full border-collapse tax-summary-table">
                          <tbody>
                            <tr>
                              <td className="tax-cell font-bold tax-summary-label">Total Amount Before Tax</td>
                              <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(amountBeforeTax)}</td>
                            </tr>
                            {isIGST ? (
                              <tr>
                                <td className="tax-cell font-bold tax-summary-label">Add : IGST</td>
                                <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(totalIgst)}</td>
                              </tr>
                            ) : (
                              <>
                                <tr>
                                  <td className="tax-cell font-bold tax-summary-label">Add : CGST</td>
                                  <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(totalCgst)}</td>
                                </tr>
                                <tr>
                                  <td className="tax-cell font-bold tax-summary-label">Add : SGST</td>
                                  <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(totalSgst)}</td>
                                </tr>
                              </>
                            )}
                            <tr className="tax-blue">
                              <td className="tax-cell font-bold tax-summary-label">Tax Amount : GST</td>
                              <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(totalGstAmount)}</td>
                            </tr>
                            <tr className="tax-blue">
                              <td className="tax-cell font-bold tax-summary-label">Amount With Tax</td>
                              <td className="tax-cell text-right font-bold tax-summary-value">{fmtAmt(amountWithTax)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={6} className="tax-cell align-top p-1">
                        <p className="tax-section-title mb-1">Bank Details</p>
                        <TaxFieldsTable rows={[
                          ['Account Holder Name', SELLER.bank.holder],
                          ['Bank Account Number', SELLER.bank.account],
                          ['Bank IFSC Code', SELLER.bank.ifsc],
                          ['Bank Name', SELLER.bank.name],
                          ['Bank Branch Name', SELLER.bank.branch],
                        ]} />
                        <p className="tax-section-title mt-2 mb-1">Terms And Conditions</p>
                        <ol className="tax-terms-list">
                          <li>Goods once sold will not be taken back.</li>
                          <li>Any Dispute Shall Subject to Jaipur Jurisdiction.</li>
                          <li>E.&amp;O.E.</li>
                          <li>The company is not responsible for any transit damage or loss.</li>
                          <li>All Goods Return / Replace only if damage by company transport.</li>
                        </ol>
                      </td>
                      <td colSpan={6} className="tax-cell align-top p-1">
                        <p className="text-center mb-2 tax-header-line">Certified that the particular given above are true and correct</p>
                        <p className="tax-section-title text-right">For, {SELLER.name}</p>
                        <div className="tax-sign-space">&nbsp;</div>
                        <p className="text-right tax-section-title">Authorised Signatory</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallanList;
