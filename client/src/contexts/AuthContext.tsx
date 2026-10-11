
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
  type AdminUser,
} from "../services/adminApi";

interface AuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  admin: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        // Validate the saved session with your backend.
        // This requires a session-validation function in adminApi.
        const restoredAdmin = await validateSavedSession();

        if (!cancelled) {
          setAdmin(restoredAdmin);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem("admin_token");
          setAdmin(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);

    try {
      const result = await apiLogin(email, password);

      localStorage.setItem("admin_token", result.token);
      setAdmin(result.admin);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    setAdmin(null);

    void apiLogout().catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Connect this to your backend's existing authenticated
 * current-admin/session endpoint.
 */
async function validateSavedSession(): Promise<AdminUser> {
  const { getCurrentAdmin } = await import("../services/adminApi");
  return getCurrentAdmin();
}
