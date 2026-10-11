import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Alles außer API, Next-Interna, Medien und Dateien mit Endung
  matcher: ["/((?!api|_next|_vercel|media|hero|globe|brand|.*\\..*).*)"],
};
