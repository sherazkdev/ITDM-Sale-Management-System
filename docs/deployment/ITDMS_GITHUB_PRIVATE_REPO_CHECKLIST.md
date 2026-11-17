# GitHub private repository checklist (pre-push)

**Rule:** Repository must stay **PRIVATE**. No public fork for client IP without review.

## Before first push

| Step | Action |
|------|--------|
| 1 | Confirm `git remote -v` — intended **private** org/user repo only. |
| 2 | Review `.gitignore` — `.env`, `storage/client-templates/*.xlsx`, backups, Playwright auth state. |
| 3 | Run `git ls-files` — no `apps/api/.env`, no dumps, no real attachments. |
| 4 | No client XLSX in tree (`Issuance.xlsx`, `Return.xlsx` gitignored). |
| 5 | Scan docs for committed live secrets — dev defaults in **tests only** are acceptable; rotate demo credentials after any leak. |
| 6 | Default branch `main`; tag recovery tags preserved locally (do not delete). |

## Never commit

- Real `DATABASE_URL`, Neon credentials, `SESSION_SECRET`
- Render/Netlify tokens
- `storage/client-templates/*.xlsx`
- `apps/web/e2e/.auth/*`
- Database dumps, `backups/`, rehearsal client exports
- Screenshots with real PII/finance

## Push workflow (USER ACTION)

```text
# After explicit approval only:
git remote add origin <PRIVATE_REPO_URL>   # if not already set
git push -u origin main                    # USER runs; agent does NOT push
```

## If secrets were ever committed

1. Rotate all exposed credentials (Neon, Render, SESSION_SECRET, demo users).
2. Consider `git filter-repo` or BFG — **only with explicit authorization**.
3. Do not make repo public to “hide” history.

## Current audit snapshot (Prompt #29 prep)

- **HEAD:** verify with `git log -1` before push.
- **Remote:** `origin` → GitHub URL present; privacy must be confirmed in GitHub UI.
- **Tracked env templates:** `apps/web/.env.example`, `.env.staging.example` only (placeholders).
- **Dev passwords in source:** limited to tests/seeds with env overrides — document demo password via dashboard only.