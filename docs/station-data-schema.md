# Plug and Go — station data schema (source of truth)

**Phase:** 0 — data foundations only  
**Status:** Draft schema. Contains no live stations, prices, hosts, or availability.  
**Companion:** `docs/phase-0-product-and-data.md`, `docs/phase-0-open-questions.md`

This is the canonical model for catalogue, tariffs, availability, and support. Website pages, a future map, SEO, invoices, and OCPP-normalised events must read from these records. They must not keep separate copies of address, hours, connector, tariff, or photos.

---

## 1. Governing rules

```text
Station facts     = editable content          (catalogue)
Live availability = event data                (operational stream)
Tariffs           = versioned financial data  (approved price list)
```

These three must never be merged into one untraceable “station status” field.

### 1.1 Display law for availability

Allowed public status values:

| Status | Meaning |
|---|---|
| `available` | Latest **fresh** event says the connector/EVSE can accept a vehicle. |
| `in_use` | Latest **fresh** event says the connector is occupied or charging. |
| `faulted` | Latest **fresh** event or verified operator report says it is unsafe or failed. |
| `offline` | Charge point is not connected or not operable; last event is still **fresh** enough to trust that conclusion. |
| `unknown` | There is no usable event, or the source cannot be interpreted. |
| `stale` | A previous operational state exists, but `status_updated_at` is older than the freshness threshold. |

**Never show `stale` or `unknown` as `available`.** Not on cards, maps, metadata, structured data, or APIs. If the public UI needs a colour, `unknown` and `stale` use the neutral/grey treatment and the words **Unknown** or **Stale**, plus `status_updated_at` when present.

The freshness threshold (minutes) is a business/operations decision and is **not** set in this document. Until it is confirmed, public surfaces must treat any availability that lacks a current, trusted event as `unknown` or `stale`, never `available`.

Operator tools (later) may store `last_known_status` for diagnosis. That field is not a public availability value.

### 1.2 Publishing law for facts and prices

- A station page may be public only when `publication_status = published` and required fact fields are complete or explicitly marked unknown.
- A tariff may be shown only from a `tariff_version` that is `approved` and whose `effective_from` has been reached, and that has not been superseded for that time band.
- Missing price → “Price not published”. Do not infer, round from another city, or reuse an old version without its effective dates.

---

## 2. Entity graph

```text
Organisation
  └── Host
        └── Station
              ├── EVSE
              │     └── Connector
              ├── TariffVersion          (station and/or EVSE/connector + time band)
              ├── AvailabilityEvent      (typically connector or EVSE scoped)
              └── SupportTicket
```

Future records (not modelled for implementation in Phase 0, reserved names only): User, Vehicle, Booking, ChargingSession, MeterValue, Payment, Invoice, Review, AuditEvent.

IDs should be stable strings (ULID/UUID). Later OCPP mapping uses **separate** vendor identifiers (`ocpp_charge_point_id`, `ocpp_evse_id`, `ocpp_connector_id`) and must not be required for MVP catalogue publishing.

---

## 3. Shared primitives

### 3.1 Provenance (required on public operational facts)

Every station, EVSE, connector, and tariff version carries:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `data_source` | enum | Yes | Where the fact came from |
| `verified_by` | string (role or staff id) | Yes if published | Who last confirmed it |
| `last_verified_at` | timestamptz | Yes if published | When facts were human- or process-verified |
| `status_updated_at` | timestamptz | Yes when a status is shown | When availability/operational status last changed |
| `publication_status` | enum | Yes | `draft` \| `in_review` \| `published` \| `archived` |

`data_source` values: `staff_survey`, `host_report`, `operator_admin`, `csms_ocpp`, `photo_evidence`, `other`.  
`csms_ocpp` is valid only after a later integration; MVP catalogue rows should not pretend to be live CSMS data.

### 3.2 Geography and language

- Coordinates: WGS84 decimal degrees.
- Addresses: Indian administrative fields (`line1`, `line2`, `locality`, `city`, `district`, `state`, `pincode`, `country` default `IN`).
- Public copy: language code (e.g. `en-IN`). Additional languages are not assumed.

