import { ProtectedLayout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity, BookOpen, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: subStatus, isLoading } = useSubscriptionStatus();

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Stats Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Good</div>
              <p className="text-xs text-muted-foreground">All logs up to date</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Requires review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subStatus?.isPro ? "Professional" : "Free Tier"}</div>
              {!subStatus?.isPro && (
                <Link href="/settings">
                  <span className="text-xs text-accent cursor-pointer hover:underline font-medium">Upgrade to Pro &rarr;</span>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow border-primary/10 bg-gradient-to-br from-white to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Ask the Expert Bot
                <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">AI Powered</span>
              </CardTitle>
              <CardDescription>
                Get instant answers for OSHA 1904 and DOT regulations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/bot">
                <Button className="w-full sm:w-auto gap-2">
                  Start Chat <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-primary/10">
            <CardHeader>
              <CardTitle>Recordability Decision Tree</CardTitle>
              <CardDescription>
                Determine if an injury is OSHA recordable in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/decision-tree">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  Start Assessment <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}
