"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AuthLoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white">
    <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70 shadow-2xl">
      Verifying session...
    </div>
  </div>
);

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}
