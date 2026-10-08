import { afterEach, expect, it, vi } from "vitest";
import { LOCAL_CONNECTION_ERROR, localFetch } from "./localFetch";

afterEach(() => vi.unstubAllGlobals());

it("explains a network failure and never retries a key save", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  await expect(localFetch("/api/literature/openalex/key", {method: "PUT"})).rejects.toThrow(LOCAL_CONNECTION_ERROR);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("keeps HTTP authentication errors distinct from network and cancellation errors", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", {status: 401})));
  expect((await localFetch("/api/literature/openalex/search")).status).toBe(401);
  const abort = new DOMException("Aborted", "AbortError");
  vi.mocked(fetch).mockRejectedValue(abort);
  await expect(localFetch("/api/literature/openalex/search")).rejects.toBe(abort);
});
