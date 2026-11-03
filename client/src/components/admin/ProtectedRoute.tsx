import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  allowCustomer?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  allowCustomer = false,
}: ProtectedRouteProps) {
  const { admin, customer, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!admin && !customer) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Customer accounts can enter the shared dashboard only.
  if (customer && !admin) {
    if (requiredRole || !allowCustomer) {
      return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
  }

  // Admin-only role checks.
  if (requiredRole && admin?.role !== requiredRole) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}