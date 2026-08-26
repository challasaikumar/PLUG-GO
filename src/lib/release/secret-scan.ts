/**
 * Secret-pattern scan for committed files. Does not read .env, .env.local, or data directories.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SKIP_DIR = new Set([
  "node_modules",
  ".git",
  ".next",
  ".postgres-data",
  "coverage",
  "dist",
]);

const SKIP_FILE = new Set([".env", ".env.local", ".env.production", ".env.staging"]);

const PATTERNS: Array<{ id: string; re: RegExp }> = [
  { id: "private_key", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { id: "razorpay_live", re: /rzp_live_[A-Za-z0-9]{10,}/ },
  { id: "generic_sk_live", re: /sk_live_[A-Za-z0-9]{16,}/ },
  { id: "aws_access_key", re: /AKIA[0-9A-Z]{16}/ },
  { id: "otp_plaintext_commit", re: /OTP[_-]?CODE\s*[:=]\s*["']?\d{4,8}["']?/i },
];

export type SecretScanFinding = { file: string; id: string; line: number };

export function shouldSkip(relativePath: string): boolean {
  const parts = relativePath.split(path.sep);
  if (parts.some((part) => SKIP_DIR.has(part))) return true;
  const base = path.basename(relativePath);
  if (SKIP_FILE.has(base)) return true;
  if (base.endsWith(".pem") || base.endsWith(".p12") || base.endsWith(".key")) return false;
  return false;
}

export function scanText(relativePath: string, text: string): SecretScanFinding[] {
  const findings: SecretScanFinding[] = [];
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    if (line.includes("placeholder") || line.includes("example.invalid") || line.trim().startsWith("#")) return;
    for (const pattern of PATTERNS) {
      if (pattern.re.test(line)) {
        findings.push({ file: relativePath, id: pattern.id, line: index + 1 });
      }
    }
  });
  return findings;
}

export function walkFiles(root: string): string[] {
  const out: string[] = [];
  function walk(current: string) {
    let entries: string[] = [];
    try {
      entries = readdirSync(current);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry);
      const relative = path.relative(root, full);
      if (shouldSkip(relative)) continue;
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (stat.isFile() && stat.size < 1_000_000) out.push(full);
    }
  }
  walk(root);
  return out;
}

export function scanRepository(root = process.cwd()): SecretScanFinding[] {
  const files = walkFiles(root);
  const findings: SecretScanFinding[] = [];
  for (const file of files) {
    const relative = path.relative(root, file);
    if (/\.(png|jpg|jpeg|webp|gif|woff2?|ico|pdf)$/i.test(relative)) continue;
    let text = "";
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    findings.push(...scanText(relative, text));
  }
  return findings;
}
