
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
  type AdminUser,
} from "../services/adminApi";

import {
  getCustomerSession,
  logoutCustomer,
  type CustomerSession,
} from "../services/customerApi";

function normalizeRole(role: string | null | undefined): string | null {
  if (typeof role !== "string") return null;

  const normalized = role.trim().toLowerCase();
  return normalized || null;
}

interface AuthContextValue {
  admin: AdminUser | null;
  customer: CustomerSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  admin: null,
  customer: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSession() {
    setLoading(true);

    try {
      const adminToken = localStorage.getItem("admin_token");
      const customerToken = localStorage.getItem("customer_token");

      // Restore the platform owner/admin session first.
      if (adminToken) {
        try {
          const restoredAdmin = await getMe();

          setAdmin({
            ...restoredAdmin,
            role: normalizeRole(restoredAdmin.role),
          });

          setCustomer(null);
          return;
        } catch {
          localStorage.removeItem("admin_token");
          setAdmin(null);
        }
      }

      // If there is no valid admin session, restore the customer session.
      if (customerToken) {
        try {
          const restoredCustomer = await getCustomerSession();

          setCustomer({
            ...restoredCustomer,
            role: "customer",
          });

          setAdmin(null);
          return;
        } catch {
          logoutCustomer();
          setCustomer(null);
        }
      }

      setAdmin(null);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshSession();

    const handleCustomerAuthChange = () => {
      void refreshSession();
    };

    window.addEventListener(
      "meo:customer-auth-changed",
      handleCustomerAuthChange,
    );

    return () => {
      window.removeEventListener(
        "meo:customer-auth-changed",
        handleCustomerAuthChange,
      );
    };
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);

    try {
      // Do not keep a customer session when signing in as an admin.
      logoutCustomer();

      const result = await apiLogin(email, password);

      localStorage.setItem("admin_token", result.token);

      setAdmin({
        ...result.admin,
        role: normalizeRole(result.admin.role),
      });

      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    logoutCustomer();

    setAdmin(null);
    setCustomer(null);

    void apiLogout().catch(() => {});
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        customer,
        loading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
