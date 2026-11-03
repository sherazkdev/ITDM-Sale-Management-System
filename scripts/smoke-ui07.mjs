#!/usr/bin/env node
/** UI07 smoke — search hub, documents, reports, notifications, admin, audit. */
const API = (process.env.ITDMS_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const CSRF_HEADERS = { "x-itdms-requested-with": "itdms" };

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
  const h = { cookie, "Content-Type": "application/json", ...CSRF_HEADERS };
  const ts = Date.now();

  const ven = await fetch(`${API}/api/v1/vendors`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ vendorName: `UI07 Vendor ${ts}` }),
  });
  if (ven.status !== 201) throw new Error(`vendor ${ven.status}`);
  const vendorId = (await ven.json()).data.vendorId;

  const poNumber = `PO-UI07-${ts}`;
  const po = await fetch(`${API}/api/v1/purchase-orders`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      poNumber,
      vendorId,
      poDate: "2026-02-01",
      currency: "USD",
    }),
  });
  if (po.status !== 201) throw new Error(`po ${po.status}`);
  const poId = (await po.json()).data.purchaseOrderId;
  console.log("[pass] PO ready");

  const search = await fetch(`${API}/api/v1/search/purchase-orders/${encodeURIComponent(poNumber)}`, {
    headers: { cookie },
  });
  if (search.status !== 200) throw new Error(`search ${search.status}`);
  console.log("[pass] PO search hub");

  const tinyPdfBase64 = Buffer.from("%PDF-1.4\n%EOF\n").toString("base64");
  const up = await fetch(`${API}/api/v1/documents/uploads`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      ownerType: "purchase_order",
      ownerId: String(poId),
      originalFileName: "ui07-smoke.pdf",
      mimeType: "application/pdf",
      contentBase64: tinyPdfBase64,
    }),
  });
  if (up.status !== 201) throw new Error(`upload ${up.status}`);
  const docId = (await up.json()).data.storedDocumentId;

  const meta = await fetch(`${API}/api/v1/documents/${docId}/metadata`, { headers: { cookie } });
  if (meta.status !== 200) throw new Error(`metadata ${meta.status}`);
  console.log("[pass] document upload + metadata");

  const report = await fetch(`${API}/api/v1/reports/purchase-orders?format=json`, { headers: { cookie } });
  if (report.status !== 200) throw new Error(`report ${report.status}`);
  console.log("[pass] report JSON");

  const csv = await fetch(`${API}/api/v1/reports/contracts?format=csv`, { headers: { cookie } });
  if (csv.status !== 200) throw new Error(`csv ${csv.status}`);
  const disclaimer = csv.headers.get("X-ITDMS-Export-Disclaimer");
  if (disclaimer !== "NON-OFFICIAL-D12") throw new Error("missing export disclaimer header");
  console.log("[pass] report CSV + disclaimer");

  const unread = await fetch(`${API}/api/v1/notifications/unread-count`, { headers: { cookie } });
  if (unread.status !== 200) throw new Error(`unread ${unread.status}`);
  console.log("[pass] notifications unread count");

  const users = await fetch(`${API}/api/v1/users`, { headers: { cookie } });
  if (users.status !== 200) throw new Error(`users ${users.status}`);
  console.log("[pass] users list");

  const audit = await fetch(`${API}/api/v1/audit-events?page=1&pageSize=5`, { headers: { cookie } });
  if (audit.status !== 200) throw new Error(`audit ${audit.status}`);
  console.log("[pass] audit events");

  console.log("smoke:ui07 OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
