#!/usr/bin/env node
/** UI04 smoke — master data API paths (requires API + seeded DB). */
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

  const empNum = `UI04-${Date.now()}`;
  const createEmp = await fetch(`${API}/api/v1/employees`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ employeeNumber: empNum, fullName: "UI04 Smoke Employee", department: "IT" }),
  });
  if (createEmp.status !== 201) throw new Error(`create employee ${createEmp.status}`);
  const emp = (await createEmp.json()).data;
  console.log("[pass] create employee");

  const patchEmp = await fetch(`${API}/api/v1/employees/${emp.employeeId}`, {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({ designation: "Tester" }),
  });
  if (patchEmp.status !== 200) throw new Error(`patch employee ${patchEmp.status}`);
  console.log("[pass] update employee");

  const vendorName = `UI04 Vendor ${Date.now()}`;
  const createVen = await fetch(`${API}/api/v1/vendors`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ vendorName }),
  });
  if (createVen.status !== 201) throw new Error(`create vendor ${createVen.status}`);
  const ven = (await createVen.json()).data;
  console.log("[pass] create vendor");

  const getVen = await fetch(`${API}/api/v1/vendors/${ven.vendorId}`, { headers: { cookie } });
  if (getVen.status !== 200) throw new Error(`get vendor ${getVen.status}`);
  const venBody = await getVen.json();
  if (!venBody.data.relationCounts) throw new Error("vendor relationCounts missing");
  console.log("[pass] vendor detail + relationCounts");

  const cats = await fetch(`${API}/api/v1/asset-categories`, { headers: { cookie } });
  const catList = (await cats.json()).data;
  const categoryId = catList[0]?.categoryId;
  if (!categoryId) throw new Error("no asset categories in seed");

  const code = `UI04-${Date.now().toString(36).toUpperCase()}`;
  const createAsset = await fetch(`${API}/api/v1/assets`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      assetCode: code,
      assetName: "UI04 Smoke Asset",
      categoryId,
    }),
  });
  if (createAsset.status !== 201) throw new Error(`create asset ${createAsset.status}`);
  const asset = (await createAsset.json()).data;
  console.log("[pass] register asset");

  const hist = await fetch(`${API}/api/v1/assets/${asset.assetId}/history`, { headers: { cookie } });
  if (hist.status !== 200) throw new Error("asset history");
  console.log("[pass] asset history");

  console.log("\nAll UI04 API smoke checks passed.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
