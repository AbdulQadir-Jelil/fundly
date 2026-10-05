/**
 * Module resolution hook for the domain verifier.
 *
 * The app's source uses the `@/…` alias and extensionless imports because the
 * Next.js bundler resolves them. Node's ESM loader does neither, so this hook
 * teaches it both:
 *
 *   - `@/lib/date`  →  `<project root>/lib/date`
 *   - `@/lib/date`  →  `<project root>/lib/date.ts` (and .tsx, /index.ts)
 *
 * That keeps `npm run verify` working on a fresh clone with no extra setup.
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

/** Project root — this file lives in `<root>/scripts/`. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALIAS = "@/";
const EXTENSIONS = ["", ".ts", ".tsx", ".mts", "/index.ts", "/index.tsx"];

/** Resolves a path to a real file, trying each candidate extension. */
function firstExisting(basePath) {
  for (const extension of EXTENSIONS) {
    const candidate = `${basePath}${extension}`;
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // Try the next extension.
    }
  }
  return null;
}

/** @type {import("node:module").ResolveHook} */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(ALIAS)) {
    const resolved = firstExisting(path.join(ROOT, specifier.slice(ALIAS.length)));
    if (resolved) {
        return {
          url: pathToFileURL(resolved).href,
          shortCircuit: true,
          format: "module-typescript",
        };
      }
  }

  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isProjectPath =
      specifier.startsWith("./") ||
      specifier.startsWith("../") ||
      specifier.startsWith("/");

    if (!isProjectPath) throw error;

    const parentPath = context.parentURL
      ? path.dirname(fileURLToPath(context.parentURL))
      : ROOT;
    const resolved = firstExisting(path.resolve(parentPath, specifier));
    if (!resolved) throw error;

    return {
      url: pathToFileURL(resolved).href,
      shortCircuit: true,
      format: "module-typescript",
    };
  }
}
