/**
 * Production demo seed — creates CCI Chemical demo data if the DB is empty.
 * Called once on server startup. Idempotent: exits immediately if data exists.
 */
import { db } from "./db";
import { isoProjects, users, nonconformances } from "@shared/schema";
import { eq, count, sql } from "drizzle-orm";

// ─── CCI Chemical ISO 45001 Hazard Analysis seed data ─────────────────────────
// Scoring: P × G × M  P=1/3/7/10  G=1/3/7/10  M=1/2/3/4
// Risk Levels: Low≤30 / Medium≤100 / High≤280 / Critical>280
const CCI_HAZARDS: Array<{
  workArea: string; activityTask: string; hazardDescription: string;
  hazardType: string; operatingCondition: string; whoAffected: string[];
  consequenceDescription: string; existingControls: string;
  probability: number; gravity: number; magnitude: number;
  controlHierarchy: string[]; plannedControls: string;
  residualProbability: number; residualGravity: number; residualMagnitude: number;
  actionRequired: string | null; responsiblePerson: string;
  targetDate: string | null; status: string;
  legalRequirement: string; iso45001Clause: string; notes: string | null;
}> = [
  // P=1/3/7/10  G=1/3/7/10  M=1/2/3/4  Score=P×G×M
  {
    workArea: "Chemical Blending",
    activityTask: "Batch blending — glycol ether addition",
    hazardDescription: "Skin / vapor exposure to glycol ethers (EGBE, EGME) during open-drum handling and blending",
    hazardType: "chemical", operatingCondition: "routine",
    whoAffected: ["employees", "contractors"],
    consequenceDescription: "Dermatitis, eye irritation, respiratory irritation; EGBE is a reproductive hazard at sustained high exposure",
    existingControls: "SDS training (HazCom 2012), nitrile gloves, safety glasses, local exhaust ventilation at blend stations",
    probability: 7, gravity: 7, magnitude: 2,  // Score 98 — Medium
    controlHierarchy: ["engineering", "administrative", "ppe"],
    plannedControls: "Install enclosed drum-transfer pump system to minimize open handling; upgrade LEV to ASHRAE capture-velocity spec",
    residualProbability: 3, residualGravity: 3, residualMagnitude: 2,  // Score 18 — Low
    actionRequired: null, responsiblePerson: "EHS Coordinator",
    targetDate: null, status: "closed",
    legalRequirement: "OSHA 29 CFR 1910.1000 (PELs); OSHA HazCom 2012 (29 CFR 1910.1200)",
    iso45001Clause: "6.1.2", notes: null,
  },
  {
    workArea: "Chemical Blending",
    activityTask: "Solvent transfer — MEK & isopropanol handling",
    hazardDescription: "Flammable vapor accumulation during solvent transfer from bulk containers to blend vessels",
    hazardType: "fire", operatingCondition: "routine",
    whoAffected: ["employees", "contractors"],
    consequenceDescription: "Flash fire or explosion causing severe burns, structural damage, or fatality",
    existingControls: "Bonding/grounding cables on all containers, explosion-proof electrical in blending area, ABC extinguishers, no-ignition-source policy",
    probability: 3, gravity: 10, magnitude: 2,  // Score 60 — Medium
    controlHierarchy: ["engineering", "administrative", "ppe"],
    plannedControls: "Install continuous LEL monitoring with audible/visual alarm; annual fire suppression system inspection",
    residualProbability: 1, residualGravity: 10, residualMagnitude: 2,  // Score 20 — Low
    actionRequired: null, responsiblePerson: "Production Supervisor",
    targetDate: null, status: "closed",
    legalRequirement: "OSHA 29 CFR 1910.119 (PSM); NFPA 30 (Flammable Liquids Code); OSHA 29 CFR 1910.106",
    iso45001Clause: "6.1.2", notes: "LEL monitor purchase approved in FY2026 CapEx. Installation Q2 2026.",
  },
  {
    workArea: "Warehouse & Shipping",
    activityTask: "Forklift operation in shared pedestrian/vehicle areas",
    hazardDescription: "Struck-by or run-over incident — forklift operating in proximity to pedestrian workers",
    hazardType: "physical", operatingCondition: "routine",
    whoAffected: ["employees", "contractors", "visitors"],
    consequenceDescription: "Crush injuries, fractures, traumatic brain injury, or fatality",
    existingControls: "Forklift certification training, horn use in blind spots, 5 mph speed limit, yellow floor striping",
    probability: 7, gravity: 10, magnitude: 3,  // Score 210 — High
    controlHierarchy: ["engineering", "administrative"],
    plannedControls: "Install physical barriers (Armco barriers or floor-mounted bollards) separating pedestrian walkways from forklift aisles; proximity warning system on forklifts",
    residualProbability: 3, residualGravity: 7, residualMagnitude: 2,  // Score 42 — Medium
    actionRequired: "Install physical pedestrian separation barriers in Warehouse Bays 1–3 and Shipping dock area",
    responsiblePerson: "Warehouse Supervisor",
    targetDate: "2026-09-30", status: "in-progress",
    legalRequirement: "OSHA 29 CFR 1910.178 (Powered Industrial Trucks)",
    iso45001Clause: "8.1.2", notes: "3 near-miss events recorded in 2024. Priority corrective action.",
  },
  {
    workArea: "Filling & Packaging",
    activityTask: "Manual drum and container handling on fill line",
    hazardDescription: "Repetitive heavy lifting and awkward postures during manual drum handling (55-gal drums up to 475 lbs when full)",
    hazardType: "ergonomic", operatingCondition: "routine",
    whoAffected: ["employees"],
    consequenceDescription: "Musculoskeletal disorders: lower back strain, rotator cuff injury, herniated disc — leading cause of lost-time injuries",
    existingControls: "Team-lift policy for loads >50 lbs, pre-shift stretching program, back-support belts available",
    probability: 10, gravity: 7, magnitude: 3,  // Score 210 — High
    controlHierarchy: ["substitution", "engineering", "administrative"],
    plannedControls: "Procure drum tilters and drum-handling dollies for fill line; redesign workstation to reduce reach distance",
    residualProbability: 3, residualGravity: 3, residualMagnitude: 2,  // Score 18 — Low
    actionRequired: "Evaluate and purchase mechanical drum handling equipment for Fill Lines 1 and 2",
    responsiblePerson: "Production Supervisor",
    targetDate: "2026-07-31", status: "in-progress",
    legalRequirement: "OSHA General Duty Clause 5(a)(1); OSHA Ergonomics Guidelines for Material Handling",
    iso45001Clause: "6.1.2", notes: "5 OSHA recordable MSD cases in 2023–2024 linked to fill-line handling.",
  },
  {
    workArea: "Analytical Laboratory",
    activityTask: "pH and titration analysis — acid/base reagent use",
    hazardDescription: "Chemical splash during preparation and use of strong acid (HCl, H₂SO₄) and base (NaOH) reagents",
    hazardType: "chemical", operatingCondition: "routine",
    whoAffected: ["employees"],
    consequenceDescription: "Chemical burns to eyes, face, and skin; risk of permanent eye injury or blindness",
    existingControls: "Fume hood for all acid/base work, safety glasses, nitrile gloves, emergency eyewash within 10 seconds (ANSI Z358.1)",
    probability: 7, gravity: 7, magnitude: 2,  // Score 98 — Medium
    controlHierarchy: ["engineering", "administrative", "ppe"],
    plannedControls: "Require face shield (not just safety glasses) for all concentrated acid/base work; annual eyewash station inspection log",
    residualProbability: 1, residualGravity: 3, residualMagnitude: 2,  // Score 6 — Low
    actionRequired: null, responsiblePerson: "QC Lab Manager",
    targetDate: null, status: "closed",
    legalRequirement: "OSHA 29 CFR 1910.133 (Eye/Face Protection); OSHA 29 CFR 1910.151 (Medical Services/First Aid)",
    iso45001Clause: "6.1.2", notes: null,
  },
  {
    workArea: "Chemical Blending",
    activityTask: "Cleaning and maintenance of batch mixing vessels",
    hazardDescription: "Entanglement or crush injury from unguarded agitator/mixer blades during vessel cleaning or inspection",
    hazardType: "mechanical", operatingCondition: "non-routine",
    whoAffected: ["employees"],
    consequenceDescription: "Amputation, crush injury, or fatality if lockout/tagout procedure not followed",
    existingControls: "Written LOTO procedure (SOP-MNT-001), annual LOTO training, energy-isolation locks assigned per operator",
    probability: 3, gravity: 10, magnitude: 2,  // Score 60 — Medium
    controlHierarchy: ["elimination", "engineering", "administrative"],
    plannedControls: "Install zero-energy-state verification step in electronic CMMS work order; add LOTO audit to monthly EHS inspection checklist",
    residualProbability: 1, residualGravity: 10, residualMagnitude: 1,  // Score 10 — Low
    actionRequired: null, responsiblePerson: "Maintenance Supervisor",
    targetDate: null, status: "closed",
    legalRequirement: "OSHA 29 CFR 1910.147 (Control of Hazardous Energy — LOTO); OSHA 29 CFR 1910.212 (Machine Guarding)",
    iso45001Clause: "8.1.2", notes: "LOTO verified during last internal audit — no deficiencies.",
  },
  {
    workArea: "Maintenance",
    activityTask: "Electrical repairs and panel work on filling equipment",
    hazardDescription: "Electrical shock or arc flash during repair or inspection of 480V filling line electrical panels",
    hazardType: "electrical", operatingCondition: "non-routine",
    whoAffected: ["employees", "contractors"],
    consequenceDescription: "Electrocution, cardiac arrest, severe arc flash burns (up to 40 cal/cm² incident energy)",
    existingControls: "Qualified electrician requirement, LOTO prior to panel entry, arc flash labels on all 480V equipment, FR arc-rated PPE available",
    probability: 3, gravity: 10, magnitude: 3,  // Score 90 — Medium
    controlHierarchy: ["engineering", "administrative", "ppe"],
    plannedControls: "Complete arc flash hazard analysis (NFPA 70E) for all 480V panels; add PPE category label to each panel door",
    residualProbability: 1, residualGravity: 7, residualMagnitude: 2,  // Score 14 — Low
    actionRequired: "Commission arc flash study for filling line electrical distribution panels",
    responsiblePerson: "Maintenance Supervisor",
    targetDate: "2026-12-31", status: "open",
    legalRequirement: "OSHA 29 CFR 1910.147; OSHA 29 CFR 1910.269; NFPA 70E (2021)",
    iso45001Clause: "6.1.2", notes: "Electrical contractor to perform arc flash study. Budgeted in FY2027 plan.",
  },
  {
    workArea: "All Areas",
    activityTask: "Emergency response to chemical spill (bulk glycol or solvent)",
    hazardDescription: "Uncontrolled release of bulk chemical during transfer failure, container breach, or vehicle collision at dock",
    hazardType: "environmental", operatingCondition: "emergency",
    whoAffected: ["employees", "contractors", "public"],
    consequenceDescription: "Acute chemical exposure to responders; environmental contamination of storm drain or POTW; OSHA/EPA regulatory violation",
    existingControls: "SPCC Plan current (rev. 2024), spill kits at each blending station and dock, 8-hour HAZWOPER first-responder awareness training for all plant employees",
    probability: 3, gravity: 7, magnitude: 3,  // Score 63 — Medium
    controlHierarchy: ["administrative", "ppe"],
    plannedControls: "Conduct annual tabletop emergency response drill; update Emergency Response Plan with Ohio SERC notification contacts",
    residualProbability: 1, residualGravity: 3, residualMagnitude: 3,  // Score 9 — Low
    actionRequired: "Schedule Q3 2026 full-scale spill response drill; update ERP contact list",
    responsiblePerson: "EHS Coordinator",
    targetDate: "2026-09-15", status: "open",
    legalRequirement: "OSHA 29 CFR 1910.120 (HAZWOPER); Ohio EPA SPCC regulations; EPCRA 302–304 (SARA Title III)",
    iso45001Clause: "8.1.3", notes: "Ohio LEPC notified annually. Last drill conducted March 2024.",
  },
  {
    workArea: "Office / Administration",
    activityTask: "Shift work, production planning, and customer order management",
    hazardDescription: "Work-related stress and psychosocial hazards from extended shifts, production pressures, and OEM deadline demands",
    hazardType: "psychosocial", operatingCondition: "routine",
    whoAffected: ["employees"],
    consequenceDescription: "Mental health disorders, burnout, fatigue-related errors, increased absenteeism and turnover",
    existingControls: "EAP (Employee Assistance Program) available at no cost, open-door policy, annual performance reviews",
    probability: 10, gravity: 3, magnitude: 3,  // Score 90 — Medium
    controlHierarchy: ["administrative"],
    plannedControls: "Implement annual employee wellbeing survey; review shift-rotation policy to limit consecutive night shifts; mental health awareness training for supervisors",
    residualProbability: 7, residualGravity: 3, residualMagnitude: 3,  // Score 63 — Medium
    actionRequired: "Launch wellbeing survey by Q2 2026; deliver supervisor mental health training",
    responsiblePerson: "HR Manager",
    targetDate: "2026-06-30", status: "open",
    legalRequirement: "OSHA General Duty Clause 5(a)(1); ISO 45001:2018 6.1.2 (psychosocial hazards)",
    iso45001Clause: "6.1.2", notes: "ISO 45001:2021 amendment explicitly includes psychosocial hazards within 6.1.2 scope.",
  },
  {
    workArea: "Warehouse & Shipping",
    activityTask: "Compressed gas cylinder storage and movement (nitrogen, CO₂ for lab)",
    hazardDescription: "Cylinder valve damage or seal failure causing uncontrolled pressurized gas release or projectile hazard",
    hazardType: "physical", operatingCondition: "routine",
    whoAffected: ["employees"],
    consequenceDescription: "High-velocity projectile (cylinder becomes 'rocket') causing fatal impact injury; asphyxiation in confined space from inert gas leak",
    existingControls: "Cylinders chained in upright position at all times, protective valve caps installed when not in use, CGA handling training for all warehouse personnel",
    probability: 3, gravity: 10, magnitude: 2,  // Score 60 — Medium
    controlHierarchy: ["engineering", "administrative"],
    plannedControls: "Install dedicated cylinder storage cage with fall-prevention chains; add cylinder inspection to monthly EHS walk checklist",
    residualProbability: 1, residualGravity: 3, residualMagnitude: 2,  // Score 6 — Low
    actionRequired: null, responsiblePerson: "Warehouse Supervisor",
    targetDate: null, status: "closed",
    legalRequirement: "OSHA 29 CFR 1910.101 (Compressed Gases — General Requirements); CGA P-1",
    iso45001Clause: "6.1.2", notes: null,
  },
];

