export type SplitMode = "equal" | "individual";

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
  mode: SplitMode;
  /** One entry per person. `tipPct` is only used in individual mode. */
  people: { tipPct: string | number }[];
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

  let personTips: number[];
  if (input.mode === "individual") {
    const base = subtotal / n;
    personTips = Array.from({ length: n }, (_, i) =>
      base * (parseNum(input.people[i]?.tipPct) / 100),
    );
  } else {
    const share = (subtotal * (tipPct / 100)) / n;
    personTips = Array.from({ length: n }, () => share);
  }

  const tip = personTips.reduce((sum, t) => sum + t, 0);
  const personPays = personTips.map((t) => pre / n + t);
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
