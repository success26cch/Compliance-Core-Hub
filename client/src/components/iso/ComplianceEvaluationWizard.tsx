/* ─────────────────────────────────────────────────────────────────────────────
 * ComplianceEvaluationWizard
 * ISO 14001 9.1.2 — "Are we actually COMPLIANT with this requirement?"
 * Triggered from an expanded obligation row in the Compliance Register.
 * On completion: suggests a status and offers to create an evaluation log entry.
 * ───────────────────────────────────────────────────────────────────────────── */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, HelpCircle, ChevronRight, ClipboardCheck,
  AlertTriangle, Sparkles,
} from "lucide-react";
import {
  findQuestionSet,
  scoreEvaluation,
  type QuestionAnswer,
  type EvaluationQuestion,
} from "@/data/complianceQuestionBank";
import type { IsoComplianceObligation } from "@shared/schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation: IsoComplianceObligation;
  onAccept: (payload: {
    suggestedStatus: string;
    findingsText: string;
    updateStatus: boolean;
    createEvaluation: boolean;
  }) => void;
}

const STATUS_CONFIG = {
  compliant: {
    label: "Compliant",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40",
    advice: "All assessment questions were answered affirmatively. Your facility appears to be meeting this compliance obligation. We recommend accepting this result and logging it as a formal 9.1.2 evaluation entry to create your audit trail.",
  },
  non_compliant: {
    label: "Non-Compliant",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40",
    advice: "One or more compliance gaps were identified. This requirement should be flagged as Non-Compliant. Log this as a 9.1.2 evaluation entry and initiate a Corrective Action to address the identified gaps.",
  },
  under_review: {
    label: "Under Review",
    icon: HelpCircle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40",
    advice: "Some answers were uncertain. Set the status to Under Review and assign a responsible person to gather the missing information. Log this as a 9.1.2 evaluation entry to document that an evaluation was initiated.",
  },
};

function AnswerButton({
  answer,
  selected,
  onClick,
}: {
  answer: QuestionAnswer;
  selected: boolean;
  onClick: () => void;
}) {
  const configs = {
    yes: {
      label: "Yes — We do this",
      icon: CheckCircle2,
      color: selected
        ? "bg-emerald-600 text-white border-emerald-600"
        : "border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
    },
    no: {
      label: "No — We do not",
      icon: XCircle,
      color: selected
        ? "bg-red-500 text-white border-red-500"
        : "border-border hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
    },
    not_sure: {
      label: "Not Sure",
      icon: HelpCircle,
      color: selected
        ? "bg-amber-500 text-white border-amber-500"
        : "border-border hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20",
    },
  };
  const cfg = configs[answer];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${cfg.color}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {cfg.label}
    </button>
  );
}

