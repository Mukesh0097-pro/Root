import React, { useRef } from 'react';
import { ArrowRight, Mail, MapPin } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- Mission ---
export const Mission: React.FC = () => {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.mission-text', {
      y: 50, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 80%' },
    });
  }, { scope: ref });

  return (
    <section ref={ref} className="py-32 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mission-text text-root-accent text-xs font-bold tracking-widest uppercase mb-6">Our Mission</div>
        <h2 className="mission-text text-3xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.15] mb-8">
          We believe the future of AI is <span className="text-root-accent">federated</span> — where intelligence flows freely but data stays sovereign.
        </h2>
        <p className="mission-text text-lg text-root-muted leading-relaxed max-w-3xl">
          Root was founded on a simple principle: organizations shouldn't have to choose between leveraging AI and protecting their data. We're building the infrastructure that makes both possible.
        </p>
      </div>
    </section>
  );
};

// --- Team ---
const TEAM = [
  { name: 'Alex Chen', role: 'CEO & Co-Founder', bio: 'Previously led distributed systems at a major cloud provider. PhD in federated optimization.' },
  { name: 'Maya Patel', role: 'CTO & Co-Founder', bio: 'Former ML research lead. Published 30+ papers on privacy-preserving machine learning.' },
  { name: 'James Park', role: 'Head of Engineering', bio: 'Built infrastructure at scale for 100M+ users. Expert in low-latency distributed systems.' },
  { name: 'Sarah Kim', role: 'Head of Research', bio: 'Pioneered homomorphic encryption for neural networks. Former academic at a leading university.' },
  { name: 'David Okafor', role: 'Head of Product', bio: 'Shipped enterprise AI products to Fortune 500 companies. Data sovereignty advocate.' },
  { name: 'Lisa Zhang', role: 'Head of Compliance', bio: 'Former regulator turned builder. Certified across GDPR, HIPAA, and SOC2 frameworks.' },
];

export const Team: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.team-header', {
      y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 85%' },
    });
    gsap.from('.team-card', {
      y: 50, opacity: 0, scale: 0.97, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: containerRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
    });
  }, { scope: containerRef });

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { y: -6, duration: 0.35, ease: 'power3.out' });
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { y: 0, duration: 0.35, ease: 'power3.out' });
  };

  return (
    <section ref={containerRef} className="py-24 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="team-header mb-16">
          <h2 className="text-4xl md:text-6xl font-medium text-white mb-4">The Team</h2>
          <p className="text-lg text-root-muted max-w-2xl">Engineers, researchers, and builders obsessed with privacy-preserving intelligence.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM.map((member, i) => (
            <div
              key={i}
              className="team-card group bg-root-card/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-root-accent/30 transition-colors duration-300"
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
            >
              <div className="w-12 h-12 rounded-full bg-root-accent/10 border border-root-accent/20 flex items-center justify-center text-root-accent font-bold text-lg mb-5">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 className="text-xl font-medium text-white mb-1 group-hover:text-root-accent transition-colors duration-300">{member.name}</h3>
              <div className="text-root-accent text-xs font-bold tracking-wider uppercase mb-4">{member.role}</div>
              <p className="text-root-muted text-sm leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Contact ---
export const Contact: React.FC = () => {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.contact-el', {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 80%' },
    });
  }, { scope: ref });

  return (
    <section ref={ref} className="py-24 bg-root-bg border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: Info */}
          <div>
            <h2 className="contact-el text-4xl md:text-6xl font-medium text-white mb-6">Get in Touch</h2>
            <p className="contact-el text-lg text-root-muted leading-relaxed mb-10">
              Ready to explore federated intelligence for your organization? We'd love to hear from you.
            </p>
            <div className="space-y-6">
              <div className="contact-el flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-root-card border border-white/10 flex items-center justify-center text-root-accent">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-white font-mono text-sm">hello@rootsystems.ai</span>
              </div>
              <div className="contact-el flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-root-card border border-white/10 flex items-center justify-center text-root-accent">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-white font-mono text-sm">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="contact-el bg-root-card/40 border border-white/10 rounded-2xl p-8 md:p-10 backdrop-blur-sm">
            <div className="space-y-5">
              <div>
                <label htmlFor="company-contact-name" className="text-xs text-root-muted font-bold tracking-wider uppercase block mb-2">Name</label>
                <input
                  id="company-contact-name"
                  type="text"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="company-contact-email" className="text-xs text-root-muted font-bold tracking-wider uppercase block mb-2">Email</label>
                <input
                  id="company-contact-email"
                  type="email"
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="company-contact-message" className="text-xs text-root-muted font-bold tracking-wider uppercase block mb-2">Message</label>
                <textarea
                  id="company-contact-message"
                  rows={4}
                  className="w-full bg-root-bg border border-white/10 rounded-lg px-5 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-root-accent/50 transition-colors font-mono text-sm resize-none"
                  placeholder="Tell us about your use case..."
                />
              </div>
              <button className="w-full bg-root-accent hover:bg-white text-root-bg font-bold py-4 rounded-lg uppercase tracking-wider text-sm transition-colors duration-300 flex items-center justify-center gap-2 group">
                Send Message
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
