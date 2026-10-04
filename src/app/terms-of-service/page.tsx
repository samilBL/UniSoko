/* eslint-disable react/no-unescaped-entities */
'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, ShoppingBag, Users, Truck, CreditCard, AlertTriangle, Scale } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 backdrop-blur-lg bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to UniSoko
          </Link>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Legal Documentation
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="rounded-3xl border border-indigo-800 bg-indigo-950 p-8 text-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-white p-3">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest block">
                UniSoko Tanzania
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-heading">
                Terms of Service
              </h1>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed max-w-2xl">
            These Terms govern your use of UniSoko — Tanzania's premium campus gadget marketplace. By browsing, ordering, or registering as a Campus Winga, you agree to be bound by these terms.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-xl border border-indigo-100 bg-white px-3 py-1.5 font-semibold text-slate-700">Effective: September 1, 2026</span>
            <span className="rounded-xl border border-indigo-100 bg-white px-3 py-1.5 font-semibold text-slate-700">Governed By: Laws of Tanzania</span>
          </div>
        </div>

        <TermsSection icon={<FileText className="h-5 w-5 text-indigo-600" />} title="1. Acceptance of Terms">
          <p>
            By accessing or using UniSoko (the "Platform"), you confirm that you are at least 16 years of age (or have obtained parental/guardian consent), and that you agree to comply with these Terms of Service ("Terms") in full. If you do not agree, you must immediately cease use of the Platform.
          </p>
          <p>
            UniSoko reserves the right to modify these Terms at any time. Updated terms will be published on this page with a revised effective date and, for material changes, notified to registered Wingas via WhatsApp.
          </p>
        </TermsSection>

        <TermsSection icon={<ShoppingBag className="h-5 w-5 text-indigo-600" />} title="2. Platform Usage & Orders">
          <p>When placing an order on UniSoko, you agree that:</p>
          <ul>
            <li>All order information provided (name, phone number, campus, delivery location) must be accurate and complete. Fraudulent information will result in immediate order cancellation without refund.</li>
            <li>An order is considered <strong>confirmed</strong> only after a UniSoko admin has verified your Lipa Namba (M-Pesa / Tigo Pesa / Airtel Money) transaction ID and updated the order status to "Approved."</li>
            <li>UniSoko does not guarantee stock availability until an order is approved. In the rare case that a listed item is out of stock after payment, a full refund will be processed within 3 business days.</li>
            <li>Customers may use Winga promo codes at checkout to receive applicable discounts or free campus delivery credits. Promo codes are non-transferable, cannot be exchanged for cash, and are subject to expiry.</li>
            <li>Wholesale orders (Bei ya Jumla, minimum 3 units) are bound by the same terms as retail orders. Bulk cancellations after payment may incur a 5% restocking fee.</li>
          </ul>
        </TermsSection>

        <TermsSection icon={<Truck className="h-5 w-5 text-indigo-600" />} title="3. Campus Delivery Rules">
          <p>UniSoko provides campus delivery services to the following Mbeya-region universities: MUST, TEKU, TIA, Mzumbe University (Mbeya Campus), and CUoM. The following delivery rules apply:</p>
          <ul>
            <li><strong>Hostel Delivery:</strong> Orders delivered to hostel rooms require a valid hostel name and room number. Delivery is to the hostel block entrance; the customer must be present or nominate a trusted recipient.</li>
            <li><strong>Landmark Delivery:</strong> Orders may be collected at an agreed campus landmark (e.g., library entrance, canteen). UniSoko campus runners will confirm a collection window via WhatsApp.</li>
            <li><strong>Delivery Timeframe:</strong> Standard campus delivery is completed within <strong>24–48 hours</strong> of order approval on weekdays. Deliveries during exam or holiday periods may take up to 5 business days.</li>
            <li><strong>Off-Campus / Courier:</strong> Orders for non-Mbeya universities are dispatched via regional bus or courier service. Estimated delivery is 3–7 business days. UniSoko is not liable for delays caused by third-party courier services.</li>
            <li><strong>Failed Delivery:</strong> If delivery fails due to an incorrect address provided by the customer, a re-delivery fee may apply. Unclaimed orders held for more than 7 days will be returned to stock and a store credit issued.</li>
          </ul>
        </TermsSection>

        <TermsSection icon={<CreditCard className="h-5 w-5 text-indigo-600" />} title="4. Payments & Lipa Namba Verification">
          <p>UniSoko accepts mobile money payments via M-Pesa, Tigo Pesa, and Airtel Money using our official Till Number. By making payment you agree that:</p>
          <ul>
            <li>You will submit your accurate mobile money Transaction Reference ID (e.g., QA78XX99YY) through the checkout portal. Submitting a false or another person's transaction ID constitutes fraud.</li>
            <li>UniSoko reserves the right to verify the transaction ID against operator records before approving any order. Orders with unverifiable transaction IDs will be placed on hold.</li>
            <li>Prices displayed on UniSoko are in Tanzanian Shillings (TZS) and are inclusive of any applicable taxes. UniSoko is not responsible for currency conversion losses if paying from a foreign account.</li>
            <li>UniSoko does not store full mobile money account credentials. Payment processing is completed entirely on the respective mobile network operator's platform.</li>
          </ul>
        </TermsSection>

        <TermsSection icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} title="5. Trade-In Estimates, Hostels & Finder Fees">
          <ul>
            <li>Any in-cart trade-in amount is a provisional estimate, not a guaranteed cash value or final price. The final accepted value is set after physical hardware, battery, and screen checks by a UniSoko Winga or technician during campus hand-off.</li>
            <li>Orders using a trade-in remain flagged for inspection and cannot be dispatched until an admin records an accepted inspection. If inspection changes the estimate, the customer and UniSoko must agree on the revised amount before dispatch.</li>
            <li>Hostel listings are reviewed before publication, but students should confirm room availability, terms, location, and landlord identity directly before paying a landlord.</li>
            <li>A room-finder fee is considered only after UniSoko verifies the lead and the room is successfully leased. The fee must be agreed with UniSoko; submitting a lead alone does not guarantee payment.</li>
          </ul>
        </TermsSection>

        <TermsSection icon={<Users className="h-5 w-5 text-indigo-600" />} title="6. Campus Winga Programme — Commission Terms">
          <p>The Campus Winga Programme allows enrolled university students to earn commissions by promoting UniSoko products on campus. By joining the programme, you agree to the following:</p>
          <ul>
            <li><strong>Commission Rate:</strong> Campus Wingas earn a <strong>5% commission</strong> on the total order value (after discounts) for every confirmed and approved order that uses their unique Winga promo code at checkout.</li>
            <li><strong>Commission Crediting:</strong> Commissions are first credited to your <em>Pending Balance</em> when an order is placed. They are transferred to your <em>Available Balance</em> only after the order is verified and approved by UniSoko admin. Commissions for cancelled or refunded orders are reversed.</li>
            <li><strong>Minimum Payout Threshold:</strong> The minimum balance required to request a mobile money cash-out is as configured in the live store settings (default: TZS 20,000). This threshold may be adjusted by UniSoko with 7 days' notice.</li>
            <li><strong>KYC Verification Requirement:</strong> Before your first cash-out request is processed, you must upload a clear photo of your current University Student ID card for identity verification. Cash-outs will be held pending KYC approval.</li>
            <li><strong>Prohibited Conduct:</strong> Agents must not manipulate orders, create fake transactions, offer personal discounts not endorsed by UniSoko, or use the UniSoko brand in ways not explicitly approved by the platform team. Violations result in immediate account termination and forfeiture of pending balances.</li>
            <li><strong>Independent Contractor Status:</strong> Campus Wingas are independent student promoters, not employees of UniSoko. Commissions are not salaries, and UniSoko bears no obligation for NSSF/TRA tax contributions on your behalf.</li>
          </ul>
        </TermsSection>

        <TermsSection icon={<AlertTriangle className="h-5 w-5 text-red-500" />} title="7. Prohibited Activities">
          <p>Users of UniSoko must not:</p>
          <ul>
            <li>Attempt to access the Admin Panel without authorisation.</li>
            <li>Scrape, copy, or reproduce the UniSoko product catalog or price data for competing platforms.</li>
            <li>Harass UniSoko campus agents or runners via phone, WhatsApp, or in person.</li>
            <li>Resell gadgets purchased at wholesale prices on third-party platforms without prior written approval from UniSoko management.</li>
            <li>Impersonate UniSoko staff or agents in any digital or physical communication.</li>
          </ul>
          <p className="mt-3">Violations may result in order cancellation, permanent account suspension, and where applicable, referral to Tanzanian law enforcement.</p>
        </TermsSection>

        <TermsSection icon={<Scale className="h-5 w-5 text-indigo-600" />} title="8. Limitation of Liability & Governing Law">
          <p>To the maximum extent permitted by Tanzanian law:</p>
          <ul>
            <li>UniSoko is not liable for indirect, incidental, or consequential damages arising from the use of gadgets purchased on the platform.</li>
            <li>Our total liability for any claim related to an order shall not exceed the purchase price of that specific order.</li>
            <li>These Terms are governed by and construed in accordance with the laws of the United Republic of Tanzania. Any disputes arising shall be subject to the exclusive jurisdiction of courts in Mbeya, Tanzania.</li>
          </ul>
          <p className="mt-3 text-slate-500 text-xs">If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
        </TermsSection>

        {/* Contact */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 text-xs space-y-2">
          <h2 className="text-sm font-bold font-heading">Legal Enquiries</h2>
          <p className="text-slate-300">UniSoko Tanzania Limited — Legal Team</p>
          <p className="text-slate-300">WhatsApp: +255 616 961 511 | Email: qwazerty01012001@gmail.com</p>
          <p className="text-slate-400 mt-2">Campus Office: MUST Campus, Mbeya, Tanzania (Mon–Sat, 8am–6pm EAT)</p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-semibold text-indigo-600 border-t border-slate-200 pt-6">
          <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <span className="text-slate-300">|</span>
          <Link href="/refund-policy" className="hover:underline">Refund & Warranty Policy</Link>
          <span className="text-slate-300">|</span>
          <Link href="/" className="hover:underline">← Return to Store</Link>
        </div>
      </main>
    </div>
  );
}

function TermsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">{icon}</div>
        <h2 className="text-base font-bold text-slate-900 font-heading">{title}</h2>
      </div>
      <div className="text-sm text-slate-700 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2 [&_li]:leading-relaxed [&_ol]:ml-5 [&_ol]:space-y-2">
        {children}
      </div>
    </section>
  );
}
