import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle,
  ShadingType, Header, Footer, ImageRun,
} from 'docx';
import path from 'path';
import * as fsModule from 'fs';

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
      "Close wound using butterfly bandages, Steri-Strips, or adhesive wound closure strips — classified as first aid",
      "Apply sterile gauze, bandages, or non-stick wound dressings as needed",
      "Administer tetanus immunization if indicated — classified as first aid",
      "Use non-prescription topical antibiotic ointment (e.g., Neosporin, Bacitracin OTC)",
      "Recommend OTC pain relief (ibuprofen, acetaminophen, naproxen) at non-prescription dosing",
    ],
    avoidItems: [
      "Sutures, staples, or surgical glue — medical treatment beyond first aid, triggers recordability",
      "Prescription antibiotics (oral or topical) — any prescription triggers recordability",
      "Prescription pain medications — triggers recordability regardless of clinical rationale",
    ],
    clinicalNotes: "Per 29 CFR 1904.7(a), wound closure using butterfly bandages and Steri-Strips is first aid. Sutures, staples, and surgical glue are medical treatment beyond first aid.",
  },
  strain_sprain: {
    title: "Strain / Sprain / Soft Tissue Injury",
    firstAidPreferences: [
      "Apply hot or cold therapy (ice packs, heating pads, warm compresses) — classified as first aid",
      "Use elastic bandages, wraps, or non-rigid means of support (ACE bandages, elastic sleeves)",
      "Recommend OTC anti-inflammatory medication (ibuprofen 200mg, naproxen 220mg) at non-prescription dosing",
      "Recommend OTC topical analgesics (Biofreeze, IcyHot, Aspercreme) for localized relief",
      "Provide stretching and range-of-motion exercises the employee can perform independently",
      "Recommend temporary activity modification with full-duty return when clinically appropriate",
    ],
    avoidItems: [
      "Prescription muscle relaxants, anti-inflammatories (Meloxicam, Diclofenac), or pain meds — any prescription triggers recordability",
      "Rigid splints, casts, or rigid braces — medical treatment, triggers recordability",
      "Referral to physical therapy or chiropractic — medical treatment beyond first aid",
      "Work restrictions or days away — triggers recordability",
    ],
    clinicalNotes: "Hot/cold therapy, elastic bandages/wraps, and non-prescription medications at OTC strength are first aid. Physical therapy, prescription medications, and rigid immobilization devices are medical treatment beyond first aid.",
  },
  contusion: {
    title: "Contusion / Bruise / Impact Injury",
    firstAidPreferences: [
      "Apply cold therapy (ice packs) immediately, then warm compresses as appropriate",
      "Use elastic wraps or compression bandages for swelling management",
      "Recommend OTC pain relief (ibuprofen, acetaminophen) at non-prescription dosing",
      "Recommend OTC topical pain relief (Arnica gel, IcyHot) for localized treatment",
      "Return employee to full duty with no restrictions when clinically appropriate",
    ],
    avoidItems: [
      "Prescription pain medications or anti-inflammatories — any prescription triggers recordability",
      "Work restrictions or days away — triggers recordability (proceed only if medically necessary)",
      "Physical therapy referral — constitutes medical treatment beyond first aid",
    ],
    clinicalNotes: "Contusions typically respond well to first-aid treatment. Diagnostic imaging (X-ray) is NOT medical treatment — but if imaging reveals a fracture, the case becomes recordable based on the significant diagnosis.",
  },
  burn: {
    title: "Burn (Thermal / Chemical)",
    firstAidPreferences: [
      "Flush and clean the burned area thoroughly with clean water or saline",
      "Apply sterile bandages, gauze, or non-stick wound dressings",
      "Use OTC burn cream or OTC topical antibiotic ointment (Bacitracin OTC, aloe vera gel)",
      "Recommend OTC pain relief (ibuprofen, acetaminophen) at non-prescription dosing",
      "Administer tetanus immunization if indicated — classified as first aid",
      "For chemical burns: ensure thorough decontamination and irrigation per SDS instructions",
    ],
    avoidItems: [
      "Prescription burn creams (e.g., Silvadene) — any prescription triggers recordability",
      "Prescription pain medications — triggers recordability regardless of rationale",
      "Debridement beyond simple wound cleaning — surgical debridement is medical treatment",
    ],
    clinicalNotes: "First-degree and minor second-degree burns often respond well to first-aid treatment. Even a single application of a prescription topical cream constitutes medical treatment under 29 CFR 1904.7(a).",
  },
  eye_injury: {
    title: "Eye Injury / Foreign Body / Irritation",
    firstAidPreferences: [
      "Irrigate the eye thoroughly with saline or clean water to flush contaminants",
      "Remove foreign bodies from the surface of the eye using irrigation or cotton swab — first aid",
      "Apply an eye patch if needed for comfort — classified as first aid",
      "Recommend OTC lubricating eye drops (artificial tears) for irritation",
      "Recommend OTC pain relief (ibuprofen, acetaminophen) at non-prescription dosing",
    ],
    avoidItems: [
      "Prescription eye drops (antibiotic or steroid) — any prescription triggers recordability",
      "Removal of foreign bodies embedded in the eyeball — medical treatment beyond first aid",
      "Referral to ophthalmology for treatment — triggers recordability if treatment beyond first aid given",
    ],
    clinicalNotes: "Removing foreign bodies from the eye surface using irrigation or cotton swab is first aid. Removing foreign bodies EMBEDDED in the eye is medical treatment. Eye patches and irrigation are first aid.",
  },
  back_injury: {
    title: "Back Injury / Back Pain",
    firstAidPreferences: [
      "Apply hot or cold therapy (ice packs, heating pads) — classified as first aid",
      "Recommend OTC anti-inflammatory medication (ibuprofen 200mg, naproxen 220mg) at non-prescription dosing",
      "Recommend OTC topical analgesics (Biofreeze, IcyHot, Salonpas patches) for localized relief",
      "Use elastic back support wraps or non-rigid lumbar support (non-rigid = first aid)",
      "Provide home stretching exercises and ergonomic guidance",
      "Recommend continued activity as tolerated — full duty return when clinically appropriate",
    ],
    avoidItems: [
      "Prescription muscle relaxants (Flexeril, Robaxin) or pain medications — any prescription triggers recordability",
      "Prescription anti-inflammatories (Meloxicam, Diclofenac) — triggers recordability even for a single dose",
      "Rigid back braces or lumbar devices — medical treatment, triggers recordability",
      "Physical therapy, chiropractic, or massage therapy referrals — medical treatment beyond first aid",
      "Work restrictions or days away — triggers recordability",
    ],
    clinicalNotes: "Back injuries are one of the most common areas where cases escalate from first aid to recordable. OTC medication, hot/cold therapy, elastic wraps, and home exercises are all first aid. A prescription or physical therapy order makes the case recordable.",
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
      "Prescription inhalers, cough medications, or steroids — any prescription triggers recordability",
      "Oxygen administration as treatment (pulse oximetry/diagnostic assessment are NOT medical treatment, but O2 as treatment is)",
      "Work restrictions or days away — triggers recordability",
    ],
    clinicalNotes: "Diagnostic procedures (pulse oximetry, chest X-ray, PFT screening) are NOT medical treatment. The case becomes recordable only if treatment beyond first aid is administered or a significant illness is diagnosed.",
  },
  skin_condition: {
    title: "Skin Condition / Dermatitis / Rash",
    firstAidPreferences: [
      "Clean and flush the affected area thoroughly with soap and water",
      "Apply OTC hydrocortisone cream (0.5% or 1%) for inflammation and itching",
      "Recommend OTC antihistamines (Benadryl, Claritin, Zyrtec) at non-prescription dosing",
      "Use non-prescription barrier creams or moisturizers for skin protection",
      "Apply cold compresses for itching and swelling relief",
      "Recommend avoidance of the irritant and use of appropriate PPE",
    ],
    avoidItems: [
      "Prescription topical steroids (betamethasone, triamcinolone) — even a single application triggers recordability",
      "Prescription oral steroids (Prednisone) or prescription antihistamines — any prescription triggers recordability",
      "Referral to dermatology for treatment — triggers recordability if treatment beyond first aid given",
    ],
    clinicalNotes: "A single application of a prescription topical cream crosses the medical treatment threshold under 29 CFR 1904.7(a). OTC hydrocortisone at 1% or less is first aid.",
  },
  general: {
    title: "General Workplace Injury",
    firstAidPreferences: [
      "Treat with first-aid measures first — cleaning, flushing, bandaging wounds as appropriate",
      "Use non-prescription (OTC) medications at non-prescription strength for pain/inflammation",
      "Apply hot or cold therapy as clinically appropriate",
      "Use elastic bandages, wraps, or non-rigid means of support as needed",
      "Administer tetanus immunization if indicated — classified as first aid",
      "Use butterfly bandages or Steri-Strips for wound closure when clinically sufficient",
      "Return the employee to full duty with no restrictions when clinically appropriate",
    ],
    avoidItems: [
      "Prescription medications of any kind — any prescription triggers recordability regardless of rationale",
      "Sutures, staples, or surgical glue — medical treatment beyond first aid",
      "Rigid splints, casts, or rigid immobilization devices — medical treatment",
      "Physical therapy, chiropractic, or specialist referrals for treatment — medical treatment beyond first aid",
      "Work restrictions or days away from work — triggers recordability",
    ],
    clinicalNotes: "Under 29 CFR 1904.7(a), the distinction between first aid and medical treatment is based on the TYPE of treatment provided, not the severity of the injury. When multiple clinically appropriate options exist, the first-aid option is preferred.",
  },
};

