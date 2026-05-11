import { useEffect, useLayoutEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { CartDrawer } from "@/components/CartDrawer";
import { AdminViewProvider } from "@/hooks/use-admin-view";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { useSubscriptionStatus } from "@/hooks/use-subscriptions";
import { Loader2, ShieldCheck } from "lucide-react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import BotPage from "@/pages/Bot";
import ISOManager from "@/pages/ISOManager";
import DecisionTree from "@/pages/DecisionTree";
import Settings from "@/pages/Settings";
import BrandNSwag from "@/pages/BrandNSwag";
import Mentorship from "@/pages/Mentorship";
import Resources from "@/pages/Resources";
import Contact from "@/pages/Contact";
import AdminInquiries from "@/pages/AdminInquiries";
import Employees from "@/pages/Employees";
import Incidents from "@/pages/Incidents";
import SuperAdmin from "@/pages/SuperAdmin";
import LeadsAdmin from "@/pages/LeadsAdmin";
import DOTNotifications from "@/pages/DOTNotifications";
import EmployeePassport from "@/pages/EmployeePassport";
import ClinicAssistant from "@/pages/ClinicAssistant";
import BMASubscription from "@/pages/BMASubscription";
import BMA from "@/pages/BMA";
import ClinicAgreement from "@/pages/ClinicAgreement";
import Demo from "@/pages/Demo";
import SMSConsent from "@/pages/SMSConsent";
import Training from "@/pages/Training";
import CourseViewer from "@/pages/CourseViewer";
import EmployerTraining from "@/pages/EmployerTraining";
import EmployeeTraining from "@/pages/EmployeeTraining";
import DrugAlcoholPolicy from "@/pages/DrugAlcoholPolicy";
import ClinicLetter from "@/pages/ClinicLetter";
import CoreyStandalone from "@/pages/Corey";
import TeamSeats from "@/pages/TeamSeats";
import About from "@/pages/About";
import CompanyProfile from "@/pages/CompanyProfile";
import GetStarted from "@/pages/GetStarted";
import ComplianceChecklists from "@/pages/ComplianceChecklists";
import AuditPrep from "@/pages/AuditPrep";
import TryCorey from "@/pages/TryCorey";
import QRCodePage from "@/pages/QRCode";
import ComplianceGlossary from "@/pages/ComplianceGlossary";
import MeetCorey from "@/pages/MeetCorey";
import MeetIsa from "@/pages/MeetIsa";
import DemoTour from "@/pages/DemoTour";
import WatchDemo from "@/pages/WatchDemo";
import PlatformBrief from "@/pages/PlatformBrief";
import Cesar from "@/pages/Cesar";
import ISOManagerMarketing from "@/pages/ISOManagerMarketing";
import DotComplianceHub from "@/pages/DotComplianceHub";
import DotHub from "@/pages/DotHub";
import MarketingQR from "@/pages/MarketingQR";
import WelcomeCorey from "@/pages/WelcomeCorey";
import CoreyProfile from "@/pages/CoreyProfile";
import IsaStandalone from "@/pages/Isa";
import IsaProfile from "@/pages/IsaProfile";
import WelcomeIsa from "@/pages/WelcomeIsa";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import EmployerDashboard from "@/pages/EmployerDashboard";
import RefundPolicy from "@/pages/RefundPolicy";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Security from "@/pages/Security";
import DCRReviewPage from "@/pages/DCRReviewPage";
import EnvComplianceHub from "@/pages/EnvComplianceHub";
import EnvHub from "@/pages/EnvHub";
import BmaPatientPhone from "@/pages/BmaPatientPhone";
import NotFound from "@/pages/not-found";

function PageTracker() {
  const [location] = useLocation();
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    const scrollTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollTop();
    const raf = requestAnimationFrame(scrollTop);
    const timer = setTimeout(scrollTop, 100);
    // Generate or retrieve a session ID so visits from the same browser session can be grouped
    let sessionId = sessionStorage.getItem("cchub_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("cchub_session_id", sessionId);
    }
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: location, sessionId }),
    }).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [location]);
  return null;
}

// ── Subscription wall shown to authenticated-but-unpaid users ─────────────
function SubscriptionWall() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-orange-500/10 border-2 border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <ShieldCheck className="w-8 h-8 text-orange-500" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Subscription Required</h1>
      <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
        Your account doesn't have an active subscription. Choose a plan to unlock Core Compliance Hub.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/get-started"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
        >
          View Plans &amp; Get Started →
        </a>
        <a
          href="/login"
          className="border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-medium px-6 py-3 rounded-lg transition-colors text-sm"
        >
          Sign in with a different account
        </a>
      </div>
      <p className="mt-6 text-xs text-slate-600">
        Already purchased?{" "}
        <a href="mailto:team@corecompliancehub.com" className="text-orange-400 hover:underline">
          Contact us
        </a>{" "}
        to activate your account.
      </p>
    </div>
  );
}

