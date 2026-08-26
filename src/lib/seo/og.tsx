import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

export function ogImageResponse(input: {
  kicker: string;
  title: string;
  fact?: string | null;
}) {
  const fact = input.fact?.trim() || "Find a compatible charger. Know the price.";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f7f7",
          color: "#333333",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#ea1560",
              fontWeight: 600,
            }}
          >
            {input.kicker}
          </div>
          <div
            style={{
              fontSize: input.title.length > 48 ? 52 : 64,
              lineHeight: 1.1,
              fontWeight: 600,
              maxWidth: 980,
            }}
          >
            {input.title}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Plug and Go</div>
          <div style={{ fontSize: 22, color: "#575757", maxWidth: 640, textAlign: "right" }}>{fact}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
