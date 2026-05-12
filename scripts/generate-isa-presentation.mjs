import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches

// ── Brand Colors (6-digit only) ───────────────────────────────────────────────
const C = {
  orange:    "EA6C19",
  darkNavy:  "0F172A",
  navy:      "1E293B",
  slate:     "334155",
  slateLight:"64748B",
  white:     "FFFFFF",
  offWhite:  "F8FAFC",
  lightGray: "E2E8F0",
  green:     "22C55E",
  greenDark: "15803D",
  blue:      "3B82F6",
  blueDark:  "1D4ED8",
  purple:    "8B5CF6",
  amber:     "F59E0B",
  red:       "EF4444",
};

// transparency: 0=opaque, 100=invisible. pptxgenjs uses % transparent.
// "30" alpha ≈ 81% transparent; "50" ≈ 69%; "25" ≈ 85%; "20" ≈ 87%
const T = { lo: 82, mid: 72, hi: 55, border: 40, almost: 20 };

// ── Fill helpers ──────────────────────────────────────────────────────────────
const tintFill  = (color, t = T.lo) => ({ color, transparency: t });
const solidFill = (color)           => ({ color });

// ── Shared helpers ─────────────────────────────────────────────────────────────
function bg(slide, color = C.darkNavy) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: solidFill(color) });
}

function orangeBar(slide, y = 0, h = 0.06) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y, w: "100%", h, fill: solidFill(C.orange) });
}

function pill(slide, x, y, w, h, color, label, fontColor, fontSize = 9) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.12, fill: tintFill(color, T.lo), line: { color, width: 0.8 } });
  slide.addText(label, { x, y, w, h, align: "center", valign: "middle", fontSize, bold: true, color: fontColor || color, fontFace: "Calibri" });
}

function moduleCard(slide, x, y, w, h, title, desc, icon, iconColor = C.orange) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1, fill: solidFill(C.navy), line: { color: C.slate, width: 0.5 } });
  slide.addShape(pptx.ShapeType.roundRect, { x: x+0.1, y: y+0.1, w: 0.36, h: 0.36, rectRadius: 0.06, fill: tintFill(iconColor, T.lo), line: { color: iconColor, width: 0.5 } });
  slide.addText(icon, { x: x+0.1, y: y+0.1, w: 0.36, h: 0.36, align: "center", valign: "middle", fontSize: 14, color: iconColor, fontFace: "Segoe UI Emoji" });
  slide.addText(title, { x: x+0.52, y: y+0.12, w: w-0.62, h: 0.22, fontSize: 9, bold: true, color: C.white, fontFace: "Calibri", valign: "top" });
  slide.addText(desc, { x: x+0.1, y: y+0.5, w: w-0.2, h: h-0.62, fontSize: 7.5, color: C.slateLight, fontFace: "Calibri", wrap: true });
}

function statBox(slide, x, y, w, h, value, label, color = C.orange) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color, width: 1.5 } });
  slide.addText(value, { x, y: y+0.12, w, h: h*0.55, align: "center", valign: "bottom", fontSize: 28, bold: true, color, fontFace: "Calibri" });
  slide.addText(label, { x, y: y+h*0.58, w, h: h*0.38, align: "center", valign: "top", fontSize: 8.5, color: C.slateLight, fontFace: "Calibri", wrap: true });
}

function checkItem(slide, x, y, text, color = C.green, fontSize = 11) {
  slide.addText("✓", { x, y, w: 0.28, h: 0.26, align: "center", valign: "middle", fontSize: fontSize+1, bold: true, color, fontFace: "Calibri" });
  slide.addText(text, { x: x+0.3, y, w: 4.2, h: 0.26, valign: "middle", fontSize, color: C.white, fontFace: "Calibri" });
}

function sectionBadge(slide, x, y, label, color = C.orange) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.0, h: 0.26, rectRadius: 0.13, fill: tintFill(color, T.lo), line: { color, width: 1 } });
  slide.addText(label, { x, y, w: 2.0, h: 0.26, align: "center", valign: "middle", fontSize: 7.5, bold: true, color, fontFace: "Calibri" });
}

