# User Stories with Acceptance Criteria

How the Tip & Bill Splitter helps each role get their job done. Each story names its role (see [app-roles.md](app-roles.md)) and the job it serves (see [jobs-to-be-done.md](jobs-to-be-done.md)).

**Status values:** `Done` (built and working in the app), `Not started` (planned, not built).

| ID | Story | Role | Job | Status |
|----|-------|------|-----|--------|
| US-01 | Enter the bill amount | Organizer | J1 | Done |
| US-02 | Set the number of people | Organizer | J1 | Done |
| US-03 | See the amount per person | Organizer | J1, J8 | Done |
| US-04 | Add tax on top of the bill | Organizer | J2 | Done |
| US-05 | Handle a bill that already includes tax | Organizer | J2 | Done |
| US-06 | Add a service charge | Organizer | J2 | Done |
| US-07 | Choose a preset tip | Organizer | J3 | Done |
| US-08 | Enter a custom tip | Organizer | J3 | Done |
| US-09 | Split the bill by amount owed | Organizer | J4 | Done |
| US-10 | See whether amounts owed match the bill | Organizer | J4 | Done |
| US-11 | Choose the currency | Organizer | J5 | Done |
| US-12 | Keep my split after leaving | Organizer | J6 | Done |
| US-13 | Clear everything | Organizer | J7 | Done |
| US-14 | Find my own row by name | Table Guest | J8 | Done |
| US-15 | See the full breakdown | Table Guest | J9 | Done |
| US-16 | Set my own tip percent | Table Guest | J10 | Done |
| US-17 | Share the result as text | Organizer | J8 | Not started |
| US-18 | Rounded shares add up exactly | Table Guest | J9 | Not started |

---

## Organizer stories

### US-01 — Enter the bill amount
**As an** Organizer, **I want** to type the total bill in one large field, **so that** I can start the split in seconds.

- **Role:** Organizer
- **Job:** J1 — Split a bill evenly, fast
- **Status:** Done

**Acceptance criteria**
- [x] The "Total bill" field accepts decimals and opens a number keypad on phones.
- [x] Both "12.50" and "12,50" are read as 12.5; "1,234.50" is read as 1234.5.
- [x] An empty, negative or non-numeric amount counts as 0 and never shows an error or "NaN".
- [x] Every total on the screen updates as I type, without pressing a button.

### US-02 — Set the number of people
**As an** Organizer, **I want** to add and remove people at the table, **so that** the split matches who is actually paying.

- **Role:** Organizer
- **Job:** J1 — Split a bill evenly, fast
- **Status:** Done

**Acceptance criteria**
- [x] The "+" button and the "Add participant" button each add one person, named "Person N" by default.
- [x] The "−" button removes the last person; the "×" on a row removes that person.
- [x] Both remove controls are disabled when only one person is left.
- [x] The current count is shown between the "−" and "+" buttons and in the header ("Party — N").
- [x] I can rename any person by typing over their name; a blank name falls back to "Person N".

### US-03 — See the amount per person
**As an** Organizer, **I want** to see one clear amount per person, **so that** I can tell everyone what to pay.

- **Role:** Organizer
- **Job:** J1 — Split a bill evenly, fast; J8 — Know exactly what I owe
- **Status:** Done

**Acceptance criteria**
- [x] The Breakdown panel shows "Amount per person" = final total ÷ number of people.
- [x] Each person's row shows what they pay in the "Pays" column.
- [x] When shares differ between people (bill split by amount or individual tips), the label changes to "Average per person" and an "Each person pays" list appears.
- [x] Large amounts shrink to fit and never overflow the card.

### US-04 — Add tax on top of the bill
**As an** Organizer, **I want** to enter a tax rate, **so that** tax is added to the bill the same way the receipt does.

- **Role:** Organizer
- **Job:** J2 — Get tax and service charge right
- **Status:** Done

**Acceptance criteria**
- [x] With "Bill already includes tax" off, tax = bill × tax rate and is added to the total.
- [x] The hint under the toggle reads "Tax is added on top of the amount entered".
- [x] The Breakdown shows the tax line as "Tax (X%, added)".

