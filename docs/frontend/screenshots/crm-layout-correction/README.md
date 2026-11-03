# CRM layout correction — screenshot evidence (Phase 02)

Captured with Playwright against **production** `next start -p 3011`, API `http://127.0.0.1:3000`, auth `admin.dev`.

## Run

```powershell
cd D:\ITDM-Sale-Management\apps\web
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
cd D:\ITDM-Sale-Management
npm run build --workspace=@itdms/web
$env:ITDMS_API_URL="http://127.0.0.1:3000"
$env:WEB_ORIGIN="http://127.0.0.1:3011"
cd apps\web
npx playwright test e2e/crm-layout-correction-capture.spec.ts --project=chromium-desktop
```

## Naming

`{route-name}-{viewport}-light.png` — viewports: **1440**, **1280**, **1024**, **768**, **390**, **375**.

Detail captures (1440 only): `employees-detail`, `vendors-detail`, `assets-detail`, `purchase-orders-detail`.

**CRM authenticated reference:** still unavailable; parity assessed vs CRM source (`leads/new`, `customers/[id]`).
