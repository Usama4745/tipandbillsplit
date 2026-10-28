"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CURRENCIES,
  calculateSplit,
  currencySymbol,
  formatMoney,
  formatPct,
  parseNum,
  type BillMode,
  type CurrencyCode,
  type SplitMode,
} from "@/lib/split";
import { ChevronIcon, CloseIcon, MinusIcon, PlusIcon } from "./icons";

const PRESETS = [0, 10, 15, 18, 20, 25] as const;
const STORAGE_KEY = "tip-splitter:v1";

interface Person {
  id: number;
  name: string;
  tipPct: string;
  /** Part of the bill this person owes (custom bill split). */
  owed: string;
}

interface State {
  amount: string;
  currency: CurrencyCode;
  taxRate: string;
  serviceRate: string;
  includesTax: boolean;
  preset: number;
  customTip: string;
  mode: SplitMode;
  billMode: BillMode;
  people: Person[];
  nextId: number;
}

function defaultPeople(): Person[] {
  return [1, 2, 3].map((i) => ({ id: i, name: `Person ${i}`, tipPct: "18", owed: "" }));
}

const DEFAULT_STATE: State = {
  amount: "128.50",
  currency: "USD",
  taxRate: "8",
  serviceRate: "5",
  includesTax: false,
  preset: 18,
  customTip: "",
  mode: "equal",
  billMode: "equal",
  people: defaultPeople(),
  nextId: 4,
};

const CLEARED_STATE: State = { ...DEFAULT_STATE, amount: "", taxRate: "", serviceRate: "" };

/** Accepts saved state only if it has the expected shape. */
function readSaved(raw: string | null): State | null {
  if (!raw) return null;
  const s = JSON.parse(raw) as Partial<State>;
  const ok =
    typeof s.amount === "string" &&
    CURRENCIES.some((c) => c.code === s.currency) &&
    typeof s.taxRate === "string" &&
    typeof s.serviceRate === "string" &&
    typeof s.includesTax === "boolean" &&
    typeof s.preset === "number" &&
    typeof s.customTip === "string" &&
    (s.mode === "equal" || s.mode === "individual") &&
    (s.billMode === undefined || s.billMode === "equal" || s.billMode === "custom") &&
    Array.isArray(s.people) &&
    s.people.length > 0 &&
    s.people.every(
      (p) => typeof p?.id === "number" && typeof p.name === "string" && typeof p.tipPct === "string",
    );
  if (!ok) return null;
  const nextId = Math.max(s.nextId ?? 0, ...s.people!.map((p) => p.id + 1));
  // Older saves have no bill split mode or owed amounts.
  const people = s.people!.map((p) => ({ ...p, owed: typeof p.owed === "string" ? p.owed : "" }));
  return { ...(s as State), billMode: s.billMode ?? "equal", people, nextId };
}

const pad = (i: number) => String(i + 1).padStart(2, "0");
const displayName = (p: Person, i: number) => p.name.trim() || `Person ${i + 1}`;

