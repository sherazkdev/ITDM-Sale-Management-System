import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT =
  process.env.PROMPT20_CAPTURE_DIR ??
  "C:/Users/shera/OneDrive/Desktop/ITDMS_UI_AUDIT_AFTER_PROMPT20";
const BASE = process.env.WEB_ORIGIN ?? "http://127.0.0.1:3021";
const AUTH = path.resolve(__dirname, "../e2e/.auth/admin.json");

const ROUTES = [
  "/dashboard",
  "/employees",
  "/departments",
  "/assets",
  "/asset-issuance",
  "/purchase-orders",
  "/invoices",
  "/budgets",
  "/maintenance",
  "/software-licenses",
  "/notifications",
  "/settings/roles",
];

const VIEWPORTS = [
  { label: "390", width: 390, height: 844 },
  { label: "768", width: 768, height: 1024 },
  { label: "1024", width: 1024, height: 768 },
  { label: "1440", width: 1440, height: 900 },
  { label: "1920", width: 1920, height: 1080 },
];

fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
const browser = await chromium.launch();
const context = await browser.newContext({ storageState: AUTH, baseURL: BASE });
const page = await context.newPage();

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const file = `${route.replace(/^\//, "").replace(/\//g, "-") || "root"}-${vp.label}.png`;
    const filePath = path.join(OUT, file);
    try {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: filePath, fullPage: true });
      manifest.push({ route, viewport: vp.label, file, status: res?.status() ?? 0, ok: true });
      console.log("OK", route, vp.label);
    } catch (err) {
      manifest.push({
        route,
        viewport: vp.label,
        file,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
      console.log("FAIL", route, vp.label, err);
    }
  }
}

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
await browser.close();
console.log("Done", manifest.filter((m) => m.ok).length, "/", manifest.length);
