import Anthropic from "@anthropic-ai/sdk";
import { db } from "../server/db";
import { isoDocuments } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

const ORG = {
  userId: "54320068",
  isoProjectId: 1,
  name: "Precision Parts Manufacturing, LLC",
  standard: "ISO 9001",
  address: "1234 Industrial Blvd, Detroit, MI 48201",
  products: "Precision machined metal components for industrial and automotive applications, including brackets, housings, shafts, and complex turned/milled parts. Serving Tier 1 automotive and industrial OEM customers with tolerances to ±0.0002 inches.",
  employees: 120,
  hasDesign: false,
};

interface ProcedureDef {
  title: string;
  docNum: string;
  clause: string;
  prompt: string;
}

const PROCEDURES: ProcedureDef[] = [
  {
    title: "Risk and Opportunity Management",
    docNum: "QP-6.1-1",
    clause: "6.1",
    prompt: `Draft a complete Quality Procedure (QP-6.1-1) titled "Risk and Opportunity Management" for ISO 9001:2015 Clause 6.1.

Organization: ${ORG.name}
Products: ${ORG.products}
Standard: ${ORG.standard}:2015

Structure EXACTLY as follows:

1. PURPOSE
State the purpose of this procedure in 2–3 sentences.

2. SCOPE
Define what is covered and what is excluded.

3. DEFINITIONS
Define: Risk, Opportunity, Risk Register, Likelihood, Severity, Risk Priority Number (RPN), Residual Risk, SWOT, PESTLE.

4. RESPONSIBILITIES
List role → responsibility in a table: Quality Manager, Quality Director, Process Owners, Top Management.

5. PROCEDURE

5.1 Risk and Opportunity Identification
Describe the process for identifying risks and opportunities from:
- Internal issues (SWOT)
- External issues (PESTLE)
- Interested party requirements
- Process performance data
- Audit findings and customer complaints

5.2 Risk Assessment
Describe the L × S scoring matrix (1–5 likelihood, 1–5 severity, RPN = L × S):
- Low Risk: RPN 1–4 (accept)
- Medium Risk: RPN 5–12 (mitigation plan required)
- High Risk: RPN 15–25 (immediate action, escalate to QD)
Include specific examples for ${ORG.name}.

5.3 Risk Treatment and Action Planning
How mitigation actions are assigned (owner, due date), implemented, and tracked. Reference Risk Register (FM-6.1-1).

5.4 Monitoring and Review
Quarterly review by Quality Manager; annual review at Management Review. Update Risk Register.

5.5 Opportunities for Improvement
How opportunities are captured, evaluated, and linked to quality objectives.

6. RELATED DOCUMENTS
List: FM-6.1-1 (Risk & Opportunity Register), QP-9.3-1 (Management Review), QP-10.3-1 (Continual Improvement), QP-6.2-1 (Quality Objectives).

7. RECORDS
List records retained, retention periods (minimum 3 years), and custodian.

8. REVISION HISTORY
| Rev | Date | Description | Author | Approver |
|-----|------|-------------|--------|---------|
| 0 | [today] | Initial Release | Quality Manager | Quality Director |

Write comprehensive, practical, audit-ready content. Use ${ORG.name} specific context. Minimum 800 words. Output document content only.`,
  },
  {
    title: "Quality Objectives and Planning",
    docNum: "QP-6.2-1",
    clause: "6.2",
    prompt: `Draft a complete Quality Procedure (QP-6.2-1) titled "Quality Objectives and Planning to Achieve Them" for ISO 9001:2015 Clause 6.2.

Organization: ${ORG.name} — precision machined metal components for automotive/industrial OEMs, 120 employees, Detroit MI.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE
3. DEFINITIONS (Quality Objective, KPI, SMART, Baseline)
4. RESPONSIBILITIES (table: CEO/President, Quality Director, Quality Manager, Process Owners, Dept Managers)
5. PROCEDURE

5.1 Setting Quality Objectives
Criteria for SMART objectives. Describe the annual objective-setting process, alignment with quality policy, and how objectives address risks/opportunities. List 5 example objectives specific to a precision machining company:
- First Pass Yield ≥ 98%
- On-Time Delivery ≥ 95%
- Customer Escape Rate = 0 ppm
- Internal Scrap Rate ≤ 2%
- Corrective Action Closure ≤ 30 days

5.2 Objective Deployment
How objectives are communicated to relevant functions and personnel. Reference Quality Objectives Register (FM-6.2-1).

5.3 Monitoring and Measurement
Monthly KPI review by department owners; quarterly trend analysis; annual review at Management Review. Reference KPI Dashboard (FM-9.1-1).

5.4 Planning to Achieve Objectives
For each objective: what will be done, resources required, responsible person, completion date, evaluation method.

5.5 Changes to Objectives
Process for revising objectives mid-year if significant business change occurs.

6. RELATED DOCUMENTS
7. RECORDS (FM-6.2-1 Quality Objectives Register, FM-9.1-1 KPI Dashboard — 3-year retention)
8. REVISION HISTORY

Minimum 700 words. Audit-ready. No placeholders. Output document only.`,
  },
  {
    title: "Planning and Control of Changes",
    docNum: "QP-6.3-1",
    clause: "6.3",
    prompt: `Draft Quality Procedure QP-6.3-1 "Planning and Control of Changes" for ISO 9001:2015 Clause 6.3.

Organization: ${ORG.name} — precision CNC machining, 120 employees, Detroit MI. Products manufactured per customer specifications (no design responsibility).
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE — what changes are covered (processes, equipment, materials, suppliers, documentation, QMS scope, key personnel, customer requirements)
3. DEFINITIONS (Change Notice, Temporary Change, Permanent Change, Change Initiator, Change Review Board)
4. RESPONSIBILITIES (table)
5. PROCEDURE

5.1 Change Identification and Initiation
How changes are identified and submitted. Form FM-6.3-1 (Engineering Change Request / Change Notice).

5.2 Change Classification
- Minor (cosmetic, documentation-only): Quality Manager approval
- Moderate (process parameter, tooling, supplier): Quality Director approval
- Major (new process, customer notification required, re-qualification): Customer notification + Quality Director + President

5.3 Change Impact Assessment
Risk analysis before implementation. Link to QP-6.1-1.

5.4 Customer Notification
For changes affecting form, fit, function, or customer-specific requirements — customer approval required before implementation. Specific language for automotive OEMs.

5.5 Implementation and Verification
Pilot run, first article inspection (FAI), documented sign-off. Update all affected documents.

5.6 Temporary Changes
Time-limited deviations — customer approval, expiration date, reversion plan.

5.7 Records
Change history maintained in ECN Log.

6. RELATED DOCUMENTS
7. RECORDS
8. REVISION HISTORY

Minimum 700 words. Output document only.`,
  },
  {
    title: "Monitoring and Measurement Resources — Calibration",
    docNum: "QP-7.1.5-1",
    clause: "7.1.5",
    prompt: `Draft Quality Procedure QP-7.1.5-1 "Monitoring and Measurement Resources — Calibration" for ISO 9001:2015 Clause 7.1.5.

Organization: ${ORG.name} — precision machined metal components (tolerances to ±0.0002 inches), 120 employees, Detroit MI. Uses CMMs, calipers, micrometers, height gauges, optical comparators.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE — all measuring and test equipment (M&TE) used to demonstrate product conformance
3. DEFINITIONS (Calibration, Traceability, Measurement Uncertainty, Out-of-Tolerance (OOT), Recall, M&TE)
4. RESPONSIBILITIES (table: Quality Manager, Calibration Technician, Operators, Department Managers)
5. PROCEDURE

5.1 Equipment Identification and Registration
Master calibration list (FM-7.1.5-1) — assign unique ID to every piece of M&TE. Record: description, manufacturer, model, serial number, location, calibration interval.

5.2 Calibration Intervals
Standard intervals for precision machining:
- CMM: 12 months (external lab, NIST-traceable)
- Calipers: 6 months
- Micrometers: 6 months
- Height gauges: 6 months
- Optical comparators: 12 months
- Gage blocks: 24 months
- Thread gages: 12 months

5.3 Calibration Methods
Internal calibration using gage blocks (procedure WI-7.1.5-1). External calibration through accredited laboratory (ISO 17025). Calibration certificates retained.

5.4 Calibration Status Identification
Color-coded calibration stickers: Green (in calibration), Red (out of calibration — do not use). Sticker displays: ID, calibration date, due date.

5.5 Out-of-Tolerance (OOT) Condition
Immediate quarantine. Investigate impact on product inspected since last valid calibration. Initiate corrective action (QP-10.2-1). Customer notification if affected product was shipped.

5.6 Lost or Damaged Equipment
Report procedure, replacement, impact assessment.

5.7 Reference Standards
NIST-traceable standards used. Traceability documented on calibration certificates.

6. RELATED DOCUMENTS
7. RECORDS (FM-7.1.5-1 Master Calibration List, Calibration Certificates — minimum 5 years)
8. REVISION HISTORY

Minimum 800 words. Highly specific to precision machining. Output document only.`,
  },
  {
    title: "Competence, Training and Awareness",
    docNum: "QP-7.2-1",
    clause: "7.2",
    prompt: `Draft Quality Procedure QP-7.2-1 "Competence, Training and Awareness" for ISO 9001:2015 Clause 7.2 and 7.3.

Organization: ${ORG.name} — precision CNC machining, 120 employees (production, quality, engineering, admin), Detroit MI.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE
3. DEFINITIONS (Competence, Training Needs Analysis, Qualification, OJT, Effectiveness Verification)
4. RESPONSIBILITIES (table: HR Manager, Quality Manager, Department Managers, Training Coordinators, Supervisors)
5. PROCEDURE

5.1 Competency Requirements
How competency requirements are determined for each role (job description, skill matrix). Reference Competency Matrix (FM-7.2-1).

5.2 Training Needs Analysis
Annual TNA process — identify gaps between required and actual competence. Inputs: performance reviews, audit findings, new equipment/processes, customer requirements.

5.3 Training Planning and Scheduling
Training calendar. Types: new hire orientation, on-the-job training (OJT), external technical training (CNC operation, GD&T, blueprint reading, CMM programming), quality system training, safety training.

5.4 New Hire Onboarding
Checklist-based onboarding (FM-7.2-2). Probationary period competency verification.

5.5 Training Delivery and Documentation
Record all training in Training Log (FM-7.2-3): employee name, training topic, trainer, date, pass/fail, signature.

5.6 Training Effectiveness Verification
Methods: supervisor observation, test/quiz, product quality metrics, first-pass yield. Timeline: 30-60 days post-training. Documented on Training Record.

5.7 Awareness (ISO 7.3)
How all employees are made aware of: quality policy, their contribution to QMS effectiveness, implications of not conforming. Methods: posted policy, toolbox talks, monthly quality meetings, QMS bulletin board.

5.8 External Training and Certifications
Authorization process, cost approval, certification maintenance (AIAG, ASQ, NIMS, etc.).

5.9 Contract/Temporary Workers
How temporary workers receive required training before beginning work.

6. RELATED DOCUMENTS
7. RECORDS (Training records — minimum 3 years or duration of employment + 1 year)
8. REVISION HISTORY

Minimum 800 words. Output document only.`,
  },
  {
    title: "Internal and External Communication",
    docNum: "QP-7.4-1",
    clause: "7.4",
    prompt: `Draft Quality Procedure QP-7.4-1 "Internal and External Communication" for ISO 9001:2015 Clause 7.4.

Organization: ${ORG.name} — precision machined metal components, 120 employees, automotive/industrial OEM supplier, Detroit MI.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE — all QMS-related communications, internal and external
3. DEFINITIONS
4. RESPONSIBILITIES (table)
5. PROCEDURE

5.1 Communication Planning
The organization determines: what to communicate, when, to whom, how, who communicates. Reference Communication Matrix (FM-7.4-1).

5.2 Internal Communication
Topics, frequency, audience, method:
- Quality policy & objectives: all employees, annual, posted + meetings
- KPI performance: department managers, monthly, KPI dashboard
- Audit findings: process owners + management, within 5 days of audit
- NCRs/CAPA status: quality + operations, weekly
- Customer complaints: quality + sales + management, within 24 hours
- Process changes: affected personnel, before implementation
- Management review outputs: all department managers, within 5 business days

5.3 External Communication
- Customer feedback requests: quarterly surveys (FM-9.1.2-1)
- Supplier performance notifications: quarterly scorecards
- Customer complaints: acknowledge within 24 hours, 8D within 10 business days
- Regulatory compliance communications
- Certification body communications (audits, corrective actions, surveillance)

5.4 Customer Notification Requirements
Specific automotive OEM communication protocols — when to notify customer (process changes, product non-conformances, corrective actions). Reference QP-8.2-1.

5.5 Communication Records
Document significant QMS communications. Reference Communication Log (FM-7.4-2).

5.6 Escalation Protocol
Procedure for escalating urgent quality concerns to top management.

6. RELATED DOCUMENTS
7. RECORDS
8. REVISION HISTORY

Minimum 700 words. Output document only.`,
  },
  {
    title: "Customer Requirements and Contract Review",
    docNum: "QP-8.2-1",
    clause: "8.2",
    prompt: `Draft Quality Procedure QP-8.2-1 "Customer Requirements Review and Contract Review" for ISO 9001:2015 Clause 8.2.

Organization: ${ORG.name} — precision machined metal components for Tier 1 automotive and industrial OEMs, tolerances to ±0.0002 inches, 120 employees, Detroit MI. Products manufactured per customer print and specifications.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE — all new orders, repeat orders with changes, and engineering change notifications from customers
3. DEFINITIONS (RFQ, Contract, Purchase Order, Engineering Change Notice ECN, Customer-Specific Requirements CSRs, APQP)
4. RESPONSIBILITIES (table: Sales Manager, Quality Engineer, Engineering/Manufacturing Engineering, Quality Director)
5. PROCEDURE

5.1 Customer Inquiry and RFQ Handling
How RFQs are received, logged, and assigned. Initial feasibility check (can we make it? do we have the equipment/capability?).

5.2 Pre-Quote Review
Technical review: drawing review, material specifications, tolerance analysis, special characteristics identification (KPCs/CTQs), packaging and delivery requirements. Quote Review Form (FM-8.2-1).

5.3 Order Confirmation / Contract Review
Before accepting a purchase order:
- Confirm requirements are clearly defined
- Differences between quote and PO resolved
- Delivery lead time acceptable
- All specifications and revisions confirmed
- Special process requirements identified (heat treat, plating, surface finish)
Contract Review Checklist (FM-8.2-2).

5.4 Changes to Orders
Customer ECN handling: review impact, update traveler/router, notify production and quality, obtain customer approval if needed.

5.5 Customer-Specific Requirements (CSRs)
Automotive OEM-specific requirements documentation and communication to relevant functions.

5.6 Communication to Customer
Quote submission, order acknowledgment, delivery commitment, specification questions.

5.7 Statutory and Regulatory Requirements
How legal/regulatory requirements related to products are identified and met.

6. RELATED DOCUMENTS
7. RECORDS (Quote Log, Contract Review Records — 3 years, or 1 year after last shipment on that part)
8. REVISION HISTORY

Minimum 800 words. Highly specific to precision machining / automotive supply chain. Output document only.`,
  },
  {
    title: "Control of External Providers — Supplier Management",
    docNum: "QP-8.4-1",
    clause: "8.4",
    prompt: `Draft Quality Procedure QP-8.4-1 "Control of Externally Provided Processes, Products and Services" for ISO 9001:2015 Clause 8.4.

Organization: ${ORG.name} — precision machined metal components, automotive/industrial OEM supplier, Detroit MI. Purchases raw materials (bar stock, castings), tooling, outside services (heat treat, plating, grinding). No design responsibility.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE — raw material suppliers, outside processing vendors, tooling/equipment suppliers, subcontractors
3. DEFINITIONS (External Provider, Approved Supplier List ASL, Supplier Qualification, SCAR, Incoming Inspection, Critical Supplier)
4. RESPONSIBILITIES (table: Purchasing Manager, Quality Manager, Receiving Inspector, Department Managers)
5. PROCEDURE

5.1 Supplier Qualification
New supplier approval process:
- Supplier questionnaire (FM-8.4-1)
- Quality system evaluation (ISO/IATF certification preferred, desk audit, on-site audit)
- Sample submission and inspection
- Approval criteria and approval levels
- Addition to Approved Supplier List (FM-8.4-2)

5.2 Approved Supplier List (ASL) Management
Maintenance, review frequency, removal criteria.

5.3 Purchasing Information
What must be specified on purchase orders: material specification, revision, quantity, delivery date, inspection requirements, certifications required (CoC, material certs, test reports).

5.4 Incoming Inspection
Receiving inspection procedure for:
- Raw material (dimensional check, material cert review, visual)
- Tooling and equipment
- Outside-processed parts (heat treat results, plating thickness, etc.)
Sampling plans based on supplier history. Reference Receiving Inspection Record (FM-8.4-3).

5.5 Supplier Performance Monitoring
Quarterly supplier scorecard: On-Time Delivery (target ≥92%), PPM/Incoming Rejection Rate (target 0), Responsiveness to corrective actions. Reference Supplier Scorecard (FM-8.4-4).

5.6 Supplier Corrective Action (SCAR)
When to issue SCAR, response timeframes (10 business days for 8D), escalation, and potential removal from ASL.

5.7 Consigned/Customer-Supplied Material
How customer-supplied materials (customer-furnished material, CFM) are identified, inspected, stored, and controlled.

5.8 Critical and Single-Source Suppliers
Additional controls, dual-sourcing strategy, supply continuity planning.

6. RELATED DOCUMENTS
7. RECORDS
8. REVISION HISTORY

Minimum 900 words. Output document only.`,
  },
  {
    title: "Identification and Traceability",
    docNum: "QP-8.5.2-1",
    clause: "8.5.2",
    prompt: `Draft Quality Procedure QP-8.5.2-1 "Identification and Traceability" for ISO 9001:2015 Clause 8.5.2.

Organization: ${ORG.name} — precision machined metal components, automotive/industrial OEMs, tolerances to ±0.0002", 120 employees, Detroit MI.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE — all raw materials, work-in-process, finished goods, and non-conforming material
3. DEFINITIONS (Lot Number, Traveler/Router, Identification Tag, Traceability, FIFO, Material Cert)
4. RESPONSIBILITIES (table)
5. PROCEDURE

5.1 Incoming Material Identification
- Supplier lot number / material heat number maintained
- Receiving tag applied (FM-8.5.2-1) with: part number, revision, PO number, quantity, date received, supplier, material cert reference
- Material certs filed and linked to lot

5.2 In-Process Identification
- Traveler/Router accompanies parts through all operations
- Part number and revision on all tooling/fixture
- Machine setup sheets reference part number and revision
- In-process status tags: awaiting inspection, in-process, hold

5.3 Finished Goods Identification
- Inspection-approved tag (Green) applied with: part number, revision, quantity, lot number, inspection date, inspector ID
- ERP system updated with lot number and location
- Packaging label requirements per customer specification

5.4 Non-Conforming Material Identification
- Immediate RED tag: "HOLD — DO NOT USE"
- Physical segregation to quarantine area
- Reference QP-8.7-1 for disposition

5.5 Traceability Requirements
- Lot traceability: link from finished part back to raw material heat number
- Record linkage: part number → PO → supplier → material cert → lot → operations performed → inspection results → ship date → customer PO
- Automotive OEM traceability requirements (ability to recall and notify)

5.6 Serialization (where required)
For customer-required serialized parts: serial number assignment, recording, and tracking.

5.7 FIFO (First In, First Out)
How FIFO is maintained in raw material storage, WIP, and finished goods.

5.8 Preservation
Environmental controls for stored materials (temperature, humidity, corrosion prevention for machined steel parts). Reference packaging and preservation requirements.

6. RELATED DOCUMENTS
7. RECORDS (Travelers, Inspection Records, Material Certs — 3 years minimum, or customer-specified)
8. REVISION HISTORY

Minimum 800 words. Output document only.`,
  },
  {
    title: "Control of Nonconforming Outputs",
    docNum: "QP-8.7-1",
    clause: "8.7",
    prompt: `Draft Quality Procedure QP-8.7-1 "Control of Nonconforming Outputs" for ISO 9001:2015 Clause 8.7.

Organization: ${ORG.name} — precision machined metal components, automotive OEMs, 120 employees, Detroit MI.
Standard: ${ORG.standard}:2015

Note: An NCR template (FM-007) already exists. Reference it.

Structure:

1. PURPOSE
2. SCOPE — all nonconforming material: in-process, finished goods, incoming material, customer returns
3. DEFINITIONS (Nonconformance NC, NCR, Disposition, Use-As-Is UAI, Rework, Scrap, Return to Supplier RTS, Deviation/Waiver, Customer Escape)
4. RESPONSIBILITIES (table: Quality Engineer, Manufacturing Supervisor, Quality Manager, Quality Director, Customer)
5. PROCEDURE

5.1 Detection and Reporting
How NCs are identified (in-process, final inspection, customer complaint). Who can raise an NCR (FM-007 / FM-8.7-1). Immediate containment — RED tag and quarantine.

5.2 Nonconformance Documentation
Required fields on NCR: part number, revision, quantity affected, description of non-conformance, lot number, machine/operator, date detected, detected by.

5.3 Containment Actions
Immediate steps to prevent further non-conforming product from advancing:
- Sort/segregate suspect inventory
- Inspect WIP and finished goods
- Check stock at customer if escape suspected

5.4 Disposition Process
Decision authority and disposition options:
- Scrap: part does not meet requirements and cannot be reworked
- Rework: part can be brought into conformance (re-machine, re-inspect)
- Use-As-Is (UAI): requires customer approval — specific approval form
- Return to Supplier (RTS): for incoming material NCs

5.5 Rework Control
Rework instructions documented. Re-inspection required after rework. Rework history on traveler.

5.6 Use-As-Is (Deviation/Waiver) Process
Written customer approval required. Time-limited. Document quantity and reason.

5.7 Customer Escapes and Containment
Immediate customer notification, sorting/containment at customer, 8D corrective action, 24-hour initial response.

5.8 Corrective Action Trigger
NCRs meeting defined threshold (severity, repeat occurrence, customer impact) trigger corrective action — reference QP-10.2-1.

5.9 NC Trend Reporting
Monthly NC summary to management: top NC types by part, operation, defect type. Pareto analysis.

6. RELATED DOCUMENTS
7. RECORDS (NCRs — 3 years, Customer Escapes — 5 years)
8. REVISION HISTORY

Minimum 800 words. Output document only.`,
  },
  {
    title: "Monitoring, Measurement, Analysis and Evaluation",
    docNum: "QP-9.1-1",
    clause: "9.1",
    prompt: `Draft Quality Procedure QP-9.1-1 "Monitoring, Measurement, Analysis and Evaluation" for ISO 9001:2015 Clause 9.1.

Organization: ${ORG.name} — precision machined components for automotive OEMs, 120 employees, Detroit MI.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE — all QMS performance monitoring, product quality measurements, and customer satisfaction
3. DEFINITIONS (KPI, Leading/Lagging Indicator, Trend Analysis, SPC, Customer Satisfaction Index, Benchmark)
4. RESPONSIBILITIES (table: Quality Manager, Process Owners, Sales Manager, Quality Director, Top Management)
5. PROCEDURE

5.1 What to Monitor and Measure
Categories of monitoring:
A. Product / Process Performance KPIs:
- First Pass Yield (FPY) — target ≥98%
- Internal Scrap Rate — target ≤2%
- Customer PPM (Escape Rate) — target 0
- On-Time Delivery (OTD) — target ≥95%
- Corrective Action Cycle Time — target ≤30 days

B. QMS Effectiveness:
- Internal audit completion rate — target 100%
- Open CAPA aging — target 0 past due
- Customer complaint frequency and resolution time
- Management review action item closure rate

C. Customer Satisfaction (Clause 9.1.2):
- Customer satisfaction surveys (FM-9.1.2-1) — annual minimum
- Customer scorecards and portals (PPAP acceptance, re-qualification)
- Complaint frequency and severity
- Customer commendations

5.2 Methods and Frequency
How each KPI is measured: data source, measurement tool, frequency, responsible party. Reference KPI Dashboard (FM-9.1-1).

5.3 SPC (Statistical Process Control)
Where SPC is applied (critical dimensions per control plan). Control charts, Cp/Cpk targets (≥1.33), response to out-of-control conditions.

5.4 Data Analysis
Monthly data analysis by Quality Manager. Trend analysis (3-month, 6-month rolling). Root cause of negative trends triggers corrective action.

5.5 Customer Satisfaction Monitoring (9.1.2)
Survey process, portal monitoring (if applicable), complaint tracking, satisfaction score calculation.

5.6 Evaluation and Reporting
Monthly KPI report to department managers. Quarterly review with Quality Director. Annual input to Management Review.

5.7 Continual Improvement Trigger
Data trends that require improvement action — threshold definitions, escalation path.

6. RELATED DOCUMENTS
7. RECORDS
8. REVISION HISTORY

Minimum 800 words. Output document only.`,
  },
  {
    title: "Management Review",
    docNum: "QP-9.3-1",
    clause: "9.3",
    prompt: `Draft Quality Procedure QP-9.3-1 "Management Review" for ISO 9001:2015 Clause 9.3.

Organization: ${ORG.name} — precision machined metal components, automotive OEMs, 120 employees, Detroit MI.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE
3. DEFINITIONS (Management Review, Input, Output, Action Item, Effectiveness Review)
4. RESPONSIBILITIES (table: President/CEO chairs, Quality Director facilitates, Quality Manager prepares inputs, Dept Managers present KPIs, Quality Coordinator documents minutes)
5. PROCEDURE

5.1 Frequency and Scheduling
Minimum once per year; quarterly management review meetings recommended for ${ORG.name}. Special reviews triggered by: major customer complaint, significant NC trend, audit findings, major business change.

5.2 Participants
Required attendees: President/CEO, Quality Director, Quality Manager, Production Manager, Sales Manager, Engineering Manager (or equivalent). Optional: HR Manager, Purchasing Manager.

5.3 Management Review Inputs (per ISO 9.3.2)
Describe how each of the 9 required inputs is collected, summarized, and presented:
1. Status of actions from previous management reviews
2. Changes in external/internal issues relevant to the QMS
3. QMS performance and effectiveness (audit results, NC trends, customer satisfaction, KPI performance)
4. Adequacy of resources
5. Effectiveness of actions taken to address risks and opportunities
6. Opportunities for improvement
7. External and internal audit results
8. Customer feedback and complaints
9. Process performance and product conformity

Reference: Management Review Agenda Template (FM-9.3-1), Management Review Input Package (FM-9.3-2).

5.4 Management Review Outputs (per ISO 9.3.3)
Required outputs:
- Opportunities for improvement decisions
- Resource requirements
- QMS changes needed
- Quality objectives updates
Record in Management Review Minutes (FM-9.3-3). Action items with owner and due date.

5.5 Meeting Conduct
Agenda distribution 5 business days in advance. Quorum requirements. Documentation of attendance.

5.6 Action Item Tracking
Open action items tracked in Action Item Register (FM-9.3-4). Status updated at each subsequent review. Escalation if past due.

5.7 Distribution of Minutes
Signed minutes distributed to all department managers within 5 business days. Filed in QMS records.

6. RELATED DOCUMENTS
7. RECORDS (Management Review Minutes and Action Items — 3 years)
8. REVISION HISTORY

Minimum 800 words. Output document only.`,
  },
  {
    title: "Continual Improvement",
    docNum: "QP-10.3-1",
    clause: "10.3",
    prompt: `Draft Quality Procedure QP-10.3-1 "Continual Improvement" for ISO 9001:2015 Clause 10.3.

Organization: ${ORG.name} — precision machined metal components, automotive OEMs, 120 employees, Detroit MI.
Standard: ${ORG.standard}:2015

Structure:

1. PURPOSE
2. SCOPE
3. DEFINITIONS (Improvement Opportunity OFI, Kaizen, PDCA, Breakthrough Improvement, Incremental Improvement, Improvement Register)
4. RESPONSIBILITIES (table)
5. PROCEDURE

5.1 Sources of Improvement Opportunities
How opportunities are identified from:
- Data analysis (KPI trends, NC trends, scrap analysis)
- Internal audit findings (Opportunities for Improvement OFIs)
- Management review outputs
- Customer feedback and satisfaction surveys
- Employee suggestions (Kaizen ideas)
- Supplier performance data
- Benchmarking against industry best practices

5.2 Improvement Idea Submission
Anyone in the organization can submit improvement ideas using Improvement Idea Form (FM-10.3-1). Kaizen Events for production floor improvements.

5.3 Evaluation and Prioritization
Quality Manager reviews submissions monthly. Prioritization criteria: impact on customer satisfaction, safety, quality KPIs, cost, feasibility. Decision: approve / table / reject with reason.

5.4 Planning and Implementation
Approved improvements enter the Improvement Register (FM-10.3-2): owner, description, expected benefit, implementation date, success metrics.

5.5 PDCA Approach
Plan: Define the improvement, root cause (if applicable), action plan.
Do: Implement on small scale or pilot.
Check: Measure results vs. baseline.
Act: Standardize if successful; revise if not.

5.6 Monitoring Improvement Effectiveness
Success criteria defined upfront. 30/60/90-day reviews. Link back to KPIs. Failures documented and lessons learned recorded.

5.7 Recognition
How employee improvement contributions are recognized (quality of the month, recognition program, Kaizen rewards).

5.8 Annual Improvement Goals
Tied to quality objectives (QP-6.2-1). Annual improvement targets set at management review.

5.9 Relationship to Corrective Action
Distinction between corrective action (reactive, addressing existing NC) and continual improvement (proactive, preventing future problems). Reference QP-10.2-1.

6. RELATED DOCUMENTS
7. RECORDS
8. REVISION HISTORY

Minimum 700 words. Output document only.`,
  },
];

