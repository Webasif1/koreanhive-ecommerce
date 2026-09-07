import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveClientIp, UNKNOWN_CALLER, trustedProxyHops } from "@/lib/client-ip";

/**
 * Regression tests for the rate-limit bypass.
 *
 * The audit proved it live: twenty chat requests exhausted the limit, then
 * four requests carrying a made-up X-Forwarded-For all returned 200 while the
 * real caller stayed blocked. The same helper keys the admin login limiter
 * (5 attempts / 15 min) and the order-tracking limiter (8 / min), so the same
 * one-header trick defeated brute-force and order-enumeration protection too.
 */
describe("resolveClientIp", () => {
  it("reads the address the trusted proxy appended, not the one the client sent", () => {
    // client claims 10.0.0.1; our proxy appends what it actually saw
    const header = "10.0.0.1, 203.0.113.9";
    assert.equal(resolveClientIp(header, null, 1), "203.0.113.9");
  });

  it("gives a spoofing client the same bucket however it rewrites the header", () => {
    const real = "203.0.113.9";
    const first = resolveClientIp(`1.1.1.1, ${real}`, null, 1);
    const second = resolveClientIp(`2.2.2.2, ${real}`, null, 1);
    const third = resolveClientIp(`9.9.9.9, 8.8.8.8, ${real}`, null, 1);

    assert.equal(first, real);
    assert.equal(second, real);
    assert.equal(third, real);
  });

  it("counts hops from the right for a CDN in front of a load balancer", () => {
    const header = "10.0.0.1, 198.51.100.7, 172.16.0.2";
    assert.equal(resolveClientIp(header, null, 2), "198.51.100.7");
  });

  it("trusts nothing when the chain is shorter than the configured depth", () => {
    // a direct caller inventing a single entry must not look like a real hop
    assert.equal(resolveClientIp("1.2.3.4", null, 2), UNKNOWN_CALLER);
  });

  it("falls back to x-real-ip only when there is no forwarded chain", () => {
    assert.equal(resolveClientIp(null, "203.0.113.9", 1), "203.0.113.9");
    assert.equal(resolveClientIp("1.1.1.1, 203.0.113.9", "9.9.9.9", 1), "203.0.113.9");
  });

  it("trusts nothing at all when no proxy is configured", () => {
    assert.equal(resolveClientIp("1.1.1.1", "2.2.2.2", 0), UNKNOWN_CALLER);
  });

  it("throttles as a group rather than escaping the limit when nothing is known", () => {
    assert.equal(resolveClientIp(null, null, 1), UNKNOWN_CALLER);
    assert.equal(resolveClientIp("", "   ", 1), UNKNOWN_CALLER);
  });

  it("ignores whitespace and empty entries in the chain", () => {
    assert.equal(resolveClientIp(" 1.1.1.1 ,  , 203.0.113.9 ", null, 1), "203.0.113.9");
  });
});

describe("trustedProxyHops", () => {
  /**
   * This defaulted to 1, and that was still the bypass.
   *
   * With no proxy actually in front, the "last hop" of a one-entry
   * X-Forwarded-For is the value the client wrote — so an unconfigured
   * deployment kept believing spoofed addresses. Verified live against the
   * running app: rotating the header still minted fresh budgets. Trusting a
   * header because it is present is the original bug wearing a hat.
   */
  it("trusts nothing until an operator says a proxy exists", () => {
    assert.equal(trustedProxyHops(undefined), 0);
    assert.equal(resolveClientIp("1.2.3.4", null, trustedProxyHops(undefined)), UNKNOWN_CALLER);
  });

  it("accepts an explicit depth", () => {
    assert.equal(trustedProxyHops("1"), 1);
    assert.equal(trustedProxyHops("2"), 2);
    assert.equal(trustedProxyHops("0"), 0);
  });

  it("falls back to trusting nothing rather than trusting nonsense", () => {
    assert.equal(trustedProxyHops("banana"), 0);
    assert.equal(trustedProxyHops("-3"), 0);
    assert.equal(trustedProxyHops("1.5"), 0);
  });
});