// ── Protected route: requires auth + active subscription (or superadmin) ──
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: subStatus, isLoading: subLoading } = useSubscriptionStatus();
  const [, navigate] = useLocation();

  useLayoutEffect(() => {
    if (!authLoading && !subLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, subLoading, user, navigate]);

  if (authLoading || subLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const hasAccess = !!user.isSuperadmin || !!subStatus?.isPro || !!subStatus?.isAdmin;
  if (!hasAccess) {
    return <SubscriptionWall />;
  }

  return (
    <PageErrorBoundary pageName={Component.displayName ?? Component.name}>
      <Component />
    </PageErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      {/* ── Public routes — no auth required ── */}
      <Route path="/login" component={Login} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/" component={Landing} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/security" component={Security} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/get-started" component={GetStarted} />
      <Route path="/meet-corey" component={MeetCorey} />
      <Route path="/meet-isa" component={MeetIsa} />
      <Route path="/meet-iso-manager" component={ISOManagerMarketing} />
      <Route path="/try-corey" component={TryCorey} />
      <Route path="/compliance-glossary" component={ComplianceGlossary} />
      <Route path="/platform-brief" component={PlatformBrief} />
      <Route path="/demo-tour" component={DemoTour} />
      <Route path="/watch-demo" component={WatchDemo} />
      <Route path="/dot-compliance-hub" component={DotComplianceHub} />
      <Route path="/env-compliance-hub" component={EnvComplianceHub} />
      <Route path="/marketing-qr" component={MarketingQR} />
      <Route path="/qr-code" component={QRCodePage} />
      <Route path="/employee-passport" component={EmployeePassport} />
      <Route path="/clinic-assistant" component={ClinicAssistant} />
      <Route path="/bma" component={BMA} />
      <Route path="/bma-patient/:sessionId" component={BmaPatientPhone} />
      <Route path="/bma-subscription" component={BMASubscription} />
      <Route path="/clinic-agreement" component={ClinicAgreement} />
      <Route path="/sms-consent" component={SMSConsent} />
      <Route path="/demo" component={Demo} />
      <Route path="/iso/review/:token" component={DCRReviewPage} />
      <Route path="/corey-profile" component={CoreyProfile} />
      <Route path="/isa-profile" component={IsaProfile} />
      <Route path="/welcome-corey" component={WelcomeCorey} />
      <Route path="/welcome-isa" component={WelcomeIsa} />

      {/* ── Protected routes — require auth + active subscription or superadmin ── */}
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/employer-dashboard">{() => <ProtectedRoute component={EmployerDashboard} />}</Route>
      <Route path="/bot">{() => <ProtectedRoute component={BotPage} />}</Route>
      <Route path="/iso-manager">{() => <ProtectedRoute component={ISOManager} />}</Route>
      <Route path="/decision-tree">{() => <ProtectedRoute component={DecisionTree} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/brandnswag">{() => <ProtectedRoute component={BrandNSwag} />}</Route>
      <Route path="/mentorship">{() => <ProtectedRoute component={Mentorship} />}</Route>
      <Route path="/resources">{() => <ProtectedRoute component={Resources} />}</Route>
      <Route path="/employees">{() => <ProtectedRoute component={Employees} />}</Route>
      <Route path="/incidents">{() => <ProtectedRoute component={Incidents} />}</Route>
      <Route path="/training">{() => <ProtectedRoute component={Training} />}</Route>
      <Route path="/training/:id">{() => <ProtectedRoute component={CourseViewer} />}</Route>
      <Route path="/employer-training">{() => <ProtectedRoute component={EmployerTraining} />}</Route>
      <Route path="/employee-training">{() => <ProtectedRoute component={EmployeeTraining} />}</Route>
      <Route path="/drug-alcohol-policy">{() => <ProtectedRoute component={DrugAlcoholPolicy} />}</Route>
      <Route path="/clinic-letter">{() => <ProtectedRoute component={ClinicLetter} />}</Route>
      <Route path="/corey">{() => <ProtectedRoute component={CoreyStandalone} />}</Route>
      <Route path="/isa">{() => <ProtectedRoute component={IsaStandalone} />}</Route>
      <Route path="/team-seats">{() => <ProtectedRoute component={TeamSeats} />}</Route>
      <Route path="/company-profile">{() => <ProtectedRoute component={CompanyProfile} />}</Route>
      <Route path="/compliance-checklists">{() => <ProtectedRoute component={ComplianceChecklists} />}</Route>
      <Route path="/audit-prep">{() => <ProtectedRoute component={AuditPrep} />}</Route>
      <Route path="/cesar">{() => <ProtectedRoute component={Cesar} />}</Route>
      <Route path="/dot-hub">{() => <ProtectedRoute component={DotHub} />}</Route>
      <Route path="/env-hub">{() => <ProtectedRoute component={EnvHub} />}</Route>
      <Route path="/superadmin">{() => <ProtectedRoute component={SuperAdmin} />}</Route>
      <Route path="/leads">{() => <ProtectedRoute component={LeadsAdmin} />}</Route>
      <Route path="/admin/inquiries">{() => <ProtectedRoute component={AdminInquiries} />}</Route>
      <Route path="/dot-notifications">{() => <ProtectedRoute component={DOTNotifications} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} storageKey="cchub-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <AdminViewProvider>
              <Toaster />
              <CartDrawer />
              <PageTracker />
              <PageErrorBoundary>
                <Router />
              </PageErrorBoundary>
            </AdminViewProvider>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
