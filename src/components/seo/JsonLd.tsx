/** Strukturierte Daten; „<“ wird maskiert, damit kein `</script>` aus Daten die Ausgabe beenden kann. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
