import PDFDocument from 'pdfkit';

export function generateRecordabilityCheatSheet(): typeof PDFDocument.prototype {
  const doc = new PDFDocument({ 
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const primaryColor = '#1e3a5f';
  const accentColor = '#e67e22';
  const textColor = '#333333';

  doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
  
  doc.fillColor('white')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('OSHA 300 RECORDABILITY', 50, 35, { align: 'center' });
  
  doc.fontSize(18)
     .font('Helvetica')
     .text('Quick Reference Cheat Sheet', 50, 70, { align: 'center' });

  doc.fillColor(accentColor)
     .fontSize(10)
     .text('Provided by Core Compliance Hub | www.corecompliancehub.com', 50, 95, { align: 'center' });

  let yPos = 140;

  doc.fillColor(primaryColor)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('THE GOLDEN RULE: Is It Work-Related?', 50, yPos);
  
  yPos += 25;
  doc.fillColor(textColor)
     .fontSize(10)
     .font('Helvetica')
     .text('An injury or illness is work-related if an event or exposure in the work environment either CAUSED or CONTRIBUTED to the condition, or SIGNIFICANTLY AGGRAVATED a pre-existing condition.', 50, yPos, { width: 500 });

  yPos += 45;
  doc.fillColor(primaryColor)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('STEP 1: Did Any of These Occur?', 50, yPos);

  yPos += 20;
  const triggers = [
    'Death',
    'Days away from work',
    'Restricted work or transfer to another job',
    'Medical treatment beyond first aid',
    'Loss of consciousness',
    'Significant injury/illness diagnosed by physician (fractures, punctured eardrum, etc.)'
  ];

  doc.fontSize(10).font('Helvetica').fillColor(textColor);
  triggers.forEach(item => {
    doc.text(`• ${item}`, 60, yPos, { width: 490 });
    yPos += 15;
  });

  yPos += 10;
  doc.fillColor(accentColor)
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('If YES to any → IT IS RECORDABLE (proceed to log)', 60, yPos);
  
  yPos += 5;
  doc.fillColor(textColor)
     .fontSize(11)
     .font('Helvetica')
     .text('If NO to all → NOT RECORDABLE', 60, yPos + 15);

  yPos += 45;
  doc.fillColor(primaryColor)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('FIRST AID vs. MEDICAL TREATMENT', 50, yPos);

  yPos += 20;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(accentColor);
  doc.text('FIRST AID (Not Recordable):', 50, yPos);
  
  yPos += 18;
  doc.fontSize(9).font('Helvetica').fillColor(textColor);
  const firstAid = [
    'Non-prescription medications at non-prescription strength',
    'Tetanus immunizations',
    'Cleaning, flushing, or soaking wounds',
    'Wound coverings (bandages, gauze, butterfly closures, Steri-Strips)',
    'Hot or cold therapy',
    'Non-rigid supports (elastic bandages, wraps)',
    'Temporary immobilization devices for transport',
    'Drilling fingernail/toenail, draining fluid from blister',
    'Eye patches, removing foreign bodies with irrigation or cotton swab',
    'Finger guards, massage, drinking fluids for heat stress'
  ];
  
  firstAid.forEach(item => {
    doc.text(`• ${item}`, 60, yPos, { width: 230 });
    yPos += 12;
  });

  let rightY = yPos - (firstAid.length * 12);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor);
  doc.text('MEDICAL TREATMENT (Recordable):', 300, rightY - 18);
  
  doc.fontSize(9).font('Helvetica').fillColor(textColor);
  const medicalTreatment = [
    'Prescription medications',
    'Sutures, staples, or surgical glue for wound closure',
    'Rigid immobilization devices (casts, splints, braces)',
    'Physical therapy or chiropractic treatment',
    'Removal of foreign body embedded in eye',
    'Removal of foreign body from wound (if deep)',
    'Use of oxygen for treatment purposes',
    'Any procedure beyond first aid list'
  ];
  
  medicalTreatment.forEach(item => {
    doc.text(`• ${item}`, 310, rightY, { width: 230 });
    rightY += 12;
  });

  yPos = Math.max(yPos, rightY) + 15;

  doc.fillColor(primaryColor)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('COMMON EXCEPTIONS (Not Recordable Even If Work-Related)', 50, yPos);

  yPos += 20;
  doc.fontSize(9).font('Helvetica').fillColor(textColor);
  const exceptions = [
    'Injury from voluntary wellness program participation',
    'Common cold or flu (even if caught at work)',
    'Mental illness (unless physician determines work causation)',
    'Self-inflicted injuries',
    'Injuries from motor vehicle accidents in parking lots during commute',
    'Symptoms from eating/drinking personal food',
    'Personal tasks outside work hours (even if on premises)'
  ];

  exceptions.forEach(item => {
    doc.text(`• ${item}`, 60, yPos, { width: 490 });
    yPos += 13;
  });

  yPos += 10;
  doc.fillColor(primaryColor)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('RECORDING TIMELINE', 50, yPos);

  yPos += 18;
  doc.fontSize(10).font('Helvetica').fillColor(textColor);
  doc.text('• Record within 7 calendar days of receiving information about a recordable case', 60, yPos);
  yPos += 14;
  doc.text('• Update records within 7 days if case status changes', 60, yPos);
  yPos += 14;
  doc.text('• Retain OSHA 300 Log and 301 forms for 5 years following the year they cover', 60, yPos);
  yPos += 14;
  doc.text('• Post OSHA 300A Summary from February 1 to April 30 annually', 60, yPos);

  yPos += 25;
  doc.rect(50, yPos, doc.page.width - 100, 60).fill('#f5f5f5');
  
  doc.fillColor(primaryColor)
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('NEED HELP WITH A SPECIFIC CASE?', 60, yPos + 10);
  
  doc.fillColor(textColor)
     .fontSize(9)
     .font('Helvetica')
     .text('Use the OccHealth Consultant AI at Core Compliance Hub for instant guidance on complex recordability questions. Our AI references OSHA 29 CFR 1904 to help you make the right call.', 60, yPos + 25, { width: 480 });

  doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(primaryColor);
  
  doc.fillColor('white')
     .fontSize(8)
     .font('Helvetica')
     .text('© 2024 Core Compliance Hub | For educational purposes. Always consult official OSHA regulations for final determinations.', 50, doc.page.height - 28, { align: 'center' });

  return doc;
}
