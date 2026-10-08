import { Accordion } from "@/components/ui/Accordion";
import { SectionHead } from "@/components/marketing/voltran/SectionHead";
import { homeFaqs } from "@/content/answers";

export function HomeFaq() {
  return (
    <section className="vt-section vt-faq" id="faq" aria-labelledby="faq-heading">
      <div className="vt-wrap">
        <SectionHead id="faq-heading">Questions drivers ask</SectionHead>
        <p className="vt-lead">Straight answers from what this site publishes today.</p>
        <Accordion
          items={homeFaqs.map((faq) => ({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
          }))}
        />
      </div>
    </section>
  );
}
