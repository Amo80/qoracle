 "use client";

import { useMemo, useState } from "react";

const answers = [
  "YES.",
  "NO.",
  "ABSOLUTELY.",
  "NOT TODAY.",
  "ASK AGAIN.",
  "THE SIGNS SAY YES.",
  "THE SIGNS SAY NO.",
  "PROBABLY.",
  "DON'T COUNT ON IT.",
  "WITHOUT A DOUBT.",
  "YOU ALREADY KNOW THE ANSWER.",
  "THE ORACLE IS UNCERTAIN.",
  "TRY AGAIN LATER.",
  "VERY LIKELY.",
  "HIGHLY UNLIKELY.",
  "THE FUTURE LOOKS BRIGHT.",
  "PROCEED WITH CAUTION.",
  "WHY ARE YOU ASKING ME? 😂",
  "ROLL FOR INITIATIVE. 🎲",
  "CHAOS HAS DECIDED: YES."
];

export default function Oracle() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [shaking, setShaking] = useState(false);
  const [count, setCount] = useState(0);

  const placeholder = useMemo(() => {
    const p = [
      "Should I buy that car?",
      "Will I get lucky today?",
      "Should I text them?",
      "Is this a good idea?"
    ];
    return p[count % p.length];
  }, [count]);

  async function ask() {
    if (!question.trim() || shaking) return;
    setShaking(true);
    setAnswer("");
    await new Promise(r => setTimeout(r, 1600));
    const next = answers[Math.floor(Math.random() * answers.length)];
    setAnswer(next);
    setCount(c => c + 1);
    setShaking(false);
  }

  return (
    <main className="oracle-page">
      <a className="back" href="/">← QoRacle</a>
      <p className="eyebrow">THINK OF A YES / NO QUESTION</p>
      <h1>CONSULT THE <span>ORACLE</span></h1>

      <div className={`orb ${shaking ? "shaking" : ""}`} onClick={ask} role="button" aria-label="Ask the Oracle">
        <div className="orb-shine" />
        <div className="window">
          <div className="triangle">
            <span>{answer || "?"}</span>
          </div>
        </div>
      </div>

      <div className="question">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") ask(); }}
          placeholder={placeholder}
          maxLength={180}
        />
        <button className="primary" onClick={ask} disabled={shaking || !question.trim()}>
          {shaking ? "CONSULTING..." : "SHAKE THE ORACLE"}
        </button>
      </div>

      {answer && !shaking && (
        <div className="result">
          <span>THE ORACLE SAYS</span>
          <strong>{answer}</strong>
          <button className="secondary" onClick={() => setQuestion("")}>ASK ANOTHER</button>
        </div>
      )}

      <p className="small">For entertainment only. The Oracle is not responsible for questionable decisions.</p>
    </main>
  );
}