/* ─────────────────────────────────────────────────────────────────────────────
 * Compliance Question Bank
 * ISO 14001 6.1.3  — Applicability screening (does this requirement apply?)
 * ISO 14001 9.1.2  — Compliance evaluation (are we meeting this requirement?)
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

  /* ── LOTO — Lockout/Tagout ── */
  {
    key: "loto",
    label: "Control of Hazardous Energy — Lockout/Tagout (LOTO)",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["lockout", "tagout", "loto", "energy control", "hazardous energy"],
    citationPatterns: ["29 cfr 1910.147", "1910.147"],
    applicabilityIntro:
      "OSHA's Lockout/Tagout (LOTO) standard (29 CFR 1910.147) applies to facilities where employees perform servicing or maintenance on machines or equipment and where the unexpected energization, startup, or release of stored energy could cause injury. It does NOT apply to cord-and-plug equipment that is unplugged and the plug is under exclusive control of the person performing the work, or to minor tool changes on equipment during normal production if they are routine, repetitive, and integral to production.",
    applicabilityQuestions: [
      {
        id: "loto_a1",
        text: "Do employees ever perform service or maintenance on machinery — including tasks such as clearing jams or blockages, cleaning internal parts, lubricating, adjusting, setting up, changing tooling, troubleshooting, or repairing — while the machine could potentially cycle, start, or move?",
        hint: "This is the primary trigger question. Even routine tasks like clearing a press jam or cleaning a conveyor while it is off require LOTO if re-energization would be hazardous.",
        yesIndicates: "applies",
      },
      {
        id: "loto_a2",
        text: "Does any equipment at your facility have multiple energy sources — such as both electrical AND pneumatic, hydraulic, gravitational, mechanical spring tension, or thermal energy — that would need to be isolated and verified before safe servicing?",
        hint: "Multiple energy sources are common in stamping presses, injection molding machines, conveyors, robotic cells, and HVAC systems. Each source must be addressed in a machine-specific LOTO procedure.",
        yesIndicates: "applies",
      },
      {
        id: "loto_a3",
        text: "Does your facility operate machinery with stored energy hazards — such as hydraulic accumulators, pneumatic cylinders, capacitors, compressed springs, suspended parts (gravity), or process chemicals under pressure — that remain hazardous even after electrical power is removed?",
        hint: "Simply turning off a machine or pressing an E-stop does NOT eliminate stored energy. Capacitors can hold charge; cylinders can still actuate; suspended loads can drop.",
        yesIndicates: "applies",
      },
      {
        id: "loto_a4",
        text: "Do employees perform maintenance or servicing tasks that require reaching into or placing any part of their body into the point of operation, danger zone, or area where unexpected movement could cause injury?",
        hint: "Reaching into a guarded area to clear a jam, replacing blades or dies inside a press, or working inside a robotic cell all require LOTO.",
        yesIndicates: "applies",
      },
      {
        id: "loto_a5",
        text: "Is maintenance or equipment servicing performed by outside contractors or specialized service technicians at your facility?",
        hint: "If outside contractors service equipment at your facility, you must coordinate LOTO procedures with them. Your LOTO program must address contractor activities.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your facility is meeting the OSHA Lockout/Tagout requirements under 29 CFR 1910.147.",
    evaluationQuestions: [
      {
        id: "loto_e1",
        text: "Is a written Energy Control Program (Lockout/Tagout Procedure) documented and in place for your facility?",
        hint: "The program must cover the purpose, rules, and techniques for using energy control procedures.",
      },
      {
        id: "loto_e2",
        text: "Are machine-specific lockout/tagout procedures written for each piece of equipment with hazardous energy sources?",
        hint: "Generic procedures are not sufficient — each machine with unique energy characteristics requires its own procedure.",
      },
      {
        id: "loto_e3",
        text: "Is adequate lockout/tagout hardware (locks, hasps, tags, lockout devices) provided and accessible to authorized employees?",
      },
      {
        id: "loto_e4",
        text: "Have all authorized employees (those who perform LOTO) and affected employees (those who work in areas where LOTO is used) received LOTO training?",
        hint: "Training must be documented with dates and employee names.",
      },
      {
        id: "loto_e5",
        text: "Are annual periodic inspections of each energy control procedure being conducted and documented by an authorized employee?",
        hint: "Inspections must certify that the procedure is adequate and that all employees know it.",
      },
    ],
  },

  /* ── Permit-Required Confined Spaces ── */
  {
    key: "confined_space",
    label: "Permit-Required Confined Spaces (PRCS)",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["confined space", "permit-required confined", "prcs"],
    citationPatterns: ["29 cfr 1910.146", "1910.146"],
    applicabilityIntro:
      "OSHA's Permit-Required Confined Spaces standard (29 CFR 1910.146) applies to general industry facilities with spaces that meet all three confined space criteria AND contain at least one permit-required hazard. A confined space is: (1) large enough to enter and perform work, (2) has limited or restricted means of entry/exit, and (3) is not designed for continuous employee occupancy. A PERMIT-REQUIRED confined space adds serious hazards. Note: spaces that can be reclassified as non-permit-required (by eliminating all hazards) are managed differently than those with ineliminable hazards.",
    applicabilityQuestions: [
      {
        id: "cs_a1",
        text: "Does your facility have any physical spaces that an employee could bodily enter to perform work — such as storage tanks, vessels, silos, hoppers, bins, pits, sumps, vaults, manholes, utility tunnels, crawl spaces, ductwork, boilers, or reactor vessels?",
        hint: "The space must be large enough for a worker to enter with their body — not just reach into. Even a small access hatch leading into a tank qualifies if the employee must enter.",
        yesIndicates: "applies",
      },
      {
        id: "cs_a2",
        text: "Do any of these spaces have a limited or restricted means of entry or exit — such as a narrow hatch, manhole, or access port — that would impede a rescue or emergency egress?",
        hint: "A space can have a door that opens inward or a narrow opening that slows escape. 'Limited' means it is not as convenient as a normal room door — not that entry is impossible.",
        yesIndicates: "applies",
      },
      {
        id: "cs_a3",
        text: "Do any of these spaces contain or have the potential to contain a hazardous atmosphere — such as oxygen deficiency (below 19.5% O₂), oxygen enrichment (above 23.5% O₂), flammable gases or vapors above 10% of the LEL, or airborne toxic substances above IDLH or PEL concentrations?",
        hint: "Even a space that normally has no atmospheric hazard may become hazardous if chemical residue, biological material, or displaced oxygen is present. Vessels that held hydrocarbons, solvents, acids, or biological material are common examples.",
        yesIndicates: "applies",
      },
      {
        id: "cs_a4",
        text: "Do any of these spaces contain a material that could engulf an entrant — such as grain, sand, sawdust, coal, pellets, or similar bulk solid or liquid material with flowing or liquefying potential?",
        hint: "Engulfment is the capture and burial of a person by a liquid or finely divided solid material. Grain bins, sand hoppers, and chemical slurry tanks are classic examples.",
        yesIndicates: "applies",
      },
      {
        id: "cs_a5",
        text: "Do any of these spaces have an internal configuration — such as inwardly converging walls, a floor that slopes downward, or internal obstructions — that could trap or asphyxiate an entrant, OR do they contain any other recognized serious safety or health hazard (e.g., energized electrical equipment, unguarded moving machinery, extreme heat)?",
        hint: "This is the catch-all for 'any other serious safety or health hazard.' If you answer YES to questions 3, 4, or 5, the space is permit-required.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate compliance with OSHA's Permit-Required Confined Spaces standard (29 CFR 1910.146).",
    evaluationQuestions: [
      {
        id: "cs_e1",
        text: "Has your facility performed a written evaluation to identify all confined spaces and classify which are permit-required (PRCS)?",
      },
      {
        id: "cs_e2",
        text: "Is a written Permit-Required Confined Space Program in place that covers all required elements?",
      },
      {
        id: "cs_e3",
        text: "Are entry permits completed before every PRCS entry, including atmospheric testing results, required PPE, equipment, and rescue means?",
      },
      {
        id: "cs_e4",
        text: "Have all authorized entrants, attendants, and entry supervisors received PRCS training specific to their roles?",
      },
      {
        id: "cs_e5",
        text: "Are rescue and emergency services identified, equipped, and trained for confined space emergencies?",
        hint: "Non-entry rescue (retrieval systems) must be used when feasible.",
      },
    ],
  },

  /* ── Machine Guarding ── */
  {
    key: "machine_guarding",
    label: "Machine Guarding (General Industry)",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["machine guard", "point of operation", "machinery", "guarding", "1910.212"],
    citationPatterns: ["29 cfr 1910.212", "1910.212", "29 cfr 1910.217", "29 cfr 1910.219"],
    applicabilityIntro:
      "OSHA machine guarding standards (29 CFR 1910.212–.219) apply to all general industry facilities where employees operate, set up, adjust, or maintain machinery with hazardous moving parts. The standard requires that every machine with a point of operation, power transmission device, or any other moving part that presents a hazard must be guarded. There are no employee-count thresholds — even one machine operated by one employee triggers the requirement.",
    applicabilityQuestions: [
      {
        id: "mg_a1",
        text: "Does your facility operate any machinery with rotating shafts, spindles, or pulleys; cutting blades or edges; reciprocating or sliding parts; punching, stamping, or shearing actions; or in-running nip points (two rotating parts coming together) that could contact an employee?",
        hint: "Common examples: lathes, mills, grinders, drill presses, stamping presses, power brakes, slitters, band saws, table saws, conveyors, mixers, fans, and any equipment with belt or chain drives.",
        yesIndicates: "applies",
      },
      {
        id: "mg_a2",
        text: "Do any employees work in close proximity to machinery where they could come into contact with moving parts during normal operation, setup, tooling changes, or troubleshooting?",
        hint: "Guards are required wherever an employee could reach into, under, around, or through a barrier to contact a hazardous moving part during any foreseeable activity — not just normal operation.",
        yesIndicates: "applies",
      },
      {
        id: "mg_a3",
        text: "Does your facility have power transmission components — such as belts, chains, pulleys, gears, flywheels, couplings, cams, or drive shafts — that are not fully enclosed and could be contacted by employees?",
        hint: "Power transmission apparatus must be guarded regardless of speed. A slow-moving chain drive or a belt drive at floor level still requires guarding if an employee could contact it.",
        yesIndicates: "applies",
      },
      {
        id: "mg_a4",
        text: "Are there any machines at your facility where guards have been removed, bypassed, or are missing — even temporarily — to facilitate setup, maintenance, or because production runs faster without them?",
        hint: "Removing or bypassing guards is one of OSHA's most frequently cited machine guarding violations. Temporary removal for any reason still creates a citation-level hazard.",
        yesIndicates: "applies",
      },
      {
        id: "mg_a5",
        text: "Do employees feed stock, parts, or material into machines by hand, or must they reach into or near a danger zone to retrieve finished parts, clear scrap, or adjust the workpiece?",
        hint: "Hand-feeding operations at punch presses, hydraulic presses, shears, and injection molding machines are prime point-of-operation guarding hazards. Presence-sensing devices, two-hand controls, or physical barrier guards are required.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your machine guarding practices meet OSHA requirements under 29 CFR 1910.212.",
    evaluationQuestions: [
      {
        id: "mg_e1",
        text: "Are all points of operation, power transmission devices, and other hazardous machine parts guarded to protect operators and other employees?",
        hint: "Guards must prevent hands, fingers, or other body parts from contacting the danger zone.",
      },
      {
        id: "mg_e2",
        text: "Are guards sturdy, secure, and designed so they cannot be easily removed or bypassed by operators?",
      },
      {
        id: "mg_e3",
        text: "Are employees trained on the proper use of machine guards and prohibited from removing or disabling guards?",
      },
      {
        id: "mg_e4",
        text: "Are machines regularly inspected to ensure guards are present, properly installed, and in good condition?",
      },
    ],
  },

  /* ── PPE Program ── */
  {
    key: "ppe",
    label: "Personal Protective Equipment (PPE) Program",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["ppe", "personal protective equipment", "safety glasses", "hard hat", "gloves", "face shield"],
    citationPatterns: ["29 cfr 1910.132", "1910.132", "1910.133", "1910.135", "1910.136", "1910.138"],
    applicabilityIntro:
      "OSHA's PPE standards (29 CFR 1910.132–.138) apply to any facility where employees face hazards to the eyes, face, head, hands, feet, or body that cannot be fully eliminated through engineering or administrative controls alone. The employer must conduct and certify a written hazard assessment, select appropriate PPE, provide it at no cost (with limited exceptions), and train employees before use. PPE is the last line of defense in the hierarchy of controls — but it is still legally required whenever residual hazards remain.",
    applicabilityQuestions: [
      {
        id: "ppe_a1",
        text: "Are employees exposed to any of the following hazards during their work: flying particles or chips, chemical splashes or mists, intense light or radiation (welding arcs, UV, lasers), electrical arc flash, heat or flames, falling objects, foot crush or puncture hazards, or laceration/abrasion risks?",
        hint: "This covers the primary hazard categories addressed by OSHA's eye/face (1910.133), head (1910.135), foot (1910.136), and hand protection standards. If any of these hazards exist, PPE selection and a written hazard assessment are required.",
        yesIndicates: "applies",
      },
      {
        id: "ppe_a2",
        text: "Do employees work with or near chemicals — including acids, caustics, solvents, or other corrosive or reactive substances — where skin or eye contact is possible during normal handling, spills, or process upsets?",
        hint: "Chemical handling almost always requires chemical-resistant gloves, and often face shields or splash goggles beyond standard safety glasses. Check the PPE section (Section 8) of each SDS for the manufacturer's PPE recommendations.",
        yesIndicates: "applies",
      },
      {
        id: "ppe_a3",
        text: "Does your facility have employees who perform grinding, cutting, welding, chipping, or abrasive operations that generate sparks, metal fragments, or high-velocity projectiles?",
        hint: "These operations typically require at minimum: safety glasses with side shields, and often full-face shields, welding helmets, or impact-rated goggles. Flying particle hazards are one of OSHA's most frequently cited PPE violations.",
        yesIndicates: "applies",
      },
      {
        id: "ppe_a4",
        text: "Are employees required to work in areas where overhead work is performed, or where objects could fall from elevated surfaces, shelving, or equipment — creating a struck-by or head injury risk?",
        hint: "Hard hats are required wherever there is a risk of head injury from falling objects, low overhead obstructions, or electrical hazards. This is common in warehouses, manufacturing floors with overhead cranes, and construction areas.",
        yesIndicates: "applies",
      },
      {
        id: "ppe_a5",
        text: "Has your facility ever formally documented a written PPE hazard assessment (certified in writing per 29 CFR 1910.132(d)(2)) covering all job tasks and work areas — OR has this assessment never been performed?",
        hint: "If the assessment has never been done, this standard almost certainly applies. Answer Yes if you have not conducted one. The assessment is required regardless of what PPE is actually in use.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your PPE program meets OSHA requirements under 29 CFR 1910.132.",
    evaluationQuestions: [
      {
        id: "ppe_e1",
        text: "Has a documented workplace hazard assessment been conducted to determine necessary PPE for each job task?",
        hint: "The assessment must be certified in writing with the job location, date, and person performing it.",
      },
      {
        id: "ppe_e2",
        text: "Is appropriate PPE selected, provided to employees at no cost, and properly maintained?",
        hint: "Employers must provide PPE at no cost to employees, with limited exceptions (safety-toe footwear, prescription safety glasses).",
      },
      {
        id: "ppe_e3",
        text: "Have all employees who are required to use PPE received training on when and what PPE is required, how to properly put on/wear/remove it, and its limitations?",
      },
      {
        id: "ppe_e4",
        text: "Is PPE training documented with employee names, dates, and the subject covered?",
      },
      {
        id: "ppe_e5",
        text: "Is PPE regularly inspected, and defective or damaged PPE removed from service immediately?",
      },
    ],
  },

  /* ── Respiratory Protection ── */
  {
    key: "respiratory",
    label: "Respiratory Protection Program",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["respiratory", "respirator", "n95", "scba", "air purifying", "supplied air"],
    citationPatterns: ["29 cfr 1910.134", "1910.134"],
    applicabilityIntro:
      "OSHA's Respiratory Protection standard (29 CFR 1910.134) applies when respirators are REQUIRED, or when employees voluntarily use respirators OTHER than simple filtering facepieces. Important: merely distributing or allowing voluntary use of disposable N95 dust masks does NOT trigger the full program — only OSHA Appendix D applies in that case. The standard is triggered by required use, hazardous airborne exposures above PELs, or voluntary use of any respirator beyond a simple filtering facepiece.",
    applicabilityQuestions: [
      {
        id: "resp_a1",
        text: "Are any employees exposed to airborne hazards — such as chemical vapors, welding fumes, silica dust, isocyanates, spray paint overspray, lead, asbestos, or other substances with inhalation hazard potential — as part of their regular work tasks?",
        hint: "Review Safety Data Sheets (SDS) for any chemicals used. Section 8 of the SDS will indicate if respiratory protection is recommended or required.",
        yesIndicates: "applies",
      },
      {
        id: "resp_a2",
        text: "Does your facility formally REQUIRE employees to wear respirators (half-face, full-face, N95, PAPR, airline, or SCBA) as a condition of performing any job task or entering any area?",
        hint: "This means it is a written or enforced policy requirement — not merely a recommendation. If yes, the full 1910.134 program applies regardless of contaminant level.",
        yesIndicates: "applies",
      },
      {
        id: "resp_a3",
        text: "Do any employees voluntarily use a respirator that is MORE than a simple disposable filtering facepiece — such as a half-face respirator, full-face respirator, powered air-purifying respirator (PAPR), supplied-air respirator, or SCBA?",
        hint: "Voluntary use of N95/P100 disposable dust masks (filtering facepieces) alone does NOT trigger the full program — only OSHA Appendix D must be provided. However, voluntary use of any cartridge-based or supplied-air respirator DOES require the full written program, medical evaluation, and fit testing.",
        yesIndicates: "applies",
      },
      {
        id: "resp_a4",
        text: "Have industrial hygiene air sampling results, OSHA PEL tables, or SDS review identified that any airborne contaminant at your facility has the potential to exceed its OSHA Permissible Exposure Limit (PEL) or ACGIH Threshold Limit Value (TLV)?",
        hint: "If you have never conducted air monitoring and have chemical processes, painting, welding, grinding, or solvent use, you likely cannot confirm exposures are below PELs.",
        yesIndicates: "applies",
      },
      {
        id: "resp_a5",
        text: "Do any employees enter or work in areas with potential oxygen deficiency (below 19.5% O₂), such as tanks, storage vessels, utility vaults, or spaces where CO₂ or inert gases may accumulate?",
        hint: "Oxygen-deficient atmospheres require atmosphere-supplying respirators (SCBA or airline), which always trigger the full 1910.134 program.",
        yesIndicates: "applies",
      },
      {
        id: "resp_a6",
        text: "Does your facility conduct any of the following operations: spray painting or coating, thermal spraying, abrasive blasting, welding or cutting on coated or galvanized metals, mixing or dispensing concentrated chemicals, or working with materials containing silica, lead, or asbestos?",
        hint: "These operations are among the most common triggers for a required respiratory protection program due to the airborne hazards they generate.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your respiratory protection program meets OSHA requirements under 29 CFR 1910.134.",
    evaluationQuestions: [
      {
        id: "resp_e1",
        text: "Is a written Respiratory Protection Program in place, updated as needed, and administered by a trained program administrator?",
      },
      {
        id: "resp_e2",
        text: "Have employees who use required respirators received medical evaluations to determine their ability to use them?",
        hint: "Medical evaluations must be completed before fit testing and use, using OSHA-required questionnaire or equivalent.",
      },
      {
        id: "resp_e3",
        text: "Have employees who use tight-fitting respirators been fit-tested with the specific respirator model they will use?",
        hint: "Fit testing is required annually and when a different respirator model is used.",
      },
      {
        id: "resp_e4",
        text: "Have all respirator users received training on the proper use, care, and limitations of their specific respirator?",
      },
      {
        id: "resp_e5",
        text: "Are respirators properly cleaned, disinfected, maintained, and stored when not in use?",
      },
    ],
  },

  /* ── Hearing Conservation ── */
  {
    key: "hearing_conservation",
    label: "Hearing Conservation Program",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["hearing conservation", "noise", "audiometric", "85 dba", "hearing loss"],
    citationPatterns: ["29 cfr 1910.95", "1910.95"],
    applicabilityIntro:
      "OSHA's Hearing Conservation standard (29 CFR 1910.95) applies whenever employee noise exposures equal or exceed an 8-hour time-weighted average (TWA) of 85 dBA — the action level. The permissible exposure limit (PEL) is 90 dBA TWA. At the action level, a full Hearing Conservation Program (monitoring, audiometric testing, hearing protection, training) is required. At or above the PEL, engineering controls must be implemented. Many manufacturing, construction, and material processing operations routinely exceed these thresholds.",
    applicabilityQuestions: [
      {
        id: "hc_a1",
        text: "Does your facility operate any of the following equipment or processes: stamping presses, punch presses, power brakes, grinders, routers, saws, air-powered tools, compressors, fans or blowers, diesel engines, conveyors with metal-on-metal contact, impact wrenches, or similar machinery that produces significant noise?",
        hint: "As a reference point: a busy restaurant is ~70 dBA, a lawnmower is ~90 dBA, a stamping press can exceed 100 dBA. At 90 dBA employees can shout to communicate at 1 meter — this is a practical field indicator.",
        yesIndicates: "applies",
      },
      {
        id: "hc_a2",
        text: "Must employees raise their voice significantly to communicate with someone standing 1 meter (arm's length) away in any work area at your facility?",
        hint: "This is OSHA's practical field test for potential noise overexposure. If shouting is required to be understood at arm's length, noise levels are likely at or above 85 dBA — the action level.",
        yesIndicates: "applies",
      },
      {
        id: "hc_a3",
        text: "Have any employees reported temporary hearing loss, ringing in their ears (tinnitus), or muffled hearing at the end of a work shift?",
        hint: "Temporary threshold shift (TTS) — ringing or muffled hearing after a shift — is a strong indicator of overexposure. Even occasional reports warrant a noise survey.",
        yesIndicates: "applies",
      },
      {
        id: "hc_a4",
        text: "Do employees work shifts of 8 hours or more in areas where noise-generating equipment operates continuously or for extended periods?",
        hint: "The OSHA action level (85 dBA) is based on an 8-hour TWA. Shorter exposures to higher noise levels can produce the same dose — for example, 2 hours at 94 dBA equals the same dose as 8 hours at 85 dBA using OSHA's 5 dB exchange rate.",
        yesIndicates: "applies",
      },
      {
        id: "hc_a5",
        text: "Has your facility ever conducted a noise survey or dosimetry study that measured any employee's 8-hour TWA at or above 85 dBA, OR has formal noise monitoring NEVER been conducted in your facility?",
        hint: "If monitoring has never been done and you have industrial equipment, you cannot confirm compliance. Presumed overexposure requires the same protections as confirmed overexposure. Answer Yes if you are unsure.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your facility is meeting OSHA's Hearing Conservation requirements under 29 CFR 1910.95.",
    evaluationQuestions: [
      {
        id: "hc_e1",
        text: "Has noise monitoring been conducted to identify employees exposed at or above the 85 dBA action level?",
        hint: "Monitoring must be repeated whenever changes occur that may increase exposures.",
      },
      {
        id: "hc_e2",
        text: "Have all employees exposed at or above 85 dBA been enrolled in a hearing conservation program and notified of their exposure?",
      },
      {
        id: "hc_e3",
        text: "Is a baseline audiogram on file for all at-risk employees, and are annual audiograms being conducted?",
      },
      {
        id: "hc_e4",
        text: "Is appropriate hearing protection (earplugs, earmuffs) provided at no cost to exposed employees, with a variety to choose from?",
      },
      {
        id: "hc_e5",
        text: "Have employees received annual hearing conservation training covering noise hazards, hearing protection use, and audiometric testing?",
      },
    ],
  },

  /* ── OSHA Recordkeeping ── */
  {
    key: "osha_recordkeeping",
    label: "OSHA Injury & Illness Recordkeeping",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["osha 300", "osha 301", "osha 300a", "recordkeeping", "injury illness recording", "work-related injury"],
    citationPatterns: ["29 cfr 1904", "1904", "osha recordkeeping"],
    applicabilityIntro:
      "OSHA's Recordkeeping rule (29 CFR 1904) requires employers with 10 or more employees in covered industries to record work-related injuries and illnesses on OSHA forms 300, 300A, and 301. Important: ALL employers — regardless of size or industry — must report to OSHA any work-related fatality within 8 hours and any in-patient hospitalization, amputation, or loss of an eye within 24 hours. Partially exempt industries (low-hazard retail, finance, insurance, real estate, and certain services) are listed in Appendix A to Subpart B of 1904.",
    applicabilityQuestions: [
      {
        id: "rk_a1",
        text: "Does your establishment have 10 or more employees at any point during the year?",
        hint: "Count all employees — full-time, part-time, temporary, and seasonal. If you ever have 10 or more at the same time, the recordkeeping rule applies (assuming you are in a covered industry). Establishments with fewer than 10 employees are exempt from routine recordkeeping but must still report severe injuries and fatalities.",
        yesIndicates: "applies",
      },
      {
        id: "rk_a2",
        text: "Is your facility's primary industry classification a manufacturing, construction, agriculture, utilities, transportation, warehousing, or similar higher-hazard industry (NAICS codes not listed in OSHA's partially-exempt industry table)?",
        hint: "Most manufacturing (NAICS 31-33), construction (23), agriculture (11), mining (21), utilities (22), transportation and warehousing (48-49), and healthcare and social assistance (62) are covered. Certain retail, finance, real estate, and professional services are partially exempt. Look up your NAICS code in OSHA's 1904 Appendix A to confirm.",
        yesIndicates: "applies",
      },
      {
        id: "rk_a3",
        text: "Has any employee suffered a work-related injury or illness in the past year that resulted in: days away from work, restricted duty or job transfer, medical treatment beyond first aid, loss of consciousness, diagnosis of a significant injury by a healthcare professional, or a positive occupational illness diagnosis?",
        hint: "Any of these outcomes creates a 'recordable' case that must be entered on the OSHA 300 Log and documented on an OSHA 301 Incident Report within 7 calendar days of learning of the case.",
        yesIndicates: "applies",
      },
      {
        id: "rk_a4",
        text: "Has your facility ever experienced a work-related fatality, in-patient hospitalization, amputation, or loss of an eye — regardless of facility size or industry?",
        hint: "These are 'severe injury' reportable events that must be reported directly to OSHA within 8 hours (fatality) or 24 hours (hospitalization, amputation, loss of eye). This reporting requirement applies to ALL employers — even those with fewer than 10 employees and those in partially-exempt industries.",
        yesIndicates: "applies",
      },
      {
        id: "rk_a5",
        text: "Is your facility subject to OSHA's electronic recordkeeping reporting requirements — either as an establishment with 250+ employees, OR as an establishment with 20–249 employees in a designated high-hazard industry?",
        hint: "Establishments with 250+ employees must submit OSHA 300 Log, 300A Summary, and 301 forms electronically via OSHA's Injury Tracking Application (ITA). Establishments with 20–249 employees in specified high-hazard industries must submit the 300A Summary electronically. Check OSHA's ITA portal for submission deadlines (typically March 2 of the following year).",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your facility is meeting OSHA's injury and illness recordkeeping requirements under 29 CFR 1904.",
    evaluationQuestions: [
      {
        id: "rk_e1",
        text: "Is an OSHA 300 Log being maintained to record all work-related injuries and illnesses within 7 calendar days of learning of the case?",
      },
      {
        id: "rk_e2",
        text: "Is an OSHA 301 Incident Report (or equivalent) completed for each recordable case?",
      },
      {
        id: "rk_e3",
        text: "Is the OSHA 300A Annual Summary posted in a visible location from February 1 to April 30 each year, signed by a company executive?",
      },
      {
        id: "rk_e4",
        text: "Are all records retained for at least 5 years and made available to employees, former employees, and OSHA upon request?",
      },
      {
        id: "rk_e5",
        text: "Are severe injuries (in-patient hospitalization, amputation, or loss of an eye) reported to OSHA within 24 hours, and work-related fatalities within 8 hours?",
      },
    ],
  },

  /* ── Emergency Action Plan ── */
  {
    key: "eap",
    label: "Emergency Action Plan (EAP)",
    categoryMatch: ["Health and Safety Requirements", "Emergency Planning"],
    namePatterns: ["emergency action plan", "eap", "evacuation plan", "fire drill", "emergency evacuation"],
    citationPatterns: ["29 cfr 1910.38", "1910.38", "1910.39"],
    applicabilityIntro:
      "OSHA's Emergency Action Plan standard (29 CFR 1910.38) applies to virtually every employer — any workplace where employees must evacuate or take emergency action. Facilities with 10 or more employees must have a written EAP. Facilities with fewer than 10 employees may communicate the plan orally. Several other OSHA standards (fire suppression, HAZWOPER, process safety management) also require EAP elements. The EAP must be tailored to the specific emergencies that could affect your facility — not just fire.",
    applicabilityQuestions: [
      {
        id: "eap_a1",
        text: "Does your facility have any employees who would be required to evacuate or take emergency protective action in the event of a fire, explosion, chemical spill or release, natural gas leak, severe weather event (tornado, flood), active threat, or power outage affecting life safety systems?",
        hint: "This covers virtually every occupied workplace. The question is not whether emergencies are likely — it is whether employees need to know what to do if one occurs.",
        yesIndicates: "applies",
      },
      {
        id: "eap_a2",
        text: "Does your facility store, use, or generate hazardous chemicals — including flammable liquids, compressed gases, corrosives, or toxic materials — that could create an emergency requiring evacuation or shelter-in-place?",
        hint: "Facilities with hazardous chemicals face a broader range of emergency scenarios than fires alone: chemical spills, vapor cloud releases, and reactive chemical incidents all require specific emergency response procedures beyond a standard fire evacuation.",
        yesIndicates: "applies",
      },
      {
        id: "eap_a3",
        text: "Does your facility have multiple buildings, work shifts, or work areas where employees may be isolated from main exits or unaware of alarm signals — requiring specific evacuation routes, muster points, or employee accountability procedures?",
        hint: "Facilities with shift workers, remote areas (tank farms, outlying buildings), or high ambient noise levels require more robust EAP communication systems and designated muster points with accountability procedures.",
        yesIndicates: "applies",
      },
      {
        id: "eap_a4",
        text: "Are there employees at your facility who would need special assistance to evacuate in an emergency — such as employees with mobility limitations, visitors unfamiliar with the layout, or contractors working in remote areas of the plant?",
        hint: "OSHA's EAP standard requires procedures to assist employees who cannot evacuate unassisted. ADA compliance and emergency egress planning must account for all individuals who may be on-site.",
        yesIndicates: "applies",
      },
      {
        id: "eap_a5",
        text: "Does your facility have employees who are designated to perform critical shutdown operations, emergency response duties (fire brigade, spill response), or who must remain at their post during an evacuation to protect life or prevent escalation?",
        hint: "The EAP must address employees with special emergency duties — they cannot simply evacuate with everyone else. Procedures for their roles, communication with emergency services, and their own safe egress must be documented.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your Emergency Action Plan meets OSHA requirements under 29 CFR 1910.38.",
    evaluationQuestions: [
      {
        id: "eap_e1",
        text: "Is a written Emergency Action Plan in place covering procedures for emergency evacuation, including types of evacuations and exit route assignments?",
        hint: "Written plans are required for facilities with 10+ employees.",
      },
      {
        id: "eap_e2",
        text: "Does the EAP include procedures for employees who remain to perform critical operations, account for all employees after evacuation, and contact emergency services?",
      },
      {
        id: "eap_e3",
        text: "Are emergency escape routes posted and exit signs in place throughout the facility?",
      },
      {
        id: "eap_e4",
        text: "Have all employees received EAP training upon hire and whenever the plan changes?",
        hint: "Employee alarm signals and evacuation procedures must be explained to each employee.",
      },
      {
        id: "eap_e5",
        text: "Are emergency drills conducted regularly to familiarize employees with evacuation procedures and routes?",
      },
    ],
  },

  /* ── Bloodborne Pathogens ── */
  {
    key: "bbp",
    label: "Bloodborne Pathogens (BBP)",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["bloodborne", "bbp", "hiv", "hepatitis", "first aid", "1910.1030"],
    citationPatterns: ["29 cfr 1910.1030", "1910.1030"],
    applicabilityIntro:
      "OSHA's Bloodborne Pathogens standard (29 CFR 1910.1030) applies to all employers whose employees have 'occupational exposure' — meaning reasonably anticipated skin, eye, mucous membrane, or parenteral contact with blood or other potentially infectious materials (OPIM) as part of their job duties. OPIM includes: semen, vaginal secretions, cerebrospinal fluid, synovial fluid, pleural fluid, pericardial fluid, peritoneal fluid, amniotic fluid, saliva in dental procedures, any body fluid visibly contaminated with blood, and any unfixed human tissue. Good Samaritan acts or incidental contact are NOT covered — the exposure must be part of the employee's defined job duties.",
    applicabilityQuestions: [
      {
        id: "bbp_a1",
        text: "Does your facility have a designated first aid team, emergency responders, or employees who are specifically trained and assigned to render first aid or CPR as part of their job duties?",
        hint: "Employees who volunteer first aid incidentally (Good Samaritans) are NOT covered. However, employees designated by the employer to render first aid as part of their job duties ARE covered — even if they work on the production floor, not in a medical setting.",
        yesIndicates: "applies",
      },
      {
        id: "bbp_a2",
        text: "Does your facility employ nurses, medical assistants, occupational health personnel, phlebotomists, laboratory technicians, or any other healthcare workers who handle blood specimens, needles, sharps, or patient samples?",
        hint: "On-site occupational health clinics, employer-sponsored medical surveillance programs, and any activities involving blood draws, urinalysis, or medical specimen collection are clearly covered by 1910.1030.",
        yesIndicates: "applies",
      },
      {
        id: "bbp_a3",
        text: "Do any employees at your facility handle laundry, waste, or contaminated items that could contain blood or body fluids — such as contaminated workwear, used bandaging material, sharps, or biohazardous waste containers?",
        hint: "Employees who launder potentially contaminated clothing, empty first aid kit waste, or handle biohazardous waste bags may have occupational exposure even if they never directly render first aid.",
        yesIndicates: "applies",
      },
      {
        id: "bbp_a4",
        text: "Has your facility experienced any incident where an employee was exposed to blood or OPIM — such as a needlestick, splash to the eyes or mouth, or contact with an open wound — whether or not it resulted in a recordable injury?",
        hint: "Past incidents are a strong indicator that occupational exposure is 'reasonably anticipated.' Even a single prior incident suggests the standard should be applied and an Exposure Control Plan developed.",
        yesIndicates: "applies",
      },
      {
        id: "bbp_a5",
        text: "Does your facility's work involve human tissue, cell cultures, organ cultures, or HIV/HBV-containing culture media, blood, or organs — such as in research, quality testing, or laboratory activities?",
        hint: "Research labs, biological testing facilities, and certain industrial hygiene labs that handle human biological material are covered regardless of whether clinical care is provided.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate compliance with OSHA's Bloodborne Pathogens standard (29 CFR 1910.1030).",
    evaluationQuestions: [
      {
        id: "bbp_e1",
        text: "Is a written Exposure Control Plan in place, reviewed and updated at least annually and when tasks or procedures change?",
      },
      {
        id: "bbp_e2",
        text: "Are engineering controls (sharps containers, self-sheathing needles) and work practice controls implemented to minimize exposure?",
      },
      {
        id: "bbp_e3",
        text: "Is appropriate PPE (gloves, face shields, gowns) provided at no cost to employees with occupational exposure?",
      },
      {
        id: "bbp_e4",
        text: "Have all employees with occupational exposure received annual BBP training?",
      },
      {
        id: "bbp_e5",
        text: "Is hepatitis B vaccination offered to all employees with occupational exposure at no cost within 10 working days of assignment?",
      },
    ],
  },

  /* ── Powered Industrial Trucks (Forklifts) ── */
  {
    key: "pit",
    label: "Powered Industrial Trucks — Forklift Safety",
    categoryMatch: ["Health and Safety Requirements"],
    namePatterns: ["forklift", "powered industrial truck", "pit", "lift truck", "pallet jack", "1910.178"],
    citationPatterns: ["29 cfr 1910.178", "1910.178"],
    applicabilityIntro:
      "OSHA's Powered Industrial Trucks standard (29 CFR 1910.178) applies to any facility where powered industrial trucks (PITs) are operated, including counterbalanced forklifts, sit-down and stand-up riders, reach trucks, order pickers, turret trucks, motorized pallet jacks (rider type), rough terrain forklifts, and industrial tow tractors. Walk-behind hand pallet jacks that are manually propelled are generally NOT covered. The standard requires operator training and certification, pre-shift inspections, and specific traffic management and maintenance practices.",
    applicabilityQuestions: [
      {
        id: "pit_a1",
        text: "Does your facility use any rider-operated powered industrial trucks — such as counterbalanced forklifts, reach trucks, order pickers, turret trucks, rider pallet jacks, or rough-terrain forklifts — to lift, move, or stack materials?",
        hint: "Manually propelled walk-behind pallet jacks are generally NOT covered by 1910.178. Rider-operated motorized pallet jacks (where the operator rides on the truck) ARE covered. If any employee drives a powered truck as part of their work, the standard applies.",
        yesIndicates: "applies",
      },
      {
        id: "pit_a2",
        text: "Does your facility have pedestrian traffic sharing aisles, doorways, or work areas with powered industrial truck travel paths — creating a potential struck-by hazard?",
        hint: "Pedestrian-forklift interactions are one of the most serious hazards in warehousing and manufacturing. Even if only one forklift is used occasionally, the presence of pedestrian traffic in travel areas is a key applicability indicator and requires traffic management controls in your PIT program.",
        yesIndicates: "applies",
      },
      {
        id: "pit_a3",
        text: "Are powered industrial trucks used in areas with special hazards — such as near flammable liquids or vapors, combustible dust, or outdoor uneven terrain — that affect the type of truck that may safely be used?",
        hint: "OSHA's 1910.178 requires that the type of PIT selected be appropriate for the hazardous atmosphere designation of the area. Using a non-explosion-proof truck in a classified flammable area can create a fire or explosion hazard.",
        yesIndicates: "applies",
      },
      {
        id: "pit_a4",
        text: "Are there employees at your facility who operate powered industrial trucks without having completed a formal OSHA-compliant operator training and evaluation — or whose last evaluation was more than 3 years ago?",
        hint: "OSHA requires initial training before or shortly after assignment, followed by an evaluation of competency. Re-evaluation is required at least every 3 years, or sooner if the operator is observed operating unsafely, is involved in an incident, or is assigned to a different type of truck.",
        yesIndicates: "applies",
      },
      {
        id: "pit_a5",
        text: "Are powered industrial trucks at your facility operated by more than one shift of employees, by temporary workers, staffing agency workers, or by employees who also operate the trucks at other company locations?",
        hint: "Multi-shift operations require pre-shift inspections at the start of each shift. Temporary and staffing agency workers must be trained and evaluated before operating a PIT — the host employer cannot assume the staffing agency has done this training.",
        yesIndicates: "applies",
      },
    ],
    evaluationIntro:
      "These questions evaluate whether your facility meets OSHA's Powered Industrial Trucks requirements under 29 CFR 1910.178.",
    evaluationQuestions: [
      {
        id: "pit_e1",
        text: "Have all forklift operators been evaluated and formally certified as competent to operate each type of truck they use?",
        hint: "Certification requires training on truck-specific topics, workplace topics, and a practical evaluation.",
      },
      {
        id: "pit_e2",
        text: "Is operator re-evaluation conducted at least every 3 years or when an operator is observed operating unsafely?",
      },
      {
        id: "pit_e3",
        text: "Are pre-shift inspections of powered industrial trucks conducted and documented before each shift?",
      },
      {
        id: "pit_e4",
        text: "Are trucks that are unsafe to operate removed from service until repaired, and are defects documented and corrected promptly?",
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
