import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { ProductGate, PRODUCT_CONFIGS } from "@/components/ProductGate";
import { ProtectedLayout } from "@/components/Layout";
import TryCoreyChatWidget from "@/components/TryCoreyChatWidget";
import {
  Leaf, Recycle, Flame, Droplets, Wind, Factory, BarChart3,
  Plus, Trash2, CheckCircle2, AlertTriangle, Clock, FileText,
  ClipboardList, ChevronRight, X, Loader2, Send, Bot,
  Building2, Shield, RefreshCw, Menu, ChevronDown, Check, ArrowRight, Lock
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacilityProfile { userId: string; facilityName: string; address: string; city: string; state: string; sicCode: string; naicsCode: string; epaId: string; hasStacks: boolean; hasBoilers: boolean; hasStorageTanks: boolean; oilStorageGallons: number; generatorStatus: string; hasSpccPlan: boolean; spccPlanDate: string; hasSwppp: boolean; hasAirPermit: boolean; permitType: string; notes: string; }
interface UniversalWaste { id: number; wasteType: string; description: string; location: string; quantity: string; unit: string; startDate: string; disposalDate: string; status: string; notes: string; }
interface HazWasteSap { id: number; sapName: string; location: string; wasteTypes: string[]; maxCapacityGallons: number; containerCount: number; isActive: boolean; lastInspectionDate: string; notes: string; }
interface SapInspection { id: number; sapId: number; inspectedDate: string; inspectedBy: string; containersIntact: boolean; containersLabeled: boolean; areaClean: boolean; noLeaks: boolean; findings: string; pass: boolean; }
interface Manifest { id: number; manifestNumber: string; shipmentDate: string; tsdfName: string; tsdfEpaId: string; wasteDescription: string; quantity: string; unit: string; returnedDate: string; status: string; notes: string; }
interface GeneratorMonth { id: number; month: string; wasteKg: number; wasteType: string; notes: string; }
interface SpccTank { id: number; tankName: string; location: string; contentType: string; capacityGallons: number; hasSecondaryContainment: boolean; containmentCapacityGallons: number; lastInspectionDate: string; lastMonthlyInspection: string; lastAnnualInspection: string; peCertDate: string; isAboveground: boolean; isActive: boolean; notes: string; }
interface SpccInspection { id: number; tankId: number; inspectedDate: string; inspectedBy: string; inspectionType: string; tankIntegrity: boolean; containmentIntegrity: boolean; noLeaksOrSpills: boolean; valvesOperable: boolean; overfillProtectionOk: boolean; levelGaugeOk: boolean; responseEquipOk: boolean; spillKitOk: boolean; drainageValveClosed: boolean; findings: string; pass: boolean; }
interface StormwaterMonitor { id: number; monitoringType: string; monitoringDate: string; month: string; quarter: string; year: number; outfallId: string; conductedBy: string; weatherConditions: string; color: string; odor: string; floating: boolean; sheen: boolean; turbidity: string; bmpConditionsOk: boolean; drainageAreasOk: boolean; controlStructuresOk: boolean; housekeepingOk: boolean; swpppUpdated: boolean; otherObservations: string; actionRequired: boolean; correctionTaken: string; }
interface AirPermit { id: number; permitNumber: string; permitType: string; issuingAgency: string; issueDate: string; expirationDate: string; renewalLeadDays: number; description: string; conditions: string; status: string; }
interface OpacityLog { id: number; logDate: string; sourceId: string; observerName: string; opacityPercent: number; duration: string; pass: boolean; weatherConditions: string; notes: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function CountdownBadge({ startDate, disposalDate }: { startDate: string; disposalDate?: string }) {
  if (disposalDate) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Disposed</Badge>;
  const days = 365 - daysSince(startDate);
  if (days <= 0) return <Badge variant="destructive">OVERDUE {Math.abs(days)}d</Badge>;
  if (days <= 14) return <Badge className="bg-red-100 text-red-700 border-red-200">{days}d left</Badge>;
  if (days <= 30) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{days}d left</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{days}d left</Badge>;
}

function generatorStatus(months: GeneratorMonth[]): { status: string; color: string; desc: string } {
  if (!months.length) return { status: "Unknown", color: "text-gray-400", desc: "No waste data logged yet." };
  const recent = months.slice(0, 3);
  const maxKg = Math.max(...recent.map(m => m.wasteKg));
  if (maxKg >= 1000) return { status: "Large Quantity Generator (LQG)", color: "text-red-500", desc: "≥1,000 kg/month · 90-day accumulation limit · Full RCRA requirements apply." };
  if (maxKg >= 100) return { status: "Small Quantity Generator (SQG)", color: "text-orange-500", desc: "100–999 kg/month · 270-day accumulation limit." };
  if (maxKg > 0) return { status: "Very Small Quantity Generator (VSQG)", color: "text-emerald-500", desc: "<100 kg/month · Streamlined requirements." };
  return { status: "No Generation", color: "text-gray-400", desc: "No waste generated in recent months." };
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const MODULES = [
  { key: "overview", label: "Overview", icon: BarChart3, color: "text-slate-400" },
  { key: "facility", label: "Facility Profile", icon: Building2, color: "text-indigo-400" },
  { key: "universal", label: "Universal Waste", icon: Recycle, color: "text-emerald-400" },
  { key: "rcra", label: "Hazardous Waste", icon: Flame, color: "text-orange-400" },
  { key: "spcc", label: "SPCC / Oil Spills", icon: Droplets, color: "text-blue-400" },
  { key: "stormwater", label: "Stormwater", icon: Wind, color: "text-cyan-400" },
  { key: "air", label: "Air Quality", icon: Factory, color: "text-purple-400" },
  { key: "corey", label: "Ask Corey", icon: Bot, color: "text-accent" },
];

// ─── Overview Module ──────────────────────────────────────────────────────────

function OverviewModule({ setActive }: { setActive: (k: string) => void }) {
  const { data: uw = [] } = useQuery<UniversalWaste[]>({ queryKey: ["/api/env/universal-waste"], staleTime: Infinity });
  const { data: manifests = [] } = useQuery<Manifest[]>({ queryKey: ["/api/env/manifests"], staleTime: Infinity });
  const { data: tanks = [] } = useQuery<SpccTank[]>({ queryKey: ["/api/env/spcc-tanks"], staleTime: Infinity });
  const { data: monitoring = [] } = useQuery<StormwaterMonitor[]>({ queryKey: ["/api/env/stormwater-monitoring"], staleTime: Infinity });
  const { data: permits = [] } = useQuery<AirPermit[]>({ queryKey: ["/api/env/air-permits"], staleTime: Infinity });
  const { data: profile } = useQuery<FacilityProfile | null>({ queryKey: ["/api/env/facility-profile"], staleTime: Infinity });
  const overdueUW = (uw as UniversalWaste[]).filter(w => !w.disposalDate && daysSince(w.startDate) >= 365).length;
  const overdueManifests = (manifests as Manifest[]).filter(m => m.status === "pending" && daysSince(m.shipmentDate) >= 45).length;
  const expiringPermits = (permits as AirPermit[]).filter(p => p.expirationDate && daysUntil(p.expirationDate) <= 180 && daysUntil(p.expirationDate) >= 0).length;
  const thisYearMonitoring = (monitoring as StormwaterMonitor[]).filter(m => m.year === new Date().getFullYear()).length;

  const cards = [
    { label: "Universal Waste", icon: Recycle, color: "emerald", value: (uw as UniversalWaste[]).filter(w => !w.disposalDate).length + " active", alert: overdueUW > 0 ? `${overdueUW} overdue` : null, key: "universal" },
    { label: "Hazardous Waste", icon: Flame, color: "orange", value: (manifests as Manifest[]).length + " manifests", alert: overdueManifests > 0 ? `${overdueManifests} past 45-day window` : null, key: "rcra" },
    { label: "SPCC", icon: Droplets, color: "blue", value: (tanks as SpccTank[]).length + " tanks logged", alert: null, key: "spcc" },
    { label: "Stormwater", icon: Wind, color: "cyan", value: thisYearMonitoring + "/4 events this year", alert: thisYearMonitoring < Math.ceil((new Date().getMonth() + 1) / 3) ? "Behind on quarterly monitoring" : null, key: "stormwater" },
    { label: "Air Quality", icon: Factory, color: "purple", value: (permits as AirPermit[]).length + " permits", alert: expiringPermits > 0 ? `${expiringPermits} expiring within 180 days` : null, key: "air" },
  ];

  const colorMap: Record<string, string> = { emerald: "text-emerald-500 bg-emerald-50 border-emerald-200", orange: "text-orange-500 bg-orange-50 border-orange-200", blue: "text-blue-500 bg-blue-50 border-blue-200", cyan: "text-cyan-500 bg-cyan-50 border-cyan-200", purple: "text-purple-500 bg-purple-50 border-purple-200" };
  const iconBg: Record<string, string> = { emerald: "bg-emerald-100", orange: "bg-orange-100", blue: "bg-blue-100", cyan: "bg-cyan-100", purple: "bg-purple-100" };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Environmental Compliance Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {profile?.facilityName ? `${profile.facilityName} · ${profile.city}, ${profile.state}` : "Set up your Facility Profile to get started"}
        </p>
      </div>

      {!profile && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Facility Profile not set up</p>
            <p className="text-xs text-amber-600 mt-1">Complete your Facility Profile to unlock all module features and state-specific guidance.</p>
            <Button size="sm" variant="outline" className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setActive("facility")}>
              Set Up Profile
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button key={c.key} onClick={() => setActive(c.key)} className={`text-left border rounded-xl p-4 hover:shadow-md transition-all ${c.alert ? "border-red-200 bg-red-50" : "border-border bg-card hover:border-primary/30"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${iconBg[c.color]} flex items-center justify-center`}>
                <c.icon className={`w-4 h-4 text-${c.color}-500`} />
              </div>
              {c.alert ? <Badge variant="destructive" className="text-xs">{c.alert}</Badge> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="font-semibold text-sm mt-0.5">{c.value}</p>
          </button>
        ))}
      </div>

      <div className="border border-border rounded-xl p-4 bg-accent/5">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-accent">Corey — Environmental Compliance AI</span>
        </div>
        <p className="text-xs text-muted-foreground">Ask Corey about waste labeling, spill reporting thresholds, permit conditions, or any EPA / CFR 40 requirement specific to your state.</p>
        <Button size="sm" className="mt-3 bg-accent hover:bg-accent/90 text-white" onClick={() => setActive("corey")}>
          Ask Corey <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* ── EMS Environmental Suite Bundle Cross-Promo ── */}
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-r from-emerald-50 to-slate-50 dark:from-emerald-950/20 dark:to-slate-900/20 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-bold text-foreground">Complete Your EMS with ISO Manager</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">EMS Environmental Suite</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              The Environmental Hub tracks your operational compliance records — but ISO 14001 requires you to also <strong>identify and register every legal obligation</strong> that applies to your facility (§6.1.3). ISO Manager's Compliance Obligations Register does exactly that, with a built-in starter library and Corey's jurisdiction analysis to make sure nothing is missed.
            </p>
            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              {[
                { label: "Env Hub does", desc: "Universal Waste, RCRA, SPCC, Stormwater, Air — operational records & monitoring" },
                { label: "ISO Manager adds", desc: "§6.1.3 Compliance Register, Aspects/Impacts, Audits, CAPA, Management Review" },
                { label: "Together they prove", desc: "Complete ISO 14001 conformance — obligation identified, records documented" },
              ].map(item => (
                <div key={item.label} className="rounded-lg bg-white/60 dark:bg-white/5 border border-border/40 p-2.5">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <a href="/env-compliance-hub#bundle" target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-7" data-testid="button-env-hub-bundle-promo">
                  <ArrowRight className="w-3 h-3" /> Learn About the Bundle
                </Button>
              </a>
              <a href="mailto:team@corecompliancehub.com?subject=EMS Environmental Suite Bundle Inquiry">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" data-testid="button-env-hub-bundle-contact">
                  Contact for Bundle Pricing
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Facility Profile Module ──────────────────────────────────────────────────

function FacilityModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: profile } = useQuery<FacilityProfile | null>({ queryKey: ["/api/env/facility-profile"], staleTime: Infinity });
  const [form, setForm] = useState<Partial<FacilityProfile>>({});
  const [editing, setEditing] = useState(false);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const save = useMutation({
    mutationFn: (data: Partial<FacilityProfile>) => apiRequest("POST", "/api/env/facility-profile", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/facility-profile"] }); setEditing(false); toast({ title: "Facility Profile saved" }); },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const sf = (k: keyof FacilityProfile, v: any) => setForm(f => ({ ...f, [k]: v }));

  const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Facility Environmental Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">This information feeds all compliance modules and helps Corey give state-specific guidance.</p>
        </div>
        {!editing && <Button size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>}
      </div>

      {!editing && !profile && (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No facility profile yet</p>
          <p className="text-sm text-muted-foreground mt-1">Complete your profile to enable state-specific compliance guidance.</p>
          <Button className="mt-4" onClick={() => setEditing(true)}>Set Up Facility Profile</Button>
        </div>
      )}

      {!editing && profile && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: "Facility Name", value: profile.facilityName },
            { label: "Address", value: [profile.address, profile.city, profile.state].filter(Boolean).join(", ") },
            { label: "SIC Code", value: profile.sicCode },
            { label: "NAICS Code", value: profile.naicsCode },
            { label: "EPA ID", value: profile.epaId },
            { label: "Generator Status", value: profile.generatorStatus },
            { label: "Oil Storage (gallons)", value: profile.oilStorageGallons?.toString() },
            { label: "Air Permit Type", value: profile.permitType },
          ].map(row => (
            <div key={row.label} className="border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="font-medium text-sm mt-0.5">{row.value || "—"}</p>
            </div>
          ))}
          <div className="border border-border rounded-lg p-3 col-span-full">
            <p className="text-xs text-muted-foreground mb-2">Facility Characteristics</p>
            <div className="flex flex-wrap gap-2">
              {profile.hasStacks && <Badge className="bg-purple-100 text-purple-700">Has Stacks</Badge>}
              {profile.hasBoilers && <Badge className="bg-purple-100 text-purple-700">Has Boilers</Badge>}
              {profile.hasStorageTanks && <Badge className="bg-blue-100 text-blue-700">Storage Tanks</Badge>}
              {profile.hasSpccPlan && <Badge className="bg-blue-100 text-blue-700">SPCC Plan</Badge>}
              {profile.hasSwppp && <Badge className="bg-cyan-100 text-cyan-700">SWPPP</Badge>}
              {profile.hasAirPermit && <Badge className="bg-purple-100 text-purple-700">Air Permit</Badge>}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="space-y-4 border border-border rounded-xl p-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1 col-span-full"><Label>Facility Name</Label><Input value={form.facilityName ?? ""} onChange={e => sf("facilityName", e.target.value)} /></div>
            <div className="space-y-1"><Label>Street Address</Label><Input value={form.address ?? ""} onChange={e => sf("address", e.target.value)} /></div>
            <div className="space-y-1"><Label>City</Label><Input value={form.city ?? ""} onChange={e => sf("city", e.target.value)} /></div>
            <div className="space-y-1"><Label>State</Label>
              <Select value={form.state ?? ""} onValueChange={v => sf("state", v)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>SIC Code</Label><Input value={form.sicCode ?? ""} onChange={e => sf("sicCode", e.target.value)} placeholder="e.g. 3462" /></div>
            <div className="space-y-1"><Label>NAICS Code</Label><Input value={form.naicsCode ?? ""} onChange={e => sf("naicsCode", e.target.value)} placeholder="e.g. 332116" /></div>
            <div className="space-y-1"><Label>EPA Facility ID</Label><Input value={form.epaId ?? ""} onChange={e => sf("epaId", e.target.value)} placeholder="e.g. MID123456789" /></div>
            <div className="space-y-1"><Label>Total Oil Storage (gallons)</Label><Input type="number" value={form.oilStorageGallons ?? ""} onChange={e => sf("oilStorageGallons", Number(e.target.value))} /></div>
            <div className="space-y-1"><Label>Generator Status</Label>
              <Select value={form.generatorStatus ?? ""} onValueChange={v => sf("generatorStatus", v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vsqg">VSQG (Very Small Quantity Generator)</SelectItem>
                  <SelectItem value="sqg">SQG (Small Quantity Generator)</SelectItem>
                  <SelectItem value="lqg">LQG (Large Quantity Generator)</SelectItem>
                  <SelectItem value="unknown">Unknown / Not Assessed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Air Permit Type</Label>
              <Select value={form.permitType ?? ""} onValueChange={v => sf("permitType", v)}>
                <SelectTrigger><SelectValue placeholder="Select permit type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="title_v">Title V Major Source</SelectItem>
                  <SelectItem value="synthetic_minor">Synthetic Minor</SelectItem>
                  <SelectItem value="minor_source">Minor Source</SelectItem>
                  <SelectItem value="state_only">State-Only Permit</SelectItem>
                  <SelectItem value="none">No Air Permit Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {([["hasStacks","Has Stacks / Exhausts"],["hasBoilers","Has Boilers"],["hasStorageTanks","Has Storage Tanks"],["hasSpccPlan","SPCC Plan in Place"],["hasSwppp","SWPPP in Place"],["hasAirPermit","Has Air Permit"]] as [keyof FacilityProfile, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer border border-border rounded-lg px-3 py-2 hover:bg-muted/50">
                <input type="checkbox" checked={!!form[key]} onChange={e => sf(key, e.target.checked)} className="accent-primary" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes ?? ""} onChange={e => sf("notes", e.target.value)} rows={3} /></div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setEditing(false); if (profile) setForm(profile); }}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Profile</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Universal Waste Module ───────────────────────────────────────────────────

const UW_TYPES = [
  { value: "batteries", label: "Batteries", color: "bg-emerald-100 text-emerald-700" },
  { value: "lamps", label: "Lamps / Bulbs", color: "bg-yellow-100 text-yellow-700" },
  { value: "pesticides", label: "Pesticides", color: "bg-red-100 text-red-700" },
  { value: "mercury", label: "Mercury-Containing Equipment", color: "bg-purple-100 text-purple-700" },
  { value: "aerosols", label: "Aerosol Cans", color: "bg-blue-100 text-blue-700" },
  { value: "other", label: "Other Universal Waste", color: "bg-gray-100 text-gray-700" },
];

function UniversalWasteModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showDispose, setShowDispose] = useState<UniversalWaste | null>(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ wasteType: "", description: "", location: "", quantity: "", unit: "count", startDate: new Date().toISOString().split("T")[0], notes: "" });

  const { data: items = [], isLoading } = useQuery<UniversalWaste[]>({ queryKey: ["/api/env/universal-waste"], staleTime: Infinity });

  const add = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/env/universal-waste", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/universal-waste"] }); setShowAdd(false); setForm({ wasteType: "", description: "", location: "", quantity: "", unit: "count", startDate: new Date().toISOString().split("T")[0], notes: "" }); toast({ title: "Container added" }); },
  });

  const dispose = useMutation({
    mutationFn: ({ id }: { id: number }) => apiRequest("PATCH", `/api/env/universal-waste/${id}`, { status: "disposed", disposalDate: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/universal-waste"] }); setShowDispose(null); toast({ title: "Container marked as disposed" }); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/env/universal-waste/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/universal-waste"] }); toast({ title: "Record deleted" }); },
  });

  const filtered = filter === "all" ? items : items.filter(w => filter === "disposed" ? w.disposalDate : !w.disposalDate);
  const uwTypeLabel = (t: string) => UW_TYPES.find(u => u.value === t)?.label ?? t;
  const uwTypeColor = (t: string) => UW_TYPES.find(u => u.value === t)?.color ?? "bg-gray-100 text-gray-700";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Universal Waste</h2>
          <p className="text-sm text-muted-foreground">40 CFR Part 273 · 1-year storage limit per container</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" />Add Container</Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
        Universal waste may be stored for up to <strong>1 year</strong> from the date the first item is placed in a container. Aerosol cans were added to the federal Universal Waste list in November 2019.
      </div>

      <div className="flex gap-2">
        {["all", "active", "disposed"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="capitalize text-xs" onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> :
        filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center">
            <Recycle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No universal waste containers logged yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className={`border rounded-xl p-4 flex items-start justify-between gap-4 ${!item.disposalDate && daysSince(item.startDate) >= 365 ? "border-red-300 bg-red-50" : !item.disposalDate && daysSince(item.startDate) >= 335 ? "border-yellow-300 bg-yellow-50" : "border-border bg-card"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className={uwTypeColor(item.wasteType)}>{uwTypeLabel(item.wasteType)}</Badge>
                    <CountdownBadge startDate={item.startDate} disposalDate={item.disposalDate} />
                  </div>
                  <p className="font-medium text-sm">{item.description || "No description"}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    {item.location && <span>📍 {item.location}</span>}
                    {item.quantity && <span>Qty: {item.quantity} {item.unit}</span>}
                    <span>Started: {fmtDate(item.startDate)}</span>
                    {item.disposalDate && <span>Disposed: {fmtDate(item.disposalDate)}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!item.disposalDate && (
                    <Button size="sm" variant="outline" className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => setShowDispose(item)}>
                      Mark Disposed
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => remove.mutate(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Universal Waste Container</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Waste Type *</Label>
              <Select value={form.wasteType} onValueChange={v => setForm(f => ({ ...f, wasteType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select waste type" /></SelectTrigger>
                <SelectContent>{UW_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Mixed AA batteries from production floor" /></div>
            <div className="space-y-1"><Label>Storage Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Building 2 - Accumulation Area" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Quantity</Label><Input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 25" /></div>
              <div className="space-y-1"><Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="count">Count</SelectItem><SelectItem value="lbs">Pounds</SelectItem><SelectItem value="gallons">Gallons</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Date First Item Placed (starts 1-year clock) *</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => add.mutate(form)} disabled={add.isPending || !form.wasteType}>
              {add.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Container
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispose Dialog */}
      <Dialog open={!!showDispose} onOpenChange={() => setShowDispose(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mark as Disposed</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will mark <strong>{showDispose?.description || uwTypeLabel(showDispose?.wasteType ?? "")}</strong> as disposed and stop the 1-year countdown.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispose(null)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={() => showDispose && dispose.mutate({ id: showDispose.id })} disabled={dispose.isPending}>
              {dispose.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Confirm Disposed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Hazardous Waste Module ───────────────────────────────────────────────────

function HazWasteModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("generator");
  const [showAddSap, setShowAddSap] = useState(false);
  const [showAddManifest, setShowAddManifest] = useState(false);
  const [showAddMonth, setShowAddMonth] = useState(false);
  const [showInspect, setShowInspect] = useState<HazWasteSap | null>(null);
  const [sapForm, setSapForm] = useState({ sapName: "", location: "", containerCount: "", notes: "" });
  const [manifestForm, setManifestForm] = useState({ manifestNumber: "", shipmentDate: new Date().toISOString().split("T")[0], tsdfName: "", wasteDescription: "", quantity: "", unit: "gallons", notes: "" });
  const [monthForm, setMonthForm] = useState({ month: new Date().toISOString().slice(0, 7), wasteKg: "", wasteType: "", notes: "" });
  const [inspectForm, setInspectForm] = useState({ inspectedBy: "", inspectedDate: new Date().toISOString().split("T")[0], containersIntact: true, containersLabeled: true, areaClean: true, noLeaks: true, findings: "" });

  const { data: saps = [] } = useQuery<HazWasteSap[]>({ queryKey: ["/api/env/saps"], staleTime: Infinity });
  const { data: manifests = [] } = useQuery<Manifest[]>({ queryKey: ["/api/env/manifests"], staleTime: Infinity });
  const { data: genMonths = [] } = useQuery<GeneratorMonth[]>({ queryKey: ["/api/env/generator-months"], staleTime: Infinity });
  const { data: inspections = [] } = useQuery<SapInspection[]>({ queryKey: ["/api/env/sap-inspections"], staleTime: Infinity });

  const addSap = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/saps", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/saps"] }); setShowAddSap(false); toast({ title: "SAP added" }); } });
  const addManifest = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/manifests", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/manifests"] }); setShowAddManifest(false); toast({ title: "Manifest logged" }); } });
  const returnManifest = useMutation({ mutationFn: ({ id }: { id: number }) => apiRequest("PATCH", `/api/env/manifests/${id}`, { status: "returned", returnedDate: new Date().toISOString() }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/manifests"] }); toast({ title: "Manifest marked returned" }); } });
  const delManifest = useMutation({ mutationFn: (id: number) => apiRequest("DELETE", `/api/env/manifests/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/env/manifests"] }) });
  const addMonth = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/generator-months", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/generator-months"] }); setShowAddMonth(false); toast({ title: "Month logged" }); } });
  const addInspection = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/sap-inspections", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/sap-inspections"] }); qc.invalidateQueries({ queryKey: ["/api/env/saps"] }); setShowInspect(null); toast({ title: "Inspection recorded" }); } });

  const genStatus = generatorStatus(genMonths as GeneratorMonth[]);
  const overdueManifests = (manifests as Manifest[]).filter(m => m.status === "pending" && daysSince(m.shipmentDate) >= 45);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">Hazardous Waste (RCRA)</h2>
        <p className="text-sm text-muted-foreground">40 CFR Parts 260–270 · Cradle-to-Grave Tracking</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="generator">Generator Status</TabsTrigger>
          <TabsTrigger value="saps">SAP Inspections</TabsTrigger>
          <TabsTrigger value="manifests">Manifests</TabsTrigger>
        </TabsList>

        {/* Generator Status */}
        <TabsContent value="generator" className="space-y-4 pt-2">
          <div className="border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Generator Status (based on last 3 months)</p>
                <p className={`text-xl font-bold ${genStatus.color}`}>{genStatus.status}</p>
                <p className="text-sm text-muted-foreground mt-1">{genStatus.desc}</p>
              </div>
              <Button size="sm" onClick={() => setShowAddMonth(true)}><Plus className="w-4 h-4 mr-1" />Log Month</Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-border pt-4 mt-2">
              <div className="text-emerald-600 font-medium">VSQG<br/><span className="text-muted-foreground font-normal">&lt;100 kg/mo</span></div>
              <div className="text-orange-500 font-medium">SQG<br/><span className="text-muted-foreground font-normal">100–999 kg/mo</span></div>
              <div className="text-red-500 font-medium">LQG<br/><span className="text-muted-foreground font-normal">≥1,000 kg/mo</span></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Monthly Waste Generation Log</p>
            {(genMonths as GeneratorMonth[]).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No months logged yet. Add your monthly waste generation to calculate generator status.</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs"><tr><th className="text-left p-3">Month</th><th className="text-right p-3">Kg Generated</th><th className="text-left p-3">Waste Type</th></tr></thead>
                  <tbody>{(genMonths as GeneratorMonth[]).map(m => <tr key={m.id} className="border-t border-border"><td className="p-3">{m.month}</td><td className="p-3 text-right font-mono">{m.wasteKg} kg</td><td className="p-3 text-muted-foreground">{m.wasteType || "—"}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* SAPs */}
        <TabsContent value="saps" className="space-y-4 pt-2">
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddSap(true)}><Plus className="w-4 h-4 mr-1" />Add SAP</Button></div>
          {(saps as HazWasteSap[]).length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">No Satellite Accumulation Points added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(saps as HazWasteSap[]).map(sap => {
                const lastInspDays = sap.lastInspectionDate ? daysSince(sap.lastInspectionDate) : 999;
                const inspList = (inspections as SapInspection[]).filter(i => i.sapId === sap.id);
                return (
                  <div key={sap.id} className={`border rounded-xl p-4 ${lastInspDays > 7 ? "border-yellow-300 bg-yellow-50" : "border-border bg-card"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{sap.sapName}</p>
                        <p className="text-xs text-muted-foreground">{sap.location}</p>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Last Inspected: <strong>{sap.lastInspectionDate ? fmtDate(sap.lastInspectionDate) : "Never"}</strong></span>
                          {sap.containerCount && <span>{sap.containerCount} containers</span>}
                        </div>
                        {lastInspDays > 7 && <Badge className="mt-2 bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Weekly inspection due ({lastInspDays} days since last)</Badge>}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowInspect(sap)}>Log Inspection</Button>
                    </div>
                    {inspList.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Recent Inspections</p>
                        <div className="space-y-1">
                          {inspList.slice(0, 3).map(ins => (
                            <div key={ins.id} className="flex items-center gap-2 text-xs">
                              {ins.pass ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-red-500" />}
                              <span>{fmtDate(ins.inspectedDate)}</span>
                              <span className="text-muted-foreground">by {ins.inspectedBy}</span>
                              {ins.findings && <span className="text-red-500">{ins.findings}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Manifests */}
        <TabsContent value="manifests" className="space-y-4 pt-2">
          {overdueManifests.length > 0 && (
            <div className="border border-red-300 bg-red-50 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-red-800">{overdueManifests.length} manifest(s) past the 45-day return window</p>
                <p className="text-red-600 mt-0.5">Exception Reports must be filed with your EPA Region. Contact your TSDF immediately.</p>
              </div>
            </div>
          )}
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddManifest(true)}><Plus className="w-4 h-4 mr-1" />Log Manifest</Button></div>
          {(manifests as Manifest[]).length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No manifests logged yet.</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs"><tr><th className="text-left p-3">Manifest #</th><th className="text-left p-3">Shipment Date</th><th className="text-left p-3">TSDF</th><th className="text-left p-3">Days Out</th><th className="text-left p-3">Status</th><th className="p-3"></th></tr></thead>
                <tbody>
                  {(manifests as Manifest[]).map(m => {
                    const daysOut = daysSince(m.shipmentDate);
                    const isOverdue = m.status === "pending" && daysOut >= 45;
                    return (
                      <tr key={m.id} className={`border-t border-border ${isOverdue ? "bg-red-50" : ""}`}>
                        <td className="p-3 font-mono text-xs">{m.manifestNumber}</td>
                        <td className="p-3">{fmtDate(m.shipmentDate)}</td>
                        <td className="p-3 text-muted-foreground">{m.tsdfName || "—"}</td>
                        <td className="p-3">
                          {m.status === "returned" ? <span className="text-emerald-600 text-xs">Returned</span> : <span className={isOverdue ? "text-red-600 font-bold" : daysOut >= 30 ? "text-yellow-600" : ""}>{daysOut}d</span>}
                        </td>
                        <td className="p-3">
                          {m.status === "returned" ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Returned</Badge> : isOverdue ? <Badge variant="destructive" className="text-xs">OVERDUE</Badge> : <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {m.status === "pending" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => returnManifest.mutate({ id: m.id })}>Mark Returned</Button>}
                            <Button size="sm" variant="ghost" className="text-red-500 h-7 w-7 p-0" onClick={() => delManifest.mutate(m.id)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add SAP Dialog */}
      <Dialog open={showAddSap} onOpenChange={setShowAddSap}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Satellite Accumulation Point</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>SAP Name *</Label><Input value={sapForm.sapName} onChange={e => setSapForm(f => ({ ...f, sapName: e.target.value }))} placeholder="e.g. Machine Shop SAP – Bldg 3" /></div>
            <div className="space-y-1"><Label>Location</Label><Input value={sapForm.location} onChange={e => setSapForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Number of Containers</Label><Input type="number" value={sapForm.containerCount} onChange={e => setSapForm(f => ({ ...f, containerCount: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={sapForm.notes} onChange={e => setSapForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSap(false)}>Cancel</Button>
            <Button onClick={() => addSap.mutate({ ...sapForm, containerCount: Number(sapForm.containerCount) || null })} disabled={addSap.isPending || !sapForm.sapName}>
              {addSap.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add SAP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manifest Dialog */}
      <Dialog open={showAddManifest} onOpenChange={setShowAddManifest}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Hazardous Waste Manifest</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Manifest Number *</Label><Input value={manifestForm.manifestNumber} onChange={e => setManifestForm(f => ({ ...f, manifestNumber: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Shipment Date *</Label><Input type="date" value={manifestForm.shipmentDate} onChange={e => setManifestForm(f => ({ ...f, shipmentDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label>TSDF Name</Label><Input value={manifestForm.tsdfName} onChange={e => setManifestForm(f => ({ ...f, tsdfName: e.target.value }))} placeholder="Treatment, Storage & Disposal Facility" /></div>
            <div className="space-y-1"><Label>Waste Description</Label><Input value={manifestForm.wasteDescription} onChange={e => setManifestForm(f => ({ ...f, wasteDescription: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Quantity</Label><Input value={manifestForm.quantity} onChange={e => setManifestForm(f => ({ ...f, quantity: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Unit</Label>
                <Select value={manifestForm.unit} onValueChange={v => setManifestForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="gallons">Gallons</SelectItem><SelectItem value="lbs">Lbs</SelectItem><SelectItem value="kg">Kg</SelectItem><SelectItem value="drums">Drums</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddManifest(false)}>Cancel</Button>
            <Button onClick={() => addManifest.mutate(manifestForm)} disabled={addManifest.isPending || !manifestForm.manifestNumber}>
              {addManifest.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Log Manifest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Month Dialog */}
      <Dialog open={showAddMonth} onOpenChange={setShowAddMonth}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Monthly Waste Generation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Month *</Label><Input type="month" value={monthForm.month} onChange={e => setMonthForm(f => ({ ...f, month: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Total Waste Generated (kg) *</Label><Input type="number" value={monthForm.wasteKg} onChange={e => setMonthForm(f => ({ ...f, wasteKg: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Primary Waste Type</Label><Input value={monthForm.wasteType} onChange={e => setMonthForm(f => ({ ...f, wasteType: e.target.value }))} placeholder="e.g. Used solvents, paint waste" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMonth(false)}>Cancel</Button>
            <Button onClick={() => addMonth.mutate({ ...monthForm, wasteKg: Number(monthForm.wasteKg) || 0 })} disabled={addMonth.isPending}>
              {addMonth.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Log Month
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SAP Inspection Dialog */}
      <Dialog open={!!showInspect} onOpenChange={() => setShowInspect(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>SAP Inspection — {showInspect?.sapName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={inspectForm.inspectedDate} onChange={e => setInspectForm(f => ({ ...f, inspectedDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Inspected By</Label><Input value={inspectForm.inspectedBy} onChange={e => setInspectForm(f => ({ ...f, inspectedBy: e.target.value }))} /></div>
            </div>
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Inspection Checklist</p>
              {([["containersIntact","Containers in good condition (no damage/leaks)"],["containersLabeled","All containers properly labeled"],["areaClean","Area clean and free of debris"],["noLeaks","No visible leaks or spills"]] as [keyof typeof inspectForm, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!inspectForm[key]} onChange={e => setInspectForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-primary" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1"><Label>Findings / Deficiencies</Label><Textarea value={inspectForm.findings} onChange={e => setInspectForm(f => ({ ...f, findings: e.target.value }))} rows={2} placeholder="Note any issues found..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInspect(null)}>Cancel</Button>
            <Button onClick={() => addInspection.mutate({ ...inspectForm, sapId: showInspect!.id })} disabled={addInspection.isPending}>
              {addInspection.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Record Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SPCC Module ──────────────────────────────────────────────────────────────

// ─── Field Inspection Overlay ─────────────────────────────────────────────────
// Full-screen, tablet-optimised electronic checklist for field inspectors.
// Large tap targets, dark high-contrast UI, no printing required.

interface FieldItem { key: string; label: string; hint?: string; citation?: string; }

function FieldInspectionOverlay({
  title, subtitle, items, initChecks,
  extraHeader, onSubmit, onClose, isPending,
}: {
  title: string; subtitle: string; items: FieldItem[];
  initChecks?: Record<string, boolean>;
  extraHeader?: React.ReactNode;
  onSubmit: (data: { checks: Record<string, boolean>; inspectorName: string; date: string; notes: string }) => void;
  onClose: () => void; isPending: boolean;
}) {
  const defaultChecks = Object.fromEntries(items.map(i => [i.key, true]));
  const [checks, setChecks] = useState<Record<string, boolean>>(initChecks ?? defaultChecks);
  const [inspectorName, setInspectorName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const failCount = items.filter(i => checks[i.key] === false).length;
  const toggle = (key: string) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="shrink-0 bg-slate-800 border-b border-slate-700 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-white font-bold text-xl leading-tight">{title}</p>
          <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-2.5 rounded-xl hover:bg-slate-700 transition-colors shrink-0 mt-0.5">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Inspector + Date */}
      <div className="shrink-0 bg-slate-800 border-b border-slate-700 px-5 py-3 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Inspector Name</label>
          <input type="text" value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Your name / title"
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500" />
        </div>
        <div className="w-44 space-y-1">
          <label className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        {extraHeader}
      </div>

      {/* Live status strip */}
      <div className={`shrink-0 px-5 py-2.5 flex items-center justify-between text-sm font-bold ${failCount === 0 ? "bg-emerald-800 text-emerald-100" : "bg-red-900 text-red-100"}`}>
        <span>{failCount === 0 ? `✓ All ${items.length} items: PASS` : `⚠ ${failCount} item${failCount !== 1 ? "s" : ""} flagged`}</span>
        <span className="text-xs font-normal opacity-70">Tap any card to toggle PASS / FAIL</span>
      </div>

      {/* Checklist cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items.map((item, idx) => {
          const ok = checks[item.key] !== false;
          return (
            <button key={item.key} onClick={() => toggle(item.key)}
              className={`w-full text-left rounded-2xl border-2 px-5 py-4 flex items-center gap-5 transition-all active:scale-[0.98] touch-manipulation ${ok ? "bg-emerald-900/80 border-emerald-500" : "bg-red-900/80 border-red-500"}`}>
              <span className={`shrink-0 text-2xl font-black w-8 text-center ${ok ? "text-emerald-400" : "text-red-400"}`}>{String(idx + 1).padStart(2, "0")}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base leading-snug">{item.label}</p>
                {item.hint && <p className={`text-sm mt-1 leading-snug ${ok ? "text-emerald-300" : "text-red-300"}`}>{item.hint}</p>}
                {item.citation && <p className="text-slate-500 text-xs mt-1">{item.citation}</p>}
              </div>
              <div className={`shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-sm ${ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                {ok ? <><CheckCircle2 className="w-8 h-8" /><span className="text-base">PASS</span></> : <><X className="w-8 h-8" /><span className="text-base">FAIL</span></>}
              </div>
            </button>
          );
        })}

        {/* Notes area */}
        <div className="space-y-2 pt-2 pb-2">
          <label className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Findings / Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Describe any deficiencies, corrective actions taken or planned, or additional observations..."
            className="w-full bg-slate-700 text-white rounded-2xl px-5 py-4 text-base border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none placeholder:text-slate-500" />
        </div>
      </div>

      {/* Submit footer */}
      <div className="shrink-0 bg-slate-800 border-t border-slate-700 px-4 py-4 flex gap-3">
        <button onClick={onClose}
          className="flex-1 bg-slate-700 text-slate-200 font-bold text-lg rounded-2xl py-5 active:scale-95 transition-all hover:bg-slate-600 touch-manipulation">
          Cancel
        </button>
        <button onClick={() => onSubmit({ checks, inspectorName, date, notes })}
          disabled={isPending || !inspectorName.trim()}
          className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xl rounded-2xl py-5 flex items-center justify-center gap-3 active:scale-95 transition-all touch-manipulation">
          {isPending ? <><Loader2 className="w-7 h-7 animate-spin" />Submitting…</> : <><CheckCircle2 className="w-7 h-7" />Submit Inspection</>}
        </button>
      </div>
    </div>
  );
}

