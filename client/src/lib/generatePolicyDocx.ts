import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Packer,
} from "docx";
import { saveAs } from "file-saver";

export async function generatePolicyDocx(companyName: string) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sectionTitle = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, bold: true, size: 26, font: "Calibri" })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      },
    });

  const bodyText = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, size: 22, font: "Calibri" })],
      spacing: { after: 120 },
    });

  const bulletItem = (text: string, bold?: string) =>
    new Paragraph({
      children: bold
        ? [
            new TextRun({ text: bold, bold: true, size: 22, font: "Calibri" }),
            new TextRun({ text, size: 22, font: "Calibri" }),
          ]
        : [new TextRun({ text, size: 22, font: "Calibri" })],
      bullet: { level: 0 },
      spacing: { after: 60 },
    });

  const subHeading = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({ text, bold: true, size: 22, font: "Calibri" }),
      ],
      spacing: { before: 200, after: 80 },
    });

  const signatureLine = (label: string) => [
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: "________________________________________",
          size: 22,
          font: "Calibri",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: label,
          size: 18,
          font: "Calibri",
          color: "666666",
        }),
      ],
      spacing: { after: 120 },
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "CORE COMPLIANCE HUB",
                bold: true,
                size: 32,
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Professional Compliance Solutions",
                size: 20,
                font: "Calibri",
                color: "888888",
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `CCH Policy Template  •  Rev. 1.0 — ${today}`,
                size: 16,
                font: "Calibri",
                color: "999999",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "WORKPLACE DRUG AND ALCOHOL POLICY",
                bold: true,
                size: 36,
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: companyName,
                size: 26,
                font: "Calibri",
                color: "555555",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          sectionTitle("1. PURPOSE"),
          bodyText(
            `${companyName} is committed to providing a safe, healthy, and productive work environment for all employees, contractors, and visitors. The use, possession, distribution, or being under the influence of illegal drugs or unauthorized alcohol in the workplace poses unacceptable risks to health and safety and is strictly prohibited.`
          ),
          bodyText(
            `This policy establishes standards for maintaining a drug- and alcohol-free workplace and outlines the procedures for testing, disciplinary action, and employee assistance in compliance with federal regulations including the Drug-Free Workplace Act (41 U.S.C. §§ 8101-8106), DOT 49 CFR Part 40, and applicable state and local laws.`
          ),

          sectionTitle("2. SCOPE"),
          bodyText("This policy applies to:"),
          bulletItem("All full-time, part-time, and temporary employees"),
          bulletItem(
            "All applicants who have received a conditional offer of employment"
          ),
          bulletItem(
            "All contractors and subcontractors working on company premises"
          ),
          bulletItem(
            "All employees performing safety-sensitive functions (DOT-regulated positions)"
          ),
          bulletItem(
            "All employees while on company premises, operating company vehicles, or conducting company business"
          ),

          sectionTitle("3. POLICY STATEMENT"),
          subHeading("3.1 Prohibited Conduct"),
          bodyText("The following conduct is strictly prohibited:"),
          bulletItem(
            "The use, possession, sale, manufacture, distribution, or dispensation of illegal drugs, controlled substances, or drug paraphernalia on company premises or while performing company business"
          ),
          bulletItem(
            "Reporting to work or performing duties while under the influence of illegal drugs, controlled substances, or alcohol"
          ),
          bulletItem(
            "The unauthorized use or possession of alcohol on company premises or during working hours"
          ),
          bulletItem(
            "The misuse of prescription medications or over-the-counter drugs that impairs job performance or poses safety risks"
          ),
          bulletItem("Refusing to submit to a required drug or alcohol test"),
          bulletItem(
            "Tampering with, adulterating, or substituting a drug or alcohol test specimen"
          ),
          bulletItem(
            "Failing to report the use of a prescribed medication that may affect job performance or safety to a supervisor"
          ),

          subHeading("3.2 Prescription and Over-the-Counter Medications"),
          bodyText(
            `Employees taking prescription or over-the-counter medications that may impair their ability to safely perform their duties must report this to their supervisor or Human Resources before reporting to work. Medical documentation may be required. The company reserves the right to temporarily reassign or restrict duties as necessary to ensure workplace safety.`
          ),

          subHeading("3.3 Alcohol at Company Events"),
          bodyText(
            `When alcohol is served at company-sponsored events, employees are expected to consume responsibly. No employee should drive a company vehicle or operate heavy equipment after consuming alcohol. The company encourages the use of designated drivers and ride-sharing services.`
          ),

          sectionTitle("4. DRUG AND ALCOHOL TESTING"),
          subHeading("4.1 Types of Testing"),
          bodyText(
            `${companyName} may conduct drug and alcohol testing under the following circumstances:`
          ),
          bulletItem(
            " All applicants who receive a conditional offer of employment must successfully pass a drug test before beginning work.",
            "Pre-Employment Testing:"
          ),
          bulletItem(
            " When a trained supervisor has reasonable suspicion, based on specific, articulable facts, that an employee is under the influence of drugs or alcohol.",
            "Reasonable Suspicion Testing:"
          ),
          bulletItem(
            " Following a workplace accident or incident that results in injury requiring medical attention, property damage, or a near-miss event.",
            "Post-Accident Testing:"
          ),
          bulletItem(
            " Employees may be subject to unannounced random drug and alcohol testing. DOT-regulated employees are subject to federally mandated random testing rates.",
            "Random Testing:"
          ),
          bulletItem(
            " Employees returning from a leave of absence related to substance abuse must pass a return-to-duty test.",
            "Return-to-Duty Testing:"
          ),
          bulletItem(
            " Employees who have returned to duty after a substance abuse violation may be subject to unannounced follow-up testing for a period of up to 60 months.",
            "Follow-Up Testing:"
          ),

          subHeading("4.2 Testing Procedures"),
          bodyText(
            `All drug and alcohol testing will be conducted in accordance with DOT 49 CFR Part 40 procedures (for DOT-regulated employees) and applicable state and federal guidelines. Testing will be performed by certified laboratories using approved chain-of-custody procedures.`
          ),
          bulletItem(
            " Standard 5-panel or expanded panel urine, hair, or oral fluid testing as required",
            "Drug Testing:"
          ),
          bulletItem(
            " Breath alcohol testing (BAT) using DOT-approved evidential breath testing devices (EBTs)",
            "Alcohol Testing:"
          ),
          bulletItem(
            "A Medical Review Officer (MRO) will review all confirmed positive drug test results"
          ),
          bulletItem(
            "All test results are treated as confidential medical information"
          ),

          subHeading("4.3 Refusal to Test"),
          bodyText(
            `Refusal to submit to a required drug or alcohol test will be treated as a positive test result. Refusal includes, but is not limited to: failure to appear for testing, failure to provide an adequate specimen without a valid medical explanation, tampering with or attempting to alter a specimen, and leaving the collection site before testing is complete.`
          ),

          sectionTitle("5. DOT-REGULATED EMPLOYEES"),
          bodyText(
            `Employees in safety-sensitive positions regulated by the Department of Transportation (DOT) are subject to additional requirements under 49 CFR Part 40, including but not limited to:`
          ),
          bulletItem(
            "Pre-employment drug testing (required before performing safety-sensitive functions)"
          ),
          bulletItem(
            "Random drug testing at the federally mandated rate (currently 50% for drugs, 10% for alcohol)"
          ),
          bulletItem("Post-accident testing per DOT criteria"),
          bulletItem(
            "Reasonable suspicion testing based on trained supervisor observations"
          ),
          bulletItem(
            "Return-to-duty and follow-up testing through a Substance Abuse Professional (SAP)"
          ),
          bulletItem(
            "FMCSA Drug & Alcohol Clearinghouse queries (pre-employment, annual, and following violations)"
          ),
          bodyText("Alcohol Concentration Thresholds (DOT):"),
          bulletItem(
            "BAC of 0.04 or greater: Positive result — immediate removal from safety-sensitive functions, SAP referral required"
          ),
          bulletItem(
            "BAC of 0.02 to 0.039: Removed from safety-sensitive functions for minimum 24 hours"
          ),

          sectionTitle("6. CONSEQUENCES OF VIOLATIONS"),
          subHeading("6.1 First Violation (Non-DOT Employees)"),
          bulletItem("Immediate suspension pending investigation"),
          bulletItem(
            "Mandatory referral to Employee Assistance Program (EAP) or Substance Abuse Professional (SAP)"
          ),
          bulletItem(
            "Successful completion of recommended treatment program"
          ),
          bulletItem(
            "Negative return-to-duty test before reinstatement"
          ),
          bulletItem("Follow-up testing for up to 60 months"),
          bulletItem(
            "Company reserves the right to terminate employment based on circumstances"
          ),

          subHeading("6.2 DOT-Regulated Employees"),
          bulletItem(
            "Immediate removal from safety-sensitive functions"
          ),
          bulletItem(
            "Mandatory referral to a DOT-qualified Substance Abuse Professional (SAP)"
          ),
          bulletItem(
            "Completion of SAP-recommended treatment or education program"
          ),
          bulletItem(
            "Negative return-to-duty test(s) as required by the SAP"
          ),
          bulletItem(
            "Follow-up testing as prescribed by the SAP (minimum 6 tests in the first 12 months)"
          ),
          bulletItem(
            "FMCSA Clearinghouse reporting as required"
          ),

          subHeading("6.3 Second Violation"),
          bodyText(
            "A second violation of this policy will result in immediate termination of employment."
          ),

          subHeading("6.4 Criminal Activity"),
          bodyText(
            `Any employee convicted of a drug-related offense in the workplace must notify ${companyName} within five (5) calendar days of the conviction. Failure to do so will result in disciplinary action up to and including termination.`
          ),

          sectionTitle("7. EMPLOYEE ASSISTANCE PROGRAM (EAP)"),
          bodyText(
            `${companyName} recognizes that drug and alcohol dependency are treatable conditions and encourages employees to seek help voluntarily. Employees who voluntarily come forward to seek assistance for substance abuse before being identified through the testing program or other means will be provided access to the company's EAP or other appropriate resources.`
          ),
          bulletItem(
            "Voluntary disclosure does not exempt an employee from testing requirements"
          ),
          bulletItem(
            "All EAP referrals and records are strictly confidential"
          ),
          bulletItem(
            "Use of the EAP will not jeopardize employment, provided the employee complies with treatment recommendations"
          ),
          bulletItem(
            "Leave for treatment will be handled in accordance with FMLA and company leave policies"
          ),

          sectionTitle("8. DESIGNATED EMPLOYER REPRESENTATIVE (DER)"),
          bodyText(
            "The Designated Employer Representative (DER) is the company official authorized to:"
          ),
          bulletItem(
            "Receive and manage drug and alcohol test results from the MRO and testing facilities"
          ),
          bulletItem(
            "Act on behalf of the employer in accordance with DOT regulations"
          ),
          bulletItem(
            "Remove employees from safety-sensitive functions when required"
          ),
          bulletItem(
            "Coordinate SAP referrals and return-to-duty processes"
          ),
          bulletItem(
            "Manage FMCSA Clearinghouse queries and reporting"
          ),
          bodyText(
            `DER Contact: [To be designated by ${companyName}]`
          ),

          sectionTitle("9. REASONABLE SUSPICION TRAINING"),
          bodyText(
            "All supervisors and managers who may be required to make reasonable suspicion determinations will receive at least 60 minutes of training on the signs and symptoms of drug use and at least 60 minutes of training on the signs and symptoms of alcohol misuse, as required by DOT regulations. Training will be refreshed periodically."
          ),

          sectionTitle("10. RECORD KEEPING AND CONFIDENTIALITY"),
          bulletItem(
            "All drug and alcohol testing records will be maintained in a secure, confidential file separate from the employee's personnel file"
          ),
          bulletItem(
            "Records will be retained in accordance with DOT 49 CFR Part 40 requirements (minimum 5 years for positive results, 1 year for negative results)"
          ),
          bulletItem(
            "Access to testing records is restricted to authorized personnel on a need-to-know basis"
          ),
          bulletItem(
            "Release of testing information requires the written consent of the employee, except as required by law or regulation"
          ),

          sectionTitle("11. POLICY ACKNOWLEDGMENT"),
          bodyText(
            "All employees are required to read, understand, and acknowledge receipt of this Drug and Alcohol Policy. By signing below, the employee confirms that they:"
          ),
          bulletItem("Have received a copy of this policy"),
          bulletItem(
            "Understand the policy's provisions and consequences"
          ),
          bulletItem(
            "Agree to comply with all provisions of this policy"
          ),
          bulletItem(
            "Consent to drug and alcohol testing as outlined in this policy"
          ),

          ...signatureLine("Employee Signature"),
          ...signatureLine("Date"),
          ...signatureLine("Printed Name"),
          ...signatureLine("Employee ID / Title"),
          ...signatureLine("Supervisor / HR Representative Signature"),
          ...signatureLine("Date"),

          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: "CORE COMPLIANCE HUB — A CCH Professional Compliance Product",
                size: 16,
                font: "Calibri",
                color: "999999",
                bold: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            border: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "333333" },
            },
            spacing: { before: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "This policy template is provided as a guideline. Consult legal counsel before implementation.",
                size: 14,
                font: "Calibri",
                color: "999999",
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = companyName !== "[COMPANY NAME]"
    ? `Drug_Alcohol_Policy_${companyName.replace(/\s+/g, "_")}.docx`
    : "Drug_Alcohol_Policy_Template.docx";
  saveAs(blob, filename);
}
