 "use client";

import { useState } from "react";

const byTheme: Record<string, string[]> = {
  classic: ["YES.", "NO.", "ASK AGAIN.", "WITHOUT A DOUBT.", "VERY LIKELY.", "NOT TODAY."],
  chaos: ["ABSOLUTELY NOT. 😂", "DO IT. WHAT COULD GO WRONG?", "THE CHAOS GODS APPROVE.", "YOU ALREADY KNOW.", "MAYBE... IF YOU BRING SNACKS."],
  love: ["YES — SHOOT YOUR SHOT. ❤️", "WAIT A LITTLE LONGER.", "THE FEELING MAY BE MUTUAL.", "PROBABLY NOT.", "TEXT THEM. 📱"],
  dark: ["DON'T.", "YOU SHOULD HAVE ASKED SOONER.", "THE SIGNS ARE NOT GOOD.", "RUN.", "THE ORACLE REFUSES TO ANSWER. 👻"],
  dnd: ["ROLL FOR INITIATIVE. 🎲", "NAT 20. YES.", "CRITICAL FAIL.", "THE DUNGEON AWAITS.", "ASK YOUR DUNGEON MASTER."]
};

export default function OracleQR({ theme, code }: { theme: string; code: string }) {
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("");

  async function ask() {
    if (!question.trim() || busy) return;
    setBusy(true); setAnswer("");
    await new Promise(r => setTimeout(r, 1500));
    const list = byTheme[theme] || byTheme.classic;
    setAnswer(list[Math.floor(Math.random() * list.length)]);
    setBusy(false);
  }

  return (
    <main className={`oracle-page theme-${theme}`}>
{theme === "love" && (
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
)}
      <p className="eyebrow">QoRacle • {theme.toUpperCase()}</p>
      <h1>ASK THE <span>ORACLE</span></h1>
      <div className={`orb ${busy ? "shaking" : ""}`} onClick={ask}>
  <div className="orb-glow" />
  <div className="orb-shine" />

  {theme === "love" && (
    <div className="love-orb-hearts" aria-hidden="true">
      <span>♥</span>
      <span>♥</span>
      <span>♥</span>
      <span>♥</span>
    </div>
  )}

  <div className="window">
    <div className="triangle">
      <span>{answer || "?"}</span>
    </div>
  </div>
</div>
     <div className="question">
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a yes/no question..." />
        <button className="primary" onClick={ask} disabled={!question.trim() || busy}>
          {busy ? "CONSULTING..." : "SHAKE THE ORACLE"}
        </button>
      </div>
      {answer && !busy && <div className="result"><span>THE ORACLE SAYS</span><strong>{answer}</strong><button className="secondary" onClick={() => {setAnswer(""); setQuestion("")}}>ASK AGAIN</button></div>}
      <p className="small">QR: {code} • For entertainment only.</p>
    </main>
  );
}