### 3.3 Money

- Amounts in INR with explicit scale (integer paise **or** decimal rupees — pick one in implementation; do not mix).
- GST as a distinct component, not buried inside “energy”.
- No sample rates in this schema.

---

## 4. Organisation

The legal operator of the Plug and Go network (or the contracting CPO). One row expected at launch; the model allows more later.

| Field | Type | Required | Notes |
|---|---|---|---|
| `organisation_id` | id | Yes | Primary key |
| `legal_name` | string | Yes | As registered; not invented |
| `brand_name` | string | Yes | Public name, e.g. Plug and Go |
| `registered_address` | address | Yes | |
| `gstin` | string | If claiming GST invoices | Unconfirmed until client provides |
| `support_phone` | string | If published on site | |
| `support_email` | string | If published on site | |
| `grievance_contact` | string | If grievance page is live | |
| `website` | url | Optional | |
| `data_source` | enum | Yes | |
| `verified_by` | string | Yes if published | |
| `last_verified_at` | timestamptz | Yes if published | |

---

## 5. Host

The property or partner location owner. A host may have many stations. For operator-owned sites, Host may be the same organisation acting as host; still create a host record so site responsibility is explicit.

| Field | Type | Required | Notes |
|---|---|---|---|
| `host_id` | id | Yes | |
| `organisation_id` | fk | Yes | Operating organisation |
| `host_legal_name` | string | Yes | |
| `host_display_name` | string | Yes | Public or internal label |
| `host_type` | enum | Yes | `mall` \| `hotel` \| `workplace` \| `fuel_station` \| `depot` \| `residential` \| `highway` \| `other` |
| `primary_contact_name` | string | Internal | Not necessarily public |
| `primary_contact_phone` | string | Internal | |
| `primary_contact_email` | string | Internal | |
| `contract_status` | enum | Yes | `prospect` \| `active` \| `paused` \| `ended` \| `unknown` |
| `notes` | text | No | Internal |
| Provenance fields | | Yes as in §3.1 | |

Do not publish host personal contacts on station pages unless the host has approved that.

---

## 6. Station

A physical charging site a driver can navigate to. **Station facts are editable content.**

### 6.1 Identity and place

| Field | Type | Required to publish | Notes |
|---|---|---|---|
| `station_id` | id | Yes | Stable public reference (also used on tickets) |
| `host_id` | fk | Yes | |
| `organisation_id` | fk | Yes | Denormalised for query convenience |
| `name` | string | Yes | Canonical public name |
| `slug` | string | Yes | Unique within city/state URL pattern |
| `city` | string | Yes | |
| `state` | string | Yes | Indian state / UT |
| `latitude` | decimal | Yes | |
| `longitude` | decimal | Yes | |
| `address_line1` | string | Yes | |
| `address_line2` | string | No | |
| `locality` | string | No | Area / neighbourhood |
| `district` | string | No | |
| `pincode` | string | Yes | |
| `country` | string | Yes | `IN` |
| `landmark` | string | Recommended | |

Public URL pattern (later implementation): `/stations/[state]/[city]/[station-slug]`.

### 6.2 Arrival, access, parking

| Field | Type | Required to publish | Notes |
|---|---|---|---|
| `arrival_instructions` | text | Recommended | How to enter, which gate, where the bay is |
| `access_type` | enum | Yes | `public` \| `restricted` \| `guest_only` \| `hotel_guest` \| `members` \| `private` \| `unknown` |
| `access_hours_summary` | string | Yes | Human-readable; e.g. confirmed hours or `unknown` |
| `access_hours_structured` | JSON | Recommended | Weekly windows; empty if unknown |
| `access_restrictions` | text | Yes if restricted | Deposit, parking ticket, height barrier, etc. |
| `is_24_7` | boolean \| unknown | Do not set true unless confirmed | Never default to true |
| `parking_details` | text | Recommended | Bay count, reverse-in, walkway, fee to park |
| `parking_fee_applies` | boolean \| unknown | If known | Distinct from energy tariff |
| `booking_required` | boolean \| unknown | If known | MVP should not promise booking |

