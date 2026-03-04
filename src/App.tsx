import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { LanguageProvider } from "@/lib/language";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Stock from "./pages/Stock";
import Billing from "./pages/Billing";
import Udhari from "./pages/Udhari";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Apply saved theme on load
const savedTheme = localStorage.getItem("smk_theme") || "midnight-ocean";
document.documentElement.setAttribute("data-theme", savedTheme);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <StoreProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/stock" element={<Stock />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/udhari" element={<Udhari />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </StoreProvider>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
