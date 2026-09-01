"use client";

import { useRef, useState } from "react";


const byTheme: Record<string, string[]> = {
  classic: [
    "YES.",
    "NO.",
    "ASK AGAIN.",
    "WITHOUT A DOUBT.",
    "VERY LIKELY.",
    "NOT TODAY.",
  ],

  chaos: [
    "ABSOLUTELY NOT. 😂",
    "DO IT. WHAT COULD GO WRONG?",
    "THE CHAOS GODS APPROVE.",
    "YOU ALREADY KNOW.",
    "MAYBE... IF YOU BRING SNACKS.",
  ],

  love: [
    "YES — SHOOT YOUR SHOT. ❤️",
    "WAIT A LITTLE LONGER.",
    "THE FEELING MAY BE MUTUAL.",
    "PROBABLY NOT.",
    "TEXT THEM. 📱",
  ],

  dark: [
    "DON'T.",
    "YOU SHOULD HAVE ASKED SOONER.",
    "THE SIGNS ARE NOT GOOD.",
    "RUN.",
    "THE ORACLE REFUSES TO ANSWER. 👻",
  ],

dnd: [
  "NAT 20. YES. 🎲",
  "CRITICAL FAIL.",
  "ROLL FOR INITIATIVE. ⚔️",
  "THE DUNGEON AWAITS.",
  "YOUR QUEST BEGINS.",
  "THE DRAGON SAYS YES. 🐉",
  "YOU HAVE CHOSEN... POORLY.",
  "THE DICE HAVE SPOKEN. 🎲",
  "ADVANTAGE.",
  "DISADVANTAGE.",
  "ROLL AGAIN.",
  "THE FATES ARE UNCERTAIN.",
  "A GREAT ADVENTURE AWAITS.",
  "THE DM HAS SPOKEN.",
  "NOT EVEN A NAT 20 CAN SAVE YOU.",
],
  };

export default function OracleQR({
  theme,
  code,
}: {
  theme: string;
  code: string;
}) {
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");
  const [lovePage, setLovePage] = useState<1 | 2 | 3>(1);
  const loveMusicRef = useRef<HTMLAudioElement | null>(null);

 async function ask() {
  if (!question.trim() || busy) return;

  setBusy(true);
  setAnswer("");
if (theme === "love" || theme === "dnd") {
  setLovePage(3);
}

}

function askAgain() {
  setAnswer("");
  setQuestion("");
  setBusy(false);

  if (theme === "love" || theme === "dnd") {
    setLovePage(1);
  }
}
  
  /* =========================================================
     LOVE ORACLE — THREE PAGE EXPERIENCE
     ========================================================= */

  if (theme === "love") {
    return (
      <main className="oracle-page theme-love">
<audio
  ref={loveMusicRef}
  src="/themes/qoracle-love-theme.wav"
  preload="auto"
  loop
/>

        {/* Floating hearts */}
        <div className="love-hearts" aria-hidden="true">
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
        </div>

        {/* =================================================
            PAGE 1 — INVITATION
           ================================================= */}

        {lovePage === 1 && (
          <section className="love-stage love-stage-one">

            <p className="eyebrow love-eyebrow">
              QoRacle • LOVE
            </p>

            <h1 className="love-title">
              LOVE <span>ORACLE</span>
            </h1>

            <p className="love-subtitle">
              Ask with your heart.
              <br />
              Trust what the Oracle reveals.
            </p>

          <div
  className="love-crystal love-crystal-image"
  onClick={ask}
  role="button"
  tabIndex={0}
  aria-label="Ask the Love Oracle"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      ask();
    }
  }}
>
  <img
    src="/themes/love-crystal-ball.png"
    alt="Glowing Love Oracle crystal ball with a heart inside"
    className="love-crystal-ball-image"
  />
</div>
                         

            <p className="love-instruction">
              Tap the crystal ball
              <br />
              and ask a question about love...
            </p>

            <div className="love-question-box">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your heart a question..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    ask();
                  }
                }}
              />

              <button
                className="primary love-button"
                onClick={ask}
                disabled={!question.trim() || busy}
              >
                ♥ REVEAL MY ANSWER ♥
              </button>
            </div>

            <p className="small">
              QR: {code} • For entertainment only.
            </p>

          </section>
        )}

   {/* =================================================
    PAGE 2 — MAGIC / REVEAL
   ================================================= */}

