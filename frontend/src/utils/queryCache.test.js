import { describe, it, expect, vi } from "vitest";
import { cached, peek, prefetch, invalidate, keyOf } from "./queryCache";

describe("queryCache", () => {
  it("builds stable keys, ignoring empty values", () => {
    expect(keyOf("articles", { page: 2, companyId: "c1", search: "", brand: undefined })).toBe("articles?companyId=c1&page=2");
  });

  it("shares one call between identical requests and serves the cached page", async () => {
    const fetcher = vi.fn(async () => ({ rows: [1] }));
    const [a, b] = await Promise.all([cached("k1", fetcher), cached("k1", fetcher)]);
    expect(a).toBe(b);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await cached("k1", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(peek("k1")).toEqual({ rows: [1] });
  });

  it("expires after the ttl and can be invalidated by prefix", async () => {
    const fetcher = vi.fn(async () => 1);
    await cached("articles?x=1", fetcher);
    expect(peek("articles?x=1", 0)).toBeUndefined();
    invalidate("articles");
    expect(peek("articles?x=1")).toBeUndefined();
    await cached("articles?x=1", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("prefetches in the background, never twice, and forgets failures", async () => {
    const fetcher = vi.fn(async () => "page2");
    prefetch("p2", fetcher);
    prefetch("p2", fetcher);
    await new Promise((r) => setTimeout(r, 0));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(peek("p2")).toBe("page2");
    prefetch("bad", async () => { throw new Error("x"); });
    await new Promise((r) => setTimeout(r, 0));
    expect(peek("bad")).toBeUndefined();
  });

  it("keeps a bounded number of pages", async () => {
    for (let i = 0; i < 80; i += 1) await cached(`many${i}`, async () => i);
    expect(peek("many0")).toBeUndefined();
    expect(peek("many79")).toBe(79);
  });
});
