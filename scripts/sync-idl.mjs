#!/usr/bin/env node
/**
 * Copy Anchor IDL JSON into lib/spectra/idl.ts for the Next.js client.
 * Run after: anchor build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "target/idl/spectra_vault.json");
const dst = path.join(root, "lib/spectra/idl.ts");

if (!fs.existsSync(src)) {
  console.error("Missing:", src, "\nRun anchor build first.");
  process.exit(1);
}

const idl = JSON.parse(fs.readFileSync(src, "utf8"));
const header = `import type { Idl } from "@coral-xyz/anchor";

/**
 * Synced from anchor build: target/idl/spectra_vault.json
 * Regenerate: node scripts/sync-idl.mjs
 */
`;
const body =
  "export const IDL = " +
  JSON.stringify(idl, null, 2) +
  " as unknown as Idl;\n\nexport type SpectraVault = Idl;\n";

fs.writeFileSync(dst, header + body);
console.log("Wrote", dst);
