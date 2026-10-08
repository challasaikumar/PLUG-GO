import { NextResponse } from "next/server";

const UA = "PlugAndGoWebsite/1.0 (location showcase)";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const z = Number(params.get("z"));
  const x = Number(params.get("x"));
  const y = Number(params.get("y"));
  if (![z, x, y].every((n) => Number.isInteger(n) && n >= 0) || z > 19) {
    return NextResponse.json({ error: "Invalid tile." }, { status: 400 });
  }
  const max = 2 ** z;
  if (x >= max || y >= max) {
    return NextResponse.json({ error: "Invalid tile." }, { status: 400 });
  }

  const esri = await fetch(
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
    { headers: { "User-Agent": UA }, next: { revalidate: 86400 } },
  );
  const source = esri.ok
    ? esri
    : await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
        headers: { "User-Agent": UA },
        next: { revalidate: 86400 },
      });

  if (!source.ok) {
    return NextResponse.json({ error: "Tile unavailable." }, { status: 502 });
  }

  return new NextResponse(source.body, {
    headers: {
      "Content-Type": source.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
