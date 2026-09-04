"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PrintifyVariant = {
  id: number;
  title: string;
  price: number;
  is_enabled: boolean;
  is_available: boolean;
};

type PrintifyImage = {
  src: string;
  variant_ids?: number[];
  is_default?: boolean;
};

type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  images?: PrintifyImage[];
  variants?: PrintifyVariant[];
};

export default function MerchProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = String(params.id);

  const [product, setProduct] = useState<PrintifyProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null
  );
const [selectedTheme, setSelectedTheme] = useState("jester");
const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch("/api/printify/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load product.");
        }

        const data = await response.json();

        const found = (data.data || []).find(
          (item: PrintifyProduct) => item.id === productId
        );

        if (!found) {
          throw new Error("Product not found.");
        }

        setProduct(found);

        const firstAvailable = found.variants?.find(
          (variant: PrintifyVariant) =>
            variant.is_enabled && variant.is_available
        );

        if (firstAvailable) {
          setSelectedVariantId(firstAvailable.id);
        }
      } catch (err) {
        console.error(err);
        setError("The Oracle could not find this item.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const availableVariants = useMemo(() => {
    return (
      product?.variants?.filter(
        (variant) => variant.is_enabled && variant.is_available
      ) || []
    );
  }, [product]);

  const selectedVariant = availableVariants.find(
    (variant) => variant.id === selectedVariantId
  );

  const image =
    product?.images?.find((img) => img.is_default)?.src ||
    product?.images?.[0]?.src;

  if (loading) {
    return (
      <main className="qrystal-shop">
        <div className="shop-container">
          <p className="shop-description">Summoning item...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="qrystal-shop">
        <div className="shop-container">
          <button
            type="button"
            className="shop-back"
            onClick={() => router.push("/merch")}
          >
            ← BACK TO MERCH
          </button>

          <p className="shop-description">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="qrystal-shop">
      <div className="shop-stars" aria-hidden="true">
        ✦　·　　　✧　　　　·　✦　　　·　　　✧
      </div>

      <div className="shop-container">
        <button
          type="button"
          className="shop-back"
          onClick={() => router.push("/merch")}
        >
          ← BACK TO MERCH
        </button>

        <section className="shop-products">
          <div className="shop-product-card">
            <div className="shop-product-glow" />

            {image && (
              <div className="shop-theme-orb">
                <img src={image} alt={product.title} />
              </div>
            )}

            <div className="shop-product-content">
              <div className="shop-product-type">
                QRYSTAL MERCH
              </div>

              <h1>{product.title}</h1>

              <p>
                Choose your size and color below.
              </p>
<div className="shop-product-theme">
  <span>THEME</span>

  <select
    value={selectedTheme}
    onChange={(event) => setSelectedTheme(event.target.value)}
  >
    <option value="jester">JESTER</option>
    <option value="chaos">CHAOS</option>
    <option value="love">LOVE</option>
    <option value="eclipse">ECLIPSE</option>
    <option value="dnd">D&D</option>
  </select>
</div>

              <div className="shop-product-theme">
                <span>VARIANT</span>

                <select
                  value={selectedVariantId ?? ""}
                  onChange={(event) =>
                    setSelectedVariantId(Number(event.target.value))
                  }
                >
                  {availableVariants.map((variant) => (
                    <option
                      key={variant.id}
                      value={variant.id}
                    >
                      {variant.title}
                    </option>
                  ))}
                </select>
              </div>
<div className="shop-product-theme">
  <span>QUANTITY</span>

  <select
    value={quantity}
    onChange={(event) =>
      setQuantity(Number(event.target.value))
    }
  >
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
      <option key={qty} value={qty}>
        {qty}
      </option>
    ))}
  </select>
</div>

              <div className="shop-product-bottom">
                <div className="shop-price">
                  {selectedVariant
                    ? `$${(selectedVariant.price / 100).toFixed(2)}`
                    : "Unavailable"}
                </div>

  <button
  type="button"
  className="shop-buy-button"
  disabled={!selectedVariant}
  onClick={() => {
    if (!selectedVariant) return;

    router.push(
      `/checkout?product=${encodeURIComponent(
        product.title
      )}&theme=${encodeURIComponent(
        selectedTheme
      )}&printifyProductId=${encodeURIComponent(
        product.id
      )}&variantId=${encodeURIComponent(
        String(selectedVariant.id)
      )}&variant=${encodeURIComponent(
        selectedVariant.title
      )}&quantity=${encodeURIComponent(
        String(quantity)
      )}&price=${encodeURIComponent(
        `$${(selectedVariant.price / 100).toFixed(2)}`
      )}`
    );
  }}
>
  BUY NOW
</button>
    </div>
            </div>
          </div>
        </section>

        <footer className="shop-footer">
          <div>✦</div>
          <p>
            THE ORACLE HAS SPOKEN.
            <br />
            <span>NOW WEAR YOUR FATE.</span>
          </p>
          <div>✦</div>
        </footer>
      </div>
    </main>
  );
}