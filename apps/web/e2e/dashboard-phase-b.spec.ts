import { test, expect } from "@playwright/test";
import path from "node:path";
import { saveScreenshot, uiCaptureDir } from "./helpers-screenshot";

const OUT_DIR = uiCaptureDir("dashboard-phase-b");

test.describe("Phase B premium dashboard", () => {
  test("loads analytics console with KPIs and charts", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
    // Wait for skeleton KPIs to resolve into real labels
    await expect(page.getByText(/inventory/i).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: /registered assets/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/quick actions/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/recent activity/i)).toBeVisible({ timeout: 30_000 });
  });

  test("captures loaded desktop and mobile screenshots", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await expect(page.locator("main")).toBeVisible();
    await saveScreenshot(page, {
      path: path.join(OUT_DIR, "dashboard-phase-b-1440-loaded.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await saveScreenshot(page, {
      path: path.join(OUT_DIR, "dashboard-phase-b-390-loaded.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await saveScreenshot(page, {
      path: path.join(OUT_DIR, "dashboard-phase-b-768-loaded.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await saveScreenshot(page, {
      path: path.join(OUT_DIR, "dashboard-phase-b-1920-loaded.png"),
      fullPage: true,
    });
  });
});
