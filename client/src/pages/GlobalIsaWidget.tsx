import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Bot, X, Send, Loader2, Minimize2, Maximize2,
  ChevronDown, Sparkles, RefreshCw,
} from "lucide-react";
import type { IsoProject } from "@shared/schema";
import acsiLogoCompact from "@assets/1_1776130046978.png";
import acsiLogoFull from "@assets/2_1776130046980.png";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IsaMsg { role: "user" | "assistant"; content: string }

// ─── Section context labels ───────────────────────────────────────────────────

const SECTION_CONTEXT: Record<string, { label: string; clause: string; desc: string }> = {
  context_org:       { label: "Context of the Organization", clause: "4.1–4.2", desc: "PESTLE analysis, SWOT, interested parties matrix, and the 4.1→6.1 risk summary" },
  system_profile:    { label: "My System Profile", clause: "4.3–4.4", desc: "QMS scope statement, process list with owners and clause references, remote sites, and outsourced processes (8.4)" },
  process_map:       { label: "Process Maps", clause: "4.4", desc: "Process flow documentation with inputs, outputs, owners, and KPIs" },
  nc:                { label: "NC & CAPA", clause: "10.2", desc: "Nonconformance log, corrective action assignments, effectiveness verification, and SMS notifications via Twilio" },
  documentation:     { label: "Documentation", clause: "7.5", desc: "Controlled document library with version history, approval status, and ISO clause tagging" },
  roles_raci:        { label: "Roles & RACI", clause: "5.3", desc: "Department-grouped RACI matrix mapping ISO clauses to roles, org-size templates (Small/Medium/Large), and AI job description generator" },
  apqp:              { label: "APQP / Program Management", clause: "8.3.2", desc: "AIAG Advanced Product Quality Planning — 5-phase program management with gate reviews, AIAG standard deliverable checklists per phase, and PPAP tracking. Per IATF 16949 8.3.2 customer-specific APQP requirements." },
  communication:     { label: "Communication Log", clause: "7.4", desc: "Internal and external communication records filtered by direction and medium" },
  training:          { label: "Training & Awareness", clause: "7.2–7.3", desc: "Awareness notices pushed to process owners with urgency levels, expiry dates, and acknowledgment tracking" },
  risk:              { label: "Risk Assessment", clause: "6.1", desc: "Risk & Opportunity register with Likelihood × Severity scoring (1–25 heatmap), controls, residual risk, and status workflow" },
  management_review: { label: "Management Review", clause: "9.3", desc: "ISO 9.3.2 required inputs checklist (9 agenda items), KPI snapshots, meeting notes, and action items with owners and due dates" },
  internal_audit:    { label: "Internal Audits", clause: "9.2", desc: "Audit planning, clause-by-clause checklist execution, finding log with severity levels, and real-time status tracking" },
  measurement:       { label: "Measurement & Monitoring", clause: "9.1", desc: "KPI dashboard with gauge charts and trend lines, log measurement actuals by period, track on_track/at_risk/off_track status" },
};

// ─── Comprehensive system prompt builder ─────────────────────────────────────

