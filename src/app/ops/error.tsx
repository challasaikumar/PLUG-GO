"use client";

import { OpsDenied } from "@/components/ops/OpsChrome";

export default function OpsError({ error }: { error: Error }) {
  return <OpsDenied title="Permission denied or operations error" body={error.message} />;
}
