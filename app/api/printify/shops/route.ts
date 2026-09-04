import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = process.env.PRINTIFY_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "PRINTIFY_API_TOKEN is missing" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.printify.com/v1/shops.json",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Printify shops error:", error);

    return NextResponse.json(
      { error: "Could not connect to Printify" },
      { status: 500 }
    );
  }
}