"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { SectionHead } from "@/components/marketing/voltran/SectionHead";
import { voltran } from "@/content/voltran";

type Person = (typeof voltran.team.people)[number];

export function TeamStack() {
  const people = voltran.team.people;
  const container = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div className="vt-team-block">
      <SectionHead id="team-heading">Team</SectionHead>

      {reduceMotion ? (
        <ul className="vt-team-static">
          {people.map((person) => (
            <li key={person.name}>
              <article className="vt-team-card">
                <TeamCardBody person={person} />
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="vt-team-stack" ref={container}>
          {people.map((person, index) => {
            const targetScale = 1 - (people.length - index) * 0.05;
            return (
              <TeamCard
                key={person.name}
                person={person}
                index={index}
                progress={scrollYProgress}
                range={[index * (1 / people.length), 1]}
                targetScale={targetScale}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamCard({
  person,
  index,
  progress,
  range,
  targetScale,
}: {
  person: Person;
  index: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}) {
  const pin = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pin,
    offset: ["start end", "start start"],
  });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.35, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div ref={pin} className="vt-team-pin" style={{ zIndex: index + 1 }}>
      <motion.article
        className="vt-team-card"
        style={{
          scale,
          top: `calc(-5vh + ${index * 25}px)`,
        }}
      >
        <TeamCardBody person={person} imageScale={imageScale} />
      </motion.article>
    </div>
  );
}

function TeamCardBody({
  person,
  imageScale,
}: {
  person: Person;
  imageScale?: MotionValue<number>;
}) {
  const photo = person.image ? (
    <Image
      fill
      src={person.image}
      alt={person.name}
      sizes="(min-width: 768px) 420px, 80vw"
      className="vt-team-photo__img"
    />
  ) : (
    <div className="vt-team-photo__empty" aria-hidden="true">
      <span>{person.initials}</span>
    </div>
  );

  return (
    <>
      <div className="vt-team-copy">
        <p className="vt-team-role">{person.role}</p>
        <h3>{person.name}</h3>
        <p className="vt-team-bio">{person.bio}</p>
      </div>
      <div className="vt-team-frame">
        {imageScale ? (
          <motion.div className="vt-team-media" style={{ scale: imageScale }}>
            <div className="vt-team-photo">{photo}</div>
          </motion.div>
        ) : (
          <div className="vt-team-photo">{photo}</div>
        )}
      </div>
    </>
  );
}
