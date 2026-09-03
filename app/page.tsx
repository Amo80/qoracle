"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [question, setQuestion] = useState("");
  return (
    <main className="landing">
{/* Magical atmosphere */}
<div className="landing-smoke landing-smoke-one" aria-hidden="true" />
<div className="landing-smoke landing-smoke-two" aria-hidden="true" />
<div className="landing-smoke landing-smoke-three" aria-hidden="true" />

<div className="landing-particles" aria-hidden="true">
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
  <i />
</div>

      <div className="sparkle">✦</div>

      <p className="eyebrow">
        SCAN • ASK • SHAKE • DISCOVER
      </p>

      <h1>
        THE <span>QRYSTAL BALLS</span>
      </h1>

      <h2>
        WHAT WILL FATE SAY?
      </h2>
<div className="landing-crystal">
  <img
    src="/themes/qrystal-balls-crystal.png"
    alt="The QRystal Balls crystal"
    className="landing-crystal-image"
  />
</div>

      <p className="lead">
        Choose your Oracle.
        <br />
        Ask a question.
        <br />
        Discover your answer.
      </p>

    <div className="hero-actions">
  <Link
    className="primary"
    href="/oracle?theme=jester"
  >
    🔮 ASK THE ORACLE
  </Link>

  <Link
    className="shop-button"
    href="/shop"
  >
    🛍️ VISIT THE SHOP
  </Link>
</div>      <p className="tagline">
        Five Oracles. Infinite questions.
      </p>

<div className="oracle-section-heading">
  <span>✦</span>
  <h3>CHOOSE YOUR ORACLE</h3>
  <span>✦</span>
</div>
     <div className="oracle-cards">

  <Link href="/oracle?theme=jester" className="oracle-card">
    <img
      src="/themes/jester-oracle.png"
      alt="Jester Oracle"
    />
    <div className="oracle-card-info">
      <strong>JESTER</strong>
      <span>Mischief & Mayhem</span>
    </div>
  </Link>

  <Link href="/oracle?theme=chaos" className="oracle-card">
    <img
      src="/themes/chaos-crystal-ball.png"
      alt="Chaos Oracle"
    />
    <div className="oracle-card-info">
      <strong>CHAOS</strong>
      <span>Unpredictable Fate</span>
    </div>
  </Link>

  <Link href="/oracle?theme=love" className="oracle-card">
    <img
      src="/themes/love-crystal-ball.png"
      alt="Love Oracle"
    />
    <div className="oracle-card-info">
      <strong>LOVE</strong>
      <span>Romance & Desire</span>
    </div>
  </Link>

  <Link href="/oracle?theme=eclipse" className="oracle-card">
    <img
      src="/themes/eclipse-crystal.png"
      alt="Eclipse Oracle"
    />
    <div className="oracle-card-info">
      <strong>ECLIPSE</strong>
      <span>Mystery & Secrets</span>
    </div>
  </Link>

  <Link href="/oracle?theme=dnd" className="oracle-card">
    <img
      src="/themes/DND.crystal.png"
      alt="D&D Oracle"
    />
    <div className="oracle-card-info">
      <strong>D&amp;D</strong>
      <span>Adventure Awaits</span>
    </div>
  </Link>

</div>
<section className="ask-anything">
  <div className="ask-anything-heading">
    <span>✦</span>
    <h3>ASK ANYTHING</h3>
    <span>✦</span>
  </div>

  <p className="ask-anything-subtitle">
    Seriously. Anything.
  </p>

  <div className="ask-anything-box">
   <input
  type="text"
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && question.trim()) {
      window.location.href =
        `/oracle?theme=jester&question=${encodeURIComponent(
          question.trim()
        )}`;
    }
  }}
  placeholder="What do you want to know?"
  maxLength={180}
  aria-label="Ask The QRystal Balls a question"
/>
   <button
  type="button"
  className="ask-anything-button"
  disabled={!question.trim()}
  onClick={() => {
    window.location.href =
      `/oracle?theme=jester&question=${encodeURIComponent(
        question.trim()
      )}`;
  }}
>
  🔮 CONSULT THE QRYSTAL
</button>  </div>

  <p className="ask-anything-hint">
    The Jester is waiting...
  </p>
</section>

<section className="fate-preview">
  <div className="fate-preview-heading">
    <span>✦</span>
    <h3>WHAT HAPPENS NEXT?</h3>
    <span>✦</span>
  </div>

  <div className="fate-preview-card">
    <div className="fate-preview-label">
      THE QRYSTAL IS LISTENING...
    </div>

    <div className="fate-preview-question">
      “Should I take the leap?”
    </div>

    <div className="fate-preview-orb">
      🔮
    </div>

    <div className="fate-preview-answer">
      <span>THE JESTER SAYS</span>
      <strong>ABSOLUTELY. WHAT COULD GO WRONG?</strong>
    </div>
  </div>

  <p className="fate-preview-note">
    Every Oracle has a different answer.
  </p>
</section>

      <p className="small">
        Ask anything. Fate decides the rest.
      </p>

    </main>
  );
}