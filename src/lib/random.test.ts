import { describe, expect, it } from "vitest";
import { pickRandom } from "./random";

describe("pickRandom", () => {
  it("returns the only element of a single-item array", () => {
    expect(pickRandom(["only"])).toBe("only");
  });

  it("always returns an element that is part of the input array", () => {
    const items = ["a", "b", "c", "d"];
    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(pickRandom(items));
    }
  });
});
