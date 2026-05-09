/* ─────────────────────────────────────────────────────────────────────────────
 * Compliance Question Bank
 * ISO 14001 §6.1.3  — Applicability screening (does this requirement apply?)
 * ISO 14001 §9.1.2  — Compliance evaluation (are we meeting this requirement?)
 * ───────────────────────────────────────────────────────────────────────────── */

export type ApplicabilityQuestion = {
  id: string;
  text: string;
  hint?: string;
  yesIndicates: "applies" | "not_applies";
};

export type EvaluationQuestion = {
  id: string;
  text: string;
  hint?: string;
};

export type QuestionSet = {
  key: string;
  label: string;
  categoryMatch: string[];
  namePatterns: string[];
  citationPatterns: string[];
  applicabilityIntro: string;
  applicabilityQuestions: ApplicabilityQuestion[];
  evaluationIntro: string;
  evaluationQuestions: EvaluationQuestion[];
};

export const QUESTION_BANK: QuestionSet[] = [
  /* ── SPCC ── */
  {
    key: "spcc",
    label: "Spill Prevention, Control & Countermeasure (SPCC)",
    categoryMatch: ["Oil Management & Spillage"],
    namePatterns: ["spcc", "spill prevention", "oil spill", "oil storage"],
    citationPatterns: ["40 cfr part 112", "40 cfr 112"],
    applicabilityIntro:
      "SPCC applies to facilities that store oil above specific thresholds and have a reasonable potential to discharge oil to navigable waters. The following questions help determine if your facility meets the applicability criteria under 40 CFR Part 112.",
    applicabilityQuestions: [
      {
        id: "spcc_a1",
        text: "Does your facility store petroleum products (motor oil, diesel, hydraulic fluid, lubricants, transformer oil, etc.) in containers of 55 gallons or larger?",
        hint: "Includes above-ground storage tanks, drums, totes, and portable containers ≥55 gal.",
        yesIndicates: "applies",
      },
      {
        id: "spcc_a2",
        text: "Does your facility's total above-ground oil storage capacity exceed 1,320 gallons (across all containers ≥55 gal)?",
        hint: "Add all storage capacities together — this is the primary SPCC threshold.",
        yesIndicates: "applies",
      },
      {
        id: "spcc_a3",
        text: "Could an oil spill at your facility potentially reach a navigable waterway, storm drain, or ditch connected to surface water?",
        hint: "Consider surface drainage patterns, proximity to storm drains, ditches, or waterways.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "The following questions assess whether your facility is meeting its obligations under the SPCC rule (40 CFR Part 112). Answer based on your current documented practices.",
    evaluationQuestions: [
      {
        id: "spcc_e1",
        text: "Does your facility have a written SPCC Plan in place?",
        hint: "A written plan is required — verbal plans do not satisfy the requirement.",
      },
      {
        id: "spcc_e2",
        text: "Has the SPCC Plan been certified by a licensed Professional Engineer (PE), or does your facility qualify for and use owner/operator self-certification?",
        hint: "Facilities with ≤10,000 gal total capacity and no prior spill history may self-certify.",
      },
      {
        id: "spcc_e3",
        text: "Has the Plan been reviewed and updated within the last 5 years, or within 6 months of any significant change to your facility?",
        hint: "Review triggers include new tanks, spills, or process changes.",
      },
      {
        id: "spcc_e4",
        text: "Does your facility have adequate secondary containment for all oil storage containers (e.g., containment berms, dikes, or equivalent)?",
        hint: "Containment must hold 110% of the largest single container.",
      },
      {
        id: "spcc_e5",
        text: "Are oil storage containers and associated equipment inspected regularly and are inspection records documented?",
        hint: "SPCC requires periodic inspections — frequency varies by facility type.",
      },
      {
        id: "spcc_e6",
        text: "Have all personnel whose duties involve oil transfer, storage, or spill response received SPCC training?",
        hint: "Training must be conducted at least once per year for oil-handling personnel.",
      },
    ],
  },

  /* ── RCRA Hazardous Waste ── */
  {
    key: "rcra",
    label: "RCRA Hazardous Waste Management",
    categoryMatch: ["Solid & Liquid Waste"],
    namePatterns: ["hazardous waste", "rcra", "solid waste", "generator", "liquid industrial waste"],
    citationPatterns: ["40 cfr part 2", "40 cfr 26", "part 111", "part 115", "rcra"],
    applicabilityIntro:
      "RCRA Subtitle C applies to facilities that generate hazardous waste as defined under 40 CFR Part 261. These questions help determine whether your facility generates regulated hazardous waste.",
    applicabilityQuestions: [
      {
        id: "rcra_a1",
        text: "Does your facility generate any solid waste from industrial processes, maintenance, cleaning, painting, or product use?",
        hint: "Almost all manufacturing and maintenance activities produce some solid waste.",
        yesIndicates: "applies",
      },
      {
        id: "rcra_a2",
        text: "Have any waste streams been evaluated to determine if they are hazardous (ignitable, corrosive, reactive, toxic, or listed)?",
        hint: "A formal waste characterization study is the correct method.",
        yesIndicates: "applies",
      },
      {
        id: "rcra_a3",
        text: "Does your facility generate used solvents, spent acids, waste paint, waste oil not managed as universal waste, or other chemical-containing wastes?",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your facility is meeting its RCRA hazardous waste generator obligations under 40 CFR Parts 262–268.",
    evaluationQuestions: [
      {
        id: "rcra_e1",
        text: "Are all hazardous waste containers properly labeled with 'Hazardous Waste,' contents, and accumulation start date?",
        hint: "Labels must be visible and legible at all times.",
      },
      {
        id: "rcra_e2",
        text: "Are containers kept closed except when adding or removing waste, and are they in good condition with no leaks?",
      },
      {
        id: "rcra_e3",
        text: "Are applicable storage time limits being met (90 days for LQGs, 180 or 270 days for SQGs/VSQGs)?",
        hint: "Exceeding storage limits without a permit constitutes treatment/disposal without authorization.",
      },
      {
        id: "rcra_e4",
        text: "Is a written contingency/emergency response plan in place, posted at the facility, and communicated to the local fire department?",
      },
      {
        id: "rcra_e5",
        text: "Are hazardous waste manifests completed and retained for all off-site shipments?",
        hint: "Manifests must be kept for at least 3 years.",
      },
      {
        id: "rcra_e6",
        text: "Have employees who handle hazardous waste received proper training, and are training records documented?",
        hint: "Training must be completed within 6 months of employment and annually thereafter for LQGs.",
      },
    ],
  },

  /* ── TRI / SARA 313 ── */
  {
    key: "tri",
    label: "Toxic Release Inventory (TRI / SARA Section 313)",
    categoryMatch: ["Chemical Reporting"],
    namePatterns: ["tri", "form r", "toxic release", "sara 313", "section 313", "toxic chemical release"],
    citationPatterns: ["40 cfr part 372", "sara 313", "section 313"],
    applicabilityIntro:
      "TRI (SARA Section 313) requires annual reporting of releases and transfers of listed toxic chemicals. These questions determine if your facility meets the applicability criteria.",
    applicabilityQuestions: [
      {
        id: "tri_a1",
        text: "Does your facility have 10 or more full-time employees (or equivalent)?",
        yesIndicates: "applies",
      },
      {
        id: "tri_a2",
        text: "Is your facility's primary industry in an applicable SIC or NAICS code covered by TRI reporting?",
        hint: "Most manufacturing facilities (SIC 20–39), metal mining, chemical distribution, and others are covered.",
        yesIndicates: "applies",
      },
      {
        id: "tri_a3",
        text: "Does your facility manufacture, process, or otherwise use any EPA-listed TRI chemicals (e.g., toluene, xylene, lead, cadmium, chromium)?",
        yesIndicates: "applies",
      },
      {
        id: "tri_a4",
        text: "Do any TRI chemicals exceed the applicable reporting threshold (25,000 lb manufactured/processed or 10,000 lb otherwise used annually)?",
        hint: "Some PBT chemicals have lower thresholds (e.g., 10 lb for dioxin, 100 lb for lead).",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your facility is meeting its TRI reporting obligations under SARA Section 313 and 40 CFR Part 372.",
    evaluationQuestions: [
      {
        id: "tri_e1",
        text: "Have you identified all TRI-listed chemicals present at your facility at or above threshold quantities?",
        hint: "A chemical inventory tied to purchase records and SDS is the typical method.",
      },
      {
        id: "tri_e2",
        text: "Was Form R (or Form A if eligible) submitted to EPA via the TRI-MEweb system by July 1st for the prior calendar year?",
        hint: "Late submissions are subject to civil penalties.",
      },
      {
        id: "tri_e3",
        text: "Are release and transfer quantities calculated using EPA-approved estimation methods and documented?",
      },
      {
        id: "tri_e4",
        text: "Are all TRI records (calculations, supporting data, submitted forms) retained for at least 3 years?",
      },
    ],
  },

  /* ── EPCRA Tier II ── */
  {
    key: "tier2",
    label: "EPCRA Tier II Chemical Inventory Reporting (SARA 311/312)",
    categoryMatch: ["Chemical Reporting", "Emergency Planning"],
    namePatterns: ["tier ii", "tier 2", "epcra", "chemical inventory", "sara 311", "sara 312"],
    citationPatterns: ["40 cfr part 370", "sara 311", "sara 312", "epcra"],
    applicabilityIntro:
      "Tier II reporting applies to facilities that store hazardous chemicals above OSHA HazCom thresholds at any time during the year. These questions help determine if your facility must file.",
    applicabilityQuestions: [
      {
        id: "tier2_a1",
        text: "Does your facility store any hazardous chemicals subject to OSHA's Hazard Communication Standard (HCS) — i.e., chemicals with a Safety Data Sheet?",
        yesIndicates: "applies",
      },
      {
        id: "tier2_a2",
        text: "Do any hazardous chemicals exceed the reporting threshold? (500 lb for Extremely Hazardous Substances, or 10,000 lb for all other hazardous chemicals)",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate compliance with EPCRA Tier II annual chemical inventory reporting requirements.",
    evaluationQuestions: [
      {
        id: "tier2_e1",
        text: "Was the Tier II report submitted by March 1st to your State Emergency Response Commission (SERC), Local Emergency Planning Committee (LEPC), and local fire department?",
        hint: "Many states require electronic submission through their state portal.",
      },
      {
        id: "tier2_e2",
        text: "Does the Tier II report accurately reflect all chemicals stored at or above threshold quantities during the prior calendar year?",
      },
      {
        id: "tier2_e3",
        text: "Are the reported chemical quantities consistent with your chemical inventory records, purchase receipts, and SDS files?",
      },
      {
        id: "tier2_e4",
        text: "Are storage location descriptions and hazard categories accurately reported on the form?",
      },
    ],
  },

  /* ── Stormwater (NPDES) ── */
  {
    key: "stormwater",
    label: "Stormwater Management (NPDES / MSGP)",
    categoryMatch: ["Stormwater"],
    namePatterns: ["stormwater", "npdes", "msgp", "swppp", "discharge monitoring"],
    citationPatterns: ["40 cfr part 122", "npdes", "msgp"],
    applicabilityIntro:
      "Industrial stormwater permits are required when stormwater contacts industrial materials and discharges to surface waters. These questions determine if your facility needs a stormwater permit.",
    applicabilityQuestions: [
      {
        id: "sw_a1",
        text: "Does stormwater have the potential to contact industrial materials, raw materials, products, waste materials, or equipment at your facility?",
        hint: "Consider outdoor storage areas, loading docks, vehicle maintenance areas, and material transfer points.",
        yesIndicates: "applies",
      },
      {
        id: "sw_a2",
        text: "Does stormwater runoff from your facility discharge (directly or through a storm sewer) to a river, lake, stream, wetland, or coastal water?",
        yesIndicates: "applies",
      },
      {
        id: "sw_a3",
        text: "Is your facility's industrial activity covered under EPA's Multi-Sector General Permit (MSGP) or your state's equivalent industrial stormwater permit?",
        hint: "Most manufacturing, mining, transportation, and waste management facilities are covered.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your facility is meeting its NPDES industrial stormwater permit obligations.",
    evaluationQuestions: [
      {
        id: "sw_e1",
        text: "Does your facility have a current, active NPDES stormwater permit (e.g., MSGP authorization) or state-equivalent coverage?",
        hint: "You should have a NOI (Notice of Intent) confirmation or permit number.",
      },
      {
        id: "sw_e2",
        text: "Is a written Stormwater Pollution Prevention Plan (SWPPP) in place, site-specific, and current?",
        hint: "The SWPPP must be updated whenever facility conditions change.",
      },
      {
        id: "sw_e3",
        text: "Are Best Management Practices (BMPs) identified in the SWPPP actually implemented in the field?",
      },
      {
        id: "sw_e4",
        text: "Are quarterly visual inspections of stormwater discharge points and industrial areas conducted and documented?",
      },
      {
        id: "sw_e5",
        text: "Are Discharge Monitoring Reports (DMRs) or equivalent reports submitted to the regulatory agency on schedule?",
      },
      {
        id: "sw_e6",
        text: "Is an annual comprehensive site inspection conducted and the results used to update the SWPPP?",
      },
    ],
  },

  /* ── Air Quality ── */
  {
    key: "air",
    label: "Air Quality & Emissions Permitting",
    categoryMatch: ["Air Quality"],
    namePatterns: ["air", "emission", "permit", "neshap", "mact", "voc", "particulate", "asbestos"],
    citationPatterns: ["40 cfr part 60", "40 cfr part 61", "40 cfr part 63", "rule 336", "caa"],
    applicabilityIntro:
      "Air quality regulations apply to facilities with emission sources such as combustion equipment, spray booths, solvent use, or dust-generating processes. These questions help identify applicability.",
    applicabilityQuestions: [
      {
        id: "air_a1",
        text: "Does your facility have any air emission sources — such as boilers, generators, furnaces, paint booths, degreasing operations, or dust-generating processes?",
        yesIndicates: "applies",
      },
      {
        id: "air_a2",
        text: "Have you estimated whether any emission sources exceed your state's air permitting thresholds (Minor Source, Major Source, or NSR thresholds)?",
        yesIndicates: "applies",
      },
      {
        id: "air_a3",
        text: "Has your facility received any air permit, registration, or exemption determination from your state or local air quality agency?",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your facility is meeting its air quality permit and regulatory obligations.",
    evaluationQuestions: [
      {
        id: "air_e1",
        text: "Are all required air permits, operating registrations, or exemption certifications current and on file?",
      },
      {
        id: "air_e2",
        text: "Are all permit conditions being met — including operational limits, emission limits, and throughput restrictions?",
      },
      {
        id: "air_e3",
        text: "Are any required emission calculations, stack tests, or CEMS (Continuous Emission Monitoring) records current and documented?",
        hint: "Stack tests typically must be repeated every 3–5 years or after process changes.",
      },
      {
        id: "air_e4",
        text: "Are required operational monitoring records, compliance logs, and annual compliance certifications completed and retained?",
      },
      {
        id: "air_e5",
        text: "Were any permit deviations, excess emissions, or regulatory exceedances reported to the agency as required?",
        hint: "Most permits require prompt notification (within 24 hours for some events) and written follow-up.",
      },
    ],
  },

  /* ── HazCom (OSHA) ── */
  {
    key: "hazcom",
    label: "Hazard Communication (OSHA HazCom / GHS)",
    categoryMatch: ["Material Use/Exposure", "Health and Safety Requirements"],
    namePatterns: ["hazcom", "hazard communication", "sds", "ghs", "right to know", "chemical safety"],
    citationPatterns: ["29 cfr 1910.1200", "hazcom", "osha 1910"],
    applicabilityIntro:
      "OSHA's Hazard Communication Standard (HazCom / GHS) applies to any employer whose employees may be exposed to hazardous chemicals under normal conditions or in a foreseeable emergency.",
    applicabilityQuestions: [
      {
        id: "hazcom_a1",
        text: "Does your facility use, handle, store, or produce any hazardous chemicals?",
        hint: "This includes paints, solvents, cleaners, lubricants, acids, bases, or any chemical with an SDS.",
        yesIndicates: "applies",
      },
      {
        id: "hazcom_a2",
        text: "Are employees potentially exposed to hazardous chemicals during normal work operations or in reasonably foreseeable emergency situations?",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate compliance with OSHA's Hazard Communication Standard (29 CFR 1910.1200).",
    evaluationQuestions: [
      {
        id: "hazcom_e1",
        text: "Is a written Hazard Communication Program (HazCom plan) in place, current, and accessible to all employees?",
      },
      {
        id: "hazcom_e2",
        text: "Is a complete Safety Data Sheet (SDS) available and accessible for every hazardous chemical at your facility?",
        hint: "SDSs must be accessible to employees in their work areas at all times during work hours.",
      },
      {
        id: "hazcom_e3",
        text: "Are all hazardous chemical containers properly labeled with GHS-compliant labels (product identifier, pictograms, signal word, hazard/precautionary statements)?",
      },
      {
        id: "hazcom_e4",
        text: "Have all employees received initial HazCom training and additional training when new chemical hazards are introduced?",
      },
      {
        id: "hazcom_e5",
        text: "Is HazCom training documented with dates and employee acknowledgments?",
      },
    ],
  },

  /* ── Universal Waste ── */
  {
    key: "universal_waste",
    label: "Universal Waste Management",
    categoryMatch: ["Material Use/Exposure", "Solid & Liquid Waste"],
    namePatterns: ["universal waste", "fluorescent lamp", "mercury", "battery", "aerosol can", "pesticide"],
    citationPatterns: ["40 cfr part 273", "universal waste", "part 111"],
    applicabilityIntro:
      "Universal Waste rules apply to facilities that generate batteries, fluorescent lamps, mercury-containing equipment, pesticides, or aerosol cans that are no longer usable.",
    applicabilityQuestions: [
      {
        id: "uw_a1",
        text: "Does your facility generate spent fluorescent lamps, used batteries, mercury-containing thermostats or instruments, or unusable pesticides?",
        yesIndicates: "applies",
      },
      {
        id: "uw_a2",
        text: "Does your facility generate aerosol cans that are no longer usable (not fully emptied)?",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether universal wastes at your facility are properly managed under 40 CFR Part 273 (or your state's equivalent rules).",
    evaluationQuestions: [
      {
        id: "uw_e1",
        text: "Are universal waste containers or packages properly labeled with 'Universal Waste — [type]' and the accumulation start date?",
      },
      {
        id: "uw_e2",
        text: "Are storage time limits being met? (12 months maximum for small quantity handlers; large quantity handlers must keep records of accumulation start dates)",
      },
      {
        id: "uw_e3",
        text: "Are universal wastes sent to a licensed universal waste handler, recycler, or destination facility — not disposed of in the regular trash?",
      },
      {
        id: "uw_e4",
        text: "Have employees received basic training on proper universal waste handling and the prohibition against disposal in the regular solid waste stream?",
      },
    ],
  },

  /* ── PSM ── */
  {
    key: "psm",
    label: "Process Safety Management (OSHA PSM)",
    categoryMatch: ["Health and Safety Requirements", "Other Applicable Requirements"],
    namePatterns: ["psm", "process safety", "highly hazardous chemical", "1910.119"],
    citationPatterns: ["29 cfr 1910.119", "psm", "process safety"],
    applicabilityIntro:
      "OSHA's PSM Standard applies to facilities that handle listed highly hazardous chemicals (HHCs) at or above threshold quantities. These questions determine if your facility is covered.",
    applicabilityQuestions: [
      {
        id: "psm_a1",
        text: "Does your facility use, store, manufacture, or handle any of OSHA's listed highly hazardous chemicals (e.g., chlorine, ammonia, flammable liquids with flash point < 100°F, highly toxic chemicals)?",
        hint: "See 29 CFR 1910.119, Appendix A for the complete list of HHCs and threshold quantities.",
        yesIndicates: "applies",
      },
      {
        id: "psm_a2",
        text: "Does the quantity of any listed HHC present at your facility at one time meet or exceed its threshold quantity (TQ)?",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your PSM-covered facility is meeting the 14 elements required by OSHA's Process Safety Management Standard (29 CFR 1910.119).",
    evaluationQuestions: [
      {
        id: "psm_e1",
        text: "Has a Process Hazard Analysis (PHA) been completed for all covered processes and updated within the last 5 years?",
        hint: "PHAs must use HAZOP, What-If, Checklist, or equivalent methodology.",
      },
      {
        id: "psm_e2",
        text: "Is written Process Safety Information (PSI) — including P&IDs, chemical hazard data, and design limits — current and accessible?",
      },
      {
        id: "psm_e3",
        text: "Are written standard operating procedures (SOPs) current for all covered process phases (startup, normal, temporary, emergency shutdown)?",
      },
      {
        id: "psm_e4",
        text: "Have all employees working with or maintaining covered processes received PSM training, and is training documented?",
        hint: "Refresher training is required at least every 3 years.",
      },
      {
        id: "psm_e5",
        text: "Is a Mechanical Integrity (MI) program in place for PSM-covered equipment, including documented inspection/testing and maintenance records?",
      },
      {
        id: "psm_e6",
        text: "Are Management of Change (MOC) procedures documented and followed before implementing any process changes?",
      },
      {
        id: "psm_e7",
        text: "Is an Emergency Action Plan (EAP) specific to PSM-covered scenarios developed, communicated, and current?",
      },
      {
        id: "psm_e8",
        text: "Is an Incident Investigation procedure in place and have all PSM-related near misses and incidents been investigated with action items tracked?",
      },
    ],
  },

  /* ── ISO 14001 EMS ── */
  {
    key: "iso14001",
    label: "ISO 14001 Environmental Management System (EMS)",
    categoryMatch: ["Other Applicable Requirements"],
    namePatterns: ["iso 14001", "ems", "environmental management system"],
    citationPatterns: ["iso 14001"],
    applicabilityIntro:
      "ISO 14001 EMS certification is a voluntary commitment. These questions determine whether your organization has taken on this obligation as part of its scope.",
    applicabilityQuestions: [
      {
        id: "ems_a1",
        text: "Has your organization voluntarily committed to pursuing or maintaining ISO 14001 Environmental Management System certification?",
        yesIndicates: "applies",
      },
      {
        id: "ems_a2",
        text: "Is ISO 14001 certification a customer, contractual, or supply chain requirement for your organization?",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your ISO 14001 EMS certification status is being maintained in conformance with the standard.",
    evaluationQuestions: [
      {
        id: "ems_e1",
        text: "Is your ISO 14001 certificate current and within its 3-year certification cycle?",
        hint: "Certificates expire after 3 years; surveillance audits are required in years 1 and 2.",
      },
      {
        id: "ems_e2",
        text: "Have all required surveillance audits (years 1 and 2) and recertification audits (year 3) been completed on schedule?",
      },
      {
        id: "ems_e3",
        text: "Have all major (NC) and minor (OFI) findings from the most recent audit been addressed and closed with evidence?",
      },
      {
        id: "ems_e4",
        text: "Is your Environmental Policy current, approved by top management, and communicated to all employees and external interested parties?",
      },
      {
        id: "ems_e5",
        text: "Has a management review of the EMS been conducted within the past 12 months with documented outputs?",
      },
    ],
  },

  /* ── CWA / Water Quality ── */
  {
    key: "water",
    label: "Water Quality & Wastewater (CWA / Pretreatment)",
    categoryMatch: ["Water Quality & Spillage Prevention"],
    namePatterns: ["wastewater", "pretreatment", "cwa", "clean water act", "potw", "discharge"],
    citationPatterns: ["40 cfr part 403", "40 cfr part 129", "cwa"],
    applicabilityIntro:
      "Wastewater and pretreatment regulations apply to facilities that discharge process wastewater to a Publicly Owned Treatment Works (POTW) or directly to surface waters.",
    applicabilityQuestions: [
      {
        id: "water_a1",
        text: "Does your facility discharge any process wastewater, cooling water, or wash water to the municipal sewer system (POTW)?",
        yesIndicates: "applies",
      },
      {
        id: "water_a2",
        text: "Does your facility discharge any wastewater directly to a surface water body under an NPDES permit?",
        yesIndicates: "applies",
      },
      {
        id: "water_a3",
        text: "Does your facility use any regulated substances (heavy metals, solvents, oils, acids, cyanides) in processes that result in wastewater?",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate compliance with wastewater discharge and pretreatment requirements.",
    evaluationQuestions: [
      {
        id: "water_e1",
        text: "Does your facility have a current Industrial Pretreatment Permit or equivalent authorization from the local POTW?",
      },
      {
        id: "water_e2",
        text: "Are wastewater discharge monitoring requirements being met — including sampling frequency, pollutant limits, and analytical methods?",
      },
      {
        id: "water_e3",
        text: "Are Discharge Monitoring Reports (DMRs) submitted to the POTW or regulatory agency on schedule?",
      },
      {
        id: "water_e4",
        text: "Are any slug discharge prevention controls required by your permit in place and documented?",
      },
    ],
  },
];

/* ─── Helper to find a matching question set ─────────────────────────────── */
export function findQuestionSet(
  requirementName: string,
  aspectCategory: string,
  citationSource: string | null | undefined
): QuestionSet | null {
  const nameLower = requirementName.toLowerCase();
  const catLower = aspectCategory.toLowerCase();
  const citeLower = (citationSource ?? "").toLowerCase();

  for (const qs of QUESTION_BANK) {
    const nameMatch = qs.namePatterns.some(p => nameLower.includes(p));
    const catMatch = qs.categoryMatch.some(c => c.toLowerCase() === catLower);
    const citeMatch = qs.citationPatterns.some(p => citeLower.includes(p));

    if (nameMatch || (catMatch && (citeMatch || qs.citationPatterns.length === 0))) {
      return qs;
    }
  }
  return null;
}

/* ─── Scoring helpers ────────────────────────────────────────────────────── */
export type QuestionAnswer = "yes" | "no" | "not_sure";

export function scoreApplicability(
  questions: ApplicabilityQuestion[],
  answers: Record<string, QuestionAnswer>
): "likely_applies" | "may_not_apply" | "needs_review" {
  const answered = Object.entries(answers);
  if (answered.length === 0) return "needs_review";

  const anyYesApplies = questions.some(
    q => q.yesIndicates === "applies" && answers[q.id] === "yes"
  );
  const anyNotSure = answered.some(([, a]) => a === "not_sure");
  const allNo = questions.every(q => answers[q.id] === "no");

  if (anyYesApplies) return "likely_applies";
  if (allNo) return "may_not_apply";
  if (anyNotSure) return "needs_review";
  return "needs_review";
}

export function scoreEvaluation(
  questions: EvaluationQuestion[],
  answers: Record<string, QuestionAnswer>
): {
  status: "compliant" | "non_compliant" | "under_review";
  yesCount: number;
  noCount: number;
  notSureCount: number;
  findingsText: string;
} {
  const yesCount = Object.values(answers).filter(a => a === "yes").length;
  const noCount = Object.values(answers).filter(a => a === "no").length;
  const notSureCount = Object.values(answers).filter(a => a === "not_sure").length;

  let status: "compliant" | "non_compliant" | "under_review" = "compliant";
  if (noCount > 0) status = "non_compliant";
  else if (notSureCount > 0) status = "under_review";

  const findingLines: string[] = [];
  questions.forEach(q => {
    const ans = answers[q.id];
    if (!ans) return;
    const label = ans === "yes" ? "✓ Yes" : ans === "no" ? "✗ No" : "? Not Sure";
    findingLines.push(`${label}: ${q.text}`);
  });

  const findingsText = `Compliance Self-Assessment Results:\n\n${findingLines.join("\n")}\n\n` +
    `Summary: ${yesCount} Compliant / ${noCount} Non-Compliant / ${notSureCount} Under Review`;

  return { status, yesCount, noCount, notSureCount, findingsText };
}
