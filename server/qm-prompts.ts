export interface QmPromptParams {
  orgName: string;
  orgAddr: string;
  productsServices: string;
  employees: number | string;
  standard: string;
  isIATF: boolean;
  hasDesign: boolean;
  processContext: string;
  todayStr: string;
}

export function buildQmVoiceRules(p: QmPromptParams): string {
  return `
MANDATORY WRITING VOICE — FOLLOW ABSOLUTELY:
1. ORGANIZATIONAL VOICE ONLY. Every sentence describes what ${p.orgName} does or how it operates. Write as senior management explaining their own quality system.
2. NEVER begin any paragraph, clause, or sub-section with phrases like: "ISO requires...", "${p.standard} mandates...", "Per Clause X.X...", "The standard states...", "According to ISO...". These are forbidden.
3. The manual should read as ${p.orgName}'s own documented system — not a commentary on the standard.
4. Use "${p.orgName}" or "The organization" throughout. Never use placeholder text like "[Organization]" or "the company".
5. Reference forms (FM-X.X-X) and procedures (QP-X.X-X) as the documented evidence — the manual states WHAT is done, the procedures explain HOW.
6. Write in full, substantive paragraphs. Minimum 400 words per major clause (4 through 10).

CRITICAL FORMATTING — FOLLOW EXACTLY:
- NO Markdown: no #, no ##, no **, no *, no ---, no backticks
- Major sections: "4  CONTEXT OF THE ORGANIZATION" (number + two spaces + ALL-CAPS title)
- Sub-sections: "4.1  Understanding the Organization and Its Context" (decimal + two spaces + title-case)
- Plain pipe-delimited tables only — NO markdown separator rows
- Bullet points use plain dash "- Item"
- Output is copy-paste ready for Word/PDF — zero cleanup needed`;
}

