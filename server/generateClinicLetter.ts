import PDFDocument from 'pdfkit';
import path from 'path';

interface ClinicLetterParams {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyContact?: string;
  companyContactTitle?: string;
  clinicName?: string;
  employeeName?: string;
  injuryType: string;
  injuryDescription?: string;
  dateOfInjury?: string;
}

const INJURY_GUIDANCE: Record<string, { title: string; firstAidPreferences: string[]; avoidItems: string[]; clinicalNotes: string }> = {
  laceration: {
    title: "Laceration / Cut / Wound",
    firstAidPreferences: [
      "Clean and flush the wound thoroughly with saline or clean water",
      "Close wound using butterfly bandages, Steri-Strips, or adhesive wound closure strips when clinically appropriate — these are classified as first aid under 29 CFR 1904.7(a)",
      "Apply sterile gauze, bandages, or non-stick wound dressings as needed",
      "Administer tetanus immunization if indicated — tetanus shots are classified as first aid",
      "Use non-prescription topical antibiotic ointment (e.g., Neosporin, Bacitracin OTC) to prevent infection",
      "Recommend OTC pain relief (ibuprofen, acetaminophen, naproxen) at non-prescription dosing",
    ],
    avoidItems: [
      "Sutures, staples, or surgical glue — these constitute medical treatment beyond first aid and trigger OSHA recordability",
      "Prescription antibiotics (oral or topical) — any prescription medication, even a single dose, constitutes medical treatment and makes the case recordable",
      "Prescription pain medications — triggers recordability regardless of clinical rationale",
    ],
    clinicalNotes: "Per 29 CFR 1904.7(a), wound closure using butterfly bandages and Steri-Strips is classified as first aid. Sutures, staples, and surgical glue are classified as medical treatment beyond first aid. When the wound can be adequately closed with adhesive methods, this is the preferred clinical approach.",
  },
  strain_sprain: {
    title: "Strain / Sprain / Soft Tissue Injury",
    firstAidPreferences: [
      "Apply hot or cold therapy (ice packs, heating pads, warm compresses) — classified as first aid",
      "Use elastic bandages, wraps, or non-rigid means of support (e.g., ACE bandages, elastic knee/ankle sleeves)",
      "Recommend OTC anti-inflammatory medication (ibuprofen 200mg, naproxen 220mg) at non-prescription dosing",
      "Recommend OTC topical analgesics (e.g., Biofreeze, IcyHot, Aspercreme) for localized relief",
      "Provide stretching and range-of-motion exercises the employee can perform independently",
      "Recommend temporary activity modification with full-duty return when clinically appropriate",
    ],
    avoidItems: [
      "Prescription muscle relaxants, prescription-strength anti-inflammatories (e.g., Meloxicam, Diclofenac), or prescription pain medications — any prescription triggers recordability",
      "Rigid splints, casts, or rigid braces — these constitute medical treatment and trigger recordability",
      "Referral to physical therapy or chiropractic treatment — these constitute medical treatment beyond first aid and trigger recordability",
      "Work restrictions or days away from work — these trigger recordability (if medically necessary, proceed but understand the OSHA classification impact)",
    ],
    clinicalNotes: "Per 29 CFR 1904.7(a), hot/cold therapy, elastic bandages/wraps, and non-prescription medications at OTC strength are first aid. Physical therapy, chiropractic treatment, prescription medications, and rigid immobilization devices are medical treatment beyond first aid.",
  },
  contusion: {
    title: "Contusion / Bruise / Impact Injury",
    firstAidPreferences: [
      "Apply cold therapy (ice packs) immediately, then transition to warm compresses as appropriate",
      "Use elastic wraps or compression bandages for swelling management",
      "Recommend OTC pain relief (ibuprofen, acetaminophen) at non-prescription dosing",
      "Recommend OTC topical pain relief (Arnica gel, IcyHot) for localized treatment",
      "Return employee to full duty with no restrictions when clinically appropriate",
    ],
    avoidItems: [
      "Prescription pain medications or prescription anti-inflammatories — any prescription triggers recordability",
      "Work restrictions or days away — these trigger recordability (proceed only if medically necessary based on confirmed significant diagnosis)",
      "Physical therapy referral — constitutes medical treatment beyond first aid",
    ],
    clinicalNotes: "Contusions typically respond well to first-aid-level treatment. Diagnostic imaging (X-ray) does NOT constitute medical treatment — however, if imaging reveals a fracture, the case becomes recordable based on the significant diagnosis under 29 CFR 1904.7(a) regardless of treatment provided.",
  },
  burn: {
    title: "Burn (Thermal / Chemical)",
    firstAidPreferences: [
      "Flush and clean the burned area thoroughly with clean water or saline",
      "Apply sterile bandages, gauze, or non-stick wound dressings",
      "Use OTC burn cream or OTC topical antibiotic ointment (e.g., Bacitracin OTC, aloe vera gel)",
      "Recommend OTC pain relief (ibuprofen, acetaminophen) at non-prescription dosing",
      "Administer tetanus immunization if indicated — classified as first aid",
      "For chemical burns: ensure thorough decontamination and irrigation per SDS instructions",
    ],
    avoidItems: [
      "Prescription burn creams (e.g., Silvadene/silver sulfadiazine) — any prescription medication, even a single application, constitutes medical treatment and triggers recordability",
      "Prescription pain medications — triggers recordability regardless of clinical rationale",
      "Debridement beyond simple wound cleaning — surgical debridement constitutes medical treatment",
    ],
    clinicalNotes: "First-degree burns and minor second-degree burns often respond well to first-aid-level treatment. The key threshold is whether the treating provider prescribes any medication — even a single application of a prescription topical cream constitutes medical treatment under 29 CFR 1904.7(a).",
  },
  eye_injury: {
    title: "Eye Injury / Foreign Body / Irritation",
    firstAidPreferences: [
      "Irrigate the eye thoroughly with saline or clean water to flush contaminants",
      "Remove foreign bodies from the surface of the eye using irrigation or a cotton swab — this is classified as first aid",
      "Apply an eye patch if needed for comfort — classified as first aid",
      "Recommend OTC lubricating eye drops (artificial tears) for irritation",
      "Recommend OTC pain relief (ibuprofen, acetaminophen) at non-prescription dosing",
    ],
    avoidItems: [
      "Prescription eye drops (e.g., prescription antibiotic drops, prescription steroid drops) — any prescription triggers recordability",
      "Removal of foreign bodies embedded in or penetrating the eyeball — this constitutes medical treatment beyond first aid",
      "Referral to ophthalmology for treatment — if treatment beyond first aid is administered, it triggers recordability",
    ],
    clinicalNotes: "Per 29 CFR 1904.7(a), removing foreign bodies from the eye using irrigation, a cotton swab, or similar method is first aid. Removing foreign bodies EMBEDDED in the eye is medical treatment. Eye patches and irrigation are first aid.",
  },
  back_injury: {
    title: "Back Injury / Back Pain",
    firstAidPreferences: [
      "Apply hot or cold therapy (ice packs, heating pads) — classified as first aid",
      "Recommend OTC anti-inflammatory medication (ibuprofen 200mg, naproxen 220mg) at non-prescription dosing",
      "Recommend OTC topical analgesics (e.g., Biofreeze, IcyHot, Salonpas patches) for localized relief",
      "Use elastic back support wraps or non-rigid lumbar support (non-rigid means of support = first aid)",
      "Provide home stretching exercises and ergonomic guidance the employee can follow independently",
      "Recommend continued activity as tolerated — full duty return when clinically appropriate",
    ],
    avoidItems: [
      "Prescription muscle relaxants (e.g., Flexeril, Robaxin) or prescription pain medications — any prescription triggers recordability",
      "Prescription anti-inflammatories (e.g., Meloxicam, Diclofenac) — triggers recordability even for a single dose",
      "Rigid back braces or rigid lumbar support devices — these constitute medical treatment and trigger recordability",
      "Physical therapy, chiropractic treatment, or massage therapy referrals — these constitute medical treatment beyond first aid and trigger recordability",
      "Work restrictions or days away — these trigger recordability (if medically necessary, proceed but understand the OSHA classification impact)",
    ],
    clinicalNotes: "Back injuries are one of the most common areas where cases escalate from first aid to recordable due to treatment choices. OTC medication at OTC doses, hot/cold therapy, elastic wraps, and home exercises are all first aid. The moment a prescription is written or physical therapy is ordered, the case becomes recordable.",
  },
  respiratory: {
    title: "Respiratory Exposure / Inhalation",
    firstAidPreferences: [
      "Move employee to fresh air and monitor symptoms",
      "Provide drinking fluids for recovery if applicable",
      "Recommend OTC cough suppressants or throat lozenges if symptomatic",
      "Observe and release if symptoms resolve — observation is NOT medical treatment",
      "Recommend follow-up only if symptoms persist or worsen",
    ],
    avoidItems: [
      "Prescription inhalers, prescription cough medications, or prescription steroids — any prescription triggers recordability",
      "Oxygen administration as treatment (note: pulse oximetry and diagnostic assessment are NOT medical treatment, but administering O2 as treatment is medical treatment)",
      "Work restrictions or days away — these trigger recordability (if medically necessary, proceed but understand the OSHA classification impact)",
    ],
    clinicalNotes: "Diagnostic procedures (pulse oximetry, chest X-ray, pulmonary function screening) are NOT medical treatment — they are observation. The case becomes recordable only if treatment beyond first aid is administered or a significant illness is diagnosed. Brief oxygen administration for recovery in fresh air is a gray area — if possible, manage symptoms with observation and OTC remedies.",
  },
  skin_condition: {
    title: "Skin Condition / Dermatitis / Rash / Contact Irritation",
    firstAidPreferences: [
      "Clean and flush the affected area thoroughly with soap and water",
      "Apply OTC hydrocortisone cream (0.5% or 1%) for inflammation and itching",
      "Recommend OTC antihistamines (e.g., Benadryl, Claritin, Zyrtec) at non-prescription dosing",
      "Use non-prescription barrier creams or moisturizers for skin protection",
      "Apply cold compresses for itching and swelling relief",
      "Recommend avoidance of the irritant and use of appropriate PPE going forward",
    ],
    avoidItems: [
      "Prescription-strength topical steroids (e.g., prescription hydrocortisone, betamethasone, triamcinolone) — even a single application constitutes medical treatment and triggers recordability",
      "Prescription oral steroids (e.g., Prednisone) or prescription antihistamines — any prescription triggers recordability",
      "Referral to dermatology for treatment — if treatment beyond first aid is administered, it triggers recordability",
    ],
    clinicalNotes: "Skin conditions are a frequent source of unnecessary recordability. A single application of a prescription topical cream crosses the medical treatment threshold under 29 CFR 1904.7(a). OTC hydrocortisone at 1% or less is available without prescription and is classified as first aid. Communicate this clearly to the treating provider.",
  },
  general: {
    title: "General Workplace Injury",
    firstAidPreferences: [
      "Treat with first-aid measures first — cleaning, flushing, bandaging wounds as appropriate",
      "Use non-prescription (OTC) medications at non-prescription strength for pain, inflammation, or infection prevention",
      "Apply hot or cold therapy as clinically appropriate",
      "Use elastic bandages, wraps, or non-rigid means of support as needed",
      "Administer tetanus immunization if indicated — classified as first aid",
      "Use butterfly bandages or Steri-Strips for wound closure when clinically sufficient",
      "Return the employee to full duty with no restrictions when clinically appropriate",
    ],
    avoidItems: [
      "Prescription medications of any kind (oral, topical, injectable) — any prescription constitutes medical treatment and triggers recordability regardless of clinical rationale",
      "Sutures, staples, or surgical glue — these constitute medical treatment beyond first aid (use butterfly bandages/Steri-Strips when clinically sufficient)",
      "Rigid splints, casts, or rigid immobilization devices — these constitute medical treatment (use elastic/non-rigid support when clinically sufficient)",
      "Physical therapy, chiropractic treatment, or specialist referrals for treatment — these constitute medical treatment beyond first aid",
      "Work restrictions or days away from work — these trigger recordability (if medically necessary, proceed but understand the OSHA classification impact)",
    ],
    clinicalNotes: "Under 29 CFR 1904.7(a), the distinction between first aid and medical treatment is based on the TYPE of treatment provided, not the severity of the injury. When multiple clinically appropriate treatment options exist, the option that maintains first-aid classification is preferred.",
  },
};

