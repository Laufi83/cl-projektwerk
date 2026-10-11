# CL Projektwerk – Render-Paket

Vollständiger Website-Quellcode mit vorhandenen Medien. Grundlage: GitHub-Zweig `render`, Commit `49516205320d8fff813e510bf927253e547932ec`, gesichert am 11.10.2026. Die Website-Dateien in `main` stimmen mit dieser Grundlage überein. Originalstände und kompletter Git-Verlauf liegen außerhalb dieses Ordners im Gesamtbackup.

## Lokal prüfen

Node.js 24.19.0 verwenden:

```text
npm ci --include=dev --no-audit --no-fund
npm run build:render
npm run test:render
npm run start:render
```

Die Produktionsvorschau startet auf Port 10000, sofern `PORT` nicht gesetzt ist. Das Entwicklungskommando bleibt `npm run dev`. Der Render-Build kopiert Bilder, Videos, Client-Bundles und OG-Schriften in das Standalone-Paket. Plattformabhängige Abhängigkeiten werden auf Render frisch für Linux installiert.

## Auf Render einrichten

1. **Nur den Inhalt dieses Ordners** als Quellcode eines GitHub-Zweigs verwenden. Alternativ den vorhandenen Zweig `render` aktualisieren und die zusätzlichen Dateien übernehmen. Backups, Git-Bundles, private Metadaten sowie ältere Verzeichnisse `app`, `website-vor-Projektwerk`, `.build-cache` und `deploy` gehören nicht in diesen Quellcode-Ordner. Einen vorhandenen generischen Workflow `.github/workflows/webpack.yml` durch `render-build.yml` ersetzen.
2. In Render einen Blueprint mit diesem Repository und dem gewünschten Zweig anlegen; `render.yaml` muss in dessen Wurzel liegen. Ein vorhandener Service mit demselben Namen kann beim Import aktualisiert werden – für eine getrennte Testinstanz vorher den Namen ändern.
3. Der Blueprint bereitet einen **kostenpflichtigen** Node-Webdienst in Frankfurt vor (`0.5c-512mb`). Plan und Kosten vor dem tatsächlichen Erstellen im Dashboard prüfen. Diese Sicherung hat keinen Service angelegt.
4. `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` und `MAIL_TO` im Dashboard ergänzen. Port 465 ist voreingestellt; für STARTTLS Port 587 gemäß Mailanbieter verwenden. Ohne diese Einrichtung weist das Kontaktformular Produktionsanfragen mit Status 503 zurück. `INQUIRY_DRY_RUN` in Produktion nicht setzen.
5. `NEXT_PUBLIC_SITE_URL` auf die gewünschte öffentliche URL setzen. Für eine Vorschau zunächst die konkrete `https://…onrender.com`-Adresse verwenden und danach neu bauen. Für die endgültige Domain wieder `https://www.cl-projektwerk.de` eintragen, Domain bei Render verbinden und DNS nach dessen angezeigten Vorgaben setzen.
6. Manuell deployen. Automatische Deployments sind ausgeschaltet. `NEXT_PUBLIC_INDEXING=false` bleibt wie im Original erhalten; Suchmaschinenfreigabe nach inhaltlicher Prüfung durch Umstellen auf `true` und Neubau.

Bei manueller Einrichtung eines **Web Service**:

| Einstellung | Wert |
| --- | --- |
| Runtime | Node |
| Root Directory | leer; Paket liegt im Repository-Stamm |
| Build Command | `npm ci --include=dev --no-audit --no-fund && npm run build:render` |
| Start Command | `npm run start:render` |
| Health Check | `/api/health` |
| Node-Version | `24.19.0` |
| Region | Frankfurt |

Render setzt `PORT` automatisch; der Start bindet an `0.0.0.0`. Die App benötigt einen Node-Server für Kontaktformular und dynamische Vorschaubilder. Der Render-Build nutzt den vorgesehenen persistenten Build-Cache unter `XDG_CACHE_HOME`; das ist kein Laufzeit-Datenspeicher. Es ist für diese App kein persistenter Datenträger eingerichtet. Der bestehende Anfrageversand läuft in Produktion per SMTP und speichert dort keine lokale Anfragekopie. Das vorhandene Rate-Limit ist pro Prozess und nicht für mehrere Instanzen gemeinsam ausgelegt.

## Enthaltene Optimierungen

- Kleine Standalone-Laufzeit; feste, lokal geprüfte Node-Version.
- Reproduzierbare Installation mit Lockdatei und ausdrücklicher Installation der Build-Abhängigkeiten.
- Vollständige Übernahme von `public`, `.next/static` und `assets/og` in das Laufzeitpaket.
- Next.js-Cache zwischen Render-Builds; bestehende Medien-Cacheheader bleiben erhalten.
- Sprachunabhängiger Healthcheck und automatischer Produktions-Smoke-Test inklusive fünf Videos und OG-Bild.
- Passender GitHub-Actions-Build statt des bisherigen generischen Webpack-Aufrufs mit ungeeigneten Node-Versionen.
- Keine Passwörter in diesem Paket; `.env.example` dokumentiert die benötigten Werte.

## Vor der Veröffentlichung offen

Der aktuelle Quellstand nennt in `src/config/site.ts` weiterhin netcup als Hosting-Anbieter. Diesen Eintrag und die zugehörigen Datenschutzhinweise vor einem echten Umzug zu Render anhand des tatsächlichen Vertrags und Setups aktualisieren. Das Backup ändert keine Geschäftsangaben oder Inhalte. Ein SMTP-Versand mit echten Zugangsdaten, Render-Linux-Build und Domain/DNS wurden nicht live ausgeführt. Der enthaltene Workflow prüft Build und Smoke-Test auf Linux beim späteren GitHub-Lauf.

## Dokumentation

- [Next.js auf Render](https://render.com/docs/deploy-nextjs-app)
- [Render-Blueprint-Schema](https://render.com/docs/blueprint-spec)
- [Node-Version festlegen](https://render.com/docs/node-version)
- [Free-Tarif: SMTP- und Leerlaufbeschränkungen](https://render.com/docs/free)
- [Next.js Standalone-Ausgabe](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)

Dokumentation am 11.10.2026 geprüft.
