import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface PageHeroProps {
  title: string;
  accent: string;
  subtitle: string;
}

export const PageHero: React.FC<PageHeroProps> = ({ title, accent, subtitle }) => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.page-hero-title',
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 }
    )
    .fromTo('.page-hero-accent',
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 },
      "-=0.7"
    )
    .fromTo('.page-hero-sub',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      "-=0.5"
    )
    .fromTo('.page-hero-line',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, ease: 'power2.inOut' },
      "-=0.4"
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative pt-40 pb-20 bg-root-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-root-card/50 to-transparent pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter leading-[1.05] mb-6">
            <span className="page-hero-title block text-white">{title}</span>
            <span className="page-hero-accent block text-root-accent">{accent}</span>
          </h1>
          <p className="page-hero-sub text-lg md:text-xl text-root-muted max-w-2xl leading-relaxed">
            {subtitle}
          </p>
          <div className="page-hero-line h-px w-24 bg-root-accent mt-10 origin-left" />
        </div>
      </div>
    </section>
  );
};
