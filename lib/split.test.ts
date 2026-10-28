import { describe, expect, it } from "vitest";
import { calculateSplit, currencySymbol, formatMoney, parseNum, type SplitInput } from "./split";

const base: SplitInput = {
  amount: "100",
  taxRate: "10",
  serviceRate: "0",
  includesTax: false,
  preset: 20,
  customTip: "",
  mode: "equal",
  people: [{ tipPct: "20" }, { tipPct: "20" }],
};

const calc = (over: Partial<SplitInput>) => calculateSplit({ ...base, ...over });

describe("parseNum", () => {
  it("accepts comma decimals and thousands separators", () => {
    expect(parseNum("12,5")).toBe(12.5);
    expect(parseNum("1,234.50")).toBe(1234.5);
    expect(parseNum(" 7.25 ")).toBe(7.25);
  });

  it("treats empty, NaN and negative input as 0", () => {
    expect(parseNum("")).toBe(0);
    expect(parseNum("abc")).toBe(0);
    expect(parseNum("-5")).toBe(0);
    expect(parseNum(NaN)).toBe(0);
    expect(parseNum(undefined)).toBe(0);
  });
});

describe("tax", () => {
  it("adds tax on top when not included", () => {
    const r = calc({ includesTax: false });
    expect(r.subtotal).toBeCloseTo(100);
    expect(r.tax).toBeCloseTo(10);
    expect(r.pre).toBeCloseTo(110);
  });

  it("extracts tax when the amount already includes it", () => {
    const r = calc({ amount: "110", includesTax: true });
    expect(r.subtotal).toBeCloseTo(100);
    expect(r.tax).toBeCloseTo(10);
    expect(r.pre).toBeCloseTo(110);
    // Tip is calculated on the pre-tax subtotal.
    expect(r.tip).toBeCloseTo(20);
  });
});

describe("service charge", () => {
  it("is applied to the subtotal, not the taxed amount", () => {
    const r = calc({ serviceRate: "5" });
    expect(r.service).toBeCloseTo(5);
    expect(r.pre).toBeCloseTo(115);
    expect(r.total).toBeCloseTo(135);
  });

  it("uses the extracted subtotal when tax is included", () => {
    const r = calc({ amount: "110", includesTax: true, serviceRate: "5" });
    expect(r.service).toBeCloseTo(5);
  });
});

describe("tip", () => {
  it("splits the tip equally", () => {
    const r = calc({});
    expect(r.tip).toBeCloseTo(20);
    expect(r.total).toBeCloseTo(130);
    expect(r.perPerson).toBeCloseTo(65);
    expect(r.personPays).toEqual([expect.closeTo(65), expect.closeTo(65)]);
  });

  it("prefers a custom tip over the preset", () => {
    const r = calc({ customTip: "10" });
    expect(r.tipPct).toBe(10);
    expect(r.tip).toBeCloseTo(10);
  });

  it("falls back to the preset when the custom tip is blank", () => {
    expect(calc({ customTip: "  " }).tipPct).toBe(20);
  });

  it("gives each person their own tip in individual mode", () => {
    const r = calc({ mode: "individual", people: [{ tipPct: "10" }, { tipPct: "30" }] });
    // Each person's share of the subtotal is 50.
    expect(r.personTips[0]).toBeCloseTo(5);
    expect(r.personTips[1]).toBeCloseTo(15);
    expect(r.tip).toBeCloseTo(20);
    expect(r.personPays[0]).toBeCloseTo(55 + 5);
    expect(r.personPays[1]).toBeCloseTo(55 + 15);
    expect(r.total).toBeCloseTo(130);
  });

  it("ignores the preset and custom tip in individual mode", () => {
    const r = calc({ mode: "individual", customTip: "50", people: [{ tipPct: "" }, { tipPct: "0" }] });
    expect(r.tip).toBe(0);
  });
});

describe("n = 1", () => {
  it("puts the whole bill on one person", () => {
    const r = calc({ people: [{ tipPct: "20" }] });
    expect(r.n).toBe(1);
    expect(r.perPerson).toBeCloseTo(r.total);
    expect(r.personPays[0]).toBeCloseTo(130);
  });

  it("never divides by zero", () => {
    const r = calc({ people: [] });
    expect(r.n).toBe(1);
    expect(r.perPerson).toBeCloseTo(130);
  });
});

