/**
 * Port of the original hooks/use-auth.ts.
 *
 * Key differences:
 *   - Storage reads are async, so initial hydration now happens in an effect
 *     that awaits the storage. While awaiting, `isLoading` is true.
 *   - `logout()` is now async and does NOT navigate. Routing is the layout's
 *     job — see app/_layout.tsx, which redirects based on `isAuthenticated`.
 */
import { useCallback, useEffect, useState } from "react";
import { type User, UserRole } from "@/types";
import { api } from "@/lib/api";
import { tokenStorage, userStorage } from "@/lib/storage";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Hydrate from storage on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, user] = await Promise.all([
        tokenStorage.get(),
        userStorage.get(),
      ]);
      if (cancelled) return;
      if (token && user) {
        setState({ user, isLoading: false, isAuthenticated: true });
      } else {
        setState({ user: null, isLoading: false, isAuthenticated: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    });
    return response;
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      full_name?: string;
      role: UserRole;
    }) => {
      return api.auth.register(data);
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.auth.logout();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await api.auth.getCurrentUser();
      await userStorage.set(user);
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      await logout();
    }
  }, [logout]);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!state.user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(state.user.role);
    },
    [state.user],
  );

  const isOfficerOrAdmin = useCallback(
    () => hasRole([UserRole.OFFICER, UserRole.ADMIN]),
    [hasRole],
  );
  const isAdmin = useCallback(() => hasRole(UserRole.ADMIN), [hasRole]);

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    isOfficerOrAdmin,
    isAdmin,
  };
}
