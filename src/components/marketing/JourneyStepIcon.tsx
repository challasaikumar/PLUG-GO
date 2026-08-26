import Image from "next/image";
import { marketingAssets } from "@/content/marketingAssets";

type JourneyStepIconProps = {
  kind: "find" | "arrive" | "charge";
};

export function JourneyStepIcon({ kind }: JourneyStepIconProps) {
  return (
    <span className="step-card__glyph">
      <Image
        src={marketingAssets.journeyIcons[kind]}
        alt=""
        width={160}
        height={160}
        sizes="104px"
        aria-hidden="true"
        unoptimized
      />
    </span>
  );
}

export function journeyStepKind(title: string): JourneyStepIconProps["kind"] {
  if (title.toLowerCase().startsWith("arrive")) {
    return "arrive";
  }
  if (title.toLowerCase().startsWith("charge")) {
    return "charge";
  }
  return "find";
}
