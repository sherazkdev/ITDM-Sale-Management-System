import fs from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

const LOCK_CODES = new Set(["UNKNOWN", "EBUSY", "EPERM", "EACCES"]);

/** Writable captures. Does not touch docs/ audit evidence. */
export function uiCaptureDir(suite: string): string {
  const dir = path.resolve(__dirname, "../test-results/ui-captures", suite);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Wait until the route has a heading and loading skeletons have cleared. */
export async function waitForLoadedScreen(page: Page): Promise<void> {
  await expect(page.getByText(/application error|client-side exception/i)).toHaveCount(0);
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("main .animate-shimmer")).toHaveCount(0, { timeout: 20_000 });
}

/**
 * Write a screenshot outside source-controlled docs and confirm the file landed.
 * Retries Windows/OneDrive lock errors instead of overwriting audit evidence.
 */
export async function saveScreenshot(
  page: Page,
  options: { path: string; fullPage?: boolean; settle?: boolean },
): Promise<void> {
  if (options.settle !== false) {
    await waitForLoadedScreen(page);
  }
  fs.mkdirSync(path.dirname(options.path), { recursive: true });
  const fullPage = options.fullPage ?? true;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const partial = `${options.path}.${process.pid}.partial.png`;
    try {
      await page.screenshot({ path: partial, fullPage });
      const written = fs.statSync(partial);
      if (written.size < 512) {
        throw new Error(`Screenshot was only ${written.size} bytes`);
      }
      fs.copyFileSync(partial, options.path);
      const saved = fs.statSync(options.path);
      if (saved.size < 512) {
        throw new Error(`Saved screenshot was only ${saved.size} bytes`);
      }
      fs.rmSync(partial, { force: true });
      return;
    } catch (err) {
      lastError = err;
      fs.rmSync(partial, { force: true });
      const code = (err as NodeJS.ErrnoException).code;
      if (code && !LOCK_CODES.has(code) && attempt > 1) break;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
  throw lastError;
}
