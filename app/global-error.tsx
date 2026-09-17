"use client";

import { useEffect } from "react";
import { logError } from "@/lib/observability/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { boundary: "global", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="global-error">
        <main>
          <h1>The QRystal Balls need a moment</h1>
          <p>Your order and account data have not been changed.</p>
          <button type="button" onClick={reset}>
            TRY AGAIN
          </button>
        </main>
      </body>
    </html>
  );
}
