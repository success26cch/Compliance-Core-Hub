import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { CartDrawer } from "@/components/CartDrawer";
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
import NotFound from "@/pages/not-found";

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <CartDrawer />
          <Router />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
