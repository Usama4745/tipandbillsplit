# App Roles

Who uses the Tip & Bill Splitter.

The app runs entirely in the browser on one device. There are no accounts, no logins and no server. Everything entered is saved only in that browser's local storage. A "role" here means the situation someone is in when they use the app, not a permission level.

---

## R1 — Organizer

An **Organizer** is the person at the table who has the bill in hand and takes on the job of working out who pays what. Often it is the person who will pay the restaurant and collect money back from the others. They may be in a hurry, in a noisy place, on a phone, and sometimes abroad using a different currency.

**They can:**
- enter the total bill, choose the currency, and set the tax rate and service charge
- say whether the bill already includes tax
- pick a preset tip (0%, 10%, 15%, 18%, 20%, 25%) or type a custom tip percent
- add, rename and remove people at the table
- split the bill equally, or by the amount each person owes
- split the tip equally, or let each person set their own tip percent
- see the full breakdown (subtotal, tax, tip, service charge, final total, amount per person) and what each person pays
- leave and come back later to find their last split still there
- clear everything and start a new split

**They must never:**
- be able to remove the last person (a split always has at least one person)
- get shares that don't add up to the final total, even if the amounts they type for each person add up to more or less than the bill
- get a wrong or broken result from a bad number (empty, negative or non-numeric input counts as 0; "12,5" and "1,234.50" are both read correctly)
- have their bill data sent off the device

---

## R2 — Table Guest

A **Table Guest** is anyone else at the table who owes part of the bill. They don't run the split themselves. They look at the Organizer's screen, or are handed the device, to check their share and sometimes change their own details.

**They can:**
- find their own row by name and see what they pay
- see how the total was built (tax, service charge, tip) so they can check it is fair
- when the Organizer hands them the device, type their own name, the amount they owe (bill split by amount), or their own tip percent (individual tip)

**They must never:**
- be charged tip on tax or on the service charge (tip is always worked out on the pre-tax subtotal)
- be charged someone else's tip when the tip is split individually
- pay more than their fair share because other people's typed amounts went over the bill (over-assigned amounts are scaled down to fit the bill)