### 6.3 Amenities, accessibility, media, support

| Field | Type | Required to publish | Notes |
|---|---|---|---|
| `amenities` | list of enum | No | Controlled list; omit if unknown. Do not invent. |
| `accessibility_notes` | text | Recommended | Step-free, accessible bay, assistance |
| `accessible_bay_count` | integer \| unknown | If known | |
| `photo_ids` | list | At least one real photo recommended | Entrance, bay, charger, signage, amenities — not stock |
| `support_phone_override` | string | No | Else organisation support |
| `support_email_override` | string | No | |
| `emergency_instructions` | text | Recommended | What to do if unsafe |

Suggested amenity vocabulary (store only if verified): `restroom`, `waiting_area`, `lighting`, `cctv`, `cafe`, `shelter`, `wifi`, `air_pump`, `wheelchair_access`. Absence of a tag means unknown, not “not present”, unless `amenity_absences` is explicitly recorded.

### 6.4 Catalogue status (not live availability)

| Field | Type | Required | Notes |
|---|---|---|---|
| `operational_lifecycle` | enum | Yes | `planned` \| `commissioning` \| `open` \| `temporarily_closed` \| `decommissioned` |
| `publication_status` | enum | Yes | See §3.1 |
| `payment_methods` | list of enum | If claiming payment | `upi` \| `card` \| `wallet` \| `rfid` \| `app` \| `qr` \| `unknown` — only what is true |
| `authentication_methods` | list of enum | If claiming start methods | Same honesty rule |
| `data_source` | enum | Yes | |
| `verified_by` | string | Yes if published | |
| `last_verified_at` | timestamptz | Yes if published | |
| `status_updated_at` | timestamptz | Yes if any availability is shown | From latest child event or explicit unknown |

Installed versus available counts are **derived** from EVSE/connector records plus latest fresh availability events. Do not store a single hand-typed “3 available” as the source of truth.

Vehicle compatibility is derived from connector types and power, plus optional `compatible_vehicle_notes`. Do not publish OEM fitment claims without a source.

---

## 7. EVSE

An EV Supply Equipment unit (often one pedestal / charge point). A station has one or more EVSEs.

| Field | Type | Required to publish | Notes |
|---|---|---|---|
| `evse_id` | id | Yes | Internal canonical id |
| `station_id` | fk | Yes | |
| `evse_label` | string | Yes | Human label on site (“Charger A”) |
| `ocpp_charge_point_id` | string | No for MVP | Later CSMS mapping |
| `ocpp_evse_id` | integer/string | No for MVP | OCPP 2.x EVSE id if used |
| `max_power_kw` | decimal | Yes | Installed capability |
| `power_type` | enum | Yes | `ac` \| `dc` \| `unknown` |
| `installation_status` | enum | Yes | `installed` \| `planned` \| `removed` |
| `serial_number` | string | Internal | |
| `firmware_notes` | string | Internal | Later OCPP |
| Provenance fields | | Yes if published | |

**Installed count** at station level = count of EVSEs (or connectors — pick one definition and use it consistently; recommended: connectors, because drivers care about guns).

---

## 8. Connector

A single inlet/gun a vehicle can plug into.

| Field | Type | Required to publish | Notes |
|---|---|---|---|
| `connector_id` | id | Yes | |
| `evse_id` | fk | Yes | |
| `station_id` | fk | Yes | Denormalised |
| `connector_index` | integer | Yes | Physical index on the EVSE |
| `ocpp_connector_id` | integer | No for MVP | Later mapping |
| `connector_type` | enum | Yes | See §8.1 |
| `max_power_kw` | decimal | Yes | May be ≤ EVSE max |
| `max_current_a` | decimal | No | |
| `voltage_v` | decimal | No | |
| `cable_attached` | boolean \| unknown | If known | |
| `installation_status` | enum | Yes | `installed` \| `planned` \| `removed` |
| `vehicle_compatibility_notes` | text | No | Only sourced notes |
| Provenance fields | | Yes if published | |