export function buildQmPartAPrompt(p: QmPromptParams): string {
  const qmVoiceRules = buildQmVoiceRules(p);
  return `You are Isa, ACSI's Lead ISO Auditor AI. Draft PART A of a complete, publication-ready Quality Management System Manual.

ORGANIZATION:
- Name: ${p.orgName}
- Address: ${p.orgAddr}
- Products / Services: ${p.productsServices}
- Employees: ${p.employees}
- Standard: ${p.standard}${p.isIATF ? ":2016 (with ISO 9001:2015 foundation)" : ":2015"}
- Design Responsibility: ${p.hasDesign ? "YES — Design and Development (Clause 8.3) is within scope" : "NO — Design and Development is EXCLUDED. Products manufactured per customer-provided specifications."}
- QMS Processes:
${p.processContext}
${qmVoiceRules}

PART A COVERS: Cover Page → Introduction → Sections 1 through 6

Begin the document immediately with the cover page. No preamble.

═══════════════════════════════════════════════════════════════
COVER PAGE
═══════════════════════════════════════════════════════════════
Output a formal cover page with:
- Organization Name: ${p.orgName}
- Document Title: Quality Management System Manual
- Document Number: QM-001
- Standard: ${p.standard}${p.isIATF ? ":2016" : ":2015"}
- Revision: 0
- Effective Date: ${p.todayStr}
- A 2-sentence scope statement using the organization's actual products/services and location
- Approval signature block with three lines: President / CEO, QMS Management Representative, Lead Auditor — each with a signature line and date field

═══════════════════════════════════════════════════════════════
INTRODUCTION
═══════════════════════════════════════════════════════════════
Write 3 substantive paragraphs: (1) describe ${p.orgName}, its products/services, location, and market; (2) describe the purpose and benefits of the QMS for the organization and its customers; (3) state that the manual is structured around the ${p.standard}${p.isIATF ? ":2016" : ":2015"} standard and note that the Process Interaction Map is in Appendix A.

═══════════════════════════════════════════════════════════════
1  REVISION CONTROL SHEET
═══════════════════════════════════════════════════════════════
Pipe-delimited table with columns: DATE | REV. | DESCRIPTION OF REVISION | WRITTEN BY | APPROVED BY
Row 1: ${p.todayStr} | 0 | Initial Release | QMS Specialist | President/CEO
Row 2: (blank row)
Below table: "Doc No: QM-001    Rev. 0    Effective: ${p.todayStr}"

═══════════════════════════════════════════════════════════════
2  TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════
List every section in the manual: Introduction, 1 through 10, and Appendix A. Format: "Section Number  |  Title"

═══════════════════════════════════════════════════════════════
3  MANUAL ADMINISTRATION
═══════════════════════════════════════════════════════════════
Write 2 paragraphs describing: who owns and controls this manual, how it is distributed and updated, the review frequency, and how controlled copies are identified. Reference Procedure QP-7.5-1 (Documented Information Control).

═══════════════════════════════════════════════════════════════
4  CONTEXT OF THE ORGANIZATION
═══════════════════════════════════════════════════════════════

4.1  Understanding the Organization and Its Context
Write 3 full paragraphs. Describe the internal factors ${p.orgName} considers (e.g., culture, organizational capabilities, resources, technology, process performance) and the external factors (e.g., market trends, regulatory environment, economic conditions, competitive landscape, customer expectations). Explain that these factors are analyzed through a structured SWOT/PESTLE process documented in Form FM-4.1-1 and reviewed at each management review cycle. Write as what the organization actually does.

4.2  Understanding the Needs and Expectations of Interested Parties
Write 2 paragraphs. Identify the relevant interested parties (customers, employees, shareholders/owners, the certification body, regulatory and statutory bodies, suppliers and subcontractors, financial institutions, and the local community). Explain how their needs and expectations are identified, documented, and monitored through the Interested Parties Matrix (FM-4.2-1). Describe how relevant needs are incorporated into the QMS.

4.3  Determining the Scope of the QMS
Write a formal scope statement paragraph using ${p.orgName}'s actual products/services and ${p.orgAddr || "its facility"}. ${p.hasDesign ? "" : `State clearly that Design and Development (Clause 8.3${p.isIATF ? "/IATF 8.3" : ""}) is excluded from this QMS because products are manufactured exclusively to customer-provided specifications.`}
Write a second paragraph listing the factors considered in determining the scope (internal/external issues from 4.1, requirements of interested parties from 4.2, the organization's products and services, and the boundaries and applicability of the QMS).${p.isIATF ? "\nNote that the scope also considers customer-specific requirements (CSRs) from automotive customers and the requirements of IATF 16949:2016." : ""}

4.4  QMS and Its Processes
4.4.1 — Write 3 paragraphs describing the process-based QMS. List each process from the process architecture, its owner, key inputs and outputs. State that process interactions are illustrated in the Process Interaction Map (QPM-001) in Appendix A. Explain how the organization monitors, measures, and continually improves its processes. Address how risks and opportunities are integrated into process management.
4.4.2 — One paragraph stating that the organization determines, maintains, and retains documented information necessary to support process operation and provide confidence that processes are carried out as planned, per Procedure QP-7.5-1.${p.isIATF ? `\nNote IATF 16949 supplemental: ${p.orgName} also maintains a Manufacturing Feasibility review process and Corporate Responsibility Statement as required by customer-specific requirements.` : ""}

═══════════════════════════════════════════════════════════════
5  LEADERSHIP
═══════════════════════════════════════════════════════════════

5.1  Leadership and Commitment
5.1.1 General — Write 3 paragraphs on how top management actively leads and demonstrates commitment to the QMS: establishing policies and objectives, ensuring resource availability, promoting the process approach and risk-based thinking, communicating the importance of QMS effectiveness, directing improvement activities. Reference the Leadership Commitment Statement (FM-5.1-1).${p.isIATF ? " Top management also ensures customer-specific requirements are understood throughout the organization and maintains corporate accountability for product safety and regulatory compliance." : ""}
5.1.2 Customer Focus — Write 2 paragraphs on how top management ensures customer and statutory/regulatory requirements are consistently met, customer satisfaction is measured and acted on, and risks and opportunities affecting product/service conformity are identified and addressed.

5.2  Quality Policy
5.2.1 — Write a full, professional Quality Policy for ${p.orgName}. The policy must: reflect the organization's actual products/services; include commitment to satisfying applicable requirements; include commitment to continual improvement; be appropriate to the context of the organization. Write it as a standalone policy statement that could be posted on a facility wall.
5.2.2 — Write 2 paragraphs on how the Quality Policy is communicated (posted at the facility, included in employee orientation, available on request to interested parties), how its understanding is verified, and how it is reviewed for continued suitability.

5.3  Organizational Roles, Responsibilities and Authorities
Write 3 paragraphs. Describe the top management QMS responsibilities (a–e of the standard): ensuring the QMS achieves intended results, ensuring customer focus, establishing and communicating the Quality Policy, ensuring integration of QMS into business processes, and promoting continual improvement. Identify the Management Representative role and responsibilities. Reference Organization Chart (FM-5.3-1) and the RACI Matrix.${p.isIATF ? " Also reference the Product Safety Representative role required by IATF 16949." : ""}

═══════════════════════════════════════════════════════════════
6  PLANNING
═══════════════════════════════════════════════════════════════

6.1  Actions to Address Risks and Opportunities
6.1.1 — Write 2 paragraphs on how ${p.orgName} identifies risks and opportunities by considering its organizational context (Section 4.1) and the needs of interested parties (Section 4.2). Explain the risk identification methodology and how risks are categorized and prioritized. Reference Risk Register (FM-6.1-1).
6.1.2 — Write 2 paragraphs on how actions to address identified risks and opportunities are planned and integrated into QMS processes. Explain how the effectiveness of these actions is evaluated through internal audits, management review, and ongoing monitoring. Reference Corrective Action Procedure (QP-10.2-1) and Risk Assessment Procedure (QP-6.1-1).${p.isIATF ? `\nIATF supplemental: ${p.orgName} maintains a formal risk management process that considers contingency planning, product safety risks, and manufacturing process risk as required by IATF 16949 clause 6.1.2.1.` : ""}

6.2  Quality Objectives and Planning to Achieve Them
Write 2 paragraphs. State that quality objectives are established, maintained, and reviewed in the Quality Objectives Register (FM-6.2-1). This register documents each objective, its measurement method, responsible party, and review frequency. Objectives are consistent with the Quality Policy and are measurable and communicated throughout the organization. The register is reviewed and updated at each management review cycle and whenever significant changes to the QMS occur. Do NOT list specific objectives — reference the register only.

6.3  Planning of Changes
Write 1 substantive paragraph. Describe how ${p.orgName} plans and controls changes to the QMS: identifying the purpose and potential consequences of changes, ensuring resource availability, assigning responsibilities, and maintaining QMS integrity during change. Reference Change Management Procedure (QP-6.3-1).

END PART A HERE. Do not write Section 7 or beyond. End your output cleanly after Section 6.3.`;
}

