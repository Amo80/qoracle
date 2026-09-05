"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PrintifyVariant = {
  id: number;
  title: string;
  cost: number;
  price: number;
  is_enabled: boolean;
  is_available: boolean;
};

type PrintifyImage = {
  src: string;
  variant_ids?: number[];
  position?: string;
  is_default?: boolean;
};

type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  images?: PrintifyImage[];
  variants?: PrintifyVariant[];
};

export default function MerchPage() {
  const router = useRouter();

  const [products, setProducts] = useState<PrintifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/printify/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load merch.");
        }

        const data = await response.json();

        const allowedProductIds = [
  "6a9b0ef60df98d21710a69d4", // JESTER
  "6a9b4765baaf31d43701ed9b", // CHAOS
];

setProducts(
  (data.data || []).filter((product: PrintifyProduct) =>
    allowedProductIds.includes(product.id)
  )
);
      } catch (err) {
        console.error(err);
        setError("The Oracle could not summon the merch.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <main className="qrystal-shop">
      <div className="shop-stars" aria-hidden="true">
        ✦　·　　　✧　　　　·　✦　　　·　　　✧
      </div>

      <div className="shop-container">
        <button
          type="button"
          className="shop-back"
          onClick={() => router.push("/shop")}
        >
          ← BACK TO SHOP
        </button>

        <header className="shop-hero">
          <div className="shop-eyebrow">
            ✦ THE QRYSTAL BALLS ✦
          </div>

          <h1>
            QRYSTAL <span>MERCH</span>
          </h1>

          <div className="shop-divider">
            <span />
            <b>✦</b>
            <span />
          </div>

          <p className="shop-subtitle">
            WEAR THE ORACLE
          </p>

          <p className="shop-description">
            Official apparel and merchandise
            <br />
            from The Qrystal Balls.
          </p>
        </header>

        {loading && (
          <p className="shop-description">
            Summoning merch...
          </p>
        )}

        {error && (
          <p className="shop-description">
            {error}
          </p>
        )}

        {!loading && !error && (
          <section className="shop-products">
            <div className="shop-product-grid">
              {products.map((product) => {
                const image =
                  product.images?.find((img) => img.is_default)?.src ||
                  product.images?.[0]?.src;

                const enabledVariants =
                  product.variants?.filter(
                    (variant) =>
                      variant.is_enabled &&
                      variant.is_available
                  ) || [];

                const prices = enabledVariants.map(
                  (variant) => variant.price
                );

                const lowestPrice =
                  prices.length > 0
                    ? Math.min(...prices) / 100
                    : null;

                return (
                  <article
                    key={product.id}
                    className="shop-product-card"
                  >
                    <div className="shop-product-glow" />

                    {image && (
                      <div className="shop-theme-orb">
                        <img
                          src={image}
                          alt={product.title}
                        />
                      </div>
                    )}

                    <div className="shop-product-content">
                      <div className="shop-product-type">
                        QRYSTAL MERCH
                      </div>

                      <h3>{product.title}</h3>

                      <p>
                        Official Qrystal Balls apparel.
                      </p>

                      <div className="shop-product-bottom">
                        <div className="shop-price">
                          {lowestPrice !== null
                            ? `From $${lowestPrice.toFixed(2)}`
                            : "Price coming soon"}
                        </div>

                       <button
  type="button"
  className="shop-buy-button"
  onClick={() => router.push(`/merch/${product.id}`)}
>
  VIEW ITEM
</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

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