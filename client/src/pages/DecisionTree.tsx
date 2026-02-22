import { useState } from "react";
import { ProtectedLayout } from "@/components/Layout";
import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, ArrowRight, RotateCcw, Lock, ChevronDown, ChevronUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

const SEVERITY_CRITERIA = [
  {
    id: "death",
    label: "Death",
    explanation: "If the work-related injury or illness results in the death of an employee, it must be recorded on the OSHA 300 Log. Additionally, you must report the fatality to OSHA within 8 hours of learning about it (29 CFR 1904.39).",
    citation: "OSHA 1904.7(b)(2)"
  },
  {
    id: "days_away",
    label: "Days Away from Work",
    explanation: "If a physician or other licensed health care professional recommends that the employee stay home or the employee is unable to work because of the injury/illness, it is recordable. Even one day away from work (not counting the day of the incident) triggers this criterion.",
    citation: "OSHA 1904.7(b)(3)"
  },
  {
    id: "restricted_work",
    label: "Restricted Work or Job Transfer",
    explanation: "If the employee is unable to perform one or more of their routine job functions, or is moved to a different job due to the work-related injury or illness, it is recordable. Restricted duty means the employee cannot perform all the essential functions of their regular position.",
    citation: "OSHA 1904.7(b)(4)"
  },
  {
    id: "medical_treatment",
    label: "Medical Treatment Beyond First Aid",
    explanation: "If the treatment goes beyond what OSHA defines as 'first aid,' it is recordable. First aid includes things like non-prescription medications, tetanus shots, wound cleaning, bandages, hot/cold therapy, and draining blisters. Anything beyond that — such as sutures (stitches), prescription medications, physical therapy, or surgical procedures — is considered medical treatment and makes the case recordable.",
    citation: "OSHA 1904.7(a)"
  },
  {
    id: "loss_of_consciousness",
    label: "Loss of Consciousness",
    explanation: "Any work-related injury or illness that causes the employee to lose consciousness, even briefly, is automatically recordable — regardless of what other treatment is provided. Duration of unconsciousness does not matter; any loss of consciousness triggers recordability.",
    citation: "OSHA 1904.7(b)(5)(i)"
  },
  {
    id: "diagnosis",
    label: "Significant Injury/Illness Diagnosed by Physician",
    explanation: "If a physician or other licensed health care professional diagnoses a significant work-related injury or illness — such as cancer, chronic irreversible disease, fractured or cracked bones, or a punctured eardrum — it is recordable even if it does not result in any of the other criteria listed above.",
    citation: "OSHA 1904.7(b)(5)(ii)"
  }
];

const TREE_DATA = [
  {
    id: "start",
    question: "Did the employee experience an injury or illness?",
    yes: "work_related",
    no: "not_recordable",
    citation: "OSHA 1904.7(a)"
  },
  {
    id: "work_related",
    question: "Is the injury or illness work-related?",
    yes: "new_case",
    no: "not_recordable",
    citation: "OSHA 1904.5"
  },
  {
    id: "new_case",
    question: "Is this a new case?",
    yes: "severity",
    no: "update_prev",
    citation: "OSHA 1904.6"
  },
  {
    id: "severity",
    question: "Did it result in any of the following?",
    yes: "recordable",
    no: "not_recordable",
    citation: "OSHA 1904.7(b)"
  }
];

export default function DecisionTree() {
  const { data: subStatus, isLoading } = useSubscriptionStatus();
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [history, setHistory] = useState<string[]>([]);
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);

  const currentNode = TREE_DATA.find(n => n.id === currentNodeId);

  const handleAnswer = (nextId: string) => {
    setHistory([...history, currentNodeId]);
    setCurrentNodeId(nextId);
  };

  const handleCriteriaSelect = (criterionId: string) => {
    setSelectedCriterion(criterionId);
    setHistory([...history, currentNodeId]);
    setCurrentNodeId("recordable");
  };

  const handleNoneApply = () => {
    setSelectedCriterion(null);
    setHistory([...history, currentNodeId]);
    setCurrentNodeId("not_recordable");
  };

  const reset = () => {
    setCurrentNodeId("start");
    setHistory([]);
    setExpandedCriteria(null);
    setSelectedCriterion(null);
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
              <h2 className="text-3xl font-bold mb-4 text-accent" data-testid="text-result-title">OSHA Recordable</h2>
              <p className="text-lg text-muted-foreground mb-6">
                This case meets the general recording criteria under OSHA 1904.7.
              </p>
              {criterion && (
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-5 text-left mb-8" data-testid="card-reason-explanation">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-primary mb-1">
                        Recordable Because: {criterion.label}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {criterion.explanation}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-2">
                        Ref: {criterion.citation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <Button onClick={reset} size="lg" className="w-full sm:w-auto" data-testid="button-start-new">
                Start New Assessment
              </Button>
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
          onReset={reset}
        />
      </ProtectedLayout>
    );
  }

  if (currentNodeId === "update_prev") {
    return (
      <ProtectedLayout>
        <ResultCard 
          title="Update Previous Case"
          description="Update the entry for the previous injury or illness if necessary."
          type="info"
          onReset={reset}
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
                                <Button
                                  onClick={() => handleCriteriaSelect(criterion.id)}
                                  className="mt-4 w-full"
                                  data-testid={`button-select-${criterion.id}`}
                                >
                                  Yes, this applies
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
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
                  <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground" data-testid="button-restart">
                    <RotateCcw className="w-4 h-4 mr-2" /> Restart
                  </Button>
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
                <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground" data-testid="button-restart">
                  <RotateCcw className="w-4 h-4 mr-2" /> Restart
                </Button>
                <span className="text-xs text-muted-foreground">Step {history.length + 1}</span>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </ProtectedLayout>
  );
}

function ResultCard({ title, description, type, onReset }: any) {
  const isRecordable = type === 'recordable';
  const colorClass = isRecordable ? 'text-accent' : 'text-green-600';
  const Icon = isRecordable ? AlertCircle : CheckCircle;

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card className={`shadow-xl text-center p-8 border-t-4 ${isRecordable ? 'border-t-accent' : 'border-t-green-600'}`} data-testid={`card-result-${type}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isRecordable ? 'bg-accent/10' : 'bg-green-100'}`}>
          <Icon className={`w-10 h-10 ${colorClass}`} />
        </div>
        <h2 className={`text-3xl font-bold mb-4 ${colorClass}`} data-testid="text-result-title">{title}</h2>
        <p className="text-xl text-muted-foreground mb-8" data-testid="text-result-description">{description}</p>
        <Button onClick={onReset} size="lg" className="w-full sm:w-auto" data-testid="button-start-new">
          Start New Assessment
        </Button>
      </Card>
    </div>
  );
}
