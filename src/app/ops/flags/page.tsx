import { ROLE_MATRIX, requireStaffRole } from "@/lib/auth/staff";
import { resolveAllFlags } from "@/lib/release/overrides";
import { isEnvOnlyFlag } from "@/lib/release/flags";
import { Alert } from "@/components/ui/Alert";
import { OpsFlagsForm } from "@/components/ops/OpsFlagsForm";

export const dynamic = "force-dynamic";

export default async function OpsFlagsPage() {
  const actor = requireStaffRole(ROLE_MATRIX.manageReleaseFlags);
  const flags = await resolveAllFlags();

  return (
    <div>
      <h1 className="type-h1" style={{ margin: "16px 0 8px" }}>
        Feature flags
      </h1>
      <p className="type-body" style={{ margin: "0 0 16px", maxWidth: "42rem" }}>
        Staff can only disable flags that the environment already allows. Safety-critical flags stay env-only. Actor{" "}
        <span className="font-mono">{actor.id}</span>.
      </p>
      <Alert variant="warning" title="Fail closed">
        Unset flags are off. Payment, refunds, OTP, and remote charging cannot be turned on from this page.
      </Alert>
      <div style={{ marginTop: 16 }}>
        <OpsFlagsForm
          flags={flags.map((row) => ({
            key: row.key,
            envName: row.envName,
            envEnabled: row.envEnabled,
            enabled: row.enabled,
            staffOverride: row.staffOverride,
            dependencyBlock: row.dependencyBlock,
            envOnly: isEnvOnlyFlag(row.key),
          }))}
        />
      </div>
    </div>
  );
}