const DEMO_USER_ID_PROD = "a60ec465-679d-4967-9e0f-e7a36d465a1c";
const DEMO_USER_ID_DEV  = "c2df200b-5806-4310-ba66-e127f2095625";
const EBENI_USER_ID     = "54320068";

const CCI_PROCESSES = [{"kpi":"Quote acceptance rate ≥ 70%","row":"COP","name":"Sales & Customer Relations","site":"REMOTE_SITE","owner":"Sales Manager","inputs":"Customer RFQ, product inquiries, OEM requirements","clauses":["8.2","8.2.1","8.2.2"],"outputs":"Accepted orders, customer contracts, pricing agreements","sequence":1},{"kpi":"PPAP on-time ≥ 95%","row":"COP","name":"APQP / New Program Launch","site":"PLANT","owner":"Program Manager","inputs":"Customer APQP requirements, feasibility study","clauses":["8.3","8.3.2","8.3.4","8.3.5"],"outputs":"PPAP package, approved production part","sequence":3},{"kpi":"First-pass yield ≥ 98%","row":"COP","name":"Chemical Blending","site":"PLANT","owner":"Production Supervisor","inputs":"Raw materials, batch formula, work order","clauses":["8.5","8.6","8.7"],"outputs":"Bulk blended fluid, batch record","sequence":4},{"kpi":"Lab TAT ≤ 4 hours","row":"COP","name":"Analytical Testing","site":"PLANT","owner":"QC Lab Manager","inputs":"Bulk sample, test specification","clauses":["8.6","9.1","7.1.5"],"outputs":"COA, approved/rejected decision","sequence":5},{"kpi":"Line efficiency ≥ 92%","row":"COP","name":"Filling & Packaging","site":"PLANT","owner":"Production Supervisor","inputs":"Approved bulk, containers, labels","clauses":["8.5","8.5.1"],"outputs":"Finished goods, labeled containers","sequence":6},{"kpi":"On-time shipment ≥ 98%","row":"COP","name":"Warehouse & Shipping","site":"REMOTE_SITE","owner":"Warehouse Supervisor","inputs":"Finished goods, shipping orders, customer delivery schedule","clauses":["8.5.4","8.5.5","7.1.3"],"outputs":"Shipped product, delivery confirmation, inventory records","sequence":8},{"kpi":"Approved supplier on-time delivery ≥ 95%","row":"SOP","name":"Supplier Management & Purchasing","site":"PLANT","owner":"Procurement Manager","inputs":"Production schedule, material specs, approved supplier list","clauses":["8.4","8.4.1","8.4.2","8.4.3"],"outputs":"Approved raw materials, supplier scorecards, purchase orders"},{"kpi":"Training completion rate ≥ 95%","row":"SOP","name":"HR, Training & Competency","site":"PLANT","owner":"HR Manager","inputs":"Job descriptions, training needs, competency matrix","clauses":["7.1.2","7.2","7.3"],"outputs":"Trained personnel, competency records, RACI matrix"},{"kpi":"Planned maintenance completion ≥ 98%","row":"SOP","name":"Equipment Maintenance & Calibration","site":"PLANT","owner":"Maintenance Supervisor","inputs":"Preventive maintenance schedule, calibration register","clauses":["7.1.3","7.1.4","7.1.5","8.5.1"],"outputs":"Maintained equipment, calibration certificates, MSA results"},{"kpi":"Document review compliance 100%","row":"SOP","name":"Document & Records Control","site":"PLANT","owner":"Quality Manager","inputs":"Document requests, change notices, record retention schedule","clauses":["7.5","7.5.1","7.5.2","7.5.3"],"outputs":"Controlled documents, updated records, change history"},{"kpi":"Annual quality objectives achieved ≥ 80%","row":"MOP","name":"Management & Strategic Planning","site":"PLANT","owner":"General Manager","inputs":"Business plan, stakeholder inputs, market data","clauses":["5.1","5.2","6.1","6.2","9.3"],"outputs":"Quality policy, strategic objectives, resource allocation"},{"kpi":"Audit schedule compliance 100% · zero repeat findings","row":"MOP","name":"Internal Audit & Management Review","site":"PLANT","owner":"Quality Manager","inputs":"Audit schedule, process KPIs, previous MR minutes","clauses":["9.2","9.3","10.2","10.3"],"outputs":"Audit reports, management review minutes, improvement actions"}];

