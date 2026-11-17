# ITDMS Prompt #34 — Official Issuance/Return XLSX (live fix)

**Date:** 2026-11-17  
**Hosted stack:** Netlify `wondrous-souffle-1f0155` → Render `itdm-sale-management-system` → Neon `itdms_demo`

---

## Root cause of HTTP 404

| Finding | Detail |
|---------|--------|
| Symptom | `GET /api/v1/asset-issuances/{id}/official-xlsx` and `asset-returns/{id}/official-xlsx` → **404** (Netlify proxy and direct Render). |
| Movement document | **Exists** — e.g. `GET /api/v1/asset-issuances/1` → **200** (`ISS-DEMO-001`). |
| Code path | `AssetMovementOfficialExportService.resolveTemplatePath()` → `fs.existsSync(templatePath)` **false** → `AppError(NOT_FOUND, "Official template file not found at …")` → **404**. |
| Effective paths on Render | `ITDMS_ISSUANCE_TEMPLATE_PATH` / `ITDMS_RETURN_TEMPLATE_PATH` pointed at `/etc/secrets/Issuance.xlsx` but **binary XLSX was never provisioned** (Render Secret Files are text-oriented). |
| Startup logs | Warning: *"Official template file not present — official XLSX export blocked until provisioned"* (post-bootstrap check). |

**Not** a proxy bug: direct Render API returns the same 404.

---

## Solution implemented (code — local, not deployed)

Base64 **text** secret files → decode at **API startup** (before `loadEnv` cache) → ephemeral XLSX under `/tmp/itdms-templates/` with **SHA-256** integrity check and **ExcelJS** open validation.

### Files changed

| File | Change |
|------|--------|
| `apps/api/src/shared/bootstrap/official-templates-bootstrap.ts` | Decode `.b64` secret files; hash + ExcelJS verify; set `process.env.ITDMS_*_TEMPLATE_PATH` |
| `apps/api/src/shared/bootstrap/official-template-hashes.ts` | Expected SHA-256 constants |
| `apps/api/src/server.ts` | Run `bootstrapOfficialTemplatesPreEnv` **before** `buildApplication()`; `resetEnvCache()` |
| `apps/api/src/shared/config/env.ts` | `resetEnvCache()` export |
| `scripts/windows/prepare-render-template-b64.ps1` | Local encoder (output **gitignored**) |
| `deploy/free-tier/env.api.demo.example` | `ITDMS_*_B64_PATH`, `ITDMS_TEMPLATES_DECODE_DIR` |
| `render.yaml` | Default B64 secret paths |
| `.gitignore` | `deploy/free-tier/secrets/` |
| `apps/api/tests/official-templates-bootstrap.test.ts` | Regression test |
| `docs/deployment/ITDMS_PROMPT34_OFFICIAL_XLSX_FIX.md` | This report |

No business-logic changes in movement/export rules.

---

## Secure template provisioning method

1. **Keep originals** in `storage/client-templates/` (already gitignored for `*.xlsx`).
2. **Generate base64 text locally** (never commit):

   ```powershell
   powershell -NoProfile -File scripts/windows/prepare-render-template-b64.ps1
   ```

   Outputs (gitignored):

   - `deploy/free-tier/secrets/Issuance.xlsx.b64`
   - `deploy/free-tier/secrets/Return.xlsx.b64`

3. **Render Dashboard → Web Service → Secret Files** — create **text** secrets:

   | Secret file name | Local source |
   |------------------|--------------|
   | `Issuance.xlsx.b64` | paste **entire** contents of `Issuance.xlsx.b64` |
   | `Return.xlsx.b64` | paste **entire** contents of `Return.xlsx.b64` |

   Do **not** paste raw binary into Secret Files. Do **not** commit or chat-share base64.

4. **Environment variables** (Render):

   | Variable | Value |
   |----------|--------|
   | `ITDMS_ISSUANCE_TEMPLATE_B64_PATH` | `/etc/secrets/Issuance.xlsx.b64` |
   | `ITDMS_RETURN_TEMPLATE_B64_PATH` | `/etc/secrets/Return.xlsx.b64` |
   | `ITDMS_TEMPLATES_DECODE_DIR` | `/tmp/itdms-templates` |

   Remove or leave unset legacy `ITDMS_ISSUANCE_TEMPLATE_PATH` pointing at missing binary paths (bootstrap overwrites after decode).

