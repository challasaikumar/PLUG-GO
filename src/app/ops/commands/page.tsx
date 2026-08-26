import { CommandApproveBar, CommandRequestForm } from "@/components/ops/CommandRequestForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { ROLE_MATRIX, requireStaffRole, roleAllows } from "@/lib/auth/staff";
import { listCommandApprovals } from "@/lib/ops/commands";

export const dynamic = "force-dynamic";

export default async function OpsCommandsPage() {
  const actor = requireStaffRole(ROLE_MATRIX.readCommands);
  const { approvals, remote } = await listCommandApprovals(actor);
  const canRequest = roleAllows(actor, ROLE_MATRIX.requestCommand);
  const canApprove = roleAllows(actor, ROLE_MATRIX.approveCommand);
  const canBreak = roleAllows(actor, ROLE_MATRIX.breakGlassCommand);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <h1 className="type-h1">Remote commands</h1>
      <Alert variant="warning" title="No generic charger control">
        The browser never sends OCPP. Requests create an approval record. Dispatch uses the Phase 9 command service
        only, remains disabled by default, and still needs station allow-lists plus a transaction id for stop.
      </Alert>
      {canRequest ? <CommandRequestForm stationId="" /> : null}
      <h2 className="type-h2">Approvals</h2>
      {approvals.length === 0 ? (
        <EmptyState title="No command approvals" body="Pending, break-glass, and denied records appear here." />
      ) : (
        approvals.map((row) => (
          <article key={row.id} className="ops-list-card">
            <p className="font-mono type-caption">{row.publicRef}</p>
            <p className="type-small">
              {row.action} · {row.status} · {row.station.name} · timeout/risk: {row.riskNote}
            </p>
            <p className="type-caption">Reason: {row.reason}</p>
            {row.status === "pending" ? (
              <CommandApproveBar approvalId={row.id} canApprove={canApprove} canBreakGlass={canBreak} />
            ) : null}
          </article>
        ))
      )}
      <h2 className="type-h2">Phase 9 remote command log</h2>
      {remote.length === 0 ? (
        <p className="type-small">No remote commands in scope.</p>
      ) : (
        remote.map((row) => (
          <p key={row.id} className="type-small">
            {row.type} · {row.status} · evidence {row.evidenceState ?? "none"} · timeout{" "}
            {row.timeoutAt?.toISOString() ?? "n/a"} · {row.reason}
          </p>
        ))
      )}
    </div>
  );
}
