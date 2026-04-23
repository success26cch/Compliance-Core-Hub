/**
 * Production demo seed — creates CCI Chemical demo data if the DB is empty.
 * Called once on server startup. Idempotent: exits immediately if data exists.
 */
import { db } from "./db";
import { isoProjects, users, nonconformances } from "@shared/schema";
import { eq, count } from "drizzle-orm";

const DEMO_USER_ID_PROD = "a60ec465-679d-4967-9e0f-e7a36d465a1c";
const DEMO_USER_ID_DEV  = "c2df200b-5806-4310-ba66-e127f2095625";
const EBENI_USER_ID     = "54320068";

const CCI_PROCESSES = [{"kpi":"Quote acceptance rate ≥ 70%","row":"COP","name":"Sales & Customer Relations","site":"REMOTE_SITE","owner":"Sales Manager","inputs":"Customer RFQ, product inquiries, OEM requirements","clauses":["8.2","8.2.1","8.2.2"],"outputs":"Accepted orders, customer contracts, pricing agreements","sequence":1},{"kpi":"PPAP on-time ≥ 95%","row":"COP","name":"APQP / New Program Launch","site":"PLANT","owner":"Program Manager","inputs":"Customer APQP requirements, feasibility study","clauses":["8.3","8.3.2","8.3.4","8.3.5"],"outputs":"PPAP package, approved production part","sequence":3},{"kpi":"First-pass yield ≥ 98%","row":"COP","name":"Chemical Blending","site":"PLANT","owner":"Production Supervisor","inputs":"Raw materials, batch formula, work order","clauses":["8.5","8.6","8.7"],"outputs":"Bulk blended fluid, batch record","sequence":4},{"kpi":"Lab TAT ≤ 4 hours","row":"COP","name":"Analytical Testing","site":"PLANT","owner":"QC Lab Manager","inputs":"Bulk sample, test specification","clauses":["8.6","9.1","7.1.5"],"outputs":"COA, approved/rejected decision","sequence":5},{"kpi":"Line efficiency ≥ 92%","row":"COP","name":"Filling & Packaging","site":"PLANT","owner":"Production Supervisor","inputs":"Approved bulk, containers, labels","clauses":["8.5","8.5.1"],"outputs":"Finished goods, labeled containers","sequence":6},{"kpi":"On-time shipment ≥ 98%","row":"COP","name":"Warehouse & Shipping","site":"REMOTE_SITE","owner":"Warehouse Supervisor","inputs":"Finished goods, shipping orders, customer delivery schedule","clauses":["8.5.4","8.5.5","7.1.3"],"outputs":"Shipped product, delivery confirmation, inventory records","sequence":8},{"kpi":"Approved supplier on-time delivery ≥ 95%","row":"SOP","name":"Supplier Management & Purchasing","site":"PLANT","owner":"Procurement Manager","inputs":"Production schedule, material specs, approved supplier list","clauses":["8.4","8.4.1","8.4.2","8.4.3"],"outputs":"Approved raw materials, supplier scorecards, purchase orders"},{"kpi":"Training completion rate ≥ 95%","row":"SOP","name":"HR, Training & Competency","site":"PLANT","owner":"HR Manager","inputs":"Job descriptions, training needs, competency matrix","clauses":["7.1.2","7.2","7.3"],"outputs":"Trained personnel, competency records, RACI matrix"},{"kpi":"Planned maintenance completion ≥ 98%","row":"SOP","name":"Equipment Maintenance & Calibration","site":"PLANT","owner":"Maintenance Supervisor","inputs":"Preventive maintenance schedule, calibration register","clauses":["7.1.3","7.1.4","7.1.5","8.5.1"],"outputs":"Maintained equipment, calibration certificates, MSA results"},{"kpi":"Document review compliance 100%","row":"SOP","name":"Document & Records Control","site":"PLANT","owner":"Quality Manager","inputs":"Document requests, change notices, record retention schedule","clauses":["7.5","7.5.1","7.5.2","7.5.3"],"outputs":"Controlled documents, updated records, change history"},{"kpi":"Annual quality objectives achieved ≥ 80%","row":"MOP","name":"Management & Strategic Planning","site":"PLANT","owner":"General Manager","inputs":"Business plan, stakeholder inputs, market data","clauses":["5.1","5.2","6.1","6.2","9.3"],"outputs":"Quality policy, strategic objectives, resource allocation"},{"kpi":"Audit schedule compliance 100% · zero repeat findings","row":"MOP","name":"Internal Audit & Management Review","site":"PLANT","owner":"Quality Manager","inputs":"Audit schedule, process KPIs, previous MR minutes","clauses":["9.2","9.3","10.2","10.3"],"outputs":"Audit reports, management review minutes, improvement actions"}];

