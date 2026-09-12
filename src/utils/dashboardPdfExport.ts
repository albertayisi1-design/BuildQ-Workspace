import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportDashboardPdfOptions {
  element: HTMLElement;
  filename?: string;
  reportTitle?: string;
  format?: 'multipage' | 'single';
  onProgress?: (status: string) => void;
}

/**
 * Generates and downloads a high-resolution PDF summary of the Executive Dashboard.
 */
export async function exportDashboardToPdf({
  element,
  filename,
  reportTitle = 'BuildSuite OS — Executive Dashboard Summary',
  format = 'multipage',
  onProgress,
}: ExportDashboardPdfOptions): Promise<void> {
  try {
    onProgress?.('Preparing dashboard capture...');

    // Small delay to ensure any pending animations or charts have settled
    await new Promise((resolve) => setTimeout(resolve, 300));

    onProgress?.('Rendering high-resolution canvas...');

    // Capture the target DOM element with high DPI scale
    const canvas = await html2canvas(element, {
      scale: 2, // 2x DPI for crisp text, badges, and SVG charts
      useCORS: true,
      logging: false,
      backgroundColor: '#f8fafc', // Light slate dashboard background
      windowWidth: Math.max(1280, element.scrollWidth),
      ignoreElements: (el) => {
        // Exclude elements marked with data-html2canvas-ignore
        return el.getAttribute('data-html2canvas-ignore') === 'true';
      },
    });

    onProgress?.('Generating PDF document...');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10; // 10mm margins
    const printableWidth = pageWidth - margin * 2; // 190mm
    const printableHeight = pageHeight - margin * 2 - 12; // leave room for header/footer

    const todayStr = new Date().toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (format === 'single') {
      // Scale everything to fit neatly on a single page
      const imgHeightInMm = (canvas.height * printableWidth) / canvas.width;
      const fitHeight = Math.min(imgHeightInMm, printableHeight);
      const fitWidth = (canvas.width * fitHeight) / canvas.height;
      const xOffset = margin + (printableWidth - fitWidth) / 2;

      // Header
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(reportTitle, margin, margin + 4);

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Snapshot Date: ${todayStr} ${timeStr} • Single Page Executive Summary`, margin, margin + 8);

      // Content image
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', xOffset, margin + 12, fitWidth, fitHeight);

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        'Confidential & Proprietary • BuildSuite OS Executive Information System',
        margin,
        pageHeight - 6
      );
      pdf.text('Page 1 of 1', pageWidth - margin - 15, pageHeight - 6);
    } else {
      // Multi-page document: slice the canvas into proportional A4 pages
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Height of a single page in canvas pixel space:
      const pxPerMm = canvasWidth / printableWidth;
      const pxPageHeight = Math.floor(printableHeight * pxPerMm);

      let renderedHeightPx = 0;
      let pageNumber = 1;
      const totalPages = Math.ceil(canvasHeight / pxPageHeight);

      while (renderedHeightPx < canvasHeight) {
        if (pageNumber > 1) {
          pdf.addPage();
        }

        // Draw Header on every page
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(15, 23, 42);
        pdf.text(reportTitle, margin, margin + 4);

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          `Generated: ${todayStr} at ${timeStr} • Executive Briefing`,
          margin,
          margin + 8
        );

        // Thin divider line
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, margin + 9.5, pageWidth - margin, margin + 9.5);

        // Calculate slice dimensions in canvas pixels
        const remainingPx = canvasHeight - renderedHeightPx;
        const currentSliceHeightPx = Math.min(pxPageHeight, remainingPx);

        // Create temporary canvas slice
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasWidth;
        sliceCanvas.height = currentSliceHeightPx;

        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          // Fill background to avoid transparent seams
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, canvasWidth, currentSliceHeightPx);

          ctx.drawImage(
            canvas,
            0,
            renderedHeightPx,
            canvasWidth,
            currentSliceHeightPx,
            0,
            0,
            canvasWidth,
            currentSliceHeightPx
          );

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
          const sliceHeightMm = (currentSliceHeightPx * printableWidth) / canvasWidth;

          pdf.addImage(sliceData, 'JPEG', margin, margin + 11, printableWidth, sliceHeightMm);
        }

        // Footer
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageHeight - 8.5, pageWidth - margin, pageHeight - 8.5);

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          'Confidential & Proprietary • BuildSuite Construction Management Platform',
          margin,
          pageHeight - 5
        );
        pdf.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth - margin - 18,
          pageHeight - 5
        );

        renderedHeightPx += currentSliceHeightPx;
        pageNumber++;
      }
    }

    onProgress?.('Saving PDF...');

    const defaultFilename = `Executive_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename || defaultFilename);

    onProgress?.('Complete');
  } catch (error) {
    console.error('Error exporting dashboard to PDF:', error);
    throw error;
  }
}