export function buildQmPartBPrompt(p: QmPromptParams): string {
  const qmVoiceRules = buildQmVoiceRules(p);
  return `You are Isa, ACSI's Lead ISO Auditor AI. This is PART B of the Quality Management System Manual for ${p.orgName}.

CONTINUE IMMEDIATELY FROM SECTION 7. Do NOT repeat the cover page, introduction, or sections 1-6. Start directly with the Section 7 heading.

ORGANIZATION:
- Name: ${p.orgName}
- Standard: ${p.standard}${p.isIATF ? ":2016" : ":2015"}
- Design Responsibility: ${p.hasDesign ? "YES — in scope" : "NO — excluded"}
- Products / Services: ${p.productsServices}
${qmVoiceRules}

═══════════════════════════════════════════════════════════════
7  SUPPORT
═══════════════════════════════════════════════════════════════

7.1  Resources
7.1.1 General — Write 1 paragraph on how ${p.orgName} determines and provides the resources needed for QMS establishment, implementation, maintenance, and continual improvement, considering both internal capabilities and resource constraints.
7.1.2 People — Write 1 paragraph on the organization's commitment to providing competent, adequate personnel for effective QMS operation and process control.
7.1.3 Infrastructure — Write 1 paragraph on facilities, equipment, and technology maintained by ${p.orgName} to achieve product conformity. Reference Preventive Maintenance Procedure (PM-7.1.3-1).
7.1.4 Environment for Process Operation — Write 1 paragraph on the physical, social, and psychological work environment maintained to achieve process conformity, including safety, cleanliness, and ergonomics.
7.1.5 Monitoring and Measurement Resources — Write 2 paragraphs on the calibration program: what instruments are calibrated, the calibration cycle, records maintained, and traceability to national/international standards. Reference Calibration Procedure (QP-7.1.5-1) and Calibration Log (FM-7.1.5-1).${p.isIATF ? " Include reference to measurement system analysis (MSA) as required by IATF 16949 clause 7.1.5.1." : ""}
7.1.6 Organizational Knowledge — Write 1 paragraph on how ${p.orgName} identifies, maintains, and shares the organizational knowledge necessary to operate its processes and achieve product/service conformity.

7.2  Competence
Write 2 paragraphs on the competence management process: how required competencies are defined for each role, how employee competency is assessed, how training gaps are addressed, and how training effectiveness is verified. Reference Training and Competence Procedure (QP-7.2-1) and Training Records (FM-7.2-1).${p.isIATF ? `\nIATF supplemental: ${p.orgName} also maintains documented processes for on-the-job training (OJT) and maintains training records for all personnel affecting product quality per IATF 16949 clause 7.2.1 and 7.2.3.` : ""}

7.3  Awareness
Write 1 paragraph describing how all personnel are made aware of: the Quality Policy, the quality objectives relevant to their role, their contribution to QMS effectiveness (including the benefits of improved performance), and the implications of not conforming to QMS requirements. Reference Awareness Communication (FM-7.3-1).

7.4  Communication
Write 2 paragraphs on internal and external communication: what is communicated, who communicates it, to whom, when, and through which channels. Reference Communication Plan (QP-7.4-1).

7.5  Documented Information
7.5.1 General — Write 1 paragraph listing the documented information ${p.orgName} maintains and retains (including all mandatory documents and records required by ${p.standard}${p.isIATF ? ":2016" : ":2015"}).
7.5.2 Creating and Updating — Write 1 paragraph on identification (title, document number, date), format, media, and the review and approval process for documents. Reference Documented Information Control Procedure (QP-7.5-1).
7.5.3 Control of Documented Information — Write 2 paragraphs on distribution, access control, storage, protection, retrieval, retention periods, and disposition of documented information. Reference QP-7.5-1.${p.isIATF ? " Include note on IATF 16949 clause 7.5.3.2 requirements for record retention to meet statutory, regulatory, and customer-specified retention requirements." : ""}

═══════════════════════════════════════════════════════════════
8  OPERATION
═══════════════════════════════════════════════════════════════

8.1  Operational Planning and Control
Write 2 paragraphs on how ${p.orgName} plans, implements, controls, maintains, and reviews its operational processes. Describe criteria for process control, resources, documented information, monitoring activities, and control of outsourced processes.${p.isIATF ? `\nIATF supplemental: ${p.orgName} conducts manufacturing feasibility reviews for new products and changes using Form FM-8.1-1. Contingency plans are maintained per IATF 16949 clause 8.1.1.` : ""}

8.2  Requirements for Products and Services
8.2.1 Customer Communication — Write 2 paragraphs on how ${p.orgName} communicates with customers regarding product/service information, order handling, customer feedback, complaints, customer property, and contingency actions.${p.isIATF ? " Include processes for communicating with customers on customer-specific requirements, PPAP submissions, and production part approval." : ""}
8.2.2 Determining Requirements — Write 1 paragraph on how customer requirements (including delivery, post-delivery, and statutory/regulatory requirements) are identified. Reference Contract Review Procedure (QP-8.2-1) and Customer Requirements Form (FM-8.2-1).
8.2.3 Review of Requirements — Write 2 paragraphs on the contract review process conducted before committing to supply: confirming customer requirements, resolving differences, and ensuring capability to meet requirements. Reference Contract Review Records (FM-8.2-2).
8.2.4 Changes to Requirements — Write 1 paragraph on how changes to product/service requirements are communicated within the organization and documented information is updated.

8.3  Design and Development
${p.hasDesign
  ? `8.3.1 General — Write 1 paragraph on the design and development process.
8.3.2 Planning — Write 2 paragraphs on design planning: stages, review/verification/validation activities, responsibilities, and interfaces. Reference Design and Development Procedure (QP-8.3-1).
8.3.3 Inputs — Write 1 paragraph on design inputs: functional and performance requirements, statutory/regulatory requirements, previous design information, and standards.
8.3.4 Controls — Write 1 paragraph on design reviews, verification, and validation activities.
8.3.5 Outputs — Write 1 paragraph on design outputs meeting input requirements and providing information for production.
8.3.6 Changes — Write 1 paragraph on identification, review, control, and authorization of design changes.`
  : `Design and Development is excluded from the scope of the QMS for ${p.orgName}. The organization manufactures products exclusively per customer-provided specifications and drawings. This exclusion is documented and justified in the QMS Scope Statement (Section 4.3) and in the Design Exclusion Justification (QP-8.3-Exclusion).`
}

8.4  Control of Externally Provided Processes, Products and Services
8.4.1 General — Write 2 paragraphs on the supplier qualification process: criteria for supplier selection, evaluation, and re-evaluation; the Approved Supplier List (FM-8.4-1); and the monitoring of supplier performance. Reference Supplier Evaluation Procedure (QP-8.4-1).${p.isIATF ? " Include reference to IATF 16949 requirement to cascade QMS and customer-specific requirements to all levels of the supply chain." : ""}
8.4.2 Type and Extent of Control — Write 1 paragraph on the inspection, verification, and monitoring activities applied to externally provided products based on risk and supplier performance.
8.4.3 Information for External Providers — Write 1 paragraph on the purchasing information communicated to suppliers: specifications, process requirements, equipment requirements, and QMS requirements.

8.5  Production and Service Provision
8.5.1 Control of Production and Service Provision — Write 3 paragraphs on the controlled conditions maintained during production: documented work instructions, use of monitoring/measuring equipment, implementation of monitoring and measurement activities, use of suitable infrastructure, qualified personnel, and validation/revalidation of processes.${p.isIATF ? " Reference the Control Plan (QP-8.5.1-CP) as the primary document defining process controls for each product. Include reference to IATF 16949 clause 8.5.1.1 (Control Plan) requirements." : ""}
8.5.2 Identification and Traceability — Write 1 paragraph on product identification throughout production from receipt through delivery and on traceability where required. Reference Identification and Traceability Procedure (QP-8.5.2-1).
8.5.3 Property Belonging to Customers or External Providers — Write 1 paragraph on the identification, verification, protection, and safeguarding of customer or external provider property.
8.5.4 Preservation — Write 1 paragraph on how ${p.orgName} preserves product conformity during internal processing and delivery to intended destination.
8.5.5 Post-Delivery Activities — Write 1 paragraph on post-delivery activities including warranty, maintenance, recycling/disposal requirements, and customer feedback. Reference Post-Delivery Procedure (QP-8.5.5-1).
8.5.6 Control of Changes — Write 1 paragraph on how unplanned and planned changes to production processes are reviewed, authorized, and documented to ensure continued conformity. Reference Change Control Procedure (QP-6.3-1).

8.6  Release of Products and Services
Write 2 paragraphs on final inspection and acceptance criteria, who has authority to release product, and what documented evidence is retained. Reference Final Inspection Procedure (QP-8.6-1) and Final Inspection Record (FM-8.6-1).

8.7  Control of Nonconforming Outputs
Write 2 paragraphs on how nonconforming products are identified, segregated, communicated, and dispositioned (use-as-is with concession, rework, scrap, or return to supplier). Describe how nonconformances trigger corrective action. Reference Nonconformance Procedure (QP-8.7-1) and NCR Form (FM-8.7-1).

═══════════════════════════════════════════════════════════════
9  PERFORMANCE EVALUATION
═══════════════════════════════════════════════════════════════

9.1  Monitoring, Measurement, Analysis and Evaluation
9.1.1 General — Write 2 paragraphs on what ${p.orgName} monitors and measures, the methods used, when monitoring/measurement is performed, and when results are analyzed and evaluated. Reference KPI Dashboard (FM-9.1-1).
9.1.2 Customer Satisfaction — Write 2 paragraphs on how customer satisfaction is measured (surveys, complaint rates, on-time delivery metrics, customer scorecards) and how the results drive improvement actions. Reference Customer Satisfaction Survey (FM-9.1.2-1).
9.1.3 Analysis and Evaluation — Write 1 paragraph on the data analysis methods used (trending, statistical techniques, root cause analysis) to evaluate QMS performance and identify improvement opportunities.

9.2  Internal Audit
Write 3 paragraphs on the internal audit program: how the audit schedule is established, how auditor independence is ensured, how audit findings are reported and followed up, and how audit results feed into management review. Reference Internal Audit Procedure (QP-9.2-1), Audit Plan (FM-9.2-1), and Audit Report (FM-9.2-2).${p.isIATF ? " Include note that IATF 16949 requires a layered process audit (LPA) approach and product audits in addition to system audits." : ""}

9.3  Management Review
9.3.1 General — Write 1 paragraph on the frequency and purpose of management reviews: ensuring the QMS remains suitable, adequate, and effective; identifying opportunities for improvement; assessing the need for changes.
9.3.2 Management Review Inputs — Write 2 paragraphs listing and explaining all required inputs to management review: status of actions from previous reviews; changes in external/internal issues; QMS performance information (customer satisfaction, quality objectives, process performance, product/service conformity, nonconformities, audit results, supplier performance); adequacy of resources; effectiveness of risk/opportunity actions; and improvement opportunities. Reference Management Review Agenda (FM-9.3-1).
9.3.3 Management Review Outputs — Write 2 paragraphs on the decisions and actions that result from management reviews: opportunities for improvement, resource needs, and QMS changes. Describe how decisions are documented, communicated, and tracked. Reference Management Review Minutes (FM-9.3-2).

═══════════════════════════════════════════════════════════════
10  IMPROVEMENT
═══════════════════════════════════════════════════════════════

10.1  General
Write 1 paragraph on ${p.orgName}'s commitment to continually improving the suitability, adequacy, and effectiveness of the QMS — including consideration of analysis results, audit findings, and management review outputs.

10.2  Nonconformity and Corrective Action
Write 3 paragraphs on the full corrective action process: reacting to nonconformity (containment and correction); determining root cause; implementing corrective actions; verifying effectiveness of actions; updating risk register and documented information as needed; sharing lessons learned. Reference Corrective Action Procedure (QP-10.2-1), Corrective Action Request Form (FM-10.2-1), and 8D Problem Solving Report (FM-10.2-2).${p.isIATF ? `\nIATF supplemental: ${p.orgName} utilizes AIAG-recommended problem-solving methodologies (8D, 5-Why, Fishbone/Ishikawa) and ensures timely customer notification of corrective actions per customer-specific requirements.` : ""}

10.3  Continual Improvement
Write 2 paragraphs on the systematic approach to continual improvement: using data analysis, internal audits, management reviews, employee suggestions, Kaizen events, and benchmarking to identify and act on improvement opportunities. Reference Improvement Register (FM-10.3-1).

═══════════════════════════════════════════════════════════════
APPENDIX A — PROCESS INTERACTION DIAGRAM
═══════════════════════════════════════════════════════════════
Write 2 paragraphs. State that the QMS Process Interaction Map (QPM-001) is maintained as a separate controlled document and is available in the Document Management System. Describe what the map illustrates (all core/customer-oriented processes, support processes, and management processes and their interactions, inputs, and outputs).
Then list each process from the process architecture below with a one-sentence description of its inputs → activity → outputs:
${p.processContext}

OUTPUT: End the document cleanly after Appendix A. Do not add any commentary, preamble, or remarks.`;
}
