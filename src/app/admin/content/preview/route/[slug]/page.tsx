import { notFound } from "next/navigation";
import { RouteGuideView } from "@/components/content/RouteGuideView";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { getPublicStationBySlug } from "@/lib/catalogue/station-service";
import { getAdminRouteBySlug } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function PreviewRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  requireStaffRole(ROLE_MATRIX.readCatalogue);
  const { slug } = await params;
  const route = await getAdminRouteBySlug(slug);
  if (!route) notFound();

  const stops = [];
  for (const stop of route.stops) {
    const station = await getPublicStationBySlug(stop.stationSlug);
    if (!station) continue;
    stops.push({
      stationSlug: station.slug,
      name: station.name,
      city: station.city,
      state: station.state,
      latitude: station.latitude,
      longitude: station.longitude,
      stopNotes: stop.stopNotes,
      sortOrder: stop.sortOrder,
    });
  }

  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <RouteGuideView
        preview
        route={{
          slug: route.slug,
          originName: route.originName,
          destinationName: route.destinationName,
          routeNotes: route.routeNotes,
          accessCaveats: route.accessCaveats,
          lastReviewedAt: route.lastReviewedAt,
          reviewerName: route.reviewedBy?.displayName ?? null,
          faqs: route.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
          stops,
        }}
      />
    </div>
  );
}
