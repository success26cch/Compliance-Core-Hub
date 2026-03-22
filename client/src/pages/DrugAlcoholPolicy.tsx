import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Printer,
  Lock,
  Loader2,
  FileText,
  Download,
} from "lucide-react";
import { generatePolicyDocx } from "@/lib/generatePolicyDocx";
import logoUrl from "@assets/1_1770683748423.png";

export default function DrugAlcoholPolicy() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const trainingToken = searchParams.get("token");

  const { data: certificates } = useQuery<any[]>({
    queryKey: ["/api/certificates"],
    enabled: isAuthenticated,
  });

  const { data: tokenSession } = useQuery<any>({
    queryKey: ["/api/training-access/session", trainingToken],
    queryFn: async () => {
      const res = await fetch(`/api/training-access/session?token=${trainingToken}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!trainingToken,
  });

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const drugAlcoholCourse = courses?.find((c: any) => c.productId === "course-drug-alcohol");
  const hasCertificate = certificates?.some((c: any) => drugAlcoholCourse && c.courseId === drugAlcoholCourse.id);
  const hasTokenAccess = tokenSession?.courseId === drugAlcoholCourse?.id;

  const { data: companyProfile } = useQuery<any>({
    queryKey: ["/api/company-profile"],
    enabled: isAuthenticated,
  });

  const isUnlocked = isAuthenticated || hasCertificate || hasTokenAccess;

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Lock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Drug & Alcohol Policy Template</h2>
          <p className="text-gray-400 mb-6">
            This comprehensive, ready-to-implement Drug & Alcohol Policy is included FREE with the
            Drug & Alcohol Testing Compliance course. Complete the course to unlock your policy.
          </p>
          <Link href="/training">
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="btn-go-training">
              <FileText className="w-4 h-4 mr-2" /> View Training Courses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const companyName = companyProfile?.companyName || "[COMPANY NAME]";
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => navigate("/training")} data-testid="btn-back">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Training
          </Button>
          <div className="flex-1" />
          <Button variant="outline" className="border-gray-700" onClick={() => generatePolicyDocx(companyName)} data-testid="btn-download-docx">
            <Download className="w-4 h-4 mr-2" /> Download Word Doc
          </Button>
          <Button variant="outline" className="border-gray-700" onClick={() => window.print()} data-testid="btn-print-policy">
            <Printer className="w-4 h-4 mr-2" /> Print Policy
          </Button>
        </div>

        <div className="bg-white text-black rounded-lg shadow-2xl print:shadow-none print:rounded-none" data-testid="policy-document">
          <div className="p-8 md:p-12 print:p-8">

            <div className="flex items-center justify-between border-b-2 border-gray-800 pb-6 mb-8">
              <div className="flex items-center gap-4">
                <img
                  src={companyProfile?.logoUrl || logoUrl}
                  alt={companyProfile?.companyName || "CCHUB Logo"}
                  className="w-16 h-16 rounded-lg object-contain"
                  data-testid="policy-logo"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {companyProfile?.companyName?.toUpperCase() || "CORE COMPLIANCE HUB"}
                  </h1>
                  <p className="text-sm text-gray-500 tracking-wider">
                    {companyProfile?.companyName ? "Drug & Alcohol Policy" : "Professional Compliance Solutions"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">CCHUB Policy Template</p>
                <p className="text-xs text-gray-400">Rev. 1.0 — {today}</p>
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" data-testid="policy-title">
                WORKPLACE DRUG AND ALCOHOL POLICY
              </h2>
              <p className="text-lg text-gray-600">{companyName}</p>
              <div className="w-24 h-1 bg-blue-600 mx-auto mt-4" />
            </div>

            <div className="space-y-8 text-[15px] leading-relaxed text-gray-800">

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">1. PURPOSE</h3>
                <p>{companyName} is committed to providing a safe, healthy, and productive work environment for all employees, contractors, and visitors. The use, possession, distribution, or being under the influence of illegal drugs or unauthorized alcohol in the workplace poses unacceptable risks to health and safety and is strictly prohibited.</p>
                <p className="mt-2">This policy establishes standards for maintaining a drug- and alcohol-free workplace and outlines the procedures for testing, disciplinary action, and employee assistance in compliance with federal regulations including the Drug-Free Workplace Act (41 U.S.C. §§ 8101-8106), DOT 49 CFR Part 40, and applicable state and local laws.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">2. SCOPE</h3>
                <p>This policy applies to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>All full-time, part-time, and temporary employees</li>
                  <li>All applicants who have received a conditional offer of employment</li>
                  <li>All contractors and subcontractors working on company premises</li>
                  <li>All employees performing safety-sensitive functions (DOT-regulated positions)</li>
                  <li>All employees while on company premises, operating company vehicles, or conducting company business</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">3. POLICY STATEMENT</h3>
                <h4 className="font-semibold text-gray-900 mt-4 mb-2">3.1 Prohibited Conduct</h4>
                <p>The following conduct is strictly prohibited:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>The use, possession, sale, manufacture, distribution, or dispensation of illegal drugs, controlled substances, or drug paraphernalia on company premises or while performing company business</li>
                  <li>Reporting to work or performing duties while under the influence of illegal drugs, controlled substances, or alcohol</li>
                  <li>The unauthorized use or possession of alcohol on company premises or during working hours</li>
                  <li>The misuse of prescription medications or over-the-counter drugs that impairs job performance or poses safety risks</li>
                  <li>Refusing to submit to a required drug or alcohol test</li>
                  <li>Tampering with, adulterating, or substituting a drug or alcohol test specimen</li>
                  <li>Failing to report the use of a prescribed medication that may affect job performance or safety to a supervisor</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mt-4 mb-2">3.2 Prescription and Over-the-Counter Medications</h4>
                <p>Employees taking prescription or over-the-counter medications that may impair their ability to safely perform their duties must report this to their supervisor or Human Resources before reporting to work. Medical documentation may be required. The company reserves the right to temporarily reassign or restrict duties as necessary to ensure workplace safety.</p>

                <h4 className="font-semibold text-gray-900 mt-4 mb-2">3.3 Alcohol at Company Events</h4>
                <p>When alcohol is served at company-sponsored events, employees are expected to consume responsibly. No employee should drive a company vehicle or operate heavy equipment after consuming alcohol. The company encourages the use of designated drivers and ride-sharing services.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">4. DRUG AND ALCOHOL TESTING</h3>

                <h4 className="font-semibold text-gray-900 mt-4 mb-2">4.1 Types of Testing</h4>
                <p>{companyName} may conduct drug and alcohol testing under the following circumstances:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>Pre-Employment Testing:</strong> All applicants who receive a conditional offer of employment must successfully pass a drug test before beginning work.</li>
                  <li><strong>Reasonable Suspicion Testing:</strong> When a trained supervisor has reasonable suspicion, based on specific, articulable facts, that an employee is under the influence of drugs or alcohol.</li>
                  <li><strong>Post-Accident Testing:</strong> Following a workplace accident or incident that results in injury requiring medical attention, property damage, or a near-miss event.</li>
                  <li><strong>Random Testing:</strong> Employees may be subject to unannounced random drug and alcohol testing. DOT-regulated employees are subject to federally mandated random testing rates.</li>
                  <li><strong>Return-to-Duty Testing:</strong> Employees returning from a leave of absence related to substance abuse must pass a return-to-duty test.</li>
                  <li><strong>Follow-Up Testing:</strong> Employees who have returned to duty after a substance abuse violation may be subject to unannounced follow-up testing for a period of up to 60 months.</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mt-4 mb-2">4.2 Testing Procedures</h4>
                <p>All drug and alcohol testing will be conducted in accordance with DOT 49 CFR Part 40 procedures (for DOT-regulated employees) and applicable state and federal guidelines. Testing will be performed by certified laboratories using approved chain-of-custody procedures.</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>Drug Testing:</strong> Standard 5-panel or expanded panel urine, hair, or oral fluid testing as required</li>
                  <li><strong>Alcohol Testing:</strong> Breath alcohol testing (BAT) using DOT-approved evidential breath testing devices (EBTs)</li>
                  <li>A Medical Review Officer (MRO) will review all confirmed positive drug test results</li>
                  <li>All test results are treated as confidential medical information</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mt-4 mb-2">4.3 Refusal to Test</h4>
                <p>Refusal to submit to a required drug or alcohol test will be treated as a positive test result. Refusal includes, but is not limited to: failure to appear for testing, failure to provide an adequate specimen without a valid medical explanation, tampering with or attempting to alter a specimen, and leaving the collection site before testing is complete.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">5. DOT-REGULATED EMPLOYEES</h3>
                <p>Employees in safety-sensitive positions regulated by the Department of Transportation (DOT) are subject to additional requirements under 49 CFR Part 40, including but not limited to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Pre-employment drug testing (required before performing safety-sensitive functions)</li>
                  <li>Random drug testing at the federally mandated rate (currently 50% for drugs, 10% for alcohol)</li>
                  <li>Post-accident testing per DOT criteria</li>
                  <li>Reasonable suspicion testing based on trained supervisor observations</li>
                  <li>Return-to-duty and follow-up testing through a Substance Abuse Professional (SAP)</li>
                  <li>FMCSA Drug & Alcohol Clearinghouse queries (pre-employment, annual, and following violations)</li>
                </ul>
                <p className="mt-2"><strong>Alcohol Concentration Thresholds (DOT):</strong></p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>BAC of 0.04 or greater: Positive result — immediate removal from safety-sensitive functions, SAP referral required</li>
                  <li>BAC of 0.02 to 0.039: Removed from safety-sensitive functions for minimum 24 hours</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">6. CONSEQUENCES OF VIOLATIONS</h3>
                <h4 className="font-semibold text-gray-900 mt-4 mb-2">6.1 First Violation (Non-DOT Employees)</h4>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Immediate suspension pending investigation</li>
                  <li>Mandatory referral to Employee Assistance Program (EAP) or Substance Abuse Professional (SAP)</li>
                  <li>Successful completion of recommended treatment program</li>
                  <li>Negative return-to-duty test before reinstatement</li>
                  <li>Follow-up testing for up to 60 months</li>
                  <li>Company reserves the right to terminate employment based on circumstances</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mt-4 mb-2">6.2 DOT-Regulated Employees</h4>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Immediate removal from safety-sensitive functions</li>
                  <li>Mandatory referral to a DOT-qualified Substance Abuse Professional (SAP)</li>
                  <li>Completion of SAP-recommended treatment or education program</li>
                  <li>Negative return-to-duty test(s) as required by the SAP</li>
                  <li>Follow-up testing as prescribed by the SAP (minimum 6 tests in the first 12 months)</li>
                  <li>FMCSA Clearinghouse reporting as required</li>
                </ul>

                <h4 className="font-semibold text-gray-900 mt-4 mb-2">6.3 Second Violation</h4>
                <p>A second violation of this policy will result in immediate termination of employment.</p>

                <h4 className="font-semibold text-gray-900 mt-4 mb-2">6.4 Criminal Activity</h4>
                <p>Any employee convicted of a drug-related offense in the workplace must notify {companyName} within five (5) calendar days of the conviction. Failure to do so will result in disciplinary action up to and including termination.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">7. EMPLOYEE ASSISTANCE PROGRAM (EAP)</h3>
                <p>{companyName} recognizes that drug and alcohol dependency are treatable conditions and encourages employees to seek help voluntarily. Employees who voluntarily come forward to seek assistance for substance abuse <strong>before</strong> being identified through the testing program or other means will be provided access to the company's EAP or other appropriate resources.</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Voluntary disclosure does not exempt an employee from testing requirements</li>
                  <li>All EAP referrals and records are strictly confidential</li>
                  <li>Use of the EAP will not jeopardize employment, provided the employee complies with treatment recommendations</li>
                  <li>Leave for treatment will be handled in accordance with FMLA and company leave policies</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">8. DESIGNATED EMPLOYER REPRESENTATIVE (DER)</h3>
                <p>The Designated Employer Representative (DER) is the company official authorized to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Receive and manage drug and alcohol test results from the MRO and testing facilities</li>
                  <li>Act on behalf of the employer in accordance with DOT regulations</li>
                  <li>Remove employees from safety-sensitive functions when required</li>
                  <li>Coordinate SAP referrals and return-to-duty processes</li>
                  <li>Manage FMCSA Clearinghouse queries and reporting</li>
                </ul>
                <p className="mt-2">DER Contact: <em>[To be designated by {companyName}]</em></p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">9. REASONABLE SUSPICION TRAINING</h3>
                <p>All supervisors and managers who may be required to make reasonable suspicion determinations will receive at least 60 minutes of training on the signs and symptoms of drug use and at least 60 minutes of training on the signs and symptoms of alcohol misuse, as required by DOT regulations. Training will be refreshed periodically.</p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">10. RECORD KEEPING AND CONFIDENTIALITY</h3>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>All drug and alcohol testing records will be maintained in a secure, confidential file separate from the employee's personnel file</li>
                  <li>Records will be retained in accordance with DOT 49 CFR Part 40 requirements (minimum 5 years for positive results, 1 year for negative results)</li>
                  <li>Access to testing records is restricted to authorized personnel on a need-to-know basis</li>
                  <li>Release of testing information requires the written consent of the employee, except as required by law or regulation</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">11. POLICY ACKNOWLEDGMENT</h3>
                <p>All employees are required to read, understand, and acknowledge receipt of this Drug and Alcohol Policy. By signing below, the employee confirms that they:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Have received a copy of this policy</li>
                  <li>Understand the policy's provisions and consequences</li>
                  <li>Agree to comply with all provisions of this policy</li>
                  <li>Consent to drug and alcohol testing as outlined in this policy</li>
                </ul>

                <div className="mt-8 border-t-2 border-gray-300 pt-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div className="border-b border-gray-400 mb-2 h-10" />
                      <p className="text-sm text-gray-600">Employee Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-gray-400 mb-2 h-10" />
                      <p className="text-sm text-gray-600">Date</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 mt-6">
                    <div>
                      <div className="border-b border-gray-400 mb-2 h-10" />
                      <p className="text-sm text-gray-600">Printed Name</p>
                    </div>
                    <div>
                      <div className="border-b border-gray-400 mb-2 h-10" />
                      <p className="text-sm text-gray-600">Employee ID / Title</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 mt-6">
                    <div>
                      <div className="border-b border-gray-400 mb-2 h-10" />
                      <p className="text-sm text-gray-600">Supervisor / HR Representative Signature</p>
                    </div>
                    <div>
                      <div className="border-b border-gray-400 mb-2 h-10" />
                      <p className="text-sm text-gray-600">Date</p>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            <div className="mt-12 pt-6 border-t-2 border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={companyProfile?.logoUrl || logoUrl}
                    alt={companyProfile?.companyName || "CCHUB"}
                    className="w-10 h-10 rounded-lg object-contain opacity-60"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-700 tracking-wider">
                      {companyProfile?.companyName?.toUpperCase() || "CORE COMPLIANCE HUB"}
                    </p>
                    <p className="text-[10px] text-gray-500">A CCHUB Professional Compliance Product</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">This policy template is provided as a guideline.</p>
                  <p className="text-[10px] text-gray-500">Consult legal counsel before implementation.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-6 print:hidden">
          <Button variant="outline" className="border-gray-700" onClick={() => generatePolicyDocx(companyName)} data-testid="btn-download-docx-bottom">
            <Download className="w-4 h-4 mr-2" /> Download Word Doc
          </Button>
          <Button variant="outline" className="border-gray-700" onClick={() => window.print()} data-testid="btn-print-policy-bottom">
            <Printer className="w-4 h-4 mr-2" /> Print Policy
          </Button>
          <Link href="/training">
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="btn-back-training">
              Back to Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
