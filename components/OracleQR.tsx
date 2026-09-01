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
  "FUCK AROUND AND FIND OUT.",
  "ABSOLUTELY NOT. ARE YOU INSANE?",
  "THE CHAOS GODS APPROVE.",
  "YOU ALREADY KNOW.",
  "FUCK IT. WE ROLL.",
  "DO IT FOR THE PLOT.",
  "BAD IDEA. GREAT STORY.",
  "FULL SEND.",
  "SEND IT.",
  "YOU KNOW WHAT? FUCK IT.",
  "THIS SEEMS LIKE A TERRIBLE IDEA. DO IT.",
  "WHAT COULD POSSIBLY GO WRONG?",
  "WHAT COULD POSSIBLY GO WRONG? ...DON'T ANSWER THAT.",
  "YOU'RE ALREADY FUCKED. MIGHT AS WELL.",
  "EMBRACE THE CHAOS.",
  "ABSOLUTELY. REGRET IS PART OF THE EXPERIENCE.",
  "NOPE. RUN.",
  "THE CONSEQUENCES ARE FUTURE-YOU'S PROBLEM.",
  "THIS WILL EITHER BE AMAZING OR A COMPLETE DISASTER.",
  "MAYBE... BUT YOU'RE PROBABLY GOING TO DO IT ANYWAY.",
  "THE ORACLE REFUSES TO TAKE RESPONSIBILITY FOR THIS DECISION.",
  "CONSULT YOUR GOBLIN.",
  "THE COUNCIL OF BAD DECISIONS HAS VOTED.",
  "YOU HAVE MY CHAOTIC BLESSING.",
  "PROBABLY. WHAT'S THE WORST THAT COULD HAPPEN?",
  "NO. SAVE YOURSELF.",
  "YES. MAKE IT EVERYONE'S PROBLEM.",
  "CHAOS HAS ENTERED THE CHAT.",
  "THAT'S A TERRIBLE IDEA. I'M IN.",
  "WHY NOT? NORMAL IS OVERRATED.",
  "ROLL THE DICE AND BLAME THE ORACLE.",
  "I HAVE NO IDEA. DO IT ANYWAY.",
  "TODAY IS A GREAT DAY FOR QUESTIONABLE DECISIONS.",
  "THE UNIVERSE SAID 'LOL, SURE.'",
  "YOU SHOULDN'T. WHICH IS EXACTLY WHY YOU SHOULD.",
  "FUCK AROUND. FIND OUT. REPEAT.",
],

