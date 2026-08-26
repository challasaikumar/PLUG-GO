import { Alert } from "@/components/ui/Alert";

export function FeatureUnavailable({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 640 }}>
      <h1 className="type-h1" style={{ margin: "0 0 12px" }}>
        {title}
      </h1>
      <Alert variant="info" title="Not available yet">
        {children}
      </Alert>
    </div>
  );
}
