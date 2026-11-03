# Client Wave 1 — Initial administrator setup

**Client confirmation (Wave 1):** Only **one user** requires full access initially. RBAC remains for future roles.

## Engineering approach

- **No** hardcoded production credentials in source.
- **No** public self-registration or open bootstrap endpoints.
- **No** removal of permissions, roles, or admin APIs.
- Dev/staging continue to use `prisma/seed.ts` with `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` (rotate before any shared environment).

## Production recommendation

1. Deploy ITDMS with existing RBAC tables and permission keys unchanged.
2. Create **one** active user via secured `/admin` (requires existing admin) **or** one-time seed on empty database only.
3. Assign a single role that includes required permissions (today: dev seed uses `it_admin_proposed` with all keys — rename/display for production when **D01** matrix is finalized).
4. Document username custody with IT sponsor; enforce password policy per **D22** when answered.
5. Add further users only after D01 role matrix approval.

## Not in Wave 1

- Disabling RBAC or shrinking permission catalog.
- Automatic LDAP/SSO (**D02** still open unless client confirms local accounts only).

See also: [`CLIENT_APPROVED_WAVE1_REPORT.md`](./CLIENT_APPROVED_WAVE1_REPORT.md).
