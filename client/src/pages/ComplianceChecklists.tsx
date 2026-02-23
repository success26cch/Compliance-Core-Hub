import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ShieldCheck, ClipboardCheck, Truck, Award, Users, ArrowLeft, Lock } from "lucide-react";
import { ProtectedLayout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  downloadUrl: string;
  category: "osha" | "dot" | "iso" | "general";
  pages: string;
}

const checklists: ChecklistItem[] = [
  {
    id: "osha-recordability",
    title: "OSHA 300 Recordability Cheat Sheet",
    description: "Quick reference for OSHA 1904 criteria including first aid vs. medical treatment, recording triggers, and common exceptions. Perfect for posting in your safety office.",
    icon: ClipboardCheck,
    downloadUrl: "/api/cheat-sheet/download",
    category: "osha",
    pages: "2 pages",
  },
  {
    id: "dot-testing",
    title: "DOT Drug & Alcohol Testing Guide",
    description: "Complete quick reference for 49 CFR Part 40. Covers testing types, 5-panel substances, alcohol thresholds, Clearinghouse requirements, and post-accident testing decisions.",
    icon: Truck,
    downloadUrl: "/api/cheat-sheet/dot-testing",
    category: "dot",
    pages: "3 pages",
  },
  {
    id: "iso-audit",
    title: "ISO Audit Prep Checklist",
    description: "Be audit-ready for ISO 9001, 14001, and 45001. 30-day countdown checklist, common findings to avoid, and questions auditors typically ask.",
    icon: Award,
    downloadUrl: "/api/cheat-sheet/iso-audit",
    category: "iso",
    pages: "4 pages",
  },
  {
    id: "safety-manager",
    title: "New Safety Manager's First 30 Days",
    description: "Your survival guide for the first month on the job. Week-by-week action items, compliance quick checks, and key metrics to start tracking.",
    icon: Users,
    downloadUrl: "/api/cheat-sheet/safety-manager",
    category: "general",
    pages: "3 pages",
  },
];

const categoryColors: Record<string, string> = {
  osha: "bg-blue-100 text-blue-700",
  dot: "bg-green-100 text-green-700",
  iso: "bg-purple-100 text-purple-700",
  general: "bg-orange-100 text-orange-700",
};

const categoryLabels: Record<string, string> = {
  osha: "OSHA",
  dot: "DOT",
  iso: "ISO",
  general: "Safety",
};

export default function ComplianceChecklists() {
  const { isAuthenticated } = useAuth();
  
  const { data: subscription } = useQuery<{ status: string; plan: string }>({
    queryKey: ['/api/subscription'],
    enabled: isAuthenticated,
  });

  const { data: superadminCheck } = useQuery<{ isSuperadmin: boolean }>({
    queryKey: ['/api/superadmin/check'],
    enabled: isAuthenticated,
  });

  const hasAccess = subscription?.status === 'active' || superadminCheck?.isSuperadmin === true;

  const handleDownload = (url: string) => {
    if (!hasAccess) return;
    window.open(url, "_blank");
  };

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary flex items-center gap-3" data-testid="text-checklists-title">
            <FileText className="w-8 h-8 text-accent" />
            Compliance Checklist Library
          </h1>
          <p className="text-muted-foreground mt-2">
            Downloadable PDF checklists and quick reference guides for OSHA, DOT, and ISO compliance.
          </p>
        </div>

        {!hasAccess && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="flex items-center gap-4 py-4">
              <Lock className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Subscription Required</p>
                <p className="text-sm text-amber-600">
                  Upgrade to Unlimited Safety ($99/mo) to download all compliance checklists.
                </p>
              </div>
              <Link href="/get-started">
                <Button size="sm" className="ml-auto whitespace-nowrap" data-testid="button-upgrade-checklists">
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {checklists.map((checklist) => {
            const Icon = checklist.icon;
            return (
              <Card key={checklist.id} className="flex flex-col" data-testid={`card-checklist-${checklist.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={categoryColors[checklist.category]}>
                      {categoryLabels[checklist.category]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{checklist.pages}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{checklist.title}</CardTitle>
                      <CardDescription className="mt-1">{checklist.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    className="w-full"
                    variant={hasAccess ? "default" : "outline"}
                    disabled={!hasAccess}
                    onClick={() => handleDownload(checklist.downloadUrl)}
                    data-testid={`button-download-${checklist.id}`}
                  >
                    {hasAccess ? (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock with Subscription
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-2">Need a custom compliance checklist for your industry?</p>
          <Link href="/bot">
            <Button variant="outline" data-testid="button-ask-corey-checklist">
              Ask Corey to Generate One
            </Button>
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  );
}
