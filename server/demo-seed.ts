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
    legalRequirement: "OSHA General Duty Clause §5(a)(1); OSHA Ergonomics Guidelines for Material Handling",
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
    legalRequirement: "OSHA 29 CFR 1910.120 (HAZWOPER); Ohio EPA SPCC regulations; EPCRA §302–304 (SARA Title III)",
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
    legalRequirement: "OSHA General Duty Clause §5(a)(1); ISO 45001:2018 §6.1.2 (psychosocial hazards)",
    iso45001Clause: "6.1.2", notes: "ISO 45001:2021 amendment explicitly includes psychosocial hazards within §6.1.2 scope.",
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
