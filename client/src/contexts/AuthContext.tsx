
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
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        // Ask the backend to validate the saved session.
        const restoredAdmin = await getMe();

        if (!cancelled) {
          setAdmin(restoredAdmin);
        }
      } catch {
        // Remove an invalid or expired session.
        if (!cancelled) {
          localStorage.removeItem("admin_token");
          setAdmin(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
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

      // Save the token returned by the backend.
      localStorage.setItem("admin_token", result.token);
      setAdmin(result.admin);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    // Clear the local session immediately.
    localStorage.removeItem("admin_token");
    setAdmin(null);

    // The UI remains logged out if the request fails.
    void apiLogout().catch(() => {});
  }

  return (
    <AuthContext.Provider
      value={{ admin, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
