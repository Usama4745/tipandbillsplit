# Session 01 — Prompts

All prompts given while building the Tip & Bill Splitter, in order, as written. Pasted text is shown in a box.

---

# Part 1 — First session (2026-10-27)

## Prompt 1

~~~~text
Build a single-page **Tip & Bill Splitter** in this Next.js project (App Router, TypeScript). Reproduce the design below exactly: Swiss Style / International Typographic Style. That means a strict grid, flush-left large sans-serif type, heavy black rules, no rounded corners, no shadows, no gradients, and one accent color.

## Setup
- Route: `app/page.tsx` (or `app/tip-splitter/page.tsx` if the home route is taken).
- The calculator must be a client component (`"use client"`), e.g. `components/tip-splitter/TipSplitter.tsx`. Put the pure calculation logic in `lib/split.ts` so it can be unit-tested.
- Font: load `Inter Tight` with `next/font/google` at weights 400, 500, 600, 700 and 800. Fallback: `'Helvetica Neue', Helvetica, Arial, sans-serif`. Apply `font-variant-numeric: tabular-nums` globally.
- Styling: use Tailwind if the project already has it. Otherwise use CSS Modules. Don't add a UI library.
- Define the colors below as CSS variables or Tailwind theme tokens.

## Design tokens
- `--accent: #512D38` (deep plum, the only accent color)
- `--ink: #141414` (text, rules and borders)
- `--paper: #F7F5F2` (page background)
- `--muted: #5E5A5B` (labels and secondary text; must keep at least 4.5:1 contrast)
- `--hairline: #D3CCC7` (row dividers)
- `--on-accent-muted: #E9DFE2` (secondary text on the plum panel)
- Border radius is 0 everywhere.
- Rules: 1px hairlines, 2px section and field rules, 3px under the main amount, 10px plum bar under the header.
- Labels: 12px, weight 600, uppercase, letter-spacing 0.08em, muted color.
- Focus ring: `outline: 3px solid var(--accent); outline-offset: 2px`.

## Layout (fluid page, max-width 1360px, centered)
Page padding: `32px clamp(16px, 4vw, 64px) 80px`.

1. **Masthead strip.** Uppercase, 13px, weight 600, 1px ink rule below it.
   - Left: "Tip & Bill Splitter".
   - Right: three live values: "Currency — USD", "Party — 3", "Tip — 18%".
2. **Header.** A flex row that wraps, aligned to the bottom, with a 10px solid accent border underneath.
   - Left: H1 "Tip &<br>Split." in weight 800, `font-size: clamp(64px, 9vw, 148px)`, line-height 0.86, letter-spacing -0.05em.
   - Right, max 360px wide:
     - The intro line "Enter the bill, choose a tip, add the people at the table. Every share recalculates instantly." at 17px.
     - A "CLEAR ALL" button: 44px tall, 2px ink border, transparent background, uppercase, weight 700.
3. **Body.** A flex row that wraps, with a 56px gap.
   - Left column `<main>`: `flex: 999 1 560px`, holding sections stacked with a 72px gap.
   - Right column `<aside>`: `flex: 1 1 380px`.
   - On phones the two columns stack.

Every section starts with a 2px ink top rule and 20px top padding. Its heading row has a small accent number (15px, weight 700), then an H2 (32px, weight 700, letter-spacing -0.02em).

### 01 Bill amount
- **Total bill.** A big input with the currency symbol in accent (40px) before it. The input text is `clamp(48px, 6vw, 80px)`, weight 700. No border except a 3px ink bottom rule. Use `inputMode="decimal"`.
- **Three fields** in a grid `repeat(auto-fit, minmax(180px, 1fr))` with a 32px gap. Each field is 48px tall with a 2px bottom rule only and 22px weight-600 text:
  - Currency `<select>` with `appearance: none` and a custom chevron SVG. Options: USD, EUR, GBP, PKR, INR, AED, CAD, AUD, CHF, JPY, each labelled like "USD — US Dollar".
  - Tax rate, with a "%" suffix.
  - Service charge, with a "%" suffix.