export default function TipSplitter() {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const loaded = useRef(false);

  // Restore saved state after hydration so server and client markup match.
  useEffect(() => {
    try {
      const saved = readSaved(window.localStorage.getItem(STORAGE_KEY));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from storage
      if (saved) setState(saved);
    } catch {
      // Storage unavailable or corrupt: keep defaults.
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota or privacy-mode errors.
    }
  }, [state]);

  const update = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));

  const result = useMemo(() => calculateSplit(state), [state]);
  const { currency, people, mode, billMode } = state;
  const money = (v: number) => formatMoney(v, currency);
  const symbol = currencySymbol(currency);
  const individual = mode === "individual";
  const custom = billMode === "custom";
  // Shares differ between people, so "per person" figures are averages.
  const uneven = individual || custom;
  const customActive = state.customTip.trim() !== "";
  const tipLabel = `${formatPct(result.tipPct)}%`;
  const n = people.length;
  const peopleLabel = `${n} ${n === 1 ? "person" : "people"}`;

  const addPerson = () =>
    setState((s) => ({
      ...s,
      people: [
        ...s.people,
        { id: s.nextId, name: `Person ${s.people.length + 1}`, tipPct: formatPct(result.tipPct), owed: "" },
      ],
      nextId: s.nextId + 1,
    }));

  const removePerson = (id: number) =>
    setState((s) =>
      s.people.length <= 1 ? s : { ...s, people: s.people.filter((p) => p.id !== id) },
    );

  const removeLast = () =>
    setState((s) => (s.people.length <= 1 ? s : { ...s, people: s.people.slice(0, -1) }));

  const updatePerson = (id: number, patch: Partial<Person>) =>
    setState((s) => ({
      ...s,
      people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const clearAll = () => setState({ ...CLEARED_STATE, people: defaultPeople() });

  // Phones keep 4 columns and move the Owes/Tip inputs to a second line;
  // from `sm` up they get their own columns.
  const rowCols = `grid-cols-[24px_minmax(0,1fr)_auto_44px] ${
    custom && individual
      ? "sm:grid-cols-[36px_minmax(0,1fr)_112px_88px_120px_44px]"
      : custom
        ? "sm:grid-cols-[36px_minmax(0,1fr)_112px_120px_44px]"
        : individual
          ? "sm:grid-cols-[36px_minmax(0,1fr)_88px_120px_44px]"
          : "sm:grid-cols-[36px_minmax(0,1fr)_120px_44px]"
  }`;
  const hasInputs = custom || individual;

  const billAmount = parseNum(state.amount);
  // Placeholder for an empty "Owes" field: the share that person ends up with.
  const fractionDigits =
    new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  const shareOf = (i: number) => (result.weights[i] * billAmount).toFixed(fractionDigits);
  const overAssigned = custom && result.unassigned < -0.005;
  const assignedText = `Assigned ${money(result.assigned)} of ${money(billAmount)}`;
  const assignStatus =
    billAmount <= 0
      ? "Enter the total bill to check the amounts."
      : overAssigned
        ? `${assignedText} · over by ${money(-result.unassigned)}. Shares are scaled down to fit the bill.`
        : result.unassigned > 0.005
          ? `${assignedText} · ${money(result.unassigned)} left, split equally between everyone.`
          : `${assignedText} · fully assigned.`;

  return (
    <div className="mx-auto max-w-[1360px] px-[clamp(16px,4vw,64px)] pt-8 pb-20">
      {/* Masthead */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-ink pb-3 text-[13px] font-semibold uppercase tracking-[0.06em]">
        <span>Tip &amp; Bill Splitter</span>
        <ul className="flex flex-wrap gap-x-6 gap-y-1" aria-label="Current settings">
          <li>Currency — {currency}</li>
          <li>Party — {n}</li>
          <li>Split — {custom ? "By amount" : "Equal"}</li>
          <li>Tip — {individual ? "Individual" : tipLabel}</li>
        </ul>
      </div>

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8 border-b-[10px] border-accent pt-12 pb-8">
        <h1 className="text-[clamp(64px,9vw,148px)] leading-[0.86] font-extrabold tracking-[-0.05em]">
          Tip &amp;
          <br />
          Split.
        </h1>
        <div className="flex max-w-[360px] flex-col items-start gap-6">
          <p className="text-[17px] leading-[1.45]">
            Enter the bill, choose a tip, add the people at the table. Every share recalculates
            instantly.
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="h-11 border-2 border-ink bg-transparent px-6 text-[14px] font-bold tracking-[0.08em] uppercase transition-colors hover:bg-ink hover:text-paper"
          >
            Clear all
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="mt-14 flex flex-wrap gap-14">
        <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-[72px]">
          {/* 01 Bill amount */}
          <Section num="01" id="bill" title="Bill amount">
            <label htmlFor="amount" className="label block">
              Total bill
            </label>
            <div className="mt-3 flex items-baseline gap-3 border-b-[3px] border-ink pb-2">
              <span aria-hidden="true" className="shrink-0 text-[40px] leading-none font-bold text-accent">
                {symbol}
              </span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={state.amount}
                onChange={(e) => update({ amount: e.target.value })}
                className="w-full min-w-0 bg-transparent text-[clamp(48px,6vw,80px)] leading-[1.05] font-bold tracking-[-0.03em]"
              />
            </div>

            <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-8">
              <div>
                <label htmlFor="currency" className="label block">
                  Currency
                </label>
                <div className="relative mt-2 h-12 border-b-2 border-ink">
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => update({ currency: e.target.value as CurrencyCode })}
                    className="h-full w-full cursor-pointer appearance-none truncate bg-transparent pr-8 text-[22px] font-semibold"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2" />
                </div>
              </div>
              <NumberField
                id="tax"
                label="Tax rate"
                suffix="%"
                value={state.taxRate}
                onChange={(v) => update({ taxRate: v })}
              />
              <NumberField
                id="service"
                label="Service charge"
                suffix="%"
                value={state.serviceRate}
                onChange={(v) => update({ serviceRate: v })}
              />
            </div>

            <div className="mt-10">
              <button
                type="button"
                aria-pressed={state.includesTax}
                aria-describedby="tax-hint"
                onClick={() => update({ includesTax: !state.includesTax })}
                className="inline-flex min-h-11 items-center gap-4 text-left text-[17px] font-semibold"
              >
                <span
                  aria-hidden="true"
                  className={`relative h-7 w-[52px] shrink-0 border-2 border-ink transition-colors duration-[160ms] motion-reduce:transition-none ${
                    state.includesTax ? "bg-accent" : "bg-transparent"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] h-5 w-5 transition-transform duration-[160ms] motion-reduce:transition-none ${
                      state.includesTax ? "translate-x-6 bg-white" : "translate-x-0 bg-ink"
                    }`}
                  />
                </span>
                Bill already includes tax
              </button>
              <p id="tax-hint" className="mt-2 text-[14px] text-muted">
                {state.includesTax
                  ? "Tax is extracted from the amount entered"
                  : "Tax is added on top of the amount entered"}
              </p>
            </div>
          </Section>

          {/* 02 Tip */}
          <Section
            num="02"
            id="tip"
            title="Tip"
            aside={<p className="text-[14px] text-muted">Calculated on the pre-tax subtotal</p>}
          >
            <div role="group" aria-label="Tip percentage" className="grid grid-cols-6 border-2 border-ink">
              {PRESETS.map((p) => {
                const selected = !customActive && state.preset === p;
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update({ preset: p, customTip: "" })}
                    className={`h-[72px] min-w-0 border-l-2 border-ink text-[clamp(18px,2.2vw,26px)] font-bold tracking-[-0.02em] transition-colors first:border-l-0 ${
                      selected ? "bg-accent text-white" : "hover:bg-ink/[.06]"
                    }`}
                  >
                    {p}%
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
              <NumberField
                id="custom-tip"
                label="Custom percentage"
                suffix="%"
                placeholder="—"
                active={customActive}
                value={state.customTip}
                onChange={(v) => update({ customTip: v })}
              />
              <Segmented
                label="Split the tip"
                value={mode}
                onChange={(m) => update({ mode: m })}
                options={[
                  { value: "equal", label: "Equally" },
                  { value: "individual", label: "Individually" },
                ]}
              />
            </div>

            <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8 border-t border-ink pt-6">
              <div>
                <span className="label block">Tip amount</span>
                <p className="mt-2 text-[44px] leading-[1.05] font-bold tracking-[-0.03em] text-accent [overflow-wrap:anywhere]">
                  {money(result.tip)}
                </p>
                <p className="mt-1 text-[14px] text-muted">
                  {individual
                    ? "Sum of each person's own tip"
                    : `${tipLabel} of ${money(result.subtotal)}`}
                </p>
              </div>
              <div>
                <span className="label block">Total with tip</span>
                <p className="mt-2 text-[44px] leading-[1.05] font-bold tracking-[-0.03em] [overflow-wrap:anywhere]">
                  {money(result.total)}
                </p>
                <p className="mt-1 text-[14px] text-muted">
                  Tip per person {money(result.tip / result.n)}
                  {uneven ? " (avg.)" : ""}
                </p>
              </div>
            </div>
          </Section>

          {/* 03 Split between */}
          <Section
            num="03"
            id="people"
            title="Split between"
            aside={
              <div role="group" aria-label="Number of people" className="flex border-2 border-ink">
                <button
                  type="button"
                  onClick={removeLast}
                  disabled={n <= 1}
                  aria-label="Remove last person"
                  className="grid h-[52px] w-[52px] place-items-center transition-colors enabled:hover:bg-ink/[.06] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <MinusIcon />
                </button>
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className="grid min-w-[60px] place-items-center border-x-2 border-ink px-2 text-[26px] font-bold"
                >
                  {n}
                  <span className="sr-only"> {n === 1 ? "person" : "people"}</span>
                </span>
                <button
                  type="button"
                  onClick={addPerson}
                  aria-label="Add person"
                  className="grid h-[52px] w-[52px] place-items-center bg-accent text-white transition-opacity hover:opacity-90"
                >
                  <PlusIcon />
                </button>
              </div>
            }
          >
            <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-end gap-8">
              <Segmented
                label="Split the bill"
                value={billMode}
                onChange={(m) => update({ billMode: m })}
                options={[
                  { value: "equal", label: "Equally" },
                  { value: "custom", label: "By amount" },
                ]}
              />
              <p className="text-[14px] leading-[1.45] text-muted">
                {custom
                  ? "Enter what each person owes of the bill. Tax, service and tip are shared in proportion."
                  : "Everyone pays the same share of the bill."}
              </p>
            </div>

            <div
              aria-hidden="true"
              className={`grid ${rowCols} items-end gap-2 border-b border-ink pb-3 sm:gap-4`}
            >
              <span className="label">No.</span>
              <span className="label">Participant</span>
              {custom && <span className="label hidden sm:block">Owes</span>}
              {individual && <span className="label hidden sm:block">Tip</span>}
              <span className="label text-right">Pays</span>
              <span />
            </div>

            <ul>
              {people.map((p, i) => {
                const name = displayName(p, i);
                return (
                  <li
                    key={p.id}
                    className={`grid ${rowCols} min-h-[68px] items-center gap-x-2 border-b border-hairline sm:gap-x-4`}
                  >
                    <span className="text-[15px] font-bold text-accent">{pad(i)}</span>
                    <div className="min-w-0">
                      <label htmlFor={`name-${p.id}`} className="sr-only">
                        Name of {name}
                      </label>
                      <input
                        id={`name-${p.id}`}
                        type="text"
                        autoComplete="off"
                        aria-label={`Name of ${name}`}
                        value={p.name}
                        placeholder={`Person ${i + 1}`}
                        onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                        className="h-11 w-full min-w-0 truncate border-b border-transparent bg-transparent text-[19px] font-semibold transition-colors hover:border-hairline focus:border-ink"
                      />
                    </div>
                    {hasInputs && (
                      // Second line on phones; separate columns from `sm` up.
                      <div className="col-start-2 col-end-[-1] row-start-2 flex gap-4 pb-3 sm:contents">
                        {custom && (
                          <RowInput
                            id={`owed-${p.id}`}
                            short="Owes"
                            label={`Amount ${name} owes`}
                            prefix={symbol}
                            placeholder={shareOf(i)}
                            value={p.owed}
                            onChange={(v) => updatePerson(p.id, { owed: v })}
                          />
                        )}
                        {individual && (
                          <RowInput
                            id={`tip-${p.id}`}
                            short="Tip"
                            label={`Tip percent for ${name}`}
                            suffix="%"
                            placeholder="0"
                            value={p.tipPct}
                            onChange={(v) => updatePerson(p.id, { tipPct: v })}
                          />
                        )}
                      </div>
                    )}
                    <span className="text-right text-[17px] font-bold whitespace-nowrap sm:text-[19px]">
                      {money(result.personPays[i])}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePerson(p.id)}
                      disabled={n <= 1}
                      aria-label={`Remove ${name}`}
                      className="grid h-11 w-11 place-items-center transition-colors enabled:hover:bg-ink enabled:hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <CloseIcon size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={addPerson}
              className="mt-6 flex h-[60px] w-full items-center justify-center gap-3 border-2 border-dashed border-ink text-[14px] font-bold tracking-[0.08em] uppercase transition-colors hover:border-solid hover:bg-ink hover:text-paper"
            >
              <PlusIcon size={18} />
              Add participant
            </button>

            {custom && (
              <p
                aria-live="polite"
                className={`mt-5 text-[14px] leading-[1.45] ${
                  overAssigned ? "font-semibold text-accent" : "text-muted"
                }`}
              >
                {assignStatus}
              </p>
            )}
          </Section>
        </main>

        {/* 04 Breakdown */}
        <aside
          aria-labelledby="breakdown-title"
          className="min-w-0 flex-[1_1_380px] lg:sticky lg:top-8 lg:self-start"
        >
          <div className="bg-accent p-[clamp(24px,3vw,40px)] text-white">
            <div className="flex items-baseline gap-4 border-b-2 border-white pb-5">
              <span className="text-[15px] font-bold text-on-accent-muted">04</span>
              <h2 id="breakdown-title" className="text-[32px] leading-none font-bold tracking-[-0.02em]">
                Breakdown
              </h2>
            </div>

            <dl>
              <Row label="Subtotal" value={money(result.subtotal)} />
              <Row
                label={`Tax (${formatPct(parseNum(state.taxRate))}%, ${state.includesTax ? "included" : "added"})`}
                value={money(result.tax)}
              />
              <Row
                label={`Tip (${individual ? "individual" : tipLabel})`}
                value={money(result.tip)}
              />
              <Row
                label={`Service charge (${formatPct(parseNum(state.serviceRate))}%)`}
                value={money(result.service)}
                strong
              />
              <div className="flex items-baseline justify-between gap-4 py-5">
                <dt className="text-[18px] font-bold">Final total</dt>
                <dd className="text-right text-[32px] leading-none font-bold tracking-[-0.02em] [overflow-wrap:anywhere]">
                  {money(result.total)}
                </dd>
              </div>
            </dl>

            <PerPersonCard
              label={uneven ? "Average per person" : "Amount per person"}
              amount={money(result.perPerson)}
              caption={`${peopleLabel} · ${money(result.total)} total`}
            />

            {uneven && (
              <div className="mt-8">
                <h3 className="label text-on-accent-muted">Each person pays</h3>
                <ul className="mt-3">
                  {people.map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-baseline justify-between gap-4 border-b border-white/28 py-3 text-[16px]"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-semibold">{displayName(p, i)}</span>{" "}
                        <span className="text-on-accent-muted">
                          {custom && ` · ${formatPct(Math.round(result.weights[i] * 1000) / 10)}% of bill`}
                          {individual && ` · tip ${formatPct(parseNum(p.tipPct))}%`}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold">{money(result.personPays[i])}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-8 text-[13px] leading-[1.5] text-on-accent-muted">
              Service charge is applied to the subtotal. Amounts are rounded for display only.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({
  num,
  id,
  title,
  aside,
  children,
}: {
  num: string;
  id: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="border-t-2 border-ink pt-5">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex items-baseline gap-4">
          <span className="text-[15px] font-bold text-accent">{num}</span>
          <h2 id={`${id}-title`} className="text-[32px] leading-none font-bold tracking-[-0.02em]">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <span className="label block">{label}</span>
      <div role="group" aria-label={label} className="mt-2 grid grid-cols-2 border-2 border-ink">
        {options.map((o, i) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`h-11 text-[14px] font-bold tracking-[0.06em] uppercase transition-colors ${
              i > 0 ? "border-l-2 border-ink" : ""
            } ${value === o.value ? "bg-accent text-white" : "hover:bg-ink/[.06]"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Small input inside a participant row (amount owed, tip %). */
function RowInput({
  id,
  short,
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
}: {
  id: string;
  short: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0 flex-1 basis-0 sm:basis-auto">
      {/* Mini label on phones; screen-reader only in the table layout. */}
      <label htmlFor={id} className="label mb-0.5 block sm:sr-only">
        <span aria-hidden="true">{short}</span>
        <span className="sr-only">{label}</span>
      </label>
      <div className="flex h-11 items-center gap-1 border-b-2 border-ink outline-offset-2 focus-within:outline-3 focus-within:outline-accent">
        {prefix && (
          <span aria-hidden="true" className="shrink-0 text-[15px] font-semibold text-muted">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full min-w-0 bg-transparent text-[17px] font-semibold focus-visible:outline-none"
        />
        {suffix && (
          <span aria-hidden="true" className="shrink-0 text-[15px] font-semibold text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  placeholder = "0",
  active = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
  active?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      <div
        className={`mt-2 flex h-12 items-center gap-2 border-b-2 transition-colors ${
          active ? "border-accent" : "border-ink"
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full min-w-0 bg-transparent text-[22px] font-semibold"
        />
        {suffix && (
          <span aria-hidden="true" className="text-[22px] font-semibold text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-4 ${
        strong ? "border-b-2 border-white" : "border-b border-white/28"
      }`}
    >
      <dt className="text-[16px] text-on-accent-muted">{label}</dt>
      <dd className="text-right text-[20px] font-semibold whitespace-nowrap">{value}</dd>
    </div>
  );
}

function PerPersonCard({ label, amount, caption }: { label: string; amount: string; caption: string }) {
  // Shrink the figure for long amounts so it never overflows the card.
  const fit = (100 / (amount.length * 0.56)).toFixed(2);
  return (
    <div className="@container mt-8 bg-white p-6 text-ink">
      <span className="label block">{label}</span>
      <p
        className="mt-3 leading-[0.95] font-extrabold tracking-[-0.045em] whitespace-nowrap text-accent"
        style={{ fontSize: `min(clamp(52px, 5.4vw, 84px), ${fit}cqi)` }}
      >
        {amount}
      </p>
      <p className="mt-3 text-[15px] text-muted">{caption}</p>
    </div>
  );
}
