"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutInProgress = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const product =
    searchParams.get("product") || "QRystal Balls Product";

  const theme =
    searchParams.get("theme") || "jester";

  const price =
    searchParams.get("price") || "$0.00";

  const printifyProductId =
    searchParams.get("printifyProductId");

  const variantId =
    searchParams.get("variantId");

  const variant =
    searchParams.get("variant");
const quantity = Math.max(
  1,
  Number(searchParams.get("quantity") || "1")
);

  const isMerch =
    Boolean(printifyProductId && variantId);

  async function handlePayment() {
    if (checkoutInProgress.current) return;

    checkoutInProgress.current = true;
    setIsLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product,

          // QR artifact order
          theme,

          // Merch order
          printifyProductId,
          variantId,
          variant,
quantity,

          // We'll validate pricing server-side before
          // allowing real merch payments.
          price,
          orderType: isMerch ? "merch" : "artifact",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to create checkout session.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutError(
        "Unable to start checkout. Please try again."
      );
      checkoutInProgress.current = false;
      setIsLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07070d",
        color: "white",
        padding: "40px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() =>
            router.push(isMerch ? "/merch" : "/shop")
          }
          style={{
            marginBottom: "24px",
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #3b3b50",
            background: "#181822",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← BACK TO {isMerch ? "MERCH" : "SHOP"}
        </button>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "30px",
          }}
        >
          <p
            style={{
              color: "#a78bfa",
              letterSpacing: "4px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            QRYSTAL BALLS CHECKOUT
          </p>

          <h1 style={{ marginTop: 0 }}>
            Review Your Order
          </h1>

          <div
            style={{
              marginTop: "28px",
              background: "#090910",
              border: "1px solid #29293a",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p>
              <strong>Product:</strong> {product}
            </p>

            {isMerch ? (
              <>
                <p>
                  <strong>Type:</strong> QRYSTAL MERCH
                </p>
<p>
  <strong>Theme:</strong>{" "}
  {theme.toUpperCase()}
</p>
                <p>
                  <strong>Variant:</strong>{" "}
                  {variant || `#${variantId}`}
                </p>
<p>
  <strong>Quantity:</strong>{" "}
  {quantity}
</p>

              </>
            ) : (
              <p>
                <strong>Theme:</strong>{" "}
                {theme.toUpperCase()}
              </p>
            )}

            <p>
              <strong>Price:</strong> {price}
            </p>
          </div>

          <button
            onClick={handlePayment}
            disabled={isLoading}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              background: "#3b3b50",
              color: "#aaa",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.7 : 1,
              fontSize: "16px",
            }}
          >
            {isLoading ? "CREATING CHECKOUT..." : "PAY WITH STRIPE"}
          </button>
          {checkoutError && (
            <p
              role="alert"
              style={{
                marginTop: "14px",
                marginBottom: 0,
                color: "#fca5a5",
                textAlign: "center",
              }}
            >
              {checkoutError}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: "#07070d",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <p>Loading checkout...</p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}