
import { ReactNode } from "react";
import { Header } from "./Header";
import { useApp } from "@/contexts/AppContext";
import { Navigate } from "react-router-dom";

type LayoutProps = {
  children: ReactNode;
  requireAuth?: boolean;
  role?: 'client' | 'barman';
};

export const Layout = ({ children, requireAuth = true, role }: LayoutProps) => {
  const { state } = useApp();
  
  // Authentication check
  if (requireAuth && !state.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Role check if specified
  if (requireAuth && role && state.user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
