import { jsonError, jsonOk } from "@/lib/api/http";
import { listPublishedHubs } from "@/lib/catalogue/published-hubs";
import { parseFinderQuery } from "@/lib/finder/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseFinderQuery(url.searchParams);
  if (!parsed.ok) {
    return jsonError(400, "validation_error", "Invalid search or filter parameters.", parsed.errors);
  }

  const response = jsonOk({
    ...listPublishedHubs(parsed.query),
    freshness: {
      note: "Published PLUG & GO hubs. Live connector availability is not shown.",
    },
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
