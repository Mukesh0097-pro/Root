import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Hospital, Landmark, Shield, Factory } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const USE_CASES = [
  {
    icon: <Hospital className="w-8 h-8" />,
    title: 'Healthcare',
    description: 'Train models across hospital networks without transferring patient data. HIPAA-compliant federated retrieval across distributed EHR systems.',
    stats: 'HIPAA Certified',
  },
  {
    icon: <Landmark className="w-8 h-8" />,
    title: 'Financial Services',
    description: 'Enable cross-institutional fraud detection and risk modeling while maintaining strict data sovereignty requirements.',
    stats: 'SOC2 Type II',
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Government',
    description: 'Classified data stays classified. Federated intelligence across agencies with zero-trust attestation at every node.',
    stats: 'FedRAMP Ready',
  },
  {
    icon: <Factory className="w-8 h-8" />,
    title: 'Manufacturing',
    description: 'Predictive maintenance across distributed factories. Local sensor data trains global models without leaving the edge.',
    stats: 'Edge Optimized',
  },
];

export const UseCases: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.usecase-card', {
      y: 60,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    gsap.from('.usecase-header', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
      },
    });
  }, { scope: containerRef });

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { y: -8, duration: 0.4, ease: 'power3.out' });
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { y: 0, duration: 0.4, ease: 'power3.out' });
  };

  return (
    <section ref={containerRef} className="py-24 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="usecase-header mb-16">
          <h2 className="text-4xl md:text-6xl font-medium text-white mb-4">Industry Solutions</h2>
          <p className="text-lg text-root-muted max-w-2xl">Purpose-built for regulated industries where data privacy isn't optional.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {USE_CASES.map((uc, i) => (
            <div
              key={i}
              className="usecase-card group bg-root-card/40 border border-white/10 rounded-2xl p-8 md:p-10 backdrop-blur-sm hover:border-root-accent/30 transition-colors duration-300"
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="text-root-accent">{uc.icon}</div>
                <span className="text-xs font-mono text-root-accent tracking-wider uppercase bg-root-accent/10 px-3 py-1 rounded-full">{uc.stats}</span>
              </div>
              <h3 className="text-2xl font-medium text-white mb-3 group-hover:text-root-accent transition-colors duration-300">{uc.title}</h3>
              <p className="text-root-muted leading-relaxed">{uc.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const SolutionsCTA: React.FC = () => {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.sol-cta', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 80%' },
    });
  }, { scope: ref });

  return (
    <section ref={ref} className="py-32 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6 text-center max-w-3xl">
        <h2 className="sol-cta text-4xl md:text-5xl font-medium text-white mb-6">Ready to federate?</h2>
        <p className="sol-cta text-lg text-root-muted mb-10 leading-relaxed">
          Start building on Root's infrastructure today. Zero data movement. Full intelligence.
        </p>
        <Link to="/contact" className="sol-cta inline-flex items-center gap-3 bg-root-accent text-root-bg px-10 py-4 rounded-full font-bold tracking-wider hover:bg-white transition-colors duration-300 group">
          GET STARTED
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
};
