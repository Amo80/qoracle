"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const products = [
  {
    name: "QRystal Balls Sticker",
    price: "$4.99",
    description:
      "A scannable QRystal Balls sticker you can place almost anywhere.",
    icon: "✦",
  },
  {
    name: "QRystal Balls Card",
    price: "$7.99",
    description:
      "A pocket-sized QRystal Balls card with its own unique QR code.",
    icon: "◇",
  },
  {
    name: "QRystal Balls Keychain",
    price: "$12.99",
    description:
      "Carry your QRystal Balls with you wherever you go.",
    icon: "☽",
  },
];

const themes = [
  {
    id: "jester",
    name: "JESTER",
    image: "/themes/jester-oracle.png",
    description: "Mischief & Mayhem",
  },
  {
    id: "chaos",
    name: "CHAOS",
    image: "/themes/chaos-crystal-ball.png",
    description: "Unpredictable Fate",
  },
  {
    id: "love",
    name: "LOVE",
    image: "/themes/love-crystal-ball.png",
    description: "Romance & Desire",
  },
  {
    id: "eclipse",
    name: "ECLIPSE",
    image: "/themes/eclipse-crystal.png",
    description: "Mystery & Secrets",
  },
  {
    id: "dnd",
    name: "D&D",
    image: "/themes/DND.crystal.png",
    description: "Adventure Awaits",
  },
];
export default function ShopPage() {
  const router = useRouter();
  const [selectedTheme, setSelectedTheme] = useState("jester");
const [shopCategory, setShopCategory] = useState<"artifacts" | "merch">(
  "artifacts"
);

  const selectedThemeData = themes.find(
    (theme) => theme.id === selectedTheme
  );

  function handleCheckout(product: (typeof products)[number]) {
    router.push(
      `/checkout?product=${encodeURIComponent(
        product.name
      )}&theme=${encodeURIComponent(
        selectedTheme
      )}&price=${encodeURIComponent(product.price)}`
    );
  }

  return (
    <main className="qrystal-shop">
      {/* Background atmosphere */}
      <div className="shop-stars" aria-hidden="true">
        ✦　·　　　✧　　　　·　✦　　　·　　　✧
      </div>

      <div className="shop-container">
        {/* BACK BUTTON */}
        <button
          type="button"
          className="shop-back"
          onClick={() => router.push("/")}
        >
          ← BACK TO ORACLE
        </button>

        {/* HERO */}
        <header className="shop-hero">
          <div className="shop-eyebrow">
            ✦ THE QRYSTAL BALLS ✦
          </div>

          <h1>
            THE <span>QRYSTAL</span> SHOP
          </h1>

          <div className="shop-divider">
            <span />
            <b>✦</b>
            <span />
          </div>

          <p className="shop-subtitle">
            ARTIFACTS OF FATE
          </p>

          <p className="shop-description">
            Carry a piece of the Oracle with you.
            <br />
            Choose your artifact. Choose your fate.
          </p>
        </header>
{/* SHOP CATEGORY */}
<section className="shop-category-switch">
  <button
    type="button"
    className={`shop-category-button ${
      shopCategory === "artifacts" ? "active" : ""
    }`}
    onClick={() => setShopCategory("artifacts")}
  >
    QR ARTIFACTS
  </button>

  <button
    type="button"
    className={`shop-category-button ${
      shopCategory === "merch" ? "active" : ""
    }`}
    onClick={() => setShopCategory("merch")}
  >
    MERCH
  </button>
</section>

{shopCategory === "artifacts" && (
  <>
        {/* ORACLE SELECTOR */}
        <section className="shop-theme-section">
          <div className="shop-section-title">
            <span>✦</span>
            <h2>CHOOSE YOUR ORACLE</h2>
            <span>✦</span>
          </div>

          <p className="shop-theme-subtitle">
            Every Oracle carries a different energy.
          </p>

          <div className="shop-theme-grid">
            {themes.map((theme) => {
              const isSelected = selectedTheme === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`shop-theme-card ${
                    isSelected ? "selected" : ""
                  } theme-card-${theme.id}`}
                  onClick={() => setSelectedTheme(theme.id)}
                  aria-pressed={isSelected}
                >
                  <div className="shop-theme-card-glow" />

                 <div className="shop-theme-orb">
  <img
    src={theme.image}
    alt={`${theme.name} Oracle`}
  />
</div>

                  <strong>{theme.name}</strong>

                  <span className="shop-theme-description">
                    {theme.description}
                  </span>

                  {isSelected && (
                    <span className="shop-selected">
                      SELECTED
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CURRENT SELECTION */}
          <div className="shop-current-selection">
            <span>YOUR ORACLE:</span>

           <strong>
  {selectedThemeData?.name}
</strong>

          </div>
        </section>

        {/* PRODUCTS */}
        <section className="shop-products">
          <div className="shop-products-heading">
            <div>
              <span className="shop-mini-label">
                YOUR ARTIFACT AWAITS
              </span>

              <h2>
                CHOOSE YOUR <span>ARTIFACT</span>
              </h2>
            </div>

            <p>
              Your selected Oracle will be paired
              <br />
              with your artifact.
            </p>
          </div>

          <div className="shop-product-grid">
            {products.map((product) => (
              <article
                key={product.name}
                className="shop-product-card"
              >
                <div className="shop-product-glow" />

                <div className="shop-product-icon">
                  {product.icon}
                </div>

                <div className="shop-product-content">
                  <div className="shop-product-type">
                    QRYSTAL ARTIFACT
                  </div>

                  <h3>{product.name}</h3>

                  <p>{product.description}</p>

                  <div className="shop-product-theme">
                    <span>ORACLE</span>

                   <strong>
  {selectedThemeData?.name}
</strong>

                  </div>

                  <div className="shop-product-bottom">
                    <div className="shop-price">
                      {product.price}
                    </div>

                    <button
                      type="button"
                      className="shop-buy-button"
                      onClick={() => handleCheckout(product)}
                    >
                      CHOOSE THIS
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

  </>
)}
{shopCategory === "merch" && (
  <section className="shop-merch">
    <div className="shop-products-heading">
      <div>
        <span className="shop-mini-label">
          WEAR THE ORACLE
        </span>

        <h2>
          QRYSTAL <span>MERCH</span>
        </h2>
      </div>

      <p>
        Official apparel from
        <br />
        The Qrystal Balls.
      </p>
    </div>

    <div className="shop-product-grid">
      <article className="shop-product-card">
        <div className="shop-product-glow" />

        <div className="shop-product-icon">
          👕
        </div>

        <div className="shop-product-content">
          <div className="shop-product-type">
            QRYSTAL APPAREL
          </div>

          <h3>Qrystal Balls T-Shirt</h3>

          <p>
            A soft everyday tee featuring official
            Qrystal Balls artwork.
          </p>

          <div className="shop-product-bottom">
            <div className="shop-price">
              Coming Soon
            </div>

            <button
              type="button"
              className="shop-buy-button"
              disabled
            >
              NOT YET LIVE
            </button>
          </div>
        </div>
      </article>

      <article className="shop-product-card">
        <div className="shop-product-glow" />

        <div className="shop-product-icon">
          ✦
        </div>

        <div className="shop-product-content">
          <div className="shop-product-type">
            QRYSTAL APPAREL
          </div>

          <h3>Qrystal Balls Hoodie</h3>

          <p>
            A heavier pullover hoodie featuring
            official Qrystal Balls artwork.
          </p>

          <div className="shop-product-bottom">
            <div className="shop-price">
              Coming Soon
            </div>

            <button
              type="button"
              className="shop-buy-button"
              disabled
            >
              NOT YET LIVE
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
)}
        {/* FOOTER */}
        <footer className="shop-footer">
          <div>✦</div>
          <p>
            THE ORACLE HAS SPOKEN.
            <br />
            <span>NOW CHOOSE YOUR FATE.</span>
          </p>
          <div>✦</div>
        </footer>
      </div>
    </main>
  );
}