- **Toggle "Bill already includes tax".** A real `<button aria-pressed>`.
  - Track: square, 52×28, 2px ink border.
  - Knob: 20×20 square. Off: ink knob on the left. On: plum track with a white knob on the right. Animate it with a 160ms transform.
  - Hint text below the toggle: "Tax is added on top of the amount entered" or "Tax is extracted from the amount entered".

### 02 Tip
- Right side of the heading row: "Calculated on the pre-tax subtotal" in muted 14px.
- **Preset bar.** A 5-column grid inside one 2px ink border, with 2px dividers between cells. Buttons are 72px tall: 10%, 15%, 18%, 20%, 25%. The selected one has a plum background and white text. Use `aria-pressed`.
- Below it, a grid `repeat(auto-fit, minmax(200px, 1fr))`:
  - **Custom percentage** input. Typing a value overrides the presets and turns its bottom rule plum. Clicking a preset clears it.
  - **Split the tip.** A 2-button segmented control, "Equally" / "Individually", inside a 2px ink border, 44px tall. The active button is plum with white text.
- **Result strip.** A 1px top rule, then two columns:
  - "TIP AMOUNT": 44px weight-700 accent number. Below it: "18% of $128.50", or "Sum of each person's own tip" in individual mode.
  - "TOTAL WITH TIP": 44px number. Below it: "Tip per person $7.71", with "(avg.)" appended in individual mode.

### 03 Split between
- **Stepper** at the right of the heading row: a 2px ink border holding a [−] button, the count (26px bold, `aria-live="polite"`), and a [+] button.
  - Each button is 52×52.
  - [+] has a plum background and a white icon.
  - [−] is disabled at 1 person, shown at 30% opacity.
- **Table header** (uppercase labels, 1px ink rule below):
  - No. (36px wide)
  - Participant (flexible width)
  - Tip (88px wide, individual mode only)
  - Pays (120px wide, right-aligned)
  - An empty 44px column for the remove button.
- **Each row:** 68px minimum height with a hairline bottom border.
  - Accent number "01", "02", ….
  - Inline editable name input with no border, 19px weight 600.
  - In individual mode only: a tip % input with a bottom rule.
  - The amount this person pays, 19px bold.
  - A 44×44 "×" remove button with an `aria-label`. It is disabled when only one person is left.
- **"+ ADD PARTICIPANT".** A full-width, 60px-tall button with a 2px dashed ink border, uppercase.

### 04 Breakdown (the `<aside>`)
- **Panel.** Solid `--accent` background, white text, padding `clamp(24px, 3vw, 40px)`. The heading row has a 2px white rule below it.
- **`<dl>` rows.** Label on the left in `--on-accent-muted` 16px, value on the right at 20px weight 600, with `rgba(255,255,255,.28)` hairlines between rows:
  - Subtotal
  - Tax (8%, added / 8%, included)
  - Tip (18% / individual)
  - Service charge (5%), followed by a 2px white rule
  - **Final total**: 18px bold label, 32px bold value.
- **White card inside the panel** (padding 24px):
  - Label "AMOUNT PER PERSON", or "AVERAGE PER PERSON" in individual mode.
  - The amount in weight 800, `clamp(52px, 5.4vw, 84px)`, letter-spacing -0.045em, accent color.
  - Below it: "3 people · $177.04 total".
- **Individual mode only:** an "EACH PERSON PAYS" list of rows showing the name, "· tip 20%" in muted text, and the amount.
- **Footnote:** "Service charge is applied to the subtotal. Amounts are rounded for display only."

Icons are inline stroke SVGs (stroke 2.5, square caps), never emoji.

