import { NextResponse } from "next/server";

const cache = new Map<string, { lat: number; lon: number }>();

function stripPlusCode(value: string) {
  return value.replace(/\b[A-Z0-9]{4,}\+[A-Z0-9]{2,}\b/g, " ").replace(/\s+/g, " ").trim();
}

function queries(name: string, address: string) {
  const clean = stripPlusCode(address);
  const parts = clean.split(",").map((part) => part.trim()).filter(Boolean);
  const unique = new Set<string>();
  for (const q of [
    clean,
    name,
    [name, ...parts.slice(-2)].join(", "),
    parts.slice(-3).join(", "),
    parts.slice(-2).join(", "),
  ]) {
    if (q) unique.add(q);
  }
  return [...unique];
}

async function nominatim(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PlugAndGoWebsite/1.0 (location showcase)",
    },
    next: { revalidate: 86400 },
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const lat = Number(rows[0]?.lat);
  const lon = Number(rows[0]?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const address = params.get("q")?.trim() ?? "";
  const name = params.get("name")?.trim() ?? "";
  if (!address && !name) {
    return NextResponse.json({ error: "Missing query." }, { status: 400 });
  }

  const key = `${name}|${address}`;
  const hit = cache.get(key);
  if (hit) return NextResponse.json(hit);

  for (const q of queries(name, address)) {
    const cached = cache.get(q);
    if (cached) {
      cache.set(key, cached);
      return NextResponse.json(cached);
    }
    const found = await nominatim(q);
    if (found) {
      cache.set(q, found);
      cache.set(key, found);
      return NextResponse.json(found);
    }
  }

  return NextResponse.json({ error: "Not found." }, { status: 404 });
}
