# Plug and Go — Phase 8 booking, payments, and recovery

**Phase:** 8 — optional policy-driven connector booking, payment foundation, receipts, refunds, support recovery  
**Not in this phase:** OCPP, live charging sessions, remote start/stop, meter-value billing, charger control, fleet portal, technician portal

## Booking policy model and enablement

Website booking is **off by default**. A reservation is accepted only when Plug and Go can operationally honour it.

`BookingPolicy` is stored per station and names **explicit** `eligibleConnectorIds`. An empty list means **no** connector can be reserved. The system never assumes every available connector is bookable.

A policy can be offered on the public station page only when **all** of the following are true:

- Station is `published` and not demo
- Policy `approvalStatus` is `approved`
- `bookingEnabled` is true
- Current time is within `effectiveFrom` / `effectiveTo`
- Eligible connectors, capacity limit, reservation duration, cancellation text, refund text, no-show text, and support contact are present
- Payment adapter is configured
- Connector is installed and public status is fresh `available` or `in_use` (never stale, unknown, faulted, or offline)
- Remaining overlapping capacity is greater than zero
- The driver is authenticated (signed-out visitors see “Sign in to book” **only** when the rest of the gate would pass)

Staff: station operators and finance may draft policies (`/admin/stations/[id]/booking`). **Finance** (or super_admin) approves. Approval is audited.

Capacity uses a PostgreSQL `SELECT … FOR UPDATE` lock on the connector row plus overlapping-window counts for occupying statuses: `pending_payment`, `payment_processing`, `confirmed`, `refund_pending`, `support_review`. Unpaid holds expire after `BOOKING_HOLD_SECONDS` (default 900) and release capacity.

Each booking stores integer paise amounts and a **policy/tariff snapshot**. The tariff snapshot is informational. It does not bill energy.

### Booking states

`draft`, `pending_payment`, `payment_processing`, `confirmed`, `cancelled`, `expired`, `no_show`, `payment_failed`, `refund_pending`, `refunded`, `support_review`.

## Payment-provider adapter

No approved production gateway was already wired. Phase 8 adds `src/lib/payments/` with:

| Adapter | When it runs |
| --- | --- |
| **Disabled** | Default. Booking APIs return a configuration error. |
| **Razorpay** | `PAYMENT_PROVIDER=razorpay` and key id, key secret, and webhook secret are set. Orders API + `X-Razorpay-Signature` HMAC of the **raw** body. Refunds via `/v1/payments/:id/refund`. |
| **Mock** | `PAYMENT_DEV_MOCK=true` **and** `NODE_ENV` is not `production`. Hosted mock checkout posts a signed `x-png-mock-signature` event into the same webhook processor. |

Production never honours the mock, even if the flag is set. Secrets stay server-side. The only public payment value is `NEXT_PUBLIC_PAYMENT_CHECKOUT_KEY` / Razorpay key id for hosted checkout.

Zero-amount bookings are allowed only on the mock adapter (auto-captured through the signed webhook path). Razorpay rejects zero-amount bookings; configure a fee in paise.

Card number, CVV, UPI PIN, and gateway secrets are never stored. Payment attempts keep provider order/payment **tokens/ids** only.

## Webhook verification and reconciliation

`POST /api/payments/webhook` reads `request.text()` (raw body). CSRF does not apply (provider callback).

1. Verify HMAC over the raw body. Invalid signature → HTTP 400. Browser redirect is **never** success.
2. Persist `PaymentWebhookEvent` by unique `providerEventId` with a SHA-256 payload hash (not the raw payload).
3. Duplicate / retried events with `processedAt` are ignored safely.
4. `order_not_found` / `refund_not_found` stay unprocessed so out-of-order retries can complete.
5. Amount mismatches are recorded and not retried forever.
6. Only `payment.captured` marks a payment succeeded and a booking `confirmed`.
7. `/payments/return` sets `payment_processing` and tells the driver to wait.

## Idempotency

- Create-booking requires `Idempotency-Key`. The same driver+key reuses the existing payment attempt.
- `IdempotencyRecord` wraps create-booking, cancel, and finance refund POSTs (`key + actorId + route`).
- Webhook event ids are unique.

