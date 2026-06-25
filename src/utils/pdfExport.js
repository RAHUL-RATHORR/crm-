import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

export const downloadAsPDF = async (elementId, filename, onProgressChange = () => {}) => {
  let iframe = null;
  try {
    onProgressChange(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with ID "${elementId}" not found`);

    const isJobCard = elementId === 'printable-inner' || element.classList.contains('job-card-print-page');
    const isTaxInvoice = elementId === 'printable-invoice' || element.classList.contains('tax-invoice-print-page');
    const isChallan = elementId === 'printable-challan' || element.classList.contains('challan-print-page');
    const isFullWidth = isJobCard || isTaxInvoice || isChallan;
    const pageMargin = isJobCard ? '0' : (isFullWidth ? '5mm' : '12mm');
    const contentWidth = isFullWidth ? '100%' : '186mm';
    const contentMaxWidth = isFullWidth ? '100%' : '186mm';
    const contentPadding = isJobCard ? '10mm' : (isFullWidth ? '2mm 3mm' : '6mm 8mm');
    const bodyAlign = isFullWidth ? 'stretch' : 'center';
    const wrapperStyle = isFullWidth
      ? 'width:100%;max-width:100%;margin:0;padding:0;background:#ffffff;box-sizing:border-box;min-height:100vh;'
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
            .no-print, button, .lucide, [role="button"] { display: none !important; }
            
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

            .tax-invoice-print-page {
              width: ${contentWidth} !important;
              max-width: ${contentMaxWidth} !important;
              padding: ${contentPadding} !important;
              margin: 0 !important;
              background: white !important;
              display: block !important;
              border: none !important;
            }
            .tax-invoice-print-page .tax-blue,
            .tax-invoice-print-page .tax-copy-box {
              background-color: #d9e9f7 !important;
            }
            .tax-invoice-print-page .tax-invoice {
              width: 100% !important;
            }
            .tax-invoice-print-page .tax-field-label,
            .tax-invoice-print-page .tax-section-title,
            .tax-invoice-print-page .tax-blue { font-weight: 800 !important; color: #000 !important; }
            .tax-invoice-print-page .tax-company-name { font-weight: 900 !important; }
            .tax-invoice-print-page .tax-field-value,
            .tax-invoice-print-page .tax-item-value { font-weight: 700 !important; }
            .tax-invoice-print-page .tax-item-total,
            .tax-invoice-print-page .tax-amount-words { font-weight: 800 !important; }

            .challan-print-page {
              width: ${contentWidth} !important;
              max-width: ${contentMaxWidth} !important;
              padding: ${contentPadding} !important;
              margin: 0 !important;
              background: white !important;
              display: block !important;
              border: none !important;
            }

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
            ${element.innerHTML}
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

    // 5. Capture with Extreme Resolution
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 3.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // 6. Save as PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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
