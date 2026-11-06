import { test, expect } from "@playwright/test";
import path from "node:path";
import { applyTheme } from "./helpers-visual";

const OUT = path.resolve(__dirname, "../../../docs/frontend/screenshots/crm-layout-correction");

const DESKTOP_ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "employees", path: "/employees" },
  { name: "employees-new", path: "/employees/new" },
  { name: "vendors", path: "/vendors" },
  { name: "vendors-new", path: "/vendors/new" },
  { name: "assets", path: "/assets" },
  { name: "assets-new", path: "/assets/new" },
  { name: "purchase-orders", path: "/purchase-orders" },
  { name: "purchase-orders-new", path: "/purchase-orders/new" },
  { name: "invoices", path: "/invoices" },
  { name: "budgets", path: "/budgets" },
  { name: "asset-issuance", path: "/asset-issuance" },
  { name: "maintenance", path: "/maintenance" },
  { name: "software-licenses", path: "/software-licenses" },
  { name: "search", path: "/search" },
  { name: "reports", path: "/reports" },
  { name: "admin", path: "/admin" },
] as const;

const VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "1280", width: 1280, height: 800 },
  { tag: "1024", width: 1024, height: 768 },
  { tag: "768", width: 768, height: 1024 },
  { tag: "390", width: 390, height: 844 },
  { tag: "375", width: 375, height: 812 },
] as const;

async function captureRoutes(
  page: import("@playwright/test").Page,
  routes: readonly { name: string; path: string }[],
  viewportTag: string,
) {
  for (const route of routes) {
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: path.join(OUT, `${route.name}-${viewportTag}-light.png`),
      fullPage: true,
    });
  }
}

test.describe("CRM layout correction capture — phase 02", () => {
  test.describe.configure({ timeout: 600_000 });

  test("desktop + tablet + mobile matrix @ light", async ({ page }) => {
    await applyTheme(page, "light");

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await captureRoutes(page, DESKTOP_ROUTES, vp.tag);
    }
  });

  test("detail pages when records exist", async ({ page }) => {
    await applyTheme(page, "light");
    await page.setViewportSize({ width: 1440, height: 900 });

    async function captureDetailIfLinked(
      listPath: string,
      linkHref: RegExp,
      urlPattern: RegExp,
      fileName: string,
    ) {
      await page.goto(listPath, { waitUntil: "networkidle" });
      const link = page.locator("table tbody tr a[href]").first();
      if (!(await link.count())) return;
      await link.click();
      await page.waitForURL(urlPattern, { timeout: 30_000 });
      await page.getByRole("heading", { level: 2 }).first().waitFor({ timeout: 20_000 });
      await page.screenshot({
        path: path.join(OUT, fileName),
        fullPage: true,
      });
      void linkHref;
    }

    await captureDetailIfLinked(
      "/employees",
      /\/employees\//,
      /\/employees\/\d+/,
      "employees-detail-1440-light.png",
    );
    await captureDetailIfLinked(
      "/vendors",
      /\/vendors\//,
      /\/vendors\/\d+/,
      "vendors-detail-1440-light.png",
    );
    await captureDetailIfLinked("/assets", /\/assets\//, /\/assets\/\d+/, "assets-detail-1440-light.png");
    await captureDetailIfLinked(
      "/purchase-orders",
      /\/purchase-orders\//,
      /\/purchase-orders\/\d+/,
      "purchase-orders-detail-1440-light.png",
    );
  });

  test("gap closure detail modules @ 1440 and 390", async ({ page }) => {
    const modules = [
      { listPath: "/invoices", urlPattern: /\/invoices\/\d+/, filePrefix: "invoices-detail" },
      { listPath: "/maintenance", urlPattern: /\/maintenance\/\d+/, filePrefix: "maintenance-detail" },
      {
        listPath: "/software-licenses",
        urlPattern: /\/software-licenses\/\d+/,
        filePrefix: "software-licenses-detail",
      },
    ] as const;

    for (const viewport of [
      { width: 1440, height: 900, tag: "1440" },
      { width: 390, height: 844, tag: "390" },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await applyTheme(page, "light");

      for (const mod of modules) {
        await page.goto(mod.listPath, { waitUntil: "networkidle" });
        const link = page.locator("table tbody tr a[href]").first();
        if (!(await link.count())) continue;
        await link.click();
        await page.waitForURL(mod.urlPattern, { timeout: 30_000 });
        await page.getByRole("heading", { level: 2 }).first().waitFor({ timeout: 20_000 });
        await page.screenshot({
          path: path.join(OUT, `${mod.filePrefix}-${viewport.tag}-light.png`),
          fullPage: true,
        });
      }
    }
  });
});

test.describe("CRM layout correction capture — unauthenticated smoke", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login @ 1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyTheme(page, "light");
    await page.goto("/login");
    await page.screenshot({
      path: path.join(OUT, "login-1440-light.png"),
      fullPage: true,
    });
  });
});
