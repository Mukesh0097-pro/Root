import React, { useRef } from 'react';
import { X, Check } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TRADITIONAL = [
  'Centralized data collection required',
  'Single point of failure',
  'Privacy risks from data movement',
  'Limited by data locality regulations',
  'Scaling requires more centralized storage',
];

const FEDERATED = [
  'Distributed data sovereignty',
  'Fault-tolerant architecture',
  'Privacy preserved by design',
  'Global data access without movement',
  'Scales horizontally across any node',
];

export const Comparison: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.comp-header', {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
    });

    gsap.from('.comp-diagram', {
      scale: 0.9, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '.comp-grid', start: 'top 85%' },
    });

    gsap.from('.comp-trad-item', {
      x: -30, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.comp-grid', start: 'top 80%', toggleActions: 'play none none reverse' },
    });

    gsap.from('.comp-fed-item', {
      x: 30, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.comp-grid', start: 'top 80%', toggleActions: 'play none none reverse' },
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-32 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <div className="comp-header text-root-accent text-xs font-bold tracking-widest uppercase mb-4">The Difference</div>
          <h2 className="comp-header text-4xl md:text-6xl font-medium text-white leading-[1.1] mb-6">
            Traditional RAG vs. <span className="text-root-accent">Federated RAG</span>
          </h2>
          <p className="comp-header text-lg text-root-muted leading-relaxed">
            See why federated architecture fundamentally changes how enterprises leverage AI on private data.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="comp-grid grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* Left: Traditional RAG */}
          <div className="bg-root-card/40 border border-white/10 rounded-2xl p-8 md:p-10 backdrop-blur-sm">
            {/* SVG Diagram: Centralized */}
            <div className="comp-diagram mb-8 flex justify-center">
              <svg viewBox="0 0 200 150" className="w-48 h-36" aria-label="Centralized architecture diagram">
                {/* Edge nodes */}
                {[
                  { cx: 40, cy: 30 },
                  { cx: 160, cy: 30 },
                  { cx: 30, cy: 120 },
                  { cx: 170, cy: 120 },
                  { cx: 100, cy: 20 },
                ].map((n, i) => (
                  <g key={i}>
                    <line x1={n.cx} y1={n.cy} x2={100} y2={75} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <circle cx={n.cx} cy={n.cy} r="8" fill="#0a1414" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  </g>
                ))}
                {/* Central node */}
                <circle cx="100" cy="75" r="14" fill="#0a1414" stroke="rgba(239,68,68,0.5)" strokeWidth="2" />
                <text x="100" y="110" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">CENTRAL</text>
              </svg>
            </div>

            <h3 className="text-2xl font-medium text-white mb-2">Traditional RAG</h3>
            <p className="text-root-muted text-sm mb-6">All data flows to a single centralized store.</p>

            <div className="space-y-0">
              {TRADITIONAL.map((item, i) => (
                <div key={i} className="comp-trad-item flex items-center gap-3 py-3.5 border-b border-white/5 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-red-400/10 flex items-center justify-center flex-shrink-0">
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <span className="text-root-muted text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Federated RAG */}
          <div className="bg-root-card/40 border border-root-accent/20 rounded-2xl p-8 md:p-10 backdrop-blur-sm relative overflow-hidden">
            {/* Subtle accent glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-root-accent/5 blur-3xl rounded-full pointer-events-none" />

            {/* SVG Diagram: Distributed */}
            <div className="comp-diagram mb-8 flex justify-center relative z-10">
              <svg viewBox="0 0 200 150" className="w-48 h-36" aria-label="Distributed architecture diagram">
                {/* Mesh connections */}
                {[
                  [40, 35, 100, 25],
                  [100, 25, 160, 35],
                  [40, 35, 60, 110],
                  [160, 35, 140, 110],
                  [60, 110, 140, 110],
                  [40, 35, 140, 110],
                  [160, 35, 60, 110],
                  [100, 25, 60, 110],
                  [100, 25, 140, 110],
                ].map(([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(204,255,0,0.15)" strokeWidth="1" />
                ))}
                {/* Distributed nodes */}
                {[
                  { cx: 40, cy: 35 },
                  { cx: 100, cy: 25 },
                  { cx: 160, cy: 35 },
                  { cx: 60, cy: 110 },
                  { cx: 140, cy: 110 },
                ].map((n, i) => (
                  <circle key={i} cx={n.cx} cy={n.cy} r="10" fill="#0a1414" stroke="rgba(204,255,0,0.5)" strokeWidth="1.5" />
                ))}
                <text x="100" y="140" textAnchor="middle" fill="rgba(204,255,0,0.5)" fontSize="8" fontFamily="monospace">FEDERATED</text>
              </svg>
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl font-medium text-root-accent mb-2">
                Federated RAG <span className="text-white text-lg font-normal">(Root)</span>
              </h3>
              <p className="text-root-muted text-sm mb-6">Data stays distributed. Intelligence flows freely.</p>

              <div className="space-y-0">
                {FEDERATED.map((item, i) => (
                  <div key={i} className="comp-fed-item flex items-center gap-3 py-3.5 border-b border-white/5 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-root-accent/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-root-accent" />
                    </div>
                    <span className="text-white text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
