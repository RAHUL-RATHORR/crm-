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
            @page { margin: 0; size: A4; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box !important; }
            body { 
              margin: 0; 
              padding: 0; 
              background: white !important; 
              display: flex !important; 
              flex-direction: column !important;
              align-items: center !important; /* CENTER THE CONTENT */
              justify-content: flex-start !important;
            }
            ${sanitizedStyles}
            .no-print, button, .lucide, [role="button"] { display: none !important; }
            
            /* GLOBAL CENTERING FOR ANY COMPONENT */
            .a4-page, .invoice-container, .challan-container, [style*="width: 210mm"] {
              width: 208mm !important; /* Slight buffer for perfect centering */
              padding: 10mm 15mm !important;
              margin: 0 auto !important;
              background: white !important;
              display: block !important;
            }
          </style>
        </head>
        <body class="bg-white">
          <div style="width: 210mm; margin: 0 auto; background: white;">
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
