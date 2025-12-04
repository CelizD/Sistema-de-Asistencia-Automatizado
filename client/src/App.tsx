import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import Cameras from "./pages/Cameras";
import Monitoring from "./pages/Monitoring";
import Statistics from "./pages/Statistics";
import Rooms from "./pages/Rooms";
import Logs from "./pages/Logs";
import AdminUsers from "@/pages/AdminUsers";
import Schedules from "@/pages/Schedules";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Public landing page */}
      <Route path={"/landing"} component={Home} />
      
      {/* Dashboard routes with layout */}
      <Route path={"/"} component={() => (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      )} />
      <Route path={"/cameras"} component={() => (
        <DashboardLayout>
          <Cameras />
        </DashboardLayout>
      )} />
      <Route path={"/monitoring"} component={() => (
        <DashboardLayout>
          <Monitoring />
        </DashboardLayout>
      )} />
      <Route path={"/statistics"} component={() => (
        <DashboardLayout>
          <Statistics />
        </DashboardLayout>
      )} />
      <Route path={"/rooms"} component={() => (
        <DashboardLayout>
          <Rooms />
        </DashboardLayout>
      )} />
      <Route path={"/logs"} component={() => (
        <DashboardLayout>
          <Logs />
        </DashboardLayout>
      )} />
      <Route path="/users" component={() => (
        <DashboardLayout>
          <AdminUsers />
        </DashboardLayout>
      )} />
      <Route path="/schedules" component={() => (
        <DashboardLayout>
          <Schedules />
        </DashboardLayout>
      )} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