export function generateClinicLetter(params: ClinicLetterParams): typeof PDFDocument.prototype {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
  });

  const primaryColor = '#1e3a5f';
  const accentColor = '#2c5282';
  const textColor = '#333333';
  const lightBg = '#f0f4f8';
  const greenColor = '#276749';
  const redColor = '#c53030';
  const pageWidth = 612;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);

  const guidance = INJURY_GUIDANCE[params.injuryType] || INJURY_GUIDANCE.general;

  doc.rect(0, 0, pageWidth, 80).fill(primaryColor);

  const logoPath = path.join(process.cwd(), 'attached_assets', '4_1768938699860.png');
  try {
    doc.image(logoPath, margin, 8, { width: 140 });
  } catch (e) {}

  doc.fillColor('white')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('EMPLOYER CLINIC COMMUNICATION LETTER', margin + 160, 18, { width: contentWidth - 160, align: 'right' });

  doc.fontSize(9)
     .font('Helvetica')
     .text('Occupational Health Treatment Preferences', margin + 160, 38, { width: contentWidth - 160, align: 'right' });

  doc.fontSize(8)
     .font('Helvetica-Oblique')
     .text('Per 29 CFR 1904.7(a) — First Aid Classification Standards', margin + 160, 52, { width: contentWidth - 160, align: 'right' });

  let y = 95;

  const today = params.dateOfInjury || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  doc.fillColor(textColor).fontSize(9).font('Helvetica');
  doc.text(`Date: ${today}`, margin, y);
  y += 14;

  if (params.clinicName) {
    doc.font('Helvetica-Bold').text(`To: ${params.clinicName}`, margin, y);
    y += 14;
  } else {
    doc.font('Helvetica-Bold').text('To: Treating Occupational Health Provider', margin, y);
    y += 14;
  }

  doc.font('Helvetica-Bold').text(`From: ${params.companyName}`, margin, y);
  y += 12;
  if (params.companyContact) {
    doc.font('Helvetica').text(`Contact: ${params.companyContact}${params.companyContactTitle ? `, ${params.companyContactTitle}` : ''}`, margin, y);
    y += 12;
  }
  if (params.companyPhone) {
    doc.font('Helvetica').text(`Phone: ${params.companyPhone}`, margin, y);
    y += 12;
  }
  if (params.companyAddress) {
    doc.font('Helvetica').text(`Address: ${params.companyAddress}`, margin, y);
    y += 12;
  }

  y += 4;

  if (params.employeeName) {
    doc.font('Helvetica-Bold').text(`Re: ${params.employeeName} — ${guidance.title}`, margin, y);
  } else {
    doc.font('Helvetica-Bold').text(`Re: Employee Workplace Injury — ${guidance.title}`, margin, y);
  }
  y += 6;
  if (params.injuryDescription) {
    doc.font('Helvetica').fontSize(8).text(`Injury Description: ${params.injuryDescription}`, margin, y, { width: contentWidth });
    y += doc.heightOfString(`Injury Description: ${params.injuryDescription}`, { width: contentWidth }) + 4;
  }

  y += 8;
  doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor(primaryColor).lineWidth(1).stroke();
  y += 10;

  doc.fillColor(textColor).fontSize(9).font('Helvetica');
  const introText = `Dear Treating Provider,

Thank you for seeing our employee. ${params.companyName} is a partner of Core Compliance Hub (CCH) and takes workplace safety and accurate OSHA recordkeeping seriously. We are committed to ensuring our employees receive appropriate and timely medical care for all workplace injuries.

We respectfully request that, when multiple clinically appropriate treatment options exist, you consider treatment approaches that remain within the OSHA first-aid classification under 29 CFR 1904.7(a). This is not a request to withhold or delay necessary medical care — it is a request to consider first-aid-level treatment FIRST when it is clinically sufficient to treat the injury. This approach helps us maintain accurate OSHA 300 Log records and manage our recordable incident rates responsibly.`;

  doc.text(introText, margin, y, { width: contentWidth, lineGap: 2 });
  y += doc.heightOfString(introText, { width: contentWidth, lineGap: 2 }) + 12;

  doc.rect(margin, y, contentWidth, 18).fill(greenColor);
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
  doc.text('PREFERRED FIRST-AID TREATMENT OPTIONS', margin + 8, y + 4, { width: contentWidth - 16 });
  y += 24;

  doc.fillColor(textColor).fontSize(8).font('Helvetica');
  doc.text(`For this type of injury (${guidance.title}), we request that you consider the following first-aid-level treatments when clinically appropriate:`, margin, y, { width: contentWidth });
  y += doc.heightOfString(`For this type of injury (${guidance.title}), we request that you consider the following first-aid-level treatments when clinically appropriate:`, { width: contentWidth }) + 6;

  guidance.firstAidPreferences.forEach((item) => {
    const bulletText = `•  ${item}`;
    const textHeight = doc.heightOfString(bulletText, { width: contentWidth - 20 });
    if (y + textHeight > 700) {
      doc.addPage();
      y = 40;
    }
    doc.fillColor(greenColor).font('Helvetica').fontSize(8);
    doc.text(bulletText, margin + 10, y, { width: contentWidth - 20 });
    y += textHeight + 3;
  });

  y += 10;

  if (y > 620) {
    doc.addPage();
    y = 40;
  }

  doc.rect(margin, y, contentWidth, 18).fill(redColor);
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
  doc.text('TREATMENTS THAT TRIGGER OSHA RECORDABILITY', margin + 8, y + 4, { width: contentWidth - 16 });
  y += 24;

  doc.fillColor(textColor).fontSize(8).font('Helvetica');
  doc.text('Please be aware that the following treatments cross the threshold from first aid to medical treatment under 29 CFR 1904.7(a), making the case OSHA-recordable:', margin, y, { width: contentWidth });
  y += doc.heightOfString('Please be aware that the following treatments cross the threshold from first aid to medical treatment under 29 CFR 1904.7(a), making the case OSHA-recordable:', { width: contentWidth }) + 6;

  guidance.avoidItems.forEach((item) => {
    const bulletText = `•  ${item}`;
    const textHeight = doc.heightOfString(bulletText, { width: contentWidth - 20 });
    if (y + textHeight > 700) {
      doc.addPage();
      y = 40;
    }
    doc.fillColor(redColor).font('Helvetica').fontSize(8);
    doc.text(bulletText, margin + 10, y, { width: contentWidth - 20 });
    y += textHeight + 3;
  });

  y += 10;

  if (y > 580) {
    doc.addPage();
    y = 40;
  }

  doc.rect(margin, y, contentWidth, 18).fill(accentColor);
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
  doc.text('CLINICAL NOTES FOR THIS INJURY TYPE', margin + 8, y + 4, { width: contentWidth - 16 });
  y += 24;

  doc.rect(margin, y, contentWidth, 4).fill(lightBg);
  doc.rect(margin, y, contentWidth, doc.heightOfString(guidance.clinicalNotes, { width: contentWidth - 20 }) + 12).fill(lightBg);
  doc.fillColor(textColor).font('Helvetica-Oblique').fontSize(8);
  doc.text(guidance.clinicalNotes, margin + 10, y + 6, { width: contentWidth - 20 });
  y += doc.heightOfString(guidance.clinicalNotes, { width: contentWidth - 20 }) + 20;

  if (y > 560) {
    doc.addPage();
    y = 40;
  }

  doc.rect(margin, y, contentWidth, 18).fill(primaryColor);
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
  doc.text('29 CFR 1904.7(a) — FIRST AID TREATMENT SUMMARY', margin + 8, y + 4, { width: contentWidth - 16 });
  y += 24;

  doc.fillColor(textColor).fontSize(8).font('Helvetica');
  doc.text('Under OSHA\'s recordkeeping standard, the following treatments are classified as FIRST AID and do NOT make a case recordable:', margin, y, { width: contentWidth });
  y += 14;

  const firstAidList = [
    "Non-prescription medications at nonprescription strength (OTC dosing only)",
    "Tetanus immunizations",
    "Cleaning, flushing, or soaking wounds on the surface of the skin",
    "Wound coverings: bandages, Band-Aids, gauze pads",
    "Butterfly bandages, Steri-Strips, adhesive wound closure strips",
    "Hot or cold therapy (ice packs, heating pads, warm/cold compresses)",
    "Non-rigid means of support: elastic bandages, wraps, elastic sleeves",
    "Temporary immobilization devices used only during transport",
    "Drilling of fingernail/toenail to relieve pressure, draining fluid from a blister",
    "Eye patches, eye irrigation/flushing",
    "Removal of foreign bodies from the eye using irrigation or cotton swab",
    "Removal of splinters or foreign material from areas OTHER than the eye using tweezers, etc.",
    "Finger guards",
    "Massages",
    "Drinking fluids for relief of heat stress",
    "Oxygen as a first aid measure (preventive, not treatment)",
  ];

  firstAidList.forEach((item) => {
    const bulletText = `✓  ${item}`;
    const textHeight = doc.heightOfString(bulletText, { width: contentWidth - 20 });
    if (y + textHeight > 700) {
      doc.addPage();
      y = 40;
    }
    doc.fillColor(greenColor).font('Helvetica').fontSize(7.5);
    doc.text(bulletText, margin + 10, y, { width: contentWidth - 20 });
    y += textHeight + 2;
  });

  y += 12;

  if (y > 580) {
    doc.addPage();
    y = 40;
  }

  const closingText = `We understand and respect that all treatment decisions must be based on the treating provider's clinical judgment and the best interest of the patient. We are not asking you to withhold necessary medical care. We are simply requesting that when multiple clinically appropriate treatment options exist for this injury, you consider the option that maintains first-aid classification under OSHA's regulatory framework.

If medical treatment beyond first aid is clinically necessary, please proceed with the appropriate care. We ask only that you document the clinical rationale for the treatment choice so we can accurately classify the case on our OSHA 300 Log.

Thank you for your partnership in helping us provide quality care for our employees while maintaining accurate OSHA compliance records.`;

  doc.fillColor(textColor).fontSize(9).font('Helvetica');
  doc.text(closingText, margin, y, { width: contentWidth, lineGap: 2 });
  y += doc.heightOfString(closingText, { width: contentWidth, lineGap: 2 }) + 16;

  if (y > 650) {
    doc.addPage();
    y = 40;
  }

  doc.font('Helvetica-Bold').fontSize(9).fillColor(textColor);
  doc.text('Respectfully,', margin, y);
  y += 14;
  doc.text(params.companyContact || '[Authorized Company Representative]', margin, y);
  y += 12;
  if (params.companyContactTitle) {
    doc.font('Helvetica').text(params.companyContactTitle, margin, y);
    y += 12;
  }
  doc.font('Helvetica').text(params.companyName, margin, y);
  y += 12;
  if (params.companyPhone) {
    doc.text(params.companyPhone, margin, y);
    y += 12;
  }

  y += 16;

  doc.rect(margin, y, contentWidth, 50).fill(lightBg);
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9);
  doc.text('CCH Partner Company', margin + 10, y + 6);
  doc.fillColor(textColor).font('Helvetica').fontSize(7.5);
  doc.text(`${params.companyName} is a partner of Core Compliance Hub (CCH) — THE ONE STOP EMPLOYER SHOP for occupational health and safety compliance. This letter was generated using CCH's OSHA Recordkeeping training program to facilitate clear communication between employers and treating providers regarding OSHA first-aid classification standards under 29 CFR 1904.7(a).`, margin + 10, y + 18, { width: contentWidth - 20 });

  y += 58;

  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(7);
  doc.text('Core Compliance Hub | www.corecompliancehub.com | A DBA of ACSI — Assessment and Consulting Services International', margin, y, { align: 'center', width: contentWidth });
  y += 10;
  doc.fillColor(textColor).font('Helvetica').fontSize(6.5);
  doc.text('This letter is for informational purposes only and does not constitute legal advice. All treatment decisions must be made based on the treating provider\'s clinical judgment. Consult 29 CFR 1904 for official OSHA recordkeeping requirements.', margin, y, { align: 'center', width: contentWidth });

  return doc;
}

export function getAvailableInjuryTypes(): { value: string; label: string }[] {
  return Object.entries(INJURY_GUIDANCE).map(([key, val]) => ({
    value: key,
    label: val.title,
  }));
}
