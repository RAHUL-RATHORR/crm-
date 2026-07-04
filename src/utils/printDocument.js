/**
 * Print helper — same isolation approach as pdfExport (full-size iframe + inlined styles).
 */

export function applyTaxCopyHighlight(root, highlightCopy) {
  if (!root) return;
  root.querySelectorAll('[data-copy-id]').forEach((row) => {
    const copyId = row.getAttribute('data-copy-id');
    const mark = row.querySelector('.tax-copy-mark');
    if (mark) mark.textContent = copyId === highlightCopy ? '☑' : '☐';
  });
}

function buildTaxPrintContent(element, copyIds) {
  const pageClass = element.className || 'tax-invoice-print-page';

  if (!copyIds?.length) {
    return element.innerHTML;
  }

  if (copyIds.length === 1) {
    const clone = element.cloneNode(true);
    applyTaxCopyHighlight(clone, copyIds[0]);
    return clone.innerHTML;
  }

  return copyIds
    .map((copyId, idx) => {
      const clone = element.cloneNode(true);
      clone.removeAttribute('id');
      applyTaxCopyHighlight(clone, copyId);
      const pageBreak = idx < copyIds.length - 1 ? 'page-break-after: always; break-after: page;' : '';
      return `<div class="tax-print-copy-page ${pageClass}" style="${pageBreak}">${clone.innerHTML}</div>`;
    })
    .join('');
}

