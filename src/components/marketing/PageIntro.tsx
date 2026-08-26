import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead: string;
}) {
  return (
    <header className="guide-intro">
      {eyebrow ? <p className="guide-intro__kicker">{eyebrow}</p> : null}
      <h1 className="guide-intro__title">{title}</h1>
      <p className="guide-intro__lead">{lead}</p>
    </header>
  );
}

export function Section({
  id,
  title,
  children,
  className,
}: {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={className ?? "page-section"}>
      {title ? (
        <h2 className="type-h2" style={{ margin: "0 0 16px" }}>
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
