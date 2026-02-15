import PDFDocument from 'pdfkit';
import path from 'path';

export function generateRecordabilityCheatSheet(): typeof PDFDocument.prototype {
  const doc = new PDFDocument({ 
    size: 'LETTER',
    margin: 0
  });

  const primaryColor = '#1e3a5f';
  const textColor = '#333333';
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  doc.rect(0, 0, pageWidth, 70).fill(primaryColor);
  
  doc.fillColor('white')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text('OSHA 300 RECORDABILITY', margin, 15, { align: 'center', width: contentWidth });
  
  doc.fontSize(11)
     .font('Helvetica')
     .text('Quick Reference Cheat Sheet', margin, 40, { align: 'center', width: contentWidth });
  
  doc.fontSize(8)
     .font('Helvetica-Oblique')
     .text('Distributed by Core Compliance Hub - Your Partner in Workplace Safety', margin, 54, { align: 'center', width: contentWidth });

  let y = 82;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('THE GOLDEN RULE: Is It Work-Related?', margin, y);
  
  y += 14;
  doc.fillColor(textColor)
     .fontSize(8)
     .font('Helvetica')
     .text('An injury/illness is work-related if an event or exposure in the work environment CAUSED, CONTRIBUTED TO, or SIGNIFICANTLY AGGRAVATED the condition.', margin, y, { width: contentWidth });

  y += 24;
  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('STEP 1: Did Any of These Occur? (If YES = RECORDABLE)', margin, y);

  y += 13;
  const triggers = [
    'Death',
    'Days away from work',
    'Restricted work or job transfer',
    'Medical treatment beyond first aid',
    'Loss of consciousness',
    'Significant injury diagnosed by physician (fractures, punctured eardrum, etc.)'
  ];

  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  triggers.forEach(item => {
    doc.text(`• ${item}`, margin + 10, y, { width: contentWidth - 20 });
    y += 10;
  });

  y += 6;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('FIRST AID vs. MEDICAL TREATMENT', margin, y);

  y += 14;
  
  const colWidth = (contentWidth - 15) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 15;
  
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#27ae60');
  doc.text('FIRST AID (NOT Recordable):', leftX, y);
  
  doc.fillColor('#c0392b');
  doc.text('MEDICAL TREATMENT (Recordable):', rightX, y);
  
  y += 12;
  const startY = y;
  
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const firstAid = [
    'Non-prescription meds at OTC strength',
    'Tetanus shots',
    'Cleaning/flushing wounds',
    'Bandages, gauze, butterfly closures',
    'Hot/cold therapy',
    'Elastic bandages, wraps',
    'Eye patches, irrigation',
    'Finger guards, massage',
    'Drilling nail to relieve pressure',
    'Fluids for heat stress'
  ];
  
  firstAid.forEach(item => {
    doc.text(`• ${item}`, leftX, y, { width: colWidth });
    y += 9;
  });

  let rightY = startY;
  const medicalTreatment = [
    'Prescription medications',
    'Sutures, staples, surgical glue',
    'Casts, splints, rigid braces',
    'Physical therapy/chiropractic',
    'Removing embedded eye objects',
    'Deep foreign body removal',
    'Oxygen treatment',
    'Any procedure beyond first aid'
  ];
  
  medicalTreatment.forEach(item => {
    doc.text(`• ${item}`, rightX, rightY, { width: colWidth });
    rightY += 9;
  });

  y = Math.max(y, rightY) + 6;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('COMMON EXCEPTIONS (Not Recordable Even If Work-Related)', margin, y);

  y += 12;
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const exceptions = [
    ['Voluntary wellness program injuries', 'Mental illness (unless physician confirms)'],
    ['Common cold/flu caught at work', 'Self-inflicted injuries'],
    ['Parking lot commute accidents', 'Personal food/drink symptoms'],
    ['Personal tasks outside work hours', '']
  ];

  exceptions.forEach(row => {
    doc.text(`• ${row[0]}`, margin + 10, y, { width: colWidth });
    if (row[1]) {
      doc.text(`• ${row[1]}`, rightX, y, { width: colWidth });
    }
    y += 10;
  });

  y += 4;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('RECORDING TIMELINE', margin, y);

  y += 12;
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const timeline = [
    'Record within 7 calendar days of learning about a recordable case',
    'Update within 7 days if case status changes',
    'Retain OSHA 300 Log and 301 forms for 5 years',
    'Post 300A Summary: February 1 - April 30 annually'
  ];
  
  timeline.forEach(item => {
    doc.text(`• ${item}`, margin + 10, y);
    y += 10;
  });

  y += 8;
  doc.rect(margin, y, contentWidth, 38).fill('#f0f4f8');
  
  doc.fillColor(primaryColor)
     .fontSize(9)
     .font('Helvetica-Bold')
     .text('NEED HELP WITH A SPECIFIC CASE?', margin + 10, y + 6, { width: contentWidth - 20 });
  
  doc.fillColor(textColor)
     .fontSize(7)
     .font('Helvetica')
     .text('Ask Corey — the Core Compliance Hub AI — for instant guidance on complex recordability questions. Corey references OSHA 29 CFR 1904 to help you make the right call.', margin + 10, y + 18, { width: contentWidth - 20 });

  y += 48;
  
  const logoPath = path.join(process.cwd(), 'attached_assets', '4_1768938699860.png');
  const logoWidth = 200;
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
     .text('www.corecompliancehub.com | For educational purposes. Consult official OSHA regulations for final determinations.', margin, footerY + 10, { align: 'center', width: contentWidth });

  return doc;
}
