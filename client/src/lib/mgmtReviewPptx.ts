import PptxGenJS from "pptxgenjs";

// ─── Brand colours ────────────────────────────────────────────────────────────
const CLR = {
  dark:       "1E293B",   // slide background (dark slate)
  accent:     "F97316",   // CCHUB orange
  white:      "FFFFFF",
  lightGray:  "F1F5F9",
  midGray:    "94A3B8",
  green:      "22C55E",
  greenBg:    "F0FDF4",
  greenText:  "166534",
  yellow:     "F59E0B",
  yellowBg:   "FFFBEB",
  yellowText: "92400E",
  red:        "EF4444",
  redBg:      "FEF2F2",
  redText:    "991B1B",
  navy:       "0F172A",
  blue:       "3B82F6",
};

// ─── Types (minimal, passed from component) ───────────────────────────────────
export interface PptxKpi {
  name: string;
  processName?: string | null;
  target: string;
  unit: string;
  status: string;
  frequency: string;
  latestVal: number | null;
  latestPeriod: string | null;
  streak: number;
  explanation?: string;
  actuals: { period: string; actual: number }[];
}

export interface PptxAction {
  description: string;
  owner?: string | null;
  dueDate?: string | null;
  status: string;
}

export interface PptxAgendaItem {
  clause: string;
  title: string;
  covered: boolean;
  notes?: string;
}

export interface MgmtReviewPptxData {
  title: string;
  meetingDate: string;
  attendees?: string | null;
  standard: string;
  status: string;
  kpis: PptxKpi[];
  flaggedKpis: PptxKpi[];
  trendThreshold: number;
  agendaItems: PptxAgendaItem[];
  actions: PptxAction[];
  carryoverActions: PptxAction[];
  previousReviewTitle?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusColor(status: string): string {
  if (status === "on_track") return CLR.green;
  if (status === "at_risk")  return CLR.yellow;
  return CLR.red;
}

function statusLabel(status: string): string {
  if (status === "on_track") return "On Track";
  if (status === "at_risk")  return "At Risk";
  return "Off Track";
}

function actionStatusLabel(s: string): string {
  if (s === "in_progress") return "In Progress";
  if (s === "closed")      return "Closed";
  return "Open";
}

function actionStatusColor(s: string): string {
  if (s === "closed")      return CLR.green;
  if (s === "in_progress") return CLR.yellow;
  return CLR.red;
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
}

function addTitleSlide(prs: PptxGenJS, data: MgmtReviewPptxData) {
  const slide = prs.addSlide({ masterName: "DARK" });

  // Orange accent bar left
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: CLR.accent } });

  // CCHUB label top-right
  slide.addText("CORE COMPLIANCE HUB", {
    x: 8, y: 0.25, w: 1.8, h: 0.3,
    fontSize: 7, bold: true, color: CLR.accent, align: "right",
  });

  // "Management Review" eyebrow
  slide.addText("MANAGEMENT REVIEW", {
    x: 0.45, y: 1.6, w: 9.2, h: 0.4,
    fontSize: 11, bold: true, color: CLR.accent, charSpacing: 3,
  });

  // Title
  slide.addText(data.title, {
    x: 0.45, y: 2.1, w: 9.2, h: 1.4,
    fontSize: 32, bold: true, color: CLR.white, wrap: true,
  });

  // Divider
  slide.addShape(prs.ShapeType.rect, { x: 0.45, y: 3.6, w: 9.1, h: 0.03, fill: { color: CLR.midGray } });

  // Meta row
  const meta = [
    { label: "Date",     value: fmtDate(data.meetingDate) },
    { label: "Standard", value: data.standard },
    { label: "Status",   value: data.status === "complete" ? "Complete ✓" : "Draft" },
  ];
  meta.forEach((m, i) => {
    const x = 0.45 + i * 3.1;
    slide.addText(m.label.toUpperCase(), { x, y: 3.85, w: 3, h: 0.22, fontSize: 7, bold: true, color: CLR.midGray, charSpacing: 1.5 });
    slide.addText(m.value, { x, y: 4.1, w: 3, h: 0.35, fontSize: 14, bold: true, color: CLR.white });
  });

  if (data.attendees) {
    slide.addText("Attendees", { x: 0.45, y: 4.7, w: 9.1, h: 0.22, fontSize: 7, bold: true, color: CLR.midGray, charSpacing: 1.5 });
    slide.addText(data.attendees, { x: 0.45, y: 4.92, w: 9.1, h: 0.5, fontSize: 11, color: CLR.lightGray, wrap: true });
  }

  // Footer
  slide.addText("Confidential · Core Compliance Hub", {
    x: 0.45, y: 7.1, w: 9.1, h: 0.25,
    fontSize: 7.5, color: CLR.midGray, align: "center",
  });
}

