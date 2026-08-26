import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionClient } from "@/components/session/SessionClient";
import { requireDriverPage } from "@/lib/auth/driver";
import { pageMeta } from "@/lib/metadata";
import { driverSessionApiView, getDriverSession } from "@/lib/ocpp/queries";
import { sessionStatusCopy } from "@/lib/ocpp/sessions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ "session-id": string }> };

export const metadata = pageMeta({
  title: "Charging session",
  description: "Your Plug and Go charging session.",
  path: "/session",
  index: false,
});

export default async function SessionPage({ params }: PageProps) {
  const driver = await requireDriverPage("/session");
  const { "session-id": publicRef } = await params;
  const session = await getDriverSession(driver.id, publicRef);
  if (!session) notFound();
  const view = driverSessionApiView(session);
  const copy = sessionStatusCopy(session.status);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <p className="type-caption">
        <Link className="png-link" href="/account">
          Account
        </Link>
      </p>
      <h1 className="type-h1" style={{ margin: "12px 0 8px" }}>
        {copy.title}
      </h1>
      <SessionClient initial={view} />
    </div>
  );
}
