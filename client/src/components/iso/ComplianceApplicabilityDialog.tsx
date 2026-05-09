/* ─────────────────────────────────────────────────────────────────────────────
 * ComplianceApplicabilityDialog
 * ISO 14001 §6.1.3 — "Does this requirement APPLY to our organization?"
 * Used from the Starter Library dialog to help users decide before importing.
 * ───────────────────────────────────────────────────────────────────────────── */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, HelpCircle, ChevronRight, Scale, AlertTriangle,
} from "lucide-react";
import {
  findQuestionSet,
  scoreApplicability,
  type QuestionAnswer,
  type ApplicabilityQuestion,
} from "@/data/complianceQuestionBank";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    requirementName: string;
    aspectCategory: string;
    citationSource?: string | null;
    descriptionOfRequirement?: string | null;
  };
  onResult?: (result: "likely_applies" | "may_not_apply" | "needs_review") => void;
}

const RESULT_CONFIG = {
  likely_applies: {
    label: "Likely Applies to Your Facility",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    advice: "Based on your answers, this regulation appears to apply to your facility. We recommend adding it to your Compliance Obligations Register (§6.1.3) and scheduling a §9.1.2 compliance evaluation.",
  },
  may_not_apply: {
    label: "May Not Apply to Your Facility",
    icon: XCircle,
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/40",
    badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
    advice: "Based on your answers, this regulation may not apply to your facility at this time. You are not required to add it to your register — however, if facility conditions change, re-evaluate. You may still add it to document your determination.",
  },
  needs_review: {
    label: "Needs Further Review",
    icon: HelpCircle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40",
    badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    advice: "One or more answers were uncertain. We recommend consulting with your environmental compliance contact, your state environmental agency, or using 'Ask Corey' for a deeper analysis before making a final determination.",
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
    yes: { label: "Yes", icon: CheckCircle2, color: selected ? "bg-emerald-600 text-white border-emerald-600" : "border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" },
    no: { label: "No", icon: XCircle, color: selected ? "bg-red-500 text-white border-red-500" : "border-border hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20" },
    not_sure: { label: "Not Sure", icon: HelpCircle, color: selected ? "bg-amber-500 text-white border-amber-500" : "border-border hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20" },
  };
  const cfg = configs[answer];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${cfg.color}`}
    >
      <Icon className="w-4 h-4" />
      {cfg.label}
    </button>
  );
}

export default function ComplianceApplicabilityDialog({ open, onOpenChange, item, onResult }: Props) {
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [showResult, setShowResult] = useState(false);

  const qs = findQuestionSet(item.requirementName, item.aspectCategory, item.citationSource);

  function reset() {
    setAnswers({});
    setShowResult(false);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleAnswer(id: string, answer: QuestionAnswer) {
    setAnswers(prev => ({ ...prev, [id]: answer }));
  }

  function handleSubmit() {
    if (!qs) return;
    const result = scoreApplicability(qs.applicabilityQuestions, answers);
    onResult?.(result);
    setShowResult(true);
  }

  const allAnswered = qs ? qs.applicabilityQuestions.every(q => answers[q.id]) : false;
  const result = showResult && qs ? scoreApplicability(qs.applicabilityQuestions, answers) : null;
  const resultCfg = result ? RESULT_CONFIG[result] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border/40">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-blue-500" />
              <DialogTitle className="text-base font-bold">Applicability Screening</DialogTitle>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 text-xs border">
                ISO 14001 §6.1.3
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Under §6.1.3, your organization must <strong>identify and have access to all legal and other requirements applicable to its environmental aspects.</strong> This screening helps you determine whether this requirement applies to your facility before adding it to your register.
            </p>
          </DialogHeader>

          {/* Requirement being screened */}
          <div className="mt-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-0.5">Requirement Being Screened</p>
            <p className="text-sm font-semibold text-primary">{item.requirementName}</p>
            {item.citationSource && <p className="text-xs font-mono text-accent/80 mt-0.5">{item.citationSource}</p>}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          {!qs ? (
            /* No question set found */
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-primary mb-1">No pre-built screening questions for this requirement</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                This regulation category does not yet have a structured applicability questionnaire. To determine applicability, review the requirement description carefully and consider using <strong>Ask Corey</strong> from the Compliance Obligations Register for an AI-assisted determination.
              </p>
              {item.descriptionOfRequirement && (
                <div className="text-left rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Requirement Description</p>
                  <p className="text-sm text-primary leading-relaxed">{item.descriptionOfRequirement}</p>
                </div>
              )}
            </div>
          ) : showResult && resultCfg ? (
            /* Result screen */
            <div className="space-y-4">
              <div className={`rounded-xl border p-4 ${resultCfg.bg}`}>
                <div className="flex items-start gap-3">
                  <resultCfg.icon className={`w-6 h-6 shrink-0 mt-0.5 ${resultCfg.color}`} />
                  <div>
                    <p className={`text-base font-bold ${resultCfg.color}`}>{resultCfg.label}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{resultCfg.advice}</p>
                  </div>
                </div>
              </div>

              {/* Answer summary */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Your Responses</p>
                <div className="space-y-2">
                  {qs.applicabilityQuestions.map(q => {
                    const a = answers[q.id];
                    const color = a === "yes" ? "text-emerald-600 dark:text-emerald-400" : a === "no" ? "text-red-500" : "text-amber-500";
                    const label = a === "yes" ? "Yes" : a === "no" ? "No" : "Not Sure";
                    return (
                      <div key={q.id} className="flex items-start gap-2 text-sm">
                        <span className={`font-bold shrink-0 mt-0.5 ${color}`}>{label}</span>
                        <span className="text-primary">{q.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-3">
                This screening is a decision-support tool. Your organization's qualified personnel make the final applicability determination. Document this determination in your §6.1.3 register.
              </p>
            </div>
          ) : (
            /* Questions */
            <div className="space-y-5">
              <div className="rounded-lg border border-blue-100 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/10 px-4 py-3">
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{qs.applicabilityIntro}</p>
              </div>

              {qs.applicabilityQuestions.map((q: ApplicabilityQuestion, i: number) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-primary leading-snug">{q.text}</p>
                      {q.hint && <p className="text-xs text-muted-foreground mt-0.5 italic">{q.hint}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 pl-7">
                    {(["yes", "no", "not_sure"] as QuestionAnswer[]).map(a => (
                      <AnswerButton
                        key={a}
                        answer={a}
                        selected={answers[q.id] === a}
                        onClick={() => handleAnswer(q.id, a)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border/40 flex justify-between items-center gap-3">
          {showResult ? (
            <>
              <Button variant="outline" size="sm" onClick={reset} className="text-sm">
                Re-screen
              </Button>
              <Button size="sm" onClick={() => handleOpenChange(false)} className="bg-accent hover:bg-accent/90 text-white text-sm">
                Done
              </Button>
            </>
          ) : !qs ? (
            <Button size="sm" variant="outline" onClick={() => handleOpenChange(false)} className="ml-auto text-sm">
              Close
            </Button>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">
                {Object.keys(answers).length} of {qs.applicabilityQuestions.length} answered
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
              >
                See Determination <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