function addOverviewSlide(prs: PptxGenJS, data: MgmtReviewPptxData) {
  const slide = prs.addSlide({ masterName: "LIGHT" });
  addSlideHeader(slide, "Meeting Overview", data.standard);

  const covered = data.agendaItems.filter(a => a.covered).length;
  const total   = data.agendaItems.length;
  const onTrack = data.kpis.filter(k => k.status === "on_track").length;
  const flagged  = data.flaggedKpis.length;
  const openAct  = data.actions.filter(a => a.status !== "closed").length;

  const stats = [
    { label: "Agenda Items Covered",  value: `${covered}/${total}`, color: covered === total ? CLR.green : CLR.yellow },
    { label: "KPIs On Track",         value: `${onTrack}/${data.kpis.length}`, color: onTrack === data.kpis.length ? CLR.green : CLR.yellow },
    { label: "Trend Alerts",          value: String(flagged), color: flagged === 0 ? CLR.green : CLR.red },
    { label: "Open Action Items",     value: String(openAct), color: openAct === 0 ? CLR.green : CLR.yellow },
    { label: "Carryover Actions",     value: String(data.carryoverActions.length), color: data.carryoverActions.length === 0 ? CLR.green : CLR.yellow },
  ];

  stats.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 3.2;
    const y = 1.35 + row * 1.8;
    slide.addShape(prs.ShapeType.roundRect, { x, y, w: 2.9, h: 1.5, fill: { color: CLR.lightGray }, line: { color: "E2E8F0", width: 0.5 }, rectRadius: 0.08 });
    slide.addText(s.value, { x, y: y + 0.2, w: 2.9, h: 0.75, fontSize: 36, bold: true, color: s.color, align: "center" });
    slide.addText(s.label, { x, y: y + 0.95, w: 2.9, h: 0.4, fontSize: 9.5, color: "475569", align: "center", wrap: true });
  });

  addSlideFooter(slide, data.title, 1);
}

