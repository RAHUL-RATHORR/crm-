/**
 * Print helper — same isolation approach as pdfExport (full-size iframe + inlined styles).
 */

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

export function printElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

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
          @page { size: A4; margin: 12mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }
          .no-print, button, .lucide, [role="button"] { display: none !important; }
          .a4-page, .invoice-print-page {
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
            width: 208mm !important;
            max-width: 208mm !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            padding: 12mm !important;
            margin: 0 auto !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
            position: static !important;
          }
          .challan-print-page .challan-items-table { min-height: 0 !important; }
          .challan-print-page .invoice-footer { margin-top: 1rem !important; page-break-inside: avoid !important; }
          .challan-print-page .invoice-footer > div:first-child { padding-top: 1.5rem !important; }
          .challan-print-page .invoice-footer > div:last-child { padding-top: 0.5rem !important; }
          .a4-page *, .invoice-print-page *, .challan-print-page * {
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
          .invoice-print-page td,
          .invoice-print-page th { padding-top: 3px !important; padding-bottom: 3px !important; }
          .invoice-print-page .invoice-footer { page-break-inside: avoid !important; }
        </style>
      </head>
      <body class="bg-white">
        <div style="width:210mm;max-width:210mm;margin:0 auto;padding:0;background:white;box-sizing:border-box;">
          ${element.innerHTML}
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
