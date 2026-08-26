# Plug and Go — Phase 0 client questionnaire

**Purpose:** Capture decisions that Phase 0 cannot invent. Answers become the product contract for later phases.  
**How to use:** Reply inline under each question. Use “unknown” rather than guessing. If a question is not applicable, say why.  
**Related:** `docs/phase-0-product-and-data.md`, `docs/station-data-schema.md`

Nothing in this file is a claim about the live business. Unanswered items stay unresolved.

---

## How to mark answers

For each question, please provide:

- **Answer**
- **Owner** (named person)
- **Date confirmed**
- **Evidence** (document, URL, photo, vendor contract) if relevant

Blocking tags:

- **Launch blocker** — public MVP must not go live with this unanswered if the related page or claim is in scope.
- **Start-charge blocker** — must be answered before any Book / Start charging / live availability promise.
- **Planning** — shapes scope but does not by itself authorise fake catalogue data.

---

## A. Target cities and launch date

**Q-A1. Launch blocker.** Which cities or corridors are in scope for the first public release?  
List names only where Plug and Go will actually publish stations or clearly say “coming soon” for that city.

**Q-A2. Launch blocker.** What is the target date for (a) internal staging review, (b) first public URL, (c) any paid announcement?  
If dates are unknown, say so. Do not request marketing copy that names a date until (b) is real.

**Q-A3. Planning.** Is launch limited to one city on purpose, or is a multi-city catalogue expected on day one?

**Q-A4. Planning.** Are any locations highway / intercity rather than in-city? If yes, which routes are you willing to maintain as real content (not generated pages)?

---

## B. Stations and connector types

**Q-B1. Launch blocker.** How many stations are intended to be **published** at MVP (not “planned someday”)?  
Give a number or a range, and separate **open now** vs **planned**.

**Q-B2. Launch blocker.** For those stations, which connector types exist or will exist?  
Use types you can stand behind (examples the data model can store: CCS2, Type 2 AC, CHAdeMO, GB/T, Bharat AC-001, Bharat DC-001). Do not list types you do not have.

**Q-B3. Launch blocker.** Typical power ratings (kW) per connector type at launch, if known.

**Q-B4. Planning.** Installed connector count today vs count you are willing to show as “coming soon”.

**Q-B5. Planning.** Are any sites restricted access (hotel guest, workplace, members) rather than public?

---

## C. Station data availability and ownership

**Q-C1. Launch blocker.** Does a real station list already exist (spreadsheet, CSMS, photos, addresses)?  
If yes, who can share it and in what form?

**Q-C2. Launch blocker.** Who is the **accountable data owner** for each station’s facts (name, pin, hours, access, photos)?  
One named role/person per station is required before publish.

**Q-C3. Launch blocker.** Who approves tariff changes?

**Q-C4. Launch blocker.** How often will facts be re-verified (for example after access changes, or on a calendar cadence)?  
The freshness threshold for availability is a separate number — see Q-C6.

**Q-C5. Launch blocker.** If live CSMS data is not ready, do you accept public status as **Unknown** or **Stale** (never shown as Available)?

**Q-C6. Launch blocker.** After how many minutes without a trusted event should public status become **Stale**?  
If unknown, public availability must remain Unknown until you set this.

**Q-C7. Planning.** Who will receive “wrong address / wrong hours / blocked bay” reports from the website?

---

## D. Hardware, OCPP, CSMS, and test charger

Do not sell live charging until this section is answered.

**Q-D1. Start-charge blocker.** Charger manufacturer(s) and model(s) at launch sites.

**Q-D2. Start-charge blocker.** OCPP version actually supported on those units (and firmware), not the brochure maximum.

**Q-D3. Start-charge blocker.** Is there an existing CSMS or vendor platform? Name it if yes. If no, is the intent to use a vendor CSMS or a custom service later?

**Q-D4. Start-charge blocker.** Do you have administrative access to that CSMS (not only a sales demo)?

**Q-D5. Start-charge blocker.** Is at least one **physical test charger** available in isolation for integration (not a live public bay)?

**Q-D6. Start-charge blocker.** Which remote operations does the hardware actually support (start, stop, meter values, status, reservations)?

**Q-D7. Planning.** Who holds vendor contracts, SIM/network, and certificates for chargers?

---

## E. Maps, payments, messaging, CRM, hosting, domain, support

**Q-E1. Planning / launch for finder UX.** Maps and geocoding provider preference (if any), and whether a licence already exists.  
MVP can ship a list + external “open in maps” links without an embedded SDK.