5. **Deploy new API build** containing this commit (requires **approved** Git push + Render manual deploy).

6. **Startup behavior:** each Render start/redeploy re-reads `.b64` files, decodes to `/tmp/itdms-templates/*.xlsx`, verifies SHA-256, opens workbook with ExcelJS.

### Original vs decoded hash verification

| Template | Bytes | SHA-256 |
|----------|------:|---------|
| Issuance.xlsx | 55,286 | `ffc26c2f62b6fb8539f86b16517ea33bab458e9c9d73bd7b0ed894da19caeda4` |
| Return.xlsx | 55,273 | `d1dc5237d54fbd070d4073c340090849069dba6f3c54fe8942d9552093f7750d` |

Decoded files must match these hashes or startup fails (unless `ITDMS_OFFICIAL_TEMPLATE_SKIP_HASH=1` — **dev only**).

---

## Local verification (completed)

| Test | Result |
|------|--------|
| API TypeScript build | **PASS** |
| Vitest `official-templates-bootstrap.test.ts` | **PASS** — decode + SHA-256 match |
| Hosted issuance XLSX | **BLOCKED** — Render still on **pre-fix** build without secrets |
| Hosted return XLSX | **BLOCKED** — same |
| Frontend download through Netlify | **BLOCKED** until Render redeploy |

### Post-deploy verification commands (operator)

After Render redeploy with secrets + new code:

```powershell
# Login session via Netlify proxy, then:
# GET https://wondrous-souffle-1f0155.netlify.app/api/v1/asset-issuances/1/official-xlsx
# GET https://wondrous-souffle-1f0155.netlify.app/api/v1/asset-returns/3/official-xlsx
```

Expect **HTTP 200**, `Content-Type` spreadsheet, file size ≈ 55KB, Excel opens, fields populated for synthetic demo (`ISS-DEMO-001`, `RET-DEMO-001`).

---

## Render Dashboard actions required (user)

1. Run `prepare-render-template-b64.ps1` locally.
2. **Git push** approved commit (this Prompt #34 code) to `main`.
3. Render → **Manual Deploy** latest `main`.
4. **Secret Files:** add `Issuance.xlsx.b64` and `Return.xlsx.b64` (text).
5. **Environment:** set B64 path vars (see table above).
6. **Logs:** confirm `Official template decoded from Render secret file` (no base64 in logs).
7. Re-run hosted XLSX checks (browser or `hosted-uat-prompt33b.mjs` extension).

**No paid resources. No Neon reset. No `jobs.run` grant to `demo.admin`.**

---

## Remaining UAT items (unchanged by Prompt #34)

| Item | Status |
|------|--------|
| Finance RBAC (Manager / IT Staff) | **BLOCKED** — no extra demo roles without authorized seed |
| Mobile / dark UI matrix | **NOT RUN** |
| Session cookie attribute audit | **PARTIAL** |
| Manual notification job | **LIMITED** — `demo.admin` → **403** on `/internal/jobs/expiry/run` (intentional; no auto `jobs.run` grant) |
| Runtime npm audit | See Prompt #33B (no blind `audit fix --force`) |

---

## Result summary

| Check | Status |
|-------|--------|
| **Hosted issuance XLSX** | **BLOCKED** (fix ready; awaiting push + Render secrets + deploy) |
| **Hosted return XLSX** | **BLOCKED** (same) |
| **Root cause** | Confirmed — missing template files on Render |
| **Code fix** | Complete locally |
| **GitHub push** | **Not performed** (per authorization boundary) |
| **Cloud redeploy** | **Not performed** |

---

## Approval gate

Reply with authorization to:

1. Create focused **git commit** (bootstrap + tests + docs only; no secrets).
2. **Push** to public `main`.
3. Trigger **Render manual deploy** after you upload Secret Files.

Then re-run Prompt #34 hosted download verification for **PASS**.