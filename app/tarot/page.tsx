"use client";

import { useState } from "react";
import Link from "next/link";

type TarotCard = {
  name: string;
  uprightKeywords: string[];
  reversedKeywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  symbol: string;
};

const tarotCards: TarotCard[] = [
  {
    name: "THE FOOL",
    uprightKeywords: [
      "New Beginnings",
      "Freedom",
      "Adventure",
      "Possibility",
    ],
    reversedKeywords: [
      "Recklessness",
      "Fear",
      "Poor Timing",
      "Hesitation",
    ],
    uprightMeaning:
      "A new path is opening before you. You may not know where it leads yet, and that is part of the invitation. Trust yourself enough to take the first step.",
    reversedMeaning:
      "Something may be urging you forward before you are truly ready. Slow down, look at what you may be overlooking, and make sure courage is not turning into recklessness.",
    symbol: "🌙",
  },

  {
    name: "THE MAGICIAN",
    uprightKeywords: [
      "Power",
      "Manifestation",
      "Skill",
      "Opportunity",
    ],
    reversedKeywords: [
      "Manipulation",
      "Blocked Energy",
      "Doubt",
      "Untapped Potential",
    ],
    uprightMeaning:
      "You already have more of what you need than you realize. The Magician asks you to stop waiting for permission and begin using the tools already in your hands.",
    reversedMeaning:
      "Your ability is still there, but something is interfering with it. Doubt, distraction, or another person's influence may be pulling you away from your real power.",
    symbol: "✨",
  },

  {
    name: "THE HIGH PRIESTESS",
    uprightKeywords: [
      "Intuition",
      "Mystery",
      "Inner Knowing",
      "Secrets",
    ],
    reversedKeywords: [
      "Hidden Truth",
      "Confusion",
      "Disconnection",
      "Ignored Intuition",
    ],
    uprightMeaning:
      "You already sense the answer beneath the surface. Do not rush to explain everything logically. There is information available to you through instinct, silence, and observation.",
    reversedMeaning:
      "Something important is being ignored or hidden. You may be talking yourself out of what your instincts have already been trying to tell you.",
    symbol: "🌌",
  },

  {
    name: "THE EMPRESS",
    uprightKeywords: [
      "Abundance",
      "Creation",
      "Love",
      "Growth",
    ],
    reversedKeywords: [
      "Neglect",
      "Dependence",
      "Creative Block",
      "Insecurity",
    ],
    uprightMeaning:
      "Growth is surrounding this situation. The Empress encourages you to nurture what matters, allow good things to develop naturally, and receive rather than constantly force.",
    reversedMeaning:
      "You may be giving too much while leaving yourself depleted. Something needs nourishment, but that includes you.",
    symbol: "🌹",
  },

  {
    name: "THE EMPEROR",
    uprightKeywords: [
      "Authority",
      "Structure",
      "Control",
      "Leadership",
    ],
    reversedKeywords: [
      "Rigidity",
      "Domination",
      "Loss of Control",
      "Stubbornness",
    ],
    uprightMeaning:
      "This situation benefits from structure and decisive action. Set boundaries, make the plan, and take responsibility for what happens next.",
    reversedMeaning:
      "Control may be becoming the problem rather than the solution. Ask whether firmness is helping the situation or simply preventing change.",
    symbol: "👑",
  },

  {
    name: "THE LOVERS",
    uprightKeywords: [
      "Connection",
      "Choice",
      "Alignment",
      "Love",
    ],
    reversedKeywords: [
      "Disharmony",
      "Temptation",
      "Misalignment",
      "Difficult Choice",
    ],
    uprightMeaning:
      "A meaningful connection or important choice sits at the center of your question. Choose what aligns with your values rather than what is merely easiest.",
    reversedMeaning:
      "Something may look right while feeling wrong underneath. Pay attention to imbalance, mixed intentions, or choices being made for the wrong reasons.",
    symbol: "❤️",
  },

  {
    name: "THE CHARIOT",
    uprightKeywords: [
      "Victory",
      "Momentum",
      "Determination",
      "Direction",
    ],
    reversedKeywords: [
      "Delay",
      "Loss of Direction",
      "Aggression",
      "Obstacle",
    ],
    uprightMeaning:
      "Momentum is building. Decide where you are going, hold the direction, and keep moving despite competing pressures around you.",
    reversedMeaning:
      "Force alone will not solve this. You may need to regain direction before pushing harder.",
    symbol: "⚡",
  },

  {
    name: "STRENGTH",
    uprightKeywords: [
      "Courage",
      "Patience",
      "Confidence",
      "Inner Power",
    ],
    reversedKeywords: [
      "Self-Doubt",
      "Weakness",
      "Insecurity",
      "Fear",
    ],
    uprightMeaning:
      "Your advantage is not brute force. Calm confidence, patience, and emotional control will carry you farther than confrontation.",
    reversedMeaning:
      "Fear may be making you underestimate yourself. The strength you need has not disappeared; you may simply have stopped trusting it.",
    symbol: "🦁",
  },

  {
    name: "THE HERMIT",
    uprightKeywords: [
      "Reflection",
      "Wisdom",
      "Solitude",
      "Guidance",
    ],
    reversedKeywords: [
      "Isolation",
      "Withdrawal",
      "Loneliness",
      "Avoidance",
    ],
    uprightMeaning:
      "The answer may not come from outside opinions. Create enough quiet to hear your own judgment clearly.",
    reversedMeaning:
      "Time alone may have turned into avoidance. Reflection is useful, but eventually you must return to the world and act.",
    symbol: "🏮",
  },

  {
    name: "WHEEL OF FORTUNE",
    uprightKeywords: [
      "Change",
      "Luck",
      "Cycles",
      "Destiny",
    ],
    reversedKeywords: [
      "Setback",
      "Bad Timing",
      "Resistance",
      "Unfinished Cycle",
    ],
    uprightMeaning:
      "Conditions are changing, possibly faster than expected. Stay adaptable because an unexpected turn may work in your favor.",
    reversedMeaning:
      "The cycle is turning, but not quite the way you hoped. Fighting the change may make it harder than accepting what must shift.",
    symbol: "🎡",
  },

  {
    name: "DEATH",
    uprightKeywords: [
      "Transformation",
      "Ending",
      "Transition",
      "Rebirth",
    ],
    reversedKeywords: [
      "Resistance",
      "Stagnation",
      "Fear of Change",
      "Holding On",
    ],
    uprightMeaning:
      "Something has reached the end of its current form. That does not necessarily mean loss; it means space is being created for what comes next.",
    reversedMeaning:
      "You may already know something needs to change but continue holding onto it. The longer the ending is resisted, the longer the next chapter waits.",
    symbol: "🥀",
  },

  {
    name: "THE STAR",
    uprightKeywords: [
      "Hope",
      "Renewal",
      "Healing",
      "Inspiration",
    ],
    reversedKeywords: [
      "Discouragement",
      "Doubt",
      "Disconnection",
      "Lost Hope",
    ],
    uprightMeaning:
      "There is reason to hope. Even if the full outcome is not visible yet, conditions are moving toward renewal and greater clarity.",
    reversedMeaning:
      "You may be focusing so heavily on what went wrong that you cannot yet see what is still possible.",
    symbol: "⭐",
  },

  {
    name: "THE MOON",
    uprightKeywords: [
      "Illusion",
      "Intuition",
      "Uncertainty",
      "Dreams",
    ],
    reversedKeywords: [
      "Truth Revealed",
      "Clarity",
      "Fear Released",
      "Exposure",
    ],
    uprightMeaning:
      "Everything is not what it appears to be. Move carefully and trust your instincts until more information becomes visible.",
    reversedMeaning:
      "Confusion is beginning to clear. Something concealed may soon become easier to understand.",
    symbol: "🌕",
  },

  {
    name: "THE SUN",
    uprightKeywords: [
      "Success",
      "Joy",
      "Clarity",
      "Confidence",
    ],
    reversedKeywords: [
      "Delay",
      "Temporary Sadness",
      "Overconfidence",
      "Clouded Success",
    ],
    uprightMeaning:
      "This is one of the strongest signs of positive momentum. Clarity, confidence, and a favorable outcome are surrounding your question.",
    reversedMeaning:
      "The positive outcome may still be available, but something is temporarily obscuring it. Do not mistake a delay for a defeat.",
    symbol: "☀️",
  },

  {
    name: "JUDGEMENT",
    uprightKeywords: [
      "Awakening",
      "Decision",
      "Calling",
      "Rebirth",
    ],
    reversedKeywords: [
      "Self-Doubt",
      "Avoidance",
      "Regret",
      "Indecision",
    ],
    uprightMeaning:
      "A decision can no longer be postponed. Something is asking you to rise beyond an older version of yourself and answer the call.",
    reversedMeaning:
      "You may already know what decision needs to be made but fear the consequences of making it.",
    symbol: "📯",
  },

  {
    name: "THE WORLD",
    uprightKeywords: [
      "Completion",
      "Achievement",
      "Wholeness",
      "Success",
    ],
    reversedKeywords: [
      "Unfinished Business",
      "Delay",
      "Lack of Closure",
      "Incomplete Goal",
    ],
    uprightMeaning:
      "A cycle is reaching successful completion. What you have been working toward may finally be ready to come together.",
    reversedMeaning:
      "You are close, but something remains unfinished. Find the missing piece instead of abandoning the journey.",
    symbol: "🌍",
  },
];

