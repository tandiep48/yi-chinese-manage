"use client";

// components/auth/AuthProvider.tsx
// Client-side auth context for the learner-facing app. Backed by the Flask
// session cookie (see Learning/web_app/routes/auth/auth_routes.py's
// /api/auth/* endpoints) — there is no token to store here, just the
// current user mirrored from GET /api/auth/me on mount.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/types/user";
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  fetchCurrentUser,
} from "@/lib/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Merge server-confirmed fields into the cached user, so a change made on one page
  // shows everywhere at once — the profile page's avatar upload updating the nav
  // avatar is the legacy updateNavAvatar(), without the DOM surgery.
  patchUser: (patch: Partial<AuthUser>) => void;
}

const AuthCtx = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  patchUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, ask the backend whether the session cookie (if any) is still
  // valid. A 401 here just means "signed out" — not an error to surface.
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await loginApi(username, password);
    setUser(u);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const u = await registerApi(username, email, password);
      setUser(u);
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const patchUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, patchUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthCtx);
}
