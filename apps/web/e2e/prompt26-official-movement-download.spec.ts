import { test, expect } from "@playwright/test";
import path from "node:path";
import { apiPostEnvelope } from "./helpers/api";

const authFile = path.join(__dirname, ".auth", "admin.json");

test.describe("Prompt #26 — official movement XLSX", () => {
  test.use({ storageState: authFile });

  test("issue via API then download official issuance workbook", async ({ page }) => {
    const ts = Date.now();

    const category = await apiPostEnvelope<{ categoryId: string }>(page, "/asset-categories", {
      categoryName: `P26-CAT-${ts}`,
    });
    expect(category.status).toBe(201);
    const categoryId = category.json.data?.categoryId;
    if (!categoryId) throw new Error("category create failed");

    const asset = await apiPostEnvelope<{ assetId: string }>(page, "/assets", {
      assetCode: `P26-AST-${ts}`,
      assetName: "Prompt26 laptop",
      categoryId,
    });
    expect(asset.status).toBe(201);
    const assetId = asset.json.data?.assetId;
    if (!assetId) throw new Error("asset create failed");

    const dept = await apiPostEnvelope<{ departmentId: string }>(page, "/departments", {
      departmentName: `P26-DEPT-${ts}`,
    });
    expect(dept.status).toBe(201);

    const emp = await apiPostEnvelope<{ employeeId: string }>(page, "/employees", {
      employeeNumber: `P26-EMP-${ts}`,
      fullName: "Prompt26 Employee",
      departmentId: dept.json.data?.departmentId,
    });
    expect(emp.status).toBe(201);

    const issue = await apiPostEnvelope<{ documentId: string }>(page, "/asset-issuances", {
      employeeId: emp.json.data?.employeeId,
      receivingDepartment: `P26-DEPT-${ts}`,
      referenceNumber: `P26-ISS-${ts}`,
      assets: [{ assetId }],
    });
    expect(issue.status).toBe(201);
    const documentId = issue.json.data?.documentId;
    if (!documentId) throw new Error("missing documentId");

    const apiOrigin = (process.env.ITDMS_API_URL ?? "http://127.0.0.1:3020").replace(/\/$/, "");
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const response = await page.request.fetch(
      `${apiOrigin}/api/v1/asset-issuances/${documentId}/official-xlsx`,
      { headers: cookieHeader ? { cookie: cookieHeader } : {} },
    );
    expect(response.status()).toBe(200);
    const buffer = await response.body();
    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(response.headers()["x-itdms-export-disclaimer"]).toBe("CLIENT-D12-OFFICIAL-TEMPLATE");
  });

  test("asset detail UI downloads official issuance workbook", async ({ page }) => {
    const ts = Date.now();
    const category = await apiPostEnvelope<{ categoryId: string }>(page, "/asset-categories", {
      categoryName: `P26UI-CAT-${ts}`,
    });
    const asset = await apiPostEnvelope<{ assetId: string }>(page, "/assets", {
      assetCode: `P26UI-${ts}`,
      assetName: "UI download laptop",
      categoryId: category.json.data!.categoryId,
    });
    const emp = await apiPostEnvelope<{ employeeId: string }>(page, "/employees", {
      employeeNumber: `P26UI-E-${ts}`,
      fullName: "UI Downloader",
      department: "IT",
    });
    const issue = await apiPostEnvelope<{ documentId: string }>(page, "/asset-issuances", {
      employeeId: emp.json.data!.employeeId,
      referenceNumber: `P26UI-ISS-${ts}`,
      assets: [{ assetId: asset.json.data!.assetId }],
    });
    const assetId = asset.json.data!.assetId;
    await page.goto(`/assets/${assetId}`, { waitUntil: "networkidle" });
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Official XLSX" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
    expect(issue.json.data!.documentId).toBeTruthy();
  });
});