describe("empty inputs", () => {
  it("returns zeros everywhere", () => {
    const r = calc({ amount: "", taxRate: "", serviceRate: "", customTip: "" });
    expect(r.subtotal).toBe(0);
    expect(r.tax).toBe(0);
    expect(r.service).toBe(0);
    expect(r.tip).toBe(0);
    expect(r.total).toBe(0);
    expect(r.perPerson).toBe(0);
    expect(r.personPays.every((p) => p === 0)).toBe(true);
  });

  it("treats an empty tax rate as 0 when tax is included", () => {
    const r = calc({ amount: "100", taxRate: "", includesTax: true });
    expect(r.subtotal).toBeCloseTo(100);
    expect(r.tax).toBeCloseTo(0);
  });
});

describe("formatting", () => {
  it("formats money per currency", () => {
    expect(formatMoney(128.5, "USD")).toBe("$128.50");
    expect(formatMoney(1234.4, "JPY")).toBe("¥1,234");
  });

  it("derives the input prefix symbol", () => {
    expect(currencySymbol("USD")).toBe("$");
    expect(currencySymbol("EUR")).toBe("€");
  });
});

describe("custom bill split", () => {
  // Bill 100 + 10% tax + 20% tip on the subtotal = 130 total.
  const custom = (owed: string[], over: Partial<SplitInput> = {}) =>
    calc({ billMode: "custom", people: owed.map((o) => ({ tipPct: "20", owed: o })), ...over });

  it("charges each person in proportion to what they owe", () => {
    const r = custom(["70", "30"]);
    expect(r.weights).toEqual([expect.closeTo(0.7), expect.closeTo(0.3)]);
    // 70 + 7 tax + 14 tip; 30 + 3 tax + 6 tip.
    expect(r.personPays[0]).toBeCloseTo(91);
    expect(r.personPays[1]).toBeCloseTo(39);
    expect(r.unassigned).toBeCloseTo(0);
  });

  it("splits any unassigned amount equally", () => {
    const r = custom(["60", ""]);
    // 20 left over → 80 / 20.
    expect(r.assigned).toBeCloseTo(60);
    expect(r.unassigned).toBeCloseTo(40);
    expect(r.weights).toEqual([expect.closeTo(0.8), expect.closeTo(0.2)]);
    expect(r.personPays[0] + r.personPays[1]).toBeCloseTo(r.total);
  });

  it("matches the equal split when nobody has entered an amount", () => {
    const r = custom(["", ""]);
    expect(r.personPays).toEqual(calc({}).personPays);
  });

  it("scales shares down when more than the bill is assigned", () => {
    const r = custom(["150", "50"]);
    expect(r.unassigned).toBeCloseTo(-100);
    expect(r.weights).toEqual([expect.closeTo(0.75), expect.closeTo(0.25)]);
    expect(r.personPays[0] + r.personPays[1]).toBeCloseTo(130);
  });

  it("applies individual tips to each person's own share", () => {
    const r = custom(["80", "20"], {
      mode: "individual",
      people: [
        { owed: "80", tipPct: "10" },
        { owed: "20", tipPct: "50" },
      ],
    });
    expect(r.personTips[0]).toBeCloseTo(8);
    expect(r.personTips[1]).toBeCloseTo(10);
    expect(r.tip).toBeCloseTo(18);
  });

  it("works when tax is included in the amounts entered", () => {
    const r = custom(["88", "22"], { amount: "110", includesTax: true });
    expect(r.weights).toEqual([expect.closeTo(0.8), expect.closeTo(0.2)]);
    expect(r.personPays[0]).toBeCloseTo(88 + 16);
  });

  it("handles an empty bill without dividing by zero", () => {
    const r = custom(["", ""], { amount: "" });
    expect(r.personPays).toEqual([0, 0]);
    expect(r.weights).toEqual([0.5, 0.5]);
  });
});