function buildSystemPrompt(project: IsoProject | null, activeSection: string): string {
  const sectionCtx = SECTION_CONTEXT[activeSection];
  const orgName = project?.orgName ?? "the organization";
  const standard = project?.standard ?? "ISO 9001";
  const processes = (project?.processes as any[]) ?? [];
  const procList = processes.length
    ? processes.map((p: any) => `${p.name} (Owner: ${p.owner})`).join(", ")
    : "not yet configured";

  return `You are Isa, Lead ISO Auditor and AI system expert for the ACSI ISO Manager platform.

You have two areas of deep expertise:
1. ISO STANDARDS — ISO 9001:2015, ISO 14001:2015, ISO 45001:2018, ISO 13485:2016, ISO 27001:2022, AS9100 Rev D, IATF 16949:2016
2. THE ISO MANAGER SYSTEM — you know every module, every button, every field, and how to navigate the platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT USER CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organization: ${orgName}
Standard: ${standard}
Active module: ${sectionCtx ? `${sectionCtx.label} (${sectionCtx.clause})` : activeSection}
${sectionCtx ? `What this module covers: ${sectionCtx.desc}` : ""}
${processes.length ? `\nConfigured processes: ${procList}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISO MANAGER NAVIGATION GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The ISO Manager sidebar has two sections:

CORE MODULES (available to all role tiers):
• Context of the Org (4.1-4.2) — PESTLE Analysis (6 categories: Political/Economic/Social/Technological/Legal/Environmental, each item tagged Risk or Opportunity), SWOT Analysis (4 quadrants, items link to 6.1), Interested Parties matrix (PI-R selector: Manage Closely/Keep Informed/Keep Satisfied/Monitor Only, 6 fields per party), 4.1→6.1 Summary (count cards, 7-standard reference table, Go to Risk Assessment button). All data saves to the ISO project JSONB fields.
• My System Profile (4.3-4.4) — Scope statement editor, process list (name, owner, ISO clause references, KPIs), Remote Sites section (IATF 16949 multi-site, in-scope/excluded toggle, address, activities), Outside Processes section (provider, control method, maps to 8.4). Uses inline editors, saves via PATCH.
• Process Maps (4.4) — Visual process flow documentation. Add processes with inputs, outputs, responsible parties.
• NC & CAPA (10.2) — Log nonconformances with description, source, severity, root cause. Assign corrective action owners. SMS notifications fire via Twilio when owners are assigned. Effectiveness verification with due dates. AI suggestions from Isa. Full status workflow.
• Documentation (7.5) — Controlled document library. Filter by ISO clause, document type, status (approved/in-review/draft). Version history, approval dates, and ISO clause cross-references.
• Roles & RACI (5.3) — RACI matrix with 26 ISO clauses as rows and job roles as columns. Columns grouped by department with colored banners. Collapse departments to focus. Click cells to cycle R→A→C→I. Load templates: Small (6 roles/10-50 employees), Medium (12 roles/50-200), Large (22 roles/200+). Each ISO clause should have exactly ONE person marked A (Accountable) — multiple A's is an audit finding. Job Description Generator tab: enter title/dept/reports-to, Isa generates complete JD with clause references.

COMPLIANCE MODULES (Trainer role and above):
• Communication Log (7.4) — Log internal and external communications. Fields: direction (internal/external), topic, audience, medium, clause reference, summary. Filter by direction or medium. Isa AI guidance on 7.4 requirements.
• Training & Awareness (7.2-7.3) — Create awareness notices, select process owners as recipients, set urgency (Normal/High/Critical) and expiry dates. Track acknowledgments. Isa explains awareness requirements.

AUDITOR MODULES (Auditor role and above):
• Internal Audits (9.2) — Create audit records, work through clause-by-clause checklists for your specific standard (ISO 9001/14001/45001), log findings with severity (Observation/Minor NC/Major NC/Critical). Track audit status (planned/in-progress/completed/closed).
• Risk Assessment (6.1) — Risks & Opportunities register. Score by Likelihood (1-5) × Severity (1-5) = Risk Score (1-25). Color-coded heatmap: green (1-4)/yellow (5-12)/red (13-25). Add controls, track residual risk and score. Status: open/mitigated/accepted. Isa AI guidance built in.
• Management Review (9.3) — Complete ISO 9.3.2 required inputs checklist (9 agenda items including previous review actions, context changes, customer feedback, nonconformances, objectives performance, monitoring results, supplier performance, resource adequacy, improvement opportunities). KPI snapshot table pulled from Measurement module. Meeting notes. Action items with owner, due date, status. Mark review Complete or save as Draft.
• Measurement & Monitoring (9.1) — Define KPIs with name, unit, target, frequency, owner, and linked ISO clause. Log actuals by period. View gauge chart (actual vs. target) and 12-month trend line (Recharts). Status: on_track/at_risk/off_track. Year comparison (current vs. previous year) and rolling 12-month view.
• Clause Coverage Map — Visual map of document coverage per ISO clause. Shows approved/in-review/draft/none status for each clause. Overall coverage percentage gauge.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE TIER SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The ISO Manager has 3 role tiers shown as a badge in the sidebar:
• Librarian — Core modules only (Context, System Profile, Process Maps, NC/CAPA, Documentation, Roles/RACI)
• Trainer — Adds Communication Log and Training & Awareness
• Auditor — Full access to all modules including Internal Audits, Risk Assessment, Management Review, Measurement & Monitoring
• Superadmin — Bypasses all role gates

Superadmins can set user ISO roles via the admin panel at /admin (PATCH /api/superadmin/users/:userId/iso-role).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAVIGATION HOW-TO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Sidebar toggle: hamburger menu icon at top-left of the ISO Manager header
• Navigate between modules by clicking items in the left sidebar
• "Unsaved changes" in amber means you have edits — hit Save before switching
• Setup Wizard: runs when a new ISO project is created (3-phase: Standards & Scope → Processes → Roles)
• Conversations (full Isa chat with streaming): listed under "Recent" in the sidebar, subscription-gated
• Each module's Isa integration uses the module-level chat (not subscription-gated) for guidance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR ROLE AS ADVISOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Answer questions about:
- ISO clause requirements and how to comply with them
- How to use any feature in the ISO Manager (step-by-step)
- What data to enter in any field
- How to navigate to any module
- Best practices for implementation and audit readiness
- What auditors look for in each clause area

Be concise, practical, and specific. Reference ISO clause numbers when relevant.
When explaining navigation, give exact steps (e.g., "In the left sidebar, click 'Risk Assessment' under Compliance").
When explaining compliance, tie it to what the user should do in the ISO Manager.`;
}

// ─── Quick question suggestions per section ───────────────────────────────────

const SECTION_QUESTIONS: Record<string, string[]> = {
  context_org:       ["What goes in the PESTLE analysis?", "How do I identify interested parties?", "What's the difference between risks and opportunities here?", "How does 4.1 connect to 6.1?"],
  system_profile:    ["What should my scope statement include?", "How do I define a QMS process?", "What are remote sites for IATF?", "What counts as an outsourced process?"],
  process_map:       ["What inputs and outputs should a process have?", "How detailed should my process maps be?", "Which processes are mandatory for ISO 9001?"],
  nc:                ["What's the difference between a minor and major NC?", "How do I write a good root cause analysis?", "What makes a corrective action effective?", "When is a CAPA required?"],
  documentation:     ["Which documents are mandatory for ISO 9001?", "What is document control?", "How often should documents be reviewed?", "What's the difference in-review vs. approved?"],
  roles_raci:        ["Who should be Accountable for 8.4?", "Can a clause have two people marked A?", "Which template is right for 80 employees?", "What does ISO 5.3 require for documented roles?"],
  communication:     ["What does ISO 7.4 require?", "What communications need to be documented?", "Internal vs external communication — what's the difference?"],
  training:          ["What's the difference between training and awareness?", "How do I demonstrate competence?", "What records does ISO require for training?"],
  risk:              ["How do I calculate a risk score?", "What's the difference between a risk and an opportunity?", "When is a risk 'mitigated' vs 'accepted'?", "What does an auditor check in 6.1?"],
  management_review: ["What are the 9 required inputs for a management review?", "How often must management reviews happen?", "What records do I need to keep?"],
  internal_audit:    ["How do I create an audit schedule?", "What's the difference between an observation and a minor NC?", "Can the same person audit their own process?"],
  measurement:       ["What KPIs should I track for ISO 9001?", "How do I set a meaningful quality objective target?", "What does 'monitoring vs measurement' mean?"],
};

const GENERAL_QUESTIONS = [
  "What's the difference between Librarian and Auditor roles?",
  "How do I start a new ISO project?",
  "Where do I find the Clause Coverage Map?",
  "What's the best order to complete the modules?",
];

// ─── Message renderer (simple markdown-ish) ───────────────────────────────────

function RenderMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="text-xs leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-bold text-foreground">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return <p key={i} className="pl-3 text-foreground">{line}</p>;
        }
        if (line.startsWith("━")) {
          return <div key={i} className="border-t border-border/40 my-1" />;
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-foreground">{line}</p>;
      })}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function GlobalIsaWidget({
  project,
  activeSection,
}: {
  project: IsoProject | null;
  activeSection: string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<IsaMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prevSection, setPrevSection] = useState(activeSection);
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Welcome message — reset when section changes
  useEffect(() => {
    if (activeSection !== prevSection) {
      setPrevSection(activeSection);
      const ctx = SECTION_CONTEXT[activeSection];
      if (open && ctx) {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `I see you've moved to **${ctx.label}** (${ctx.clause}).\n\n${ctx.desc}\n\nWhat would you like help with here?`,
          },
        ]);
      }
    }
  }, [activeSection]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) {
        const ctx = SECTION_CONTEXT[activeSection];
        setMessages([{
          role: "assistant",
          content: ctx
            ? `Hi! I'm Isa — your ISO lead auditor and ISO Manager guide.\n\nYou're currently in **${ctx.label}** (${ctx.clause}).\n\n${ctx.desc}\n\nI can help with compliance questions, how to use any feature, or anything about the ISO standards. What would you like to know?`
            : `Hi! I'm Isa — your ISO lead auditor and ISO Manager guide.\n\nI can help with compliance questions for ${project?.standard ?? "your standard"}, explain any module, or guide you through implementation. What would you like to know?`,
        }]);
      }
    }
  }, [open]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const resp = await fetch("/api/iso/module-isa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
          systemPrompt: buildSystemPrompt(project, activeSection),
        }),
      });
      const data = await resp.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content ?? "Sorry, I couldn't respond." }]);
    } catch {
      toast({ title: "Isa is unavailable right now", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const resetChat = () => {
    setMessages([]);
    const ctx = SECTION_CONTEXT[activeSection];
    setMessages([{
      role: "assistant",
      content: ctx
        ? `Hi again! Still in **${ctx.label}** (${ctx.clause}). What would you like to know?`
        : "Hi again! What can I help you with?",
    }]);
  };

  const sectionCtx = SECTION_CONTEXT[activeSection];
  const suggestedQuestions = SECTION_QUESTIONS[activeSection] ?? GENERAL_QUESTIONS;

  const panelH = expanded ? "h-[600px]" : "h-[480px]";
  const panelW = expanded ? "w-[420px]" : "w-[360px]";

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end gap-2">

      {/* Chat panel */}
      {open && (
        <div className={`${panelW} ${panelH} flex flex-col rounded-2xl shadow-2xl border border-border/60 bg-white dark:bg-card overflow-hidden transition-all duration-200`}>

          {/* Header */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-[#1e3a5f] to-[#1e3a5f]/90 text-white">
            <div className="w-16 h-8 flex items-center justify-center shrink-0">
              <img src={acsiLogoFull} alt="ACSI" className="h-8 w-auto object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold">Isa · ISO Manager Assistant</div>
              {sectionCtx && (
                <div className="text-[10px] text-white/60 truncate">{sectionCtx.label} · {sectionCtx.clause}</div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={resetChat} title="Reset conversation"
                className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setExpanded(v => !v)} title={expanded ? "Shrink" : "Expand"}
                className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} title="Close"
                className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/10">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-5 h-5 rounded-full bg-[#1e3a5f] flex items-center justify-center mr-1.5 shrink-0 mt-0.5">
                    <Bot className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-[#1e3a5f] text-white rounded-br-sm"
                    : "bg-white dark:bg-card border border-border/50 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.role === "assistant"
                    ? <RenderMessage content={msg.content} />
                    : <p className="text-xs leading-relaxed">{msg.content}</p>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-5 h-5 rounded-full bg-[#1e3a5f] flex items-center justify-center mr-1.5 shrink-0">
                  <Bot className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="bg-white dark:bg-card border border-border/50 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Isa is thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick question pills */}
          {messages.length <= 1 && !loading && (
            <div className="shrink-0 px-3 pt-2 pb-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Quick questions</div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.slice(0, 4).map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-[11px] px-2 py-1 rounded-full bg-primary/8 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors leading-tight text-left"
                    data-testid={`isa-quick-q-${q.slice(0, 20)}`}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 flex items-end gap-2 px-3 pb-3 pt-2 border-t border-border/40 bg-white dark:bg-card">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Isa anything…"
              rows={1}
              className="flex-1 text-xs resize-none min-h-[36px] max-h-[120px]"
              data-testid="input-global-isa"
            />
            <Button
              size="sm"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="shrink-0 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white h-9 w-9 p-0"
              data-testid="button-global-isa-send">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        data-testid="button-global-isa-toggle"
        title={open ? "Close Isa" : "Ask Isa — ISO Manager AI Assistant"}
        className={`group w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 border-2 ${
          open
            ? "bg-[#1e3a5f] border-white/30 scale-95"
            : "bg-[#1e3a5f] border-white/20 hover:scale-110 hover:shadow-2xl"
        }`}>
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <img src={acsiLogoCompact} alt="Ask Isa" className="w-10 h-10 object-contain rounded-full" />
        )}
        {!open && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent border-2 border-white flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-white" />
          </div>
        )}
      </button>
    </div>
  );
}
