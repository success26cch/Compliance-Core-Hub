import { useState } from "react";
import { ProtectedLayout } from "@/components/Layout";
import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ArrowRight, RotateCcw, Lock, ChevronDown, ChevronUp, Info, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

type SubQuestion = {
  question: string;
  recordable: string;
  notRecordable: string;
  yesIsRecordable?: boolean; // false = "Yes" answer means first aid / not recordable
};

type SeverityCriterion = {
  id: string;
  label: string;
  explanation: string;
  citation: string;
  subQuestions: SubQuestion[];
};

const SEVERITY_CRITERIA: SeverityCriterion[] = [
  {
    id: "death",
    label: "Death",
    explanation: "If the work-related injury or illness results in the death of an employee, it must be recorded on the OSHA 300 Log. Additionally, you must report the fatality to OSHA within 8 hours of learning about it (29 CFR 1904.39).",
    citation: "OSHA 1904.7(b)(2)",
    subQuestions: [
      {
        question: "Did the employee pass away as a result of the work-related incident?",
        recordable: "A work-related fatality is always recordable. You must also report to OSHA within 8 hours.",
        notRecordable: "If the death was not work-related (e.g., pre-existing condition with no workplace contributing factor), it may not be recordable. Consult OSHA 1904.5 for work-relatedness."
      }
    ]
  },
  {
    id: "days_away",
    label: "Days Away from Work",
    explanation: "If a physician or other licensed health care professional recommends that the employee stay home or the employee is unable to work because of the injury/illness, it is recordable. Even one day away from work (not counting the day of the incident) triggers this criterion.",
    citation: "OSHA 1904.7(b)(3)",
    subQuestions: [
      {
        question: "Did a doctor or health care professional recommend the employee stay home from work?",
        recordable: "A physician's recommendation for days away — even just one day beyond the date of injury — makes this recordable. You must count calendar days, not just scheduled work days.",
        notRecordable: "If the employee chose to stay home on their own without a medical recommendation, it may not trigger this criterion — but review whether any other criteria apply."
      },
      {
        question: "Was the employee physically unable to report to work due to the injury, even without a doctor's note?",
        recordable: "If the injury or illness was severe enough that the employee could not work, it is recordable regardless of whether a doctor formally recommended days away.",
        notRecordable: "If the employee was able to work their full duties but chose not to without medical restriction, this criterion may not apply."
      }
    ]
  },
  {
    id: "restricted_work",
    label: "Restricted Work or Job Transfer",
    explanation: "If the employee is unable to perform one or more of their routine job functions, or is moved to a different job due to the work-related injury or illness, it is recordable. Restricted duty means the employee cannot perform all the essential functions of their regular position.",
    citation: "OSHA 1904.7(b)(4)",
    subQuestions: [
      {
        question: "Was the employee placed on light duty or restricted from performing any of their regular job functions?",
        recordable: "Light duty or restricted duty — such as limiting lifting, standing, driving, or operating machinery — means the employee cannot perform all routine functions. This is recordable.",
        notRecordable: "If the employee can perform all of their routine job functions without any restrictions, this criterion does not apply."
      },
      {
        question: "Was the employee temporarily transferred to a different job or role?",
        recordable: "A job transfer due to a work-related injury or illness is recordable, even if the new job pays the same or the employee prefers it.",
        notRecordable: "If the transfer was not related to the work injury (e.g., a planned reassignment), it does not trigger recordability."
      },
      {
        question: "Did the doctor provide a written work restriction (e.g., 'no lifting over 10 lbs')?",
        recordable: "Written medical restrictions that limit any routine job function make the case recordable. Keep the restriction documentation for your records.",
        notRecordable: "General advice like 'take it easy' without specific functional limitations may not constitute a formal restriction. However, document the advice carefully."
      }
    ]
  },
  {
    id: "medications",
    label: "Medications Prescribed",
    explanation: "The type of medication given is a critical factor. Over-the-counter (OTC) medications at non-prescription strength are considered first aid and are NOT recordable. However, prescription-strength medications make the case recordable as medical treatment beyond first aid.",
    citation: "OSHA 1904.7(a) - First Aid Definition",
    subQuestions: [
      {
        question: "Were any medications given or recommended for the injury/illness?",
        recordable: "Medications were given — continue answering the questions below to determine if the type of medication triggers recordability. Not all medications make a case recordable.",
        notRecordable: "If no medications were given and only observation was provided, this criterion alone does not apply. Check other criteria.",
        yesIsRecordable: false
      },
      {
        question: "Was the medication a prescription drug (e.g., prescription-strength ibuprofen, antibiotics, muscle relaxers, opioid pain medication)?",
        recordable: "Prescription medications are medical treatment beyond first aid — this case IS RECORDABLE. This includes prescription-strength NSAIDs, antibiotics for infection, narcotic pain relievers, and prescription muscle relaxers.",
        notRecordable: "Over-the-counter medications at non-prescription strength (e.g., regular Advil, Tylenol, Aspirin, topical antibiotic cream like Neosporin) are considered first aid and do NOT make the case recordable by themselves.",
        yesIsRecordable: true
      },
      {
        question: "Was an antibiotic prescribed (oral or injection, not just topical OTC cream)?",
        recordable: "Prescribed oral or injectable antibiotics are medical treatment beyond first aid — this IS RECORDABLE. Note: OTC topical antibiotics like Neosporin or Bacitracin are first aid.",
        notRecordable: "Using an OTC topical antibiotic ointment (Neosporin, Bacitracin) on a wound is considered first aid and is NOT recordable.",
        yesIsRecordable: true
      },
      {
        question: "Was a tetanus shot given as a preventive measure?",
        recordable: "Tetanus immunizations are specifically listed as FIRST AID under 29 CFR 1904.7(a)(5)(xiv). A tetanus shot alone does NOT make this case recordable — this is NOT recordable on its own.",
        notRecordable: "Tetanus shots are considered first aid regardless of whether given at a clinic, ER, or doctor's office. This does NOT trigger recordability.",
        yesIsRecordable: false
      }
    ]
  },
  {
    id: "medical_treatment",
    label: "Medical Treatment Beyond First Aid",
    explanation: "Any treatment that goes beyond OSHA's specific definition of 'first aid' is considered medical treatment and makes the case recordable. Understanding what qualifies as first aid vs. medical treatment is essential for correct OSHA 300 logging.",
    citation: "OSHA 1904.7(a)",
    subQuestions: [
      {
        question: "Were sutures (stitches) used to close a wound?",
        recordable: "Sutures (stitches) are medical treatment beyond first aid — this is RECORDABLE. Note: Butterfly bandages and Steri-Strips (wound closure strips) ARE considered first aid.",
        notRecordable: "Butterfly bandages, Steri-Strips, and wound closure strips are first aid. Only actual sutures/stitches trigger recordability."
      },
      {
        question: "Was physical therapy prescribed or recommended by a physician?",
        recordable: "Physical therapy prescribed by a health care professional is medical treatment beyond first aid — this is RECORDABLE. Even a single PT session makes it recordable.",
        notRecordable: "General stretching advice or self-directed exercises recommended (not formally prescribed PT) are not considered medical treatment."
      },
      {
        question: "Was a wound drained, debrided (dead tissue removed), or surgically cleaned?",
        recordable: "Surgical wound care, debridement, or draining of infected wounds is medical treatment beyond first aid — RECORDABLE.",
        notRecordable: "Simple wound cleaning, flushing with saline or water, and applying bandages are first aid."
      },
      {
        question: "Were splints, casts, or rigid immobilization devices applied?",
        recordable: "Applying a rigid splint, cast, or immobilization device is medical treatment beyond first aid — RECORDABLE. This includes walking boots for fractures.",
        notRecordable: "Temporary splinting or elastic bandages (ACE wraps) used to stabilize a strain are generally first aid. However, if the device is rigid and meant to immobilize, it crosses into medical treatment."
      },
      {
        question: "Was a foreign body removed from the eye using specialized instruments?",
        recordable: "Removal of foreign bodies from the eye using specialized tools (slit lamp, needle tip, burr) is medical treatment beyond first aid — RECORDABLE.",
        notRecordable: "Flushing the eye with water or saline, or removing a foreign body by simple irrigation, is considered first aid."
      }
    ]
  },
  {
    id: "eye_injury",
    label: "Eye Injury Treatment",
    explanation: "Eye injuries are very common in the workplace. The key distinction is whether treatment stayed within first aid (flushing, OTC drops) or crossed into medical treatment (prescription eye drops, antibiotic prescriptions, instrument-based removal of foreign bodies).",
    citation: "OSHA 1904.7(a) - First Aid Definition",
    subQuestions: [
      {
        question: "Was the eye flushed or irrigated with plain water or saline solution?",
        recordable: "Eye flushing with plain water or saline is FIRST AID — this alone does NOT make the case recordable. Check the follow-up questions to see if additional treatment was given.",
        notRecordable: "Simple irrigation is first aid. However, check what happened after the flush — was additional treatment needed?",
        yesIsRecordable: false
      },
      {
        question: "Were prescription eye drops or prescription antibiotic ointment used (e.g., Erythromycin, Ciprofloxacin, Tobramycin)?",
        recordable: "Prescription eye medications (antibiotic drops, steroid drops, prescription anti-inflammatory drops) are medical treatment beyond first aid — this IS RECORDABLE.",
        notRecordable: "OTC eye drops like Visine, artificial tears, or OTC lubricating drops are first aid and NOT recordable.",
        yesIsRecordable: true
      },
      {
        question: "Was a foreign body removed from the eye using specialized instruments (slit lamp, needle, burr)?",
        recordable: "Instrument-based removal of a foreign body from the eye is medical treatment — this IS RECORDABLE. This is common with metal shavings, grinding debris, or embedded particles.",
        notRecordable: "If the object was removed by simple irrigation or flushing alone, it is first aid.",
        yesIsRecordable: true
      },
      {
        question: "Was an eye patch applied after treatment?",
        recordable: "An eye patch applied by a physician as part of treatment for a significant eye injury may indicate medical treatment — evaluate the overall treatment. If combined with prescription medication, it IS RECORDABLE.",
        notRecordable: "An eye patch alone, without other medical treatment, is generally considered first aid.",
        yesIsRecordable: true
      }
    ]
  },
  {
    id: "loss_of_consciousness",
    label: "Loss of Consciousness",
    explanation: "Any work-related injury or illness that causes the employee to lose consciousness, even briefly, is automatically recordable — regardless of what other treatment is provided. Duration of unconsciousness does not matter; any loss of consciousness triggers recordability.",
    citation: "OSHA 1904.7(b)(5)(i)",
    subQuestions: [
      {
        question: "Did the employee lose consciousness at any point, even for a few seconds?",
        recordable: "ANY loss of consciousness, no matter how brief, makes the case automatically RECORDABLE. It does not matter if the employee recovered quickly or refused further treatment.",
        notRecordable: "If the employee felt dizzy or lightheaded but did NOT actually lose consciousness, this specific criterion does not apply — but check for other criteria."
      },
      {
        question: "Was the loss of consciousness witnessed or reported by the employee?",
        recordable: "Both witnessed and self-reported loss of consciousness count. If the employee reports blacking out, even without witnesses, it should be recorded unless there is clear evidence otherwise.",
        notRecordable: "If there is no indication of loss of consciousness and the employee does not report it, this criterion does not apply."
      }
    ]
  },
  {
    id: "diagnosis",
    label: "Significant Injury/Illness Diagnosed by Physician",
    explanation: "If a physician or other licensed health care professional diagnoses a significant work-related injury or illness — such as cancer, chronic irreversible disease, fractured or cracked bones, or a punctured eardrum — it is recordable even if it does not result in any of the other criteria listed above.",
    citation: "OSHA 1904.7(b)(5)(ii)",
    subQuestions: [
      {
        question: "Did a physician diagnose a fracture (broken or cracked bone)?",
        recordable: "Any fracture diagnosed by a physician is RECORDABLE, even a hairline crack. This includes stress fractures if they are work-related.",
        notRecordable: "If imaging confirms there is no fracture (e.g., just a bruise or sprain), this specific criterion does not apply."
      },
      {
        question: "Was the employee diagnosed with a punctured eardrum (tympanic membrane perforation)?",
        recordable: "A punctured eardrum is specifically listed as a significant diagnosed injury — RECORDABLE.",
        notRecordable: "Temporary hearing changes or ringing (tinnitus) without a diagnosed perforation do not trigger this criterion — but may trigger others if treatment is needed."
      },
      {
        question: "Was the employee diagnosed with an occupational illness (e.g., hearing loss, respiratory disease, skin condition, poisoning)?",
        recordable: "Physician-diagnosed occupational illnesses are RECORDABLE. This includes noise-induced hearing loss (Standard Threshold Shift), occupational asthma, contact dermatitis, chemical exposure illness, and heat stroke.",
        notRecordable: "Temporary symptoms that resolve without a formal diagnosis (e.g., mild irritation) may not meet this criterion."
      },
      {
        question: "Was the employee diagnosed with a chronic or irreversible condition related to work?",
        recordable: "Chronic or irreversible conditions — cancer, silicosis, lead poisoning, carpal tunnel syndrome (if diagnosed) — are RECORDABLE significant injuries/illnesses.",
        notRecordable: "Acute, fully reversible conditions treated only with first aid may not meet this criterion."
      }
    ]
  },
  {
    id: "needle_stick",
    label: "Needlestick or Sharps Exposure",
    explanation: "Needlesticks and cuts from contaminated sharp objects are specifically addressed by OSHA. Any needlestick or sharps injury involving contamination with another person's blood or potentially infectious material is recordable, regardless of whether the employee becomes ill.",
    citation: "OSHA 1904.8",
    subQuestions: [
      {
        question: "Did the employee sustain a needlestick or cut from a sharp object contaminated with blood or bodily fluids?",
        recordable: "Needlestick injuries contaminated with another person's blood or other potentially infectious materials (OPIM) are RECORDABLE under 1904.8, even if no illness develops. This includes scalpel cuts, broken glass with blood, and lancet sticks.",
        notRecordable: "A cut from a clean sharp object (e.g., clean scalpel from packaging, uncontaminated glass) without blood/OPIM exposure is not covered under this specific criterion. Evaluate under general injury criteria."
      },
      {
        question: "Was post-exposure prophylaxis (PEP) or blood testing ordered?",
        recordable: "If PEP, hepatitis or HIV testing was ordered as a result of the exposure, this further confirms recordability. The exposure event itself was recordable.",
        notRecordable: "Baseline blood draws done as routine (not triggered by an exposure event) are not relevant to recordability."
      }
    ]
  },
  {
    id: "hearing",
    label: "Work-Related Hearing Loss",
    explanation: "OSHA has specific recording criteria for hearing loss. A Standard Threshold Shift (STS) is an average shift of 10 dB or more at 2000, 3000, and 4000 Hz in either ear compared to baseline audiogram. If the STS is work-related and the total hearing level is 25 dB or more above audiometric zero, it is recordable.",
    citation: "OSHA 1904.10",
    subQuestions: [
      {
        question: "Did the employee's audiogram show a Standard Threshold Shift (STS)?",
        recordable: "An STS (average 10 dB shift at 2000, 3000, 4000 Hz) that is work-related and where total hearing level is 25 dB or more above audiometric zero is RECORDABLE. You must record it within 7 calendar days of learning about the STS.",
        notRecordable: "If the audiogram does not show an STS, or the total hearing level is below 25 dB, it is not recordable under this criterion."
      },
      {
        question: "Is the employee enrolled in a Hearing Conservation Program and exposed to noise levels at or above 85 dB TWA?",
        recordable: "Employees exposed to 85 dB TWA or higher must be in a Hearing Conservation Program with annual audiometric testing. Any confirmed STS in this group must be evaluated for recordability.",
        notRecordable: "If the employee is not exposed to hazardous noise levels and their hearing loss is not work-related, it is not recordable."
      }
    ]
  }
];

