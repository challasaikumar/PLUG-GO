import type { ReactNode } from "react";

export function SectionHead({
  id,
  kicker,
  index,
  align = "center",
  as: Title = "h2",
  children,
}: {
  id: string;
  kicker?: string;
  index?: string;
  align?: "center" | "start";
  as?: "h1" | "h2";
  children: ReactNode;
}) {
  return (
    <header className={`vt-head${align === "start" ? " vt-head--start" : ""}`}>
      {kicker ? (
        <div className="vt-head__meta">
          <p className="vt-head__kicker">
            <span className="vt-head__bolt" aria-hidden="true" />
            {kicker}
          </p>
          {index ? <span className="vt-head__index">{index}</span> : null}
        </div>
      ) : null}
      <Title id={id} className="vt-head__title">
        {children}
      </Title>
    </header>
  );
}