const CCI_PESTLE = {"political":{"factors":"Trade policies affecting chemical imports (glycol ethers, solvents)\nFMVSS 116 and DOT regulatory oversight\nOEM supplier development mandates (IATF 16949 push-down)\nEnvironmental regulations (RCRA, CERCLA) affecting waste disposal","opportunities":"Federal infrastructure investment increasing automotive production demand\nEPA push toward sustainable chemistry creates product differentiation opportunity","threats":"Tariffs on imported chemical raw materials increasing COGS\nIncreasing regulatory compliance costs"},"economic":{"factors":"Automotive production volumes and OEM build schedules\nRaw material commodity prices (glycol ethers, borate esters, MEK)\nInflation impact on logistics and labor costs\nInterest rates affecting CapEx financing for capacity expansion","opportunities":"Reshoring of automotive manufacturing driving domestic chemical supplier demand\nGrowth in EV thermal management fluids (new product category)","threats":"Supply chain disruptions causing raw material shortages\nOEM production curtailments reducing order volumes"},"social":{"factors":"Skilled labor availability in Dayton, OH manufacturing sector\nWorkforce aging and technical knowledge transfer\nCustomer expectations for sustainability and ESG reporting\nSafety culture requirements from OEM customers","opportunities":"Apprenticeship programs with local technical colleges\nDiversity supplier certifications opening new customer opportunities","threats":"Labor market competition from non-automotive manufacturers\nIncreasing safety incident reporting requirements"},"technological":{"factors":"Automation of filling and packaging lines\nSPC and real-time process monitoring capability\nCustomer portal integration requirements (Ford, GM, Stellantis)\nLaboratory information management systems (LIMS)","opportunities":"Inline analytical testing reducing lab turnaround time\nDigital PPAP submission reducing customer approval cycle time","threats":"Obsolescence of legacy batch control systems\nCybersecurity requirements from OEM customers for supplier portals"},"legal":{"factors":"FMVSS 116 (DOT 3/4 brake fluid specification)\nSAE J1703 and ISO 4925 compliance\nOSHA PSM (Process Safety Management) if applicable thresholds met\nProduct liability exposure for safety-critical automotive fluid","opportunities":"Compliance as competitive barrier — smaller competitors unable to meet requirements","threats":"Increasing litigation risk for product quality failures in safety-critical applications"},"environmental":{"factors":"Wastewater treatment for glycol-containing process streams\nHazardous waste generation (spent solvents, off-spec product)\nAir emissions from solvent handling\nSpill containment requirements (SPCC plan)","opportunities":"Development of bio-based or biodegradable formulations for fleet customers\nEnergy efficiency improvements reducing carbon footprint","threats":"Tightening EPA effluent limits for glycol compounds\nIncreasing cost of hazardous waste disposal"}};

const CCI_SWOT = {"strengths":["IATF 16949 certified — preferred supplier status with Tier 1 automotive customers","Long-term OEM-approved formulations (DOT 3, DOT 4, DEX-COOL) reducing qualification risk","Vertically integrated analytical lab with NIST-traceable calibration","Experienced formulation team with 15+ years automotive fluid chemistry expertise","Dedicated APQP/PPAP capability for new program launches"],"weaknesses":["Single manufacturing site — no backup production capacity for surge or disaster recovery","Limited ERP integration — manual data entry between production, QC, and shipping","Aging filling line equipment with increasing downtime frequency","Narrow product portfolio — limited exposure to EV/hybrid thermal management fluids","Key-man dependency: formulation knowledge concentrated in senior chemist"],"opportunities":["EV thermal management fluid development — growing market with few qualified IATF suppliers","Expansion of OEM-direct supply relationships (bypass Tier 1 intermediaries)","Sustainability-driven product line (bio-based glycols, reduced-VOC formulations)","Capacity expansion to capture reshored automotive manufacturing growth in Midwest","Digital PPAP and customer portal integration to reduce approval cycle time"],"threats":["Raw material cost volatility (glycol ethers, borate esters sourced from 2-3 suppliers)","OEM production volume uncertainty affecting demand planning accuracy","Competitive pressure from larger chemical companies with broader portfolios","Increasing IATF surveillance audit requirements and customer-specific requirements burden","Regulatory changes to FMVSS 116 requiring reformulation investment"]};

const CCI_STRATEGIC_RISKS = [
  { id: 'sr-demo-001', source: '4.1 PESTLE – Political', description: 'FMCSA/DOT regulation changes affecting brake fluid classification', type: 'risk', impact: 'H', likelihood: 'M', rating: 'High', owner: 'Elena Vasquez, Quality Manager', response: 'Monitor FMCSA rulemaking; maintain regulatory watch through STLE and ASTM membership. Annual compliance review.', status: 'open' },
  { id: 'sr-demo-002', source: '4.1 PESTLE – Political', description: 'Reshoring incentives for automotive chemical suppliers', type: 'opportunity', impact: 'M', likelihood: 'M', rating: 'Medium', owner: 'Greg Torres, Sales Director', response: 'Engage MEMA and regional economic development to qualify for reshoring grants.', status: 'in_progress' },
  { id: 'sr-demo-003', source: '4.1 PESTLE – Economic', description: 'Raw material price volatility (glycol ethers, corrosion inhibitors)', type: 'risk', impact: 'H', likelihood: 'H', rating: 'Critical', owner: 'Marcus Webb, Production Supervisor', response: 'Hedge glycol ether pricing via 6-month forward contracts; identify two qualified alternate suppliers.', status: 'in_progress' },
  { id: 'sr-demo-004', source: '4.1 PESTLE – Economic', description: 'Growth in EV platform programs requiring new fluid specifications', type: 'opportunity', impact: 'H', likelihood: 'M', rating: 'High', owner: 'Greg Torres, Sales Director', response: 'Initiate R&D project to develop EV-compatible thermal management fluid. Target Ford EV platform qualification by Q4 2026.', status: 'open' },
  { id: 'sr-demo-005', source: '4.1 PESTLE – Social', description: 'Aging skilled workforce in chemical blending operations', type: 'risk', impact: 'M', likelihood: 'H', rating: 'High', owner: 'HR Director', response: 'Launch apprenticeship program with local community college; document 100% of critical blending SOPs by Q2 2026.', status: 'in_progress' },
  { id: 'sr-demo-006', source: '4.1 PESTLE – Legal', description: 'REACH/RoHS compliance for export to European automotive customers', type: 'risk', impact: 'H', likelihood: 'M', rating: 'High', owner: 'Elena Vasquez, Quality Manager', response: 'Commission REACH SVHC screening for all formulations. Engage EU Authorized Representative.', status: 'open' },
  { id: 'sr-demo-007', source: '4.1 PESTLE – Environmental', description: 'Glycol-based wastewater disposal and POTW compliance', type: 'risk', impact: 'M', likelihood: 'M', rating: 'Medium', owner: 'EHS Coordinator', response: 'Quarterly POTW permit review; install inline glycol monitoring on discharge point.', status: 'open' },
  { id: 'sr-demo-008', source: '4.1 PESTLE – Technological', description: 'Customer ERP portal integration requirements (Ford GPDS, GM GQTS)', type: 'risk', impact: 'M', likelihood: 'H', rating: 'High', owner: 'IT Manager', response: 'Budget for EDI/API middleware in FY2026 capital plan.', status: 'open' },
  { id: 'sr-demo-009', source: '4.1 SWOT – Threat', description: 'Tier 1 consolidation — customers reducing approved supplier lists', type: 'risk', impact: 'H', likelihood: 'H', rating: 'Critical', owner: 'Greg Torres, Sales Director', response: 'Accelerate IATF 16949 scope expansion. Annual customer satisfaction surveys and executive relationship reviews with top 5 OEM buyers.', status: 'in_progress' },
  { id: 'sr-demo-010', source: '4.1 SWOT – Threat', description: 'Asian imports of DOT-equivalent brake fluids at 20% lower price point', type: 'risk', impact: 'H', likelihood: 'M', rating: 'High', owner: 'Greg Torres, Sales Director', response: 'Differentiate on IATF certification, traceability, and US-sourced formulation. Explore value-added services.', status: 'open' },
  { id: 'sr-demo-011', source: '4.1 SWOT – Weakness', description: 'Single-source dependency for DMSO additive (1 supplier)', type: 'risk', impact: 'H', likelihood: 'M', rating: 'High', owner: 'Marcus Webb, Production Supervisor', response: 'Qualify second DMSO supplier within 90 days. Increase safety stock to 60-day supply.', status: 'in_progress' },
  { id: 'sr-demo-012', source: '4.1 SWOT – Strength', description: '30+ year OEM-approved supplier relationships', type: 'opportunity', impact: 'H', likelihood: 'H', rating: 'Critical', owner: 'Greg Torres, Sales Director', response: 'Leverage long-term relationships to secure multi-year supply agreements and preferred supplier status for EV platform programs.', status: 'open' },
];

