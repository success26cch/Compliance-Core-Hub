import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintableAuthFormProps {
  data: {
    visit: {
      visitType: string;
      checkedInAt: string;
      billingPreference: string | null;
      specialInstructions: string | null;
      additionalServices: string[] | null;
      ssnLast4: string | null;
      employeeDob: string | null;
      employeeAddress: string | null;
      employeeLocation: string | null;
      staffingAgency: string | null;
    };
    employee: {
      firstName: string;
      lastName: string;
      position: string | null;
      department: string | null;
      email: string | null;
    };
    company: {
      companyName: string;
      industry: string | null;
      dotNumber: string | null;
      derName: string | null;
      derPhone: string | null;
      derEmail: string | null;
      clinicName: string | null;
      phone: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zipCode: string | null;
      logoUrl: string | null;
    } | null;
    authorization: {
      name: string;
      title: string | null;
      phone: string | null;
      timestamp: string;
      signatureDataUrl: string | null;
    };
  };
}

const SERVICE_LABELS: Record<string, string> = {
  injury: "Injury",
  illness: "Illness",
  pre_placement: "Pre-Placement",
  baseline: "Baseline",
  annual: "Annual",
  exit: "Exit",
  dot_drug_test: "DOT Drug Test",
  dot_breath_alcohol: "DOT Breath Alcohol",
  dot_new_hire: "New Hire",
  dot_recertification: "Recertification",
  non_dot_breath_alcohol: "Non-DOT Breath Alcohol",
  hair_collect: "Hair Collect",
  non_dot_drug_instant: "Non-DOT Drug Screen (Instant)",
  non_dot_drug_lab: "Non-DOT Drug Screen (Lab)",
  panel_5: "5 Panel",
  panel_10: "10 Panel",
  panel_4: "4 Panel",
  panel_9: "9 Panel",
  asbestos: "Asbestos",
  respiratory: "Respiratory",
  hazmat: "Hazmat",
  firefighter: "Firefighter",
  mcoles: "MCOLES",
  fit_for_duty: "Fit for Duty",
  audiogram: "Audiogram",
  return_to_work: "Return to Work",
  reason_pre_placement: "Pre-Placement",
  reason_reasonable_suspicion: "Reasonable Suspicion",
  reason_post_accident: "Post Accident",
  reason_random: "Random",
  reason_follow_up: "Follow Up",
};

const VISIT_TYPE_LABELS: Record<string, string> = {
  dot_physical: "DOT Physical",
  drug_screen: "Drug Screen",
  respiratory_exam: "Respiratory Exam",
  injury: "Injury Evaluation",
  new_hire: "New Hire Intake",
  other: "Medical Visit",
};

function CheckBox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 mr-3 mb-1 text-xs">
      <span className={`inline-block w-3 h-3 border border-gray-700 rounded-sm flex-shrink-0 ${checked ? "bg-gray-800" : "bg-white"}`}>
        {checked && <span className="block w-full h-full text-white text-[8px] text-center leading-3 font-bold">X</span>}
      </span>
      <span>{label}</span>
    </span>
  );
}

