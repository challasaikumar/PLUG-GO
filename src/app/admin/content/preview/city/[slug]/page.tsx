import { notFound } from "next/navigation";
import { CityLanding } from "@/components/content/CityLanding";
import { requireStaffRole, ROLE_MATRIX } from "@/lib/auth/staff";
import { listPublicStations } from "@/lib/catalogue/station-service";
import { getAdminCityBySlug } from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

export default async function PreviewCityPage({ params }: { params: Promise<{ slug: string }> }) {
  requireStaffRole(ROLE_MATRIX.readCatalogue);
  const { slug } = await params;
  const city = await getAdminCityBySlug(slug);
  if (!city) notFound();
  const listed = await listPublicStations({
    page: 1,
    pageSize: 50,
    city: city.cityName,
  });
  return (
    <div className="container-png" style={{ padding: "32px 0 80px" }}>
      <CityLanding
        preview
        city={{
          slug: city.slug,
          cityName: city.cityName,
          stateName: city.stateName,
          intro: city.intro,
          accessGuidance: city.accessGuidance,
          connectorGuidance: city.connectorGuidance,
          localNotes: city.localNotes,
          showFleetModule: city.showFleetModule,
          lastReviewedAt: city.lastReviewedAt,
          reviewerName: city.reviewedBy?.displayName ?? null,
          faqs: city.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
          stationCount: listed.stations.length,
        }}
        stations={listed.stations}
      />
    </div>
  );
}
