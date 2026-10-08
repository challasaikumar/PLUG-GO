"use client";

import type { ReactNode } from "react";

type ScrollBaseAnimationProps = {
  children: ReactNode;
  delay?: number;
  baseVelocity?: number;
  clasname?: string;
  className?: string;
};

export default function ScrollBaseAnimation({
  children,
  delay = 0,
  baseVelocity = 3,
  clasname = "",
  className = "",
}: ScrollBaseAnimationProps) {
  const duration = `${Math.max(12, 72 / Math.max(Math.abs(baseVelocity), 0.4))}s`;
  const reverse = baseVelocity < 0;
  const copies = Array.from({ length: 4 }, (_, index) => index);

  return (
    <div
      className={`scroll-marque ${reverse ? "scroll-marque--reverse" : ""} ${clasname} ${className}`.trim()}
      style={{
        ["--marque-duration" as string]: duration,
        ["--marque-delay" as string]: `${delay}ms`,
      }}
    >
      <div className="scroll-marque__track">
        {copies.map((copy) => (
          <span className="scroll-marque__chunk" key={copy}>
            {children}
          </span>
        ))}
      </div>
    </div>
  );
}
