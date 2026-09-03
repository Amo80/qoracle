import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const priceMap: Record<string, number> = {
  "QRystal Balls Sticker": 499,
  "QRystal Balls Card": 799,
  "QRystal Balls Keychain": 1299,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const product = body.product as string;
    const theme = body.theme as string;

    const amount = priceMap[product];

    if (!amount) {
      return NextResponse.json(
        { error: "Invalid product" },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
shipping_address_collection: {
  allowed_countries: ["US"],
},
customer_creation: "always",

metadata: {
  product_name: product,
  theme: theme,
},
customer_email: undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",

            product_data: {
              name: product,
              description: `QRystal Balls theme: ${theme}`,
            },

            unit_amount: amount,
          },

          quantity: 1,
        },
      ],

      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?product=${encodeURIComponent(
        product
      )}&theme=${encodeURIComponent(theme)}&price=$${(
        amount / 100
      ).toFixed(2)}`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}