import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";
import { ConversationsPage } from "@/pages/Conversations";
import { VendedoresPage } from "@/pages/Vendedores";
import AtendentesPage from "@/pages/Atendentes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BotPage from "@/pages/Bot";
import AuthPage from "@/pages/Auth";
import SetPasswordPage from "@/pages/SetPassword";
import ResetPasswordPage from "@/pages/ResetPassword";
import LeadsQuentes from "@/pages/LeadsQuentes";
import Analytics from "@/pages/Analytics";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected full-screen routes */}
        <Route 
          path="/conversas" 
          element={
            <ProtectedRoute>
              <div className="h-screen">
                <ConversationsPage />
              </div>
            </ProtectedRoute>
          } 
        />
        
        {/* Protected layout-wrapped routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="/leads-quentes" element={<LeadsQuentes />} />
          <Route path="/bot" element={<BotPage />} />
          <Route path="/vendedores" element={<VendedoresPage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/atendentes" element={<AtendentesPage />} />
          <Route path="/templates" element={<div className="p-6">Templates - Em desenvolvimento</div>} />
          <Route path="/configuracoes" element={<div className="p-6">Configurações - Em desenvolvimento</div>} />
          <Route path="/logs" element={<div className="p-6">Logs - Em desenvolvimento</div>} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
