import { describe, expect, it } from "vitest";
import { isTenantManager } from "./membership";

describe("isTenantManager", () => {
  it("treats owner as a manager", () => {
    expect(isTenantManager("owner")).toBe(true);
  });

  it("treats admin as a manager", () => {
    expect(isTenantManager("admin")).toBe(true);
  });

  it("does not treat captain as a tenant-level manager", () => {
    expect(isTenantManager("captain")).toBe(false);
  });

  it("does not treat a plain member as a manager", () => {
    expect(isTenantManager("member")).toBe(false);
  });
});
