import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PREVIEWS = [
  {
    label: 'SOLUTIONS',
    href: '/solutions',
    title: 'Enterprise AI Solutions',
    description: 'Federated AI for regulated industries. Break down data silos without compromising privacy.',
    gradient: 'from-purple-500/20 to-transparent',
  },
  {
    label: 'PLATFORM',
    href: '/platform',
    title: 'Core Platform',
    description: 'Federated Vector Store, Privacy-Preserving LLM, and Compliance Engine in one stack.',
    gradient: 'from-indigo-500/20 to-transparent',
  },
  {
    label: 'AI RESEARCH',
    href: '/research',
    title: 'Research & Papers',
    description: 'Advancing the frontier of federated learning, secure computation, and distributed RAG.',
    gradient: 'from-teal-500/20 to-transparent',
  },
  {
    label: 'COMPANY',
    href: '/company',
    title: 'About Root',
    description: 'Meet the team building the next generation of privacy-preserving intelligence infrastructure.',
    gradient: 'from-root-accent/10 to-transparent',
  },
];

export const HomePreview: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.preview-card', {
      y: 80,
      opacity: 0,
      scale: 0.96,
      duration: 0.9,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: containerRef });

  const onHover = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      y: -8,
      scale: 1.02,
      duration: 0.4,
      ease: 'power3.out',
    });
  };

  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: 'power3.out',
    });
  };

  return (
    <section ref={containerRef} className="py-24 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PREVIEWS.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="preview-card group block"
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
            >
              <div className={`relative bg-root-card/60 border border-white/10 rounded-2xl p-8 md:p-10 backdrop-blur-sm overflow-hidden transition-colors duration-300 hover:border-root-accent/30 h-full`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <span className="text-root-accent text-xs font-bold tracking-widest uppercase">{item.label}</span>
                  <h3 className="text-2xl md:text-3xl font-medium text-white mt-3 mb-4 group-hover:text-root-accent transition-colors duration-300">{item.title}</h3>
                  <p className="text-root-muted leading-relaxed mb-6">{item.description}</p>
                  <div className="flex items-center gap-2 text-root-accent text-sm font-bold tracking-wider uppercase">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
