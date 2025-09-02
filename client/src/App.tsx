import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import RoleSelectionPage from "@/pages/role-selection";
import RestaurantDashboard from "@/pages/restaurant-dashboard";
import AdminPanel from "@/pages/admin-panel";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/restaurant-dashboard" component={RestaurantDashboard} />
      <ProtectedRoute path="/admin-panel" component={AdminPanel} />
      <ProtectedRoute path="/checkout" component={Checkout} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/role-selection" component={RoleSelectionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
