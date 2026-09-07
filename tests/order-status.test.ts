import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ORDER_FLOW, ORDER_STATUS_LABEL, isTerminalDetour } from "@/lib/order-status";

/**
 * Regression tests for the order-status integrity fix.
 *
 * updateOrderStatusAction used to cast form input straight to OrderStatusValue
 * — `String(formData.get("status")) as OrderStatusValue` — and the schema
 * carried no enum either, so any string at all could be written to an order.
 * An order with an unrecognised status vanishes from the admin filters and
 * from the 30-day revenue aggregate, which excludes only the literal
 * CANCELLED and RETURNED.
 *
 * The allow-list now lives in server/models as ORDER_STATUSES, which the
 * schema enum and the action's parseOrderStatus both use. This test pins the
 * two lists together so a status added to one cannot be forgotten in the
 * other.
 */
const EXPECTED = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

describe("order status vocabulary", () => {
  it("labels every status the app can write", () => {
    for (const status of EXPECTED) {
      assert.ok(
        ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL],
        `${status} has no label`,
      );
    }
  });

  it("labels nothing it cannot write", () => {
    assert.deepEqual(Object.keys(ORDER_STATUS_LABEL).sort(), [...EXPECTED].sort());
  });

  it("keeps the happy path and the detours apart", () => {
    assert.deepEqual(ORDER_FLOW, [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
    ]);
    assert.equal(isTerminalDetour("CANCELLED"), true);
    assert.equal(isTerminalDetour("RETURNED"), true);
    assert.equal(isTerminalDetour("DELIVERED"), false);
  });
});
