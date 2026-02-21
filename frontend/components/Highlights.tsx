import React, { useRef } from 'react';
import { Shield, Zap, Globe, Lock, Server, Brain } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HIGHLIGHTS = [
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'End-to-end encryption, zero-trust architecture, and hardware-backed key management for every query.',
  },
  {
    icon: Zap,
    title: 'Blazing Performance',
    description: 'Sub-50ms retrieval latency across globally distributed nodes with intelligent caching and prefetching.',
  },
  {
    icon: Globe,
    title: 'Global Federation',
    description: 'Connect data sources across regions and jurisdictions while respecting local data residency laws.',
  },
  {
    icon: Lock,
    title: 'Data Sovereignty',
    description: 'Your data never leaves your infrastructure. Federated learning ensures models come to the data, not vice versa.',
  },
  {
    icon: Server,
    title: 'Hybrid Deployment',
    description: 'Deploy on any cloud, on-premises, or edge environment. Full Kubernetes-native orchestration included.',
  },
  {
    icon: Brain,
    title: 'Adaptive Intelligence',
    description: 'Self-optimizing query planning that learns from access patterns and continuously improves retrieval quality.',
  },
];

export const Highlights: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.hl-header', {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
    });

    gsap.from('.hl-card', {
      y: 60,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.hl-grid',
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: containerRef });

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    gsap.to(card, { y: -6, duration: 0.35, ease: 'power3.out' });
    gsap.to(card.querySelector('.hl-icon-bg'), {
      scale: 1.15,
      backgroundColor: 'rgba(204, 255, 0, 0.2)',
      duration: 0.35,
      ease: 'power3.out',
    });
  };

  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    gsap.to(card, { y: 0, duration: 0.35, ease: 'power3.out' });
    gsap.to(card.querySelector('.hl-icon-bg'), {
      scale: 1,
      backgroundColor: 'rgba(204, 255, 0, 0.1)',
      duration: 0.35,
      ease: 'power3.out',
    });
  };

  return (
    <section ref={containerRef} className="py-32 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <div className="hl-header text-root-accent text-xs font-bold tracking-widest uppercase mb-4">Why Root</div>
          <h2 className="hl-header text-4xl md:text-6xl font-medium text-white leading-[1.1] mb-6">
            Built for teams that <span className="text-root-accent">refuse to compromise</span>
          </h2>
          <p className="hl-header text-lg text-root-muted leading-relaxed">
            Every component designed from the ground up for security, performance, and scale.
          </p>
        </div>

        {/* Grid */}
        <div className="hl-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {HIGHLIGHTS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="hl-card group bg-root-card/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-root-accent/30 transition-colors duration-300 cursor-default"
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
              >
                <div className="hl-icon-bg w-12 h-12 rounded-xl bg-root-accent/10 border border-root-accent/20 flex items-center justify-center text-root-accent mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2 group-hover:text-root-accent transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-root-muted text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
