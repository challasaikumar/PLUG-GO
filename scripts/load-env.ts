import { readFileSync } from "node:fs";
import path from "node:path";

function loadEnvFile(name: string) {
  try {
    const text = readFileSync(path.resolve(process.cwd(), name), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Optional local env files.
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
