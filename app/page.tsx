import Link from "next/link";

export default function Home() {
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

      <Link
        className="primary"
        href="/oracle?theme=jester"
      >
        🔮 ASK THE ORACLE
      </Link>

      <p className="tagline">
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

      <p className="small">
        Ask anything. Fate decides the rest.
      </p>

    </main>
  );
}