### US-05 — Handle a bill that already includes tax
**As an** Organizer, **I want** to say the bill already includes tax, **so that** tax isn't charged twice.

- **Role:** Organizer
- **Job:** J2 — Get tax and service charge right
- **Status:** Done

**Acceptance criteria**
- [x] With the toggle on, subtotal = bill ÷ (1 + tax rate) and tax = bill − subtotal.
- [x] The total before tip and service equals the amount I entered.
- [x] The hint reads "Tax is extracted from the amount entered" and the Breakdown shows "Tax (X%, included)".

### US-06 — Add a service charge
**As an** Organizer, **I want** to enter a service charge percent, **so that** it is included in everyone's share.

- **Role:** Organizer
- **Job:** J2 — Get tax and service charge right
- **Status:** Done

**Acceptance criteria**
- [x] Service charge = pre-tax subtotal × service rate.
- [x] It appears as its own line in the Breakdown and is part of the final total.
- [x] A note in the Breakdown says the service charge is applied to the subtotal.

### US-07 — Choose a preset tip
**As an** Organizer, **I want** one-tap tip options, **so that** I don't have to type a percent.

- **Role:** Organizer
- **Job:** J3 — Leave a fair tip without arguing about it
- **Status:** Done

**Acceptance criteria**
- [x] Presets are 0%, 10%, 15%, 18%, 20% and 25%; 18% is selected by default.
- [x] Choosing 0% gives a tip of 0 and the final total equals subtotal + tax + service.
- [x] Tapping a preset clears any custom tip and highlights the chosen preset.
- [x] Tip is always worked out on the pre-tax subtotal, as noted beside the Tip heading.
- [x] "Tip amount" and "Total with tip" update right away.

### US-08 — Enter a custom tip
**As an** Organizer, **I want** to type any tip percent, **so that** I can tip an amount the presets don't cover.

- **Role:** Organizer
- **Job:** J3 — Leave a fair tip without arguing about it
- **Status:** Done

**Acceptance criteria**
- [x] Typing in "Custom percentage" overrides the preset, and no preset is highlighted.
- [x] Decimals such as "12.5" or "12,5" are accepted.
- [x] Clearing the field goes back to the selected preset.

### US-09 — Split the bill by amount owed
**As an** Organizer, **I want** to enter how much of the bill each person owes, **so that** people who ordered more pay more.

- **Role:** Organizer
- **Job:** J4 — Split unevenly when people ordered different things
- **Status:** Done

**Acceptance criteria**
- [x] "Split the bill → By amount" shows an "Owes" field on each person's row.
- [x] Tax, service charge and tip are shared in the same proportion as the amounts owed.
- [x] Any part of the bill nobody has claimed is split equally between everyone.
- [x] An empty "Owes" field shows, greyed out, the share that person will end up with.
- [x] The Breakdown's "Each person pays" list shows each person's percent of the bill.
- [x] Switching back to "Equally" ignores the amounts owed but keeps them for later.

### US-10 — See whether amounts owed match the bill
**As an** Organizer, **I want** to see how much of the bill is assigned, **so that** I can spot typing mistakes.

- **Role:** Organizer
- **Job:** J4 — Split unevenly when people ordered different things
- **Status:** Done

**Acceptance criteria**
- [x] Below the list, a status line shows "Assigned X of Y".
- [x] If less than the bill is assigned, it says how much is left and that it is split equally.
- [x] If more than the bill is assigned, it says how much over, in the accent colour, and that shares are scaled down to fit.
- [x] If exactly the bill is assigned, it says "fully assigned".
- [x] If no bill is entered, it asks me to enter the total bill.
- [x] The final total never changes because of the amounts owed.

### US-11 — Choose the currency
**As an** Organizer, **I want** to pick the currency, **so that** amounts show in the money the bill is in.

- **Role:** Organizer
- **Job:** J5 — Split in the local currency
- **Status:** Done

**Acceptance criteria**
- [x] The list offers USD, EUR, GBP, PKR, INR, AED, CAD, AUD, CHF and JPY, each with its full name.
- [x] Every amount on screen uses the chosen currency's symbol and number of decimals (e.g. JPY shows none).
- [x] The header shows "Currency — CODE".