function addAgendaSlide(prs: PptxGenJS, data: MgmtReviewPptxData, slideNum: number) {
  const slide = prs.addSlide({ masterName: "LIGHT" });
  addSlideHeader(slide, `${data.standard} Agenda Checklist`, data.standard);

  const rows: PptxGenJS.TableRow[] = [
    [
      { text: "Clause",  options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Topic",   options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Status",  options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Notes",   options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
    ],
  ];

  data.agendaItems.forEach(item => {
    rows.push([
      { text: item.clause, options: { fontSize: 8, color: "334155", bold: true } },
      { text: item.title,  options: { fontSize: 8.5, color: "1E293B" } },
      {
        text: item.covered ? "✓ Covered" : "Not Covered",
        options: {
          fontSize: 8, bold: item.covered,
          color: item.covered ? CLR.greenText : CLR.redText,
          fill: { color: item.covered ? CLR.greenBg : CLR.redBg },
          align: "center",
        },
      },
      { text: item.notes || "", options: { fontSize: 7.5, color: "64748B", italics: !item.notes } },
    ]);
  });

  slide.addTable(rows, {
    x: 0.35, y: 1.25, w: 9.3, h: 5.9,
    rowH: 0.32,
    border: { type: "solid", color: "E2E8F0", pt: 0.5 },
    align: "left",
    valign: "middle",
    colW: [1.1, 3.5, 1.3, 3.4],
  });

  addSlideFooter(slide, data.title, slideNum);
}

function addKpiSummarySlide(prs: PptxGenJS, data: MgmtReviewPptxData, slideNum: number) {
  const slide = prs.addSlide({ masterName: "LIGHT" });
  addSlideHeader(slide, "KPI Performance Summary", data.standard);

  if (data.kpis.length === 0) {
    slide.addText("No KPI objectives defined for this project.", { x: 0.4, y: 2.5, w: 9.2, h: 0.5, fontSize: 11, color: CLR.midGray, align: "center" });
    addSlideFooter(slide, data.title, slideNum);
    return;
  }

  const rows: PptxGenJS.TableRow[] = [
    [
      { text: "KPI / Objective",   options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Process",           options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Target",            options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Latest",            options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Period",            options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Variance",          options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Status",            options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Streak",            options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
    ],
  ];

  data.kpis.forEach((kpi, idx) => {
    const variance = kpi.latestVal !== null ? (kpi.latestVal - parseFloat(kpi.target)).toFixed(1) : null;
    const varStr   = variance !== null ? `${parseFloat(variance) >= 0 ? "+" : ""}${variance}` : "—";
    const rowFill  = idx % 2 === 0 ? CLR.white : "F8FAFC";
    const sColor   = statusColor(kpi.status);
    const sLabel   = statusLabel(kpi.status);
    const sBg      = kpi.status === "on_track" ? CLR.greenBg : kpi.status === "at_risk" ? CLR.yellowBg : CLR.redBg;
    const sTxt     = kpi.status === "on_track" ? CLR.greenText : kpi.status === "at_risk" ? CLR.yellowText : CLR.redText;

    rows.push([
      { text: kpi.name,                                     options: { fontSize: 8.5, color: "1E293B", bold: kpi.streak >= data.trendThreshold, fill: { color: rowFill } } },
      { text: kpi.processName ?? "—",                       options: { fontSize: 8, color: "475569", fill: { color: rowFill } } },
      { text: `${kpi.target} ${kpi.unit}`,                  options: { fontSize: 8, color: "475569", fill: { color: rowFill } } },
      { text: kpi.latestVal !== null ? `${kpi.latestVal} ${kpi.unit}` : "—", options: { fontSize: 8.5, bold: true, color: sColor, fill: { color: rowFill } } },
      { text: kpi.latestPeriod ?? "—",                      options: { fontSize: 8, color: "64748B", fill: { color: rowFill } } },
      { text: varStr,                                        options: { fontSize: 8.5, bold: true, color: parseFloat(variance ?? "0") >= 0 ? CLR.green : CLR.red, fill: { color: rowFill } } },
      { text: sLabel,                                        options: { fontSize: 8, bold: true, color: sTxt, fill: { color: sBg }, align: "center" } },
      { text: kpi.streak > 0 ? `${kpi.streak}${kpi.streak >= data.trendThreshold ? " ⚠" : ""}` : "—",
        options: { fontSize: 8.5, bold: kpi.streak >= data.trendThreshold, color: kpi.streak >= data.trendThreshold ? CLR.red : "475569", align: "center", fill: { color: rowFill } } },
    ]);
  });

  slide.addTable(rows, {
    x: 0.25, y: 1.25, w: 9.5, h: 5.95,
    border: { type: "solid", color: "E2E8F0", pt: 0.5 },
    valign: "middle",
    align: "left",
    colW: [2.3, 1.4, 1.1, 1.1, 1.0, 0.9, 1.1, 0.6],
  });

  addSlideFooter(slide, data.title, slideNum);
}

function addTrendAlertsSlide(prs: PptxGenJS, data: MgmtReviewPptxData, slideNum: number) {
  if (data.flaggedKpis.length === 0) return;

  const slide = prs.addSlide({ masterName: "LIGHT" });

  // Red header band
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: "FEF2F2" } });
  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: CLR.red } });
  slide.addText("⚠ KPI Trend Alerts — Corrective Action Required", {
    x: 0.35, y: 0.25, w: 8.5, h: 0.55,
    fontSize: 16, bold: true, color: CLR.redText,
  });
  slide.addText(data.standard, { x: 8.85, y: 0.35, w: 1.0, h: 0.35, fontSize: 7.5, color: CLR.midGray, align: "right" });

  slide.addText(
    `The following KPIs have missed their target for ${data.trendThreshold} or more consecutive periods. A corrective action is required per your QMS policy.`,
    { x: 0.35, y: 1.05, w: 9.4, h: 0.4, fontSize: 9, color: CLR.redText, italics: true }
  );

  const blockH = Math.min(1.35, 5.5 / data.flaggedKpis.length);
  data.flaggedKpis.forEach((kpi, i) => {
    const y = 1.55 + i * (blockH + 0.15);

    slide.addShape(prs.ShapeType.roundRect, { x: 0.35, y, w: 9.3, h: blockH, fill: { color: "FEF2F2" }, line: { color: CLR.red, width: 0.75 }, rectRadius: 0.06 });

    // Left accent bar
    slide.addShape(prs.ShapeType.rect, { x: 0.35, y, w: 0.12, h: blockH, fill: { color: CLR.red } });

    // KPI name + streak badge
    slide.addText(kpi.name, { x: 0.6, y: y + 0.05, w: 5, h: 0.3, fontSize: 11, bold: true, color: CLR.redText });
    slide.addText(`${kpi.streak} consecutive periods below target`, { x: 5.6, y: y + 0.07, w: 4.0, h: 0.26, fontSize: 9, bold: true, color: CLR.red, align: "right" });

    // Values row
    const valStr = kpi.latestVal !== null ? `Latest: ${kpi.latestVal} ${kpi.unit}  |  Target: ${kpi.target} ${kpi.unit}  |  Period: ${kpi.latestPeriod ?? "—"}` : "No recent data";
    slide.addText(valStr, { x: 0.6, y: y + 0.33, w: 8.9, h: 0.22, fontSize: 8.5, color: "7F1D1D" });

    // Explanation
    const expl = kpi.explanation?.trim() || "(No explanation entered — required)";
    const explColor = kpi.explanation?.trim() ? "374151" : CLR.red;
    if (blockH > 0.9) {
      slide.addText("Explanation: " + expl, {
        x: 0.6, y: y + 0.54, w: 8.9, h: blockH - 0.62,
        fontSize: 8, color: explColor, italics: !kpi.explanation?.trim(), wrap: true,
      });
    }
  });

  addSlideFooter(slide, data.title, slideNum);
}

