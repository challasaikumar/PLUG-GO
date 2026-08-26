const SENSITIVE_KEYS = [
  "password",
  "passwd",
  "secret",
  "authorization",
  "idtag",
  "idtoken",
  "idtokeninfo",
  "certificate",
  "cert",
  "privatekey",
  "key",
  "pin",
  "token",
  "credential",
];

function isSensitiveKey(key: string): boolean {
  const normalised = key.toLowerCase().replaceAll("_", "").replaceAll("-", "");
  return SENSITIVE_KEYS.some((item) => normalised.includes(item));
}

export function redactOcppValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 400) return `${value.slice(0, 80)}…[redacted-length:${value.length}]`;
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => redactOcppValue(item, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? "[redacted]" : redactOcppValue(nested, depth + 1);
    }
    return out;
  }
  return "[unsupported]";
}

export function redactOcppFrameText(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return JSON.stringify(redactOcppValue(parsed));
  } catch {
    if (raw.length > 200) return `${raw.slice(0, 40)}…[unparsed-redacted]`;
    return "[unparsed-redacted]";
  }
}
