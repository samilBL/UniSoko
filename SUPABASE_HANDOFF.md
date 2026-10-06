# Supabase Handoff

## Phase 7 Public Marketplace

- Apply `supabase/migrations/20261017_public_marketplace_trust.sql` before deploying this phase. It adds the official UniSoko product flag and labels existing first-party listings.
- Public seller profiles expose only approved seller identity/profile fields and verified status. Contact options and private verification notes remain server-side.
- Public reports require a signed-in Supabase user and enter `marketplace_reports` for admin review.
- Product attribute values are loaded from the existing dynamic attribute tables. Confirm the Phase 1 marketplace foundation migration is installed.

## Phase 9 Trust, Moderation, and Analytics

- Apply `supabase/migrations/20261018_seller_notifications_analytics.sql` to add seller notification storage and moderation-decision notifications.
- Seller insights include listing status counts, asking-price value of approved listings, and Winga commission ledger totals. Asking-price totals are not sales revenue.
- Admin marketplace controls now include reporting, verification review, audit history, marketplace totals, and featured status controls for active approved listings.
- Product/seller reports require signed-in customer accounts and are processed manually in the admin queue.

## Phase 10 Security and Regression Test Handoff

- `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed after replacing existing `any` catches/types and correcting the splash-screen effect lint error. Three image optimization warnings remain for seller/admin image previews.
- No unit or integration test runner is configured in `package.json`.
- Local unauthenticated admin API requests redirect to `/admin/login`; unauthenticated seller API routes return 503 because Supabase Auth is not configured in this checkout. Do not interpret that as a successful signed-in seller flow.
- The local public, seller login, Winga application/login/leaderboard, and admin login pages returned HTTP 200. A narrow browser view showed the horizontal Campus Hub navigation; dynamic auth/payment/moderation flows and role matrix remain unverified without test accounts and a configured non-production Supabase project.
- Local browser logs observed an Unsplash image URL returning 404 for the sample power bank listing. Replace it with a verified asset before using that sample listing in production.

This handoff records database- and provider-dependent work from the production-readiness sequence. No credentials are included.

## Connection Status

The local app has a reachable Supabase project and Auth responds successfully. On 2026-10-01, every checked legacy and expansion table below returned `200` through PostgREST using the server key. Anonymous reads of `winga_applications`, `orders`, and `order_items` returned `401` with the public key. Both cancellation RPCs were invoked with nonexistent IDs and returned the expected not-found errors without creating data. All four checked storage buckets returned `200`.

- `trade_in_requests`
- `campus_votes`
- `store_settings`
- `group_buys`
- `group_buy_participants`
- `winga_applications`
- `orders`
- `order_items`
- `order_status_history`
- `student_bundles`
- `student_bundle_items`
- `promo_banners`
- `hostel_listings`
- `room_bounty_submissions`
- `order_cancellation_requests`

The base schema and expansion migrations through `20261007_admin_audit_logs.sql` are installed and reachable in the connected project. The audit table returned `200` using the service-role key. This verifies table presence, not the full RLS role matrix or successful authenticated admin writes.

## Apply Database SQL

For a new Supabase environment, apply these in order in the Supabase SQL Editor. The connected project was verified with all listed migrations present on 2026-10-01; do not blindly rerun or modify production data.

1. `supabase/schema.sql`
2. `supabase/migrations/20260930_order_tracking.sql`
3. `supabase/migrations/20260930_winga_applications.sql`
4. `supabase/migrations/20261001_student_bundles.sql`
5. `supabase/migrations/20261001_trade_in_checkout.sql`
6. `supabase/migrations/20261002_winga_leaderboard.sql`
7. `supabase/migrations/20261003_hostels_bounties.sql`
8. `supabase/migrations/20261004_promotional_banners.sql`
9. `supabase/migrations/20261004_winga_student_id_storage.sql`
10. `supabase/migrations/20261005_developer_profile.sql`
11. `supabase/migrations/20261006_order_cancellations.sql`
12. `supabase/migrations/20261007_admin_audit_logs.sql`
13. `supabase/migrations/20261008_support_warranty_issues.sql`
14. `supabase/migrations/20261009_products_and_universities.sql`
15. `supabase/migrations/20261010_group_buy_multi_product.sql`
16. `supabase/migrations/20261011_multivendor_foundation.sql`
17. `supabase/migrations/20261012_seller_accounts_dashboard.sql`
18. `supabase/migrations/20261013_seller_subscriptions.sql`
19. `supabase/migrations/20261014_intelligent_product_creation.sql`
20. `supabase/migrations/20261015_seller_product_moderation.sql`
21. `supabase/migrations/20261016_seller_winga_campaigns_group_buys.sql`
22. `supabase/migrations/20261017_public_marketplace_trust.sql`
23. `supabase/migrations/20261018_seller_notifications_analytics.sql`
24. `supabase/migrations/20261019_password_portal_accounts.sql`
25. `supabase/migrations/20261020_trusted_institution_logos.sql`

Migrations 13–25 were added after the connected-project verification noted above. Confirm their deployment state before applying them to an existing environment. The multi-vendor migration depends on the products table from migration 14 and must be applied after it and migration 15. Phase 1–5 migrations have not been applied or verified in the connected project as part of this work.

The Phase 2 seller migration adds server-only transactional functions for submitting and reviewing seller applications. Phase 3 adds configurable trial and paid plans, seller payment requests and payment-review functions, and seeds initial plan rows. Apply it after Phase 2. Seller routes use the existing verified Supabase Auth user and the service-role client only on the server; seller status is read from `seller_profiles`, not user-editable auth metadata. Approved sellers receive one configured trial. Set up the LIPA instructions and public payment details in `/admin/subscriptions` before sellers submit payments; no provider verifies references automatically. Existing approved sellers are backfilled one trial by migration, if they have no subscription history.

Phase 4 product drafts load active categories, subcategories, conditions, and scoped attributes/options from the database. Product images upload to the public `seller-product-images` bucket through the authenticated seller API; the browser never receives the service-role key. Apply migration 19 after the multivendor, seller, and subscription migrations. Phase 6 adds the admin catalog editor at `/admin/marketplace` for categories, subcategories, conditions, scoped attributes, and select options. Seller draft creation remains private; moderation/submission is Phase 5.

Phase 5 lets approved sellers submit completed drafts for review. The admin queue at `/admin/product-moderation` supports approval, rejection, and change requests; only approved listings owned by currently approved sellers are returned from the public product API. Apply migration 20 after Phase 4. The existing official catalog editor excludes seller-owned products. These changes are not active on the connected Supabase database until the Phase 1–5 migrations are applied in order.

Phase 6 adds `/admin/marketplace` with links to existing seller account, subscription/payment, and product approval queues; database-backed catalog editing; seller verification decisions; marketplace report review; marketplace counts; and recent admin audit activity. Its server API requires the signed admin session and uses the service-role client. It reuses tables and columns from migrations 16–20, so Phase 6 introduces no additional SQL migration. The page requires migrations 16–20 and the pre-existing audit-log migration (12) to be applied. Counts describe current records and payment statuses; they are not revenue reconciliation or provider verification. These Phase 6 controls have not been verified against the connected Supabase environment.

Seller accounts now use `/seller/login`; Winga authentication remains under `/winga/login`. Both portals currently authenticate against the same configured Supabase Auth project and user identity, while seller profiles and Winga applications remain separate role records. Seller-approved products can opt into a seller-funded Winga commission (1–30%) and set group-buy pricing/minimums in the seller dashboard. Approved Wingas see opted-in seller campaigns and share links in their Winga portal; the link carries the Winga code into checkout. Seller product checkout calculates prices server-side and records seller ownership and commission rate snapshots on order items. On an order transition to verified payment and delivered status, the database trigger writes payable commissions for UniSoko items at 5% and seller items only when the seller opted in. `/admin/winga-commissions` records actual manual payouts by their external provider reference; it does not initiate money transfers. Apply migration 21 after migrations 16–20 and the base order, Winga, and group-buy schema migrations. The current group-buy flow coordinates participants and wholesale pricing; it does not collect participant payments or automatically create pooled orders.

The order-tracking migration creates orders, itemized order lines, and status history; adds uniqueness for payment transaction references; enables RLS; denies direct anonymous/authenticated table access; and grants data access to the server service role. The Winga migration creates applications linked to Supabase Auth users and restricts table access to the service role.

The expansion migrations add one-time in-cart trade-in quote fields, Winga verification state, published bundle snapshots and items, verified hostel listings, room finder bounty/payout state, scheduled promotional banners, public developer-profile image storage, token-authorized order cancellation requests with manual refund-reference capture, and append-only admin audit storage. All tables through `20261007_admin_audit_logs.sql` were verified reachable in Supabase. Cancellation records do not initiate transfers or update stock. Bundle definitions displayed by the storefront remain curated in source code; SQL bundle records are not yet admin-editable.

For each target environment, confirm the tables and buckets are reachable by server routes and repeat anonymous-access checks. Do not remove RLS or expose the service-role key to browser code.

## Supabase Password Authentication

- Keep the Supabase email/password provider enabled. New portal accounts are created through the server-side Admin API with email-confirmed status so signup does not require an email/SMS code; password login still runs through Supabase Auth.
- Keep the Supabase project URL, public key, and service-role key set for the correct Vercel environment. The service-role key remains server-side only.
- Configure production and preview site URLs in Supabase Auth redirect/site settings for sign-out and any approved recovery flow. Email/SMS OTP is not part of the new Winga or seller signup/login flow.
- Winga phone numbers are contact/lookup values and are not verified by a code. Admin should verify identity/contact information during application review before activating an account for payout-related operations.
- Existing OTP-only account owners can use password recovery to set a password through an email link. Configure a production email provider and allow `/auth/callback` in Supabase redirect URLs; recovery sends a link, not an OTP login code.

## Password Portal Accounts and Trusted-by Logos

- Apply `20261019_password_portal_accounts.sql` after migrations 1–23. Winga and seller registration now create confirmed-password Supabase Auth users server-side, store normalized phone/email lookup in `account_directory` (RLS enabled; service-role only), and immediately create the corresponding pending application. The name entered by a Winga must match their student ID. Admin review remains the activation gate for role-specific features.
- The portal login endpoints accept email or normalized Tanzanian phone plus password. The phone-to-email lookup stays server-side. Sign-in attempts and registrations are limited per client IP through `consume_portal_auth_rate_limit`; this migration is required before those endpoints can accept attempts. Public Auth OTP signup/sign-in UI has been removed.
- Existing accounts created through email OTP may not have a password; use the email password-reset link to set one. The migration backfills phone lookup from existing Winga and seller records when possible, while duplicate or unusable historical phone values are skipped. Do not mark legacy emails verified or assign passwords without account ownership validation.
- Apply `20261020_trusted_institution_logos.sql` to create the public, size/MIME-limited logo bucket. Admin settings already persist partner records; the updated settings panel supports adding names, categories, links, and uploaded logos. The homepage renders them in the “Trusted by our campus community” strip near the bottom of the storefront. If the bucket is absent, admin can still use a verified HTTPS logo URL.
- Newly created Auth users are marked email-confirmed because the requested signup flow deliberately does not send OTPs. This means email ownership is not proven at signup; admin review is the separate application approval gate. Confirm this is acceptable for operations, and verify phone ownership during review before any payout details are relied on.
- Configure a working Supabase email provider and allow `/auth/callback` and `/auth/update-password` in the Auth redirect URL list for password recovery.

## Customer E2E Retest

Once the tables exist, rerun these cases against Supabase:

- Submit one product and multiple distinct products; verify persisted order lines and server-calculated amount.
- Submit below/at/above each product's wholesale threshold; confirm retail/wholesale tier, courier fee, and Winga discount.
- Submit the same transaction reference twice, including case variation; expect the second request to be rejected without creating another order.
- Submit a malformed reference and a product marked `Coming Soon`; confirm rejection and no order write.
- Load the returned tokenized tracking link; verify private order access and status history.
- Exercise admin payment verification and subsequent fulfillment transitions; verify invalid transitions are rejected.
- Create, join, expire, and retry group buys; ensure counts are idempotent and thresholds match product configuration.

Do not use real payments for test orders. Use a designated test reference/provider environment and remove test records only through an approved cleanup procedure.

## Known Boundaries

- The API's server-side prices are currently read from `MOCK_PRODUCTS` and source-defined bundles. They are protected from browser price tampering, but are not yet backed by a centrally editable persistent catalog. Admin product edits in localStorage do not update the API catalog.
- There is no buyer/customer registration/login system, map pin/location-coordinate system, or product review flow. Seller and Winga password accounts are separate role-based portals and do not create buyer checkout accounts.
- Inventory reservation/stock deduction, provider-verified payments, a financial ledger, Winga commission/payout persistence, and automated refund transfers are not implemented. Cancellation requests now block dispatch while under review; completing a paid cancellation only records the manually processed full-refund reference. Do not represent this as automatic money movement, stock restoration, or oversell prevention.
- API creation records a submitted transaction reference; payment is not verified by a mobile-money provider. Admin verification remains required.
- Once migrations are applied, duplicate transaction references are rejected by a unique database constraint, repeated group-buy joins are idempotent for the same participant token, and checkout rejects unapproved Winga codes. These are basic integrity controls, not a fraud-detection system.
- Customer accounts are not implemented, so self-referral detection and reliable cross-device identity correlation are unavailable. There is also no persistent risk-flag queue or abuse audit trail. Add these only alongside a customer identity model and reviewed privacy/retention rules.

## Other Supabase-Dependent Items

- **Item 1, customer E2E:** Checkout/order/tracking paths exist, but customer accounts, reviews, precise map pins, full delivery assignment, stock reservations, and actual provider verification are absent. API rejection probes were run; the complete paid journey was not.
- **Item 2, Winga E2E:** Email OTP, application, admin approval, and promo code exist. KYC image upload, assigned orders, durable commission creation/availability, and payout records still need authoritative data.
- **Item 3, Admin E2E:** Persisted order/payment-state transitions exist; inventory, Winga finance, and audit history are not persistent. Product/catalog edits and several controls remain browser-local.
- **Item 4, cancellations:** Token-authorized requests, admin review, dispatch holds, and manual refund-reference capture exist. Automated refund transfer, inventory release, and ledger reconciliation remain manual/not implemented.
- **Items 5–6, refunds/returns/warranty:** No full refund case system, returns inspection queue, repair/replacement workflow, or durable configurable warranty claim system exists yet.
- **Items 7–9, support/issues/business dashboard:** Durable cases, assignments, audit timestamps, and operational order queries need tables and policies. Existing WhatsApp support can be tested separately.
- **Items 10–11, university onboarding/campus launch:** University, campus, delivery-zone, and hub configuration is static TypeScript data rather than admin-managed persistent configuration.
- **Item 17, fraud flags:** Risk flags and review decisions need durable records.
- **Items 18–21, backup/recovery, audit logs, security/RLS, database review:** These require an installed schema and project access. RLS must be checked against actual policies, not inferred from SQL files alone.
- **Item 22, role review:** Admin cookie auth and Winga email auth exist in code, but production role and RLS behavior requires the schema and configured project.
- **Part B, Items 24–34, centralized contacts/developer profile:** Official values are centralized and the admin-editable public profile, image upload, `/developer` page, and footer attribution are implemented through `store_settings`; the profile image bucket is public-read. Verify its storage access and profile mutation behavior in the target deployment.

## Security Review Handoff (Item 20)

Code-level checks added handler-level signed-admin-session verification to campus-vote totals, trade-in reads/updates, and store-settings writes; these routes had relied only on the proxy. Winga application/profile handlers verify the Supabase user and bind profile reads to the authenticated user ID. Order creation recalculates seeded-catalog pricing server-side, validates active Winga codes, and relies on a unique transaction-reference constraint once migrated. Order tracking uses a high-entropy bearer token and stores only its SHA-256 hash.

Remaining security checks/findings requiring the database or operational controls:

- Table reachability was checked with the service-role key, and anonymous reads were denied for three sensitive tables. Verify effective RLS and grants for every table with anon, authenticated, and service-role clients before launch; the full role matrix has not been tested.
- Public group-buy join accepts a caller-supplied participant UUID. The unique constraint prevents replay of the same token, but callers can generate new tokens to inflate participant counts; treat counts as untrusted demand signals until identity/rate controls are added.
- Campus-vote identity is browser-supplied and can be reset/spoofed; use it only as approximate demand analytics, not a security or financial signal.
- Public trade-in and order-submission routes have no verified customer identity or durable abuse-rate controls. Add gateway/server rate limits and monitored risk flags before launch; do not rely on client-side IDs.
- The payment transaction reference is syntactically checked and de-duplicated when the migration is active, but no provider reconciliation API verifies that money reached UniSoko. Admin/manual verification remains mandatory.
- A tracking URL is a bearer credential with no expiry/rotation or revocation UI. Avoid sharing it publicly; consider expiry or reissue support before exposing sensitive location details (none are currently stored as coordinates).
- No security audit log or financial ledger is present. Never treat localStorage balances, orders, or payout references as authoritative.
- The append-only audit log records server-backed admin changes after applying `20261007_admin_audit_logs.sql`. It does not cover browser-local product/payout changes and its write is not transactionally coupled to every business mutation; finish that hardening before relying on it for compliance.

## Backup and Recovery Handoff (Item 18)

No production database backup or restore drill has been verified. Before accepting real orders:

1. Confirm the Supabase project plan's automatic backup and point-in-time recovery retention; enable PITR if the plan and required recovery window support it.
2. Set an owner-operated encrypted `pg_dump` schedule for critical data as a separate recovery path. Store dumps outside the Supabase project with access controls and retention; never commit them.
3. Back up private Storage objects separately from database metadata. The `trade-in-photos` bucket needs both object backup and a tested metadata/path restore.
4. Document recovery owners, escalation contacts, target RPO/RTO, restore commands, and how to rotate/recover service credentials without placing secrets in this repository.
5. Run a restore drill into a non-production Supabase project before launch and verify orders, order items/history, Winga applications, trade-in records, Storage references, and Auth user references.

Until this is configured, product edits, demo orders, agent balances, and related localStorage state are browser-local and cannot be centrally backed up or recovered.

## Audit Log Handoff (Item 19)

No general audit log exists. Before financial, order, inventory, Winga, or developer-profile mutations become production operations, add an append-only server-written log with actor, action, resource type/id, timestamp, and safe metadata. Deny update/delete access to normal app roles; use a narrowly authorized retention/maintenance path. Do not log OTPs, auth tokens, full payment credentials, or unnecessary customer location details. Test audit insertion and the business mutation atomically or define a durable outbox strategy.

## Phase 11 Production Readiness Audit

Audit scope: repository configuration, environment-variable access patterns, SQL migration definitions, storage bucket definitions, indexes, route authentication boundaries, responsive/performance signals, and Vercel project files. No secret values were read or added. No production database was changed.

- **Environment and secrets:** `.env.example` documents the admin credentials/session secret, public site URL, Supabase URL/public key, and server-only service-role key. The service-role key is accessed in `src/lib/supabaseAdmin.ts`, which is marked `server-only`; browser/proxy/server Supabase clients use only the public key. Hardened the template to avoid the sample username/password looking like valid credentials. `.gitignore` now ignores all `.env*` files while explicitly retaining `.env.example`, including `.env.production`. Configure real values in Vercel's encrypted Environment Variables UI for the correct Production environment; do not put them in Git. No local `.env`, `.env.local`, or `.env.production` was present during this audit.
- **Database/migration state:** SQL files are additive and define RLS for sensitive tables, service-role grants, foreign keys/checks, uniqueness constraints, and query indexes. The handoff order now includes migrations 22–25 (marketplace trust, seller notifications, password portal accounts, and institution logos). Repository inspection cannot establish which migrations are installed in the target production database. Compare each migration with the Supabase migration history before applying; do not rerun old scripts blindly or apply directly to production without a backup/restore plan.
- **Storage:** SQL defines public buckets for approved product images, promotional banners, developer profile images, and private Winga student-ID files; hostel and trade-in storage are defined in the earlier migration set. Uploads are routed through authenticated server handlers. Confirm bucket existence, privacy, MIME/size limits, object access, and backup/restore behavior in the target Supabase project. In particular, verify KYC files are not publicly readable and private hostel/trade-in paths are only returned as short-lived signed URLs.
- **Indexes and performance:** Migrations include indexes for common status/date, ownership, category, and lookup paths. This is a source-level review only; production query plans, table growth, image delivery, and Core Web Vitals were not measured. Review `EXPLAIN (ANALYZE, BUFFERS)` on representative read queries in a safe environment before adding indexes or changing production data.
- **Errors/authentication/authorization:** Supabase configuration failures generally return controlled 503 responses; admin routes use signed session checks, Winga/seller APIs verify Supabase users, and seller ownership/status is resolved server-side. The complete authenticated role matrix, cookie behavior behind the production proxy, and effective RLS/grants have not been exercised against production. Complete the anon/authenticated/service-role matrix and portal login, logout, expiry, and cross-role cases in a non-production project. Seller dashboard unauthenticated redirects now go to seller login; Winga routes go to Winga login.
- **Mobile/performance:** No automated viewport or production performance measurement was made in this audit. Verify key storefront, seller, Winga, and admin flows at narrow mobile widths and check image loading/network behavior before launch. Existing handoff notes three image optimization warnings and a sample Unsplash URL returning 404.
- **Vercel:** `package.json` declares Next.js and its build script, and the repository root contains the app/package manifest; no `vercel.json` or checked-in GitHub workflow was found. Keep Vercel's Root Directory set to this repository root (the directory containing `package.json` and `src/app`), use the Next.js framework preset, and confirm the build command `npm run build` or the configured Vercel equivalent. Preview and Production environment scopes/domains are dashboard configuration and cannot be confirmed from this checkout.

### Deployment checklist

1. Confirm Vercel Root Directory points to the repository root containing `package.json` and `src/app`, and run a clean production build in the deployment pipeline.
2. Add `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (32+ random characters), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, one supported public Supabase key, and `SUPABASE_SERVICE_ROLE_KEY` in the correct Vercel Production environment. Keep the service-role key server-only and use unique production admin credentials.
3. Confirm Production domain/site URL and Supabase Auth URL allowlist, email OTP template/SMTP configuration, and cookie behavior on the actual HTTPS domain.
4. Compare the full ordered migration list above with Supabase migration history. Back up first, apply only missing migrations using the reviewed procedure, and record the resulting migration versions.
5. Verify storage bucket settings and private/public object access, then test representative uploads/downloads and recovery from backup in a non-production project.
6. Run the anon, authenticated customer, Winga, seller, admin, and service-role authorization/RLS matrix; check role separation, direct table access denial, and API ownership enforcement.
7. Exercise login/logout/session expiry, checkout/payment review, seller moderation, Winga commissions, group buys, reports, and error/configuration failure paths with designated test accounts and non-payment test data.
8. Check mobile layouts, image URLs/optimization, production logs, representative database query plans, and Core Web Vitals; alert on elevated 4xx/5xx rates and failed background/provider operations.
9. Confirm backup retention/PITR, encrypted off-project backups, recovery owners/RPO/RTO, and a successful restore drill before accepting real orders or KYC documents.

**Phase 11 status:** repository-level audit and checklist complete. Production values, deployed Vercel settings, live migration state, effective RLS, backup configuration, and production performance remain unverified and require the target provider dashboards/project. No destructive migration or production write was performed.
