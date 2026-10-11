// Für Pfade außerhalb der Sprachrouten (z. B. /foo.bar)
export default function GlobalNotFound() {
  return (
    <html lang="de">
      <body style={{ background: "#0a0a0b", color: "#f4efe6", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100svh", margin: 0 }}>
        <main style={{ textAlign: "center", padding: 24 }}>
          <p style={{ color: "#f26a1b", letterSpacing: ".2em", fontSize: 12 }}>404</p>
          <h1 style={{ fontSize: 32, margin: "12px 0" }}>Diese Seite gibt es nicht.</h1>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- außerhalb der Sprachrouten, ohne Router */}
          <a href="/" style={{ color: "#f26a1b" }}>Zur Startseite</a>
        </main>
      </body>
    </html>
  );
}
