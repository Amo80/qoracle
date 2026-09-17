"use client";

import Link from "next/link";

export function ErrorFallback({
  reset,
  title = "The Oracle lost the thread",
}: {
  reset?: () => void;
  title?: string;
}) {
  return (
    <main className="error-fallback">
      <section className="error-fallback__card" role="alert">
        <p className="error-fallback__eyebrow">THE QRYSTAL BALLS</p>
        <h1>{title}</h1>
        <p>Your visit is safe. Try this step again or return to the entrance.</p>
        <div className="error-fallback__actions">
          {reset && (
            <button type="button" onClick={reset}>
              TRY AGAIN
            </button>
          )}
          <Link href="/">RETURN HOME</Link>
        </div>
      </section>
    </main>
  );
}
