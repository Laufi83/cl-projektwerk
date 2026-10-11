import { pathToFileURL } from "node:url";
import path from "node:path";

// Render supplies PORT. Its container hostname must not restrict the listener.
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT ||= "10000";
process.env.NODE_ENV = "production";
await import(pathToFileURL(path.resolve(".next/standalone/server.js")).href);
