import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { downloadTaxDocumentAsPdf } from './printDocument';

/**
 * NUCLEAR STYLE SHIELD V3 - The Ultimate Solution for PDF Fidelity.
 * This version uses a Two-Stage Sanitization process:
 * 1. Style Scraper Sanitization: Scrubs problematic oklch/oklab from CSS rule strings.
 * 2. DOM Sanitizer: Iterates every element in the iframe and converts computed 'okl' colors to HEX.
 * This ensures html2canvas never encounters a modern color function it can't parse.
 */

const getSanitizedSystemStyles = () => {
  let combinedStyles = '';
  try {
    // 1. Capture all <style> tags (Common in Vite/Emotion/Tailwind)
    document.querySelectorAll('style').forEach(tag => {
      combinedStyles += tag.innerHTML + '\n';
    });

    // 2. Capture all external accessible stylesheets
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        if (!sheet.href || sheet.href.startsWith(window.location.origin)) {
          const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
          combinedStyles += rules + '\n';
        }
      } catch (e) {}
    });

    // 3. NUCLEAR CSS SCRUB
    // This removes the crash-causing functions from the actual CSS definitions
    return combinedStyles
      .replace(/oklch\([^)]+\)/g, '#2563eb') // Primary Blue
      .replace(/oklab\([^)]+\)/g, '#2563eb') // Secondary Blue
      .replace(/color-mix\([^)]+\)/g, '#3b82f6'); // Clean up modern color-mix too
  } catch (error) {
    return '';
  }
};

/**
 * Stage 2: The DOM Sanitizer
 * Manually converts computed styles into hardcoded HEX values to avoid html2canvas parser crashes.
 */
const sanitizeDOMInIframe = (doc) => {
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    try {
      const computed = window.getComputedStyle(el);
      
      // Brand name suffix — always black on tax documents
      if (el.classList?.contains('company-brand-accent')) {
        el.style.color = '#000000';
      }

      // Sanitizing Text Color
      if (computed.color && (computed.color.includes('okl') || computed.color.includes('color-mix'))) {
        el.style.color = '#1e293b'; 
      }
      
      // Sanitizing Background Color
      if (computed.backgroundColor && (computed.backgroundColor.includes('okl') || computed.backgroundColor.includes('color-mix'))) {
        el.style.backgroundColor = '#2563eb';
      }

      // Special case for Total box (Grand Totals)
      if (el.className && el.className.includes('grandTotal')) {
        el.style.backgroundColor = '#2563eb';
        el.style.color = '#ffffff';
      }
    } catch (e) {}
  });
};

const addCanvasToPdf = (pdf, canvas, imgData, { fitSinglePage = false } = {}) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (fitSinglePage) {
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      return;
    }

    const scale = pageHeight / imgHeight;
    const renderWidth = imgWidth * scale;
    const renderHeight = pageHeight;
    const offsetX = (pageWidth - renderWidth) / 2;
    pdf.addImage(imgData, 'JPEG', offsetX, 0, renderWidth, renderHeight);
    return;
  }

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    return;
  }

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
};