function ClinicalCommunicationLetter({
  visit,
  employee,
  company,
  authorization,
}: {
  visit: PrintableAuthFormProps["data"]["visit"];
  employee: PrintableAuthFormProps["data"]["employee"];
  company: PrintableAuthFormProps["data"]["company"];
  authorization: PrintableAuthFormProps["data"]["authorization"];
}) {
  const injuryDate = new Date(visit.checkedInAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const employeeFullName = `${employee.firstName} ${employee.lastName}`;
  const companyName = company?.companyName || "_______________";
  const companyAddress = [company?.address, company?.city, company?.state, company?.zipCode].filter(Boolean).join(", ") || "_______________";
  const companyPhone = company?.phone || "_______________";
  const authContact = authorization.name || "_______________";
  const authTitle = authorization.title || "Authorized Representative";
  const authPhone = authorization.phone || company?.derPhone || "_______________";
  const clinicName = company?.clinicName || "To the Treating Provider";

  return (
    <div
      className="bg-white text-black p-8 max-w-[700px] mx-auto print:max-w-none print:p-6"
      style={{ pageBreakBefore: "always" }}
      data-testid="clinical-communication-letter"
    >
      <div className="border-b-2 border-gray-700 pb-4 mb-6">
        {company?.logoUrl && (
          <div className="mb-3">
            <img
              src={company.logoUrl}
              alt={companyName}
              className="h-14 max-w-[200px] object-contain"
            />
          </div>
        )}
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-sm">{companyName}</p>
            {companyAddress !== "_______________" && (
              <p className="text-xs text-gray-600">{companyAddress}</p>
            )}
            {companyPhone !== "_______________" && (
              <p className="text-xs text-gray-600">Tel: {companyPhone}</p>
            )}
          </div>
          <div className="text-right text-xs text-gray-600">
            <p className="font-semibold text-gray-800">Date: {todayDate}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 text-center">
        <h2 className="text-base font-bold uppercase tracking-wide border border-gray-400 inline-block px-6 py-1">
          EMPLOYER CLINICAL COMMUNICATION LETTER
        </h2>
        <p className="text-[10px] text-gray-500 mt-1">Workplace Injury — First-Aid Treatment Request per 29 CFR 1904.7(a)</p>
      </div>

      <div className="mb-4 space-y-1 text-xs">
        <p><span className="font-semibold">To:</span> {clinicName}</p>
        <p><span className="font-semibold">Re:</span> {employeeFullName} — Workplace Injury Evaluation</p>
        <p><span className="font-semibold">Date of Injury:</span> {injuryDate}</p>
        {employee.position && (
          <p><span className="font-semibold">Employee Position:</span> {employee.position}</p>
        )}
        {employee.department && (
          <p><span className="font-semibold">Department:</span> {employee.department}</p>
        )}
      </div>

      <div className="mb-4 text-xs leading-relaxed text-gray-800">
        <p className="mb-2">Dear Medical Provider,</p>
        <p className="mb-2">
          This letter serves as our employer authorization and communication for the above-referenced employee presenting
          to your facility for a work-related injury evaluation on {injuryDate}. We appreciate your partnership in
          providing quality occupational health services to our workforce.
        </p>
        <p className="mb-2">
          As the employer of record, <strong>{companyName}</strong> respectfully requests that, where clinically
          appropriate and consistent with your professional medical judgment, treatment be limited to first-aid-level
          care as defined under <strong>29 CFR 1904.7(a)</strong>. This request is made solely to assist with accurate
          OSHA recordkeeping — the final treatment decision remains entirely at the discretion of the treating provider.
        </p>
      </div>

      <div className="mb-4">
        <div className="bg-gray-50 border border-gray-300 rounded p-3">
          <p className="text-[10px] font-bold uppercase text-gray-700 mb-2 tracking-wide">
            First-Aid Treatments per 29 CFR 1904.7(a) — Non-Recordable When Used Exclusively:
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-gray-700">
            <p>• Use of non-prescription medications at non-prescription strength</p>
            <p>• Tetanus immunizations</p>
            <p>• Cleaning, flushing, or soaking wounds on the skin surface</p>
            <p>• Wound closures with butterfly bandages or Steri-strips</p>
            <p>• Hot or cold therapy</p>
            <p>• Non-rigid means of support (elastic bandages, wraps, non-rigid back belt)</p>
            <p>• Temporary immobilization device for transport (splint, sling, neck collar)</p>
            <p>• Drilling of fingernail/toenail to relieve pressure</p>
            <p>• Draining fluid from blister</p>
            <p>• Eye patches</p>
            <p>• Removing splinters or foreign material from areas other than the eye by irrigation, tweezers, cotton swabs, or other simple means</p>
            <p>• Finger guards</p>
            <p>• Massages</p>
            <p>• Drinking fluids for relief of heat stress</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="border border-gray-400 rounded p-3">
          <p className="text-[10px] font-bold uppercase text-gray-700 mb-2 tracking-wide">
            Treatments That Trigger OSHA Recordability — Please Notify Employer Before Administering:
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-gray-700">
            <p>• Prescription medication (any)</p>
            <p>• Sutures / stitches (staples included)</p>
            <p>• Physical therapy or chiropractic treatment beyond first visit</p>
            <p>• Rigid splints, casts, or orthotics</p>
            <p>• Days away from work / restricted duty (if medically necessary)</p>
            <p>• Transfer to another job due to injury</p>
            <p>• Diagnosis of a significant injury or illness by a healthcare professional</p>
            <p>• Loss of consciousness</p>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 italic">
            Please contact our office prior to administering any of the above if alternatives exist.
            Contact: {authContact} — {authPhone}
          </p>
        </div>
      </div>

      {visit.specialInstructions && (
        <div className="mb-4 text-xs">
          <p className="font-semibold text-gray-700 mb-1">Additional Employer Instructions:</p>
          <p className="border border-gray-300 rounded p-2 text-gray-800">{visit.specialInstructions}</p>
        </div>
      )}

      <div className="mb-4">
        <div className="border border-gray-400 rounded overflow-hidden">
          <div className="bg-red-700 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase text-white tracking-wide">
              Wording That Makes It Recordable:
            </p>
          </div>
          <div className="bg-red-50 px-3 py-2 space-y-0.5">
            <p className="text-[10px] text-red-800">• "No lifting over 10 lbs" — This is a specific restriction that triggers recordability.</p>
            <p className="text-[10px] text-red-800">• "No use of right hand" — Specific restriction = recordable.</p>
            <p className="text-[10px] text-red-800">• "Light duty only" — Vague but still a restriction = recordable.</p>
            <p className="text-[10px] text-red-800">• "No pushing, pulling, or overhead reaching" — Specific functional limitation = recordable.</p>
            <p className="text-[10px] text-red-800">• "Sit-down work only" — Restriction that prevents routine functions = recordable.</p>
          </div>

          <div className="bg-green-700 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase text-white tracking-wide">
              How the Clinic Should Word It (If Clinically Appropriate):
            </p>
          </div>
          <div className="bg-green-50 px-3 py-2 space-y-0.5">
            <p className="text-[10px] text-green-900">• "Return to work. May modify activities as tolerated. Use proper body mechanics. Ice and anti-inflammatories as needed."</p>
            <p className="text-[10px] text-green-900">• "Return to full duty work as tolerated. Avoid forceful pushing/pulling if it causes significant pain."</p>
            <p className="text-[10px] text-green-900">• "Return to regular duties. Employee may self-limit activities based on comfort level. OTC ibuprofen as needed."</p>
            <p className="text-[10px] text-green-900">• "Fit for full duty. Recommend ergonomic awareness and stretching breaks. Follow up as needed."</p>
            <p className="text-[10px] text-green-900">• "Return to work without restrictions. Employee educated on proper lifting techniques and self-care."</p>
          </div>

          <div className="bg-white border-t border-gray-300 px-3 py-2">
            <p className="text-[10px] text-gray-800 leading-relaxed">
              <span className="font-bold">KEY DIFFERENCE:</span> "As tolerated" language allows the employee to self-limit without the provider imposing a formal restriction. Under OSHA's recordkeeping standard, a recommendation is not the same as a restriction. If the employee CAN perform their routine job functions and the provider is simply advising caution, this is not a recordable restriction.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 text-xs leading-relaxed text-gray-800">
        <p>
          We understand that medical treatment decisions are made by qualified healthcare professionals based on the
          patient's clinical presentation. This letter does not restrict, limit, or interfere with medically necessary
          care. We simply ask that you communicate with us before providing treatments listed above as recordable
          triggers, so we may be aware of the employee's condition and coordinate care appropriately.
        </p>
      </div>

      <div className="border-t-2 border-gray-600 pt-4 mt-4">
        <p className="text-xs font-semibold mb-3 text-gray-700">Employer Authorization:</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Authorized By:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5">{authContact}</span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Title:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5">{authTitle}</span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Phone:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5">{authPhone}</span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Date:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5">{todayDate}</span>
          </div>
        </div>
        {authorization.signatureDataUrl && (
          <div className="mt-3 flex items-end gap-3">
            <span className="font-semibold text-xs">Signature:</span>
            <img
              src={authorization.signatureDataUrl}
              alt="Digital Signature"
              className="h-12 max-w-[200px] object-contain"
            />
          </div>
        )}
      </div>

      <div className="mt-5 text-center text-[9px] text-gray-400 border-t border-gray-200 pt-2">
        <p className="font-medium">
          This letter is for informational purposes only and does not constitute legal or medical advice.
          All treatment decisions remain at the sole discretion of the treating healthcare provider.
        </p>
        <p className="mt-1">Digitally generated by Core Compliance Hub (CCHUB) — The One Stop Employer Shop | A DBA of ACSI</p>
        <p>www.corecompliancehub.com | Generated: {new Date(visit.checkedInAt).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function PrintableAuthForm({ data }: PrintableAuthFormProps) {
  const { visit, employee, company, authorization } = data;
  const services = visit.additionalServices || [];
  const isInjury = visit.visitType === "injury";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full">
      <div className="mb-4 print:hidden">
        <Button
          onClick={handlePrint}
          className="bg-[#FFC107] text-black font-bold"
          data-testid="btn-print-auth-form"
        >
          <Printer className="w-4 h-4 mr-2" />
          {isInjury ? "Print Authorization + Clinical Letter" : "Print Authorization Form"}
        </Button>
        {isInjury && (
          <p className="text-xs text-amber-700 mt-1 font-medium">
            Injury visit — Clinical Communication Letter will print automatically on page 2.
          </p>
        )}
      </div>

      <div
        className="bg-white text-black p-6 rounded-lg border border-gray-300 text-sm max-w-[700px] mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none"
        data-testid="printable-auth-form"
      >
        <div className="text-center mb-4 border-b border-gray-400 pb-3">
          {company?.logoUrl && (
            <div className="mb-2">
              <img
                src={company.logoUrl}
                alt={company.companyName || "Company Logo"}
                className="h-14 max-w-[200px] object-contain mx-auto"
                data-testid="form-company-logo"
              />
            </div>
          )}
          <h1 className="text-base font-bold uppercase tracking-wide">Authorization for Examination or Treatment and Payment</h1>
          <p className="text-[10px] text-gray-500 mt-1">(patient must present authorization and photo ID at the time of service)</p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 border-b border-gray-300 pb-3">
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Patient Name:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-patient-name">
              {employee.firstName} {employee.lastName}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Social Security No:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-ssn">
              {visit.ssnLast4 ? `XXX-XX-${visit.ssnLast4}` : "___________"}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Employer:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-employer">
              {company?.companyName || "___________"}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Date of Birth:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-dob">
              {visit.employeeDob || "___________"}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Street Address:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-address">
              {visit.employeeAddress || "___________"}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Location:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-location">
              {visit.employeeLocation || "___________"}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Company Name:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-company-name">
              {company?.companyName || "___________"}
            </span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold text-xs whitespace-nowrap">Contact:</span>
            <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-company-contact">
              {company?.derName ? `${company.derName}${company.derPhone ? ` - ${company.derPhone}` : ""}` : (company?.phone || "___________")}
            </span>
          </div>
        </div>

        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 mb-2 tracking-wide">Occupational Health Services</h2>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">Work Related</p>
            <div className="flex flex-wrap">
              <CheckBox checked={services.includes("injury") || visit.visitType === "injury"} label="Injury" />
              <CheckBox checked={services.includes("illness")} label="Illness" />
            </div>
            {(visit.visitType === "injury" && visit.checkedInAt) && (
              <p className="text-[10px] text-gray-600 mt-0.5">
                Date of Injury: {new Date(visit.checkedInAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">Physical Examination</p>
            <div className="flex flex-wrap">
              <CheckBox checked={services.includes("pre_placement")} label="Pre-Placement" />
              <CheckBox checked={services.includes("baseline")} label="Baseline" />
              <CheckBox checked={services.includes("annual")} label="Annual" />
              <CheckBox checked={services.includes("exit")} label="Exit" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">DOT Exams</p>
            <div className="flex flex-wrap">
              <CheckBox checked={services.includes("dot_drug_test")} label="DOT Drug Test" />
              <CheckBox checked={services.includes("dot_breath_alcohol")} label="DOT Breath Alcohol" />
              <CheckBox checked={services.includes("dot_new_hire") || (visit.visitType === "dot_physical" && services.includes("dot_new_hire"))} label="New Hire" />
              <CheckBox checked={services.includes("dot_recertification") || visit.visitType === "dot_physical"} label="Recertification" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">Substance Abuse Testing</p>
            <div className="flex flex-wrap">
              <CheckBox checked={services.includes("non_dot_breath_alcohol")} label="Non-DOT Breath Alcohol" />
              <CheckBox checked={services.includes("hair_collect")} label="Hair Collect" />
              <CheckBox checked={services.includes("non_dot_drug_instant")} label="Non-DOT Drug (Instant)" />
              <CheckBox checked={services.includes("non_dot_drug_lab")} label="Non-DOT Drug (Lab)" />
              <CheckBox checked={services.includes("panel_5")} label="5 Panel" />
              <CheckBox checked={services.includes("panel_10")} label="10 Panel" />
              <CheckBox checked={services.includes("panel_4")} label="4 Panel" />
              <CheckBox checked={services.includes("panel_9")} label="9 Panel" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">Special Examinations</p>
            <div className="flex flex-wrap">
              <CheckBox checked={services.includes("asbestos")} label="Asbestos" />
              <CheckBox checked={services.includes("respiratory") || visit.visitType === "respiratory_exam"} label="Respiratory" />
              <CheckBox checked={services.includes("hazmat")} label="Hazmat" />
              <CheckBox checked={services.includes("firefighter")} label="Firefighter" />
              <CheckBox checked={services.includes("mcoles")} label="MCOLES" />
              <CheckBox checked={services.includes("fit_for_duty")} label="Fit for Duty" />
              <CheckBox checked={services.includes("audiogram")} label="Audiogram" />
              <CheckBox checked={services.includes("return_to_work")} label="Return to Work" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">Reason for Test</p>
            <div className="flex flex-wrap">
              <CheckBox checked={services.includes("reason_pre_placement")} label="Pre-Placement" />
              <CheckBox checked={services.includes("reason_reasonable_suspicion")} label="Reasonable Suspicion" />
              <CheckBox checked={services.includes("reason_post_accident")} label="Post Accident" />
              <CheckBox checked={services.includes("reason_random")} label="Random" />
              <CheckBox checked={services.includes("reason_follow_up")} label="Follow Up" />
            </div>
          </div>
        </div>

        <div className="mb-3 border-t border-gray-300 pt-2">
          <div className="flex items-center gap-4 mb-2">
            <p className="text-[10px] font-bold uppercase text-gray-600">Billing:</p>
            <CheckBox checked={visit.billingPreference === "company_pay"} label="Company Pay" />
            <CheckBox checked={visit.billingPreference === "employee_pay"} label="Employee Pay" />
          </div>
        </div>

        {visit.specialInstructions && (
          <div className="mb-3 border-t border-gray-300 pt-2">
            <p className="text-[10px] font-bold uppercase text-gray-600 mb-1">Special Instructions / Comments</p>
            <p className="text-xs border border-gray-300 rounded p-2 min-h-[30px]" data-testid="form-special-instructions">
              {visit.specialInstructions}
            </p>
          </div>
        )}

        <div className="border-t-2 border-gray-600 pt-3 mt-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex gap-1">
              <span className="font-semibold text-xs whitespace-nowrap">Authorized by:</span>
              <span className="text-xs border-b border-gray-400 flex-1 pb-0.5 font-medium" data-testid="form-auth-name">
                {authorization.name}
              </span>
            </div>
            <div className="flex gap-1">
              <span className="font-semibold text-xs whitespace-nowrap">Title:</span>
              <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-auth-title">
                {authorization.title || "___________"}
              </span>
            </div>
            <div className="flex gap-1">
              <span className="font-semibold text-xs whitespace-nowrap">Phone:</span>
              <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-auth-phone">
                {authorization.phone || "___________"}
              </span>
            </div>
            <div className="flex gap-1">
              <span className="font-semibold text-xs whitespace-nowrap">Date:</span>
              <span className="text-xs border-b border-gray-400 flex-1 pb-0.5" data-testid="form-auth-date">
                {new Date(authorization.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>

          {authorization.signatureDataUrl && (
            <div className="mt-3 flex items-end gap-3">
              <span className="font-semibold text-xs">Signature:</span>
              <img
                src={authorization.signatureDataUrl}
                alt="Digital Signature"
                className="h-12 max-w-[200px] object-contain"
                data-testid="form-signature-image"
              />
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-[9px] text-gray-400 border-t border-gray-200 pt-2">
          <p>Digitally generated by Core Compliance Hub (CCHUB) - The One Stop Employer Shop</p>
          <p>Visit Type: {VISIT_TYPE_LABELS[visit.visitType] || visit.visitType} | Generated: {new Date(visit.checkedInAt).toLocaleString()}</p>
        </div>
      </div>

      {isInjury && (
        <>
          <div className="mt-8 mb-4 print:hidden max-w-[700px] mx-auto">
            <div className="border-t-4 border-dashed border-amber-400 pt-4">
              <p className="text-sm font-bold text-amber-700 text-center">
                — Page 2: Clinical Communication Letter (Injury Care Only — prints automatically) —
              </p>
            </div>
          </div>
          <ClinicalCommunicationLetter
            visit={visit}
            employee={employee}
            company={company}
            authorization={authorization}
          />
        </>
      )}
    </div>
  );
}
