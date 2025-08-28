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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BotPage from "@/pages/Bot";
import AuthPage from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Create QueryClient with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                {/* Public auth route */}
                <Route path="/auth" element={<AuthPage />} />
                
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
                  <Route path="/leads-quentes" element={<div className="p-6">Leads Quentes - Em desenvolvimento</div>} />
                  <Route path="/bot" element={<BotPage />} />
                  <Route path="/analytics" element={<div className="p-6">Analytics - Em desenvolvimento</div>} />
                  <Route path="/atendentes" element={<div className="p-6">Atendentes - Em desenvolvimento</div>} />
                  <Route path="/templates" element={<div className="p-6">Templates - Em desenvolvimento</div>} />
                  <Route path="/configuracoes" element={<div className="p-6">Configurações - Em desenvolvimento</div>} />
                  <Route path="/logs" element={<div className="p-6">Logs - Em desenvolvimento</div>} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
