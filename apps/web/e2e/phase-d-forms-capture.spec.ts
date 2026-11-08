import { test, expect } from "@playwright/test";
import path from "node:path";

const OUT = path.resolve(__dirname, "../../../docs/release/audit-screenshots/phase-d");

const ROUTES = [
  "purchase-orders/new",
  "contracts/new",
  "maintenance/new",
  "software-licenses/new",
  "documents",
] as const;

const VIEWPORTS = [
  { tag: "390", width: 390, height: 844 },
  { tag: "768", width: 768, height: 1024 },
  { tag: "1440", width: 1440, height: 900 },
  { tag: "1920", width: 1920, height: 1080 },
] as const;

test.describe("Phase D form screenshots", () => {
  test.describe.configure({ timeout: 300_000 });

  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route} @ ${vp.tag}px`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/${route}`, { waitUntil: "networkidle" });
        await expect(page.locator("main").first()).toBeVisible({ timeout: 30_000 });
        const slug = route.replace(/\//g, "-");
        await page.screenshot({
          path: path.join(OUT, `${slug}-${vp.tag}-loaded.png`),
          fullPage: true,
        });
      });
    }
  }
});
