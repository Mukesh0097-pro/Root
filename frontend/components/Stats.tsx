import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  { value: '99.9%', label: 'Uptime SLA', suffix: '' },
  { value: '<50', label: 'Latency (ms)', suffix: 'ms' },
  { value: '500+', label: 'Enterprise Nodes', suffix: '' },
  { value: '10B+', label: 'Vectors Indexed', suffix: '' },
];

export const Stats: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.stat-item', {
      y: 60,
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: containerRef });

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { scale: 1.08, duration: 0.3, ease: 'power3.out' });
    gsap.to(e.currentTarget.querySelector('.stat-value'), { color: '#ccff00', duration: 0.3 });
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: 'power3.out' });
    gsap.to(e.currentTarget.querySelector('.stat-value'), { color: '#ffffff', duration: 0.3 });
  };

  return (
    <section ref={containerRef} className="py-24 bg-root-bg border-t border-white/5 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="stat-item relative group bg-root-card/40 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm hover:border-root-accent/30 transition-colors duration-300 cursor-default"
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-root-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="relative z-10">
                <div className="stat-value text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{stat.value}</div>
                <div className="text-root-muted text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
