"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  // Server errors expose only the framework reference. Client errors need a
  // readable message so failures on phones can be diagnosed without devtools.
  const detail = error.digest
    ? `Server error reference: ${error.digest}`
    : `${error.name || "Error"}: ${error.message || "Unknown client error"}`;

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#fff", color: "#18212b", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 480, margin: "15vh auto", padding: 24 }}>
          <h1 style={{ fontSize: 26 }}>This page couldn’t load</h1>
          <p>Please reload to try again.</p>
          <form>
            <button type="submit" style={{ minHeight: 44, padding: "10px 20px", borderRadius: 8, border: 0, background: "#18212b", color: "#fff", font: "inherit" }}>
              Reload
            </button>
          </form>
          <p>
            {/* Full navigation recovers even when the client router has crashed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/dashboard" style={{ color: "#1e5aa8" }}>Return to dashboard</a>
          </p>
          <details style={{ marginTop: 28 }}>
            <summary style={{ cursor: "pointer", padding: "12px 0" }}>Error details</summary>
            <p style={{ fontSize: 14 }}>Share these details when reporting the problem.</p>
            <pre translate="no" className="notranslate" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 13, padding: 16, background: "#f4f6f8", borderRadius: 8 }}>
              {detail.slice(0, 1000)}
            </pre>
          </details>
        </main>
      </body>
    </html>
  );
}
