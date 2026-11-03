#!/usr/bin/env node
/** UI06 smoke — invoice, budget ledger, maintenance, license (API + seeded DB). */
const API = (process.env.ITDMS_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function login() {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin.dev", password: "ChangeMe_DevOnly!" }),
  });
  if (res.status !== 200) throw new Error(`login ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  const cookie = await login();
  const h = { cookie, "Content-Type": "application/json" };
  const ts = Date.now();

  const ven = await fetch(`${API}/api/v1/vendors`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ vendorName: `UI06 Vendor ${ts}` }),
  });
  if (ven.status !== 201) throw new Error(`vendor ${ven.status}`);
  const vendorId = (await ven.json()).data.vendorId;

  const po = await fetch(`${API}/api/v1/purchase-orders`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      poNumber: `PO-UI06-${ts}`,
      vendorId,
      poDate: "2026-02-01",
      currency: "USD",
    }),
  });
  if (po.status !== 201) throw new Error(`po ${po.status}`);
  const poId = (await po.json()).data.purchaseOrderId;
  console.log("[pass] PO ready");

  const inv = await fetch(`${API}/api/v1/invoices`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      invoiceNumber: `INV-UI06-${ts}`,
      purchaseOrderId: poId,
      invoiceDate: "2026-02-15",
      invoiceAmount: 250,
    }),
  });
  if (inv.status !== 201) throw new Error(`invoice ${inv.status}`);
  const invoiceId = (await inv.json()).data.invoiceId;
  console.log("[pass] invoice created");

  const payKey = `ui06-${ts}`;
  const pay = await fetch(`${API}/api/v1/invoices/${invoiceId}/payments`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ amount: 100, idempotencyKey: payKey }),
  });
  if (pay.status !== 201) throw new Error(`payment ${pay.status}`);
  const bal = await fetch(`${API}/api/v1/invoices/${invoiceId}/balance`, { headers: { cookie } });
  if (bal.status !== 200) throw new Error(`balance ${bal.status}`);
  console.log("[pass] payment + balance");

  const fy = await fetch(`${API}/api/v1/financial-years`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      yearName: `FY-UI06-${ts}`,
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      status: "OPEN",
    }),
  });
  if (fy.status !== 201) throw new Error(`fy ${fy.status}`);
  const financialYearId = (await fy.json()).data.financialYearId;

  const alloc = await fetch(`${API}/api/v1/budget-allocations`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      financialYearId,
      budgetCategory: "UI06",
      allocatedAmount: 5000,
      currency: "USD",
    }),
  });
  if (alloc.status !== 201) throw new Error(`alloc ${alloc.status}`);
  const budgetId = (await alloc.json()).data.budgetId;
  console.log("[pass] budget allocation");

  const ledger = await fetch(`${API}/api/v1/budget-ledger/entries`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      budgetId,
      transactionType: "MANUAL",
      amount: 50,
      transactionDate: "2026-02-01",
      purchaseOrderId: poId,
    }),
  });
  if (ledger.status !== 201) throw new Error(`ledger ${ledger.status}`);
  console.log("[pass] ledger entry");

  const assetCat = await fetch(`${API}/api/v1/asset-categories`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ categoryName: `Cat-UI06-${ts}` }),
  });
  if (assetCat.status !== 201) throw new Error(`cat ${assetCat.status}`);
  const categoryId = (await assetCat.json()).data.categoryId;

  const asset = await fetch(`${API}/api/v1/assets`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      assetCode: `AST-UI06-${ts}`,
      assetName: "UI06 asset",
      categoryId,
    }),
  });
  if (asset.status !== 201) throw new Error(`asset ${asset.status}`);
  const assetId = (await asset.json()).data.assetId;

  const maint = await fetch(`${API}/api/v1/maintenance-records`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      assetId,
      maintenanceType: "Inspection",
      requestDate: "2026-02-01",
    }),
  });
  if (maint.status !== 201) throw new Error(`maint ${maint.status}`);
  const maintenanceId = (await maint.json()).data.maintenanceId;
  console.log("[pass] maintenance create");

  const lic = await fetch(`${API}/api/v1/software-licenses`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      softwareName: `SW-UI06-${ts}`,
      startDate: "2026-01-01",
      expiryDate: "2027-01-01",
      licenseQuantity: 3,
      vendorId,
    }),
  });
  if (lic.status !== 201) throw new Error(`license ${lic.status}`);
  const licenseId = (await lic.json()).data.licenseId;

  const renew = await fetch(`${API}/api/v1/software-licenses/${licenseId}/renew`, {
    method: "POST",
    headers: h,
    body: "{}",
  });
  if (renew.status !== 403) throw new Error(`renew expected 403 got ${renew.status}`);
  console.log("[pass] license renew blocked (POLICY)");

  console.log("UI06 smoke OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
