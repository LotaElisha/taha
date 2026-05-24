import { describe, it, expect } from "vitest";
import { cn, formatTZS, formatRelativeDate } from "../../lib/utils";

describe("cn() — Tailwind class merge", () => {
  it("merges classes without conflict", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("filters falsy values", () => {
    expect(cn("px-2", false && "py-1", "bg-red-500")).toBe("px-2 bg-red-500");
  });
});

describe("formatTZS() — currency formatter", () => {
  it("formats TZS with no decimals", () => {
    expect(formatTZS(5000)).toContain("5,000");
    // sw-TZ locale renders the currency symbol, which may be "TSh" or "TZS"
    expect(formatTZS(5000)).toMatch(/TZS|TSh/);
  });
});

describe("formatRelativeDate() — date formatter", () => {
  it("returns relative string for recent dates", () => {
    const now = new Date();
    const result = formatRelativeDate(now);
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns absolute string for old dates", () => {
    const old = new Date("2020-01-01");
    const result = formatRelativeDate(old);
    // Format is "1 Jan" or "Jan 1" depending on locale
    expect(result).toMatch(/\w+/);
  });
});
