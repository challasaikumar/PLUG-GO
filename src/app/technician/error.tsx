"use client";

import { OpsDenied } from "@/components/ops/OpsChrome";

export default function TechnicianError({ error }: { error: Error }) {
  return <OpsDenied title="Technician portal error" body={error.message} />;
}
