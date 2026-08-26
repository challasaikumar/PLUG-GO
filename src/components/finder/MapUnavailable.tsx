import { Alert } from "@/components/ui/Alert";

export function MapUnavailable({ reason }: { reason: string }) {
  return (
    <div className="finder-map-unavailable" role="status">
      <Alert variant="info" title="Map display is unavailable">
        {reason} The list is the complete way to discover published stations.
      </Alert>
    </div>
  );
}
