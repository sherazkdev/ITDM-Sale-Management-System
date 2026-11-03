import type { Page } from "@playwright/test";

export const VIEWPORTS = [
  { label: "1440", width: 1440, height: 900 },
  { label: "1280", width: 1280, height: 800 },
  { label: "1024", width: 1024, height: 768 },
  { label: "768", width: 768, height: 1024 },
  { label: "390", width: 390, height: 844 },
  { label: "375", width: 375, height: 812 },
] as const;

export type ThemeMode = "light" | "dark";

export async function applyTheme(page: Page, mode: ThemeMode) {
  await page.addInitScript((theme) => {
    localStorage.setItem("itdms.theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, mode);
}

export async function assertNoHorizontalPageOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth + 2;
  });
}

export const VISUAL_ROUTES = [
  "/dashboard",
  "/employees",
  "/vendors",
  "/assets",
  "/asset-categories",
  "/purchase-orders",
  "/contracts",
  "/asset-issuance",
  "/invoices",
  "/budgets",
  "/maintenance",
  "/software-licenses",
  "/search",
  "/documents",
  "/reports",
  "/notifications",
  "/admin",
  "/admin/audit",
] as const;

export const DARK_MODE_ROUTES = VISUAL_ROUTES;