const SPCC_MONTHLY_CHECKLIST = [
  ["tankIntegrity",        "Tank structure integrity — no visible dents, corrosion, or damage"],
  ["containmentIntegrity", "Secondary containment intact — no cracks, breaches, or liquid accumulation"],
  ["noLeaksOrSpills",      "No leaks, drips, staining, or residue at fittings, seams, or tank base"],
  ["valvesOperable",       "All valves, flanges, and fittings properly closed and operable"],
  ["overfillProtectionOk", "Overfill protection device functional (float, high-level alarm, or sensor)"],
  ["levelGaugeOk",         "Liquid level gauge readable and consistent with expected fill level"],
  ["drainageValveClosed",  "Containment dike/sump drainage valve closed and secured (locked if required)"],
  ["spillKitOk",           "Spill kit stocked, accessible, and located at or near tank area"],
  ["responseEquipOk",      "Emergency response equipment (absorbents, plugs, PPE) accessible"],
] as const;

const SPCC_ANNUAL_ADDITIONS = [
  "Formal internal integrity inspection completed or scheduled per API 653 / STI SP001",
  "Cathodic protection system inspected and readings documented (if applicable)",
  "Pressure/vacuum vent valves tested and functional",
  "SPCC Plan reviewed — all tank info, contacts, and procedures current",
  "Personnel SPCC training briefings documented (112.7(f)(3))",
  "Emergency contact list reviewed and updated",
  "Overfill prevention procedures and high-level alarm set points confirmed",
] as const;

