import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import ProjectsPage from "@/modules/auth/ProjectsPage";
import { SupervisorDashboard } from "@/modules/supervisor";
import DPRDashboard from "@/modules/supervisor/DPRDashboard";
import PMDashboard from "@/modules/pm/PMDashboard";
import PMRGDashboard from "@/modules/pmrg/PMRGDashboard";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/modules/auth/contexts/AuthContext";
import { NotificationProvider } from "@/modules/auth/contexts/NotificationContext";
import { ProtectedRoute } from "@/modules/auth/components/ProtectedRoute";

// Debug log to check if SupervisorDashboard is imported
console.log("SupervisorDashboard component:", SupervisorDashboard);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/supervisor" 
                element={
                  <ProtectedRoute requiredRole="supervisor">
                    <SupervisorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dpr" 
                element={
                  <ProtectedRoute requiredRole="supervisor">
                    <DPRDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pm" 
                element={
                  <ProtectedRoute requiredRole="Site PM">
                    <PMDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pmrg" 
                element={
                  <ProtectedRoute requiredRole="PMAG">
                    <PMRGDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;