#!/usr/bin/env node
/** UI05 smoke — contracts, PO drafts, asset issuance (requires API + seeded DB). */
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

  const vendorName = `UI05 Vendor ${ts}`;
  const createVen = await fetch(`${API}/api/v1/vendors`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ vendorName }),
  });
  if (createVen.status !== 201) throw new Error(`create vendor ${createVen.status}`);
  const vendorId = (await createVen.json()).data.vendorId;
  console.log("[pass] vendor ready");

  const contractRes = await fetch(`${API}/api/v1/contracts`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      contractNumber: `CN-UI05-${ts}`,
      vendorId,
      startDate: "2026-01-01",
      expiryDate: "2027-06-01",
      contractValue: 10000,
    }),
  });
  if (contractRes.status !== 201) throw new Error(`create contract ${contractRes.status}`);
  const contractId = (await contractRes.json()).data.contractId;
  console.log("[pass] create contract");

  const poRes = await fetch(`${API}/api/v1/purchase-orders`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      poNumber: `PO-UI05-${ts}`,
      vendorId,
      contractId,
      poDate: "2026-02-01",
      currency: "USD",
    }),
  });
  if (poRes.status !== 201) throw new Error(`create PO ${poRes.status}`);
  const poId = (await poRes.json()).data.purchaseOrderId;
  console.log("[pass] create PO draft");

  const lineRes = await fetch(`${API}/api/v1/purchase-orders/${poId}/lines`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      lineNumber: 1,
      description: "UI05 smoke line",
      lineType: "goods",
      quantity: 1,
      unitPrice: 100,
    }),
  });
  if (lineRes.status !== 200) throw new Error(`add PO line ${lineRes.status}`);
  console.log("[pass] add PO line");

  const assetsList = await fetch(`${API}/api/v1/assets?status=IN_STOCK&pageSize=5`, {
    headers: { cookie },
  });
  if (assetsList.status !== 200) throw new Error(`list assets ${assetsList.status}`);
  const inStock = (await assetsList.json()).data ?? [];

  if (inStock.length === 0) {
    console.log("[skip] no IN_STOCK assets — issuance step skipped");
  } else {
    const empNum = `UI05-${ts}`;
    const empRes = await fetch(`${API}/api/v1/employees`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({ employeeNumber: empNum, fullName: "UI05 Issuance Holder" }),
    });
    if (empRes.status !== 201) throw new Error(`create employee ${empRes.status}`);
    const employeeId = (await empRes.json()).data.employeeId;

    const issueRes = await fetch(`${API}/api/v1/asset-issuances`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        employeeId,
        referenceNumber: `ISS-UI05-${ts}`,
        assets: [{ assetId: inStock[0].assetId }],
      }),
    });
    if (issueRes.status !== 201) throw new Error(`issue asset ${issueRes.status}`);
    const docId = (await issueRes.json()).data.documentId;
    console.log(`[pass] issue asset (document ${docId})`);
  }

  console.log("\nAll UI05 API smoke checks passed.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
