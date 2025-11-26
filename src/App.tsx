import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Projects from "@/modules/auth/Projects";
import ProjectsPage from "@/modules/auth/ProjectsPage";
import { SupervisorDashboard } from "@/modules/supervisor";
import { PMDashboard } from "@/modules/pm";
import { PMRGDashboard } from "@/modules/pmrg";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/modules/auth/contexts/AuthContext";
import { ProtectedRoute } from "@/modules/auth/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
              path="/dashboard-selection" 
              element={
                <ProtectedRoute>
                  <Projects />
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;