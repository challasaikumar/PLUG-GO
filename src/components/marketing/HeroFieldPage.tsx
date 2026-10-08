import type { ReactNode } from "react";
import { HeroGridBackground } from "@/components/marketing/HeroGridBackground";

export function HeroFieldPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["hero-field-page", className].filter(Boolean).join(" ")}>
      <HeroGridBackground />
      {children}
    </div>
  );
}