{lovePage === 2 && (
  <section className="love-stage love-stage-two">

    <p className="eyebrow love-eyebrow">
      QoRacle • LOVE
    </p>

    <h1 className="love-title">
      THE ORACLE <span>IS LISTENING</span>
    </h1>

    <p className="love-subtitle">
      Your question has been received...
    </p>

    <div className="love-crystal-page">

      <div className="love-magic-glow" />

      <div className="love-magic-hearts" aria-hidden="true">
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
        <span>♥</span>
      </div>

      <img
        src="/themes/love-crystal-ball.png"
        alt="Love Oracle crystal ball revealing an answer"
        className="love-crystal-ball-image"
      />

    </div>

    <div className="love-reveal-message">

      <div className="love-reveal-heart">
        ♥
      </div>

      <h2>
        Revealing your answer...
      </h2>

      <p>
        Trust the magic.
      </p>

    </div>

    <div className="love-loading-dots">
      <span />
      <span />
      <span />
    </div>

  </section>
)}

{/* =================================================
    PAGE 3 — ANSWER
   ================================================= */}

{lovePage === 3 && (
  <section className="love-stage love-stage-three">

    <p className="eyebrow love-eyebrow">
      QoRacle • LOVE
    </p>

    <h1 className="love-title">
      YOUR LOVE <span>ANSWER</span>
    </h1>

    <div className="love-crystal-page love-crystal-answer-page">

      <img
        src="/themes/love-crystal-ball.png"
        alt="Love Oracle crystal ball revealing an answer"
        className="love-crystal-ball-image"
      />

      <div className="love-answer-overlay">

        <div className="love-answer-heart">
          ♥
        </div>

         <div className="love-answer-text">
  <span className="love-answer-text-glow">
    {answer}
  </span>
</div>

       <div className="love-answer-decoration">
          ── ♥ ──
        </div>

      </div>

    </div>

    <div className="love-answer-card">

      <span>
        THE LOVE ORACLE SAYS
      </span>

      <strong>
        {answer}
      </strong>

    </div>

    <button
      className="primary love-button love-again-button"
      onClick={askAgain}
    >
      ♥ ASK ANOTHER QUESTION ♥
    </button>

    <p className="love-closing">
      Ask with an open heart.
      <br />
      Trust the answer.
    </p>

    <p className="small">
      QR: {code} • For entertainment only.
    </p>

  </section>
)}

  </main>
    );
  }

 /* =========================================================
   D&D ORACLE — NEW CRYSTAL EXPERIENCE
   ========================================================= */

