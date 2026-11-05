"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  tw: number;
};

export default function BackgroundFX() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const particles: Particle[] = [];
    const N = 64;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.4,
        hue: [190, 265, 160][i % 3],
        tw: Math.random() * Math.PI * 2,
      });
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += 0.02;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        const alpha = 0.25 + Math.sin(p.tw) * 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${Math.max(0.05, alpha)})`;
        ctx.fill();
      }
      // connective tissue
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 130 * 130) {
            const alpha = (1 - Math.sqrt(d2) / 130) * 0.1;
            ctx.strokeStyle = `hsla(210, 90%, 75%, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <canvas ref={ref} className="absolute inset-0 opacity-80" />
      <div className="animate-aurora absolute -top-40 left-[8%] h-[480px] w-[560px] rounded-full bg-cyan-500/[0.13] blur-[130px]" />
      <div className="animate-aurora2 absolute top-[20%] right-[4%] h-[520px] w-[620px] rounded-full bg-violet-600/[0.14] blur-[150px]" />
      <div className="animate-aurora absolute bottom-[-18%] left-[35%] h-[420px] w-[520px] rounded-full bg-emerald-500/[0.08] blur-[140px]" />
      <div className="bg-grid absolute inset-x-0 top-0 h-[560px]" />
    </div>
  );
}
