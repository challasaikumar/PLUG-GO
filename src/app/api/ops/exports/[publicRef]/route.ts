import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { getExportJob } from "@/lib/ops/exports";

const EXPORT_ROLES = [
  ...ROLE_MATRIX.requestExportFinance,
  ...ROLE_MATRIX.requestExportOps,
  ...ROLE_MATRIX.requestExportHost,
  ...ROLE_MATRIX.requestExportFleet,
] as const;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ publicRef: string }> }) {
  const auth = guardOps(EXPORT_ROLES);
  if (!auth.ok) return auth.response;
  const { publicRef } = await context.params;
  try {
    const job = await getExportJob(auth.actor, publicRef);
    const response = jsonOk({
      job: {
        publicRef: job.publicRef,
        kind: job.kind,
        status: job.status,
        rowCount: job.rowCount,
        generatedAt: job.generatedAt,
        expiresAt: job.expiresAt,
        requestedAt: job.requestedAt,
      },
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}
