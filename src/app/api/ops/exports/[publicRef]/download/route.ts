import { NextResponse } from "next/server";
import { ROLE_MATRIX } from "@/lib/auth/staff";
import { asOpsFailure, guardOps } from "@/lib/ops/guard";
import { downloadExportCsv } from "@/lib/ops/exports";

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
    const file = await downloadExportCsv(auth.actor, publicRef);
    return new NextResponse(file.csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${file.filename}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return asOpsFailure(error);
  }
}
