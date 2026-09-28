import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { customerUpsert } from "@/lib/customer-record";

/** The update is a union of two shapes; tests read it as plain data. */
const loose = (result: { update: unknown }) =>
  result.update as Record<string, Record<string, unknown>>;

const placedAt = new Date("2026-09-28T10:00:00Z");

const order = {
  customerName: "  Md Hasib ",
  customerPhone: "+880 1707-873234",
  customerEmail: " Hasib@Example.com ",
  addressLine: "House 1, Road 2",
  area: "Dhanmondi",
  district: "Dhaka",
  postalCode: "",
  placedAt,
  source: "ADMIN" as const,
};

describe("customerUpsert", () => {
  it("keys the customer on the normalised phone", () => {
    assert.deepEqual(customerUpsert(order, "latest").filter, { phone: "01707873234" });
  });

  it("a new order replaces the details on file, trimmed and lower-cased", () => {
    const update = loose(customerUpsert(order, "latest"));
    assert.equal(update.$set.name, "Md Hasib");
    assert.equal(update.$set.email, "hasib@example.com");
    assert.equal(update.$set.district, "Dhaka");
  });

  it("does not erase an email or postcode that a later order left blank", () => {
    const update = loose(customerUpsert(
      { ...order, customerEmail: null, postalCode: "  " },
      "latest",
    ));
    assert.equal("email" in update.$set, false);
    assert.equal("postalCode" in update.$set, false);
  });

  it("only ever widens the first and last order dates", () => {
    const update = loose(customerUpsert(order, "latest"));
    assert.deepEqual(update.$min, { firstOrderAt: placedAt });
    assert.deepEqual(update.$max, { lastOrderAt: placedAt });
  });

  it("a backfill never overwrites details staff may have edited", () => {
    const update = loose(customerUpsert(order, "backfill"));
    assert.equal("$set" in update, false);
    assert.equal(update.$setOnInsert.name, "Md Hasib");
    assert.equal(update.$setOnInsert.source, "ADMIN");
  });

  it("records where the first order came from, defaulting to the checkout", () => {
    const update = loose(customerUpsert({ ...order, source: null }, "latest"));
    assert.deepEqual(update.$setOnInsert, { source: "CHECKOUT" });
  });
});
