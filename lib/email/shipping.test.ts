import { describe, expect, it } from "vitest";
import {
  buildShippingEmailHtml,
  escapeHtml,
  getTrackingUrl,
} from "./shipping";

describe("shipping email safety", () => {
  it("escapes customer-controlled HTML", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
  });

  it("encodes tracking numbers in carrier links", () => {
    expect(getTrackingUrl("UPS", "1Z TEST&VALUE")).toContain(
      "1Z%20TEST%26VALUE"
    );
  });

  it("never renders customer markup into the shipping email", () => {
    const html = buildShippingEmailHtml({
      orderId: 42,
      customerName: "<script>alert(1)</script>",
      productName: "<b>Fake product</b>",
      carrier: "UPS",
      trackingNumber: "1Z TEST",
    });

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<b>Fake product</b>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
