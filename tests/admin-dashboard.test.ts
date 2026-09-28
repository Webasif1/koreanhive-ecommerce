import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ORDER_ACTION_TONE,
  ORDER_STATUS_STYLE,
  PAYMENT_STATUS_STYLE,
  quickActionsFor,
} from "@/lib/admin-order-style";
import { generateOrderNumber } from "@/lib/order-number";
import { ORDER_FLOW, type OrderStatusValue } from "@/lib/order-status";
import {
  SALES_RANGES,
  parseSalesRange,
  percentChange,
  rangeWindow,
} from "@/lib/sales-range";

const ALL: OrderStatusValue[] = [...ORDER_FLOW, "CANCELLED", "RETURNED"];

describe("generateOrderNumber", () => {
  it("keeps the KH-YYMMDD-XXXXX shape the emails and /track expect", () => {
    const number = generateOrderNumber(new Date(Date.UTC(2026, 8, 28, 6)));
    assert.match(number, /^KH-260928-[A-HJ-NP-Z2-9]{5}$/);
  });

  it("never uses the look-alike characters I, O, 0 or 1 in the random part", () => {
    for (let i = 0; i < 200; i++) {
      assert.doesNotMatch(generateOrderNumber().slice(10), /[IO01]/);
    }
  });
});

describe("order status colours", () => {
  it("gives every status its own badge colour", () => {
    const badges = ALL.map((status) => ORDER_STATUS_STYLE[status].badge);
    assert.equal(badges.every(Boolean), true);
    assert.equal(new Set(badges).size, ALL.length);
  });

  it("styles every payment status", () => {
    for (const status of ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const) {
      assert.ok(PAYMENT_STATUS_STYLE[status].badge);
    }
  });
});

describe("quickActionsFor", () => {
  it("offers the next step first, one step at a time along the flow", () => {
    for (let i = 0; i < ORDER_FLOW.length - 1; i++) {
      assert.equal(quickActionsFor(ORDER_FLOW[i])[0].to, ORDER_FLOW[i + 1]);
    }
  });

  it("offers nothing on a terminal detour", () => {
    assert.deepEqual(quickActionsFor("CANCELLED"), []);
    assert.deepEqual(quickActionsFor("RETURNED"), []);
  });

  it("never offers moving an order to the status it already has", () => {
    for (const status of ALL) {
      for (const action of quickActionsFor(status)) {
        assert.notEqual(action.to, status);
        assert.ok(ORDER_ACTION_TONE[action.tone]);
      }
    }
  });
});

describe("sales range", () => {
  it("falls back to 30 days for anything unknown", () => {
    assert.equal(parseSalesRange(undefined), "30d");
    assert.equal(parseSalesRange("1y"), "30d");
    assert.equal(parseSalesRange("7d"), "7d");
  });

  it("builds one bucket per day, ending today in Dhaka", () => {
    // 20:00 UTC on 27 Sep is 02:00 on 28 Sep in Dhaka
    const now = new Date(Date.UTC(2026, 8, 27, 20));
    const window = rangeWindow("7d", now);

    assert.equal(window.buckets.length, 7);
    assert.equal(window.buckets.at(-1)?.key, "2026-09-28");
    assert.equal(window.buckets[0].key, "2026-09-22");
    // midnight Dhaka on the 22nd
    assert.equal(window.since.toISOString(), "2026-09-21T18:00:00.000Z");
    assert.equal(window.previousSince.toISOString(), "2026-09-14T18:00:00.000Z");
  });

  it("builds twelve distinct months for the year view", () => {
    const window = rangeWindow("12m", new Date(Date.UTC(2026, 2, 31, 10)));
    const keys = window.buckets.map((b) => b.key);

    assert.equal(keys.length, 12);
    assert.equal(new Set(keys).size, 12);
    assert.equal(keys[0], "2025-04");
    assert.equal(keys.at(-1), "2026-03");
  });

  it("has a window for every range", () => {
    for (const range of SALES_RANGES) {
      const window = rangeWindow(range);
      assert.ok(window.previousSince < window.since);
    }
  });

  it("reports percentage change, and null when there is no baseline", () => {
    assert.equal(percentChange(150, 100), 50);
    assert.equal(percentChange(50, 100), -50);
    assert.equal(percentChange(0, 0), 0);
    assert.equal(percentChange(10, 0), null);
  });
});