async function generateContent(prompt: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: "You are Isa, ACSI's Lead ISO Auditor AI. You write comprehensive, professional, audit-ready ISO quality system documents. Write with specificity using the organization's actual context. Never use placeholder text. Output only the document content — no preamble, no closing remarks.",
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content.find(b => b.type === "text");
  return text ? text.text : "";
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n🚀 Seeding ISO 9001 procedures for ${ORG.name}\n`);

  // Check which procedures already exist with real content
  const existing = await db.execute(
    sql`SELECT title FROM iso_documents WHERE user_id = ${ORG.userId} AND length(content) > 500`
  );
  const existingTitles = new Set(
    (existing.rows as any[]).map((r: any) => r.title as string)
  );

  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < PROCEDURES.length; i++) {
    const proc = PROCEDURES[i];
    const fullTitle = `${proc.title} (${proc.docNum})`;

    if (existingTitles.has(fullTitle)) {
      console.log(`[${i + 1}/${PROCEDURES.length}] SKIP (already exists): ${proc.title}`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${PROCEDURES.length}] Generating: ${proc.title} (${proc.docNum})...`);

    try {
      // Insert placeholder
      const [inserted] = await db.insert(isoDocuments).values({
        userId: ORG.userId,
        isoProjectId: ORG.isoProjectId,
        docType: "procedure",
        title: fullTitle,
        isoClause: proc.clause,
        status: "draft",
        version: "1.0",
        content: "Generating...",
        tags: ["iso-9001", "procedure", proc.docNum],
      }).returning({ id: isoDocuments.id });

      // Generate content
      const content = await generateContent(proc.prompt);
      
      if (!content || content.length < 100) {
        console.error(`  ✗ No content generated`);
        await db.execute(sql`DELETE FROM iso_documents WHERE id = ${inserted.id}`);
        failed++;
        continue;
      }

      // Save content
      await db.execute(
        sql`UPDATE iso_documents SET content = ${content}, updated_at = NOW() WHERE id = ${inserted.id}`
      );

      console.log(`  ✓ Saved — ${content.length} chars`);
      done++;

      // Pause between calls
      if (i < PROCEDURES.length - 1) await sleep(1500);

    } catch (err: any) {
      console.error(`  ✗ Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Complete: ${done} generated, ${skipped} skipped, ${failed} failed\n`);
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
