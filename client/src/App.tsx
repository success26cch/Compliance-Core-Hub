import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import BotPage from "@/pages/Bot";
import ISOManager from "@/pages/ISOManager";
import DecisionTree from "@/pages/DecisionTree";
import Settings from "@/pages/Settings";
import BrandNSwag from "@/pages/BrandNSwag";
import Mentorship from "@/pages/Mentorship";
import Resources from "@/pages/Resources";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
