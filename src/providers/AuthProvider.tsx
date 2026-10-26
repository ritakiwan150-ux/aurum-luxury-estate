"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiProperty, ApiUser, SESSION_MARKER, UNAUTHORIZED_EVENT, api } from "../lib/api";

// Older versions kept the API token in localStorage (readable by any script). It is removed on load.
const LEGACY_TOKEN_KEY = "aurum_api_token";

interface AuthContextValue {
  user: ApiUser | null;
  /** Not a secret: SESSION_MARKER while signed in. The real token is in an httpOnly cookie. */
  token: string | null;
  /** false until the session (if any) has been checked. */
  ready: boolean;
  favoriteIds: ReadonlySet<number>;
  login: (user: ApiUser) => void;
  logout: () => Promise<void>;
  setUser: (user: ApiUser) => void;
  /** Resolves false when the visitor must sign in first. */
  toggleFavorite: (propertyId: number) => Promise<boolean>;
  /** Removes a favorite everywhere at once (every heart on the site updates). Resolves false on failure. */
  removeFavorite: (propertyId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<number>>(new Set());

  // Ask the server who is signed in (it reads the httpOnly cookie), once after hydration.
  useEffect(() => {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    let active = true;
    api.session()
      .then(({ user: current }) => {
        if (!active) return;
        setUserState(current);
        setToken(current ? SESSION_MARKER : null);
      })
      .catch(() => undefined)
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  // The gateway reports an expired session: behave as signed out.
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUserState(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Keep the favorites in sync with the signed-in user.
  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavoriteIds(new Set());
      return;
    }
    let active = true;
    api.favorites(token)
      .then((response) => {
        if (!active) return;
        const ids = response.favorites
          .map((entry) => entry.property)
          .filter((item): item is ApiProperty => Boolean(item))
          .map((item) => item.id);
        setFavoriteIds(new Set(ids));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token]);

  const login = useCallback((nextUser: ApiUser) => {
    setToken(SESSION_MARKER);
    setUserState(nextUser);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUserState(null);
    await api.logout().catch(() => undefined);
  }, []);

  const toggleFavorite = useCallback(
    async (propertyId: number) => {
      if (!token) return false;
      const wasSaved = favoriteIds.has(propertyId);
      const apply = (saved: boolean) =>
        setFavoriteIds((current) => {
          const next = new Set(current);
          if (saved) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
      apply(!wasSaved); // optimistic
      try {
        if (wasSaved) await api.removeFavorite(propertyId, token);
        else await api.addFavorite(propertyId, token);
      } catch {
        apply(wasSaved); // roll back
      }
      return true;
    },
    [token, favoriteIds],
  );

  const removeFavorite = useCallback(
    async (propertyId: number) => {
      if (!token) return false;
      try {
        await api.removeFavorite(propertyId, token);
      } catch {
        return false;
      }
      setFavoriteIds((current) => {
        const next = new Set(current);
        next.delete(propertyId);
        return next;
      });
      return true;
    },
    [token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, ready, favoriteIds, login, logout, setUser: setUserState, toggleFavorite, removeFavorite }),
    [user, token, ready, favoriteIds, login, logout, toggleFavorite, removeFavorite],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
