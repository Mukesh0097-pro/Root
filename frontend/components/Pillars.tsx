import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    title: "Operate securely",
    description: "We operate on a zero-trust architecture. Your data never leaves your premises. The model travels to the data, learns, and returns only the insights."
  },
  {
    title: "Built to scale",
    description: "Whether you have 5 nodes or 50,000 edge devices, Root's orchestration layer manages the complexity of distributed training and retrieval automatically."
  },
  {
    title: "Accelerated RAG",
    description: "Traditional RAG is slow and insecure over public networks. We've built a dedicated protocol for low-latency vector retrieval across distributed indices."
  }
];

export const Pillars: React.FC = () => {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Staggered Entry Animation
    gsap.from(".pillar-card", {
      y: 80,
      opacity: 0,
      scale: 0.96,
      filter: "blur(6px)",
      duration: 1,
      stagger: 0.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: container.current,
        start: "top 85%",
        toggleActions: "play none none reverse"
      }
    });
  }, { scope: container });

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      y: -12,
      scale: 1.02,
      boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
      duration: 0.45,
      ease: "power3.out"
    });
  };

  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      boxShadow: "0 0 0 rgba(0,0,0,0)",
      duration: 0.45,
      ease: "power3.out"
    });
  };

  return (
    <section ref={container} id="research" className="py-24 bg-root-bg border-t border-white/10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
        {PILLARS.map((pillar, index) => (
          <div
            key={index}
            className="pillar-card flex flex-col gap-6 group cursor-default bg-root-card/40 border border-white/10 rounded-2xl p-8 md:p-10 backdrop-blur-sm transition-colors duration-500"
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
          >
            <h3 className="text-3xl font-medium text-white/90 group-hover:text-root-accent transition-colors duration-300">
              {pillar.title}
            </h3>
            <p className="text-root-muted leading-relaxed text-lg">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};