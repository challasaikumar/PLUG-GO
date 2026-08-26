import type { OcppProtocolVersion } from "@prisma/client";
import type { ChargePointAdapter } from "./adapter";
import { ocpp16Adapter } from "./ocpp16";
import { ocpp201Adapter } from "./ocpp201";
import { ocpp21Adapter } from "./ocpp21";

export function adapterFor(version: OcppProtocolVersion): ChargePointAdapter {
  switch (version) {
    case "ocpp_1_6":
      return ocpp16Adapter;
    case "ocpp_2_0_1":
      return ocpp201Adapter;
    case "ocpp_2_1":
      return ocpp21Adapter;
  }
}

export function ocppPathFor(version: OcppProtocolVersion, identity: string): string {
  const encoded = encodeURIComponent(identity);
  if (version === "ocpp_1_6") return `/ocpp/1.6/${encoded}`;
  if (version === "ocpp_2_0_1") return `/ocpp/2.0.1/${encoded}`;
  return `/ocpp/2.1/${encoded}`;
}

export function protocolFromPath(pathname: string): { version: OcppProtocolVersion; identity: string } | null {
  const match = pathname.match(/^\/ocpp\/(1\.6|2\.0\.1|2\.1)\/([^/]+)$/);
  if (!match) return null;
  const identity = decodeURIComponent(match[2] ?? "");
  if (!identity) return null;
  if (match[1] === "1.6") return { version: "ocpp_1_6", identity };
  if (match[1] === "2.0.1") return { version: "ocpp_2_0_1", identity };
  return { version: "ocpp_2_1", identity };
}