const SPCC_FIELD_ITEMS: FieldItem[] = [
  { key: "tankIntegrity",        label: "Tank / Container Integrity", hint: "No visible dents, corrosion, deformation, or external damage", citation: "112.8(c)(6)" },
  { key: "containmentIntegrity", label: "Secondary Containment Intact", hint: "No cracks, breaches, or liquid accumulated in containment dike/berm", citation: "112.7(c)" },
  { key: "noLeaksOrSpills",      label: "No Active Leaks or Spills", hint: "Check valves, fittings, pipe seams, tank base — no staining or drips", citation: "112.8(c)(10)" },
  { key: "valvesOperable",       label: "Valves & Fittings Functional", hint: "Shutoff valves operable, flanges tight, emergency isolations labeled", citation: "112.8(c)(8)" },
  { key: "overfillProtectionOk", label: "Overfill Protection Device OK", hint: "Float switch, high-level alarm, or automatic shutoff tested/functional", citation: "112.8(c)(11)" },
  { key: "levelGaugeOk",         label: "Liquid Level Gauge Readable", hint: "Sight glass or float gauge consistent with known fill level", citation: "112.8(c)(9)" },
  { key: "drainageValveClosed",  label: "Drainage Valve Closed & Secured", hint: "Containment sump / dike drain valve closed; locked per plan if required", citation: "112.8(c)(3)" },
  { key: "spillKitOk",           label: "Spill Response Kit Present & Stocked", hint: "Absorbent pads, absorbent booms, shovels at or near tank — full supply", citation: "112.7(a)(3)" },
  { key: "responseEquipOk",      label: "Emergency Response Equipment Accessible", hint: "Absorbents, containment plugs, PPE — not blocked or expired", citation: "112.7(a)(3)" },
];

function SpccModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("tanks");
  const [showAddTank, setShowAddTank] = useState(false);
  const [showInspect, setShowInspect] = useState<SpccTank | null>(null);
  const [showFieldMode, setShowFieldMode] = useState<SpccTank | null>(null);

  const defaultInsp = () => ({
    inspectedDate: new Date().toISOString().split("T")[0],
    inspectedBy: "",
    inspectionType: "monthly",
    tankIntegrity: true, containmentIntegrity: true, noLeaksOrSpills: true, valvesOperable: true,
    overfillProtectionOk: true, levelGaugeOk: true, drainageValveClosed: true, spillKitOk: true, responseEquipOk: true,
    findings: "",
    // annual extras (tracked as text in findings if checked)
    annualIntegrity: false, annualCathodic: false, annualVents: false, annualPlan: false, annualTraining: false, annualContacts: false, annualOverfill: false,
  });

  const [tankForm, setTankForm] = useState({ tankName: "", location: "", contentType: "", capacityGallons: "", hasSecondaryContainment: false, containmentCapacityGallons: "", isAboveground: true, notes: "" });
  const [inspForm, setInspForm] = useState(defaultInsp());

  const { data: tanks = [] } = useQuery<SpccTank[]>({ queryKey: ["/api/env/spcc-tanks"], staleTime: Infinity });
  const { data: inspections = [] } = useQuery<SpccInspection[]>({ queryKey: ["/api/env/spcc-inspections"], staleTime: Infinity });

  const addTank = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/spcc-tanks", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/spcc-tanks"] }); setShowAddTank(false); toast({ title: "Tank added" }); } });
  const delTank = useMutation({ mutationFn: (id: number) => apiRequest("DELETE", `/api/env/spcc-tanks/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/env/spcc-tanks"] }) });
  const addInspection = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/env/spcc-inspections", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/spcc-inspections"] }); qc.invalidateQueries({ queryKey: ["/api/env/spcc-tanks"] }); setShowInspect(null); setInspForm(defaultInsp()); toast({ title: "Inspection logged" }); }
  });

  const totalGallons = (tanks as SpccTank[]).reduce((sum, t) => sum + (t.capacityGallons ?? 0), 0);
  const isAnnual = inspForm.inspectionType === "annual" || inspForm.inspectionType === "pe_certification" || inspForm.inspectionType === "integrity_test";

  const inspTypeLabel = (t: string) => ({ monthly: "Monthly", annual: "Annual", pe_certification: "PE Certification", integrity_test: "Integrity Test", weekly: "Weekly" }[t] ?? t);

  const handleInspSubmit = () => {
    const annualNotes = isAnnual ? [
      inspForm.annualIntegrity ? "✓ Integrity inspection completed/scheduled" : null,
      inspForm.annualCathodic ? "✓ Cathodic protection inspected" : null,
      inspForm.annualVents ? "✓ Vent valves tested" : null,
      inspForm.annualPlan ? "✓ SPCC Plan reviewed and current" : null,
      inspForm.annualTraining ? "✓ Personnel training documented" : null,
      inspForm.annualContacts ? "✓ Emergency contacts updated" : null,
      inspForm.annualOverfill ? "✓ Overfill procedures confirmed" : null,
    ].filter(Boolean).join("; ") : "";
    const combinedFindings = [inspForm.findings, annualNotes].filter(Boolean).join(" | ");
    addInspection.mutate({
      inspectedDate: inspForm.inspectedDate, inspectedBy: inspForm.inspectedBy, inspectionType: inspForm.inspectionType,
      tankIntegrity: inspForm.tankIntegrity, containmentIntegrity: inspForm.containmentIntegrity,
      noLeaksOrSpills: inspForm.noLeaksOrSpills, valvesOperable: inspForm.valvesOperable,
      overfillProtectionOk: inspForm.overfillProtectionOk, levelGaugeOk: inspForm.levelGaugeOk,
      drainageValveClosed: inspForm.drainageValveClosed, spillKitOk: inspForm.spillKitOk, responseEquipOk: inspForm.responseEquipOk,
      findings: combinedFindings || null, tankId: showInspect!.id,
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">SPCC / Oil Spill Prevention</h2>
        <p className="text-sm text-muted-foreground">40 CFR Part 112 · Spill Prevention, Control & Countermeasure · Monthly & Annual Inspection Requirements</p>
      </div>

      {/* Regulatory Context Banner */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 text-xs text-blue-800 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 40 CFR Part 112 Inspection Schedule</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mt-1">
          <span>📋 <strong>Monthly:</strong> All bulk containers — 112.7(e)(8) & 112.8(c)(6)</span>
          <span>📋 <strong>Annual:</strong> Comprehensive facility inspection — 112.7(e)(7)</span>
          <span>📋 <strong>5-Year:</strong> PE plan certification — 112.5(b)</span>
        </div>
        {totalGallons >= 1320 && <p className="mt-1 text-blue-700">⚠ Your facility has {totalGallons.toLocaleString()} gallons of regulated oil storage — SPCC plan required under 112.3(a).</p>}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="tanks">Tank Registry</TabsTrigger>
          <TabsTrigger value="inspections">Inspection Log</TabsTrigger>
        </TabsList>

        <TabsContent value="tanks" className="space-y-4 pt-2">
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddTank(true)}><Plus className="w-4 h-4 mr-1" />Add Tank / Container</Button></div>
          {(tanks as SpccTank[]).length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No tanks or oil containers registered yet. Add each regulated container to track monthly and annual inspection schedules.</div>
          ) : (
            <div className="space-y-3">
              {(tanks as SpccTank[]).map(tank => {
                const monthlyDays = tank.lastMonthlyInspection ? daysSince(tank.lastMonthlyInspection) : (tank.lastInspectionDate ? daysSince(tank.lastInspectionDate) : 999);
                const annualDays = tank.lastAnnualInspection ? daysSince(tank.lastAnnualInspection) : 999;
                const monthlyOverdue = monthlyDays > 31;
                const annualOverdue = annualDays > 365;
                const borderCls = (monthlyOverdue || annualOverdue) ? "border-yellow-300 bg-yellow-50" : "border-border bg-card";
                return (
                  <div key={tank.id} className={`border rounded-xl p-4 ${borderCls}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{tank.tankName}</p>
                          <Badge className="text-xs bg-blue-100 text-blue-700 capitalize">{tank.contentType?.replace(/_/g," ") || "Oil"}</Badge>
                          <Badge className="text-xs bg-slate-100 text-slate-600">{tank.isAboveground ? "AST" : "UST"}</Badge>
                          {tank.hasSecondaryContainment
                            ? <Badge className="text-xs bg-emerald-100 text-emerald-700">Secondary Containment ✓</Badge>
                            : <Badge className="text-xs bg-red-100 text-red-700">⚠ No Secondary Containment</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{tank.location}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs">
                          {tank.capacityGallons && <span className="text-muted-foreground">Capacity: <strong>{tank.capacityGallons.toLocaleString()} gal</strong></span>}
                          {tank.containmentCapacityGallons && <span className="text-muted-foreground">Containment: <strong>{tank.containmentCapacityGallons.toLocaleString()} gal</strong></span>}
                          <span className={monthlyOverdue ? "text-yellow-700 font-medium" : "text-muted-foreground"}>
                            Monthly: <strong>{tank.lastMonthlyInspection ? fmtDate(tank.lastMonthlyInspection) : (tank.lastInspectionDate ? fmtDate(tank.lastInspectionDate) : "Never")}</strong>
                            {monthlyOverdue && " ⚠"}
                          </span>
                          <span className={annualOverdue ? "text-orange-700 font-medium" : "text-muted-foreground"}>
                            Annual: <strong>{tank.lastAnnualInspection ? fmtDate(tank.lastAnnualInspection) : "Never"}</strong>
                            {annualOverdue && " ⚠"}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {monthlyOverdue && <Badge className="bg-yellow-100 text-yellow-700 text-xs">Monthly inspection overdue ({monthlyDays}d)</Badge>}
                          {annualOverdue && <Badge className="bg-orange-100 text-orange-700 text-xs">Annual inspection overdue ({annualDays}d)</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 shrink-0 flex-wrap justify-end">
                        <Button size="sm" variant="outline" className="text-xs bg-slate-800 text-white border-slate-600 hover:bg-slate-700 hover:text-white" onClick={() => setShowFieldMode(tank)}>
                          <ClipboardList className="w-3 h-3 mr-1" />Field Mode
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => { setInspForm(defaultInsp()); setShowInspect(tank); }}>Inspect</Button>
                        <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => delTank.mutate(tank.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="border border-border rounded-lg p-3 text-sm flex items-center justify-between bg-muted/30">
                <span className="text-muted-foreground font-medium">Total Regulated Oil Storage</span>
                <span className="font-bold text-lg">{totalGallons.toLocaleString()} gallons</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4 pt-2">
          {(inspections as SpccInspection[]).length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No inspections logged yet. Click "Inspect" on a tank in the Tank Registry tab to record an inspection.</div>
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Tank</th>
                    <th className="text-left p-3">Inspector</th>
                    <th className="text-left p-3">Result</th>
                    <th className="text-left p-3">Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {(inspections as SpccInspection[]).map(ins => {
                    const tank = (tanks as SpccTank[]).find(t => t.id === ins.tankId);
                    return (
                      <tr key={ins.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{fmtDate(ins.inspectedDate)}</td>
                        <td className="p-3"><Badge className="text-xs bg-blue-100 text-blue-700 capitalize">{inspTypeLabel(ins.inspectionType || "monthly")}</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground">{tank?.tankName || "Facility-Wide"}</td>
                        <td className="p-3 text-muted-foreground">{ins.inspectedBy || "—"}</td>
                        <td className="p-3">{ins.pass ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">✓ Pass</Badge> : <Badge variant="destructive" className="text-xs">✗ Fail</Badge>}</td>
                        <td className="p-3 text-muted-foreground text-xs max-w-xs truncate">{ins.findings || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Tank Dialog */}
      <Dialog open={showAddTank} onOpenChange={setShowAddTank}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tank / Oil Storage Container</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Register all aboveground and underground containers storing oil ≥ 55 gallons. Aggregate ≥ 1,320 gal triggers SPCC requirements.</p>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Tank Name *</Label><Input value={tankForm.tankName} onChange={e => setTankForm(f => ({ ...f, tankName: e.target.value }))} placeholder="e.g. Diesel AST #1, Hydraulic Oil Tank" /></div>
            <div className="space-y-1"><Label>Location / Building</Label><Input value={tankForm.location} onChange={e => setTankForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Tank Farm - West Pad, Pump Room B" /></div>
            <div className="space-y-1"><Label>Oil Type / Content</Label>
              <Select value={tankForm.contentType} onValueChange={v => setTankForm(f => ({ ...f, contentType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select oil type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel Fuel</SelectItem>
                  <SelectItem value="used_oil">Used / Waste Oil</SelectItem>
                  <SelectItem value="hydraulic">Hydraulic Oil</SelectItem>
                  <SelectItem value="gasoline">Gasoline / Petrol</SelectItem>
                  <SelectItem value="lube_oil">Lubricating Oil</SelectItem>
                  <SelectItem value="heating_oil">Heating Oil (#2 / #4 / #6)</SelectItem>
                  <SelectItem value="transformer_oil">Transformer / Dielectric Oil</SelectItem>
                  <SelectItem value="crude_oil">Crude Oil / Condensate</SelectItem>
                  <SelectItem value="other">Other Oil or Petroleum Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Capacity (gallons) *</Label><Input type="number" value={tankForm.capacityGallons} onChange={e => setTankForm(f => ({ ...f, capacityGallons: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Secondary Containment (gal)</Label><Input type="number" value={tankForm.containmentCapacityGallons} onChange={e => setTankForm(f => ({ ...f, containmentCapacityGallons: e.target.value }))} placeholder="110% of tank vol." /></div>
            </div>
            <div className="border border-border rounded-lg p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={tankForm.hasSecondaryContainment} onChange={e => setTankForm(f => ({ ...f, hasSecondaryContainment: e.target.checked }))} className="accent-primary" /><span className="text-sm">Has Secondary Containment (dike, berm, or vault)</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={tankForm.isAboveground} onChange={e => setTankForm(f => ({ ...f, isAboveground: e.target.checked }))} className="accent-primary" /><span className="text-sm">Aboveground Storage Tank (AST)</span></label>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={tankForm.notes} onChange={e => setTankForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Cathodic protection info, vent type, permit notes..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTank(false)}>Cancel</Button>
            <Button onClick={() => addTank.mutate({ ...tankForm, capacityGallons: Number(tankForm.capacityGallons) || null, containmentCapacityGallons: Number(tankForm.containmentCapacityGallons) || null })} disabled={addTank.isPending || !tankForm.tankName}>
              {addTank.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Tank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Field Mode Overlay (tablet/iPad) ── */}
      {showFieldMode && (
        <FieldInspectionOverlay
          title={`SPCC Monthly Inspection`}
          subtitle={`${showFieldMode.tankName} · 40 CFR 112.7(e)(8) / 112.8(c)(6)`}
          items={SPCC_FIELD_ITEMS}
          onClose={() => setShowFieldMode(null)}
          isPending={addInspection.isPending}
          onSubmit={({ checks, inspectorName, date, notes }) => {
            addInspection.mutate({
              tankId: showFieldMode.id,
              inspectedDate: date,
              inspectedBy: inspectorName,
              inspectionType: "monthly",
              tankIntegrity: checks.tankIntegrity !== false,
              containmentIntegrity: checks.containmentIntegrity !== false,
              noLeaksOrSpills: checks.noLeaksOrSpills !== false,
              valvesOperable: checks.valvesOperable !== false,
              overfillProtectionOk: checks.overfillProtectionOk !== false,
              levelGaugeOk: checks.levelGaugeOk !== false,
              drainageValveClosed: checks.drainageValveClosed !== false,
              spillKitOk: checks.spillKitOk !== false,
              responseEquipOk: checks.responseEquipOk !== false,
              findings: notes || null,
            });
            setShowFieldMode(null);
          }}
        />
      )}

      {/* Inspection Dialog */}
      <Dialog open={!!showInspect} onOpenChange={() => setShowInspect(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>SPCC Inspection — {showInspect?.tankName}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {isAnnual
                ? "Annual Inspection per 40 CFR 112.7(e)(7) — complete all items including additional annual requirements."
                : "Monthly Inspection per 40 CFR 112.7(e)(8) / 112.8(c)(6) — required for all bulk oil storage containers."}
            </p>
          </DialogHeader>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={inspForm.inspectedDate} onChange={e => setInspForm(f => ({ ...f, inspectedDate: e.target.value }))} /></div>
              <div className="space-y-1 col-span-2"><Label>Inspection Type</Label>
                <Select value={inspForm.inspectionType} onValueChange={v => setInspForm(f => ({ ...f, inspectionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly — 112.7(e)(8)</SelectItem>
                    <SelectItem value="annual">Annual Comprehensive — 112.7(e)(7)</SelectItem>
                    <SelectItem value="pe_certification">PE Plan Certification — 112.5(b)</SelectItem>
                    <SelectItem value="integrity_test">Integrity Test — API 653 / STI SP001</SelectItem>
                    <SelectItem value="weekly">Weekly — Operational Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Inspector Name</Label><Input value={inspForm.inspectedBy} onChange={e => setInspForm(f => ({ ...f, inspectedBy: e.target.value }))} placeholder="Full name and title" /></div>

            {/* Core Monthly Checklist */}
            <div className="border border-border rounded-lg p-3 space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Core Inspection Checklist (Monthly Requirements)</p>
              {SPCC_MONTHLY_CHECKLIST.map(([key, label]) => (
                <label key={key} className="flex items-start gap-2 cursor-pointer group">
                  <input type="checkbox" checked={!!(inspForm as any)[key]} onChange={e => setInspForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-primary mt-0.5" />
                  <span className="text-sm leading-snug">{label}</span>
                </label>
              ))}
            </div>

            {/* Annual Additional Items */}
            {isAnnual && (
              <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 space-y-2.5">
                <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Annual / PE Certification Additional Requirements — 112.7(e)(7)</p>
                {([
                  ["annualIntegrity",  SPCC_ANNUAL_ADDITIONS[0]],
                  ["annualCathodic",   SPCC_ANNUAL_ADDITIONS[1]],
                  ["annualVents",      SPCC_ANNUAL_ADDITIONS[2]],
                  ["annualPlan",       SPCC_ANNUAL_ADDITIONS[3]],
                  ["annualTraining",   SPCC_ANNUAL_ADDITIONS[4]],
                  ["annualContacts",   SPCC_ANNUAL_ADDITIONS[5]],
                  ["annualOverfill",   SPCC_ANNUAL_ADDITIONS[6]],
                ] as [keyof typeof inspForm, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!(inspForm as any)[key]} onChange={e => setInspForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-primary mt-0.5" />
                    <span className="text-sm leading-snug text-orange-900">{label}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="space-y-1"><Label>Deficiencies / Corrective Actions</Label><Textarea value={inspForm.findings} onChange={e => setInspForm(f => ({ ...f, findings: e.target.value }))} rows={3} placeholder="Document any deficiencies found. If all items pass, leave blank or note 'No deficiencies observed.'" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInspect(null)}>Cancel</Button>
            <Button onClick={handleInspSubmit} disabled={addInspection.isPending}>
              {addInspection.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Log Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Stormwater Module ────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const BMP_FIELD_ITEMS: FieldItem[] = [
  { key: "bmpConditionsOk",     label: "Structural BMPs in Good Condition", hint: "Sediment controls, berms, vegetated buffers, catch basin inserts — no erosion or damage", citation: "MSGP Part 3.1" },
  { key: "drainageAreasOk",     label: "Drainage Areas Free of Spills / Exposed Material", hint: "No oils, chemicals, raw materials, or waste exposed to rain in drainage paths", citation: "MSGP Part 3.1" },
  { key: "controlStructuresOk", label: "Outfalls & Control Structures Clear", hint: "Outfall pipes and inlet structures unobstructed, no blockage or visible discharge between events", citation: "MSGP Part 3.1" },
  { key: "housekeepingOk",      label: "Good Housekeeping — No Unsecured Materials", hint: "Drums covered, dumpsters lidded, no debris or equipment fluids in stormwater-exposed areas", citation: "MSGP Part 3.1" },
];

function StormwaterModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("quarterly");
  const [showAdd, setShowAdd] = useState(false);
  const [monType, setMonType] = useState("quarterly_visual");
  const [showBmpFieldMode, setShowBmpFieldMode] = useState(false);

  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth(); // 0-indexed
  const currentQ = Math.ceil((thisMonth + 1) / 3);

  const defaultQForm = () => ({
    monitoringType: "quarterly_visual",
    monitoringDate: today.toISOString().split("T")[0],
    quarter: `Q${currentQ}`,
    year: thisYear,
    outfallId: "",
    conductedBy: "",
    weatherConditions: "",
    color: "clear", odor: "none", turbidity: "clear",
    floating: false, sheen: false,
    otherObservations: "",
    actionRequired: false, correctionTaken: "",
    month: MONTHS_FULL[thisMonth],
    bmpConditionsOk: true, drainageAreasOk: true, controlStructuresOk: true, housekeepingOk: true, swpppUpdated: false,
  });
  const [form, setForm] = useState(defaultQForm());

  const { data: events = [] } = useQuery<StormwaterMonitor[]>({ queryKey: ["/api/env/stormwater-monitoring"], staleTime: Infinity });
  const addEvent = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/env/stormwater-monitoring", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/stormwater-monitoring"] }); setShowAdd(false); setForm(defaultQForm()); toast({ title: "Record logged successfully" }); }
  });
  const del = useMutation({ mutationFn: (id: number) => apiRequest("DELETE", `/api/env/stormwater-monitoring/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/env/stormwater-monitoring"] }) });

  const allEvents = events as StormwaterMonitor[];
  const thisYearEvents = allEvents.filter(e => e.year === thisYear);
  const quarters = ["Q1","Q2","Q3","Q4"];
  const completedQuarters = new Set(thisYearEvents.filter(e => e.monitoringType === "quarterly_visual" || !e.monitoringType).map(e => e.quarter));
  const dueQuarters = quarters.slice(0, currentQ).filter(q => !completedQuarters.has(q));

  const completedMonthlyMonths = new Set(thisYearEvents.filter(e => e.monitoringType === "monthly_inspection").map(e => e.month));
  const dueMonths = MONTHS_FULL.slice(0, thisMonth + 1).filter(m => !completedMonthlyMonths.has(m));
  const hasAnnualThisYear = thisYearEvents.some(e => e.monitoringType === "annual_inspection");
  const hasSwpppThisYear = thisYearEvents.some(e => e.monitoringType === "swppp_review");

  const monTypeBadge = (t: string) => ({
    quarterly_visual: { label: "Quarterly Visual", cls: "bg-cyan-100 text-cyan-700" },
    monthly_inspection: { label: "Monthly BMP Inspection", cls: "bg-blue-100 text-blue-700" },
    annual_inspection: { label: "Annual Inspection", cls: "bg-purple-100 text-purple-700" },
    swppp_review: { label: "SWPPP Review", cls: "bg-emerald-100 text-emerald-700" },
    corrective_action: { label: "Corrective Action", cls: "bg-red-100 text-red-700" },
  }[t] ?? { label: t, cls: "bg-muted text-muted-foreground" });

  const openAdd = (type: string) => { setMonType(type); setForm({ ...defaultQForm(), monitoringType: type }); setShowAdd(true); };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">Stormwater / SWPPP</h2>
        <p className="text-sm text-muted-foreground">NPDES Industrial Stormwater · 40 CFR Part 122 · MSGP Multi-Sector General Permit</p>
      </div>

      {/* Regulatory Reference Banner */}
      <div className="border border-cyan-200 bg-cyan-50 rounded-lg p-3 text-xs text-cyan-900 space-y-1">
        <p className="font-semibold">40 CFR Part 122 / MSGP Industrial Stormwater Permit Requirements</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 mt-1">
          <span>📋 <strong>Quarterly Visual Monitoring</strong> — MSGP Appendix B; one discharge event per quarter per outfall</span>
          <span>📋 <strong>Monthly BMP Inspections</strong> — MSGP Part 3.1; facility walkthrough, drainage areas, structural controls</span>
          <span>📋 <strong>Annual Comprehensive Inspection</strong> — MSGP Part 3.1; full facility + corrective action status</span>
          <span>📋 <strong>SWPPP Annual Review</strong> — MSGP Part 5.1.3; update plan after inspection or facility change</span>
        </div>
      </div>

      {/* Compliance Status — Alert Banners */}
      {dueQuarters.length > 0 && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-yellow-800">Quarterly Visual Monitoring overdue: {dueQuarters.join(", ")} {thisYear}</p>
            <p className="text-yellow-700 mt-0.5">MSGP Appendix B requires visual monitoring of stormwater discharges once per quarter from each outfall during an actual storm event.</p>
          </div>
        </div>
      )}
      {dueMonths.length > 2 && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-blue-800">Monthly BMP site inspections behind — {dueMonths.length} months not logged</p>
            <p className="text-blue-700 mt-0.5">MSGP Part 3.1 requires routine facility inspections to confirm BMPs are in place and functioning each month.</p>
          </div>
        </div>
      )}
      {!hasAnnualThisYear && thisMonth >= 2 && (
        <div className="border border-purple-200 bg-purple-50 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-purple-800">Annual comprehensive facility inspection not yet logged for {thisYear}</p>
            <p className="text-purple-700 mt-0.5">MSGP Part 3.1 requires at least one comprehensive facility inspection per year documenting all exposed material areas and BMP effectiveness.</p>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="quarterly">Quarterly Visual</TabsTrigger>
          <TabsTrigger value="monthly">Monthly BMP</TabsTrigger>
          <TabsTrigger value="annual">Annual / SWPPP</TabsTrigger>
          <TabsTrigger value="all">All Records</TabsTrigger>
        </TabsList>

        {/* ── Quarterly Visual Monitoring ── */}
        <TabsContent value="quarterly" className="space-y-4 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">MSGP Appendix B · One visual monitoring event per quarter per outfall during an actual precipitation event</p>
            <Button size="sm" onClick={() => openAdd("quarterly_visual")}><Plus className="w-4 h-4 mr-1" />Log Quarterly Event</Button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quarters.map(q => {
              const done = completedQuarters.has(q);
              const qIdx = parseInt(q[1]) - 1;
              const due = qIdx < currentQ;
              return (
                <div key={q} className={`border rounded-xl p-4 text-center ${done ? "border-emerald-200 bg-emerald-50" : due ? "border-yellow-200 bg-yellow-50" : "border-border bg-card"}`}>
                  <p className="font-bold text-sm">{q} {thisYear}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q === "Q1" ? "Jan–Mar" : q === "Q2" ? "Apr–Jun" : q === "Q3" ? "Jul–Sep" : "Oct–Dec"}
                  </p>
                  <p className={`text-sm font-bold mt-2 ${done ? "text-emerald-600" : due ? "text-yellow-600" : "text-muted-foreground"}`}>
                    {done ? "✓ Done" : due ? "⚠ Due" : "Upcoming"}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="space-y-3">
            {allEvents.filter(e => e.monitoringType === "quarterly_visual" || !e.monitoringType).length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No quarterly visual monitoring events logged yet. Log one when you observe a stormwater discharge during a rain event.</div>
            ) : allEvents.filter(e => e.monitoringType === "quarterly_visual" || !e.monitoringType).map(ev => (
              <div key={ev.id} className={`border rounded-xl p-4 ${ev.actionRequired ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className="bg-cyan-100 text-cyan-700 text-xs">{ev.quarter} {ev.year}</Badge>
                      {ev.outfallId && <span className="text-xs text-muted-foreground">Outfall {ev.outfallId}</span>}
                      {ev.actionRequired && <Badge variant="destructive" className="text-xs">Action Required</Badge>}
                      {ev.sheen && <Badge className="bg-orange-100 text-orange-700 text-xs">Sheen Observed</Badge>}
                    </div>
                    <p className="text-sm font-medium">{fmtDate(ev.monitoringDate)} — {ev.conductedBy || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ev.weatherConditions}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>Color: <strong>{ev.color || "—"}</strong></span>
                      <span>Odor: <strong>{ev.odor || "—"}</strong></span>
                      <span>Turbidity: <strong>{ev.turbidity || "—"}</strong></span>
                      {ev.floating && <span className="text-red-600 font-medium">⚠ Floating material</span>}
                    </div>
                    {ev.otherObservations && <p className="text-xs text-muted-foreground mt-1 italic">{ev.otherObservations}</p>}
                    {ev.correctionTaken && <p className="text-xs text-emerald-700 mt-1 font-medium">Correction: {ev.correctionTaken}</p>}
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0 ml-3" onClick={() => del.mutate(ev.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Monthly BMP Inspections ── */}
        <TabsContent value="monthly" className="space-y-4 pt-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">MSGP Part 3.1 · Monthly routine facility inspection — drainage areas, BMPs, potential pollution sources</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700 hover:text-white" onClick={() => setShowBmpFieldMode(true)}>
                <ClipboardList className="w-4 h-4 mr-1" />Field Mode
              </Button>
              <Button size="sm" onClick={() => openAdd("monthly_inspection")}><Plus className="w-4 h-4 mr-1" />Log Monthly Inspection</Button>
            </div>
          </div>
          {/* 12-month calendar grid */}
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {MONTHS_SHORT.map((m, i) => {
              const fullM = MONTHS_FULL[i];
              const done = completedMonthlyMonths.has(fullM);
              const due = i <= thisMonth;
              return (
                <div key={m} className={`border rounded-lg p-2 text-center text-xs ${done ? "border-blue-300 bg-blue-50" : due ? "border-yellow-200 bg-yellow-50" : "border-border bg-card"}`}>
                  <p className="font-semibold">{m}</p>
                  <p className={`mt-0.5 font-bold ${done ? "text-blue-600" : due ? "text-yellow-600" : "text-muted-foreground"}`}>{done ? "✓" : due ? "—" : "·"}</p>
                </div>
              );
            })}
          </div>
          <div className="space-y-3">
            {allEvents.filter(e => e.monitoringType === "monthly_inspection").length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No monthly BMP inspections logged yet. MSGP Part 3.1 requires routine monthly facility walkthrough inspections.</div>
            ) : allEvents.filter(e => e.monitoringType === "monthly_inspection").map(ev => (
              <div key={ev.id} className={`border rounded-xl p-4 ${ev.actionRequired ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex gap-2 items-center flex-wrap mb-1">
                      <Badge className="bg-blue-100 text-blue-700 text-xs">{ev.month} {ev.year}</Badge>
                      {ev.actionRequired && <Badge variant="destructive" className="text-xs">Action Required</Badge>}
                    </div>
                    <p className="text-sm font-medium">{fmtDate(ev.monitoringDate)} — {ev.conductedBy || "—"}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {ev.bmpConditionsOk !== null && <span>{ev.bmpConditionsOk ? "✓" : "✗"} BMPs</span>}
                      {ev.drainageAreasOk !== null && <span>{ev.drainageAreasOk ? "✓" : "✗"} Drainage</span>}
                      {ev.controlStructuresOk !== null && <span>{ev.controlStructuresOk ? "✓" : "✗"} Controls</span>}
                      {ev.housekeepingOk !== null && <span>{ev.housekeepingOk ? "✓" : "✗"} Housekeeping</span>}
                    </div>
                    {ev.otherObservations && <p className="text-xs text-muted-foreground mt-1 italic">{ev.otherObservations}</p>}
                    {ev.correctionTaken && <p className="text-xs text-emerald-700 mt-1 font-medium">Correction: {ev.correctionTaken}</p>}
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0 ml-3" onClick={() => del.mutate(ev.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Annual & SWPPP Review ── */}
        <TabsContent value="annual" className="space-y-4 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">MSGP Parts 3.1 & 5.1.3 · Annual comprehensive inspection + SWPPP annual review and update</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openAdd("swppp_review")}><Plus className="w-4 h-4 mr-1" />SWPPP Review</Button>
              <Button size="sm" onClick={() => openAdd("annual_inspection")}><Plus className="w-4 h-4 mr-1" />Annual Inspection</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`border rounded-xl p-4 ${hasAnnualThisYear ? "border-emerald-200 bg-emerald-50" : "border-yellow-200 bg-yellow-50"}`}>
              <p className="font-semibold text-sm">Annual Comprehensive Inspection</p>
              <p className="text-xs text-muted-foreground mt-0.5">MSGP Part 3.1 — full facility walkthrough</p>
              <p className={`text-xl font-black mt-2 ${hasAnnualThisYear ? "text-emerald-600" : "text-yellow-600"}`}>{hasAnnualThisYear ? "✓ Complete" : "⚠ Not yet logged"} {thisYear}</p>
            </div>
            <div className={`border rounded-xl p-4 ${hasSwpppThisYear ? "border-emerald-200 bg-emerald-50" : "border-yellow-200 bg-yellow-50"}`}>
              <p className="font-semibold text-sm">SWPPP Annual Review</p>
              <p className="text-xs text-muted-foreground mt-0.5">MSGP Part 5.1.3 — plan review and update</p>
              <p className={`text-xl font-black mt-2 ${hasSwpppThisYear ? "text-emerald-600" : "text-yellow-600"}`}>{hasSwpppThisYear ? "✓ Complete" : "⚠ Not yet logged"} {thisYear}</p>
            </div>
          </div>
          <div className="space-y-3">
            {allEvents.filter(e => e.monitoringType === "annual_inspection" || e.monitoringType === "swppp_review" || e.monitoringType === "corrective_action").length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No annual inspections or SWPPP reviews logged yet.</div>
            ) : allEvents.filter(e => e.monitoringType === "annual_inspection" || e.monitoringType === "swppp_review" || e.monitoringType === "corrective_action").map(ev => {
              const badge = monTypeBadge(ev.monitoringType || "");
              return (
                <div key={ev.id} className={`border rounded-xl p-4 ${ev.actionRequired ? "border-red-200 bg-red-50" : "border-border bg-card"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex gap-2 items-center flex-wrap mb-1">
                        <Badge className={`text-xs ${badge.cls}`}>{badge.label}</Badge>
                        <span className="text-xs text-muted-foreground">{ev.year}</span>
                        {ev.actionRequired && <Badge variant="destructive" className="text-xs">Action Required</Badge>}
                      </div>
                      <p className="text-sm font-medium">{fmtDate(ev.monitoringDate)} — {ev.conductedBy || "—"}</p>
                      {ev.otherObservations && <p className="text-xs text-muted-foreground mt-1 italic">{ev.otherObservations}</p>}
                      {ev.correctionTaken && <p className="text-xs text-emerald-700 mt-1 font-medium">Action: {ev.correctionTaken}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0 ml-3" onClick={() => del.mutate(ev.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── All Records ── */}
        <TabsContent value="all" className="space-y-3 pt-3">
          <div className="flex justify-end"><Button size="sm" onClick={() => openAdd(monType)}><Plus className="w-4 h-4 mr-1" />Add Record</Button></div>
          {allEvents.length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No stormwater records logged yet.</div>
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Period</th>
                    <th className="text-left p-3">Outfall</th>
                    <th className="text-left p-3">Inspector</th>
                    <th className="text-left p-3">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {allEvents.map(ev => {
                    const badge = monTypeBadge(ev.monitoringType || "quarterly_visual");
                    return (
                      <tr key={ev.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{fmtDate(ev.monitoringDate)}</td>
                        <td className="p-3"><Badge className={`text-xs ${badge.cls}`}>{badge.label}</Badge></td>
                        <td className="p-3 text-muted-foreground text-xs">{ev.quarter || ev.month || "—"} {ev.year}</td>
                        <td className="p-3 text-muted-foreground">{ev.outfallId || "—"}</td>
                        <td className="p-3 text-muted-foreground">{ev.conductedBy || "—"}</td>
                        <td className="p-3">{ev.actionRequired ? <Badge variant="destructive" className="text-xs">Action Req.</Badge> : ev.sheen ? <Badge className="text-xs bg-orange-100 text-orange-700">Sheen</Badge> : <span className="text-muted-foreground text-xs">None</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Record Dialog ── */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form.monitoringType === "quarterly_visual" ? "Log Quarterly Visual Monitoring Event" :
               form.monitoringType === "monthly_inspection" ? "Log Monthly BMP Inspection" :
               form.monitoringType === "annual_inspection" ? "Log Annual Comprehensive Inspection" :
               form.monitoringType === "swppp_review" ? "Log SWPPP Annual Review" :
               "Log Corrective Action Event"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {form.monitoringType === "quarterly_visual" && "MSGP Appendix B — observed during actual precipitation event. Record within 30 minutes of discharge."}
              {form.monitoringType === "monthly_inspection" && "MSGP Part 3.1 — facility walkthrough. Inspect drainage areas, BMPs, pollutant sources, and control structures."}
              {form.monitoringType === "annual_inspection" && "MSGP Part 3.1 — full comprehensive facility inspection. Document all exposed areas and corrective action status."}
              {form.monitoringType === "swppp_review" && "MSGP Part 5.1.3 — annual plan review. Update for facility changes, new pollutant sources, or BMP modifications."}
            </p>
          </DialogHeader>

          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {/* Type Selector — only in All Records tab */}
            {tab === "all" && (
              <div className="space-y-1"><Label>Record Type</Label>
                <Select value={form.monitoringType} onValueChange={v => setForm(f => ({ ...f, monitoringType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly_visual">Quarterly Visual Monitoring</SelectItem>
                    <SelectItem value="monthly_inspection">Monthly BMP Inspection</SelectItem>
                    <SelectItem value="annual_inspection">Annual Comprehensive Inspection</SelectItem>
                    <SelectItem value="swppp_review">SWPPP Annual Review</SelectItem>
                    <SelectItem value="corrective_action">Corrective Action Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={form.monitoringDate} onChange={e => setForm(f => ({ ...f, monitoringDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Conducted By</Label><Input value={form.conductedBy} onChange={e => setForm(f => ({ ...f, conductedBy: e.target.value }))} placeholder="Name / Title" /></div>
            </div>

            {/* Quarterly-specific fields */}
            {(form.monitoringType === "quarterly_visual" || form.monitoringType === "corrective_action") && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Quarter</Label>
                    <Select value={form.quarter} onValueChange={v => setForm(f => ({ ...f, quarter: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Q1","Q2","Q3","Q4"].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} /></div>
                  <div className="space-y-1"><Label>Outfall ID</Label><Input value={form.outfallId} onChange={e => setForm(f => ({ ...f, outfallId: e.target.value }))} placeholder="e.g. SW-001" /></div>
                </div>
                <div className="space-y-1"><Label>Weather / Precipitation Conditions</Label><Input value={form.weatherConditions} onChange={e => setForm(f => ({ ...f, weatherConditions: e.target.value }))} placeholder="e.g. Moderate rain, 55°F, 0.8 in rainfall" /></div>
                <div className="border border-border rounded-lg p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visual Observation (MSGP App. B)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Color</Label>
                      <Select value={form.color} onValueChange={v => setForm(f => ({ ...f, color: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="clear">Clear</SelectItem><SelectItem value="light_brown">Light Brown</SelectItem><SelectItem value="brown">Brown</SelectItem><SelectItem value="gray">Gray</SelectItem><SelectItem value="red_orange">Red/Orange</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Odor</Label>
                      <Select value={form.odor} onValueChange={v => setForm(f => ({ ...f, odor: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="mild">Mild</SelectItem><SelectItem value="strong">Strong</SelectItem><SelectItem value="chemical">Chemical</SelectItem><SelectItem value="sewage">Sewage</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Turbidity</Label>
                      <Select value={form.turbidity} onValueChange={v => setForm(f => ({ ...f, turbidity: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="clear">Clear</SelectItem><SelectItem value="slightly_turbid">Slightly Turbid</SelectItem><SelectItem value="turbid">Turbid</SelectItem><SelectItem value="very_turbid">Very Turbid</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.floating} onChange={e => setForm(f => ({ ...f, floating: e.target.checked }))} className="accent-primary" />Floating Material</label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.sheen} onChange={e => setForm(f => ({ ...f, sheen: e.target.checked }))} className="accent-primary" />Oil / Petroleum Sheen</label>
                  </div>
                </div>
              </>
            )}

            {/* Monthly BMP Inspection checklist */}
            {form.monitoringType === "monthly_inspection" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Month</Label>
                    <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MONTHS_FULL.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} /></div>
                </div>
                <div className="border border-border rounded-lg p-3 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">BMP Site Inspection Checklist — MSGP Part 3.1</p>
                  {([
                    ["bmpConditionsOk",       "All structural BMPs (berms, filters, sediment controls) in good condition"],
                    ["drainageAreasOk",       "Drainage areas free of spills, leaks, or exposed materials requiring action"],
                    ["controlStructuresOk",   "Stormwater outfalls and control structures unobstructed and functional"],
                    ["housekeepingOk",        "Good housekeeping — no unsecured materials in areas exposed to stormwater"],
                  ] as [keyof typeof form, string][]).map(([key, label]) => (
                    <label key={key} className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-primary mt-0.5" />
                      <span className="text-sm leading-snug">{label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Annual / SWPPP Review fields */}
            {(form.monitoringType === "annual_inspection" || form.monitoringType === "swppp_review") && (
              <div className="space-y-1">
                <Label>Year</Label>
                <Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
              </div>
            )}
            {form.monitoringType === "swppp_review" && (
              <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3 space-y-2.5">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">SWPPP Review Checklist — MSGP Part 5.1.3</p>
                {([
                  ["bmpConditionsOk",    "SWPPP reviewed for accuracy and completeness"],
                  ["drainageAreasOk",    "Facility changes since last review documented in SWPPP"],
                  ["controlStructuresOk","BMP effectiveness assessed and modifications noted"],
                  ["housekeepingOk",     "Annual inspection findings incorporated into SWPPP"],
                  ["swpppUpdated",       "SWPPP signature page updated and dated"],
                ] as [keyof typeof form, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-primary mt-0.5" />
                    <span className="text-sm leading-snug text-emerald-900">{label}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Common fields */}
            <div className="space-y-1"><Label>{form.monitoringType === "quarterly_visual" ? "Other Observations" : "Inspection Notes / Findings"}</Label>
              <Textarea value={form.otherObservations} onChange={e => setForm(f => ({ ...f, otherObservations: e.target.value }))} rows={2} placeholder={form.monitoringType === "quarterly_visual" ? "Any additional visual observations..." : "Document observations, deficiencies, or areas of concern..."} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.actionRequired} onChange={e => setForm(f => ({ ...f, actionRequired: e.target.checked }))} className="accent-primary" />
              <span>Corrective action required (triggers MSGP Part 4 response)</span>
            </label>
            {form.actionRequired && (
              <div className="space-y-1"><Label>Corrective Action Taken / Planned</Label>
                <Textarea value={form.correctionTaken} onChange={e => setForm(f => ({ ...f, correctionTaken: e.target.value }))} rows={2} placeholder="Describe corrective action implemented or planned with target completion date..." />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addEvent.mutate(form)} disabled={addEvent.isPending}>
              {addEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── BMP Monthly Field Mode Overlay (tablet/iPad) ── */}
      {showBmpFieldMode && (
        <FieldInspectionOverlay
          title="Monthly BMP Site Inspection"
          subtitle={`${MONTHS_FULL[thisMonth]} ${thisYear} · MSGP Part 3.1 · Walk each drainage area and stormwater control`}
          items={BMP_FIELD_ITEMS}
          onClose={() => setShowBmpFieldMode(false)}
          isPending={addEvent.isPending}
          onSubmit={({ checks, inspectorName, date, notes }) => {
            addEvent.mutate({
              monitoringType: "monthly_inspection",
              monitoringDate: date,
              conductedBy: inspectorName,
              month: MONTHS_FULL[thisMonth],
              year: thisYear,
              quarter: `Q${currentQ}`,
              bmpConditionsOk: checks.bmpConditionsOk !== false,
              drainageAreasOk: checks.drainageAreasOk !== false,
              controlStructuresOk: checks.controlStructuresOk !== false,
              housekeepingOk: checks.housekeepingOk !== false,
              actionRequired: Object.values(checks).some(v => v === false),
              otherObservations: notes || null,
            });
            setShowBmpFieldMode(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Air Quality Module ───────────────────────────────────────────────────────

function AirModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("permits");
  const [showAddPermit, setShowAddPermit] = useState(false);
  const [showAddOpacity, setShowAddOpacity] = useState(false);
  const [permitForm, setPermitForm] = useState({ permitNumber: "", permitType: "", issuingAgency: "", issueDate: "", expirationDate: "", renewalLeadDays: "180", description: "", conditions: "" });
  const [opacityForm, setOpacityForm] = useState({ logDate: new Date().toISOString().split("T")[0], sourceId: "", observerName: "", opacityPercent: "", duration: "", weatherConditions: "", notes: "" });

  const { data: permits = [] } = useQuery<AirPermit[]>({ queryKey: ["/api/env/air-permits"], staleTime: Infinity });
  const { data: opacityLogs = [] } = useQuery<OpacityLog[]>({ queryKey: ["/api/env/opacity-logs"], staleTime: Infinity });

  const addPermit = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/air-permits", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/air-permits"] }); setShowAddPermit(false); toast({ title: "Permit added" }); } });
  const delPermit = useMutation({ mutationFn: (id: number) => apiRequest("DELETE", `/api/env/air-permits/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/env/air-permits"] }) });
  const addOpacity = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/opacity-logs", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/opacity-logs"] }); setShowAddOpacity(false); toast({ title: "Opacity observation logged" }); } });

  const permitTypeLabel = (t: string) => ({ title_v: "Title V", synthetic_minor: "Synthetic Minor", minor_source: "Minor Source", state_only: "State-Only", registration: "Registration" }[t] ?? t);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">Air Quality / CAA</h2>
        <p className="text-sm text-muted-foreground">Clean Air Act · 40 CFR Parts 51–71 · Permit Management & Emissions Monitoring</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="permits">Permits</TabsTrigger>
          <TabsTrigger value="opacity">Method 9 / Opacity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="permits" className="space-y-4 pt-2">
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddPermit(true)}><Plus className="w-4 h-4 mr-1" />Add Permit</Button></div>
          {(permits as AirPermit[]).length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No air permits on file. Add your facility's air permits to track renewal dates.</div>
          ) : (
            <div className="space-y-3">
              {(permits as AirPermit[]).map(permit => {
                const daysToExpiry = permit.expirationDate ? daysUntil(permit.expirationDate) : null;
                const isExpiring = daysToExpiry !== null && daysToExpiry <= 180 && daysToExpiry >= 0;
                const isExpired = daysToExpiry !== null && daysToExpiry < 0;
                return (
                  <div key={permit.id} className={`border rounded-xl p-4 ${isExpired ? "border-red-300 bg-red-50" : isExpiring ? "border-yellow-300 bg-yellow-50" : "border-border bg-card"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold">{permit.permitNumber}</p>
                          <Badge className="bg-purple-100 text-purple-700 text-xs">{permitTypeLabel(permit.permitType || "")}</Badge>
                          {isExpired && <Badge variant="destructive" className="text-xs">EXPIRED</Badge>}
                          {isExpiring && !isExpired && <Badge className="bg-yellow-100 text-yellow-700 text-xs">{daysToExpiry}d until renewal</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{permit.issuingAgency}</p>
                        <p className="text-xs text-muted-foreground mt-1">{permit.description}</p>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          {permit.issueDate && <span>Issued: {fmtDate(permit.issueDate)}</span>}
                          {permit.expirationDate && <span>Expires: <strong>{fmtDate(permit.expirationDate)}</strong></span>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => delPermit.mutate(permit.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="opacity" className="space-y-4 pt-2">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
            Method 9 requires a certified observer. Opacity readings ≥20% (6-minute average) are generally a permit violation. Log all visible emissions observations here.
          </div>
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddOpacity(true)}><Plus className="w-4 h-4 mr-1" />Log Observation</Button></div>
          {(opacityLogs as OpacityLog[]).length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No opacity observations logged yet.</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs"><tr><th className="text-left p-3">Date</th><th className="text-left p-3">Source</th><th className="text-left p-3">Observer</th><th className="text-right p-3">Opacity %</th><th className="text-left p-3">Result</th></tr></thead>
                <tbody>
                  {(opacityLogs as OpacityLog[]).map(log => (
                    <tr key={log.id} className={`border-t border-border ${!log.pass ? "bg-red-50" : ""}`}>
                      <td className="p-3">{fmtDate(log.logDate)}</td>
                      <td className="p-3 text-muted-foreground">{log.sourceId || "—"}</td>
                      <td className="p-3 text-muted-foreground">{log.observerName || "—"}</td>
                      <td className={`p-3 text-right font-bold ${log.opacityPercent >= 20 ? "text-red-600" : "text-emerald-600"}`}>{log.opacityPercent ?? "—"}%</td>
                      <td className="p-3">{log.pass ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Pass (&lt;20%)</Badge> : <Badge variant="destructive" className="text-xs">Fail (≥20%)</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Permit Dialog */}
      <Dialog open={showAddPermit} onOpenChange={setShowAddPermit}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Air Permit</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Permit Number *</Label><Input value={permitForm.permitNumber} onChange={e => setPermitForm(f => ({ ...f, permitNumber: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Permit Type</Label>
              <Select value={permitForm.permitType} onValueChange={v => setPermitForm(f => ({ ...f, permitType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent><SelectItem value="title_v">Title V (Major Source)</SelectItem><SelectItem value="synthetic_minor">Synthetic Minor</SelectItem><SelectItem value="minor_source">Minor Source</SelectItem><SelectItem value="state_only">State-Only</SelectItem><SelectItem value="registration">Registration Permit</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Issuing Agency</Label><Input value={permitForm.issuingAgency} onChange={e => setPermitForm(f => ({ ...f, issuingAgency: e.target.value }))} placeholder="e.g. MDEQ / EPA Region 5" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Issue Date</Label><Input type="date" value={permitForm.issueDate} onChange={e => setPermitForm(f => ({ ...f, issueDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Expiration Date</Label><Input type="date" value={permitForm.expirationDate} onChange={e => setPermitForm(f => ({ ...f, expirationDate: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Alert me (days before expiration)</Label><Input type="number" value={permitForm.renewalLeadDays} onChange={e => setPermitForm(f => ({ ...f, renewalLeadDays: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={permitForm.description} onChange={e => setPermitForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPermit(false)}>Cancel</Button>
            <Button onClick={() => addPermit.mutate({ ...permitForm, renewalLeadDays: Number(permitForm.renewalLeadDays) || 180 })} disabled={addPermit.isPending || !permitForm.permitNumber}>
              {addPermit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Permit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Opacity Dialog */}
      <Dialog open={showAddOpacity} onOpenChange={setShowAddOpacity}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Visible Emissions Observation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={opacityForm.logDate} onChange={e => setOpacityForm(f => ({ ...f, logDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Stack / Source ID</Label><Input value={opacityForm.sourceId} onChange={e => setOpacityForm(f => ({ ...f, sourceId: e.target.value }))} placeholder="e.g. Stack #1" /></div>
            </div>
            <div className="space-y-1"><Label>Observer Name</Label><Input value={opacityForm.observerName} onChange={e => setOpacityForm(f => ({ ...f, observerName: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Opacity % *</Label><Input type="number" min="0" max="100" value={opacityForm.opacityPercent} onChange={e => setOpacityForm(f => ({ ...f, opacityPercent: e.target.value }))} placeholder="0–100" /></div>
              <div className="space-y-1"><Label>Duration</Label><Input value={opacityForm.duration} onChange={e => setOpacityForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 6 minutes" /></div>
            </div>
            <div className="space-y-1"><Label>Weather Conditions</Label><Input value={opacityForm.weatherConditions} onChange={e => setOpacityForm(f => ({ ...f, weatherConditions: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={opacityForm.notes} onChange={e => setOpacityForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            {opacityForm.opacityPercent && Number(opacityForm.opacityPercent) >= 20 && (
              <div className="border border-red-300 bg-red-50 rounded-lg p-2 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 shrink-0" />Opacity ≥20% is a potential permit violation. Document corrective actions and notify your environmental manager.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOpacity(false)}>Cancel</Button>
            <Button onClick={() => addOpacity.mutate({ ...opacityForm, opacityPercent: Number(opacityForm.opacityPercent) || null })} disabled={addOpacity.isPending || !opacityForm.opacityPercent}>
              {addOpacity.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Log Observation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Ask Corey Module ─────────────────────────────────────────────────────────

function AskCoreyModule({ facilityState }: { facilityState?: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/iso/module-isa-chat", {
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        systemPrompt: `You are Corey, a Senior Environmental Compliance Expert specializing in EPA regulations. You are an expert in:
- Universal Waste (40 CFR Part 273): batteries, lamps, pesticides, mercury-containing equipment, aerosol cans
- Hazardous Waste / RCRA (40 CFR Parts 260-270): generator status, satellite accumulation, manifests, TSDF requirements
- SPCC (40 CFR Part 112): spill prevention, secondary containment, inspection requirements, plan certification
- Stormwater / NPDES (40 CFR Part 122): SWPPP, visual monitoring, BMPs, sampling requirements
- Air Quality / CAA (40 CFR Parts 51-71): permits (Title V, minor source), visible emissions, Method 9, HAPs/VOCs

${facilityState ? `This facility is located in ${facilityState}. Be sure to reference state-specific requirements in addition to federal EPA requirements where applicable.` : ""}

Provide precise, regulation-cited answers. Always cite the specific CFR section. Flag when state regulations may be more stringent than federal requirements. Be direct and practical — these are working EHS professionals who need actionable guidance.`,
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "assistant", content: data.content ?? "I couldn't generate a response." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, I had trouble responding. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = [
    "How do I label a 55-gallon drum of used coolant?",
    "When must I file an Exception Report for an unconfirmed manifest?",
    "What are the SPCC Tier I qualified facility criteria?",
    "What triggers a VSQG to become an SQG?",
    "How do I conduct a quarterly stormwater visual assessment?",
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-base">Ask Corey — Environmental Compliance</h2>
            <p className="text-xs text-muted-foreground">CFR 40 / EPA regulations · {facilityState ? `${facilityState}-specific guidance` : "Set your state in Facility Profile for state-specific answers"}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Ask any environmental compliance question. Try one of these:</p>
            <div className="grid gap-2">
              {QUICK.map(q => (
                <button key={q} className="text-left text-sm border border-border rounded-lg px-3 py-2 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted border border-border"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 pb-6 pt-3 border-t border-border">
        <div className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about EPA regulations, waste management, permits..." className="flex-1" onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} />
          <Button size="icon" onClick={send} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main EnvHub App ──────────────────────────────────────────────────────────

// NOTE: Aspects & Impacts Analysis (ISO 14001 §6.1.2) has moved to ISO Manager.


export default function EnvHub() {
  const { user } = useAuth();
  const { data: sub, isLoading: subLoading } = useSubscriptionStatus();
  const [activeModule, setActiveModule] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile } = useQuery<FacilityProfile | null>({ queryKey: ["/api/env/facility-profile"], staleTime: Infinity });

  const hasAccess = !!(sub?.hasEnvHub || sub?.isAdmin);

  if (!subLoading && !hasAccess) {
    const cfg = PRODUCT_CONFIGS.env_hub;
    return (
      <ProtectedLayout>
        <div className="min-h-screen bg-[hsl(222,47%,8%)] text-white overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-14 space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-2">
                <Leaf className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black">{cfg.name}</h1>
              <p className="text-emerald-400 font-semibold text-lg">{cfg.tagline}</p>
              <p className="text-white/60 max-w-xl mx-auto leading-relaxed">{cfg.description}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {cfg.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80 leading-snug">{f}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <span className="inline-block bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Live Demo
                </span>
                <h2 className="text-2xl font-bold text-white mt-3 mb-1">
                  Ask Corey — <span className="text-emerald-400">Free Trial</span>
                </h2>
                <p className="text-white/50 text-sm max-w-md mx-auto">
                  RCRA hazardous waste, SPCC spill plans, SWPPP stormwater, Universal Waste, CAA air permits — 3 free questions, no credit card required.
                </p>
              </div>
              <TryCoreyChatWidget compact theme="emerald" source="ask_corey_env_hub" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-black text-white text-lg">{cfg.name}</p>
                  <p className="text-white/50 text-sm">{cfg.price}</p>
                </div>
                <Lock className="w-5 h-5 text-white/30" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/settings" className="flex-1">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 gap-2" data-testid="button-env-hub-subscribe">
                    Subscribe — View Plans <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/env-compliance-hub" className="flex-1">
                  <Button variant="outline" className="w-full h-11 border-white/20 text-white hover:bg-white/10 font-semibold gap-2" data-testid="button-env-hub-learn-more">
                    Learn More <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-center text-white/30">
                Already subscribed?{" "}
                <Link href="/settings" className="underline hover:text-white/60">Check your account settings</Link>
              </p>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <ProductGate hasAccess={hasAccess} isLoading={subLoading} product={PRODUCT_CONFIGS.env_hub}>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Mobile overlay */}
          {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* Sidebar */}
          <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-slate-900 text-white flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Environmental</p>
                  <p className="text-xs text-white/50">Compliance Hub</p>
                </div>
              </div>
              {profile?.facilityName && (
                <p className="text-xs text-white/40 mt-2 truncate">{profile.facilityName}</p>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {MODULES.map(mod => (
                <button
                  key={mod.key}
                  onClick={() => { setActiveModule(mod.key); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeModule === mod.key ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                >
                  <mod.icon className={`w-4 h-4 shrink-0 ${activeModule === mod.key ? mod.color : ""}`} />
                  {mod.label}
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-white/10">
              <p className="text-xs text-white/30 text-center">CFR 40 · EPA Compliance</p>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Topbar */}
            <div className="h-12 border-b border-border flex items-center px-4 gap-3 bg-background shrink-0">
              <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                {MODULES.find(m => m.key === activeModule)?.label}
              </span>
            </div>

            {/* Module content */}
            <div className="flex-1 overflow-y-auto">
              {activeModule === "overview" && <OverviewModule setActive={setActiveModule} />}
              {activeModule === "facility" && <FacilityModule />}
              {activeModule === "universal" && <UniversalWasteModule />}
              {activeModule === "rcra" && <HazWasteModule />}
              {activeModule === "spcc" && <SpccModule />}
              {activeModule === "stormwater" && <StormwaterModule />}
              {activeModule === "air" && <AirModule />}
              {activeModule === "corey" && (
                <div className="h-full flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
                  <AskCoreyModule facilityState={profile?.state ?? undefined} />
                </div>
              )}
            </div>
          </div>
        </div>
      </ProductGate>
    </ProtectedLayout>
  );
}