function addActionsSlide(prs: PptxGenJS, data: MgmtReviewPptxData, slideNum: number) {
  const slide = prs.addSlide({ masterName: "LIGHT" });
  addSlideHeader(slide, "Action Items", data.standard);

  if (data.actions.length === 0) {
    slide.addText("No action items recorded for this review.", { x: 0.4, y: 2.5, w: 9.2, h: 0.5, fontSize: 11, color: CLR.midGray, align: "center" });
    addSlideFooter(slide, data.title, slideNum);
    return;
  }

  const rows: PptxGenJS.TableRow[] = [
    [
      { text: "Action",  options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Owner",   options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Due",     options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Status",  options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
    ],
  ];

  data.actions.forEach((a, idx) => {
    const rowFill = idx % 2 === 0 ? CLR.white : "F8FAFC";
    const sLabel  = actionStatusLabel(a.status);
    const sBg     = a.status === "closed" ? CLR.greenBg : a.status === "in_progress" ? CLR.yellowBg : CLR.redBg;
    const sTxt    = a.status === "closed" ? CLR.greenText : a.status === "in_progress" ? CLR.yellowText : CLR.redText;
    rows.push([
      { text: a.description, options: { fontSize: 8.5, color: "1E293B", wrap: true, fill: { color: rowFill } } },
      { text: a.owner ?? "—", options: { fontSize: 8, color: "475569", fill: { color: rowFill } } },
      { text: fmtDate(a.dueDate), options: { fontSize: 8, color: "475569", fill: { color: rowFill } } },
      { text: sLabel, options: { fontSize: 8, bold: true, color: sTxt, fill: { color: sBg }, align: "center" } },
    ]);
  });

  slide.addTable(rows, {
    x: 0.35, y: 1.25, w: 9.3, h: 5.95,
    border: { type: "solid", color: "E2E8F0", pt: 0.5 },
    valign: "middle",
    align: "left",
    colW: [5.5, 1.6, 1.1, 1.1],
  });

  addSlideFooter(slide, data.title, slideNum);
}

function addCarryoverSlide(prs: PptxGenJS, data: MgmtReviewPptxData, slideNum: number) {
  if (data.carryoverActions.length === 0) return;

  const slide = prs.addSlide({ masterName: "LIGHT" });
  addSlideHeader(slide, `Carryover Actions — ${data.previousReviewTitle ?? "Previous Review"}`, data.standard);

  const rows: PptxGenJS.TableRow[] = [
    [
      { text: "Action",  options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Owner",   options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Due",     options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
      { text: "Status",  options: { bold: true, color: CLR.white, fill: { color: CLR.dark }, fontSize: 9 } },
    ],
  ];

  data.carryoverActions.forEach((a, idx) => {
    const rowFill = idx % 2 === 0 ? "FFFBEB" : "FEF9C3";
    const sLabel  = actionStatusLabel(a.status);
    const sBg     = a.status === "in_progress" ? CLR.yellowBg : CLR.redBg;
    const sTxt    = a.status === "in_progress" ? CLR.yellowText : CLR.redText;
    rows.push([
      { text: a.description,  options: { fontSize: 8.5, color: "1E293B", wrap: true, fill: { color: rowFill } } },
      { text: a.owner ?? "—", options: { fontSize: 8, color: "475569", fill: { color: rowFill } } },
      { text: fmtDate(a.dueDate), options: { fontSize: 8, color: "475569", fill: { color: rowFill } } },
      { text: sLabel, options: { fontSize: 8, bold: true, color: sTxt, fill: { color: sBg }, align: "center" } },
    ]);
  });

  slide.addShape(prs.ShapeType.rect, { x: 0, y: 1.12, w: 9.65, h: 0.08, fill: { color: CLR.yellow } });

  slide.addTable(rows, {
    x: 0.35, y: 1.3, w: 9.3, h: 5.9,
    border: { type: "solid", color: "E2E8F0", pt: 0.5 },
    valign: "middle",
    align: "left",
    colW: [5.5, 1.6, 1.1, 1.1],
  });

  addSlideFooter(slide, data.title, slideNum);
}

function addClosingSlide(prs: PptxGenJS, data: MgmtReviewPptxData, totalSlides: number) {
  const slide = prs.addSlide({ masterName: "DARK" });

  slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: CLR.accent } });
  slide.addText("CORE COMPLIANCE HUB", { x: 8, y: 0.25, w: 1.8, h: 0.3, fontSize: 7, bold: true, color: CLR.accent, align: "right" });

  slide.addText("Review Complete", { x: 0.45, y: 2.0, w: 9.2, h: 0.7, fontSize: 30, bold: true, color: CLR.white });
  slide.addText(data.title, { x: 0.45, y: 2.75, w: 9.2, h: 0.45, fontSize: 14, color: CLR.lightGray });
  slide.addShape(prs.ShapeType.rect, { x: 0.45, y: 3.35, w: 9.1, h: 0.03, fill: { color: CLR.midGray } });

  const covered = data.agendaItems.filter(a => a.covered).length;
  const summary = [
    `${covered}/${data.agendaItems.length} agenda items covered`,
    `${data.kpis.filter(k => k.status === "on_track").length}/${data.kpis.length} KPIs on track`,
    `${data.flaggedKpis.length} trend alert${data.flaggedKpis.length !== 1 ? "s" : ""} requiring corrective action`,
    `${data.actions.length} action item${data.actions.length !== 1 ? "s" : ""} recorded`,
  ];

  summary.forEach((line, i) => {
    slide.addText(`• ${line}`, { x: 0.5, y: 3.65 + i * 0.45, w: 9.0, h: 0.4, fontSize: 12, color: CLR.lightGray });
  });

  slide.addText("Generated by Core Compliance Hub · cchub.io", {
    x: 0.45, y: 7.1, w: 9.1, h: 0.25, fontSize: 7.5, color: CLR.midGray, align: "center",
  });
}

