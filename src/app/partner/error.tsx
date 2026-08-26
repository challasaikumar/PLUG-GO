"use client";

import { OpsDenied } from "@/components/ops/OpsChrome";

export default function PartnerError({ error }: { error: Error }) {
  return <OpsDenied title="Host portal error" body={error.message} />;
}
