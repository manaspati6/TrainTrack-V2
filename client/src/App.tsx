import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import TrainingCatalog from "@/pages/training-catalog";
import TrainingCalendar from "@/pages/training-calendar";
import EmployeeRecords from "@/pages/employee-records";
import EmployeeManagement from "@/pages/employee-management";
import ComplianceReports from "@/pages/compliance-reports";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Login} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/training-catalog" component={TrainingCatalog} />
          <Route path="/training-calendar" component={TrainingCalendar} />
          <Route path="/employee-records" component={EmployeeRecords} />
          <Route path="/employee-management" component={EmployeeManagement} />
          <Route path="/compliance-reports" component={ComplianceReports} />
        </>
      )}
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
