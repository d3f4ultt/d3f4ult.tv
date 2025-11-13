import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletConnectionProvider } from "@/components/WalletConnectionProvider";
import Dashboard from "@/pages/Dashboard";
import OBSGuide from "@/pages/OBSGuide";
import Portfolio from "@/pages/Portfolio";
import Profile from "@/pages/Profile";
import CopyTrading from "@/pages/CopyTrading";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/obs-guide" component={OBSGuide} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/profile" component={Profile} />
      <Route path="/copy-trading" component={CopyTrading} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletConnectionProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WalletConnectionProvider>
    </QueryClientProvider>
  );
}

export default App;
