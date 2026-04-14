import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, FileText, ShieldCheck, AlertCircle, ChevronDown, ChevronUp, Clock, Ban } from "lucide-react";
import { format } from "date-fns";

function renderDocContent(content: string) {
  if (!content) return <p className="text-muted-foreground italic">No content provided.</p>;
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono bg-muted/10 rounded-lg p-4 border border-border/40 max-h-[600px] overflow-y-auto">
      {content}
    </div>
  );
}

export default function DCRReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [showOriginal, setShowOriginal] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewerComments, setReviewerComments] = useState("");
  const [done, setDone] = useState<{ success: boolean; newVersion?: string; action: "approve" | "reject" } | null>(null);

  const { data: dcr, isLoading, error } = useQuery<any>({
    queryKey: [`/api/dcr-review/${token}`],
    queryFn: async () => {
      const res = await fetch(`/api/dcr-review/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Not found");
      }
      return res.json();
    },
    retry: false,
    staleTime: 0,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dcr-review/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedBy: reviewedBy || dcr?.designated_reviewer || "External Reviewer", reviewerComments }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: (data) => setDone({ success: true, newVersion: data.newVersion, action: "approve" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dcr-review/${token}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedBy: reviewedBy || dcr?.designated_reviewer || "External Reviewer", reviewerComments }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      return res.json();
    },
    onSuccess: () => setDone({ success: true, action: "reject" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading document review...</p>
        </div>
      </div>
    );
  }

  if (error || !dcr) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Review Link Not Found</h1>
          <p className="text-gray-500 text-sm">
            {(error as any)?.message ?? "This link may have expired or been used already. Please contact the document owner for a new link."}
          </p>
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400">Core Compliance Hub — ISO Document Control</p>
          </div>
        </div>
      </div>
    );
  }

  const dcrNumber = `DCR-${String(dcr.id).padStart(4, "0")}`;
  const isAlreadyProcessed = dcr.status !== "pending";

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {done.action === "approve" ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Document Approved</h1>
              <p className="text-gray-600 mb-3">
                <span className="font-bold text-primary">{dcr.doc_title}</span> has been approved and bumped to{" "}
                <span className="font-black text-green-600">Rev. {done.newVersion}</span>.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The document is now live in the ISO Manager. Training notices have been automatically sent to all affected departments.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-orange-500" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Change Request Rejected</h1>
              <p className="text-gray-600 mb-6">
                The author has been notified. The document has been returned to{" "}
                <span className="font-bold text-primary">{dcr.doc_title}</span> Approved status for revision.
              </p>
            </>
          )}
          <div className="bg-gray-50 rounded-xl p-4 text-left text-xs text-gray-500 space-y-1">
            <p><span className="font-bold">Reference:</span> {dcrNumber}</p>
            <p><span className="font-bold">Document:</span> {dcr.doc_title}</p>
            <p><span className="font-bold">Reviewed by:</span> {reviewedBy || dcr.designated_reviewer || "External Reviewer"}</p>
            <p><span className="font-bold">Date:</span> {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          </div>
          <p className="mt-6 text-xs text-gray-400">Core Compliance Hub — ISO 7.5.3 Document Control</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0f172a] text-white py-4 px-6 flex items-center gap-3">
        <span className="bg-[#ea6c19] text-white text-xs font-black px-2 py-1 rounded">CCHUB</span>
        <span className="text-sm font-semibold">Core Compliance Hub — Document Review Portal</span>
        <div className="ml-auto flex items-center gap-2">
          <Badge className="bg-white/10 text-white border-white/20 text-[10px]">{dcrNumber}</Badge>
          {isAlreadyProcessed ? (
            <Badge className={dcr.status === "approved" ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
              {dcr.status === "approved" ? "Approved" : "Rejected"}
            </Badge>
          ) : (
            <Badge className="bg-yellow-500 text-white animate-pulse">Awaiting Your Review</Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Already processed notice */}
        {isAlreadyProcessed && (
          <div className={`rounded-xl border p-4 flex gap-3 ${dcr.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            {dcr.status === "approved" ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <Ban className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-sm">{dcr.status === "approved" ? "This document was already approved." : "This change request was rejected."}</p>
              {dcr.reviewed_by && <p className="text-xs text-muted-foreground mt-0.5">Reviewed by {dcr.reviewed_by} on {dcr.reviewed_at ? format(new Date(dcr.reviewed_at), "MMM d, yyyy") : "—"}</p>}
              {dcr.reviewer_comments && <p className="text-xs mt-1 text-muted-foreground italic">"{dcr.reviewer_comments}"</p>}
            </div>
          </div>
        )}

        {/* Change Request Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/60 overflow-hidden">
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 opacity-80" />
                  <span className="text-xs font-semibold opacity-80 uppercase tracking-wide">ISO 7.5.3 — Document Change Request</span>
                </div>
                <h1 className="text-xl font-black">{dcr.doc_title}</h1>
                <p className="text-sm opacity-80 mt-1">Current Revision: {dcr.current_version} → <span className="font-bold text-yellow-300">bumped on approval</span></p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs opacity-70">Reference</p>
                <p className="text-xl font-black">{dcrNumber}</p>
                <p className="text-xs opacity-70 mt-1">{dcr.created_at ? format(new Date(dcr.created_at), "MMM d, yyyy") : ""}</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Submitted By</p>
              <p className="text-sm font-semibold text-foreground">{dcr.requested_by}</p>
            </div>
            {dcr.designated_reviewer && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Designated Reviewer</p>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{dcr.designated_reviewer}</p>
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Summary of Changes</p>
              <p className="text-sm text-foreground">{dcr.change_description}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Reason for Change</p>
              <p className="text-sm text-foreground">{dcr.reason}</p>
            </div>
            {dcr.affected_departments?.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Training Required For</p>
                <div className="flex flex-wrap gap-1.5">
                  {(dcr.affected_departments as string[]).map((d: string) => (
                    <span key={d} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {dcr.proposed_effective_date && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Proposed Effective Date</p>
                <p className="text-sm text-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {format(new Date(dcr.proposed_effective_date), "MMMM d, yyyy")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Proposed Document Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div>
              <h2 className="font-black text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Proposed Document — Revised Content
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">This is the full document as it will appear if you approve. Review carefully before deciding.</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">NEW VERSION</Badge>
          </div>
          <div className="p-6">
            {dcr.proposed_content
              ? renderDocContent(dcr.proposed_content)
              : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-bold mb-1">No revised content was submitted with this change request.</p>
                  <p className="text-xs">The submitter described the change in the summary above. You may approve or reject based on that description, or request a revised submission with the actual document content.</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Original document (toggle) */}
        {dcr.previous_content && (
          <div className="bg-white rounded-2xl shadow-sm border border-border/60 overflow-hidden">
            <button
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
              onClick={() => setShowOriginal(v => !v)}
              data-testid="toggle-original-content"
            >
              <div>
                <h2 className="font-bold text-muted-foreground flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4" />
                  Original Document — Current Approved Version (Rev. {dcr.current_version})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Click to {showOriginal ? "hide" : "show"} for comparison</p>
              </div>
              {showOriginal ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showOriginal && (
              <div className="px-6 pb-6 border-t border-border/40 pt-4">
                <div className="opacity-70">
                  {renderDocContent(dcr.previous_content)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Action */}
        {!isAlreadyProcessed && (
          <div className="bg-white rounded-2xl shadow-sm border border-border/60 p-6">
            <h2 className="font-black text-primary mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Your Decision
            </h2>

            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setAction("approve")}
                className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  action === "approve"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-border text-muted-foreground hover:border-green-300 hover:bg-green-50/50"
                }`}
                data-testid="button-select-approve"
              >
                <CheckCircle2 className={`w-7 h-7 ${action === "approve" ? "text-green-500" : "text-muted-foreground"}`} />
                Approve
                <span className="text-[10px] font-normal text-center opacity-80">Version bumps, content goes live, training notices sent</span>
              </button>
              <button
                onClick={() => setAction("reject")}
                className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  action === "reject"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-border text-muted-foreground hover:border-red-300 hover:bg-red-50/50"
                }`}
                data-testid="button-select-reject"
              >
                <XCircle className={`w-7 h-7 ${action === "reject" ? "text-red-500" : "text-muted-foreground"}`} />
                Reject
                <span className="text-[10px] font-normal text-center opacity-80">Document returned to Approved, author notified</span>
              </button>
            </div>

            {action && (
              <div className="space-y-4 border-t border-border/40 pt-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Your Name / Title <span className="font-normal text-muted-foreground">(for the audit record)</span></Label>
                  <Input
                    value={reviewedBy}
                    onChange={e => setReviewedBy(e.target.value)}
                    placeholder={dcr.designated_reviewer ?? "Quality Manager"}
                    className="text-sm"
                    data-testid="input-reviewer-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">
                    {action === "reject" ? "Reason for Rejection" : "Comments"}
                    {action === "reject" && <span className="text-destructive ml-1">*</span>}
                    <span className="font-normal text-muted-foreground ml-1">(shown in audit log and sent back to author)</span>
                  </Label>
                  <Textarea
                    value={reviewerComments}
                    onChange={e => setReviewerComments(e.target.value)}
                    placeholder={action === "approve" ? "Optional — any notes for the record" : "Explain what needs to be corrected before re-submission..."}
                    rows={3}
                    className="text-sm resize-none"
                    data-testid="textarea-reviewer-comments"
                  />
                </div>

                <div className={`rounded-xl p-4 flex gap-3 ${action === "approve" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${action === "approve" ? "text-green-600" : "text-red-500"}`} />
                  <p className={`text-xs ${action === "approve" ? "text-green-800" : "text-red-800"}`}>
                    {action === "approve"
                      ? `Approving will immediately bump "${dcr.doc_title}" to the next revision, publish the new content, archive the old version, and send training notices to all affected departments. This action cannot be undone.`
                      : `Rejecting will return "${dcr.doc_title}" to Approved status and notify the submitter to revise and resubmit.`}
                  </p>
                </div>

                <Button
                  onClick={() => action === "approve" ? approveMutation.mutate() : rejectMutation.mutate()}
                  disabled={approveMutation.isPending || rejectMutation.isPending || (action === "reject" && !reviewerComments.trim())}
                  className={`w-full h-12 font-black text-sm gap-2 ${action === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                  data-testid="button-submit-decision"
                >
                  {approveMutation.isPending || rejectMutation.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  ) : action === "approve" ? (
                    <><CheckCircle2 className="w-4 h-4" /> Confirm Approval</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> Confirm Rejection</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground py-4">
          Core Compliance Hub — ISO 7.5.3 Document Change Control · This page is private and accessible only via your unique review link.
        </p>
      </div>
    </div>
  );
}