const CCI_INTERESTED_PARTIES = [{"name":"Ford Motor Company","type":"Customer","needs":"IATF 16949 certification, PPAP Level 3 submissions, Q1 portal compliance, 8D response within 24 hours for field issues","expectations":"Zero defect delivery, OTD ≥ 98%, advance shipping notice (ASN) via EDI, annual supplier scorecard review"},{"name":"General Motors","type":"Customer","needs":"GM-specific CSR compliance, BIQS scorecard performance, Covisint portal submissions","expectations":"IATF 16949 certification, supplier development toward GM standards, corrective action response within 5 business days"},{"name":"Stellantis","type":"Customer","needs":"Supplier Quality Manual compliance, PPAP submissions, AIAG FMEA methodology","expectations":"Zero customer disruptions, containment within 24 hours of quality escape"},{"name":"Tier 1 Automotive Suppliers","type":"Customer","needs":"Consistent product quality (COA with every lot), reliable delivery, technical support for application questions","expectations":"Competitive pricing, flexible order quantities, SDS/TDS documentation"},{"name":"Chemical Raw Material Suppliers","type":"Supplier","needs":"Long-term purchase agreements, timely payment, clear specifications","expectations":"Forecasting information, specification changes with adequate lead time"},{"name":"IATF Certification Body (BSI)","type":"Regulatory","needs":"Compliance with IATF 16949:2016 standard and IATF rules","expectations":"Transparent audit access, corrective action closure within agreed timelines, no major nonconformances at surveillance"},{"name":"Ohio EPA / US EPA","type":"Regulatory","needs":"RCRA compliance (hazardous waste), wastewater permit compliance, air emissions reporting","expectations":"Accurate and timely regulatory reporting, spill response capability (SPCC plan)"},{"name":"OSHA","type":"Regulatory","needs":"Workplace safety compliance (HazCom, PPE, emergency response)","expectations":"Injury recordkeeping (OSHA 300 log), prompt incident investigation and corrective action"},{"name":"CCI Employees","type":"Internal","needs":"Safe working conditions, competitive compensation, career development, clear job expectations","expectations":"Management communication, training investment, ergonomic workplace design"},{"name":"CCI Leadership / Owners","type":"Internal","needs":"Financial performance, business growth, customer retention, regulatory compliance","expectations":"Quality metrics transparency, risk visibility, strategic planning participation"}];

export async function seedDemoDataIfEmpty(): Promise<void> {
  try {
    // Check if any iso_projects exist
    const [{ value: projCount }] = await db.select({ value: count() }).from(isoProjects);
    if (Number(projCount) > 0) {
      console.log(`[demo-seed] iso_projects already has ${projCount} row(s) — skipping seed.`);
      // Backfill strategic_risks if missing on the CCI Chemical demo account
      const checkResult = await db.execute(sql`
        SELECT id FROM iso_projects WHERE user_id = ${EBENI_USER_ID} AND strategic_risks IS NULL LIMIT 1
      `);
      if (checkResult.rows.length > 0) {
        const strategicJson = JSON.stringify(CCI_STRATEGIC_RISKS);
        await db.execute(sql`
          UPDATE iso_projects SET strategic_risks = ${strategicJson}::jsonb WHERE user_id = ${EBENI_USER_ID} AND strategic_risks IS NULL
        `);
        console.log("[demo-seed] Backfilled strategic_risks for CCI Chemical demo account.");
      }
      // Backfill hazard_analysis if missing for the CCI Chemical demo account
      await seedHazardsIfMissing();
      // Backfill NCMR demo records if missing
      await seedNcmrIfMissing();
      return;
    }

    console.log("[demo-seed] Production DB empty — seeding CCI Chemical demo data...");

    // Determine which user ID to assign the project to
    // Try prod Raul first, then dev Raul, then Ebeni
    let ownerUserId = DEMO_USER_ID_PROD;
    const [prodRaul] = await db.select().from(users).where(eq(users.id, DEMO_USER_ID_PROD));
    if (!prodRaul) {
      const [devRaul] = await db.select().from(users).where(eq(users.id, DEMO_USER_ID_DEV));
      ownerUserId = devRaul ? DEMO_USER_ID_DEV : EBENI_USER_ID;
    }

    // Minimal insert — only columns that cannot cause type-casting issues in the prod CJS bundle
    const standard      = "IATF 16949";
    const statusVal     = "complete";
    const orgName       = "CCI Chemical, Inc.";
    const processesJson = JSON.stringify(CCI_PROCESSES);
    const pestleJson    = JSON.stringify(CCI_PESTLE);
    const swotJson      = JSON.stringify(CCI_SWOT);
    const partiesJson   = JSON.stringify(CCI_INTERESTED_PARTIES);
    const strategicJson = JSON.stringify(CCI_STRATEGIC_RISKS);

    const result = await db.execute(sql`
      INSERT INTO iso_projects (
        user_id, standard, phase, status, org_name,
        processes, pestle_data, swot_data, interested_parties, strategic_risks,
        created_at, updated_at
      ) VALUES (
        ${ownerUserId}, ${standard}, 3, ${statusVal}, ${orgName},
        ${processesJson}::jsonb, ${pestleJson}::jsonb, ${swotJson}::jsonb, ${partiesJson}::jsonb, ${strategicJson}::jsonb,
        NOW(), NOW()
      ) RETURNING id
    `);

    const projectId: number = (result.rows[0] as any).id;
    console.log(`[demo-seed] Created CCI Chemical ISO project id=${projectId} for userId=${ownerUserId}`);

    // Seed sample nonconformances — one INSERT per row to avoid multi-value parsing issues
    const nc1Title = "Viscometer Cal Failure - Out of Tolerance";
    const nc1Desc  = "VIS-003 viscometer found out of tolerance during annual calibration. Measured viscosity 4.3% above upper control limit.";
    const nc1Cont  = "Quarantined instrument. 23 lots identified for re-test with calibrated reference viscometer.";
    await db.execute(sql`
      INSERT INTO nonconformances (iso_project_id, user_id, title, description, severity, status, source_type, detected_date, responsible_person, iso_clause, immediate_containment, created_at)
      VALUES (${projectId}, ${ownerUserId}, ${nc1Title}, ${nc1Desc}, 'major', 'open', 'internal_audit', NOW() - INTERVAL '14 days', 'QC Lab Manager', '7.1.5', ${nc1Cont}, NOW())
    `);

    const nc2Title = "Brake Fluid pH Out of Spec - Batch BF-2024-0312";
    const nc2Desc  = "Batch BF-2024-0312 DOT 3 brake fluid failed final QC pH criterion (7.0-11.5). pH measured at 6.6. Batch on hold.";
    const nc2Cont  = "Batch quarantined. No product shipped. Raw material lot trace completed.";
    await db.execute(sql`
      INSERT INTO nonconformances (iso_project_id, user_id, title, description, severity, status, source_type, detected_date, responsible_person, iso_clause, immediate_containment, created_at)
      VALUES (${projectId}, ${ownerUserId}, ${nc2Title}, ${nc2Desc}, 'major', 'action_in_progress', 'process_observation', NOW() - INTERVAL '21 days', 'Production Supervisor', '8.7', ${nc2Cont}, NOW())
    `);

    const nc3Title = "Supplier COA Discrepancy - Glycol Ether Lot";
    const nc3Desc  = "Glycol ether lot COA stated purity 99.5%. Internal verification measured 97.8%. Discrepancy exceeds 1% tolerance.";
    const nc3Cont  = "Lot quarantined. Supplier notified. Material returned.";
    await db.execute(sql`
      INSERT INTO nonconformances (iso_project_id, user_id, title, description, severity, status, source_type, detected_date, responsible_person, iso_clause, immediate_containment, created_at)
      VALUES (${projectId}, ${ownerUserId}, ${nc3Title}, ${nc3Desc}, 'minor', 'closed', 'supplier', NOW() - INTERVAL '45 days', 'Procurement Manager', '8.4.3', ${nc3Cont}, NOW())
    `);

    console.log("[demo-seed] Seeded 3 nonconformances.");

    // Seed hazard analysis records
    await seedHazardsForUser(ownerUserId);

    console.log("[demo-seed] CCI Chemical demo seed complete ✓");
  } catch (err: any) {
    console.error("[demo-seed] Seed error:", err.message);
  }
}

