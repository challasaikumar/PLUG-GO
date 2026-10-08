import Image from "next/image";
import { siteConfig } from "@/content/siteConfig";

export const BRAND_LOGO_SRC = "/nikol-ev.assets.Woblo/Firefly_RemoveBackground.png";
export const BRAND_LOGO_SIZE = { width: 8300, height: 6342 };

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={className}>
      <Image
        src={BRAND_LOGO_SRC}
        alt={siteConfig.name}
        width={BRAND_LOGO_SIZE.width}
        height={BRAND_LOGO_SIZE.height}
        sizes="180px"
        priority={priority}
      />
    </span>
  );
}
