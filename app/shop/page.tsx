"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


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
    onClick={() => router.push("/merch")}
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

        
       
  </>
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