export async function generateClinicLetterDocx(params: ClinicLetterParams): Promise<Buffer> {
  const guidance = INJURY_GUIDANCE[params.injuryType] || INJURY_GUIDANCE.general;
  const today = params.dateOfInjury || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const fs = 22;
  const sm = 20;
  const bul = 20;
  const fontFamily = 'Arial';

  const headerFields: Paragraph[] = [];

  const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

  headerFields.push(new Paragraph({
    children: [new TextRun({ text: `Date: ${today}`, size: fs, font: fontFamily })],
    spacing: { after: 40 },
  }));

  headerFields.push(new Paragraph({
    children: [new TextRun({ text: `To: ${params.clinicName || 'Treating Occupational Health Provider'}`, size: fs, bold: true, font: fontFamily })],
    spacing: { after: 30 },
  }));

  headerFields.push(new Paragraph({
    children: [new TextRun({ text: `From: ${params.companyName}`, size: fs, bold: true, font: fontFamily })],
    spacing: { after: 20 },
  }));

  if (params.companyContact) {
    headerFields.push(new Paragraph({
      children: [new TextRun({ text: `Contact: ${params.companyContact}${params.companyContactTitle ? `, ${params.companyContactTitle}` : ''}`, size: sm, font: fontFamily })],
      spacing: { after: 20 },
    }));
  }
  if (params.companyPhone) {
    headerFields.push(new Paragraph({
      children: [new TextRun({ text: `Phone: ${params.companyPhone}`, size: sm, font: fontFamily })],
      spacing: { after: 20 },
    }));
  }
  if (params.companyAddress) {
    headerFields.push(new Paragraph({
      children: [new TextRun({ text: `Address: ${params.companyAddress}`, size: sm, font: fontFamily })],
      spacing: { after: 20 },
    }));
  }

  const reLine = params.employeeName
    ? `Re: ${params.employeeName} — ${guidance.title}`
    : `Re: Employee Workplace Injury — ${guidance.title}`;
  headerFields.push(new Paragraph({
    children: [new TextRun({ text: reLine, size: fs, bold: true, font: fontFamily })],
    spacing: { after: 20 },
  }));

  if (params.injuryDescription) {
    headerFields.push(new Paragraph({
      children: [new TextRun({ text: `Injury Description: ${params.injuryDescription}`, size: sm, italics: true, font: fontFamily })],
      spacing: { after: 40 },
    }));
  }

  const introParagraphs = [
    new Paragraph({
      children: [new TextRun({ text: 'Dear Treating Provider,', size: fs, font: fontFamily })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Thank you for seeing our employee. ${params.companyName} takes workplace safety and accurate OSHA recordkeeping seriously. We respectfully request that, when multiple clinically appropriate treatment options exist, you consider treatment approaches that remain within the OSHA first-aid classification under 29 CFR 1904.7(a). This is not a request to withhold necessary medical care — it is a request to consider first-aid-level treatment FIRST when clinically sufficient.`, size: fs, font: fontFamily })],
      spacing: { after: 60 },
    }),
  ];

  const greenHeaderRow = new TableRow({
    children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: 'PREFERRED FIRST-AID TREATMENT OPTIONS', size: 20, bold: true, color: 'FFFFFF', font: fontFamily })],
      })],
      shading: { fill: '276749', type: ShadingType.CLEAR, color: 'auto' },
      borders: noBorders,
    })],
  });

  const greenBulletRows = guidance.firstAidPreferences.map(item => new TableRow({
    children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: `  •  ${item}`, size: bul, color: '276749', font: fontFamily })],
        spacing: { after: 20 },
      })],
      borders: noBorders,
    })],
  }));

  const greenTable = new Table({
    rows: [greenHeaderRow, ...greenBulletRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const redHeaderRow = new TableRow({
    children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: 'TREATMENTS THAT TRIGGER OSHA RECORDABILITY', size: 20, bold: true, color: 'FFFFFF', font: fontFamily })],
      })],
      shading: { fill: 'C53030', type: ShadingType.CLEAR, color: 'auto' },
      borders: noBorders,
    })],
  });

  const redBulletRows = guidance.avoidItems.map(item => new TableRow({
    children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: `  •  ${item}`, size: bul, color: 'C53030', font: fontFamily })],
        spacing: { after: 20 },
      })],
      borders: noBorders,
    })],
  }));

  const redTable = new Table({
    rows: [redHeaderRow, ...redBulletRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const clinicalNotesRow = new TableRow({
    children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: 'CLINICAL NOTES', size: 18, bold: true, color: 'FFFFFF', font: fontFamily })],
      })],
      shading: { fill: '2C5282', type: ShadingType.CLEAR, color: 'auto' },
      borders: noBorders,
    })],
  });

  const clinicalNotesBody = new TableRow({
    children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: guidance.clinicalNotes, size: sm, italics: true, font: fontFamily })],
        spacing: { before: 30, after: 30 },
      })],
      shading: { fill: 'F0F4F8', type: ShadingType.CLEAR, color: 'auto' },
      borders: noBorders,
    })],
  });

  const clinicalTable = new Table({
    rows: [clinicalNotesRow, clinicalNotesBody],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const closingParagraphs = [
    new Paragraph({
      children: [new TextRun({ text: 'If medical treatment beyond first aid is clinically necessary, please proceed with appropriate care. We ask that you document the clinical rationale so we can accurately classify the case on our OSHA 300 Log.', size: fs, font: fontFamily })],
      spacing: { before: 60, after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Respectfully, ', size: fs, font: fontFamily }),
        new TextRun({ text: params.companyContact || '[Authorized Company Representative]', size: fs, bold: true, font: fontFamily }),
        ...(params.companyContactTitle ? [new TextRun({ text: `, ${params.companyContactTitle}`, size: sm, font: fontFamily })] : []),
      ],
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: params.companyName, size: sm, font: fontFamily }),
        ...(params.companyPhone ? [new TextRun({ text: `  |  ${params.companyPhone}`, size: sm, font: fontFamily })] : []),
      ],
      spacing: { after: 10 },
    }),
  ];

  let logoImageRun: ImageRun | null = null;
  try {
    const logoPath = path.join(process.cwd(), 'attached_assets', '4_1768938699860.png');
    const logoData = fsModule.readFileSync(logoPath);
    logoImageRun = new ImageRun({
      data: logoData,
      transformation: { width: 45, height: 45 },
      type: 'png',
    });
  } catch (e) {}

  const headerChildren: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: 'EMPLOYER CLINIC COMMUNICATION LETTER', size: 24, bold: true, color: '1E3A5F', font: fontFamily })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 10 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Occupational Health Treatment Preferences — Per 29 CFR 1904.7(a)', size: 16, italics: true, color: '666666', font: fontFamily })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
    }),
  ];

  const footerChildren: Paragraph[] = [];
  if (logoImageRun) {
    footerChildren.push(new Paragraph({
      children: [
        logoImageRun,
        new TextRun({ text: '  Core Compliance Hub', size: 14, bold: true, color: '1E3A5F', font: fontFamily }),
        new TextRun({ text: '  |  www.corecompliancehub.com  |  A DBA of ACSI', size: 12, color: '888888', font: fontFamily }),
      ],
      alignment: AlignmentType.CENTER,
    }));
  } else {
    footerChildren.push(new Paragraph({
      children: [
        new TextRun({ text: 'Core Compliance Hub', size: 14, bold: true, color: '1E3A5F', font: fontFamily }),
        new TextRun({ text: '  |  www.corecompliancehub.com  |  A DBA of ACSI', size: 12, color: '888888', font: fontFamily }),
      ],
      alignment: AlignmentType.CENTER,
    }));
  }

  const lineSpacing = Math.round(240 * 1.15);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: fontFamily, size: fs },
          paragraph: { spacing: { line: lineSpacing } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 600, bottom: 600, left: 720, right: 720 },
        },
      },
      headers: {
        default: new Header({
          children: headerChildren,
        }),
      },
      footers: {
        default: new Footer({
          children: footerChildren,
        }),
      },
      children: [
        ...headerFields,
        ...introParagraphs,
        greenTable,
        new Paragraph({ spacing: { after: 40 } }),
        redTable,
        new Paragraph({ spacing: { after: 40 } }),
        clinicalTable,
        ...closingParagraphs,
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

export function getAvailableInjuryTypes(): { value: string; label: string }[] {
  return Object.entries(INJURY_GUIDANCE).map(([key, val]) => ({
    value: key,
    label: val.title,
  }));
}