const getSanitizedSystemStyles = () => {
  let combinedStyles = '';
  try {
    document.querySelectorAll('style').forEach((tag) => {
      combinedStyles += tag.innerHTML + '\n';
    });
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        if (!sheet.href || sheet.href.startsWith(window.location.origin)) {
          const rules = Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n');
          combinedStyles += rules + '\n';
        }
      } catch {
        /* cross-origin stylesheet */
      }
    });
    return combinedStyles
      .replace(/oklch\([^)]+\)/g, '#ffffff')
      .replace(/oklab\([^)]+\)/g, '#ffffff')
      .replace(/color-mix\([^)]+\)/g, '#f3f4f6')
      .replace(/\[class\*=["']fixed["']\][^{]*\{[^}]*\}/g, '');
  } catch {
    return '';
  }
};

export function printElement(elementId, options = {}) {
  const { copyIds } = options;
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const isJobCard = elementId === 'printable-inner';
  const isTaxInvoice = elementId === 'printable-invoice' || elementId === 'printable-challan' || elementId === 'printable-inner' || element.classList.contains('tax-invoice-print-page');
  const isChallan = elementId === 'printable-challan' || element.classList.contains('challan-print-page');
  const isFullWidth = isJobCard || isTaxInvoice || isChallan;
  const pageMargin = isFullWidth ? '5mm' : '12mm';
  const contentPadding = isFullWidth ? '2mm 3mm' : '6mm 8mm';
  const wrapperStyle = isFullWidth
    ? 'width:100%;max-width:100%;margin:0;padding:0;background:#ffffff;box-sizing:border-box;min-height:100vh;'
    : 'width:210mm;max-width:210mm;margin:0 auto;padding:0;background:white;box-sizing:border-box;';

  document.getElementById('print-root-temp')?.remove();
  document.body.classList.remove('is-printing');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Print');
  Object.assign(iframe.style, {
    visibility: 'hidden',
    position: 'fixed',
    left: '-20000px',
    top: '0',
    width: '210mm',
    height: '4000px',
    border: 'none',
  });

  const sanitizedStyles = getSanitizedSystemStyles();

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Print</title>
        <style>
          @page { size: A4; margin: ${pageMargin}; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }
          body > div {
            background: #ffffff !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, button, .job-card-print-page h4 svg, .job-card-print-page svg.lucide, [role="button"] { display: none !important; }
          .job-card-print-page,
          #printable-inner.job-card-print-page,
          .a4-page.job-card-print-page {
            width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            padding: ${contentPadding} !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: block !important;
            overflow: visible !important;
            position: static !important;
            border: none !important;
            box-shadow: none !important;
          }
          .job-card-print-page .min-h-25 { min-height: 0 !important; }
          .job-card-work-instructions,
          .job-card-work-instructions-box {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            page-break-inside: avoid !important;
            background: #ffffff !important;
            border: 1px solid #374151 !important;
          }
          .job-card-work-instructions-text,
          .job-card-section-heading-text {
            color: #000 !important;
            font-weight: 700 !important;
          }
          .job-card-print-page.mx-auto { margin-left: 0 !important; margin-right: 0 !important; }
          .a4-page:not(.job-card-print-page):not(.tax-invoice-print-page):not(.challan-print-page), .invoice-print-page:not(.tax-invoice-print-page) {
            width: 186mm !important;
            max-width: 186mm !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            padding: 6mm 8mm !important;
            margin: 0 auto !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
            position: static !important;
          }
          .challan-print-page {
            width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            padding: ${contentPadding} !important;
            margin: 0 !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
            position: static !important;
            border: none !important;
            box-shadow: none !important;
          }
          .challan-print-page.mx-auto { margin-left: 0 !important; margin-right: 0 !important; }
          .challan-print-page .challan-items-table { min-height: 0 !important; }
          .challan-print-page .invoice-footer { margin-top: 1rem !important; page-break-inside: avoid !important; }
          .challan-print-page .invoice-footer > div:first-child { padding-top: 1.5rem !important; }
          .challan-print-page .invoice-footer > div:last-child { padding-top: 0.5rem !important; }
          .a4-page *, .invoice-print-page *, .challan-print-page *, .job-card-print-page * {
            overflow: visible !important;
            max-height: none !important;
          }
          table { display: table !important; width: 100% !important; }
          thead { display: table-header-group !important; }
          tbody { display: table-row-group !important; }
          tr { display: table-row !important; page-break-inside: avoid; }
          td, th { display: table-cell !important; }
          ${sanitizedStyles}
          .invoice-print-page, .challan-print-page {
            background: #ffffff !important;
          }
          .invoice-print-page .invoice-table-header,
          .invoice-print-page .invoice-table-header th,
          .challan-print-page thead tr,
          .challan-print-page thead th {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-print-page .invoice-grand-total,
          .invoice-print-page .invoice-grand-total span,
          .challan-print-page .invoice-grand-total,
          .challan-print-page .invoice-grand-total span {
            background-color: #1e3a8a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-fill-row { display: none !important; }
          .gst-invoice-print-page,
          .gst-invoice-print-page .gst-invoice,
          .gst-invoice-print-page .gst-cell,
          .gst-invoice-print-page td,
          .gst-invoice-print-page th {
            color: #000 !important;
            background: #fff !important;
            border-color: #000 !important;
          }
          .tax-invoice-print-page {
            width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            padding: ${contentPadding} !important;
            margin: 0 !important;
            background: #ffffff !important;
            display: block !important;
            overflow: visible !important;
            position: static !important;
            border: none !important;
            box-shadow: none !important;
          }
          .tax-invoice-print-page .tax-blue,
          .tax-invoice-print-page .tax-copy-box {
            background-color: #d9e9f7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tax-invoice-print-page .tax-invoice {
            width: 100% !important;
          }
          .tax-invoice-print-page .tax-cell,
          .tax-invoice-print-page td,
          .tax-invoice-print-page th {
            color: #000 !important;
            border-color: #000 !important;
          }
          .invoice-print-page td,
          .invoice-print-page th { padding-top: 3px !important; padding-bottom: 3px !important; }
          .invoice-print-page .invoice-footer { page-break-inside: avoid !important; }
          ${isJobCard ? `
          @page { size: A4; margin: 0 !important; }
          html, body, body > div, .job-card-print-page, .a4-page.job-card-print-page {
            background: #ffffff !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
          .job-card-print-page, .a4-page.job-card-print-page {
            padding: 10mm !important;
            border: none !important;
            box-shadow: none !important;
          }
          .job-card-print-page .font-medium { font-weight: 700 !important; }
          .job-card-print-page .font-bold { font-weight: 800 !important; }
          .job-card-print-page .font-black { font-weight: 900 !important; }
          .job-card-print-page .italic { font-style: normal !important; font-weight: 700 !important; }
          .job-card-print-page .opacity-60 { opacity: 1 !important; }
          .job-card-print-page [class*="text-gray-4"],
          .job-card-print-page [class*="text-gray-5"],
          .job-card-print-page [class*="text-gray-6"] { color: #1f2937 !important; font-weight: 700 !important; }
          .job-card-print-page [class*="text-gray-7"] { color: #111827 !important; font-weight: 800 !important; }
          .job-card-print-page [class*="text-blue"] { color: #1e40af !important; font-weight: 800 !important; }
          .job-card-print-page [class*="text-indigo"],
          .job-card-print-page .job-card-printing-qty { color: #312e81 !important; font-weight: 800 !important; }
          .job-card-print-page [class*="text-cyan"] { color: #0e7490 !important; font-weight: 800 !important; }
          .job-card-print-page [class*="text-amber"] { color: #b45309 !important; font-weight: 800 !important; }
          .job-card-print-page [class*="text-rose"] { color: #be123c !important; font-weight: 800 !important; }
          .job-card-letterhead { border-color: #000 !important; }
          .job-card-letterhead .job-card-brand { font-weight: 900 !important; color: #000 !important; }
          .job-card-letterhead .job-card-brand .text-blue-600 { color: #000000 !important; font-weight: 900 !important; }
          .job-card-letterhead .job-card-letterhead-line { color: #000 !important; font-weight: 700 !important; }
          .job-card-letterhead .job-card-letterhead-line .text-blue-600 { color: #1d4ed8 !important; font-weight: 800 !important; }
          .job-card-doc-badge {
            background-color: #1d4ed8 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: 900 !important;
          }
          .job-card-print-table .job-card-brand {
            color: #000000 !important;
            font-weight: 900 !important;
          }
          .job-card-print-table .job-card-brand .company-brand-accent {
            color: #000000 !important;
            font-weight: 900 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .job-card-print-table .job-card-section-title {
            font-weight: 900 !important;
            font-size: 11px !important;
            letter-spacing: 0.06em !important;
            color: #000 !important;
            background-color: #d9e9f7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .job-card-print-table .tax-field-label,
          .job-card-print-table .tax-field-colon {
            font-weight: 900 !important;
            color: #000 !important;
            font-size: 10px !important;
          }
          .job-card-print-table .tax-field-value {
            font-weight: 800 !important;
            color: #000 !important;
            font-size: 11px !important;
          }
          .job-card-print-table .job-card-work-instructions-text {
            font-weight: 900 !important;
            color: #000 !important;
            font-size: 14px !important;
            line-height: 1.55 !important;
          }
          ` : ''}
          ${isChallan ? `
          @page { size: A4; margin: 5mm !important; }
          html, body, body > div, .challan-print-page {
            background: #ffffff !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
          ` : ''}
          ${isTaxInvoice ? `
          @page { size: A4; margin: 5mm !important; background: white; }
          html, body, body > div, .tax-invoice-print-page {
            background: #ffffff !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
          }
          .tax-invoice-print-page .tax-invoice,
          .tax-invoice-print-page .tax-cell,
          .tax-invoice-print-page .job-card-section-body,
          .tax-invoice-print-page .job-card-meta-cell,
          .tax-invoice-print-page .job-card-work-instructions {
            background-color: #ffffff !important;
          }
          .tax-invoice-print-page .tax-blue,
          .tax-invoice-print-page .tax-copy-box,
          .job-card-print-table .job-card-section-title {
            background-color: #d9e9f7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tax-invoice-print-page .tax-invoice,
          .tax-invoice-print-page .tax-cell,
          .tax-invoice-print-page td,
          .tax-invoice-print-page th,
          .tax-invoice-print-page p {
            color: #000 !important;
            font-weight: 700 !important;
            -webkit-font-smoothing: antialiased !important;
            text-rendering: optimizeLegibility !important;
          }
          .tax-invoice-print-page .tax-field-label,
          .tax-invoice-print-page .tax-field-colon,
          .tax-invoice-print-page .tax-blue,
          .tax-invoice-print-page .tax-title-text,
          .tax-invoice-print-page .tax-section-title,
          .tax-invoice-print-page .tax-summary-label,
          .tax-invoice-print-page .tax-summary-value,
          .tax-invoice-print-page .tax-item-header-row .tax-cell,
          .tax-invoice-print-page .font-bold {
            font-weight: 900 !important;
            color: #000 !important;
          }
          .tax-invoice-print-page .tax-title-text {
            font-size: 20px !important;
            letter-spacing: 0.05em !important;
            padding: 7px 0 !important;
          }
          .tax-invoice-print-page .tax-company-name,
          .tax-invoice-print-page .company-brand-name {
            font-weight: 900 !important;
            font-size: 36px !important;
            letter-spacing: 0.04em !important;
          }
          .tax-invoice-print-page .company-brand-accent {
            color: #000000 !important;
            font-weight: 900 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tax-invoice-print-page .tax-item-total,
          .tax-invoice-print-page .tax-amount-words { font-weight: 900 !important; color: #000 !important; }
          .tax-invoice-print-page .tax-field-value,
          .tax-invoice-print-page .tax-item-value,
          .tax-invoice-print-page .tax-item-gst { font-weight: 800 !important; color: #000 !important; }
          .tax-print-copy-page { page-break-inside: avoid; }
          .tax-print-copy-page:not(:last-child) { page-break-after: always !important; break-after: page !important; }
          ` : ''}
        </style>
      </head>
      <body class="bg-white">
        <div style="${wrapperStyle}">
          ${buildTaxPrintContent(element, copyIds)}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  const runPrint = () => {
    try {
      const win = iframe.contentWindow;
      if (!win) return;
      win.focus();
      win.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  };

  setTimeout(runPrint, 1200);
}
