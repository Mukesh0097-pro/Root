import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SPECS = [
  { value: '<5ms', label: 'Query Latency', detail: 'P99 across federated nodes' },
  { value: '50K+', label: 'Edge Devices', detail: 'Simultaneous orchestration' },
  { value: '99.99%', label: 'Uptime SLA', detail: 'Enterprise-grade reliability' },
  { value: 'Zero', label: 'Data Movement', detail: 'Models travel, not data' },
  { value: '256-bit', label: 'Encryption', detail: 'End-to-end at rest & transit' },
  { value: '3', label: 'Compliance Frameworks', detail: 'GDPR, HIPAA, SOC2 built-in' },
];

export const TechSpecs: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.spec-header', {
      y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
    });

    gsap.from('.spec-card', {
      y: 50, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="spec-header mb-16">
          <h2 className="text-4xl md:text-6xl font-medium text-white mb-4">Technical Specifications</h2>
          <p className="text-lg text-root-muted max-w-2xl">Built for performance at scale. Every metric matters.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECS.map((spec, i) => (
            <div key={i} className="spec-card bg-root-card/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm group hover:border-root-accent/30 transition-colors duration-300">
              <div className="text-root-accent text-4xl md:text-5xl font-bold tracking-tight mb-3">{spec.value}</div>
              <div className="text-white font-medium text-lg mb-1">{spec.label}</div>
              <div className="text-root-muted text-sm">{spec.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