love: [
  "YES — SHOOT YOUR SHOT. ❤️",
  "WAIT A LITTLE LONGER.",
  "THE FEELING MAY BE MUTUAL.",
  "PROBABLY NOT.",
  "TEXT THEM. 📱",
  "THEY'RE THINKING ABOUT YOU.",
  "TAKE THE CHANCE.",
  "LOVE IS ON YOUR SIDE.",
  "THEY MAY FEEL THE SAME WAY.",
  "ABSOLUTELY. ❤️",
  "THE SIGNS ARE PROMISING.",
  "DON'T GIVE UP YET.",
  "MAKE THE FIRST MOVE.",
  "SOMETHING BEAUTIFUL MAY BE BEGINNING.",
  "TRUST YOUR HEART.",
  "THE CHEMISTRY IS REAL. 🔥",
  "THEY NOTICE YOU MORE THAN YOU THINK.",
  "BE BRAVE. TELL THEM HOW YOU FEEL.",
  "THIS COULD TURN INTO SOMETHING SPECIAL.",
  "YOU HAVE A REAL SHOT.",
  "LET IT DEVELOP NATURALLY.",
  "NOT YET. GIVE IT TIME.",
  "THE TIMING ISN'T RIGHT.",
  "FOLLOW YOUR HEART — BUT USE YOUR BRAIN.",
  "LOVE SOMETIMES NEEDS PATIENCE.",
  "DON'T CHASE WHAT WON'T CHOOSE YOU.",
  "IF THEY WANT YOU, THEY'LL SHOW YOU.",
  "SAY WHAT YOU'VE BEEN AFRAID TO SAY.",
  "A SURPRISE ROMANCE MAY BE CLOSER THAN YOU THINK.",
  "THE ORACLE SENSES SPARKS. ✨",
  "YOU'RE CLOSER THAN YOU REALIZE.",
  "THIS ONE MIGHT BE WORTH FIGHTING FOR.",
  "LET GO OF THE PAST.",
  "SOMEONE BETTER MAY BE COMING.",
  "YOUR HEART ALREADY KNOWS.",
  "DON'T IGNORE THE RED FLAGS. 🚩",
  "YOU DESERVE SOMEONE WHO CHOOSES YOU.",
  "THE NEXT MOVE IS THEIRS.",
  "TAKE A RISK — LOVE FAVORS THE BOLD.",
  "A SECOND CHANCE MAY BE POSSIBLE.",
  "THE STORY ISN'T OVER YET.",
  "PROTECT YOUR HEART.",
  "YOU MAY BE FALLING FOR EACH OTHER.",
  "IT'S COMPLICATED... BUT NOT HOPELESS.",
  "THE UNIVERSE IS PUSHING YOU TOGETHER. ✨",
  "LOVE IS ABOUT TO GET INTERESTING.",
  "DON'T OVERTHINK IT. JUST BE YOURSELF.",
  "SAY YES TO THE POSSIBILITY.",
  "WALK AWAY — YOUR HEART WILL THANK YOU.",
  "SOMETHING IS BEING HIDDEN.",
  "THE ANSWER WILL COME WHEN YOU STOP FORCING IT.",
  "YOUR NEXT CHAPTER LOOKS ROMANTIC. ❤️",
],

 eclipse: [
  // ☀️ LIGHT — 13
  "THE LIGHT FAVORS YOU.",
  "YES. WALK TOWARD IT.",
  "TRUST WHAT YOUR HEART ALREADY KNOWS.",
  "THE PATH AHEAD IS ILLUMINATED.",
  "TAKE THE CHANCE.",
  "YOUR TIME HAS COME.",
  "HOPE IS ON YOUR SIDE.",
  "FOLLOW THE OPEN DOOR.",
  "YOU HAVE NOTHING TO FEAR.",
  "THE SIGNS POINT TO YES.",
  "LET YOUR COURAGE LEAD YOU.",
  "THE STARS ALIGN IN YOUR FAVOR.",
  "STEP INTO THE LIGHT.",

  // 🌑 DARK — 13
  "NO. SOME DOORS SHOULD REMAIN CLOSED.",
  "WALK AWAY WHILE YOU STILL CAN.",
  "THE DARKNESS WARNS YOU.",
  "NOT EVERYTHING THAT CALLS YOU IS WORTH FOLLOWING.",
  "THE PRICE MAY BE GREATER THAN YOU THINK.",
  "TRUST YOUR DOUBTS.",
  "SOME TRUTHS ARE BETTER LEFT BURIED.",
  "THE SIGNS SAY NO.",
  "BE CAREFUL WHAT YOU WISH FOR.",
  "YOUR PATH IS NOT THIS WAY.",
  "THE SHADOWS SEE WHAT YOU CANNOT.",
  "TURN BACK BEFORE IT'S TOO LATE.",
  "STEP INTO THE DARKNESS — IF YOU DARE.",
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
const [dndRoll, setDndRoll] = useState(20);

const loveMusicRef = useRef<HTMLAudioElement | null>(null);
const dndMusicRef = useRef<HTMLAudioElement | null>(null);
const chaosMusicRef = useRef<HTMLAudioElement | null>(null);

async function ask() {
  if (!question.trim() || busy) return;

  setBusy(true);
  setAnswer("");

  // Move to the rolling screen
  if (theme === "love" || theme === "dnd") {
    setLovePage(2);
  }

  // Start D&D music after the user's button click
  if (theme === "dnd" && dndMusicRef.current) {
    dndMusicRef.current.currentTime = 0;
    dndMusicRef.current.volume = 0.45;

    try {
      await dndMusicRef.current.play();
    } catch (error) {
      console.log("D&D Oracle music could not autoplay:", error);
    }
  }

// Start Chaos music after the user's button click
if (theme === "chaos" && chaosMusicRef.current) {
  chaosMusicRef.current.currentTime = 0;
  chaosMusicRef.current.volume = 0.45;

  try {
    await chaosMusicRef.current.play();
  } catch (error) {
    console.log("Chaos Oracle music could not autoplay:", error);
  }
}

  // Start Love music after the user's button click
  if (theme === "love" && loveMusicRef.current) {
    loveMusicRef.current.currentTime = 0;
    loveMusicRef.current.volume = 0.45;

    try {
      await loveMusicRef.current.play();
    } catch (error) {
      console.log("Love Oracle music could not autoplay:", error);
    }
  }

  // Let the rolling animation play
  await new Promise((resolve) => setTimeout(resolve, 1800));

  // Choose the answer
 const list = byTheme[theme] || byTheme.classic;
const newAnswer =
  list[Math.floor(Math.random() * list.length)];

if (theme === "dnd") {
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
              {dndRoll}
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
     ECLIPSE ORACLE — LIGHT + DARK
     ========================================================= */

  if (theme === "eclipse") {
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
              <div className="eclipse-light-side" />
              <div className="eclipse-dark-side" />
              <div className="eclipse-core">
                <span>◐</span>
              </div>

              <div className="eclipse-crystal-glow" />
            </button>

            <p className="eclipse-instruction">
              Ask the Eclipse Oracle...
              <br />
              and discover which force answers.
            </p>

            {/* QUESTION */}

            <div className="eclipse-question-box">

              <input
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

            <div className="eclipse-crystal eclipse-crystal-awakening">

              <div className="eclipse-light-side" />
              <div className="eclipse-dark-side" />

              <div className="eclipse-core">
                <span>◐</span>
              </div>

              <div className="eclipse-crystal-glow" />

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

            <div className="eclipse-crystal eclipse-crystal-answer">

              <div className="eclipse-light-side" />
              <div className="eclipse-dark-side" />

              <div className="eclipse-core">
                <span>◐</span>
              </div>

              <div className="eclipse-crystal-glow" />

              <div className="eclipse-answer-overlay">
                {answer}
              </div>

            </div>

            <div className="eclipse-answer-card">

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
     EXISTING ORACLE EXPERIENCE — OTHER THEMES
     ========================================================= */
return (
  <main className={`oracle-page theme-${theme}`}>
<audio
  ref={chaosMusicRef}
  src="/themes/qoracle-chaos-theme.wav"
  preload="auto"
  loop
/>

    
    {theme === "chaos" && (
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
{theme === "chaos" && (
  <div
    className="chaos-lightning"
    aria-hidden="true"
  />
)}

{theme === "chaos" && (
  <div
    className="chaos-smoke-static"
    aria-hidden="true"
  />
)}

  
      <p className="eyebrow">
        QoRacle • {theme.toUpperCase()}
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
