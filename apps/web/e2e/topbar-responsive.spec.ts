import { test, expect } from "@playwright/test";

const WIDTHS = [390, 768, 1024, 1440] as const;

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width - 1 && a.x + a.width - 1 > b.x && a.y < b.y + b.height - 1 && a.y + a.height - 1 > b.y;
}

test.describe("Topbar responsive layout", () => {
  for (const width of WIDTHS) {
    test(`search, notifications, and account do not overlap at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.goto("/employees", { waitUntil: "domcontentloaded" });
      const search = page.getByRole("button", { name: "Open PO search" });
      const notifications = page.getByRole("button", { name: "Notifications" });
      const account = page.getByRole("button", { name: /account$/i });
      await expect(search).toBeVisible();
      await expect(notifications).toBeVisible();
      await expect(account).toBeVisible();

      const searchBox = await search.boundingBox();
      const notificationsBox = await notifications.boundingBox();
      const accountBox = await account.boundingBox();
      expect(searchBox).toBeTruthy();
      expect(notificationsBox).toBeTruthy();
      expect(accountBox).toBeTruthy();
      if (!searchBox || !notificationsBox || !accountBox) return;

      expect(boxesOverlap(searchBox, notificationsBox), "search overlaps notifications").toBe(false);
      expect(boxesOverlap(searchBox, accountBox), "search overlaps account").toBe(false);
      expect(boxesOverlap(notificationsBox, accountBox), "notifications overlap account").toBe(false);
      expect(accountBox.x + accountBox.width).toBeLessThanOrEqual(width + 1);
    });
  }
});
