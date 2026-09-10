import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generates an official Legal Metrology Compliance Inspection Report PDF
 * @param {object} inspection - Full inspection record with checks, declarations, violations, product
 * @param {string} outputPath - File path where PDF should be saved
 * @returns {Promise<string>} - Resolves to the written PDF path
 */
export const generateInspectionReport = (inspection, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Inspection Report - ${inspection.inspectionNumber}`,
          Author: 'Legal Metrology Compliance Division',
          Subject: 'Statutory Verification under Legal Metrology (Packaged Commodities) Rules, 2011',
          Keywords: 'Legal Metrology, PCR 2011, Compliance, Inspection, SIH26034',
        },
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Colors
      const primaryColor = '#102a43'; // Deep Navy
      const accentColor = '#334e68';
      const textColor = '#1f2937';
      const lightBg = '#f8fafc';
      const borderColor = '#cbd5e1';

      // Status colors
      const isCompliant = inspection.overallStatus === 'COMPLIANT';
      const isNonCompliant = inspection.overallStatus === 'NON_COMPLIANT';
      const statusColor = isCompliant ? '#059669' : isNonCompliant ? '#dc2626' : '#d97706';

      // ----------------------------------------------------
      // HEADER: Official Government Header
      // ----------------------------------------------------
      doc
        .fontSize(9)
        .fillColor('#64748b')
        .text('GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', { align: 'center' })
        .text('DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY DIVISION', { align: 'center' })
        .moveDown(0.4);

      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke()
        .moveDown(0.8);

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('PACKAGED COMMODITY COMPLIANCE INSPECTION REPORT', { align: 'center' })
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#475569')
        .text('Statutory Verification under The Legal Metrology (Packaged Commodities) Rules, 2011', { align: 'center' })
        .moveDown(1);

      // ----------------------------------------------------
      // EXECUTIVE SUMMARY BOX
      // ----------------------------------------------------
      const summaryBoxTop = doc.y;
      doc
        .rect(40, summaryBoxTop, 515, 95)
        .fillAndStroke(lightBg, borderColor);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('INSPECTION REFERENCE & OVERALL STATUS', 55, summaryBoxTop + 10);

      // Left Column: Metadata
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(textColor)
        .text(`Inspection ID: `, 55, summaryBoxTop + 28, { continued: true })
        .font('Helvetica-Bold').text(inspection.inspectionNumber)
        .font('Helvetica').text(`Commodity: `, { continued: true })
        .font('Helvetica-Bold').text(`${inspection.productName || 'Packaged Commodity'} (${inspection.category || 'General'})`)
        .font('Helvetica').text(`Inspecting Officer: `, { continued: true })
        .font('Helvetica-Bold').text(inspection.inspectorName || 'Enforcement Officer')
        .font('Helvetica').text(`Date & Time: `, { continued: true })
        .font('Helvetica-Bold').text(new Date(inspection.createdAt).toLocaleString('en-IN'));

      // Right Column: Big Status Stamp & Score
      doc
        .rect(360, summaryBoxTop + 15, 180, 65)
        .fillAndStroke('#ffffff', borderColor);

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(statusColor)
        .text(
          isCompliant ? '✓ COMPLIANT' : isNonCompliant ? '✕ NON-COMPLIANT' : '⚠ MANUAL REVIEW',
          360,
          summaryBoxTop + 25,
          { width: 180, align: 'center' }
        );

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`Compliance Score: ${inspection.complianceScore}%`, 360, summaryBoxTop + 45, {
          width: 180,
          align: 'center',
        })
        .fontSize(8)
        .text(
          `Checks: ${inspection.passedChecksCount || 0} Pass | ${inspection.failedChecksCount || 0} Fail | ${inspection.manualChecksCount || 0} Manual`,
          360,
          summaryBoxTop + 60,
          { width: 180, align: 'center' }
        );

      doc.y = summaryBoxTop + 110;

      // ----------------------------------------------------
      // SECTION: PACKAGE EVIDENCE SNAPSHOTS
      // ----------------------------------------------------
      if (inspection.images && inspection.images.length > 0) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text('PACKAGE EVIDENCE SNAPSHOTS', 40, doc.y)
          .moveDown(0.3);

        const imgBoxY = doc.y;
        let imgX = 40;
        const maxImages = Math.min(2, inspection.images.length);

        for (let i = 0; i < maxImages; i++) {
          const img = inspection.images[i];
          if (img.filePath && fs.existsSync(img.filePath)) {
            try {
              doc.rect(imgX, imgBoxY, 245, 110).fillAndStroke('#f8fafc', borderColor);
              doc.image(img.filePath, imgX + 5, imgBoxY + 5, { fit: [235, 85], align: 'center' });
              doc
                .fontSize(7.5)
                .font('Helvetica-Bold')
                .fillColor('#475569')
                .text(`Figure ${i + 1}: ${img.viewType.toUpperCase()} PANEL`, imgX + 5, imgBoxY + 95, { width: 235, align: 'center' });
              imgX += 260;
            } catch (err) {
              console.warn('PDF image embed skipped:', err.message);
            }
          }
        }
        doc.y = imgBoxY + 125;
      }

      // ----------------------------------------------------
      // SECTION: EXTRACTED DECLARATIONS TABLE
      // ----------------------------------------------------
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('1. MANDATORY STATUTORY DECLARATIONS (EXTRACTED)', 40, doc.y)
        .moveDown(0.5);

      // Table Header
      const declTableTop = doc.y;
      doc
        .rect(40, declTableTop, 515, 20)
        .fillAndStroke(primaryColor, primaryColor);

      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('DECLARATION TYPE', 50, declTableTop + 6, { width: 130 })
        .text('DETECTED VALUE ON PACKAGING', 185, declTableTop + 6, { width: 220 })
        .text('CONFIDENCE', 410, declTableTop + 6, { width: 60, align: 'center' })
        .text('STATUS', 475, declTableTop + 6, { width: 70, align: 'center' });

      doc.y = declTableTop + 20;

      const declarationsList = [
        {
          label: 'MRP (Rule 6(1)(e))',
          value: inspection.declarations?.mrp?.value || 'Not detected on submitted packaging',
          conf: `${Math.round((inspection.declarations?.mrp?.confidence || 0) * 100)}%`,
          status: inspection.declarations?.mrp?.detected ? 'Detected' : 'Missing',
        },
        {
          label: 'Net Quantity (Rule 6(1)(c))',
          value: inspection.declarations?.netQuantity?.value || 'Not detected on submitted packaging',
          conf: `${Math.round((inspection.declarations?.netQuantity?.confidence || 0) * 100)}%`,
          status: inspection.declarations?.netQuantity?.detected ? 'Detected' : 'Missing',
        },
        {
          label: 'Date of Mfg (Rule 6(1)(d))',
          value: inspection.declarations?.manufacturingDate?.value || 'Not detected on submitted packaging',
          conf: `${Math.round((inspection.declarations?.manufacturingDate?.confidence || 0) * 100)}%`,
          status: inspection.declarations?.manufacturingDate?.detected ? 'Detected' : 'Missing',
        },
        {
          label: 'Manufacturer (Rule 6(1)(a))',
          value: inspection.declarations?.manufacturer?.value || 'Not detected on submitted packaging',
          conf: `${Math.round((inspection.declarations?.manufacturer?.confidence || 0) * 100)}%`,
          status: inspection.declarations?.manufacturer?.detected ? 'Detected' : 'Missing',
        },
        {
          label: 'Consumer Care (Rule 6(2))',
          value: inspection.declarations?.consumerCare?.value || 'Not detected on submitted packaging',
          conf: `${Math.round((inspection.declarations?.consumerCare?.confidence || 0) * 100)}%`,
          status: inspection.declarations?.consumerCare?.detected ? 'Detected' : 'Missing',
        },
      ];

      declarationsList.forEach((decl, idx) => {
        const rowTop = doc.y;
        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, rowTop, 515, 22).fillAndStroke(rowBg, borderColor);

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor(textColor)
          .text(decl.label, 50, rowTop + 6, { width: 130 })
          .font('Helvetica')
          .text(decl.value, 185, rowTop + 6, { width: 220, ellipsis: true })
          .text(decl.conf, 410, rowTop + 6, { width: 60, align: 'center' })
          .font('Helvetica-Bold')
          .fillColor(decl.status === 'Detected' ? '#059669' : '#dc2626')
          .text(decl.status, 475, rowTop + 6, { width: 70, align: 'center' });

        doc.y = rowTop + 22;
      });

      doc.moveDown(1.5);

      // ----------------------------------------------------
      // SECTION: STATUTORY COMPLIANCE EVALUATION
      // ----------------------------------------------------
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text('2. STATUTORY RULE COMPLIANCE EVALUATION', 40, doc.y)
        .moveDown(0.5);

      (inspection.complianceChecks || []).forEach((chk, i) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        const chkTop = doc.y;
        const isPass = chk.status === 'PASS';
        const isFail = chk.status === 'FAIL';
        const chkColor = isPass ? '#059669' : isFail ? '#dc2626' : '#d97706';

        doc.rect(40, chkTop, 515, 38).fillAndStroke('#ffffff', borderColor);

        doc
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .fillColor(primaryColor)
          .text(`CHECK #${i + 1}: ${chk.title}`, 50, chkTop + 6)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`Statutory Ref: ${chk.ruleReference}`, 50, chkTop + 18)
          .text(`Detected: ${chk.detectedValue}`, 50, chkTop + 28, { width: 380, ellipsis: true });

        // Status Badge
        doc
          .rect(450, chkTop + 8, 95, 20)
          .fillAndStroke(isPass ? '#ecfdf5' : isFail ? '#fef2f2' : '#fffbeb', chkColor);

        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor(chkColor)
          .text(chk.status, 450, chkTop + 13, { width: 95, align: 'center' });

        doc.y = chkTop + 44;
      });

      doc.moveDown(1);

      // ----------------------------------------------------
      // SECTION: VIOLATIONS & RECOMMENDED STATUTORY ACTION
      // ----------------------------------------------------
      if (inspection.violations && inspection.violations.length > 0) {
        if (doc.y > 660) doc.addPage();

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#dc2626')
          .text('3. DETECTED VIOLATIONS & CITATIONS', 40, doc.y)
          .moveDown(0.5);

        inspection.violations.forEach((v, idx) => {
          if (doc.y > 680) doc.addPage();
          const vTop = doc.y;
          doc.rect(40, vTop, 515, 58).fillAndStroke('#fef2f2', '#fca5a5');

          doc
            .fontSize(8.5)
            .font('Helvetica-Bold')
            .fillColor('#991b1b')
            .text(`VIOLATION ${v.violationCode}: ${v.title}`, 50, vTop + 6)
            .font('Helvetica')
            .fillColor('#7f1d1d')
            .text(`Statutory Reference: ${v.legalReference}`, 50, vTop + 18)
            .text(`Explanation: ${v.explanation}`, 50, vTop + 29, { width: 495 })
            .font('Helvetica-Bold')
            .text(`Action: ${v.recommendedAction || 'Issue statutory notice'}`, 50, vTop + 43, { width: 495 });

          doc.y = vTop + 64;
        });
      }

      // ----------------------------------------------------
      // SECTION: MANUAL VERIFICATION GUIDANCE
      // ----------------------------------------------------
      if (doc.y > 680) doc.addPage();
      doc.moveDown(0.8);
      const manualTop = doc.y;
      doc.rect(40, manualTop, 515, 45).fillAndStroke('#fffbeb', '#fcd34d');

      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#92400e')
        .text('MANUAL VERIFICATION REQUIRED BY ENFORCEMENT OFFICIAL', 50, manualTop + 6)
        .font('Helvetica')
        .fillColor('#78350f')
        .text(
          'Rule 7 (Numeral & Letter Height): Photographic 2D images do not provide calibrated millimeter measurements. Official must use a calibrated Legal Metrology measurement gauge to verify physical font height against Table I / Table II.',
          50,
          manualTop + 18,
          { width: 495 }
        );

      doc.y = manualTop + 55;

      // ----------------------------------------------------
      // FOOTER: Disclaimers & Sign-off
      // ----------------------------------------------------
      doc.moveDown(1.5);
      const footerTop = doc.y;

      doc
        .fontSize(8)
        .fillColor('#64748b')
        .text(
          'DISCLAIMER: This document is an automated decision-support inspection report generated under SIH 2026 Problem Statement SIH26034. It is intended to assist enforcement officers in preliminary screening and does not supersede physical statutory sampling under the Legal Metrology Act, 2009.',
          40,
          footerTop,
          { width: 515, align: 'justify' }
        );

      doc
        .moveDown(0.5)
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke()
        .moveDown(0.5);

      doc
        .fontSize(7.5)
        .text(`Report Generated: ${new Date().toISOString()} | System: SIH26034 v1.0.0 | Inspection ID: ${inspection.inspectionNumber}`, {
          align: 'center',
        });

      doc.end();

      writeStream.on('finish', () => {
        resolve(outputPath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};
