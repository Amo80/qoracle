import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  buildOrderRecord,
  hasShippingQuoteMismatch,
  normalizeUsZip,
} from "./order";

function createSession(overrides: Partial<Stripe.Checkout.Session> = {}) {
  return {
    id: "cs_test_phase0",
    payment_status: "paid",
    amount_total: 2499,
    currency: "usd",
    payment_intent: "pi_test_phase0",
    metadata: {
      order_type: "merch",
      theme: "jester",
      quantity: "2",
      printify_product_id: "product-1",
      printify_variant_id: "variant-1",
      printify_variant_title: "Black / XL",
      quoted_shipping_zip: "97045-1234",
      quoted_shipping_state: "OR",
      quoted_shipping_country: "US",
    },
    customer_details: {
      address: null,
      email: "customer@example.com",
      name: "Test Customer",
      phone: null,
      tax_exempt: "none",
      tax_ids: [],
    },
    collected_information: {
      shipping_details: {
        name: "Test Customer",
        address: {
          city: "Oregon City",
          country: "US",
          line1: "123 Test Street",
          line2: null,
          postal_code: "97045",
          state: "OR",
        },
      },
    },
    ...overrides,
  } as Stripe.Checkout.Session;
}

describe("shipping quote safety", () => {
  it("normalizes ZIP+4 values for comparison", () => {
    expect(normalizeUsZip("97045-1234")).toBe("97045");
  });

  it("accepts a matching final Stripe address", () => {
    expect(hasShippingQuoteMismatch(createSession())).toBe(false);
  });

  it("flags a changed final Stripe address", () => {
    const session = createSession();
    session.collected_information!.shipping_details!.address!.postal_code =
      "97201";
    expect(hasShippingQuoteMismatch(session)).toBe(true);
  });

  it("does not apply the merch guard to artifact orders", () => {
    const session = createSession({ metadata: { order_type: "artifact" } });
    expect(hasShippingQuoteMismatch(session)).toBe(false);
  });
});

describe("Stripe order mapping", () => {
  it("maps the stable commerce fields once", () => {
    const record = buildOrderRecord(createSession(), "Jester Shirt");
    expect(record).toMatchObject({
      stripe_session_id: "cs_test_phase0",
      product_name: "Jester Shirt",
      theme: "jester",
      quantity: 2,
      payment_status: "paid",
      shipping_quote_mismatch: false,
    });
  });

  it("constrains invalid quantities to one", () => {
    const session = createSession();
    session.metadata!.quantity = "99";
    expect(buildOrderRecord(session, "Jester Shirt").quantity).toBe(1);
  });
});
