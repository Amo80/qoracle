import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-fallback">
      <section className="error-fallback__card">
        <p className="error-fallback__eyebrow">THE QRYSTAL BALLS</p>
        <h1>This path has vanished</h1>
        <p>The page or QR artifact could not be found.</p>
        <div className="error-fallback__actions">
          <Link href="/">RETURN HOME</Link>
        </div>
      </section>
    </main>
  );
}
