/**
 * Safe backup presence check. Does not restore, drop, or overwrite any database.
 */
import "./load-env";
import { spawnSync } from "node:child_process";
import { getPngEnv, parseDatabaseHost } from "../src/lib/release/env";

const pngEnv = getPngEnv();
const url = process.env.DATABASE_URL?.trim() || "";
if (!url) {
  console.error("DATABASE_URL is not set. Backup check cannot run.");
  process.exitCode = 1;
} else {
  const host = parseDatabaseHost(url);
  const productionHost = process.env.PNG_PRODUCTION_DATABASE_HOST?.trim().toLowerCase();
  if (pngEnv !== "production" && productionHost && host === productionHost) {
    console.error("Refusing to run backup check against the production database host from a non-production environment.");
    process.exitCode = 1;
  } else {
    const dump = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
    if (dump.status !== 0) {
      console.error("pg_dump is not available. Install PostgreSQL client tools before scheduling backups.");
      process.exitCode = 1;
    } else {
      console.log(`OK backup tooling present (${dump.stdout.trim()}). Host=${host ?? "unknown"} env=${pngEnv}. Restore was not attempted.`);
    }
  }
}
