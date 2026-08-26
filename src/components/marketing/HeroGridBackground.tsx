"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const NUM_PARTICLES = 360;
const SPEED = 5.2;
const MAX_DEPTH = 1000;
const FOV = 350;

type Particle = {
  x: number;
  y: number;
  z: number;
  isCard: boolean;
  cardWidth: number;
  cardHeight: number;
  angle: number;
  color: string;
};

function resetParticle(particle: Particle, width: number, height: number, initial: boolean) {
  particle.x = (Math.random() - 0.5) * width * 2;
  particle.y = (Math.random() - 0.5) * height * 2;
  particle.z = initial ? Math.random() * MAX_DEPTH : MAX_DEPTH;
  particle.isCard = Math.random() < 0.12;
  particle.cardWidth = 8 + Math.random() * 12;
  particle.cardHeight = 16 + Math.random() * 20;
  particle.angle = Math.atan2(particle.y, particle.x) + (Math.random() - 0.5) * 0.2;
  particle.color = Math.random() > 0.4 ? "rgba(125, 207, 182," : "rgba(70, 130, 120,";
}

function createParticle(width: number, height: number): Particle {
  const particle = {
    x: 0,
    y: 0,
    z: 0,
    isCard: false,
    cardWidth: 0,
    cardHeight: 0,
    angle: 0,
    color: "rgba(125, 207, 182,",
  };
  resetParticle(particle, width, height, true);
  return particle;
}

/**
 * Live warp field from the provided canvas snippet, denser and faster so it
 * reads like public/image.png. The PNG is the still fallback only.
 */
export function HeroGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = wrapRef.current;
    const canvasEl = canvasRef.current;
    const gfx = canvasEl?.getContext("2d", { alpha: false });
    if (!field || !canvasEl || !gfx) return;
    const host: HTMLDivElement = field;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = gfx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      canvas.style.display = "none";
      return;
    }

    let cssWidth = 0;
    let cssHeight = 0;
    let frame = 0;
    let running = true;
    const particles: Particle[] = [];

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) {
        for (let i = 0; i < NUM_PARTICLES; i += 1) {
          particles.push(createParticle(cssWidth, cssHeight));
        }
      }
    }

    function draw() {
      ctx.fillStyle = "#05080c";
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      for (const particle of particles) {
        particle.z -= SPEED;
        if (particle.z <= 10) {
          resetParticle(particle, cssWidth, cssHeight, false);
        }

        const screenX = (particle.x / particle.z) * FOV + cssWidth / 2;
        const screenY = (particle.y / particle.z) * FOV + cssHeight / 2;
        const prevZ = particle.z + SPEED * 6;
        const prevScreenX = (particle.x / prevZ) * FOV + cssWidth / 2;
        const prevScreenY = (particle.y / prevZ) * FOV + cssHeight / 2;

        if (screenX < 0 || screenX > cssWidth || screenY < 0 || screenY > cssHeight) {
          continue;
        }

        const alpha = Math.min(1, (MAX_DEPTH - particle.z) / (MAX_DEPTH * 0.35));

        if (particle.isCard) {
          const scale = (1 / particle.z) * FOV;
          const w = particle.cardWidth * scale * 0.15;
          const h = particle.cardHeight * scale * 0.15;
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(particle.angle);
          ctx.fillStyle = `rgba(164, 219, 203, ${alpha * 0.85})`;
          ctx.fillRect(-w / 2, -h / 2, w, h);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.moveTo(prevScreenX, prevScreenY);
          ctx.lineTo(screenX, screenY);
          ctx.strokeStyle = `${particle.color} ${alpha * 0.75})`;
          ctx.lineWidth = Math.max(0.6, (1 - particle.z / MAX_DEPTH) * 2.2);
          ctx.stroke();
        }
      }
    }

    function tick() {
      if (!running) return;
      draw();
      frame = window.requestAnimationFrame(tick);
    }

    size();
    const observer = new ResizeObserver(() => size());
    observer.observe(host);

    const visibility = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && running === false) {
        running = true;
        frame = window.requestAnimationFrame(tick);
      } else if (!visible) {
        running = false;
        window.cancelAnimationFrame(frame);
      }
    });
    visibility.observe(host);

    running = true;
    frame = window.requestAnimationFrame(tick);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="home-hero__field" aria-hidden="true">
      <Image className="home-hero__field-photo" src="/image.png" alt="" fill sizes="100vw" priority />
      <canvas ref={canvasRef} className="home-hero__field-canvas" />
      <div className="home-hero__field-veil" />
    </div>
  );
}
