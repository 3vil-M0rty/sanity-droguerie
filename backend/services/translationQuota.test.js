import { describe, it, expect, vi, afterEach } from "vitest";

/** A provider out of quota (429) is paused instead of being called on every save; "off" stays silent. */
const { translateText } = require("./translationService");

afterEach(() => { vi.restoreAllMocks(); delete process.env.TRANSLATION_PROVIDER; });

describe("translation quota", () => {
  it("after a 429, the provider is not called again for a while", async () => {
    process.env.TRANSLATION_PROVIDER = "mymemory";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ responseStatus: 429, responseDetails: "YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await translateText({ text: "Peinture", target: "ar", source: "fr" })).toBeNull();
    const calls = fetchSpy.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    expect(await translateText({ text: "Plâtre", target: "en", source: "fr" })).toBeNull();
    expect(fetchSpy.mock.calls.length).toBe(calls);
  });

  it('"off" disables translation without a warning', async () => {
    process.env.TRANSLATION_PROVIDER = "off";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await translateText({ text: "Peinture", target: "ar", source: "fr" })).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
});