const CCI_PESTLE = {"political":{"factors":"Trade policies affecting chemical imports (glycol ethers, solvents)\nFMVSS 116 and DOT regulatory oversight\nOEM supplier development mandates (IATF 16949 push-down)\nEnvironmental regulations (RCRA, CERCLA) affecting waste disposal","opportunities":"Federal infrastructure investment increasing automotive production demand\nEPA push toward sustainable chemistry creates product differentiation opportunity","threats":"Tariffs on imported chemical raw materials increasing COGS\nIncreasing regulatory compliance costs"},"economic":{"factors":"Automotive production volumes and OEM build schedules\nRaw material commodity prices (glycol ethers, borate esters, MEK)\nInflation impact on logistics and labor costs\nInterest rates affecting CapEx financing for capacity expansion","opportunities":"Reshoring of automotive manufacturing driving domestic chemical supplier demand\nGrowth in EV thermal management fluids (new product category)","threats":"Supply chain disruptions causing raw material shortages\nOEM production curtailments reducing order volumes"},"social":{"factors":"Skilled labor availability in Dayton, OH manufacturing sector\nWorkforce aging and technical knowledge transfer\nCustomer expectations for sustainability and ESG reporting\nSafety culture requirements from OEM customers","opportunities":"Apprenticeship programs with local technical colleges\nDiversity supplier certifications opening new customer opportunities","threats":"Labor market competition from non-automotive manufacturers\nIncreasing safety incident reporting requirements"},"technological":{"factors":"Automation of filling and packaging lines\nSPC and real-time process monitoring capability\nCustomer portal integration requirements (Ford, GM, Stellantis)\nLaboratory information management systems (LIMS)","opportunities":"Inline analytical testing reducing lab turnaround time\nDigital PPAP submission reducing customer approval cycle time","threats":"Obsolescence of legacy batch control systems\nCybersecurity requirements from OEM customers for supplier portals"},"legal":{"factors":"FMVSS 116 (DOT 3/4 brake fluid specification)\nSAE J1703 and ISO 4925 compliance\nOSHA PSM (Process Safety Management) if applicable thresholds met\nProduct liability exposure for safety-critical automotive fluid","opportunities":"Compliance as competitive barrier — smaller competitors unable to meet requirements","threats":"Increasing litigation risk for product quality failures in safety-critical applications"},"environmental":{"factors":"Wastewater treatment for glycol-containing process streams\nHazardous waste generation (spent solvents, off-spec product)\nAir emissions from solvent handling\nSpill containment requirements (SPCC plan)","opportunities":"Development of bio-based or biodegradable formulations for fleet customers\nEnergy efficiency improvements reducing carbon footprint","threats":"Tightening EPA effluent limits for glycol compounds\nIncreasing cost of hazardous waste disposal"}};