if (theme === "dnd") {
  return (
    <main className="oracle-page theme-dnd">

      {/* DUNGEON BACKGROUND */}
      <div
        className="dnd-background"
        aria-hidden="true"
      />

      {/* FLOATING DICE */}
      <div className="dnd-floating-dice" aria-hidden="true">
        <span>20</span>
        <span>✦</span>
        <span>20</span>
        <span>⚔</span>
        <span>20</span>
        <span>✦</span>
      </div>

      {/* =================================================
          PAGE 1 — INVITATION
         ================================================= */}

      {lovePage === 1 && (
        <section className="dnd-stage dnd-stage-one">

          <div className="dnd-topbar">
            <button
              className="dnd-back"
              onClick={() => window.location.href = "/"}
            >
              ← Back to Home
            </button>

            <div className="dnd-brand">
              QoRacle • D&D
            </div>

            <div className="dnd-theme-badge">
              ⚙ Theme: D&D
            </div>
          </div>

          <p className="dnd-eyebrow">
            ✦ THE MYSTIC D20 ✦
          </p>

          <h1 className="dnd-title">
            THE DUNGEON
            <span>ORACLE</span>
          </h1>

          <p className="dnd-subtitle">
            Roll the dice. Ask your fate.
          </p>

          {/* CRYSTAL */}
          <button
            className="dnd-crystal"
            onClick={ask}
            aria-label="Ask the Dungeon Oracle"
          >
            <img
              src="/themes/DND.crystal.png"
              alt="Magical glowing D20 crystal with dragon pedestal"
              className="dnd-crystal-image"
            />
          </button>

          <p className="dnd-instruction">
            Ask the Dungeon Oracle...
          </p>

          {/* QUESTION */}
          <div className="dnd-question-box">

            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  ask();
                }
              }}
              placeholder="Ask the Dungeon Oracle..."
              maxLength={180}
            />

            <button
              className="dnd-button"
              onClick={ask}
              disabled={!question.trim() || busy}
            >
              <span>◇</span>
              {busy ? "ROLLING THE DICE..." : "SHAKE THE ORACLE"}
              <span>◇</span>
            </button>

          </div>

          <p className="dnd-closing">
            ✦ &nbsp; Let the dice decide &nbsp; ✦
          </p>

          <p className="small">
            QR: {code} • For entertainment only.
          </p>

        </section>
      )}

      {/* =================================================
          PAGE 2 — ROLLING
         ================================================= */}

      {lovePage === 2 && (
        <section className="dnd-stage dnd-stage-two">

          <p className="dnd-eyebrow">
            QoRacle • D&D
          </p>

          <h1 className="dnd-title">
            THE ORACLE
            <span>IS ROLLING</span>
          </h1>

          <p className="dnd-subtitle">
            The dice are deciding your fate...
          </p>

          <div className="dnd-crystal dnd-crystal-rolling">

            <div className="dnd-magic-glow" />

            <div className="dnd-magic-runes" aria-hidden="true">
              <span>ᚠ</span>
              <span>ᚱ</span>
              <span>ᛟ</span>
              <span>ᚷ</span>
              <span>ᛏ</span>
              <span>ᚨ</span>
            </div>

            <img
              src="/themes/DND.crystal.png"
              alt="D20 crystal rolling"
              className="dnd-crystal-image"
            />

          </div>

          <div className="dnd-reveal-message">

            <div className="dnd-reveal-icon">
              20
            </div>

            <h2>
              Rolling the dice...
            </h2>

            <p>
              The fates are deciding.
            </p>

          </div>

          <div className="dnd-loading-dots">
            <span />
            <span />
            <span />
          </div>

        </section>
      )}

      {/* =================================================
          PAGE 3 — FATE REVEALED
         ================================================= */}

      {lovePage === 3 && (
        <section className="dnd-stage dnd-stage-three">

          <p className="dnd-eyebrow">
            QoRacle • D&D
          </p>

          <h1 className="dnd-title">
            YOUR FATE
            <span>IS REVEALED</span>
          </h1>

          <div className="dnd-crystal dnd-crystal-answer">

            <img
              src="/themes/DND.crystal.png"
              alt="D20 crystal revealing your fate"
              className="dnd-crystal-image"
            />

            <div className="dnd-answer-overlay">

              <div className="dnd-answer-icon">
                20
              </div>

              <div className="dnd-answer-text">
                {answer}
              </div>

            </div>

          </div>

          <div className="dnd-answer-card">

            <span>
              THE DUNGEON ORACLE SAYS
            </span>

            <strong>
              {answer}
            </strong>

          </div>

          <button
            className="dnd-button dnd-again-button"
            onClick={askAgain}
          >
            <span>◇</span>
            ASK ANOTHER QUESTION
            <span>◇</span>
          </button>

          <p className="dnd-closing">
            ✦ &nbsp; Roll with courage. Trust the dice. &nbsp; ✦
          </p>

          <p className="small">
            QR: {code} • For entertainment only.
          </p>

        </section>
      )}

    </main>
  );
}
  /* =========================================================
     EXISTING ORACLE EXPERIENCE — OTHER THEMES
     ========================================================= */

  return (
    <main className={`oracle-page theme-${theme}`}>

      <p className="eyebrow">
        QoRacle • {theme.toUpperCase()}
      </p>

      <h1>
        ASK THE <span>ORACLE</span>
      </h1>

      <div
        className={`orb ${busy ? "shaking" : ""}`}
        onClick={ask}
      >
        <div className="orb-shine" />

        <div className="window">
          <div className="triangle">
            <span>
              {answer || "?"}
            </span>
          </div>
        </div>
      </div>

      <div className="question">

        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a yes/no question..."
        />

        <button
          className="primary"
          onClick={ask}
          disabled={!question.trim() || busy}
        >
          {busy ? "CONSULTING..." : "SHAKE THE ORACLE"}
        </button>

      </div>

      {answer && !busy && (
        <div className="result">

          <span>
            THE ORACLE SAYS
          </span>

          <strong>
            {answer}
          </strong>

          <button
            className="secondary"
            onClick={() => {
              setAnswer("");
              setQuestion("");
            }}
          >
            ASK AGAIN
          </button>

        </div>
      )}

      <p className="small">
        QR: {code} • For entertainment only.
      </p>

    </main>
  );
}
