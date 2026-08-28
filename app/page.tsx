import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="sparkle">✦</div>
      <p className="eyebrow">SCAN • ASK • SHAKE • DISCOVER</p>
      <h1>QR <span>ORACLE</span></h1>
      <p className="lead">You have a question.<br/>We have an answer.</p>
      <Link className="primary" href="/oracle">ASK THE ORACLE</Link>
      <div className="cards">
        <div><b>🔮</b><span>Classic</span></div>
        <div><b>😂</b><span>Chaos</span></div>
        <div><b>❤️</b><span>Love</span></div>
        <div><b>🎲</b><span>D&D</span></div>
      </div>
      <p className="small">MVP • QR-powered interactive experiences</p>
    </main>
  );
}