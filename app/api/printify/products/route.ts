import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.PRINTIFY_API_TOKEN;
    const shopId = process.env.PRINTIFY_SHOP_ID;

    if (!token) {
      return NextResponse.json(
        { error: "PRINTIFY_API_TOKEN is missing" },
        { status: 500 }
      );
    }

    if (!shopId) {
      return NextResponse.json(
        { error: "PRINTIFY_SHOP_ID is missing" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Printify request failed",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Printify products error:", error);

    return NextResponse.json(
      { error: "Unable to load Printify products" },
      { status: 500 }
    );
  }
}