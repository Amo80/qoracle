"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeOracleId } from "@/lib/oracles/registry";
import { ORACLE_ANSWERS } from "@/lib/oracles/answers";
import { stopOracleAudio } from "@/lib/oracles/audioLifecycle";
import { focusWithoutViewportScroll } from "@/lib/oracles/focusWithoutScroll";
import {
  createJesterCycleIdentity,
  emitJesterPresentation,
  resetJesterPresentation,
  runJesterIntelligenceCycle,
  type JesterCycleIdentity,
} from "@/lib/oracle-intelligence/jesterIntegration";

export default function OracleQR({
  theme,
  code,
  jesterIntelligenceEnabled = false,
}: {
  theme: string;
  code: string;
  jesterIntelligenceEnabled?: boolean;
}) {
  const searchParams = useSearchParams();
  // Normalize theme names so URLs like ?theme=Jester and legacy Classic links work.
  const activeTheme = normalizeOracleId(theme);

  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState(
  searchParams.get("question") || ""
);
 const [lovePage, setLovePage] = useState<1 | 2 | 3>(1);
const [dndRoll, setDndRoll] = useState(20);
const [eclipseSide, setEclipseSide] = useState<"light" | "dark">("light");

const loveMusicRef = useRef<HTMLAudioElement | null>(null);
const dndMusicRef = useRef<HTMLAudioElement | null>(null);
const chaosMusicRef = useRef<HTMLAudioElement | null>(null);
const jesterLaughRef = useRef<HTMLAudioElement | null>(null);
const answerRegionRef = useRef<HTMLDivElement | null>(null);
const intelligenceCycleRef = useRef<Readonly<{
  identity: JesterCycleIdentity;
  controller: AbortController;
}> | null>(null);
const [intelligenceAnnouncement, setIntelligenceAnnouncement] = useState("");

function cancelJesterIntelligenceCycle() {
  intelligenceCycleRef.current?.controller.abort("jester-cycle-superseded");
  intelligenceCycleRef.current = null;
  resetJesterPresentation();
}

useEffect(() => {
  const activeAudio = [loveMusicRef.current, dndMusicRef.current, chaosMusicRef.current, jesterLaughRef.current];
  return () => stopOracleAudio(activeAudio);
}, [activeTheme]);

useEffect(() => {
  return () => {
    intelligenceCycleRef.current?.controller.abort("jester-oracle-unmounted");
    intelligenceCycleRef.current = null;
  };
}, [activeTheme]);

useEffect(() => {
  if (!answer || busy) return;
  const frame = window.requestAnimationFrame(() => {
    if (answerRegionRef.current) {
      focusWithoutViewportScroll(answerRegionRef.current);
    }
  });
  return () => window.cancelAnimationFrame(frame);
}, [answer, busy, activeTheme]);

async function ask() {
  if (!question.trim() || busy) return;

  setBusy(true);
  setAnswer("");

 // Move to the rolling screen
if (activeTheme === "love" || activeTheme === "dnd" || activeTheme === "eclipse") {
  setLovePage(2);
}

// Eclipse chooses Light or Dark independently of the answer text
if (activeTheme === "eclipse") {
  const side = Math.random() < 0.5 ? "light" : "dark";
  setEclipseSide(side);
}

  // Start D&D music after the user's button click
  if (activeTheme === "dnd" && dndMusicRef.current) {
    dndMusicRef.current.currentTime = 0;
    dndMusicRef.current.volume = 0.45;

    try {
      await dndMusicRef.current.play();
    } catch (error) {
      console.log("Dungeon Oracle music could not autoplay:", error);
    }
  }

// Start Chaos music after the user's button click
if (activeTheme === "chaos" && chaosMusicRef.current) {
  chaosMusicRef.current.currentTime = 0;
  chaosMusicRef.current.volume = 0.45;

  try {
    await chaosMusicRef.current.play();
  } catch (error) {
    console.log("Chaos Oracle music could not autoplay:", error);
  }
}

  // Start Love music after the user's button click
  if (activeTheme === "love" && loveMusicRef.current) {
    loveMusicRef.current.currentTime = 0;
    loveMusicRef.current.volume = 0.45;

    try {
      await loveMusicRef.current.play();
    } catch (error) {
      console.log("Love Oracle music could not autoplay:", error);
    }
  }

  if (activeTheme === "jester" && jesterIntelligenceEnabled) {
    cancelJesterIntelligenceCycle();
    const identity = createJesterCycleIdentity();
    const controller = new AbortController();
    intelligenceCycleRef.current = { identity, controller };
    setIntelligenceAnnouncement("The Oracle is considering your question.");

    const list = ORACLE_ANSWERS.jester;
    const fallbackAnswer = list[Math.floor(Math.random() * list.length)];
    const decision = await runJesterIntelligenceCycle({
      identity,
      question: question.trim(),
      fallbackAnswer,
      controller,
    });
    const activeCycle = intelligenceCycleRef.current;
    if (
      !activeCycle ||
      activeCycle.identity.oracleId !== "jester" ||
      activeCycle.identity.cycleId !== decision.identity.cycleId ||
      activeCycle.identity.requestId !== decision.identity.requestId ||
      decision.fallbackReason === "cancelled"
    ) return;

    intelligenceCycleRef.current = null;
    if (decision.presentation) emitJesterPresentation(identity, decision.presentation);
    else resetJesterPresentation();
    setIntelligenceAnnouncement("");

    const laugh = document.getElementById("jesterLaugh") as HTMLAudioElement | null;
    if (laugh) {
      laugh.currentTime = 0;
      laugh.volume = 0.75;
      try {
        await laugh.play();
      } catch (error) {
        console.log("Jester laugh could not play:", error);
      }
    }

    console.info("[QRystal Jester intelligence]", {
      attempted: true,
      source: decision.source,
      fallbackReason: decision.fallbackReason ?? null,
      clientDecisionElapsedMs: Math.round(decision.clientDecisionElapsedMs),
      diagnostic: decision.diagnostic ?? null,
      semanticPresentation: decision.presentation,
    });
    setAnswer(decision.answer);
    setBusy(false);
    return;
  }

  // Let the rolling animation play
  await new Promise((resolve) => setTimeout(resolve, 1800));

  // Choose the answer
const list = ORACLE_ANSWERS[activeTheme];

const newAnswer =
  list[Math.floor(Math.random() * list.length)];
if (activeTheme === "jester") {
  const laugh = document.getElementById(
    "jesterLaugh"
  ) as HTMLAudioElement | null;

  if (laugh) {
    laugh.currentTime = 0;
    laugh.volume = 0.75;

    try {
      await laugh.play();
    } catch (error) {
      console.log("Jester laugh could not play:", error);
    }
  }
}

if (activeTheme === "dnd") {
  const upper = newAnswer.toUpperCase();

  let roll: number;

  if (
    upper.includes("YES") ||
    upper.includes("ABSOLUTELY") ||
    upper.includes("VERY LIKELY") ||
    upper.includes("ADVANTAGE") ||
    upper.includes("GREAT ADVENTURE")
  ) {
    roll = 20;
  } else if (
    upper.includes("NO") ||
    upper.includes("DON'T") ||
    upper.includes("DONT") ||
    upper.includes("CRITICAL FAIL") ||
    upper.includes("POORLY") ||
    upper.includes("DISADVANTAGE")
  ) {
    roll = 1;
  } else if (
    upper.includes("UNCERTAIN") ||
    upper.includes("ROLL AGAIN") ||
    upper.includes("ASK AGAIN")
  ) {
    roll = Math.floor(Math.random() * 7) + 8;
  } else if (
    upper.includes("PROBABLY") ||
    upper.includes("FATES") ||
    upper.includes("DM HAS SPOKEN")
  ) {
    roll = Math.floor(Math.random() * 5) + 15;
  } else {
    roll = Math.floor(Math.random() * 6) + 2;
  }

  setDndRoll(roll);
}

setAnswer(newAnswer);
setBusy(false);

// Reveal the fate
if (activeTheme === "love" || activeTheme === "dnd" || activeTheme === "eclipse") {
  setLovePage(3);
}

}

function askAgain() {
  cancelJesterIntelligenceCycle();
  setIntelligenceAnnouncement("");
  setAnswer("");
  setQuestion("");
  setBusy(false);

if (activeTheme === "love" || activeTheme === "dnd" || activeTheme === "eclipse") {
  setLovePage(1);
}

if (activeTheme === "eclipse") {
  setEclipseSide("light");
}

}

  
  /* =========================================================
     LOVE ORACLE — THREE PAGE EXPERIENCE
     ========================================================= */

  if (activeTheme === "love") {
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
              The QRystal Balls • LOVE
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
                aria-label="Ask the Love Oracle a question"
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
      The QRystal Balls • LOVE
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
      The QRystal Balls • LOVE
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

    <div ref={answerRegionRef} className="love-answer-card" role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>

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

if (activeTheme === "dnd") {
  return (
    <main className="oracle-page theme-dnd">

<audio
  ref={dndMusicRef}
  src="/themes/qoracle-dnd-theme.wav"
  preload="auto"
  loop
/>

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
              The QRystal Balls • DUNGEON
            </div>

            <div className="dnd-theme-badge">
              ✦ Theme: Dungeon
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
              aria-label="Ask the Dungeon Oracle a question"
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
            The QRystal Balls • DUNGEON
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
              ?
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
            The QRystal Balls • DUNGEON
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
              {dndRoll}
              </div>

              <div className="dnd-answer-text">
                {answer}
              </div>

            </div>

          </div>

          <div ref={answerRegionRef} className="dnd-answer-card" role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>

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
     ECLIPSE ORACLE — LIGHT + DARK
     ========================================================= */

  if (activeTheme === "eclipse") {
    return (
      <main className="oracle-page theme-eclipse">

        {/* =================================================
            PAGE 1 — INVITATION
           ================================================= */}

        {lovePage === 1 && (
          <section className="eclipse-stage eclipse-stage-one">

            <p className="eyebrow eclipse-eyebrow">
              QRystal Ball • ECLIPSE
            </p>

            <h1 className="eclipse-title">
              ECLIPSE <span>ORACLE</span>
            </h1>

            <p className="eclipse-subtitle">
              Light and dark.
              <br />
              Two forces. One truth.
            </p>

            {/* ECLIPSE CRYSTAL */}

           <button
  className="eclipse-crystal"
  onClick={ask}
  aria-label="Ask the Eclipse Oracle"
  disabled={busy}
>
  <img
    src="/themes/eclipse-crystal.png"
    alt="Eclipse Oracle crystal ball"
    className="eclipse-crystal-image"
  />
</button>

            <p className="eclipse-instruction">
              Ask the Eclipse Oracle...
              <br />
              and discover which force answers.
            </p>

            {/* QUESTION */}

            <div className="eclipse-question-box">

              <input
                aria-label="Ask the Eclipse Oracle a question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    ask();
                  }
                }}
                placeholder="Ask the Eclipse Oracle..."
                maxLength={180}
              />

              <button
                className="primary eclipse-button"
                onClick={ask}
                disabled={!question.trim() || busy}
              >
                {busy ? "THE ORACLE IS LISTENING..." : "REVEAL MY FATE"}
              </button>

            </div>

            <p className="eclipse-closing">
              ☀ LIGHT &nbsp; • &nbsp; DARK ☾
            </p>

            <p className="small">
              QR: {code} • For entertainment only.
            </p>

          </section>
        )}

        {/* =================================================
            PAGE 2 — AWAKENING
           ================================================= */}

               {lovePage === 2 && (
          <section className="eclipse-stage eclipse-stage-two">

            <p className="eyebrow eclipse-eyebrow">
              QRystal Ball • ECLIPSE
            </p>

            <h1 className="eclipse-title">
              THE ORACLE
              <span>IS AWAKENING</span>
            </h1>

            <p className="eclipse-subtitle">
              Light and darkness are deciding your fate...
            </p>

            <div
  className={`eclipse-crystal eclipse-crystal-awakening eclipse-${eclipseSide}`}
>

              <img
                src="/themes/eclipse-crystal.png"
                alt="Eclipse Oracle crystal awakening"
                className="eclipse-crystal-image"
              />

              <div className="eclipse-energy-ring eclipse-energy-ring-one" />
              <div className="eclipse-energy-ring eclipse-energy-ring-two" />

            </div>

            <div className="eclipse-reveal-message">

              <h2>
                Revealing your fate...
              </h2>

              <p>
                Which force will speak?
              </p>

            </div>

            <div className="eclipse-loading-dots">
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
          <section className="eclipse-stage eclipse-stage-three">

            <p className="eyebrow eclipse-eyebrow">
              QRystal Ball • ECLIPSE
            </p>

            <h1 className="eclipse-title">
              YOUR FATE
              <span>IS REVEALED</span>
            </h1>

            <div
  className={`eclipse-crystal eclipse-crystal-answer eclipse-${eclipseSide}`}
>

              <img
                src="/themes/eclipse-crystal.png"
                alt="Eclipse Oracle revealing your fate"
                className="eclipse-crystal-image"
              />

            <div className={`eclipse-answer-overlay eclipse-answer-${eclipseSide}`}>
  {answer}
</div>

            </div>

            <div ref={answerRegionRef} className="eclipse-answer-card" role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>

              <span>
                THE ECLIPSE ORACLE SAYS
              </span>

              <strong>
                {answer}
              </strong>

            </div>

            <button
              className="primary eclipse-button eclipse-again-button"
              onClick={askAgain}
            >
              ASK ANOTHER QUESTION
            </button>

            <p className="eclipse-closing">
              ☀ Light and Dark • One Truth ☾
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
     JESTER ORACLE
     ========================================================= */
  if (activeTheme === "jester") {
    return (
      <main
        className="oracle-page theme-jester"
        aria-busy={jesterIntelligenceEnabled && busy ? "true" : undefined}
        data-jester-intelligence={jesterIntelligenceEnabled && busy ? "pending" : "idle"}
      >
<audio
  ref={jesterLaughRef}
  id="jesterLaugh"
  src="/themes/jester-laugh.mp3"
  preload="auto"
/>
        <p className="eyebrow">
          The QRystal Balls • JESTER
        </p>

        <h1>
          ASK THE <span>JESTER</span>
        </h1>

        <div
          className={`jester-crystal ${busy ? "shaking" : ""}`}
          onClick={ask}
          role="button"
          tabIndex={0}
          aria-label="Ask the Jester Oracle"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              ask();
            }
          }}
        >
          <img
  src="/themes/jester-oracle.png"
  alt="The QRystal Balls Jester"
  className="jester-character"
/>
          {answer && !busy && (
            <div className="jester-crystal-answer">
              {answer}
            </div>
          )}
        </div>

        <div className="question">
          <input
            aria-label="Ask the Jester Oracle a question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                ask();
              }
            }}
            placeholder="Ask the Jester..."
            maxLength={180}
          />

          <button
            className="primary"
            onClick={ask}
            disabled={!question.trim() || busy}
          >
            {busy ? "THE JESTER IS THINKING..." : "ASK THE JESTER"}
          </button>
        </div>

        {answer && !busy && (
          <div ref={answerRegionRef} className="result" role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>
            <span>THE JESTER SAYS</span>
            <strong>{answer}</strong>
            <button className="secondary" onClick={askAgain}>
              ASK AGAIN
            </button>
          </div>
        )}

        <p className="qb-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          {intelligenceAnnouncement}
        </p>

        <p className="small">
          QR: {code} • For entertainment only.
        </p>
      </main>
    );
  }

  /* =========================================================
     CHAOS ORACLE — DEFAULT LEGACY EXPERIENCE
     ========================================================= */
  return (
    <main className={`oracle-page theme-${activeTheme}`}>
      <audio
        ref={chaosMusicRef}
        src="/themes/qoracle-chaos-theme.wav"
        preload="auto"
        loop
      />

      {activeTheme === "chaos" && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            backgroundImage: "url('/themes/chaos-background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {activeTheme === "chaos" && (
        <div className="chaos-lightning" aria-hidden="true" />
      )}

      {activeTheme === "chaos" && (
        <div className="chaos-smoke-static" aria-hidden="true" />
      )}

      <p className="eyebrow">
        The QRystal Balls • {activeTheme.toUpperCase()}
      </p>

      <h1>
        ASK THE <span>ORACLE</span>
      </h1>

      <div
        className={`chaos-crystal ${busy ? "shaking" : ""}`}
        onClick={ask}
        role="button"
        tabIndex={0}
        aria-label="Ask the Chaos Oracle"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            ask();
          }
        }}
      >
        <img
          src="/themes/chaos-crystal-ball.png"
          alt="Chaotic magical crystal ball containing a swirling vortex"
          className="chaos-crystal-image"
        />

        <div className="chaos-pulse" aria-hidden="true">
          <div className="chaos-pulse-core" />
          <div className="chaos-pulse-ring" />
        </div>

        {answer && !busy && (
          <div className="chaos-crystal-answer">
            {answer}
          </div>
        )}

        {answer && !busy && (
          <div className="result chaos-answer-reveal">
            {answer}
          </div>
        )}
      </div>

      <div className="question">
        <input
          aria-label="Ask the Chaos Oracle a question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              ask();
            }
          }}
          placeholder="Ask a yes/no question..."
          maxLength={180}
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
        <div ref={answerRegionRef} className="result" role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>
          <span>THE ORACLE SAYS</span>
          <strong>{answer}</strong>
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
