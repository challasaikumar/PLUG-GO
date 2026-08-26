import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

function loadEnvFile(name: string) {
  try {
    const text = readFileSync(path.resolve(__dirname, name), "utf8");
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

const TEST_FLAG_DEFAULTS: Record<string, string> = {
  FLAG_PUBLIC_FINDER: "true",
  FLAG_PUBLISHED_CONTENT: "true",
  FLAG_DRIVER_OTP: "true",
  FLAG_BOOKING: "true",
  FLAG_PAYMENT_CHECKOUT: "true",
  FLAG_REFUNDS: "true",
  FLAG_OPS_PORTAL: "true",
  FLAG_HOST_PORTAL: "true",
  FLAG_FLEET_PORTAL: "true",
  FLAG_PILOT_REMOTE_CHARGING: "true",
};

for (const [key, value] of Object.entries(TEST_FLAG_DEFAULTS)) {
  if (!process.env[key]) process.env[key] = value;
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