export const downloadAsPDF = async (elementId, filename, onProgressChange = () => {}) => {
  if (elementId === 'printable-invoice' || elementId === 'printable-challan') {
    return downloadTaxDocumentAsPdf(elementId, filename, onProgressChange);
  }

  let iframe = null;
  try {
    onProgressChange(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with ID "${elementId}" not found`);

    const clone = element.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('pdf-export-root');
    if (elementId === 'printable-invoice' || elementId === 'printable-challan') {
      clone.classList.add('tax-print-compact');
    }

    const isJobCard = elementId === 'printable-inner';
    const isEstimate = elementId === 'printable-estimate' || element.classList.contains('estimate-print-page');
    const isTaxInvoice = elementId === 'printable-invoice' || elementId === 'printable-challan' || elementId === 'printable-inner' || elementId === 'printable-estimate' || element.classList.contains('tax-invoice-print-page') || element.classList.contains('estimate-print-page');
    const isChallan = elementId === 'printable-challan' || element.classList.contains('challan-print-page');
    const isInvoiceOrChallan = elementId === 'printable-invoice' || elementId === 'printable-challan';
    const isFullWidth = isJobCard || isTaxInvoice || isChallan || isEstimate;
    const pageMargin = isFullWidth ? '5mm' : '12mm';
    const contentWidth = isFullWidth ? '100%' : '186mm';
    const contentMaxWidth = isFullWidth ? '100%' : '186mm';
    const contentPadding = isInvoiceOrChallan ? '1mm 2mm' : isFullWidth ? '2mm 3mm' : '6mm 8mm';
    const bodyAlign = isFullWidth ? 'stretch' : 'center';
    const wrapperStyle = isFullWidth
      ? 'width:100%;max-width:100%;margin:0;padding:0;background:#ffffff;box-sizing:border-box;'
      : 'width:186mm;max-width:186mm;margin:0 auto;padding:0 4mm;background:white;box-sizing:border-box;';

    // 1. Prepare Styles
    const sanitizedStyles = getSanitizedSystemStyles();

    // 2. Setup Isolation Ghost Iframe
    iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      visibility: 'hidden',
      position: 'fixed',
      left: '-20000px',
      top: '-20000px',
      width: '210mm', // Lock to A4 width
      height: '4000px'
    });
    document.body.appendChild(iframe);

    // 3. Mirror with Injected Shield
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { margin: ${pageMargin}; size: A4; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box !important; }
            body { 
              margin: 0; 
              padding: 0; 
              background: white !important; 
              display: flex !important; 
              flex-direction: column !important;
              align-items: ${bodyAlign} !important;
              justify-content: flex-start !important;
            }
            ${sanitizedStyles}
            .no-print, button, .job-card-print-page h4 svg, .job-card-print-page svg.lucide, [role="button"] { display: none !important; }
            
            .job-card-print-page,
            #printable-inner.job-card-print-page {
              width: ${contentWidth} !important;
              max-width: ${contentMaxWidth} !important;
              padding: ${contentPadding} !important;
              margin: 0 !important;
              background: white !important;
              display: block !important;
              border: none !important;
            }
            .job-card-print-page .font-medium { font-weight: 700 !important; }
            .job-card-print-page .font-bold { font-weight: 800 !important; }
            .job-card-print-page .font-black { font-weight: 900 !important; }
            .job-card-print-page .italic { font-style: normal !important; font-weight: 700 !important; }
            .job-card-print-page .opacity-60 { opacity: 1 !important; }
            .job-card-print-page .text-gray-400,
            .job-card-print-page .text-gray-500,
            .job-card-print-page .text-gray-600 { color: #1f2937 !important; }
            .job-card-print-page .text-gray-700 { color: #111827 !important; }
            .job-card-print-page .text-blue-600,
            .job-card-print-page .text-blue-700 { color: #1e40af !important; font-weight: 800 !important; }
            .job-card-print-page .job-card-printing-qty { font-weight: 800 !important; color: #312e81 !important; }
            .job-card-work-instructions,
            .job-card-work-instructions-box {
              display: block !important;
              visibility: visible !important;
              background: #ffffff !important;
              border: 1px solid #374151 !important;
            }
            .job-card-work-instructions-text,
            .job-card-section-heading-text {
              color: #000 !important;
              font-weight: 700 !important;
            }

            .tax-invoice-print-page {
              width: ${contentWidth} !important;
              max-width: ${contentMaxWidth} !important;
              padding: ${contentPadding} !important;
              margin: 0 !important;
              background: #ffffff !important;
              display: block !important;
              border: none !important;
            }
            .tax-invoice-print-page .tax-invoice,
            .tax-invoice-print-page .tax-cell:not(.tax-blue),
            .tax-invoice-print-page .job-card-section-body,
            .tax-invoice-print-page .job-card-meta-cell,
            .tax-invoice-print-page .job-card-work-instructions {
              background-color: #ffffff !important;
            }
            .tax-invoice-print-page .tax-cell.tax-blue,
            .tax-invoice-print-page .tax-blue,
            .tax-invoice-print-page .tax-title-bar,
            .tax-invoice-print-page .tax-title-text,
            .tax-invoice-print-page .tax-copy-box,
            .job-card-print-table .job-card-section-title {
              background-color: #d9e9f7 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .tax-invoice-print-page .tax-invoice {
              width: 100% !important;
            }
            .tax-invoice-print-page .tax-field-label,
            .tax-invoice-print-page .tax-section-title,
            .tax-invoice-print-page .tax-blue,
            .tax-invoice-print-page .tax-item-header-row .tax-cell { font-weight: 900 !important; color: #000 !important; }
            .tax-invoice-print-page .tax-company-name,
            .tax-invoice-print-page .company-brand-name {
              font-weight: 900 !important;
              font-size: 36px !important;
              letter-spacing: 0.04em !important;
              color: #000000 !important;
            }
            .tax-invoice-print-page .company-brand-accent {
              color: #000000 !important;
              font-weight: 900 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .tax-invoice-print-page .tax-title-text {
              font-size: 20px !important;
              font-weight: 900 !important;
              letter-spacing: 0.05em !important;
              padding: 7px 0 !important;
              color: #000 !important;
            }
            .tax-invoice-print-page .tax-field-value,
            .tax-invoice-print-page .tax-item-value,
            .tax-invoice-print-page .tax-item-gst { font-weight: 800 !important; color: #000 !important; }
            .tax-invoice-print-page .tax-item-total,
            .tax-invoice-print-page .tax-amount-words { font-weight: 900 !important; color: #000 !important; }
            .tax-invoice-print-page .tax-cell,
            .tax-invoice-print-page td,
            .tax-invoice-print-page th,
            .tax-invoice-print-page p { font-weight: 700 !important; color: #000 !important; }
            .tax-invoice-print-page .job-card-work-instructions-text {
              font-weight: 900 !important;
              color: #000 !important;
              white-space: pre-wrap !important;
              font-size: 14px !important;
              line-height: 1.55 !important;
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
            }
            .job-card-print-table .tax-field-value {
              font-weight: 800 !important;
              color: #000 !important;
            }

            .challan-print-page {
              width: ${contentWidth} !important;
              max-width: ${contentMaxWidth} !important;
              padding: ${contentPadding} !important;
              margin: 0 !important;
              background: white !important;
              display: block !important;
              border: none !important;
            }

            ${isTaxInvoice ? `
            table { display: table !important; width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; }
            thead { display: table-header-group !important; }
            tbody { display: table-row-group !important; }
            tr { display: table-row !important; }
            td, th { display: table-cell !important; }
            .tax-invoice-print-page,
            .tax-invoice-print-page * {
              overflow: visible !important;
              max-height: none !important;
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
            .tax-invoice-print-page .tax-invoice {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            .tax-invoice-print-page .tax-title-bar {
              display: flex !important;
              align-items: stretch !important;
              width: 100% !important;
            }
            .tax-invoice-print-page .tax-title-text {
              flex: 1 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .tax-invoice-print-page .tax-copy-box {
              width: 118px !important;
              flex-shrink: 0 !important;
            }
            .tax-invoice-print-page .tax-items-stripe-row .tax-cell,
            .tax-invoice-print-page .tax-item-grand-total-row .tax-cell,
            .tax-invoice-print-page .tax-items-empty-band .tax-item-empty-cell {
              border-top: none !important;
              border-bottom: none !important;
              border-left: 1px solid #000 !important;
              border-right: 1px solid #000 !important;
            }
            .tax-invoice-print-page .tax-item-grand-total-row .tax-cell {
              border-top: 2px solid #000 !important;
              border-bottom: 1px solid #000 !important;
            }
            .tax-invoice-print-page .tax-stripe-white .tax-cell {
              background-color: #ffffff !important;
            }
            .tax-invoice-print-page .tax-stripe-grey .tax-cell {
              background-color: #ececec !important;
            }
            .tax-invoice-print-page.tax-print-compact .tax-item-main-row .tax-cell,
            .tax-invoice-print-page.tax-print-compact .tax-item-sub-row .tax-cell {
              padding-top: 1px !important;
              padding-bottom: 1px !important;
              font-size: 10px !important;
              line-height: 1.15 !important;
            }
            .tax-invoice-print-page.tax-print-compact .tax-sign-space {
              height: 22px !important;
            }
            .tax-invoice-print-page.tax-print-compact .tax-terms-list {
              font-size: 9px !important;
              line-height: 1.2 !important;
            }
            .tax-invoice-print-page.tax-print-compact .tax-analysis-table .tax-cell {
              padding-top: 1px !important;
              padding-bottom: 1px !important;
              font-size: 9px !important;
            }
            .tax-invoice-print-page.tax-print-compact .tax-item-empty-row .tax-item-empty-cell {
              height: calc(14px * var(--empty-rows, 1)) !important;
            }
            .tax-invoice-print-page .tax-cell,
            .tax-invoice-print-page td,
            .tax-invoice-print-page th,
            .tax-invoice-print-page .tax-field-value,
            .tax-invoice-print-page .tax-item-name {
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              white-space: normal !important;
            }
            .tax-invoice-print-page .tax-field-label {
              white-space: nowrap !important;
            }
            ` : ''}

            /* GLOBAL CENTERING FOR ANY COMPONENT */
            .a4-page:not(.job-card-print-page):not(.tax-invoice-print-page):not(.challan-print-page), .invoice-container, .challan-container, [style*="width: 210mm"] {
              width: ${contentWidth} !important;
              max-width: ${contentMaxWidth} !important;
              padding: ${contentPadding} !important;
              margin: 0 auto !important;
              background: white !important;
              display: block !important;
            }
          </style>
        </head>
        <body class="bg-white">
          <div style="${wrapperStyle}">
            ${clone.outerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // 4. THE LONG WAIT & CLEANUP
    // Increased to 1.8s to ensure full layout stabilization
    await new Promise(resolve => setTimeout(resolve, 1800));

    // STAGE 2 SANITIZATION: Clean up the computed styles before conversion
    sanitizeDOMInIframe(iframeDoc);

    // Final text cleanup for NaNs
    iframeDoc.querySelectorAll('*').forEach(node => {
      try {
        if (node.children && node.children.length === 0 && node.textContent && node.textContent.includes('NaN')) {
          node.textContent = node.textContent.replace(/NaN/g, '0.00');
        }
      } catch (e) {}
    });

    const captureRoot = iframeDoc.querySelector('.pdf-export-root') || iframeDoc.body;

    // 5. Capture with Extreme Resolution
    const canvas = await html2canvas(captureRoot, {
      scale: 3.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: captureRoot.scrollWidth,
      height: captureRoot.scrollHeight,
      windowWidth: captureRoot.scrollWidth,
      windowHeight: captureRoot.scrollHeight,
    });

    // 6. Save as PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    addCanvasToPdf(pdf, canvas, imgData, { fitSinglePage: isInvoiceOrChallan });
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    
  } catch (error) {
    console.error("Shield Failure:", error);
    alert(`System Error: ${error.message}`);
  } finally {
    if (iframe && document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    onProgressChange(false);
  }
};
