"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchMe, logoutRequest } from "@/lib/api/auth";
import { runAuthMeBootstrap, type AuthMeBootstrapResult } from "@/lib/auth/resolve-auth-me-query";
import type { PermissionKey } from "@/lib/permissions";

export type AuthUser = {
  userId: string;
  username: string;
  displayName: string;
  permissions: string[];
};

export type AuthSession =
  | { status: "authenticated"; user: AuthUser }
  | { status: "anonymous"; user: null };

type AuthContextValue = {
  session: AuthSession;
  loading: boolean;
  /** True when `/auth/me` failed with network/5xx (distinct from 401 anonymous). */
  serviceUnavailable: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (key: PermissionKey) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => runAuthMeBootstrap(fetchMe),
    staleTime: 60_000,
    retry: false,
  });

  const serviceUnavailable = data?.status === "service_unavailable";

  const session: AuthSession = useMemo(() => {
    if (data?.status === "authenticated") {
      const user = data.user;
      return {
        status: "authenticated",
        user: {
          userId: user.userId,
          username: user.username,
          displayName: user.displayName,
          permissions: user.permissions,
        },
      };
    }
    return { status: "anonymous", user: null };
  }, [data]);

  const hasPermission = useCallback(
    (key: PermissionKey) => {
      if (session.status !== "authenticated") return false;
      return session.user.permissions.includes(key);
    },
    [session],
  );

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* clear client state even if network fails */
    }
    queryClient.setQueryData(["auth", "me"], undefined);
    queryClient.removeQueries({ queryKey: ["auth"] });
    router.push("/login");
    toast.success("Signed out.");
  }, [queryClient, router]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const loading = isLoading || (isFetching && data === undefined);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      serviceUnavailable,
      refresh,
      signOut,
      hasPermission,
    }),
    [session, loading, serviceUnavailable, refresh, signOut, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useNavPermissions(): readonly string[] {
  const { session } = useAuth();
  if (session.status === "authenticated") {
    return session.user.permissions;
  }
  return [];
}

export type { AuthMeBootstrapResult };
