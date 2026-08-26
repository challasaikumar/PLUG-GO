"use client";

import { useId, useState, type ReactNode } from "react";
import { IconChevron } from "./icons";

export type AccordionItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
  headingLevel?: "h2" | "h3";
};

export function Accordion({ items, headingLevel = "h3" }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const baseId = useId();
  const Heading = headingLevel;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="faq-accordion">
      {items.map((item) => {
        const expanded = openId === item.id;
        const panelId = `${baseId}-${item.id}`;
        return (
          <div key={item.id} className={expanded ? "faq-accordion__item is-open" : "faq-accordion__item"}>
            <Heading className="faq-accordion__heading">
              <button
                type="button"
                className="faq-accordion__trigger"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenId(expanded ? null : item.id)}
              >
                <span>{item.question}</span>
                <IconChevron className={expanded ? "faq-accordion__icon is-open" : "faq-accordion__icon"} />
              </button>
            </Heading>
            {expanded ? (
              <div id={panelId} className="faq-accordion__panel">
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
