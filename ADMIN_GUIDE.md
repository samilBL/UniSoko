# UniSoko Admin Guide

**UniSoko Tanzania — Campus Marketplace Operations Manual**
*For internal staff and authorized campus administrators only.*

---

## Table of Contents

1. [Admin Authentication & Navigation](#1-admin-authentication--navigation)
2. [Store Configuration & Live Settings](#2-store-configuration--live-settings)
3. [Order Management & Lipa Namba Payment Verification](#3-order-management--lipa-namba-payment-verification)
4. [Campus Winga Identity Review and Cash-Outs](#4-campus-winga-identity-review-and-cash-outs)
5. [Trade-In Requests & Purchase Inspection](#5-trade-in-requests--purchase-inspection)
6. [Inventory Management and Catalog Updates](#6-inventory-management-and-catalog-updates)
7. [Hostels and Room Finder Fees](#7-hostels-and-room-finder-fees)
8. [Homepage Promotional Banners](#8-homepage-promotional-banners)
9. [Audit Log](#9-audit-log)
10. [Troubleshooting and Common Errors](#10-troubleshooting-and-common-errors)

---

## 1. Admin Authentication & Navigation

### Accessing the Admin Panel

The UniSoko Admin Panel is accessible at:

```text
http://localhost:3000/admin/login        (Development)
https://unisoko.co.tz/admin/login       (Production)
```

> **Security:** `/admin/*` and `/api/admin/*` are protected by a signed, eight-hour, HTTP-only, SameSite=Strict session. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a unique `ADMIN_SESSION_SECRET` (at least 32 characters) in the deployment environment before sign-in. Never put these values in client code or commit secrets. Without those environment variables, login intentionally fails closed. Sign out from the dashboard to invalidate the browser cookie.

### First-time setup

1. Copy `.env.example` to `.env.local` for local development and replace the admin placeholders with strong values.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), and server-only `SUPABASE_SERVICE_ROLE_KEY`.
3. Apply [supabase/schema.sql](supabase/schema.sql), then every SQL migration under `supabase/migrations/` in filename order. This includes bundle, trade-in checkout, leaderboard, hostel, room-bounty, and banner tables/fields required by the new features.
4. Enable email OTP in Supabase Auth. Configure an SMTP provider for reliable delivery and update the Auth email template to include the one-time code (`{{ .Token }}`); the default confirmation-link template will not work with the code-entry screen. Email provider costs and sending limits depend on your provider and Supabase plan.
5. Keep the service-role key server-only. Trade-in photos are private and delivered to authenticated admins as short-lived signed URLs. Hostel and banner photos are public only after admins publish the associated record.
6. Winga applications and approval status are persisted in `winga_applications`. The Winga portal requires a confirmed Supabase email session; the applicant-provided mobile-money number is stored separately and is not verified by email OTP. Admins approve applicants and assign promo codes. Wallet, commission, payout, and KYC records are not yet connected to an authoritative backend ledger and must not be treated as production financial data.

### Navigation Tabs

Once inside the admin panel, you will see the following tabs:

| Tab | Icon | Purpose |
| --- | --- | --- |
| **Orders & Verification** | 🛍️ | Review incoming orders, verify Lipa Namba transaction IDs, approve payments, and dispatch campus runners |
| **Trade-In Requests** | 🔄 | Review student Sell Your Device submissions, set cash offers, and update workflow status |
| **Catalog & Pricing** | 📦 | Add, edit, or remove products. Adjust retail and wholesale (Bei ya Jumla) pricing |
| **Winga KYC & Payouts** | 💰 | Review available identity records and cash-out requests; confirm payout persistence before live disbursement |
| **Winga Applications** | 🛡️ | Review email-verified applications; approve agents and issue their UniSoko promo codes |
| **Store Settings** | ⚙️ | Update payment rails, merchants, partner logos, WhatsApp numbers, and payout thresholds; review campus vote totals |

### Quick Stats Dashboard

At the top of the admin panel, three real-time stat pills display:

- 🟡 **Pending Orders** — Orders awaiting Lipa Namba verification
- 🟣 **Trade-In Queue** — Active trade-in submissions awaiting appraisal
- 🟢 **Pending Payouts** — demo cash-out requests awaiting disbursement

---

## 2. Store Configuration & Live Settings

All live store parameters can be updated without any code changes via the **Store Settings** tab.

### Updating Multiple Lipa Namba / Till Numbers

1. Navigate to `/admin` → **Store Settings** tab
2. In **Mobile money till numbers**, edit existing rows or choose **Add till / Lipa number**. Multiple entries may use the same M-Pesa, Tigo Pesa, or Airtel Money network.
3. Enter the network's till number and exact account holder name from the mobile-money provider; toggle **Enabled** for accepted rails.
4. Every enabled entry with a non-empty till is shown at checkout with its network and account holder. The first valid entry remains the compatibility default.
5. Click **"Save All Settings"** — a green confirmation banner will appear.

> **Important:** The till number entered here is the one displayed to students at checkout in the copy-till prompt. Keep it current whenever your payment account changes.

### Updating Merchant Name

Update the **Merchant Store Name** field. This label is used across:

- The checkout Lipa Namba payment confirmation modal
- WhatsApp order confirmation messages sent to customers

### Updating WhatsApp Support Numbers

In the **"Official Support & WhatsApp Deep Links"** section:

- **Support Phone Number** — Displayed in the footer and contact buttons (format: `061 696 1511`)
- **Support WhatsApp Number** — Used to generate WhatsApp deep links (format must be international without `+`: `255616961511`)
- **Official WhatsApp numbers** — Maintain multiple contact numbers as a comma-separated list. The default official line is `0616961511`.

> WhatsApp deep links use the format `https://wa.me/255616961511?text=...`; ensure no spaces or dashes are included in the number.

### Setting Minimum Winga Payout Threshold

The **Minimum Winga Payout Threshold (TZS)** field controls the minimum Available Balance a Campus Winga must have before they can request a cash-out.

- Default: **TZS 20,000**
- Recommended range: TZS 15,000 – TZS 50,000
- This updates the payout button threshold in the Winga dashboard

### Managing partners and sponsors

In **Store Settings → Institutional Partners & Verified Badges**, edit a partner's display name, short code, category, logo image URL, and website/social URL. Use **Add partner / sponsor** to create an entry or the remove control to delete one. Save changes to update the partner strip and global footer. Use HTTPS image and destination URLs from trusted providers.

### Managing the developer profile

In **Store Settings → Developer Profile**, authorized admins can edit the creator name, contact details, short plain-text story, and optional HTTPS professional link. Upload a JPG, PNG, or WebP image no larger than 3 MB, preview it, and save; **Remove image** deletes the stored image on save. The public `/developer` page and footer use this shared settings record. Do not enter a biography or link unless the creator provides it.

### Campus expansion votes

The homepage allows one vote per browser identity. With Supabase configured, the admin settings panel displays shared campus totals from `campus_votes`. In demo mode, totals are limited to the current browser and do not represent platform-wide demand.

### Product group-buy links

On a product detail page, select **Start group** to create a 24-hour invite link. The group-buy view shows its countdown and participant count; a second distinct browser token unlocks the wholesale indicator. Pools use `group_buys`, `group_buy_participants`, and the atomic `join_group_buy` SQL function. Confirm the final split order with operations; joining a pool does not itself create or charge an order.

---

## 3. Order Management & Lipa Namba Payment Verification

### Order Approval Workflow

All customer orders begin with status **"Pending Verification"** and progress through the following stages:

```text
Pending Verification → Approved → Out for Delivery → Completed
```

### Step-by-Step: Verifying and Approving an Order

1. Go to the **Orders & Verification** tab
2. Filter by **"Pending Verification"** to see all orders awaiting review
3. For each pending order, check:
   - **Lipa Namba Tx ID** (highlighted in amber) — cross-reference this code on the M-Pesa / Tigo Pesa merchant portal or via Operator USSD reconciliation
   - **Amount** — confirm it matches the order total shown
   - **Customer Details** — verify the phone number and university are plausible
4. If the transaction is confirmed genuine, click **"Approve Order"**

For persisted orders, use the status action in **Orders & Verification**; payment, fulfillment, delivery, and history are stored in Supabase. The legacy browser-demo order flow may open `/order/{id}/receipt`, where staff can enter a serial/IMEI and warranty period. Serial/warranty edits are not yet saved through a protected persistent API, so do not use that local receipt state as the authoritative record.

> **What happens on payment verification:**
>
> - Payment status changes to `Verified` and fulfillment is confirmed in the order timeline.
> - The current persistent workflow does not write a Winga commission ledger.

1. Once the campus runner is dispatched, click **"Dispatch Runner"** (status → `Out for Delivery`)
2. After the customer confirms receipt, click **"Mark Delivered"** (status → `Completed`)

### Searching & Filtering Orders

Use the **search bar** to find orders by:

- Student name
- Transaction ID (e.g., `QA78XX99YY`)
- Campus / university name
- Order reference ID (e.g., `ORD-1234567890`)

### Winga Attribution Column

Orders placed with a Winga promo code will show:

- The promo code used (e.g., `WINGA-SAM`)
- The calculated 5% commission amount in emerald green

> **Never approve an order if the Tx ID cannot be verified.** Fraudulent transaction IDs are the primary fraud vector on the platform.

### Cancellation and refund requests

Customers may request cancellation from a private tokenized order-tracking link before dispatch. Review requests under **Cancellation Requests**. Move a request through **Under Review**, then approve or reject it. Approval holds dispatch; it does not itself cancel the order or transfer money. To complete a cancellation for a verified payment, first process a full refund through the mobile-money provider, then enter the provider reference and exact order total. The completed request records that manual resolution.

This application does not have an inventory-reservation system or financial ledger. Do not claim stock was restored or treat the recorded provider reference as ledger reconciliation; operations must record the refund and stock handling in the authoritative finance/inventory system.

---

## 4. Campus Winga Identity Review and Cash-Outs

### Understanding the KYC Flow

Winga sign-in uses a confirmed email and one-time code. Applicants use `/winga/register`; returning applicants use `/winga/login`. The separately collected mobile-money phone number is not verified by email OTP.

```text
Applicant email verified → Admin approves the application and assigns a promo code
   → Admin reviews the student ID through the approved identity-check process
   → Admin marks ID verified only after that review
```

### Nationwide applications and logistics

Students from any listed Tanzanian university may apply using email OTP. Applications remain pending until an admin approves them; the dashboard shows only the signed-in applicant's own status and, once approved, their UniSoko promo code. The public leaderboard excludes phone, email, promo-code, and earnings data.

### Student ID upload

The current application form does not upload student ID images. Use the **Mark student ID verified** control only after checking the student's ID through an approved channel. The public badge records that admin decision; it is not proof that an ID image was securely stored.

### Winga WhatsApp flyer

From the Winga dashboard, select an active product and use **Download Flyer Image** to export a 1080 × 1920 PNG with retail/wholesale prices, promo code, and delivery notes. Product images need browser canvas CORS access for clean export.

### Marking a Student ID as Verified

1. Open **Winga Applications** and locate an approved applicant.
2. Verify the student's current ID through the approved identity-check channel. Check that the name matches and the ID is current.
3. Select **Mark student ID verified** only after completing that check. Revoke the mark if verification is later invalidated.

> The current application flow does not upload ID images, and the Winga cash-out demo is not a durable finance ledger. Never mark an ID as verified or approve a live payment based on local demo data alone.

### Processing a Cash-Out Disbursement

1. Verify the approved amount and payee in the authoritative finance system.
2. Initiate the transfer through the mobile-money provider and confirm its receipt in the provider portal.
3. Record the provider's actual transaction reference in the approved finance ledger.

The current UniSoko code does not persist payout requests, commission balances, student ID images, or provider references. The demo payout tab is not a payment approval or accounting system. Do not enter or approve a real cash-out there until a protected payout API and durable finance ledger are deployed.

> The legacy admin payout controls remain browser-local demo data and generate a synthetic reference. Do not use **Mark as Paid** to record a real cash-out.

### Checking Agent Balances

Agent balances are managed in three buckets:

| Balance Type | Description |
| --- | --- |
| **Total Earned** | Lifetime commissions accrued |
| **Pending Balance** | Commissions from orders not yet approved |
| **Available Balance** | Verified commissions ready for cash-out |
| **Paid Out** | Lifetime disbursements completed |

---

## 5. Trade-In Requests & Purchase Inspection

Students submit their used gadgets for a UniSoko cash appraisal via the **Sell Your Device** portal at `/sell-device`. They can upload up to three JPG, PNG, or WebP photos, each 1–3 MB. With Supabase configured, request metadata is saved to `trade_in_requests` and photos are uploaded to the private `trade-in-photos` bucket; submissions appear in the protected **Trade-In Requests** tab. Admin photo links are short-lived signed URLs. Without Supabase, this remains a local browser demo and submissions are not durable or shared between devices.

### Trade-In Workflow Stages

```text
Pending Review → Inspecting → Offer Made → Accepted (Pay Student) / Rejected
```

### Step-by-Step: Processing a Trade-In

1. Go to **Trade-In Requests** tab
2. Filter by **"Pending Review"** to see new submissions
3. Click **"Inspect & Offer"** on any submission to open the appraisal modal
4. The modal shows:
   - Device photo(s) uploaded by the student (private storage provides expiring signed URLs)
   - Item name, specs, and self-reported condition
   - Student's expected price
5. Review the details and set the **UniSoko Cash Offer (TZS)** — this is your negotiated purchase price
6. Add any **Internal Appraisal Notes** (e.g., battery health, cosmetic issues, market value estimate)
7. Click the appropriate status button:
   - **Inspecting** — Log that the device needs a physical inspection before a formal offer
   - **Offer Made** — Confirm the offer amount has been communicated to the student via WhatsApp
   - **Accept & Pay** — Confirm the deal is closed and the student has been paid in cash/mobile money
   - **Reject** — Decline the trade-in (e.g., device too damaged, no market demand)

### Contacting a Student About Their Submission

Each trade-in row shows the student's WhatsApp number as a clickable link. Clicking it opens a pre-formatted WhatsApp message with the student's name and device name. This allows for fast, professional follow-up directly from the admin table.

### In-cart trade-in inspection before dispatch

The product page and checkout allow a buyer to submit a purchase-linked trade-in with 2–3 device photos. The system calculates the estimate from category, brand, specs, cosmetic condition, screen condition, battery health, and accessories; checkout ignores any client-supplied price and redeems the short-lived estimate once.

1. In **Orders & Verification**, find the `Trade-In Pending Inspection` flag and note its linked trade-in request ID.
2. Open that request in **Trade-In Requests** and physically verify device identity, hardware, screen, and battery during hand-off.
3. Choose **Accept & Pay** only after recording the agreed inspected value. This marks the linked order inspection as accepted.
4. Dispatch actions remain blocked until inspection is accepted. A rejected inspection stays on hold; contact the buyer and agree on a corrected payment before any dispatch. The current system does not automatically charge a difference or issue a refund.

The buyer's estimate and the required inspection disclaimer are shown at checkout and on the receipt. Never describe an estimate as a final guaranteed discount before inspection.

---

## 6. Inventory Management and Catalog Updates

### Adding a New Product

1. Go to **Catalog & Pricing** tab → click **"Add New Product"**
2. Fill in all required fields:
   - **Gadget Title & Model** — e.g., `Samsung Galaxy A55 5G (128GB, Black)`
   - **Category** — Laptops & Computers / Smart Phones & Accessories / Room Gear / Power & Audio / Student Lifestyle Gear
   - **Condition** — Brand New / Grade A Like-New / Refurbished
   - **Retail Price (TZS)** — Customer-facing single-unit price
   - **Wholesale Price (TZS)** — Bei ya Jumla price per unit (minimum 3 units)
   - **Stock Status** — In Stock / New Stock / Trending / Coming Soon
   - **Image URL** — Use a direct Unsplash URL or CDN-hosted image
   - **Description** — Concise bullet-style specs (2–4 lines)
3. Click **"Publish Product"** — the product appears on the homepage immediately

### Editing Prices & Stock Status

1. Find the product in the **Catalog & Pricing** grid
2. Click **"Edit Price & Stock"**
3. Update the required fields
4. Click **"Save Changes"**

> Changes to prices and stock status are reflected in real-time on the customer storefront and the product detail page.

---

## 7. Hostels and Room Finder Fees

### Review and publish hostel listings

1. Open `/admin` → **Hostel Listings**.
2. Add campus, location, price per term, distance, description, amenities, and 1–6 JPG/PNG/WebP photos (up to 5 MB each).
3. Confirm the accommodation, landlord/host contact, current availability, price, and photos before selecting **Verify**.
4. Publish the listing only after verification. Public `/hostels` shows records only when both `Published` and `Verified` are set. Unpublish or archive stale vacancies promptly.

### Verify vacancy leads and pay a finder

1. Review student and landlord contacts and verify the room location under **Room Finder Fees**.
2. Set status to **Verifying** while checking the room and landlord.
3. Agree on the finder’s fee with the submitting student. Enter the amount before setting **Leased**; a leased record changes the payout state to **Due**.
4. Confirm the lease completed, transfer the fee via the approved cash/mobile-money process, and only then select **Mark fee paid**. The dashboard records the manual payment state; it does not initiate a transfer.

## 8. Homepage Promotional Banners

1. Open `/admin` → **Promo Banners** and choose Promotion, Sponsor, or Flash Deal.
2. Enter the title, message, optional CTA label/link, optional JPG/PNG/WebP image (maximum 5 MB), and start/end date and time.
3. Save as **Draft** while preparing. Edit to correct content or schedule; **Paused** immediately hides a banner without deleting it.
4. Choose **Active** to schedule publication. The homepage displays it only between the configured start and end times. Check the destination link and image on mobile before activation.
5. Delete expired campaigns that should no longer be retained.

Partner names, logo URLs, and destination URLs remain under **Store Settings → Institutional Partners & Verified Badges**. Use trusted HTTPS image and destination URLs.

## 9. Audit Log

The **Audit Log** tab shows the most recent server-backed admin changes after `20261007_admin_audit_logs.sql` is applied. Entries include the configured admin username, action, resource type/ID, timestamp, and limited safe metadata. The table is append-only and is not directly writable from the browser. Until the migration is applied, audit writes are not durable; apply it before relying on the log.

This does not yet cover browser-local inventory or payout changes, and logging is not in the same database transaction as every mutation. Do not treat the audit view as a compliance-grade financial ledger.

## 10. Troubleshooting and Common Errors

| Issue | Likely Cause | Resolution |
| --- | --- | --- |
| White screen on checkout | `selectedCampus` state is null or undefined | Ensure `StoreContext` default is `MBEYA_UNIVERSITIES[0]`. Clear localStorage and reload. |
| Form inputs show white text | Browser autofill or stale cached CSS | `globals.css` enforces dark text, white backgrounds, slate borders, and indigo focus rings on form controls. Clear browser cache and check browser autofill settings. |
| Winga commission not credited | Order approved before Winga code was linked | Check order `wingaCodeUsed` field in the Orders tab. Code must exist at time of order creation. |
| Trade-in photo not loading | Supabase environment/schema/storage bucket is missing or request is in local demo mode | Confirm server-side Supabase configuration and apply the ordered SQL migrations. Purchase-linked photos use the private `trade-in-photos` bucket and admin signed URLs. |
| Settings not persisting across devices | Supabase missing, migration not applied, or admin session expired | Configure the server-side Supabase values, apply `supabase/schema.sql`, and sign back in. Local fallback uses the `unisoko_settings` browser key only. |
| Payout not showing after agent requests | `minPayoutThreshold` mismatch | Confirm the threshold in Store Settings matches what agent was shown in the dashboard. |

---

## Contact & Escalation

| Role | Contact |
| --- | --- |
| **Platform Technical Lead** | `tech@unisoko.co.tz` |
| **Operations & Fulfilment Manager** | `ops@unisoko.co.tz` |
| **Student Support (WhatsApp)** | +255 616 961 511 |
| **Campus Office** | MUST Campus, Mbeya, Tanzania |

---

*This guide is internal documentation for UniSoko staff. Last updated: September 2026.*
*For technical onboarding of new developers, refer to the project's `README.md` and `src/lib/types.ts` type definitions.*
