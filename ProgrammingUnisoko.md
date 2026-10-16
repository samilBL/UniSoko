# Programming UniSoko

This document describes the public application architecture and business rules visible in the source. It intentionally excludes credentials, private configuration, and sensitive operational data.

## Architecture

- The application uses Next.js 16 App Router, React, TypeScript, and Tailwind CSS. Route pages live under `src/app`; JSON endpoints live in `src/app/api` as Route Handlers.
- Shared storefront state and browser-facing data are provided by `src/context/StoreContext.tsx`. Reusable interface elements live in `src/components` and domain helpers in `src/lib`.
- Supabase is the persistence layer. Public/server access helpers are in `src/lib/supabaseServer.ts`, privileged server operations use `src/lib/supabaseAdmin.ts`, and schema changes are ordered SQL files in `supabase/migrations`.
- The admin interface uses the signed session helpers in `src/lib/adminAuth.ts`. Administrative mutations should validate input, require this session, and record important changes through the admin audit helper.
- The service worker and install metadata are in `public/sw.js` and `public/manifest.json`.

## Seller mechanisms

Sellers apply through the seller portal. Admin review controls whether a seller account and submitted product listings become active. Checkout resolves marketplace product prices and seller settings on the server; client-submitted prices and order statuses are not authoritative. Subscription and seller entitlement rules are implemented in `src/lib/sellerEntitlements.ts` and the corresponding migrations. Seller-managed Winga campaigns can control eligible commission attribution.

## Winga links and attribution

Approved Winga referral codes use the `WINGA-` prefix and a six-character hexadecimal suffix. Public referral URLs use the `ref` query parameter, for example `/?ref=WINGA-A1B2C3`. The storefront normalizes and stores a valid code locally, and checkout submits it for server-side approval and discount validation. Group-buy links use `/group-buy/{id}`; participants are tracked with a browser-generated participant token. Treat referral and group-buy URLs as public attribution links, not as admin credentials.

## Discount and price formulas

- Quantity pricing: for products with a wholesale price, checkout uses the wholesale unit price when the requested quantity reaches that product's configured wholesale minimum; otherwise it uses the retail unit price. The shared helper is `getWholesaleUnitPrice` in `src/lib/pricing.ts`.
- Seller wholesale price: `retail price × (1 − seller wholesale discount percent / 100)`, with the configured seller minimum quantity.
- Winga checkout discount: up to TZS 5,000, capped at the merchandise subtotal. The code must resolve to an approved Winga. Seller products require an enabled seller campaign for Winga eligibility.
- Delivery fee: determined from the selected campus and delivery mode on the server. Current checkout behavior uses free campus-area delivery for the supported Mbeya flow and TZS 7,000 for courier delivery elsewhere.
- Trade-in estimate: the server verifies the quote token and expiry, then caps the applied estimate at the merchandise subtotal. Physical inspection may change the final trade-in value.
- Order total: `max(0, merchandise subtotal + server delivery fee − approved Winga discount − verified trade-in estimate)`.

The buyer's transaction reference records a submitted payment claim; it does not by itself prove that funds were received. Admin/payment operations must verify payment before marking an order paid or approved.

## Advertising

Businesses choose a self-serve placement, duration, target campuses, campaign title, creative image, and destination through `/advertise`. The server calculates fixed fees (TZS 30,000 per week for Homepage Spotlight, TZS 25,000 per week for Category Exclusive Sponsor, and TZS 40,000 per Campus Community Blast), validates an active configured payment method, and records the submitted transaction reference. The client never supplies the payable amount. Payment is manual Lipa Namba/bank transfer and the reference remains unverified until an admin checks the payment ledger. In the admin panel, staff can verify or reject the payment, review the creative, and set campaign status and schedule dates. Campaign publication is operationally performed after approval; no automatic placement renderer or payment gateway callback is configured. `Semester Rush Partner` remains a custom quote handled by the partnerships team. Applying `supabase/migrations/20261021_advertising_applications.sql` creates the private campaign and payment-review fields.

## Deployment notes

Apply new SQL migrations to the target Supabase project using the team's normal reviewed deployment process. Apply `20261021_advertising_applications.sql` after the migration that creates `payment_settings`. Before opening ad submissions, configure and activate at least one correct public payment method in the admin payment settings; the initial placeholder payment method is intentionally inactive. Staff need to compare ad transaction references with the payment ledger before verifying them. This repository task does not apply migrations to hosted infrastructure. Confirm the expected public site URL, Supabase server credentials, and admin session settings in the deployment environment without placing their values in this document. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before release.
