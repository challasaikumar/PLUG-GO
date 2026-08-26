import type { ChargePointSocket } from "./types";

type Entry = {
  chargePointId: string;
  identity: string;
  socket: ChargePointSocket;
  connectedAt: Date;
  remoteAddressHash: string | null;
};

/**
 * Process-local registry of live OCPP sockets. Next.js must not hold these.
 */
export class ChargerConnectionRegistry {
  private readonly byIdentity = new Map<string, Entry>();
  private readonly perIp = new Map<string, number>();

  get(identity: string): Entry | undefined {
    return this.byIdentity.get(identity);
  }

  has(identity: string): boolean {
    return this.byIdentity.has(identity);
  }

  size(): number {
    return this.byIdentity.size;
  }

  countForIp(remoteAddressHash: string | null): number {
    if (!remoteAddressHash) return 0;
    return this.perIp.get(remoteAddressHash) ?? 0;
  }

  tryRegister(entry: Entry): { ok: true } | { ok: false; reason: "duplicate" } {
    if (this.byIdentity.has(entry.identity)) {
      return { ok: false, reason: "duplicate" };
    }
    this.byIdentity.set(entry.identity, entry);
    if (entry.remoteAddressHash) {
      this.perIp.set(entry.remoteAddressHash, (this.perIp.get(entry.remoteAddressHash) ?? 0) + 1);
    }
    return { ok: true };
  }

  remove(identity: string): Entry | undefined {
    const existing = this.byIdentity.get(identity);
    if (!existing) return undefined;
    this.byIdentity.delete(identity);
    if (existing.remoteAddressHash) {
      const next = (this.perIp.get(existing.remoteAddressHash) ?? 1) - 1;
      if (next <= 0) this.perIp.delete(existing.remoteAddressHash);
      else this.perIp.set(existing.remoteAddressHash, next);
    }
    return existing;
  }

  send(identity: string, raw: string): boolean {
    const entry = this.byIdentity.get(identity);
    if (!entry) return false;
    entry.socket.send(raw);
    return true;
  }

  closeAll(code: number, reason: string) {
    for (const entry of this.byIdentity.values()) {
      try {
        entry.socket.close(code, reason);
      } catch {
        // Best-effort shutdown.
      }
    }
    this.byIdentity.clear();
    this.perIp.clear();
  }
}

export const chargerConnectionRegistry = new ChargerConnectionRegistry();
