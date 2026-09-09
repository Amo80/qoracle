import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type Policy = {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    paragraphs: ReactNode[];
  }>;
};

const policies: Record<string, Policy> = {
  shipping: {
    title: "Shipping Policy",
    intro:
      "We want you to know what to expect after placing an order with The QRystal Balls.",
    sections: [
      {
        heading: "Made-to-order products",
        paragraphs: [
          "Merchandise is made to order. Production begins after your order is confirmed, so your item must be produced before it can ship.",
          "Production and delivery estimates are not guaranteed. Shipping timing can vary based on the product, destination, carrier conditions, and seasonal demand.",
        ],
      },
      {
        heading: "Shipping and tracking",
        paragraphs: [
          "We currently accept orders shipping to eligible United States addresses. Available shipping options and charges are shown during Stripe checkout.",
          "When tracking information becomes available, it may be provided in an order update. Carrier scans can take time to appear after a shipping label is created.",
        ],
      },
      {
        heading: "Address problems and delays",
        paragraphs: [
          "Please review your shipping address carefully before paying. If you notice an error, contact support as soon as possible. Changes cannot be guaranteed once production or shipment has begun.",
          "If tracking shows a delay, loss, or delivery issue, contact support with your order details so we can review the available next steps.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns & Refund Policy",
    intro:
      "Because our merchandise is made to order, returns and refunds are handled according to the circumstances of each order.",
    sections: [
      {
        heading: "Change-of-mind returns",
        paragraphs: [
          "We generally cannot accept returns or exchanges for buyer’s remorse, an incorrect size or color selected by the customer, or a change of mind. Please review product details and selections before checkout.",
        ],
      },
      {
        heading: "Damaged, defective, or incorrect items",
        paragraphs: [
          "If your item arrives damaged, defective, or different from what you ordered, contact support promptly. Include your order number, a description of the issue, and clear photos of the item and packaging.",
          "We will review the issue and, when appropriate, arrange a replacement or refund. Contacting us does not automatically guarantee a particular outcome.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Approved refunds are sent to the original payment method. Your bank or card provider may need additional time to post the refund after it is issued.",
          "Shipping charges are not refundable unless they are included in an approved resolution for a damaged, defective, incorrect, or undelivered order.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains how The QRystal Balls handles information connected with your visit and purchases.",
    sections: [
      {
        heading: "Information we collect",
        paragraphs: [
          "When you place an order or request support, we may receive information such as your name, email address, shipping address, order details, and messages you send us.",
          "Payment information is collected and processed by Stripe. We do not directly receive or store your full card number.",
        ],
      },
      {
        heading: "How information is used and shared",
        paragraphs: [
          "We use order information to process payments, fulfill and ship purchases, provide support, prevent fraud, and maintain business records.",
          "We share information only as needed with service providers that help operate the store, including Stripe for payments, Printify and its fulfillment partners for made-to-order merchandise, hosting providers, and email services.",
          "We do not sell customer personal information.",
        ],
      },
      {
        heading: "Retention, security, and choices",
        paragraphs: [
          "We retain information for as long as reasonably needed to provide services, keep required business and tax records, resolve disputes, and protect the store.",
          "No online service can guarantee absolute security. You may contact us to ask about your personal information or request a correction or deletion, subject to legal and operational record-keeping requirements.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    intro:
      "These terms apply when you use The QRystal Balls website or place an order.",
    sections: [
      {
        heading: "Store use and orders",
        paragraphs: [
          "You must provide accurate checkout and shipping information and use the site only for lawful purposes.",
          "Product availability, descriptions, and prices may change. We may cancel or decline an order when necessary, including for suspected fraud, pricing errors, unavailable products, or fulfillment limitations. If payment was collected for a canceled order, it will be refunded.",
        ],
      },
      {
        heading: "Made-to-order merchandise",
        paragraphs: [
          "Merchandise is made to order and may have minor differences in color, placement, or appearance from on-screen images. Production and shipping estimates are not guarantees.",
          "Purchases are also subject to the Shipping Policy and Returns & Refund Policy posted on this site.",
        ],
      },
      {
        heading: "Site content and availability",
        paragraphs: [
          "The QRystal Balls name, artwork, designs, and site content may not be copied or commercially reused without permission.",
          "The entertainment and Oracle features are provided for fun and are not professional, medical, legal, financial, or other expert advice.",
          "To the extent permitted by law, the site and services are provided without guarantees of uninterrupted availability, and liability is limited to the amount paid for the order giving rise to a claim.",
        ],
      },
      {
        heading: "Changes and contact",
        paragraphs: [
          "We may update these terms as the store changes. The version posted when you use the site applies to that use.",
          "Questions about these terms can be sent through the contact information on our Contact & Support page.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact & Support",
    intro:
      "We’re here to help with orders, shipping issues, damaged items, and store questions.",
    sections: [
      {
        heading: "Before contacting us",
        paragraphs: [
          "For order help, include your order number, the email used at checkout, and a clear description of the issue. For damaged, defective, or incorrect items, include photos of the item and packaging.",
          "Never send full card numbers or other sensitive payment information. Stripe handles payment details securely.",
        ],
      },
      {
        heading: "Support contact",
        paragraphs: [
          <>
            Customer support email:{" "}
            <a href="mailto:support@theqrystalballs.com">
              support@theqrystalballs.com
            </a>
          </>,
          "Please allow reasonable time for a response. Sending repeated messages may slow down our ability to review your request.",
        ],
      },
      {
        heading: "Business contact details",
        paragraphs: [
          "Business mailing address: Available upon request through support@theqrystalballs.com",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug];

  if (!policy) {
    notFound();
  }

  return (
    <main className="policy-page">
      <article className="policy-card">
        <p className="policy-eyebrow">✦ THE QRYSTAL BALLS ✦</p>
        <h1>{policy.title}</h1>
        <p className="policy-intro">{policy.intro}</p>

        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>
        ))}

        <Link className="policy-back-link" href="/shop">
          ← Back to shop
        </Link>
      </article>
    </main>
  );
}