const CCI_SWOT = {"strengths":["IATF 16949 certified — preferred supplier status with Tier 1 automotive customers","Long-term OEM-approved formulations (DOT 3, DOT 4, DEX-COOL) reducing qualification risk","Vertically integrated analytical lab with NIST-traceable calibration","Experienced formulation team with 15+ years automotive fluid chemistry expertise","Dedicated APQP/PPAP capability for new program launches"],"weaknesses":["Single manufacturing site — no backup production capacity for surge or disaster recovery","Limited ERP integration — manual data entry between production, QC, and shipping","Aging filling line equipment with increasing downtime frequency","Narrow product portfolio — limited exposure to EV/hybrid thermal management fluids","Key-man dependency: formulation knowledge concentrated in senior chemist"],"opportunities":["EV thermal management fluid development — growing market with few qualified IATF suppliers","Expansion of OEM-direct supply relationships (bypass Tier 1 intermediaries)","Sustainability-driven product line (bio-based glycols, reduced-VOC formulations)","Capacity expansion to capture reshored automotive manufacturing growth in Midwest","Digital PPAP and customer portal integration to reduce approval cycle time"],"threats":["Raw material cost volatility (glycol ethers, borate esters sourced from 2-3 suppliers)","OEM production volume uncertainty affecting demand planning accuracy","Competitive pressure from larger chemical companies with broader portfolios","Increasing IATF surveillance audit requirements and customer-specific requirements burden","Regulatory changes to FMVSS 116 requiring reformulation investment"]};

const CCI_INTERESTED_PARTIES = [{"name":"Ford Motor Company","type":"Customer","needs":"IATF 16949 certification, PPAP Level 3 submissions, Q1 portal compliance, 8D response within 24 hours for field issues","expectations":"Zero defect delivery, OTD ≥ 98%, advance shipping notice (ASN) via EDI, annual supplier scorecard review"},{"name":"General Motors","type":"Customer","needs":"GM-specific CSR compliance, BIQS scorecard performance, Covisint portal submissions","expectations":"IATF 16949 certification, supplier development toward GM standards, corrective action response within 5 business days"},{"name":"Stellantis","type":"Customer","needs":"Supplier Quality Manual compliance, PPAP submissions, AIAG FMEA methodology","expectations":"Zero customer disruptions, containment within 24 hours of quality escape"},{"name":"Tier 1 Automotive Suppliers","type":"Customer","needs":"Consistent product quality (COA with every lot), reliable delivery, technical support for application questions","expectations":"Competitive pricing, flexible order quantities, SDS/TDS documentation"},{"name":"Chemical Raw Material Suppliers","type":"Supplier","needs":"Long-term purchase agreements, timely payment, clear specifications","expectations":"Forecasting information, specification changes with adequate lead time"},{"name":"IATF Certification Body (BSI)","type":"Regulatory","needs":"Compliance with IATF 16949:2016 standard and IATF rules","expectations":"Transparent audit access, corrective action closure within agreed timelines, no major nonconformances at surveillance"},{"name":"Ohio EPA / US EPA","type":"Regulatory","needs":"RCRA compliance (hazardous waste), wastewater permit compliance, air emissions reporting","expectations":"Accurate and timely regulatory reporting, spill response capability (SPCC plan)"},{"name":"OSHA","type":"Regulatory","needs":"Workplace safety compliance (HazCom, PPE, emergency response)","expectations":"Injury recordkeeping (OSHA 300 log), prompt incident investigation and corrective action"},{"name":"CCI Employees","type":"Internal","needs":"Safe working conditions, competitive compensation, career development, clear job expectations","expectations":"Management communication, training investment, ergonomic workplace design"},{"name":"CCI Leadership / Owners","type":"Internal","needs":"Financial performance, business growth, customer retention, regulatory compliance","expectations":"Quality metrics transparency, risk visibility, strategic planning participation"}];

