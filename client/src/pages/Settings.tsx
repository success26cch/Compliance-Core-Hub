import { ProtectedLayout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus, useCreateCheckoutSession } from "@/hooks/use-subscriptions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { data: subStatus, isLoading } = useSubscriptionStatus();
  const { mutate: checkout, isPending } = useCreateCheckoutSession();

  // Replace with actual Stripe Price ID from env or config
  const PRO_PRICE_ID = "price_1234567890"; 

  const handleUpgrade = () => {
    checkout(PRO_PRICE_ID);
  };

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold font-display text-primary">Account & Subscription</h2>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <div className="text-lg font-medium">{user?.firstName} {user?.lastName}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="text-lg font-medium">{user?.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${subStatus?.isPro ? 'border-primary' : 'border-accent'}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Pro Subscription</CardTitle>
                <CardDescription>Unlock full access to compliance tools</CardDescription>
              </div>
              {subStatus?.isPro ? (
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Active
                </span>
              ) : (
                <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">Free Plan</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mt-2">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Unlimited AI Consultant Queries</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Full Access to Decision Tree Tool</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Priority Email Support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {!subStatus?.isPro && (
              <Button 
                onClick={handleUpgrade} 
                disabled={isPending}
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12"
              >
                {isPending ? "Processing..." : "Upgrade to Pro - $29/mo"}
              </Button>
            )}
            {subStatus?.isPro && (
              <Button variant="outline" className="w-full">Manage Subscription</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
