import { describe, expect, it } from "vitest";
import { euroToCents, formatEuro } from "./money";

describe("euroToCents", () => {
  it("parses a comma-decimal euro amount", () => {
    expect(euroToCents("2,50")).toBe(250);
  });

  it("parses a dot-decimal euro amount", () => {
    expect(euroToCents("9.90")).toBe(990);
  });

  it("trims whitespace", () => {
    expect(euroToCents("  5,00  ")).toBe(500);
  });

  it("rejects zero", () => {
    expect(euroToCents("0")).toBeNull();
  });

  it("rejects negative amounts", () => {
    expect(euroToCents("-5")).toBeNull();
  });

  it("rejects unparseable input", () => {
    expect(euroToCents("abc")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(euroToCents("")).toBeNull();
  });

  it("rounds to the nearest cent", () => {
    expect(euroToCents("1,999")).toBe(200);
  });
});

describe("formatEuro", () => {
  it("formats whole euros with two decimals", () => {
    expect(formatEuro(500)).toBe("5,00 €");
  });

  it("formats cents correctly", () => {
    expect(formatEuro(250)).toBe("2,50 €");
  });

  it("formats zero", () => {
    expect(formatEuro(0)).toBe("0,00 €");
  });
});
