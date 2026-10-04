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

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => void;
}

export const AuthContext =
  createContext<AuthContextValue>({
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
  const [admin, setAdmin] =
    useState<AdminUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const token =
      localStorage.getItem(
        "admin_token"
      );

    if (!token) {
      if (mounted) {
        setLoading(false);
      }

      return () => {
        mounted = false;
      };
    }

    getMe()
      .then((user) => {
        if (!mounted) {
          return;
        }

        setAdmin(user);
      })
      .catch(() => {
        localStorage.removeItem(
          "admin_token"
        );

        if (mounted) {
          setAdmin(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function login(
    email: string,
    password: string
  ) {
    setLoading(true);

    try {
      const result =
        await apiLogin(
          email,
          password
        );

      localStorage.setItem(
        "admin_token",
        result.token
      );

      setAdmin(result.admin);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(
      "admin_token"
    );

    setAdmin(null);

    void apiLogout().catch(() => {
      // Local authentication state is already cleared.
    });
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}