import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, Download, ShieldCheck, Truck, FileText, Lock, CheckSquare, Square } from "lucide-react";
import { ProtectedLayout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AuditChecklistItem } from "@shared/schema";

interface ChecklistCategory {
  id: string;
  label: string;
  description: string;
  icon: typeof ClipboardCheck;
  items: { key: string; label: string; regulation?: string }[];
}

const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  {
    id: "osha",
    label: "OSHA Compliance",
    description: "29 CFR 1904 & General Industry Standards",
    icon: ShieldCheck,
    items: [
      { key: "osha-300-log", label: "OSHA 300 Log is current and accurate", regulation: "29 CFR 1904.29" },
      { key: "osha-300a-posted", label: "OSHA 300A Summary posted Feb 1 - Apr 30", regulation: "29 CFR 1904.32" },
      { key: "osha-301-forms", label: "OSHA 301 Incident Reports completed for each recordable", regulation: "29 CFR 1904.29" },
      { key: "first-aid-kits", label: "First aid kits stocked and accessible", regulation: "29 CFR 1910.151" },
      { key: "ppe-assessment", label: "PPE hazard assessment completed and documented", regulation: "29 CFR 1910.132" },
      { key: "ppe-training", label: "PPE training records on file for all employees", regulation: "29 CFR 1910.132(f)" },
      { key: "hazcom-program", label: "Written Hazard Communication program in place", regulation: "29 CFR 1910.1200" },
      { key: "sds-accessible", label: "Safety Data Sheets accessible to all employees", regulation: "29 CFR 1910.1200(g)" },
      { key: "ghs-labels", label: "All chemical containers properly labeled (GHS)", regulation: "29 CFR 1910.1200(f)" },
      { key: "emergency-action", label: "Emergency Action Plan written and communicated", regulation: "29 CFR 1910.38" },
      { key: "fire-prevention", label: "Fire Prevention Plan documented", regulation: "29 CFR 1910.39" },
      { key: "fire-extinguishers", label: "Fire extinguishers inspected monthly", regulation: "29 CFR 1910.157" },
      { key: "exit-routes", label: "Exit routes marked, unobstructed, and illuminated", regulation: "29 CFR 1910.37" },
      { key: "lockout-tagout", label: "Lockout/Tagout procedures documented and trained", regulation: "29 CFR 1910.147" },
      { key: "electrical-safety", label: "Electrical safety program implemented", regulation: "29 CFR 1910.333" },
      { key: "noise-monitoring", label: "Noise exposure monitoring completed if applicable", regulation: "29 CFR 1910.95" },
      { key: "respiratory-program", label: "Respiratory protection program if required", regulation: "29 CFR 1910.134" },
      { key: "injury-reporting", label: "Employees know how to report injuries and illnesses" },
      { key: "safety-training-docs", label: "All safety training documented with dates and signatures" },
      { key: "workplace-inspection", label: "Regular workplace safety inspections conducted and documented" },
    ],
  },
  {
    id: "dot",
    label: "DOT Compliance",
    description: "49 CFR Part 40 & FMCSA Regulations",
    icon: Truck,
    items: [
      { key: "dot-policy", label: "Written DOT Drug & Alcohol Policy in place", regulation: "49 CFR Part 40" },
      { key: "driver-qualifications", label: "Driver qualification files complete and current", regulation: "49 CFR 391.51" },
      { key: "medical-certs", label: "DOT medical certificates current for all CDL drivers", regulation: "49 CFR 391.45" },
      { key: "pre-employment-test", label: "Pre-employment drug testing program active", regulation: "49 CFR 382.301" },
      { key: "random-testing", label: "Random drug/alcohol testing pool maintained (50%/10%)", regulation: "49 CFR 382.305" },
      { key: "post-accident-proc", label: "Post-accident testing procedures documented", regulation: "49 CFR 382.303" },
      { key: "reasonable-suspicion", label: "Reasonable suspicion training for supervisors (2hrs)", regulation: "49 CFR 382.603" },
      { key: "clearinghouse-reg", label: "FMCSA Clearinghouse registration complete", regulation: "49 CFR Part 382, Subpart G" },
      { key: "clearinghouse-queries", label: "Annual Clearinghouse full queries conducted", regulation: "49 CFR 382.701" },
      { key: "pre-employment-query", label: "Pre-employment Clearinghouse queries for new hires", regulation: "49 CFR 382.701(a)" },
      { key: "return-duty-process", label: "Return-to-duty process documented with SAP info", regulation: "49 CFR Part 40, Subpart O" },
      { key: "dvir-process", label: "Driver Vehicle Inspection Reports (DVIR) process in place", regulation: "49 CFR 396.11" },
      { key: "hos-compliance", label: "Hours of Service tracking/ELD compliance", regulation: "49 CFR Part 395" },
      { key: "employee-education", label: "Employee drug/alcohol education materials distributed", regulation: "49 CFR 382.601" },
      { key: "record-retention", label: "Drug/alcohol testing records retained per requirements", regulation: "49 CFR 382.401" },
    ],
  },
];