function slideHeading(slide, title, subtitle = null, x = 0.5, y = 0.3) {
  slide.addText(title, { x, y, w: 12.3, h: 0.55, fontSize: 28, bold: true, color: C.white, fontFace: "Calibri" });
  if (subtitle) slide.addText(subtitle, { x, y: y+0.6, w: 12.3, h: 0.3, fontSize: 12, color: C.slateLight, fontFace: "Calibri" });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 01 — TITLE
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);

  // Left accent strip
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: "100%", fill: solidFill(C.orange) });

  // Right dark panel
  s.addShape(pptx.ShapeType.rect, { x: 7.5, y: 0, w: 5.83, h: "100%", fill: solidFill(C.navy) });

  // ISO standard pills (right panel)
  const standards = ["ISO 9001:2015", "IATF 16949:2016", "ISO 14001:2015", "ISO 45001:2018", "AS9100D"];
  standards.forEach((std, i) => pill(s, 8.0, 0.65 + i*0.88, 2.5, 0.52, C.orange, std, C.orange, 10));

  // Right side stats
  const stats = [["14+", "Integrated Modules"], ["5", "ISO Standards"], ["AI", "Lead ISO Auditor"], ["360°", "Quality Coverage"]];
  stats.forEach(([v, l], i) => {
    s.addText(v, { x: 10.7, y: 0.6 + i*0.88, w: 1.2, h: 0.35, align: "center", fontSize: 20, bold: true, color: C.orange, fontFace: "Calibri" });
    s.addText(l,  { x: 10.7, y: 0.95 + i*0.88, w: 2.3, h: 0.2, align: "center", fontSize: 8.5, color: C.slateLight, fontFace: "Calibri" });
  });

  // Left — main title
  s.addText("ISA", { x: 0.28, y: 0.4, w: 7.0, h: 2.0, fontSize: 130, bold: true, color: C.orange, fontFace: "Calibri" });
  s.addText("& the ISO Manager Platform", { x: 0.28, y: 2.25, w: 7.0, h: 0.65, fontSize: 24, bold: true, color: C.white, fontFace: "Calibri" });
  s.addShape(pptx.ShapeType.rect, { x: 0.28, y: 2.98, w: 5.2, h: 0.07, fill: solidFill(C.orange) });
  s.addText("The world's most intelligent, all-in-one ISO Quality\nManagement System — powered by your AI Lead ISO Auditor.", {
    x: 0.28, y: 3.12, w: 7.0, h: 0.85, fontSize: 14, color: C.slateLight, fontFace: "Calibri", breakLine: true
  });
  s.addText("Presented by ACSI — Advanced Compliance Solutions International", { x: 0.28, y: 7.05, w: 7.0, h: 0.3, fontSize: 9.5, color: C.slate, fontFace: "Calibri" });

  orangeBar(s, 7.44, 0.06);
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 02 — THE PROBLEM
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);
  slideHeading(s, "The Reality of ISO Compliance Today", "Without the right system — it's a battlefield of spreadsheets, lost records, and audit anxiety.");

  const problems = [
    { icon: "📋", title: "Disconnected Spreadsheets", desc: "NCs in one file. Risks in another. Audits in a folder nobody remembers. Nothing talks to anything." },
    { icon: "🔍", title: "Audit Anxiety", desc: "Every external audit feels like a fire drill. Scrambling to find documents and evidence at the last minute." },
    { icon: "🔄", title: "Zero Traceability", desc: "How do you prove a corrective action was effective? Most teams can't. Documents have no version history." },
    { icon: "🧩", title: "Siloed Teams", desc: "Quality, EHS, Ops, and Management in separate worlds. No shared visibility on what's open or overdue." },
    { icon: "⏰", title: "Wasted Expert Hours", desc: "Your best people spend hours on administrative compliance instead of driving real improvement." },
    { icon: "📉", title: "Customer Chargebacks", desc: "Without a closed-loop CAPA system, the same problems keep coming back. Costing money and relationships." },
  ];

  problems.forEach((p, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.4 + col * 4.28, y = 1.52 + row * 2.2;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 4.0, h: 2.0, rectRadius: 0.12, fill: solidFill(C.navy), line: { color: C.red, width: 0.8 } });
    s.addText(p.icon, { x, y: y+0.15, w: 4.0, h: 0.55, align: "center", fontSize: 24, fontFace: "Segoe UI Emoji" });
    s.addText(p.title, { x: x+0.15, y: y+0.75, w: 3.7, h: 0.3, align: "center", fontSize: 11, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(p.desc, { x: x+0.15, y: y+1.08, w: 3.7, h: 0.82, align: "center", fontSize: 9, color: C.slateLight, fontFace: "Calibri", wrap: true });
  });

  s.addText("Sound familiar? There is a better way.", { x: 0, y: 7.05, w: "100%", h: 0.32, align: "center", fontSize: 12, bold: true, color: C.orange, fontFace: "Calibri" });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 03 — THE SOLUTION OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);
  slideHeading(s, "Introducing the ISO Manager Platform", "One platform. Every module. Total quality control — for every ISO standard you run.");

  // Center hub
  s.addShape(pptx.ShapeType.ellipse, { x: 5.15, y: 2.35, w: 3.0, h: 3.0, fill: solidFill(C.orange), line: { color: C.orange } });
  s.addText("ISO\nMANAGER", { x: 5.15, y: 2.8, w: 3.0, h: 1.3, align: "center", valign: "middle", fontSize: 20, bold: true, color: C.white, fontFace: "Calibri", breakLine: true });
  s.addText("Powered by Isa AI", { x: 5.15, y: 4.05, w: 3.0, h: 0.28, align: "center", fontSize: 9, color: C.white, fontFace: "Calibri" });

  // Left orbit items
  const leftItems = [
    { label: "📋  NC & CAPA", color: C.blue },
    { label: "📄  Documentation", color: C.purple },
    { label: "🔍  Internal Audit", color: C.green },
    { label: "⚡  LPA Audits", color: C.amber },
    { label: "📊  Risk Register", color: C.orange },
  ];
  leftItems.forEach(({ label, color }, i) => {
    pill(s, 0.25, 1.1 + i*1.1, 2.5, 0.45, color, label, color, 10);
    s.addShape(pptx.ShapeType.line, { x: 2.75, y: 1.325 + i*1.1, w: 2.4, h: 0, line: { color, width: 0.7, dashType: "dash" } });
  });

  // Right orbit items
  const rightItems = [
    { label: "🏭  Supplier Mgmt", color: C.blue },
    { label: "📅  Mgmt Review", color: C.purple },
    { label: "🎓  Training", color: C.green },
    { label: "🔧  Preventive Maint.", color: C.amber },
    { label: "📏  Calibration", color: C.orange },
  ];
  rightItems.forEach(({ label, color }, i) => {
    pill(s, 10.55, 1.1 + i*1.1, 2.5, 0.45, color, label, color, 10);
    s.addShape(pptx.ShapeType.line, { x: 8.15, y: 1.325 + i*1.1, w: 2.4, h: 0, line: { color, width: 0.7, dashType: "dash" } });
  });

  s.addText("Built for manufacturers. Certified by results.", { x: 0, y: 7.05, w: "100%", h: 0.32, align: "center", fontSize: 12, bold: true, color: C.slateLight, fontFace: "Calibri" });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 04 — MEET ISA
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 5.5, h: 7.38, fill: solidFill(C.navy) });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 0.1, h: 7.38, fill: solidFill(C.orange) });

  s.addText("Meet", { x: 0.3, y: 0.42, w: 5.0, h: 0.45, fontSize: 20, color: C.slateLight, fontFace: "Calibri" });
  s.addText("ISA", { x: 0.3, y: 0.85, w: 5.0, h: 1.2, fontSize: 80, bold: true, color: C.orange, fontFace: "Calibri" });
  s.addText("Your AI Lead ISO Auditor", { x: 0.3, y: 1.92, w: 5.0, h: 0.38, fontSize: 17, bold: true, color: C.white, fontFace: "Calibri" });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 2.38, w: 2.5, h: 0.06, fill: solidFill(C.orange) });

  s.addText("Isa is not a chatbot. She is a domain-trained AI modeled after a Senior Lead ISO Auditor with deep expertise across IATF 16949, ISO 9001, ISO 14001, ISO 45001, and AS9100D.", {
    x: 0.3, y: 2.52, w: 4.9, h: 0.9, fontSize: 11, color: C.slateLight, fontFace: "Calibri", wrap: true
  });

  const isaCaps = [
    ["🎯", "Cites exact clause numbers in every answer"],
    ["🔍", "Finds QMS gaps before auditors do"],
    ["📝", "Drafts procedures, WIs & forms on demand"],
    ["📊", "Analyzes NC data for systemic root causes"],
    ["🗓️", "Guides management review preparation"],
    ["🏭", "Understands all OEM customer-specific requirements"],
    ["💡", "Explains complex requirements in plain language"],
    ["⚡", "Available 24/7 — no scheduling, no waiting"],
  ];
  isaCaps.forEach(([icon, text], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s.addText(icon + "  " + text, {
      x: 0.3 + col*2.55, y: 3.58 + row*0.52, w: 2.45, h: 0.48,
      fontSize: 8.5, color: C.white, fontFace: "Calibri", valign: "middle", wrap: true
    });
  });

  // Right — quote
  s.addText('\u201c', { x: 5.75, y: 0.38, w: 0.8, h: 0.8, fontSize: 72, bold: true, color: C.slate, fontFace: "Georgia" });
  s.addText("Isa reviewed our entire control plan and PFMEA in 20 minutes and flagged three gaps our external auditor missed. She cited chapter and verse.", {
    x: 5.75, y: 0.95, w: 7.3, h: 1.0, fontSize: 14, color: C.white, fontFace: "Calibri", italic: true, wrap: true
  });
  s.addText("— Quality Manager, Tier 1 Automotive Supplier", { x: 5.75, y: 2.05, w: 7.3, h: 0.3, fontSize: 10, color: C.orange, fontFace: "Calibri" });

  // Chat bubbles
  const bubbles = [
    { text: "Isa, what does IATF 16949 clause 8.7.1.1 require for warranty management?", user: true, y: 2.62 },
    { text: "Clause 8.7.1.1 requires a warranty management process including analysis of warranty returns. You must implement a 'no-trouble-found' (NTF) process per customer-specific requirements — let me walk you through the key elements...", user: false, y: 3.42 },
    { text: "Can you review my control plan and tell me if it meets the standard?", user: true, y: 4.75 },
    { text: "Absolutely. Upload your control plan and I will check it against IATF §8.3.3.3 — including special characteristics, sample sizes, and reaction plans.", user: false, y: 5.45 },
  ];
  bubbles.forEach(({ text, user, y }) => {
    const bx = user ? 8.3 : 5.7;
    const bw = 4.7;
    const bcol = user ? C.orange : C.slate;
    s.addShape(pptx.ShapeType.roundRect, { x: bx, y, w: bw, h: user ? 0.58 : 0.85, rectRadius: 0.1, fill: solidFill(bcol), line: { color: bcol } });
    s.addText(text, { x: bx+0.1, y: y+0.06, w: bw-0.2, h: user ? 0.46 : 0.73, fontSize: 8, color: C.white, fontFace: "Calibri", wrap: true });
  });

  sectionBadge(s, 5.75, 7.0, "ACSI · Powered by Anthropic Claude");
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 05 — CRUISE CONTROL DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);
  slideHeading(s, "Your Compliance Command Center", "Every metric, every module, every alert — unified in one intelligent dashboard.");

  const dX = 0.3, dY = 1.28, dW = 12.7, dH = 5.88;
  s.addShape(pptx.ShapeType.roundRect, { x: dX, y: dY, w: dW, h: dH, rectRadius: 0.15, fill: solidFill(C.navy), line: { color: C.slate, width: 0.8 } });
  // Top bar
  s.addShape(pptx.ShapeType.roundRect, { x: dX, y: dY, w: dW, h: 0.48, rectRadius: 0.15, fill: solidFill(C.slate) });
  s.addText("ISO Manager  ·  CCI Chemical, Inc.  ·  IATF 16949:2016  ·  Isa \u25cf Online", {
    x: dX+0.2, y: dY+0.09, w: dW-0.4, h: 0.3, fontSize: 10, bold: true, color: C.white, fontFace: "Calibri"
  });

  // KPIs
  const kpis = [
    { val: "94%", lbl: "Audit Readiness", color: C.green },
    { val: "3", lbl: "Open NCs", color: C.amber },
    { val: "19", lbl: "Risks Assessed", color: C.blue },
    { val: "26", lbl: "Controlled Docs", color: C.purple },
    { val: "12", lbl: "Action Items", color: C.orange },
    { val: "0", lbl: "Overdue CAPAs", color: C.green },
  ];
  kpis.forEach((k, i) => {
    const bx = dX + 0.15 + i*2.09, by = dY + 0.62;
    s.addShape(pptx.ShapeType.roundRect, { x: bx, y: by, w: 1.95, h: 1.08, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color: k.color, width: 1.2 } });
    s.addText(k.val, { x: bx, y: by+0.08, w: 1.95, h: 0.56, align: "center", fontSize: 28, bold: true, color: k.color, fontFace: "Calibri" });
    s.addText(k.lbl, { x: bx, y: by+0.68, w: 1.95, h: 0.3, align: "center", fontSize: 8.5, color: C.slateLight, fontFace: "Calibri" });
  });

  // Module tiles 
  const tiles = [
    { label: "📄 Documentation", status: "26 docs active", color: C.purple },
    { label: "📋 NC & CAPA", status: "3 open cases", color: C.red },
    { label: "🔍 Internal Audit", status: "Scheduled Q3", color: C.blue },
    { label: "📊 Risk Register", status: "19 assessed", color: C.orange },
    { label: "📅 Mgmt Review", status: "Q2 complete", color: C.green },
    { label: "🏭 Supplier Mgmt", status: "ASL current", color: C.blue },
    { label: "🎓 Training", status: "All current", color: C.green },
    { label: "🔧 PM Schedule", status: "On track", color: C.amber },
    { label: "📏 Calibration", status: "12 devices", color: C.purple },
    { label: "⚡ LPA Audits", status: "BIQS L3", color: C.orange },
    { label: "✅ Action Items", status: "2 due soon", color: C.amber },
    { label: "🌍 Context & Risks", status: "PESTLE done", color: C.blue },
  ];
  tiles.forEach((t, i) => {
    const col = i % 6, row = Math.floor(i / 6);
    const tx = dX + 0.15 + col*2.09, ty = dY + 1.85 + row*1.74;
    s.addShape(pptx.ShapeType.roundRect, { x: tx, y: ty, w: 1.95, h: 1.6, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color: t.color, width: 0.8 } });
    s.addShape(pptx.ShapeType.rect, { x: tx, y: ty, w: 1.95, h: 0.08, fill: solidFill(t.color) });
    s.addText(t.label, { x: tx+0.07, y: ty+0.14, w: 1.81, h: 0.38, fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri", wrap: true });
    s.addText(t.status, { x: tx+0.07, y: ty+0.58, w: 1.81, h: 0.26, fontSize: 8, color: t.color, fontFace: "Calibri" });
    s.addText("Open Module \u2192", { x: tx+0.07, y: ty+1.28, w: 1.81, h: 0.24, fontSize: 7.5, color: C.slateLight, fontFace: "Calibri" });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 06 — 14 MODULES AT A GLANCE
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);
  slideHeading(s, "14 Integrated Modules. One Platform.", "Everything you need to build, manage, and certify your Quality Management System.");

  const modules = [
    { icon: "📄", name: "Documentation Library", desc: "Versioned vault with AI drafting, change control & clause compliance checks", color: C.purple },
    { icon: "📋", name: "NC & CAPA", desc: "8D/PDCA corrective actions, root cause analysis, effectiveness tracking", color: C.red },
    { icon: "🔍", name: "Internal Audit", desc: "Risk-based schedules, process/product audits, turtle diagrams, IATF §9.2.2", color: C.blue },
    { icon: "⚡", name: "Layered Process Audits", desc: "L1–L5 LPA, GM BIQS/Stellantis/Ford Q1 compliant, 25-question library", color: C.amber },
    { icon: "📊", name: "Risk Assessment", desc: "PFMEA-aligned register, H/M/L 3x3 matrix, strategic & operational risks", color: C.orange },
    { icon: "📅", name: "Management Review", desc: "Agenda builder, input/output tracking, KPI dashboards, AI-generated minutes", color: C.green },
    { icon: "🌍", name: "Context of Organization", desc: "PESTLE, SWOT, interested parties, strategic risk register §4.1", color: C.blue },
    { icon: "🏭", name: "Supplier Management", desc: "Approved Supplier List, pre-qualification, scorecards, risk-based audits", color: C.purple },
    { icon: "🎓", name: "Training & Awareness", desc: "Competency matrix, evidence file library, 10 document categories, multi-file upload", color: C.green },
    { icon: "🔧", name: "Preventive Maintenance", desc: "Full TPM/PM platform — IATF 16949, AS9100D, ISO 13485 specific fields", color: C.amber },
    { icon: "📏", name: "Calibration", desc: "Master register, calibration logs, labs registry, internal lab scope per IATF 16949", color: C.orange },
    { icon: "✅", name: "Action Item Tracker", desc: "Cross-source: Mgmt Review, Risk, KPIs & Audit findings — one unified view", color: C.red },
    { icon: "🚀", name: "APQP & PPAP", desc: "5-phase APQP timeline, 18 PPAP elements, PSW tracking, customer approval flow", color: C.blue },
    { icon: "📈", name: "Measurement & KPIs", desc: "Clause 9.1 monitoring, KPI actuals vs. targets, trend visualization", color: C.purple },
  ];

  modules.forEach((m, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    moduleCard(s, 0.22 + col*3.27, 1.42 + row*1.98, 3.12, 1.85, m.name, m.desc, m.icon, m.color);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 07 — DOCUMENTATION LIBRARY
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 5.8, h: 7.38, fill: solidFill(C.navy) });
  sectionBadge(s, 0.3, 0.32, "MODULE 01 · DOCUMENTATION LIBRARY", C.purple);

  s.addText("📄", { x: 0.3, y: 0.7, w: 0.7, h: 0.65, fontSize: 30, fontFace: "Segoe UI Emoji" });
  s.addText("Documentation\nLibrary", { x: 1.08, y: 0.7, w: 4.4, h: 0.88, fontSize: 22, bold: true, color: C.white, fontFace: "Calibri", breakLine: true });
  s.addText("A fully version-controlled document vault where every quality document lives — drafted, reviewed, and approved with AI assistance from Isa.", {
    x: 0.3, y: 1.68, w: 5.2, h: 0.7, fontSize: 10.5, color: C.slateLight, fontFace: "Calibri", wrap: true
  });

  const docFeatures = [
    "Version control with full revision history",
    "AI-powered document drafting (Isa writes first drafts)",
    "Clause compliance checker — maps to ISO clauses",
    "Change Control Requests with approval workflow",
    "Quality Manuals, Procedures, Work Instructions, Forms",
    "Print-ready export & controlled distribution",
    "Document status: Draft \u2192 Under Review \u2192 Approved",
    "Compliance gap map — see what's missing vs. standard",
  ];
  docFeatures.forEach((f, i) => checkItem(s, 0.3, 2.55 + i*0.54, f, C.purple, 10));

  // Right: doc types
  const dtypes = [
    { icon: "📖", label: "Quality Manual", count: "1", color: C.purple },
    { icon: "📋", label: "Procedures (QP)", count: "8+", color: C.blue },
    { icon: "🔧", label: "Work Instructions", count: "Unlimited", color: C.green },
    { icon: "📝", label: "Forms & Templates", count: "Unlimited", color: C.amber },
    { icon: "🎯", label: "Quality Policy", count: "1", color: C.orange },
    { icon: "📊", label: "Control Plans", count: "Unlimited", color: C.red },
  ];
  dtypes.forEach((d, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const bx = 6.1 + col*2.38, by = 1.28 + row*1.45;
    s.addShape(pptx.ShapeType.roundRect, { x: bx, y: by, w: 2.18, h: 1.3, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color: d.color, width: 1 } });
    s.addText(d.icon, { x: bx, y: by+0.12, w: 2.18, h: 0.45, align: "center", fontSize: 20, fontFace: "Segoe UI Emoji" });
    s.addText(d.label, { x: bx+0.08, y: by+0.6, w: 2.02, h: 0.28, align: "center", fontSize: 9.5, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(d.count, { x: bx+0.08, y: by+0.9, w: 2.02, h: 0.28, align: "center", fontSize: 9, color: d.color, fontFace: "Calibri" });
  });

  s.addShape(pptx.ShapeType.roundRect, { x: 5.95, y: 4.28, w: 7.1, h: 2.78, rectRadius: 0.12, fill: solidFill(C.navy), line: { color: C.purple, width: 1.2 } });
  s.addText("Isa drafts your documents on demand", { x: 6.15, y: 4.42, w: 6.7, h: 0.35, fontSize: 13, bold: true, color: C.purple, fontFace: "Calibri" });
  s.addText("Need a new Control of Documented Information procedure? Ask Isa. She generates a complete, clause-referenced, audit-ready draft in seconds — tailored to your organization's size, standard, and scope. Your team reviews, edits, and approves. Zero blank-page paralysis.", {
    x: 6.15, y: 4.82, w: 6.7, h: 1.45, fontSize: 10.5, color: C.slateLight, fontFace: "Calibri", wrap: true
  });
  s.addText("\u2192  16 pre-built IATF 16949 sample documents included for fast-start accounts", { x: 6.15, y: 6.35, w: 6.7, h: 0.3, fontSize: 9.5, color: C.purple, fontFace: "Calibri" });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 08 — NC & CAPA
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  sectionBadge(s, 0.3, 0.28, "MODULE 02 · NC & CAPA", C.red);
  s.addText("Nonconformance & Corrective Action", { x: 0.3, y: 0.62, w: 12.7, h: 0.6, fontSize: 26, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Close the loop on every problem — fast, traceable, and permanently fixed.", { x: 0.3, y: 1.28, w: 12.7, h: 0.3, fontSize: 12, color: C.slateLight, fontFace: "Calibri" });

  // 8D flow
  const d8steps = [
    { d: "D0", title: "Emergency\nResponse", color: C.red },
    { d: "D1", title: "Form\nthe Team", color: C.orange },
    { d: "D2", title: "Describe\nthe Problem", color: C.amber },
    { d: "D3", title: "Interim\nContainment", color: C.blue },
    { d: "D4", title: "Root Cause\nAnalysis", color: C.purple },
    { d: "D5", title: "Permanent\nFix", color: C.green },
    { d: "D6", title: "Implement\n& Verify", color: C.green },
    { d: "D7", title: "Prevent\nRecurrence", color: C.blue },
    { d: "D8", title: "Team\nRecognition", color: C.orange },
  ];
  d8steps.forEach((d, i) => {
    const bx = 0.2 + i*1.44;
    s.addShape(pptx.ShapeType.roundRect, { x: bx, y: 1.72, w: 1.35, h: 1.6, rectRadius: 0.1, fill: tintFill(d.color, T.lo), line: { color: d.color, width: 1.2 } });
    s.addShape(pptx.ShapeType.ellipse, { x: bx+0.36, y: 1.8, w: 0.62, h: 0.46, fill: solidFill(d.color), line: { color: d.color } });
    s.addText(d.d, { x: bx+0.36, y: 1.8, w: 0.62, h: 0.46, align: "center", valign: "middle", fontSize: 11, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(d.title, { x: bx+0.04, y: 2.32, w: 1.27, h: 0.9, align: "center", valign: "top", fontSize: 8.5, color: C.white, fontFace: "Calibri", breakLine: true });
    if (i < 8) s.addShape(pptx.ShapeType.line, { x: bx+1.35, y: 2.05, w: 0.09, h: 0, line: { color: d.color, width: 0.8, endArrowType: "arrow" } });
  });

  const cols = [
    {
      title: "Capture & Track", color: C.blue,
      items: ["Log NCs instantly from any module", "Link to PFMEA, control plan & audit finding", "Customer complaint tracking", "Supplier NC management", "Twilio SMS alerts on status changes"],
    },
    {
      title: "Analyze", color: C.purple,
      items: ["AI-suggested root causes from Isa", "5-Why structured analysis", "Fishbone/Ishikawa diagram support", "Systemic pattern detection across NCs", "PDCA cycle integration"],
    },
    {
      title: "Resolve & Close", color: C.green,
      items: ["Effectiveness verification workflow", "Recurrence prevention — PFMEA/CP update", "Lessons learned capture", "Customer 8D submission package", "Full audit trail for external auditors"],
    },
  ];
  cols.forEach((col, ci) => {
    const cx = 0.25 + ci*4.36;
    s.addShape(pptx.ShapeType.roundRect, { x: cx, y: 3.48, w: 4.15, h: 3.62, rectRadius: 0.1, fill: solidFill(C.navy), line: { color: col.color, width: 1 } });
    s.addShape(pptx.ShapeType.rect, { x: cx, y: 3.48, w: 4.15, h: 0.07, fill: solidFill(col.color) });
    s.addText(col.title, { x: cx+0.15, y: 3.62, w: 3.85, h: 0.34, fontSize: 12, bold: true, color: col.color, fontFace: "Calibri" });
    col.items.forEach((item, ii) => {
      s.addText("\u25b8  " + item, { x: cx+0.15, y: 4.06 + ii*0.58, w: 3.85, h: 0.52, fontSize: 10, color: C.slateLight, fontFace: "Calibri", wrap: true });
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 09 — INTERNAL AUDIT
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  sectionBadge(s, 0.3, 0.28, "MODULE 03 · INTERNAL AUDIT PROGRAM", C.blue);
  s.addText("Internal Audit Program", { x: 0.3, y: 0.62, w: 12.7, h: 0.6, fontSize: 28, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Risk-based scheduling, process-approach methodology, full IATF 16949 compliance — all built in.", {
    x: 0.3, y: 1.28, w: 12.7, h: 0.3, fontSize: 12, color: C.slateLight, fontFace: "Calibri"
  });

  const types = [
    { icon: "🏢", title: "System Audit", clause: "§9.2.2", color: C.blue, desc: "Full QMS clause-structure audits covering all processes and their interactions. Scheduled annually or risk-triggered. Isa generates the checklist from your scope." },
    { icon: "⚙️", title: "Manufacturing Process Audit", clause: "§9.2.2.4", color: C.orange, desc: "Process audits with full turtle diagram capture — Inputs, Outputs, Resources, Personnel, Methods, Measurements, Environment. IATF specific." },
    { icon: "🔬", title: "Product Audit", clause: "§9.2.2.3", color: C.purple, desc: "Final product conformance audits against acceptance criteria. Structured checklists, photographic evidence, and automatic NC linkage." },
  ];
  types.forEach((t, i) => {
    const tx = 0.25 + i*4.36;
    s.addShape(pptx.ShapeType.roundRect, { x: tx, y: 1.72, w: 4.15, h: 2.42, rectRadius: 0.12, fill: solidFill(C.navy), line: { color: t.color, width: 1.5 } });
    s.addText(t.icon, { x: tx, y: 1.8, w: 4.15, h: 0.6, align: "center", fontSize: 26, fontFace: "Segoe UI Emoji" });
    s.addShape(pptx.ShapeType.roundRect, { x: tx+0.6, y: 2.48, w: 2.95, h: 0.3, rectRadius: 0.08, fill: solidFill(t.color), line: { color: t.color } });
    s.addText(t.title + "  " + t.clause, { x: tx+0.6, y: 2.48, w: 2.95, h: 0.3, align: "center", valign: "middle", fontSize: 9.5, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(t.desc, { x: tx+0.15, y: 2.85, w: 3.85, h: 1.2, fontSize: 9.5, color: C.slateLight, fontFace: "Calibri", wrap: true });
  });

  const auditFeats = [
    { icon: "🗓️", title: "Risk-Based Scheduling", desc: "High-risk processes are audited more often. Frequency calculated from NC history, customer concerns, and complexity." },
    { icon: "🐢", title: "Turtle Diagram Support", desc: "Full turtle diagram data capture per process audit — standard method, machine, material, man, measurement, environment, output." },
    { icon: "🔗", title: "Linked to NC & CAPA", desc: "Every finding auto-creates a linked nonconformance with 8D corrective action workflow. Nothing falls through." },
    { icon: "📋", title: "Structured Checklists", desc: "25+ default questions in 9 audit categories. Fully customizable. Conduct audits from any device on the shop floor." },
  ];
  auditFeats.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const fx = 0.25 + col*6.45, fy = 4.3 + row*1.45;
    s.addShape(pptx.ShapeType.roundRect, { x: fx, y: fy, w: 6.2, h: 1.32, rectRadius: 0.1, fill: solidFill(C.navy), line: { color: C.blue, width: 0.6 } });
    s.addText(f.icon, { x: fx+0.12, y: fy+0.18, w: 0.6, h: 0.6, align: "center", fontSize: 24, fontFace: "Segoe UI Emoji" });
    s.addText(f.title, { x: fx+0.8, y: fy+0.12, w: 5.25, h: 0.3, fontSize: 11, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(f.desc, { x: fx+0.8, y: fy+0.45, w: 5.25, h: 0.72, fontSize: 9.5, color: C.slateLight, fontFace: "Calibri", wrap: true });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — LAYERED PROCESS AUDITS
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 5.6, h: 7.38, fill: solidFill(C.navy) });
  sectionBadge(s, 0.3, 0.3, "MODULE 04 · LAYERED PROCESS AUDITS", C.amber);

  s.addText("⚡", { x: 0.3, y: 0.68, w: 0.7, h: 0.7, fontSize: 30, fontFace: "Segoe UI Emoji" });
  s.addText("Layered Process\nAudits (LPA)", { x: 1.08, y: 0.68, w: 4.2, h: 0.88, fontSize: 22, bold: true, color: C.white, fontFace: "Calibri", breakLine: true });
  s.addText("The only LPA system built specifically for automotive suppliers complying with GM BIQS, Stellantis, and Ford Q1 requirements.", {
    x: 0.3, y: 1.7, w: 5.1, h: 0.65, fontSize: 10, color: C.slateLight, fontFace: "Calibri", wrap: true
  });

  // 5-Layer pyramid
  const layers = [
    { l: "L1", who: "Operators", freq: "Daily", color: C.green },
    { l: "L2", who: "Supervisors", freq: "Weekly", color: C.blue },
    { l: "L3", who: "Engineers", freq: "Weekly", color: C.purple },
    { l: "L4", who: "Managers", freq: "Monthly", color: C.amber },
    { l: "L5", who: "Leadership", freq: "Monthly", color: C.orange },
  ];
  layers.forEach((l, i) => {
    const indent = i * 0.2, lw = 5.0 - i * 0.4;
    const lx = 0.3 + indent, ly = 2.52 + i * 0.76;
    s.addShape(pptx.ShapeType.roundRect, { x: lx, y: ly, w: lw, h: 0.66, rectRadius: 0.07, fill: tintFill(l.color, T.mid), line: { color: l.color, width: 1.2 } });
    s.addShape(pptx.ShapeType.ellipse, { x: lx+0.08, y: ly+0.09, w: 0.48, h: 0.48, fill: solidFill(l.color), line: { color: l.color } });
    s.addText(l.l, { x: lx+0.08, y: ly+0.09, w: 0.48, h: 0.48, align: "center", valign: "middle", fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(l.who + "  ·  " + l.freq, { x: lx+0.65, y: ly+0.17, w: lw-0.75, h: 0.3, fontSize: 10, bold: true, color: C.white, fontFace: "Calibri" });
  });

  const lpaFeats = [
    "25-question default library in 9 categories",
    "Configurable audit plans per layer",
    "Mobile-friendly conduct-audit dialog",
    "Full audit records history",
    "Pass/fail compliance dashboard",
    "Customer CSR requirement tracking",
  ];
  lpaFeats.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s.addText("\u25b8  " + f, { x: 0.3 + col*2.72, y: 6.42 + row*0.36, w: 2.58, h: 0.33, fontSize: 8.5, color: C.slateLight, fontFace: "Calibri" });
  });

  // Right panel — OEM cards
  const oems = [
    { name: "GM BIQS", detail: "Supplier Quality Excellence — BIQS Levels 1–5 with compliant audit scoring and documentation.", color: C.blue },
    { name: "Stellantis", detail: "Customer-Specific Requirements for FCA/Stellantis process audit standards.", color: C.red },
    { name: "Ford Q1", detail: "Q1 Production Approval Process and ongoing process audit compliance.", color: C.blue },
  ];
  oems.forEach((o, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 5.85, y: 0.85 + i*2.08, w: 7.15, h: 1.88, rectRadius: 0.12, fill: solidFill(C.navy), line: { color: o.color, width: 1.8 } });
    s.addShape(pptx.ShapeType.roundRect, { x: 5.85, y: 0.85 + i*2.08, w: 2.2, h: 1.88, rectRadius: 0.12, fill: tintFill(o.color, T.mid), line: { color: o.color, width: 0 } });
    s.addText(o.name, { x: 5.85, y: 0.85 + i*2.08, w: 2.2, h: 1.88, align: "center", valign: "middle", fontSize: 16, bold: true, color: o.color, fontFace: "Calibri" });
    s.addText(o.detail, { x: 8.2, y: 1.12 + i*2.08, w: 4.65, h: 1.35, fontSize: 11, color: C.slateLight, fontFace: "Calibri", wrap: true, valign: "middle" });
  });

  s.addShape(pptx.ShapeType.roundRect, { x: 5.85, y: 7.0, w: 7.15, h: 0.36, rectRadius: 0.08, fill: tintFill(C.amber, T.mid), line: { color: C.amber, width: 1 } });
  s.addText("LPA is the #1 tool for sustaining certification between external audits", { x: 5.95, y: 7.0, w: 6.95, h: 0.36, align: "center", valign: "middle", fontSize: 10, bold: true, color: C.amber, fontFace: "Calibri" });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — RISK & MANAGEMENT REVIEW
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 6.55, h: 7.38, fill: solidFill(C.navy) });
  sectionBadge(s, 0.3, 0.3, "MODULE 05 · RISK ASSESSMENT", C.orange);
  s.addText("Risk Register &\nAssessment", { x: 0.3, y: 0.65, w: 5.9, h: 0.85, fontSize: 22, bold: true, color: C.white, fontFace: "Calibri", breakLine: true });

  // 3x3 matrix
  const mc = [[C.green, C.green, C.amber], [C.green, C.amber, C.red], [C.amber, C.red, C.red]];
  const ml = [["L/L","M/L","H/L"], ["L/M","M/M","H/M"], ["L/H","M/H","H/H"]];
  const rl = ["Low", "Medium", "High"];
  s.addText("Likelihood \u2192", { x: 1.1, y: 1.68, w: 3.3, h: 0.22, align: "center", fontSize: 8, color: C.slateLight, fontFace: "Calibri" });
  s.addText("\u2191 Impact", { x: 0.12, y: 2.0, w: 0.6, h: 2.1, align: "center", valign: "middle", fontSize: 8, color: C.slateLight, fontFace: "Calibri", rotate: 270 });
  rl.forEach((l, i) => {
    s.addText(l, { x: 1.1 + i*1.1, y: 1.9, w: 1.0, h: 0.2, align: "center", fontSize: 7.5, color: C.slateLight, fontFace: "Calibri" });
    s.addText(l, { x: 0.3, y: 2.12 + (2-i)*1.0, w: 0.75, h: 0.5, align: "right", valign: "middle", fontSize: 7.5, color: C.slateLight, fontFace: "Calibri" });
  });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      s.addShape(pptx.ShapeType.roundRect, { x: 1.1+col*1.1, y: 2.12+(2-row)*1.0, w: 1.0, h: 0.9, rectRadius: 0.06, fill: tintFill(mc[row][col], T.mid), line: { color: mc[row][col], width: 1 } });
      s.addText(ml[row][col], { x: 1.1+col*1.1, y: 2.12+(2-row)*1.0, w: 1.0, h: 0.9, align: "center", valign: "middle", fontSize: 9, bold: true, color: mc[row][col], fontFace: "Calibri" });
    }
  }

  const rFeats = [
    "PESTLE & SWOT analysis with export buttons",
    "Strategic Risk Register §4.1 (separate from §6.1)",
    "Risk-based scheduling feeds Internal Audit module",
    "Isa suggests risk treatments & controls",
    "Link risks to processes, objectives & KPIs",
  ];
  rFeats.forEach((f, i) => {
    s.addText("\u25b8  " + f, { x: 0.3, y: 5.32 + i*0.38, w: 6.1, h: 0.35, fontSize: 9.5, color: C.slateLight, fontFace: "Calibri" });
  });

  s.addShape(pptx.ShapeType.rect, { x: 6.55, y: 0.06, w: 0.05, h: 7.38, fill: solidFill(C.orange) });
  sectionBadge(s, 6.75, 0.3, "MODULE 06 · MANAGEMENT REVIEW", C.green);
  s.addText("Management\nReview", { x: 6.75, y: 0.65, w: 6.2, h: 0.85, fontSize: 22, bold: true, color: C.white, fontFace: "Calibri", breakLine: true });

  const mrInputs = ["Customer feedback & satisfaction", "Quality objectives vs. targets (KPIs)", "Process performance & conformity", "NC & CAPA status", "Audit results", "Risk & opportunity status", "Resource adequacy", "Improvement opportunities"];
  const mrOutputs = ["Improvement decisions & actions", "Resource allocation changes", "QMS changes needed", "Strategic direction updates"];
  s.addText("INPUTS (§9.3.2)", { x: 6.75, y: 1.62, w: 2.9, h: 0.3, fontSize: 10, bold: true, color: C.blue, fontFace: "Calibri" });
  mrInputs.forEach((it, i) => s.addText("\u25b8  " + it, { x: 6.75, y: 1.98 + i*0.37, w: 2.9, h: 0.34, fontSize: 8.5, color: C.slateLight, fontFace: "Calibri" }));
  s.addText("OUTPUTS (§9.3.3)", { x: 9.85, y: 1.62, w: 3.45, h: 0.3, fontSize: 10, bold: true, color: C.green, fontFace: "Calibri" });
  mrOutputs.forEach((it, i) => s.addText("\u25b8  " + it, { x: 9.85, y: 1.98 + i*0.37, w: 3.45, h: 0.34, fontSize: 8.5, color: C.slateLight, fontFace: "Calibri" }));

  s.addShape(pptx.ShapeType.roundRect, { x: 6.75, y: 5.05, w: 6.28, h: 2.08, rectRadius: 0.12, fill: tintFill(C.green, T.lo), line: { color: C.green, width: 1.2 } });
  s.addText("Isa prepares your Management Review", { x: 6.9, y: 5.18, w: 5.95, h: 0.35, fontSize: 12, bold: true, color: C.green, fontFace: "Calibri" });
  s.addText("Isa auto-generates meeting minutes, pre-fills agenda items from your live KPI and NC data, and flags any clause gaps before the meeting starts. Action items flow automatically into the Action Item Tracker.", {
    x: 6.9, y: 5.58, w: 5.95, h: 1.1, fontSize: 10, color: C.white, fontFace: "Calibri", wrap: true
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 12 — SUPPLIER & TRAINING
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 6.55, h: 7.38, fill: solidFill(C.navy) });
  sectionBadge(s, 0.3, 0.3, "MODULE 07 · SUPPLIER MANAGEMENT", C.blue);
  s.addText("🏭  Supplier Management", { x: 0.3, y: 0.65, w: 5.9, h: 0.52, fontSize: 20, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Complete approved supplier lifecycle — from qualification to performance monitoring.", { x: 0.3, y: 1.24, w: 5.9, h: 0.4, fontSize: 10, color: C.slateLight, fontFace: "Calibri", wrap: true });

  const steps = [
    { step: "1", title: "Pre-Qualification", desc: "Financial, quality & regulatory vetting before approval", color: C.blue },
    { step: "2", title: "ASL Approval", desc: "Approved Supplier List with classification & risk tier assignment", color: C.purple },
    { step: "3", title: "Performance Scorecard", desc: "Quality PPM, delivery %, responsiveness ratings — auto-calculated", color: C.amber },
    { step: "4", title: "Risk-Based Audit Schedule", desc: "Supplier audits auto-scheduled based on risk tier & performance history", color: C.orange },
    { step: "5", title: "§8.4.2.4 Monitoring", desc: "IATF-required statistical supplier performance tracking & reporting", color: C.red },
  ];
  steps.forEach((st, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 1.85 + i*1.02, w: 6.1, h: 0.9, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color: st.color, width: 0.8 } });
    s.addShape(pptx.ShapeType.ellipse, { x: 0.38, y: 1.93 + i*1.02, w: 0.52, h: 0.52, fill: solidFill(st.color), line: { color: st.color } });
    s.addText(st.step, { x: 0.38, y: 1.93 + i*1.02, w: 0.52, h: 0.52, align: "center", valign: "middle", fontSize: 14, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(st.title, { x: 1.02, y: 1.96 + i*1.02, w: 5.25, h: 0.28, fontSize: 10.5, bold: true, color: st.color, fontFace: "Calibri" });
    s.addText(st.desc, { x: 1.02, y: 2.26 + i*1.02, w: 5.25, h: 0.44, fontSize: 9, color: C.slateLight, fontFace: "Calibri" });
  });

  s.addShape(pptx.ShapeType.rect, { x: 6.55, y: 0.06, w: 0.05, h: 7.38, fill: solidFill(C.orange) });
  sectionBadge(s, 6.75, 0.3, "MODULE 08 · TRAINING & AWARENESS", C.green);
  s.addText("🎓  Training & Awareness", { x: 6.75, y: 0.65, w: 6.2, h: 0.52, fontSize: 20, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Competency management with evidence files — built for Clause 7.2 & IATF auditors.", { x: 6.75, y: 1.24, w: 6.2, h: 0.4, fontSize: 10, color: C.slateLight, fontFace: "Calibri", wrap: true });

  const tFeats = [
    { icon: "📋", title: "Competency Matrix", desc: "Map skills to roles. See gaps. Track all employees at a glance." },
    { icon: "📎", title: "Evidence File Library", desc: "Multi-file upload: certificates, sign-off sheets, WIs, SOPs, photos." },
    { icon: "📂", title: "10 Document Categories", desc: "Certificate, Sign-Off, WI, SOP, Inspection, Cal Proc, Test, Photo, Other." },
    { icon: "🎯", title: "Controlled Doc Fields", desc: "WI/SOP/Inspection records include Doc Number, Revision, Operation Name." },
    { icon: "📊", title: "Training Event Records", desc: "Capture events, attendance, completion dates & effectiveness reviews." },
    { icon: "🔔", title: "Expiry Alerts", desc: "Never miss a certification expiry. 30/14/7-day advance alerts." },
  ];
  tFeats.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s.addShape(pptx.ShapeType.roundRect, { x: 6.75 + col*3.12, y: 1.88 + row*1.72, w: 2.98, h: 1.6, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color: C.green, width: 0.7 } });
    s.addText(f.icon, { x: 6.75 + col*3.12, y: 1.95 + row*1.72, w: 2.98, h: 0.45, align: "center", fontSize: 20, fontFace: "Segoe UI Emoji" });
    s.addText(f.title, { x: 6.85 + col*3.12, y: 2.42 + row*1.72, w: 2.78, h: 0.3, align: "center", fontSize: 9.5, bold: true, color: C.green, fontFace: "Calibri" });
    s.addText(f.desc, { x: 6.85 + col*3.12, y: 2.74 + row*1.72, w: 2.78, h: 0.62, align: "center", fontSize: 8.5, color: C.slateLight, fontFace: "Calibri", wrap: true });
  });

  s.addShape(pptx.ShapeType.roundRect, { x: 6.75, y: 7.0, w: 6.28, h: 0.35, rectRadius: 0.08, fill: tintFill(C.green, T.lo), line: { color: C.green, width: 0.8 } });
  s.addText("Evidence is RLS-isolated per tenant. Designed for future video module integration.", { x: 6.85, y: 7.0, w: 6.1, h: 0.35, valign: "middle", fontSize: 8.5, color: C.green, fontFace: "Calibri" });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 13 — CALIBRATION & PREVENTIVE MAINTENANCE
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 6.55, h: 7.38, fill: solidFill(C.navy) });
  sectionBadge(s, 0.3, 0.3, "MODULE 09 · CALIBRATION", C.orange);
  s.addText("📏  Calibration Module", { x: 0.3, y: 0.65, w: 5.9, h: 0.52, fontSize: 20, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("IATF 16949 Clause 7.1.5 compliant measurement system management.", { x: 0.3, y: 1.24, w: 5.9, h: 0.35, fontSize: 10, color: C.slateLight, fontFace: "Calibri" });

  const calFeats = [
    ["📋", "Master Register", "All measuring devices — ID, description, location, frequency, tolerance, next calibration date"],
    ["📅", "Calibration Log", "Full records with as-found/as-left data, technician ID, and certificate upload"],
    ["🏢", "Labs Registry", "Track approved external calibration labs — accreditation, scope, expiry date"],
    ["🔬", "Internal Lab Scope", "IATF §7.1.5.3.2 compliant internal lab scope documentation for audit evidence"],
    ["⚠️", "Overdue Alerts", "Never let a device go out of calibration. 30/14/7-day advance notifications"],
    ["📊", "MSA Tracking", "Measurement System Analysis results linked to control plan special characteristics"],
  ];
  calFeats.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s.addShape(pptx.ShapeType.roundRect, { x: 0.3 + col*3.08, y: 1.72 + row*1.72, w: 2.94, h: 1.6, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color: C.orange, width: 0.8 } });
    s.addText(f[0], { x: 0.3 + col*3.08, y: 1.79 + row*1.72, w: 2.94, h: 0.45, align: "center", fontSize: 20, fontFace: "Segoe UI Emoji" });
    s.addText(f[1], { x: 0.4 + col*3.08, y: 2.26 + row*1.72, w: 2.74, h: 0.3, align: "center", fontSize: 9.5, bold: true, color: C.orange, fontFace: "Calibri" });
    s.addText(f[2], { x: 0.4 + col*3.08, y: 2.58 + row*1.72, w: 2.74, h: 0.62, align: "center", fontSize: 8.5, color: C.slateLight, fontFace: "Calibri", wrap: true });
  });

  s.addShape(pptx.ShapeType.rect, { x: 6.55, y: 0.06, w: 0.05, h: 7.38, fill: solidFill(C.orange) });
  sectionBadge(s, 6.75, 0.3, "MODULE 10 · PREVENTIVE MAINTENANCE", C.amber);
  s.addText("🔧  Preventive Maintenance", { x: 6.75, y: 0.65, w: 6.2, h: 0.52, fontSize: 20, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Full TPM/PM platform for equipment reliability across multiple ISO standards.", { x: 6.75, y: 1.24, w: 6.2, h: 0.35, fontSize: 10, color: C.slateLight, fontFace: "Calibri" });

  const pmStds = [
    { std: "IATF 16949", desc: "OEE tracking, tool life management, PPAP change implications, predictive maintenance scheduling", color: C.blue },
    { std: "AS9100D", desc: "Aerospace-specific maintenance fields, FOD prevention records, airworthiness maintenance compliance", color: C.purple },
    { std: "ISO 13485", desc: "Medical device equipment validation records, cleaning & sterilization documentation, IQ/OQ/PQ", color: C.green },
    { std: "ISO 9001", desc: "General equipment register, service history, technician competency records, next service alerts", color: C.amber },
  ];
  pmStds.forEach((st, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 6.75, y: 1.78 + i*1.35, w: 6.28, h: 1.22, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color: st.color, width: 1.2 } });
    s.addShape(pptx.ShapeType.roundRect, { x: 6.75, y: 1.78 + i*1.35, w: 1.85, h: 1.22, rectRadius: 0.1, fill: tintFill(st.color, T.mid), line: { color: st.color, width: 0 } });
    s.addText(st.std, { x: 6.75, y: 1.78 + i*1.35, w: 1.85, h: 1.22, align: "center", valign: "middle", fontSize: 11, bold: true, color: st.color, fontFace: "Calibri" });
    s.addText(st.desc, { x: 8.72, y: 2.02 + i*1.35, w: 4.18, h: 0.75, fontSize: 9.5, color: C.slateLight, fontFace: "Calibri", wrap: true, valign: "middle" });
  });

  s.addShape(pptx.ShapeType.roundRect, { x: 6.75, y: 7.0, w: 6.28, h: 0.35, rectRadius: 0.08, fill: tintFill(C.amber, T.mid), line: { color: C.amber, width: 0.8 } });
  s.addText("Equipment drill-in views with full service history, part lists & technician competency records", { x: 6.85, y: 7.0, w: 6.1, h: 0.35, valign: "middle", fontSize: 9, color: C.amber, fontFace: "Calibri" });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 14 — STANDARDS COVERAGE
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);
  slideHeading(s, "Five Standards. One Platform.", "From automotive to aerospace to environmental — ISO Manager is built to run them all simultaneously.");

  const stds = [
    { std: "IATF 16949:2016", sub: "Automotive Quality", icon: "🚗", color: C.blue, feats: ["Customer-Specific Requirements (GM/Ford/Stellantis)", "APQP, PPAP, PFMEA, Control Plan", "Layered Process Audits (L1–L5)", "Warranty management §8.7.1.1", "Manufacturing process audits §9.2.2.4", "No-design-responsibility scoping"] },
    { std: "ISO 9001:2015", sub: "Quality Management", icon: "📋", color: C.green, feats: ["Full clause 4–10 QMS coverage", "Context of the organization §4", "Risk-based thinking throughout", "Management review framework §9.3", "Documented information control §7.5", "Monitoring & measurement §9.1"] },
    { std: "ISO 14001:2015", sub: "Environmental Mgmt", icon: "🌍", color: C.greenDark, feats: ["Environmental aspects & impacts", "Compliance obligations register", "Environmental objectives & KPIs", "Emergency preparedness", "Life cycle perspective", "Legal register management"] },
    { std: "ISO 45001:2018", sub: "OH&S Management", icon: "🦺", color: C.amber, feats: ["Hazard identification & risk assessment", "Worker participation & consultation", "OH&S objectives tracking", "Incident investigation workflow", "Legal & regulatory compliance", "Contractor management"] },
    { std: "AS9100D", sub: "Aerospace Quality", icon: "✈️", color: C.purple, feats: ["Configuration management", "First Article Inspection (FAI)", "FOD prevention programs", "Counterfeit parts awareness", "Key characteristics management", "Project management integration"] },
  ];

  stds.forEach((st, i) => {
    const sx = 0.2 + i*2.6;
    s.addShape(pptx.ShapeType.roundRect, { x: sx, y: 1.38, w: 2.46, h: 5.78, rectRadius: 0.14, fill: solidFill(C.navy), line: { color: st.color, width: 2 } });
    s.addShape(pptx.ShapeType.roundRect, { x: sx, y: 1.38, w: 2.46, h: 1.28, rectRadius: 0.14, fill: tintFill(st.color, T.mid), line: { color: st.color, width: 0 } });
    s.addText(st.icon, { x: sx, y: 1.46, w: 2.46, h: 0.55, align: "center", fontSize: 24, fontFace: "Segoe UI Emoji" });
    s.addText(st.std, { x: sx+0.08, y: 2.0, w: 2.3, h: 0.38, align: "center", fontSize: 9.5, bold: true, color: st.color, fontFace: "Calibri" });
    s.addText(st.sub, { x: sx+0.08, y: 2.4, w: 2.3, h: 0.22, align: "center", fontSize: 8, color: C.slateLight, fontFace: "Calibri" });
    st.feats.forEach((f, fi) => s.addText("\u25b8  " + f, { x: sx+0.1, y: 2.72 + fi*0.56, w: 2.26, h: 0.52, fontSize: 8.5, color: C.white, fontFace: "Calibri", wrap: true }));
  });

  s.addText("Every module is standards-aware — clause references, audit criteria, and CSR requirements built in from day one.", {
    x: 0, y: 7.05, w: "100%", h: 0.3, align: "center", fontSize: 10, bold: true, color: C.orange, fontFace: "Calibri"
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 15 — ACTION ITEMS & APQP
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 6.55, h: 7.38, fill: solidFill(C.navy) });
  sectionBadge(s, 0.3, 0.3, "MODULE 11 · ACTION ITEM TRACKER", C.red);
  s.addText("✅  Action Item Tracker", { x: 0.3, y: 0.65, w: 5.9, h: 0.52, fontSize: 20, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Every action from every source — in one place. Nothing falls through the cracks.", { x: 0.3, y: 1.24, w: 5.9, h: 0.38, fontSize: 10, color: C.slateLight, fontFace: "Calibri" });

  const sources = [
    { label: "Management Review Outputs", color: C.green },
    { label: "Risk Assessment Actions", color: C.orange },
    { label: "Internal Audit Findings", color: C.blue },
    { label: "KPI Gap Actions", color: C.purple },
  ];
  s.addText("Sources feeding the tracker:", { x: 0.3, y: 1.72, w: 5.9, h: 0.28, fontSize: 9.5, bold: true, color: C.slateLight, fontFace: "Calibri" });
  sources.forEach((src, i) => pill(s, 0.3, 2.06 + i*0.54, 5.9, 0.44, src.color, "\u2192  " + src.label, src.color, 10.5));

  // Tracker table
  const cols = ["Source", "Priority", "Status", "Assignee", "Due Date"];
  const rows = [
    ["Mgmt Review", "High", "In Progress", "Quality Mgr", "Jun 15"],
    ["Audit Finding", "Medium", "Open", "Process Eng", "Jun 30"],
    ["Risk Register", "Low", "Complete", "EHS Lead", "May 31"],
    ["KPI Action", "High", "OVERDUE", "Ops Director", "May 1"],
  ];
  const cwPcts = [1.25, 0.85, 0.98, 1.1, 0.92];
  const cxOffs = [0, 1.25, 2.1, 3.08, 4.18];
  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 4.38, w: 6.1, h: 2.72, rectRadius: 0.1, fill: solidFill(C.darkNavy), line: { color: C.slate, width: 0.5 } });
  cols.forEach((c, ci) => {
    s.addShape(pptx.ShapeType.rect, { x: 0.38 + cxOffs[ci], y: 4.46, w: cwPcts[ci], h: 0.3, fill: solidFill(C.slate) });
    s.addText(c, { x: 0.38 + cxOffs[ci], y: 4.46, w: cwPcts[ci], h: 0.3, align: "center", valign: "middle", fontSize: 8, bold: true, color: C.white, fontFace: "Calibri" });
  });
  rows.forEach((row, ri) => {
    const rowBg = ri === 3 ? C.red : ri % 2 === 0 ? C.darkNavy : C.navy;
    s.addShape(pptx.ShapeType.rect, { x: 0.38, y: 4.82 + ri*0.5, w: 5.98, h: 0.46, fill: solidFill(rowBg) });
    row.forEach((cell, ci) => {
      const cc = cell === "OVERDUE" ? C.red : cell === "Complete" ? C.green : cell === "High" ? C.red : cell === "Medium" ? C.amber : C.white;
      s.addText(cell, { x: 0.42 + cxOffs[ci], y: 4.84 + ri*0.5, w: cwPcts[ci]-0.04, h: 0.42, align: "center", valign: "middle", fontSize: 8.5, bold: cell === "OVERDUE", color: cc, fontFace: "Calibri" });
    });
  });

  s.addShape(pptx.ShapeType.rect, { x: 6.55, y: 0.06, w: 0.05, h: 7.38, fill: solidFill(C.orange) });
  sectionBadge(s, 6.75, 0.3, "MODULE 12 · APQP & PPAP", C.blue);
  s.addText("🚀  APQP & PPAP", { x: 6.75, y: 0.65, w: 6.2, h: 0.52, fontSize: 20, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("5-phase APQP timeline with all 18 PPAP elements, PSW tracking, and customer approval flow.", { x: 6.75, y: 1.24, w: 6.2, h: 0.4, fontSize: 10, color: C.slateLight, fontFace: "Calibri", wrap: true });

  const phases = [
    { p: "P1", t: "Plan & Define", color: C.blue },
    { p: "P2", t: "Product Design", color: C.purple },
    { p: "P3", t: "Process Design", color: C.amber },
    { p: "P4", t: "Validation", color: C.orange },
    { p: "P5", t: "Launch", color: C.green },
  ];
  phases.forEach((p, i) => {
    const px = 6.75 + i*1.22;
    s.addShape(pptx.ShapeType.roundRect, { x: px, y: 1.82, w: 1.16, h: 1.22, rectRadius: 0.08, fill: tintFill(p.color, T.mid), line: { color: p.color, width: 1.2 } });
    s.addShape(pptx.ShapeType.ellipse, { x: px+0.34, y: 1.9, w: 0.5, h: 0.42, fill: solidFill(p.color), line: { color: p.color } });
    s.addText(p.p, { x: px+0.34, y: 1.9, w: 0.5, h: 0.42, align: "center", valign: "middle", fontSize: 12, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(p.t, { x: px+0.05, y: 2.36, w: 1.06, h: 0.6, align: "center", fontSize: 8, color: C.white, fontFace: "Calibri", wrap: true });
    if (i < 4) s.addShape(pptx.ShapeType.line, { x: px+1.16, y: 3.13, w: 0.06, h: 0, line: { color: p.color, width: 0.8, endArrowType: "arrow" } });
  });

  const ppapEls = ["Design Records", "Eng. Change Docs", "Customer Approval", "PFMEA", "Process Flow", "Control Plan", "MSA Studies", "Dimensional Results", "Material Test Results", "Performance Tests", "Initial Process Studies", "Qualified Lab Docs", "Appearance Approval", "Sample Parts", "Master Sample", "Checking Aids", "Customer-Specific", "PSW (Submission Warrant)"];
  s.addText("18 PPAP Elements:", { x: 6.75, y: 3.22, w: 6.2, h: 0.28, fontSize: 10, bold: true, color: C.slateLight, fontFace: "Calibri" });
  ppapEls.forEach((el, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    s.addShape(pptx.ShapeType.roundRect, { x: 6.75 + col*2.08, y: 3.58 + row*0.7, w: 2.0, h: 0.62, rectRadius: 0.06, fill: solidFill(C.darkNavy), line: { color: C.blue, width: 0.5 } });
    s.addText((i+1) + ". " + el, { x: 6.8 + col*2.08, y: 3.6 + row*0.7, w: 1.9, h: 0.58, valign: "middle", fontSize: 7.5, color: C.white, fontFace: "Calibri", wrap: true });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 16 — HOW IT WORKS (3 PHASES)
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);
  slideHeading(s, "Three Phases to Certification", "From zero to audit-ready in a structured, Isa-guided journey — at your own pace.");

  const phases = [
    {
      num: "01", phase: "SETUP", title: "Build Your System Profile",
      color: C.orange,
      steps: ["Complete 3-part Organization Wizard", "Map your processes & interactions", "Define scope, exclusions & standards", "Upload quality policy & org chart", "Configure PESTLE & interested parties", "Isa guides you through every field"],
      outcome: "Isa knows your organization — every consultation is now tailored to your exact context, scope, and standard.",
    },
    {
      num: "02", phase: "MANAGE", title: "Run Your QMS Daily",
      color: C.blue,
      steps: ["Log & resolve nonconformances (8D)", "Conduct layered process audits", "Track and update your risk register", "Manage documents with version control", "Monitor supplier performance scores", "Generate management review minutes"],
      outcome: "Every module connects to every other. NCs link to CAPAs, audits link to NCs, risks link to objectives.",
    },
    {
      num: "03", phase: "CERTIFY", title: "Prepare for External Audit",
      color: C.green,
      steps: ["Run Isa's pre-audit gap assessment", "Review compliance map vs. standard", "Generate audit-ready document package", "Verify all NCs are closed & effective", "Confirm management review outputs", "Walk auditors through the live system"],
      outcome: "Walk into your external audit with confidence. Isa has already found every gap — before the registrar does.",
    },
  ];

  phases.forEach((p, i) => {
    const px = 0.25 + i*4.36;
    s.addShape(pptx.ShapeType.roundRect, { x: px, y: 1.38, w: 4.15, h: 5.78, rectRadius: 0.14, fill: solidFill(C.navy), line: { color: p.color, width: 2 } });
    s.addShape(pptx.ShapeType.roundRect, { x: px, y: 1.38, w: 4.15, h: 1.1, rectRadius: 0.14, fill: tintFill(p.color, T.mid), line: { color: p.color, width: 0 } });
    s.addShape(pptx.ShapeType.ellipse, { x: px+0.15, y: 1.48, w: 0.65, h: 0.65, fill: solidFill(p.color), line: { color: p.color } });
    s.addText(p.num, { x: px+0.15, y: 1.48, w: 0.65, h: 0.65, align: "center", valign: "middle", fontSize: 16, bold: true, color: C.white, fontFace: "Calibri" });
    s.addText(p.phase, { x: px+0.88, y: 1.54, w: 3.1, h: 0.28, fontSize: 11, bold: true, color: p.color, fontFace: "Calibri" });
    s.addText(p.title, { x: px+0.15, y: 2.58, w: 3.85, h: 0.48, fontSize: 14, bold: true, color: C.white, fontFace: "Calibri" });
    p.steps.forEach((st, si) => checkItem(s, px+0.12, 3.18 + si*0.5, st, p.color, 9));
    s.addShape(pptx.ShapeType.roundRect, { x: px+0.12, y: 6.28, w: 3.91, h: 0.75, rectRadius: 0.08, fill: tintFill(p.color, T.lo), line: { color: p.color, width: 0.8 } });
    s.addText("\u2713  " + p.outcome, { x: px+0.2, y: 6.3, w: 3.75, h: 0.7, fontSize: 8.5, color: p.color, fontFace: "Calibri", wrap: true });
    if (i < 2) s.addText("\u2192", { x: px+4.15, y: 4.2, w: 0.36, h: 0.38, align: "center", valign: "middle", fontSize: 18, bold: true, color: C.orange, fontFace: "Calibri" });
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 17 — CCI CHEMICAL CUSTOMER STORY
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0.06, w: 5.8, h: 7.38, fill: solidFill(C.navy) });
  sectionBadge(s, 0.3, 0.3, "CUSTOMER STORY");
  s.addText("CCI Chemical, Inc.", { x: 0.3, y: 0.65, w: 5.2, h: 0.58, fontSize: 26, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Detroit, MI  \u00b7  IATF 16949:2016  \u00b7  85 Employees", { x: 0.3, y: 1.28, w: 5.2, h: 0.3, fontSize: 10.5, color: C.slateLight, fontFace: "Calibri" });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.65, w: 3.5, h: 0.06, fill: solidFill(C.orange) });
  s.addText("DOT 4 brake fluid, industrial lubricants & automotive fluids for Tier 1 OEM customers. No design responsibility — customer-directed designs.", {
    x: 0.3, y: 1.8, w: 5.2, h: 0.65, fontSize: 10.5, color: C.slateLight, fontFace: "Calibri", wrap: true
  });

  const results = [
    { v: "26", l: "Controlled Documents", s: "QM through Work Instructions", c: C.purple },
    { v: "19", l: "Risks Assessed", s: "Operational & strategic", c: C.orange },
    { v: "3", l: "Mgmt Reviews", s: "Full minutes & action tracking", c: C.green },
    { v: "14", l: "Action Items", s: "Cross-source, all tracked", c: C.blue },
    { v: "32", l: "KPI Data Points", s: "Actuals vs. targets, trending", c: C.amber },
    { v: "12", l: "Employees Trained", s: "Competency matrix complete", c: C.green },
  ];
  results.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    statBox(s, 0.3 + col*2.72, 2.62 + row*1.6, 2.58, 1.48, r.v, r.l + "\n" + r.s, r.c);
  });

  const modsActive = [
    "📄  Documentation Library — 26 professional docs, AI-drafted by Isa",
    "📋  NC & CAPA — full 8D corrective action workflow active",
    "📊  Risk Register — 19 risks, PESTLE & SWOT exports complete",
    "📅  Management Review — Q1 & Q2 with AI-generated minutes",
    "✅  Action Item Tracker — all sources linked and monitored",
    "📈  KPI Dashboard — 32 actuals vs. targets with trend charts",
    "🎓  Training — 12 employees, multi-file evidence library live",
    "🌍  Context of Org — PESTLE, SWOT, interested parties mapped",
  ];
  s.addText("Modules Active at CCI Chemical", { x: 6.1, y: 0.5, w: 7.0, h: 0.42, fontSize: 16, bold: true, color: C.white, fontFace: "Calibri" });
  modsActive.forEach((m, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 6.1, y: 1.02 + i*0.78, w: 7.08, h: 0.7, rectRadius: 0.08, fill: solidFill(C.navy), line: { color: C.orange, width: 0.5 } });
    s.addText(m, { x: 6.25, y: 1.08 + i*0.78, w: 6.8, h: 0.58, valign: "middle", fontSize: 10, color: C.white, fontFace: "Calibri" });
  });

  s.addShape(pptx.ShapeType.roundRect, { x: 6.1, y: 7.08, w: 7.08, h: 0.22, rectRadius: 0.05, fill: solidFill(C.orange), line: { color: C.orange } });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 18 — WHY ISO MANAGER WINS
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);
  slideHeading(s, "Why ISO Manager Wins", "Purpose-built for manufacturers. AI-native from day one. Nothing else comes close.");

  const comparisons = [
    "AI Lead Auditor (Isa) built in — clause-specific, not generic",
    "IATF 16949 Customer-Specific Requirements (GM / Ford / Stellantis)",
    "Layered Process Audits (LPA) — L1–L5, OEM-compliant",
    "Turtle diagram process audits (§9.2.2.4)",
    "All 5 ISO standards simultaneously in one platform",
    "AI document drafting — full procedures generated in seconds",
    "Cross-source Action Item Tracker — nothing orphaned",
    "APQP & PPAP (all 18 elements) built in",
    "Multi-tenant Row-Level Security — enterprise data isolation",
    "Evidence file library with 10 controlled document categories",
    "Mobile-ready audit conduct — on the shop floor",
    "Management Review AI minutes — pre-filled from live data",
  ];

  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 1.25, w: 12.7, h: 5.92, rectRadius: 0.12, fill: solidFill(C.navy), line: { color: C.slate, width: 0.5 } });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 1.25, w: 12.7, h: 0.45, rectRadius: 0.12, fill: solidFill(C.slate) });
  s.addText("Feature", { x: 0.5, y: 1.3, w: 9.2, h: 0.35, valign: "middle", fontSize: 10, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("ISO Manager + Isa", { x: 9.8, y: 1.3, w: 1.7, h: 0.35, align: "center", valign: "middle", fontSize: 9, bold: true, color: C.orange, fontFace: "Calibri" });
  s.addText("Others", { x: 11.6, y: 1.3, w: 1.3, h: 0.35, align: "center", valign: "middle", fontSize: 9, bold: true, color: C.slateLight, fontFace: "Calibri" });

  comparisons.forEach((c, i) => {
    const ry = 1.75 + i*0.45;
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y: ry, w: 12.7, h: 0.43, fill: solidFill(i%2===0 ? C.darkNavy : C.navy) });
    s.addText(c, { x: 0.5, y: ry+0.06, w: 9.2, h: 0.31, valign: "middle", fontSize: 10, color: C.white, fontFace: "Calibri" });
    s.addShape(pptx.ShapeType.ellipse, { x: 10.18, y: ry+0.09, w: 0.26, h: 0.26, fill: solidFill(C.green), line: { color: C.green } });
    s.addText("\u2713", { x: 10.16, y: ry+0.08, w: 0.3, h: 0.28, align: "center", valign: "middle", fontSize: 10, bold: true, color: C.white, fontFace: "Calibri" });
    s.addShape(pptx.ShapeType.ellipse, { x: 11.98, y: ry+0.09, w: 0.26, h: 0.26, fill: solidFill(C.red), line: { color: C.red } });
    s.addText("\u2717", { x: 11.96, y: ry+0.08, w: 0.3, h: 0.28, align: "center", valign: "middle", fontSize: 10, bold: true, color: C.white, fontFace: "Calibri" });
  });

  s.addText("ISO Manager + Isa is the only platform that does ALL of this — natively, seamlessly, purpose-built for manufacturers.", {
    x: 0, y: 7.05, w: "100%", h: 0.3, align: "center", fontSize: 10.5, bold: true, color: C.orange, fontFace: "Calibri"
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 19 — ENTERPRISE ARCHITECTURE & SECURITY
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);
  orangeBar(s, 0, 0.06);
  orangeBar(s, 7.44, 0.06);
  slideHeading(s, "Enterprise-Grade. Built to Last.", "Multi-tenant architecture with two independent data isolation layers — your data is always yours alone.");

  const pillars = [
    { icon: "🔒", title: "Row-Level Security", color: C.blue, pts: ["PostgreSQL RLS enforced on all 90 tenant tables", "Database-layer isolation — protects even if a route bug occurs", "App-layer: 767+ explicit user-scoping references in code", "Superadmin bypass with session-level per-request control"] },
    { icon: "🤖", title: "AI-Native Architecture", color: C.purple, pts: ["Anthropic Claude — enterprise AI, never trained on your data", "Isa's personas are domain-trained across 5 ISO standards", "Private conversation isolation per tenant account", "Context-aware — your org profile informs every answer"] },
    { icon: "📱", title: "Modern Tech Stack", color: C.green, pts: ["React + Vite frontend — fast, responsive, mobile-ready", "Express + Node.js backend with full TypeScript safety", "PostgreSQL + Drizzle ORM for type-safe queries", "Progressive Web App (PWA) — installable, works offline"] },
    { icon: "🌐", title: "Multi-Tenant Scale", color: C.orange, pts: ["Each company gets a fully isolated QMS environment", "3-tier role system: Librarian / Trainer / Internal Auditor", "Team management with multi-seat billing", "Superadmin dashboard for CCHUB operations oversight"] },
  ];

  pillars.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const px = 0.25 + col*6.55, py = 1.42 + row*2.98;
    s.addShape(pptx.ShapeType.roundRect, { x: px, y: py, w: 6.3, h: 2.75, rectRadius: 0.14, fill: solidFill(C.navy), line: { color: p.color, width: 1.5 } });
    s.addText(p.icon, { x: px+0.12, y: py+0.18, w: 0.7, h: 0.7, align: "center", fontSize: 30, fontFace: "Segoe UI Emoji" });
    s.addText(p.title, { x: px+0.92, y: py+0.28, w: 5.25, h: 0.4, fontSize: 15, bold: true, color: p.color, fontFace: "Calibri" });
    p.pts.forEach((pt, pi) => checkItem(s, px+0.15, py+0.88 + pi*0.46, pt, p.color, 9.5));
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE 20 — CALL TO ACTION
// ══════════════════════════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  bg(s, C.darkNavy);

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 5.5, h: "100%", fill: solidFill(C.orange) });
  // Triangle to blend panels
  s.addShape(pptx.ShapeType.rtTriangle, { x: 5.5, y: 0, w: 1.0, h: 7.5, fill: solidFill(C.orange), line: { color: C.orange, width: 0 } });

  s.addText("Ready\nto Run\nCruise\nControl?", { x: 0.35, y: 0.55, w: 5.0, h: 3.9, fontSize: 46, bold: true, color: C.white, fontFace: "Calibri", breakLine: true });
  s.addText("Your ISO QMS is waiting.", { x: 0.35, y: 4.58, w: 5.0, h: 0.45, fontSize: 16, color: C.white, fontFace: "Calibri" });
  s.addText("corecompliancehub.com", { x: 0.35, y: 5.12, w: 5.0, h: 0.38, fontSize: 15, bold: true, color: C.white, fontFace: "Calibri" });
  s.addShape(pptx.ShapeType.rect, { x: 0.35, y: 5.58, w: 4.0, h: 0.06, fill: solidFill(C.white) });
  s.addText("Powered by ACSI\nAdvanced Compliance Solutions International", { x: 0.35, y: 5.72, w: 5.0, h: 0.65, fontSize: 11, color: C.white, fontFace: "Calibri", breakLine: true });

  // Right panel CTAs
  s.addText("Start Your Journey with Isa", { x: 6.95, y: 0.55, w: 6.1, h: 0.62, fontSize: 24, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Three ways to get started today:", { x: 6.95, y: 1.25, w: 6.1, h: 0.3, fontSize: 12, color: C.slateLight, fontFace: "Calibri" });

  const ctas = [
    { icon: "🎯", title: "Request a Live Demo", desc: "See Isa in action with your processes, your standard, and your real questions.", color: C.orange },
    { icon: "🚀", title: "Start Your Free Trial", desc: "Get your ISO Manager environment up in minutes. No credit card required.", color: C.blue },
    { icon: "💬", title: "Talk to an ISO Expert", desc: "30-minute consultation with our ACSI team. We will map your path to certification.", color: C.green },
  ];
  ctas.forEach((c, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 6.95, y: 1.72 + i*1.7, w: 6.12, h: 1.55, rectRadius: 0.14, fill: solidFill(C.navy), line: { color: c.color, width: 2 } });
    s.addText(c.icon, { x: 7.05, y: 1.84 + i*1.7, w: 0.8, h: 0.8, align: "center", fontSize: 30, fontFace: "Segoe UI Emoji" });
    s.addText(c.title, { x: 7.95, y: 1.88 + i*1.7, w: 4.95, h: 0.35, fontSize: 14, bold: true, color: c.color, fontFace: "Calibri" });
    s.addText(c.desc, { x: 7.95, y: 2.26 + i*1.7, w: 4.95, h: 0.75, fontSize: 10.5, color: C.slateLight, fontFace: "Calibri", wrap: true });
  });

  // Bottom stats bar
  s.addShape(pptx.ShapeType.roundRect, { x: 6.95, y: 6.88, w: 6.12, h: 0.46, rectRadius: 0.1, fill: solidFill(C.slate) });
  const stats = ["14+ Modules", "5 Standards", "AI-Powered", "Audit-Ready", "Mfg-Focused"];
  stats.forEach((st, i) => {
    s.addText(st, { x: 7.05 + i*1.22, y: 6.88, w: 1.18, h: 0.46, align: "center", valign: "middle", fontSize: 9, bold: true, color: C.orange, fontFace: "Calibri" });
    if (i < 4) s.addShape(pptx.ShapeType.line, { x: 8.18 + i*1.22, y: 7.0, w: 0, h: 0.22, line: { color: C.slateLight, width: 0.5 } });
  });

  orangeBar(s, 7.44, 0.06);
}

// ══════════════════════════════════════════════════════════════════════════════
// SAVE
// ══════════════════════════════════════════════════════════════════════════════
const outPath = "Isa_ISO_Manager_Platform_Presentation.pptx";
await pptx.writeFile({ fileName: outPath });
console.log("Saved: " + outPath);
