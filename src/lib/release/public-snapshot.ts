import { publicFlagSnapshot, type FlagResolution } from "./flags";
import { resolveAllFlags } from "./overrides";

export type PublicFlagSnapshot = ReturnType<typeof publicFlagSnapshot>;

export async function getPublicFlagSnapshot(): Promise<PublicFlagSnapshot> {
  const resolutions = await resolveAllFlags();
  return publicFlagSnapshot(resolutions);
}

export function snapshotFrom(resolutions: FlagResolution[]): PublicFlagSnapshot {
  return publicFlagSnapshot(resolutions);
}
