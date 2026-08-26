import { describe, expect, it } from "vitest";
import { ROLE_MATRIX, roleAllows, type StaffActor } from "@/lib/auth/staff";
import { canTransitionIncident } from "@/lib/ops/incidents";
import { commandRiskNote, isApprovedEvidenceUrl, opsLayoutMode } from "@/lib/ops/roles";

function actor(role: StaffActor["role"]): StaffActor {
  return { id: `actor-${role}`, role, source: "dev_env" };
}

describe("phase 10 role matrix", () => {
  it("keeps finance off technicians and station operators", () => {
    expect(roleAllows(actor("technician"), ROLE_MATRIX.readFinanceOps)).toBe(false);
    expect(roleAllows(actor("station_operator"), ROLE_MATRIX.readFinanceOps)).toBe(false);
    expect(roleAllows(actor("station_operator"), ROLE_MATRIX.initiateRefund)).toBe(false);
    expect(roleAllows(actor("finance"), ROLE_MATRIX.readFinanceOps)).toBe(true);
    expect(roleAllows(actor("finance"), ROLE_MATRIX.requestCommand)).toBe(false);
  });

  it("keeps host and fleet out of internal ops and catalogue writes", () => {
    expect(roleAllows(actor("host_admin"), ROLE_MATRIX.readOps)).toBe(false);
    expect(roleAllows(actor("fleet_admin"), ROLE_MATRIX.readOps)).toBe(false);
    expect(roleAllows(actor("host_viewer"), ROLE_MATRIX.writeStationFacts)).toBe(false);
    expect(roleAllows(actor("host_admin"), ROLE_MATRIX.readHostPortal)).toBe(true);
    expect(roleAllows(actor("fleet_viewer"), ROLE_MATRIX.readFleetPortal)).toBe(true);
  });

  it("does not auto-close incidents on reconnect (no closed transition from new)", () => {
    expect(canTransitionIncident("new", "closed")).toBe(false);
    expect(canTransitionIncident("new", "acknowledged")).toBe(true);
    expect(canTransitionIncident("resolved", "verification_required")).toBe(true);
    expect(canTransitionIncident("verification_required", "closed")).toBe(true);
  });

  it("uses phone card layout below 768px and keeps evidence on https", () => {
    expect(opsLayoutMode(360)).toBe("phone");
    expect(opsLayoutMode(390)).toBe("phone");
    expect(opsLayoutMode(768)).toBe("tablet");
    expect(opsLayoutMode(1280)).toBe("desktop");
    expect(opsLayoutMode(1440)).toBe("desktop");
    expect(isApprovedEvidenceUrl("https://evidence.example/photo.jpg")).toBe(true);
    expect(isApprovedEvidenceUrl("javascript:alert(1)")).toBe(false);
    expect(isApprovedEvidenceUrl("data:text/html;base64,aaaa")).toBe(false);
    expect(commandRiskNote("reset")).toMatch(/not implemented/i);
  });
});
