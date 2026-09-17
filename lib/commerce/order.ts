import type Stripe from "stripe";

export function normalizeUsZip(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

export function hasShippingQuoteMismatch(session: Stripe.Checkout.Session) {
  if (session.metadata?.order_type !== "merch") return false;

  const shippingDetails = session.collected_information?.shipping_details;
  const quotedZip = session.metadata?.quoted_shipping_zip?.trim().toUpperCase() || "";
  const quotedState = session.metadata?.quoted_shipping_state?.trim().toUpperCase() || "";
  const quotedCountry = session.metadata?.quoted_shipping_country?.trim().toUpperCase() || "";
  const finalZip = shippingDetails?.address?.postal_code?.trim().toUpperCase() || "";
  const finalState = shippingDetails?.address?.state?.trim().toUpperCase() || "";
  const finalCountry = shippingDetails?.address?.country?.trim().toUpperCase() || "";

  return (
    !quotedZip ||
    !quotedState ||
    !quotedCountry ||
    normalizeUsZip(quotedZip) !== normalizeUsZip(finalZip) ||
    quotedState !== finalState ||
    quotedCountry !== finalCountry
  );
}

export function buildOrderRecord(
  session: Stripe.Checkout.Session,
  productName: string
) {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;
  const metadataQuantity = Number(session.metadata?.quantity);
  const quantity =
    Number.isInteger(metadataQuantity) &&
    metadataQuantity >= 1 &&
    metadataQuantity <= 10
      ? metadataQuantity
      : 1;
  const shippingAddress = session.collected_information?.shipping_details?.address;

  return {
    stripe_session_id: session.id,
    product_name: productName,
    theme: session.metadata?.theme || "jester",
    customer_name: session.customer_details?.name || null,
    stripe_payment_id: paymentIntentId,
    amount_total: session.amount_total,
    currency: session.currency,
    printify_product_id: session.metadata?.printify_product_id || null,
    printify_variant_id: session.metadata?.printify_variant_id || null,
    printify_variant_title: session.metadata?.printify_variant_title || null,
    quantity,
    customer_email: session.customer_details?.email || null,
    shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : null,
    payment_status: session.payment_status,
    shipping_quote_mismatch: hasShippingQuoteMismatch(session),
  };
}
