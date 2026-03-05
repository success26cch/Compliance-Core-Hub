import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { CartDrawer } from "@/components/CartDrawer";
import { AdminViewProvider } from "@/hooks/use-admin-view";
import { ThemeProvider } from "next-themes";
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
import PlatformBrief from "@/pages/PlatformBrief";
import Cesar from "@/pages/Cesar";
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
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: location }),
    }).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/bot" component={BotPage} />
      <Route path="/iso-manager" component={ISOManager} />
      <Route path="/decision-tree" component={DecisionTree} />
      <Route path="/settings" component={Settings} />
      <Route path="/brandnswag" component={BrandNSwag} />
      <Route path="/mentorship" component={Mentorship} />
      <Route path="/resources" component={Resources} />
      <Route path="/contact" component={Contact} />
      <Route path="/admin/inquiries" component={AdminInquiries} />
      <Route path="/employees" component={Employees} />
      <Route path="/incidents" component={Incidents} />
      <Route path="/superadmin" component={SuperAdmin} />
      <Route path="/leads" component={LeadsAdmin} />
      <Route path="/dot-notifications" component={DOTNotifications} />
      <Route path="/employee-passport" component={EmployeePassport} />
      <Route path="/clinic-assistant" component={ClinicAssistant} />
      <Route path="/bma-subscription" component={BMASubscription} />
      <Route path="/clinic-agreement" component={ClinicAgreement} />
      <Route path="/demo" component={Demo} />
      <Route path="/sms-consent" component={SMSConsent} />
      <Route path="/training" component={Training} />
      <Route path="/training/:id" component={CourseViewer} />
      <Route path="/employer-training" component={EmployerTraining} />
      <Route path="/employee-training" component={EmployeeTraining} />
      <Route path="/drug-alcohol-policy" component={DrugAlcoholPolicy} />
      <Route path="/clinic-letter" component={ClinicLetter} />
      <Route path="/corey" component={CoreyStandalone} />
      <Route path="/try-corey" component={TryCorey} />
      <Route path="/qr-code" component={QRCodePage} />
      <Route path="/team-seats" component={TeamSeats} />
      <Route path="/about" component={About} />
      <Route path="/company-profile" component={CompanyProfile} />
      <Route path="/get-started" component={GetStarted} />
      <Route path="/compliance-checklists" component={ComplianceChecklists} />
      <Route path="/audit-prep" component={AuditPrep} />
      <Route path="/compliance-glossary" component={ComplianceGlossary} />
      <Route path="/meet-corey" component={MeetCorey} />
      <Route path="/meet-isa" component={MeetIsa} />
      <Route path="/demo-tour" component={DemoTour} />
      <Route path="/platform-brief" component={PlatformBrief} />
      <Route path="/cesar" component={Cesar} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="cchub-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <AdminViewProvider>
              <Toaster />
              <CartDrawer />
              <PageTracker />
              <Router />
            </AdminViewProvider>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
