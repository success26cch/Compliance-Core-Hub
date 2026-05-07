import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { ProtectedLayout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Lock, Check, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export function PlatformGate({ children, featureName }: { children: React.ReactNode; featureName: string }) {
  const { data: subStatus, isLoading } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="max-w-2xl mx-auto py-12 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </ProtectedLayout>
    );
  }

  const hasPlatform = (subStatus as any)?.hasPlatform || false;

  if (hasPlatform) {
    return <>{children}</>;
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2" data-testid="text-gate-title">
            {featureName} Requires the Employer Platform
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            This feature is part of the CCHUB Employer Compliance Platform. Upgrade to unlock your full compliance management system.
          </p>
        </div>

        <Card className="border-2 border-accent/50 bg-accent/5 mb-6" data-testid="card-platform-upsell">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-lg">Employer Compliance Platform</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 mb-6 text-sm">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Compliance Dashboard & Metrics</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Employee Management</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>OSHA 300 Incident Logging</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Corrective Action Plans</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Medical Passport (QR Check-in)</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>DOT Expiration Notifications</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Corey AI available as add-on</span></div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 shrink-0" /><span>Priority Action Queue</span></div>
            </div>

            <a href="mailto:teams@corecompliancehub.com?subject=Employer Platform Access Request">
              <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 gap-2" data-testid="button-upgrade-platform">
                <Crown className="w-5 h-5" />
                Contact Us for Pricing
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>

            <p className="text-xs text-center text-muted-foreground mt-3">
              A compliance specialist will reach out to discuss the right plan for your team.
            </p>
          </CardContent>
        </Card>

        {subStatus?.isPro && (
          <div className="text-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Shield className="w-3 h-3 mr-1" />
              You have Unlimited Corey (Corey AI) - upgrade for full platform access
            </Badge>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
