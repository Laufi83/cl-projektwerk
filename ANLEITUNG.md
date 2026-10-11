# CL Projektwerk – zwei neue Videos

Die Website-Quellcodeänderungen sind im GitHub-Branch `feature/leistungen-skizze-scroll-hero-20261011` vorbereitet.

## Dateien für den GitHub-Upload

Dieses ZIP enthält (im richtigen Zielordner):

- `public/media/custom/skizze-animation.mp4` – 13,5 Sekunden, Leistungskarte „Entwurf & Präsentation“.
- `public/media/custom/homepage-scroll-build.mp4` – 10 Sekunden, wird auf der Startseite mit der Scrollposition vor- und zurückgespult.

Beide sind H.264-MP4-Dateien für Browser. Der zweite Film wurde für flüssigeres Scrollen auf kurze Keyframe-Abstände (0,5 s) neu kodiert und von 9,8 auf 4,1 MB reduziert. Beide MP4-Dateien sind für schnellen Seitenabruf (`faststart`) optimiert.

## Dateien ins Repository hochladen

1. GitHub aufrufen und als `Laufi83` anmelden.
2. Den Branch `feature/leistungen-skizze-scroll-hero-20261011` wählen.
3. Im Repository nach `public/media/custom/` wechseln (Ordner ist im Branch angelegt).
4. Beide MP4-Dateien aus diesem ZIP mit **Add file → Upload files** in genau diesen Ordner hochladen.
5. Mit **Commit changes** in denselben Feature-Branch speichern.
6. Danach den Pull Request des Video-Einbaus prüfen, GitHub-Actions-Build abwarten und mergen.
7. Render-Deployment manuell auslösen: laut `render.yaml` ist automatisches Deployment ausgeschaltet.

**Warum dieser Upload nötig ist:** Die angebundene GitHub-Schnittstelle erlaubt hier das Schreiben von Textdateien (TSX usw.), aber keinen direkten Upload von mehrmegabytegroßen MP4-Binärdateien aus dem Chat. Die Website verwendet daher bis zur Ablage des neuen Hero-Videos die bereits vorhandene Bildsequenz als Fallback. Die Leistungskarte zeigt ihr vorhandenes Poster, wenn ihre MP4 noch nicht vorliegt.

## Verhalten

- *Leistungen → Entwurf & Präsentation:* spielt die Skizzenanimation automatisch, stumm und in Schleife, sobald der Bereich sichtbar ist.
- *Startseite:* Baustellenvideo wird framegenau gemäß Scrollfortschritt (auch beim Zurückscrollen) gesucht; vorhandene WebP-Frame-Sequenz bleibt Fallback, falls MP4 fehlt oder im Browser nicht geladen werden kann.
- Bei Browser-/OS-Einstellung „Bewegung reduzieren“ bleibt der bisherige ruhige Fallback bestehen.

Nach dem Upload empfiehlt sich ein Test in Safari/iPhone sowie Chrome/Windows. MP4-Seeking ist je nach Browser und Gerät unterschiedlich flüssig; bei Bedarf lässt sich später auch eine WebP-Sequenz der neuen Videos erzeugen.
