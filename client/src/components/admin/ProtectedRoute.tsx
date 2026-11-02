import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { admin, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const adminRole = admin.role?.trim().toLowerCase();
  const requiredRoleName = requiredRole?.trim().toLowerCase();

  if (adminRole === "platform_owner" && location.pathname === "/admin") {
    return <Navigate to="/platform-owner" replace />;
  }

  if (requiredRoleName && adminRole !== requiredRoleName) {
    return (
      <Navigate
        to="/admin"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <>{children}</>;
}
