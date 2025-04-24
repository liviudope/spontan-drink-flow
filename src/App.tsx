
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import OrderPage from "./pages/OrderPage";
import BarmanPage from "./pages/BarmanPage";
import CheckinPage from "./pages/CheckinPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";
import TokensPage from "./pages/TokensPage";
import { useEffect } from "react";
import { useToast } from "./hooks/use-toast";

const queryClient = new QueryClient();

// Protected route component that requires tokens
const TokenProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { state } = useApp();
  const { toast } = useToast();
  
  useEffect(() => {
    // If user has no tokens, show a message
    if (state.isAuthenticated && state.user?.tokens === 0) {
      toast({
        title: "Tokens necesari",
        description: "Nu ai tokens în cont. Te rugăm să achiziționezi tokens pentru a continua.",
        variant: "default",
        duration: 5000,
      });
    }
  }, [state.isAuthenticated, state.user?.tokens]);
  
  // If not authenticated, redirect to auth
  if (!state.isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  // If authenticated but no tokens, redirect to tokens page
  if (state.user?.tokens === 0) {
    return <Navigate to="/tokens" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { state } = useApp();
  
  // Check authentication status on route change
  useEffect(() => {
    // This will run whenever routes change, checking authentication status
    // The actual check for session token is done in AppProvider
  }, []);
  
  return (
    <Routes>
      <Route path="/" element={
        <TokenProtectedRoute>
          <Index />
        </TokenProtectedRoute>
      } />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/order" element={
        <TokenProtectedRoute>
          <OrderPage />
        </TokenProtectedRoute>
      } />
      <Route path="/barman" element={<BarmanPage />} />
      <Route path="/checkin" element={
        <TokenProtectedRoute>
          <CheckinPage />
        </TokenProtectedRoute>
      } />
      <Route path="/history" element={
        <TokenProtectedRoute>
          <HistoryPage />
        </TokenProtectedRoute>
      } />
      <Route path="/tokens" element={
        state.isAuthenticated ? <TokensPage /> : <Navigate to="/auth" />
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