export default function ComplianceEvaluationWizard({ open, onOpenChange, obligation, onAccept }: Props) {
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [showResult, setShowResult] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(true);
  const [createEval, setCreateEval] = useState(true);

  const qs = findQuestionSet(
    obligation.requirementName,
    obligation.aspectCategory,
    obligation.citationSource
  );

  function reset() {
    setAnswers({});
    setShowResult(false);
    setUpdateStatus(true);
    setCreateEval(true);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleAnswer(id: string, answer: QuestionAnswer) {
    setAnswers(prev => ({ ...prev, [id]: answer }));
  }

  function handleSubmit() {
    setShowResult(true);
  }

  const allAnswered = qs
    ? qs.evaluationQuestions.every(q => answers[q.id])
    : false;

  const evalResult =
    showResult && qs
      ? scoreEvaluation(qs.evaluationQuestions, answers)
      : null;

  const resultCfg = evalResult ? STATUS_CONFIG[evalResult.status] : null;

  function handleAccept() {
    if (!evalResult) return;
    onAccept({
      suggestedStatus: evalResult.status,
      findingsText: evalResult.findingsText,
      updateStatus,
      createEvaluation: createEval,
    });
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/40">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className="w-5 h-5 text-accent" />
              <DialogTitle className="text-base font-bold">Compliance Evaluation Wizard</DialogTitle>
              <Badge className="bg-accent/10 text-accent border-accent/30 text-xs border">
                ISO 14001 9.1.2
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Under 9.1.2, your organization must <strong>evaluate compliance with legal and other requirements on a periodic basis and maintain evaluation records.</strong> This wizard walks you through a structured self-assessment to determine your compliance status and generate an evaluation log entry.
            </p>
          </DialogHeader>

          {/* Obligation being evaluated */}
          <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Requirement Being Evaluated</p>
            <p className="text-sm font-semibold text-primary">{obligation.requirementName}</p>
            <div className="flex gap-3 mt-1 flex-wrap">
              {obligation.citationSource && (
                <p className="text-xs font-mono text-accent/80">{obligation.citationSource}</p>
              )}
              <p className="text-xs text-muted-foreground">{obligation.aspectCategory}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          {!qs ? (
            /* No question set — show generic guidance + Ask Corey prompt */
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-primary mb-1">
                No pre-built assessment questions for this requirement
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5 max-w-sm mx-auto">
                A structured question set is not yet available for this regulation category. You can evaluate compliance manually or use <strong>Ask Corey</strong> in the register for an AI-guided assessment.
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 px-4 py-3 text-left text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Guidance for manual evaluation:</p>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>Review the full text of the cited regulation or standard</li>
                  <li>Identify all specific requirements (permits, records, limits, training, inspections)</li>
                  <li>Compare each requirement against your current documented practices</li>
                  <li>Document gaps and assign corrective actions for any non-conformances</li>
                  <li>Log the evaluation result in the Evaluation Log tab</li>
                </ol>
              </div>
            </div>
          ) : showResult && evalResult && resultCfg ? (
            /* Result screen */
            <div className="space-y-5">
              {/* Status result */}
              <div className={`rounded-xl border p-5 ${resultCfg.bg}`}>
                <div className="flex items-start gap-3">
                  <resultCfg.icon className={`w-7 h-7 shrink-0 mt-0.5 ${resultCfg.color}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-base font-bold ${resultCfg.color}`}>
                        Suggested Status: {resultCfg.label}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{resultCfg.advice}</p>
                  </div>
                </div>
                {/* Score bar */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-border/30">
                  <div className="text-center">
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{evalResult.yesCount}</div>
                    <div className="text-xs text-muted-foreground">Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-red-500">{evalResult.noCount}</div>
                    <div className="text-xs text-muted-foreground">Non-Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-amber-500">{evalResult.notSureCount}</div>
                    <div className="text-xs text-muted-foreground">Under Review</div>
                  </div>
                </div>
              </div>

              {/* Detailed Q&A summary */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Detailed Responses</p>
                <div className="space-y-2.5">
                  {qs.evaluationQuestions.map((q: EvaluationQuestion, i: number) => {
                    const a = answers[q.id];
                    const Icon = a === "yes" ? CheckCircle2 : a === "no" ? XCircle : HelpCircle;
                    const color =
                      a === "yes"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : a === "no"
                        ? "text-red-500"
                        : "text-amber-500";
                    const label = a === "yes" ? "Yes" : a === "no" ? "No" : "Not Sure";
                    return (
                      <div key={q.id} className="flex items-start gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-primary">{q.text}</span>
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${color}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action options */}
              <div className="rounded-lg border border-border/50 bg-muted/20 px-4 py-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">What would you like to do with these results?</p>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateStatus}
                    onChange={e => setUpdateStatus(e.target.checked)}
                    className="accent-accent w-4 h-4"
                  />
                  <span className="text-sm text-primary">Update the requirement's compliance status to <strong>{resultCfg.label}</strong></span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createEval}
                    onChange={e => setCreateEval(e.target.checked)}
                    className="accent-accent w-4 h-4"
                  />
                  <span className="text-sm text-primary">Create a 9.1.2 Evaluation Log entry with these responses as findings</span>
                </label>
                <p className="text-xs text-muted-foreground italic">
                  ISO 14001 9.1.2 requires that you retain documented information as evidence of the evaluation results.
                </p>
              </div>

              {evalResult.noCount > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 px-4 py-3">
                  <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Tip:</strong> Use <em>Ask Corey</em> in the register to get AI-guided corrective action recommendations for the gaps identified above.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Question list */
            <div className="space-y-6">
              <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
                <p className="text-xs text-accent/90 leading-relaxed">{qs.evaluationIntro}</p>
              </div>

              {qs.evaluationQuestions.map((q: EvaluationQuestion, i: number) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-primary leading-snug">{q.text}</p>
                      {q.hint && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{q.hint}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-8">
                    {(["yes", "no", "not_sure"] as QuestionAnswer[]).map(a => (
                      <AnswerButton
                        key={a}
                        answer={a}
                        selected={answers[q.id] === a}
                        onClick={() => handleAnswer(q.id, a)}
                      />
                    ))}
                  </div>
                  {i < qs.evaluationQuestions.length - 1 && (
                    <div className="border-b border-border/30 ml-8" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border/40 flex justify-between items-center gap-3">
          {showResult && evalResult ? (
            <>
              <Button variant="outline" size="sm" onClick={reset} className="text-sm">
                Re-assess
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)} className="text-sm">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={!updateStatus && !createEval}
                  className="gap-1.5 bg-accent hover:bg-accent/90 text-white text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accept Results
                </Button>
              </div>
            </>
          ) : !qs ? (
            <Button size="sm" variant="outline" onClick={() => handleOpenChange(false)} className="ml-auto text-sm">
              Close
            </Button>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">
                {Object.keys(answers).length} of {qs.evaluationQuestions.length} questions answered
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="gap-1.5 bg-accent hover:bg-accent/90 text-white text-sm disabled:opacity-50"
              >
                See Assessment Results <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