**Q-E2. Start-charge / payment blocker.** Payment gateway preference (UPI/cards/wallets). Is there an existing merchant account?  
MVP does not take payment; this still needs an owner before Phase 8.

**Q-E3. Planning.** SMS / OTP provider for later driver login. Any existing DLT / sender ID?

**Q-E4. Launch blocker if forms are in MVP.** CRM or inbox for leads and tickets (tool name, mailbox, who watches it, expected response time).  
If none, name a person who will read form email.

**Q-E5. Planning.** Hosting preference (if any) and who will own DNS, TLS, and environments (local / staging / production).

**Q-E6. Launch blocker.** Domain name to use for the public site. Is it registered? Who controls it?

**Q-E7. Launch blocker.** Public support phone and/or email, and hours those channels are truly staffed.  
Do not claim 24/7 unless it is true.

**Q-E8. Planning.** WhatsApp or other channels that should or should not be advertised.

---

## F. Legal entity, tax, and policies

**Q-F1. Launch blocker.** Legal entity name, registered office address, and (if applicable) GSTIN.

**Q-F2. Launch blocker.** Privacy policy: who drafts/approves it? Any existing notice?

**Q-F3. Launch blocker.** Website terms of use: who drafts/approves?

**Q-F4. Planning (MVP if you mention paid services).** Refund and cancellation policy. If MVP has no payments, confirm a one-line public statement that online charging payments are not offered yet.

**Q-F5. Launch blocker.** Grievance contact (name/role, email/phone) for the grievance page.

**Q-F6. Planning.** Accessibility statement owner.

**Q-F7. Planning.** Any State Nodal Agency, DISCOM, or tender obligations that affect what must be published on a station page?  
Counsel/SNA confirmation is required before compliance claims.

**Q-F8. Planning.** DPDP / data-retention expectations for phone numbers collected on forms.

---

## G. Brand assets, photography, proof, and permissions

**Q-G1. Launch blocker.** Logo, wordmark, and any usage rules. Who can approve visual design?

**Q-G2. Launch blocker.** Real photographs for each station you will publish (entrance, bay, charger, signage). Confirm rights and that they depict that site.

**Q-G3. Launch blocker.** May we show people (staff or customers) in photos? Written permission?

**Q-G4. Planning.** Any partner, host, or OEM logos you want on the site? Written permission for each?

**Q-G5. Planning.** Any metrics, awards, certifications, or press you want cited? Provide source and date.  
Unsourced figures will not be used.

**Q-G6. Planning.** Customer or host quotes/reviews: only if genuine, attributable per your policy, and permissioned.

---

## H. Languages

**Q-H1. Launch blocker.** Languages required on day one (e.g. English only, or English + Hindi, or others).

**Q-H2. Launch blocker.** Who will **human-review** each language? Unreviewed machine translation will not be published.

**Q-H3. Planning.** Language for support (phone/email) vs language for the website.

---

## I. Product boundary and conversion

**Q-I1. Launch blocker.** Confirm MVP = public brand site + station discovery + station detail + support/lead forms, and that account, booking, payment, invoices, OCPP, and operator portal are later.

**Q-I2. Launch blocker.** Primary station CTA at launch: **Get directions** / **Enquire** / **Book** / **Start charging**.  
Book and Start charging require Q-D and (for Book/Pay) Q-E2.

**Q-I3. Planning.** Should fleet, workplace, and host lead forms all ship in MVP, or only some?

**Q-I4. Planning.** If the catalogue is empty at the promised launch date, do we launch a brand-only site with finder labelled coming soon, or delay the public URL?

---

## J. Operations and success

**Q-J1. Planning.** Who is on-call for a published wrong pin or a safety report after launch?

**Q-J2. Planning.** May we implement the Phase 0 event names (`location_search`, `station_viewed`, `directions_clicked`, lead and support events) with a consent banner once policies exist?

**Q-J3. Planning.** Any analytics tool already in use?

**Q-J4. Planning.** Definition of a “qualified” fleet or host lead for `lead_qualified` (staff outcome).

---

## Response log

| Question ID | Answered? | Owner | Date | Notes |
|---|---|---|---|---|
| Q-A1 … Q-J4 | No | — | — | Complete this table as answers arrive |

Until this questionnaire is returned, Plug and Go documentation must not fill gaps with sample cities, station counts, rupee tariffs, partner names, OCPP versions, or launch metrics.
