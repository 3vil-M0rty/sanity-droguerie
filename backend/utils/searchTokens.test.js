import { describe, it, expect } from "vitest";

const { productTokens, searchFilter, normalize } = require("./searchTokens");

describe("article search tokens", () => {
  const tokens = productTokens({
    name: "Mitigeur lavabo Éco chromé",
    internalReference: "GRO-ES-DCH",
    barcode: "6111000004570",
    packagings: [{ barcode: "6111000004587" }],
    prices: [{ supplierReference: "BX 220/4" }],
    attributes: [{ name: "Couleur", value: "Noir mat" }],
  });

  it("keeps the words of the name without accents or case", () => {
    expect(tokens).toEqual(expect.arrayContaining(["mitigeur", "lavabo", "eco", "chrome"]));
    expect(normalize("ÉCO Chromé")).toBe("eco chrome");
  });

  it("keeps codes whole, compacted and by segment", () => {
    expect(tokens).toEqual(expect.arrayContaining(["gro-es-dch", "groesdch", "gro", "es", "dch", "bx220/4", "bx2204", "noir", "mat"]));
  });

  it("keeps the last digits of barcodes", () => {
    expect(tokens).toEqual(expect.arrayContaining(["6111000004570", "4570", "04570", "6111000004587", "4587"]));
  });

  it("turns what is typed into anchored prefixes (index-friendly)", () => {
    expect(searchFilter("")).toBeNull();
    expect(searchFilter("  ")).toBeNull();
    expect(searchFilter("Chromé")).toEqual({ searchTokens: { $regex: "^chrome" } });
    expect(searchFilter("mitigeur chrom")).toEqual({ $and: [{ searchTokens: { $regex: "^mitigeur" } }, { searchTokens: { $regex: "^chrom" } }] });
    // a code typed with its dashes → compacted
    expect(searchFilter("GRO-ES")).toEqual({ searchTokens: { $regex: "^groes" } });
  });

  it("can't be turned into a slow or broken regex", () => {
    expect(searchFilter("a.*(b")).toEqual({ searchTokens: { $regex: "^ab" } });
    expect(searchFilter("((((")).toBeNull();
  });
});