async function seedHazardsIfMissing(): Promise<void> {
  // Find the owner of the CCI Chemical demo project
  const ownerRes = await db.execute(sql`
    SELECT user_id FROM iso_projects WHERE org_name = 'CCI Chemical, Inc.' LIMIT 1
  `);
  if (!ownerRes.rows.length) return;
  const ownerId = (ownerRes.rows[0] as any).user_id as string;

  const existingRes = await db.execute(sql`
    SELECT COUNT(*) AS cnt FROM hazard_analysis WHERE user_id = ${ownerId}
  `);
  const cnt = Number((existingRes.rows[0] as any).cnt ?? 0);
  if (cnt > 0) {
    console.log(`[demo-seed] hazard_analysis already has ${cnt} row(s) for CCI Chemical — skipping.`);
    return;
  }
  await seedHazardsForUser(ownerId);
}

async function seedHazardsForUser(userId: string): Promise<void> {
  // P × G × M scoring: Low≤30 / Medium≤100 / High≤280 / Critical>280
  function calcLevel(score: number): string {
    if (score <= 30) return "low";
    if (score <= 100) return "medium";
    if (score <= 280) return "high";
    return "critical";
  }

  for (const h of CCI_HAZARDS) {
    const riskScore = h.probability * h.gravity * h.magnitude;
    const residualRiskScore = h.residualProbability * h.residualGravity * h.residualMagnitude;
    const riskLevel = calcLevel(riskScore);
    const residualRiskLevel = calcLevel(residualRiskScore);
    const whoLiteral = "{" + h.whoAffected.join(",") + "}";
    const controlLiteral = "{" + h.controlHierarchy.join(",") + "}";

    await db.execute(sql`
      INSERT INTO hazard_analysis (
        user_id, work_area, activity_task, hazard_description, hazard_type,
        operating_condition, who_affected,
        consequence_description, existing_controls,
        probability, gravity, magnitude, risk_score, risk_level,
        control_hierarchy, planned_controls,
        residual_probability, residual_gravity, residual_magnitude,
        residual_risk_score, residual_risk_level,
        action_required, responsible_person, target_date, status,
        legal_requirement, iso45001_clause, notes,
        created_at, updated_at
      ) VALUES (
        ${userId}, ${h.workArea}, ${h.activityTask}, ${h.hazardDescription}, ${h.hazardType},
        ${h.operatingCondition}, ${whoLiteral}::text[],
        ${h.consequenceDescription}, ${h.existingControls},
        ${h.probability}, ${h.gravity}, ${h.magnitude}, ${riskScore}, ${riskLevel},
        ${controlLiteral}::text[], ${h.plannedControls},
        ${h.residualProbability}, ${h.residualGravity}, ${h.residualMagnitude},
        ${residualRiskScore}, ${residualRiskLevel},
        ${h.actionRequired}, ${h.responsiblePerson}, ${h.targetDate ?? null}, ${h.status},
        ${h.legalRequirement}, ${h.iso45001Clause}, ${h.notes},
        NOW(), NOW()
      )
    `);
  }
  console.log(`[demo-seed] Seeded ${CCI_HAZARDS.length} hazard analysis records for userId=${userId}.`);
}

