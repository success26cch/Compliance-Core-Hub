import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, ShieldCheck, Truck, FlaskConical, Award, Scale, Lock } from "lucide-react";
import { ProtectedLayout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface Term {
  term: string;
  acronym?: string;
  definition: string;
}

const OSHA_TERMS: Term[] = [
  { term: "Occupational Safety and Health Administration", acronym: "OSHA", definition: "A federal agency under the U.S. Department of Labor responsible for ensuring safe and healthy working conditions by setting and enforcing standards." },
  { term: "OSHA 300 Log", definition: "A form used by employers to record work-related injuries and illnesses. It documents the case number, employee name, job title, date, location, description, classification, and days away or restricted." },
  { term: "OSHA 300A Summary", definition: "An annual summary of the OSHA 300 Log that must be posted in the workplace from February 1 through April 30. It includes totals for each injury/illness category." },
  { term: "OSHA 301 Form", definition: "The Injury and Illness Incident Report. A detailed supplementary form completed for each recordable injury or illness." },
  { term: "Total Recordable Incident Rate", acronym: "TRIR", definition: "A metric that calculates the number of recordable incidents per 100 full-time employees. Formula: (Number of recordable cases × 200,000) ÷ Total hours worked." },
  { term: "Days Away, Restricted, or Transferred", acronym: "DART", definition: "A safety metric measuring the number of cases involving days away from work, restricted work activity, or job transfer per 100 full-time workers." },
  { term: "Experience Modification Rate", acronym: "EMR", definition: "A number used by insurance companies to gauge the past cost of injuries and future risk. An EMR of 1.0 is the industry average; below 1.0 means fewer claims than average." },
  { term: "General Duty Clause", definition: "Section 5(a)(1) of the OSH Act, which requires employers to provide a workplace free from recognized hazards that are causing or likely to cause death or serious physical harm." },
  { term: "Recordable Injury/Illness", definition: "A work-related injury or illness that results in death, days away from work, restricted work, transfer, medical treatment beyond first aid, loss of consciousness, or a significant diagnosis by a physician." },
  { term: "First Aid", definition: "Under OSHA, treatment limited to non-prescription medications at non-prescription strength, tetanus immunizations, cleaning/flushing/soaking wounds, wound coverings, hot/cold therapy, non-rigid means of support, and temporary immobilization devices used to transport accident victims." },
  { term: "Personal Protective Equipment", acronym: "PPE", definition: "Equipment worn to minimize exposure to hazards. Includes items such as gloves, safety glasses, hard hats, respirators, earplugs, and steel-toed boots." },
  { term: "Safety Data Sheet", acronym: "SDS", definition: "A document that provides information on the properties of hazardous chemicals, health and physical hazards, protective measures, and safety precautions. Required under OSHA's Hazard Communication Standard (HCS)." },
  { term: "Hazard Communication Standard", acronym: "HazCom / HCS", definition: "OSHA standard (29 CFR 1910.1200) requiring chemical manufacturers, distributors, and importers to provide Safety Data Sheets and labels, and employers to train workers on chemical hazards." },
  { term: "Lockout/Tagout", acronym: "LOTO", definition: "OSHA standard (29 CFR 1910.147) requiring specific practices and procedures to safeguard employees from unexpected energization or startup of machinery and equipment during service and maintenance." },
  { term: "Permissible Exposure Limit", acronym: "PEL", definition: "The maximum amount or concentration of a chemical that a worker may be exposed to, as established by OSHA. Expressed as a time-weighted average (TWA) over an 8-hour shift." },
  { term: "Job Hazard Analysis", acronym: "JHA", definition: "A technique that focuses on job tasks to identify hazards before they occur. Also called Job Safety Analysis (JSA). It examines each step of a job, identifies existing or potential hazards, and determines the best way to reduce or eliminate them." },
  { term: "Near Miss", definition: "An unplanned event that did not result in injury, illness, or damage but had the potential to do so. Reporting near misses helps organizations identify and correct hazards before they cause harm." },
  { term: "Corrective Action", definition: "Steps taken to eliminate the cause of a detected nonconformity, safety violation, or other undesirable situation. Designed to prevent recurrence." },
  { term: "29 CFR 1904", definition: "The section of the Code of Federal Regulations that contains OSHA's recordkeeping requirements for occupational injuries and illnesses." },
  { term: "29 CFR 1910", definition: "OSHA's General Industry Standards covering a wide range of workplace hazards including walking/working surfaces, means of egress, hazardous materials, PPE, and electrical safety." },
];

const DOT_TERMS: Term[] = [
  { term: "Department of Transportation", acronym: "DOT", definition: "A federal cabinet department responsible for transportation policy and regulation, including safety requirements for commercial motor vehicle operators." },
  { term: "Federal Motor Carrier Safety Administration", acronym: "FMCSA", definition: "The DOT agency that regulates the trucking industry, enforcing safety regulations for commercial motor vehicles and their drivers." },
  { term: "Commercial Driver's License", acronym: "CDL", definition: "A license required to operate large, heavy, or hazardous-material vehicles. CDL classes include Class A (combination vehicles), Class B (single vehicles over 26,001 lbs), and Class C (hazmat/passenger)." },
  { term: "DOT Physical Examination", definition: "A medical exam required for commercial motor vehicle drivers under 49 CFR Part 391. Evaluates physical fitness including vision, hearing, blood pressure, and overall health to determine if a driver can safely operate a CMV." },
  { term: "Medical Examiner's Certificate", acronym: "MEC", definition: "The certificate (Form MCSA-5876) issued by a certified medical examiner upon passing a DOT physical. Valid for up to 24 months; shorter certifications may be issued for certain conditions." },
  { term: "49 CFR Part 40", definition: "The federal regulation governing DOT workplace drug and alcohol testing procedures, including specimen collection, laboratory analysis, Medical Review Officer (MRO) review, and Substance Abuse Professional (SAP) requirements." },
  { term: "49 CFR Part 382", definition: "FMCSA regulation requiring drug and alcohol testing for drivers of commercial motor vehicles, including pre-employment, random, reasonable suspicion, post-accident, return-to-duty, and follow-up testing." },
  { term: "Drug and Alcohol Clearinghouse", definition: "An online database maintained by FMCSA that records DOT drug and alcohol program violations. Employers must query the Clearinghouse before hiring drivers and annually for current employees." },
  { term: "Safety-Sensitive Position", definition: "A job function where impaired performance could endanger the safety of the employee or others. Under DOT regulations, employees in these positions are subject to drug and alcohol testing." },
  { term: "Hours of Service", acronym: "HOS", definition: "DOT regulations (49 CFR Part 395) that limit the number of hours a commercial motor vehicle driver can be on duty and driving. Includes the 11-hour driving limit, 14-hour duty window, and 10-hour off-duty requirement." },
  { term: "Electronic Logging Device", acronym: "ELD", definition: "A device that automatically records a driver's driving time and hours of service data, replacing paper logbooks. Required under the ELD mandate (49 CFR Part 395)." },
  { term: "Commercial Motor Vehicle", acronym: "CMV", definition: "A vehicle used in commerce that has a gross vehicle weight rating (GVWR) or gross combination weight rating (GCWR) of 10,001 pounds or more, is designed to transport 16+ passengers, or carries hazardous materials." },
  { term: "Compliance, Safety, Accountability", acronym: "CSA", definition: "FMCSA's data-driven safety program that measures the safety performance of motor carriers and drivers using seven Behavior Analysis and Safety Improvement Categories (BASICs)." },
];

const DRUG_ALCOHOL_TERMS: Term[] = [
  { term: "5-Panel Drug Test", definition: "The standard DOT drug test that screens for five categories of substances: Marijuana (THC), Cocaine, Opiates (including codeine, morphine, heroin, hydrocodone, hydromorphone, oxycodone, oxymorphone), Amphetamines/Methamphetamines, and Phencyclidine (PCP)." },
  { term: "Medical Review Officer", acronym: "MRO", definition: "A licensed physician who is responsible for receiving and reviewing laboratory results from the drug testing process. The MRO evaluates positive results, contacts the donor for a legitimate medical explanation, and makes the final determination." },
  { term: "Substance Abuse Professional", acronym: "SAP", definition: "A qualified person (physician, psychologist, social worker, or addiction counselor) who evaluates employees who have violated DOT drug and alcohol regulations and recommends a course of education and/or treatment." },
  { term: "Pre-Employment Testing", definition: "A drug test required before an employee can perform safety-sensitive functions for the first time. The employer must receive a verified negative result before the employee starts work." },
  { term: "Random Testing", definition: "Unannounced drug and/or alcohol testing of employees selected by a scientifically valid random selection method. DOT requires a minimum random testing rate of 50% for drugs and 10% for alcohol annually." },
  { term: "Reasonable Suspicion Testing", definition: "Testing based on specific, contemporaneous, articulable observations by a trained supervisor concerning the appearance, behavior, speech, or body odors of a safety-sensitive employee." },
  { term: "Post-Accident Testing", definition: "Drug and/or alcohol testing conducted after a DOT-reportable accident. Must be performed within specific time limits: 8 hours for alcohol and 32 hours for drugs." },
  { term: "Return-to-Duty Testing", definition: "A drug and/or alcohol test required before an employee who has violated DOT drug/alcohol rules can return to performing safety-sensitive duties. Must be a direct observation collection with a verified negative result." },
  { term: "Follow-Up Testing", definition: "Unannounced testing for a minimum of six tests in the first 12 months following a return-to-duty test. The SAP can require testing for up to 60 months." },
  { term: "Breath Alcohol Technician", acronym: "BAT", definition: "A person trained and certified to operate an evidential breath testing (EBT) device for DOT alcohol testing." },
  { term: "Evidential Breath Testing Device", acronym: "EBT", definition: "A device approved by the National Highway Traffic Safety Administration (NHTSA) for DOT alcohol confirmation testing. Must print results and be capable of assigning a unique sequential test number." },
  { term: "Alcohol Confirmation Test", definition: "A second alcohol test using an EBT device, conducted at least 15 minutes but no more than 30 minutes after the initial screening test, if the screening result was 0.02 or higher." },
  { term: "Designated Employer Representative", acronym: "DER", definition: "An employee authorized by the employer to take immediate action to remove employees from safety-sensitive duties, make required decisions, and receive test results and other communications for the employer." },
  { term: "Split Specimen", definition: "In DOT drug testing, the urine sample is divided into two bottles (A and B). If Bottle A tests positive, the employee can request testing of Bottle B at a different laboratory." },
  { term: "Refusal to Test", definition: "Behaviors that constitute a refusal include: failure to appear for a test, leaving the collection site before the process is complete, failing to provide a sufficient specimen without a valid medical explanation, tampering with or substituting a specimen, or refusing to submit to a direct observation collection when required." },
];

const COMPLIANCE_TERMS: Term[] = [
  { term: "Code of Federal Regulations", acronym: "CFR", definition: "The codification of the general and permanent rules and regulations published in the Federal Register by executive departments and agencies of the federal government. Compliance requirements are found throughout various CFR titles." },
  { term: "Compliance Program", definition: "A set of internal policies, procedures, and practices designed to ensure that an organization adheres to applicable laws, regulations, and ethical standards." },
  { term: "Regulatory Compliance", definition: "The process by which an organization adheres to laws, regulations, guidelines, and specifications relevant to its operations. Non-compliance can result in legal penalties, fines, and reputational damage." },
  { term: "Workers' Compensation", acronym: "Workers' Comp", definition: "A form of insurance providing wage replacement and medical benefits to employees injured during the course of employment, in exchange for the employee's right to sue the employer for negligence." },
  { term: "Return to Work", acronym: "RTW", definition: "A program designed to bring injured or ill employees back to productive work as soon as medically appropriate, often through modified or transitional duty assignments." },
  { term: "Modified Duty", definition: "Temporary work assignments that accommodate an employee's physical limitations while they recover from a work-related injury or illness. May involve lighter tasks, reduced hours, or different job functions." },
  { term: "Incident Investigation", definition: "A systematic process of determining the root cause(s) of workplace accidents, injuries, near misses, or property damage. The goal is to identify what happened, why, and how to prevent recurrence." },
  { term: "Root Cause Analysis", acronym: "RCA", definition: "A method of problem-solving used to identify the underlying cause(s) of an incident or nonconformity. Goes beyond surface-level symptoms to find the fundamental reason for the failure." },
  { term: "Safety Committee", definition: "A group of management and employee representatives who meet regularly to discuss safety and health issues, review incidents, recommend corrective actions, and promote a culture of safety." },
  { term: "Workplace Violence Prevention", definition: "Programs and policies designed to reduce or eliminate the risk of violence in the workplace, including threat assessment, employee training, reporting procedures, and security measures." },
  { term: "Ergonomics", definition: "The science of designing the workplace to fit the worker, reducing the risk of musculoskeletal disorders (MSDs). Involves proper workstation setup, tool design, and work practices." },
  { term: "Industrial Hygiene", acronym: "IH", definition: "The science of anticipating, recognizing, evaluating, and controlling workplace conditions that may cause workers' injury or illness. Covers chemical, physical, biological, and ergonomic hazards." },
  { term: "Hierarchy of Controls", definition: "A system used to minimize or eliminate workplace hazards, ranked from most to least effective: Elimination, Substitution, Engineering Controls, Administrative Controls, and Personal Protective Equipment (PPE)." },
  { term: "Behavior-Based Safety", acronym: "BBS", definition: "A safety management approach that focuses on identifying and reinforcing safe behaviors while discouraging at-risk behaviors through observation, feedback, and positive reinforcement." },
  { term: "Leading Indicators", definition: "Proactive, preventive measures that track activities to prevent incidents before they occur. Examples: safety training hours, inspections completed, near-miss reports submitted." },
  { term: "Lagging Indicators", definition: "Reactive metrics that measure past safety outcomes. Examples: TRIR, DART rate, number of lost-time injuries, workers' comp costs. Useful for identifying trends but cannot prevent incidents." },
  { term: "Safety Culture", definition: "The shared values, beliefs, perceptions, and attitudes about safety within an organization. A positive safety culture is characterized by open communication, management commitment, employee involvement, and continuous learning." },
];

const ALL_CATEGORIES = [
  { id: "osha", label: "OSHA", icon: ShieldCheck, terms: OSHA_TERMS, color: "bg-blue-100 text-blue-700" },
  { id: "dot", label: "DOT", icon: Truck, terms: DOT_TERMS, color: "bg-green-100 text-green-700" },
  { id: "drug-alcohol", label: "Drug & Alcohol", icon: FlaskConical, terms: DRUG_ALCOHOL_TERMS, color: "bg-red-100 text-red-700" },
  { id: "compliance", label: "Compliance", icon: Scale, terms: COMPLIANCE_TERMS, color: "bg-orange-100 text-orange-700" },
];

export default function ComplianceGlossary() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: subStatus } = useQuery<{ isPro: boolean; hasPlatform: boolean }>({
    queryKey: ['/api/subscriptions/status'],
    enabled: isAuthenticated,
  });

  const { data: superadminCheck } = useQuery<{ isSuperadmin: boolean }>({
    queryKey: ['/api/superadmin/check'],
    enabled: isAuthenticated,
  });

  const hasAccess = (subStatus as any)?.hasPlatform === true || superadminCheck?.isSuperadmin === true;

  const filterTerms = (terms: Term[]) => {
    if (!searchQuery.trim()) return terms;
    const q = searchQuery.toLowerCase();
    return terms.filter(t =>
      t.term.toLowerCase().includes(q) ||
      (t.acronym && t.acronym.toLowerCase().includes(q)) ||
      t.definition.toLowerCase().includes(q)
    );
  };

  const totalTerms = ALL_CATEGORIES.reduce((sum, cat) => sum + cat.terms.length, 0);

  return (
    <ProtectedLayout>
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="w-7 h-7 text-accent" />
        <div>
          <h2 className="text-2xl font-display font-bold text-primary" data-testid="text-glossary-title">
            Compliance Glossary
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalTerms} essential definitions across OSHA, DOT, Drug & Alcohol Testing, and General Compliance.
          </p>
        </div>
      </div>

        {!hasAccess && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="flex items-center gap-4 py-4">
              <Lock className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Employer Platform Required</p>
                <p className="text-sm text-amber-600">
                  The Compliance Glossary is included with the Employer Compliance Platform ($599/mo).
                </p>
              </div>
              <Link href="/get-started">
                <Button size="sm" className="ml-auto whitespace-nowrap" data-testid="button-upgrade-glossary">
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {hasAccess && (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search terms, acronyms, or definitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-glossary-search"
              />
            </div>

            <Tabs defaultValue="osha" className="space-y-6">
              <TabsList className="flex flex-wrap h-auto gap-1">
                {ALL_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const filteredCount = filterTerms(cat.terms).length;
                  return (
                    <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5" data-testid={`tab-glossary-${cat.id}`}>
                      <Icon className="w-4 h-4" />
                      {cat.label}
                      {searchQuery && <Badge variant="secondary" className="text-xs ml-1">{filteredCount}</Badge>}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {ALL_CATEGORIES.map(cat => {
                const filtered = filterTerms(cat.terms);
                return (
                  <TabsContent key={cat.id} value={cat.id}>
                    <div className="space-y-3">
                      {filtered.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            No terms match your search in this category.
                          </CardContent>
                        </Card>
                      ) : (
                        filtered.map((term, idx) => (
                          <Card key={idx} data-testid={`card-term-${cat.id}-${idx}`}>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-3">
                                <CardTitle className="text-base font-semibold">
                                  {term.term}
                                </CardTitle>
                                <div className="flex items-center gap-2 shrink-0">
                                  {term.acronym && (
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {term.acronym}
                                    </Badge>
                                  )}
                                  <Badge className={`${cat.color} text-xs`}>
                                    {cat.label}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground leading-relaxed">{term.definition}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </>
        )}

        {hasAccess && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-2">Can't find a term? Ask Corey for a detailed explanation.</p>
            <Link href="/bot">
              <Button variant="outline" data-testid="button-ask-corey-glossary">
                Ask Corey
              </Button>
            </Link>
          </div>
        )}
    </ProtectedLayout>
  );
}
