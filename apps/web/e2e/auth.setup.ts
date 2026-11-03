import { test as setup } from "@playwright/test";
import { loginAsAdmin } from "./helpers";
import path from "node:path";

const authFile = path.join(__dirname, ".auth", "admin.json");

setup("authenticate as admin.dev", async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: authFile });
});