const TREE_DATA = [
  {
    id: "start",
    question: "Did the employee experience an injury or illness?",
    yes: "work_related",
    no: "not_recordable",
    citation: "29 CFR 1904.7(a)",
    noCitation: "29 CFR 1904.7(a)",
    noReason: "No injury or illness occurred. OSHA's recording requirements under 29 CFR Part 1904 only apply to work-related injuries and illnesses — there is nothing to record."
  },
  {
    id: "work_related",
    question: "Is the injury or illness work-related?",
    yes: "new_case",
    no: "not_recordable",
    citation: "29 CFR 1904.5",
    noCitation: "29 CFR 1904.5(a)",
    noReason: "The injury or illness is not work-related. Under 29 CFR 1904.5(a), only work-related injuries and illnesses must be recorded. An event is work-related if it was caused or contributed to by events or exposures in the work environment."
  },
  {
    id: "new_case",
    question: "Is this a new case?",
    yes: "severity",
    no: "update_prev",
    citation: "29 CFR 1904.6",
    noCitation: "29 CFR 1904.6",
    noReason: "This is not a new case. Under 29 CFR 1904.6, if the employee previously experienced a recorded injury or illness of the same type in the same body part, and the new event is a recurrence (not an independently caused new case), the original entry should be updated rather than a new one created."
  },
  {
    id: "severity",
    question: "Did it result in any of the following?",
    yes: "recordable",
    no: "not_recordable",
    citation: "29 CFR 1904.7(b)",
    noCitation: "29 CFR 1904.7(b)(1)",
    noReason: "None of the general recording criteria under 29 CFR 1904.7(b)(1) were met — no death, no days away from work, no restricted work or job transfer, no medical treatment beyond first aid, no loss of consciousness, and no significant injury or illness diagnosed by a physician."
  }
];