// ─── Compliance Evaluation Log + MD Evidence demo seed ────────────────────────
export async function seedComplianceEvalAndMdDemoIfEmpty(): Promise<void> {
  // Find CCI Chemical demo owner
  const ownerRes = await db.execute(sql`
    SELECT user_id FROM iso_projects WHERE org_name = 'CCI Chemical, Inc.' LIMIT 1
  `);
  if (!ownerRes.rows.length) return;
  const userId = (ownerRes.rows[0] as any).user_id as string;

  // ── Evaluation Log ──────────────────────────────────────────────────────────
  const evalCount = await db.execute(sql`
    SELECT COUNT(*) AS cnt FROM iso_compliance_evaluations WHERE user_id = ${userId}
  `);
  if (Number((evalCount.rows[0] as any).cnt ?? 0) === 0) {
    // Get obligation IDs by name so the seed works regardless of auto-increment values
    const oblRes = await db.execute(sql`
      SELECT id, requirement_name FROM iso_compliance_obligations WHERE user_id = ${userId}
    `);
    const oblMap: Record<string, number> = {};
    for (const r of oblRes.rows as any[]) oblMap[r.requirement_name] = r.id;

    const evals: Array<{
      obligationName: string; evaluationDate: string; evaluatedBy: string;
      complianceStatus: string; findings: string; evidenceDescription: string;
      actionRequired: string | null; dueDate: string | null; closedDate: string | null;
    }> = [
      {
        obligationName: "FDA 21 CFR 820.22 — Quality Audit",
        evaluationDate: "2025-03-15",
        evaluatedBy: "Maria Santos, QA Manager",
        complianceStatus: "compliant",
        findings: "Annual internal quality audit completed per 820.22. All audit procedures documented. Findings from prior year CAPA #2024-003 verified closed. No new critical findings identified.",
        evidenceDescription: "Internal Audit Report IA-2025-001, CAPA closure records, management review minutes",
        actionRequired: null, dueDate: null, closedDate: "2025-03-28",
      },
      {
        obligationName: "FDA 21 CFR 820.100 — Corrective and Preventive Action",
        evaluationDate: "2025-04-10",
        evaluatedBy: "James Liu, QA Specialist",
        complianceStatus: "compliant",
        findings: "CAPA procedure (QP-012 Rev 4) reviewed. 14 open CAPAs evaluated — 12 on schedule, 2 approaching due date. Root cause analysis methodology verified consistent with 21 CFR 820.100 requirements. Effectiveness checks documented for 8 closed CAPAs.",
        evidenceDescription: "CAPA log export April 2025, QP-012 Rev 4, effectiveness verification records CAPA-2024-007 through CAPA-2024-012",
        actionRequired: "Two CAPAs (CAPA-2025-003, CAPA-2025-006) approaching due date — escalate to department managers for resource allocation.",
        dueDate: "2025-05-31", closedDate: null,
      },
      {
        obligationName: "FDA 21 CFR 820.198 — Complaint Files",
        evaluationDate: "2025-02-20",
        evaluatedBy: "Maria Santos, QA Manager",
        complianceStatus: "under_review",
        findings: "Complaint handling procedure QP-018 Rev 2 reviewed. 23 complaints received YTD. Three complaints from Q4 2024 exceed the 30-day investigation timeline — investigation records are incomplete. MDR reportability determination not documented for 2 of these complaints.",
        evidenceDescription: "Complaint log Q4 2024 – Q1 2025, investigation records, MDR reportability assessment forms",
        actionRequired: "Complete overdue investigation reports for complaints CMP-2024-041, CMP-2024-047, CMP-2024-052. Document MDR reportability decisions. Update procedure to include 30-day tracking alert.",
        dueDate: "2025-04-30", closedDate: null,
      },
      {
        obligationName: "FDA MDR 803.50 — Reportable Events (30-Day)",
        evaluationDate: "2025-01-08",
        evaluatedBy: "James Liu, QA Specialist",
        complianceStatus: "compliant",
        findings: "One MDR filed Q4 2024 — event EVT-2024-003, reported within 22 days of awareness. MedWatch 3500A reviewed and accurate. No 5-day reports triggered. FDA acknowledgment received. Supplemental MDR filed 90 days post-initial report with completed investigation findings.",
        evidenceDescription: "MedWatch 3500A for EVT-2024-003, FDA submission confirmation, supplemental report SUP-2024-003, investigation report IR-2024-003",
        actionRequired: null, dueDate: null, closedDate: "2025-01-15",
      },
      {
        obligationName: "EU MDR Art. 83 — Post-Market Surveillance",
        evaluationDate: "2025-03-01",
        evaluatedBy: "Elena Moreau, Regulatory Affairs",
        complianceStatus: "compliant",
        findings: "Post-Market Surveillance Plan (PMSP-001 Rev 3) updated for 2025. PMS data sources reviewed: complaint database, literature surveillance Q1–Q4 2024, vigilance reports, field feedback. No signals requiring FSCA identified. PSUR prepared and submitted to Notified Body (BSI Group).",
        evidenceDescription: "PMSP-001 Rev 3, PSUR-2024 submission package, literature search summary, BSI acknowledgment letter",
        actionRequired: null, dueDate: null, closedDate: "2025-03-20",
      },
      {
        obligationName: "RCRA Hazardous Waste — Small Quantity Generator (SQG) Requirements",
        evaluationDate: "2025-01-15",
        evaluatedBy: "Tom Becker, EHS Coordinator",
        complianceStatus: "non_compliant",
        findings: "Waste accumulation area inspection revealed one satellite accumulation container exceeding 1-gallon limit (found at 1.8 gallons — solvent waste). Container labeling missing 'Hazardous Waste' designation on two drums. Emergency coordinator list in facility contingency plan not updated since 2023.",
        evidenceDescription: "Waste area inspection checklist Jan 2025, photos of non-conforming containers, generator registration CCI-SQG-MI-2022",
        actionRequired: "Reduce satellite accumulation container to compliant level. Re-label drums immediately. Update emergency coordinator list in contingency plan by Feb 28, 2025.",
        dueDate: "2025-02-28", closedDate: null,
      },
      {
        obligationName: "Oil Spill Prevention, Control & Countermeasure (SPCC) Plan",
        evaluationDate: "2024-11-05",
        evaluatedBy: "Tom Becker, EHS Coordinator",
        complianceStatus: "under_review",
        findings: "SPCC Plan (last amended 2021) requires update — new 5,000-gallon bulk tank installed in March 2024 adds to aggregate above-ground oil capacity. Professional Engineer re-certification of amended plan required per 40 CFR 112.3(d). Secondary containment for new tank is in place but not yet documented in the plan.",
        evidenceDescription: "SPCC Plan Rev 2 (2021), PE certification letter on file, new tank installation records, secondary containment inspection checklist",
        actionRequired: "Engage licensed PE to amend and re-certify SPCC Plan by Q1 2025. Add new tank storage capacity, secondary containment dimensions, and inspection protocol.",
        dueDate: "2025-03-31", closedDate: null,
      },
    ];

    for (const ev of evals) {
      const oblId = oblMap[ev.obligationName];
      if (!oblId) continue; // skip if obligation not found
      await db.execute(sql`
        INSERT INTO iso_compliance_evaluations (
          user_id, compliance_obligation_id, evaluation_date, evaluated_by,
          compliance_status, findings, evidence_description,
          action_required, due_date, closed_date, created_at
        ) VALUES (
          ${userId}, ${oblId}, ${ev.evaluationDate}, ${ev.evaluatedBy},
          ${ev.complianceStatus}, ${ev.findings}, ${ev.evidenceDescription},
          ${ev.actionRequired ?? null}, ${ev.dueDate ?? null}, ${ev.closedDate ?? null},
          NOW()
        )
      `);
    }
    console.log(`[demo-seed] Seeded ${evals.length} compliance evaluation records.`);
  } else {
    const cnt = Number((evalCount.rows[0] as any).cnt ?? 0);
    console.log(`[demo-seed] iso_compliance_evaluations already has ${cnt} row(s) — skipping.`);
  }

  // ── MD Regulatory Evidence ──────────────────────────────────────────────────
  const mdCount = await db.execute(sql`
    SELECT COUNT(*) AS cnt FROM md_regulatory_evidence WHERE user_id = ${userId}
  `);
  if (Number((mdCount.rows[0] as any).cnt ?? 0) === 0) {
    // Get project id
    const projRes = await db.execute(sql`
      SELECT id FROM iso_projects WHERE user_id = ${userId} LIMIT 1
    `);
    const isoProjectId = projRes.rows.length ? (projRes.rows[0] as any).id : null;

    const mdEvidence: Array<{
      title: string; evidenceType: string; referenceNumber: string | null;
      relatedCapaNumber: string | null; description: string; submittedTo: string | null;
      submissionDate: string | null; retentionUntil: string; retentionYears: number;
      status: string; notes: string | null; createdBy: string;
    }> = [
      {
        title: "Design Validation Report — Infusion Pump Model IP-400",
        evidenceType: "validation_evidence",
        referenceNumber: "DVR-2024-001",
        relatedCapaNumber: null,
        description: "Full design validation report demonstrating the Infusion Pump IP-400 meets user needs and intended uses under simulated and actual conditions of use. Includes bench testing, simulated use testing (IEC 60601-1), software validation (IEC 62304), and biocompatibility (ISO 10993-1) summaries. 47 test protocols, 3 deficiencies resolved, final approval Jan 2024.",
        submittedTo: null,
        submissionDate: null,
        retentionUntil: "2034-01-31",
        retentionYears: 10,
        status: "active",
        notes: "Retained per 21 CFR 820.180 — records must be retained for the life of the device plus 2 years. Stored in EDM system under DHF-IP400.",
        createdBy: "Maria Santos",
      },
      {
        title: "510(k) Premarket Notification — Infusion Pump IP-400 (K240156)",
        evidenceType: "regulatory_submission",
        referenceNumber: "K240156",
        relatedCapaNumber: null,
        description: "FDA 510(k) premarket notification for the IP-400 Infusion Pump. Substantial equivalence demonstrated against predicate device K193042. Submission includes device description, indications for use, performance testing, biocompatibility, software, sterility, and labeling. FDA decision: Substantially Equivalent — Cleared March 18, 2024.",
        submittedTo: "U.S. FDA — Center for Devices and Radiological Health (CDRH)",
        submissionDate: "2023-11-15",
        retentionUntil: "2034-03-31",
        retentionYears: 10,
        status: "accepted",
        notes: "FDA clearance letter on file. 510(k) summary published in FDA database. Annual registration and listing updated (21 CFR Part 807).",
        createdBy: "Elena Moreau",
      },
      {
        title: "Medical Device Report — Adverse Event EVT-2024-003",
        evidenceType: "adverse_event_record",
        referenceNumber: "MDR-EVT-2024-003",
        relatedCapaNumber: "CAPA-2024-009",
        description: "30-day MDR filed with FDA via MedWatch 3500A for event EVT-2024-003: patient experienced an alarm failure on IP-400 unit SN-10477, resulting in an undetected occlusion. No patient injury reported; event classified as malfunction with potential for serious injury. Root cause: firmware defect in occlusion detection algorithm (SW module v2.1.3). Corrective action: firmware update v2.1.4 deployed via field safety corrective action.",
        submittedTo: "U.S. FDA — MedWatch Safety Reporting Program",
        submissionDate: "2024-10-22",
        retentionUntil: "2034-10-31",
        retentionYears: 10,
        status: "submitted",
        notes: "Supplemental report filed Jan 8, 2025 with completed investigation. CAPA-2024-009 tracks firmware correction and field notification. FDA acknowledgment ref: ACK-2024-78923.",
        createdBy: "James Liu",
      },
      {
        title: "Post-Market Surveillance Report (PSUR) 2024 — Infusion Pump IP-400",
        evidenceType: "post_market_surveillance",
        referenceNumber: "PSUR-IP400-2024",
        relatedCapaNumber: null,
        description: "Annual Periodic Safety Update Report (PSUR) per EU MDR Art. 86 for IP-400 Infusion Pump. Covers Jan 1 – Dec 31, 2024. PMS data sources: complaint database (23 complaints; 1 MDR filed), literature surveillance (22 publications screened), vigilance reports from EU member states, registry data, field feedback. Benefit-risk ratio remains favorable. No FSCA required. Submitted to Notified Body BSI Group.",
        submittedTo: "BSI Group (EU MDR Notified Body — NB 0086)",
        submissionDate: "2025-03-01",
        retentionUntil: "2040-03-31",
        retentionYears: 15,
        status: "submitted",
        notes: "BSI acknowledgment received March 5, 2025. Next PSUR due March 1, 2026. Literature surveillance methodology per MEDDEV 2.12/2 Rev 2.",
        createdBy: "Elena Moreau",
      },
      {
        title: "CAPA Investigation Report — CAPA-2024-009 Firmware Occlusion Defect",
        evidenceType: "capa_evidence",
        referenceNumber: "CAPA-2024-009",
        relatedCapaNumber: "CAPA-2024-009",
        description: "Root cause investigation and corrective action evidence package for CAPA-2024-009 (firmware defect in occlusion detection, SW v2.1.3). Root cause confirmed via fault tree analysis: edge-case race condition in interrupt handler under specific flow-rate/viscosity combinations. Correction: firmware v2.1.4 with redesigned interrupt prioritization. Field Safety Corrective Action (FSCA) issued to 847 affected units globally. All units updated by Nov 30, 2024. Effectiveness verified via 90-day post-correction complaint data — 0 recurrence.",
        submittedTo: null,
        submissionDate: null,
        retentionUntil: "2034-12-31",
        retentionYears: 10,
        status: "active",
        notes: "CAPA closed Dec 20, 2024 following effectiveness verification. FSCA documentation retained separately under FSCA-2024-001.",
        createdBy: "James Liu",
      },
      {
        title: "EU MDR Technical Documentation — IP-400 (Article 10 / Annex II)",
        evidenceType: "regulatory_submission",
        referenceNumber: "TD-IP400-EU-2024",
        relatedCapaNumber: null,
        description: "EU MDR 2017/745 Technical Documentation package per Annex II for the IP-400 Infusion Pump. Includes device description (Annex II §1), design & manufacturing information (§3), general safety and performance requirements (§4, GSPR checklist — Annex I), benefit-risk analysis (§5), product verification and validation (§6), post-market surveillance plan (Annex III). Reviewed and approved by BSI Group for EU MDR certification.",
        submittedTo: "BSI Group (NB 0086) — EU MDR Certification",
        submissionDate: "2024-06-01",
        retentionUntil: "2039-06-30",
        retentionYears: 15,
        status: "accepted",
        notes: "EU MDR CE Certificate CE-2024-IP400 issued Aug 14, 2024. Valid until Aug 13, 2029. Annual surveillance audits required. Technical documentation must be updated for all design changes.",
        createdBy: "Elena Moreau",
      },
    ];

    for (const ev of mdEvidence) {
      await db.execute(sql`
        INSERT INTO md_regulatory_evidence (
          user_id, iso_project_id, title, evidence_type, reference_number,
          related_capa_number, description, submitted_to, submission_date,
          retention_until, retention_years, status, notes, created_by,
          created_at, updated_at
        ) VALUES (
          ${userId}, ${isoProjectId}, ${ev.title}, ${ev.evidenceType}, ${ev.referenceNumber ?? null},
          ${ev.relatedCapaNumber ?? null}, ${ev.description}, ${ev.submittedTo ?? null}, ${ev.submissionDate ?? null},
          ${ev.retentionUntil}, ${ev.retentionYears}, ${ev.status}, ${ev.notes ?? null}, ${ev.createdBy},
          NOW(), NOW()
        )
      `);
    }
    console.log(`[demo-seed] Seeded ${mdEvidence.length} MD regulatory evidence records.`);
  } else {
    const cnt = Number((mdCount.rows[0] as any).cnt ?? 0);
    console.log(`[demo-seed] md_regulatory_evidence already has ${cnt} row(s) — skipping.`);
  }
}

