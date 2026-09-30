# UniSoko Admin Guide

**UniSoko Tanzania — Campus Marketplace Operations Manual**
*For internal staff and authorized campus administrators only.*

---

## Table of Contents

1. [Admin Authentication & Navigation](#1-admin-authentication--navigation)
2. [Store Configuration & Live Settings][def]
3. [Order Management & Lipa Namba Payment Verification](#3-order-management--lipa-namba-payment-verification)
4. [Winga Agent KYC Verification & Payout Management](#4-winga-agent-kyc-verification--payout-management)
5. [Managing Student Trade-In (Sell Your Device) Requests](#5-managing-student-trade-in-sell-your-device-requests)
6. [Inventory Management & Catalog Updates](#6-inventory-management--catalog-updates)
7. [Troubleshooting & Common Errors](#7-troubleshooting--common-errors)

---

## 1. Admin Authentication & Navigation

### Accessing the Admin Panel

The UniSoko Admin Panel is accessible at:

```
http://localhost:3000/admin/login        (Development)
https://unisoko.co.tz/admin/login       (Production)
```

> **Security:** `/admin/*` and `/api/admin/*` are protected by a signed, eight-hour, HTTP-only, SameSite=Strict session. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a unique `ADMIN_SESSION_SECRET` (at least 32 characters) in the deployment environment before sign-in. Never put these values in client code or commit secrets. Without those environment variables, login intentionally fails closed. Sign out from the dashboard to invalidate the browser cookie.

### First-time setup

1. Copy `.env.example` to `.env.local` for local development and replace the admin placeholders with strong values.
2. For durable trade-in submissions, campus voting, shared store settings, and group-buy pools, configure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server, then run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.
3. Keep the service-role key server-only. Trade-in photos are stored in the private `trade-in-photos` bucket and delivered to authenticated admins as short-lived signed URLs.
4. Supabase persists trade-in submissions/photos, campus votes, store settings, and group-buy pools. Catalog, orders/receipts, Winga registrations/KYC, and payout ledgers still use browser local storage in this version; they are not shared between devices.

### Navigation Tabs

Once inside the admin panel, you will see five primary tabs:

| Tab | Icon | Purpose |
|-----|------|---------|
| **Orders & Verification** | 🛍️ | Review incoming orders, verify Lipa Namba transaction IDs, approve payments, and dispatch campus runners |
| **Trade-In Requests** | 🔄 | Review student Sell Your Device submissions, set cash offers, and update workflow status |
| **Catalog & Pricing** | 📦 | Add, edit, or remove products. Adjust retail and wholesale (Bei ya Jumla) pricing |
| **Winga KYC & Payouts** | 💰 | Verify student ID cards for Winga Agents and process mobile money cash-out disbursements |
| **Store Settings** | ⚙️ | Update payment rails, merchants, partner logos, WhatsApp numbers, and payout thresholds; review campus vote totals |

### Quick Stats Dashboard

At the top of the admin panel, three real-time stat pills display:

- 🟡 **Pending Orders** — Orders awaiting Lipa Namba verification
- 🟣 **Trade-In Queue** — Active trade-in submissions awaiting appraisal
- 🟢 **Pending Payouts** — Winga Agent cash-out requests awaiting disbursement

---

## 2. Store Configuration & Live Settings

All live store parameters can be updated without any code changes via the **Store Settings** tab.

### Updating Multiple Lipa Namba / Till Numbers

1. Navigate to `/admin` → **Store Settings** tab
3. In **Mobile money till numbers**, edit each M-Pesa, Tigo Pesa, and Airtel Money row independently.
4. Enter the network's till number and exact account holder name from the mobile-money provider; toggle **Enabled** for accepted rails.
5. The first enabled rail with a non-empty till becomes the legacy checkout till. Keep that rail synchronized with the currently supported checkout flow.
6. Click **"Save All Settings"** — a green confirmation banner will appear

> **Important:** The till number entered here is the one displayed to students at checkout in the copy-till prompt. Keep it current whenever your payment account changes.

### Updating Merchant Name

Update the **Merchant Store Name** field. This label is used across:
- The checkout Lipa Namba payment confirmation modal
- WhatsApp order confirmation messages sent to customers

### Updating WhatsApp Support Numbers

In the **"Official Support & WhatsApp Deep Links"** section:

- **Support Phone Number** — Displayed in the footer and contact buttons (format: `0754 000 111`)
- **Support WhatsApp Number** — Used to generate WhatsApp deep links (format must be international without `+`: `255754000111`)
- **Official WhatsApp numbers** — Maintain multiple contact numbers as a comma-separated list. The cart exporter uses the configured WhatsApp URL; the default official line is 0616961511.

> WhatsApp deep links use the format: `https://wa.me/255754000111?text=Habari+UniSoko...` — ensure no spaces or dashes are included in the number.

### Setting Minimum Winga Payout Threshold

The **Minimum Winga Payout Threshold (TZS)** field controls the minimum Available Balance a Winga Agent must have before they can request a cash-out.

- Default: **TZS 20,000**
- Recommended range: TZS 15,000 – TZS 50,000
- This dynamically updates the payout button unlock logic in the Winga Agent dashboard

### Managing partners and sponsors

In **Store Settings → Institutional Partners & Verified Badges**, edit a partner's display name, short code, category, logo image URL, and website/social URL. Use **Add partner / sponsor** to create an entry or the remove control to delete one. Save changes to update the partner strip and global footer. Use HTTPS image and destination URLs from trusted providers.

### Campus expansion votes

The homepage allows one vote per browser identity. With Supabase configured, the admin settings panel displays shared campus totals from `campus_votes`. In demo mode, totals are limited to the current browser and do not represent platform-wide demand.

### Product group-buy links

On a product detail page, select **Start group** to create a 24-hour invite link. The group-buy view shows its countdown and participant count; a second distinct browser token unlocks the wholesale indicator. Pools use `group_buys`, `group_buy_participants`, and the atomic `join_group_buy` SQL function. Confirm the final split order with operations; joining a pool does not itself create or charge an order.

---

## 3. Order Management & Lipa Namba Payment Verification

### Order Approval Workflow

All customer orders begin with status **"Pending Verification"** and progress through the following stages:

```
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

Approval opens `/order/{id}/receipt`, where staff enter the product serial/IMEI and select a 30-, 60-, or 90-day warranty period. Save receipt details before sharing. **Send Receipt via WhatsApp** formats the buyer's number and receipt text; **Print / Save PDF** opens the browser print dialog. Order/receipt state still resides in browser storage in this version.

> **What happens on approval:**
> - Order status changes to `Approved`
> - If a Winga promo code was used, the 5% commission moves from the agent's *Pending Balance* to their *Available Balance*

5. Once the campus runner is dispatched, click **"Dispatch Runner"** (status → `Out for Delivery`)
6. After the customer confirms receipt, click **"Mark Delivered"** (status → `Completed`)

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

---

## 4. Winga Agent KYC Verification & Payout Management

### Understanding the KYC Flow

Before a Winga Agent can receive a mobile money payout, they must complete KYC (Know Your Customer) identity verification:

```
Agent uploads Student ID → Status: "Pending Verification"
   → Admin reviews & approves → Status: "Verified"
   → Agent can now request cash-out
```

### Nationwide applications and logistics

Students from any listed Tanzanian university may apply via `/winga`. Mbeya Winga agents coordinate direct campus hand-off. Outside Mbeya, approved Winga agents act as local hub managers: operations dispatch bulk stock to the regional hub, then the agent arranges verified, in-person campus delivery. Confirm the courier hub, inventory handover, student contact, and delivery records before dispatch. Nationwide Winga applicants and KYC documents are currently in the browser-backed demo store; configure an authenticated persistent agent database before relying on cross-device production operations.

### Student ID upload

Winga agents choose an ID image from the device gallery/file picker (JPG, PNG, WebP; up to 3 MB). Images are resized/compressed in the browser before saving to the current demo/local KYC state. For production KYC, use private authenticated object storage and short-lived signed admin review URLs.

### Winga WhatsApp flyer

From the Winga dashboard, select an active product and use **Download Flyer Image** to export a 1080 × 1920 PNG with retail/wholesale prices, promo code, and delivery notes. Product images need browser canvas CORS access for clean export.

### Reviewing & Approving Student ID Cards

1. Navigate to **Winga KYC & Payouts** tab
2. In the **"Student ID & KYC"** column, look for agents with status **"Pending KYC"** (shown in amber)
3. Click **"View Student ID Scan"** to open the uploaded photo in a new tab
4. Verify:
   - Photo is a clear, readable University Student ID card
   - Name on the ID matches the Winga Agent's registered full name
   - The ID is not expired (check validity year)
5. Click **"Approve ID"** button to set KYC status to **"Verified"** (shown in emerald green)

> Cash-out requests are blocked until KYC status is **Verified**. Use the Approve ID button in the payouts table only after matching the student ID to the agent.

### Processing a Cash-Out Disbursement

1. Identify payout rows with status **"Pending"** (pulsing amber badge)
2. Note the **Disbursement Mobile Number** and **Amount**
3. Open your mobile money business dashboard (Vodacom M-Pesa Business, Tigo Business, or Airtel Business)
4. Initiate a **B2C (Business-to-Customer) transfer** to the agent's phone number for the listed amount
5. Copy the B2C Transaction Reference from the confirmation SMS (format: `MPB2C12345678`)
6. Return to UniSoko Admin → Click **"Mark as Paid"**
7. UniSoko will automatically generate an internal B2C reference and update the payout record

> The payout table will update to show the **B2C Reference ID** and a **"Paid"** status badge after marking as paid.

### Checking Agent Balances

Agent balances are managed in three buckets:
| Balance Type | Description |
|---|---|
| **Total Earned** | Lifetime commissions accrued |
| **Pending Balance** | Commissions from orders not yet approved |
| **Available Balance** | Verified commissions ready for cash-out |
| **Paid Out** | Lifetime disbursements completed |

---

## 5. Managing Student Trade-In (Sell Your Device) Requests

Students submit their used gadgets for a UniSoko cash appraisal via the **Sell Your Device** portal at `/sell-device`. They can upload up to three JPG, PNG, or WebP photos, each 1–3 MB. With Supabase configured, request metadata is saved to `trade_in_requests` and photos are uploaded to the private `trade-in-photos` bucket; submissions appear in the protected **Trade-In Requests** tab. Admin photo links are short-lived signed URLs. Without Supabase, this remains a local browser demo and submissions are not durable or shared between devices.

### Trade-In Workflow Stages

```
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

---

## 6. Inventory Management & Catalog Updates

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

## 7. Troubleshooting & Common Errors

| Issue | Likely Cause | Resolution |
|-------|-------------|------------|
| White screen on checkout | `selectedCampus` state is null or undefined | Ensure `StoreContext` default is `MBEYA_UNIVERSITIES[0]`. Clear localStorage and reload. |
| Form inputs show white text | Browser autofill or stale cached CSS | `globals.css` enforces dark text, white backgrounds, slate borders, and indigo focus rings on form controls. Clear browser cache and check browser autofill settings. |
| Winga commission not credited | Order approved before Winga code was linked | Check order `wingaCodeUsed` field in the Orders tab. Code must exist at time of order creation. |
| Trade-in photo not loading | Supabase environment/schema/storage bucket is missing or request is in local demo mode | Configure the server-side Supabase environment and apply `supabase/schema.sql`. Local demo uploads are browser-backed and not cross-device durable. |
| Settings not persisting across devices | Supabase missing, migration not applied, or admin session expired | Configure the server-side Supabase values, apply `supabase/schema.sql`, and sign back in. Local fallback uses the `unisoko_settings` browser key only. |
| Payout not showing after agent requests | `minPayoutThreshold` mismatch | Confirm the threshold in Store Settings matches what agent was shown in the dashboard. |

---

## Contact & Escalation

| Role | Contact |
|------|---------|
| **Platform Technical Lead** | tech@unisoko.co.tz |
| **Operations & Fulfilment Manager** | ops@unisoko.co.tz |
| **Student Support (WhatsApp)** | +255 754 000 111 |
| **Campus Office** | MUST Campus, Mbeya, Tanzania |

---

*This guide is internal documentation for UniSoko staff. Last updated: September 2026.*
*For technical onboarding of new developers, refer to the project's `README.md` and `src/lib/types.ts` type definitions.*


[def]: #2-store-configuration--live-settings