import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Downloads a DOM element as a high-quality PDF.
 * Handles modern CSS color sanitization (oklch/oklab) to prevent parser crashes.
 * 
 * @param {string} elementId - The ID of the element to capture.
 * @param {string} filename - The name of the resulting PDF file.
 * @param {Function} onProgressChange - Optional callback to track generation state.
 */
export const downloadAsPDF = async (elementId, filename, onProgressChange = () => {}) => {
  try {
    onProgressChange(true);
    
    // Safety delay to allow modal animations or layout settle
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with ID "${elementId}" not found`);

    // High resolution (2.5x - 3x is sweet spot for A4 detail vs performance)
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false, // Set to true if debugging is needed
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      removeContainer: true,
      onclone: (clonedDoc) => {
        // Aggressive CSS Sanitization for Tailwind 4 / Modern Browsers
        const sheets = Array.from(clonedDoc.styleSheets);
        sheets.forEach(sheet => {
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (!rules) return;
            
            for (let i = rules.length - 1; i >= 0; i--) {
              const rule = rules[i];
              const ruleText = rule.cssText;
              // Detect and remove rules containing unsupported oklch/oklab
              if (ruleText && (ruleText.includes('oklch') || ruleText.includes('oklab'))) {
                try {
                  sheet.deleteRule(i);
                } catch (err) {
                  // Fallback: Just ignore if delete fails
                }
              }
            }
          } catch (e) {
            // Handle CORS policy blocks by disabling the sheet entirely 
            // to prevent html2canvas from attempting to parse it.
            if (sheet.href) {
              sheet.disabled = true;
              if (sheet.ownerNode && sheet.ownerNode.tagName === 'LINK') {
                sheet.ownerNode.remove();
              }
            }
          }
        });

        // Final check for inline styles
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.style) {
            if (el.style.color?.includes('okl')) el.style.color = '#111827';
            if (el.style.backgroundColor?.includes('okl')) el.style.backgroundColor = 'transparent';
            if (el.style.borderColor?.includes('okl')) el.style.borderColor = '#e5e7eb';
          }
        });
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add image to first page
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Save the file
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    
  } catch (error) {
    console.error("PDF Export Error:", error);
    alert(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    throw error;
  } finally {
    onProgressChange(false);
  }
};
