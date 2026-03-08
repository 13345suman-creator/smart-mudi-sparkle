import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import { LanguageProvider } from "@/lib/language";
import PinLockScreen from "@/components/PinLockScreen";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Stock from "./pages/Stock";
import Billing from "./pages/Billing";
import Udhari from "./pages/Udhari";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Apply saved theme on load
const savedTheme = localStorage.getItem("smk_theme") || "arctic-frost";
document.documentElement.setAttribute("data-theme", savedTheme);

const AppContent = () => {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const appLock = localStorage.getItem("smk_applock");
    const pin = localStorage.getItem("smk_lockpin");
    // Only lock if user explicitly enabled app lock AND set a valid 4-digit PIN
    if (appLock !== "true" || !pin || pin.length !== 4) {
      // Clean up invalid state
      if (appLock === "true" && (!pin || pin.length !== 4)) {
        localStorage.removeItem("smk_applock");
        localStorage.removeItem("smk_lockpin");
      }
      setUnlocked(true);
    }
  }, []);

  if (!unlocked) {
    return <PinLockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
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
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
