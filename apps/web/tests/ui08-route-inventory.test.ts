import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/** App Router pages under src/app (UI08 route inventory baseline). */
const APP_ROOT = path.join(__dirname, "../src/app");

function collectPageRoutes(dir: string, segments: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let routes: string[] = [];
  const hasPage = entries.some((e) => e.isFile() && e.name === "page.tsx");
  if (hasPage) {
    const route = segments.length === 0 ? "/" : `/${segments.join("/")}`;
    routes.push(route);
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "api") continue;
    routes = routes.concat(collectPageRoutes(path.join(dir, entry.name), [...segments, entry.name]));
  }
  return routes;
}

describe("UI08 route inventory", () => {
  it("discovers expected functional app routes", () => {
    const raw = collectPageRoutes(APP_ROOT);
    const normalized = raw
      .map((r) => r.replace(/\/\([^)]+\)/g, ""))
      .filter((r) => !r.startsWith("/api"))
      .sort();

    const unique = [...new Set(normalized)];

    expect(unique).toContain("/dashboard");
    expect(unique).toContain("/login");
    expect(unique).toContain("/search");
    expect(unique).toContain("/admin/audit");

    // Next build reported 32 static/dynamic app routes; page files + root redirect
    expect(unique.length).toBeGreaterThanOrEqual(28);
  });
});
