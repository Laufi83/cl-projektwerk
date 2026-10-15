# CL-Projektwerk – FreeLLMAPI (Windows + Claude Code + Next.js)

> Integration für **private Entwicklungstests**, standardmäßig ausgeschaltet. Der Quellcode des Routers und die Lizenz-/Nutzungsbedingungen seiner Provider sind unabhängig zu prüfen. FreeLLMAPI beschreibt seine kostenlose Kontingent-Aggregation als "personal experimentation only".

## 1. Windows vorbereiten

1. Installiere Node.js **24.19 oder neuer innerhalb der 24er-Reihe** für CL-Projektwerk.
2. FreeLLMAPI ausschließlich aus den offiziellen [GitHub Releases](https://github.com/tashfeenahmed/freellmapi/releases) laden, Windows-.exe installieren.
3. Desktop-App starten; Oberfläche: `http://localhost:3001`.
4. Unter **Keys** die persönlichen Provider-Schlüssel hinterlegen und den **Unified API Key** kopieren. Diesen niemals in GitHub eintragen.
5. In PowerShell prüfen:
   ```powershell
   node --version
   npm --version
   Invoke-WebRequest http://localhost:3001/v1/models -Headers @{Authorization="Bearer DEIN_UNIFIED_KEY"}
   ```

## 2. Claude Code

In PowerShell (den Platzhalter ersetzen):

```powershell
npx freellmapi setup-claude --url http://localhost:3001 --api-key "DEIN_UNIFIED_KEY" --dry-run
npx freellmapi setup-claude --url http://localhost:3001 --api-key "DEIN_UNIFIED_KEY"
cd "C:\\Users\\panda\\OneDrive\\Desktop\\fairnet bewerbung\\webseite"
claude
```

Hinweis: Das Setup kann die Claude-Code-Konfiguration verändern; den Dry-Run zuerst prüfen. Die Dokumentation nennt auch `npx freellmapi launch` als Alternative ohne dauerhafte Ablage des Schlüssels in der Claude-Konfiguration. Bei bestehender Claude-Anmeldung Einstellungen vor Übernahme prüfen.

## 3. CL-Projektwerk lokal starten

```powershell
git clone https://github.com/Laufi83/cl-projektwerk.git
cd cl-projektwerk
git fetch origin
git checkout feature/freellmapi-private-integration
npm ci
Copy-Item .env.freellmapi.example .env.local
```

Die Datei `.env.local` editieren: Unified-Key und einen **zusätzlichen langen geheimen Test-Zugangsschlüssel** eintragen. Für lokale Tests `CL_AI_ENABLED=true` setzen.

```powershell
npm run dev
$secret = Read-Host "CL_AI_ACCESS_TOKEN"
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/internal/ai/chat" -Headers @{Authorization="Bearer $secret"} -ContentType "application/json" -Body '{"prompt":"Nenne drei Punkte für die Planung eines Messestands."}'
```

Die App kann abhängig vom vorhandenen Port auch eine andere Adresse anzeigen; die Test-URL dann anpassen.

## 4. Warum der Router nicht direkt auf Render erreichbar ist

`localhost:3001` verweist auf **den jeweiligen Rechner** – auf Render also nicht auf deinen Windows-PC. Lass `CL_AI_ENABLED` auf Render **false**, solange du keinen separat bereitgestellten, abgesicherten HTTPS-Router mit passender Provider-/Produktionsberechtigung hast.

Für eine spätere Live-Freigabe: extern erreichbar bereitgestellter Gateway über HTTPS, serverseitige Umgebungsvariablen in Render, pro Benutzer authentifizierte Requests, verteilte Rate-Limits, Budgetgrenzen, Missbrauchsschutz, Datenschutzprüfung und verifizierte gewerbliche Nutzungsrechte. Den internen Endpunkt nicht als öffentlichen Chat verwenden.

## 5. API-Vertrag

`POST /api/internal/ai/chat`
Header: `Authorization: Bearer <CL_AI_ACCESS_TOKEN>`, `Content-Type: application/json`
Body: `{"prompt":"..." }`
Erfolg: `{"answer":"...","model":"auto"}`

Einfaches Test-Backend ohne Nutzeroberfläche; die Seite bleibt unverändert. API-Key und Test-Zugangsschlüssel niemals in browserseitigen `NEXT_PUBLIC_*`-Variablen hinterlegen.

## 6. Rollback

Im Entwicklungszweig: `CL_AI_ENABLED=false` oder `git checkout main`. Auf Render wird durch die Erstellung des Branches nichts automatisch veröffentlicht.
