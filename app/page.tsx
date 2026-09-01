import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="sparkle">✦</div>

      <p className="eyebrow">
        SCAN • ASK • SHAKE • DISCOVER
      </p>

      <h1>
        QR <span>ORACLE</span>
      </h1>

      <p className="lead">
        You have a question.
        <br />
        We have an answer.
      </p>

      <Link className="primary" href="/oracle?theme=classic">
        ASK THE ORACLE
      </Link>

      <div className="cards">

        <Link href="/oracle?theme=classic">
          <b>🔮</b>
          <span>Classic</span>
        </Link>

        <Link href="/oracle?theme=chaos">
          <b>🌀</b>
          <span>Chaos</span>
        </Link>

        <Link href="/oracle?theme=love">
          <b>❤️</b>
          <span>Love</span>
        </Link>

        <Link href="/oracle?theme=eclipse">
          <b>🌗</b>
          <span>Eclipse</span>
        </Link>

        <Link href="/oracle?theme=dnd">
          <b>🎲</b>
          <span>D&amp;D</span>
        </Link>

      </div>

      <p className="small">
        MVP • QR-powered interactive experiences
      </p>
    </main>
  );
}