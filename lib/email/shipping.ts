export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getTrackingUrl(carrier: string, trackingNumber: string) {
  const encoded = encodeURIComponent(trackingNumber);
  const links: Record<string, string> = {
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`,
    UPS: `https://www.ups.com/track?tracknum=${encoded}`,
    FedEx: `https://www.fedex.com/fedextrack/?trknbr=${encoded}`,
    DHL: `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encoded}`,
  };

  return links[carrier] || null;
}

export function buildShippingEmailHtml(input: {
  orderId: string | number;
  customerName: string | null;
  productName: string | null;
  carrier: string | null;
  trackingNumber: string;
}) {
  const carrier = input.carrier || "Carrier";
  const customerName = input.customerName || "Customer";
  const productName = input.productName || "QRystal Balls Product";
  const trackingUrl = getTrackingUrl(carrier, input.trackingNumber);
  const trackingButton = trackingUrl
    ? `<p style="margin-top:25px;"><a href="${trackingUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Track Your Package</a></p>`
    : "";

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111;">
      <h1>The QRystal Balls</h1>
      <h2>Your order has shipped! 📦</h2>
      <p>Hello ${escapeHtml(customerName)},</p>
      <p>Your QRystal Balls order <strong>#${escapeHtml(String(input.orderId))}</strong> is on its way.</p>
      <div style="margin:25px 0;padding:20px;background:#f5f5f5;border-radius:10px;">
        <p><strong>Carrier:</strong> ${escapeHtml(carrier)}</p>
        <p><strong>Tracking Number:</strong> ${escapeHtml(input.trackingNumber)}</p>
        <p><strong>Product:</strong> ${escapeHtml(productName)}</p>
      </div>
      ${trackingButton}
      <p>Thank you for your order!</p>
      <p>— The QRystal Balls Team</p>
    </div>
  `;
}
