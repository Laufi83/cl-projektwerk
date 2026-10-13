/**
 * Fließtext Wort für Wort einblenden (weich aus der Unschärfe nach oben), sobald er ins Bild kommt.
 * Reines Markup + CSS (globals.css, `.fx-w`), daher auch in Server-Komponenten nutzbar.
 * Auslöser: RevealObserver setzt `data-fx="in"`; mit `immediate` läuft die Animation beim Einhängen
 * (z. B. wenn ein Schritt oder Fokus wechselt und der Text per `key` neu erscheint).
 * Ohne JS, bei reduzierter Bewegung und im Schonmodus steht der Text sofort da.
 */
export function FxWords({ text, delay = 0, immediate = false, className }: { text: string; delay?: number; immediate?: boolean; className?: string }) {
  const parts = text.split(/(\s+)/);
  let i = 0;
  return (
    <span data-fx={immediate ? "in" : ""} className={`fx-words ${className ?? ""}`} style={delay ? { ["--fx-delay" as string]: `${delay}ms` } : undefined}>
      {parts.map((w, k) => (/^\s+$/.test(w) || !w ? w && " " : <span key={k} className="fx-w" style={{ ["--i" as string]: i++ }}>{w}</span>))}
    </span>
  );
}
