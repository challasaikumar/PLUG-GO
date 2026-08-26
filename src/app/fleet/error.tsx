"use client";

import { OpsDenied } from "@/components/ops/OpsChrome";

export default function FleetError({ error }: { error: Error }) {
  return <OpsDenied title="Fleet portal error" body={error.message} />;
}