export default function AuditPrep() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("osha");

  const { data: subscription } = useQuery<{ status: string; plan: string }>({
    queryKey: ['/api/subscription'],
    enabled: isAuthenticated,
  });

  const { data: superadminCheck } = useQuery<{ isSuperadmin: boolean }>({
    queryKey: ['/api/superadmin/check'],
    enabled: isAuthenticated,
  });

  const hasAccess = subscription?.status === 'active' || superadminCheck?.isSuperadmin === true;

  const { data: checklistData } = useQuery<AuditChecklistItem[]>({
    queryKey: ['/api/audit-checklist', activeTab],
    enabled: isAuthenticated && hasAccess,
  });

  const { data: readinessData } = useQuery<{ userId: string; category: string; completedItems: number; totalItems: number }[]>({
    queryKey: ['/api/audit-readiness'],
    enabled: isAuthenticated && hasAccess,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ category, itemKey, totalItems }: { category: string; itemKey: string; totalItems: number }) => {
      return apiRequest('POST', '/api/audit-checklist/toggle', { category, itemKey, totalItems });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audit-checklist', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['/api/audit-readiness'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update checklist item", variant: "destructive" });
    },
  });

  const completedKeys = new Set(
    (checklistData || []).filter(i => i.completed).map(i => i.itemKey)
  );

  const currentCategory = CHECKLIST_CATEGORIES.find(c => c.id === activeTab);
  const totalItems = currentCategory?.items.length || 0;
  const completedCount = currentCategory?.items.filter(i => completedKeys.has(i.key)).length || 0;
  const progressPct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const handleToggle = (itemKey: string) => {
    if (!hasAccess || toggleMutation.isPending) return;
    toggleMutation.mutate({ category: activeTab, itemKey, totalItems });
  };

  const getReadinessForCategory = (categoryId: string) => {
    const r = readinessData?.find(d => d.category === categoryId);
    if (!r || !r.totalItems) return 0;
    return Math.round((r.completedItems / r.totalItems) * 100);
  };

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary flex items-center gap-3" data-testid="text-audit-prep-title">
              <ClipboardCheck className="w-8 h-8 text-accent" />
              Audit Prep Tools
            </h1>
            <p className="text-muted-foreground mt-2">
              Interactive compliance checklists to prepare for OSHA and DOT audits. Track your progress and generate readiness reports.
            </p>
          </div>
          {hasAccess && (
            <Button
              variant="outline"
              onClick={() => window.open("/api/audit-prep/pdf-summary", "_blank")}
              data-testid="button-download-audit-summary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF Summary
            </Button>
          )}
        </div>

        {!hasAccess && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="flex items-center gap-4 py-4">
              <Lock className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Subscription Required</p>
                <p className="text-sm text-amber-600">
                  Upgrade to Unlimited Corey ($199/mo) to access interactive audit prep checklists.
                </p>
              </div>
              <Link href="/get-started">
                <Button size="sm" className="ml-auto whitespace-nowrap" data-testid="button-upgrade-audit">
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {hasAccess && readinessData && readinessData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {CHECKLIST_CATEGORIES.map((cat) => {
              const pct = getReadinessForCategory(cat.id);
              const CatIcon = cat.icon;
              return (
                <Card key={cat.id} className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setActiveTab(cat.id)} data-testid={`card-readiness-${cat.id}`}>
                  <CardContent className="p-3 text-center">
                    <CatIcon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-medium truncate">{cat.label}</p>
                    <p className={`text-lg font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {pct}%
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {CHECKLIST_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs sm:text-sm" data-testid={`tab-${cat.id}`}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CHECKLIST_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <cat.icon className="w-5 h-5 text-accent" />
                        {cat.label}
                      </CardTitle>
                      <CardDescription>{cat.description}</CardDescription>
                    </div>
                    {hasAccess && cat.id === activeTab && (
                      <div className="text-right">
                        <p className="text-sm font-medium">{completedCount} / {totalItems}</p>
                        <Progress value={progressPct} className="w-32 h-2 mt-1" data-testid="progress-checklist" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!hasAccess ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Subscribe to unlock interactive audit checklists</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const isChecked = completedKeys.has(item.key);
                        return (
                          <div
                            key={item.key}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              isChecked ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleToggle(item.key)}
                            data-testid={`checklist-item-${item.key}`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${isChecked ? 'text-green-800 line-through' : 'text-foreground'}`}>
                                {item.label}
                              </p>
                              {item.regulation && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.regulation}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </ProtectedLayout>
  );
}