export default function TarotPage() {
  const [started, setStarted] = useState(false);
  const [selectedCard, setSelectedCard] =
    useState<TarotCard | null>(null);

  const [reversed, setReversed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function drawCard() {
    const randomCard =
      tarotCards[
        Math.floor(Math.random() * tarotCards.length)
      ];

    const isReversed = Math.random() < 0.3;

    setSelectedCard(randomCard);
    setReversed(isReversed);
    setRevealed(false);

    setTimeout(() => {
      setRevealed(true);
    }, 450);
  }

  function resetReading() {
    setSelectedCard(null);
    setReversed(false);
    setRevealed(false);
  }

  return (
    <main className="tarot-page">

      <div
        className="tarot-mist tarot-mist-one"
        aria-hidden="true"
      />

      <div
        className="tarot-mist tarot-mist-two"
        aria-hidden="true"
      />

      <Link
        href="/"
        className="tarot-home-link"
      >
        ← THE QRYSTAL BALLS
      </Link>

      {!started && (
        <section className="tarot-intro">

          <p className="tarot-eyebrow">
            THE QRYSTAL BALLS PRESENTS
          </p>

          <div className="tarot-intro-symbol">
            🃏
          </div>

          <h1>
            PICK A <span>CARD</span>
          </h1>

          <h2>
            THE CARDS ALREADY KNOW
          </h2>

          <p className="tarot-intro-copy">
            Think of your question.
            <br />
            Don't type it.
            <br />
            Don't say it.
            <br />
            Just hold it in your mind.
          </p>

          <button
            type="button"
            className="tarot-begin-button"
            onClick={() => setStarted(true)}
          >
            ✦ BEGIN THE READING ✦
          </button>

          <p className="tarot-whisper">
            When you're ready, fate will deal the cards.
          </p>

        </section>
      )}

      {started && !selectedCard && (
        <section className="tarot-choice">

          <p className="tarot-eyebrow">
            THE READING HAS BEGUN
          </p>

          <h1>
            CHOOSE THE CARD
            <span> THAT CALLS TO YOU</span>
          </h1>

          <p className="tarot-choice-copy">
            Hold your question in your mind.
            <br />
            There is no wrong choice.
          </p>

          <div className="tarot-card-row">

            {[0, 1, 2].map((card) => (
              <button
                type="button"
                key={card}
                className={`tarot-card-back tarot-card-${card + 1}`}
                onClick={drawCard}
                aria-label={`Choose tarot card ${card + 1}`}
              >
                <div className="tarot-card-border">
                  <span className="tarot-card-star">
                    ✦
                  </span>

                  <span className="tarot-card-moon">
                    ☾
                  </span>

                  <span className="tarot-card-orb">
                    🔮
                  </span>

                  <span className="tarot-card-moon tarot-card-moon-bottom">
                    ☽
                  </span>

                  <span className="tarot-card-star tarot-card-star-bottom">
                    ✦
                  </span>
                </div>
              </button>
            ))}

          </div>

          <p className="tarot-choice-hint">
            Tap the one you feel drawn to.
          </p>

        </section>
      )}

      {selectedCard && (
        <section className="tarot-result">

          <p className="tarot-eyebrow">
            YOUR CARD HAS SPOKEN
          </p>

          <div
            className={`tarot-reveal-card ${
              revealed ? "tarot-revealed" : ""
            }`}
          >

            <div
              className={`tarot-card-front ${
                reversed ? "is-reversed" : ""
              }`}
            >

              <div className="tarot-result-number">
                ✦
              </div>

              <div className="tarot-result-symbol">
                {selectedCard.symbol}
              </div>

              <div className="tarot-result-stars">
                ✦ ✧ ✦
              </div>

              <strong>
                {selectedCard.name}
              </strong>

            </div>

          </div>

          <div
            className={`tarot-reading ${
              revealed ? "show" : ""
            }`}
          >

            <p className="tarot-orientation">
              {reversed ? "REVERSED" : "UPRIGHT"}
            </p>

            <h1>
              {selectedCard.name}
            </h1>

            <div className="tarot-keywords">

              {(reversed
                ? selectedCard.reversedKeywords
                : selectedCard.uprightKeywords
              ).map((keyword) => (
                <span key={keyword}>
                  {keyword}
                </span>
              ))}

            </div>

            <p className="tarot-meaning">
              {reversed
                ? selectedCard.reversedMeaning
                : selectedCard.uprightMeaning}
            </p>

            <div className="tarot-result-actions">

              <button
                type="button"
                className="tarot-draw-again"
                onClick={resetReading}
              >
                🃏 DRAW ANOTHER CARD
              </button>

              <Link
                href="/oracle?theme=jester"
                className="tarot-oracle-button"
              >
                🔮 ASK THE ORACLE
              </Link>

            </div>

          </div>

        </section>
      )}

    </main>
  );
}