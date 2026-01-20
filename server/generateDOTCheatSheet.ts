import PDFDocument from 'pdfkit';
import path from 'path';

export function generateDOTDrugTestingCheatSheet(): typeof PDFDocument.prototype {
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
     .text('DOT DRUG & ALCOHOL TESTING', margin, 15, { align: 'center', width: contentWidth });
  
  doc.fontSize(11)
     .font('Helvetica')
     .text('Quick Reference Guide (49 CFR Part 40)', margin, 40, { align: 'center', width: contentWidth });
  
  doc.fontSize(8)
     .font('Helvetica-Oblique')
     .text('Distributed by Core Compliance Hub - Your Partner in Workplace Safety', margin, 54, { align: 'center', width: contentWidth });

  let y = 82;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('WHEN IS DOT TESTING REQUIRED?', margin, y);
  
  y += 14;
  const testingTypes = [
    ['Pre-Employment', 'Before performing safety-sensitive functions for the first time'],
    ['Random', 'Unannounced selection from pool (50% drugs, 10% alcohol annually)'],
    ['Post-Accident', 'After accidents meeting DOT criteria (fatality, injury, vehicle towed)'],
    ['Reasonable Suspicion', 'Based on trained supervisor observations'],
    ['Return-to-Duty', 'After violation, before resuming safety-sensitive duties'],
    ['Follow-Up', 'Unannounced tests after return-to-duty (min 6 tests in 12 months)']
  ];

  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  testingTypes.forEach(item => {
    doc.font('Helvetica-Bold').text(`• ${item[0]}: `, margin + 10, y, { continued: true, width: contentWidth - 20 });
    doc.font('Helvetica').text(item[1], { width: contentWidth - 80 });
    y += 12;
  });

  y += 6;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('DOT 5-PANEL DRUG TEST', margin, y);

  y += 14;
  const colWidth = (contentWidth - 15) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 15;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#c0392b');
  doc.text('Substances Tested:', leftX, y);
  
  doc.fillColor('#27ae60');
  doc.text('Cutoff Levels (Screening):', rightX, y);
  
  y += 12;
  const startY = y;
  
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const substances = [
    'Marijuana (THC)',
    'Cocaine',
    'Amphetamines/Methamphetamines',
    'Opioids (expanded panel)',
    'Phencyclidine (PCP)'
  ];
  
  substances.forEach(item => {
    doc.text(`• ${item}`, leftX, y, { width: colWidth });
    y += 10;
  });

  let rightY = startY;
  const cutoffs = [
    'THC: 50 ng/mL (screen) / 15 ng/mL (confirm)',
    'Cocaine: 150 ng/mL / 100 ng/mL',
    'Amphetamines: 500 ng/mL / 250 ng/mL',
    'Opioids: 2000 ng/mL / varies',
    'PCP: 25 ng/mL / 25 ng/mL'
  ];
  
  cutoffs.forEach(item => {
    doc.text(`• ${item}`, rightX, rightY, { width: colWidth });
    rightY += 10;
  });

  y = Math.max(y, rightY) + 6;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('ALCOHOL TESTING THRESHOLDS', margin, y);

  y += 14;
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const alcoholRules = [
    ['Below 0.02 BAC', 'Negative - Employee may perform safety-sensitive functions', '#27ae60'],
    ['0.02 - 0.039 BAC', 'Removed from duty for minimum 8 hours OR until retest below 0.02', '#e67e22'],
    ['0.04 BAC or higher', 'POSITIVE - Immediate removal, SAP evaluation required', '#c0392b']
  ];

  alcoholRules.forEach(item => {
    doc.font('Helvetica-Bold').fillColor(item[2] as string).text(`• ${item[0]}: `, margin + 10, y, { continued: true });
    doc.font('Helvetica').fillColor(textColor).text(item[1], { width: contentWidth - 100 });
    y += 12;
  });

  y += 6;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('CLEARINGHOUSE REQUIREMENTS', margin, y);

  y += 12;
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  const clearinghouse = [
    'Query all new hires before they perform safety-sensitive functions',
    'Conduct annual queries on all current CDL drivers',
    'Report violations, refusals, and RTD test results within specific timeframes',
    'Employers must register at clearinghouse.fmcsa.dot.gov'
  ];

  clearinghouse.forEach(item => {
    doc.text(`• ${item}`, margin + 10, y, { width: contentWidth - 20 });
    y += 10;
  });

  y += 6;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(0.5).stroke();
  y += 8;

  doc.fillColor(primaryColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('POST-ACCIDENT TESTING DECISION', margin, y);

  y += 12;
  doc.fontSize(7).font('Helvetica').fillColor(textColor);
  doc.text('You MUST test the driver if ANY of these apply:', margin + 10, y);
  y += 11;
  const postAccident = [
    'A fatality occurred (test ALL surviving drivers)',
    'Driver received a citation AND bodily injury requiring immediate medical treatment',
    'Driver received a citation AND any vehicle requires towing from the scene'
  ];

  postAccident.forEach(item => {
    doc.text(`• ${item}`, margin + 20, y, { width: contentWidth - 30 });
    y += 10;
  });

  y += 2;
  doc.font('Helvetica-Bold').fillColor('#c0392b').text('Testing Window: Drug test within 32 hours, Alcohol test within 8 hours', margin + 10, y);

  y += 16;
  doc.rect(margin, y, contentWidth, 38).fill('#f0f4f8');
  
  doc.fillColor(primaryColor)
     .fontSize(9)
     .font('Helvetica-Bold')
     .text('QUESTIONS ABOUT DOT TESTING?', margin + 10, y + 6, { width: contentWidth - 20 });
  
  doc.fillColor(textColor)
     .fontSize(7)
     .font('Helvetica')
     .text('Use the OccHealth Consultant AI at Core Compliance Hub for instant guidance on DOT drug and alcohol testing requirements. Our AI references 49 CFR Part 40.', margin + 10, y + 18, { width: contentWidth - 20 });

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
     .text('www.corecompliancehub.com | For educational purposes. Consult official DOT regulations for final determinations.', margin, footerY + 10, { align: 'center', width: contentWidth });

  return doc;
}
