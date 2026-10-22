import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and dashes spaces", () => {
    expect(slugify("SV Rosental")).toBe("sv-rosental");
  });

  it("transliterates German umlauts", () => {
    expect(slugify("SV Grünweiß")).toBe("sv-gruenweiss");
  });

  it("strips leading/trailing dashes from punctuation", () => {
    expect(slugify("  !Dart Club!  ")).toBe("dart-club");
  });

  it("collapses repeated separators", () => {
    expect(slugify("1. Herren -- Dart")).toBe("1-herren-dart");
  });

  it("truncates to 48 characters", () => {
    const long = "a".repeat(80);
    expect(slugify(long)).toHaveLength(48);
  });

  it("returns an empty string for input with no usable characters", () => {
    expect(slugify("???")).toBe("");
  });
});
