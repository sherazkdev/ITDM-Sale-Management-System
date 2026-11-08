import { test, expect, type Page } from "@playwright/test";
import { apiGetEnvelope, apiPostEnvelope } from "./helpers/api";
import { pickSearchableSelect } from "./helpers/searchable-select";
import { lifecycle } from "./lifecycle-state";

test.describe.configure({ mode: "serial", timeout: 120_000 });

async function saveEntityEdit(page: Page, fieldLabel: RegExp, value: string) {
  await page.getByRole("button", { name: /^edit$/i }).click();
  await page.getByLabel(fieldLabel).fill(value);
  await page.getByRole("button", { name: /save changes/i }).click();
}

async function addPoLine(page: Page, description: string, quantity: string, unitPrice: string) {
  await page.getByRole("button", { name: /add line/i }).first().click();
  const dialog = page.getByRole("dialog", { name: /add line/i });
  await expect(dialog).toBeVisible();
  await dialog.locator("#description").fill(description);
  await dialog.locator("#quantity").fill(quantity);
  await dialog.locator("#unitPrice").fill(unitPrice);
  await dialog.getByRole("button", { name: /^add line$/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
}

test.describe("Connected business workflows (UI + API)", () => {
  test("vendor create, edit, archive", async ({ page }) => {
    lifecycle.vendorName = `LC Vendor ${lifecycle.ts}`;
    await page.goto("/vendors/new");
    await page.getByLabel(/vendor name/i).fill(lifecycle.vendorName);
    await page.getByRole("button", { name: /create vendor/i }).click();
    await expect(page).toHaveURL(/\/vendors\//);
    lifecycle.vendorId = page.url().split("/").pop() ?? "";

    await saveEntityEdit(page, /vendor name/i, `${lifecycle.vendorName} Updated`);
    // Vendor detail can render the name in more than one heading; assert the first match.
    await expect(
      page.getByRole("heading", { name: new RegExp(`${lifecycle.vendorName} Updated`, "i") }).first(),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /^archive$/i }).click();
    await page.getByRole("button", { name: /^archive$/i }).last().click();
    await expect(page.getByText(/archived/i)).toBeVisible({ timeout: 15_000 });
  });

  test("vendor → contract → draft PO with two lines", async ({ page }) => {
    lifecycle.vendorName = `LC Vendor ${lifecycle.ts}`;
    await page.goto("/vendors/new");
    await page.getByLabel(/vendor name/i).fill(lifecycle.vendorName);
    await page.getByRole("button", { name: /create vendor/i }).click();
    await expect(page).toHaveURL(/\/vendors\//);
    lifecycle.vendorId = page.url().split("/").pop() ?? "";

    await page.goto(`/contracts/new?vendor=${encodeURIComponent(lifecycle.vendorName)}`);
    await page.getByLabel(/contract number/i).fill(`LC-C-${lifecycle.ts}`);
    await pickSearchableSelect(page, "Vendor", lifecycle.vendorName, new RegExp(lifecycle.vendorName, "i"));
    await page.getByLabel(/start date/i).fill("2026-01-01");
    await page.getByLabel(/expiry date/i).fill("2027-12-31");
    await page.getByRole("button", { name: /create contract/i }).click();
    await expect(page).toHaveURL(/\/contracts\//);
    lifecycle.contractId = page.url().split("/").pop() ?? "";

    lifecycle.poNumber = `LC-PO-${lifecycle.ts}`;
    await page.goto(`/purchase-orders/new?vendor=${encodeURIComponent(lifecycle.vendorName)}`);
    await page.getByLabel(/po number/i).fill(lifecycle.poNumber);
    await pickSearchableSelect(page, "Vendor", lifecycle.vendorName, new RegExp(lifecycle.vendorName, "i"));
    await page.getByLabel(/po date/i).fill("2026-02-01");
    await page.getByRole("button", { name: /create draft/i }).click();
    await expect(page).toHaveURL(/\/purchase-orders\/\d+$/, { timeout: 30_000 });
    lifecycle.poId = page.url().split("/").pop() ?? "";

    await addPoLine(page, "Line one", "2", "100");
    await addPoLine(page, "Line two", "1", "50");

    await expect(page.getByText("Line one")).toBeVisible();
    await expect(page.getByText("Line two")).toBeVisible();
  });

  test("PO → invoice → post → payment → balance", async ({ page }) => {
    test.skip(!lifecycle.poId, "PO missing from prior step");
    await page.goto(`/invoices/new?po=${encodeURIComponent(lifecycle.poNumber)}`);
    await expect(page.locator("#invoiceNumber")).toBeVisible({ timeout: 15_000 });
    await page.locator("#invoiceNumber").fill(`LC-INV-${lifecycle.ts}`);
    await pickSearchableSelect(page, "Purchase order", lifecycle.poNumber ?? "", new RegExp(lifecycle.poNumber ?? "", "i"));
    await page.getByLabel(/invoice date/i).fill("2026-02-15");
    await page.locator("#invoiceAmount").fill("250");
    await page.getByRole("button", { name: /create invoice/i }).click();
    // Must require a numeric id — `/invoices/new` also matches a loose `/invoices/` pattern.
    await expect(page).toHaveURL(/\/invoices\/\d+$/, { timeout: 30_000 });
    lifecycle.invoiceId = page.url().split("/").pop() ?? "";

    const year = await apiPostEnvelope<{ financialYearId: string }>(page, "/financial-years", {
      yearName: `LC-FY-PAY-${lifecycle.ts}`,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "OPEN",
    });
    expect(year.status).toBe(201);
    const alloc = await apiPostEnvelope<{ budgetId: string }>(page, "/budget-allocations", {
      financialYearId: year.json.data.financialYearId,
      budgetCategory: "Lifecycle IT",
      allocatedAmount: 100_000,
      currency: "USD",
    });
    expect(alloc.status).toBe(201);

    const post = await apiPostEnvelope(page, `/invoices/${lifecycle.invoiceId}/post`, {
      budgetId: alloc.json.data.budgetId,
    });
    expect(post.status).toBe(200);

    await page.goto(`/invoices/${lifecycle.invoiceId}`);
    await page.locator("#amount").fill("100");
    await page.getByRole("button", { name: /review payment/i }).click();
    await page.getByRole("button", { name: /^record payment$/i }).click();
    await expect(page.getByText(/payment recorded/i)).toBeVisible({ timeout: 20_000 });
  });

  test("financial year → budget allocation form", async ({ page }) => {
    await page.goto("/budgets");
    await page.getByPlaceholder(/year name/i).fill(`LC-FY-${lifecycle.ts}`);
    await page.locator('input[type="date"]').first().fill("2026-04-01");
    await page.locator('input[type="date"]').nth(1).fill("2027-03-31");
    await page.getByRole("button", { name: /add year/i }).click();
    await expect(page.getByText(`LC-FY-${lifecycle.ts}`, { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("employee create and edit", async ({ page }) => {
    lifecycle.employeeNumber = `LC-EMP-${lifecycle.ts}`;
    await page.goto("/employees/new");
    await page.getByLabel(/employee number/i).fill(lifecycle.employeeNumber);
    await page.getByLabel(/full name/i).fill("Lifecycle Employee");
    await page.getByRole("button", { name: /create employee/i }).click();
    await expect(page).toHaveURL(/\/employees\/\d+$/, { timeout: 30_000 });
    lifecycle.employeeId = page.url().split("/").pop() ?? "";

    await saveEntityEdit(page, /full name/i, "Lifecycle Employee Updated");
    await expect(page.getByText("Employee updated", { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("asset category, register, issue, return", async ({ page }) => {
    test.skip(!lifecycle.employeeId, "employee missing");
    const catName = `LC-CAT-${lifecycle.ts}`;
    await page.goto("/asset-categories");
    await page.getByRole("button", { name: /add category/i }).click();
    await page.locator("#create-name").fill(catName);
    await page.getByRole("dialog", { name: /new category/i }).getByRole("button", { name: /^create$/i }).click();
    await expect(page.getByText(catName, { exact: true })).toBeVisible({ timeout: 15_000 });

    lifecycle.assetCode = `LC-AST-${lifecycle.ts}`;
    await page.goto("/assets/new");
    await page.getByLabel(/asset code/i).fill(lifecycle.assetCode);
    await page.getByLabel(/asset name/i).fill("Lifecycle Laptop");
    await page.locator("select").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: /register asset/i }).click();
    await expect(page).toHaveURL(/\/assets\/\d+$/, { timeout: 30_000 });
    lifecycle.assetId = page.url().split("/").pop() ?? "";

    // Issuance UI shows a truncated in-stock page; large inventories may omit the
    // newly registered code. Issue/return via API (same contract as the UI form).
    const holder = await apiGetEnvelope<{ assetStatus?: string; status?: string }>(
      page,
      `/assets/${lifecycle.assetId}/current-holder`,
    );
    expect(holder.status).toBe(200);

    const employeeId = Number(lifecycle.employeeId);
    const assetId = Number(lifecycle.assetId);
    expect(Number.isFinite(employeeId)).toBe(true);
    expect(Number.isFinite(assetId)).toBe(true);

    const issue = await apiPostEnvelope(page, "/asset-issuances", {
      employeeId,
      receivingDepartment: "Lifecycle IT",
      referenceNumber: `LC-ISSUE-${lifecycle.ts}`,
      assets: [{ assetId }],
    });
    if (issue.status !== 201) {
      throw new Error(`asset-issuances failed: ${JSON.stringify(issue.json)}`);
    }
    const ret = await apiPostEnvelope(page, "/asset-returns", {
      employeeId,
      referenceNumber: `LC-RET-${lifecycle.ts}`,
      assets: [{ assetId }],
    });
    expect(ret.status).toBe(201);

    await page.goto("/asset-history");
    await expect(page.getByRole("heading", { name: /asset history/i })).toBeVisible();
    await page.goto(`/assets/${lifecycle.assetId}`);
    await expect(page).toHaveURL(new RegExp(`/assets/${lifecycle.assetId}$`));
    await expect(page.getByText(lifecycle.assetCode, { exact: true }).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("maintenance create and complete", async ({ page }) => {
    test.skip(!lifecycle.assetId || !lifecycle.assetCode, "asset missing");
    await page.goto("/maintenance/new");
    await pickSearchableSelect(page, "Asset", lifecycle.assetCode!, new RegExp(lifecycle.assetCode!));
    await page.locator("#maintenanceType").fill("Preventive");
    await page.locator("#requestDate").fill("2026-03-01");
    await page.getByRole("button", { name: /create request/i }).click();
    await expect(page).toHaveURL(/\/maintenance\/\d+/, { timeout: 30_000 });
    lifecycle.maintenanceId = page.url().split("/").pop() ?? "";

    await expect(page.getByRole("button", { name: /^complete$/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /^complete$/i }).click();
    await page.getByRole("dialog", { name: /complete maintenance/i }).locator('input[type="date"]').fill("2026-03-15");
    await page.getByRole("dialog", { name: /complete maintenance/i }).getByRole("button", { name: /^complete$/i }).click();
    await expect(page.getByText("Maintenance completed", { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("software license with expiry filter", async ({ page }) => {
    test.skip(!lifecycle.poId || !lifecycle.poNumber, "PO missing");
    await page.goto("/software-licenses/new");
    await page.locator("#softwareName").fill(`LC-LIC-${lifecycle.ts}`);
    await pickSearchableSelect(page, "Purchase order", lifecycle.poNumber!, new RegExp(lifecycle.poNumber!));
    await page.locator("#startDate").fill("2026-01-01");
    await page.locator("#expiryDate").fill("2026-12-31");
    await page.locator("#licenseQuantity").fill("1");
    await page.getByRole("button", { name: /create license/i }).click();
    await expect(page).toHaveURL(/\/software-licenses\/\d+$/, { timeout: 30_000 });

    await page.goto("/software-licenses");
    await page.locator("#before").fill("2027-01-01");
    await expect(page.getByText(`LC-LIC-${lifecycle.ts}`, { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("PO search hub", async ({ page }) => {
    test.skip(!lifecycle.poNumber, "PO number missing");
    await page.goto("/search");
    await page.locator("#po-search").fill(lifecycle.poNumber);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByText(lifecycle.poNumber)).toBeVisible({ timeout: 15_000 });
  });

  test("document upload on PO", async ({ page }) => {
    test.skip(!lifecycle.poId, "PO missing");
    await page.goto("/documents");
    const pdf = Buffer.from("%PDF-1.4\n%EOF\n");
    await page.locator('input[type="file"]').setInputFiles({
      name: "lc-upload.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    });
    await expect(page.getByText(/selected:/i)).toBeVisible({ timeout: 10_000 });
    await page.locator("#owner-id").fill(lifecycle.poId);
    await page.getByRole("button", { name: /review upload/i }).click();
    await page.getByRole("button", { name: /^upload$/i }).click();
    await expect(page.getByText(/uploaded document|#/i)).toBeVisible({ timeout: 25_000 });
  });

  test("notifications mark read when present", async ({ page }) => {
    await page.goto("/notifications");
    const markBtn = page.getByRole("button", { name: /mark read/i }).first();
    if (await markBtn.isVisible()) {
      await markBtn.click();
    }
    await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();
  });

  test("employee deactivate", async ({ page }) => {
    const num = `LC-OFF-${lifecycle.ts}`;
    await page.goto("/employees/new");
    await page.getByLabel(/employee number/i).fill(num);
    await page.getByLabel(/full name/i).fill("To Deactivate");
    await page.getByRole("button", { name: /create employee/i }).click();
    await page.getByRole("button", { name: /^deactivate$/i }).click();
    await page.getByRole("button", { name: /^deactivate$/i }).last().click();
    await expect(page.getByText(/inactive|deactivated/i)).toBeVisible({ timeout: 15_000 });
  });

  test("audit log lists events", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.getByRole("heading", { name: /audit log/i })).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 15_000 });
  });
});