## Receipt versus charging invoice

After a verified capture:

- **Booking receipt** (`FinancialDocument.kind = booking_receipt`, status `issued`) — reservation fee, GST, total, policy version, window. Labelled as **not** a final energy tax invoice.
- **Charging invoice placeholder** (`charging_invoice_placeholder`, status `not_issuable_until_session`) — zero paise, explicit note that a GST energy invoice waits for a future OCPP session.

No energy-consumption invoice is issued in this phase.

Routes `/bookings`, `/payments`, `/invoices` are `noindex`, omitted from sitemaps, `Cache-Control: private, no-store`, and owner-scoped. Guessing another driver’s id/number returns 404.

## Refund and cancellation

Drivers may cancel `pending_payment` / `payment_processing` holds, and `confirmed` bookings only when the snapshot policy allows and the cutoff has not passed.

If `refundOnCancel` is true, cancel creates a refund in `pending_review`. That is **not** a completed refund.

Finance initiates or sends refunds through the adapter. Station operators **do not** get this permission. Support may look up status on `/admin/finance` but cannot call the provider. Completed refunds require a verified `refund.processed` webhook.

## Role and authorization

| Actor | Booking policy | Payments / refunds | Driver records |
| --- | --- | --- | --- |
| Driver | none | own bookings/payments/receipts/tickets only | own |
| Station operator | draft/update | none | none |
| Finance | draft + approve | initiate/send refunds | lookup by booking ref |
| Support | none | read finance lookup only | lookup by booking ref |
| Super admin | all staff actions | all staff actions | staff lookup |

All writes are server-side (`guardDriverMutation` / `requireStaffRole`). Driver sessions never grant staff roles.

## Test plan

- Booking disabled / unpublished / expired policy / incomplete policy texts / payment unconfigured → refuse
- Stale/unknown/faulted/offline connector → refuse
- Signed-out: “Sign in to book” only when booking is truly enabled
- Last slot: connector row lock; concurrent creates → one success
- Duplicate `Idempotency-Key` reuses the hold
- Duplicate/retried webhook is safe
- Invalid webhook signature is rejected
- Browser return without webhook stays `payment_processing`, not `confirmed`
- Driver B cannot read driver A’s booking/receipt
- Operator cannot initiate refunds; finance can; refund completes only after webhook
- Receipt/invoice routes are noindex and out of sitemaps

## Configuration still required from Plug and Go

See `.env.example` (placeholders only).

| Variable | Role |
| --- | --- |
| `PAYMENT_PROVIDER` | `razorpay` or unset/`none` |
| `PAYMENT_RAZORPAY_KEY_ID` / `PAYMENT_RAZORPAY_KEY_SECRET` | Server Orders + refund API |
| `PAYMENT_RAZORPAY_WEBHOOK_SECRET` | HMAC of raw webhook body |
| `NEXT_PUBLIC_PAYMENT_CHECKOUT_KEY` | Browser checkout key if required |
| `PAYMENT_WEBHOOK_SECRET` | Mock webhook HMAC (non-production) |
| `PAYMENT_DEV_MOCK` | `true` only in development |
| `BOOKING_HOLD_SECONDS` | Unpaid hold lifetime (default 900) |
| `RECEIPT_NUMBER_PREFIX` / `INVOICE_NUMBER_PREFIX` / `BOOKING_REFERENCE_PREFIX` | Document numbering |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin |
| `AVAILABILITY_FRESHNESS_MINUTES` | Required for public “available”; otherwise booking stays blocked |

Until Razorpay (or another approved adapter) is configured, production booking stays refused. Per-station policies must still be drafted, approved, and kept effective.

## Deferred to Phase 9+

- OCPP / CSMS connectivity
- Live charging sessions and remote start/stop
- Meter-value billing and final energy invoices
- Charger control
- Fleet portal and technician portal
- Waitlists, guaranteed physical bay occupancy beyond policy text
- Instant refunds
- Staff identity provider in production (existing Phase 4 denial remains)
