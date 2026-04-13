import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart2, Plus, Pencil, TrendingUp, TrendingDown, Minus, Bot,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, MinusCircle,
  LayoutDashboard, List,
} from "lucide-react";
import type { IsoObjective, IsoKpiActual, InsertIsoKpiActual, InsertIsoObjective } from "@shared/schema";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";

const STATUS_COLORS = {
  on_track: { border: "border-green-400", text: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", hex: "#22c55e" },
  at_risk: { border: "border-yellow-400", text: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", hex: "#f59e0b" },
  off_track: { border: "border-red-400", text: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", hex: "#ef4444" },
};

const KPI_CHART_COLORS = ["#3b82f6", "#f97316", "#8b5cf6", "#10b981", "#ec4899", "#06b6d4"];

const statusIcon = (s: string) => {
  if (s === "on_track") return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === "at_risk") return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  return <MinusCircle className="w-4 h-4 text-red-500" />;
};

function GaugeChart({ actual, target, size = 160 }: { actual: number; target: number; size?: number }) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const angle = (pct / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = 80, cy = 80, r = 60;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 160 100" style={{ width: size, height: size * 0.625 }}>
      <path d="M20,80 A60,60 0 0,1 140,80" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
      {pct > 0 && (
        <path d={`M20,80 A60,60 0 ${pct > 50 ? 1 : 0},1 ${cx + r * Math.cos((((pct / 100) * 180 - 90) * Math.PI) / 180)},${cy + r * Math.sin((((pct / 100) * 180 - 90) * Math.PI) / 180)}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      )}
      <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill={color} />
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>{pct.toFixed(0)}%</text>
    </svg>
  );
}

function OverallGauge({ onTrack, total }: { onTrack: number; total: number }) {
  const pct = total > 0 ? (onTrack / total) * 100 : 0;
  const angle = (pct / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const cx = 100, cy = 100, r = 80;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 125" className="w-full max-w-[180px]">
        <path d="M25,100 A75,75 0 0,1 175,100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
        {pct > 0 && (
          <path d={`M25,100 A75,75 0 ${pct > 50 ? 1 : 0},1 ${cx + r * Math.cos((((pct / 100) * 180 - 90) * Math.PI) / 180)},${cy + r * Math.sin((((pct / 100) * 180 - 90) * Math.PI) / 180)}`}
            fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" />
        )}
        <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="20" fontWeight="bold" fill={color}>{pct.toFixed(0)}%</text>
        <text x={cx} y={cy + 36} textAnchor="middle" fontSize="9" fill="#9ca3af">On Track</text>
      </svg>
      <p className="text-xs text-muted-foreground mt-1">{onTrack} of {total} KPIs on track</p>
    </div>
  );
}

function TrendArrow({ actuals, targetVal, unit }: { actuals: IsoKpiActual[]; targetVal: number; unit?: string }) {
  const sorted = [...actuals].sort((a, b) => a.period.localeCompare(b.period));
  if (sorted.length < 2) return null;
  const prev = parseFloat(sorted[sorted.length - 2].actual);
  const curr = parseFloat(sorted[sorted.length - 1].actual);
  const delta = curr - prev;
  const pct = prev !== 0 ? ((delta / prev) * 100) : 0;
  const improving = targetVal > 0 ? curr > prev : curr < prev;
  const color = improving ? "text-green-600" : "text-red-500";
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {delta > 0 ? "+" : ""}{delta.toFixed(1)} {unit} ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
    </span>
  );
}

function periodRange(window: string, customStart: string, customEnd: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  if (window === "last_30d") {
    const d = new Date(now); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0);
    return { start: d, end: null };
  }
  if (window === "rolling_12m") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 12);
    d.setDate(1); d.setHours(0, 0, 0, 0);
    return { start: d, end: null };
  }
  if (window === "current_quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return { start: new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0), end: null };
  }
  if (window === "current_year") {
    return { start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0), end: null };
  }
  if (window === "custom") {
    const start = customStart ? new Date(customStart + "-01") : null;
    const end = customEnd ? new Date(new Date(customEnd + "-01").getFullYear(), new Date(customEnd + "-01").getMonth() + 1, 0, 23, 59, 59) : null;
    return { start, end };
  }
  return { start: null, end: null };
}

/** Shift a YYYY-MM period string back by exactly one year */
function priorYearPeriod(period: string): string {
  const [y, m] = period.split("-");
  return `${parseInt(y) - 1}-${m}`;
}

function KpiCard({ obj, actuals, onLog, onEdit, range, showYoY }: {
  obj: IsoObjective;
  actuals: IsoKpiActual[];
  onLog: () => void;
  onEdit: () => void;
  range: { start: Date | null; end: Date | null };
  showYoY?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const windowActuals = actuals.filter(a => {
    if (!range.start && !range.end) return true;
    const entryDate = a.loggedAt ? new Date(a.loggedAt as unknown as string)
      : new Date(a.period.slice(0, 7) + "-01");
    if (range.start && entryDate < range.start) return false;
    if (range.end && entryDate > range.end) return false;
    return true;
  });
  const sorted = [...windowActuals].sort((a, b) => a.period.localeCompare(b.period));
  const allSorted = [...actuals].sort((a, b) => a.period.localeCompare(b.period));
  const latest = allSorted[allSorted.length - 1];
  const latestVal = latest ? parseFloat(latest.actual) : 0;
  const targetVal = parseFloat(obj.target ?? "0");
  // Build chart data with optional prior-year series
  const actualsByPeriod = Object.fromEntries(actuals.map(a => [a.period, parseFloat(a.actual)]));
  const chartData = sorted.map(a => {
    const row: Record<string, number | string> = { period: a.period, actual: parseFloat(a.actual), target: targetVal };
    if (showYoY) {
      const py = priorYearPeriod(a.period);
      if (actualsByPeriod[py] !== undefined) row.priorYear = actualsByPeriod[py];
    }
    return row;
  });
  const hasYoY = showYoY && chartData.some(d => d.priorYear !== undefined);
  const variance = latest ? latestVal - targetVal : null;
  const variancePct = (variance !== null && targetVal !== 0) ? (variance / targetVal) * 100 : null;
  const sc = STATUS_COLORS[obj.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.off_track;

  return (
    <Card className={`border-l-4 ${sc.border}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {statusIcon(obj.status)}
              <span className="font-semibold text-sm text-foreground truncate">{obj.name}</span>
              <Badge variant="outline" className="text-xs shrink-0">{obj.frequency}</Badge>
              <span className="text-xs font-mono text-accent font-bold">§9.1</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {obj.processName && <span>Process: <span className="font-medium">{obj.processName}</span></span>}
              {obj.responsible && <span>Owner: <span className="font-medium">{obj.responsible}</span></span>}
              <span>Target: <span className="font-medium">{obj.target} {obj.unit}</span></span>
              {latest && <span>Latest: <span className="font-medium text-foreground">{latest.actual} {obj.unit}</span> ({latest.period})</span>}
            </div>
            {latest && (
              <div className="mt-1.5 flex flex-wrap gap-3 items-center">
                {variance !== null && (
                  <span className={`text-xs font-medium ${variance >= 0 ? "text-green-600" : "text-red-500"}`}>
                    Variance: {variance >= 0 ? "+" : ""}{variance.toFixed(1)} {obj.unit}
                    {variancePct !== null && <span className="opacity-70 ml-1">({variancePct >= 0 ? "+" : ""}{variancePct.toFixed(1)}%)</span>}
                  </span>
                )}
                <TrendArrow actuals={actuals} targetVal={targetVal} unit={obj.unit ?? ""} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isNaN(latestVal) && !isNaN(targetVal) && targetVal > 0 && (
              <div className="w-16"><GaugeChart actual={latestVal} target={targetVal} size={64} /></div>
            )}
            <div className="flex flex-col gap-1">
              <button onClick={onLog} data-testid={`button-log-kpi-${obj.id}`} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-accent" title="Log measurement">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={onEdit} data-testid={`button-edit-obj-${obj.id}`} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Edit KPI">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setExpanded(v => !v)} className="p-1 rounded hover:bg-muted text-muted-foreground" data-testid={`button-expand-kpi-${obj.id}`}>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {expanded && chartData.length > 0 && (
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <ReferenceLine y={targetVal} stroke="#f97316" strokeDasharray="4 2" label={{ value: "Target", position: "insideTopRight", fontSize: 10, fill: "#f97316" }} />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="This Year" />
                {hasYoY && (
                  <Line type="monotone" dataKey="priorYear" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" dot={{ r: 2 }} name="Prior Year" connectNulls={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
            {hasYoY && (
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-blue-500"></span> This Year</span>
                <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-slate-400" style={{ borderTop: "1.5px dashed #94a3b8" }}></span> Prior Year</span>
              </div>
            )}
          </div>
        )}
        {expanded && (
          <div className="mt-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Measurement History</div>
            {windowActuals.length === 0 ? (
              <p className="text-xs text-muted-foreground">{actuals.length === 0 ? "No measurements logged yet." : "No measurements in this time window."}</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...windowActuals].sort((a, b) => b.period.localeCompare(a.period)).map(a => (
                  <div key={a.id} className="flex justify-between text-xs py-1 px-2 rounded bg-muted/40">
                    <span className="font-medium">{a.period}</span>
                    <span>{a.actual} {obj.unit}</span>
                    {a.notes && <span className="text-muted-foreground truncate max-w-[120px]">{a.notes}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BigKpiChart({ obj, actuals, colorHex, onLog, onEdit, showYoY }: {
  obj: IsoObjective;
  actuals: IsoKpiActual[];
  colorHex: string;
  onLog: () => void;
  onEdit: () => void;
  showYoY?: boolean;
}) {
  const sorted = [...actuals].sort((a, b) => a.period.localeCompare(b.period));
  const latest = sorted[sorted.length - 1];
  const latestVal = latest ? parseFloat(latest.actual) : 0;
  const targetVal = parseFloat(obj.target ?? "0");
  const variance = latest ? latestVal - targetVal : null;
  const sc = STATUS_COLORS[obj.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.off_track;

  // Build chart data with optional prior-year overlay
  const actualsByPeriod = Object.fromEntries(actuals.map(a => [a.period, parseFloat(a.actual)]));
  const chartData = sorted.map(a => {
    const row: Record<string, number | string> = { period: a.period, actual: parseFloat(a.actual), target: targetVal };
    if (showYoY) {
      const py = priorYearPeriod(a.period);
      if (actualsByPeriod[py] !== undefined) row.priorYear = actualsByPeriod[py];
    }
    return row;
  });
  const hasYoY = showYoY && chartData.some(d => d.priorYear !== undefined);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const actualEntry = payload.find((p: any) => p.dataKey === "actual");
    const priorEntry = payload.find((p: any) => p.dataKey === "priorYear");
    const actualVal = actualEntry?.value;
    const varVal = actualVal !== undefined ? (actualVal - targetVal) : null;
    const note = sorted.find(a => a.period === label)?.notes;
    return (
      <div className="bg-white dark:bg-card border border-border rounded-lg shadow-lg p-3 text-xs max-w-[200px]">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {actualVal !== undefined && <p style={{ color: colorHex }}>This Year: <strong>{actualVal} {obj.unit}</strong></p>}
        {priorEntry?.value !== undefined && <p className="text-slate-500">Prior Year: <strong>{priorEntry.value} {obj.unit}</strong></p>}
        <p className="text-muted-foreground">Target: {targetVal} {obj.unit}</p>
        {varVal !== null && (
          <p className={varVal >= 0 ? "text-green-600" : "text-red-500"}>
            {varVal >= 0 ? "▲" : "▼"} {Math.abs(varVal).toFixed(1)} {obj.unit} vs target
          </p>
        )}
        {note && <p className="text-muted-foreground mt-1 italic border-t border-border pt-1">{note}</p>}
      </div>
    );
  };

  return (
    <Card className={`border-t-4 ${sc.border} flex flex-col`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {statusIcon(obj.status)}
              <CardTitle className="text-sm font-bold text-foreground leading-tight">{obj.name}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {obj.processName && <span className="mr-2">📌 {obj.processName}</span>}
              {obj.responsible && <span>👤 {obj.responsible}</span>}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={onLog} data-testid={`button-dash-log-${obj.id}`} title="Log measurement"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-accent border border-border">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={onEdit} data-testid={`button-dash-edit-${obj.id}`} title="Edit KPI"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground border border-border">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI stats row */}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <div className="flex items-center gap-2">
            <GaugeChart actual={latestVal} target={targetVal} size={80} />
            <div>
              <div className="text-2xl font-black" style={{ color: colorHex }}>
                {latest ? latest.actual : "—"}
                <span className="text-sm font-normal text-muted-foreground ml-1">{obj.unit}</span>
              </div>
              <div className="text-xs text-muted-foreground">Latest ({latest?.period ?? "—"})</div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-xs"><span className="text-muted-foreground">Target: </span><span className="font-bold">{obj.target} {obj.unit}</span></div>
            {variance !== null && (
              <div className={`text-xs font-semibold ${variance >= 0 ? "text-green-600" : "text-red-500"}`}>
                {variance >= 0 ? "▲" : "▼"} {Math.abs(variance).toFixed(1)} {obj.unit} vs target
              </div>
            )}
            <TrendArrow actuals={actuals} targetVal={targetVal} unit={obj.unit ?? ""} />
          </div>
          <Badge className={`ml-auto text-xs ${sc.bg} ${sc.text} border-0 font-semibold`}>
            {obj.status === "on_track" ? "On Track" : obj.status === "at_risk" ? "At Risk" : "Off Track"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-1">
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">No measurement data yet</div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-${obj.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorHex} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={colorHex} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                  domain={[
                    (dataMin: number) => Math.floor(Math.min(dataMin, targetVal) * 0.97),
                    (dataMax: number) => Math.ceil(Math.max(dataMax, targetVal) * 1.02),
                  ]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={targetVal}
                  stroke="#f97316"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: `Target: ${targetVal}${obj.unit}`, position: "insideTopRight", fontSize: 10, fill: "#f97316", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke={colorHex}
                  strokeWidth={2.5}
                  fill={`url(#grad-${obj.id})`}
                  dot={{ r: 4, fill: colorHex, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: colorHex, strokeWidth: 2, stroke: "#fff" }}
                  name="This Year"
                />
                {hasYoY && (
                  <Line
                    type="monotone"
                    dataKey="priorYear"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    dot={{ r: 2.5, fill: "#94a3b8" }}
                    name="Prior Year"
                    connectNulls={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
            {hasYoY && (
              <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 rounded" style={{ background: colorHex }}></span> This Year</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-px border-t border-dashed border-slate-400"></span> Prior Year</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MultiKpiSummaryChart({ objectives, allActuals }: { objectives: IsoObjective[]; allActuals: IsoKpiActual[] }) {
  const data = objectives.map((obj, i) => {
    const objActuals = allActuals.filter(a => a.objectiveId === obj.id);
    const sorted = [...objActuals].sort((a, b) => a.period.localeCompare(b.period));
    const latest = sorted[sorted.length - 1];
    const latestVal = latest ? parseFloat(latest.actual) : 0;
    const targetVal = parseFloat(obj.target ?? "1");
    const pctOfTarget = targetVal > 0 ? Math.round((latestVal / targetVal) * 100) : 0;
    return {
      name: obj.name.length > 22 ? obj.name.slice(0, 20) + "…" : obj.name,
      fullName: obj.name,
      pctOfTarget,
      actual: latestVal,
      target: targetVal,
      unit: obj.unit ?? "",
      status: obj.status,
      color: KPI_CHART_COLORS[i % KPI_CHART_COLORS.length],
    };
  });

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-white dark:bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
        <p className="font-bold text-foreground mb-1">{d.fullName}</p>
        <p>Actual: <strong>{d.actual} {d.unit}</strong></p>
        <p className="text-muted-foreground">Target: {d.target} {d.unit}</p>
        <p style={{ color: d.color }} className="font-bold mt-1">{d.pctOfTarget}% of target</p>
      </div>
    );
  };

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-accent" />
          KPI Performance vs. Target (All Metrics)
          <span className="text-xs font-mono text-accent font-bold ml-1">§9.1</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Latest actual as % of target — 100% = on target, orange line = target threshold</p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="%" domain={[0, 110]} />
              <Tooltip content={<CustomBarTooltip />} />
              <ReferenceLine y={100} stroke="#f97316" strokeDasharray="5 3" strokeWidth={1.5}
                label={{ value: "100% Target", position: "insideTopRight", fontSize: 10, fill: "#f97316", fontWeight: "bold" }} />
              <Bar dataKey="pctOfTarget" radius={[4, 4, 0, 0]} name="% of Target">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const EMPTY_EDIT_FORM = { target: "", unit: "", frequency: "monthly", responsible: "", status: "on_track", description: "" };
const EMPTY_LOG_FORM = { period: "", actual: "", notes: "" };

const PERIOD_WINDOWS = [
  { val: "last_30d", label: "Last 30 days" },
  { val: "current_quarter", label: "Current Quarter" },
  { val: "current_year", label: "Current Year" },
  { val: "rolling_12m", label: "Rolling 12 Mo" },
  { val: "custom", label: "Custom Range" },
  { val: "all", label: "All Time" },
];

export default function MeasurementModule({ isoProjectId }: { isoProjectId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [logFor, setLogFor] = useState<IsoObjective | null>(null);
  const [logForm, setLogForm] = useState(EMPTY_LOG_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editingObj, setEditingObj] = useState<IsoObjective | null>(null);
  const [isaOpen, setIsaOpen] = useState(false);
  const [isaInput, setIsaInput] = useState("");
  const [isaMessages, setIsaMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [isaLoading, setIsaLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [periodWindow, setPeriodWindow] = useState("current_year");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "dashboard">("dashboard");
  const [showYoY, setShowYoY] = useState(false);
  const activePeriodRange = periodRange(periodWindow, customStart, customEnd);

  const objQKey = ["/api/iso-objectives", isoProjectId];
  const actualsQKey = ["/api/iso-kpi-actuals", isoProjectId];

  const { data: objectives = [], isLoading } = useQuery<IsoObjective[]>({
    queryKey: objQKey,
    queryFn: () => fetch(`/api/iso-objectives${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });
  const { data: allActuals = [] } = useQuery<IsoKpiActual[]>({
    queryKey: actualsQKey,
    queryFn: () => fetch(`/api/iso-kpi-actuals${isoProjectId ? `?isoProjectId=${isoProjectId}` : ""}`).then(r => r.json()),
  });

  const updateObjMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<InsertIsoObjective, 'userId'>> }) => apiRequest("PATCH", `/api/iso-objectives/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: objQKey }); toast({ title: "KPI updated" }); setEditingObj(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const logMutation = useMutation({
    mutationFn: (d: Omit<InsertIsoKpiActual, 'userId'>) => apiRequest("POST", "/api/iso-kpi-actuals", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: actualsQKey });
      qc.invalidateQueries({ queryKey: objQKey });
      toast({ title: "Measurement logged" });
      setLogFor(null);
      setLogForm(EMPTY_LOG_FORM);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (obj: IsoObjective) => {
    setEditingObj(obj);
    setEditForm({
      target: obj.target ?? "", unit: obj.unit ?? "",
      frequency: obj.frequency ?? "monthly", responsible: obj.responsible ?? "",
      status: obj.status, description: obj.description ?? "",
    });
  };

  const submitEdit = () => {
    if (!editingObj) return;
    updateObjMutation.mutate({ id: editingObj.id, data: editForm });
  };

  const filtered = filterStatus === "all" ? objectives : objectives.filter(o => o.status === filterStatus);
  const onTrack = objectives.filter(o => o.status === "on_track").length;
  const atRisk = objectives.filter(o => o.status === "at_risk").length;
  const offTrack = objectives.filter(o => o.status === "off_track").length;

  const sendIsaMessage = async () => {
    if (!isaInput.trim()) return;
    const userMsg = { role: "user" as const, content: isaInput.trim() };
    const newMsgs = [...isaMessages, userMsg];
    setIsaMessages(newMsgs);
    setIsaInput("");
    setIsaLoading(true);
    try {
      const kpiContext = objectives.map(o => `- ${o.name} (${o.processName ?? "?"}): target ${o.target} ${o.unit}, status ${o.status}`).join("\n");
      const resp = await fetch("/api/iso/module-isa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          systemPrompt: `You are Isa, Lead ISO Auditor for ACSI ISO Manager. You specialize in ISO Clause 9.1 (Monitoring, Measurement, Analysis and Evaluation) and KPI management for QMS. Help users select meaningful KPIs, set targets, analyze trends, and interpret results against ISO requirements. Be specific and reference clause numbers where relevant.\n\nCurrent KPIs:\n${kpiContext || "None yet."}`,
        }),
      });
      const data = await resp.json();
      setIsaMessages([...newMsgs, { role: "assistant", content: data.content || "Sorry, I'm unavailable right now." }]);
    } catch {
      setIsaMessages([...newMsgs, { role: "assistant", content: "Sorry, I'm unavailable right now." }]);
    } finally { setIsaLoading(false); }
  };

  const currentPeriod = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="space-y-6 p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-accent" />
            Measurement &amp; Monitoring
            <span className="text-xs font-mono text-accent font-bold">ISO §9.1</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor, measure, analyze and evaluate QMS performance — objectives come from Process Maps</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("dashboard")}
              data-testid="toggle-dashboard-view"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "dashboard" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </button>
            <button
              onClick={() => setViewMode("cards")}
              data-testid="toggle-card-view"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "cards" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>
              <List className="w-3.5 h-3.5" /> Cards
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsaOpen(true)} data-testid="button-isa-measurement" className="text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">
            <Bot className="w-4 h-4 mr-1" /> Ask Isa
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="sm:col-span-1">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <OverallGauge onTrack={onTrack} total={objectives.length} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{onTrack}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> On Track</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{atRisk}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> At Risk</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{offTrack}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MinusCircle className="w-3 h-3" /> Off Track</div>
          </CardContent>
        </Card>
      </div>

      {/* Period + Status filters */}
      <div className="flex flex-wrap gap-4 items-start">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 items-center flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Period:</span>
            {PERIOD_WINDOWS.map(w => (
              <button key={w.val} onClick={() => setPeriodWindow(w.val)} data-testid={`filter-period-${w.val}`}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${periodWindow === w.val ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>
                {w.label}
              </button>
            ))}
          </div>
          {periodWindow === "custom" && (
            <div className="flex gap-2 items-center ml-1">
              <span className="text-xs text-muted-foreground">From:</span>
              <input type="month" value={customStart} onChange={e => setCustomStart(e.target.value)} data-testid="input-period-start"
                className="text-xs border border-border rounded px-2 py-0.5 bg-background text-foreground" />
              <span className="text-xs text-muted-foreground">To:</span>
              <input type="month" value={customEnd} onChange={e => setCustomEnd(e.target.value)} data-testid="input-period-end"
                className="text-xs border border-border rounded px-2 py-0.5 bg-background text-foreground" />
            </div>
          )}
        </div>
        <div className="flex gap-1 items-center flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Status:</span>
          {[
            { val: "all", label: "All" },
            { val: "on_track", label: "On Track" },
            { val: "at_risk", label: "At Risk" },
            { val: "off_track", label: "Off Track" },
          ].map(s => (
            <button key={s.val} onClick={() => setFilterStatus(s.val)} data-testid={`filter-kpi-${s.val}`}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterStatus === s.val ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>
              {s.label}
            </button>
          ))}
        </div>
        {/* Year-over-Year toggle */}
        <button
          onClick={() => setShowYoY(v => !v)}
          data-testid="toggle-yoy"
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${showYoY ? "bg-indigo-600 text-white border-indigo-600" : "border-border text-muted-foreground hover:border-indigo-400 hover:text-indigo-600"}`}
          title="Overlay prior-year values on trend charts for year-over-year comparison"
        >
          YoY Compare {showYoY ? "ON" : "OFF"}
        </button>
      </div>

      {/* Main content area */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Loading KPIs…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No KPIs defined</p>
            <p className="text-xs mt-1">Quality objectives (ISO 6.2) are created in <strong>Process Maps</strong>. Open a process map and add measurable objectives with targets — they will appear here automatically for tracking.</p>
          </CardContent>
        </Card>
      ) : viewMode === "dashboard" ? (
        <div className="space-y-4">
          {/* Multi-KPI comparison bar */}
          {filtered.length >= 2 && (
            <MultiKpiSummaryChart objectives={filtered} allActuals={allActuals} />
          )}
          {/* Individual big charts stacked */}
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((obj, i) => (
              <BigKpiChart
                key={obj.id}
                obj={obj}
                actuals={allActuals.filter(a => a.objectiveId === obj.id)}
                colorHex={KPI_CHART_COLORS[i % KPI_CHART_COLORS.length]}
                onLog={() => { setLogFor(obj); setLogForm({ ...EMPTY_LOG_FORM, period: currentPeriod() }); }}
                onEdit={() => openEdit(obj)}
                showYoY={showYoY}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(obj => (
            <KpiCard
              key={obj.id}
              obj={obj}
              actuals={allActuals.filter(a => a.objectiveId === obj.id)}
              onLog={() => { setLogFor(obj); setLogForm({ ...EMPTY_LOG_FORM, period: currentPeriod() }); }}
              onEdit={() => openEdit(obj)}
              range={activePeriodRange}
              showYoY={showYoY}
            />
          ))}
        </div>
      )}

      {/* Log Measurement Dialog */}
      <Dialog open={!!logFor} onOpenChange={v => { if (!v) setLogFor(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Log Measurement — {logFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Measurement Date (Month) *</Label>
              <input type="month" value={logForm.period} onChange={e => setLogForm(f => ({ ...f, period: e.target.value }))}
                data-testid="input-log-period"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Select the month this measurement covers.</p>
            </div>
            <div>
              <Label>Actual Value * ({logFor?.unit})</Label>
              <Input type="number" value={logForm.actual} onChange={e => setLogForm(f => ({ ...f, actual: e.target.value }))} placeholder={`Target: ${logFor?.target}`} data-testid="input-log-actual" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes about this period" data-testid="input-log-notes" rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setLogFor(null)}>Cancel</Button>
              <Button onClick={() => logMutation.mutate({ ...logForm, objectiveId: logFor?.id })} disabled={logMutation.isPending || !logForm.period || !logForm.actual} data-testid="button-submit-log" className="bg-accent hover:bg-accent/90 text-white">
                Log
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit KPI Dialog */}
      <Dialog open={!!editingObj} onOpenChange={v => { if (!v) setEditingObj(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update KPI Settings — {editingObj?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Value</Label>
                <Input value={editForm.target} onChange={e => setEditForm(f => ({ ...f, target: e.target.value }))} placeholder="e.g. 95" data-testid="input-edit-kpi-target" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. %, ppm" data-testid="input-edit-kpi-unit" />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={editForm.frequency} onValueChange={v => setEditForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger data-testid="select-edit-kpi-frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["daily", "weekly", "monthly", "quarterly", "annual"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-edit-kpi-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">On Track</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                    <SelectItem value="off_track">Off Track</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsible Person</Label>
                <Input value={editForm.responsible} onChange={e => setEditForm(f => ({ ...f, responsible: e.target.value }))} placeholder="e.g. Quality Manager" data-testid="input-edit-kpi-responsible" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" data-testid="input-edit-kpi-desc" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingObj(null)}>Cancel</Button>
              <Button onClick={submitEdit} disabled={updateObjMutation.isPending} data-testid="button-submit-edit-kpi" className="bg-accent hover:bg-accent/90 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Isa Panel */}
      <Dialog open={isaOpen} onOpenChange={setIsaOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <Bot className="w-5 h-5" /> Isa — Measurement Advisor (ISO §9.1)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {isaMessages.length === 0 && (
              <div className="text-xs text-muted-foreground p-3 bg-muted/40 rounded-lg">
                Ask Isa about ISO 9.1 requirements, how to set meaningful KPIs, interpret your trends, or align your measurement plan with your standard.
              </div>
            )}
            {isaMessages.map((m, i) => (
              <div key={i} className={`text-sm p-3 rounded-lg ${m.role === "user" ? "bg-primary/10 ml-8" : "bg-violet-50 dark:bg-violet-900/20 mr-8"}`}>
                <p className="text-xs font-bold mb-1 text-muted-foreground">{m.role === "user" ? "You" : "Isa"}</p>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {isaLoading && <div className="text-xs text-violet-500 animate-pulse p-3">Isa is thinking…</div>}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input value={isaInput} onChange={e => setIsaInput(e.target.value)} placeholder="Ask Isa about §9.1…" data-testid="input-isa-message"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendIsaMessage(); } }}
              className="text-sm"
            />
            <Button onClick={sendIsaMessage} disabled={isaLoading || !isaInput.trim()} data-testid="button-isa-send" className="bg-violet-600 hover:bg-violet-700 text-white shrink-0">
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}