### US-12 — Keep my split after leaving
**As an** Organizer, **I want** my last split saved on my device, **so that** I can come back and finish collecting money.

- **Role:** Organizer
- **Job:** J6 — Pick up where I left off
- **Status:** Done

**Acceptance criteria**
- [x] Every change is saved in the browser's local storage automatically.
- [x] Reopening the page restores the bill, currency, rates, tip, split modes and people.
- [x] Splits saved before "split by amount" existed still load, as an equal split.
- [x] Damaged or unreadable saved data is ignored and the app starts with defaults.
- [x] If storage is blocked (e.g. private mode), the app still works; it just doesn't save.
- [x] Nothing is sent to a server.

### US-13 — Clear everything
**As an** Organizer, **I want** one button that resets the app, **so that** I can start a new bill.

- **Role:** Organizer
- **Job:** J7 — Start a new split cleanly
- **Status:** Done

**Acceptance criteria**
- [x] "Clear all" empties the bill, tax and service fields.
- [x] It resets to three people named Person 1–3, an 18% tip, the custom tip cleared, both splits set to "Equally", and USD.
- [x] The cleared state is saved, so reloading doesn't bring the old bill back.

### US-17 — Share the result as text
**As an** Organizer, **I want** to copy or share a short summary of who pays what, **so that** I can send it to the group chat.

- **Role:** Organizer
- **Job:** J8 — Know exactly what I owe
- **Status:** Not started

**Acceptance criteria**
- [ ] A "Share" button copies a plain-text summary (names, amounts, final total, currency).
- [ ] On phones that support it, the system share sheet opens instead.
- [ ] A short confirmation appears after copying.

---

## Table Guest stories

### US-14 — Find my own row by name
**As a** Table Guest, **I want** my name next to my amount, **so that** I can find what I owe without asking.

- **Role:** Table Guest
- **Job:** J8 — Know exactly what I owe
- **Status:** Done

**Acceptance criteria**
- [x] Each row shows a number, the person's name and what they pay.
- [x] I can type my own name into my row when handed the device.
- [x] On narrow phone screens, the "Owes" and "Tip" fields move to a second line so names and amounts stay readable.

### US-15 — See the full breakdown
**As a** Table Guest, **I want** to see how the total was built, **so that** I can check the split is fair.

- **Role:** Table Guest
- **Job:** J9 — Check the split is fair
- **Status:** Done

**Acceptance criteria**
- [x] The Breakdown lists subtotal, tax (with rate and whether added or included), tip (with percent or "individual"), service charge (with rate) and final total.
- [x] Subtotal + tax + tip + service charge = final total.
- [x] The sum of what each person pays = final total (before display rounding).
- [x] The Breakdown stays in view beside the form on wide screens.

### US-16 — Set my own tip percent
**As a** Table Guest, **I want** to set my own tip percent, **so that** I only pay the tip I chose.

- **Role:** Table Guest
- **Job:** J10 — Tip what I want to tip
- **Status:** Done

**Acceptance criteria**
- [x] "Split the tip → Individually" shows a "Tip" field on each person's row.
- [x] My tip = my share of the pre-tax subtotal × my tip percent; other people's tips don't change what I pay.
- [x] A person added while in this mode starts with the current tip percent.
- [x] The Breakdown's tip line shows "individual", the tip amount is the sum of everyone's tips, and the "Each person pays" list shows each person's tip percent.
- [x] Works together with "Split the bill → By amount".

### US-18 — Rounded shares add up exactly
**As a** Table Guest, **I want** the rounded amounts everyone pays to add up exactly to the final total, **so that** the Organizer isn't left a cent short or over.

- **Role:** Table Guest
- **Job:** J9 — Check the split is fair
- **Status:** Not started

**Acceptance criteria**
- [ ] Each person's amount is rounded to the currency's smallest unit.
- [ ] Any leftover cent is given to one person in a predictable way (e.g. the first person).
- [ ] The rounded amounts always add up exactly to the displayed final total.
