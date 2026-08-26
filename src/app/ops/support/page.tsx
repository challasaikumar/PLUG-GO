import { SupportQueueClient } from "@/components/ops/SupportQueueClient";
import { Alert } from "@/components/ui/Alert";
import { ROLE_MATRIX, requireStaffRole } from "@/lib/auth/staff";
import { listSupportQueue } from "@/lib/ops/support";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ category?: string; status?: string; station?: string; assignee?: string }>;
};

export default async function OpsSupportPage({ searchParams }: PageProps) {
  const actor = requireStaffRole(ROLE_MATRIX.readSupportQueue);
  const params = await searchParams;
  const queue = await listSupportQueue(actor, {
    category: params.category,
    status: params.status,
    stationId: params.station,
    assigneeId: params.assignee,
  });

  return (
    <div>
      <h1 className="type-h1">Internal support</h1>
      <Alert variant="info" title="Not the public /support page">
        Customer-facing help stays at /support. This queue never shows raw card data, OTPs, or OCPP credentials.
      </Alert>
      <form className="ops-filters" method="get" style={{ margin: "16px 0 24px" }}>
        <label className="field-label" htmlFor="category">
          Category
          <input className="field-control" id="category" name="category" defaultValue={params.category} />
        </label>
        <label className="field-label" htmlFor="status">
          Status
          <input className="field-control" id="status" name="status" defaultValue={params.status} />
        </label>
        <label className="field-label" htmlFor="station">
          Station id
          <input className="field-control" id="station" name="station" defaultValue={params.station} />
        </label>
        <button className="png-btn png-btn--primary png-btn--sm" type="submit">
          Filter
        </button>
      </form>
      <SupportQueueClient tickets={queue.tickets} />
    </div>
  );
}