export async function seedDemoDataIfEmpty(): Promise<void> {
  try {
    // Check if any iso_projects exist
    const [{ value: projCount }] = await db.select({ value: count() }).from(isoProjects);
    if (Number(projCount) > 0) {
      console.log(`[demo-seed] iso_projects already has ${projCount} row(s) — skipping seed.`);
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

    // Create the CCI Chemical ISO project
    const [project] = await db.insert(isoProjects).values({
      userId: ownerUserId,
      standard: "IATF 16949",
      phase: 3,
      status: "complete",
      orgName: "CCI Chemical, Inc.",
      orgAddress: "4200 Springboro Pike, Dayton, OH 45439",
      totalEmployees: 85,
      productionEmployees: 55,
      adminEmployees: 30,
      productsServices: "DOT 3 and DOT 4 brake fluids, DEX-COOL engine coolant, OAT coolant, power steering fluid — supplied to Tier 1 and OEM automotive customers",
      manufacturingTech: ["batch_chemical_blending", "automated_fill_line", "automated_inspection", "spc_monitoring"],
      hasDesignResponsibility: true,
      processes: CCI_PROCESSES as any,
      pestleData: CCI_PESTLE as any,
      swotData: CCI_SWOT as any,
      interestedParties: CCI_INTERESTED_PARTIES as any,
      mapColorScheme: "navy-orange",
      coreValues: "Safety First: No production target justifies compromising employee or product safety\nQuality Integrity: Every batch meets specification — no shortcuts, no waivers without authorization\nCustomer Commitment: Our customers' assembly lines depend on us; we treat delivery promises as obligations\nContinuous Improvement: We systematically eliminate waste, defects, and variation\nTeam Accountability: Every person owns their process and speaks up when something is wrong",
      riskPhilosophy: "CCI Chemical takes a risk-based approach to quality management. We proactively identify risks across our process map using PFMEA, control plans, and supplier risk assessments. Risks with high severity or occurrence are escalated to leadership for resource allocation. Opportunities are evaluated through the management review process and incorporated into annual quality objectives.",
    }).returning();

    console.log(`[demo-seed] Created CCI Chemical ISO project id=${project.id} for userId=${ownerUserId}`);

    // Seed sample nonconformances
    const today = new Date();
    const ncs = [
      {
        isoProjectId: project.id,
        userId: ownerUserId,
        title: "Viscometer Cal Failure — Out of Tolerance",
        description: "Cannon-Fenske viscometer #VIS-003 found out of tolerance during annual calibration. Measured viscosity 4.3% above upper control limit on reference standard. All batches tested with this instrument since last calibration are suspect.",
        severity: "major",
        status: "open",
        sourceType: "internal_audit",
        detectedDate: new Date(today.getTime() - 14 * 86400000),
        responsiblePerson: "QC Lab Manager",
        isoClause: "7.1.5",
        immediateContainment: "Quarantined instrument. Identified all lots tested with VIS-003 since last calibration (23 lots). Implemented 100% re-test with calibrated reference viscometer.",
      },
      {
        isoProjectId: project.id,
        userId: ownerUserId,
        title: "Brake Fluid pH Out of Spec — Batch #BF-2024-0312",
        description: "Batch BF-2024-0312 DOT 3 brake fluid failed final QC pH acceptance criterion (7.0–11.5). pH measured at 6.6. Batch placed on hold prior to shipment.",
        severity: "major",
        status: "action_in_progress",
        sourceType: "process_observation",
        detectedDate: new Date(today.getTime() - 21 * 86400000),
        responsiblePerson: "Production Supervisor",
        isoClause: "8.7",
        immediateContainment: "Batch quarantined and tagged nonconforming. No product shipped. Raw material lot trace completed.",
      },
      {
        isoProjectId: project.id,
        userId: ownerUserId,
        title: "Supplier COA Discrepancy — Glycol Ether Lot",
        description: "Incoming glycol ether lot (Supplier: Dow Chemical, Lot GE-2024-441) COA stated purity 99.5%. Internal verification testing measured 97.8%. Discrepancy exceeds 1% tolerance.",
        severity: "minor",
        status: "closed",
        sourceType: "supplier",
        detectedDate: new Date(today.getTime() - 45 * 86400000),
        responsiblePerson: "Procurement Manager",
        isoClause: "8.4.3",
        immediateContainment: "Lot quarantined. Supplier notified. Material returned to supplier.",
        closureDate: new Date(today.getTime() - 20 * 86400000),
        closureNotes: "Supplier acknowledged COA discrepancy. Updated incoming inspection spec to require dual verification. Root cause: supplier lab calibration drift. Supplier submitted 8D.",
      },
    ];

    for (const nc of ncs) {
      await db.insert(nonconformances).values(nc);
    }

    console.log(`[demo-seed] Seeded ${ncs.length} nonconformances.`);
    console.log("[demo-seed] CCI Chemical demo seed complete ✓");
  } catch (err: any) {
    console.error("[demo-seed] Seed error:", err.message);
  }
}