// ─── NCMR Demo Data ────────────────────────────────────────────────────────────
async function seedNcmrIfMissing(): Promise<void> {
  try {
    const res = await db.execute(sql`
      SELECT id, user_id FROM iso_projects WHERE user_id = ${EBENI_USER_ID} LIMIT 1
    `);
    if (!res.rows.length) return;
    const isoProjectId = Number((res.rows[0] as any).id);
    const userId = String((res.rows[0] as any).user_id);

    const countRes = await db.execute(sql`SELECT COUNT(*) as cnt FROM ncmr_records WHERE user_id = ${userId}`);
    const cnt = Number((countRes.rows[0] as any).cnt ?? 0);
    if (cnt > 0) {
      console.log(`[demo-seed] ncmr_records already has ${cnt} row(s) — skipping.`);
      return;
    }

    const d = (daysAgo: number) =>
      new Date(Date.now() - daysAgo * 86400000).toISOString().split("T")[0];
    const df = (daysForward: number) =>
      new Date(Date.now() + daysForward * 86400000).toISOString().split("T")[0];

    // ── NCMR-2026-0001: Critical batch failure — disposition pending ─────────
    const trail1 = JSON.stringify([
      { timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), action: "Record Created", by: "Elena Vasquez", notes: "Batch failed pH spec at final QC" },
      { timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), action: "Material Quarantined", by: "Marcus Webb", notes: "2400 L placed in Red Tag Cage C2" },
      { timestamp: new Date(Date.now() - 8 * 86400000).toISOString(), action: "Sent to MRB Review", by: "Elena Vasquez", notes: "MRB panel scheduled" },
      { timestamp: new Date(Date.now() - 6 * 86400000).toISOString(), action: "Awaiting Disposition Decision", by: "Elena Vasquez" },
    ]);
    await db.execute(sql`
      INSERT INTO ncmr_records (
        user_id, iso_project_id, ncmr_number, title, description,
        part_number, part_name, lot_number, quantity, unit,
        source_type, identified_by, identified_date, department,
        severity, nc_type, iso_clause, immediate_containment, status,
        quarantine_required, quarantine_location, quarantine_tag_number,
        quarantine_date, quarantine_by, quarantine_notes,
        capa_required, audit_trail, created_at, updated_at
      ) VALUES (
        ${userId}, ${isoProjectId}, 'NCMR-2026-0001',
        'DOT 3 Brake Fluid pH Out-of-Spec — Batch BF-2026-0041',
        'Batch BF-2026-0041 DOT 3 brake fluid failed final QC pH criterion (spec: 7.0–11.5 per FMVSS 116). Measured pH: 6.4 on three independent readings. Suspected root cause: corrosion inhibitor dilution error in glycol base stock blend.',
        'BF-DOT3-001', 'DOT 3 Brake Fluid', 'BF-2026-0041', '2400', 'liters',
        'production', 'Marcus Webb', ${d(10)}, 'QC Laboratory',
        'critical', 'functional', '8.7.1',
        'Batch quarantined immediately. No product shipped. All 18 containers marked HOLD — DO NOT SHIP. Three incoming raw material lots flagged for traceability review.',
        'disposition_pending',
        true, 'Red Tag Area — Cage C2', 'TAG-2026-0041',
        ${d(10)}, 'Marcus Webb', 'Physical cage lock applied. Quarantine log posted on cage door.',
        true, ${trail1}::jsonb, NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'
      )
    `);

    // ── NCMR-2026-0002: Supplier COA discrepancy — under review ─────────────
    const trail2 = JSON.stringify([
      { timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), action: "Record Created", by: "QC Lab Technician", notes: "COA vs GC test discrepancy at receiving" },
      { timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), action: "Material Quarantined", by: "Receiving Lead", notes: "Pallet isolated in incoming hold area" },
      { timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), action: "Sent to MRB Review", by: "Elena Vasquez", notes: "Supplier QA contacted with test data" },
    ]);
    await db.execute(sql`
      INSERT INTO ncmr_records (
        user_id, iso_project_id, ncmr_number, title, description,
        part_number, part_name, lot_number, quantity, unit,
        source_type, supplier_name, identified_by, identified_date, department, purchase_order,
        severity, nc_type, iso_clause, immediate_containment, status,
        quarantine_required, quarantine_location, quarantine_tag_number,
        quarantine_date, quarantine_by,
        capa_required, audit_trail, created_at, updated_at
      ) VALUES (
        ${userId}, ${isoProjectId}, 'NCMR-2026-0002',
        'Glycol Ether COA Purity Discrepancy — Lot GE-2026-0118',
        'Incoming shipment of diethylene glycol monobutyl ether. Supplier COA: purity 99.5%. Internal GC analysis: 97.1%. Discrepancy of 2.4% exceeds 1.0% specification tolerance. Potential impact on final product boiling point and pH compliance.',
        'GE-DGBE-100', 'Diethylene Glycol Monobutyl Ether', 'GE-2026-0118', '1000', 'kg',
        'incoming_inspection', 'Chemtrade Solutions LLC', 'QC Lab Technician', ${d(5)}, 'Receiving / QC Lab', 'PO-2026-0388',
        'major', 'material', '8.4.3',
        'Pallet quarantined at dock. Supplier QA notified via email with GC data. Replacement shipment requested. No production use.',
        'under_review',
        true, 'Incoming Hold — Dock Door 3', 'TAG-2026-0042',
        ${d(5)}, 'Receiving Lead',
        false, ${trail2}::jsonb, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'
      )
    `);

    // ── NCMR-2026-0003: Customer return — rework in progress ────────────────
    const trail3 = JSON.stringify([
      { timestamp: new Date(Date.now() - 21 * 86400000).toISOString(), action: "Record Created", by: "Elena Vasquez", notes: "Customer return received — Ford Dearborn" },
      { timestamp: new Date(Date.now() - 21 * 86400000).toISOString(), action: "Material Quarantined", by: "Warehouse Lead" },
      { timestamp: new Date(Date.now() - 18 * 86400000).toISOString(), action: "Sent to MRB Review", by: "Elena Vasquez" },
      { timestamp: new Date(Date.now() - 14 * 86400000).toISOString(), action: "Awaiting Disposition Decision", by: "Elena Vasquez" },
      { timestamp: new Date(Date.now() - 12 * 86400000).toISOString(), action: "Disposition Set: Rework", by: "Elena Vasquez", notes: "MRB approved reprocessing — reblend and retest" },
      { timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), action: "Rework Started", by: "Marcus Webb" },
    ]);
    const ssAuto3 = JSON.stringify({
      automotive: {
        customerNotified: true, customerNotificationDate: d(19),
        customerRef: "FQ-2026-9341", ppapImpact: false,
        controlPlanUpdateRequired: false, pfmeaUpdateRequired: false, warrantyClaim: false,
      },
    });
    await db.execute(sql`
      INSERT INTO ncmr_records (
        user_id, iso_project_id, ncmr_number, title, description,
        part_number, part_name, lot_number, quantity, unit,
        source_type, customer_name, identified_by, identified_date, department,
        severity, nc_type, iso_clause, immediate_containment, status,
        quarantine_required, quarantine_location, quarantine_tag_number,
        quarantine_date, quarantine_by,
        disposition_decision, disposition_notes, disposition_approved_by, disposition_approval_date,
        rework_instructions, rework_assigned_to, rework_due_date, rework_start_date,
        verification_required,
        capa_required, capa_linked_nc_number,
        standard_specific, audit_trail, created_at, updated_at
      ) VALUES (
        ${userId}, ${isoProjectId}, 'NCMR-2026-0003',
        'Customer Return — Contaminated DOT 4 Brake Fluid (Ford Dearborn)',
        'Ford Motor Company — Dearborn Assembly returned 4 × 55-gallon drums of DOT 4 brake fluid (Lot BF-DOT4-2025-0287). Customer reported amber discoloration (spec: clear to light yellow) and odor inconsistency. Internal testing confirmed petroleum contamination at 180 ppm (limit: 50 ppm). Root cause: shared transfer pump not purged between product changeovers.',
        'BF-DOT4-002', 'DOT 4 Brake Fluid', 'BF-DOT4-2025-0287', '880', 'liters',
        'customer_return', 'Ford Motor Company — Dearborn Assembly', 'Elena Vasquez', ${d(21)}, 'QC / Production',
        'major', 'contamination', '8.7',
        'All 4 drums quarantined in returned goods area. Inventory recall check on same production run lot. Dedicated transfer pump assigned to brake fluid lines only — effective immediately.',
        'rework_in_progress',
        true, 'Returned Goods — Bay 4', 'TAG-2026-0039',
        ${d(21)}, 'Warehouse Lead',
        'rework', 'Reprocess through activated carbon filtration and reblend. Full QC test panel required before release.', 'Elena Vasquez', ${d(12)},
        'Full reblend through activated carbon filter. Retest: pH, viscosity, wet boiling point, ERBP, color, odor. All 5 COA parameters must pass before release.',
        'Marcus Webb', ${df(3)}, ${d(10)},
        true,
        true, 'NC-2026-0044',
        ${ssAuto3}::jsonb, ${trail3}::jsonb, NOW() - INTERVAL '21 days', NOW() - INTERVAL '10 days'
      )
    `);

    // ── NCMR-2026-0004: Closed — label mix-up, relabeled and released ────────
    const trail4 = JSON.stringify([
      { timestamp: new Date(Date.now() - 35 * 86400000).toISOString(), action: "Record Created", by: "Production Supervisor", notes: "Label error caught at final inspection" },
      { timestamp: new Date(Date.now() - 35 * 86400000).toISOString(), action: "Material Quarantined", by: "Production Supervisor" },
      { timestamp: new Date(Date.now() - 33 * 86400000).toISOString(), action: "Sent to MRB Review", by: "Elena Vasquez" },
      { timestamp: new Date(Date.now() - 31 * 86400000).toISOString(), action: "Awaiting Disposition Decision", by: "Elena Vasquez" },
      { timestamp: new Date(Date.now() - 31 * 86400000).toISOString(), action: "Disposition Set: Rework", by: "Elena Vasquez", notes: "Relabel only — product integrity unaffected" },
      { timestamp: new Date(Date.now() - 30 * 86400000).toISOString(), action: "Rework Started", by: "Packaging Lead" },
      { timestamp: new Date(Date.now() - 28 * 86400000).toISOString(), action: "Rework Complete — Awaiting Verification", by: "Packaging Lead" },
      { timestamp: new Date(Date.now() - 27 * 86400000).toISOString(), action: "Verification Passed — Material Released", by: "QC Inspector", notes: "100% label check passed. Product released to warehouse." },
      { timestamp: new Date(Date.now() - 27 * 86400000).toISOString(), action: "NCMR Closed", by: "Elena Vasquez" },
    ]);
    await db.execute(sql`
      INSERT INTO ncmr_records (
        user_id, iso_project_id, ncmr_number, title, description,
        part_number, lot_number, quantity, unit,
        source_type, identified_by, identified_date, department,
        severity, nc_type, iso_clause, immediate_containment, status,
        quarantine_required, quarantine_location, quarantine_date, quarantine_by,
        disposition_decision, disposition_notes, disposition_approved_by, disposition_approval_date,
        rework_instructions, rework_assigned_to, rework_due_date, rework_start_date, rework_completed_date,
        verification_required, verification_activity, verification_by, verification_date, verification_result,
        capa_required, capa_decision_notes,
        closed_by, closed_date, closure_notes,
        audit_trail, created_at, updated_at
      ) VALUES (
        ${userId}, ${isoProjectId}, 'NCMR-2026-0004',
        'Wrong Label Applied — DOT 3 / DOT 4 Mix-Up on Filling Line',
        'Final inspection identified 48 × 1-gallon containers of DOT 4 brake fluid incorrectly labeled as DOT 3. Label mix-up occurred during line changeover — label roll not changed before start of filling run. No product contamination; label error only.',
        'BF-DOT4-003', 'BF-DOT4-2025-0301', '48', 'gallons',
        'production', 'Packaging Inspector', ${d(35)}, 'Filling & Packaging',
        'minor', 'labeling', '8.5.2',
        'All 48 containers isolated before palletizing. Line stopped. Label roll inventory verified across all active filling lines.',
        'released',
        true, 'Finished Goods Hold — Section A', ${d(35)}, 'Production Supervisor',
        'rework', 'Remove incorrect labels and apply correct DOT 4 labels per WI-PKG-005. 100% visual inspection after relabeling.', 'Elena Vasquez', ${d(31)},
        'Remove all incorrect labels. Clean container surfaces. Apply correct DOT 4 label per WI-PKG-005. Submit to QC for 100% label verification (F-PKG-012).',
        'Packaging Lead', ${d(29)}, ${d(30)}, ${d(28)},
        true, '100% label verification per label verification checklist (F-PKG-012)', 'QC Inspector', ${d(27)}, 'pass',
        false, 'Root cause isolated to procedural gap at line changeover. Label verification step added to changeover checklist same day. CAPA not required.',
        'Elena Vasquez', ${d(27)}, 'All 48 containers relabeled and verified per checklist. Changeover SOP updated with label roll verification step. No further corrective action required.',
        ${trail4}::jsonb, NOW() - INTERVAL '35 days', NOW() - INTERVAL '27 days'
      )
    `);

    console.log(`[demo-seed] Seeded 4 NCMR records for userId=${userId}.`);
  } catch (err: any) {
    console.error("[demo-seed] NCMR seed error:", err.message);
  }
}
