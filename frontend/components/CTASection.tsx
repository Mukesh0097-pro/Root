import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const CTASection: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    tl.from('.cta-bg-line', {
      scaleX: 0,
      duration: 1,
      ease: 'power2.inOut',
    })
      .from('.cta-content', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
      }, '-=0.5');
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-32 bg-root-bg border-t border-white/5 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="cta-bg-line absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-root-accent/30 to-transparent origin-left" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-root-accent/3 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="cta-content text-root-accent text-xs font-bold tracking-widest uppercase mb-6">Ready to Start?</div>
          <h2 className="cta-content text-4xl md:text-6xl lg:text-7xl font-medium text-white leading-[1.1] mb-6">
            Build the future of <br /><span className="text-root-accent">private AI</span> today.
          </h2>
          <p className="cta-content text-lg text-root-muted leading-relaxed mb-10 max-w-2xl mx-auto">
            Join hundreds of organizations already using Root to deploy federated RAG pipelines across their distributed data infrastructure.
          </p>
          <div className="cta-content flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="bg-root-accent hover:bg-white text-root-bg font-bold px-10 py-4 rounded-lg uppercase tracking-wider text-sm transition-colors duration-300 flex items-center gap-2 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/platform"
              className="border border-white/20 hover:border-root-accent/50 text-white font-bold px-10 py-4 rounded-lg uppercase tracking-wider text-sm transition-colors duration-300"
            >
              View Platform
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
