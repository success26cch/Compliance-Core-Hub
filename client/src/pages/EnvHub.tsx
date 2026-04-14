import { useState, useRef, useEffect } from "react";
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
import {
  Leaf, Recycle, Flame, Droplets, Wind, Factory, BarChart3,
  Plus, Trash2, CheckCircle2, AlertTriangle, Clock, FileText,
  ClipboardList, ChevronRight, X, Loader2, Send, Bot,
  Building2, Shield, RefreshCw, Menu, ChevronDown
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacilityProfile { userId: string; facilityName: string; address: string; city: string; state: string; sicCode: string; naicsCode: string; epaId: string; hasStacks: boolean; hasBoilers: boolean; hasStorageTanks: boolean; oilStorageGallons: number; generatorStatus: string; hasSpccPlan: boolean; spccPlanDate: string; hasSwppp: boolean; hasAirPermit: boolean; permitType: string; notes: string; }
interface UniversalWaste { id: number; wasteType: string; description: string; location: string; quantity: string; unit: string; startDate: string; disposalDate: string; status: string; notes: string; }
interface HazWasteSap { id: number; sapName: string; location: string; wasteTypes: string[]; maxCapacityGallons: number; containerCount: number; isActive: boolean; lastInspectionDate: string; notes: string; }
interface SapInspection { id: number; sapId: number; inspectedDate: string; inspectedBy: string; containersIntact: boolean; containersLabeled: boolean; areaClean: boolean; noLeaks: boolean; findings: string; pass: boolean; }
interface Manifest { id: number; manifestNumber: string; shipmentDate: string; tsdfName: string; tsdfEpaId: string; wasteDescription: string; quantity: string; unit: string; returnedDate: string; status: string; notes: string; }
interface GeneratorMonth { id: number; month: string; wasteKg: number; wasteType: string; notes: string; }
interface SpccTank { id: number; tankName: string; location: string; contentType: string; capacityGallons: number; hasSecondaryContainment: boolean; containmentCapacityGallons: number; lastInspectionDate: string; isAboveground: boolean; isActive: boolean; notes: string; }
interface SpccInspection { id: number; tankId: number; inspectedDate: string; inspectedBy: string; inspectionType: string; tankIntegrity: boolean; containmentIntegrity: boolean; noLeaksOrSpills: boolean; valvesOperable: boolean; findings: string; pass: boolean; }
interface StormwaterMonitor { id: number; monitoringDate: string; quarter: string; year: number; outfallId: string; conductedBy: string; weatherConditions: string; color: string; odor: string; floating: boolean; sheen: boolean; turbidity: string; otherObservations: string; actionRequired: boolean; correctionTaken: string; }
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

function SpccModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState("tanks");
  const [showAddTank, setShowAddTank] = useState(false);
  const [showInspect, setShowInspect] = useState<SpccTank | null>(null);
  const [tankForm, setTankForm] = useState({ tankName: "", location: "", contentType: "", capacityGallons: "", hasSecondaryContainment: false, containmentCapacityGallons: "", isAboveground: true, notes: "" });
  const [inspForm, setInspForm] = useState({ inspectedDate: new Date().toISOString().split("T")[0], inspectedBy: "", inspectionType: "monthly", tankIntegrity: true, containmentIntegrity: true, noLeaksOrSpills: true, valvesOperable: true, findings: "" });

  const { data: tanks = [] } = useQuery<SpccTank[]>({ queryKey: ["/api/env/spcc-tanks"], staleTime: Infinity });
  const { data: inspections = [] } = useQuery<SpccInspection[]>({ queryKey: ["/api/env/spcc-inspections"], staleTime: Infinity });

  const addTank = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/spcc-tanks", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/spcc-tanks"] }); setShowAddTank(false); toast({ title: "Tank added" }); } });
  const delTank = useMutation({ mutationFn: (id: number) => apiRequest("DELETE", `/api/env/spcc-tanks/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/env/spcc-tanks"] }) });
  const addInspection = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/env/spcc-inspections", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/spcc-inspections"] }); qc.invalidateQueries({ queryKey: ["/api/env/spcc-tanks"] }); setShowInspect(null); toast({ title: "Inspection logged" }); }
  });

  const totalGallons = (tanks as SpccTank[]).reduce((sum, t) => sum + (t.capacityGallons ?? 0), 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">SPCC / Oil Spill Prevention</h2>
        <p className="text-sm text-muted-foreground">40 CFR Part 112 · Spill Prevention, Control & Countermeasure</p>
      </div>

      {totalGallons >= 1320 && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          Your logged total storage ({totalGallons.toLocaleString()} gallons) meets or exceeds the 1,320-gallon threshold. SPCC regulations likely apply to this facility.
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="tanks">Tank Registry</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="tanks" className="space-y-4 pt-2">
          <div className="flex justify-end"><Button size="sm" onClick={() => setShowAddTank(true)}><Plus className="w-4 h-4 mr-1" />Add Tank / Container</Button></div>
          {(tanks as SpccTank[]).length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No tanks or oil containers registered yet.</div>
          ) : (
            <div className="space-y-3">
              {(tanks as SpccTank[]).map(tank => {
                const lastDays = tank.lastInspectionDate ? daysSince(tank.lastInspectionDate) : 999;
                return (
                  <div key={tank.id} className={`border rounded-xl p-4 ${lastDays > 30 ? "border-yellow-300 bg-yellow-50" : "border-border bg-card"}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{tank.tankName}</p>
                          <Badge className="text-xs bg-blue-100 text-blue-700">{tank.contentType || "Oil"}</Badge>
                          {tank.hasSecondaryContainment ? <Badge className="text-xs bg-emerald-100 text-emerald-700">Secondary Containment ✓</Badge> : <Badge className="text-xs bg-red-100 text-red-700">No Secondary Containment</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{tank.location}</p>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          {tank.capacityGallons && <span>{tank.capacityGallons.toLocaleString()} gal capacity</span>}
                          <span>Last inspection: <strong>{tank.lastInspectionDate ? fmtDate(tank.lastInspectionDate) : "Never"}</strong></span>
                        </div>
                        {lastDays > 30 && <Badge className="mt-2 bg-yellow-100 text-yellow-700 text-xs">Monthly inspection overdue</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowInspect(tank)}>Inspect</Button>
                        <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => delTank.mutate(tank.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="border border-border rounded-lg p-3 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">Total Regulated Oil Storage</span>
                <span className="font-bold">{totalGallons.toLocaleString()} gallons</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4 pt-2">
          {(inspections as SpccInspection[]).length === 0 ? (
            <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No inspections logged yet. Click "Inspect" on a tank to record an inspection.</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs"><tr><th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Inspector</th><th className="text-left p-3">Result</th><th className="text-left p-3">Findings</th></tr></thead>
                <tbody>
                  {(inspections as SpccInspection[]).map(ins => (
                    <tr key={ins.id} className="border-t border-border">
                      <td className="p-3">{fmtDate(ins.inspectedDate)}</td>
                      <td className="p-3 capitalize">{ins.inspectionType}</td>
                      <td className="p-3 text-muted-foreground">{ins.inspectedBy || "—"}</td>
                      <td className="p-3">{ins.pass ? <Badge className="bg-emerald-100 text-emerald-700 text-xs">Pass</Badge> : <Badge variant="destructive" className="text-xs">Fail</Badge>}</td>
                      <td className="p-3 text-muted-foreground text-xs">{ins.findings || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Tank Dialog */}
      <Dialog open={showAddTank} onOpenChange={setShowAddTank}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Tank / Oil Container</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Tank Name *</Label><Input value={tankForm.tankName} onChange={e => setTankForm(f => ({ ...f, tankName: e.target.value }))} placeholder="e.g. Diesel AST #1" /></div>
            <div className="space-y-1"><Label>Location</Label><Input value={tankForm.location} onChange={e => setTankForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Content Type</Label>
              <Select value={tankForm.contentType} onValueChange={v => setTankForm(f => ({ ...f, contentType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select content" /></SelectTrigger>
                <SelectContent><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="used_oil">Used Oil</SelectItem><SelectItem value="hydraulic">Hydraulic Oil</SelectItem><SelectItem value="gasoline">Gasoline</SelectItem><SelectItem value="lube_oil">Lube Oil</SelectItem><SelectItem value="other">Other Oil</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Capacity (gallons)</Label><Input type="number" value={tankForm.capacityGallons} onChange={e => setTankForm(f => ({ ...f, capacityGallons: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Containment Capacity (gal)</Label><Input type="number" value={tankForm.containmentCapacityGallons} onChange={e => setTankForm(f => ({ ...f, containmentCapacityGallons: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={tankForm.hasSecondaryContainment} onChange={e => setTankForm(f => ({ ...f, hasSecondaryContainment: e.target.checked }))} className="accent-primary" /><span className="text-sm">Has Secondary Containment</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={tankForm.isAboveground} onChange={e => setTankForm(f => ({ ...f, isAboveground: e.target.checked }))} className="accent-primary" /><span className="text-sm">Aboveground Storage Tank (AST)</span></label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTank(false)}>Cancel</Button>
            <Button onClick={() => addTank.mutate({ ...tankForm, capacityGallons: Number(tankForm.capacityGallons) || null, containmentCapacityGallons: Number(tankForm.containmentCapacityGallons) || null })} disabled={addTank.isPending || !tankForm.tankName}>
              {addTank.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Tank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection Dialog */}
      <Dialog open={!!showInspect} onOpenChange={() => setShowInspect(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>SPCC Inspection — {showInspect?.tankName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={inspForm.inspectedDate} onChange={e => setInspForm(f => ({ ...f, inspectedDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Type</Label>
                <Select value={inspForm.inspectionType} onValueChange={v => setInspForm(f => ({ ...f, inspectionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Inspector Name</Label><Input value={inspForm.inspectedBy} onChange={e => setInspForm(f => ({ ...f, inspectedBy: e.target.value }))} /></div>
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Inspection Checklist</p>
              {([["tankIntegrity","Tank structure integrity — no dents, corrosion, or damage"],["containmentIntegrity","Secondary containment intact and free of water/debris"],["noLeaksOrSpills","No leaks, drips, or staining around tank or fittings"],["valvesOperable","All valves and fittings operable and properly closed"]] as [keyof typeof inspForm, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!inspForm[key]} onChange={e => setInspForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-primary" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
            <div className="space-y-1"><Label>Findings</Label><Textarea value={inspForm.findings} onChange={e => setInspForm(f => ({ ...f, findings: e.target.value }))} rows={2} placeholder="Any issues or corrective actions needed..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInspect(null)}>Cancel</Button>
            <Button onClick={() => addInspection.mutate({ ...inspForm, tankId: showInspect!.id })} disabled={addInspection.isPending}>
              {addInspection.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Log Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Stormwater Module ────────────────────────────────────────────────────────

function StormwaterModule() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    monitoringDate: new Date().toISOString().split("T")[0],
    quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
    year: new Date().getFullYear(),
    outfallId: "",
    conductedBy: "",
    weatherConditions: "",
    color: "clear",
    odor: "none",
    floating: false,
    sheen: false,
    turbidity: "clear",
    otherObservations: "",
    actionRequired: false,
    correctionTaken: "",
  });

  const { data: events = [] } = useQuery<StormwaterMonitor[]>({ queryKey: ["/api/env/stormwater-monitoring"], staleTime: Infinity });
  const addEvent = useMutation({ mutationFn: (d: any) => apiRequest("POST", "/api/env/stormwater-monitoring", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/env/stormwater-monitoring"] }); setShowAdd(false); toast({ title: "Monitoring event logged" }); } });
  const del = useMutation({ mutationFn: (id: number) => apiRequest("DELETE", `/api/env/stormwater-monitoring/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/env/stormwater-monitoring"] }) });

  const thisYear = new Date().getFullYear();
  const thisYearEvents = (events as StormwaterMonitor[]).filter(e => e.year === thisYear);
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const completedQuarters = new Set(thisYearEvents.map(e => e.quarter));
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
  const dueQuarters = quarters.slice(0, currentQ).filter(q => !completedQuarters.has(q));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">Stormwater / SWPPP</h2>
        <p className="text-sm text-muted-foreground">NPDES Industrial Permit · 40 CFR Part 122 · Quarterly Visual Monitoring</p>
      </div>

      {dueQuarters.length > 0 && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-yellow-800">Monitoring event(s) overdue: {dueQuarters.join(", ")} {thisYear}</p>
            <p className="text-yellow-700 mt-0.5">NPDES industrial permits require quarterly visual monitoring of outfalls during rain events.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {quarters.map(q => {
          const done = completedQuarters.has(q);
          const due = quarters.indexOf(q) < currentQ;
          return (
            <div key={q} className={`border rounded-lg p-3 text-center text-sm ${done ? "border-emerald-200 bg-emerald-50" : due ? "border-yellow-200 bg-yellow-50" : "border-border bg-card"}`}>
              <p className="font-bold">{q} {thisYear}</p>
              <p className={`text-xs mt-1 ${done ? "text-emerald-600" : due ? "text-yellow-600" : "text-muted-foreground"}`}>{done ? "✓ Complete" : due ? "⚠ Due" : "Upcoming"}</p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end"><Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" />Log Monitoring Event</Button></div>

      {(events as StormwaterMonitor[]).length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">No stormwater monitoring events logged yet.</div>
      ) : (
        <div className="space-y-3">
          {(events as StormwaterMonitor[]).map(ev => (
            <div key={ev.id} className={`border rounded-xl p-4 ${ev.actionRequired ? "border-red-300 bg-red-50" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className="bg-cyan-100 text-cyan-700">{ev.quarter} {ev.year}</Badge>
                    {ev.outfallId && <span className="text-xs text-muted-foreground">Outfall {ev.outfallId}</span>}
                    {ev.actionRequired && <Badge variant="destructive" className="text-xs">Action Required</Badge>}
                  </div>
                  <p className="text-sm font-medium">{fmtDate(ev.monitoringDate)}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>By: {ev.conductedBy || "—"}</span>
                    <span>Color: {ev.color}</span>
                    <span>Odor: {ev.odor}</span>
                    {ev.sheen && <span className="text-red-600 font-medium">⚠ Sheen observed</span>}
                    {ev.floating && <span className="text-red-600 font-medium">⚠ Floating material</span>}
                  </div>
                  {ev.correctionTaken && <p className="text-xs text-emerald-600 mt-1">Correction: {ev.correctionTaken}</p>}
                </div>
                <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => del.mutate(ev.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Stormwater Monitoring Event</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Date *</Label><Input type="date" value={form.monitoringDate} onChange={e => setForm(f => ({ ...f, monitoringDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Quarter</Label>
                <Select value={form.quarter} onValueChange={v => setForm(f => ({ ...f, quarter: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Q1","Q2","Q3","Q4"].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Outfall ID</Label><Input value={form.outfallId} onChange={e => setForm(f => ({ ...f, outfallId: e.target.value }))} placeholder="e.g. 001" /></div>
              <div className="space-y-1"><Label>Conducted By</Label><Input value={form.conductedBy} onChange={e => setForm(f => ({ ...f, conductedBy: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Weather Conditions</Label><Input value={form.weatherConditions} onChange={e => setForm(f => ({ ...f, weatherConditions: e.target.value }))} placeholder="e.g. Moderate rain, 55°F" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Color</Label>
                <Select value={form.color} onValueChange={v => setForm(f => ({ ...f, color: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="clear">Clear</SelectItem><SelectItem value="light_brown">Light Brown</SelectItem><SelectItem value="brown">Brown</SelectItem><SelectItem value="gray">Gray</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Odor</Label>
                <Select value={form.odor} onValueChange={v => setForm(f => ({ ...f, odor: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="mild">Mild</SelectItem><SelectItem value="strong">Strong</SelectItem><SelectItem value="chemical">Chemical</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Turbidity</Label>
                <Select value={form.turbidity} onValueChange={v => setForm(f => ({ ...f, turbidity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="clear">Clear</SelectItem><SelectItem value="slightly_turbid">Slightly Turbid</SelectItem><SelectItem value="turbid">Turbid</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.floating} onChange={e => setForm(f => ({ ...f, floating: e.target.checked }))} className="accent-primary" />Floating Material</label>
              <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.sheen} onChange={e => setForm(f => ({ ...f, sheen: e.target.checked }))} className="accent-primary" />Oil Sheen</label>
              <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.actionRequired} onChange={e => setForm(f => ({ ...f, actionRequired: e.target.checked }))} className="accent-primary text-red-500" />Action Required</label>
            </div>
            <div className="space-y-1"><Label>Other Observations</Label><Textarea value={form.otherObservations} onChange={e => setForm(f => ({ ...f, otherObservations: e.target.value }))} rows={2} /></div>
            {form.actionRequired && <div className="space-y-1"><Label>Corrective Action Taken</Label><Textarea value={form.correctionTaken} onChange={e => setForm(f => ({ ...f, correctionTaken: e.target.value }))} rows={2} /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addEvent.mutate(form)} disabled={addEvent.isPending}>
              {addEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Log Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

export default function EnvHub() {
  const { user } = useAuth();
  const { data: sub, isLoading: subLoading } = useSubscriptionStatus();
  const [activeModule, setActiveModule] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile } = useQuery<FacilityProfile | null>({ queryKey: ["/api/env/facility-profile"], staleTime: Infinity });

  const hasAccess = !!(sub?.hasEnvHub || sub?.isAdmin);

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
