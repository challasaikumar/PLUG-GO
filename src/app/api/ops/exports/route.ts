import type { ExportJobKind } from "@prisma/client";
import { ROLE_MATRIX } from "@/lib/auth/staff";
import { jsonOk, parseJsonBody, readJson, requestIdFrom } from "@/lib/api/http";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { requestExportJob } from "@/lib/ops/exports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORT_ROLES = [
  ...ROLE_MATRIX.requestExportFinance,
  ...ROLE_MATRIX.requestExportOps,
  ...ROLE_MATRIX.requestExportHost,
  ...ROLE_MATRIX.requestExportFleet,
] as const;

export async function POST(request: Request) {
  const auth = guardOps(EXPORT_ROLES);
  if (!auth.ok) return auth.response;
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const body = parseJsonBody(json.value) ?? {};
  try {
    const job = await requestExportJob(auth.actor, {
      kind: body.kind as ExportJobKind,
      filters: typeof body.filters === "object" && body.filters ? (body.filters as Record<string, unknown>) : {},
      from: typeof body.from === "string" ? body.from : undefined,
      to: typeof body.to === "string" ? body.to : undefined,
      requestId: requestIdFrom(request),
    });
    const response = jsonOk({
      job: {
        id: job.id,
        publicRef: job.publicRef,
        status: job.status,
        rowCount: job.rowCount,
        expiresAt: job.expiresAt,
        error: job.error,
      },
    }, 201);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return asOpsFailure(error);
  }
}
