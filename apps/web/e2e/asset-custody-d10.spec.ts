import { test, expect } from "@playwright/test";
import path from "node:path";
import { apiGetEnvelope, apiJson, apiPostEnvelope } from "./helpers/api";
import { pickSearchableSelect } from "./helpers/searchable-select";

test.describe.configure({ mode: "serial" });

test.describe("D10 — employee department asset custody", () => {
  const ts = Date.now();
  const employeeNumber = `D10-E-${ts}`;
  const assetCode = `D10-A-${ts}`;
  let employeeId = "";
  let assetId = "";

  test("API: department snapshot survives employee transfer", async ({ page }) => {
    const emp = await apiPostEnvelope<{ employeeId: string }>(page, "/employees", {
      employeeNumber,
      fullName: "D10 Custody Tech",
      department: "IT",
    });
    expect(emp.status).toBe(201);
    employeeId = emp.json.data.employeeId;

    const cat = await apiPostEnvelope<{ categoryId: string }>(page, "/asset-categories", {
      categoryName: `D10-CAT-${ts}`,
    });
    expect(cat.status).toBe(201);

    const asset = await apiPostEnvelope<{ assetId: string }>(page, "/assets", {
      assetCode,
      assetName: "D10 Laptop",
      categoryId: cat.json.data.categoryId,
    });
    expect(asset.status).toBe(201);
    assetId = asset.json.data.assetId;

    const issue1 = await apiPostEnvelope<{ documentId: string; receivingDepartment: string }>(
      page,
      "/asset-issuances",
      {
        employeeId,
        assets: [{ assetId }],
      },
    );
    expect(issue1.status).toBe(201);
    expect(issue1.json.data.receivingDepartment).toBe("IT");

    const patched = await apiJson(page.request, "PATCH", `/employees/${employeeId}`, {
      department: "Finance",
    });
    expect(patched.status).toBe(200);

    const cat2 = await apiPostEnvelope<{ categoryId: string }>(page, "/asset-categories", {
      categoryName: `D10-CAT2-${ts}`,
    });
    const asset2 = await apiPostEnvelope<{ assetId: string }>(page, "/assets", {
      assetCode: `D10-B-${ts}`,
      assetName: "D10 Phone",
      categoryId: cat2.json.data.categoryId,
    });

    const issue2 = await apiPostEnvelope<{ receivingDepartment: string }>(page, "/asset-issuances", {
      employeeId,
      assets: [{ assetId: asset2.json.data.assetId }],
    });
    expect(issue2.status).toBe(201);
    expect(issue2.json.data.receivingDepartment).toBe("Finance");

    const hist = await apiGetEnvelope<
      { transactionType: string; receivingDepartment?: string | null }[]
    >(page, `/assets/${assetId}/history`);
    expect(hist.status).toBe(200);
    const issueRow = hist.json.data.find((r) => r.transactionType === "ISSUE");
    expect(issueRow?.receivingDepartment).toBe("IT");
  });

  test("UI: issuance shows department and asset history column", async ({ page }) => {
    await page.goto("/asset-issuance", { waitUntil: "networkidle" });
    await expect(page.getByLabel(/receiving department/i)).toBeVisible();

    const shotDir = path.resolve(__dirname, "../../../docs/release/audit-screenshots/d10");
    await page.screenshot({
      path: path.join(shotDir, "asset-issuance-department-field.png"),
      fullPage: true,
    });

    await pickSearchableSelect(page, "Receiving employee", employeeNumber, new RegExp(employeeNumber));
    await expect(page.locator("#issue-dept")).toHaveValue("Finance");

    const cat = await apiPostEnvelope<{ categoryId: string }>(page, "/asset-categories", {
      categoryName: `D10-UI-CAT-${ts}`,
    });
    const uiAsset = await apiPostEnvelope<{ assetId: string; assetCode: string }>(page, "/assets", {
      assetCode: `D10-UI-${ts}`,
      assetName: "D10 UI Asset",
      categoryId: cat.json.data.categoryId,
    });

    await page.getByPlaceholder(/filter by code, name, or serial/i).fill(uiAsset.json.data.assetCode);
    const row = page.locator("label").filter({ hasText: uiAsset.json.data.assetCode });
    await row.getByRole("checkbox").check();
    await page.getByRole("button", { name: /review issue/i }).click();
    await expect(page.getByRole("dialog")).toContainText("Finance");
    await page.getByRole("button", { name: /issue assets/i }).click();
    await expect(page.getByText(/assets issued/i)).toBeVisible({ timeout: 20_000 });

    await page.goto(`/assets/${assetId}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("columnheader", { name: "Department" })).toBeVisible();
    await expect(page.locator('table[role="grid"]').filter({ hasText: "ISSUE" })).toContainText("IT");

    await page.screenshot({
      path: path.join(shotDir, "asset-detail-history-department.png"),
      fullPage: true,
    });
  });
});
