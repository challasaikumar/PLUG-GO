import Image from "next/image";
import { marketingAssets } from "@/content/marketingAssets";

export type ProductIconKind = keyof typeof marketingAssets.productIcons;

const PROCESS_SEQUENCE = ["enquire", "qualify", "followup"] as const satisfies readonly ProductIconKind[];
const HOW_TO_SEQUENCE = [
  "find",
  "check",
  "arrive",
  "arrive",
  "charge",
  "general_support",
] as const satisfies readonly ProductIconKind[];
const SAFETY_SEQUENCE = ["charge", "inspect", "unsafe_fault"] as const satisfies readonly ProductIconKind[];
const ABOUT_SEQUENCE = ["records", "find", "qualify"] as const satisfies readonly ProductIconKind[];
const VARY_SEQUENCE = ["charge", "inspect", "check", "qualify", "records"] as const satisfies readonly ProductIconKind[];

type ProductIconProps = {
  kind: ProductIconKind;
  className?: string;
  size?: number;
};

export function ProductIcon({ kind, className = "product-icon", size = 72 }: ProductIconProps) {
  return (
    <span className={className} aria-hidden="true">
      <Image
        src={marketingAssets.productIcons[kind]}
        alt=""
        width={160}
        height={160}
        sizes={`${size}px`}
        unoptimized
      />
    </span>
  );
}

export function processIconKind(index: number): ProductIconKind {
  return PROCESS_SEQUENCE[index % PROCESS_SEQUENCE.length];
}

export function howToIconKind(index: number): ProductIconKind {
  return HOW_TO_SEQUENCE[index] ?? PROCESS_SEQUENCE[index % PROCESS_SEQUENCE.length];
}

export function safetyIconKind(index: number): ProductIconKind {
  return SAFETY_SEQUENCE[index] ?? "inspect";
}

export function aboutIconKind(index: number): ProductIconKind {
  return ABOUT_SEQUENCE[index] ?? "records";
}

export function varyIconKind(index: number): ProductIconKind {
  return VARY_SEQUENCE[index] ?? "records";
}

export function supportIconKind(id: string): ProductIconKind {
  if (id in marketingAssets.productIcons) {
    return id as ProductIconKind;
  }
  return "general_support";
}
