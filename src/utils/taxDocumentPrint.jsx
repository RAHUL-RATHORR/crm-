import React from 'react';
import { Phone, Mail } from 'lucide-react';

export const SELLER = {
  name: 'HARIHAR PRINTERS',
  brandName: 'Harihar',
  brandSuffix: 'Printers',
  address: 'J-97, Ashok Chowk, Adarsh Nagar, Jaipur, Rajasthan, 302004',
  office: 'J-97, Ashok Chowk, Adarsh Nagar, Jaipur-302 004',
  factory: 'G-139, Hirawala Industrial Area, Kanota, Agra Road, Jaipur',
  gstin: '08AALPC9959M1ZV',
  pan: 'AALPC9959M',
  state: 'Rajasthan',
  stateCode: '08',
  tel: '0141-2600850, 9414043763',
  email: 'hariharprinters1@gmail.com',
  bank: {
    holder: 'Harihar Printers',
    name: 'IndusInd Bank',
    account: '650014092175',
    branch: 'Raja Park, Jaipur',
    ifsc: 'INDB0000278',
  },
};

export const fmtTaxDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr}`;
};

export const fmtAmt = (value) =>
  Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const getStateFromGst = (gstNo) => {
  const gst = (gstNo || '').trim();
  if (gst.length >= 2 && gst !== 'URP') {
    return { state: 'Rajasthan', code: gst.slice(0, 2) };
  }
  return { state: 'Rajasthan', code: '08' };
};

export const TaxFieldsTable = ({ rows }) => (
  <table className="tax-fields-inner w-full">
    <tbody>
      {rows.map(([label, value], i) => (
        <tr key={i}>
          <td className="align-top tax-field-label">{label}</td>
          <td className="align-top tax-field-colon">:</td>
          <td className="align-top tax-field-value">{value ?? ''}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const buildTaxItemLine = (item, idx, fallbackGst = 18, isIGST = false) => {
  const taxable = Number(item.total) || Number(item.qty || 0) * Number(item.rate || 0);
  const pct = Number(item.gstPercent ?? fallbackGst);
  const cgstRate = isIGST ? 0 : pct / 2;
  const sgstRate = isIGST ? 0 : pct / 2;
  const igstRate = isIGST ? pct : 0;
  const cgstAmt = isIGST ? 0 : (taxable * cgstRate) / 100;
  const sgstAmt = isIGST ? 0 : (taxable * sgstRate) / 100;
  const igstAmt = isIGST ? (taxable * igstRate) / 100 : 0;
  return {
    idx: idx + 1,
    item,
    taxable,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmt,
    sgstAmt,
    igstAmt,
    lineTotal: taxable + cgstAmt + sgstAmt + igstAmt,
  };
};

export const EMPTY_PRODUCT_ROWS = 2;
export const MIN_PRODUCT_TABLE_ROWS = 8;

export function getEmptyProductRowCount(usedRows = 0) {
  const filler = MIN_PRODUCT_TABLE_ROWS - usedRows;
  return filler > 0 ? filler : EMPTY_PRODUCT_ROWS;
}

export const getTaxTableColCount = (isIGST) => (isIGST ? 10 : 12);

export const TaxInvoiceColGroup = ({ isIGST = false }) => (
  <colgroup>
    <col style={{ width: '4%' }} />
    <col style={{ width: '28%' }} />
    <col style={{ width: '8%' }} />
    <col style={{ width: '6%' }} />
    <col style={{ width: '5%' }} />
    <col style={{ width: '8%' }} />
    <col style={{ width: '10%' }} />
    {isIGST ? (
      <>
        <col style={{ width: '6%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '15%' }} />
      </>
    ) : (
      <>
        <col style={{ width: '5%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '5%' }} />
        <col style={{ width: '9%' }} />
        <col style={{ width: '10%' }} />
      </>
    )}
  </colgroup>
);

/** One tall row with per-column vertical borders (no horizontal lines in the empty zone). */
export const TaxItemEmptyRow = ({ rowCount = 2, isIGST = false }) => (
  <tr className="tax-item-empty-row" style={{ '--empty-rows': rowCount }}>
    <td className="tax-item-empty-cell">&nbsp;</td>
    <td className="tax-item-empty-cell">&nbsp;</td>
    <td className="tax-item-empty-cell">&nbsp;</td>
    <td className="tax-item-empty-cell">&nbsp;</td>
    <td className="tax-item-empty-cell">&nbsp;</td>
    <td className="tax-item-empty-cell">&nbsp;</td>
    <td className="tax-item-empty-cell tax-blue">&nbsp;</td>
    {isIGST ? (
      <>
        <td className="tax-item-empty-cell">&nbsp;</td>
        <td className="tax-item-empty-cell">&nbsp;</td>
      </>
    ) : (
      <>
        <td className="tax-item-empty-cell">&nbsp;</td>
        <td className="tax-item-empty-cell">&nbsp;</td>
        <td className="tax-item-empty-cell">&nbsp;</td>
        <td className="tax-item-empty-cell">&nbsp;</td>
      </>
    )}
    <td className="tax-item-empty-cell">&nbsp;</td>
  </tr>
);

export const CompanyBrandName = ({ className = '', large = false }) => (
  <p className={`tax-company-name company-brand-name ${large ? 'company-brand-name-lg' : ''} ${className}`.trim()}>
    {SELLER.brandName}{' '}
    <span className="company-brand-accent">{SELLER.brandSuffix}</span>
  </p>
);

export const TAX_COPY_LINES = [
  { id: 'original', text: 'Original for Recipient' },
  { id: 'duplicateFor', text: 'Duplicate for' },
  { id: 'transporter', text: 'Transporter' },
  { id: 'triplicate', text: 'Triplicate for Supplier' },
];

export const DEFAULT_TAX_COPY_SELECTION = {
  original: true,
  duplicateFor: false,
  transporter: false,
  triplicate: false,
};

export function getSelectedCopyIds(selection = DEFAULT_TAX_COPY_SELECTION) {
  return TAX_COPY_LINES.filter((line) => selection[line.id]).map((line) => line.id);
}

export function getPreviewHighlightCopy(selection = DEFAULT_TAX_COPY_SELECTION) {
  const selected = getSelectedCopyIds(selection);
  return selected[0] || 'original';
}

export const TaxCopyBox = ({ highlightCopy = 'original' }) => (
  <div className="tax-copy-box">
    {TAX_COPY_LINES.map((line) => (
      <div key={line.id} className="tax-copy-row" data-copy-id={line.id}>
        <span className="tax-copy-mark">{highlightCopy === line.id ? '☑' : '☐'}</span>
        <p className="tax-copy-label">{line.text}</p>
      </div>
    ))}
  </div>
);

export const TaxCopyTypeControls = ({ selection, onChange }) => (
  <div className="tax-copy-controls flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-gray-100 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 max-w-full">
    <span className="text-gray-500 font-medium text-sm shrink-0">Copy Type:</span>
    {TAX_COPY_LINES.map((line) => (
      <label key={line.id} className="inline-flex items-center gap-1.5 cursor-pointer text-gray-800 whitespace-nowrap">
        <input
          type="checkbox"
          className="rounded border-gray-400 text-blue-600 focus:ring-blue-500"
          checked={!!selection?.[line.id]}
          onChange={(e) => onChange(line.id, e.target.checked)}
        />
        <span>{line.text}</span>
      </label>
    ))}
  </div>
);

/** Job card / document letterhead — left company info, right doc badge + GSTIN/PAN */
export const JobCardLetterhead = ({ docTitle = 'JOB CARD' }) => (
  <div className="job-card-letterhead flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6 px-1">
    <div className="grow pr-4">
      <h1 className="job-card-brand text-[34px] font-black tracking-tight text-gray-900 leading-none mb-2">
        {SELLER.brandName}{' '}
        <span className="company-brand-accent">{SELLER.brandSuffix}</span>
      </h1>
      <div className="space-y-0.5">
        <p className="job-card-letterhead-line text-[10px] text-gray-800 leading-snug">
          <span className="text-blue-600 font-bold uppercase">Office:</span>{' '}
          <span className="font-semibold">{SELLER.office}</span>
        </p>
        <p className="job-card-letterhead-line text-[10px] text-gray-800 leading-snug">
          <span className="text-blue-600 font-bold uppercase">Factory:</span>{' '}
          <span className="font-semibold">{SELLER.factory}</span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
          <p className="job-card-letterhead-line text-[10px] font-semibold text-gray-800 flex items-center gap-1">
            <Phone size={10} className="text-blue-500 shrink-0" strokeWidth={2.5} />
            {SELLER.tel}
          </p>
          <p className="job-card-letterhead-line text-[10px] font-semibold text-gray-800 flex items-center gap-1">
            <Mail size={10} className="text-blue-500 shrink-0" strokeWidth={2.5} />
            {SELLER.email}
          </p>
        </div>
      </div>
    </div>
    <div className="text-right flex flex-col items-end shrink-0">
      <div className="job-card-doc-badge bg-blue-600 text-white px-6 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest">
        {docTitle}
      </div>
      <div className="text-[9px] font-bold text-gray-500 uppercase flex flex-col gap-1 mt-2 tracking-wide text-right">
        <span>
          GSTIN:{' '}
          <span className="text-gray-900 font-black normal-case tracking-normal">{SELLER.gstin}</span>
        </span>
        <span>
          PAN:{' '}
          <span className="text-gray-900 font-black normal-case tracking-normal">{SELLER.pan}</span>
        </span>
      </div>
    </div>
  </div>
);
