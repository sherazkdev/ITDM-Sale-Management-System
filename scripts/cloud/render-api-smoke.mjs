/**
 * Hosted Render API smoke (no secrets logged). Usage:
 *   RENDER_API_URL=https://your-service.onrender.com node scripts/cloud/render-api-smoke.mjs
 *   SEED_ADMIN_PASSWORD=... SEED_ADMIN_USERNAME=demo.admin (optional login checks)
 */
const base = process.env.RENDER_API_URL?.replace(/\/$/, "");
if (!base) {
  console.error("Set RENDER_API_URL");
  process.exit(1);
}

const CSRF = { "x-itdms-requested-with": "itdms" };

async function get(path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

async function main() {
  const results = { base, checks: [] };
  const live = await get("/api/v1/health/live");
  results.checks.push({ name: "health/live", status: live.status, pass: live.status === 200 });

  const ready = await get("/api/v1/health/ready");
  results.checks.push({
    name: "health/ready",
    status: ready.status,
    pass: ready.status === 200,
    db: ready.json?.data?.database,
  });

  const pwd = process.env.SEED_ADMIN_PASSWORD;
  const user = process.env.SEED_ADMIN_USERNAME ?? "demo.admin";
  if (pwd) {
    const res = await fetch(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...CSRF },
      body: JSON.stringify({ username: user, password: pwd }),
    });
    const loginJson = await res.json().catch(() => ({}));
    const cookie = res.headers.get("set-cookie")?.split(";")[0] ?? "";
    results.checks.push({
      name: "auth/login",
      status: res.status,
      pass: res.status === 200 && loginJson?.success !== false,
    });
    if (cookie) {
      const me = await fetch(`${base}/api/v1/auth/me`, { headers: { Cookie: cookie } });
      const meJson = await me.json().catch(() => ({}));
      results.checks.push({ name: "auth/me", status: me.status, pass: me.status === 200 });
      const emp = await fetch(`${base}/api/v1/employees?limit=1`, {
        headers: { Cookie: cookie, ...CSRF },
      });
      results.checks.push({ name: "employees/read", status: emp.status, pass: emp.status === 200 });
    }
  } else {
    results.checks.push({ name: "auth/login", pass: false, skipped: "SEED_ADMIN_PASSWORD unset" });
  }

  const fail = results.checks.filter((c) => c.pass === false && !c.skipped);
  console.log(JSON.stringify(results, null, 2));
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});