"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import {
  buildColorVars,
  DEFAULT_COLORS,
  hexToPresetId,
  MANAGED_VARS,
  presetToHex,
  type ThemeColors,
} from "@/lib/theme-palette";
import { fetchUserProfile, patchUserProfile } from "@/lib/api/user-profile";

const COLORS_KEY = "itdms.colors";
const SYNC_DEBOUNCE_MS = 600;

type BrandThemeContextValue = {
  colors: ThemeColors;
  setColors: (next: Partial<ThemeColors>) => void;
  resetColors: () => void;
  /** Persist brand colors + mode to the user profile API. */
  saveToServer: () => Promise<void>;
  profileSynced: boolean;
};

const BrandThemeContext = createContext<BrandThemeContextValue | null>(null);

function readStored(): ThemeColors | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COLORS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ThemeColors>;
    return {
      primary: parsed.primary ?? DEFAULT_COLORS.primary,
      secondary: parsed.secondary ?? DEFAULT_COLORS.secondary,
      accent: parsed.accent ?? DEFAULT_COLORS.accent,
    };
  } catch {
    return null;
  }
}

function applyVars(colors: ThemeColors, mode: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = buildColorVars(colors, mode);
  for (const key of Object.keys(vars)) {
    root.style.setProperty(key, vars[key]!);
  }
}

function clearManagedVars() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const key of MANAGED_VARS) {
    root.style.removeProperty(key);
  }
}

export function BrandThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [colors, setColorsState] = useState<ThemeColors>(DEFAULT_COLORS);
  const [hydrated, setHydrated] = useState(false);
  const [profileSynced, setProfileSynced] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSync = useRef(false);
  const appliedProfileId = useRef<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["user", "profile", "me"],
    queryFn: fetchUserProfile,
    enabled: session.status === "authenticated",
    staleTime: 120_000,
  });

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setColorsState(stored);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || session.status !== "authenticated" || !profileQuery.data) return;
    if (appliedProfileId.current === profileQuery.data.userId) return;
    appliedProfileId.current = profileQuery.data.userId;

    const prefs = profileQuery.data.themePreferences;
    skipNextSync.current = true;

    if (prefs?.mode) {
      setTheme(prefs.mode);
    }

    if (prefs?.colors) {
      const primary = hexToPresetId(prefs.colors.primary) ?? DEFAULT_COLORS.primary;
      const secondary = hexToPresetId(prefs.colors.secondary) ?? primary;
      const accent = hexToPresetId(prefs.colors.accent) ?? primary;
      const merged = { primary, secondary, accent };
      setColorsState(merged);
      try {
        localStorage.setItem(COLORS_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
    }

    setProfileSynced(true);
    window.setTimeout(() => {
      skipNextSync.current = false;
    }, 50);
  }, [hydrated, session.status, profileQuery.data, setTheme]);

  useEffect(() => {
    if (!hydrated) return;
    applyVars(colors, resolvedTheme);
  }, [colors, resolvedTheme, hydrated]);

  const scheduleServerSync = useCallback(
    (nextColors: ThemeColors, mode: typeof theme) => {
      if (session.status !== "authenticated" || skipNextSync.current) return;
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        void patchUserProfile({
          themePreferences: {
            mode,
            colors: {
              primary: presetToHex(nextColors.primary),
              secondary: presetToHex(nextColors.secondary),
              accent: presetToHex(nextColors.accent),
            },
          },
        }).catch(() => {
          /* non-blocking — local theme still applies */
        });
      }, SYNC_DEBOUNCE_MS);
    },
    [session.status],
  );

  useEffect(() => {
    if (!hydrated || session.status !== "authenticated") return;
    scheduleServerSync(colors, theme);
  }, [colors, theme, hydrated, session.status, scheduleServerSync]);

  const setColors = useCallback(
    (next: Partial<ThemeColors>) => {
      setColorsState((prev) => {
        const merged = { ...prev, ...next };
        try {
          localStorage.setItem(COLORS_KEY, JSON.stringify(merged));
        } catch {
          /* ignore */
        }
        return merged;
      });
    },
    [],
  );

  const resetColors = useCallback(() => {
    try {
      localStorage.removeItem(COLORS_KEY);
    } catch {
      /* ignore */
    }
    setColorsState(DEFAULT_COLORS);
    clearManagedVars();
    applyVars(DEFAULT_COLORS, resolvedTheme);
    scheduleServerSync(DEFAULT_COLORS, theme);
  }, [resolvedTheme, scheduleServerSync, theme]);

  const saveToServer = useCallback(async () => {
    if (session.status !== "authenticated") return;
    await patchUserProfile({
      themePreferences: {
        mode: theme,
        colors: {
          primary: presetToHex(colors.primary),
          secondary: presetToHex(colors.secondary),
          accent: presetToHex(colors.accent),
        },
      },
    });
  }, [colors, session.status, theme]);

  const value = useMemo<BrandThemeContextValue>(
    () => ({ colors, setColors, resetColors, saveToServer, profileSynced }),
    [colors, setColors, resetColors, saveToServer, profileSynced],
  );

  return <BrandThemeContext.Provider value={value}>{children}</BrandThemeContext.Provider>;
}

export function useBrandTheme() {
  const ctx = useContext(BrandThemeContext);
  if (!ctx) throw new Error("useBrandTheme must be used within BrandThemeProvider");
  return ctx;
}
