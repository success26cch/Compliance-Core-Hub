import PDFDocument from 'pdfkit';
import path from 'path';

export function generateISOAuditCheatSheet(): typeof PDFDocument.prototype {
  const doc = new PDFDocument({ 
    size: 'LETTER',
    margin: 0
  });

  const primaryColor = '#1e3a5f';
  const accentColor = '#27ae60';
  const textColor = '#333333';
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  doc.rect(0, 0, pageWidth, 70).fill(primaryColor);
  
  doc.fillColor('white')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('ISO AUDIT PREP CHECKLIST', margin, 15, { align: 'center', width: contentWidth });
  
  doc.fontSize(11)
     .font('Helvetica')
     .text('ISO 9001 | ISO 14001 | ISO 45001', margin, 40, { align: 'center', width: contentWidth });
  
  doc.fontSize(8)
     .font('Helvetica-Oblique')
     .text('Distributed by Core Compliance Hub & ACSI Quality', margin, 54, { align: 'center', width: contentWidth });

  let y = 82;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('30 DAYS BEFORE AUDIT', margin, y);
  
  y += 14;
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const thirtyDays = [
    'Review previous audit findings and verify closure of nonconformities',
    'Confirm audit scope and schedule with certification body',
    'Update document control register - ensure latest revisions available',
    'Review management review meeting minutes (within 12 months)',
    'Verify internal audit program is current and complete',
    'Check calibration records for monitoring equipment'
  ];

  thirtyDays.forEach(item => {
    doc.rect(margin + 10, y + 1, 6, 6).lineWidth(0.5).strokeColor(textColor).stroke();
    doc.text(item, margin + 20, y, { width: contentWidth - 30 });
    y += 11;
  });

  y += 4;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('14 DAYS BEFORE AUDIT', margin, y);

  y += 14;
  const fourteenDays = [
    'Brief all department managers on audit schedule and their roles',
    'Review objectives and KPIs - ensure targets are documented and tracked',
    'Verify training records are complete for all personnel',
    'Check corrective action log - ensure timely closure of CAPAs',
    'Walk the floor - look for housekeeping, signage, safety issues',
    'Review customer complaints and ensure proper handling documented'
  ];

  fourteenDays.forEach(item => {
    doc.rect(margin + 10, y + 1, 6, 6).lineWidth(0.5).strokeColor(textColor).stroke();
    doc.text(item, margin + 20, y, { width: contentWidth - 30 });
    y += 11;
  });

  y += 4;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('DAY BEFORE AUDIT', margin, y);

  y += 14;
  const dayBefore = [
    'Confirm auditor arrival time and logistics',
    'Prepare conference room with projector, whiteboard, refreshments',
    'Print key documents: policy, objectives, org chart, process maps',
    'Assign escorts/guides for each auditor',
    'Brief employees: answer honestly, stay calm, call for help if unsure'
  ];

  dayBefore.forEach(item => {
    doc.rect(margin + 10, y + 1, 6, 6).lineWidth(0.5).strokeColor(textColor).stroke();
    doc.text(item, margin + 20, y, { width: contentWidth - 30 });
    y += 11;
  });

  y += 4;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('COMMON AUDIT FINDINGS TO AVOID', margin, y);

  y += 14;
  const colWidth = (contentWidth - 15) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 15;

  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const leftFindings = [
    'Outdated documents in use',
    'Missing training records',
    'Objectives not measurable',
    'Incomplete risk assessments',
    'No evidence of management review'
  ];
  
  const rightFindings = [
    'CAPAs not closed on time',
    'Calibration overdue',
    'Emergency drills not conducted',
    'Supplier evaluations incomplete',
    'Records not retained per policy'
  ];

  const startY = y;
  leftFindings.forEach(item => {
    doc.circle(leftX + 13, y + 3, 1.5).fill(textColor);
    doc.fillColor(textColor).text(item, leftX + 20, y, { width: colWidth - 30 });
    y += 10;
  });

  let rightY = startY;
  rightFindings.forEach(item => {
    doc.circle(rightX + 3, rightY + 3, 1.5).fill(textColor);
    doc.fillColor(textColor).text(item, rightX + 10, rightY, { width: colWidth - 20 });
    rightY += 10;
  });

  y = Math.max(y, rightY) + 6;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('AUDITOR QUESTIONS TO EXPECT', margin, y);

  y += 12;
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const questions = [
    '"Show me your policy and explain how it applies to your work."',
    '"What are your quality/environmental/safety objectives?"',
    '"How do you know if you\'re meeting customer requirements?"',
    '"What do you do when something goes wrong?"',
    '"How were you trained for this job?"'
  ];

  questions.forEach(item => {
    doc.circle(margin + 13, y + 3, 1.5).fill(textColor);
    doc.fillColor(textColor).text(item, margin + 20, y, { width: contentWidth - 30 });
    y += 11;
  });

  y += 6;
  doc.rect(margin, y, contentWidth, 38).fill('#f0f4f8');
  
  doc.fillColor(primaryColor)
     .fontSize(9)
     .font('Helvetica-Bold')
     .text('NEED ISO GUIDANCE?', margin + 10, y + 6, { width: contentWidth - 20 });
  
  doc.fillColor(textColor)
     .fontSize(7)
     .font('Helvetica')
     .text('Use the ACSI ISO Manager AI at Core Compliance Hub for gap analysis, audit prep, and write-up-free guidance. Our Lead Auditor AI helps you achieve and maintain certification.', margin + 10, y + 18, { width: contentWidth - 20 });

  y += 48;
  
  const logoPath = path.join(process.cwd(), 'attached_assets', '4_1768938699860.png');
  const logoWidth = 180;
  const logoX = (pageWidth - logoWidth) / 2;
  try {
    doc.image(logoPath, logoX, y, { width: logoWidth });
  } catch (e) {
  }

  const footerY = pageHeight - 22;
  doc.fillColor(primaryColor)
     .fontSize(7)
     .font('Helvetica-Bold')
     .text('Core Compliance Hub - THE ONE STOP EMPLOYER SHOP', margin, footerY, { align: 'center', width: contentWidth });
  
  doc.fontSize(6)
     .font('Helvetica')
     .fillColor(textColor)
     .text('www.corecompliancehub.com | For educational purposes. Consult your certification body for specific requirements.', margin, footerY + 10, { align: 'center', width: contentWidth });

  return doc;
}
