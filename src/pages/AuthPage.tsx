
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useApp } from "@/contexts/AppContext";
import { Layout } from "@/components/shared/Layout";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AuthPage = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      // If already authenticated, redirect
      if (state.isAuthenticated && state.user) {
        // If user has tokens, go to home, otherwise go to tokens page
        if (state.user.tokens && state.user.tokens > 0) {
          navigate("/");
        } else {
          navigate("/tokens");
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [state.isAuthenticated, state.user, navigate]);

  if (isCheckingAuth) {
    return (
      <Layout requireAuth={false}>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth={false}>
      <AuthForm />
    </Layout>
  );
};

export default AuthPage;
