/**
 * Load env when the engine is started from `engine/` while secrets live in the
 * monorepo root (e.g. `Axiom/.env.local`).
 */
import { config as loadDotenv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const engineDir = path.resolve(__dirname, "..");
const repoDir = path.resolve(engineDir, "..");

// Load repo-level env first as shared defaults...
for (const p of [path.join(repoDir, ".env"), path.join(repoDir, ".env.local")]) {
  if (fs.existsSync(p)) loadDotenv({ path: p });
}

// ...then let engine-local env win for engine-critical settings.
for (const p of [
  path.join(engineDir, ".env"),
  path.join(engineDir, ".env.local"),
]) {
  if (fs.existsSync(p)) loadDotenv({ path: p, override: true });
}
