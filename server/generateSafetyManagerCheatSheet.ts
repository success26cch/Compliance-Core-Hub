import PDFDocument from 'pdfkit';
import path from 'path';

export function generateSafetyManagerCheatSheet(): typeof PDFDocument.prototype {
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
     .fontSize(18)
     .font('Helvetica-Bold')
     .text('NEW SAFETY MANAGER', margin, 12, { align: 'center', width: contentWidth });
  
  doc.fontSize(14)
     .text('First 30 Days Survival Guide', margin, 32, { align: 'center', width: contentWidth });
  
  doc.fontSize(8)
     .font('Helvetica-Oblique')
     .text('Distributed by Core Compliance Hub - Your Partner in Workplace Safety', margin, 54, { align: 'center', width: contentWidth });

  let y = 80;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('WEEK 1: ASSESS & ORIENT', margin, y);
  
  y += 13;
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const week1 = [
    'Meet with leadership - understand their safety expectations and concerns',
    'Review OSHA 300 logs from past 3 years - identify trends and problem areas',
    'Locate all safety programs, policies, and written procedures',
    'Identify your workers\' comp carrier and loss control contact',
    'Walk every department - introduce yourself and observe conditions',
    'Find out: Who handles training? Inspections? Incident investigations?'
  ];

  week1.forEach(item => {
    doc.text(`☐ ${item}`, margin + 10, y, { width: contentWidth - 20 });
    y += 10;
  });

  y += 4;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 7;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('WEEK 2: DIG INTO COMPLIANCE', margin, y);

  y += 13;
  const week2 = [
    'Verify OSHA poster is displayed and 300A summary posted (Feb 1 - Apr 30)',
    'Check SDS availability - are they accessible to all employees?',
    'Review lockout/tagout procedures and authorized employee list',
    'Audit PPE program - hazard assessments, training records, fit testing',
    'Verify emergency action plan - exits marked, drills documented?',
    'Check fire extinguisher inspections (monthly/annual)'
  ];

  week2.forEach(item => {
    doc.text(`☐ ${item}`, margin + 10, y, { width: contentWidth - 20 });
    y += 10;
  });

  y += 4;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 7;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('WEEK 3: BUILD RELATIONSHIPS', margin, y);

  y += 13;
  const week3 = [
    'Meet with supervisors one-on-one - learn their safety challenges',
    'Attend production/operations meetings - understand the business',
    'Identify your safety champions on the floor',
    'Review training matrix - who needs what training and when?',
    'Start documenting everything you find (good and bad)',
    'Connect with HR on workers\' comp claims and return-to-work program'
  ];

  week3.forEach(item => {
    doc.text(`☐ ${item}`, margin + 10, y, { width: contentWidth - 20 });
    y += 10;
  });

  y += 4;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 7;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('WEEK 4: PLAN YOUR FIRST 90 DAYS', margin, y);

  y += 13;
  const week4 = [
    'Prioritize findings - fix the big stuff first (serious hazards)',
    'Draft 90-day action plan with measurable goals',
    'Present findings and plan to leadership - get buy-in',
    'Schedule recurring safety committee meetings',
    'Set up inspection schedules and assign responsibilities',
    'Identify quick wins to build credibility'
  ];

  week4.forEach(item => {
    doc.text(`☐ ${item}`, margin + 10, y, { width: contentWidth - 20 });
    y += 10;
  });

  y += 4;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 7;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('KEY METRICS TO START TRACKING', margin, y);

  y += 12;
  const colWidth = (contentWidth - 15) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 15;

  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const leftMetrics = [
    'TRIR (Total Recordable Incident Rate)',
    'DART (Days Away, Restricted, Transfer)',
    'Near-miss reports submitted',
    'Training completion rates'
  ];
  
  const rightMetrics = [
    'Inspection completion rates',
    'Corrective action closure time',
    'Workers\' comp costs',
    'EMR (Experience Modification Rate)'
  ];

  const startY = y;
  leftMetrics.forEach(item => {
    doc.text(`• ${item}`, leftX + 10, y, { width: colWidth - 20 });
    y += 10;
  });

  let rightY = startY;
  rightMetrics.forEach(item => {
    doc.text(`• ${item}`, rightX, rightY, { width: colWidth - 20 });
    rightY += 10;
  });

  y = Math.max(y, rightY) + 6;

  doc.rect(margin, y, contentWidth, 36).fill('#f0f4f8');
  
  doc.fillColor(primaryColor)
     .fontSize(9)
     .font('Helvetica-Bold')
     .text('FEELING OVERWHELMED?', margin + 10, y + 6, { width: contentWidth - 20 });
  
  doc.fillColor(textColor)
     .fontSize(7)
     .font('Helvetica')
     .text('Use the OccHealth Consultant AI at Core Compliance Hub for instant answers to compliance questions. Get guidance on OSHA, DOT, and workplace safety 24/7.', margin + 10, y + 17, { width: contentWidth - 20 });

  y += 44;
  
  const logoPath = path.join(process.cwd(), 'attached_assets', '4_1768938699860.png');
  const logoWidth = 160;
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
     .text('www.corecompliancehub.com | Your first 30 days set the tone. Make them count.', margin, footerY + 10, { align: 'center', width: contentWidth });

  return doc;
}