// ─── Shared helpers ────────────────────────────────────────────────────────────
function addSlideHeader(slide: PptxGenJS.Slide, title: string, standard: string) {
  slide.addShape("rect" as any, { x: 0, y: 0, w: 10, h: 1.08, fill: { color: CLR.dark } });
  slide.addShape("rect" as any, { x: 0, y: 0, w: 0.18, h: 1.08, fill: { color: CLR.accent } });
  slide.addText(title, { x: 0.35, y: 0.2, w: 8.5, h: 0.55, fontSize: 18, bold: true, color: CLR.white });
  slide.addText(standard, { x: 8.85, y: 0.35, w: 0.9, h: 0.35, fontSize: 7.5, color: CLR.midGray, align: "right" });
}

function addSlideFooter(slide: PptxGenJS.Slide, reviewTitle: string, slideNum: number) {
  slide.addShape("rect" as any, { x: 0, y: 7.3, w: 10, h: 0.2, fill: { color: CLR.dark } });
  slide.addText(reviewTitle, { x: 0.25, y: 7.32, w: 7, h: 0.16, fontSize: 6.5, color: CLR.midGray });
  slide.addText(`Slide ${slideNum} · Core Compliance Hub`, { x: 7.25, y: 7.32, w: 2.5, h: 0.16, fontSize: 6.5, color: CLR.midGray, align: "right" });
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateMgmtReviewPptx(data: MgmtReviewPptxData): Promise<void> {
  const prs = new PptxGenJS();
  prs.layout = "LAYOUT_WIDE";
  prs.author  = "Core Compliance Hub";
  prs.company = "CCHUB";
  prs.subject = `Management Review — ${data.title}`;
  prs.title   = data.title;

  // ── Define slide masters ────────────────────────────────────────────────────
  prs.defineSlideMaster({
    title: "DARK",
    background: { color: CLR.dark },
  });
  prs.defineSlideMaster({
    title: "LIGHT",
    background: { color: CLR.white },
  });

  let slideNum = 1;
  addTitleSlide(prs, data);
  addOverviewSlide(prs, data); slideNum++;
  addAgendaSlide(prs, data, ++slideNum);
  addKpiSummarySlide(prs, data, ++slideNum);
  if (data.flaggedKpis.length > 0) addTrendAlertsSlide(prs, data, ++slideNum);
  addActionsSlide(prs, data, ++slideNum);
  if (data.carryoverActions.length > 0) addCarryoverSlide(prs, data, ++slideNum);
  addClosingSlide(prs, data, ++slideNum);

  const safeTitle = data.title.replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "_").slice(0, 60);
  await prs.writeFile({ fileName: `Management_Review_${safeTitle}.pptx` });
}