## Behaviour / calculation (`lib/split.ts`)
```ts
// Parse every input forgivingly. Accept "," as a decimal separator.
// Treat NaN or negative values as 0.
subtotal = includesTax ? amount / (1 + taxRate) : amount
tax      = includesTax ? amount - subtotal     : amount * taxRate
service  = subtotal * serviceRate
pre      = subtotal + tax + service
tipPct   = customTip !== "" ? customTip : preset
// Equal mode:      tip = subtotal * tipPct
// Individual mode: each person's tip = (subtotal / n) * theirPct; total tip = sum of these
personPays = pre / n + personTip
total      = pre + tip
perPerson  = total / n
```
- Format all money with `Intl.NumberFormat('en-US', { style: 'currency', currency })`. JPY therefore shows no decimals.
- Get the input prefix symbol from `formatToParts`.
- Everything recalculates on every keystroke. There is no Calculate button.
- Adding a person appends "Person N" with the current tip % as their individual tip.
- Remove is per row, and the stepper removes the last person. There is always at least 1 person.
- Default state: amount 128.50, USD, tax 8, service 5, tax not included, preset 18%, equal split, and three people "Person 1–3".
- "Clear all" resets to defaults but leaves amount, tax and service empty.
- Optional: persist state to `localStorage`. Wrap it in try/catch.

## Accessibility
- Use real `<label htmlFor>` on every input.
- Name inputs and remove buttons get `aria-label`s that include the person's name.
- Wrap presets and the segmented control in `role="group"` with an `aria-label`.
- Touch targets are at least 44px.
- Every text color must pass 4.5:1 contrast.

## Done when
- The page matches the layout above at 1440px.
- It stacks cleanly at 390px with no horizontal scroll. The 5 preset buttons stay in one row.
- `lib/split.ts` has unit tests covering:
  - tax added vs. included
  - service charge
  - equal vs. individual tip
  - n = 1
  - empty inputs
- `npm run build` and lint pass.
~~~~

**Result:** Built the Tip & Bill Splitter page, the calculation logic in `lib/split.ts` and its unit tests.

---

## Prompt 2

add option for 0% tip among 10 15 18 %'s

**Result:** Added a 0% tip preset.

---

## Prompt 3

add option for unequal bill splitting allow users to choose how much each person owes

**Result:** Added "Split the bill → By amount" so each person can owe a different part of the bill.

---

# Part 2 — Second session (2026-10-28)

## Prompt 4

create three docs 

~~~~text
docs/
    app-roles.md
    jobs-to-be-done.md
    user-stories.md
~~~~

mathcing following criteria 

~~~~text
Write three documents, in this order, because each one builds on the one before it.
Document
Answers
Format of each entry
App Roles
Who uses the app
"A [role] is [who this person is and their situation]. They can [what they see and do in the app]. They must never [what the app must prevent]", where the last part applies.
Jobs To Be Done
Why they use it
"When [situation], I want to [motivation], so I can [expected outcome]." Each job names the role it belongs to.
User Stories with Acceptance Criteria
How the app helps them get the job done
"As a [role], I want [capability], so that [benefit]." Each story names the job it serves and has acceptance criteria and a status.
~~~~

**Result:** Created [docs/app-roles.md](docs/app-roles.md), [docs/jobs-to-be-done.md](docs/jobs-to-be-done.md) and [docs/user-stories.md](docs/user-stories.md).

---

## Prompt 5

edit  readme of how to setup project add this demourl  tipandbillsplit.vercel.app/ create screenshot of app and add it in readme also create 10 second demo video and add it in readme

**Result:** Rewrote [README.md](README.md) with setup steps and the demo URL; added [docs/assets/screenshot.png](docs/assets/screenshot.png), [docs/assets/demo.gif](docs/assets/demo.gif) and [docs/assets/demo.mp4](docs/assets/demo.mp4).

---

## Prompt 6

create a transcript in root folden that lists all the prompt I have provided  in this session file name the file to session-01.md

**Result:** Created this file.

---

## Prompt 7

add all prmopt from previous session too

**Result:** Added the prompts from the previous session to this file.