### 8.1 `connector_type` vocabulary

The model can represent common Indian public-charging types. **This is not an inventory of Plug and Go hardware.**

`ccs2`, `type2_ac`, `chademo`, `gbt_dc`, `gbt_ac`, `bharat_dc_001`, `bharat_ac_001`, `other`, `unknown`

Public UI must show the recorded type, not a guessed equivalent.

### 8.2 Counts

| Measure | Definition |
|---|---|
| Installed connectors | `installation_status = installed` |
| Available connectors | Installed connectors whose **public** status is `available` under §1.1 |
| In use / faulted / offline | Matching public status |
| Unknown / stale | Must not increment available |

---

## 9. Tariff version

**Tariffs are versioned financial data.** Edits create a new version (or a new row with a new `effective_from`). Historical versions remain for audit and, later, invoices.

Scope: a version applies to a `station_id` and optionally a `connector_id` or `connector_type`, plus an optional time band.

| Field | Type | Required | Notes |
|---|---|---|---|
| `tariff_version_id` | id | Yes | |
| `station_id` | fk | Yes | |
| `connector_id` | fk | No | If null, station default for matching type/band |
| `connector_type` | enum | No | Alternative to specific connector |
| `time_band` | enum or JSON | No | e.g. solar hours vs other; **do not hard-code policy rates** |
| `currency` | string | Yes | `INR` |
| `energy_rate_per_kwh` | money | If energy billed | |
| `service_fee` | money | If charged | Flat and/or rules in `service_fee_rules` |
| `parking_fee` | money | If charged | |
| `idle_fee` | money | If charged | After grace |
| `idle_grace_minutes` | integer | If idle fee exists | |
| `reservation_fee` | money | If booking exists later | MVP may be null |
| `gst_components` | JSON | Yes if any fee shown | Rate/category as provided by finance; not invented |
| `discount` | money or JSON | If any | Named programme; not a silent markdown |
| `estimate_disclaimer` | text | Recommended | Estimate ≠ final invoice |
| `effective_from` | timestamptz | Yes | |
| `effective_to` | timestamptz | No | Null = open-ended until superseded |
| `approval_status` | enum | Yes | `draft` \| `approved` \| `rejected` \| `superseded` |
| `approved_by` | string | Yes if approved | Finance/operator |
| `approved_at` | timestamptz | Yes if approved | |
| `data_source` | enum | Yes | |
| `verified_by` | string | Yes if approved | |
| `last_verified_at` | timestamptz | Yes if approved | |

Customer-facing breakdown (when a version is approved and effective):

```text
Energy charge
+ Service fee
+ Parking / idle / reservation fee (only lines that apply)
+ GST
− Discount
= Payable (estimate until a later session/invoice exists)
```

Show `effective_from` (and `effective_to` if set) next to the price. If no approved version covers “now”, show **Price not published**.

---

## 10. Availability event

**Live availability is event data.** It is append-only. The public status of a connector is computed from the latest event plus freshness.

| Field | Type | Required | Notes |
|---|---|---|---|
| `availability_event_id` | id | Yes | |
| `station_id` | fk | Yes | |
| `evse_id` | fk | Recommended | |
| `connector_id` | fk | Yes if connector-level | Prefer connector grain |
| `recorded_status` | enum | Yes | `available` \| `in_use` \| `faulted` \| `offline` \| `unknown` |
| `source` | enum | Yes | `csms_ocpp` \| `operator_override` \| `technician` \| `heartbeat_timeout` \| `manual_import` |
| `source_event_id` | string | If from CSMS | Later correlation |
| `occurred_at` | timestamptz | Yes | Charger or operator time |
| `received_at` | timestamptz | Yes | Server time |
| `status_updated_at` | timestamptz | Yes | Usually `occurred_at` or override time |
| `payload` | JSON | No | Sanitised vendor payload; no secrets |
| `override_reason` | text | If operator override | Audited later |

`recorded_status` on an event does **not** include `stale`. Stale is computed:

```text
if no event → public_status = unknown
else if (now - status_updated_at) > freshness_threshold → public_status = stale
else → public_status = recorded_status
```

Manual imports and staff guesses without a timestamp must be stored as `unknown`, not `available`.

MVP without CSMS: it is valid to publish stations with public status `unknown` and a clear “availability not live” label. It is not valid to simulate occupancy for marketing.

---

## 11. Support ticket

Intake from public support/report forms in MVP; later also from sessions and staff.

| Field | Type | Required | Notes |
|---|---|---|---|
| `ticket_id` | id | Yes | Public reference for the user |
| `station_id` | fk | If known | From station page context |
| `evse_id` / `connector_id` | fk | If known | |
| `category` | enum | Yes | `did_not_start` \| `connector_issue` \| `wrong_data` \| `access_parking` \| `payment` \| `refund` \| `unsafe_fault` \| `billing` \| `host_enquiry` \| `fleet_enquiry` \| `other` |
| `channel` | enum | Yes | `web_form` \| `phone` \| `email` \| `later_in_app` |
| `reporter_name` | string | As collected | Minimise; privacy policy applies |
| `reporter_phone` | string | As collected | |
| `reporter_email` | string | As collected | |
| `description` | text | Yes | |
| `status` | enum | Yes | `open` \| `pending_user` \| `pending_ops` \| `resolved` \| `closed` |
| `created_at` | timestamptz | Yes | |
| `updated_at` | timestamptz | Yes | |
| `assigned_role` | enum | Later | support / technician / finance |
| `related_session_id` | id | Later | |

Payment and session categories exist for later phases; MVP forms should not imply that payment or remote start is available.

---

## 12. Media (station photos)

Not a separate domain entity in the product narrative, but required for every published station that shows imagery.

| Field | Type | Required | Notes |
|---|---|---|---|
| `photo_id` | id | Yes | |
| `station_id` | fk | Yes | |
| `kind` | enum | Yes | `entrance` \| `parking_bay` \| `charger` \| `signage` \| `connector` \| `amenities` \| `team` \| `other` |
| `storage_url` | url | Yes | |
| `captured_at` | date | Recommended | |
| `rights_confirmed` | boolean | Yes | Must be true to publish |
| `alt_text` | string | Yes | Factual, not promotional |
| `publication_status` | enum | Yes | |

No stock library as proof of a specific site.

---

## 13. Public read model (conceptual)

Later APIs should expose, per station:

- Identity: `station_id`, `name`, `slug`, city/state, lat/lng, full address
- Arrival instructions, access hours, restrictions, parking details
- EVSE/connector type, max kW, installed count, available count (**only if public statuses are fresh `available`**)
- Vehicle compatibility notes if sourced
- Amenities, accessibility, real image URLs
- Support contact
- Current approved tariff breakdown + effective date
- `data_source`, `verified_by`, `last_verified_at`, `status_updated_at`
- Public status per connector: one of the six values in §1.1

Search indexes use the same records. Google Business Profile (if used later) must match this address, hours, phone, and coordinates.

---

## 14. Roles versus data (later admin)

| Role | May edit | Must not |
|---|---|---|
| Content manager | Guides, some photos | Tariffs, live overrides, charger commands |
| Station operator | Facts, photos, availability override (audited) | Unapproved tariff publish without finance |
| Finance | Tariff versions, approvals | Pretend a draft rate is live |
| Support | Tickets, customer-visible notes | Silent price changes |
| Technician | Fault evidence, checklist (later) | Broad customer/finance access |
| Super-admin | Break-glass | Routine publishing |

Phase 0 does not build this admin. It only requires that fields have owners.

---

## 15. What this schema explicitly excludes

- OCPP remote start/stop commands, credentials, or meter objects as public fields
- Payment gateway tokens
- Invented demo stations presented as Plug and Go inventory
- A combined field such as `status = "Available – ₹X – CCS2"` that cannot be audited

Implementation (database, CMS, spreadsheet) may wait until Phase 4. Spreadsheets, if used now, must use these columns and these status rules so they can be imported without reinterpretation.
