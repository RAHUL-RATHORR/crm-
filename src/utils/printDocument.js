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
          @page { size: A4; margin: 10mm; }
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
            width: 208mm !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: none !important;
            padding: 10mm 12mm !important;
            margin: 0 auto !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
            position: static !important;
          }
          .a4-page *, .invoice-print-page * {
            overflow: visible !important;
            max-height: none !important;
          }
          table { display: table !important; width: 100% !important; }
          thead { display: table-header-group !important; }
          tbody { display: table-row-group !important; }
          tr { display: table-row !important; page-break-inside: avoid; }
          td, th { display: table-cell !important; }
          ${sanitizedStyles}
          .invoice-print-page,
          .invoice-print-page table,
          .invoice-print-page tr,
          .invoice-print-page td,
          .invoice-print-page th,
          .invoice-print-page div {
            background-color: #ffffff !important;
            background-image: none !important;
          }
          .invoice-print-page thead th {
            color: #111827 !important;
            border: 1px solid #9ca3af !important;
            font-weight: 700 !important;
          }
          .invoice-print-page [style*="background"] {
            background-color: #ffffff !important;
          }
          .invoice-print-page .text-white {
            color: #111827 !important;
          }
        </style>
      </head>
      <body class="bg-white">
        <div style="width:210mm;margin:0 auto;background:white;">
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
