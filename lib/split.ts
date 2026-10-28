export type SplitMode = "equal" | "individual";
/** How the bill itself is divided: evenly, or by an amount entered per person. */
export type BillMode = "equal" | "custom";

export interface SplitInput {
  /** Bill amount as typed by the user. */
  amount: string | number;
  /** Tax rate in percent, e.g. "8". */
  taxRate: string | number;
  /** Service charge in percent, e.g. "5". */
  serviceRate: string | number;
  /** True when `amount` already contains tax. */
  includesTax: boolean;
  /** Selected preset tip in percent. */
  preset: number;
  /** Custom tip in percent. An empty string means "use the preset". */
  customTip: string;
  /** How the tip is divided. */
  mode: SplitMode;
  /** How the bill is divided. Defaults to "equal". */
  billMode?: BillMode;
  /**
   * One entry per person. `tipPct` is only used in individual tip mode.
   * `owed` is the person's part of the bill amount, only used in custom bill mode.
   */
  people: { tipPct: string | number; owed?: string | number }[];
}

export interface SplitResult {
  n: number;
  subtotal: number;
  tax: number;
  service: number;
  /** Subtotal + tax + service, before tip. */
  pre: number;
  /** Effective tip percent in equal mode (custom or preset). */
  tipPct: number;
  tip: number;
  total: number;
  perPerson: number;
  /** Each person's fraction of the bill (sums to 1). */
  weights: number[];
  /** Sum of the amounts entered per person (custom bill mode). */
  assigned: number;
  /** Bill amount minus `assigned`. Negative when over-assigned. */
  unassigned: number;
  /** Tip carried by each person. */
  personTips: number[];
  /** Amount each person pays. */
  personPays: number[];
}

/**
 * Forgiving number parser. Accepts "," as a decimal separator and
 * returns 0 for anything empty, invalid or negative.
 */
export function parseNum(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (value == null) return 0;
  let s = String(value).trim().replace(/\s/g, "");
  if (s === "") return 0;
  // "1,234.50" → commas are thousands separators; "12,5" → comma is the decimal.
  s = s.includes(".") ? s.replace(/,/g, "") : s.replace(/,/g, ".");
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Each person's fraction of the bill.
 * Equal mode: 1/n each. Custom mode: what they owe, plus an equal slice of
 * anything left unassigned. If more than the bill is assigned, shares are
 * scaled down proportionally so they still add up to the bill.
 */
function billWeights(input: SplitInput, n: number, amount: number) {
  const equal = Array.from({ length: n }, () => 1 / n);
  if (input.billMode !== "custom") return { weights: equal, assigned: 0 };

  const owed = Array.from({ length: n }, (_, i) => parseNum(input.people[i]?.owed));
  const assigned = owed.reduce((a, b) => a + b, 0);

  if (amount <= 0) {
    // No bill to divide: fall back to the entered ratios, or equal.
    return { weights: assigned > 0 ? owed.map((o) => o / assigned) : equal, assigned };
  }
  if (assigned > amount) {
    return { weights: owed.map((o) => o / assigned), assigned };
  }
  const slice = (amount - assigned) / n;
  return { weights: owed.map((o) => (o + slice) / amount), assigned };
}

export function calculateSplit(input: SplitInput): SplitResult {
  const n = Math.max(1, input.people.length);
  const amount = parseNum(input.amount);
  const taxRate = parseNum(input.taxRate) / 100;
  const serviceRate = parseNum(input.serviceRate) / 100;

  const subtotal = input.includesTax ? amount / (1 + taxRate) : amount;
  const tax = input.includesTax ? amount - subtotal : amount * taxRate;
  const service = subtotal * serviceRate;
  const pre = subtotal + tax + service;

  const tipPct =
    input.customTip.trim() !== "" ? parseNum(input.customTip) : parseNum(input.preset);

  const { weights, assigned } = billWeights(input, n, amount);

  // Tip is always on each person's share of the pre-tax subtotal.
  const personTips = weights.map((w, i) => {
    const pct = input.mode === "individual" ? parseNum(input.people[i]?.tipPct) : tipPct;
    return subtotal * w * (pct / 100);
  });

  const tip = personTips.reduce((sum, t) => sum + t, 0);
  const personPays = personTips.map((t, i) => pre * weights[i] + t);
  const total = pre + tip;

  return {
    n,
    subtotal,
    tax,
    service,
    pre,
    tipPct,
    tip,
    total,
    perPerson: total / n,
    weights,
    assigned,
    unassigned: input.billMode === "custom" ? amount - assigned : 0,
    personTips,
    personPays,
  };
}

export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "INR", name: "Indian Rupee" },
  { code: "AED", name: "UAE Dirham" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "JPY", name: "Japanese Yen" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency });
    formatters.set(currency, f);
  }
  return f;
}

export function formatMoney(value: number, currency: string): string {
  return formatter(currency).format(Number.isFinite(value) ? value : 0);
}

export function currencySymbol(currency: string): string {
  return (
    formatter(currency)
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

/** Format a percent for display: 8 → "8", 7.5 → "7.5". */
export function formatPct(value: number): string {
  return String(Math.round(value * 100) / 100);
}
