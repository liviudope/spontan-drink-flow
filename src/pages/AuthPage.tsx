
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useApp } from "@/contexts/AppContext";
import { Layout } from "@/components/shared/Layout";

const AuthPage = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect
    if (state.isAuthenticated) {
      navigate("/");
    }
  }, [state.isAuthenticated, navigate]);

  return (
    <Layout requireAuth={false}>
      <AuthForm />
    </Layout>
  );
};

export default AuthPage;
