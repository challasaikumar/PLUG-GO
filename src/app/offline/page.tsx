import { pageMeta } from "@/lib/metadata";
import { Button } from "@/components/ui/Button";

export const metadata = pageMeta({
  title: "Offline",
  description: "You are offline. Live station status is not shown.",
  path: "/offline",
  index: false,
});

export default function OfflinePage() {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 640 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        You are offline
      </h1>
      <p className="type-body" style={{ margin: "0 0 16px", color: "var(--color-text-secondary)" }}>
        Plug and Go can keep a small app shell available without a network. Live station status, prices, saved account
        pages, and any future booking or charging data are not treated as fresh while offline.
      </p>
      <Button href="/">Try the homepage</Button>
    </div>
  );
}
