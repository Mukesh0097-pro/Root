import React, { useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsMobile } from '../hooks/useAnimations';

gsap.registerPlugin(ScrollTrigger);

const CAPABILITIES = [
  {
    image: '/images/Gemini_Generated_Image_qsli01qsli01qsli.png',
    label: 'FEDERATED LEARNING',
    title: 'Train Without Moving Data',
    description: 'Distribute model training across nodes while keeping sensitive data local. No data leaves your infrastructure.',
    gradient: 'from-cyan-500/30 via-transparent to-transparent',
  },
  {
    image: '/images/Gemini_Generated_Image_cgdre2cgdre2cgdr.png',
    label: 'VECTOR SEARCH',
    title: 'Distributed Vector Store',
    description: 'Query across federated embeddings in real-time. Sub-100ms retrieval from billions of vectors across nodes.',
    gradient: 'from-purple-500/30 via-transparent to-transparent',
  },
  {
    image: '/images/Gemini_Generated_Image_vgqrckvgqrckvgqr.png',
    label: 'PRIVACY ENGINE',
    title: 'Zero-Knowledge Inference',
    description: 'Perform LLM inference without exposing input data. Cryptographic guarantees for every query.',
    gradient: 'from-root-accent/20 via-transparent to-transparent',
  },
  {
    image: '/images/Gemini_Generated_Image_2y1cek2y1cek2y1c.png',
    label: 'COMPLIANCE',
    title: 'Built-In Regulatory Layer',
    description: 'GDPR, HIPAA, SOC2 compliance baked into the core. Automated audit trails and data governance.',
    gradient: 'from-blue-500/30 via-transparent to-transparent',
  },
  {
    image: '/images/Gemini_Generated_Image_xfjbgkxfjbgkxfjb.png',
    label: 'ORCHESTRATION',
    title: 'Intelligent Node Routing',
    description: 'Smart query routing across federated nodes. Automatic load balancing and failover for mission-critical AI.',
    gradient: 'from-orange-500/30 via-transparent to-transparent',
  },
  {
    image: '/images/Gemini_Generated_Image_lfrdillfrdillfrd.png',
    label: 'DEPLOYMENT',
    title: 'One-Click Edge Deploy',
    description: 'Deploy federated RAG pipelines to any cloud, on-prem, or edge environment. Full infrastructure as code.',
    gradient: 'from-emerald-500/30 via-transparent to-transparent',
  },
];

export const ImageCards: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isMobile = useIsMobile();

  useGSAP(() => {
    gsap.from('.cap-header', {
      y: 50, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
    });

    gsap.from('.cap-card', {
      y: 100,
      opacity: 0,
      scale: 0.9,
      rotateX: 8,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: containerRef });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (isMobile) return;
    const card = cardsRef.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    gsap.to(card, {
      rotateX,
      rotateY,
      scale: 1.03,
      duration: 0.4,
      ease: 'power2.out',
      transformPerspective: 800,
    });

    // Move the shine layer
    const shine = card.querySelector('.card-shine') as HTMLElement;
    if (shine) {
      gsap.to(shine, {
        background: `radial-gradient(circle at ${x}px ${y}px, rgba(204,255,0,0.12) 0%, transparent 60%)`,
        duration: 0.3,
      });
    }
  }, [isMobile]);

  const handleMouseLeave = useCallback((index: number) => {
    if (isMobile) return;
    const card = cardsRef.current[index];
    if (!card) return;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 0.5,
      ease: 'power3.out',
    });
    const shine = card.querySelector('.card-shine') as HTMLElement;
    if (shine) {
      gsap.to(shine, { background: 'transparent', duration: 0.5 });
    }
  }, [isMobile]);

  return (
    <section ref={containerRef} className="py-32 bg-root-bg border-t border-white/5" style={{ perspective: '1200px' }}>
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="mb-20 max-w-3xl">
          <div className="cap-header text-root-accent text-xs font-bold tracking-widest uppercase mb-4">Capabilities</div>
          <h2 className="cap-header text-4xl md:text-6xl font-medium text-white leading-[1.1] mb-6">
            Everything you need for <span className="text-root-accent">federated AI</span>
          </h2>
          <p className="cap-header text-lg text-root-muted leading-relaxed">
            A complete platform for building, deploying, and scaling privacy-preserving AI applications across distributed data sources.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CAPABILITIES.map((item, i) => (
            <div
              key={i}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="cap-card group relative bg-root-card/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-root-accent/30 transition-colors duration-300 cursor-pointer"
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => handleMouseLeave(i)}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Shine overlay */}
              <div className="card-shine absolute inset-0 z-10 pointer-events-none rounded-2xl" />

              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0`} />

              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-root-card/90 via-root-card/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-7">
                <span className="text-root-accent text-xs font-bold tracking-widest uppercase">{item.label}</span>
                <h3 className="text-xl font-medium text-white mt-2 mb-3 group-hover:text-root-accent transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-root-muted text-sm leading-relaxed mb-5">{item.description}</p>
                <div className="flex items-center gap-2 text-root-accent text-xs font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                  <span>Learn More</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