type SubAnswers = Record<string, Record<number, 'yes' | 'no'>>;

function SubQuestionPanel({ subQuestions, criterionId, onSelect, answers, onAnswer }: { 
  subQuestions: SubQuestion[]; 
  criterionId: string; 
  onSelect: (id: string) => void;
  answers: Record<number, 'yes' | 'no'>;
  onAnswer: (criterionId: string, index: number, answer: 'yes' | 'no') => void;
}) {
  // Only count "Yes" answers where the question actually triggers recordability
  const hasRecordableYes = subQuestions.some((sq, idx) =>
    answers[idx] === 'yes' && sq.yesIsRecordable !== false
  );

  return (
    <div className="space-y-3 mt-3" data-testid={`subquestions-${criterionId}`}>
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Follow-up Questions</p>
      {subQuestions.map((sq, idx) => {
        const answered = answers[idx];
        // A "Yes" on a non-recordable question (e.g. tetanus, eye flush) shows green, not red
        const yesTriggersRecordable = sq.yesIsRecordable !== false;
        const showsRecordableAlert = answered === 'yes' && yesTriggersRecordable;
        const showsFirstAidNote = answered === 'yes' && !yesTriggersRecordable;

        return (
          <div key={idx} className="bg-background rounded-md border p-3" data-testid={`subq-${criterionId}-${idx}`}>
            <p className="text-sm font-medium text-primary mb-2">{sq.question}</p>
            {!answered ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAnswer(criterionId, idx, 'yes')}
                  className="flex-1"
                  data-testid={`button-subq-yes-${criterionId}-${idx}`}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAnswer(criterionId, idx, 'no')}
                  className="flex-1"
                  data-testid={`button-subq-no-${criterionId}-${idx}`}
                >
                  No
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`rounded-md p-3 text-sm leading-relaxed ${
                  showsRecordableAlert
                    ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                    : 'bg-primary/5 border border-primary/15 text-foreground'
                }`} data-testid={`result-subq-${criterionId}-${idx}`}>
                  <div className="flex items-start gap-2">
                    {showsRecordableAlert ? (
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    )}
                    <span>
                      {showsFirstAidNote ? sq.recordable : answered === 'yes' ? sq.recordable : sq.notRecordable}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
      <Button
        onClick={() => onSelect(criterionId)}
        className="w-full mt-2"
        disabled={!hasRecordableYes}
        data-testid={`button-select-${criterionId}`}
      >
        {hasRecordableYes ? "Yes, this criterion applies — Mark as Recordable" : "Answer the questions above to continue"}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

export default function DecisionTree() {
  const { data: subStatus, isLoading } = useSubscriptionStatus();
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [history, setHistory] = useState<string[]>([]);
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);
  const [subAnswers, setSubAnswers] = useState<SubAnswers>({});
  const [resultCitation, setResultCitation] = useState<string>("");
  const [resultCitationReason, setResultCitationReason] = useState<string>("");

  const currentNode = TREE_DATA.find(n => n.id === currentNodeId) as any;

  const handleAnswer = (nextId: string) => {
    // Capture the citation for terminal outcomes
    if (nextId === "not_recordable" || nextId === "update_prev") {
      setResultCitation((currentNode as any)?.noCitation || (currentNode as any)?.citation || "");
      setResultCitationReason((currentNode as any)?.noReason || "");
    }
    setHistory([...history, currentNodeId]);
    setCurrentNodeId(nextId);
  };

  const handleCriteriaSelect = (criterionId: string) => {
    const criterion = SEVERITY_CRITERIA.find(c => c.id === criterionId);
    setResultCitation(criterion?.citation || "29 CFR 1904.7(b)");
    setResultCitationReason(criterion?.explanation || "");
    setSelectedCriterion(criterionId);
    setHistory([...history, currentNodeId]);
    setCurrentNodeId("recordable");
  };

  const handleNoneApply = () => {
    setResultCitation("29 CFR 1904.7(b)(1)");
    setResultCitationReason("None of the general recording criteria under 29 CFR 1904.7(b)(1) were met — no death, no days away from work, no restricted work or job transfer, no medical treatment beyond first aid, no loss of consciousness, and no significant injury or illness diagnosed by a physician.");
    setSelectedCriterion(null);
    setHistory([...history, currentNodeId]);
    setCurrentNodeId("not_recordable");
  };

  const handleSubAnswer = (criterionId: string, index: number, answer: 'yes' | 'no') => {
    setSubAnswers(prev => ({
      ...prev,
      [criterionId]: { ...(prev[criterionId] || {}), [index]: answer }
    }));
  };

  const reset = () => {
    setCurrentNodeId("start");
    setHistory([]);
    setExpandedCriteria(null);
    setSelectedCriterion(null);
    setSubAnswers({});
    setResultCitation("");
    setResultCitationReason("");
  };

  const goBack = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const previousNodeId = newHistory.pop()!;
    setHistory(newHistory);
    setCurrentNodeId(previousNodeId);
    setResultCitation("");
    setResultCitationReason("");
    setSelectedCriterion(null);
    setExpandedCriteria(null);
  };

  if (isLoading) return null;

  if (!subStatus?.isPro) {
    return (
      <ProtectedLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="bg-white rounded-2xl shadow-xl p-12 border border-border/50">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent mb-6">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-primary mb-4" data-testid="text-pro-locked">Pro Feature Locked</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              The Interactive OSHA 300, Log it or Not tool is available exclusively for Pro subscribers. 
              Ensure compliance with accurate, guided assessments.
            </p>
            <Link href="/settings">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white w-full sm:w-auto" data-testid="button-upgrade">
                Upgrade to Access
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (currentNodeId === "recordable") {
    const criterion = SEVERITY_CRITERIA.find(c => c.id === selectedCriterion);
    return (
      <ProtectedLayout>
        <div className="max-w-2xl mx-auto py-10">
          <Card className="shadow-xl border-t-4 border-t-accent" data-testid="card-result-recordable">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-accent/10">
                <AlertCircle className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-accent" data-testid="text-result-title">OSHA Recordable</h2>
              <p className="text-lg text-muted-foreground mb-6">
                This case meets the general recording criteria under 29 CFR 1904.7.
              </p>
              {criterion && (
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-5 text-left mb-4" data-testid="card-reason-explanation">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary mb-1">
                        Recordable Because: {criterion.label}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {criterion.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left mb-8" data-testid="card-result-citation">
                <p className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-1">Regulatory Citation</p>
                <p className="text-sm font-mono font-semibold text-primary" data-testid="text-result-citation">
                  {resultCitation || criterion?.citation || "29 CFR 1904.7(b)"}
                </p>
                {resultCitationReason && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{resultCitationReason}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={goBack} className="gap-2" data-testid="button-back-result">
                  <ChevronLeft className="w-4 h-4" /> Go Back
                </Button>
                <Button onClick={reset} size="lg" data-testid="button-start-new">
                  Start New Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedLayout>
    );
  }

  if (currentNodeId === "not_recordable") {
    return (
      <ProtectedLayout>
        <ResultCard 
          title="Not Recordable"
          description="Based on your answers, this case does not need to be recorded on the OSHA 300 Log."
          type="not_recordable"
          citation={resultCitation}
          citationReason={resultCitationReason}
          onReset={reset}
          onBack={goBack}
        />
      </ProtectedLayout>
    );
  }

  if (currentNodeId === "update_prev") {
    return (
      <ProtectedLayout>
        <ResultCard 
          title="Update Previous Case"
          description="This is not a new case. Update the existing OSHA 300 Log entry for the previous injury or illness if necessary."
          type="info"
          citation={resultCitation}
          citationReason={resultCitationReason}
          onReset={reset}
          onBack={goBack}
        />
      </ProtectedLayout>
    );
  }

  if (currentNodeId === "severity") {
    return (
      <ProtectedLayout>
        <div className="max-w-2xl mx-auto py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key="severity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg border-t-4 border-t-primary" data-testid="card-severity-step">
                <CardHeader>
                  <CardTitle className="text-2xl font-display text-primary leading-tight" data-testid="text-severity-question">
                    Did it result in any of the following?
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Select a criterion below to see why it makes the case recordable. Tap to expand the explanation, then select if it applies.
                  </CardDescription>
                  <p className="text-sm text-muted-foreground font-mono mt-2">
                    Ref: OSHA 1904.7(b)
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {SEVERITY_CRITERIA.map((criterion) => {
                    const isExpanded = expandedCriteria === criterion.id;
                    return (
                      <div
                        key={criterion.id}
                        className="border rounded-lg overflow-hidden transition-all"
                        data-testid={`criteria-${criterion.id}`}
                      >
                        <button
                          onClick={() => setExpandedCriteria(isExpanded ? null : criterion.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                          data-testid={`button-expand-${criterion.id}`}
                        >
                          <span className="font-medium text-primary">{criterion.label}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="px-4 pb-4 border-t bg-muted/20">
                                <div className="flex items-start gap-3 pt-3">
                                  <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-explanation-${criterion.id}`}>
                                      {criterion.explanation}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono mt-2">
                                      Ref: {criterion.citation}
                                    </p>
                                  </div>
                                </div>
                                <SubQuestionPanel
                                  subQuestions={criterion.subQuestions}
                                  criterionId={criterion.id}
                                  onSelect={handleCriteriaSelect}
                                  answers={subAnswers[criterion.id] || {}}
                                  onAnswer={handleSubAnswer}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={handleNoneApply}
                      className="w-full h-14 text-lg justify-between px-6"
                      data-testid="button-none-apply"
                    >
                      None of the above apply
                      <ArrowRight className="w-5 h-5 opacity-50" />
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                  <div className="flex gap-2">
                    {history.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground" data-testid="button-back-severity">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground" data-testid="button-restart">
                      <RotateCcw className="w-4 h-4 mr-2" /> Restart
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">Step {history.length + 1}</span>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNodeId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg border-t-4 border-t-primary" data-testid="card-question">
              <CardHeader>
                <CardTitle className="text-2xl font-display text-primary leading-tight" data-testid="text-question">
                  {currentNode?.question}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-2">
                  Ref: {currentNode?.citation}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <Button 
                    onClick={() => handleAnswer(currentNode?.yes!)} 
                    className="h-14 text-lg justify-between px-6"
                    data-testid="button-yes"
                  >
                    Yes
                    <ArrowRight className="w-5 h-5 opacity-50" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleAnswer(currentNode?.no!)} 
                    className="h-14 text-lg justify-between px-6"
                    data-testid="button-no"
                  >
                    No
                    <ArrowRight className="w-5 h-5 opacity-50" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                <div className="flex gap-2">
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground" data-testid="button-back">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground" data-testid="button-restart">
                    <RotateCcw className="w-4 h-4 mr-2" /> Restart
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">Step {history.length + 1}</span>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </ProtectedLayout>
  );
}

function ResultCard({ title, description, type, citation, citationReason, onReset, onBack }: any) {
  const isRecordable = type === 'recordable';
  const isInfo = type === 'info';
  const colorClass = isRecordable ? 'text-accent' : isInfo ? 'text-primary' : 'text-green-600';
  const borderClass = isRecordable ? 'border-t-accent' : isInfo ? 'border-t-primary' : 'border-t-green-600';
  const iconBgClass = isRecordable ? 'bg-accent/10' : isInfo ? 'bg-primary/10' : 'bg-green-100';
  const Icon = isRecordable ? AlertCircle : CheckCircle;

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card className={`shadow-xl border-t-4 ${borderClass}`} data-testid={`card-result-${type}`}>
        <CardContent className="p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${iconBgClass}`}>
            <Icon className={`w-10 h-10 ${colorClass}`} />
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${colorClass}`} data-testid="text-result-title">{title}</h2>
          <p className="text-lg text-muted-foreground mb-6" data-testid="text-result-description">{description}</p>
          {citation && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-left mb-8" data-testid="card-result-citation">
              <p className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-1">Regulatory Citation</p>
              <p className="text-sm font-mono font-semibold text-primary" data-testid="text-result-citation">{citation}</p>
              {citationReason && (
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{citationReason}</p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="gap-2" data-testid="button-back-result">
                <ChevronLeft className="w-4 h-4" /> Go Back
              </Button>
            )}
            <Button onClick={onReset} size="lg" data-testid="button-start-new">
              Start New Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
