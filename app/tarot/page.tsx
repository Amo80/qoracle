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
  image?: string;
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
image: "/tarot/the-fool.png",
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
image: "/tarot/the-magician.png",
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
image: "/tarot/the-high-priestess.png",
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
image: "/tarot/the-empress.png",
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
image: "/tarot/the-emperor.png",
  },
{
  name: "THE HIEROPHANT",
  uprightKeywords: [
    "Tradition",
    "Guidance",
    "Wisdom",
    "Commitment",
  ],
  reversedKeywords: [
    "Rebellion",
    "Restriction",
    "Questioning Tradition",
    "Personal Beliefs",
  ],
  uprightMeaning:
    "Wisdom may already exist within a tradition, teacher, community, or system around you. The Hierophant asks you to learn from what has endured before deciding which path is truly yours.",
  reversedMeaning:
    "You may be questioning rules, expectations, or traditions that no longer fit. Respect what you have learned, but do not be afraid to choose a path based on your own values.",
  symbol: "📖",
  image: "/tarot/the-hierophant.png",
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
image: "/tarot/the-lovers.png",
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
image: "/tarot/the-chariot.png",
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
image: "/tarot/strength.png",
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
image: "/tarot/the-hermit.png",
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
image: "/tarot/wheel-of-fortune.png",
  },
{
  name: "JUSTICE",
  uprightKeywords: [
    "Fairness",
    "Truth",
    "Balance",
    "Accountability",
  ],
  reversedKeywords: [
    "Dishonesty",
    "Bias",
    "Avoidance",
    "Unfairness",
  ],
  uprightMeaning:
    "Truth and balance matter here. Justice asks you to look clearly at the facts, take responsibility for your choices, and make the decision that can stand up to honest examination.",
  reversedMeaning:
    "Something may be out of balance or being judged unfairly. Hidden motives, avoidance, or refusal to accept responsibility could be influencing the situation.",
  symbol: "⚖️",
  image: "/tarot/justice.png",
},

{
  name: "THE HANGED MAN",
  uprightKeywords: [
    "Surrender",
    "New Perspective",
    "Patience",
    "Letting Go",
  ],
  reversedKeywords: [
    "Stagnation",
    "Resistance",
    "Delay",
    "Fear of Change",
  ],
  uprightMeaning:
    "The answer may come from seeing this situation differently rather than forcing it forward. Pause, surrender what you cannot control, and allow a new perspective to reveal what you have been missing.",
  reversedMeaning:
    "You may be holding onto something because letting go feels uncomfortable. Resistance could be keeping you suspended in a situation that is ready to change.",
  symbol: "🙃",
  image: "/tarot/the-hanged-man.png",
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
image: "/tarot/death.png",
  },

{
  name: "TEMPERANCE",
  uprightKeywords: [
    "Balance",
    "Harmony",
    "Moderation",
    "Patience",
  ],
  reversedKeywords: [
    "Imbalance",
    "Excess",
    "Impatience",
    "Lack of Direction",
  ],
  uprightMeaning:
    "Balance is the key to moving forward. Temperance asks you to combine patience, moderation, and thoughtful action rather than pushing toward extremes.",
  reversedMeaning:
    "Something has fallen out of balance. Too much, too little, or moving too quickly may be creating unnecessary difficulty. Find your center before continuing.",
  symbol: "⚗️",
  image: "/tarot/temperance.png",
},

{
  name: "THE DEVIL",
  uprightKeywords: [
    "Attachment",
    "Addiction",
    "Materialism",
    "Control",
  ],
  reversedKeywords: [
    "Freedom",
    "Awareness",
    "Breaking Chains",
    "Reclaiming Power",
  ],
  uprightMeaning:
    "Something may have more control over you than you realize. The Devil asks you to recognize the attachments, habits, fears, or desires that are keeping you bound.",
  reversedMeaning:
    "The chains are beginning to loosen. Awareness gives you the power to break unhealthy patterns, reclaim your choices, and free yourself from what has been controlling you.",
  symbol: "😈",
  image: "/tarot/the-devil.png",
},

{
  name: "THE TOWER",
  uprightKeywords: [
    "Sudden Change",
    "Revelation",
    "Breakthrough",
    "Upheaval",
  ],
  reversedKeywords: [
    "Avoiding Disaster",
    "Fear of Change",
    "Resistance",
    "Delayed Upheaval",
  ],
  uprightMeaning:
    "Something may change suddenly, but the disruption is revealing what was never as stable as it appeared. The Tower clears away what can no longer stand so something stronger can eventually take its place.",
  reversedMeaning:
    "You may sense that change is coming and be trying to prevent it. Resistance can delay the disruption, but it may also delay the breakthrough waiting on the other side.",
  symbol: "⚡",
  image: "/tarot/the-tower.png",
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
image: "/tarot/the-star.png",
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
image: "/tarot/the-moon.png",
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
image: "/tarot/the-sun.png",
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
image: "/tarot/judgement.png",
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
image: "/tarot/the-world.png",
  },
];

export default function TarotPage() {
  const [started, setStarted] = useState(false);
  const [selectedCard, setSelectedCard] =
    useState<TarotCard | null>(null);
const [chosenCard, setChosenCard] = useState<number | null>(null);

  const [reversed, setReversed] = useState(false);
  const [revealed, setRevealed] = useState(false);

 function drawCard(cardIndex: number) {
  if (chosenCard !== null) return;

  setChosenCard(cardIndex);

  const randomCard =
    tarotCards[
      Math.floor(Math.random() * tarotCards.length)
    ];

  const isReversed = Math.random() < 0.3;

  setRevealed(false);

  // Give the chosen card time to glow
  // while the other two fade away.
  setTimeout(() => {
    setSelectedCard(randomCard);
    setReversed(isReversed);

    setTimeout(() => {
      setRevealed(true);
    }, 450);
  }, 900);
}  function resetReading() {
    setSelectedCard(null);
setChosenCard(null);
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
                className={`tarot-card-back tarot-card-${card + 1} ${
  chosenCard === null
    ? ""
    : chosenCard === card
      ? "tarot-card-chosen"
      : "tarot-card-dismissed"
}`}
                onClick={() => drawCard(card)}
                aria-label={`Choose tarot card ${card + 1}`}
              >
               <img
  src="/tarot/card-back.png"
  alt="The QRystal Balls tarot card back"
  className="tarot-card-back-art"
/>
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

              {selectedCard.image ? (
  <img
    src={selectedCard.image}
    alt={selectedCard.name}
    className="tarot-result-art"
  />
) : (
  <div className="tarot-result-symbol">
    {selectedCard.symbol}
  </div>
)}

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