import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";
import { ConversationsPage } from "@/pages/Conversations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Full-screen routes */}
          <Route path="/conversas" element={<ConversationsPage />} />
          
          {/* Layout-wrapped routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/leads-quentes" element={<div className="p-6">Leads Quentes - Em desenvolvimento</div>} />
            <Route path="/bot" element={<div className="p-6">Bot Inteligente - Em desenvolvimento</div>} />
            <Route path="/analytics" element={<div className="p-6">Analytics - Em desenvolvimento</div>} />
            <Route path="/atendentes" element={<div className="p-6">Atendentes - Em desenvolvimento</div>} />
            <Route path="/templates" element={<div className="p-6">Templates - Em desenvolvimento</div>} />
            <Route path="/configuracoes" element={<div className="p-6">Configurações - Em desenvolvimento</div>} />
            <Route path="/logs" element={<div className="p-6">Logs - Em desenvolvimento</div>} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
