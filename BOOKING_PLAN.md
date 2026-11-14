# Workshop booking – booked4.us implementation plan

Status: **Phase 1 done, Phase 2 done** (2026-10-08). booked4.us is set up and tested;
booking approval is on (pending = unpaid, approve = paid), pending bookings hold a seat.
There are no per-workshop links, so every button goes to `https://parton.booked4.us/public/book`.
Not done: optional "Megtelt" badge. Next: Phase 3 testing, deploy.

## Decisions made so far

- Booking system: **booked4.us** (Hungarian, booked4.us Kft.), **Basic package**
  – 2 900 Ft + ÁFA / month, or 2 450 Ft + ÁFA / month billed yearly (~29 400 Ft / year).
  Pricing is per *calendar*; one "Csoportos órák, események" calendar holds all 6
  workshops, so Basic (5 calendars) is enough.
- **No online payment.** Payment by bank transfer only.
- **No online invoicing for now.** Invoices are issued manually in the NAV free invoicing
  program (onlineszamla.nav.gov.hu), which Moltax already uses. The NAV program cannot be
  connected to any booking system.
- Later option (not now): booked4.us + Számlázz.hu (Számla Agent, 2 690 / 9 990 Ft + ÁFA per
  active month) issues the invoice automatically when a transfer is recorded in booked4.us
  under *Tranzakciók*. Számlázz.hu "Autokassza" (#digital package, 2 890 Ft + ÁFA / month)
  could even match bank transfers automatically.

## Booking flow (per booking)

The **díjbekérő** (payment request) is just the booked4.us confirmation email – not an
accounting document, not reported to NAV. The **számla** (invoice) is issued only after the
money arrives, so unpaid bookings never need a storno invoice.

| # | What happens | Who |
|---|---|---|
| 1 | Guest books on booked4.us (via the "Jelentkezem" button) with name, e-mail, phone, billing data | 🤖 automatic |
| 2 | Seat counts toward the limit, free seats decrease | 🤖 automatic* |
| 3 | Confirmation e-mail = díjbekérő: account number, amount, reference, deadline | 🤖 automatic |
| 4 | Guest transfers the fee | guest |
| 5 | **Check the bank account – who paid?** | ✋ manual |
| 6 | **Mark booking as paid / approved in booked4.us** | ✋ manual |
| 7 | **Issue the invoice in the NAV program** | ✋ manual |
| 8 | **E-mail the invoice from the NAV program** (NAV reporting is automatic) | ✋ manual |
| 9 | "Booking is final" e-mail (*if booked4.us can send it on status change*) | 🤖 or ✋ |
| 10 | Reminder e-mail before the workshop | 🤖 automatic |

Exceptions (manual): unpaid by deadline → cancel booking in booked4.us (no invoice to
storno); cancellation >10 days before → refund 50% + corrective invoice; seat handed over →
change name in booked4.us.

\* To verify in the trial.

## Integration approach

**"Jelentkezem" button links to booked4.us in a new tab** – no iframe, no booked4.us popup
script on our pages.

- Privacy: `adatkezeles.html` §10 states the site uses **no cookies**. An embedded calendar or
  third-party script could set cookies and would require a cookie banner. A plain link keeps
  that statement true.
- Security: no third-party code runs on our site.
- Design: workshop cards and `<dialog>` details stay unchanged; only the button target changes.

## Phase 1 – client sets up booked4.us

1. Register (14-day free trial) with Moltax Kft. data; logo + site green `#6c7d58`.
2. Create one calendar of type "Csoportos órák, események" – name: "Workshopok".
3. Create the 6 events:

   | Workshop | Date | Price | Max |
   |---|---|---|---|
   | „Nem tudom, mi legyek!” | 2026-11-04 17:00–19:00 | 5 000 Ft | 48 |
   | Nápolyi pizza | 2026-11-14 10:00–14:00 | 29 000 Ft | 10 |
   | Téli tea | 2026-11-20 17:00–20:00 | 20 000 Ft | 12 |
   | Adventi koszorú | 2026-11-28 10:00–13:00 | 29 000 Ft | 10 |
   | Smink | 2026-12-05 10:00–13:00 | 20 000 Ft | 6 |
   | Natúr kozmetikum | 2026-12-11 17:00–20:00 | 25 000 Ft | 12 |

4. Booking form fields: name, e-mail, phone, **billing name + address**; for the make-up
   workshop an extra question: "Hozok saját tükröt / tükröt kérek".
5. Confirmation e-mail text: amount, Moltax bank account, reference ("foglalási szám + név"),
   payment deadline, "a helyed a díj beérkezésével válik véglegessé".
6. Verify in the trial:
   - Does a *pending* booking count toward the seat limit?
   - Can it send an e-mail when a booking is marked paid?
   - Is there a **separate link per event**?
7. Make a test booking (also on mobile) and check the e-mails.
8. Send the 6 event links (or one calendar link if per-event links don't exist).

## Phase 2 – site changes

1. **`workshopok.html`** – the 6 "Jelentkezem" buttons (`data-ws-mail`, ~lines 240, 280,
   318, 360, 398, 429) get the booked4.us URL, `target="_blank" rel="noopener"`.
   Replace the text under the button ("Előzetes jelentkezés és fizetés szükséges.") with e.g.
   "A jelentkezés után e-mailben küldjük az átutalási adatokat. A helyed a díj beérkezésével
   válik véglegessé."
2. **`assets/js/main.js`** (~line 636) – keep the prefilled-mailto builder only as a
   **fallback** for buttons without a booking URL, so the page works while links are added.
   Past workshops already hide the button (`.wsd.is-past .wsd__cta .btn`).
3. **Optional "Megtelt" badge** – manual attribute (e.g. `data-ws-full`) that shows "Megtelt"
   on the card and turns the button into "Várólistára jelentkezem" (mailto).
4. **Payment process text** – "Jelentkezés" note on `workshopok.html` (#feltetelek) and
   `workshop-feltetelek.html` §1: online booking → e-mail with transfer details → pay within
   **X days** → final on payment, invoice issued after payment → unpaid by deadline = cancelled.
5. **`adatkezeles.html`**
   - §3: workshop booking via booked4.us, data categories (name, e-mail, phone, billing
     address) and purpose.
   - §6: add the processor – booked4.us Szolgáltató Kft., 2600 Vác, Zichy Hippolyt u. 12.,
     adószám 26668901-2-13, cégjegyzékszám 13-09-198371.
   - §10 (cookies) stays unchanged thanks to the link-out approach.
6. **Schema.org** – in the `Event` JSON-LD (`workshopok.html` lines 27–32) set each
   `offers.url` to its booking URL.
7. **`README.md`** – short "how to add a new workshop" note (booked4.us + site).

## Phase 3 – testing before go-live

- Test bookings on desktop and mobile; each button opens the right workshop.
- Fill a 1-seat test event to see the "full" behaviour.
- Proofread the e-mails, check the bank details.
- Deploy to Rackhost.

## Open decisions (client)

1. **Payment deadline** – how many days after booking (e.g. 3)? What about bookings made
   only a few days before the workshop?
2. **"Megtelt" badge** – wanted?
3. **Minimum headcount mismatch** – `workshop-feltetelek.html` §2 says the minimum is
   **6 fő** for every workshop, but most workshop dialogs say **8**. Which is right?
   Suggestion: change the terms to "a minimum létszámot workshoponként tüntetjük fel".

## Questions to ask booked4.us (kapcsolat@booked4.us, +36 1 998 9123)

1. Can a booking be "pending" and still count toward the seat limit?
2. Is there a direct link per event?
3. Can an e-mail be sent automatically when a booking is marked paid?
4. (For later) Price of the invoicing add-on; can it create a Számlázz.hu díjbekérő at booking?

## Other pending work

- Price change 170 000 → 150 000 Ft is done in `arak.html` and `README.md` but **not yet
  committed** – commit it separately, before the booking changes.
